"""The local host gateway: library + runtime behind one loopback API.

Serves the OpenAI-compatible surface the SDK/CLI/desktop already speak
(``/v1/models``, ``/v1/chat/completions`` with SSE streaming) plus the
host-level ``/health`` and ``/profile``. Binds to 127.0.0.1 by default -
never expose a local inference server beyond loopback silently
(AGENTS §26). Inference itself is delegated to a runtime adapter; this
module owns routing, validation, usage bookkeeping and CORS.

Endpoints not implemented by this host yet answer honestly (HTTP 501 with
``code: not_implemented``) instead of pretending (AGENTS §17).
"""
from __future__ import annotations

import json
import os
import platform
import secrets
import sys
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Any, Callable
from urllib.parse import unquote

from .library import ModelLibrary
from .runtime.base import GenerationCancelled
from .scheduler import (DEFAULT_MAX_QUEUE, DEFAULT_QUEUE_TIMEOUT, QueueFull,
                        QueueTimeout, Scheduler)

DEFAULT_HOST = "127.0.0.1"
DEFAULT_PORT = 8000

# Lifecycle states (AGENTS §74): health reports which one is true right now
# instead of a forever-"ok" liveness flag (AGENTS §75).
LIFECYCLE_STATES = ("stopped", "starting", "ready", "degraded", "stopping",
                    "failed")

# Supervision: at most this many automatic reloads inside the window before
# the host gives up and reports `failed` (a crash loop must not spin forever).
_RESTART_WINDOW_S = 60.0
_RESTART_LIMIT = 3

# Origins the desktop/dev UI legitimately come from; anything else gets no
# CORS grant (AGENTS §26: accidental exposure is a bug, not a default).
DEFAULT_CORS_ORIGINS = (
    "http://127.0.0.1:5173",
    "http://localhost:5173",
    "http://127.0.0.1:8000",
    "http://localhost:8000",
    "http://tauri.localhost",
    "tauri://localhost",
)

_PROFILE_WINDOW = 120
_IMPLEMENTED_LATER = {
    "/v1/completions": "raw text completion",
    "/v1/brio": "option scoring (brio)",
    "/v1/messages": "Anthropic-style messages",
    "/experts": "expert routing map",
}

RuntimeFactory = Callable[..., Any]


def reload_predicate(current: dict[str, Any],
                     wanted: dict[str, Any]) -> str | None:
    """Say why the loaded runtime must be rebuilt, or None if it can keep serving.

    Pure decision function so callers (CLI reloads, future model-switch API,
    the OOM ladder) share one definition of "what changed matters":
    model identity, context window and thread count all change the backend's
    process arguments; anything else (metadata refreshes) does not.
    """
    cur_entry = current.get("entry") or {}
    want_entry = wanted.get("entry") or {}
    if want_entry and cur_entry and want_entry.get("id") != cur_entry.get("id"):
        return (f"model changed from `{cur_entry.get('id')}` "
                f"to `{want_entry.get('id')}`")
    for key in ("context", "threads"):
        if key in wanted and wanted[key] is not None:
            old = current.get(key)
            if old != wanted[key]:
                old_label = old if old is not None else "default"
                return f"{key} changed from {old_label} to {wanted[key]}"
    return None


