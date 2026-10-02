#!/usr/bin/env python3
"""Read-only installation diagnostics for syntara."""

import os
import sys
import json
import re
import platform
import ctypes
import subprocess
import tempfile
import time
from datetime import datetime, timezone
from pathlib import Path

from family_registry import (FamilyConfigError, PlannerUnsupportedError, UnknownFamilyError,
                             public_metadata, resolve_model)
from resource_plan import (GB, SSD_PROBE_PENDING, build_plan, discover_gpus, format_bytes,
                           format_plan, memory_available, physical_cpu_count)

SAFETENSORS_MAX_HEADER = 512 << 20
MODEL_INDEX_MAX_BYTES = SAFETENSORS_MAX_HEADER
MAX_SAFETENSORS_SHARDS = 512
SAFETENSORS_DTYPES = {
    "BF16": 2,
    "F16": 2,
    "F32": 4,
    "U8": 1,
    "I8": 1,
    # dtypes st.h's st_dtype_code accepts beyond the classic set (DeepSeek V4 /
    # Kimi-style checkpoints); sizes mirror st_dtype_esz exactly.
    "I64": 8,
    "U64": 8,
    "F8_E4M3": 1,
    "F8_E4M3FN": 1,
    "float8_e4m3fn": 1,
    "F8_E8M0": 1,
    "F8_E8M0FNU": 1,
}
def _core_component(name, spellings):
    """Does the component immediately before `.weight` name this role?

    Not `endswith`: `"pos_embed.weight".endswith("embed.weight")` is True, and
    so is the vision tower's `patch_embed.weight`. Either would stand in for a
    token embedding that is not there, which is this bug with the sign flipped
    -- a checkpoint genuinely missing its embedding would pass. The component
    has to BE the role, so the match is on the name between the last two dots.

    `.layers.` is excluded for the reason _is_final_norm excludes it: a head or
    an embedding inside the layer stack is the block's, not the model's.
    """
    parts = name.split(".")
    return (len(parts) >= 2 and parts[-1] == "weight"
            and parts[-2] in spellings and ".layers." not in name)


def _is_embedding(name):
    return _core_component(name, {"embed_tokens", "embed"})


def _is_final_norm(name):
    # Every block has norms too. The final one is the norm that sits OUTSIDE
    # the layer stack, which _core_component's `.layers.` exclusion covers, and
    # the component test covers the rest: GLM-5.3-Flash's vision tower has
    # `model.visual.post_layernorm.weight`, whose component is
    # `post_layernorm`, not `norm`, so it cannot stand in for a final norm that
    # is not there.
    #
    # The component form also accepts a bare `norm.weight` at the root, which
    # the old `.norm.weight` tail required a prefix for. A container that names
    # its roles flat, which is exactly what DeepSeek V4 does with `embed.weight`
    # and `head.weight`, would otherwise fail this third role for the same
    # reason it failed the other two.
    return _core_component(name, {"norm"})


def _is_output_head(name):
    # `hc_head_base`, `hc_head_fn` and `hc_head_scale` sit next to the real head
    # in a DeepSeek V4 container and must not stand in for it. They fall out
    # here without an exclusion of their own: none of them ends in `.weight`.
    return _core_component(name, {"lm_head", "head"})


#: What a checkpoint must contain to be a language model at all, stated as
#: ROLES rather than names.
#:
#: #1365: the previous form was three literal names taken from GLM-5.2, and it
#: reported "2 required core tensor(s) are missing" for every GLM-5.3-Flash
#: download, converted or pre-converted. Nothing was missing. Flash's root is
#: the vision wrapper, so the language model is nested and the tensors are
#: `model.language_model.embed_tokens.weight` and
#: `model.language_model.norm.weight`. Two of three names did not match, and
#: the doctor called a healthy model broken.
#:
#: #1593: the same defect again, one family later. That fix made the predicates
#: prefix-agnostic but not NAME-agnostic, and DeepSeek V4 spells the roles
#: `embed.weight` and `head.weight` (deepseek_v4.c looks up exactly those, at
#: four call sites). Both roles were reported missing for a container the engine
#: loads and generates from, while `model.index`, scanning the same tensors,
#: was green. `_is_final_norm` survived only because `.norm.weight` is a
#: spelling V4 happens to share.
#:
#: Matching on the tail rather than the whole name is what makes this hold for
#: families nobody has written yet: it is prefix-agnostic, which is exactly
#: what the engines already are. `qwen38.c` probes
#: `model.language_model.embed_tokens.weight` and falls back to
#: `model.embed_tokens.weight`; every engine discovers its prefix at load time.
#: The doctor was the one place that assumed the prefix was a constant.
CORE_TENSOR_ROLES = (
    ("token embedding", _is_embedding),
    ("final norm", _is_final_norm),
    ("output head", _is_output_head),
)


def missing_core_roles(tensor_names, config=None):
    """Which core roles no tensor fills. Empty means the model is complete.

    `tie_word_embeddings` makes the output head legitimately absent: the
    embedding matrix is reused as the head, and there is no `lm_head.weight`
    to find. Requiring one anyway would trade this bug for the same bug on a
    different checkpoint.
    """
    tied = bool((config or {}).get("tie_word_embeddings"))
    missing = []
    for role, matches in CORE_TENSOR_ROLES:
        if any(matches(name) for name in tensor_names):
            continue
        if role == "output head" and tied:
            continue
        missing.append(role)
    return missing


def _check(identifier, status, summary, **details):
    item = {"id": identifier, "status": status, "summary": summary}
    if details:
        item["details"] = details
    return item


def _json_object(pairs):
    result = {}
    for key, value in pairs:
        if key in result:
            raise ValueError(f"duplicate JSON key: {key}")
        result[key] = value
    return result


def _safetensors_header(path):
    """Read one bounded safetensors header without touching tensor payloads."""
    path = Path(path)
    with path.open("rb") as stream:
        file_size = os.fstat(stream.fileno()).st_size
        raw_length = stream.read(8)
        if len(raw_length) != 8:
            raise ValueError("short safetensors header")
        header_length = int.from_bytes(raw_length, "little")
        if (header_length < 2 or header_length > SAFETENSORS_MAX_HEADER or
                header_length > file_size - 8):
            raise ValueError(f"invalid safetensors header length: {header_length}")
        raw_header = stream.read(header_length)
        if len(raw_header) != header_length:
            raise ValueError("short safetensors header body")
    try:
        header = json.loads(raw_header, object_pairs_hook=_json_object)
    except (UnicodeDecodeError, json.JSONDecodeError) as error:
        raise ValueError(f"invalid safetensors JSON: {error}") from error
    if not isinstance(header, dict):
        raise ValueError("safetensors header is not a JSON object")
    return file_size, raw_header, header


