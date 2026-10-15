"""Storage accounting across model directories and LittleBit artifacts.

Answers "how much disk do my models use, and how much do compressed
artifacts save?" without loading any weights (headers and manifest reads
only, AGENTS §58).  Pure local filesystem inspection - no network.
"""

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any, Iterable

from . import artifact as art


def _dir_bytes(path: Path) -> tuple[int, int]:
    """(total_bytes, weight_bytes) for a directory; weights = *.safetensors
    plus the LittleBit packed weights file."""
    total = 0
    weights = 0
    for p in path.rglob("*"):
        if not p.is_file():
            continue
        try:
            size = p.stat().st_size
        except OSError:
            continue
        total += size
        if p.suffix == ".safetensors":
            weights += size
    return total, weights


def describe_path(path: Path) -> dict[str, Any]:
    """Describe one model directory (original checkpoint or artifact)."""
    path = Path(path).expanduser().resolve()
    entry: dict[str, Any] = {"path": str(path), "exists": path.exists()}
    if not path.exists():
        return entry
    if path.is_file():
        try:
            entry["kind"] = "file"
            entry["bytes"] = path.stat().st_size
        except OSError:
            entry["kind"] = "file"
            entry["bytes"] = 0
        return entry
    total, weight_bytes = _dir_bytes(path)
    entry.update(kind="directory", bytes=total, weight_bytes=weight_bytes)
    manifest_path = path / art.MANIFEST_NAME
    if manifest_path.is_file():
        try:
            manifest = art.load_manifest(path)
        except art.ArtifactError as exc:
            entry["artifact"] = {"valid": False, "error": str(exc)}
            return entry
        totals = manifest.get("totals") or {}
        source_bytes = int(totals.get("source_weight_bytes") or 0)
        compressed_weight_bytes = int(totals.get("artifact_bytes") or 0)
        ratio = (compressed_weight_bytes / source_bytes
                 if source_bytes else None)
        entry["artifact"] = {
            "valid": True,
            "algorithm": manifest.get("algorithm"),
            "settings": manifest.get("settings"),
            "target_bpw": (manifest.get("settings") or {}).get(
                "target_bpw"),
            "actual_bpw": totals.get("weighted_bpw_compressed"),
            "compressed_params": totals.get("compressed_params"),
            "total_params": totals.get("total_params"),
            "source_weight_bytes": source_bytes,
            "artifact_weight_bytes": compressed_weight_bytes,
            "compression_ratio": round(ratio, 4) if ratio else None,
            "saved_bytes": (source_bytes - compressed_weight_bytes
                            if source_bytes else None),
        }
    return entry


def storage_report(paths: Iterable[str | os.PathLike[str]]) -> dict[str, Any]:
    """Summarize disk usage + compression status for a set of paths."""
    entries = [describe_path(Path(p)) for p in paths]
    artifacts = [e for e in entries if (e.get("artifact") or {}).get("valid")]
    total_bytes = sum(int(e.get("bytes") or 0) for e in entries)
    saved = sum(int((e.get("artifact") or {}).get("saved_bytes") or 0)
                for e in artifacts)
    return {
        "entries": entries,
        "totals": {
            "paths": len(entries),
            "bytes": total_bytes,
            "valid_artifacts": len(artifacts),
            "saved_bytes_vs_source": saved,
        },
    }


def format_report(report: dict[str, Any]) -> str:
    """Human-readable rendering for the CLI."""
    lines: list[str] = []
    for e in report["entries"]:
        if not e.get("exists"):
            lines.append(f"{e['path']}  (missing)")
            continue
        if e.get("kind") == "file":
            lines.append(f"{e['path']}  file {e.get('bytes', 0)/1e6:.1f} MB")
            continue
        mb = (e.get("bytes") or 0) / 1e6
        line = f"{e['path']}  {mb:.1f} MB"
        art_info = e.get("artifact")
        if art_info is not None:
            if not art_info.get("valid"):
                line += f"  [invalid artifact: {art_info.get('error')}]"
            else:
                ratio = art_info.get("compression_ratio")
                bpw = art_info.get("actual_bpw")
                tgt = art_info.get("target_bpw")
                line += (f"  LittleBit artifact: {bpw} bpw "
                         f"(target {tgt}), source was "
                         f"{(art_info.get('source_weight_bytes') or 0)/1e6:.1f}"
                         f" MB weights"
                         + (f", {ratio:.2f}x smaller" if ratio else ""))
        lines.append(line)
    totals = report["totals"]
    lines.append(f"total: {totals['bytes']/1e6:.1f} MB across "
                 f"{totals['paths']} path(s); "
                 f"{totals['saved_bytes_vs_source']/1e6:.1f} MB saved by "
                 f"{totals['valid_artifacts']} artifact(s) vs sources")
    return "\n".join(lines)
