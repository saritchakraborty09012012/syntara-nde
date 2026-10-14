"""Metadata-only inspection of local model artifacts (AGENTS §9/§15).

Tells Syntara what a path *actually is* from real metadata - GGUF headers,
``config.json``, safetensors shard indexes, ``model_index.json`` - and never
from the filename, never by executing model code, and never by downloading
anything (AGENTS §15: a name match is not a compatibility verdict).

Everything here is stdlib-only and bounded (AGENTS §58): shard headers are
read through a fixed-size prefix, JSON documents through a size cap, and
multi-gigabyte tensor data is never touched.
"""
from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any, Iterable

# Kinds: what the artifact is, structurally.
KIND_GGUF = "gguf-file"
KIND_HF = "hf-checkpoint"
KIND_DIFFUSION = "diffusion-pipeline"
KIND_ONNX = "onnx"
KIND_UNKNOWN = "unknown"

# Refuse to buffer a shard header larger than this; real headers are far
# smaller (a few MiB even for very wide models).
HEADER_LEN_MAX = 32 << 20
# Cap for small JSON sidecars (config.json, model_index.json, *.index.json).
SIDECAR_MAX = 64 << 20

# Diffusion pipeline class -> output/input modalities, from the class names
# the pipeline file declares. Conservative: only these classes claim a modality.
_DIFFUSION_CLASSES = {
    "TextToVideoSDPipeline": ["text-input", "video-output"],
    "TextToImagePipeline": ["text-input", "image-output"],
    "StableDiffusionPipeline": ["text-input", "image-output"],
    "StableDiffusionXLPipeline": ["text-input", "image-output"],
    "StableDiffusion3Pipeline": ["text-input", "image-output"],
    "StableDiffusionXLPipeline": ["text-input", "image-output"],
    "Img2ImgPipeline": ["image-input", "image-output"],
    "StableDiffusionImg2ImgPipeline": ["image-input", "image-output"],
    "InpaintPipeline": ["image-input", "image-output"],
    "StableDiffusionInpaintPipeline": ["image-input", "image-output"],
    "AudioLDMTextToAudio": ["text-input", "audio-output"],
    "AudioLDMPipeline": ["text-input", "audio-output"],
    "SpeechT5Pipeline": ["text-input", "audio-output"],
    "MusicgenPipeline": ["text-input", "audio-output"],
    "StableDiffusionControlNetPipeline": ["text-input", "image-input",
                                           "image-output"],
}
# Fallback for an unknown diffusion class: it is a diffusion pipeline, so it
# produces images unless its own class name says otherwise.
_DIFFUSION_DEFAULT = ["text-input", "image-output"]

# Architecture/model_type evidence for HF checkpoint input modalities.
_VISION_ARCH_MARKERS = ("Vision", "VLM", "Llava", "Image", "Clip")
_VISION_MODEL_TYPES = {
    "llava", "llava_next", "qwen2_vl", "qwen2_5_vl", "qwen2_5_omni",
    "internvl", "phi3_v", "blip2", "paligemma",
}
_AUDIO_ARCH_MARKERS = ("ForCTC", "ForAudioClassification", "Whisper",
                       "Speech2Text")
_AUDIO_MODEL_TYPES = {
    "whisper", "speecht5", "wav2vec2", "hubert", "sew", "mms",
}
_VIDEO_MODEL_TYPES = {"videomae", "video_llava"}

_LAYER_RE = re.compile(r"\.layers\.(\d+)\.")
_EXPERT_RE = re.compile(r"\.experts\.(\d+)[.]")
# Fused expert tensors some converters emit: `experts_up.3`, `gate_up_proj`...
_FUSED_EXPERT_RE = re.compile(r"\.experts?_(?:up|down|gate|gate_up)\.(\d+)[.]")


def _read_json(path: Path, *, limit: int = SIDECAR_MAX) -> Any:
    """Read a bounded JSON document; None when absent/unreadable/oversized."""
    try:
        if path.stat().st_size > limit:
            return None
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, UnicodeDecodeError, json.JSONDecodeError, ValueError):
        return None


