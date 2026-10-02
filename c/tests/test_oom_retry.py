"""OOM-class retry: ONE strictly lighter plan after an OOM-class load death (1h).

The launcher classifies a dead engine (exit code + stderr text), halves the
cap (cache slots/layer) and/or the family context env (floor 512), and retries
EXACTLY once. A defective checkpoint vetoes the retry -- a lighter plan cannot
fix a truncated file -- and any death that is not classified OOM keeps the
original single-attempt path with its original error.

Three call sites are covered:
  * the GLM direct-engine chat path (integration, real cmd_chat child),
  * the non-glm chat path (openai_server subprocess, mocked spawn),
  * `syntara serve` (mocked openai_server.serve raising EngineExit).
"""
import importlib.util
import io
import json
import os
import subprocess
import sys
import tempfile
import textwrap
import unittest
from importlib.machinery import SourceFileLoader
from pathlib import Path
from unittest import mock

HERE = Path(__file__).resolve().parent
CLI = HERE.parent / "syntara"


def _load(name, path):
    loader = SourceFileLoader(name, str(path))
    spec = importlib.util.spec_from_loader(loader.name, loader)
    module = importlib.util.module_from_spec(spec)
    loader.exec_module(module)
    return module


syntara = _load("syntara_oom_retry", CLI)
# cmd_chat/cmd_serve do `import openai_server` at call time: the module must be
# the same object this test patches (plain import, same convention as
# test_openai_server.py).
import openai_server  # noqa: E402

family_by_id = syntara.family_by_id

OOM_RC = 0xC0000017          # Windows STATUS_NO_MEMORY
AV_RC = 3221225477           # 0xC0000005 STATUS_ACCESS_VIOLATION: not an OOM


class OomClassTest(unittest.TestCase):
    def test_exit_codes_classify_oom(self):
        self.assertTrue(syntara.oom_class_failed(rc=-9))          # kernel OOM-killer
        self.assertTrue(syntara.oom_class_failed(rc=OOM_RC))
        self.assertTrue(syntara.oom_class_failed(rc=OOM_RC - (1 << 32)))  # signed view

    def test_other_exit_codes_are_not_oom(self):
        self.assertFalse(syntara.oom_class_failed(rc=AV_RC))
        self.assertFalse(syntara.oom_class_failed(rc=1))
        self.assertFalse(syntara.oom_class_failed(rc=0))

    def test_text_markers_classify_oom(self):
        self.assertTrue(syntara.oom_class_failed("out of memory"))
        self.assertTrue(syntara.oom_class_failed(
            "glm.c: failed to allocate 512.00 MiB for KV cache"))
        self.assertFalse(syntara.oom_class_failed("connection refused"))
        self.assertFalse(syntara.oom_class_failed(""))

    def test_a_defective_checkpoint_vetoes_the_retry(self):
        # Even under an OOM-looking exit code, a broken file must not be
        # retried: the original error is the honest one to surface.
        self.assertFalse(syntara.oom_class_failed(
            "model-00007.safetensors: short read at EOF — truncated shard?",
            rc=OOM_RC))
        self.assertFalse(syntara.oom_class_failed("checksum mismatch", rc=-9))


class LighterPlanTest(unittest.TestCase):
    def test_lighter_cap_halves_only_whats_halvable(self):
        self.assertEqual(syntara.lighter_cap(16), 8)
        self.assertEqual(syntara.lighter_cap(3), 1)
        self.assertEqual(syntara.lighter_cap(2), 1)
        for unusable in (None, 0, 1, "x"):
            self.assertIsNone(syntara.lighter_cap(unusable), unusable)

    def _family(self):
        limits = type("L", (), {"context_env": "Q36_MAXT"})()
        return type("F", (), {"limits": limits})()

    def test_halves_the_family_context_env(self):
        plan = syntara.lighter_plan(self._family(), {"Q36_MAXT": "8192"}, None)
        self.assertEqual(plan, ({"Q36_MAXT": "4096"}, None))

    def test_halves_both_levers_when_both_exist(self):
        plan = syntara.lighter_plan(self._family(), {"Q36_MAXT": "8192"}, 16)
        self.assertEqual(plan, ({"Q36_MAXT": "4096"}, 8))

    def test_context_floor_is_512(self):
        plan = syntara.lighter_plan(self._family(), {"Q36_MAXT": "600"}, None)
        self.assertEqual(plan, ({"Q36_MAXT": "512"}, None))

    def test_nothing_to_lighten_returns_none(self):
        # already at the floor, no cap: the retry must not invent a lever
        self.assertIsNone(syntara.lighter_plan(
            self._family(), {"Q36_MAXT": "512"}, None))
        self.assertIsNone(syntara.lighter_plan(
            self._family(), {}, None))

    def test_the_original_env_is_not_mutated(self):
        env = {"Q36_MAXT": "8192"}
        syntara.lighter_plan(self._family(), env, None)
        self.assertEqual(env, {"Q36_MAXT": "8192"})


