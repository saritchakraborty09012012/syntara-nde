"""Local GGUF model library: discovery, registration and honest metadata.

The library is the durable, offline catalogue of model files the user chose
to make available (AGENTS §71/§72): it *references* files in place by
default (importing never copies unless asked, and never touches the
original), derives metadata from :mod:`syntara.gguf_inspect`, and stores a
small JSON index next to the other per-user data. Model binaries themselves
are never moved or deleted without an explicit, separate action.
"""
from __future__ import annotations

import json
import os
import re
import shutil
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from .gguf_inspect import GgufError, inspect_file
from .store import default_data_dir

_ID_RE = re.compile(r"[^a-z0-9._-]+")


def _slug(text: str) -> str:
    slug = _ID_RE.sub("-", text.lower()).strip("-._")
    return slug or "model"


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


class LibraryError(ValueError):
    """A user-actionable problem with a library operation."""


class ModelLibrary:
    """JSON-indexed catalogue of local GGUF files (metadata only)."""

    def __init__(self, data_dir: str | os.PathLike[str] | None = None) -> None:
        self.root = Path(data_dir) if data_dir else default_data_dir()
        self.models_dir = self.root / "models"
        self.index_path = self.root / "library.json"

    # --------------------------------------------------------------- storage

    def _read(self) -> list[dict[str, Any]]:
        try:
            raw = json.loads(self.index_path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            return []
        return raw if isinstance(raw, list) else []

    def _write(self, entries: list[dict[str, Any]]) -> None:
        self.root.mkdir(parents=True, exist_ok=True)
        tmp = self.index_path.with_suffix(".json.tmp")
        tmp.write_text(json.dumps(entries, ensure_ascii=False, indent=2),
                       encoding="utf-8")
        os.replace(tmp, self.index_path)

    # ------------------------------------------------------------------ read

    def _with_status(self, entry: dict[str, Any]) -> dict[str, Any]:
        path = Path(entry["path"])
        out = dict(entry)
        try:
            st = path.stat()
        except OSError:
            out["status"] = "missing"
            return out
        if st.st_size != entry.get("size") or int(st.st_mtime) != entry.get("mtime"):
            out["status"] = "modified"
        else:
            out["status"] = "ok"
        out["size"] = st.st_size
        return out

    def list(self) -> list[dict[str, Any]]:
        return [self._with_status(e) for e in self._read()]

    def get(self, model_id: str) -> dict[str, Any] | None:
        for entry in self._read():
            if entry.get("id") == model_id:
                return self._with_status(entry)
        return None

    def resolve(self, id_or_path: str) -> dict[str, Any]:
        """Resolve ``--model``: a library id, or a path (auto-registered)."""
        entry = self.get(id_or_path)
        if entry is not None:
            if entry["status"] == "missing":
                raise LibraryError(
                    f"model {id_or_path!r} points at {entry['path']} which no "
                    f"longer exists; re-add it with `syntara library add`")
            return entry
        path = Path(id_or_path).expanduser()
        if path.is_file():
            return self.add(path)
        known = ", ".join(e["id"] for e in self.list()) or "(none)"
        raise LibraryError(
            f"unknown model {id_or_path!r}: not a library id and not a file "
            f"path. Known models: {known}")

    # ----------------------------------------------------------------- write

    def _unique_id(self, stem: str, entries: list[dict[str, Any]]) -> str:
        taken = {e["id"] for e in entries}
        candidate = _slug(stem)
        counter = 2
        while candidate in taken:
            candidate = f"{_slug(stem)}-{counter}"
            counter += 1
        return candidate

    def add(self, path: str | os.PathLike[str], *, copy: bool = False,
            model_id: str | None = None) -> dict[str, Any]:
        """Register a GGUF file. References in place unless ``copy=True``."""
        src = Path(path).expanduser().resolve()
        if not src.is_file():
            raise LibraryError(f"file not found: {src}")
        try:
            report = inspect_file(src)
        except GgufError as exc:
            raise LibraryError(f"cannot add {src.name}: {exc}") from exc
        if not report["data_complete"]:
            raise LibraryError(
                f"cannot add {src.name}: tensor data is incomplete "
                f"({'; '.join(report['warnings']) or 'truncated file'})")

        entries = self._read()
        # Same file already registered under some id? Return it - but an
        # explicit id that differs from the registered one is a conflict,
        # not something to silently ignore.
        for entry in entries:
            if Path(entry["path"]).resolve() == src:
                if model_id is not None and entry["id"] != model_id:
                    raise LibraryError(
                        f"file already registered as {entry['id']!r}; "
                        f"remove that entry first or drop the explicit id")
                return self._with_status(entry)

        stored = src
        if copy:
            self.models_dir.mkdir(parents=True, exist_ok=True)
            target = self.models_dir / src.name
            if target.exists() and target.resolve() != src:
                stem, n = src.stem, 2
                while target.exists():
                    target = self.models_dir / f"{src.stem}-{n}{src.suffix}"
                    n += 1
            shutil.copy2(src, target)
            stored = target.resolve()

        if model_id is not None:
            if any(e["id"] == model_id for e in entries):
                raise LibraryError(f"model id {model_id!r} already exists")
            entry_id = model_id
        else:
            entry_id = self._unique_id(src.stem, entries)

        st = stored.stat()
        entry = {
            "id": entry_id,
            "path": str(stored),
            "added": _now(),
            "copied": bool(copy),
            "origin": str(src) if copy else None,
            "size": st.st_size,
            "mtime": int(st.st_mtime),
            "model": report["model"],
            "tensors": report["tensors"],
            "estimates": report["estimates"],
            "tokenizer": report["tokenizer"],
            "compatibility": {
                "badges": report["compatibility"]["badges"],
                "architecture_in_scope":
                    report["compatibility"]["architecture_in_scope"],
                "approved_quants_present":
                    report["compatibility"]["approved_quants_present"],
            },
        }
        entries.append(entry)
        self._write(entries)
        return self._with_status(entry)

    def scan(self, directory: str | os.PathLike[str], *, copy: bool = False,
             limit: int | None = None) -> dict[str, Any]:
        """Discover ``*.gguf`` files under ``directory`` and register them."""
        base = Path(directory).expanduser()
        if not base.is_dir():
            raise LibraryError(f"not a directory: {base}")
        added: list[str] = []
        skipped: list[dict[str, str]] = []
        found = sorted(base.rglob("*.gguf"))
        if limit is not None:
            found = found[:limit]
        for path in found:
            try:
                added.append(self.add(path, copy=copy)["id"])
            except LibraryError as exc:
                skipped.append({"path": str(path), "reason": str(exc)})
        return {"added": added, "skipped": skipped, "scanned": len(found)}

    def remove(self, model_id: str, *, delete_file: bool = False,
               expect: dict[str, Any] | None = None) -> dict[str, Any]:
        """Drop an entry from the index.

        The model file stays on disk unless ``delete_file`` is set - removal
        from the library is never file deletion (AGENTS §72/§102).
        """
        entries = self._read()
        kept: list[dict[str, Any]] = []
        target: dict[str, Any] | None = None
        for entry in entries:
            if entry.get("id") == model_id:
                target = entry
            else:
                kept.append(entry)
        if target is None:
            raise LibraryError(f"unknown model id {model_id!r}")

        deleted_file = None
        if delete_file:
            path = Path(target["path"])
            # The stored path came from our own index; still resolve and
            # require it to be a regular file before deleting.
            resolved = path.resolve()
            if not resolved.is_file():
                raise LibraryError(f"file already gone: {resolved}")
            if expect is not None:
                st = resolved.stat()
                if (expect.get("size") not in (None, st.st_size)
                        or expect.get("id") not in (None, model_id)):
                    raise LibraryError(
                        "refusing to delete: the file changed since it was "
                        "inspected (size mismatch); re-run the delete")
            resolved.unlink()
            deleted_file = str(resolved)

        self._write(kept)
        return {
            "removed": model_id,
            "file_deleted": deleted_file is not None,
            "deleted_path": deleted_file,
            "kept_entry_count": len(kept),
        }
