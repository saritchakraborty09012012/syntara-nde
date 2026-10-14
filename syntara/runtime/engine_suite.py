"""Syntara C engine-suite runtime adapter (openai_server.py as a backend).

Spawns the engine suite's own OpenAI gateway on loopback with a per-run API
key, waits until it is actually serving (its port binds before the engine is
ready, so a 200 on /health means "engine up"), then proxies chat/SSE to it -
the same OpenAI wire format the gateway already speaks, so nothing outside
this module knows the suite's flags or family logic (AGENTS §12).

Process tree: this host -> openai_server.py -> engine binary. The child is
bound to our lifetime (Windows job object in ManagedProcess; SIGTERM handler
in openai_server on POSIX), so an unload never orphans an engine (AGENTS §27).

Discovery of openai_server.py and the family registry lives in
:mod:`syntara.routing` - one source of truth.
"""
from __future__ import annotations

import json
import os
import secrets
import sys
import threading
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any, Iterator

from .base import GenerationCancelled, RuntimeNotAvailable, RuntimeError
from .process import ManagedProcess, free_port, wait_until_healthy

# Startup stderr markers -> actionable user messages (AGENTS §28).
_FAMILY_MARKERS = ("unknownfamilyerror", "unknown model_type",
                   "family config error", "is not a known model type")
_ENGINE_MARKERS = ("no such file", "cannot execute", "errno 2",
                   "engine binary", "not found", "is not recognized",
                   "winerror 2")
_OOM_MARKERS = ("out of memory", "outofmemory", "bad_alloc", "bad alloc",
                "cannot allocate", "not enough memory", "std::bad_alloc")
_BIND_MARKERS = ("only one usage of each socket address",
                 "address already in use", "errno 10048", "errno 98")

# Recv tick: every read waits at most this long, so cancel() is noticed
# within a quarter second even while a response is blocked mid-generation.
# (Closing a response does not abort a blocked recv on all platforms -
# Windows keeps it blocked until the socket timeout - so the read loops
# poll a short timeout instead of relying on close() to interrupt.)
_READ_TICK_S = 0.25


def _arm_cancel_reads(resp: Any) -> None:
    """Give a response's socket a short recv timeout (best effort)."""
    try:
        sock = resp.fp.raw._sock  # http.client wraps the socket in SocketIO
        sock.settimeout(_READ_TICK_S)
    except AttributeError:
        pass  # non-standard response object; cancel falls back to close()


def _clear_timeout_latch(resp: Any) -> None:
    """Undo CPython's sticky per-socket timeout latch.

    After one timeout, SocketIO refuses further reads with
    OSError("cannot read from timed out object") until the latch flag is
    cleared - so a tick-based read loop must reset it between ticks.
    """
    raw = getattr(getattr(resp, "fp", None), "raw", None)
    if raw is not None and getattr(raw, "_timeout_occurred", False):
        raw._timeout_occurred = False


def _lower(text: str) -> str:
    return (text or "").lower()


