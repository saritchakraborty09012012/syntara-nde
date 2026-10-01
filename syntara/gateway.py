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
from .scheduler import (DEFAULT_MAX_QUEUE, DEFAULT_QUEUE_TIMEOUT, QueueFull,
                        QueueTimeout, Scheduler)

DEFAULT_HOST = "127.0.0.1"
DEFAULT_PORT = 8000

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
                 queue_timeout: float = DEFAULT_QUEUE_TIMEOUT) -> None:
        self.entry = dict(entry)
        self.library = library
        self.host = host
        self.port = int(port)
        self.api_key = api_key
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

    def start(self) -> "HostGateway":
        """Load the model, bind loopback, and serve on a background thread."""
        if self._server is not None:
            return self
        self.runtime = self._build_runtime()
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
        self._thread = threading.Thread(
            target=self._server.serve_forever, name="syntara-gateway",
            daemon=True)
        self._thread.start()
        return self

    def stop(self) -> None:
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

    def serve_forever(self) -> None:
        """Blocking serve with clean Ctrl-C shutdown (used by the CLI)."""
        self.start()
        try:
            while True:
                time.sleep(0.5)
                if self.runtime is not None and not self.runtime.loaded:
                    # The backend died; stop serving rather than 500 forever.
                    self.last_error = "the runtime process exited"
                    break
        except KeyboardInterrupt:
            pass
        finally:
            self.stop()

    # -------------------------------------------------------------- bookkeeping

    def _record_turn(self, wall_s: float, usage: dict[str, Any] | None) -> None:
        usage = usage or {}
        with self._state_lock:
            self._seq += 1
            self._turns.append({
                "seq": self._seq,
                "wall_s": round(wall_s, 3),
                "prompt_tokens": usage.get("prompt_tokens"),
                "completion_tokens": usage.get("completion_tokens"),
            })
            if len(self._turns) > _PROFILE_WINDOW:
                del self._turns[:-_PROFILE_WINDOW]

    def health_body(self) -> dict[str, Any]:
        runtime_alive = self.runtime is not None and self.runtime.loaded
        status = "ok" if runtime_alive else "degraded"
        body: dict[str, Any] = {
            "status": status,
            "model": self.served_model_id,
            "scheduler": self.scheduler.snapshot(),
            "hwinfo": _hwinfo(),
        }
        if self.runtime is not None:
            body["runtime"] = self.runtime.health()
        if self.last_error:
            body["error"] = self.last_error
        return body

    def profile_body(self) -> dict[str, Any]:
        with self._state_lock:
            return {"seq": self._seq, "turns": list(self._turns)}

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
        if self.runtime is None or not self.runtime.loaded:
            respond.error(503, "no model is loaded in the runtime",
                          "server_error", "runtime_not_ready")
            return

        # Admission control: capacity/queue policy lives in the scheduler, so
        # a saturated host answers 429 (queue full) or 504 (waited too long)
        # instead of stalling a socket until the client gives up.
        try:
            with self.scheduler.admit():
                self._run_chat(body, respond)
        except QueueFull as exc:
            respond.error(429, str(exc), "rate_limit_error", "queue_full",
                          extra_headers={"Retry-After": "1"})
        except QueueTimeout as exc:
            respond.error(504, str(exc), "server_error", "queue_timeout")
        except Exception as exc:  # noqa: BLE001 - mapped to an honest error
            self.last_error = str(exc)
            if not respond.streaming:
                detail = getattr(exc, "detail", "")
                try:
                    respond.error(502, str(exc), "server_error",
                                  "backend_error", detail=detail)
                except OSError:
                    pass  # the client vanished; nothing left to tell it
            # Once streaming started, the connection is already committed;
            # respond.stream() has handled the failure itself.

    def _run_chat(self, body: dict[str, Any], respond: "_Responder") -> None:
        """Execute one admitted request (scheduler slot already held)."""
        started = time.monotonic()
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

    def json(self, status: int, obj: Any, *,
             extra_headers: dict[str, str] | None = None) -> None:
        payload = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.h.send_response(status)
        self.h.send_header("Content-Type", "application/json")
        self.h.send_header("Content-Length", str(len(payload)))
        for key, value in (extra_headers or {}).items():
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
        self._cors()
        self.h.end_headers()
        self.h.close_connection = True
        started = time.monotonic()
        usage: dict[str, Any] | None = None
        try:
            for frame in frames:
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
                responder.json(200, gateway.health_body())
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
