"""Subprocess management for runtime backends (AGENTS §27).

Spawn with visibility rules per platform, capture stderr for diagnostics,
detect startup failure and unexpected exit, and terminate deterministically
(terminate -> wait -> kill) so no orphan processes survive an unload.
"""
from __future__ import annotations

import collections
import os
import socket
import subprocess
import sys
import threading
import time
from typing import IO


def free_port() -> int:
    """Reserve an ephemeral loopback port and return it.

    A small race remains between close() and the backend binding it; the
    caller treats 'port in use' as a retryable startup failure.
    """
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(("127.0.0.1", 0))
        return int(s.getsockname()[1])


def _hidden_popen_kwargs() -> dict:
    """Platform rules so backends never flash console windows (Windows)."""
    if sys.platform == "win32":
        # CREATE_NO_WINDOW: console subprocesses must not open a window.
        return {"creationflags": getattr(subprocess, "CREATE_NO_WINDOW", 0)}
    return {}


class ManagedProcess:
    """A spawned backend process with a bounded stderr tail."""

    TAIL_LINES = 200

    def __init__(self, argv: list[str], *, cwd: str | None = None,
                 env: dict[str, str] | None = None) -> None:
        self.argv = list(argv)
        self.cwd = cwd
        self.env = env
        self.proc: subprocess.Popen[bytes] | None = None
        self._tail: collections.deque[str] = collections.deque(maxlen=self.TAIL_LINES)
        self._reader: threading.Thread | None = None

    def spawn(self) -> None:
        if self.proc is not None:
            raise RuntimeError("process already spawned")
        try:
            self.proc = subprocess.Popen(  # noqa: S603 - argv is built from trusted parts
                self.argv,
                stdin=subprocess.DEVNULL,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.PIPE,
                cwd=self.cwd,
                env=self.env,
                **_hidden_popen_kwargs(),
            )
        except OSError as exc:
            raise RuntimeError(
                f"could not start {self.argv[0]!r}: {exc}") from exc

    @property
    def alive(self) -> bool:
        return self.proc is not None and self.proc.poll() is None

    @property
    def returncode(self) -> int | None:
        return None if self.proc is None else self.proc.poll()

    def read_stderr_tail(self) -> str:
        return "".join(self._tail)

    def _drain_stderr(self, stream: IO[bytes]) -> None:
        for raw in iter(stream.readline, b""):
            self._tail.append(raw.decode("utf-8", errors="replace"))
        stream.close()

    def attach_stderr_drain(self) -> None:
        if self.proc is None or self.proc.stderr is None:
            return
        self._reader = threading.Thread(
            target=self._drain_stderr, args=(self.proc.stderr,),
            daemon=True, name="runtime-stderr")
        self._reader.start()

    def wait(self, timeout: float) -> int | None:
        if self.proc is None:
            return None
        try:
            return self.proc.wait(timeout=timeout)
        except subprocess.TimeoutExpired:
            return None

    def terminate(self, *, grace: float = 5.0) -> None:
        """Terminate cleanly: terminate() -> wait(grace) -> kill(). No orphans."""
        if self.proc is None:
            return
        if self.proc.poll() is None:
            self.proc.terminate()
            if self.wait(grace) is None:
                self.proc.kill()
                self.wait(5.0)
        # Reap the stderr reader so the pipe does not linger.
        if self._reader is not None:
            self._reader.join(timeout=2.0)
            self._reader = None
        if self.proc.stderr:
            try:
                self.proc.stderr.close()
            except OSError:
                pass


def http_get_status(url: str, timeout: float,
                    headers: dict[str, str] | None = None) -> int | None:
    """GET ``url`` and return the HTTP status, or None on any failure."""
    import urllib.error
    import urllib.request

    req = urllib.request.Request(url, headers=headers or {})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:  # noqa: S310 - loopback
            return int(resp.status)
    except (urllib.error.URLError, OSError, ValueError):
        return None


def wait_until_healthy(url: str, *, process: ManagedProcess, timeout: float,
                       poll: float = 0.25,
                       headers: dict[str, str] | None = None) -> bool:
    """Poll a loopback health URL until 200, process death, or timeout.

    Returns True on 200. A dead process fails immediately - do not keep
    polling a corpse (AGENTS §27: spawn success != started).
    """
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        if not process.alive:
            return False
        if http_get_status(url, timeout=min(poll * 4, 2.0),
                           headers=headers) == 200:
            return True
        time.sleep(poll)
    return False


def popen_kwargs() -> dict:
    return _hidden_popen_kwargs()


def is_windows() -> bool:
    return os.name == "nt"
