"""Tests for syntara.runtime.transformers_rt (fallback adapter, mocked).

torch/transformers are optional and not installed in this environment, so
the real package paths are exercised only through controlled sys.modules
fakes (never downloaded); the not-installed path is tested for real.
"""
from __future__ import annotations

import contextlib
import json
import sys
import tempfile
import threading
import types
import unittest
from pathlib import Path
from unittest import mock

from syntara.runtime.base import (GenerationCancelled, RuntimeNotAvailable,
                                  RuntimeError as RuntimeFailure)
from syntara.runtime.transformers_rt import TransformersRuntime


class FakeTensor:
    """Shape-carrying stand-in for torch tensors (CPU-only tests)."""

    def __init__(self, data):
        self.data = list(data)

    @property
    def shape(self):
        return (len(self.data),)

    def to(self, _device):
        return self

    def __getitem__(self, idx):
        return FakeTensor(self.data[idx])


class FakeTensor2D(FakeTensor):
    def __init__(self, ids):
        super().__init__(ids)

    @property
    def shape(self):
        return (1, len(self.data))

    def __getitem__(self, idx):
        if isinstance(idx, slice):
            return FakeTensor(self.data[idx])
        return FakeTensor(self.data)  # row


class FakeTokenizer:
    chat_template = None
    pad_token_id = 0
    prompt_tokens = 3
    pieces = ("hello ", "world")

    def __call__(self, prompt, return_tensors=None):
        assert return_tensors == "pt"
        return {"input_ids": FakeTensor2D([101, 102, 103][: self.prompt_tokens])}

    def decode(self, ids, skip_special_tokens=True):
        data = getattr(ids, "data", ids)
        return "".join(self.pieces[i % len(self.pieces)] for i in data)

    def apply_chat_template(self, messages, tokenize=False,
                            add_generation_prompt=True):
        return "rendered"


class FakeModel:
    generation_config = types.SimpleNamespace(eos_token_id=2)
    on_generate = None
    last_kwargs = None

    def to(self, device):
        self.device = device
        return self

    def eval(self):
        return self

    def generate(self, **kwargs):
        FakeModel.last_kwargs = kwargs
        if FakeModel.on_generate is not None:
            FakeModel.on_generate()
        # prompt tokens + two completion tokens
        ids = [101] * 3 + [1, 2]
        return [FakeTensor(ids)]


def _fake_modules():
    torch = types.ModuleType("torch")
    torch.float16 = "f16"
    torch.bfloat16 = "bf16"
    torch.float32 = "f32"
    torch.__version__ = "0.0-fake"
    torch.cuda = types.SimpleNamespace(is_available=lambda: False,
                                       empty_cache=lambda: None)
    torch.set_num_threads = lambda n: None

    @contextlib.contextmanager
    def inference_mode():
        yield

    torch.inference_mode = inference_mode

    transformers = types.ModuleType("transformers")

    class _AutoTokenizer:
        @staticmethod
        def from_pretrained(path, **kwargs):
            _AutoTokenizer.kwargs = kwargs
            return FakeTokenizer()

    class _AutoModel:
        @staticmethod
        def from_pretrained(path, **kwargs):
            _AutoModel.kwargs = kwargs
            return FakeModel()

    class _Streamer:
        def __init__(self, tokenizer, **kwargs):
            self._pieces = list(FakeTokenizer.pieces)

        def __iter__(self):
            yield from self._pieces

    transformers.AutoTokenizer = _AutoTokenizer
    transformers.AutoModelForCausalLM = _AutoModel
    transformers.TextIteratorStreamer = _Streamer
    return torch, transformers


class TransformersRuntimeTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.model_dir = Path(self.tmp.name) / "model"
        self.model_dir.mkdir()
        (self.model_dir / "config.json").write_text(
            json.dumps({"model_type": "llama"}), encoding="utf-8")
        FakeModel.on_generate = None
        FakeModel.last_kwargs = None
        self._env = mock.patch.dict(sys.modules, {})
        self._env.start()
        self.addCleanup(self._env.stop)

    def _install_fakes(self):
        torch, transformers = _fake_modules()
        self._modules = mock.patch.dict(
            sys.modules, {"torch": torch, "transformers": transformers})
        self._modules.start()
        self.addCleanup(self._modules.stop)
        return torch, transformers

    def _runtime(self, **kw) -> TransformersRuntime:
        return TransformersRuntime(self.model_dir, **kw)

    # ------------------------------------------------------------ lifecycle

    def test_load_without_packages_is_actionable(self):
        with mock.patch.dict(sys.modules,
                             {"torch": None, "transformers": None}):
            rt = self._runtime()
            with self.assertRaises(RuntimeNotAvailable) as ctx:
                rt.load()
            self.assertIn("pip install torch transformers", str(ctx.exception))
            self.assertFalse(rt.loaded)
            caps = rt.capabilities()
            self.assertFalse(caps["available"])
            self.assertIn("pip install", caps["unavailable_reason"])

    def test_load_requires_config_json(self):
        empty = Path(self.tmp.name) / "empty"
        empty.mkdir()
        rt = TransformersRuntime(empty)
        with self.assertRaises(RuntimeFailure) as ctx:
            rt.load()
        self.assertIn("config.json", str(ctx.exception))

    def test_load_happy_path_and_local_only(self):
        self._install_fakes()
        rt = self._runtime()
        rt.load()
        self.assertTrue(rt.loaded)
        self.assertEqual(rt.health()["backend"], "transformers")
        self.assertEqual(rt.health()["device"], "cpu")
        caps = rt.capabilities()
        self.assertTrue(caps["available"])
        self.assertFalse(caps["trust_remote_code"])
        # both from_pretrained calls were offline and non-executing
        tok_kwargs = sys.modules["transformers"].AutoTokenizer.kwargs
        self.assertTrue(tok_kwargs["local_files_only"])
        self.assertFalse(tok_kwargs["trust_remote_code"])
        rt.unload()
        self.assertFalse(rt.loaded)

    def test_trust_remote_code_env_override(self):
        self._install_fakes()
        with mock.patch.dict("os.environ",
                             {"SYNTARA_TRUST_REMOTE_CODE": "1"}):
            rt = self._runtime()
            rt.load()
            self.assertTrue(rt.capabilities()["trust_remote_code"])
            self.assertTrue(
                sys.modules["transformers"].AutoTokenizer.kwargs[
                    "trust_remote_code"])

    # ----------------------------------------------------------------- chat

    def test_chat_returns_openai_shape(self):
        self._install_fakes()
        rt = self._runtime()
        rt.load()
        body = {"model": "m", "messages": [{"role": "user", "content": "hi"}],
                "max_tokens": 16, "temperature": 0.0}
        result = rt.chat(body)
        self.assertEqual(result["object"], "chat.completion")
        self.assertEqual(result["model"], "m")
        self.assertTrue(result["choices"][0]["message"]["content"])
        self.assertEqual(result["usage"]["prompt_tokens"], 3)
        self.assertEqual(result["usage"]["completion_tokens"], 2)

    def test_chat_uses_chat_template_when_present(self):
        self._install_fakes()
        rt = self._runtime()
        rt.load()
        tokenizer = rt._tokenizer
        tokenizer.chat_template = "{{ messages }}"
        calls = []
        tokenizer.apply_chat_template = lambda m, **kw: (
            calls.append(m) or "tmpl")
        rt.chat({"messages": [{"role": "user", "content": "yo"}]})
        self.assertEqual(len(calls), 1)

    def test_chat_rejects_body_without_prompt(self):
        self._install_fakes()
        rt = self._runtime()
        rt.load()
        with self.assertRaises(RuntimeFailure) as ctx:
            rt.chat({})
        self.assertIn("messages", str(ctx.exception))

    def test_prompt_longer_than_context_is_explained(self):
        self._install_fakes()
        rt = self._runtime(context=2)
        rt.load()
        with self.assertRaises(RuntimeFailure) as ctx:
            rt.chat({"prompt": "long"})
        self.assertIn("context", str(ctx.exception))

    def test_cancel_during_generate_raises_generation_cancelled(self):
        self._install_fakes()
        rt = self._runtime()
        rt.load()
        started = threading.Event()

        def slow_generate():
            started.set()
            import time
            time.sleep(0.4)

        FakeModel.on_generate = slow_generate
        result = {}

        def run():
            try:
                rt.chat({"prompt": "hi"})
                result["done"] = True
            except GenerationCancelled:
                result["cancelled"] = True

        thread = threading.Thread(target=run)
        thread.start()
        self.assertTrue(started.wait(timeout=5))
        rt.cancel()
        thread.join(timeout=5)
        self.assertFalse(thread.is_alive())
        self.assertEqual(result, {"cancelled": True})

    # --------------------------------------------------------------- stream

    def test_stream_yields_sse_frames_and_done(self):
        self._install_fakes()
        rt = self._runtime()
        rt.load()
        frames = list(rt.stream({"prompt": "hi", "model": "m"}))
        self.assertTrue(all(f.startswith(b"data: ") for f in frames))
        self.assertTrue(frames[-1].startswith(b"data: [DONE]"))
        first = json.loads(frames[0][len(b"data: "):])
        self.assertEqual(first["choices"][0]["delta"]["role"], "assistant")
        last_json = json.loads(frames[-2][len(b"data: "):])
        self.assertIn("usage", last_json)
        self.assertEqual(last_json["usage"]["prompt_tokens"], 3)


if __name__ == "__main__":
    unittest.main()
