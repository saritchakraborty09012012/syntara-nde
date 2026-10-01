"""Tests for the llama.cpp runtime adapter.

Two tiers:

* transport-level tests always run (no binary needed);
* real-backend tests run only when the pinned binary is installed
  (``tools/fetch_llama_cpp.ps1`` or ``SYNTARA_LLAMA_BIN``) and are skipped
  otherwise - the suite must never download anything.

The real-backend tier drives an actual server process against the synthetic
tiny model from gguf_fixtures: spawn -> health -> chat -> stream -> unload.
"""
from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

from syntara.runtime import RuntimeNotAvailable
from syntara.runtime.llama_cpp import (
    PINNED_RELEASE,
    _translate,
    discover_binary,
)
from syntara.runtime.llama_cpp import LlamaCppRuntime
from syntara.tests.gguf_fixtures import build_tiny_llama_gguf

BINARY = discover_binary()
_SKIP = (f"backend binary not installed; run tools/fetch_llama_cpp.ps1 "
         f"or set SYNTARA_LLAMA_BIN (pinned release {PINNED_RELEASE})")


class TranslateTest(unittest.TestCase):
    def test_local_only_keys_are_translated(self):
        out = _translate({"model": "x", "messages": [],
                          "enable_thinking": True, "cache_slot": 3,
                          "max_completion_tokens": 64,
                          "stream_options": {"include_usage": True}})
        self.assertNotIn("enable_thinking", out)
        self.assertNotIn("cache_slot", out)
        self.assertEqual(out["max_tokens"], 64)
        self.assertNotIn("max_completion_tokens", out)
        self.assertEqual(out["model"], "x")

    def test_passthrough_of_openai_keys(self):
        out = _translate({"temperature": 0.2, "top_p": 0.9, "seed": 7})
        self.assertEqual(out["temperature"], 0.2)
        self.assertEqual(out["top_p"], 0.9)
        self.assertEqual(out["seed"], 7)


class AvailabilityTest(unittest.TestCase):
    def test_missing_binary_gives_install_instructions(self):
        rt = LlamaCppRuntime("C:/does/not/need/to/exist.gguf")
        rt._binary = None  # simulate a machine without the backend
        with self.assertRaises(RuntimeNotAvailable) as ctx:
            rt.load()
        message = str(ctx.exception)
        self.assertIn("fetch_llama_cpp", message)
        self.assertIn("SYNTARA_LLAMA_BIN", message)

    def test_capabilities_shape_without_binary(self):
        rt = LlamaCppRuntime("C:/does/not/exist.gguf")
        rt._binary = None
        caps = rt.capabilities()
        self.assertFalse(caps["available"])
        self.assertEqual(caps["pinned_release"], PINNED_RELEASE)
        self.assertEqual(caps["formats"], ["gguf"])


@unittest.skipUnless(BINARY, _SKIP)
class RealBackendTest(unittest.TestCase):
    """End-to-end against the real binary and the synthetic tiny model."""

    @classmethod
    def setUpClass(cls) -> None:
        cls._tmp = tempfile.TemporaryDirectory()
        cls.model_path = Path(cls._tmp.name) / "tiny-llama.gguf"
        cls.meta = build_tiny_llama_gguf(cls.model_path)
        cls.rt = LlamaCppRuntime(cls.model_path, context=256,
                                 startup_timeout=90.0)
        cls.rt.load()

    @classmethod
    def tearDownClass(cls) -> None:
        cls.rt.unload()
        cls._tmp.cleanup()

    def test_loaded_and_healthy(self):
        self.assertTrue(self.rt.loaded)
        health = self.rt.health()
        self.assertTrue(health["loaded"])
        self.assertEqual(health["backend"], "llama.cpp")

    def test_capabilities_reports_pinned_backend(self):
        caps = self.rt.capabilities()
        self.assertTrue(caps["available"])
        self.assertEqual(caps["backend"], "llama.cpp")
        self.assertEqual(caps["pinned_release"], PINNED_RELEASE)
        self.assertIn("llama-server", caps["binary"])
        self.assertTrue(caps["streaming"])

    def test_version_is_real(self):
        self.assertTrue(self.rt.version())

    def test_non_stream_chat_returns_usage(self):
        result = self.rt.chat({
            "model": "tiny",
            "messages": [{"role": "user", "content": "hi"}],
            "max_completion_tokens": 8,
        })
        self.assertIn("choices", result)
        self.assertIsInstance(result["choices"][0]["message"]["content"], str)
        self.assertIn("usage", result)
        self.assertGreater(result["usage"]["prompt_tokens"], 0)

    def test_stream_yields_sse_frames_with_done(self):
        frames = list(self.rt.stream({
            "model": "tiny",
            "messages": [{"role": "user", "content": "hi"}],
            "max_completion_tokens": 8,
            "stream": True,
        }))
        self.assertTrue(frames)
        joined = b"".join(frames)
        self.assertIn(b"data: ", joined)
        self.assertIn(b"[DONE]", joined)

    def test_non_gguf_file_rejected_before_spawn(self):
        bogus = Path(self._tmp.name) / "not.gguf"
        bogus.write_bytes(b"hello, i am not a gguf file")
        rt = LlamaCppRuntime(bogus, binary=BINARY, context=64)
        with self.assertRaises(Exception) as ctx:
            rt.load()
        self.assertIn("not a GGUF file", str(ctx.exception))
        self.assertFalse(rt.loaded)

    def test_unload_terminates_backend(self):
        # A second runtime instance keeps the class-level one untouched.
        rt = LlamaCppRuntime(self.model_path, context=128,
                             startup_timeout=90.0)
        rt.load()
        self.assertTrue(rt.loaded)
        rt.unload()
        self.assertFalse(rt.loaded)
        self.assertIsNone(rt._proc)


if __name__ == "__main__":
    unittest.main()
