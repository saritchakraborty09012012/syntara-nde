"""Model preparation pipeline: inspect -> analyze -> validate -> convert.

A selective-residency preparation run is *metadata and layout* work, not
an ordinary quantization pass:

- it inspects the checkpoint's real structure (shards, expert layout,
  modalities) without touching tensor data;
- it analyzes it against this machine's hardware (diagnostic plans only);
- it validates which runtime can actually execute it (routing);
- optionally it delegates conversion/quantization to the family's
  converter - which produces the engine's memory-tiered layout (dense
  layers resident, experts streamable from SSD) - writing to a FRESH
  output directory. The source checkpoint is never modified, re-quantized
  in place, or deleted (AGENTS §9/§71/§102);
- it records everything in a resumable manifest with integrity facts
  (metadata hashes + shard sizes), so a later run can prove what changed.

States (manifest["state"]):

    imported -> inspecting -> analyzing -> validating
             -> converting (optional) -> ready_optimized | ready_standard
             -> unsupported (no runtime can run it)
             -> failed (actionable error; rerun resumes)

Everything is stdlib-only, offline, and cancellable (Ctrl-C during
conversion cancels through ConversionService and keeps resumable state).
"""
from __future__ import annotations

import hashlib
import json
import os
import re
import time
from pathlib import Path
from typing import Any, Callable

from .model_inspect import KIND_UNKNOWN, inspect_path
from .store import default_data_dir

_META_NAMES = ("config.json", "model_index.json",
               "model.safetensors.index.json")
_META_MAX_HASH = 64 << 20  # never hash a sidecar bigger than this
_STATES = ("imported", "inspecting", "analyzing", "validating",
           "converting", "ready_optimized", "ready_standard",
           "unsupported", "failed")
TERMINAL_STATES = ("ready_optimized", "ready_standard", "unsupported")

EventSink = Callable[[dict[str, Any]], None]


class PrepareError(ValueError):
    """A preparation stage cannot run; the message is actionable."""


def _slug(text: str) -> str:
    return re.sub(r"[^a-z0-9._-]+", "-", text.lower()).strip("-._") or "model"


def manifest_path(source: str | os.PathLike[str],
                  data_dir: str | os.PathLike[str] | None = None) -> Path:
    """Where the manifest for this source lives (user data, never the
    source directory)."""
    root = Path(data_dir) if data_dir else default_data_dir()
    resolved = str(Path(source).expanduser().resolve())
    digest = hashlib.sha256(resolved.encode("utf-8")).hexdigest()[:10]
    name = _slug(Path(resolved).name)
    return root / "prepare" / f"{name}-{digest}.json"


def _load(path: Path) -> dict[str, Any] | None:
    try:
        doc = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return None
    return doc if isinstance(doc, dict) else None


