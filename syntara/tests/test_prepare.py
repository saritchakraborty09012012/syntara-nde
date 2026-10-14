"""Tests for syntara.prepare (pipeline stages, manifest, integrity)."""
from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path

from syntara.prepare import (PrepareError, load, manifest_path, prepare,
                             verify)
from syntara.routing import clear_cache
from syntara.tests.model_fixtures import moe_checkpoint


class PreparePipelineTest(unittest.TestCase):
    def setUp(self):
        clear_cache()
        self.addCleanup(clear_cache)
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        root = Path(self.tmp.name)
        self.data_dir = root / "data"
        self.source = root / "model"

    def _prepare(self, **kw):
        events = []
        manifest = prepare(self.source, data_dir=self.data_dir,
                           on_event=events.append, **kw)
        return manifest, events

    def test_missing_source_is_actionable(self):
        with self.assertRaises(PrepareError) as ctx:
            prepare(self.source, data_dir=self.data_dir)
        self.assertIn("source not found", str(ctx.exception))

    def test_convert_requires_outdir_before_any_work(self):
        moe_checkpoint(self.source)
        with self.assertRaises(PrepareError) as ctx:
            prepare(self.source, data_dir=self.data_dir, convert=True)
        self.assertIn("--outdir", str(ctx.exception))
        # fail fast: nothing was written
        self.assertFalse(manifest_path(self.source, self.data_dir).exists())

    def test_outdir_requires_convert(self):
        moe_checkpoint(self.source)
        with self.assertRaises(PrepareError) as ctx:
            prepare(self.source, data_dir=self.data_dir,
                    outdir=self.source.parent / "out")
        self.assertIn("--convert", str(ctx.exception))

    def test_outdir_must_differ_from_source(self):
        moe_checkpoint(self.source)
        with self.assertRaises(PrepareError) as ctx:
            prepare(self.source, data_dir=self.data_dir, convert=True,
                    outdir=self.source)
        self.assertIn("never modifies", str(ctx.exception))

    def test_owned_model_reaches_ready_standard(self):
        moe_checkpoint(self.source)
        manifest, events = self._prepare()
        self.assertEqual(manifest["state"], "ready_standard")
        self.assertEqual(manifest["routing"]["selected"],
                         "syntara-engine-suite")
        self.assertTrue(manifest["stages"]["inspect"]["ok"])
        self.assertTrue(manifest["stages"]["validate"]["ok"])
        skipped = manifest["stages"]["convert"]
        self.assertTrue(skipped["skipped"])
        self.assertIn("--convert", skipped["note"])
        # stage events streamed for CLI progress
        stages = [e["stage"] for e in events if e.get("type") == "stage"]
        self.assertIn("inspect", stages)
        self.assertIn("analyze", stages)
        self.assertIn("validate", stages)
        # the manifest lives under data_dir, never in the source
        mpath = manifest_path(self.source, self.data_dir)
        self.assertTrue(mpath.is_file())
        self.assertNotIn("prepare", self.source.parts)

    def test_unowned_model_is_unsupported_with_reason(self):
        moe_checkpoint(self.source, model_type="mixtral",
                       arch="MixtralForCausalLM")
        manifest, _ = self._prepare()
        self.assertEqual(manifest["state"], "unsupported")
        self.assertIsNone(manifest["routing"]["selected"])
        self.assertIn("family_registry", manifest["routing"]["error"])
        # unsupported still records integrity + plan for diagnosis
        self.assertIn("integrity", manifest)
        self.assertIn("plan", manifest)

    def test_plan_and_hardware_are_recorded(self):
        moe_checkpoint(self.source)
        manifest, _ = self._prepare()
        self.assertIn("recommended", manifest["plan"])
        self.assertIn("ram_free_gb", manifest["hardware"])
        self.assertTrue(manifest["integrity"]["meta_files"])
        meta = manifest["integrity"]["meta_files"][0]
        self.assertEqual(meta["name"], "config.json")
        self.assertEqual(len(meta["sha256"]), 64)

    def test_force_reruns_stages(self):
        moe_checkpoint(self.source, model_type="mixtral",
                       arch="MixtralForCausalLM")
        first, _ = self._prepare()
        self.assertEqual(first["state"], "unsupported")
        second, _ = self._prepare(force=True)
        self.assertEqual(second["state"], "unsupported")
        self.assertEqual(second["stages"]["validate"]["ok"], False)


