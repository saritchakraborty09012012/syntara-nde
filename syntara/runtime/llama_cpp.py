"""llama.cpp-compatible GGUF runtime adapter.

Spawns the pinned llama.cpp server binary on loopback with a per-run API key,
waits for its health endpoint, and translates OpenAI-style chat requests to
it. Nothing outside this module knows the binary, its flags or its wire
format (AGENTS §12); the binary is installed separately by
``tools/fetch_llama_cpp.ps1`` (pinned URL + SHA-256) or pointed at with
``SYNTARA_LLAMA_BIN``.

Why a subprocess backend instead of in-process: it matches ARCHITECTURE.md's
backend router (llama.cpp-compatible slot), keeps our package stdlib-only,
and inherits a production GGUF runtime instead of a re-implementation.
"""
from __future__ import annotations

import json
import os
import secrets
import subprocess
import sys
import threading
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any, Iterator

from .base import RuntimeNotAvailable, RuntimeError
from .process import ManagedProcess, free_port, wait_until_healthy

# Pinned release the installer script fetches; capabilities() reports it.
PINNED_RELEASE = "b11321"
BIN_NAME = "llama-server.exe" if sys.platform == "win32" else "llama-server"
_ENV_BIN = "SYNTARA_LLAMA_BIN"

# Request-body keys the engine gateway uses that llama.cpp does not know.
_DROP_KEYS = ("enable_thinking", "cache_slot")
_RENAME_KEYS = {"max_completion_tokens": "max_tokens"}


def default_bin_dir() -> Path:
    return Path(__file__).resolve().parent / "bin"


def discover_binary() -> Path | None:
    """Locate the backend binary: env override, then the installed bin dir."""
    override = os.environ.get(_ENV_BIN)
    if override:
        p = Path(override).expanduser()
        if p.is_file():
            return p
        return None
    candidate = default_bin_dir() / BIN_NAME
    return candidate if candidate.is_file() else None


def _translate(body: dict[str, Any]) -> dict[str, Any]:
    """Map the local API request body onto llama.cpp's accepted schema."""
    out = {k: v for k, v in body.items() if k not in _DROP_KEYS}
    for old, new in _RENAME_KEYS.items():
        if old in out:
            out[new] = out.pop(old)
    out.setdefault("model", "syntara")
    return out