def _dtype_bits(dtype: str | None) -> int:
    """Approximate bits per weight from a dtype name (conservative default)."""
    name = (dtype or "").lower()
    for prefix, bits in (("uint", 8), ("int", 8), ("fp8", 8), ("float8", 8),
                         ("nf4", 4), ("int4", 4), ("uint4", 4)):
        if name.startswith(prefix):
            return bits
    if name in ("f64", "float64", "double"):
        return 64
    if name in ("f32", "float32", "single"):
        return 32
    if name in ("f16", "float16", "half", "bf16", "bfloat16"):
        return 16
    return 16  # unknown-but-plausible default; always labeled as an estimate


def safetensors_header(shard: Path) -> dict[str, Any] | None:
    """The tensor map of one safetensors shard (bounded header read).

    Format: 8-byte little-endian header length, JSON header, then raw tensor
    data. Returns ``{name: {dtype, shape, nbytes}}`` or None when the shard
    is unreadable/oversized - never loads tensor data.
    """
    try:
        with open(shard, "rb") as fh:
            prefix = fh.read(8)
            if len(prefix) != 8:
                return None
            header_len = int.from_bytes(prefix, "little")
            if header_len <= 0 or header_len > HEADER_LEN_MAX:
                return None
            raw = fh.read(header_len)
        header = json.loads(raw.decode("utf-8"))
    except (OSError, UnicodeDecodeError, json.JSONDecodeError, ValueError):
        return None
    tensors: dict[str, Any] = {}
    for name, spec in header.items():
        if name == "__metadata__" or not isinstance(spec, dict):
            continue
        shape = spec.get("shape")
        dtype = spec.get("dtype")
        offsets = spec.get("data_offsets")
        nbytes = None
        if (isinstance(offsets, (list, tuple)) and len(offsets) == 2
                and isinstance(offsets[0], int) and isinstance(offsets[1], int)
                and offsets[1] >= offsets[0]):
            nbytes = offsets[1] - offsets[0]
        elif isinstance(shape, list) and shape and dtype:
            count = 1
            for dim in shape:
                if not isinstance(dim, int):
                    count = None
                    break
                count *= dim
            if count is not None:
                nbytes = count * _dtype_bits(str(dtype)) // 8
        tensors[name] = {"dtype": dtype, "shape": shape, "nbytes": nbytes}
    return tensors


def _weight_index(directory: Path) -> dict[str, Any]:
    """Tensor-name -> shard mapping plus presence/size facts, metadata only."""
    index_path = directory / "model.safetensors.index.json"
    weight_map: dict[str, str] = {}
    if index_path.is_file():
        doc = _read_json(index_path)
        raw_map = doc.get("weight_map") if isinstance(doc, dict) else None
        if isinstance(raw_map, dict):
            weight_map = {str(k): str(v) for k, v in raw_map.items()}
    shards: dict[str, int] = {}
    for shard in sorted(directory.glob("*.safetensors")):
        try:
            shards[shard.name] = shard.stat().st_size
        except OSError:
            continue
    if not weight_map:
        # No index: recover names from each shard header (bounded read).
        for name in list(shards):
            header = safetensors_header(directory / name)
            if header:
                weight_map.update({t: name for t in header})
    referenced = set(weight_map.values()) if weight_map else set(shards)
    present = sorted(name for name in referenced if name in shards)
    missing = sorted(name for name in referenced if name not in shards)
    weight_bytes = sum(shards.get(name, 0) for name in present)
    return {
        "index_path": str(index_path) if index_path.is_file() else None,
        "weight_map": weight_map,
        "shards": present,
        "missing_shards": missing,
        "weight_bytes": weight_bytes,
        "complete": not missing,
    }


