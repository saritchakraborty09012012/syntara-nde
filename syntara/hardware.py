"""Capability-based hardware detection with honest unknowns (AGENTS §13/§49).

Probes what this machine actually has - CPU, RAM, GPUs, storage, runtime
backends - using best-effort, short-timeout, optional tools. Nothing here
assumes a discrete GPU, a vendor tool, or an OS; anything not detectable
is reported in ``unknowns`` instead of being guessed (AGENTS §92).

Probes are cached for a few seconds: the CLI, gateway health and the
planner may all ask during one session without re-running subprocesses.
"""
from __future__ import annotations

import os
import platform
import shutil
import subprocess
import sys
import time
from typing import Any

_CACHE_TTL_S = 15.0
_cache: dict[str, Any] = {"at": 0.0, "value": None}
_NO_WINDOW = {"creationflags": getattr(subprocess, "CREATE_NO_WINDOW", 0)} \
    if sys.platform == "win32" else {}


def _run(argv: list[str], *, timeout: float) -> str | None:
    """Run a probe tool briefly; None on any failure (never raises)."""
    try:
        out = subprocess.run(  # noqa: S603 - fixed argv, no shell
            argv, capture_output=True, text=True, timeout=timeout,
            **_NO_WINDOW)
    except (OSError, subprocess.SubprocessError, ValueError):
        return None
    if out.returncode != 0:
        return None
    return out.stdout or ""


def _ram() -> dict[str, Any]:
    """Total + available RAM in GB, or an honest partial result."""
    result: dict[str, Any] = {"total_gb": None, "available_gb": None,
                              "source": "unavailable"}
    try:
        if os.name == "nt":
            import ctypes

            class MEMORYSTATUSEX(ctypes.Structure):
                _fields_ = [
                    ("dwLength", ctypes.c_ulong),
                    ("dwMemoryLoad", ctypes.c_ulong),
                    ("ullTotalPhys", ctypes.c_ulonglong),
                    ("ullAvailPhys", ctypes.c_ulonglong),
                    ("ullTotalPageFile", ctypes.c_ulonglong),
                    ("ullAvailPageFile", ctypes.c_ulonglong),
                    ("ullTotalVirtual", ctypes.c_ulonglong),
                    ("ullAvailVirtual", ctypes.c_ulonglong),
                    ("ullAvailExtendedVirtual", ctypes.c_ulonglong)]

            stat = MEMORYSTATUSEX()
            stat.dwLength = ctypes.sizeof(MEMORYSTATUSEX)
            if ctypes.windll.kernel32.GlobalMemoryStatusEx(  # type: ignore[attr-defined]
                    ctypes.byref(stat)):
                result["total_gb"] = round(stat.ullTotalPhys / (1024 ** 3), 1)
                result["available_gb"] = round(
                    stat.ullAvailPhys / (1024 ** 3), 1)
                result["source"] = "GlobalMemoryStatusEx"
        else:
            total = os.sysconf("SC_PHYS_PAGES")
            page = os.sysconf("SC_PAGE_SIZE")
            avail = os.sysconf("SC_AVPHYS_PAGES")
            if total > 0 and page > 0:
                result["total_gb"] = round(total * page / (1024 ** 3), 1)
                result["source"] = "sysconf"
            if avail > 0 and page > 0:
                result["available_gb"] = round(avail * page / (1024 ** 3), 1)
    except (OSError, ValueError, AttributeError):
        pass
    return result


def _cpu() -> dict[str, Any]:
    info: dict[str, Any] = {
        "arch": platform.machine() or None,
        "name": platform.processor() or None,
        "cores_logical": os.cpu_count(),
        "flags": [],
    }
    if sys.platform.startswith("linux"):
        try:
            with open("/proc/cpuinfo", encoding="utf-8", errors="replace") as fh:
                text = fh.read()
        except OSError:
            text = ""
        for line in text.splitlines():
            if line.lower().startswith("flags") or line.lower().startswith(
                    "features"):
                features = set(line.split(":", 1)[-1].split())
                info["flags"] = sorted(
                    f for f in ("avx2", "avx512f", "avx512_bf16", "f16c",
                                "amx_tile", "neon", "asimd")
                    if f in features)
                break
        if not info["name"]:
            for line in text.splitlines():
                if line.lower().startswith("model name"):
                    info["name"] = line.split(":", 1)[-1].strip()
                    break
    return info