def _save(path: Path, manifest: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(".json.tmp")
    tmp.write_text(json.dumps(manifest, ensure_ascii=False, indent=2),
                   encoding="utf-8")
    os.replace(tmp, path)


def _emit(sink: EventSink | None, event: dict[str, Any]) -> None:
    if sink is not None:
        sink(event)


def _sha256(path: Path) -> str | None:
    try:
        if path.stat().st_size > _META_MAX_HASH:
            return None
        digest = hashlib.sha256()
        with open(path, "rb") as fh:
            for chunk in iter(lambda: fh.read(1 << 20), b""):
                digest.update(chunk)
        return digest.hexdigest()
    except OSError:
        return None


def integrity_facts(report: dict[str, Any]) -> dict[str, Any]:
    """Cheap integrity facts: metadata sha256 + shard sizes (not contents).

    Hashing multi-gigabyte shards on every run would make preparation
    unusable (AGENTS §58); shard drift is detected by size, metadata by
    content hash. Both are recorded so verify() can tell exact/changed/
    missing apart.
    """
    directory = Path(report.get("path", ""))
    meta = []
    total_meta = 0
    if directory.is_dir():
        for name in _META_NAMES:
            target = directory / name
            if target.is_file():
                size = target.stat().st_size
                total_meta += size
                meta.append({"name": name, "size": size,
                             "sha256": _sha256(target)})
    shards = []
    for name in (report.get("weights") or {}).get("shards") or []:
        shard = directory / name
        try:
            shards.append({"name": name, "size": shard.stat().st_size})
        except OSError:
            shards.append({"name": name, "size": None})
    return {
        "meta_files": meta,
        "meta_hashed_bytes": total_meta,
        "shards": shards,
        "missing_shards": list((report.get("weights") or {}).get(
            "missing_shards") or []),
        "note": "shard integrity is by size; metadata by sha256",
    }


def verify(manifest: dict[str, Any]) -> dict[str, Any]:
    """Re-check a stored manifest against what is on disk now."""
    source = Path(manifest.get("source", ""))
    facts = manifest.get("integrity") or {}
    drift: list[str] = []
    missing: list[str] = []
    for item in facts.get("meta_files") or []:
        target = source / item["name"] if source.is_dir() else source
        digest = _sha256(target) if target.is_file() else None
        if digest is None:
            missing.append(item["name"])
        elif digest != item.get("sha256"):
            drift.append(item["name"])
    for item in facts.get("shards") or []:
        target = source / item["name"] if source.is_dir() else source
        try:
            size = target.stat().st_size if target.is_file() else None
        except OSError:
            size = None
        if size is None:
            missing.append(item["name"])
        elif item.get("size") is not None and size != item["size"]:
            drift.append(f"{item['name']} (size {item['size']} -> {size})")
    for name in facts.get("missing_shards") or []:
        missing.append(name)
    return {"ok": not drift and not missing, "drift": drift,
            "missing": missing, "source": str(source)}


def _stage_stage(manifest: dict[str, Any], state: str, stage: str,
                 path: Path, *, save: bool = True) -> None:
    manifest["state"] = state
    manifest["stage"] = stage
    manifest["updated"] = time.time()
    if save:
        _save(path, manifest)


def prepare(source: str | os.PathLike[str], *,
            outdir: str | os.PathLike[str] | None = None,
            data_dir: str | os.PathLike[str] | None = None,
            force: bool = False,
            convert: bool = False,
            on_event: EventSink | None = None) -> dict[str, Any]:
    """Run (or resume) the preparation pipeline for ``source``.

    ``convert=True`` plus ``outdir`` delegates to the family converter
    through ConversionService (streaming/resumable/cancellable/cached);
    without it, conversion is recorded as skipped with the exact command
    to run. Returns the final manifest; raises PrepareError only when the
    source itself is unusable.
    """
    src = Path(source).expanduser()
    try:
        src = src.resolve()
    except OSError as exc:
        raise PrepareError(f"cannot resolve {source}: {exc}") from exc
    if not src.exists():
        raise PrepareError(
            f"source not found: {src}; pass a GGUF file or a checkpoint "
            "directory")
    # Fail fast on unusable conversion arguments before doing any work.
    if convert and outdir is None:
        raise PrepareError(
            "conversion needs a fresh output directory: pass "
            "--outdir <new-dir> (the source checkpoint is never "
            "written to)")
    if outdir is not None and not convert:
        raise PrepareError("--outdir only applies to --convert; pass "
                           "--convert --outdir <new-dir> together")
    if convert and outdir is not None:
        out = Path(outdir).expanduser()
        if out.resolve() == src.resolve():
            raise PrepareError(
                "--outdir must differ from the source: preparation never "
                "modifies the original checkpoint")
    mpath = manifest_path(src, data_dir)
    manifest = _load(mpath) or {
        "version": 1,
        "source": str(src),
        "state": "imported",
        "created": time.time(),
        "stages": {},
    }
    if force:
        manifest["state"] = "imported"
        manifest["stages"] = {}

    # -- stage: inspect ----------------------------------------------------
    _emit(on_event, {"type": "stage", "stage": "inspect",
                     "state": "inspecting"})
    _stage_stage(manifest, "inspecting", "inspect", mpath)
    report = inspect_path(src)
    if report.get("kind") == KIND_UNKNOWN and not report.get("path"):
        raise PrepareError(f"cannot inspect {src}")
    manifest["report"] = report
    manifest["integrity"] = integrity_facts(report)
    manifest["stages"]["inspect"] = {"ok": True,
                                     "kind": report.get("kind"),
                                     "format": report.get("format")}
    _stage_stage(manifest, "inspecting", "inspect", mpath)
    _emit(on_event, {"type": "stage", "stage": "inspect", "state": "done",
                     "kind": report.get("kind"),
                     "format": report.get("format")})

    # -- stage: analyze ----------------------------------------------------
    _stage_stage(manifest, "analyzing", "analyze", mpath)
    _emit(on_event, {"type": "stage", "stage": "analyze",
                     "state": "analyzing"})
    from . import hardware as hardware_mod
    from . import planner as planner_mod
    hw = hardware_mod.probe(path=src)
    execution_plan = planner_mod.plan(report, hw)
    manifest["hardware"] = {
        "ram_free_gb": (hw.get("ram") or {}).get("available_gb"),
        "gpus": hw.get("gpus") or [],
        "unknowns": hw.get("unknowns") or [],
    }
    manifest["plan"] = {
        "recommended": execution_plan.get("recommended"),
        "risks": execution_plan.get("risks"),
        "suggestions": execution_plan.get("suggestions"),
        "assumptions": execution_plan.get("assumptions"),
    }
    manifest["stages"]["analyze"] = {"ok": True,
                                     "risks": len(execution_plan.get(
                                         "risks") or [])}
    _stage_stage(manifest, "analyzing", "analyze", mpath)
    _emit(on_event, {"type": "stage", "stage": "analyze", "state": "done",
                     "risks": execution_plan.get("risks")})

    # -- stage: validate ---------------------------------------------------
    _stage_stage(manifest, "validating", "validate", mpath)
    _emit(on_event, {"type": "stage", "stage": "validate",
                     "state": "validating"})
    from .routing import rank
    decision = rank(report)
    manifest["routing"] = {
        "selected": decision.get("selected"),
        "error": decision.get("error"),
        "candidates": [{"id": c["id"], "available": c["available"],
                        "reason": c["reason"], "primary": c["primary"]}
                       for c in decision.get("candidates", [])],
    }
    manifest["stages"]["validate"] = {"ok": decision.get("selected") is not None}
    if decision.get("selected") is None:
        _stage_stage(manifest, "unsupported", "validate", mpath)
        _emit(on_event, {"type": "stage", "stage": "validate",
                         "state": "unsupported",
                         "error": decision.get("error")})
        return manifest
    _stage_stage(manifest, "validating", "validate", mpath)
    _emit(on_event, {"type": "stage", "stage": "validate", "state": "done",
                     "selected": decision.get("selected")})

    # -- stage: convert (optional, never in place) -------------------------
    if convert:
        out = Path(outdir).expanduser()
        _stage_stage(manifest, "converting", "convert", mpath)
        _emit(on_event, {"type": "stage", "stage": "convert",
                         "state": "converting", "outdir": str(out)})
        ok, note = _run_conversion(src, out, on_event, data_dir)
        if not ok:
            _stage_stage(manifest, "failed", "convert", mpath)
            _emit(on_event, {"type": "stage", "stage": "convert",
                             "state": "failed", "error": note})
            return manifest
        manifest["stages"]["convert"] = {"ok": True, "outdir": str(out),
                                         "note": note}
        manifest["converted_to"] = str(out)
        _stage_stage(manifest, "ready_optimized", "convert", mpath)
        _emit(on_event, {"type": "stage", "stage": "convert", "state": "done",
                         "outdir": str(out)})
        return manifest
    manifest["stages"]["convert"] = {
        "ok": True,
        "skipped": True,
        "note": ("not requested; run `syntara prepare <source> --convert "
                 "--outdir <fresh-dir>` to convert for the engine suite "
                 "(delegates to the family converter)"),
    }
    _stage_stage(manifest, "ready_standard", "convert", mpath)
    _emit(on_event, {"type": "stage", "stage": "convert", "state": "skipped",
                     "note": manifest["stages"]["convert"]["note"]})
    return manifest


def _run_conversion(src: Path, out: Path, on_event: EventSink | None,
                    data_dir: str | os.PathLike[str] | None
                    ) -> tuple[bool, str]:
    """Delegate to ConversionService; (ok, note). Cancels on Ctrl-C."""
    from .conversion import ConversionError, ConversionService

    service = ConversionService(data_dir=data_dir)
    job = None

    def show(event: dict[str, Any]) -> None:
        _emit(on_event, event)

    try:
        job = service.start(str(src), str(out), on_event=show)
        job = service.wait(job.id)
    except ConversionError as exc:
        return False, str(exc)
    except KeyboardInterrupt:
        if job is not None:
            try:
                service.cancel(job.id)
                service.wait(job.id, timeout=15.0)
            except ConversionError:
                pass
        return False, ("conversion cancelled - rerun the same command to "
                       "resume (already-written shards are kept)")
    if job.status == "completed":
        return True, ("cached from a previous run" if job.cached
                      else "converted")
    if job.status == "cancelled":
        return False, ("conversion cancelled - rerun the same command to "
                       "resume (already-written shards are kept)")
    return False, (f"conversion failed: {job.error or 'unknown error'}; "
                   f"rerun to resume. Detail: "
                   f"{(job.error_detail or '')[-500:]}")


def load(source: str | os.PathLike[str],
         data_dir: str | os.PathLike[str] | None = None) -> dict[str, Any] | None:
    """The stored manifest for a source, or None when never prepared."""
    return _load(manifest_path(source, data_dir))
