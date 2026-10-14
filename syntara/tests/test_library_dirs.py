"""Tests for library registration of checkpoint directories (non-GGUF)."""
from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path

from syntara.library import LibraryError, ModelLibrary
from syntara.routing import clear_cache
from syntara.tests.model_fixtures import diffusion_dir, moe_checkpoint


def _library(tmp: str) -> ModelLibrary:
    return ModelLibrary(data_dir=Path(tmp) / "data")


class DirectoryAddTest(unittest.TestCase):
    def setUp(self):
        clear_cache()
        self.addCleanup(clear_cache)
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.lib = _library(self.tmp.name)

    def test_add_checkpoint_directory_in_place(self):
        model = moe_checkpoint(self.root / "moe")
        entry = self.lib.add(model)
        self.assertEqual(entry["kind"], "hf-checkpoint")
        self.assertEqual(entry["format"], "safetensors")
        self.assertEqual(entry["model"]["architecture"], "OlmoeForCausalLM")
        self.assertEqual(entry["model"]["context_length"], 4096)
        self.assertIn("text-input", entry["modalities"])
        self.assertEqual(entry["quantization"], "float16")
        self.assertTrue(entry["data_complete"])
        self.assertFalse(entry["copied"])
        self.assertEqual(Path(entry["path"]), model.resolve())
        # resolve() accepts the directory path and the id
        self.assertEqual(self.lib.resolve(str(model))["id"], entry["id"])
        self.assertEqual(self.lib.resolve(entry["id"])["id"], entry["id"])

    def test_add_with_copy_leaves_source_alone(self):
        model = moe_checkpoint(self.root / "orig")
        entry = self.lib.add(model, copy=True)
        self.assertTrue(entry["copied"])
        self.assertEqual(Path(entry["origin"]), model.resolve())
        self.assertNotEqual(Path(entry["path"]), model.resolve())
        self.assertTrue(Path(entry["path"]).is_dir())
        self.assertTrue((Path(entry["path"]) / "config.json").is_file())
        # the original checkpoint is untouched
        self.assertTrue((model / "config.json").is_file())
        self.assertTrue((model / "model.safetensors").is_file())

    def test_re_adding_same_directory_returns_existing_entry(self):
        model = moe_checkpoint(self.root / "again")
        first = self.lib.add(model)
        second = self.lib.add(model)
        self.assertEqual(first["id"], second["id"])
        self.assertEqual(len(self.lib.list()), 1)

    def test_missing_shards_are_recorded_not_hidden(self):
        model = moe_checkpoint(self.root / "part",
                               missing_shards=["model.safetensors"])
        entry = self.lib.add(model)
        self.assertFalse(entry["data_complete"])
        self.assertTrue(any("missing shards" in w for w in entry["warnings"]))

    def test_unknown_directory_is_refused_with_reason(self):
        empty = self.root / "empty"
        empty.mkdir()
        with self.assertRaises(LibraryError) as ctx:
            self.lib.add(empty)
        message = str(ctx.exception)
        self.assertIn("cannot add", message)
        self.assertIn("config.json", message)

    def test_missing_path_message_is_stable(self):
        with self.assertRaises(LibraryError) as ctx:
            self.lib.add(self.root / "ghost")
        self.assertIn("file not found", str(ctx.exception))

    def test_onnx_file_registers_as_onnx(self):
        onnx = self.root / "m.onnx"
        onnx.write_bytes(b"\x08" + b"\x00" * 16)
        entry = self.lib.add(onnx)
        self.assertEqual(entry["kind"], "onnx")
        self.assertTrue(any("no ONNX execution adapter" in w
                            for w in entry["warnings"]))

    def test_diffusion_pipeline_registers_with_image_modality(self):
        pipe = diffusion_dir(self.root / "pipe")
        entry = self.lib.add(pipe)
        self.assertEqual(entry["kind"], "diffusion-pipeline")
        self.assertIn("image-output", entry["modalities"])

    def test_txt_file_is_refused(self):
        text = self.root / "notes.txt"
        text.write_text("hi", encoding="utf-8")
        with self.assertRaises(LibraryError) as ctx:
            self.lib.add(text)
        self.assertIn("cannot add", str(ctx.exception))


class RemoveDirectoryTest(unittest.TestCase):
    def setUp(self):
        clear_cache()
        self.addCleanup(clear_cache)
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.lib = _library(self.tmp.name)
        self.model = moe_checkpoint(self.root / "moe")
        self.entry = self.lib.add(self.model)

    def test_remove_entry_keeps_directory(self):
        result = self.lib.remove(self.entry["id"])
        self.assertEqual(result["removed"], self.entry["id"])
        self.assertFalse(result["file_deleted"])
        self.assertEqual(self.lib.list(), [])
        self.assertTrue(self.model.is_dir())  # never deleted

    def test_remove_refuses_to_delete_a_directory(self):
        with self.assertRaises(LibraryError) as ctx:
            self.lib.remove(self.entry["id"], delete_file=True)
        self.assertIn("directory", str(ctx.exception))
        # entry still present after the refusal
        self.assertEqual(len(self.lib.list()), 1)
        self.assertTrue(self.model.is_dir())


if __name__ == "__main__":
    unittest.main()
