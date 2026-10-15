"""Tests for the LittleBit-style compression subsystem.

Covers: BPW math, Dual-SVID factorization, binary packing, the factorized
forward contract, SmoothSign gradients, artifact integrity (checksum
tamper, atomic publish), pipeline end-to-end on a tiny local checkpoint
(transformers-gated), routing selection, and inspect-marker detection.

Torch-dependent tests skip cleanly when torch is not installed; the
pipeline E2E additionally skips without transformers.
"""
from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path

from syntara.compress import artifact as art
from syntara.compress.littlebit_core import (bpw_for_rank, dual_svid_init,
                                             effective_weight,
                                             factorize_matrix,
                                             forward_factorized,
                                             pack_binary, rank_for_bpw,
                                             unpack_binary)

try:
    import torch
    HAS_TORCH = True
except ImportError:  # pragma: no cover - env dependent
    HAS_TORCH = False

try:
    import transformers  # noqa: F401
    HAS_TF = True
except ImportError:  # pragma: no cover
    HAS_TF = False


class BpwMathTest(unittest.TestCase):
    def test_residual_doubles_cost(self):
        a = bpw_for_rank(1024, 1024, 128, residual=False)
        b = bpw_for_rank(1024, 1024, 128, residual=True)
        self.assertAlmostEqual(b, 2 * a, places=12)

    def test_rank_for_bpw_rounds_down_to_multiple(self):
        r = rank_for_bpw(1024, 1024, 0.55, residual=True)
        self.assertIsNotNone(r)
        self.assertEqual(r % 8, 0)
        # achieved bpw must be <= target (rank rounded down)
        self.assertLessEqual(bpw_for_rank(1024, 1024, r,
                                          residual=True), 0.55)

    def test_unattainable_target_returns_none_or_min(self):
        # 8x8 matrix: FP16 scale overhead alone is ~12+ bpw
        result = rank_for_bpw(8, 8, 0.5, residual=True)
        self.assertIsNone(result)

    def test_bpw_increases_with_rank(self):
        # higher rank = more latent bits stored = higher bpw
        r1, r2 = 64, 256
        self.assertGreater(bpw_for_rank(2048, 2048, r2, residual=True),
                           bpw_for_rank(2048, 2048, r1, residual=True))


