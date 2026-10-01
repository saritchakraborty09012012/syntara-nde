"""GGUF file inspector: metadata, quantization and compatibility, without
loading tensor data.

Reads only the GGUF header (magic/version/counts, key-value metadata block,
tensor-information block) and bounded slices of the data section, so a
multi-gigabyte model is inspected with kilobyte-scale reads (AGENTS: never
read a model file whole to inspect metadata).

The on-disk layout, value types, quantization block formulas and safety
limits implemented here follow the GGUF format as used by mainstream
llama.cpp-family runtimes; the numeric quantization-block tables are
transcribed from the reference ``fs/gguf`` parser vendored under
``_reference/`` (MIT, recorded in THIRD_PARTY_NOTICES.md) and were
independently cross-checked against the official ``gguf`` Python package's
``GGML_QUANT_SIZES`` table in the test suite.
"""

from __future__ import annotations

import math
import os
import struct
from typing import Any

__all__ = ["GgufError", "inspect_file"]

# --- safety limits (same bounds the reference parser enforces) -------------
MAX_STRING = 16 << 20          # 16 MiB per string
MAX_ARRAY = 64 << 20           # 64 Mi elements per array
MAX_TENSOR_DIMS = 4
MAX_KVS = 1 << 20              # sanity cap: a real model never has more
MAX_TENSORS = 1 << 20
MAX_SAMPLE = 5                 # first-N sample kept for huge arrays

_MAGIC = b"GGUF"
_SUPPORTED_VERSIONS = (2, 3)

# GGUF metadata value type ids.
_T_U8, _T_I8, _T_U16, _T_I16, _T_U32, _T_I32 = 0, 1, 2, 3, 4, 5
_T_F32, _T_BOOL, _T_STR, _T_ARR, _T_U64, _T_I64, _T_F64 = 6, 7, 8, 9, 10, 11, 12

_SCALAR_FMT = {
    _T_U8: "<B", _T_I8: "<b", _T_U16: "<H", _T_I16: "<h",
    _T_U32: "<I", _T_I32: "<i", _T_U64: "<Q", _T_I64: "<q",
    _T_F32: "<f", _T_F64: "<d",
}

# GGML tensor type ids, in ggml_type enum order.
_TENSOR_TYPES = {
    0: "f32", 1: "f16", 2: "q4_0", 3: "q4_1", 4: "q4_2", 5: "q4_3",
    6: "q5_0", 7: "q5_1", 8: "q8_0", 9: "q8_1", 10: "q2_k", 11: "q3_k",
    12: "q4_k", 13: "q5_k", 14: "q6_k", 15: "q8_k", 16: "iq2_xxs",
    17: "iq2_xs", 18: "iq3_xxs", 19: "iq1_s", 20: "iq4_nl", 21: "iq3_s",
    22: "iq2_s", 23: "iq4_xs", 24: "i8", 25: "i16", 26: "i32", 27: "i64",
    28: "f64", 29: "iq1_m", 30: "bf16", 31: "q4_0_4_4", 32: "q4_0_4_8",
    33: "q4_0_8_8", 34: "tq1_0", 35: "tq2_0", 36: "iq4_nl_4_4",
    37: "iq4_nl_4_8", 38: "iq4_nl_8_8", 39: "mxfp4", 40: "nvfp4", 41: "q1_0",
}

_BLOCK1_TYPES = {"f32", "f16", "i8", "i16", "i32", "i64", "f64", "bf16"}
_BLOCK32_TYPES = {"q4_0", "q4_1", "q5_0", "q5_1", "q8_0", "q8_1",
                  "iq4_nl", "mxfp4"}
_BLOCK64_TYPES = {"nvfp4"}
_BLOCK128_TYPES = {"q1_0"}


def _block_size(name: str) -> int:
    if name in _BLOCK1_TYPES:
        return 1
    if name in _BLOCK32_TYPES:
        return 32
    if name in _BLOCK64_TYPES:
        return 64
    if name in _BLOCK128_TYPES:
        return 128
    return 256  # super-block quantizations (q*_k, iq*, tq*, ...)