def expert_inventory(tensor_names: Iterable[str],
                     sizes: dict[str, int] | None = None) -> dict[str, Any]:
    """MoE expert layout from tensor names (selective-access planning input).

    Dense layers are candidates for residency; expert tensors are the ones
    selective SSD/streaming access exists for in the C engines (tier.h).
    Counts and layer/expert indices come from names alone; byte totals are
    included only when per-tensor ``sizes`` (from shard headers) are given -
    never guessed (AGENTS §92).
    """
    per_layer: dict[int, dict[str, int]] = {}
    layer_seen: set[int] = set()
    expert_bytes = 0
    for name in tensor_names:
        layer_match = _LAYER_RE.search(name)
        if layer_match:
            layer_seen.add(int(layer_match.group(1)))
        expert_match = _EXPERT_RE.search(name) or _FUSED_EXPERT_RE.search(name)
        if layer_match and expert_match:
            layer = int(layer_match.group(1))
            slot = per_layer.setdefault(
                layer, {"experts": 0, "tensors": 0, "bytes": 0})
            slot["experts"] = max(slot["experts"],
                                  int(expert_match.group(1)) + 1)
            slot["tensors"] += 1
            if sizes and name in sizes:
                slot["bytes"] += int(sizes[name])
                expert_bytes += int(sizes[name])
    moe_layers = sorted(per_layer)
    dense_layers = sorted(layer_seen - set(moe_layers))
    return {
        "layers": len(layer_seen),
        "moe_layers": {str(k): v for k, v in sorted(per_layer.items())},
        "dense_layer_indices": dense_layers,
        "experts_per_layer": max((v["experts"] for v in per_layer.values()),
                                 default=0),
        "expert_bytes": expert_bytes if sizes is not None else None,
        "selective_access": bool(per_layer),
        "note": ("expert tensors found; engines may stream them from disk "
                 "instead of holding all experts in RAM"),
    }


def _modalities_from_config(config: dict[str, Any]) -> list[str]:
    """Input/output modality labels evidenced by config fields, not guesses."""
    labels = ["text-input", "text-output"]
    archs = [str(a) for a in (config.get("architectures") or [])
             if isinstance(a, str)]
    model_type = str(config.get("model_type") or "").lower()
    if isinstance(config.get("vision_config"), dict):
        labels.append("image-input")
    if isinstance(config.get("audio_config"), dict):
        labels.append("audio-input")
    if any(marker in arch for arch in archs for marker in _VISION_ARCH_MARKERS):
        if "image-input" not in labels:
            labels.append("image-input")
    if any(marker in arch for arch in archs for marker in _AUDIO_ARCH_MARKERS):
        if "audio-input" not in labels:
            labels.append("audio-input")
    if model_type in _VISION_MODEL_TYPES and "image-input" not in labels:
        labels.append("image-input")
    if model_type in _AUDIO_MODEL_TYPES and "audio-input" not in labels:
        labels.append("audio-input")
    if model_type in _VIDEO_MODEL_TYPES and "video-input" not in labels:
        labels.append("video-input")
    return labels


def _modalities_from_pipeline(classes: Iterable[str]) -> list[str]:
    labels: list[str] = []
    for name in classes:
        for modality in _DIFFUSION_CLASSES.get(name, ()):
            if modality not in labels:
                labels.append(modality)
    if not labels:
        labels = list(_DIFFUSION_DEFAULT)
    if "text-input" not in labels:
        labels.insert(0, "text-input")
    return labels


def _estimates(weight_bytes: int, bits_per_weight: int | None) -> dict[str, Any]:
    """Size-derived estimates, same convention as gguf_inspect (x1.25 RAM)."""
    if weight_bytes <= 0:
        return {"weight_mb": 0.0, "params_billion": None, "ram_gb_min": None}
    bits = bits_per_weight or 16
    params = weight_bytes * 8 / bits / 1e9
    return {
        "weight_mb": round(weight_bytes / 1e6, 1),
        "params_billion": round(params, 3),
        "ram_gb_min": round(weight_bytes * 1.25 / (1 << 30), 2),
    }


def _inspect_gguf(path: Path) -> dict[str, Any]:
    from .gguf_inspect import GgufError, inspect_file  # deferred import

    report: dict[str, Any] = {
        "path": str(path),
        "kind": KIND_GGUF,
        "format": "gguf",
        "architecture": None,
        "model_type": None,
        "modalities": ["text-input", "text-output"],
        "quantization": None,
        "config": {},
        "warnings": [],
    }
    try:
        gguf = inspect_file(path)
    except GgufError as exc:
        report["kind"] = KIND_UNKNOWN
        report["format"] = "unknown"
        report["warnings"].append(f"GGUF inspection failed: {exc}")
        report["estimates"] = _estimates(0, None)
        report["data_complete"] = False
        return report
    model = gguf.get("model") or {}
    tens = gguf.get("tensors") or {}
    est = gguf.get("estimates") or {}
    report["architecture"] = model.get("architecture")
    report["model_type"] = model.get("architecture")
    report["quantization"] = ", ".join(f"{k}x{v}" for k, v in
                                       (tens.get("by_type") or {}).items())
    report["config"] = {"name": model.get("name"),
                        "context_length": model.get("context_length")}
    report["estimates"] = {
        "weight_mb": est.get("weight_mb"),
        "params_billion": est.get("params_billion"),
        "ram_gb_min": est.get("ram_gb_min"),
    }
    report["data_complete"] = bool(gguf.get("data_complete"))
    report["warnings"] = list(gguf.get("warnings") or [])
    return report