def _tensor_layout(meta, payload_size):
    if not isinstance(meta, dict):
        raise ValueError("tensor metadata is not an object")
    dtype = meta.get("dtype")
    offsets = meta.get("data_offsets")
    shape = meta.get("shape")
    if dtype not in SAFETENSORS_DTYPES:
        raise ValueError(f"unsupported dtype: {dtype!r}")
    if (not isinstance(offsets, list) or len(offsets) != 2 or
            any(isinstance(value, bool) or not isinstance(value, int) for value in offsets)):
        raise ValueError("data_offsets must contain exactly two integers")
    start, end = offsets
    if start < 0 or end < start or end > payload_size:
        raise ValueError(f"data_offsets [{start}, {end}] exceed payload size {payload_size}")
    if (not isinstance(shape, list) or
            any(isinstance(value, bool) or not isinstance(value, int) or value < 0
                for value in shape)):
        raise ValueError("shape must contain only non-negative integers")
    elements = 1
    for dimension in shape:
        elements *= dimension
        if elements > (1 << 63) - 1:
            raise ValueError("shape element count exceeds int64")
    if dtype not in ("U8", "I8") and end - start != elements * SAFETENSORS_DTYPES[dtype]:
        raise ValueError("shape and dtype disagree with the tensor byte span")
    return start, end


def _shard_sequence_report(shards):
    hf_shards = []
    out_shards = []
    for shard in shards:
        hf_match = re.fullmatch(r"model-(\d+)-of-(\d+)\.safetensors", shard.name)
        out_match = re.fullmatch(r"out-(\d+)\.safetensors", shard.name)
        if hf_match:
            hf_shards.append(tuple(map(int, hf_match.groups())))
        elif out_match:
            out_shards.append(int(out_match.group(1)))
    if hf_shards and out_shards:
        return {
            "status": "fail",
            "summary": "model mixes filename-declared shard schemes",
            "details": {
                "huggingface_shards": len(hf_shards),
                "converter_shards": len(out_shards),
            },
        }
    if hf_shards:
        declared = {total for _, total in hf_shards}
        if len(declared) != 1:
            return {"status": "fail", "summary": "shard filenames declare different totals"}
        total = declared.pop()
        found = {index for index, _ in hf_shards}
        in_range = {index for index in found if 1 <= index <= total}
        missing = max(total - len(in_range), 0)
        unexpected = len(found - in_range)
        duplicates = len(hf_shards) - len(found)
        if missing or unexpected or duplicates:
            return {
                "status": "fail",
                "summary": "declared shard sequence is incomplete or inconsistent",
                "details": {
                    "declared_shards": total,
                    "found_shards": len(found),
                    "missing_shards": missing,
                    "unexpected_shards": unexpected,
                    "duplicate_shards": duplicates,
                },
            }
        return {
            "status": "pass",
            "summary": "all filename-declared shards are present",
            "details": {"declared_shards": total, "found_shards": len(found)},
        }
    if out_shards:
        found = set(out_shards)
        first = min(found)
        last = max(found)
        missing = last + 1 - len(found)
        duplicates = len(out_shards) - len(found)
        if missing or duplicates:
            return {
                "status": "fail",
                "summary": "converter shard numbering contains gaps or duplicates",
                "details": {
                    "first_shard": first,
                    "last_shard": last,
                    "found_shards": len(found),
                    "missing_shards": missing,
                    "duplicate_shards": duplicates,
                    "tail_completeness_declared": False,
                },
            }
        return {
            "status": "pass",
            "summary": "converter shard numbering is contiguous",
            "details": {
                "first_shard": min(found),
                "last_shard": max(found),
                "found_shards": len(found),
                "tail_completeness_declared": False,
            },
        }
    return {"status": "skip", "summary": "shard filenames do not declare a sequence"}


