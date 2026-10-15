"""On-disk format for Syntara LittleBit-style compressed artifacts.

Artifact directory layout (everything relative to the artifact root):

    config.json                     copied from the source checkpoint
    tokenizer*.{json,txt}           copied tokenizer assets (best effort)
    littlebit.safetensors           packed signs + FP16 scales + passthrough
    syntara_littlebit.json          the artifact manifest (written LAST,
                                    atomically; its presence marks a
                                    published artifact)

The manifest is the single source of truth: compression settings, source
identity (so a changed source is detectable), per-tensor accounting, file
checksums, and QAT status.  Publication is atomic (write into a sibling
``.tmp`` workspace, fsync, then ``os.replace`` the directory).  An absent
manifest means the directory is an incomplete workspace and must never be
treated as a valid artifact.

Security: tensors are read exclusively through ``safetensors`` (no pickle,
no code execution).  All recorded relative paths are validated against
traversal before use.
"""

from __future__ import annotations

import hashlib
import json
import os
import shutil
from pathlib import Path
from typing import Any, Iterable

MANIFEST_NAME = "syntara_littlebit.json"
WEIGHTS_NAME = "littlebit.safetensors"
WORKSPACE_SUFFIX = ".lb-workspace"
FORMAT_VERSION = 1
ALGORITHM = "littlebit-latent-factorization"

_TOKENIZER_GLOBS = (
    "tokenizer.json", "tokenizer_config.json", "special_tokens_map.json",
    "vocab.json", "vocab.txt", "merges.txt", "added_tokens.json",
    "chat_template.jinja", "spiece.model", "tokenizer.model",
)


class ArtifactError(ValueError):
    """Raised when an artifact is malformed, incomplete, or untrusted."""


def sha256_file(path: Path, *, chunk: int = 1 << 20) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as fh:
        while True:
            block = fh.read(chunk)
            if not block:
                break
            h.update(block)
    return h.hexdigest()


def source_identity(source: Path) -> dict[str, Any]:
    """Cheap, stable identity for a source checkpoint.

    Hashes metadata files fully (small) and records weight-shard
    sizes + mtimes without reading multi-GB payloads (same policy as
    prepare.integrity_facts).
    """
    source = Path(source)
    meta_hash: dict[str, str] = {}
    for name in ("config.json", "model.safetensors.index.json"):
        p = source / name
        if p.is_file():
            meta_hash[name] = sha256_file(p)
    shards: dict[str, dict[str, int]] = {}
    for p in sorted(source.glob("*.safetensors")):
        st = p.stat()
        shards[p.name] = {"size": st.st_size, "mtime_ns": st.st_mtime_ns}
    for p in sorted(source.glob("*.bin")):
        st = p.stat()
        shards[p.name] = {"size": st.st_size, "mtime_ns": st.st_mtime_ns}
    return {"path": str(source.resolve()), "meta_sha256": meta_hash,
            "shards": shards}


def safe_relpath(name: str) -> bool:
    """True when ``name`` is a safe relative path (no traversal/absolute)."""
    if not name or os.path.isabs(name):
        return False
    parts = Path(name).parts
    return ".." not in parts and not (parts and parts[0].endswith(":"))


def resolve_shard_key(name: str, weight_map: dict[str, str]) -> str | None:
    """Map an architecture tensor name to its key in the checkpoint shards.

    Hugging Face saves sometimes drop a top-level prefix (e.g. the meta
    model reports ``transformer.h.0.attn.c_attn.weight`` while the shard
    stores ``h.0.attn.c_attn.weight``) or add ``model.``.  Resolution is
    exact, then single-candidate suffix match — never a guess among
    several matches.
    """
    if name in weight_map:
        return name
    if f"model.{name}" in weight_map:
        return f"model.{name}"
    parts = name.split(".", 1)
    if len(parts) == 2 and parts[1] in weight_map:
        return parts[1]
    # shard key is a suffix of the architecture name (prefix was dropped)
    suffix_cands = [k for k in weight_map if k and name.endswith("." + k)]
    if len(suffix_cands) == 1:
        return suffix_cands[0]
    return None


def resolve_module_key(name: str, module_paths: Iterable[str]
                       ) -> str | None:
    """Map a shard-native tensor name to its module path in a live model.

    Inverse of :func:`resolve_shard_key` for the runtime side: given
    ``h.0.attn.c_attn.weight`` find ``transformer.h.0.attn.c_attn.weight``
    (unique suffix match or single prefix-strip), else None.
    """
    modules = set(module_paths)
    if name in modules:
        return name
    parts = name.split(".", 1)
    if len(parts) == 2 and parts[1] in modules:
        return parts[1]
    if f"model.{name}" in modules:
        return f"model.{name}"
    suffix = "." + name
    cands = [m for m in modules if m.endswith(suffix)]
    if len(cands) == 1:
        return cands[0]
    return None


