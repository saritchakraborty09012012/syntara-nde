"""Tests for syntara.hardware (probe) and syntara.planner (ranked plans)."""
from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

from syntara import hardware
from syntara.model_inspect import inspect_path
from syntara.planner import plan
from syntara.routing import clear_cache
from syntara.tests.model_fixtures import moe_checkpoint
from syntara.tests.gguf_fixtures import build_tiny_llama_gguf


def _hw(*, free_gb=64.0, total_gb=64.0, vram_gb=None, gpus=None):
    """An injected hardware profile (no probing in planner tests)."""
    gpu_list = gpus if gpus is not None else (
        [{"vendor": "nvidia", "name": "Fake GPU", "vram_gb": vram_gb}]
        if vram_gb is not None else [])
    return {
        "platform": {"system": "Test", "release": "1", "machine": "x64"},
        "cpu": {"arch": "x64", "name": "Test CPU", "cores_logical": 8,
                "flags": []},
        "ram": {"total_gb": total_gb, "available_gb": free_gb,
                "source": "injected"},
        "gpus": gpu_list,
        "storage": {"path": "/tmp", "free_gb": 500.0, "total_gb": 1000.0},
        "backends": {},
        "unknowns": [] if gpu_list else
        ["no GPU detected (nvidia-smi/rocm-smi not found or "
         "no device reported); CPU execution assumed"],
    }


class HardwareProbeTest(unittest.TestCase):
    def setUp(self):
        hardware.clear_cache()
        clear_cache()
        self.addCleanup(hardware.clear_cache)
        self.addCleanup(clear_cache)

    def test_probe_shape_with_honest_unknowns(self):
        profile = hardware.probe(refresh=True)
        for key in ("platform", "cpu", "ram", "gpus", "storage", "backends",
                    "unknowns", "probed_at"):
            self.assertIn(key, profile)
        self.assertGreaterEqual(profile["cpu"]["cores_logical"] or 0, 1)
        # GPU unknowns must be explicit, never invented
        if not profile["gpus"]:
            self.assertTrue(any("no GPU detected" in u
                                for u in profile["unknowns"]))
        backends = profile["backends"]
        self.assertIn("llama_cpp", backends)
        self.assertIn("engine_suite", backends)
        self.assertIn("transformers", backends)
        self.assertIn("diffusers", backends)
        self.assertIn("available", backends["engine_suite"])

    def test_probe_is_cached_then_refreshable(self):
        first = hardware.probe(refresh=True)
        second = hardware.probe()
        self.assertIs(first, second)
        third = hardware.probe(refresh=True)
        self.assertIsNot(first, third)

    def test_gpu_summary_variants(self):
        self.assertEqual(hardware.gpu_summary({"gpus": []}),
                         "none detected (CPU)")
        label = hardware.gpu_summary(
            {"gpus": [{"vendor": "nvidia", "name": "RTX", "vram_gb": 24.0}]})
        self.assertIn("RTX", label)
        self.assertIn("24.0 GB", label)
        apple = hardware.gpu_summary({"gpus": [
            {"vendor": "apple", "name": "M-series", "vram_gb": None,
             "unified_memory": True}]})
        self.assertIn("unified memory", apple)


class PlannerTest(unittest.TestCase):
    def setUp(self):
        clear_cache()
        self.addCleanup(clear_cache)
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.dir = Path(self.tmp.name)

    def _report(self, **kw):
        model = moe_checkpoint(self.dir / "m", **kw)
        return inspect_path(model)

    def test_fits_when_ram_is_plenty(self):
        result = plan(self._report(), _hw(free_gb=64.0))
        self.assertEqual(result["recommended"]["runtime"],
                         "syntara-engine-suite")
        self.assertEqual(result["recommended"]["fits_free_ram"], "yes")
        for entry in result["plans"]:
            self.assertEqual(entry["fits_free_ram"], "yes")
        self.assertFalse(any(r["id"] == "memory" for r in result["risks"]))

    def test_high_risk_when_model_exceeds_free_ram(self):
        report = self._report()
        # simulate a real-sized model (the fixture itself is kilobytes)
        report["estimates"]["ram_gb_min"] = 8.0
        result = plan(report, _hw(free_gb=0.01))
        self.assertTrue(any(r["id"] == "memory" and r["level"] == "high"
                            for r in result["risks"]))
        for entry in result["plans"]:
            self.assertEqual(entry["fits_free_ram"], "no")
        self.assertTrue(any("smaller quantization" in s
                            for s in result["suggestions"]))

    def test_unknown_free_ram_is_not_a_no(self):
        result = plan(self._report(), _hw(free_gb=None))
        for entry in result["plans"]:
            self.assertEqual(entry["fits_free_ram"], "unknown")
        self.assertIsNotNone(result["recommended"])

    def test_deterministic_for_same_inputs(self):
        hw = _hw(free_gb=32.0)
        report = self._report()
        self.assertEqual(plan(report, hw), plan(report, hw))

    def test_context_override_and_default(self):
        report = self._report()
        default = plan(report, _hw())
        self.assertEqual(default["model"]["context"], 4096)  # min(4096, 4096)
        override = plan(report, _hw(), context=2048)
        self.assertEqual(override["model"]["context"], 2048)
        self.assertEqual(override["plans"][0]["context"], 2048)

    def test_gguf_plan_prefers_llama_residency(self):
        gguf = self.dir / "tiny.gguf"
        build_tiny_llama_gguf(str(gguf))
        result = plan(inspect_path(gguf), _hw())
        llama = next(p for p in result["plans"] if p["runtime"] == "llama.cpp")
        self.assertIn("llama.cpp", llama["residency"])
        self.assertIn("f16", llama["quantization"])  # real GGUF quant info

    def test_integrity_risk_for_incomplete_download(self):
        model = moe_checkpoint(self.dir / "part",
                               missing_shards=["model.safetensors"])
        result = plan(inspect_path(model), _hw())
        self.assertTrue(any(r["id"] == "integrity" and r["level"] == "high"
                            for r in result["risks"]))

    def test_unknown_artifact_reports_error_not_a_guess(self):
        empty = self.dir / "empty"
        empty.mkdir()
        result = plan(inspect_path(empty), _hw())
        self.assertIsNone(result["recommended"])
        self.assertIn("syntara inspect", result["decision"]["error"])

    def test_hardware_and_model_facts_are_echoed(self):
        result = plan(self._report(), _hw(free_gb=12.5, total_gb=32.0))
        self.assertEqual(result["hardware"]["ram_free_gb"], 12.5)
        self.assertEqual(result["hardware"]["ram_total_gb"], 32.0)
        self.assertEqual(result["model"]["kind"], "hf-checkpoint")
        self.assertEqual(result["model"]["model_type"], "olmoe")
        self.assertTrue(result["assumptions"])

    def test_gpu_residency_when_vram_fits(self):
        result = plan(self._report(),
                      _hw(free_gb=64.0, vram_gb=24.0))
        tf = next(p for p in result["plans"] if p["runtime"] == "transformers")
        self.assertIn("GPU", tf["residency"])


if __name__ == "__main__":
    unittest.main()
