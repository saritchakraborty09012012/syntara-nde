"""A small mock of the Syntara local gateway for SDK/CLI tests.

Mirrors the real surface (openai_server.py): /health, /profile, /experts,
/v1/models, /v1/models/{id}, /v1/chat/completions (stream and not),
/v1/completions, /v1/brio and /v1/messages.
"""
from __future__ import annotations

import json
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer


class MockGateway(BaseHTTPRequestHandler):
    server_version = "MockGateway/1.0"

    def log_message(self, *args):  # keep test output clean
        pass

    def _send(self, status, obj=None, *, raw=None, headers=None):
        payload = raw if raw is not None else json.dumps(obj).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(payload)))
        for key, value in (headers or {}).items():
            self.send_header(key, value)
        self.end_headers()
        self.wfile.write(payload)

    def _not_found(self):
        self._send(404, {"error": {"message": "Not found.", "type": "invalid_request_error",
                                   "code": "not_found"}})

    def do_GET(self):
        path = self.path.split("?", 1)[0]
        if path == "/health":
            self._send(200, {"status": "ok",
                             "scheduler": {"active": 1, "queued": 0, "admitted": 3},
                             "hwinfo": {"cpu": "mock-cpu", "gpu": "none", "ram_avail_gb": 16}})
        elif path == "/profile":
            self._send(200, {"seq": 2, "turns": [{"wall_s": 1.5, "prompt_tokens": 12,
                                                  "completion_tokens": 8}]})
        elif path == "/experts":
            self._send(200, {"rows": 1, "cols": 2, "map": "..", "hits": "", "seq": 0})
        elif path == "/v1/models":
            self._send(200, {"object": "list", "data": [
                {"id": "mock-model", "object": "model", "created": 1234, "owned_by": "syntara"}]})
        elif path.startswith("/v1/models/"):
            model_id = path[len("/v1/models/"):]
            if model_id == "mock-model":
                self._send(200, {"id": "mock-model", "object": "model",
                                 "created": 1234, "owned_by": "syntara"})
            else:
                self._send(404, {"error": {
                    "message": f"The model `{model_id}` does not exist.",
                    "type": "invalid_request_error", "code": "model_not_found"}})
        else:
            self._not_found()

    def do_POST(self):
        path = self.path.split("?", 1)[0]
        length = int(self.headers.get("Content-Length", "0"))
        body = json.loads(self.rfile.read(length)) if length else {}
        if path == "/v1/chat/completions":
            self._chat(body)
        elif path == "/v1/completions":
            self._send(200, {"choices": [{"text": "completion-ok"}],
                             "usage": {"total_tokens": 3}})
        elif path == "/v1/brio":
            options = body.get("options", ["a"])
            self._send(200, {"answer": options[0], "entropy": 0.5, "normalize": "mean",
                             "choices": [{"option": o, "p": 1.0 / len(options), "logprob": -0.1,
                                          "mean_logprob": -0.1, "tokens": 1} for o in options],
                             "usage": {"prompt_tokens": 5, "completion_tokens": 0,
                                       "read_tokens": 4, "total_tokens": 9}})
        elif path == "/v1/messages":
            self._send(200, {"id": "msg_x", "type": "message", "role": "assistant",
                             "content": [{"type": "text", "text": "anthropic-ok"}]})
        else:
            self._not_found()

    def _chat(self, body):
        if body.get("model") != "mock-model":
            self._send(404, {"error": {"message": f"The model `{body.get('model')}` does not exist.",
                                       "type": "invalid_request_error",
                                       "code": "model_not_found"}})
            return
        messages = body.get("messages", [])
        last = messages[-1] if messages else {}
        content = last.get("content") or ""
        if not isinstance(content, str):
            content = json.dumps(content)
        has_tool = any(m.get("role") == "tool" for m in messages)
        wants_tool = "call echo" in content
        source_text = next((m.get("content") for m in messages
                            if m.get("role") == "user" and isinstance(m.get("content"), str)),
                           content)
        is_stream = body.get("stream", False)
        if wants_tool and not has_tool:
            tool_delta = {"tool_calls": [{"id": "call_1", "type": "function", "function": {
                "name": "echo", "arguments": json.dumps({"text": "hi"})}}]}
            if is_stream:
                frames = [
                    {"id": "c1", "choices": [{"index": 0, "delta": tool_delta}]},
                    {"id": "c2", "choices": [{"index": 0, "delta": {},
                                              "finish_reason": "tool_calls"}]},
                    {"id": "c3", "choices": [], "usage": {"prompt_tokens": 10,
                                                          "completion_tokens": 2,
                                                          "total_tokens": 12}},
                ]
                raw = "".join(f"data: {json.dumps(f)}\n\n" for f in frames) + "data: [DONE]\n\n"
                self._send(200, raw=raw.encode(), headers={"x-request-id": "req_mock"})
            else:
                self._send(200, {"id": "chatcmpl", "object": "chat.completion", "choices": [{
                    "index": 0, "message": {"role": "assistant", "content": None,
                                            "tool_calls": [{"id": "call_1", "type": "function",
                                                            "function": {"name": "echo",
                                                                         "arguments": json.dumps(
                                                                             {"text": "hi"})}}]},
                    "finish_reason": "tool_calls"}],
                    "usage": {"prompt_tokens": 10, "completion_tokens": 2, "total_tokens": 12}})
            return
        answer = f"echo:{source_text}" if has_tool else f"answer:{content}"
        if is_stream:
            frames = [
                {"id": "c1", "choices": [{"index": 0, "delta": {"content": "answer:"}}]},
                {"id": "c2", "choices": [{"index": 0, "delta": {"content": content}}]},
                {"id": "c3", "choices": [{"index": 0, "delta": {},
                                          "finish_reason": "stop"}],
                 "usage": {"prompt_tokens": 6, "completion_tokens": 3, "total_tokens": 9}},
            ]
            raw = "".join(f"data: {json.dumps(f)}\n\n" for f in frames) + "data: [DONE]\n\n"
            self._send(200, raw=raw.encode(), headers={"x-request-id": "req_mock"})
        else:
            self._send(200, {"id": "chatcmpl", "object": "chat.completion", "choices": [{
                "index": 0, "message": {"role": "assistant", "content": answer},
                "finish_reason": "stop"}],
                "usage": {"prompt_tokens": 6, "completion_tokens": 3, "total_tokens": 9}})


def start_gateway():
    """Start a mock gateway on an ephemeral port; returns (httpd, base_url)."""
    httpd = ThreadingHTTPServer(("127.0.0.1", 0), MockGateway)
    thread = threading.Thread(target=httpd.serve_forever, daemon=True)
    thread.start()
    port = httpd.server_address[1]
    return httpd, f"http://127.0.0.1:{port}"