def deep_container_report(model, mirror_dir=None):
    """Validate all tensor headers/layouts and runtime-equivalent mirror admission."""
    model = Path(model).expanduser().resolve()
    shards = sorted(model.glob("*.safetensors"))
    if not shards:
        raise ValueError("no safetensors shards found")
    if len(shards) > MAX_SAFETENSORS_SHARDS:
        raise ValueError(
            f"more than {MAX_SAFETENSORS_SHARDS} safetensors shards "
            "are not supported by the runtime"
        )

    tensor_sources = {}
    shard_headers = {}
    tensor_count = 0
    header_bytes = 0
    payload_bytes = 0
    for shard in shards:
        try:
            file_size, raw_header, header = _safetensors_header(shard)
        except (OSError, ValueError) as error:
            raise ValueError(f"{shard.name}: {error}") from error
        payload_size = file_size - 8 - len(raw_header)
        ranges = []
        for name, meta in header.items():
            if name == "__metadata__":
                if not isinstance(meta, dict):
                    raise ValueError(f"{shard.name}: __metadata__ is not an object")
                continue
            if name in tensor_sources:
                raise ValueError(
                    f"duplicate tensor {name!r} in {tensor_sources[name]} and {shard.name}"
                )
            try:
                start, end = _tensor_layout(meta, payload_size)
            except ValueError as error:
                raise ValueError(f"{shard.name}: tensor {name!r}: {error}") from error
            tensor_sources[name] = shard.name
            tensor_count += 1
            ranges.append((start, end, name))
        ranges = [item for item in ranges if item[0] != item[1]]
        ranges.sort()
        for previous, current in zip(ranges, ranges[1:]):
            if current[0] < previous[1]:
                raise ValueError(
                    f"{shard.name}: tensors {previous[2]!r} and {current[2]!r} overlap"
                )
        shard_headers[shard.name] = (file_size, raw_header)
        header_bytes += len(raw_header)
        payload_bytes += payload_size

    index_path = model / "model.safetensors.index.json"
    index = {"status": "skip", "summary": "model index is not present"}
    if index_path.is_file():
        try:
            with index_path.open("rb") as stream:
                index_size = os.fstat(stream.fileno()).st_size
                if index_size > MODEL_INDEX_MAX_BYTES:
                    raise ValueError(
                        f"model index exceeds {MODEL_INDEX_MAX_BYTES} bytes"
                    )
                raw_index = stream.read(index_size + 1)
                if len(raw_index) != index_size:
                    raise ValueError("model index changed while reading")
            document = json.loads(raw_index, object_pairs_hook=_json_object)
            if not isinstance(document, dict):
                raise ValueError("model index is not a JSON object")
            weight_map = document.get("weight_map")
            if not isinstance(weight_map, dict):
                raise ValueError("weight_map is not an object")
            if any(not isinstance(name, str) or not isinstance(shard, str)
                   for name, shard in weight_map.items()):
                raise ValueError("weight_map keys and values must be strings")
            missing_tensors = sorted(set(weight_map) - set(tensor_sources))
            unindexed_tensors = sorted(set(tensor_sources) - set(weight_map))
            misplaced_tensors = sorted(
                name for name in set(weight_map) & set(tensor_sources)
                if weight_map[name] != tensor_sources[name]
            )
            unknown_shards = sorted(
                {name for name in weight_map.values() if name not in shard_headers}
            )
            if missing_tensors or unindexed_tensors or misplaced_tensors or unknown_shards:
                raise ValueError(
                    "index disagrees with scanned tensors "
                    f"(missing={len(missing_tensors)}, unindexed={len(unindexed_tensors)}, "
                    f"misplaced={len(misplaced_tensors)}, unknown_shards={len(unknown_shards)})"
                )
            index = {
                "status": "pass",
                "summary": "model index matches every scanned tensor",
                "details": {"indexed_tensors": len(weight_map)},
            }
        except (OSError, UnicodeDecodeError, json.JSONDecodeError, ValueError) as error:
            index = {"status": "fail", "summary": f"model index is invalid: {error}"}

    # Read here rather than take it as an argument: the signature is used by
    # callers and tests, and the only thing needed is one optional flag.
    core_config = {}
    try:
        with (model / "config.json").open("rb") as stream:
            loaded = json.loads(stream.read(MODEL_INDEX_MAX_BYTES))
        if isinstance(loaded, dict):
            core_config = loaded
    except (OSError, UnicodeDecodeError, json.JSONDecodeError, ValueError):
        pass                      # no config is already its own failed check
    missing_core = missing_core_roles(tensor_sources, core_config)
    required = {
        "status": "fail" if missing_core else "pass",
        "summary": (
            # Name the roles, not a count. "2 required core tensor(s) are
            # missing" sent someone to re-download 195 GB twice before asking.
            "no tensor fills these core roles: " + ", ".join(missing_core)
            if missing_core else "required core tensors are present"
        ),
        "details": {
            "required_roles": [role for role, _ in CORE_TENSOR_ROLES],
            "missing_roles": missing_core,
        },
    }

    mirror = {"status": "skip", "summary": "no mirror directory is configured"}
    if mirror_dir:
        mirror_path = Path(mirror_dir).expanduser().resolve()
        accepted = 0
        missing = 0
        divergent = 0
        if not mirror_path.is_dir():
            mirror = {
                "status": "warn",
                "summary": "configured mirror directory is unavailable",
                "details": {"path": str(mirror_path), "accepted_shards": 0},
            }
        else:
            for name, (primary_size, primary_header) in shard_headers.items():
                candidate = mirror_path / name
                if not candidate.is_file():
                    missing += 1
                    continue
                try:
                    mirror_size, mirror_header, _ = _safetensors_header(candidate)
                except (OSError, ValueError):
                    divergent += 1
                    continue
                if mirror_size == primary_size and mirror_header == primary_header:
                    accepted += 1
                else:
                    divergent += 1
            if divergent:
                status = "warn"
                summary = "one or more mirror shards would be rejected by the runtime"
            elif accepted:
                status = "pass"
                summary = "mirror shards satisfy runtime size and header admission"
            else:
                status = "warn"
                summary = "configured mirror contains no admissible primary shards"
            mirror = {
                "status": status,
                "summary": summary,
                "details": {
                    "path": str(mirror_path),
                    "accepted_shards": accepted,
                    "missing_shards": missing,
                    "divergent_shards": divergent,
                    "partial_mirror_allowed": True,
                },
            }

    return {
        "container": {
            "shards": len(shards),
            "tensors": tensor_count,
            "header_bytes": header_bytes,
            "payload_bytes": payload_bytes,
            "payload_hashing": False,
        },
        "sequence": _shard_sequence_report(shards),
        "required": required,
        "index": index,
        "mirror": mirror,
    }


