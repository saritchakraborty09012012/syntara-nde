"""Track 1h resilience tests: memory guard, idle unload, crash isolation.

Uses the fake runtime from test_gateway - no backend, no real memory
pressure; the guard test only needs an estimate larger than any machine.
"""
from __future__ import annotations

import json
import time
import unittest
import urllib.error
import urllib.request

from syntara.gateway import HostGateway, default_idle_unload_s
from syntara.tests.test_gateway import FakeRuntime, _entry


class _StubResponder:
    """Captures respond.error/json calls made by handle_chat directly."""

    streaming = False

    def __init__(self) -> None:
        self.errors: list[tuple[int, str, str, dict]] = []
        self.jsons: list[tuple[int, object]] = []

    def error(self, status, message, err_type, code, *, detail="",
              extra_headers=None):
        self.errors.append((status, code, message, extra_headers or {}))

    def json(self, status, obj, *, extra_headers=None):
        self.jsons.append((status, obj))


def _wait_for(predicate, timeout: float = 8.0) -> bool:
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        if predicate():
            return True
        time.sleep(0.05)
    return predicate()


def _post(gw, path, body):
    data = json.dumps(body).encode()
    req = urllib.request.Request(
        gw.url + path, data=data, method="POST",
        headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return resp.status, dict(resp.headers), resp.read()
    except urllib.error.HTTPError as exc:
        return exc.code, dict(exc.headers), exc.read()


class MemoryGuardTest(unittest.TestCase):
    def test_impossible_load_is_refused_before_spawn(self):
        entry = _entry()
        entry["estimates"] = {"ram_gb_min": 99999.0}
        gw = HostGateway(entry, port=0, runtime_factory=FakeRuntime)
        with self.assertRaises(RuntimeError) as ctx:
            gw.start()
        message = str(ctx.exception)
        self.assertIn("99999.0 GB", message)
        self.assertIn("free", message)
        self.assertIn("smaller model/quantization", message)
        self.assertEqual(gw.state, "failed")
        self.assertFalse(gw.runtime.loaded, "guard must fire before load()")

    def test_a_possible_load_proceeds(self):
        entry = _entry()
        entry["estimates"] = {"ram_gb_min": 0.01}
        gw = HostGateway(entry, port=0, runtime_factory=FakeRuntime)
        gw.start()
        self.addCleanup(gw.stop)
        self.assertEqual(gw.state, "ready")

    def test_entries_without_estimates_keep_the_old_behaviour(self):
        gw = HostGateway(_entry(), port=0, runtime_factory=FakeRuntime)
        gw.start()  # no estimates at all: no guard, exactly as before
        self.addCleanup(gw.stop)
        self.assertEqual(gw.state, "ready")


class IdleUnloadTest(unittest.TestCase):
    def test_idle_unload_keeps_ready_and_reloads_on_demand(self):
        gw = HostGateway(_entry(), port=0, runtime_factory=FakeRuntime,
                         idle_unload_s=0.3)
        gw.start()
        self.addCleanup(gw.stop)
        self.assertTrue(gw.runtime.loaded)

        self.assertTrue(_wait_for(lambda: gw._idle_unloaded))
        self.assertEqual(gw.state, "ready",  # intentional, not degraded
                         "an idle unload must stay ready (reload on demand)")
        self.assertFalse(gw.runtime.loaded)
        self.assertIn("unloaded after", gw.supervisor_last_event)

        status, headers, raw = _post(
            gw, "/v1/chat/completions",
            {"messages": [{"role": "user", "content": "hi"}]})
        self.assertEqual(status, 200)
        self.assertTrue(gw.runtime.loaded, "the request must reload the model")
        self.assertFalse(gw._idle_unloaded)
        self.assertEqual(json.loads(raw)["object"], "chat.completion")

        body = gw.health_body()
        self.assertTrue(body["ready"])
        self.assertTrue(body["idle"]["enabled"])
        self.assertFalse(body["idle"]["unloaded"])
        self.assertGreater(body["idle"]["idle_unload_s"], 0)

    def test_idle_unload_does_not_crash_loop(self):
        gw = HostGateway(_entry(), port=0, runtime_factory=FakeRuntime,
                         idle_unload_s=0.2)
        gw.start()
        self.addCleanup(gw.stop)
        self.assertTrue(_wait_for(lambda: gw._idle_unloaded))
        time.sleep(1.2)  # several supervisor ticks while idle-unloaded
        self.assertEqual(gw.restarts, 0,
                         "an intentional unload must not be treated as death")
        self.assertEqual(gw.state, "ready")

    def test_zero_timeout_keeps_the_model_warm(self):
        gw = HostGateway(_entry(), port=0, runtime_factory=FakeRuntime,
                         idle_unload_s=0.0)
        gw.start()
        self.addCleanup(gw.stop)
        time.sleep(0.9)
        self.assertTrue(gw.runtime.loaded)
        self.assertFalse(gw._idle_unloaded)

    def test_env_parsing_is_fault_tolerant(self):
        import os
        from unittest import mock
        cases = {"": 0.0, "30": 30.0, "2.5": 2.5, "abc": 0.0, "-5": 0.0}
        for raw, expected in cases.items():
            with mock.patch.dict(os.environ,
                                 {"SYNTARA_IDLE_UNLOAD_S": raw}):
                self.assertEqual(default_idle_unload_s(), expected, raw)


class CrashIsolationTest(unittest.TestCase):
    def _start(self, **kw):
        gw = HostGateway(_entry(), port=0, runtime_factory=FakeRuntime, **kw)
        gw.start()
        self.addCleanup(gw.stop)
        return gw

    def test_supervisor_survives_its_own_exception(self):
        gw = self._start()
        original = gw._on_runtime_death
        calls = {"n": 0}

        def exploding(dead):
            calls["n"] += 1
            if calls["n"] == 1:
                raise RuntimeError("bookkeeping bug")
            return original(dead)

        gw._on_runtime_death = exploding
        gw.runtime.unload()  # a real death: first probe explodes, second reloads

        self.assertTrue(_wait_for(
            lambda: (gw.supervisor_last_event or "").startswith(
                "supervisor error")))
        self.assertTrue(gw._supervisor.is_alive(),
                        "the supervisor thread must never die silently")
        self.assertTrue(_wait_for(lambda: gw.restarts >= 1))
        self.assertEqual(gw.state, "ready")
        self.assertTrue(gw.runtime.loaded)

    def test_reload_window_answers_503_with_retry_after(self):
        gw = self._start()
        with gw._state_lock:
            gw._state = "starting"  # mid-reload
        responder = _StubResponder()
        gw.handle_chat({"messages": [{"role": "user", "content": "hi"}]},
                       responder)
        self.assertEqual(len(responder.errors), 1)
        status, code, message, headers = responder.errors[0]
        self.assertEqual(status, 503)
        self.assertEqual(code, "restarting")
        self.assertEqual(headers.get("Retry-After"), "2")
        self.assertIn("retry", message)

    def test_backend_error_carries_retry_after(self):
        gw = self._start()
        gw.runtime.fail_with = "backend exploded"
        status, headers, raw = _post(
            gw, "/v1/chat/completions",
            {"messages": [{"role": "user", "content": "hi"}]})
        self.assertEqual(status, 502)
        self.assertEqual(headers.get("Retry-After"), "2")
        body = json.loads(raw)
        self.assertEqual(body["error"]["code"], "backend_error")


if __name__ == "__main__":  # pragma: no cover
    unittest.main()
