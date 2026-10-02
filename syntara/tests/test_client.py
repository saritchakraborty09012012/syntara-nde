import os
import socket
import tempfile
import unittest

from syntara import Syntara, SyntaraError
from syntara.tests.mock_gateway import start_gateway


class ClientTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.httpd, cls.base = start_gateway()

    @classmethod
    def tearDownClass(cls):
        cls.httpd.shutdown()
        cls.httpd.server_close()

    def setUp(self):
        self.client = Syntara(self.base + "/v1")

    def test_chat_non_stream(self):
        self.assertEqual(self.client.chat("mock-model", "hello"), "answer:hello")

    def test_chat_with_system(self):
        self.assertEqual(self.client.chat("mock-model", "hi", system="be brief"),
                         "answer:hi")

    def test_stream_chat_collects_text_and_usage(self):
        deltas = []
        usage = None
        finish = None
        for frame in self.client.stream_chat("mock-model", "hello"):
            if frame["delta"]:
                deltas.append(frame["delta"])
            if frame["finish_reason"]:
                finish = frame["finish_reason"]
            if frame["usage"]:
                usage = frame["usage"]
        self.assertEqual("".join(deltas), "answer:hello")
        self.assertEqual(finish, "stop")
        self.assertEqual(usage["total_tokens"], 9)

    def test_models_list_and_ids(self):
        self.assertEqual(self.client.list_models(), ["mock-model"])
        self.assertEqual([m["id"] for m in self.client.models.list()], ["mock-model"])

    def test_models_get(self):
        model = self.client.models.get("mock-model")
        self.assertEqual(model["id"], "mock-model")

    def test_models_get_missing_raises_structured_error(self):
        with self.assertRaises(SyntaraError) as ctx:
            self.client.models.get("nope")
        self.assertEqual(ctx.exception.status, 404)
        self.assertEqual(ctx.exception.code, "model_not_found")

    def test_health_profile_experts(self):
        self.assertEqual(self.client.health()["status"], "ready")
        self.assertEqual(self.client.health()["scheduler"]["admitted"], 3)
        self.assertEqual(self.client.profile()["seq"], 2)
        self.assertEqual(self.client.experts()["rows"], 1)

    def test_stop_reports_cancellation_honestly(self):
        self.assertEqual(self.client.stop(),
                         {"cancelled": False, "active": 0, "queued": 0})

    def test_brio(self):
        result = self.client.brio("mock-model", "pick one", ["a", "b"])
        self.assertEqual(result["answer"], "a")
        self.assertEqual(len(result["choices"]), 2)

    def test_complete_and_messages(self):
        self.assertEqual(self.client.complete("mock-model", "once upon"), "completion-ok")
        self.assertEqual(self.client.messages("mock-model",
                                              [{"role": "user", "content": "hi"}])["role"],
                         "assistant")

    def test_default_model(self):
        old = os.environ.pop("SYNTARA_MODEL", None)
        try:
            self.assertEqual(self.client.default_model(), "mock-model")
        finally:
            if old is not None:
                os.environ["SYNTARA_MODEL"] = old

    def test_default_model_honors_env(self):
        old = os.environ.get("SYNTARA_MODEL")
        os.environ["SYNTARA_MODEL"] = "env-model"
        try:
            self.assertEqual(self.client.default_model(), "env-model")
        finally:
            if old is None:
                os.environ.pop("SYNTARA_MODEL", None)
            else:
                os.environ["SYNTARA_MODEL"] = old

    def test_connection_refused(self):
        sink = socket.socket()
        sink.bind(("127.0.0.1", 0))
        port = sink.getsockname()[1]
        sink.close()
        client = Syntara(f"http://127.0.0.1:{port}/v1")
        with self.assertRaises(SyntaraError):
            client.health()

    def test_struct_error_from_missing_model_stream(self):
        with self.assertRaises(SyntaraError) as ctx:
            list(self.client.stream_chat("nope", "hi"))
        self.assertEqual(ctx.exception.status, 404)
        self.assertEqual(ctx.exception.code, "model_not_found")

    def test_defaults_honor_env_vars(self):
        old_base = os.environ.get("SYNTARA_BASE_URL")
        old_key = os.environ.get("SYNTARA_API_KEY")
        os.environ["SYNTARA_BASE_URL"] = self.base + "/v1"
        os.environ["SYNTARA_API_KEY"] = "env-secret"
        try:
            client = Syntara()
            self.assertEqual(client.base_url, self.base + "/v1")
            self.assertEqual(client.api_key, "env-secret")
            self.assertEqual(client.chat("mock-model", "hello"), "answer:hello")
        finally:
            for name, old in (("SYNTARA_BASE_URL", old_base),
                              ("SYNTARA_API_KEY", old_key)):
                if old is not None:
                    os.environ[name] = old
                else:
                    os.environ.pop(name, None)

    def test_explicit_args_beat_env_vars(self):
        old_base = os.environ.get("SYNTARA_BASE_URL")
        old_key = os.environ.get("SYNTARA_API_KEY")
        os.environ["SYNTARA_BASE_URL"] = "http://127.0.0.1:1/v1"
        os.environ["SYNTARA_API_KEY"] = "wrong-key"
        try:
            client = Syntara(self.base + "/v1", api_key="")
            self.assertEqual(client.base_url, self.base + "/v1")
            self.assertEqual(client.api_key, "")
        finally:
            for name, old in (("SYNTARA_BASE_URL", old_base),
                              ("SYNTARA_API_KEY", old_key)):
                if old is not None:
                    os.environ[name] = old
                else:
                    os.environ.pop(name, None)

    def test_memories_lifecycle(self):
        with tempfile.TemporaryDirectory() as tmp:
            client = Syntara(self.base + "/v1", data_dir=tmp)
            self.assertEqual(client.memories.list(), [])
            memory = client.memories.add("remember this")
            self.assertTrue(memory["id"].startswith("m_"))
            self.assertEqual(client.memories.get(memory["id"])["text"], "remember this")
            updated = client.memories.update(memory["id"], "remember that instead")
            self.assertEqual(updated["text"], "remember that instead")
            self.assertEqual(client.memories.get(memory["id"])["text"], "remember that instead")
            self.assertIsNone(client.memories.update("does-not-exist", "x"))
            self.assertIsNone(client.memories.get("does-not-exist"))
            with self.assertRaises(ValueError):
                client.memories.add("   ")
            self.assertTrue(client.memories.delete(memory["id"]))
            self.assertEqual(client.memories.list(), [])


if __name__ == "__main__":
    unittest.main()