def cuda_linkage(engine_path):
    """Return CUDA linkage state without loading the executable or CUDA runtime."""
    engine = Path(engine_path)
    if not engine.is_file():
        return {"linked": False, "missing": False}
    # `sys.platform` alone selects the branch, so a test can exercise the
    # Windows probe on a POSIX host by faking it. Faking `os.name` instead
    # would repoint pathlib at Windows semantics and turn the POSIX fixture
    # path into a WindowsPath that no longer resolves, so `is_file()` above
    # would return early. On every real host the two agree and this reads
    # exactly as `os.name == "posix"` did.
    if os.name == "posix" and sys.platform != "win32":
        try:
            result = subprocess.run(["ldd", str(engine)], capture_output=True, text=True,
                                    timeout=3, check=False)
        except (OSError, subprocess.SubprocessError):
            return {"linked": False, "missing": False}
        # A HIP/ROCm build links libamdhip64 (never libcudart), so match both
        # vendors here or a working AMD engine is reported CPU-only (#663). Mirrors
        # the vendor-aware probe cuda_binary() already uses in c/syntara.
        lines = [line for line in result.stdout.splitlines()
                 if "libcudart" in line or "libamdhip64" in line]
        return {"linked": any("not found" not in line for line in lines),
                "missing": any("not found" in line for line in lines)}
    if sys.platform == "win32":
        # Windows DLL-split builds never link the GPU runtime directly: the host
        # LoadLibrary's its backend at runtime (backend_loader.c), so there's no
        # import-table entry for ldd/dumpbin to see. Detect the GPU build via a
        # marker string baked into the engine's #ifdef SYNTARA_CUDA block, then
        # require the backend artifact to sit next to the executable.
        #
        # WHICH artifact is not a guess. backend_loader.c compiles exactly one
        # basename into the host -- SYNTARA_BACKEND_DLL is "syntara_hip.dll" under
        # SYNTARA_HIP_DLL and "syntara_cuda.dll" otherwise -- so the binary states
        # what it will load and we check for that. Asking for syntara_cuda.dll
        # unconditionally failed a working HIP host (a hard error, not a
        # warning), and accepting either name would have passed a HIP host that
        # only had a stray CUDA backend beside it.
        try:
            image = engine.read_bytes()
        except OSError:
            return {"linked": False, "missing": False}
        # The DeepSeek V4 engine has its own loader (backend_loader_dsv4.c):
        # it tries syntara_cuda_dsv4_dg.dll then syntara_cuda_dsv4.dll, so either
        # next to the engine means the tier can start.
        if b"[DSV4 CUDA]" in image:
            present = any((engine.parent / name).is_file()
                          for name in ("syntara_cuda_dsv4_dg.dll", "syntara_cuda_dsv4.dll"))
            return {"linked": present, "missing": not present}
        if b"[CUDA] mode: routed experts" not in image:
            return {"linked": False, "missing": False}
        expected = next((name for name in ("syntara_hip.dll", "syntara_cuda.dll")
                         if name.encode() in image), None)
        if expected is None:
            return {"linked": False, "missing": False}
        dll_present = (engine.parent / expected).is_file()
        return {"linked": dll_present, "missing": not dll_present}
    return {"linked": False, "missing": False}


def missing_shared_libraries(engine_path):
    """Shared libraries the engine needs but the loader cannot resolve.

    A binary built elsewhere (a prebuilt release, a copied build, a disk moved to a
    fresh host) can be present and executable yet still fail to start. The engine
    exits before printing anything and the caller only sees "engine exited
    unexpectedly", so name the unresolved libraries instead. Typical case: a minimal
    image without libgomp1, where every OpenMP build reports
    "libgomp.so.1 => not found".
    """
    engine = Path(engine_path)
    if os.name != "posix" or not engine.is_file():
        return []
    try:
        result = subprocess.run(["ldd", str(engine)], capture_output=True, text=True,
                                timeout=3, check=False)
    except (OSError, subprocess.SubprocessError):
        return []          # no ldd (musl, macOS): cannot tell, so claim nothing
    return sorted({line.split("=>")[0].strip()
                   for line in result.stdout.splitlines() if "not found" in line})


# --- hardware profile (plan track 1b): cached machine probes -------------------
# The profile answers "what machine is this running on?" once and remembers it.
# It is re-probed on TTL expiry, on demand (--reprofile), and under memory
# pressure, where cached disk/battery numbers no longer describe the machine
# as it behaves right now.

PROFILE_SCHEMA = 1
PROFILE_TTL_SECONDS = 7 * 24 * 3600
#: Free-RAM fraction below which a cached profile is considered stale: under
#: contention, disk timing and availability move, so describe the machine now.
PROFILE_PRESSURE_RATIO = 0.15


def profile_cache_path(profile_dir=None):
    """Machine profile location; mirrors autotune's config-root rule."""
    if profile_dir:
        root = Path(profile_dir).expanduser()
    elif os.name == "nt":
        root = Path(os.environ.get("LOCALAPPDATA", "~/AppData/Local")).expanduser() / "syntara"
    else:
        root = Path(os.environ.get("XDG_CONFIG_HOME", "~/.config")).expanduser() / "syntara"
    return root / "profile.json"


def probe_isa():
    """CPU instruction-set features, honest about how each one was learned.

    Every branch is best-effort: an unreadable source yields `error` on the
    result instead of raising, because a broken probe must not break doctor."""
    machine = (platform.machine() or "").lower()
    if machine in ("aarch64", "arm64", "armv7l", "armv8l"):
        arch = "arm"
    elif machine in ("x86_64", "amd64", "i386", "i686"):
        arch = "x86"
    else:
        arch = machine or "unknown"
    result = {"arch": arch}
    try:
        if sys.platform == "win32":
            result["method"] = "windows-api"
            k32 = ctypes.windll.kernel32
            feature_ids = {"sse": 6, "sse2": 10, "sse3": 13,
                           "avx": 39, "avx2": 40, "avx512f": 41}
            if arch == "arm":
                feature_ids = {"neon": 29}  # PF_ARM_V8_INSTRUCTIONS_AVAILABLE
            for name, feature in feature_ids.items():
                result[name] = bool(k32.IsProcessorFeaturePresent(feature))
        elif sys.platform == "darwin":
            if arch == "arm":
                # NEON/ASIMD is architecturally mandatory on AArch64; Apple has
                # shipped no SVE part, but absence of evidence stays None.
                result["method"] = "arm64-baseline"
                result["neon"] = True
            else:
                result["method"] = "sysctl"
                tokens = set()
                for key in ("machdep.cpu.features", "machdep.cpu.leaf7_features"):
                    run = subprocess.run(["sysctl", "-n", key], capture_output=True,
                                         text=True, timeout=5, check=False)
                    if run.returncode == 0:
                        tokens.update(run.stdout.split())
                if not tokens:
                    raise OSError("sysctl returned no feature words")
                for name in ("SSE", "SSE2", "SSE3", "AVX", "AVX2", "AVX512F"):
                    key = name.lower()
                    result[key] = name in tokens
        else:
            result["method"] = "proc-cpuinfo"
            tokens = set()
            for line in Path("/proc/cpuinfo").read_text(errors="replace").splitlines():
                key, _, value = line.partition(":")
                if key.strip().lower() in ("flags", "features"):
                    tokens.update(value.split())
            if arch == "arm":
                result["neon"] = ("asimd" in tokens) or ("neon" in tokens)
                result["sve"] = "sve" in tokens
            else:
                for name in ("sse", "sse2", "sse3", "avx", "avx2", "avx512f"):
                    result[name] = name in tokens
    except Exception as error:
        result.setdefault("method", "unknown")
        result["error"] = f"{type(error).__name__}: {error}"
    return result


