"""Tests for the gateway's /v1/images/generations path (Obj 6) + health caps."""
from __future__ import annotations

import base64
import json
import unittest
import urllib.error
import urllib.request

from syntara.gateway import HostGateway
from syntara.runtime.base import (GenerationCancelled,
                                  RuntimeError as RuntimeFailure)


def _entry(model_id: str = "img-model") -> dict:
    return {"id": model_id, "path": "C:/nonexistent/pipe",
            "mtime": 1700000000, "model": {"context_length": 77}}


class TextRuntime:
    """A chat-only runtime (no generate_image)."""

    def __init__(self, entry, *, context=4096, threads=None, **_kw):
        self.entry = entry
        self.context = context
        self._loaded = False

    def load(self):
        self._loaded = True

    def unload(self):
        self._loaded = False

    @property
    def loaded(self):
        return self._loaded

    def capabilities(self) -> dict:
        return {"backend": "text-fake", "available": True,
                "modalities": ["text-input", "text-output"],
                "images": False}

    def chat(self, body: dict) -> dict:
        return {"choices": [{"message": {"content": "text"}}]}

    def stream(self, body: dict):
        yield b"data: [DONE]\n\n"

    def health(self) -> dict:
        return {"backend": "text-fake", "loaded": self._loaded}


class ImageRuntime(TextRuntime):
    """An image-generation runtime (diffusion-shaped)."""

    def __init__(self, entry, *, context=4096, threads=None,
                 fail=None, **_kw):
        super().__init__(entry, context=context, threads=threads)
        self.fail = fail
        self.bodies: list[dict] = []

    def capabilities(self) -> dict:
        return {"backend": "image-fake", "available": True,
                "modalities": ["text-input", "image-output"],
                "images": True}

    def generate_image(self, body: dict) -> dict:
        if self.fail == "cancel":
            raise GenerationCancelled()
        if self.fail == "boom":
            raise RuntimeFailure("the pipeline exploded", detail="cuda oom")
        self.bodies.append(body)
        png = base64.b64encode(b"\x89PNG-fake").decode("ascii")
        return {"created": 1, "data": [{"b64_json": png}]}


class GatewayImagesTest(unittest.TestCase):
    def start_gateway(self, factory, **kw) -> HostGateway:
        gw = HostGateway(_entry(), port=0, runtime_factory=factory, **kw)
        gw.start()
        self.addCleanup(gw.stop)
        self.last_runtime = gw.runtime
        return gw

    def post_json(self, gw, path, body):
        data = json.dumps(body).encode()
        req = urllib.request.Request(gw.url + path, data=data, method="POST",
                                     headers={"Content-Type":
                                              "application/json"})
        try:
            with urllib.request.urlopen(req, timeout=10) as resp:
                return resp.status, dict(resp.headers), resp.read()
        except urllib.error.HTTPError as exc:
            return exc.code, dict(exc.headers), exc.read()

    def get(self, gw, path):
        with urllib.request.urlopen(gw.url + path, timeout=10) as resp:
            return resp.status, resp.read()

    def test_image_generation_round_trip(self):
        gw = self.start_gateway(ImageRuntime)
        status, _, raw = self.post_json(
            gw, "/v1/images/generations",
            {"model": "img-model", "prompt": "a red cube", "n": 1})
        self.assertEqual(status, 200)
        body = json.loads(raw)
        self.assertEqual(body["data"][0]["b64_json"],
                         base64.b64encode(b"\x89PNG-fake").decode("ascii"))
        self.assertEqual(self.last_runtime.bodies[0]["prompt"], "a red cube")
        # accounted like any other generation
        with urllib.request.urlopen(gw.url + "/profile", timeout=10) as resp:
            prof = json.loads(resp.read())
        self.assertEqual(prof["seq"], 1)

    def test_text_model_gets_honest_501(self):
        gw = self.start_gateway(TextRuntime)
        status, _, raw = self.post_json(
            gw, "/v1/images/generations", {"prompt": "x"})
        self.assertEqual(status, 501)
        err = json.loads(raw)["error"]
        self.assertIn("text model", err["message"])
        self.assertIn("diffusion", err["message"])
        self.assertEqual(err["code"], "not_implemented")

    def test_backend_failure_is_502_with_detail(self):
        gw = self.start_gateway(lambda entry, **kw: ImageRuntime(
            entry, fail="boom", **kw))
        status, _, raw = self.post_json(
            gw, "/v1/images/generations", {"prompt": "x"})
        self.assertEqual(status, 502)
        err = json.loads(raw)["error"]
        self.assertIn("pipeline exploded", err["message"])
        self.assertIn("cuda oom", err.get("detail", ""))

    def test_cancelled_generation_is_499_not_500(self):
        gw = self.start_gateway(lambda entry, **kw: ImageRuntime(
            entry, fail="cancel", **kw))
        status, _, raw = self.post_json(
            gw, "/v1/images/generations", {"prompt": "x"})
        self.assertEqual(status, 499)
        self.assertIn("cancelled", json.loads(raw)["error"]["message"])

    def test_invalid_body_is_400(self):
        gw = self.start_gateway(ImageRuntime)
        status, _, raw = self.post_json(
            gw, "/v1/images/generations", ["not", "an", "object"])
        self.assertEqual(status, 400)

    def test_health_advertises_capabilities(self):
        for factory, backend in ((ImageRuntime, "image-fake"),
                                 (TextRuntime, "text-fake")):
            gw = self.start_gateway(factory)
            status, raw = self.get(gw, "/health")
            self.assertEqual(status, 200)
            caps = json.loads(raw)["capabilities"]
            self.assertEqual(caps["backend"], backend)
            self.assertIn("modalities", caps)


if __name__ == "__main__":
    unittest.main()
