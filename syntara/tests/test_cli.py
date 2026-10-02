import io
import json
import os
import shlex
import socket
import sys
import tempfile
import unittest
from contextlib import redirect_stderr, redirect_stdout
from pathlib import Path

from syntara.cli import main
from syntara.tests.mock_gateway import start_gateway


def run(argv):
    out, err = io.StringIO(), io.StringIO()
    with redirect_stdout(out), redirect_stderr(err):
        code = main(["--base-url", _BASE + "/v1", "--data-dir", _DATA] + argv)
    return code, out.getvalue(), err.getvalue()


_BASE = ""
_DATA = ""


class CliTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        global _BASE
        cls.httpd, _BASE = start_gateway()

    @classmethod
    def tearDownClass(cls):
        cls.httpd.shutdown()
        cls.httpd.server_close()

    def setUp(self):
        global _DATA
        self._td = tempfile.TemporaryDirectory()
        _DATA = str(Path(self._td.name) / "data")

    def tearDown(self):
        self._td.cleanup()

    def test_models_list(self):
        code, out, _ = run(["models", "list"])
        self.assertEqual(code, 0)
        self.assertIn("mock-model", out)

    def test_models_list_json(self):
        code, out, _ = run(["models", "list", "--json"])
        self.assertEqual(code, 0)
        self.assertEqual(json.loads(out)[0]["id"], "mock-model")

    def test_models_get(self):
        code, out, _ = run(["models", "get", "mock-model"])
        self.assertEqual(code, 0)
        self.assertIn("mock-model", out)

    def test_models_get_missing_exits_one(self):
        code, _, err = run(["models", "get", "nope"])
        self.assertEqual(code, 1)
        self.assertIn("model_not_found", err)

    def test_models_search(self):
        code, out, _ = run(["models", "search", "mock"])
        self.assertEqual(code, 0)
        self.assertIn("mock-model", out)
        code, out, _ = run(["models", "search", "qwen"])
        self.assertEqual(code, 0)
        self.assertNotIn("mock-model", out)

    def test_models_run(self):
        code, out, _ = run(["models", "run", "mock-model"])
        self.assertEqual(code, 0)
        self.assertIn("ready", out)

    def test_unsupported_model_verbs_exit_two(self):
        old = os.environ.pop("SYNTARA_ENGINE", None)
        try:
            for verb in ("install", "remove", "benchmark", "optimize"):
                code, _, err = run(["models", verb, "mock-model"])
                self.assertEqual(code, 2, verb)
                self.assertTrue(err.strip(), verb)
        finally:
            if old is not None:
                os.environ["SYNTARA_ENGINE"] = old

    def test_models_engine_delegation(self):
        old = os.environ.get("SYNTARA_ENGINE")
        code_lines = ("import sys;print('ENGINE-DELEGATED',*sys.argv[1:]);sys.exit(3)")
        os.environ["SYNTARA_ENGINE"] = (
            f"{shlex.quote(sys.executable)} -c {shlex.quote(code_lines)}")
        try:
            code, out, _ = run(["models", "install", "qwen"])
            self.assertEqual(code, 3)
            self.assertIn("ENGINE-DELEGATED install qwen", out)
            code, out, _ = run(["models", "remove", "some-model"])
            self.assertEqual(code, 3)
            self.assertIn("ENGINE-DELEGATED remove some-model", out)
            code, out, _ = run(["models", "benchmark"])
            self.assertEqual(code, 3)
            self.assertIn("ENGINE-DELEGATED bench", out)
            code, out, _ = run(["models", "optimize"])
            self.assertEqual(code, 3)
            self.assertIn("ENGINE-DELEGATED tune", out)
        finally:
            if old is None:
                os.environ.pop("SYNTARA_ENGINE", None)
            else:
                os.environ["SYNTARA_ENGINE"] = old

    def test_chat_one_shot(self):
        code, out, _ = run(["chat", "hello"])
        self.assertEqual(code, 0)
        self.assertEqual(out.strip(), "answer:hello")

    def test_chat_no_stream(self):
        code, out, _ = run(["chat", "--no-stream", "hello"])
        self.assertEqual(code, 0)
        self.assertEqual(out.strip(), "answer:hello")

    def test_health_json(self):
        code, out, _ = run(["health", "--json"])
        self.assertEqual(code, 0)
        self.assertEqual(json.loads(out)["status"], "ready")

    def test_profile(self):
        code, out, _ = run(["profile"])
        self.assertEqual(code, 0)
        self.assertIn("turns: 1", out)

    def test_serve(self):
        code, out, _ = run(["serve", "--json"])
        self.assertEqual(code, 0)
        self.assertEqual(json.loads(out)["root_url"], _BASE)

    def test_agents_run(self):
        code, out, _ = run(["agents", "run", "plain task here", "--json"])
        self.assertEqual(code, 0)
        self.assertTrue(json.loads(out)["content"].startswith("answer:"))

    def test_chat_missing_model_defaults_to_served_model(self):
        code, out, _ = run(["chat", "hi"])
        self.assertEqual(code, 0)
        self.assertEqual(out.strip(), "answer:hi")

    def test_project_lifecycle(self):
        code, _, _ = run(["project", "create", "demo", "--description", "desc"])
        self.assertEqual(code, 0)
        code, out, _ = run(["project", "list"])
        self.assertEqual(code, 0)
        self.assertIn("demo", out)
        code, out, _ = run(["project", "list", "--json"])
        self.assertEqual(code, 0)
        projects = json.loads(out)
        demo = [p for p in projects if p["name"] == "demo"][0]
        self.assertEqual(demo["description"], "desc")
        project_id = demo["id"]
        code, out, _ = run(["project", "get", project_id])
        self.assertEqual(code, 0)
        self.assertIn("demo", out)
        code, _, _ = run(["project", "delete", project_id])
        self.assertEqual(code, 0)
        code, out, _ = run(["project", "list"])
        self.assertEqual(code, 0)
        self.assertNotIn("demo", out)

    def test_backup_cli_roundtrip(self):
        code, _, _ = run(["project", "create", "bkproj"])
        self.assertEqual(code, 0)
        backup_out = Path(tempfile.mkdtemp()) / "manual"
        code, out, _ = run(["backup", "create", "--out", str(backup_out)])
        self.assertEqual(code, 0)
        archive = Path(out.strip())
        self.assertTrue(archive.is_file())
        code, out, _ = run(["backup", "verify", str(archive), "--json"])
        self.assertEqual(code, 0)
        self.assertIn('"ok": true', out)
        code, out, _ = run(["backup", "restore", str(archive), "--json"])
        self.assertEqual(code, 0)
        self.assertIn('"restored"', out)

    def test_connection_refused_exits_one(self):
        sink = socket.socket()
        sink.bind(("127.0.0.1", 0))
        port = sink.getsockname()[1]
        sink.close()
        out, err = io.StringIO(), io.StringIO()
        code = None
        with redirect_stdout(out), redirect_stderr(err):
            code = main(["--base-url", f"http://127.0.0.1:{port}/v1", "health"])
        self.assertEqual(code, 1)
        self.assertIn("Unable to reach", err.getvalue())


if __name__ == "__main__":
    unittest.main()