def probe_ram_total():
    """Installed RAM in bytes; None when the platform will not say."""
    if sys.platform == "win32":
        try:
            class MEMORYSTATUSEX(ctypes.Structure):
                _fields_ = [("dwLength", ctypes.c_ulong), ("dwMemoryLoad", ctypes.c_ulong),
                            ("ullTotalPhys", ctypes.c_ulonglong), ("ullAvailPhys", ctypes.c_ulonglong),
                            ("ullTotalPageFile", ctypes.c_ulonglong), ("ullAvailPageFile", ctypes.c_ulonglong),
                            ("ullTotalVirtual", ctypes.c_ulonglong), ("ullAvailVirtual", ctypes.c_ulonglong),
                            ("ullAvailExtendedVirtual", ctypes.c_ulonglong)]

            status = MEMORYSTATUSEX()
            status.dwLength = ctypes.sizeof(MEMORYSTATUSEX)
            if ctypes.windll.kernel32.GlobalMemoryStatusEx(ctypes.byref(status)):
                return int(status.ullTotalPhys)
        except Exception:
            return None
        return None
    try:
        return os.sysconf("SC_PAGE_SIZE") * os.sysconf("SC_PHYS_PAGES")
    except (OSError, ValueError, AttributeError, TypeError):
        return None


def probe_battery():
    """Battery and AC state; unknown fields stay None instead of guessing."""
    result = {"method": None, "present": None, "on_ac": None,
              "percent": None, "charging": None}
    try:
        if sys.platform == "win32":
            result["method"] = "windows-api"

            class SYSTEM_POWER_STATUS(ctypes.Structure):
                _fields_ = [("ACLineStatus", ctypes.c_ubyte), ("BatteryFlag", ctypes.c_ubyte),
                            ("BatteryLifePercent", ctypes.c_ubyte), ("SystemStatusFlag", ctypes.c_ubyte),
                            ("BatteryLifeTime", ctypes.c_uint), ("BatteryFullLifeTime", ctypes.c_uint)]

            status = SYSTEM_POWER_STATUS()
            if not ctypes.windll.kernel32.GetSystemPowerStatus(ctypes.byref(status)):
                raise OSError("GetSystemPowerStatus failed")
            result["on_ac"] = {0: False, 1: True}.get(status.ACLineStatus)
            result["percent"] = (None if status.BatteryLifePercent == 255
                                 else int(status.BatteryLifePercent))
            if status.BatteryFlag != 255:
                result["present"] = not bool(status.BatteryFlag & 128)
                if result["present"]:
                    result["charging"] = bool(status.BatteryFlag & 8)
        elif sys.platform == "darwin":
            result["method"] = "pmset"
            run = subprocess.run(["pmset", "-g", "batt"], capture_output=True,
                                 text=True, timeout=5, check=False)
            if run.returncode != 0:
                raise OSError(f"pmset exited {run.returncode}")
            head = run.stdout.splitlines()[0] if run.stdout else ""
            result["on_ac"] = (True if "AC Power" in head else
                               False if "Battery Power" in head else None)
            result["present"] = "InternalBattery" in run.stdout
            match = re.search(r"(\d+)%", run.stdout)
            result["percent"] = int(match.group(1)) if match else None
        else:
            result["method"] = "sysfs"
            supply = Path("/sys/class/power_supply")
            try:
                entries = sorted(supply.iterdir())
            except OSError as error:
                result["error"] = str(error)
                entries = []
            for entry in entries:
                try:
                    kind = (entry / "type").read_text().strip()
                except OSError:
                    continue
                if kind == "Battery":
                    result["present"] = True
                    try:
                        result["percent"] = int((entry / "capacity").read_text().strip())
                    except (OSError, ValueError):
                        pass
                    try:
                        state = (entry / "status").read_text().strip()
                        result["charging"] = state == "Charging"
                        if state == "Discharging":
                            result["on_ac"] = False
                    except OSError:
                        pass
                elif kind == "Mains":
                    try:
                        result["on_ac"] = (entry / "online").read_text().strip() == "1"
                    except OSError:
                        pass
            if result["present"] is None and not entries:
                result["present"] = False  # no supply entries at all: AC-only box
    except Exception as error:
        result.setdefault("method", "unknown")
        result["error"] = f"{type(error).__name__}: {error}"
    return result


def disk_bench(directory=None, size_mb=16):
    """Bounded write/read sample; reports the file size it actually measured."""
    target = Path(directory).expanduser() if directory else Path(tempfile.gettempdir())
    size = max(1, int(size_mb)) << 20
    # Non-zero pattern: filesystems that could store this sparsely must not.
    chunk = b"\xa5" * (1 << 20)
    path = target / f"syntara_bench_{os.getpid()}_{time.time_ns()}.bin"
    result = {"method": "file-sample", "bytes": 0,
              "sample_mb": round(size / (1 << 20), 1),
              "write_mbps": None, "read_mbps": None}
    try:
        written = 0
        start = time.perf_counter()
        with open(path, "wb") as stream:
            while written < size:
                block = chunk[:min(len(chunk), size - written)]
                stream.write(block)
                written += len(block)
            stream.flush()
            os.fsync(stream.fileno())
        elapsed = time.perf_counter() - start
        result["bytes"] = written
        if elapsed > 0:
            result["write_mbps"] = round(written / 1e6 / elapsed, 1)
        start = time.perf_counter()
        read = 0
        with open(path, "rb") as stream:
            while True:
                block = stream.read(1 << 20)
                if not block:
                    break
                read += len(block)
        elapsed = time.perf_counter() - start
        if elapsed > 0:
            result["read_mbps"] = round(read / 1e6 / elapsed, 1)
    except OSError as error:
        result["error"] = f"{type(error).__name__}: {error}"
    finally:
        try:
            path.unlink()
        except OSError:
            pass
    return result


def _probe_hardware_profile(available, gpus, bench_dir, bench_mb):
    try:
        cores = physical_cpu_count()
    except Exception:
        cores = None
    return {
        "schema": PROFILE_SCHEMA,
        "probed_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "cpu": {"model": platform.processor() or platform.machine() or "unknown",
                "machine": platform.machine() or None,
                "physical_cores": cores},
        "isa": probe_isa(),
        "ram": {"total_bytes": probe_ram_total(), "available_bytes": available},
        "gpus": [{"index": gpu.get("index"), "name": gpu.get("name"),
                  "total_bytes": gpu.get("total_bytes")}
                 for gpu in (gpus or [])],
        "battery": probe_battery(),
        "disk": {"bench": disk_bench(bench_dir, bench_mb)},
    }