class EngineSuiteRuntime:
    """Runtime adapter driving one engine-suite gateway process per model."""

    def __init__(self, model_path: str | os.PathLike[str], *,
                 context: int | None = None,
                 threads: int | None = None,
                 startup_timeout: float = 300.0,
                 server_script: str | os.PathLike[str] | None = None) -> None:
        self.model_path = str(model_path)
        self.context = context       # engine-managed; see capabilities()
        self.threads = threads       # engine uses its own defaults
        self.startup_timeout = float(startup_timeout)
        if server_script is not None:
            self.server_script: Path | None = Path(server_script)
        else:
            from ..routing import discover_openai_server
            self.server_script = discover_openai_server()
        self._proc: ManagedProcess | None = None
        self._port: int | None = None
        self._api_key = secrets.token_urlsafe(24)
        self._lock = threading.Lock()  # one generation at a time per backend
        self._family: str | None = None
        # Cancellation: in-flight backend responses are closed by cancel()
        # (a separate lock - cancel must never wait on the generation lock).
        self._active_lock = threading.Lock()
        self._active: set[Any] = set()
        self._cancelled = False

    # ------------------------------------------------------------- lifecycle

    @property
    def loaded(self) -> bool:
        return self._proc is not None and self._proc.alive

    def load(self) -> None:
        if self.loaded:
            return
        if self.server_script is None or not self.server_script.is_file():
            raise RuntimeNotAvailable(
                "the Syntara engine suite gateway (openai_server.py) was "
                "not found; set SYNTARA_OPENAI_SERVER to it, or "
                'SYNTARA_ENGINE="python <repo>/c/syntara" to point at the '
                "engine launcher")
        model_dir = Path(self.model_path).expanduser()
        if not model_dir.is_dir():
            raise RuntimeError(
                f"model directory not found: {model_dir}; the engine suite "
                "runs converted checkpoint directories, not individual files")
        if not (model_dir / "config.json").is_file():
            raise RuntimeError(
                f"{model_dir} has no config.json, so no model family can be "
                "resolved; run `syntara inspect` on it, or convert it with "
                "`syntara convert --repo <dir> --outdir <fresh-dir>`")

        # One bind-error retry: a rare ephemeral-port clash must not fail
        # the whole load (AGENTS §61: bounded retries).
        for attempt in range(2):
            self._port = free_port()
            argv = [
                sys.executable, str(self.server_script),
                "--model", str(model_dir),
                "--host", "127.0.0.1",
                "--port", str(self._port),
                "--api-key", self._api_key,
            ]
            proc = ManagedProcess(argv)
            proc.spawn()
            proc.attach_stderr_drain()
            self._proc = proc
            healthy = wait_until_healthy(
                f"http://127.0.0.1:{self._port}/health",
                process=proc, timeout=self.startup_timeout)
            if healthy:
                return
            tail = self._stderr_tail()
            returncode = proc.returncode
            self.unload()  # never leave a half-started backend behind
            if attempt == 0 and any(m in _lower(tail) for m in _BIND_MARKERS):
                continue
            message, detail = self._startup_failure(
                tail, exited=returncode is not None)
            raise RuntimeError(message, detail=detail)

    def _startup_failure(self, tail: str, *, exited: bool) -> tuple[str, str]:
        """(message, detail) for a backend that never became healthy."""
        lowered = _lower(tail)
        if any(m in lowered for m in _FAMILY_MARKERS):
            return (
                f"the engine suite does not know how to run "
                f"{os.path.basename(self.model_path)}: its config.json "
                "model_type is not in the engine family registry; run it "
                "with the fallback runtime instead (set SYNTARA_RUNTIME="
                "transformers after installing torch transformers), or "
                "convert it for a supported family", tail[-4000:])
        if any(m in lowered for m in _ENGINE_MARKERS):
            return (
                "the engine binary for this model family is not built or "
                "not executable; build it on the engine side (cd c && make, "
                "see c/README.md) and retry", tail[-4000:])
        if any(m in lowered for m in _OOM_MARKERS):
            return (
                "the engine ran out of memory while starting; close other "
                "applications or prepare a smaller quantization of this "
                "model", tail[-4000:])
        if exited:
            return (
                "the engine suite gateway exited during startup; retry, and "
                "see the detail for its last words", tail[-4000:])
        return (
            "the engine suite did not become ready in time; large models "
            "can take minutes to load - raise the startup timeout or "
            "retry", tail[-4000:])

    def unload(self) -> None:
        proc, self._proc = self._proc, None
        self._port = None
        if proc is not None:
            proc.terminate()

    def _stderr_tail(self) -> str:
        if self._proc is None:
            return ""
        return self._proc.read_stderr_tail()[-4000:]

    def capabilities(self) -> dict[str, Any]:
        from ..routing import load_engine_registry
        registry = load_engine_registry()
        family = None
        if registry is not None:
            family = registry["model_types"].get(self._model_type())
        return {
            "backend": "syntara-engine-suite",
            "server_script": str(self.server_script)
            if self.server_script else None,
            "available": self.server_script is not None,
            "engine_family": family,
            "formats": ["safetensors", "pytorch-bin"],
            "streaming": True,
            "process_model": "openai_server.py -> engine binary, one tree "
                             "per loaded model",
            "context": "engine-managed (the gateway's --context does not "
                       "override engine context)",
            "modalities": ["text-input", "text-output"],
        }

    def _model_type(self) -> str:
        try:
            config_path = Path(self.model_path) / "config.json"
            doc = json.loads(config_path.read_text(encoding="utf-8"))
            return str(doc.get("model_type") or "").lower()
        except (OSError, ValueError, AttributeError):
            return ""

    def health(self) -> dict[str, Any]:
        info: dict[str, Any] = {
            "backend": "syntara-engine-suite",
            "loaded": self.loaded,
            "model": os.path.basename(self.model_path.rstrip("/\\")),
            "port": self._port,
        }
        family = self.capabilities().get("engine_family")
        if family:
            info["engine_family"] = family
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

    def cancel(self) -> None:
        """Abort in-flight request(s) by closing their backend connection."""
        with self._active_lock:
            self._cancelled = True
            actives = list(self._active)
        for resp in actives:
            try:
                resp.close()
            except (OSError, ValueError):
                pass

    def _release(self, resp: Any) -> None:
        with self._active_lock:
            self._active.discard(resp)
        try:
            resp.close()
        except OSError:
            pass

    def _post(self, path: str, payload: dict[str, Any], *,
              timeout: float) -> urllib.response.addinfourl:
        port = self._require_ready()
        url = f"http://127.0.0.1:{port}{path}"
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(url, data=data, headers=self._headers(),
                                     method="POST")
        with self._active_lock:
            if self._cancelled:
                raise GenerationCancelled()
        try:
            resp = urllib.request.urlopen(req, timeout=timeout)  # noqa: S310 - loopback
        except urllib.error.HTTPError as exc:
            detail = ""
            try:
                detail = exc.read().decode("utf-8", errors="replace")[:1000]
            except OSError:
                pass
            raise RuntimeError(
                f"the engine suite rejected the request (HTTP {exc.code})",
                detail=detail) from exc
        except OSError as exc:
            if self._cancelled:
                raise GenerationCancelled() from exc
            raise RuntimeError(
                "the engine suite connection failed; the engine may have "
                "crashed - check `syntara health` and retry",
                detail=str(exc)) from exc
        with self._active_lock:
            if self._cancelled:
                resp.close()
                raise GenerationCancelled()
            self._active.add(resp)
        _arm_cancel_reads(resp)
        return resp

    def _read_all(self, resp: Any) -> bytes:
        """Read a full response body, ticking so cancel() stays responsive."""
        chunks: list[bytes] = []
        while True:
            try:
                chunk = resp.read()
            except TimeoutError:
                if self._cancelled:
                    raise GenerationCancelled() from None
                _clear_timeout_latch(resp)
                continue
            except ValueError as exc:
                # closed response (cancel or teardown) mid-read
                if self._cancelled:
                    raise GenerationCancelled() from exc
                raise
            if not chunk:
                return b"".join(chunks)
            chunks.append(chunk)

    def _iter_frames(self, resp: Any) -> Iterator[bytes]:
        """Yield ``data:`` SSE frames, one available byte group at a time.

        ``resp.read(65536)`` blocks until 64KB or EOF, which would delay
        every frame to the end of the stream; ``read(1)`` returns as soon
        as any bytes are buffered, so frames surface as the engine sends
        them (AGENTS §67).
        """
        buffer = b""
        while True:
            try:
                chunk = resp.read(1)
            except TimeoutError:
                if self._cancelled:
                    raise GenerationCancelled() from None
                _clear_timeout_latch(resp)
                continue
            except ValueError as exc:
                if self._cancelled:
                    raise GenerationCancelled() from exc
                raise
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

    def chat(self, body: dict[str, Any]) -> dict[str, Any]:
        payload = dict(body)
        payload["stream"] = False
        with self._lock:
            self._cancelled = False  # a cancel only applies to its generation
            resp = self._post("/v1/chat/completions", payload, timeout=600.0)
            try:
                raw = self._read_all(resp)
            except OSError as exc:
                if self._cancelled:
                    raise GenerationCancelled() from exc
                raise RuntimeError(
                    "the engine suite connection broke mid-response; retry "
                    "the request", detail=str(exc)) from exc
            finally:
                self._release(resp)
        try:
            return json.loads(raw)
        except json.JSONDecodeError as exc:
            raise RuntimeError(
                "the engine suite returned a non-JSON response",
                detail=raw[:500].decode("utf-8", "replace")) from exc

    def stream(self, body: dict[str, Any]) -> Iterator[bytes]:
        payload = dict(body)
        payload["stream"] = True
        payload.setdefault("stream_options", {"include_usage": True})
        with self._lock:
            self._cancelled = False
            resp = self._post("/v1/chat/completions", payload, timeout=600.0)
            try:
                yield from self._iter_frames(resp)
            except OSError as exc:
                if self._cancelled:
                    raise GenerationCancelled() from exc
                raise RuntimeError(
                    "the engine suite stream broke mid-generation; retry "
                    "the request", detail=str(exc)) from exc
            finally:
                self._release(resp)

    # image inputs are a preserved path (Obj 6): the suite's own gateway
    # understands image_url content for vision families, so bodies pass
    # through untouched - no transformation here would be correct.