def _gpus(unknowns: list[str]) -> list[dict[str, Any]]:
    gpus: list[dict[str, Any]] = []
    # NVIDIA: nvidia-smi gives name + VRAM in one trustworthy query.
    out = _run(["nvidia-smi",
                "--query-gpu=name,memory.total",
                "--format=csv,noheader,nounits"], timeout=4.0)
    if out:
        for line in out.splitlines():
            parts = [p.strip() for p in line.rsplit(",", 1)]
            if len(parts) == 2:
                try:
                    mib = float(parts[1])
                except ValueError:
                    continue
                gpus.append({"vendor": "nvidia", "name": parts[0],
                             "vram_gb": round(mib / 1024, 1)})
    # AMD on Linux: rocm-smi is optional; absence is an unknown, not a "no".
    if not gpus and sys.platform.startswith("linux"):
        import re
        out = _run(["rocm-smi", "--showmeminfo", "vram", "--csv"],
                   timeout=4.0)
        if out:
            # Parse conservatively: only claim a GPU when the CSV clearly
            # carries a memory value in MiB.
            match = re.search(r"(\d+)\s*(MiB|MB)", out)
            if match:
                gpus.append({"vendor": "amd", "name": "AMD GPU (rocm-smi)",
                             "vram_gb": round(int(match.group(1)) / 1024, 1)})
    if sys.platform == "darwin":
        # Apple Silicon: unified memory, Metal is the engine's path.
        gpus.append({"vendor": "apple",
                     "name": platform.processor() or "Apple silicon",
                     "vram_gb": None, "unified_memory": True})
    if not gpus:
        unknowns.append("no GPU detected (nvidia-smi/rocm-smi not found or "
                        "no device reported); CPU execution assumed")
    return gpus


def _storage(path: str | os.PathLike[str] | None) -> dict[str, Any]:
    if path is None:
        return {}
    target = _existing_parent(path)
    if target is None:
        return {}
    try:
        usage = shutil.disk_usage(target)
    except OSError:
        return {"path": str(target), "free_gb": None, "total_gb": None,
                "note": "disk usage unreadable"}
    return {"path": str(target),
            "free_gb": round(usage.free / (1024 ** 3), 1),
            "total_gb": round(usage.total / (1024 ** 3), 1)}


def _existing_parent(path: str | os.PathLike[str]) -> Any:
    """Existing directory (or nearest existing parent) for disk_usage."""
    from pathlib import Path
    p = Path(path).expanduser()
    try:
        if p.exists():
            return p if p.is_dir() else p.parent
        parent = p.parent
        while not parent.exists() and parent != parent.parent:
            parent = parent.parent
        return parent
    except OSError:
        return None


def _backends() -> dict[str, Any]:
    from .routing import (diffusers_availability, discover_openai_server,
                          transformers_availability)
    from .runtime.llama_cpp import discover_binary
    llama = discover_binary()
    try:
        tf_ok, tf_reason = transformers_availability()
    except Exception:  # noqa: BLE001 - diagnostics only
        tf_ok, tf_reason = False, "availability check failed"
    try:
        img_ok, img_reason = diffusers_availability()
    except Exception:  # noqa: BLE001
        img_ok, img_reason = False, "availability check failed"
    server = discover_openai_server()
    return {
        "llama_cpp": {"available": llama is not None,
                      "binary": str(llama) if llama else None},
        "engine_suite": {"available": server is not None,
                         "script": str(server) if server else None},
        "transformers": {"available": tf_ok, "reason": tf_reason or None},
        "diffusers": {"available": img_ok, "reason": img_reason or None},
    }


def probe(*, path: str | os.PathLike[str] | None = None,
          refresh: bool = False) -> dict[str, Any]:
    """A hardware/backend profile of this machine.

    Returns cpu/ram/gpus/storage/backends plus an ``unknowns`` list of
    things that could not be determined. Cached for _CACHE_TTL_S seconds
    (``refresh=True`` bypasses the cache).
    """
    now = time.monotonic()
    cache_key = str(path or "")
    if (not refresh and _cache["value"] is not None
            and now - float(_cache["at"]) < _CACHE_TTL_S
            and _cache.get("key") == cache_key):
        return _cache["value"]
    unknowns: list[str] = []
    ram = _ram()
    if ram.get("available_gb") is None:
        unknowns.append("available RAM could not be read on this platform")
    gpus = _gpus(unknowns)
    profile = {
        "platform": {
            "system": platform.system(),
            "release": platform.release(),
            "machine": platform.machine(),
        },
        "cpu": _cpu(),
        "ram": ram,
        "gpus": gpus,
        "storage": _storage(path),
        "backends": _backends(),
        "probed_at": time.time(),
        "unknowns": unknowns,
    }
    _cache.update({"at": now, "value": profile, "key": cache_key})
    return profile


def clear_cache() -> None:
    _cache.update({"at": 0.0, "value": None, "key": None})


def gpu_summary(profile: dict[str, Any]) -> str:
    """Short label for gateway hwinfo (replaces 'not probed')."""
    gpus = profile.get("gpus") or []
    if not gpus:
        return "none detected (CPU)"
    parts = []
    for gpu in gpus:
        vram = gpu.get("vram_gb")
        label = f"{gpu.get('name', 'GPU')} ({vram} GB)" if vram \
            else str(gpu.get("name", "GPU"))
        if gpu.get("unified_memory"):
            label += ", unified memory"
        parts.append(label)
    return "; ".join(parts)