class _FakeProc:
    """Minimal Popen stand-in: dead or alive, with a readable stderr."""

    def __init__(self, dead, text=b"", rc=1):
        self.returncode = rc if dead else None
        self.stderr = io.BytesIO(text)
        self.stdout = io.BytesIO(b"")
        self.terminated = False

    def poll(self):
        return self.returncode

    def wait(self, timeout=None):
        return self.returncode

    def terminate(self):
        self.terminated = True

    def kill(self):
        self.terminated = True


class NonGlmChatRetryTest(unittest.TestCase):
    """The non-glm chat path: openai_server subprocess dies OOM-class once."""

    def _namespace(self, **extra):
        base = dict(model=r"D:\fake\model", cap=None, ngen=16, ram=0, topp=0,
                    topk=0, no_attach=True, attach=None, api_key=None,
                    stats="off", temp=None, think=None, effort=None, ctx=0)
        base.update(extra)
        import argparse
        return argparse.Namespace(**base)

    def _run(self, dead_text, dead_rc=1):
        family = family_by_id("qwen36")
        spawns, attached, banners = [], [], []
        procs = []

        def fake_popen(cmd, **kw):
            dead = len(spawns) == 0
            procs.append(_FakeProc(dead, dead_text, dead_rc))
            spawns.append((list(cmd), dict(kw)))
            return procs[-1]

        saved = os.environ.get("Q36_MAXT")
        os.environ["Q36_MAXT"] = "8192"
        try:
            with mock.patch.object(syntara, "need_model"), \
                 mock.patch.object(syntara, "resolve_model",
                                   lambda *_: type("R", (), {"descriptor": family})()), \
                 mock.patch.object(syntara, "engine_for", lambda *_: "fake-engine"), \
                 mock.patch.object(syntara, "banner",
                                   lambda sub="", **kw: banners.append(sub)), \
                 mock.patch.object(syntara, "server_probe", lambda *a, **k: True), \
                 mock.patch.object(syntara, "chat_attached",
                                   lambda *a, **k: attached.append(a)), \
                 mock.patch.object(syntara, "TTY", False), \
                 mock.patch.object(syntara.subprocess, "Popen", fake_popen):
                try:
                    syntara.cmd_chat(self._namespace())
                    exit_msg = None
                except SystemExit as exit_:
                    exit_msg = str(exit_)
        finally:
            if saved is None:
                os.environ.pop("Q36_MAXT", None)
            else:
                os.environ["Q36_MAXT"] = saved
        return spawns, attached, banners, exit_msg

    def test_one_lighter_retry_then_attached(self):
        oom_text = b"out of memory: failed to allocate 512.00 MiB for KV cache\n"
        spawns, attached, banners, exit_msg = self._run(oom_text)
        self.assertIsNone(exit_msg)
        self.assertEqual(len(spawns), 2, "died OOM-class once, so exactly one retry")
        self.assertEqual(len(attached), 1)

        first_cmd, first_kw = spawns[0]
        second_cmd, second_kw = spawns[1]
        self.assertNotIn("--cap", first_cmd, "absent --cap stays absent on attempt 1")
        self.assertIn("--cap", second_cmd, "the retry overrides the legacy-8 default")
        self.assertEqual(second_cmd[second_cmd.index("--cap") + 1], "4",
                         "legacy cap 8 halved to 4")
        self.assertEqual(first_kw["env"]["Q36_MAXT"], "8192")
        self.assertEqual(second_kw["env"]["Q36_MAXT"], "4096",
                         "the lighter context env must reach the child")
        self.assertIs(second_kw["stderr"], subprocess.PIPE)

        self.assertTrue(any("lighter plan" in b for b in banners), banners)

    def test_a_non_oom_death_keeps_the_original_error(self):
        spawns, attached, banners, exit_msg = self._run(b"fatal: invalid model file\n")
        self.assertIsNotNone(exit_msg)
        self.assertIn("server exited while loading", exit_msg)
        self.assertEqual(len(spawns), 1, "not OOM-class: no retry")
        self.assertEqual(attached, [])
        self.assertFalse(any("lighter plan" in b for b in banners))


