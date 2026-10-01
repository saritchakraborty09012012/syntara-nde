"""Tests for syntara.gateway (loopback host) using a fake runtime.

No model binary, no subprocess, no network beyond 127.0.0.1 in-process.
The real-backend path is covered by test_runtime_llamacpp (opt-in).
"""
from __future__ import annotations

import json
import unittest
import urllib.error
import urllib.request

from syntara.gateway import HostGateway


def _entry(model_id: str = "fake-model", ctx: int = 8192) -> dict:
    return {"id": model_id, "path": "C:/nonexistent/fake.gguf",
            "mtime": 1700000000, "model": {"context_length": ctx,
                                           "architecture": "llama"}}


class FakeRuntime:
    """Implements the Runtime protocol without any real backend."""

    def __init__(self, entry: dict, *, context: int = 4096,
                 threads=None, **_kw) -> None:
        self.entry = entry
        self.context = context
        self.threads = threads
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

    def test_health_reports_ok_and_scheduler_shape(self):
        gw = self.start_gateway()
        status, _, raw = self.get(gw, "/health")
        self.assertEqual(status, 200)
        body = json.loads(raw)
        self.assertEqual(body["status"], "ok")
        self.assertEqual(body["model"], "fake-model")
        self.assertIn("scheduler", body)
        self.assertEqual(body["scheduler"]["active"], 0)
        self.assertIn("hwinfo", body)

    def test_profile_shape_and_turn_accounting(self):
        gw = self.start_gateway()
        status, _, raw = self.get(gw, "/profile")
        self.assertEqual(status, 200)
        body = json.loads(raw)
        self.assertEqual(body, {"seq": 0, "turns": []})

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

        _, headers, _ = self.get(gw, "/health",
                                 headers={"Origin": "https://evil.example"})
        self.assertIsNone(headers.get("Access-Control-Allow-Origin"))

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


if __name__ == "__main__":
    unittest.main()