def _iso_epoch(stamp):
    try:
        return datetime.strptime(stamp, "%Y-%m-%dT%H:%M:%SZ").replace(
            tzinfo=timezone.utc).timestamp()
    except (TypeError, ValueError):
        return None


def _write_profile(path, profile):
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, temporary = tempfile.mkstemp(prefix=path.name + ".", dir=path.parent)
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as stream:
            json.dump(profile, stream, indent=2, sort_keys=True)
            stream.write("\n")
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(temporary, path)
    finally:
        try:
            os.unlink(temporary)
        except OSError:
            pass


def machine_profile(*, cache_path=None, force=False, available=None, gpus=None,
                    now=None, ttl=PROFILE_TTL_SECONDS, bench_dir=None, bench_mb=16):
    """Machine profile, cached on disk and re-probed under TTL/force/pressure.

    cache_path=None uses the default location; cache_path=False disables
    persistence entirely (pure read-only callers). The returned dict is
    JSON-serializable and carries `source` plus, on refresh, `refresh_reason`."""
    if cache_path is False:
        path = None
    elif cache_path:
        path = Path(cache_path).expanduser()
    else:
        path = profile_cache_path()
    cached = None
    if path is not None:
        try:
            candidate = json.loads(path.read_text(encoding="utf-8"))
            if isinstance(candidate, dict) and candidate.get("schema") == PROFILE_SCHEMA:
                cached = candidate
        except (OSError, ValueError):
            cached = None
    if gpus is None:
        try:
            gpus = discover_gpus()
        except Exception:
            gpus = []
    if available is None:
        available = memory_available()
    total = probe_ram_total()
    moment = time.time() if now is None else now
    cached_epoch = None if cached is None else _iso_epoch(cached.get("probed_at"))
    age = None if cached_epoch is None else moment - cached_epoch
    pressure = (total not in (None, 0) and available is not None
                and available < total * PROFILE_PRESSURE_RATIO)
    if cached is not None and age is not None and age <= ttl and not pressure and not force:
        served = dict(cached)
        served["source"] = "cache"
        # The refresh reason belongs to the probe event; a cache hit did not
        # re-profile, and saying so would contradict "profile cache" above it.
        served.pop("refresh_reason", None)
        served["age_seconds"] = round(max(0.0, age), 1)
        if available is not None:
            served.setdefault("ram", {})
            served["ram"]["available_bytes"] = available  # volatile; always current
        return served
    profile = _probe_hardware_profile(available, gpus, bench_dir, bench_mb)
    profile["source"] = "fresh"
    if cached is not None and cached_epoch is not None:
        profile["refresh_reason"] = ("forced" if force else
                                     "memory-pressure" if pressure else "ttl-expired")
    if path is None:
        profile["cache"] = "disabled"
    else:
        try:
            _write_profile(path, profile)
            profile["cache"] = "written"
        except OSError as error:
            profile["cache"] = f"failed: {type(error).__name__}: {error}"
    return profile


def _isa_label(isa):
    if not isinstance(isa, dict):
        return None
    for label, key in (("AVX-512", "avx512f"), ("AVX2", "avx2"), ("AVX", "avx")):
        if isa.get(key):
            return label
    if isa.get("sve"):
        return "SVE"
    if isa.get("neon"):
        return "NEON"
    if isa.get("sse2"):
        return "SSE2"
    if isa.get("error") or isa.get("method") == "unknown":
        return "ISA unknown"
    return None


def _battery_label(battery):
    if not isinstance(battery, dict):
        return None
    if battery.get("present") is False:
        return "no battery · AC power" if battery.get("on_ac") else "no battery"
    if battery.get("percent") is not None:
        label = f"battery {battery['percent']}%"
        if battery.get("charging"):
            label += " (charging)"
        elif battery.get("on_ac") is True:
            label += " · AC power"
        elif battery.get("on_ac") is False:
            label += " · on battery"
        return label
    if battery.get("present"):
        return "battery present · state unknown"
    if battery.get("error") or battery.get("method") == "unknown":
        return "battery state unavailable"
    return None


def format_hardware(profile):
    """Compact human view of the hardware profile block (lines)."""
    cpu = profile.get("cpu") or {}
    head = cpu.get("model") or "unknown CPU"
    if cpu.get("physical_cores"):
        head += f" · {cpu['physical_cores']} cores"
    isa = _isa_label(profile.get("isa") or {})
    if isa:
        head += f" · {isa}"
    if profile.get("source"):
        head += f" · profile {profile['source']}"
    lines = [f"hardware  {head}"]
    pieces = []
    ram = profile.get("ram") or {}
    total, available = ram.get("total_bytes"), ram.get("available_bytes")
    if total or available:
        piece = "RAM " + ("unknown" if total is None else format_bytes(total))
        if available is not None:
            piece += f" ({format_bytes(available)} free)"
        pieces.append(piece)
    gpus = profile.get("gpus") or []
    if gpus:
        first = gpus[0]
        label = first.get("name") or f"GPU {first.get('index')}"
        if first.get("total_bytes"):
            label += f" {format_bytes(first['total_bytes'])}"
        if len(gpus) > 1:
            label += f" +{len(gpus) - 1} more"
        pieces.append(f"GPU {label}")
    elif "gpus" in profile:
        pieces.append("no supported GPU detected")
    battery = _battery_label(profile.get("battery"))
    if battery:
        pieces.append(battery)
    bench = (profile.get("disk") or {}).get("bench")
    if isinstance(bench, dict):
        if bench.get("read_mbps") is not None and bench.get("write_mbps") is not None:
            pieces.append(f"disk {bench['read_mbps']:.0f}/{bench['write_mbps']:.0f} MB/s "
                          f"read/write ({bench.get('sample_mb', '?')} MB sample)")
        elif bench.get("error"):
            pieces.append("disk bench unavailable")
    if profile.get("refresh_reason"):
        pieces.append(f"re-profiled: {profile['refresh_reason']}")
    if pieces:
        lines.append("          " + " · ".join(pieces))
    if profile.get("source") == "error":
        lines.append(f"          {profile.get('error', 'unknown error')}")
    return lines