def build_manifest(*, settings: dict[str, Any], source: dict[str, Any],
                   tensors: list[dict[str, Any]], totals: dict[str, Any],
                   weights_sha256: str, copied_files: list[str],
                   qat: dict[str, Any] | None = None) -> dict[str, Any]:
    return {
        "format": "syntara-littlebit-artifact",
        "format_version": FORMAT_VERSION,
        "algorithm": ALGORITHM,
        "method": {
            "paper": "arXiv:2506.13771 (LittleBit, NeurIPS 2025)",
            "components": [
                "low-rank latent factorization (truncated SVD)",
                "binary latent factors (sign)",
                "row scale h / column scale g / latent scale l (FP16)",
                "dual-svid initialization",
                "residual compensation path" if settings.get("residual")
                else "no residual path",
            ],
            "implementation": (
                "original Syntara implementation of the published method; "
                "no code from the CC BY-NC 4.0 reference repository"),
            "qat": qat or {"performed": False},
        },
        "settings": settings,
        "source": source,
        "tensors": tensors,
        "totals": totals,
        "files": {
            "weights": WEIGHTS_NAME,
            "weights_sha256": weights_sha256,
            "copied": copied_files,
        },
    }


def write_json_atomic(path: Path, payload: dict[str, Any]) -> None:
    tmp = path.with_name(path.name + f".tmp{os.getpid()}")
    data = json.dumps(payload, indent=2, sort_keys=True) + "\n"
    with open(tmp, "w", encoding="utf-8") as fh:
        fh.write(data)
        fh.flush()
        os.fsync(fh.fileno())
    os.replace(tmp, path)


def load_manifest(artifact_dir: Path) -> dict[str, Any]:
    path = Path(artifact_dir) / MANIFEST_NAME
    if not path.is_file():
        raise ArtifactError(
            f"{artifact_dir} is not a published LittleBit artifact: "
            f"{MANIFEST_NAME} is missing (incomplete or non-artifact "
            "directory)")
    try:
        manifest = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise ArtifactError(f"{path}: unreadable manifest: {exc}") from exc
    validate_manifest(manifest, artifact_dir=artifact_dir, deep=False)
    return manifest


def validate_manifest(manifest: dict[str, Any], *, artifact_dir: Path,
                      deep: bool = False) -> None:
    """Schema/integrity validation; ``deep`` also verifies the weights
    checksum and that every recorded tensor exists with consistent dims."""
    if manifest.get("format") != "syntara-littlebit-artifact":
        raise ArtifactError("manifest: unknown artifact format")
    if manifest.get("algorithm") != ALGORITHM:
        raise ArtifactError(
            f"manifest: unexpected algorithm {manifest.get('algorithm')!r}")
    version = manifest.get("format_version")
    if version != FORMAT_VERSION:
        raise ArtifactError(
            f"manifest: unsupported format_version {version!r} "
            f"(this build reads version {FORMAT_VERSION})")
    tensors = manifest.get("tensors")
    if not isinstance(tensors, list) or not tensors:
        raise ArtifactError("manifest: empty tensor table")
    settings = manifest.get("settings")
    if not isinstance(settings, dict) or "residual" not in settings:
        raise ArtifactError("manifest: missing compression settings")
    files = manifest.get("files") or {}
    weights = files.get("weights")
    if not weights or not safe_relpath(weights):
        raise ArtifactError("manifest: unsafe or missing weights filename")
    for name in files.get("copied", []) or []:
        if not safe_relpath(name):
            raise ArtifactError(f"manifest: unsafe copied filename {name!r}")
    if not deep:
        return
    root = Path(artifact_dir)
    wp = root / weights
    if not wp.is_file():
        raise ArtifactError(f"weights file missing: {weights}")
    digest = sha256_file(wp)
    if digest != files.get("weights_sha256"):
        raise ArtifactError(
            "weights checksum mismatch: the artifact was modified or "
            "truncated after publication")
    from safetensors import safe_open  # deferred: metadata checks need no dep

    with safe_open(str(wp), framework="pt", device="cpu") as fh:
        keys = set(fh.keys())
        for entry in tensors:
            if not isinstance(entry, dict) or "name" not in entry:
                raise ArtifactError("manifest: malformed tensor entry")
            action = entry.get("action")
            if action == "passthrough":
                key = (entry.get("keys") or {}).get("weight")
                if key not in keys:
                    raise ArtifactError(
                        f"{entry['name']}: passthrough tensor {key!r} "
                        "missing from weights file")
            elif action == "littlebit":
                required = _required_keys(entry)
                missing = [k for k in required if k not in keys]
                if missing:
                    raise ArtifactError(
                        f"{entry['name']}: missing packed tensors "
                        f"{missing}")
                _check_dims(fh, entry)
            else:
                raise ArtifactError(
                    f"{entry['name']}: unknown action {action!r}")


def _required_keys(entry: dict[str, Any]) -> list[str]:
    base = entry.get("keys") or {}
    needed = [base.get(k) for k in ("u", "v", "h", "g", "ell")]
    if entry.get("residual"):
        needed += [base.get(k) for k in ("u_res", "v_res", "h_res",
                                         "g_res", "ell_res")]
    if any(k is None for k in needed):
        raise ArtifactError(f"{entry.get('name')}: incomplete key table")
    return needed