def _inspect_diffusion(directory: Path) -> dict[str, Any]:
    index = _read_json(directory / "model_index.json") or {}
    components = []
    for value in index.values():
        # model_index.json entries are [library_name, class_name].
        if isinstance(value, list) and value:
            if len(value) > 1 and isinstance(value[1], str):
                components.append(str(value[1]))
            elif isinstance(value[0], str) and not str(value[0]).startswith(
                    "_"):
                components.append(str(value[0]))
    weights = _weight_index(directory)
    base = _base_report(directory, KIND_DIFFUSION, "diffusion-pipeline")
    base["format"] = "safetensors" if weights["shards"] else "unknown"
    base["architecture"] = str(index.get("_class_name") or "") or None
    base["model_type"] = None
    base["modalities"] = _modalities_from_pipeline(
        [str(index.get("_class_name") or ""), *components])
    base["config"] = {"pipeline_class": index.get("_class_name"),
                      "components": components}
    base["weights"] = {k: v for k, v in weights.items() if k != "weight_map"}
    base["estimates"] = _estimates(weights["weight_bytes"], 16)
    base["data_complete"] = weights["complete"] if weights["shards"] else None
    if not weights["shards"]:
        base["warnings"].append("no .safetensors shards found next to "
                                "model_index.json")
    return base


def _base_report(directory: Path, kind: str, fmt: str) -> dict[str, Any]:
    try:
        size = sum(f.stat().st_size for f in directory.rglob("*")
                   if f.is_file())
    except OSError:
        size = 0
    return {
        "path": str(directory),
        "kind": kind,
        "format": fmt,
        "architecture": None,
        "model_type": None,
        "modalities": [],
        "quantization": None,
        "config": {},
        "size_bytes": size,
        "warnings": [],
    }


def _inspect_hf(directory: Path) -> dict[str, Any]:
    config = _read_json(directory / "config.json")
    if not isinstance(config, dict):
        return _base_report(directory, KIND_UNKNOWN, "unknown")
    base = _base_report(directory, KIND_HF, "safetensors")
    model_type = config.get("model_type")
    archs = [str(a) for a in (config.get("architectures") or [])
             if isinstance(a, str)]
    base["model_type"] = str(model_type) if model_type else None
    base["architecture"] = archs[0] if archs else (
        str(model_type) if model_type else None)
    base["modalities"] = _modalities_from_config(config)
    weights = _weight_index(directory)
    if weights["missing_shards"] and not weights["shards"]:
        # The index references shards that are not on disk (interrupted
        # download or deletion) - report the facts, not an empty model.
        base["weights"] = {k: v for k, v in weights.items()
                           if k != "weight_map"}
        base["data_complete"] = False
        base["warnings"].append(
            "missing shards: " + ", ".join(weights["missing_shards"]))
        base["estimates"] = _estimates(0, None)
    elif not weights["shards"]:
        if list(directory.glob("*.bin")):
            base["format"] = "pytorch-bin"
            bin_bytes = sum(f.stat().st_size
                            for f in directory.glob("*.bin"))
            base["estimates"] = _estimates(bin_bytes, 16)
        else:
            base["warnings"].append("config.json present but no weight files "
                                    "(*.safetensors / *.bin) found")
            base["estimates"] = _estimates(0, None)
            base["data_complete"] = False
    else:
        base["estimates"] = _estimates(weights["weight_bytes"], 16)
        base["weights"] = {k: v for k, v in weights.items()
                           if k != "weight_map"}
        if weights["missing_shards"]:
            base["warnings"].append(
                "missing shards: " + ", ".join(weights["missing_shards"]))
            base["data_complete"] = False
        else:
            base["data_complete"] = True
    quant = config.get("quantization_config")
    if isinstance(quant, dict) and quant:
        bits = quant.get("bits")
        base["quantization"] = str(
            bits) if bits is not None else str(
            quant.get("quant_method") or "configured")
    elif str(config.get("torch_dtype") or ""):
        base["quantization"] = str(config["torch_dtype"])
    interesting = {
        key: config[key] for key in (
            "num_hidden_layers", "hidden_size", "vocab_size",
            "num_experts", "n_routed_experts", "num_experts_per_tok",
            "max_position_embeddings", "torch_dtype",
        ) if key in config
    }
    base["config"] = {**interesting, "architectures": archs}
    base["expert_inventory"] = expert_inventory(weights["weight_map"])
    return base


