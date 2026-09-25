"""Local-first user data store for the Syntara developer SDK.

The local runtime (the gateway) serves one model and does not persist
conversations, projects or settings: in the desktop app those live in the
browser's local storage, and in this SDK they live in a per-user data
directory on the same machine. Nothing leaves the device.

The store backs the SDK's ``projects`` and ``backups`` surfaces and the
CLI's ``syntara project`` and ``syntara backup`` commands, giving the
no-account product a first-class, offline backup path (spec: "Complete
Backup / Import / Export").
"""
from __future__ import annotations

import json
import os
import re
import shutil
import tempfile
import uuid
import zipfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from ._version import __version__

ALLOWED_SECTIONS = ("chats", "memories", "projects", "settings")
BACKUP_EXT = ".syntara-backup"
BACKUP_FORMAT = "syntara-backup"
BACKUP_VERSION = 1

_SECRET_RE = re.compile(r"^(.*[\r\n])?(api[_-]?key|password|secret|token)\b", re.IGNORECASE)


def default_data_dir() -> Path:
    """Per-user Syntara data directory, honoring SYNTARA_HOME when set."""
    override = os.environ.get("SYNTARA_HOME")
    if override:
        return Path(override).expanduser()
    if os.name == "nt":
        base = os.environ.get("LOCALAPPDATA") or os.path.expanduser("~\\AppData\\Local")
        return Path(base) / "Syntara"
    xdg = os.environ.get("XDG_DATA_HOME")
    if xdg:
        return Path(xdg) / "syntara"
    return Path.home() / ".local" / "share" / "syntara"


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _new_id(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex[:12]}"