def _check_dims(fh: Any, entry: dict[str, Any]) -> None:  # noqa: ANN401
    d_out, d_in, rank = entry["d_out"], entry["d_in"], entry["rank"]
    for side, rows in (("u", d_out), ("v", d_in)):
        packed_len = (rows * rank + 7) // 8
        t = fh.get_tensor(entry["keys"][side])
        if t.dtype != torch_uint8() or t.numel() != packed_len:
            raise ArtifactError(
                f"{entry['name']}: packed {side} has wrong size "
                f"({t.numel()} != {packed_len})")
    for scale, n in (("h", d_out), ("g", d_in), ("ell", rank)):
        t = fh.get_tensor(entry["keys"][scale])
        if t.numel() != n:
            raise ArtifactError(
                f"{entry['name']}: scale {scale} has wrong length "
                f"({t.numel()} != {n})")
    if entry.get("residual"):
        for side, rows in (("u_res", d_out), ("v_res", d_in)):
            packed_len = (rows * rank + 7) // 8
            t = fh.get_tensor(entry["keys"][side])
            if t.numel() != packed_len:
                raise ArtifactError(
                    f"{entry['name']}: packed {side} has wrong size "
                    f"({t.numel()} != {packed_len})")
        for scale, n in (("h_res", d_out), ("g_res", d_in),
                         ("ell_res", rank)):
            t = fh.get_tensor(entry["keys"][scale])
            if t.numel() != n:
                raise ArtifactError(
                    f"{entry['name']}: residual scale {scale} wrong length")


def torch_uint8():  # noqa: ANN201
    import torch
    return torch.uint8


def copy_source_sidecars(source: Path, dest: Path) -> list[str]:
    """Copy config + tokenizer assets from source into the artifact dir.

    Only the fixed allow-list above is copied (no code, no arbitrary files).
    Returns the list of copied relative names.
    """
    copied: list[str] = []
    src, dst = Path(source), Path(dest)
    for name in ("config.json", *_TOKENIZER_GLOBS):
        p = src / name
        if p.is_file():
            shutil.copy2(p, dst / name)
            copied.append(name)
    return copied


def publish_workspace(workspace: Path, final_dir: Path, *,
                      force: bool = False) -> None:
    """Atomically publish a completed workspace as the artifact directory.

    Refuses to overwrite an existing artifact unless ``force``; on Windows
    ``os.replace`` cannot replace a non-empty directory, so an existing
    target is moved aside first and removed only after success.
    """
    workspace, final_dir = Path(workspace), Path(final_dir)
    if not (workspace / MANIFEST_NAME).is_file():
        raise ArtifactError(
            "refusing to publish a workspace without a manifest")
    if final_dir.exists():
        if not force:
            raise ArtifactError(
                f"target exists: {final_dir} (pass force=True to replace)")
        backup = final_dir.with_name(final_dir.name + ".replaced")
        if backup.exists():
            shutil.rmtree(backup)
        os.replace(final_dir, backup)
        try:
            os.replace(workspace, final_dir)
        except OSError:
            os.replace(backup, final_dir)  # roll back
            raise
        shutil.rmtree(backup, ignore_errors=True)
    else:
        parent = final_dir.parent
        parent.mkdir(parents=True, exist_ok=True)
        os.replace(workspace, final_dir)


def verify_artifact(artifact_dir: Path, *,
                    source: Path | None = None) -> dict[str, Any]:
    """Full verification: schema, checksums, tensor presence + dimensions.

    When ``source`` is given, additionally checks that the source identity
    still matches what the artifact was built from (drift detection).
    Returns a JSON-serializable report; raises ArtifactError on failure.
    """
    artifact_dir = Path(artifact_dir)
    manifest = load_manifest(artifact_dir)
    validate_manifest(manifest, artifact_dir=artifact_dir, deep=True)
    report: dict[str, Any] = {
        "ok": True, "artifact": str(artifact_dir),
        "algorithm": manifest["algorithm"],
        "settings": manifest["settings"],
        "totals": manifest["totals"],
        "qat": (manifest.get("method") or {}).get("qat"),
        "drift": [],
    }
    if source is not None:
        recorded = (manifest.get("source") or {}).get("path")
        current = source_identity(Path(source))
        if recorded and Path(recorded) != Path(current["path"]):
            report["drift"].append(
                f"source path changed ({recorded} -> {current['path']})")
        old_shards = (manifest.get("source") or {}).get("shards") or {}
        new_shards = current["shards"]
        for name, info in old_shards.items():
            now = new_shards.get(name)
            if now is None:
                report["drift"].append(f"source shard disappeared: {name}")
            elif now["size"] != info["size"]:
                report["drift"].append(
                    f"source shard changed size: {name} "
                    f"({info['size']} -> {now['size']})")
        if report["drift"]:
            report["ok"] = False
    return report
