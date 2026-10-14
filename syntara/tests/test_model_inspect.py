"""Tests for syntara.model_inspect (metadata-only artifact inspection)."""
from __future__ import annotations

import json
import struct
import tempfile
import unittest
from pathlib import Path

from syntara.model_inspect import (HEADER_LEN_MAX, KIND_DIFFUSION, KIND_GGUF,
                                   KIND_HF, KIND_ONNX, KIND_UNKNOWN,
                                   expert_inventory, inspect_path,
                                   is_supported_entry, safetensors_header)
from syntara.tests.model_fixtures import (diffusion_dir, moe_checkpoint,
                                          moe_tensor_names, tensor_nbytes,
                                          write_safetensors)


class SafetensorsHeaderTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.dir = Path(self.tmp.name)
        self.addCleanup(self.tmp.cleanup)

    def test_reads_tensor_map_without_payload(self):
        path = self.dir / "a.safetensors"
        write_safetensors(path, {
            "model.embed_tokens.weight": ([2, 3], "F16"),
            "lm_head.weight": ([3, 3], "F32"),
        })
        header = safetensors_header(path)
        self.assertIn("model.embed_tokens.weight", header)
        self.assertEqual(header["model.embed_tokens.weight"]["dtype"], "F16")
        self.assertEqual(header["model.embed_tokens.weight"]["shape"], [2, 3])
        self.assertEqual(header["model.embed_tokens.weight"]["nbytes"], 12)
        self.assertEqual(header["lm_head.weight"]["nbytes"], 36)
        # file = 8-byte length + padded header + zero payloads
        blob = json.dumps({
            "model.embed_tokens.weight": {"dtype": "F16", "shape": [2, 3],
                                          "data_offsets": [0, 12]},
            "lm_head.weight": {"dtype": "F32", "shape": [3, 3],
                               "data_offsets": [12, 48]},
        }).encode()
        pad = (8 - len(blob) % 8) % 8
        self.assertEqual(path.stat().st_size, 8 + len(blob) + pad + 48)

    def test_oversized_header_is_refused(self):
        path = self.dir / "big.safetensors"
        with open(path, "wb") as fh:
            fh.write(struct.pack("<Q", HEADER_LEN_MAX + 1))
            fh.write(b"{}")
        self.assertIsNone(safetensors_header(path))

    def test_truncated_file_is_none(self):
        path = self.dir / "short.safetensors"
        path.write_bytes(b"\x05\x00")
        self.assertIsNone(safetensors_header(path))

    def test_metadata_entry_is_skipped(self):
        path = self.dir / "meta.safetensors"
        blob = json.dumps({"__metadata__": {"k": "v"},
                           "w.weight": {"dtype": "F16", "shape": [2],
                                        "data_offsets": [0, 4]}}).encode()
        pad = (8 - len(blob) % 8) % 8
        with open(path, "wb") as fh:
            fh.write(struct.pack("<Q", len(blob) + pad))
            fh.write(blob)
            fh.write(b" " * pad)
            fh.write(b"\x00" * 4)
        header = safetensors_header(path)
        self.assertEqual(list(header), ["w.weight"])


class HfCheckpointTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.dir = Path(self.tmp.name)
        self.addCleanup(self.tmp.cleanup)

    def test_complete_moe_checkpoint(self):
        model = moe_checkpoint(self.dir / "moe")
        report = inspect_path(model)
        self.assertEqual(report["kind"], KIND_HF)
        self.assertEqual(report["format"], "safetensors")
        self.assertEqual(report["model_type"], "olmoe")
        self.assertEqual(report["architecture"], "OlmoeForCausalLM")
        self.assertIn("text-input", report["modalities"])
        self.assertIn("text-output", report["modalities"])
        self.assertEqual(report["quantization"], "float16")
        self.assertTrue(report["data_complete"])
        self.assertEqual(report["weights"]["shards"], ["model.safetensors"])
        # weight_bytes is the on-disk shard size (header + payload)
        self.assertEqual(
            report["weights"]["weight_bytes"],
            (model / "model.safetensors").stat().st_size)
        weight_bytes = report["weights"]["weight_bytes"]
        self.assertAlmostEqual(report["estimates"]["ram_gb_min"],
                               round(weight_bytes * 1.25 / (1 << 30), 2))

    def test_missing_shard_marks_incomplete(self):
        model = moe_checkpoint(self.dir / "moe2",
                               missing_shards=["model.safetensors"])
        report = inspect_path(model)
        self.assertFalse(report["data_complete"])
        self.assertEqual(report["weights"]["missing_shards"],
                         ["model.safetensors"])
        self.assertTrue(any("missing shards" in w
                            for w in report["warnings"]))

    def test_config_only_directory_warns(self):
        model = self.dir / "empty"
        model.mkdir()
        (model / "config.json").write_text(
            json.dumps({"model_type": "llama"}), encoding="utf-8")
        report = inspect_path(model)
        self.assertEqual(report["kind"], KIND_HF)
        self.assertTrue(any("no weight files" in w for w in report["warnings"]))
        self.assertFalse(report["data_complete"])

    def test_vision_model_reports_image_input(self):
        model = moe_checkpoint(self.dir / "vl", model_type="qwen2_vl",
                               arch="Qwen2VLForConditionalGeneration")
        report = inspect_path(model)
        self.assertIn("image-input", report["modalities"])

    def test_config_json_path_is_routed_to_hf(self):
        model = moe_checkpoint(self.dir / "m3")
        report = inspect_path(model / "config.json")
        self.assertEqual(report["kind"], KIND_HF)
        self.assertEqual(report["path"], str(model))


class DiffusionTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.dir = Path(self.tmp.name)
        self.addCleanup(self.tmp.cleanup)

    def test_text_to_image_pipeline(self):
        pipe = diffusion_dir(self.dir / "pipe")
        report = inspect_path(pipe)
        self.assertEqual(report["kind"], KIND_DIFFUSION)
        self.assertEqual(report["architecture"], "TextToImagePipeline")
        self.assertIn("text-input", report["modalities"])
        self.assertIn("image-output", report["modalities"])
        self.assertIn("CLIPTextModel", report["config"]["components"])

    def test_video_pipeline_class(self):
        pipe = diffusion_dir(self.dir / "vid",
                             pipeline_class="TextToVideoSDPipeline")
        report = inspect_path(pipe)
        self.assertIn("video-output", report["modalities"])

    def test_unknown_pipeline_class_defaults_to_image(self):
        pipe = diffusion_dir(self.dir / "unk",
                             pipeline_class="SomeFuturePipeline")
        report = inspect_path(pipe)
        self.assertIn("image-output", report["modalities"])


class OtherKindsTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.dir = Path(self.tmp.name)
        self.addCleanup(self.tmp.cleanup)

    def test_onnx_file_is_recognized_not_claimed(self):
        path = self.dir / "m.onnx"
        path.write_bytes(b"\x08" + b"\x00" * 32)
        report = inspect_path(path)
        self.assertEqual(report["kind"], KIND_ONNX)
        self.assertTrue(any("no ONNX execution adapter" in w
                            for w in report["warnings"]))

    def test_unknown_extension(self):
        path = self.dir / "notes.txt"
        path.write_text("hello", encoding="utf-8")
        report = inspect_path(path)
        self.assertEqual(report["kind"], KIND_UNKNOWN)
        self.assertTrue(report["warnings"])

    def test_missing_path(self):
        report = inspect_path(self.dir / "nope")
        self.assertEqual(report["kind"], KIND_UNKNOWN)
        self.assertIn("path does not exist", report["warnings"])

    def test_dir_of_gguf_files_falls_through(self):
        report = inspect_path(self.dir)
        self.assertEqual(report["kind"], KIND_UNKNOWN)
        self.assertTrue(any("no model metadata" in w for w in report["warnings"]))


class ExpertInventoryTest(unittest.TestCase):
    def test_counts_and_selective_access(self):
        inv = expert_inventory(moe_tensor_names(layers=2, experts=4))
        self.assertEqual(inv["layers"], 2)  # distinct layer indices seen
        self.assertEqual(inv["experts_per_layer"], 4)
        self.assertEqual(sorted(inv["moe_layers"]), ["0", "1"])
        self.assertTrue(inv["selective_access"])
        self.assertIsNone(inv["expert_bytes"])  # never guessed

    def test_dense_layers_are_reported_separately(self):
        names = ["model.layers.0.self_attn.q_proj.weight",  # dense-only layer
                 "model.layers.1.self_attn.q_proj.weight",
                 "model.layers.1.mlp.experts.0.w1.weight",
                 "model.layers.1.mlp.experts.1.w1.weight"]
        inv = expert_inventory(names)
        self.assertEqual(inv["dense_layer_indices"], [0])
        self.assertEqual(sorted(inv["moe_layers"]), ["1"])

    def test_byte_totals_only_with_sizes(self):
        names = moe_tensor_names(layers=1, experts=2)
        sizes = {n: tensor_nbytes([8, 8], "F16")
                 for n in names if ".experts." in n}
        inv = expert_inventory(names, sizes)
        self.assertEqual(inv["expert_bytes"],
                         sum(sizes.values()))

    def test_fused_expert_names_are_counted(self):
        names = ["model.layers.3.mlp.experts_up.7.weight",
                 "model.layers.3.mlp.gate_up.2.weight"]
        inv = expert_inventory(names)
        self.assertEqual(inv["experts_per_layer"], 8)
        self.assertIn("3", inv["moe_layers"])

    def test_dense_only_has_no_selective_access(self):
        inv = expert_inventory(["model.layers.0.self_attn.q_proj.weight"])
        self.assertFalse(inv["selective_access"])
        self.assertEqual(inv["experts_per_layer"], 0)


class SupportedEntryTest(unittest.TestCase):
    def test_entry_shapes(self):
        for kind, expected in ((KIND_GGUF, True), (KIND_HF, True),
                               (KIND_DIFFUSION, True), (KIND_ONNX, True),
                               (KIND_UNKNOWN, False)):
            self.assertEqual(is_supported_entry({"kind": kind}), expected,
                             kind)


if __name__ == "__main__":
    unittest.main()