class ServeRetryTest(unittest.TestCase):
    """`syntara serve`: openai_server.serve dies OOM-class once, then serves."""

    def _namespace(self, **extra):
        base = dict(model=r"D:\fake\model", host="127.0.0.1", port=18999,
                    model_id=None, api_key=None, cap=None, temp=None,
                    cluster_coordinator=None, cluster_workers=None,
                    cors_origin=None, max_queue=8, queue_timeout=300,
                    kv_slots=1, allowed_host=(), ngen=16, ram=0, ctx=0)
        base.update(extra)
        import argparse
        return argparse.Namespace(**base)

    def _family(self):
        return family_by_id("qwen36")

    def _run(self, first_exc):
        family = self._family()
        calls, banners = [], []

        def flaky_serve(*args, **kwargs):
            calls.append((args, kwargs))
            if len(calls) == 1 and first_exc is not None:
                raise first_exc

        saved = os.environ.get("Q36_MAXT")
        saved_arch = getattr(openai_server, "ARCH", None)
        os.environ["Q36_MAXT"] = "8192"
        try:
            with mock.patch.object(syntara, "need_model"), \
                 mock.patch.object(syntara, "resolve_model",
                                   lambda *_: type("R", (), {"descriptor": family})()), \
                 mock.patch.object(syntara, "engine_for", lambda *_: "fake-engine"), \
                 mock.patch.object(syntara, "banner",
                                   lambda sub="", **kw: banners.append(sub)), \
                 mock.patch.object(openai_server, "serve", flaky_serve):
                raised = None
                try:
                    syntara.cmd_serve(self._namespace())
                except Exception as error:  # noqa: BLE001 - the test inspects it
                    raised = error
        finally:
            if saved is None:
                os.environ.pop("Q36_MAXT", None)
            else:
                os.environ["Q36_MAXT"] = saved
            if saved_arch is None:
                openai_server.ARCH = None
            else:
                openai_server.ARCH = saved_arch
        return calls, banners, raised

    def test_oom_death_retries_once_with_a_lighter_plan(self):
        first = openai_server.EngineExit(
            "syntara engine exited unexpectedly (engine exit code %d)" % OOM_RC,
            rc=OOM_RC)
        calls, banners, raised = self._run(first)
        self.assertIsNone(raised, "the second attempt must succeed")
        self.assertEqual(len(calls), 2)
        (first_args, _), (second_args, _) = calls
        self.assertIsNone(first_args[5], "attempt 1 kept the explicit cap absent")
        self.assertEqual(second_args[5], 4, "legacy cap 8 halved to 4")
        self.assertEqual(second_args[8]["Q36_MAXT"], "4096",
                         "the lighter context env must reach serve()")
        self.assertTrue(any("lighter plan" in b for b in banners), banners)

    def test_a_non_oom_engine_exit_is_not_retried(self):
        first = openai_server.EngineExit(
            "syntara engine exited unexpectedly (engine exit code %d)" % AV_RC,
            rc=AV_RC)
        calls, banners, raised = self._run(first)
        self.assertIsInstance(raised, openai_server.EngineExit)
        self.assertEqual(len(calls), 1, "not OOM-class: no retry")
        self.assertFalse(any("lighter plan" in b for b in banners))

    def test_a_plain_value_error_is_not_retried(self):
        calls, banners, raised = self._run(ValueError("max_tokens must be positive"))
        self.assertIsInstance(raised, ValueError)
        self.assertEqual(len(calls), 1)


ENGINE = textwrap.dedent(r'''
    import json, os, sys
    counter = os.environ.get("SYNTARA_TEST_COUNTER")
    record = os.environ.get("SYNTARA_TEST_RECORD")
    n = 0
    if counter:
        try:
            n = int(open(counter).read() or "0")
        except OSError:
            n = 0
        open(counter, "w").write(str(n + 1))
    ctx_key = os.environ.get("SYNTARA_TEST_CTXKEY", "")
    if record:
        with open(record, "a") as handle:
            handle.write(json.dumps({"spawn": n,
                                     "ctx": os.environ.get(ctx_key, "")}) + "\n")
    if n == 0:
        sys.stderr.write("glm.c: out of memory: failed to allocate 512.00 MiB "
                         "for KV cache\n")
        sys.stderr.flush()
        sys.exit(1)
    out = sys.stdout.buffer
    out.write(b'\x01\x01READY\x01\x01\nSTAT 0 0.00 0.0 1.00\n'
              b'TIERS 0 0 0 0 0\n')
    out.flush()
    for _line in sys.stdin.buffer:
        out.write(b'ok\x01\x01END\x01\x01\nSTAT 1 1.00 0.0 1.00\n')
        out.flush()
''')

