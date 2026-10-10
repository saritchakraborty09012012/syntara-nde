"""Tests for syntara.gateway (loopback host) using a fake runtime.

No model binary, no subprocess, no network beyond 127.0.0.1 in-process.
The real-backend path is covered by test_runtime_llamacpp (opt-in).
"""
from __future__ import annotations

import json
import threading
import time
import unittest
import urllib.error
import urllib.request
from http.server import BaseHTTPRequestHandler
from typing import Any

from syntara.gateway import HostGateway


def _entry(model_id: str = "fake-model", ctx: int = 8192) -> dict:
    return {"id": model_id, "path": "C:/nonexistent/fake.gguf",
            "mtime": 1700000000, "model": {"context_length": ctx,
                                           "architecture": "llama"}}


class FakeRuntime:
    """Implements the Runtime protocol without any real backend."""

    def __init__(self, entry: dict, *, context: int = 4096,
                 threads=None, chat_delay: float = 0.0, **_kw) -> None:
        self.entry = entry
        self.context = context
        self.threads = threads
        self.chat_delay = chat_delay
        self._loaded = False
        self.chats: list[dict] = []
        self.fail_with: str | None = None

    def load(self) -> None:
        self._loaded = True

    def unload(self) -> None:
        self._loaded = False

    @property
    def loaded(self) -> bool:
        return self._loaded

    def capabilities(self) -> dict:
        return {"backend": "fake", "available": True, "streaming": True}

    def chat(self, body: dict) -> dict:
        if self.fail_with:
            raise RuntimeError(self.fail_with)
        self.chats.append(body)
        if self.chat_delay:
            time.sleep(self.chat_delay)
        return {"id": "chatcmpl-fake", "object": "chat.completion",
                "model": body.get("model", "fake-model"),
                "choices": [{"index": 0,
                             "message": {"role": "assistant",
                                         "content": "hello from fake"},
                             "finish_reason": "stop"}],
                "usage": {"prompt_tokens": 3, "completion_tokens": 2,
                          "total_tokens": 5}}

    def stream(self, body: dict):
        if self.fail_with:
            # Real generators defer errors until first frame; mimic that so
            # the gateway's mid-stream error path is exercised.
            raise RuntimeError(self.fail_with)
        self.chats.append(body)
        chunk = {"id": "chatcmpl-fake", "object": "chat.completion.chunk",
                 "choices": [{"index": 0, "delta": {"content": "hey"},
                              "finish_reason": None}]}
        yield b"data: " + json.dumps(chunk).encode() + b"\n\n"
        yield (b"data: " + json.dumps(
            {"usage": {"prompt_tokens": 3, "completion_tokens": 1}}
        ).encode() + b"\n\n")
        yield b"data: [DONE]\n\n"

    def health(self) -> dict:
        return {"backend": "fake", "loaded": self._loaded}


