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


if sys.platform == "win32":  # pragma: no cover - exercised on Windows CI
    import ctypes
    from ctypes import wintypes

    _JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE = 0x2000
    _JobObjectExtendedLimitInformation = 9
    _PROCESS_SET_QUOTA_TERMINATE = 0x0101  # PROCESS_SET_QUOTA | PROCESS_TERMINATE

    class _IoCounters(ctypes.Structure):
        _fields_ = [(name, ctypes.c_uint64) for name in (
            "ReadOperationCount", "WriteOperationCount", "OtherOperationCount",
            "ReadTransferCount", "WriteTransferCount", "OtherTransferCount")]

    class _BasicLimitInformation(ctypes.Structure):
        _fields_ = [
            ("PerProcessUserTimeLimit", ctypes.c_int64),
            ("PerJobUserTimeLimit", ctypes.c_int64),
            ("LimitFlags", wintypes.DWORD),
            ("MinimumWorkingSetSize", ctypes.c_size_t),
            ("MaximumWorkingSetSize", ctypes.c_size_t),
            ("ActiveProcessLimit", wintypes.DWORD),
            ("Affinity", ctypes.c_size_t),
            ("PriorityClass", wintypes.DWORD),
            ("SchedulingClass", wintypes.DWORD),
        ]

    class _ExtendedLimitInformation(ctypes.Structure):
        # Matches winnt.h: BasicLimitInformation + IO_COUNTERS + four
        # SIZE_T memory fields (verified: sizeof == 144 on x64).
        _fields_ = [
            ("BasicLimitInformation", _BasicLimitInformation),
            ("IoInfo", _IoCounters),
            ("ProcessMemoryLimit", ctypes.c_size_t),
            ("JobMemoryLimit", ctypes.c_size_t),
            ("PeakProcessMemoryUsed", ctypes.c_size_t),
            ("PeakJobMemoryUsed", ctypes.c_size_t),
        ]


def bind_lifetime_to_parent(proc: subprocess.Popen[bytes]) -> int | None:
    """Windows: kill the child when *this* interpreter goes away.

    A job object with JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE terminates every
    member process once the last handle to the job closes - which happens
    when this parent dies for any reason, including TerminateProcess,
    which no ``atexit`` hook survives (AGENTS §27: no orphan backends).

    Best effort by design: nesting is allowed since Windows 8, but a
    sandboxed or Win7-style parent can reject the assignment; we then
    fall back to the cooperative terminate() path only.
    """
    if sys.platform != "win32" or proc.pid is None:
        return None
    k32 = ctypes.WinDLL("kernel32", use_last_error=True)
    k32.CreateJobObjectW.argtypes = [wintypes.LPCWSTR, wintypes.LPCWSTR]
    k32.CreateJobObjectW.restype = wintypes.HANDLE
    k32.SetInformationJobObject.argtypes = [
        wintypes.HANDLE, ctypes.c_int, wintypes.LPVOID, wintypes.DWORD]
    k32.SetInformationJobObject.restype = wintypes.BOOL
    k32.OpenProcess.argtypes = [wintypes.DWORD, wintypes.BOOL, wintypes.DWORD]
    k32.OpenProcess.restype = wintypes.HANDLE
    k32.AssignProcessToJobObject.argtypes = [wintypes.HANDLE, wintypes.HANDLE]
    k32.AssignProcessToJobObject.restype = wintypes.BOOL
    k32.CloseHandle.argtypes = [wintypes.HANDLE]
    k32.CloseHandle.restype = wintypes.BOOL

    job = k32.CreateJobObjectW(None, None)
    if not job:
        return None
    info = _ExtendedLimitInformation()
    info.BasicLimitInformation.LimitFlags = _JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE
    if not k32.SetInformationJobObject(
            job, _JobObjectExtendedLimitInformation,
            ctypes.byref(info), ctypes.sizeof(info)):
        k32.CloseHandle(job)
        return None
    child = k32.OpenProcess(_PROCESS_SET_QUOTA_TERMINATE, False, proc.pid)
    if not child:
        k32.CloseHandle(job)
        return None
    assigned = k32.AssignProcessToJobObject(job, child)
    k32.CloseHandle(child)
    if not assigned:
        k32.CloseHandle(job)
        return None
    # The handle must stay open for the parent's whole life: its closure
    # is what kills the child. terminate() closes it once the child is
    # already reaped; a parent crash closes it implicitly.
    return int(job)


def _close_handle(handle: int) -> None:  # pragma: no cover - Windows only
    k32 = ctypes.WinDLL("kernel32", use_last_error=True)
    k32.CloseHandle.argtypes = [wintypes.HANDLE]
    k32.CloseHandle.restype = wintypes.BOOL
    k32.CloseHandle(handle)


def _release_job(handle: int | None) -> None:
    """Close the kill-on-close job handle (no-op off Windows / already done)."""
    if handle is None:
        return
    if sys.platform == "win32":
        _close_handle(handle)


class ManagedProcess:
    """A spawned backend process with a bounded stderr tail.

    ``merge_streams=True`` puts the child's stdout and stderr on a single
    pipe (``proc.stdout``) for callers that stream the child's own output,
    such as the conversion wrapper. Default behavior is unchanged: stdout is
    discarded and only stderr is drained for diagnostics.
    """

    TAIL_LINES = 200

    def __init__(self, argv: list[str], *, cwd: str | None = None,
                 env: dict[str, str] | None = None,
                 merge_streams: bool = False) -> None:
        self.argv = list(argv)
        self.cwd = cwd
        self.env = env
        self.merge_streams = merge_streams
        self.proc: subprocess.Popen[bytes] | None = None
        self._tail: collections.deque[str] = collections.deque(maxlen=self.TAIL_LINES)
        self._reader: threading.Thread | None = None
        self._job: int | None = None

    def spawn(self) -> None:
        if self.proc is not None:
            raise RuntimeError("process already spawned")
        try:
            self.proc = subprocess.Popen(  # noqa: S603 - argv is built from trusted parts
                self.argv,
                stdin=subprocess.DEVNULL,
                stdout=subprocess.PIPE if self.merge_streams else subprocess.DEVNULL,
                stderr=subprocess.STDOUT if self.merge_streams else subprocess.PIPE,
                cwd=self.cwd,
                env=self.env,
                **_hidden_popen_kwargs(),
            )
        except OSError as exc:
            raise RuntimeError(
                f"could not start {self.argv[0]!r}: {exc}") from exc
        self._job = bind_lifetime_to_parent(self.proc)

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
            _release_job(self._job)
            self._job = None
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
        # Close our pipe ends (stderr, and stdout in merge mode). The child
        # is already reaped above, so a reader thread sees EOF, never a
        # close racing a live read on a running process.
        for pipe in (self.proc.stderr, self.proc.stdout):
            if pipe is not None:
                try:
                    pipe.close()
                except OSError:
                    pass
        # Child is reaped: the kill-on-close job has served its purpose.
        _release_job(self._job)
        self._job = None


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
