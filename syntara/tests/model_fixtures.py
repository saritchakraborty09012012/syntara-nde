"""Tiny safetensors/HF fixtures for inspection, routing and prepare tests.

Stdlib-only, bounded, and never downloads anything: a real safetensors
header (8-byte length prefix + JSON) with zero-filled payloads, so the
metadata readers under test see byte-accurate files.
"""
from __future__ import annotations

import json
import struct
from pathlib import Path
from typing import Any, Iterable

_DTYPE_BITS = {"F16": 16, "F32": 32, "I32": 32, "I64": 64, "BOOL": 8,
               "U8": 8}


def tensor_nbytes(shape: Iterable[int], dtype: str) -> int:
    count = 1
    for dim in shape:
        count *= dim
    return count * _DTYPE_BITS.get(dtype, 16) // 8


def write_safetensors(path: Path,
                      tensors: dict[str, tuple[list[int], str]]) -> int:
    """Write a real safetensors shard (zero payloads); returns payload bytes."""
    header: dict[str, Any] = {}
    offset = 0
    for name, (shape, dtype) in tensors.items():
        nbytes = tensor_nbytes(shape, dtype)
        header[name] = {"dtype": dtype, "shape": shape,
                        "data_offsets": [offset, offset + nbytes]}
        offset += nbytes
    blob = json.dumps(header).encode("utf-8")
    pad = (8 - len(blob) % 8) % 8
    with open(path, "wb") as fh:
        fh.write(struct.pack("<Q", len(blob) + pad))
        fh.write(blob)
        fh.write(b" " * pad)
        for name, (shape, dtype) in tensors.items():
            fh.write(b"\x00" * tensor_nbytes(shape, dtype))
    return offset


def moe_config(model_type: str = "olmoe",
               arch: str = "OlmoeForCausalLM") -> dict:
    return {
        "model_type": model_type,
        "architectures": [arch],
        "hidden_size": 64,
        "num_hidden_layers": 2,
        "num_experts_per_tok": 2,
        "num_local_experts": 4,
        "max_position_embeddings": 4096,
        "torch_dtype": "float16",
    }


def moe_tensor_names(layers: int = 2, experts: int = 4) -> list[str]:
    names = ["model.embed_tokens.weight", "lm_head.weight"]
    for layer in range(layers):
        names.append(f"model.layers.{layer}.self_attn.q_proj.weight")
        for expert in range(experts):
            base = f"model.layers.{layer}.block_sparse_moe.experts.{expert}"
            names.append(f"{base}.w1.weight")
            names.append(f"{base}.w2.weight")
    return names


def moe_checkpoint(root: Path, *, model_type: str = "olmoe",
                   arch: str = "OlmoeForCausalLM", layers: int = 2,
                   experts: int = 4,
                   missing_shards: Iterable[str] = ()) -> Path:
    """A tiny HF-style MoE checkpoint directory; returns the directory."""
    root.mkdir(parents=True, exist_ok=True)
    (root / "config.json").write_text(
        json.dumps(moe_config(model_type, arch)), encoding="utf-8")
    names = moe_tensor_names(layers, experts)
    shard = "model.safetensors"
    total = write_safetensors(root / shard,
                              {n: ([8, 8], "F16") for n in names})
    (root / "model.safetensors.index.json").write_text(json.dumps({
        "metadata": {"total_size": total},
        "weight_map": {n: shard for n in names},
    }), encoding="utf-8")
    for name in missing_shards:
        (root / name).unlink(missing_ok=True)
    return root


def diffusion_dir(root: Path, *, pipeline_class: str = "TextToImagePipeline"
                  ) -> Path:
    root.mkdir(parents=True, exist_ok=True)
    (root / "model_index.json").write_text(json.dumps({
        "_class_name": pipeline_class,
        "feature_extractor": ["transformers", "CLIPImageProcessor"],
        "scheduler": ["diffusers", "PNDMScheduler"],
        "text_encoder": ["transformers", "CLIPTextModel"],
        "tokenizer": ["transformers", "CLIPTokenizer"],
        "unet": ["diffusers", "UNet2DConditionModel"],
        "vae": ["diffusers", "AutoencoderKL"],
    }), encoding="utf-8")
    write_safetensors(root / "model.safetensors",
                      {"unet.conv_in.weight": ([4, 4], "F16")})
    return root