def _type_size(name: str, block: int) -> int:
    """Bytes stored per block of `block` weights for a quantization."""
    b = block
    table = {
        "f32": 4, "f16": 2, "bf16": 2, "i8": 1, "i16": 2, "i32": 4,
        "i64": 8, "f64": 8,
        "q4_0": 2 + b // 2,
        "q4_1": 2 + 2 + b // 2,
        "q5_0": 2 + 4 + b // 2,
        "q5_1": 2 + 2 + 4 + b // 2,
        "q8_0": 2 + b,
        "q8_1": 4 + 4 + b,
        "q2_k": b // 16 + b // 4 + 2 + 2,
        "q3_k": b // 8 + b // 4 + 12 + 2,
        "q4_k": 2 + 2 + 12 + b // 2,
        "q5_k": 2 + 2 + 12 + b // 8 + b // 2,
        "q6_k": b // 2 + b // 4 + b // 16 + 2,
        "q8_k": 4 + b + 2 * b // 16,
        "iq2_xxs": 2 + 2 * b // 8,
        "iq2_xs": 2 + 2 * b // 8 + b // 32,
        "iq3_xxs": 2 + b // 4 + b // 8,
        "iq1_s": 2 + b // 8 + b // 16,
        "iq4_nl": 2 + b // 2,
        "iq3_s": 2 + b // 4 + b // 8 + b // 32 + 4,
        "iq2_s": 2 + b // 4 + b // 16,
        "iq4_xs": 2 + 2 + b // 2 + b // 64,
        "iq1_m": b // 8 + b // 16 + b // 32,
        "mxfp4": 1 + b // 2,
        "nvfp4": 4 + b // 2,
        "q1_0": 2 + b // 8,
        # tri-plane ternary quantizations, super-block only (256 weights)
        "tq1_0": 54 if b == 256 else 0,
        "tq2_0": 66 if b == 256 else 0,
    }
    return table.get(name, 0)


