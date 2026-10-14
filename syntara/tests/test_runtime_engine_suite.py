"""Tests for syntara.runtime.engine_suite (openai_server.py subprocess).

A fake gateway script (written to a temp dir) stands in for the real
c/openai_server.py so load/chat/stream/cancel/failure paths run against a
real loopback HTTP server and a real child process - no model weights, no
engine binaries, no network beyond 127.0.0.1.
"""
from __future__ import annotations

import json
import tempfile
import threading
import time
import unittest
import urllib.error
import urllib.request
from pathlib import Path

from syntara.runtime.base import (GenerationCancelled, RuntimeNotAvailable,
                                  RuntimeError as RuntimeFailure)
from syntara.runtime.engine_suite import EngineSuiteRuntime

# Behaviors the fake gateway reads from <model>/fake_behavior.json.
_FAKE_SERVER = r'''
import argparse, json, os, sys, time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

p = argparse.ArgumentParser()
p.add_argument("--model", required=True)
p.add_argument("--host", default="127.0.0.1")
p.add_argument("--port", type=int, required=True)
p.add_argument("--api-key", default="")
a = p.parse_args()

cfg = os.path.join(a.model, "fake_behavior.json")
mode = "ok"
if os.path.exists(cfg):
    mode = json.load(open(cfg, encoding="utf-8")).get("mode", "ok")

if mode == "fail-family":
    print("UnknownFamilyError: model_type 'bogus' is not supported",
          file=sys.stderr, flush=True)
    sys.exit(3)
if mode == "fail-engine":
    print("engine binary not found: No such file or directory",
          file=sys.stderr, flush=True)
    sys.exit(3)

class H(BaseHTTPRequestHandler):
    def log_message(self, *args):
        pass

    def _key_ok(self):
        return self.headers.get("Authorization", "") == "Bearer " + a.api_key

    def do_GET(self):
        if self.path == "/health":
            body = json.dumps({"status": "ok"}).encode()
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
        else:
            self.send_response(404)
            self.send_header("Content-Length", "0")
            self.end_headers()

    def do_POST(self):
        if self.path != "/v1/chat/completions":
            self.send_response(404)
            self.send_header("Content-Length", "0")
            self.end_headers()
            return
        if not self._key_ok():
            body = json.dumps({"error": "bad key"}).encode()
            self.send_response(401)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        length = int(self.headers.get("Content-Length", "0"))
        payload = json.loads(self.rfile.read(length) or b"{}")
        if payload.get("stream"):
            self.send_response(200)
            self.send_header("Content-Type", "text/event-stream")
            if mode == "stream-hold":
                # fixed length so the connection stays open without data
                self.send_header("Content-Length", "1000000")
            self.end_headers()
            if mode == "stream-hold":
                time.sleep(120)
                return
            for piece in ("hello ", "from ", "engine"):
                frame = ("data: " + json.dumps({
                    "id": "chatcmpl-fake", "object": "chat.completion.chunk",
                    "model": os.path.basename(a.model),
                    "choices": [{"index": 0,
                                 "delta": {"content": piece},
                                 "finish_reason": None}]})).encode()
                self.wfile.write(frame + b"\n\n")
            done = ("data: " + json.dumps({
                "id": "chatcmpl-fake", "object": "chat.completion.chunk",
                "model": os.path.basename(a.model),
                "choices": [{"index": 0, "delta": {}, "finish_reason": "stop"}],
                "usage": {"prompt_tokens": 2, "completion_tokens": 3,
                          "total_tokens": 5}})).encode()
            self.wfile.write(done + b"\n\n")
            self.wfile.write(b"data: [DONE]\n\n")
            self.wfile.flush()
            return
        body = json.dumps({
            "id": "chatcmpl-fake", "object": "chat.completion",
            "model": os.path.basename(a.model),
            "choices": [{"index": 0,
                         "message": {"role": "assistant",
                                     "content": "engine says hi"},
                         "finish_reason": "stop"}],
            "usage": {"prompt_tokens": 2, "completion_tokens": 4,
                      "total_tokens": 6}}).encode()
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

srv = ThreadingHTTPServer((a.host, a.port), H)
srv.daemon_threads = True
srv.serve_forever()
'''


class EngineSuiteRuntimeTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        root = Path(self.tmp.name)
        self.script = root / "openai_server.py"
        self.script.write_text(_FAKE_SERVER, encoding="utf-8")
        self.model_dir = root / "model"
        self.model_dir.mkdir()
        (self.model_dir / "config.json").write_text(
            json.dumps({"model_type": "olmoe"}), encoding="utf-8")
        self.rt = None
        self.addCleanup(self._cleanup)

    def _cleanup(self):
        if self.rt is not None:
            self.rt.unload()

    def _runtime(self, mode: str = "ok",
                 startup_timeout: float = 20.0) -> EngineSuiteRuntime:
        (self.model_dir / "fake_behavior.json").write_text(
            json.dumps({"mode": mode}), encoding="utf-8")
        self.rt = EngineSuiteRuntime(
            self.model_dir, server_script=self.script,
            startup_timeout=startup_timeout)
        return self.rt

    def test_load_health_capabilities(self):
        rt = self._runtime()
        rt.load()
        self.assertTrue(rt.loaded)
        health = rt.health()
        self.assertEqual(health["backend"], "syntara-engine-suite")
        self.assertTrue(health["loaded"])
        self.assertIsInstance(health["port"], int)
        caps = rt.capabilities()
        self.assertEqual(caps["backend"], "syntara-engine-suite")
        self.assertEqual(caps["engine_family"], "olmoe")
        self.assertTrue(caps["streaming"])
        rt.unload()
        self.assertFalse(rt.loaded)

    def test_health_before_load(self):
        rt = self._runtime()
        self.assertFalse(rt.health()["loaded"])

    def test_api_key_is_enforced_by_the_backend(self):
        rt = self._runtime()
        rt.load()
        req = urllib.request.Request(
            f"http://127.0.0.1:{rt._port}/v1/chat/completions",
            data=b"{}", method="POST",
            headers={"Content-Type": "application/json"})
        with self.assertRaises(urllib.error.HTTPError) as ctx:
            urllib.request.urlopen(req, timeout=5)
        self.assertEqual(ctx.exception.code, 401)

    def test_chat_round_trip(self):
        rt = self._runtime()
        rt.load()
        result = rt.chat({"messages": [{"role": "user", "content": "hi"}]})
        self.assertEqual(result["choices"][0]["message"]["content"],
                         "engine says hi")
        self.assertEqual(result["usage"]["total_tokens"], 6)

    def test_stream_yields_frames_until_done(self):
        rt = self._runtime()
        rt.load()
        frames = list(rt.stream({"messages": [{"role": "user",
                                               "content": "hi"}]}))
        self.assertTrue(frames)
        self.assertTrue(frames[-1].startswith(b"data: [DONE]"))
        text = "".join(
            json.loads(f[len(b"data: "):])["choices"][0]["delta"].get(
                "content", "")
            for f in frames if f != b"data: [DONE]\n\n")
        self.assertEqual(text, "hello from engine")

    def test_cancel_interrupts_a_held_stream(self):
        rt = self._runtime(mode="stream-hold")
        rt.load()
        outcomes = []

        def consume():
            try:
                list(rt.stream({"messages": [{"role": "user",
                                              "content": "hi"}]}))
                outcomes.append("completed")
            except GenerationCancelled:
                outcomes.append("cancelled")
            except Exception as exc:  # noqa: BLE001 - surfaced in assert
                outcomes.append(f"other: {type(exc).__name__}: {exc}")

        thread = threading.Thread(target=consume, daemon=True)
        thread.start()
        # give the request time to be accepted and parked in stream-hold
        deadline = time.time() + 10
        while time.time() < deadline and not outcomes:
            time.sleep(0.05)
            if rt._active:
                break
        time.sleep(0.3)
        rt.cancel()
        thread.join(timeout=10)
        self.assertFalse(thread.is_alive())
        self.assertEqual(outcomes, ["cancelled"])

    def test_family_failure_is_explained(self):
        rt = self._runtime(mode="fail-family")
        with self.assertRaises(RuntimeFailure) as ctx:
            rt.load()
        self.assertIn("does not know how to run", str(ctx.exception))
        self.assertIn("UnknownFamilyError", ctx.exception.detail)
        self.assertFalse(rt.loaded)

    def test_missing_engine_binary_is_explained(self):
        rt = self._runtime(mode="fail-engine")
        with self.assertRaises(RuntimeFailure) as ctx:
            rt.load()
        self.assertIn("engine binary", str(ctx.exception))
        self.assertIn("make", str(ctx.exception))

    def test_missing_script_is_not_available(self):
        rt = EngineSuiteRuntime(
            self.model_dir, server_script=Path(self.tmp.name) / "nope.py")
        with self.assertRaises(RuntimeNotAvailable) as ctx:
            rt.load()
        self.assertIn("SYNTARA_OPENAI_SERVER", str(ctx.exception))

    def test_directory_without_config_is_explained(self):
        bare = Path(self.tmp.name) / "bare"
        bare.mkdir()
        rt = EngineSuiteRuntime(bare, server_script=self.script)
        with self.assertRaises(RuntimeFailure) as ctx:
            rt.load()
        self.assertIn("config.json", str(ctx.exception))

    def test_socket_timeout_is_armed_for_cancel_responsiveness(self):
        rt = self._runtime()
        rt.load()
        # _post arms a short recv timeout on the response socket
        import urllib.request as rq
        req = rq.Request(
            f"http://127.0.0.1:{rt._port}/v1/chat/completions",
            data=b'{"stream": false}', method="POST",
            headers={"Content-Type": "application/json",
                     "Authorization": f"Bearer {rt._api_key}"})
        resp = rq.urlopen(req, timeout=5)
        from syntara.runtime.engine_suite import _arm_cancel_reads
        _arm_cancel_reads(resp)
        timeout = resp.fp.raw._sock.gettimeout()
        self.assertIsNotNone(timeout)
        self.assertGreater(timeout, 0)
        self.assertLessEqual(timeout, 2.0)
        resp.close()


if __name__ == "__main__":
    unittest.main()