class GatewayTest(unittest.TestCase):
    def start_gateway(self, **kw) -> HostGateway:
        gw = HostGateway(_entry(), port=0, runtime_factory=FakeRuntime, **kw)
        gw.start()
        self.addCleanup(gw.stop)
        self.last_runtime = gw.runtime
        return gw

    def get(self, gw: HostGateway, path: str, headers: dict | None = None,
            expect_error: bool = False):
        req = urllib.request.Request(gw.url + path, headers=headers or {})
        try:
            with urllib.request.urlopen(req, timeout=10) as resp:
                return resp.status, dict(resp.headers), resp.read()
        except urllib.error.HTTPError as exc:
            if not expect_error:
                raise
            return exc.code, dict(exc.headers), exc.read()

    def post_json(self, gw: HostGateway, path: str, body: dict,
                  headers: dict | None = None):
        data = json.dumps(body).encode()
        req = urllib.request.Request(gw.url + path, data=data, method="POST",
                                     headers={"Content-Type": "application/json",
                                              **(headers or {})})
        try:
            with urllib.request.urlopen(req, timeout=10) as resp:
                return resp.status, dict(resp.headers), resp.read()
        except urllib.error.HTTPError as exc:
            return exc.code, dict(exc.headers), exc.read()

    # --------------------------------------------------------------- health

    def test_health_reports_ready_and_scheduler_shape(self):
        gw = self.start_gateway()
        status, _, raw = self.get(gw, "/health")
        self.assertEqual(status, 200)
        body = json.loads(raw)
        self.assertEqual(body["status"], "ready")
        self.assertTrue(body["ready"])
        self.assertEqual(body["model"], "fake-model")
        self.assertIn("scheduler", body)
        self.assertEqual(body["scheduler"]["active"], 0)
        self.assertIn("hwinfo", body)

    def test_profile_shape_and_turn_accounting(self):
        gw = self.start_gateway()
        status, _, raw = self.get(gw, "/profile")
        self.assertEqual(status, 200)
        body = json.loads(raw)
        self.assertEqual(body["seq"], 0)
        self.assertEqual(body["turns"], [])
        # 1h: first-run calibration result (None until one has been measured).
        self.assertIn("calibration", body)
        self.assertTrue(body["calibration"] is None
                        or isinstance(body["calibration"], dict))

        self.post_json(gw, "/v1/chat/completions",
                       {"messages": [{"role": "user", "content": "hi"}]})
        _, _, raw = self.get(gw, "/profile")
        body = json.loads(raw)
        self.assertEqual(body["seq"], 1)
        self.assertEqual(body["turns"][0]["prompt_tokens"], 3)
        self.assertEqual(body["turns"][0]["completion_tokens"], 2)
        self.assertGreaterEqual(body["turns"][0]["wall_s"], 0)

    # --------------------------------------------------------------- models

    def test_models_list_and_get(self):
        gw = self.start_gateway()
        status, _, raw = self.get(gw, "/v1/models")
        self.assertEqual(status, 200)
        body = json.loads(raw)
        self.assertEqual(body["object"], "list")
        self.assertEqual(body["data"][0]["id"], "fake-model")
        self.assertEqual(body["data"][0]["owned_by"], "syntara")

        status, _, raw = self.get(gw, "/v1/models/fake-model")
        self.assertEqual(status, 200)
        self.assertEqual(json.loads(raw)["id"], "fake-model")

        status, _, raw = self.get(gw, "/v1/models/ghost", expect_error=True)
        self.assertEqual(status, 404)
        self.assertEqual(json.loads(raw)["error"]["code"], "model_not_found")

    # ----------------------------------------------------------------- chat

    def test_chat_non_stream_returns_completion(self):
        gw = self.start_gateway()
        status, _, raw = self.post_json(
            gw, "/v1/chat/completions",
            {"model": "fake-model",
             "messages": [{"role": "user", "content": "hi"}],
             "max_completion_tokens": 32, "enable_thinking": False})
        self.assertEqual(status, 200)
        body = json.loads(raw)
        self.assertEqual(body["choices"][0]["message"]["content"],
                         "hello from fake")
        self.assertEqual(body["usage"]["total_tokens"], 5)
        # the SDK's extra keys must not break the backend contract
        sent = self.last_runtime.chats[-1]
        self.assertIn("enable_thinking", sent)

    def test_chat_stream_returns_sse_with_done(self):
        gw = self.start_gateway()
        status, headers, raw = self.post_json(
            gw, "/v1/chat/completions",
            {"model": "fake-model",
             "messages": [{"role": "user", "content": "hi"}],
             "stream": True, "stream_options": {"include_usage": True}})
        self.assertEqual(status, 200)
        self.assertIn("text/event-stream", headers.get("Content-Type", ""))
        text = raw.decode("utf-8")
        self.assertIn("chat.completion.chunk", text)
        self.assertIn("data: [DONE]", text)
        self.assertIn('"usage"', text)

    def test_chat_success_carries_queue_wait_header(self):
        # The web client reads x-syntara-queue-wait-ms on BOTH paths; an
        # immediate admission must still produce the header (value 0).
        gw = self.start_gateway()
        status, headers, _ = self.post_json(
            gw, "/v1/chat/completions",
            {"model": "fake-model",
             "messages": [{"role": "user", "content": "hi"}],
             "max_completion_tokens": 8})
        self.assertEqual(status, 200)
        wait = headers.get("x-syntara-queue-wait-ms")
        self.assertIsNotNone(wait, "queue-wait header missing on json path")
        self.assertGreaterEqual(int(wait), 0)

        status, headers, _ = self.post_json(
            gw, "/v1/chat/completions",
            {"model": "fake-model",
             "messages": [{"role": "user", "content": "hi"}],
             "stream": True})
        self.assertEqual(status, 200)
        wait = headers.get("x-syntara-queue-wait-ms")
        self.assertIsNotNone(wait, "queue-wait header missing on stream path")
        self.assertGreaterEqual(int(wait), 0)

    def test_chat_wrong_model_is_404(self):
        gw = self.start_gateway()
        status, _, raw = self.post_json(
            gw, "/v1/chat/completions",
            {"model": "other-model",
             "messages": [{"role": "user", "content": "hi"}]})
        self.assertEqual(status, 404)
        err = json.loads(raw)["error"]
        self.assertEqual(err["code"], "model_not_found")
        self.assertIn("fake-model", err["message"])

    def test_chat_empty_messages_is_400(self):
        gw = self.start_gateway()
        status, _, raw = self.post_json(
            gw, "/v1/chat/completions", {"model": "fake-model",
                                         "messages": []})
        self.assertEqual(status, 400)
        self.assertEqual(json.loads(raw)["error"]["code"], "invalid_messages")

    def test_chat_invalid_json_is_400(self):
        gw = self.start_gateway()
        req = urllib.request.Request(
            gw.url + "/v1/chat/completions", data=b"{not json",
            method="POST",
            headers={"Content-Type": "application/json"})
        with self.assertRaises(urllib.error.HTTPError) as ctx:
            urllib.request.urlopen(req, timeout=10)
        self.assertEqual(ctx.exception.code, 400)
        body = json.loads(ctx.exception.read())
        self.assertEqual(body["error"]["code"], "invalid_body")

    def test_chat_runtime_not_ready_is_503(self):
        gw = self.start_gateway()
        gw.runtime.unload()
        status, _, raw = self.post_json(
            gw, "/v1/chat/completions",
            {"model": "fake-model",
             "messages": [{"role": "user", "content": "hi"}]})
        self.assertEqual(status, 503)
        self.assertEqual(json.loads(raw)["error"]["code"], "runtime_not_ready")

    def test_chat_backend_failure_is_502(self):
        gw = self.start_gateway()
        gw.runtime.fail_with = "backend exploded"
        status, _, raw = self.post_json(
            gw, "/v1/chat/completions",
            {"model": "fake-model",
             "messages": [{"role": "user", "content": "hi"}]})
        self.assertEqual(status, 502)
        err = json.loads(raw)["error"]
        self.assertEqual(err["code"], "backend_error")
        self.assertIn("backend exploded", err["message"])
        self.assertEqual(gw.last_error, "backend exploded")

    def test_concurrency_counter_returns_to_zero(self):
        gw = self.start_gateway()
        self.post_json(gw, "/v1/chat/completions",
                       {"messages": [{"role": "user", "content": "hi"}]})
        _, _, raw = self.get(gw, "/health")
        body = json.loads(raw)
        self.assertEqual(body["scheduler"]["active"], 0)
        self.assertEqual(body["scheduler"]["admitted"], 1)

    # ------------------------------------------------------------ scheduling

    def _wait_for(self, predicate, timeout: float = 5.0) -> bool:
        deadline = time.monotonic() + timeout
        while time.monotonic() < deadline:
            if predicate():
                return True
            time.sleep(0.01)
        return predicate()

    def _async_chat(self, gw: HostGateway, body: dict):
        result: dict = {}

        def run():
            result["resp"] = self.post_json(gw, "/v1/chat/completions", body)

        thread = threading.Thread(target=run, daemon=True)
        thread.start()
        return thread, result

    def test_concurrent_chats_serialise_and_queue_is_visible(self):
        gw = self.start_gateway()
        gw.runtime.chat_delay = 0.4
        body = {"model": "fake-model",
                "messages": [{"role": "user", "content": "hi"}]}

        t1, r1 = self._async_chat(gw, body)
        self.assertTrue(self._wait_for(
            lambda: gw.health_body()["scheduler"]["active"] == 1),
            "first request never became active")

        t2, r2 = self._async_chat(gw, body)
        self.assertTrue(self._wait_for(
            lambda: gw.health_body()["scheduler"]["queued"] == 1),
            "second request never queued")

        # Mid-flight: exactly one active (capacity), one queued, honest.
        snap = gw.health_body()["scheduler"]
        self.assertEqual(snap["active"], 1)
        self.assertEqual(snap["queued"], 1)
        self.assertEqual(snap["capacity"], 1)

        t1.join(timeout=15.0)
        t2.join(timeout=15.0)
        self.assertEqual(r1["resp"][0], 200)
        self.assertEqual(r2["resp"][0], 200)

        snap = gw.health_body()["scheduler"]
        self.assertEqual(snap["active"], 0)
        self.assertEqual(snap["queued"], 0)
        self.assertEqual(snap["admitted"], 2)
        self.assertEqual(json.loads(self.get(gw, "/profile")[2])["seq"], 2)

    def test_full_queue_answers_429_with_retry_after(self):
        gw = self.start_gateway(max_queue=0)
        gw.runtime.chat_delay = 0.5
        body = {"model": "fake-model",
                "messages": [{"role": "user", "content": "hi"}]}

        t1, r1 = self._async_chat(gw, body)
        self.assertTrue(self._wait_for(
            lambda: gw.health_body()["scheduler"]["active"] == 1))

        status, headers, raw = self.post_json(gw, "/v1/chat/completions", body)
        self.assertEqual(status, 429)
        err = json.loads(raw)["error"]
        self.assertEqual(err["code"], "queue_full")
        self.assertEqual(err["type"], "rate_limit_error")
        self.assertIn("busy", err["message"])
        self.assertEqual(headers.get("Retry-After"), "1")
        self.assertEqual(gw.health_body()["scheduler"]["rejected"], 1)

        t1.join(timeout=15.0)
        self.assertEqual(r1["resp"][0], 200)  # the in-flight one still ran

    def test_queue_timeout_answers_504_with_wait_report(self):
        gw = self.start_gateway(queue_timeout=0.3)
        gw.runtime.chat_delay = 1.0
        body = {"model": "fake-model",
                "messages": [{"role": "user", "content": "hi"}]}

        t1, r1 = self._async_chat(gw, body)
        self.assertTrue(self._wait_for(
            lambda: gw.health_body()["scheduler"]["active"] == 1))

        status, _, raw = self.post_json(gw, "/v1/chat/completions", body)
        self.assertEqual(status, 504)
        err = json.loads(raw)["error"]
        self.assertEqual(err["code"], "queue_timeout")
        self.assertIn("waited", err["message"])
        self.assertIn("host queue", err["message"])
        self.assertEqual(gw.health_body()["scheduler"]["timed_out"], 1)

        t1.join(timeout=15.0)
        self.assertEqual(r1["resp"][0], 200)
        self.assertEqual(gw.health_body()["scheduler"]["active"], 0)

    # ------------------------------------------------------- unimplemented

    def test_unimplemented_endpoints_answer_501(self):
        gw = self.start_gateway()
        for path in ("/v1/completions", "/v1/brio", "/v1/messages", "/experts"):
            status, _, raw = self.get(gw, path, expect_error=True)
            self.assertEqual(status, 501, path)
            self.assertEqual(json.loads(raw)["error"]["code"],
                             "not_implemented", path)

    def test_unknown_path_is_404(self):
        gw = self.start_gateway()
        status, _, raw = self.get(gw, "/v2/nothing", expect_error=True)
        self.assertEqual(status, 404)
        self.assertEqual(json.loads(raw)["error"]["code"], "not_found")

    # ----------------------------------------------------------- security

    def test_binds_loopback_only(self):
        gw = self.start_gateway()
        self.assertEqual(gw.host, "127.0.0.1")
        self.assertEqual(gw._server.server_address[0], "127.0.0.1")
        self.assertNotIn(":", gw._server.server_address[0])

    def test_cors_grants_known_origin_only(self):
        gw = self.start_gateway()
        status, headers, _ = self.get(
            gw, "/health", headers={"Origin": "tauri://localhost"})
        self.assertEqual(status, 200)
        self.assertEqual(headers.get("Access-Control-Allow-Origin"),
                         "tauri://localhost")
        # Cross-origin JS may only read headers that are exposed; the retry
        # policy and the queue-wait log depend on both.
        exposed = (headers.get("Access-Control-Expose-Headers") or "").lower()
        self.assertIn("retry-after", exposed)
        self.assertIn("x-syntara-queue-wait-ms", exposed)

        _, headers, _ = self.get(gw, "/health",
                                 headers={"Origin": "https://evil.example"})
        self.assertIsNone(headers.get("Access-Control-Allow-Origin"))
        self.assertIsNone(headers.get("Access-Control-Expose-Headers"))

    def test_api_key_enforced_when_configured(self):
        gw = HostGateway(_entry(), port=0, runtime_factory=FakeRuntime,
                         api_key="sekrit")
        gw.start()
        self.addCleanup(gw.stop)

        status, _, raw = self.get(gw, "/health", expect_error=True)
        self.assertEqual(status, 401)
        self.assertEqual(json.loads(raw)["error"]["code"], "invalid_api_key")

        status, _, _ = self.get(
            gw, "/health", headers={"Authorization": "Bearer sekrit"})
        self.assertEqual(status, 200)

        status, _, _ = self.get(
            gw, "/health", headers={"Authorization": "Bearer wrong"},
            expect_error=True)
        self.assertEqual(status, 401)

    def test_stop_releases_server_and_runtime(self):
        gw = HostGateway(_entry(), port=0, runtime_factory=FakeRuntime)
        gw.start()
        runtime = gw.runtime
        gw.stop()
        self.assertIsNone(gw._server)
        self.assertFalse(runtime.loaded)
        self.assertTrue(gw._thread is None or not gw._thread.is_alive())

    def test_context_capped_by_model_context(self):
        gw = HostGateway(_entry(ctx=2048), port=0,
                         runtime_factory=FakeRuntime)
        self.assertEqual(gw.context, 2048)
        gw = HostGateway(_entry(ctx=32768), port=0,
                         runtime_factory=FakeRuntime)
        self.assertEqual(gw.context, 4096)  # default cap