class LlamaCppRuntime:
    """Runtime adapter that drives one llama.cpp server process per model."""

    def __init__(self, model_path: str | os.PathLike[str], *,
                 binary: str | os.PathLike[str] | None = None,
                 context: int = 4096,
                 threads: int | None = None,
                 startup_timeout: float = 120.0) -> None:
        self.model_path = str(model_path)
        self.context = int(context)
        self.threads = threads
        self.startup_timeout = float(startup_timeout)
        self._binary = Path(binary).expanduser() if binary else discover_binary()
        self._proc: ManagedProcess | None = None
        self._port: int | None = None
        self._api_key = secrets.token_urlsafe(24)
        self._lock = threading.Lock()  # one generation at a time per backend
        self._version: str | None = None

    # ------------------------------------------------------------- lifecycle

    @property
    def loaded(self) -> bool:
        return self._proc is not None and self._proc.alive

    def load(self) -> None:
        if self.loaded:
            return
        if self._binary is None:
            raise RuntimeNotAvailable(
                "the GGUF runtime binary is not installed; run "
                "tools/fetch_llama_cpp.ps1 (Windows) to fetch the pinned "
                f"release, or set {_ENV_BIN} to an existing llama-server "
                "binary")
        if not os.path.isfile(self.model_path):
            raise RuntimeError(
                f"model file not found: {self.model_path}")
        with open(self.model_path, "rb") as fh:
            if fh.read(4) != b"GGUF":
                raise RuntimeError(
                    f"{self.model_path} is not a GGUF file; run "
                    f"`syntara inspect {self.model_path}` for details")

        self._port = free_port()
        argv = [
            str(self._binary),
            "-m", self.model_path,
            "--host", "127.0.0.1",
            "--port", str(self._port),
            "-c", str(self.context),
            "--api-key", self._api_key,
            "--no-ui",
        ]
        if self.threads:
            argv += ["-t", str(self.threads)]

        proc = ManagedProcess(argv)
        proc.spawn()
        proc.attach_stderr_drain()
        self._proc = proc
        healthy = wait_until_healthy(
            f"http://127.0.0.1:{self._port}/health",
            process=proc, timeout=self.startup_timeout,
            headers={"Authorization": f"Bearer {self._api_key}"})
        if not healthy:
            tail = self._stderr_tail()
            self.unload()  # never leave a half-started backend behind
            if "model loading error" in tail or "failed to load model" in tail:
                raise RuntimeError(
                    f"the runtime could not load {os.path.basename(self.model_path)}; "
                    "run `syntara inspect` on the file to see format/compatibility "
                    "findings", detail=tail)
            raise RuntimeError(
                "the GGUF runtime did not become ready in time; retry, or "
                "raise the timeout for a very large model",
                detail=tail)

    def unload(self) -> None:
        proc, self._proc = self._proc, None
        port, self._port = self._port, None
        if proc is not None:
            proc.terminate()
        # `port` kept for symmetry/debug; nothing to close here.

    def _stderr_tail(self) -> str:
        if self._proc is None:
            return ""
        return self._proc.read_stderr_tail()[-4000:]

    def capabilities(self) -> dict[str, Any]:
        return {
            "backend": "llama.cpp",
            "binary": str(self._binary) if self._binary else None,
            "available": self._binary is not None,
            "pinned_release": PINNED_RELEASE,
            "version": self.version(),
            "formats": ["gguf"],
            "streaming": True,
            "process_model": "one backend process per loaded model",
            "threading": self.threads or "backend default",
        }

    def version(self) -> str:
        if self._version or self._binary is None:
            return self._version or "unavailable"
        try:
            out = subprocess.run(  # noqa: S603 - trusted argv
                [str(self._binary), "--version"],
                capture_output=True, text=True, timeout=15,
                **_no_window_kwargs())
            line = (out.stdout or out.stderr or "").strip().splitlines()
            self._version = line[0] if line else "unknown"
        except (OSError, subprocess.SubprocessError):
            self._version = "unknown"
        return self._version

    def health(self) -> dict[str, Any]:
        info: dict[str, Any] = {
            "backend": "llama.cpp",
            "loaded": self.loaded,
            "model": os.path.basename(self.model_path) if self.model_path else None,
        }
        if self._proc is not None and not self._proc.alive:
            info["exited"] = self._proc.returncode
            info["error_tail"] = self._proc.read_stderr_tail()[-800:]
        return info

    # ----------------------------------------------------------------- chat

    def _headers(self) -> dict[str, str]:
        return {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self._api_key}",
        }

    def _require_ready(self) -> int:
        if not self.loaded or self._port is None:
            raise RuntimeError("no model is loaded in the runtime")
        return self._port

    def _post(self, path: str, payload: dict[str, Any], *,
              timeout: float) -> urllib.response.addinfourl:
        port = self._require_ready()
        url = f"http://127.0.0.1:{port}{path}"
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(url, data=data, headers=self._headers(),
                                     method="POST")
        try:
            return urllib.request.urlopen(req, timeout=timeout)  # noqa: S310 - loopback
        except urllib.error.HTTPError as exc:
            detail = ""
            try:
                detail = exc.read().decode("utf-8", errors="replace")[:1000]
            except OSError:
                pass
            raise RuntimeError(
                f"the backend rejected the request (HTTP {exc.code})",
                detail=detail) from exc
        except OSError as exc:
            raise RuntimeError(
                "the backend connection failed; the model may have crashed - "
                "check `syntara health` and retry", detail=str(exc)) from exc

    def chat(self, body: dict[str, Any]) -> dict[str, Any]:
        payload = _translate(body)
        payload["stream"] = False
        with self._lock:
            resp = self._post("/v1/chat/completions", payload, timeout=600.0)
            try:
                raw = resp.read()
            finally:
                resp.close()
        try:
            return json.loads(raw)
        except json.JSONDecodeError as exc:
            raise RuntimeError("the backend returned a non-JSON response",
                               detail=raw[:500].decode("utf-8", "replace")) from exc

    def stream(self, body: dict[str, Any]) -> Iterator[bytes]:
        payload = _translate(body)
        payload["stream"] = True
        payload.setdefault("stream_options", {"include_usage": True})
        with self._lock:
            resp = self._post("/v1/chat/completions", payload, timeout=600.0)
            try:
                yield from _iter_sse_frames(resp)
            except OSError as exc:
                raise RuntimeError(
                    "the stream to the backend broke mid-generation; retry "
                    "the request", detail=str(exc)) from exc
            finally:
                resp.close()


def _iter_sse_frames(resp: Any) -> Iterator[bytes]:
    """Yield complete ``data: ...\\n\\n`` frames from an SSE response."""
    buffer = b""
    while True:
        chunk = resp.read(65536)
        if not chunk:
            break
        buffer += chunk
        while True:
            idx = buffer.find(b"\n\n")
            if idx < 0:
                break
            frame, buffer = buffer[:idx + 2], buffer[idx + 2:]
            yield frame
    if buffer.strip():
        if not buffer.endswith(b"\n"):
            buffer += b"\n"
        yield buffer


def _no_window_kwargs() -> dict:
    if sys.platform == "win32":
        return {"creationflags": getattr(subprocess, "CREATE_NO_WINDOW", 0)}
    return {}