DRIVER = textwrap.dedent(r'''
    import importlib.util, io, json, os, subprocess, sys, tempfile
    from importlib.machinery import SourceFileLoader
    from pathlib import Path
    from unittest import mock

    cli, engine, counter, record = sys.argv[1:5]
    loader = SourceFileLoader("syntara_oom_chat", cli)
    spec = importlib.util.spec_from_loader(loader.name, loader)
    syntara = importlib.util.module_from_spec(spec)
    loader.exec_module(syntara)

    model = tempfile.mkdtemp()
    Path(model, "config.json").write_text('{"model_type": "glm_moe_dsa"}')
    family = syntara.resolve_model(model).descriptor
    ctx_key = family.limits.context_env
    os.environ[ctx_key] = "8192"
    os.environ["SYNTARA_TEST_COUNTER"] = counter
    os.environ["SYNTARA_TEST_RECORD"] = record
    os.environ["SYNTARA_TEST_CTXKEY"] = ctx_key

    real_popen = subprocess.Popen
    banners = []
    prompts = iter(["hello"])

    def fake_input(*_):
        try:
            return next(prompts)
        except StopIteration:
            raise EOFError

    args = syntara.argparse.Namespace(model=model, cap=None, ngen=16, ram=0,
                                      topp=0, topk=0, no_attach=True,
                                      attach=None, api_key=None, stats="off",
                                      temp=None, think=None, effort=None, ctx=0)
    out = io.StringIO()
    code = None
    with mock.patch.object(syntara, "need_model"), \
         mock.patch.object(syntara, "banner",
                           lambda sub="", **kw: banners.append(sub)), \
         mock.patch.object(syntara, "env_for", return_value=dict(os.environ)), \
         mock.patch.object(syntara, "TTY", False), \
         mock.patch.object(syntara.subprocess, "Popen",
                           lambda cmd, **kw: real_popen([sys.executable, engine],
                                                       **kw)), \
         mock.patch("builtins.input", fake_input), \
         mock.patch.object(sys, "stdout", out):
        try:
            syntara.cmd_chat(args)
        except SystemExit as exit_:
            code = str(exit_)
    records = []
    try:
        records = [json.loads(line) for line in Path(record).read_text().splitlines()
                   if line.strip()]
    except OSError:
        pass
    print(json.dumps({"output": out.getvalue(), "banners": banners,
                      "exit": code, "records": records}, ensure_ascii=True))
''')


class GlmChatRetryIntegrationTest(unittest.TestCase):
    """The GLM direct-engine path through a real cmd_chat child process."""

    def test_an_oom_death_retries_once_and_the_lighter_env_reaches_the_engine(self):
        with tempfile.TemporaryDirectory() as scratch:
            engine = Path(scratch, "engine.py")
            engine.write_text(ENGINE, encoding="utf-8")
            driver = Path(scratch, "driver.py")
            driver.write_text(DRIVER, encoding="utf-8")
            counter = str(Path(scratch, "counter"))
            record = str(Path(scratch, "record"))
            result = subprocess.run(
                [sys.executable, str(driver), str(CLI), str(engine),
                 counter, record],
                capture_output=True, timeout=90)
        if result.returncode:
            raise AssertionError(result.stderr.decode("utf-8", "replace")[-3000:])
        report = json.loads(result.stdout.decode("utf-8").strip().splitlines()[-1])

        self.assertIsNone(report["exit"], report["output"][-2000:])
        self.assertNotIn("the engine exited while loading", report["output"])

        # the engine died OOM-class once (spawn 0), then the retry spawned it
        self.assertEqual([r["spawn"] for r in report["records"]], [0, 1])
        # ... and the lighter context env actually reached the second engine
        self.assertEqual(report["records"][0]["ctx"], "8192")
        self.assertEqual(report["records"][1]["ctx"], "4096")

        # the first death's reason was shown, and the retry banner was emitted
        self.assertIn("failed to allocate", report["output"])
        lighter = [b for b in report["banners"] if "lighter plan" in b]
        self.assertEqual(len(lighter), 1, report["banners"])
        self.assertIn("8192→4096", lighter[0])

        # the chat still completed its turn after the retry
        self.assertIn("goodbye", report["output"])


if __name__ == "__main__":
    unittest.main()