class HostLifecycleTest(unittest.TestCase):
    """Plan 1d: lifecycle states, reload predicate, supervision, POST /stop."""

    # -- helpers (mirrors GatewayTest's, kept local so lifecycle tests own
    #    their gateways without inheriting every other test) ---------------

    def _get(self, gw, path, headers=None, expect_error=False):
        req = urllib.request.Request(gw.url + path, headers=headers or {})
        try:
            with urllib.request.urlopen(req, timeout=10) as resp:
                return resp.status, dict(resp.headers), resp.read()
        except urllib.error.HTTPError as exc:
            if not expect_error:
                raise
            return exc.code, dict(exc.headers), exc.read()

    def _post(self, gw, path, body, headers=None):
        data = json.dumps(body).encode()
        req = urllib.request.Request(gw.url + path, data=data, method="POST",
                                     headers={"Content-Type": "application/json",
                                              **(headers or {})})
        try:
            with urllib.request.urlopen(req, timeout=10) as resp:
                return resp.status, dict(resp.headers), resp.read()
        except urllib.error.HTTPError as exc:
            return exc.code, dict(exc.headers), exc.read()

    def _wait_for(self, predicate, timeout: float = 8.0) -> bool:
        deadline = time.monotonic() + timeout
        while time.monotonic() < deadline:
            if predicate():
                return True
            time.sleep(0.1)
        return predicate()

    # -- lifecycle ---------------------------------------------------------

    def test_lifecycle_start_ready_stop(self):
        gw = HostGateway(_entry(), port=0, runtime_factory=FakeRuntime)
        self.assertEqual(gw.state, "stopped")
        gw.start()
        self.addCleanup(gw.stop)
        self.assertEqual(gw.state, "ready")
        status, _, raw = self._get(gw, "/health")
        self.assertEqual(status, 200)
        body = json.loads(raw)
        self.assertEqual(body["status"], "ready")
        self.assertTrue(body["ready"])
        gw.stop()
        self.assertEqual(gw.state, "stopped")

    def test_startup_failure_marks_failed(self):
        class BrokenRuntime(FakeRuntime):
            def load(self):
                raise RuntimeError("model load exploded")

        gw = HostGateway(_entry(), port=0, runtime_factory=BrokenRuntime)
        with self.assertRaisesRegex(RuntimeError, "model load exploded"):
            gw.start()
        self.assertEqual(gw.state, "failed")
        self.assertIn("model load exploded", gw.failure)

    # -- reload predicate --------------------------------------------------

    def test_reload_predicate_and_reload(self):
        gw = HostGateway(_entry(), port=0, runtime_factory=FakeRuntime)
        gw.start()
        self.addCleanup(gw.stop)
        runtime = gw.runtime

        self.assertIsNone(gw.reload())          # nothing changed
        self.assertIs(gw.runtime, runtime)      # same instance, not rebuilt

        reason = gw.reload(context=1024)
        self.assertEqual(reason, "context changed from 4096 to 1024")
        self.assertIsNot(gw.runtime, runtime)
        self.assertEqual(gw.state, "ready")
        self.assertEqual(gw.context, 1024)

        reason = gw.reload(threads=4)
        self.assertEqual(reason, "threads changed from default to 4")

        reason = gw.reload(entry=_entry("other-model"))
        self.assertIn("model changed", reason)
        self.assertEqual(gw.served_model_id, "other-model")
        self.assertEqual(gw.context, 1024)      # context survives a model swap
        self.assertEqual(gw.state, "ready")

    # -- supervision -------------------------------------------------------

    def test_supervisor_recovers_dead_runtime(self):
        gw = HostGateway(_entry(), port=0, runtime_factory=FakeRuntime)
        gw.start()
        self.addCleanup(gw.stop)
        gw.runtime.unload()  # simulate the backend dying unexpectedly

        self.assertTrue(self._wait_for(lambda: gw.restarts >= 1))
        self.assertEqual(gw.state, "ready")
        self.assertTrue(gw.runtime.loaded)
        status, _, raw = self._get(gw, "/health")
        self.assertEqual(status, 200)
        body = json.loads(raw)
        self.assertEqual(body["supervisor"]["restarts"], 1)
        self.assertIn("reloaded", body["supervisor"]["last_event"])

    def test_supervisor_failed_reload_reports_failed_with_503(self):
        builds = {"n": 0}

        def flaky_factory(entry, *, context=None, threads=None, **kw):
            builds["n"] += 1
            if builds["n"] > 1:
                raise RuntimeError("model file vanished")
            return FakeRuntime(entry, context=context, threads=threads)

        gw = HostGateway(_entry(), port=0, runtime_factory=flaky_factory)
        gw.start()
        self.addCleanup(gw.stop)
        gw.runtime.unload()

        self.assertTrue(self._wait_for(lambda: gw.state == "failed"))
        self.assertIn("automatic reload failed", gw.failure)
        self.assertIn("model file vanished", gw.failure)
        status, _, raw = self._get(gw, "/health", expect_error=True)
        self.assertEqual(status, 503)
        body = json.loads(raw)
        self.assertEqual(body["status"], "failed")
        self.assertIn("automatic reload failed", body["error"])
        # The SDK reads the 503 body instead of raising: health must report
        # the failed state, not choke on it.
        from syntara.client import Syntara
        client = Syntara(gw.url + "/v1")
        report = client.health()
        self.assertEqual(report["status"], "failed")
        self.assertFalse(report["ready"])

    def test_supervisor_gives_up_on_crash_loop(self):
        class DiesAfterLoad(FakeRuntime):
            def load(self):
                super().load()
                self._loaded = False  # "crashed" the moment it came up

        gw = HostGateway(_entry(), port=0, runtime_factory=DiesAfterLoad)
        gw.start()
        self.addCleanup(gw.stop)

        self.assertTrue(self._wait_for(lambda: gw.state == "failed",
                                       timeout=15.0))
        self.assertIn("crash loop", gw.failure)
        self.assertEqual(gw.restarts, 3)  # restart limit, then honest give-up

    # -- POST /stop --------------------------------------------------------

    def test_stop_when_idle_is_honest(self):
        gw = HostGateway(_entry(), port=0, runtime_factory=FakeRuntime)
        gw.start()
        self.addCleanup(gw.stop)
        status, _, raw = self._post(gw, "/stop", {})
        self.assertEqual(status, 200)
        self.assertEqual(json.loads(raw),
                         {"cancelled": False, "active": 0, "queued": 0})

    def test_stop_cancels_active_stream(self):
        class SlowStreamRuntime(FakeRuntime):
            def stream(self, body):
                for i in range(10000):
                    chunk = {"id": "c", "object": "chat.completion.chunk",
                             "choices": [{"index": 0,
                                          "delta": {"content": f"tok{i}"}}]}
                    yield b"data: " + json.dumps(chunk).encode() + b"\n\n"
                    time.sleep(0.01)

        gw = HostGateway(_entry(), port=0, runtime_factory=SlowStreamRuntime)
        gw.start()
        self.addCleanup(gw.stop)
        result: dict = {}

        def run_stream():
            data = json.dumps({"messages": [{"role": "user", "content": "hi"}],
                               "stream": True}).encode()
            req = urllib.request.Request(
                gw.url + "/v1/chat/completions", data=data, method="POST",
                headers={"Content-Type": "application/json"})
            with urllib.request.urlopen(req, timeout=30) as resp:
                result["body"] = resp.read().decode()

        worker = threading.Thread(target=run_stream, daemon=True)
        worker.start()
        self.assertTrue(self._wait_for(
            lambda: gw.scheduler.snapshot()["active"] == 1))
        time.sleep(0.3)  # let some frames flow first

        status, _, raw = self._post(gw, "/stop", {})
        self.assertEqual(status, 200)
        stop_body = json.loads(raw)
        self.assertTrue(stop_body["cancelled"])
        self.assertEqual(stop_body["active"], 1)

        worker.join(timeout=15.0)
        self.assertFalse(worker.is_alive())
        body = result.get("body", "")
        self.assertIn("data: [DONE]", body)
        self.assertNotIn("tok9999", body)
        # No error frame: a cancellation is not a backend failure.
        self.assertNotIn("backend_error", body)

    def test_non_stream_cancel_returns_499_without_error_state(self):
        from syntara.runtime.base import GenerationCancelled

        class CancelledRuntime(FakeRuntime):
            def chat(self, body):
                raise GenerationCancelled()

        gw = HostGateway(_entry(), port=0, runtime_factory=CancelledRuntime)
        gw.start()
        self.addCleanup(gw.stop)
        status, _, raw = self._post(
            gw, "/v1/chat/completions",
            {"messages": [{"role": "user", "content": "hi"}]})
        self.assertEqual(status, 499)
        err = json.loads(raw)["error"]
        self.assertEqual(err["code"], "cancelled")
        self.assertIsNone(gw.last_error)  # cancel != failure
        status, _, _ = self._get(gw, "/health")
        self.assertEqual(status, 200)  # still ready