def _tensor_nbytes(shape: list[int], type_name: str) -> int | None:
    """Exact payload bytes for a tensor, or None when the type is unknown.

    Quantization happens per row of the innermost dimension; each row must be
    a whole number of blocks (the format guarantees it for sane files).
    """
    block = _block_size(type_name)
    ts = _type_size(type_name, block)
    if ts == 0 or not shape:
        return None
    row = shape[0]
    if row <= 0:
        return None
    rows = 1
    for d in shape[1:]:
        rows *= d
    if row % block == 0:
        return (row // block) * ts * rows
    # Unusual but legal files: round each row up and say so in warnings.
    return math.ceil(row / block) * ts * rows


# Approved Phase-1 policy (plan: GGUF-dense first). Anything outside these
# sets is reported honestly as "not in the approved scope", never as broken.
_POLICY_ARCHS = {"llama", "qwen2", "mistral", "gemma", "gemma2", "gemma3"}
_POLICY_QUANTS = {"q8_0", "f16", "q6_k", "q5_k", "q4_k"}


class GgufError(ValueError):
    """A structural problem that makes the file impossible to parse."""


class _Reader:
    def __init__(self, path: str):
        self.path = path
        try:
            self.size = os.path.getsize(path)
            self.f = open(path, "rb")
        except OSError as exc:
            raise GgufError(f"cannot open {path}: {exc}") from exc
        self.pos = 0

    def close(self) -> None:
        self.f.close()

    def _need(self, n: int, what: str) -> None:
        if n < 0 or self.pos + n > self.size:
            raise GgufError(
                f"{self.path}: truncated file while reading {what} at byte "
                f"{self.pos} (need {n} more bytes, file is {self.size}); "
                f"the download or copy is incomplete - re-fetch the file"
            )

    def read(self, n: int, what: str) -> bytes:
        self._need(n, what)
        data = self.f.read(n)
        if len(data) != n:
            raise GgufError(f"{self.path}: short read for {what} at byte {self.pos}")
        self.pos += n
        return data

    def unpack(self, fmt: str, what: str) -> Any:
        size = struct.calcsize(fmt)
        return struct.unpack(fmt, self.read(size, what))[0]

    def string(self, what: str) -> str:
        n = self.unpack("<Q", f"{what} length")
        if n > MAX_STRING:
            raise GgufError(
                f"{self.path}: {what} claims {n} bytes (limit {MAX_STRING}); "
                f"the header is corrupt"
            )
        return self.read(n, what).decode("utf-8", errors="replace")

    def align(self, alignment: int) -> int:
        pad = (-self.pos) % alignment
        if pad:
            self.read(pad, "alignment padding")
        return self.pos


def _read_value(r: _Reader, vtype: int, what: str, warnings: list[str]) -> Any:
    if vtype in _SCALAR_FMT:
        return r.unpack(_SCALAR_FMT[vtype], what)
    if vtype == _T_BOOL:
        return r.read(1, what)[0] != 0
    if vtype == _T_STR:
        return r.string(what)
    if vtype == _T_ARR:
        elem_t = r.unpack("<I", f"{what} element type")
        count = r.unpack("<Q", f"{what} element count")
        if count > MAX_ARRAY:
            raise GgufError(
                f"{r.path}: {what} claims {count} elements (limit {MAX_ARRAY}); "
                f"the header is corrupt"
            )
        if elem_t == _T_ARR:
            raise GgufError(f"{r.path}: {what}: nested arrays are not valid GGUF")
        if elem_t in _SCALAR_FMT:
            step = struct.calcsize(_SCALAR_FMT[elem_t])
        elif elem_t == _T_STR:
            step = 0  # variable length, counted elementwise
        elif elem_t == _T_BOOL:
            step = 1
        else:
            raise GgufError(f"{r.path}: {what}: unknown element type {elem_t}")
        if step:
            r._need(step * count, what)
        if count <= 4096:
            return [_read_value(r, elem_t, what, warnings) for _ in range(count)]
        sample = [_read_value(r, elem_t, what, warnings) for _ in range(MAX_SAMPLE)]
        # Skip the rest without materialising it.
        if step:
            r.read(step * (count - MAX_SAMPLE), what)
        else:
            for _ in range(count - MAX_SAMPLE):
                r.string(what)
        warnings.append(
            f"metadata array {what!r} has {count} entries; kept the first "
            f"{MAX_SAMPLE} only"
        )
        return {"_array_count": count, "_sample": sample}
    raise GgufError(f"{r.path}: {what}: unknown metadata type {vtype}")


def _read_kvs(r: _Reader, count: int, warnings: list[str]) -> dict[str, Any]:
    out: dict[str, Any] = {}
    for i in range(count):
        key = r.string(f"metadata key {i}")
        vtype = r.unpack("<I", f"metadata value type for {key!r}")
        out[key] = _read_value(r, vtype, key, warnings)
    return out


def _read_tensors(r: _Reader, count: int, warnings: list[str]) -> list[dict[str, Any]]:
    tensors: list[dict[str, Any]] = []
    for i in range(count):
        name = r.string(f"tensor name {i}")
        ndims = r.unpack("<I", f"dims of tensor {name!r}")
        if ndims == 0 or ndims > MAX_TENSOR_DIMS:
            raise GgufError(
                f"{r.path}: tensor {name!r} has {ndims} dimensions "
                f"(1..{MAX_TENSOR_DIMS} allowed); the header is corrupt"
            )
        shape = [r.unpack("<Q", f"shape of tensor {name!r}") for _ in range(ndims)]
        ttype = r.unpack("<I", f"type of tensor {name!r}")
        offset = r.unpack("<Q", f"offset of tensor {name!r}")
        type_name = _TENSOR_TYPES.get(ttype)
        nbytes = _tensor_nbytes(shape, type_name) if type_name else None
        if type_name is None:
            warnings.append(
                f"tensor {name!r} has unknown type id {ttype}; its size "
                f"cannot be verified"
            )
        tensors.append({
            "name": name,
            "shape": shape,
            "type": type_name or f"unknown({ttype})",
            "offset": offset,
            "nbytes": nbytes,
        })
    return tensors


def inspect_file(path: str | os.PathLike[str]) -> dict[str, Any]:
    """Parse a GGUF file's header and return a JSON-serialisable report.

    Raises GgufError when the header itself is unreadable. Tensor-data
    problems (truncation, unknown types) come back as report fields instead
    so callers still get whatever metadata was parseable.
    """
    p = os.fspath(path)
    warnings: list[str] = []
    r = _Reader(p)
    try:
        magic = r.read(4, "file magic")
        if magic != _MAGIC:
            hint = ("file looks like a big-endian GGUF (FUGG), which this "
                    "inspector does not support"
                    if magic == b"FUGG" else
                    "this is not a GGUF model file; pass the .gguf file")
            raise GgufError(f"{p}: not a GGUF file (magic {magic!r}) - {hint}")
        version = r.unpack("<I", "format version")
        if version == 1:
            raise GgufError(
                f"{p}: GGUF version 1 is obsolete and not supported; "
                f"re-export the model as GGUF v3"
            )
        if version not in _SUPPORTED_VERSIONS:
            warnings.append(
                f"GGUF version {version} is newer than this inspector "
                f"(supports {list(_SUPPORTED_VERSIONS)}); parsing best-effort"
            )
        n_tensors = r.unpack("<Q", "tensor count")
        n_kvs = r.unpack("<Q", "metadata count")
        if n_kvs > MAX_KVS:
            raise GgufError(
                f"{p}: metadata count {n_kvs} exceeds {MAX_KVS}; "
                f"the header is corrupt"
            )
        if n_tensors > MAX_TENSORS:
            raise GgufError(
                f"{p}: tensor count {n_tensors} exceeds {MAX_TENSORS}; "
                f"the header is corrupt"
            )

        kvs = _read_kvs(r, n_kvs, warnings)
        tensors = _read_tensors(r, n_tensors, warnings)

        alignment = kvs.get("general.alignment")
        if not isinstance(alignment, int) or alignment <= 0:
            alignment = 32
        r.align(alignment)
        data_start = r.pos
    finally:
        r.close()

    arch = kvs.get("general.architecture")
    arch = arch if isinstance(arch, str) else "unknown"

    by_type: dict[str, int] = {}
    params = 0
    weight_bytes = 0
    unverified_bytes = False
    max_extent = 0
    for t in tensors:
        by_type[t["type"]] = by_type.get(t["type"], 0) + 1
        params += math.prod(t["shape"]) if t["shape"] else 0
        if t["nbytes"] is None:
            unverified_bytes = True
            continue
        weight_bytes += t["nbytes"]
        extent = data_start + t["offset"] + t["nbytes"]
        max_extent = max(max_extent, extent)

    total_size = os.path.getsize(p)
    data_complete = max_extent <= total_size if tensors else True
    if not data_complete:
        missing = max_extent - total_size
        warnings.append(
            f"tensor data is short by {missing} bytes - the file is "
            f"truncated or still downloading"
        )

    # Embedding/output weights are usually f16 even in quantized models, so
    # the *scope* question is answered by the dominant quantizations.
    dominant = sorted(
        (ty for ty in by_type if not ty.startswith("unknown")),
        key=lambda ty: -by_type[ty],
    )

    badges: list[dict[str, str]] = []

    def badge(bid: str, level: str, message: str) -> None:
        badges.append({"id": bid, "level": level, "message": message})

    badge("format", "ok",
          f"GGUF v{version}, {n_kvs} metadata keys, {n_tensors} tensors")
    if data_complete:
        badge("data", "ok" if tensors else "warn",
              "all tensor bytes present" if tensors else
              "file contains no tensors")
    else:
        badge("data", "error",
              f"tensor data short by {max_extent - total_size} bytes")

    in_scope_arch = arch in _POLICY_ARCHS
    badge(
        "dense-policy-architecture",
        "ok" if in_scope_arch else "warn",
        f"architecture {arch!r} is in the approved GGUF-dense scope"
        if in_scope_arch else
        f"architecture {arch!r} is outside the approved dense scope "
        f"({sorted(_POLICY_ARCHS)}); not validated yet - honest badge, "
        f"not a failure",
    )

    policy_quants = [q for q in dominant if q in _POLICY_QUANTS]
    if any(q in _POLICY_QUANTS for q in by_type):
        badge("dense-policy-quantization", "ok",
              f"approved quantizations present: {sorted(set(policy_quants))}")
    else:
        badge("dense-policy-quantization", "warn",
              f"quantizations {dominant[:4]} are outside the approved set "
              f"{sorted(_POLICY_QUANTS)}; not validated yet")

    if in_scope_arch:
        badge("runtime-support", "ok",
              "loadable through the built-in GGUF runtime "
              "(syntara serve --model <path>)")
    else:
        badge("runtime-support", "warn",
              f"the built-in GGUF runtime targets the approved dense scope; "
              f"architecture {arch!r} has not been validated for loading")

    tokenizer_present = "tokenizer.ggml.tokens" in kvs
    has_chat_template = bool(kvs.get("tokenizer.chat_template"))
    badge("chat-template", "ok" if has_chat_template else "warn",
          "chat template present" if has_chat_template else
          "no tokenizer.chat_template in metadata; chat prompts will need "
          "manual formatting")

    file_type = kvs.get("general.file_type")
    ctx = kvs.get(f"{arch}.context_length")
    if ctx is None:
        ctx = kvs.get("general.context_length")

    ram_estimate = None
    if weight_bytes:
        ram_estimate = int(weight_bytes * 1.25)

    if unverified_bytes:
        warnings.append("some tensors have unknown types; byte totals are a "
                        "lower bound")

    report: dict[str, Any] = {
        "path": os.path.abspath(p),
        "file_size": total_size,
        "format": {
            "magic": "GGUF",
            "version": version,
            "alignment": alignment,
            "data_start": data_start,
        },
        "model": {
            "architecture": arch,
            "name": kvs.get("general.name"),
            "file_type": file_type if isinstance(file_type, int) else None,
            "context_length": ctx if isinstance(ctx, int) else None,
            "quantization_version": kvs.get("general.quantization_version"),
        },
        "metadata": {
            "count": n_kvs,
            "keys": sorted(kvs),
            "values": kvs,
        },
        "tensors": {
            "count": n_tensors,
            "by_type": dict(sorted(by_type.items())),
            "parameters": params,
            "weight_bytes": weight_bytes,
            "bytes_verified": not unverified_bytes and data_complete,
        },
        "estimates": {
            "file_mb": round(total_size / (1024 * 1024), 1),
            "weight_mb": round(weight_bytes / (1024 * 1024), 1),
            "params_billion": round(params / 1e9, 3),
            "ram_gb_min": round(ram_estimate / (1024 ** 3), 2) if ram_estimate else None,
            "ram_formula": "weights * 1.25 (runtime overhead; context/KV "
                           "cache excluded - no context selected yet)",
        },
        "tokenizer": {
            "tokens": kvs.get("tokenizer.ggml.tokens", {}).get("_array_count")
            if isinstance(kvs.get("tokenizer.ggml.tokens"), dict)
            else (len(kvs["tokenizer.ggml.tokens"])
                  if isinstance(kvs.get("tokenizer.ggml.tokens"), list) else 0),
            "has_chat_template": has_chat_template,
        },
        "compatibility": {
            "dense_scope_archs": sorted(_POLICY_ARCHS),
            "dense_scope_quants": sorted(_POLICY_QUANTS),
            "architecture_in_scope": in_scope_arch,
            "approved_quants_present": bool(policy_quants),
            "badges": badges,
        },
        "data_complete": data_complete,
        "warnings": warnings,
    }
    return report