class VerifyTest(unittest.TestCase):
    def setUp(self):
        clear_cache()
        self.addCleanup(clear_cache)
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        root = Path(self.tmp.name)
        self.data_dir = root / "data"
        self.source = root / "model"
        moe_checkpoint(self.source)
        self.manifest = prepare(self.source, data_dir=self.data_dir)

    def test_unchanged_source_verifies_ok(self):
        result = verify(self.manifest)
        self.assertTrue(result["ok"])
        self.assertEqual(result["drift"], [])
        self.assertEqual(result["missing"], [])

    def test_config_change_is_detected(self):
        config = self.source / "config.json"
        doc = json.loads(config.read_text(encoding="utf-8"))
        doc["torch_dtype"] = "bfloat16"
        config.write_text(json.dumps(doc), encoding="utf-8")
        result = verify(self.manifest)
        self.assertFalse(result["ok"])
        self.assertIn("config.json", result["drift"])

    def test_deleted_shard_is_missing(self):
        (self.source / "model.safetensors").unlink()
        result = verify(self.manifest)
        self.assertFalse(result["ok"])
        self.assertIn("model.safetensors", result["missing"])

    def test_load_returns_none_when_never_prepared(self):
        other = self.source.parent / "other"
        moe_checkpoint(other)
        self.assertIsNone(load(other, self.data_dir))


class CliWiringTest(unittest.TestCase):
    """The CLI commands built on the pipeline (inspect/plan/prepare)."""

    def setUp(self):
        clear_cache()
        self.addCleanup(clear_cache)
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        root = Path(self.tmp.name)
        self.data_dir = str(root / "data")
        self.model = root / "model"
        moe_checkpoint(self.model)

    def _main(self, argv):
        import contextlib
        import io

        from syntara.cli import main
        out, err = io.StringIO(), io.StringIO()
        with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
            code = main(argv)
        return code, out.getvalue(), err.getvalue()

    def test_inspect_directory_human_and_json(self):
        code, out, _ = self._main(
            ["inspect", "--data-dir", self.data_dir, str(self.model)])
        self.assertEqual(code, 0)
        self.assertIn("hf-checkpoint", out)
        self.assertIn("olmoe", out)
        code, out, _ = self._main(
            ["inspect", "--json", "--data-dir", self.data_dir,
             str(self.model)])
        self.assertEqual(code, 0)
        self.assertEqual(json.loads(out)["model_type"], "olmoe")

    def test_plan_json_and_exit_codes(self):
        code, out, _ = self._main(
            ["plan", "--json", "--data-dir", self.data_dir, str(self.model)])
        self.assertEqual(code, 0)
        doc = json.loads(out)
        self.assertEqual(doc["recommended"]["runtime"],
                         "syntara-engine-suite")
        self.assertTrue(doc["assumptions"])
        code, _, err = self._main(
            ["plan", "--data-dir", self.data_dir,
             str(self.model.parent / "missing")])
        self.assertEqual(code, 1)
        self.assertIn("path not found", err)

    def test_prepare_then_verify_cli(self):
        code, out, _ = self._main(
            ["prepare", "--data-dir", self.data_dir, str(self.model)])
        self.assertEqual(code, 0, out)
        self.assertIn("ready_standard", out)
        self.assertIn("syntara serve", out)
        code, out, _ = self._main(
            ["prepare", "--verify", "--data-dir", self.data_dir,
             str(self.model)])
        self.assertEqual(code, 0)
        self.assertIn("integrity: OK", out)

    def test_prepare_verify_without_manifest_explains(self):
        code, _, err = self._main(
            ["prepare", "--verify", "--data-dir", self.data_dir,
             str(self.model)])
        self.assertEqual(code, 1)
        self.assertIn("run `syntara prepare", err)

    def test_prepare_convert_fail_fast_exit_code(self):
        code, _, err = self._main(
            ["prepare", "--convert", "--data-dir", self.data_dir,
             str(self.model)])
        self.assertEqual(code, 2)
        self.assertIn("--outdir", err)


if __name__ == "__main__":
    unittest.main()