class _PageHandler(BaseHTTPRequestHandler):
    """One fixed HTML page for the /fetch happy-path test."""

    def log_message(self, *args):  # quiet
        pass

    def do_GET(self):  # noqa: N802
        body = (b"<html><head><title>Fake Page</title><style>x{}</style></head>"
                b"<body><h1>Hello</h1><script>alert(1)</script>"
                b"<p>Fetch &amp; extract.</p></body></html>")
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


class FetchEndpointTest(unittest.TestCase):
    """POST /fetch: the agent web_fetch tool's server side."""

    def start_gateway(self, **kw) -> HostGateway:
        gw = HostGateway(_entry(), port=0, runtime_factory=FakeRuntime, **kw)
        gw.start()
        self.addCleanup(gw.stop)
        return gw

    def start_page_server(self) -> tuple[str, threading.Thread, Any]:
        from http.server import ThreadingHTTPServer
        server = ThreadingHTTPServer(("127.0.0.1", 0), _PageHandler)
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()

        def cleanup():
            server.shutdown()
            server.server_close()
            thread.join(timeout=5.0)

        self.addCleanup(cleanup)
        return f"http://127.0.0.1:{server.server_address[1]}/", thread, server

    def post_fetch(self, gw: HostGateway, url: object,
                   headers: dict | None = None):
        data = json.dumps({"url": url}).encode()
        req = urllib.request.Request(
            gw.url + "/fetch", data=data, method="POST",
            headers={"Content-Type": "application/json", **(headers or {})})
        try:
            with urllib.request.urlopen(req, timeout=15) as resp:
                return resp.status, dict(resp.headers), resp.read()
        except urllib.error.HTTPError as exc:
            return exc.code, dict(exc.headers), exc.read()

    # -- happy path ---------------------------------------------------------

    def test_fetch_extracts_text_from_a_local_page(self):
        gw = self.start_gateway()
        page_url, _, _ = self.start_page_server()
        status, _, raw = self.post_fetch(
            gw, page_url, headers={"Origin": "http://127.0.0.1:5173"})
        self.assertEqual(status, 200)
        body = json.loads(raw)
        self.assertTrue(body["ok"])
        self.assertEqual(body["status"], 200)
        self.assertIn("text/html", body["content_type"])
        self.assertIn("Hello", body["text"])
        self.assertIn("Fetch & extract.", body["text"])
        self.assertNotIn("alert(1)", body["text"])  # script stripped
        self.assertFalse(body["truncated"])

    def test_fetch_without_origin_is_allowed_for_local_clients(self):
        # curl / the Python SDK / the desktop shell send no Origin header.
        gw = self.start_gateway()
        page_url, _, _ = self.start_page_server()
        status, _, raw = self.post_fetch(gw, page_url)
        self.assertEqual(status, 200)
        self.assertTrue(json.loads(raw)["ok"])

    # -- input validation ---------------------------------------------------

    def test_fetch_rejects_non_http_schemes(self):
        gw = self.start_gateway()
        for bad in ("file:///etc/passwd", "ftp://example.com/x",
                    "data:text/plain,hi", "not a url", ""):
            status, _, raw = self.post_fetch(gw, bad)
            self.assertEqual(status, 400, bad)
            self.assertEqual(json.loads(raw)["error"]["code"], "invalid_url")

    def test_fetch_rejects_embedded_credentials(self):
        gw = self.start_gateway()
        status, _, raw = self.post_fetch(gw, "http://user:pass@example.com/")
        self.assertEqual(status, 400)
        self.assertEqual(json.loads(raw)["error"]["code"], "invalid_url")

    def test_fetch_blocks_cloud_metadata_hosts(self):
        gw = self.start_gateway()
        status, _, raw = self.post_fetch(gw, "http://169.254.169.254/latest/meta-data/")
        self.assertEqual(status, 400)
        self.assertEqual(json.loads(raw)["error"]["code"], "blocked_url")

    def test_fetch_rejects_a_body_that_is_not_json(self):
        gw = self.start_gateway()
        req = urllib.request.Request(
            gw.url + "/fetch", data=b"not json", method="POST",
            headers={"Content-Type": "application/json"})
        try:
            with urllib.request.urlopen(req, timeout=10) as resp:
                status, raw = resp.status, resp.read()
        except urllib.error.HTTPError as exc:
            status, raw = exc.code, exc.read()
        self.assertEqual(status, 400)
        self.assertEqual(json.loads(raw)["error"]["code"], "invalid_body")

    # -- CSRF / origin guard ------------------------------------------------

    def test_fetch_rejects_browser_origins_not_on_the_allowlist(self):
        gw = self.start_gateway()
        page_url, _, _ = self.start_page_server()
        status, _, raw = self.post_fetch(
            gw, page_url, headers={"Origin": "https://evil.example"})
        self.assertEqual(status, 403)
        self.assertEqual(json.loads(raw)["error"]["code"], "origin_not_allowed")

    def test_fetch_accepts_the_configured_dev_origin(self):
        gw = self.start_gateway()
        page_url, _, _ = self.start_page_server()
        status, headers, _ = self.post_fetch(
            gw, page_url, headers={"Origin": "http://127.0.0.1:5173"})
        self.assertEqual(status, 200)
        self.assertEqual(headers.get("Access-Control-Allow-Origin"),
                         "http://127.0.0.1:5173")

    # -- upstream failures --------------------------------------------------

    def test_fetch_reports_an_unreachable_page_honestly(self):
        gw = self.start_gateway()
        # Port 1 on loopback: nothing listens there.
        status, _, raw = self.post_fetch(gw, "http://127.0.0.1:1/")
        self.assertEqual(status, 502)
        err = json.loads(raw)["error"]
        self.assertEqual(err["code"], "fetch_failed")


if __name__ == "__main__":
    unittest.main()
