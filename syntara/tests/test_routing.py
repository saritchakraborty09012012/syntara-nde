"""Tests for syntara.routing (candidate ranking, discovery, forcing)."""
from __future__ import annotations

import os
import tempfile
import unittest
from pathlib import Path
from unittest import mock

from syntara.model_inspect import inspect_path
from syntara.routing import (RT_DIFFUSERS, RT_ENGINE_SUITE, RT_LLAMA,
                             RT_TRANSFORMERS, build_runtime, clear_cache,
                             discover_openai_server, load_engine_registry,
                             rank, transformers_availability)
from syntara.tests.gguf_fixtures import build_tiny_llama_gguf
from syntara.tests.model_fixtures import moe_checkpoint


class DiscoveryTest(unittest.TestCase):
    def setUp(self):
        clear_cache()
        self.addCleanup(clear_cache)

    def test_explicit_env_points_at_the_script(self):
        with tempfile.TemporaryDirectory() as tmp_str:
            tmp = Path(tmp_str)
            script = tmp / "openai_server.py"
            script.write_text("# fake\n", encoding="utf-8")
            with mock.patch.dict(os.environ,
                                 {"SYNTARA_OPENAI_SERVER": str(script)}):
                self.assertEqual(discover_openai_server(), script)
            with mock.patch.dict(os.environ,
                                 {"SYNTARA_OPENAI_SERVER": str(tmp / "no")}):
                self.assertIsNone(discover_openai_server())

    def test_repo_layout_finds_the_real_script(self):
        with mock.patch.dict(os.environ, {
                "SYNTARA_OPENAI_SERVER": "",
                "SYNTARA_ENGINE": ""}):
            found = discover_openai_server()
        # Tests run inside the repo, where c/openai_server.py exists.
        if found is not None:
            self.assertTrue(found.name == "openai_server.py")
            self.assertTrue(found.is_file())

    def test_registry_maps_engine_families(self):
        registry = load_engine_registry()
        if registry is None:
            self.skipTest("engine registry not present next to the package")
        mapping = registry["model_types"]
        self.assertIn("olmoe", mapping)
        self.assertIn("glm5_next", mapping)
        self.assertNotIn("mixtral", mapping)
        self.assertTrue(registry["path"].endswith("family_registry.py"))
        # cached: same object until clear_cache()
        self.assertIs(load_engine_registry(), registry)
        clear_cache()
        self.assertIsNot(load_engine_registry(), registry)


class RankTest(unittest.TestCase):
    def setUp(self):
        clear_cache()
        self.addCleanup(clear_cache)
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.dir = Path(self.tmp.name)

    def test_gguf_prefers_llama_cpp(self):
        gguf = self.dir / "m.gguf"
        build_tiny_llama_gguf(str(gguf))
        decision = rank(inspect_path(gguf))
        self.assertEqual(decision["candidates"][0]["id"], RT_LLAMA)
        self.assertTrue(decision["candidates"][0]["primary"])
        if decision["selected"] is not None:
            self.assertEqual(decision["selected"], RT_LLAMA)
        else:
            self.assertIn("llama.cpp", decision["error"])

    def test_owned_checkpoint_prefers_engine_suite(self):
        model = moe_checkpoint(self.dir / "olmoe")
        decision = rank(inspect_path(model))
        first = decision["candidates"][0]
        self.assertEqual(first["id"], RT_ENGINE_SUITE)
        self.assertIn("engine family: olmoe", first["detail"])
        # the engine gateway script ships in this repo, so it is available
        self.assertTrue(first["available"])
        self.assertEqual(decision["selected"], RT_ENGINE_SUITE)
        # fallback sits below the primary, not gone
        ids = [c["id"] for c in decision["candidates"]]
        self.assertIn(RT_TRANSFORMERS, ids)

    def test_unowned_checkpoint_reasons_honestly(self):
        model = moe_checkpoint(self.dir / "mix", model_type="mixtral",
                               arch="MixtralForCausalLM")
        decision = rank(inspect_path(model))
        engine = next(c for c in decision["candidates"]
                      if c["id"] == RT_ENGINE_SUITE)
        self.assertFalse(engine["available"])
        self.assertIn("family_registry", engine["reason"])
        tf = next(c for c in decision["candidates"] if c["id"] == RT_TRANSFORMERS)
        self.assertTrue(tf["primary"])
        ok, _ = transformers_availability()
        if ok:
            self.assertEqual(decision["selected"], RT_TRANSFORMERS)
        else:
            self.assertIsNone(decision["selected"])
            self.assertIn("family_registry", decision["error"])
            self.assertIn("pip install torch transformers", decision["error"])

    def test_diffusion_pipeline_routes_to_diffusers(self):
        from syntara.tests.model_fixtures import diffusion_dir
        pipe = diffusion_dir(self.dir / "pipe")
        decision = rank(inspect_path(pipe))
        first = decision["candidates"][0]
        self.assertEqual(first["id"], RT_DIFFUSERS)
        self.assertTrue(first["primary"])
        if not first["available"]:
            self.assertIn("pip install torch diffusers", first["reason"])
            self.assertIsNone(decision["selected"])

    def test_onnx_is_recognized_not_claimed(self):
        path = self.dir / "m.onnx"
        path.write_bytes(b"\x08" + b"\x00" * 8)
        decision = rank(inspect_path(path))
        self.assertIsNone(decision["selected"])
        self.assertIn("no ONNX execution adapter", decision["error"])
        self.assertIn("syntara convert", decision["error"])

    def test_unknown_path_actionable(self):
        decision = rank(inspect_path(self.dir / "nothing"))
        self.assertIsNone(decision["selected"])
        self.assertIn("syntara inspect", decision["error"])

    def test_env_forces_a_candidate(self):
        model = moe_checkpoint(self.dir / "olmoe2")
        report = inspect_path(model)
        with mock.patch.dict(os.environ,
                             {"SYNTARA_RUNTIME": RT_TRANSFORMERS}):
            decision = rank(report)
            self.assertEqual(decision["selected"], RT_TRANSFORMERS)

    def test_env_force_of_unknown_id_lists_candidates(self):
        model = moe_checkpoint(self.dir / "olmoe3")
        with mock.patch.dict(os.environ,
                             {"SYNTARA_RUNTIME": "not-a-runtime"}):
            decision = rank(inspect_path(model))
            self.assertIsNone(decision["selected"])
            self.assertIn("is not a known runtime", decision["error"])
            self.assertIn(RT_ENGINE_SUITE, decision["error"])


class BuildRuntimeTest(unittest.TestCase):
    def setUp(self):
        clear_cache()
        self.addCleanup(clear_cache)
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)

    def test_unknown_kind_raises_actionable_error(self):
        from syntara.runtime.base import RuntimeError as RuntimeFailure
        empty = Path(self.tmp.name) / "empty"
        empty.mkdir()
        with self.assertRaises(RuntimeFailure) as ctx:
            build_runtime(empty)
        self.assertIn("syntara inspect", str(ctx.exception))

    def test_missing_path_raises(self):
        from syntara.runtime.base import RuntimeError as RuntimeFailure
        with self.assertRaises(RuntimeFailure):
            build_runtime(Path(self.tmp.name) / "ghost")


if __name__ == "__main__":
    unittest.main()
