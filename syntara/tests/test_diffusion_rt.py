"""Tests for syntara.runtime.diffusion_rt (image generation, mocked).

diffusers/torch/Pillow are optional and not installed here; the real
package paths run only through controlled sys.modules fakes. The honest
refusal paths (chat/stream on an image model) need no packages at all.
"""
from __future__ import annotations

import contextlib
import io
import json
import sys
import tempfile
import types
import unittest
from pathlib import Path
from unittest import mock

from syntara.runtime.base import (RuntimeNotAvailable,
                                  RuntimeError as RuntimeFailure)
from syntara.runtime.diffusion_rt import DiffusionRuntime, _parse_size


class FakeImage:
    def save(self, buffer, format=None):  # noqa: A002 - PIL API
        assert format == "PNG"
        buffer.write(b"\x89PNG-fake-image")


class FakePipeline:
    def __init__(self):
        self.unet = types.SimpleNamespace(
            config=types.SimpleNamespace(sample_size=64))
        self.calls = []

    def to(self, device):
        self.device = device
        return self

    def __call__(self, **kwargs):
        self.calls.append(kwargs)
        return types.SimpleNamespace(images=[FakeImage()])


def _fake_modules():
    torch = types.ModuleType("torch")
    torch.cuda = types.SimpleNamespace(is_available=lambda: False,
                                       empty_cache=lambda: None)

    @contextlib.contextmanager
    def inference_mode():
        yield

    torch.inference_mode = inference_mode

    class _Generator:
        def __init__(self, device=None):
            self.device = device
            self.seed = None

        def manual_seed(self, value):
            self.seed = value
            return self

    torch.Generator = _Generator

    diffusers = types.ModuleType("diffusers")

    class _Pipe:
        @staticmethod
        def from_pretrained(path, **kwargs):
            _Pipe.kwargs = kwargs
            _Pipe.path = path
            return FakePipeline()

    diffusers.DiffusionPipeline = _Pipe

    pil = types.ModuleType("PIL")
    pil.Image = types.SimpleNamespace  # only import-checked at load()
    return torch, diffusers, pil


class DiffusionRuntimeTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.pipe_dir = Path(self.tmp.name) / "pipe"
        self.pipe_dir.mkdir()
        (self.pipe_dir / "model_index.json").write_text(
            json.dumps({"_class_name": "TextToImagePipeline"}),
            encoding="utf-8")
        self._env = mock.patch.dict(sys.modules, {})
        self._env.start()
        self.addCleanup(self._env.stop)

    def _install_fakes(self):
        torch, diffusers, pil = _fake_modules()
        modules = mock.patch.dict(
            sys.modules, {"torch": torch, "diffusers": diffusers,
                          "PIL": pil})
        modules.start()
        self.addCleanup(modules.stop)
        return torch, diffusers

    def _runtime(self) -> DiffusionRuntime:
        return DiffusionRuntime(self.pipe_dir)

    # ------------------------------------------------------------ no packages

    def test_load_without_packages_is_actionable(self):
        with mock.patch.dict(sys.modules,
                             {"torch": None, "diffusers": None, "PIL": None}):
            rt = self._runtime()
            with self.assertRaises(RuntimeNotAvailable) as ctx:
                rt.load()
            self.assertIn("pip install torch diffusers pillow",
                          str(ctx.exception))
            caps = rt.capabilities()
            self.assertFalse(caps["available"])
            self.assertTrue(caps["images"])
            self.assertFalse(caps["chat"])

    def test_load_requires_model_index(self):
        bare = Path(self.tmp.name) / "bare"
        bare.mkdir()
        rt = DiffusionRuntime(bare)
        with self.assertRaises(RuntimeFailure) as ctx:
            rt.load()
        self.assertIn("model_index.json", str(ctx.exception))
        self.assertIn("syntara inspect", str(ctx.exception))

    def test_chat_and_stream_refuse_honestly_without_loading(self):
        rt = self._runtime()
        with self.assertRaises(RuntimeFailure) as ctx:
            rt.chat({"messages": []})
        self.assertIn("image generator", str(ctx.exception))
        with self.assertRaises(RuntimeFailure) as ctx:
            list(rt.stream({"messages": []}))  # not a generator: raises now
        self.assertIn("/v1/images/generations", str(ctx.exception))

    # -------------------------------------------------------------- faked load

    def test_load_is_offline_and_non_executing(self):
        self._install_fakes()
        rt = self._runtime()
        rt.load()
        self.assertTrue(rt.loaded)
        kwargs = sys.modules["diffusers"].DiffusionPipeline.kwargs
        self.assertTrue(kwargs["local_files_only"])
        self.assertFalse(kwargs["trust_remote_code"])
        self.assertEqual(rt.health()["device"], "cpu")
        rt.unload()
        self.assertFalse(rt.loaded)

    def test_generate_image_round_trip(self):
        self._install_fakes()
        rt = self._runtime()
        rt.load()
        result = rt.generate_image({"prompt": "a red cube", "n": 1,
                                    "steps": 4, "size": "64x64"})
        self.assertEqual(len(result["data"]), 1)
        self.assertTrue(result["data"][0]["b64_json"])
        call = rt._pipeline.calls[0]
        self.assertEqual(call["prompt"], "a red cube")
        self.assertEqual(call["width"], 64)
        self.assertEqual(call["height"], 64)
        self.assertEqual(call["num_inference_steps"], 4)

    def test_generate_image_validates_inputs(self):
        self._install_fakes()
        rt = self._runtime()
        rt.load()
        for body, fragment in (
                ({"prompt": ""}, "prompt"),
                ({"prompt": "x", "n": 0}, "'n'"),
                ({"prompt": "x", "n": 9}, "'n'"),
                ({"prompt": "x", "steps": 0}, "'steps'"),
                ({"prompt": "x", "steps": 999}, "'steps'"),
                ({"prompt": "x", "size": "99999x2"}, "out of range"),
        ):
            with self.assertRaises(RuntimeFailure) as ctx:
                rt.generate_image(body)
            self.assertIn(fragment, str(ctx.exception), body)

    def test_default_size_comes_from_unet_config(self):
        self._install_fakes()
        rt = self._runtime()
        rt.load()
        result = rt.generate_image({"prompt": "x", "steps": 2})
        call = rt._pipeline.calls[0]
        self.assertEqual((call["width"], call["height"]), (64, 64))
        self.assertIn("b64_json", result["data"][0])

    def test_seed_env_builds_generator(self):
        self._install_fakes()
        rt = self._runtime()
        rt.load()
        with mock.patch.dict("os.environ", {"SYNTARA_IMAGE_SEED": "7"}):
            rt.generate_image({"prompt": "x", "steps": 2})
        gen = rt._pipeline.calls[0]["generator"]
        self.assertEqual(gen.seed, 7)

    def test_seed_env_rejects_non_integer(self):
        self._install_fakes()
        rt = self._runtime()
        rt.load()
        with mock.patch.dict("os.environ", {"SYNTARA_IMAGE_SEED": "abc"}):
            with self.assertRaises(RuntimeFailure) as ctx:
                rt.generate_image({"prompt": "x", "steps": 2})
            self.assertIn("SYNTARA_IMAGE_SEED", str(ctx.exception))


class ParseSizeTest(unittest.TestCase):
    def test_valid_and_fallback(self):
        self.assertEqual(_parse_size("1024x768", (512, 512)), (1024, 768))
        self.assertEqual(_parse_size(None, (512, 512)), (512, 512))
        self.assertEqual(_parse_size("wide", (512, 512)), (512, 512))
        self.assertEqual(_parse_size("10X20", (1, 1)), (10, 20))

    def test_out_of_range_raises(self):
        with self.assertRaises(RuntimeFailure):
            _parse_size("3000x3000", (512, 512))
        with self.assertRaises(RuntimeFailure):
            _parse_size("0x5", (512, 512))


if __name__ == "__main__":
    unittest.main()