def _default_ram_gb() -> float | None:
    try:
        if os.name == "nt":  # pragma: no cover - exercised on Windows hosts
            import ctypes

            class MEMORYSTATUSEX(ctypes.Structure):
                _fields_ = [("dwLength", ctypes.c_ulong),
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
                return round(stat.ullAvailPhys / (1024 ** 3), 1)
        else:
            pages = os.sysconf("SC_AVPHYS_PAGES")
            page_size = os.sysconf("SC_PAGE_SIZE")
            if pages > 0 and page_size > 0:
                return round(pages * page_size / (1024 ** 3), 1)
    except (OSError, ValueError, AttributeError):
        return None
    return None


def _hwinfo() -> dict[str, Any]:
    return {
        "cpu": platform.processor() or platform.machine() or "unknown",
        "gpu": "not probed by this host yet",
        "ram_avail_gb": _default_ram_gb(),
    }


def default_idle_unload_s() -> float:
    """Idle-unload timeout in seconds (0 = keep the model warm forever).

    Unloading after idle frees the model's RAM on constrained machines
    while staying warm during use; the next request pays a reload (AGENTS
    §69: unload only what nobody is using). Invalid values read as 0 so a
    typo can never brick the gateway.
    """
    raw = os.environ.get("SYNTARA_IDLE_UNLOAD_S", "").strip()
    try:
        value = float(raw) if raw else 0.0
    except ValueError:
        return 0.0
    return max(0.0, value)


class HostGateway:
    """Loopback HTTP facade over one loaded model (see module docstring)."""

    def __init__(self, entry: dict[str, Any], *,
                 library: ModelLibrary | None = None,
                 host: str = DEFAULT_HOST,
                 port: int = DEFAULT_PORT,
                 context: int | None = None,
                 threads: int | None = None,
                 api_key: str | None = None,
                 cors_origins: tuple[str, ...] | None = None,
                 runtime_factory: RuntimeFactory | None = None,
                 startup_timeout: float = 120.0,
                 scheduler: Scheduler | None = None,
                 max_queue: int = DEFAULT_MAX_QUEUE,
                 queue_timeout: float = DEFAULT_QUEUE_TIMEOUT,
                 idle_unload_s: float | None = None) -> None:
        self.entry = dict(entry)
        self.library = library
        self.host = host
        self.port = int(port)
        self.api_key = api_key
        self.idle_unload_s = (default_idle_unload_s()
                              if idle_unload_s is None
                              else max(0.0, float(idle_unload_s)))
        self.cors_origins = tuple(
            cors_origins if cors_origins is not None else DEFAULT_CORS_ORIGINS)
        self._model_ctx = self.entry.get("model", {}).get("context_length")
        self.context = int(context or min(4096, self._model_ctx or 4096))
        self._threads = threads
        self._startup_timeout = startup_timeout
        self._runtime_factory = runtime_factory
        self.scheduler = scheduler or Scheduler(max_queue=max_queue,
                                                queue_timeout=queue_timeout)
        self.runtime: Any | None = None
        self._server: ThreadingHTTPServer | None = None
        self._thread: threading.Thread | None = None
        self._state_lock = threading.Lock()
        self._seq = 0
        self._turns: list[dict[str, Any]] = []
        self.last_error: str | None = None
        # Lifecycle + supervision (AGENTS §74/§27).
        self._state = "stopped"
        self._supervisor: threading.Thread | None = None
        self._supervisor_stop = threading.Event()
        self._restarting = False
        self._restart_times: list[float] = []
        self.restarts = 0
        self.supervisor_last_event: str | None = None
        self.failure: str | None = None  # set only when supervision gave up
        # Cancellation for POST /stop (checked per streamed frame).
        self._cancel = threading.Event()
        # Warm keep / idle unload (track 1h): the supervisor unloads after
        # `idle_unload_s` of no requests; `ensure_loaded` reloads on demand.
        self._idle_unloaded = False
        self._last_used = time.monotonic()
        self._load_lock = threading.Lock()
        self._calib_thread: threading.Thread | None = None

    @property
    def state(self) -> str:
        """Current lifecycle state; a stillborn runtime reads as degraded.

        An intentional idle unload stays `ready` - the model is absent but
        reloads on the next request, so health must not claim degradation.
        """
        with self._state_lock:
            state = self._state
        if (state == "ready" and self.runtime is not None
                and not self.runtime.loaded and not self._idle_unloaded):
            return "degraded"
        return state

    # ------------------------------------------------------------- lifecycle

    @property
    def served_model_id(self) -> str:
        return str(self.entry.get("id", "model"))

    @property
    def url(self) -> str:
        return f"http://{self.host}:{self.port}"

    @property
    def base_url(self) -> str:
        return f"{self.url}/v1"

    def _build_runtime(self) -> Any:
        if self._runtime_factory is not None:
            return self._runtime_factory(
                self.entry, context=self.context, threads=self._threads)
        from .runtime.llama_cpp import LlamaCppRuntime
        return LlamaCppRuntime(
            self.entry["path"], context=self.context, threads=self._threads,
            startup_timeout=self._startup_timeout)

    def _memory_guard(self) -> None:
        """Refuse an impossible load *before* spawning (track 1h, pre-OOM).

        Uses the library's stored weight estimate (``ram_gb_min`` =
        weights x 1.25 from gguf_inspect). When the estimate alone exceeds
        free RAM, no OOM ladder can save us - the model cannot fit - so
        fail fast with numbers the user can act on instead of minutes of
        loading followed by an opaque allocation error (AGENTS §14).
        Entries without an estimate are loaded as before: an unknown is
        not an impossible.
        """
        estimates = self.entry.get("estimates")
        need = estimates.get("ram_gb_min") if isinstance(estimates, dict) else None
        if need is None:
            return
        try:
            need_gb = float(need)
        except (TypeError, ValueError):
            return
        avail_gb = _default_ram_gb()
        if avail_gb is None or avail_gb >= need_gb:
            return
        raise RuntimeError(
            f"not enough free memory to load `{self.served_model_id}`: it "
            f"needs about {need_gb:.1f} GB (weights plus headroom) but only "
            f"{avail_gb:.1f} GB is free; close other applications or use a "
            f"smaller model/quantization")

    def _start_calibration(self) -> None:
        """Kick the first-run micro-bench once the real runtime is serving."""
        if self._runtime_factory is not None:
            return  # synthetic runtimes (tests) are not worth measuring
        from . import calibrate
        if not calibrate.enabled():
            return
        self._calib_thread = threading.Thread(
            target=calibrate.maybe_calibrate, args=(self,),
            daemon=True, name="syntara-calibrate")
        self._calib_thread.start()

    def start(self) -> "HostGateway":
        """Load the model, bind loopback, and serve on a background thread."""
        if self._server is not None:
            return self
        with self._state_lock:
            self._state = "starting"
        try:
            self.runtime = self._build_runtime()
            self._memory_guard()
            self.runtime.load()  # raises with an actionable message on failure
            handler = _make_handler(self)
            try:
                self._server = ThreadingHTTPServer((self.host, self.port), handler)
            except OSError as exc:
                self.runtime.unload()
                raise RuntimeError(
                    f"cannot bind {self.host}:{self.port}: {exc}; another "
                    f"instance may be running - choose another --port") from exc
            self._server.daemon_threads = True
            self.port = self._server.server_address[1]
        except Exception as exc:
            with self._state_lock:
                self._state = "failed"
                if self.failure is None:
                    self.failure = f"startup failed: {exc}"
            raise
        self._thread = threading.Thread(
            target=self._server.serve_forever, name="syntara-gateway",
            daemon=True)
        self._thread.start()
        self._supervisor_stop.clear()
        self._supervisor = threading.Thread(
            target=self._supervise_loop, name="syntara-supervisor", daemon=True)
        self._supervisor.start()
        with self._state_lock:
            self._state = "ready"
        self._start_calibration()
        return self

    def stop(self) -> None:
        with self._state_lock:
            if self._state != "stopped":
                self._state = "stopping"
        self._supervisor_stop.set()
        if self._supervisor is not None:
            self._supervisor.join(timeout=2.0)
            self._supervisor = None
        server, self._server = self._server, None
        if server is not None:
            server.shutdown()
            server.server_close()
        if self._thread is not None:
            self._thread.join(timeout=5.0)
            self._thread = None
        if self.runtime is not None:
            self.runtime.unload()
            self.runtime = None
        self._cancel.clear()
        with self._state_lock:
            self._state = "stopped"

    def serve_forever(self) -> None:
        """Blocking serve with clean Ctrl-C shutdown (used by the CLI)."""
        self.start()
        try:
            while self.state in ("ready", "degraded"):
                time.sleep(0.5)
                # Supervision owns death handling: it either reloads the
                # runtime (state returns to ready) or marks `failed`, which
                # ends this loop instead of serving 503s forever.
        except KeyboardInterrupt:
            pass
        finally:
            self.stop()

    # ----------------------------------------------------------- supervision

    def _supervise_loop(self) -> None:
        # Crash isolation (track 1h): this thread must outlive transient
        # states (reload, idle reload) and any exception - a dead supervisor
        # while the state still reads `ready` is exactly the silent failure
        # it exists to prevent. Only an explicit stop or `failed` ends it.
        while not self._supervisor_stop.wait(0.5):
            if self._state == "failed":
                return
            if self._state in ("starting", "stopping", "stopped"):
                continue  # a load/reload owns the runtime right now
            try:
                runtime = self.runtime
                if (runtime is not None and runtime.loaded
                        and self._idle_timed_out()):
                    self._idle_unload()
                    continue
                if (runtime is not None and not runtime.loaded
                        and not self._idle_unloaded):
                    self._on_runtime_death(runtime)
            except Exception as exc:  # noqa: BLE001 - report, never die
                with self._state_lock:
                    self.last_error = f"supervisor error: {exc}"
                    self.supervisor_last_event = f"supervisor error: {exc}"

    def _idle_timed_out(self) -> bool:
        return (self.idle_unload_s > 0 and self._state == "ready"
                and not self._idle_unloaded
                and (time.monotonic() - self._last_used)
                >= self.idle_unload_s)

    def _idle_unload(self) -> None:
        """Unload an idle warm model; the next request reloads it."""
        with self._state_lock:
            if self._state != "ready" or self._idle_unloaded:
                return
            self._idle_unloaded = True
            idle_for = round(time.monotonic() - self._last_used, 1)
        try:
            if self.runtime is not None:
                self.runtime.unload()
        except Exception as exc:  # noqa: BLE001 - a failed unload is not death
            with self._state_lock:
                self._idle_unloaded = False
            self.supervisor_last_event = f"idle unload failed: {exc}"
            return
        with self._state_lock:
            self.supervisor_last_event = (
                f"unloaded after {idle_for}s idle "
                f"(idle unload at {round(self.idle_unload_s, 1)}s)")

    def ensure_loaded(self) -> None:
        """Reload after an idle unload, on demand (AGENTS §112).

        Only an *intentional* idle unload is handled here; a real backend
        death stays supervision's job. Raises the loader's actionable
        error (including the memory guard) so callers can report 503.
        """
        with self._load_lock:
            if self.runtime is None:
                return
            if self.runtime.loaded:
                with self._state_lock:
                    self._idle_unloaded = False
                return
            if not self._idle_unloaded:
                return
            with self._state_lock:
                self._state = "starting"
            try:
                self._memory_guard()
                self.runtime.load()
            except Exception as exc:
                with self._state_lock:
                    self._state = "failed"
                    self.failure = f"reload after idle unload failed: {exc}"
                    self.last_error = self.failure
                raise
            with self._state_lock:
                self._idle_unloaded = False
                self._state = "ready"
            self.failure = None
            self._last_used = time.monotonic()

    def _on_runtime_death(self, dead: Any) -> None:
        """Detect an unexpected backend exit: reload once, or fail honestly."""
        with self._state_lock:
            if self._restarting or self._state not in ("ready", "degraded"):
                return
            self._restarting = True
            self._state = "starting"
        health: dict[str, Any] = {}
        try:
            health = dead.health() or {}
        except Exception:  # noqa: BLE001 - health is diagnostics only
            pass
        event = "the runtime process exited"
        if health.get("exited") is not None:
            event = f"the runtime process exited with code {health['exited']}"
        now = time.monotonic()
        self._restart_times = [t for t in self._restart_times
                               if now - t < _RESTART_WINDOW_S]
        if len(self._restart_times) >= _RESTART_LIMIT:
            with self._state_lock:
                self._restarting = False
                self._state = "failed"
                self.failure = (f"{event}; not restarting - "
                                f"{len(self._restart_times)} restarts in the "
                                f"last {int(_RESTART_WINDOW_S)}s (crash loop)")
                self.last_error = self.failure
                self.supervisor_last_event = event
            return
        try:
            dead.unload()
            self.runtime = self._build_runtime()
            self.runtime.load()  # OOM ladder lives inside the adapter's load
        except Exception as exc:  # noqa: BLE001 - one honest failure report
            with self._state_lock:
                self._restarting = False
                self._state = "failed"
                self.failure = f"{event}; automatic reload failed: {exc}"
                self.last_error = self.failure
                self.supervisor_last_event = event
            return
        self._restart_times.append(now)
        with self._state_lock:
            self._restarting = False
            self._state = "ready"
            self.restarts += 1
            self.supervisor_last_event = f"{event} - reloaded automatically"

    # -------------------------------------------------------------- bookkeeping

    def _record_turn(self, wall_s: float, usage: dict[str, Any] | None) -> None:
        usage = usage or {}
        with self._state_lock:
            self._seq += 1
            self._last_used = time.monotonic()  # a finished turn is activity
            self._turns.append({
                "seq": self._seq,
                "wall_s": round(wall_s, 3),
                "prompt_tokens": usage.get("prompt_tokens"),
                "completion_tokens": usage.get("completion_tokens"),
            })
            if len(self._turns) > _PROFILE_WINDOW:
                del self._turns[:-_PROFILE_WINDOW]

    def health_body(self) -> dict[str, Any]:
        state = self.state
        body: dict[str, Any] = {
            "status": state,
            "ready": state == "ready",
            "model": self.served_model_id,
            "scheduler": self.scheduler.snapshot(),
            "hwinfo": _hwinfo(),
        }
        if self.runtime is not None:
            body["runtime"] = self.runtime.health()
        if self.idle_unload_s > 0 or self._idle_unloaded:
            with self._state_lock:
                idle_for = round(time.monotonic() - self._last_used, 1)
            body["idle"] = {
                "enabled": self.idle_unload_s > 0,
                "unloaded": self._idle_unloaded,
                "idle_unload_s": self.idle_unload_s,
                "idle_for_s": idle_for,
            }
        if self.restarts or self.supervisor_last_event:
            body["supervisor"] = {
                "restarts": self.restarts,
                "last_event": self.supervisor_last_event,
            }
        if self.failure:
            body["error"] = self.failure
        elif self.last_error:
            body["error"] = self.last_error
        return body

    def profile_body(self) -> dict[str, Any]:
        from . import calibrate
        with self._state_lock:
            body = {"seq": self._seq, "turns": list(self._turns)}
        body["calibration"] = calibrate.calibration_for(self.served_model_id)
        return body

    # ---------------------------------------------------------------- reload

    def reload(self, *, entry: dict[str, Any] | None = None,
               context: int | None = None,
               threads: int | None = None) -> str | None:
        """Rebuild the runtime when (and only when) something that matters
        changed. Returns the reload reason, or None when nothing changed."""
        wanted = {"entry": entry, "context": context, "threads": threads}
        reason = reload_predicate(
            {"entry": self.entry, "context": self.context,
             "threads": self._threads}, wanted)
        if reason is None:
            return None
        with self._state_lock:
            self._state = "stopping"
        if self.runtime is not None:
            self.runtime.unload()
            self.runtime = None
        if entry is not None:
            self.entry = dict(entry)
            self._model_ctx = self.entry.get("model", {}).get("context_length")
        if context is not None:
            self.context = int(context)
        if threads is not None:
            self._threads = threads
        with self._state_lock:
            self._state = "starting"
        try:
            self.runtime = self._build_runtime()
            self._memory_guard()
            self.runtime.load()
        except Exception as exc:
            with self._state_lock:
                self._state = "failed"
            self.failure = f"reload failed: {exc}"
            self.last_error = self.failure
            raise
        with self._state_lock:
            self._state = "ready"
            self._idle_unloaded = False
            self._last_used = time.monotonic()
        self.failure = None
        return reason

    # ----------------------------------------------------------------- stop

    def stop_generation(self) -> dict[str, Any]:
        """Cancel the active generation (POST /stop).

        Only a currently running request can be cancelled; queued requests
        are left alone (they have not started consuming anything yet) and the
        result says so instead of pretending (AGENTS §17).
        """
        snap = self.scheduler.snapshot()
        active = int(snap.get("active", 0) or 0)
        if active:
            self._cancel.set()
            runtime = self.runtime
            cancel = getattr(runtime, "cancel", None)
            if callable(cancel):
                try:
                    cancel()
                except Exception:  # noqa: BLE001 - best-effort backend abort
                    pass
        return {"cancelled": active > 0, "active": active,
                "queued": int(snap.get("queued", 0) or 0)}

    # ------------------------------------------------------------ request path

    def handle_chat(self, body: dict[str, Any], respond: "_Responder") -> None:
        if not isinstance(body, dict):
            respond.error(400, "request body must be a JSON object",
                          "invalid_request_error", "invalid_body")
            return
        requested = body.get("model")
        if requested and requested != self.served_model_id:
            respond.error(
                404,
                f"The model `{requested}` does not exist. This host serves "
                f"`{self.served_model_id}` (see GET /v1/models).",
                "invalid_request_error", "model_not_found")
            return
        messages = body.get("messages")
        if not isinstance(messages, list) or not messages:
            respond.error(400, "`messages` must be a non-empty array",
                          "invalid_request_error", "invalid_messages")
            return
        with self._state_lock:
            self._last_used = time.monotonic()  # arrival counts as activity
        if self._idle_unloaded:
            try:
                self.ensure_loaded()
            except Exception as exc:  # noqa: BLE001 - actionable 503
                respond.error(503, str(exc), "server_error", "runtime_not_ready",
                              extra_headers={"Retry-After": "5"})
                return
        if self.state == "starting":
            # Reloading after a crash or idle: honest, retryable, not a lie
            # about readiness (AGENTS §74/§112).
            respond.error(503, "the model is restarting; retry shortly",
                          "server_error", "restarting",
                          extra_headers={"Retry-After": "2"})
            return
        if self.runtime is None or not self.runtime.loaded:
            respond.error(503, "no model is loaded in the runtime",
                          "server_error", "runtime_not_ready")
            return

        # Admission control: capacity/queue policy lives in the scheduler, so
        # a saturated host answers 429 (queue full) or 504 (waited too long)
        # instead of stalling a socket until the client gives up.
        queued_at = time.monotonic()
        try:
            with self.scheduler.admit():
                # How long THIS request waited for a generation slot. The web
                # client reads it as x-syntara-queue-wait-ms and shows it in
                # the run log; 0 for an immediate admission.
                wait_ms = int((time.monotonic() - queued_at) * 1000)
                respond.extra_headers["x-syntara-queue-wait-ms"] = str(wait_ms)
                self._run_chat(body, respond)
        except QueueFull as exc:
            respond.error(429, str(exc), "rate_limit_error", "queue_full",
                          extra_headers={"Retry-After": "1"})
        except QueueTimeout as exc:
            respond.error(504, str(exc), "server_error", "queue_timeout")
        except GenerationCancelled:
            # An intentional stop (POST /stop), not a failure: say so plainly
            # and do not record it as a backend error.
            if not respond.streaming:
                try:
                    respond.error(499, "the generation was cancelled",
                                  "server_error", "cancelled")
                except OSError:
                    pass
        except Exception as exc:  # noqa: BLE001 - mapped to an honest error
            self.last_error = str(exc)
            if not respond.streaming:
                detail = getattr(exc, "detail", "")
                try:
                    # Retry-After: supervision may be reloading the backend;
                    # a client that retries once usually lands on a healthy
                    # runtime instead of treating this as a dead endpoint.
                    respond.error(502, str(exc), "server_error",
                                  "backend_error", detail=detail,
                                  extra_headers={"Retry-After": "2"})
                except OSError:
                    pass  # the client vanished; nothing left to tell it
            # Once streaming started, the connection is already committed;
            # respond.stream() has handled the failure itself.

    def _run_chat(self, body: dict[str, Any], respond: "_Responder") -> None:
        """Execute one admitted request (scheduler slot already held)."""
        started = time.monotonic()
        self._cancel.clear()  # a stop applies to the generation it overlaps
        if body.get("stream"):
            respond.stream(self.runtime.stream(body))
        else:
            result = self.runtime.chat(body)
            self._record_turn(time.monotonic() - started,
                              result.get("usage") if isinstance(result, dict)
                              else None)
            respond.json(200, result)

    def models_list(self) -> dict[str, Any]:
        return {
            "object": "list",
            "data": [{
                "id": self.served_model_id,
                "object": "model",
                "created": int(self.entry.get("mtime") or time.time()),
                "owned_by": "syntara",
            }],
        }

    def model_get(self, model_id: str) -> dict[str, Any] | None:
        if model_id == self.served_model_id:
            return self.models_list()["data"][0]
        return None


class _Responder:
    """Response helper bound to a handler instance (sets CORS, framing)."""

    def __init__(self, handler: BaseHTTPRequestHandler, gateway: HostGateway):
        self.h = handler
        self.g = gateway
        self.streaming = False
        # Headers that must accompany a SUCCESS reply on both paths (json and
        # stream); set by the handler before producing the body, e.g. the
        # queue-wait measurement.
        self.extra_headers: dict[str, str] = {}

    # -- headers -----------------------------------------------------------
    def _cors(self) -> None:
        origin = self.h.headers.get("Origin")
        if origin and origin in self.g.cors_origins:
            self.h.send_header("Access-Control-Allow-Origin", origin)
            self.h.send_header("Vary", "Origin")
            self.h.send_header("Access-Control-Allow-Methods",
                               "GET, POST, OPTIONS")
            self.h.send_header("Access-Control-Allow-Headers",
                               "content-type, authorization, x-request-id")
            # Browsers hide non-safelisted response headers from cross-origin
            # JS unless they are listed here (the desktop UI and the dev
            # server are both cross-origin to localhost). Without this,
            # Retry-After and the queue-wait measurement would read as null
            # in exactly the environments the retry policy is built for.
            self.h.send_header("Access-Control-Expose-Headers",
                               "retry-after, x-syntara-queue-wait-ms, x-request-id")

    def json(self, status: int, obj: Any, *,
             extra_headers: dict[str, str] | None = None) -> None:
        payload = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.h.send_response(status)
        self.h.send_header("Content-Type", "application/json")
        self.h.send_header("Content-Length", str(len(payload)))
        for key, value in {**self.extra_headers, **(extra_headers or {})}.items():
            self.h.send_header(key, value)
        self._cors()
        self.h.end_headers()
        self.h.wfile.write(payload)

    def error(self, status: int, message: str, err_type: str, code: str,
              *, detail: str = "",
              extra_headers: dict[str, str] | None = None) -> None:
        err: dict[str, Any] = {"message": message, "type": err_type,
                               "code": code}
        if detail:
            err["detail"] = detail
        self.json(status, {"error": err}, extra_headers=extra_headers)

    def stream(self, frames: Any) -> None:
        """Write SSE frames from the runtime; close the connection at the end."""
        self.streaming = True
        self.h.send_response(200)
        self.h.send_header("Content-Type", "text/event-stream; charset=utf-8")
        self.h.send_header("Cache-Control", "no-cache")
        self.h.send_header("Connection", "close")
        for key, value in self.extra_headers.items():
            self.h.send_header(key, value)
        self._cors()
        self.h.end_headers()
        self.h.close_connection = True
        started = time.monotonic()
        usage: dict[str, Any] | None = None
        try:
            for frame in frames:
                if self.g._cancel.is_set():
                    # POST /stop asked us to stop: end the SSE stream the way
                    # clients expect (a final [DONE]) instead of an error.
                    self.h.wfile.write(b"data: [DONE]\n\n")
                    self.h.wfile.flush()
                    return
                # Capture usage if the backend included it, then pass through.
                for line in frame.split(b"\n"):
                    if line.startswith(b"data: ") and b'"usage"' in line:
                        try:
                            event = json.loads(line[6:])
                            if event.get("usage"):
                                usage = event["usage"]
                        except (json.JSONDecodeError, UnicodeDecodeError):
                            pass
                self.h.wfile.write(frame)
                self.h.wfile.flush()
        except GenerationCancelled:
            try:
                self.h.wfile.write(b"data: [DONE]\n\n")
                self.h.wfile.flush()
            except (BrokenPipeError, ConnectionResetError, OSError):
                pass
            return
        except (BrokenPipeError, ConnectionResetError, OSError):
            # Client went away mid-generation; the runtime sees the closed
            # response and stops. Not an error to report back to anyone.
            return
        except Exception as exc:  # noqa: BLE001 - backend failure mid-stream
            self.g.last_error = str(exc)
            try:
                err = json.dumps({"error": {"message": str(exc),
                                            "type": "server_error",
                                            "code": "backend_error"}})
                self.h.wfile.write(f"data: {err}\n\ndata: [DONE]\n\n".encode())
                self.h.wfile.flush()
            except (BrokenPipeError, ConnectionResetError, OSError):
                pass
            return
        finally:
            self.g._record_turn(time.monotonic() - started, usage)


def _make_handler(gateway: HostGateway):
    class Handler(BaseHTTPRequestHandler):
        server_version = "SyntaraHost/1.0"
        protocol_version = "HTTP/1.1"

        def log_message(self, *args: Any) -> None:  # quiet; errors self-report
            pass

        # -- helpers -------------------------------------------------------
        def _authorized(self) -> bool:
            if not gateway.api_key:
                return True
            header = self.headers.get("Authorization", "")
            token = header[7:] if header.startswith("Bearer ") else ""
            return secrets.compare_digest(token, gateway.api_key)

        def _read_json(self) -> dict[str, Any] | None:
            try:
                length = int(self.headers.get("Content-Length", "0"))
            except ValueError:
                length = 0
            if length <= 0 or length > (8 << 20):
                return None
            raw = self.rfile.read(length)
            try:
                parsed = json.loads(raw)
            except json.JSONDecodeError:
                return None
            return parsed if isinstance(parsed, dict) else None

        # -- HTTP verbs ----------------------------------------------------
        def do_OPTIONS(self) -> None:  # noqa: N802 - BaseHTTPRequestHandler API
            self.send_response(204)
            responder = _Responder(self, gateway)
            responder._cors()
            self.send_header("Content-Length", "0")
            self.end_headers()

        def do_GET(self) -> None:  # noqa: N802
            responder = _Responder(self, gateway)
            path = unquote(self.path.split("?", 1)[0])
            if not self._authorized():
                responder.error(401, "invalid or missing API key",
                                "authentication_error", "invalid_api_key")
                return
            if path == "/health":
                body = gateway.health_body()
                # 200 only when actually ready to serve inference; the other
                # lifecycle states are honest 503s (AGENTS §74/§75).
                responder.json(200 if body.get("ready") else 503, body)
            elif path == "/profile":
                responder.json(200, gateway.profile_body())
            elif path == "/v1/models":
                responder.json(200, gateway.models_list())
            elif path.startswith("/v1/models/"):
                model_id = path[len("/v1/models/"):]
                found = gateway.model_get(model_id)
                if found is None:
                    responder.error(
                        404, f"The model `{model_id}` does not exist.",
                        "invalid_request_error", "model_not_found")
                else:
                    responder.json(200, found)
            elif path in _IMPLEMENTED_LATER:
                responder.error(
                    501,
                    f"{_IMPLEMENTED_LATER[path]} is not implemented by this "
                    f"host yet; see docs/sdk-cli.md for what the local "
                    f"surface supports today",
                    "invalid_request_error", "not_implemented")
            else:
                responder.error(404, "Not found.",
                                "invalid_request_error", "not_found")

        def do_POST(self) -> None:  # noqa: N802
            responder = _Responder(self, gateway)
            path = unquote(self.path.split("?", 1)[0])
            if not self._authorized():
                responder.error(401, "invalid or missing API key",
                                "authentication_error", "invalid_api_key")
                return
            if path == "/v1/chat/completions":
                body = self._read_json()
                if body is None:
                    responder.error(400, "request body must be a JSON object",
                                    "invalid_request_error", "invalid_body")
                    return
                gateway.handle_chat(body, responder)
            elif path == "/stop":
                self._read_json()  # drain any body; /stop takes no arguments yet
                responder.json(200, gateway.stop_generation())
            elif path in _IMPLEMENTED_LATER:
                responder.error(
                    501,
                    f"{_IMPLEMENTED_LATER[path]} is not implemented by this "
                    f"host yet; see docs/sdk-cli.md for what the local "
                    f"surface supports today",
                    "invalid_request_error", "not_implemented")
            else:
                responder.error(404, "Not found.",
                                "invalid_request_error", "not_found")

    return Handler


def default_api_key() -> str | None:
    """Optional gateway key from the environment (None = local-open default)."""
    return os.environ.get("SYNTARA_GATEWAY_KEY") or None