class LocalStore:
    """JSON-file-backed per-user store for chats, memories, projects, settings.

    Thread-safety is left to the caller: the SDK and CLI are single-threaded,
    and concurrent writers of the same file may lose an update.
    """

    def __init__(self, path: str | os.PathLike | None = None) -> None:
        self.root = Path(path) if path else default_data_dir()
        self.chats_dir = self.root / "chats"

    # ---------------------------------------------------------------- plumbing

    def _read_json(self, path: Path, default: Any) -> Any:
        try:
            return json.loads(path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            return default

    def _write_json(self, path: Path, obj: Any) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        tmp = path.with_name(path.name + ".tmp")
        tmp.write_text(json.dumps(obj, ensure_ascii=False, indent=2), encoding="utf-8")
        os.replace(tmp, path)

    # ---------------------------------------------------------------- settings

    def settings(self) -> dict[str, Any]:
        return self._read_json(self.root / "settings.json", {})

    def set_settings(self, changes: dict[str, Any]) -> dict[str, Any]:
        current = dict(self.settings())
        # Never persist credentials, even if a caller passes them in.
        current.update({k: v for k, v in changes.items() if not _SECRET_RE.search(k)})
        self._write_json(self.root / "settings.json", current)
        return current

    # ---------------------------------------------------------------- projects

    def list_projects(self) -> list[dict[str, Any]]:
        return list(self._read_json(self.root / "projects.json", []))

    def get_project(self, project_id: str) -> dict[str, Any] | None:
        for project in self.list_projects():
            if project.get("id") == project_id:
                return project
        return None

    def create_project(self, name: str, description: str = "",
                       meta: dict[str, Any] | None = None) -> dict[str, Any]:
        if not name or not str(name).strip():
            raise ValueError("project name must not be empty")
        projects = self.list_projects()
        for project in projects:
            if project.get("name") == name:
                raise ValueError(f"a project named {name!r} already exists")
        now = _now()
        project = {
            "id": _new_id("p"),
            "name": name,
            "description": description,
            "created_at": now,
            "updated_at": now,
            "meta": dict(meta or {}),
        }
        projects.append(project)
        self._write_json(self.root / "projects.json", projects)
        return project

    def delete_project(self, project_id: str) -> bool:
        projects = self.list_projects()
        remaining = [p for p in projects if p.get("id") != project_id]
        if len(remaining) == len(projects):
            return False
        self._write_json(self.root / "projects.json", remaining)
        return True

    # ---------------------------------------------------------------- memories

    def list_memories(self) -> list[dict[str, Any]]:
        return list(self._read_json(self.root / "memories.json", []))

    def add_memory(self, text: str, meta: dict[str, Any] | None = None) -> dict[str, Any]:
        if not text or not str(text).strip():
            raise ValueError("memory text must not be empty")
        now = _now()
        memory = {"id": _new_id("m"), "text": text, "created_at": now,
                  "updated_at": now, "meta": dict(meta or {})}
        memories = self.list_memories()
        memories.append(memory)
        self._write_json(self.root / "memories.json", memories)
        return memory

    def update_memory(self, memory_id: str, text: str) -> dict[str, Any] | None:
        if not text or not str(text).strip():
            raise ValueError("memory text must not be empty")
        memories = self.list_memories()
        updated = None
        for memory in memories:
            if memory.get("id") == memory_id:
                memory["text"] = text
                memory["updated_at"] = _now()
                updated = memory
                break
        if updated is None:
            return None
        self._write_json(self.root / "memories.json", memories)
        return updated

    def delete_memory(self, memory_id: str) -> bool:
        memories = self.list_memories()
        remaining = [m for m in memories if m.get("id") != memory_id]
        if len(remaining) == len(memories):
            return False
        self._write_json(self.root / "memories.json", remaining)
        return True

    # ---------------------------------------------------------------- chats

    def list_chats(self) -> list[str]:
        return list(self._read_json(self.chats_dir / "index.json", []))

    def get_chat(self, chat_id: str) -> list[dict[str, Any]] | None:
        path = self.chats_dir / f"{chat_id}.json"
        if not path.is_file():
            return None
        return self._read_json(path, [])

    def save_chat(self, messages: list[dict[str, Any]], chat_id: str | None = None) -> str:
        chat_id = chat_id or _new_id("c")
        self.chats_dir.mkdir(parents=True, exist_ok=True)
        self._write_json(self.chats_dir / f"{chat_id}.json", list(messages))
        index = self.list_chats()
        if chat_id not in index:
            index.append(chat_id)
        self._write_json(self.chats_dir / "index.json", index)
        return chat_id

    def delete_chat(self, chat_id: str) -> bool:
        path = self.chats_dir / f"{chat_id}.json"
        existed = path.is_file()
        if existed:
            path.unlink()
        index = [c for c in self.list_chats() if c != chat_id]
        self._write_json(self.chats_dir / "index.json", index)
        return existed

    # ---------------------------------------------------------------- backups

    def create_backup(self, out: str | os.PathLike | None = None,
                      include: Any = ALLOWED_SECTIONS,
                      model_refs: list[dict[str, Any]] | None = None) -> Path:
        """Write a ``.syntara-backup`` archive and return its path.

        ``include`` selects sections; model *references* (never weights) are
        recorded in ``models.json`` when ``model_refs`` is provided.
        """
        sections = self._sections(include)
        destination = self._backup_target(out)
        directory = tempfile.mkdtemp(prefix="syntara-backup-")
        try:
            files: dict[str, bytes] = {}
            if "settings" in sections:
                files["settings.json"] = _json_bytes(self.settings())
            if "projects" in sections:
                files["projects.json"] = _json_bytes(self.list_projects())
            if "memories" in sections:
                files["memories.json"] = _json_bytes(self.list_memories())
            if "chats" in sections:
                chats = {}
                for chat_id in self.list_chats():
                    messages = self.get_chat(chat_id)
                    if messages is not None:
                        chats[chat_id] = messages
                files["chats/index.json"] = _json_bytes(list(chats))
                for chat_id, messages in chats.items():
                    files[f"chats/{chat_id}.json"] = _json_bytes(messages)
            if model_refs:
                files["models.json"] = _json_bytes(
                    {"version": 1, "models": list(model_refs),
                     "note": "references only; model weights stay on the origin device"})
            manifest = {
                "format": BACKUP_FORMAT,
                "version": BACKUP_VERSION,
                "created_at": _now(),
                "creator": {"name": "syntara", "version": __version__},
                "includes": sorted(sections),
                "files": sorted(files),
            }
            files["manifest.json"] = _json_bytes(manifest)

            destination.parent.mkdir(parents=True, exist_ok=True)
            fd, tmp_zip = tempfile.mkstemp(prefix="syntara-backup-", suffix=".zip",
                                           dir=str(destination.parent))
            os.close(fd)
            try:
                with zipfile.ZipFile(tmp_zip, "w", zipfile.ZIP_DEFLATED) as archive:
                    for name, payload in files.items():
                        archive.writestr(_safe_arcname(name), payload)
                os.replace(tmp_zip, destination)
            except BaseException:
                for leftover in (tmp_zip,):
                    try:
                        os.unlink(leftover)
                    except OSError:
                        pass
                raise
            return destination
        finally:
            shutil.rmtree(directory, ignore_errors=True)

    def list_backups(self) -> list[dict[str, Any]]:
        backups_dir = self.root / "backups"
        if not backups_dir.is_dir():
            return []
        found = []
        for path in sorted(backups_dir.glob(f"*{BACKUP_EXT}")):
            try:
                info = self.verify_backup(path)
                found.append({"path": str(path), "size": path.stat().st_size,
                              "ok": bool(info.get("ok")), "manifest": info.get("manifest"),
                              "error": info.get("error")})
            except Exception as exc:
                found.append({"path": str(path), "ok": False, "error": str(exc)})
        return found

    def verify_backup(self, archive: str | os.PathLike) -> dict[str, Any]:
        path = Path(archive)
        result: dict[str, Any] = {"ok": False, "archive": str(path)}
        if not path.is_file():
            result["error"] = f"{path} does not exist"
            return result
        try:
            with zipfile.ZipFile(path, "r") as zf:
                entries = zf.namelist()
                for entry in entries:
                    try:
                        normalized = _safe_arcname(entry)
                    except ValueError:
                        result["error"] = f"archive contains an unsafe entry {entry!r}"
                        return result
                    if normalized != entry:
                        result["error"] = f"archive contains an unsafe entry {entry!r}"
                        return result
                try:
                    manifest = json.loads(zf.read("manifest.json").decode("utf-8"))
                except (KeyError, json.JSONDecodeError) as exc:
                    result["error"] = f"manifest missing or invalid: {exc}"
                    return result
                if manifest.get("format") != BACKUP_FORMAT or manifest.get("version") != BACKUP_VERSION:
                    result["error"] = "backup format/version not recognized"
                    return result
                includes = manifest.get("includes", [])
                for section in includes:
                    if section not in ALLOWED_SECTIONS:
                        result["error"] = f"unknown backup section {section!r}"
                        return result
                    required = "chats/index.json" if section == "chats" else f"{section}.json"
                    if required not in entries:
                        result["error"] = f"section {section!r} missing {required!r}"
                        return result
                result.update({"ok": True, "manifest": manifest,
                               "includes": includes, "created_at": manifest.get("created_at"),
                               "entries": len(entries)})
                return result
        except zipfile.BadZipFile as exc:
            result["error"] = f"not a valid archive: {exc}"
            return result

    def restore_backup(self, archive: str | os.PathLike,
                       include: Any = ALLOWED_SECTIONS, merge: bool = True) -> dict[str, Any]:
        """Restore selected sections from an archive into this store."""
        path = Path(archive)
        verified = self.verify_backup(path)
        if not verified.get("ok"):
            raise ValueError(f"cannot restore {path}: {verified.get('error')}")
        wanted = self._sections(include)
        available = set(verified["includes"])
        summary: dict[str, Any] = {"restored": [], "skipped": [], "errors": []}
        with zipfile.ZipFile(path, "r") as zf:
            if "settings" in wanted and "settings" in available:
                if merge:
                    merged = dict(self.settings())
                    merged.update(json.loads(zf.read("settings.json").decode("utf-8")))
                    self._write_json(self.root / "settings.json", merged)
                else:
                    self._write_json(self.root / "settings.json",
                                     json.loads(zf.read("settings.json").decode("utf-8")))
                summary["restored"].append("settings")
            elif "settings" in wanted:
                summary["skipped"].append("settings")

            if "projects" in wanted and "projects" in available:
                projects = json.loads(zf.read("projects.json").decode("utf-8"))
                if merge:
                    existing = {p.get("id"): p for p in self.list_projects()}
                    for project in projects:
                        existing[project["id"]] = project
                    projects = list(existing.values())
                self._write_json(self.root / "projects.json", projects)
                summary["restored"].append("projects")
            elif "projects" in wanted:
                summary["skipped"].append("projects")

            if "memories" in wanted and "memories" in available:
                memories = json.loads(zf.read("memories.json").decode("utf-8"))
                if merge:
                    seen = {m.get("id") for m in self.list_memories()}
                    memories = list(self.list_memories()) + [m for m in memories if m.get("id") not in seen]
                self._write_json(self.root / "memories.json", memories)
                summary["restored"].append("memories")
            elif "memories" in wanted:
                summary["skipped"].append("memories")

            if "chats" in wanted and "chats" in available:
                incoming_ids = json.loads(zf.read("chats/index.json").decode("utf-8"))
                self.chats_dir.mkdir(parents=True, exist_ok=True)
                for chat_id in incoming_ids:
                    try:
                        messages = json.loads(zf.read(f"chats/{chat_id}.json").decode("utf-8"))
                    except KeyError:
                        summary["skipped"].append(f"chats/{chat_id}")
                        continue
                    existing = self.get_chat(chat_id)
                    self.save_chat(messages if not (merge and existing) else (existing + messages),
                                   chat_id=chat_id)
                summary["restored"].append("chats")
            elif "chats" in wanted:
                summary["skipped"].append("chats")
        return summary

    # ---------------------------------------------------------------- helpers

    def _sections(self, include: Any) -> tuple[str, ...]:
        if include is None:
            return tuple(ALLOWED_SECTIONS)
        if isinstance(include, str):
            include = [part.strip() for part in include.split(",") if part.strip()]
        unknown = [str(s) for s in include if str(s) not in ALLOWED_SECTIONS]
        if unknown:
            raise ValueError(f"unknown backup sections: {', '.join(unknown)}")
        if not include:
            return ()
        return tuple(dict.fromkeys(str(s) for s in include))

    def _backup_target(self, out: str | os.PathLike | None) -> Path:
        if out is None:
            return self.root / "backups" / f"syntara-backup-{_stamp()}{BACKUP_EXT}"
        path = Path(out)
        if path.exists() and path.is_dir():
            return path / f"syntara-backup-{_stamp()}{BACKUP_EXT}"
        if not path.name:
            return path / f"syntara-backup-{_stamp()}{BACKUP_EXT}"
        if not str(path.name).endswith(BACKUP_EXT):
            path = path.with_name(str(path.name) + BACKUP_EXT)
        return path


def _stamp() -> str:
    return datetime.now().strftime("%Y%m%d-%H%M%S")


def _json_bytes(obj: Any) -> bytes:
    return json.dumps(obj, ensure_ascii=False, indent=2).encode("utf-8")


def _safe_arcname(name: str) -> str:
    normalized = name.replace("\\", "/")
    parts = [p for p in normalized.split("/") if p not in ("", ".")]
    if any(p == ".." for p in parts) or normalized.startswith("/"):
        raise ValueError(f"unsafe archive entry name {name!r}")
    return "/".join(parts)