@unittest.skipUnless(HAS_TORCH, "torch not installed")
class FactorizationTest(unittest.TestCase):
    def setUp(self):
        torch.manual_seed(0)

    def test_qat_reduces_reconstruction_error(self):
        # Dual-SVID init is lossy pre-training (the paper relies on QAT);
        # SmoothSign calibration must substantially shrink the error.
        from syntara.compress.qat import calibrate_weight
        d_out, d_in, true_rank = 64, 48, 8
        a = torch.randn(d_out, true_rank)
        b = torch.randn(d_in, true_rank)
        w = a @ b.t()
        w_norm = float(torch.linalg.norm(w))
        init = dual_svid_init(w, true_rank, residual=False)
        result = calibrate_weight(w, rank=true_rank, residual=False,
                                  steps=400, lr=1e-2)
        w_hat = effective_weight(result["u_sign"], result["v_sign"],
                                 result["h"], result["g"], result["ell"])
        final = float(torch.linalg.norm(w - w_hat) / w_norm)
        self.assertTrue(result["qat"]["performed"])
        self.assertLess(final, init["init_rel_error"],
                        f"QAT did not improve: {final} vs "
                        f"{init['init_rel_error']}")
        self.assertLess(final, 0.9,
                        f"post-QAT rel error still high: {final}")

    def test_residual_qat_path_beats_its_init(self):
        from syntara.compress.qat import calibrate_weight
        torch.manual_seed(1)
        w = torch.randn(96, 96)
        w_norm = float(torch.linalg.norm(w))
        result = calibrate_weight(w, rank=16, residual=True,
                                  steps=400, lr=1e-2)
        w_hat = effective_weight(result["u_sign"], result["v_sign"],
                                 result["h"], result["g"], result["ell"])
        w_hat_r = effective_weight(result["res_u_sign"],
                                   result["res_v_sign"], result["res_h"],
                                   result["res_g"], result["res_ell"])
        final = float(torch.linalg.norm(w - w_hat - w_hat_r) / w_norm)
        self.assertLess(final, result["init_rel_error"],
                        f"residual QAT did not improve: {final} vs "
                        f"{result['init_rel_error']}")

    def test_forward_matches_effective_weight(self):
        torch.manual_seed(2)
        d_out, d_in, rank = 32, 24, 8
        w = torch.randn(d_out, d_in)
        init = dual_svid_init(w, rank, residual=False)
        x = torch.randn(5, d_in)
        y_fact = forward_factorized(x, init["u_sign"].float(),
                                    init["v_sign"].float(), init["h"],
                                    init["g"], init["ell"])
        w_hat = effective_weight(init["u_sign"], init["v_sign"],
                                 init["h"], init["g"], init["ell"])
        y_dense = x @ w_hat.t()
        self.assertTrue(torch.allclose(y_fact, y_dense, atol=1e-4),
                        f"max diff {(y_fact - y_dense).abs().max()}")

    def test_pack_unpack_roundtrip(self):
        sign = torch.randint(0, 2, (13, 9), dtype=torch.int64) * 2 - 1
        packed = pack_binary(sign)
        self.assertEqual(packed.dtype, torch.uint8)
        self.assertEqual(packed.numel(), (13 * 9 + 7) // 8)
        restored = unpack_binary(packed, (13, 9))
        self.assertTrue(torch.equal(restored, sign.float()))

    def test_sign_values_are_pm_one(self):
        init = dual_svid_init(torch.randn(16, 16), 4, residual=False)
        vals = set(init["u_sign"].unique().tolist())
        self.assertTrue(vals <= {-1, 1})

    def test_factorize_matrix_bpw_accounting(self):
        w = torch.randn(256, 256)
        result = factorize_matrix(w, bpw=0.75, residual=True)
        self.assertIsNotNone(result)
        self.assertLessEqual(result["bpw"], 0.75)
        self.assertEqual(result["rank"] % 8, 0)

    def test_smoothsign_forward_and_backward(self):
        from syntara.compress.littlebit_core import smooth_sign
        x = torch.tensor([-2.0, -0.01, 0.0, 0.01, 2.0],
                         requires_grad=True)
        y = smooth_sign(x)
        self.assertTrue(torch.equal(y, torch.tensor([-1., -1., 1., 1., 1.])))
        y.sum().backward()
        # backward rule is the proxy tanh(k*x) itself (paper Sec. 4.1):
        # saturated to +-1 away from 0, ~k*x near 0
        expected = torch.tanh(100.0 * x.detach())
        self.assertTrue(torch.allclose(x.grad, expected, atol=1e-6),
                        f"{x.grad} vs {expected}")
        self.assertAlmostEqual(float(x.grad[0]), -1.0, places=5)
        self.assertAlmostEqual(float(x.grad[-1]), 1.0, places=5)
        self.assertLess(abs(float(x.grad[2])), 1e-6)  # grad ~ k*0 = 0


@unittest.skipUnless(HAS_TORCH and HAS_TF, "torch+transformers needed")
class TinyCheckpointPipelineTest(unittest.TestCase):
    """End-to-end: build a tiny GPT-2 checkpoint locally, compress, verify,
    load through the LittleBit runtime, and generate text."""

    @classmethod
    def setUpClass(cls):
        import shutil

        from transformers import AutoModelForCausalLM, GPT2Config, \
            GPT2TokenizerFast

        cls.tmp = tempfile.TemporaryDirectory()
        root = Path(cls.tmp.name)
        cls.source = root / "tiny-gpt2"
        cls.artifact = root / "tiny-gpt2-lb"
        config = GPT2Config(
            vocab_size=256, n_positions=64, n_embd=64, n_layer=2, n_head=2,
            bos_token_id=0, eos_token_id=1)
        model = AutoModelForCausalLM.from_config(config)
        model.save_pretrained(cls.source, safe_serialization=True)
        # minimal byte-level tokenizer (no network): map bytes to ids
        vocab = {chr(i): i for i in range(256)}
        vocab["<|eos|>"] = 0
        tok_json = {
            "version": "1.0",
            "truncation": None,
            "padding": None,
            "added_tokens": [{"id": 0, "content": "<|eos|>",
                              "single_word": False, "lstrip": False,
                              "rstrip": False, "normalized": False,
                              "special": True}],
            "normalizer": None,
            "pre_tokenizer": None,
            "post_processor": None,
            "decoder": None,
            "model": {
                "type": "BPE", "vocab": vocab, "merges": [],
                "ignore_merges": True,
            },
        }
        (cls.source / "tokenizer.json").write_text(
            json.dumps(tok_json), encoding="utf-8")
        (cls.source / "tokenizer_config.json").write_text(
            json.dumps({"tokenizer_class": "GPT2TokenizerFast",
                        "model_max_length": 64}), encoding="utf-8")
        cls._shutil = shutil

    @classmethod
    def tearDownClass(cls):
        cls.tmp.cleanup()

    def test_a_compress_b_verify_c_load_d_generate(self):
        from syntara.compress.pipeline import compress

        manifest = compress(self.source, self.artifact, bpw=2.0,
                            residual=True, min_layer_params=64)
        self.assertEqual(manifest["format"],
                         "syntara-littlebit-artifact")
        self.assertGreater(manifest["totals"]["compressed_tensors"], 0)
        # A: compressed artifacts are smaller than the dense source
        src_bytes = manifest["totals"]["source_weight_bytes"]
        art_bytes = manifest["totals"]["artifact_bytes"]
        self.assertLess(art_bytes, src_bytes)

        # B: integrity verification passes; tampering is detected
        verdict = art.verify_artifact(self.artifact, source=self.source)
        self.assertTrue(verdict["ok"], verdict)
        weights = self.artifact / manifest["files"]["weights"]
        with open(weights, "ab") as fh:
            fh.write(b"\x00")
        with self.assertRaises(art.ArtifactError):
            art.verify_artifact(self.artifact)

        # repair by re-compressing with force (resume journal must not
        # resurrect the tampered file)
        manifest = compress(self.source, self.artifact, bpw=2.0,
                            residual=True, min_layer_params=64, force=True)
        verdict = art.verify_artifact(self.artifact, source=self.source)
        self.assertTrue(verdict["ok"], verdict)

        # C/D: load through the runtime and generate deterministically
        from syntara.routing import build_runtime, inspect_path
        report = inspect_path(self.artifact)
        self.assertTrue(report["compression"]["detected"])
        self.assertTrue(report["compression"]["valid"])
        runtime = build_runtime(self.artifact)
        self.assertEqual(runtime.capabilities()["backend"], "littlebit")
        runtime.load()
        self.assertTrue(runtime.loaded)
        out = runtime.chat({"prompt": "hello", "max_tokens": 4,
                            "temperature": 0.0})
        text = out["choices"][0]["message"]["content"]
        self.assertIsInstance(text, str)
        runtime.unload()


class ArtifactUnitTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.dir = Path(self.tmp.name)
        self.addCleanup(self.tmp.cleanup)

    def _fake_manifest(self, weights_sha256="0" * 64):
        return {
            "format": "syntara-littlebit-artifact",
            "format_version": 1,
            "algorithm": "littlebit-latent-factorization",
            "method": {"qat": {"performed": False}},
            "settings": {"residual": True},
            "source": {"path": "x"},
            "tensors": [{"name": "a.weight", "action": "passthrough",
                         "keys": {"weight": "a.weight"}, "params": 4}],
            "totals": {},
            "files": {"weights": "littlebit.safetensors",
                      "weights_sha256": weights_sha256, "copied": []},
        }

    def test_load_manifest_missing_is_actionable(self):
        with self.assertRaises(art.ArtifactError) as ctx:
            art.load_manifest(self.dir)
        self.assertIn("not a published", str(ctx.exception))

    def test_publish_refuses_overwrite_without_force(self):
        ws = self.dir / "ws"
        ws.mkdir()
        (ws / art.MANIFEST_NAME).write_text(
            json.dumps(self._fake_manifest()), encoding="utf-8")
        final = self.dir / "final"
        art.publish_workspace(ws, final)
        self.assertTrue((final / art.MANIFEST_NAME).is_file())
        ws2 = self.dir / "ws2"
        ws2.mkdir()
        (ws2 / art.MANIFEST_NAME).write_text(
            json.dumps(self._fake_manifest()), encoding="utf-8")
        with self.assertRaises(art.ArtifactError):
            art.publish_workspace(ws2, final)
        art.publish_workspace(ws2, final, force=True)
        self.assertTrue((final / art.MANIFEST_NAME).is_file())

    def test_safe_relpath_rejects_traversal(self):
        self.assertTrue(art.safe_relpath("a/b.json"))
        self.assertFalse(art.safe_relpath("../evil"))
        self.assertFalse(art.safe_relpath("/abs/path"))
        self.assertFalse(art.safe_relpath(""))


class NameResolutionTest(unittest.TestCase):
    """Architecture <-> shard key mapping (checkpoints drop prefixes)."""

    def test_resolve_shard_key_handles_prefix_conventions(self):
        wm = {"h.0.attn.c_attn.weight": "model.safetensors",
              "model.layers.0.self_attn.q_proj.weight": "m.safetensors",
              "layers.1.o_proj.weight": "m.safetensors"}
        # dropped top-level prefix (GPT-2 HF layout)
        self.assertEqual(
            art.resolve_shard_key("transformer.h.0.attn.c_attn.weight", wm),
            "h.0.attn.c_attn.weight")
        # exact match
        self.assertEqual(
            art.resolve_shard_key(
                "model.layers.0.self_attn.q_proj.weight", wm),
            "model.layers.0.self_attn.q_proj.weight")
        # extra model. prefix on the architecture side
        self.assertEqual(
            art.resolve_shard_key("model.layers.1.o_proj.weight", wm),
            "layers.1.o_proj.weight")
        # no match / ambiguous match resolve to None, never a guess
        self.assertIsNone(art.resolve_shard_key("transformer.h.9.x.w", wm))

    def test_resolve_module_key_maps_shard_names_to_modules(self):
        modules = ["transformer.h.0.attn.c_attn", "transformer.wte",
                   "model.layers.0.self_attn.q_proj"]
        # prefixless shard name -> full module path
        self.assertEqual(
            art.resolve_module_key("h.0.attn.c_attn", modules),
            "transformer.h.0.attn.c_attn")
        # full param name (endswith .weight is stripped by the caller, but
        # a direct module-path match must still win)
        self.assertEqual(
            art.resolve_module_key("model.layers.0.self_attn.q_proj",
                                   modules),
            "model.layers.0.self_attn.q_proj")
        self.assertEqual(art.resolve_module_key("wte", modules),
                         "transformer.wte")
        self.assertIsNone(art.resolve_module_key("h.7.missing", modules))

    def test_resolve_rejects_ambiguous_suffix(self):
        # name ends with two different keys (".q.r" and ".y.p.q.r") and
        # its first-component strip matches nothing: resolution must
        # refuse to guess rather than pick one
        wm = {"q.r": "a", "y.p.q.r": "b"}
        self.assertIsNone(art.resolve_shard_key("m.x.y.p.q.r", wm))


class DiffusionRejectionTest(unittest.TestCase):
    def test_pipeline_layout_is_rejected_with_specific_error(self):
        from syntara.compress.pipeline import _validate_source
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        d = Path(tmp.name)
        (d / "model_index.json").write_text(json.dumps(
            {"_class_name": "StableDiffusionPipeline"}), encoding="utf-8")
        with self.assertRaises(ValueError) as ctx:
            _validate_source(d)
        self.assertIn("diffusers", str(ctx.exception).lower())

    def test_missing_config_names_hf_safetensors_requirement(self):
        from syntara.compress.pipeline import _validate_source
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        with self.assertRaises(ValueError) as ctx:
            _validate_source(Path(tmp.name))
        self.assertIn("config.json", str(ctx.exception))


class RoutingAndInspectTest(unittest.TestCase):
    def test_rank_prefers_littlebit_for_artifacts(self):
        from syntara import routing
        report = {
            "kind": "hf-checkpoint", "path": "x", "model_type": "llama",
            "compression": {"detected": True, "valid": True,
                            "label": "LittleBit 0.55 bpw",
                            "algorithm": "littlebit-latent-factorization"},
        }
        decision = routing.rank(report)
        self.assertEqual(decision["selected"], routing.RT_LITTLEBIT)
        ids = [c["id"] for c in decision["candidates"]]
        self.assertIn(routing.RT_LITTLEBIT, ids)

    def test_invalid_manifest_is_not_selected(self):
        from syntara import routing
        report = {
            "kind": "hf-checkpoint", "path": "x", "model_type": "llama",
            "compression": {"detected": True, "valid": False,
                            "error": "broken"},
        }
        decision = routing.rank(report)
        self.assertIsNone(decision["selected"])
        self.assertIn("broken", decision["error"])

    def test_inspect_detects_marker(self):
        from syntara.model_inspect import inspect_path
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        d = Path(tmp.name)
        (d / "config.json").write_text(
            json.dumps({"model_type": "llama"}), encoding="utf-8")
        # minimal valid-looking manifest + empty weights so marker parses
        (d / "syntara_littlebit.json").write_text(json.dumps({
            "format": "syntara-littlebit-artifact",
            "format_version": 1,
            "algorithm": "littlebit-latent-factorization",
            "method": {"qat": {"performed": False}},
            "settings": {"residual": True, "target_bpw": 0.55},
            "totals": {"weighted_bpw_compressed": 0.52},
            "source": {}, "tensors": [{"name": "x", "action": "passthrough",
                                       "keys": {"weight": "x"},
                                       "params": 1}],
            "files": {"weights": "littlebit.safetensors",
                      "weights_sha256": "00", "copied": []},
        }), encoding="utf-8")
        report = inspect_path(d)
        self.assertEqual(report["kind"], "hf-checkpoint")
        self.assertIn("compression", report)
        self.assertTrue(report["compression"]["detected"])
        self.assertTrue(report["compression"]["valid"])
        self.assertEqual(report["compression"]["settings"]["target_bpw"],
                         0.55)


if __name__ == "__main__":
    unittest.main()