def run_doctor(model, ram_gb=0, context=4096, gpu_indices=None, vram_gb=0, *,
               engine_path, available_memory=None, available_disk=None, gpus=None,
               linkage=None, deep=False, mirror_dir=None, kv_slots=1,
               engine_error=None, profile=None, profile_cache=None, reprofile=False):
    """Collect a complete report. No model payload, engine, or CUDA context is loaded."""
    model = Path(model).expanduser().resolve()
    checks = []
    plan = None
    resolved = None

    if model.is_dir() and os.access(model, os.R_OK):
        checks.append(_check("model.path", "pass", "model directory is readable", path=str(model)))
    elif model.is_dir():
        checks.append(_check("model.path", "fail", "model directory is not readable", path=str(model)))
    else:
        checks.append(_check("model.path", "fail", "model directory does not exist", path=str(model)))

    config = model / "config.json"
    try:
        valid_config = isinstance(json.loads(config.read_text(encoding="utf-8")), dict)
    except (OSError, ValueError):
        valid_config = False
    checks.append(_check("model.config", "pass" if valid_config else "fail",
                         "config.json is valid" if valid_config else "config.json is missing or invalid"))
    if valid_config:
        try:
            resolved = resolve_model(model)
            checks.append(_check("model.family", "pass",
                                 f"{resolved.descriptor.display_name} family is registered",
                                 family_id=resolved.descriptor.id,
                                 model_type=resolved.model_type,
                                 descriptor=public_metadata(resolved.descriptor)))
        except (FamilyConfigError, UnknownFamilyError) as error:
            checks.append(_check("model.family", "fail", str(error)))
    else:
        checks.append(_check("model.family", "skip", "family detection requires a valid config"))
    tokenizer = model / "tokenizer.json"
    checks.append(_check("model.tokenizer", "pass" if tokenizer.is_file() else "fail",
                         "tokenizer.json found" if tokenizer.is_file() else "tokenizer.json is missing"))
    if model.is_dir() and os.access(model, os.W_OK):
        checks.append(_check("storage.persistence", "pass", "model directory can store usage and KV state"))
    elif model.is_dir():
        checks.append(_check("storage.persistence", "warn", "model directory is read-only; disable persistence or change permissions"))
    else:
        checks.append(_check("storage.persistence", "skip", "persistence requires a model directory"))

    engine = Path(engine_path)
    # On Windows, os.access(X_OK) always returns True for any existing file
    # (NTFS has no execute bit; executability is governed by file extension).
    # So a chmod(0o644) "non-executable" scenario can't be detected via X_OK
    # on Windows. Use a platform-aware check: on POSIX, honor the mode bits;
    # on Windows, any existing file is treated as executable. (#141)
    if sys.platform == "win32":
        engine_ok = engine.is_file()
    else:
        engine_ok = engine.is_file() and os.access(engine, os.X_OK)
    if engine_error:
        checks.append(_check("engine.binary", "fail", str(engine_error), path=str(engine)))
    elif engine_ok:
        unresolved = missing_shared_libraries(engine)
        if unresolved:
            checks.append(_check("engine.binary", "fail",
                                 "engine cannot load: " + ", ".join(unresolved) +
                                 " (install the runtime package, e.g. libgomp1, and retry)",
                                 path=str(engine), missing=unresolved))
        else:
            checks.append(_check("engine.binary", "pass", "engine executable is ready", path=str(engine)))
    elif engine.is_file():
        checks.append(_check("engine.binary", "fail", "engine exists but is not executable", path=str(engine)))
    else:
        checks.append(_check("engine.binary", "fail", "engine is not built", path=str(engine)))

    available_memory = memory_available() if available_memory is None else available_memory
    detected_gpus = discover_gpus() if gpus is None else list(gpus)
    linkage = cuda_linkage(engine) if linkage is None else linkage
    selected_gpus = detected_gpus
    if gpu_indices is not None:
        wanted = set(gpu_indices)
        selected_gpus = [gpu for gpu in detected_gpus if gpu["index"] in wanted]

    if gpu_indices == []:
        checks.append(_check("accelerator.gpu", "skip", "GPU use was explicitly disabled"))
    elif gpu_indices is not None and len(selected_gpus) != len(set(gpu_indices)):
        checks.append(_check("accelerator.gpu", "fail", "one or more requested GPUs were not detected",
                             requested=gpu_indices, detected=[gpu["index"] for gpu in detected_gpus]))
    elif selected_gpus and linkage.get("missing"):
        checks.append(_check("accelerator.gpu", "fail", "GPU runtime library is missing"))
    elif selected_gpus and linkage.get("linked"):
        checks.append(_check("accelerator.gpu", "pass", "GPU engine and devices are available",
                             devices=[gpu["index"] for gpu in selected_gpus],
                             unified=any(gpu.get("unified_memory", False)
                                         for gpu in selected_gpus)))
    elif selected_gpus:
        checks.append(_check("accelerator.gpu", "warn", "GPU detected but the engine is CPU-only",
                             devices=[gpu["index"] for gpu in selected_gpus]))
    else:
        checks.append(_check("accelerator.gpu", "skip", "no supported GPU detected; CPU path is available"))

    if profile is None:
        try:
            profile = machine_profile(cache_path=profile_cache, force=reprofile,
                                      available=available_memory, gpus=detected_gpus)
        except Exception as error:
            profile = {"schema": PROFILE_SCHEMA, "source": "error",
                       "error": f"{type(error).__name__}: {error}"}
    if profile.get("source") == "error":
        checks.append(_check("hardware.profile", "warn",
                             f"hardware profile unavailable: {profile.get('error')}"))
    else:
        checks.append(_check("hardware.profile", "pass",
                             f"hardware profile {profile.get('source', 'injected')}"))

    try:
        if resolved is None:
            raise ValueError("placement requires a registered model family")
        # The placement report describes this installed engine, not merely the
        # hardware visible on the host. A CPU-only binary cannot spend VRAM;
        # passing discovered GPUs through here made doctor contradict its own
        # accelerator check and emit CUDA-only tuning advice. Keep inventory
        # details in accelerator.gpu above, but build an executable plan below.
        plan_gpus = detected_gpus if linkage.get("linked") else []
        plan_gpu_indices = gpu_indices if linkage.get("linked") else []
        plan_vram_gb = vram_gb if linkage.get("linked") else 0
        plan = build_plan(model, ram_gb, context, plan_gpu_indices, plan_vram_gb,
                          available_memory=available_memory, available_disk=available_disk,
                          gpus=plan_gpus, kv_slots=kv_slots)
        model_info = plan["model"]
        checks.append(_check("model.shards", "pass", "safetensors headers are valid",
                             shards=model_info["shards"], model_bytes=model_info["model_bytes"]))
        disk = plan["tiers"]["disk"]
        disk_status = "warn" if disk["available_bytes"] < GB else "pass"
        disk_summary = ("less than 1 GB is free for runtime state" if disk_status == "warn" else
                        "model backing store is available")
        checks.append(_check("storage.disk", disk_status, disk_summary,
                             available_bytes=disk["available_bytes"], model_bytes=disk["model_bytes"]))
        ram = plan["tiers"]["ram"]
        if not available_memory:
            ram_status, ram_summary = "warn", "available RAM could not be measured"
        elif ram["budget_bytes"] > available_memory:
            ram_status, ram_summary = "fail", "planned RAM budget exceeds available memory"
        elif ram["cache_slots_per_layer"] < 1:
            ram_status, ram_summary = "fail", "RAM budget cannot hold one expert slot per sparse layer"
        else:
            ram_status, ram_summary = "pass", "RAM budget is viable"
        checks.append(_check("memory.ram", ram_status, ram_summary,
                             available_bytes=available_memory, budget_bytes=ram["budget_bytes"],
                             cache_slots_per_layer=ram["cache_slots_per_layer"]))
        if plan["warnings"]:
            checks.append(_check("placement.plan", "warn", "; ".join(plan["warnings"])))
        else:
            checks.append(_check("placement.plan", "pass", "tier placement has no warnings"))
        # #379: read-and-display only -- the cached value syntara.c already measured
        # (F_NOCACHE probe) on a Metal+darwin startup, never re-probed here. A cache
        # that exists but is not trusted says WHY (#386 r2, F10) -- "no cached probe
        # yet" would be a lie with a file sitting right there.
        ssd_gbs = plan.get("ssd_probe_gbs")
        ssd_state = plan.get("ssd_probe_state")
        if ssd_gbs is not None:
            checks.append(_check("storage.ssd_probe", "pass",
                                 f"F_NOCACHE probe: {ssd_gbs:.1f} GB/s (cached, .syntara_ssd)", gbs=ssd_gbs))
        elif ssd_state in SSD_PROBE_PENDING:
            checks.append(_check("storage.ssd_probe", "skip",
                                 SSD_PROBE_PENDING[ssd_state], state=ssd_state))
        else:
            checks.append(_check("storage.ssd_probe", "skip",
                                 "no cached probe yet; measured on the first Metal+darwin engine start"))
    except PlannerUnsupportedError as error:
        checks.append(_check("model.shards", "pass", "safetensors headers are readable",
                             shards=len(list(model.glob("*.safetensors")))))
        checks.append(_check("storage.disk", "skip",
                             "storage projection requires a family planner"))
        checks.append(_check("memory.ram", "skip",
                             "RAM projection requires a family planner"))
        checks.append(_check("placement.plan", "skip", str(error)))
        checks.append(_check("storage.ssd_probe", "skip",
                             "probe surfacing requires a family planner"))
    except (OSError, ValueError, KeyError, TypeError) as error:
        checks.append(_check("model.shards", "fail", str(error)))
        checks.append(_check("storage.disk", "skip", "storage check requires a valid model"))
        checks.append(_check("memory.ram", "skip", "RAM projection requires a valid model"))
        checks.append(_check("placement.plan", "skip", "placement requires a valid model"))
        checks.append(_check("storage.ssd_probe", "skip", "probe surfacing requires a valid model"))

    if deep:
        try:
            deep_report = deep_container_report(model, mirror_dir=mirror_dir)
            details = deep_report["container"]
            checks.append(_check(
                "model.container", "pass",
                "all tensor headers and layouts are internally consistent",
                **details,
            ))
            sequence = deep_report["sequence"]
            checks.append(_check(
                "model.shard_sequence", sequence["status"], sequence["summary"],
                **sequence.get("details", {}),
            ))
            required = deep_report["required"]
            checks.append(_check(
                "model.required", required["status"], required["summary"],
                **required.get("details", {}),
            ))
            index = deep_report["index"]
            checks.append(_check("model.index", index["status"], index["summary"],
                                 **index.get("details", {})))
            mirror = deep_report["mirror"]
            checks.append(_check("storage.mirror", mirror["status"], mirror["summary"],
                                 **mirror.get("details", {})))
        except (OSError, ValueError) as error:
            checks.append(_check("model.container", "fail", str(error)))
            checks.append(_check(
                "model.shard_sequence", "skip",
                "shard sequence check requires a valid container",
            ))
            checks.append(_check(
                "model.required", "skip",
                "required-tensor check requires a valid container",
            ))
            checks.append(_check("model.index", "skip", "index check requires a valid container"))
            checks.append(_check("storage.mirror", "skip", "mirror check requires a valid container"))

    statuses = {item["status"] for item in checks}
    status = "error" if "fail" in statuses else "warning" if "warn" in statuses else "ok"
    return {"schema_version": 1, "status": status, "model": str(model),
            "mode": "deep" if deep else "standard", "checks": checks, "plan": plan,
            "hardware": profile}


def format_doctor(report):
    icons = {"pass": "ok", "warn": "warn", "fail": "fail", "skip": "skip"}
    # model is null in the JSON when none was given (#724); say that rather than "None"
    lines = [f"syntara doctor · {report['model'] or '(no model given)'}"]
    for check in report["checks"]:
        lines.append(f"[{icons[check['status']]:>4}] {check['id']:<18} {check['summary']}")
    if report["plan"]:
        lines.extend(["", format_plan(report["plan"])])
    hardware = report.get("hardware")
    if hardware:
        lines.append("")
        lines.extend(format_hardware(hardware))
    lines.extend(["", f"result {report['status']}"])
    return "\n".join(lines)


def exit_code(report):
    return 1 if report["status"] == "error" else 0