def _inspect_onnx(path: Path) -> dict[str, Any]:
    directory = path if path.is_dir() else path.parent
    base = _base_report(directory, KIND_ONNX, "onnx")
    try:
        size = path.stat().st_size if path.is_file() else base["size_bytes"]
    except OSError:
        size = base["size_bytes"]
    base["path"] = str(path)
    base["size_bytes"] = size
    base["estimates"] = _estimates(size, 16)
    base["modalities"] = ["text-input", "text-output"]
    base["warnings"].append(
        "ONNX graphs are detected but no ONNX execution adapter ships yet; "
        "convert to GGUF (`syntara convert`) or use a safetensors checkpoint")
    return base


def inspect_path(path: str | Path) -> dict[str, Any]:
    """Describe what ``path`` is, from its real metadata.

    Returns a JSON-serializable report: ``kind`` (structural type),
    ``format``, ``architecture``/``model_type``, ``modalities``,
    ``quantization``, size-based ``estimates`` (weights, params, RAM), a
    bounded ``config`` summary, ``warnings``, and for checkpoints a shard
    inventory plus an MoE ``expert_inventory``.
    """
    p = Path(path).expanduser()
    if p.is_file():
        if p.suffix.lower() == ".gguf":
            return _inspect_gguf(p)
        if p.suffix.lower() == ".onnx":
            return _inspect_onnx(p)
        if p.name == "config.json":
            return _inspect_hf(p.parent)
        if p.name == "model_index.json":
            return _inspect_diffusion(p.parent)
        head = b""
        try:
            with open(p, "rb") as fh:
                head = fh.read(4)
        except OSError:
            pass
        if head == b"GGUF":
            return _inspect_gguf(p)
        report = _base_report(p.parent, KIND_UNKNOWN, "unknown")
        report["path"] = str(p)
        report["warnings"].append(
            f"unrecognized file type {p.suffix or '(no extension)'}; "
            "expected a .gguf file, a model directory, or an .onnx graph")
        report["estimates"] = _estimates(0, None)
        return report
    if not p.exists():
        report = _base_report(p.parent if p.parent.exists() else p,
                              KIND_UNKNOWN, "unknown")
        report["path"] = str(p)
        report["warnings"].append("path does not exist")
        report["estimates"] = _estimates(0, None)
        return report
    if not p.is_dir():
        report = _base_report(p.parent, KIND_UNKNOWN, "unknown")
        report["path"] = str(p)
        report["warnings"].append("path is neither a file nor a directory")
        report["estimates"] = _estimates(0, None)
        return report
    if (p / "model_index.json").is_file():
        return _inspect_diffusion(p)
    if (p / "config.json").is_file():
        return _inspect_hf(p)
    onnx_files = sorted(p.glob("*.onnx"))
    if onnx_files:
        return _inspect_onnx(onnx_files[0])
    ggufs = sorted(p.glob("*.gguf"))
    if ggufs:
        return inspect_path(ggufs[0])
    report = _base_report(p, KIND_UNKNOWN, "unknown")
    report["warnings"].append(
        "no model metadata found (looked for config.json, model_index.json, "
        "*.gguf, *.onnx); pass a model file or a downloaded checkpoint "
        "directory")
    report["estimates"] = _estimates(0, None)
    return report


def is_supported_entry(report: dict[str, Any]) -> bool:
    """Whether the artifact is a shape Syntara can register in the library."""
    return report.get("kind") in (KIND_GGUF, KIND_HF, KIND_DIFFUSION, KIND_ONNX)
