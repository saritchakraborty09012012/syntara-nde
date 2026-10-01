"""FIFO admission control for local inference requests (host side).

The gateway serves one backend model per process, so generations serialise:
the scheduler makes that *explicit* instead of letting requests pile up on a
hidden lock (AGENTS §111: real lifecycle states, §74: honest health).

Policy (defaults chosen for a local single-user host):

* ``capacity`` concurrent generations (1 for one backend process);
* requests beyond that wait FIFO for up to ``max_queue`` slots;
* a full queue rejects immediately with an actionable 429 rather than
  growing without bound (AGENTS §64: bounded queues);
* a waiter that exceeds ``queue_timeout`` fails with a 504 that says how
  long it waited - the default timeout is deliberately shorter than the
  SDK's default 60 s socket timeout so the client gets *our* error, not a
  socket-level mystery.

Ordering is strict FIFO and a finished slot is handed directly to the next
waiter, so capacity is never idle while someone is queued.
"""
from __future__ import annotations

import threading
import time
from collections import deque
from contextlib import contextmanager
from typing import Any, Iterator

DEFAULT_CAPACITY = 1
DEFAULT_MAX_QUEUE = 16
DEFAULT_QUEUE_TIMEOUT = 20.0


class QueueFull(Exception):
    """The wait queue is at capacity - reject now, retry shortly."""

    def __init__(self, active: int, queued: int, max_queue: int) -> None:
        super().__init__(
            f"the host is busy: {active} generation(s) running and the wait "
            f"queue is full ({max_queue} waiting); retry in a moment or "
            f"wait for the in-flight request to finish")
        self.active = active
        self.queued = queued
        self.max_queue = max_queue


class QueueTimeout(Exception):
    """A queued request waited longer than the configured timeout."""

    def __init__(self, waited: float, timeout: float, position: int) -> None:
        super().__init__(
            f"waited {waited:.1f}s in the host queue (limit {timeout:.1f}s, "
            f"position {position} when timed out) and no generation slot "
            f"became free; retry when the current request finishes")
        self.waited = waited
        self.timeout = timeout
        self.position = position


class Scheduler:
    """Thread-safe FIFO admission with bounded queue and bounded wait."""

    def __init__(self, capacity: int = DEFAULT_CAPACITY,
                 max_queue: int = DEFAULT_MAX_QUEUE,
                 queue_timeout: float = DEFAULT_QUEUE_TIMEOUT) -> None:
        if capacity < 1:
            raise ValueError("capacity must be >= 1")
        if max_queue < 0:
            raise ValueError("max_queue must be >= 0")
        if queue_timeout <= 0:
            raise ValueError("queue_timeout must be > 0")
        self.capacity = int(capacity)
        self.max_queue = int(max_queue)
        self.queue_timeout = float(queue_timeout)
        self._lock = threading.Lock()
        self._waiters: deque[threading.Event] = deque()
        self._active = 0
        self._admitted = 0
        self._rejected = 0
        self._timed_out = 0

    # ----------------------------------------------------------- internals
    # *_locked variants assume self._lock is held (threading.Lock is not
    # reentrant, so nothing may re-acquire it inside them).

    def _release_locked(self) -> None:
        self._active -= 1
        if self._waiters:
            nxt = self._waiters.popleft()
            self._active += 1          # slot handed over, never idle
            nxt.set()

    def _release(self) -> None:
        with self._lock:
            self._release_locked()

    # ------------------------------------------------------------- public

    @contextmanager
    def admit(self) -> Iterator[None]:
        """Acquire a generation slot; raises QueueFull/QueueTimeout.

        Usage::

            with scheduler.admit():
                ...  # at most `capacity` of these run concurrently
        """
        ticket: threading.Event | None = None
        with self._lock:
            if self._active < self.capacity and not self._waiters:
                # Free capacity and nobody ahead of us (handovers keep
                # capacity busy whenever a waiter exists, so this is the
                # only moment we may take a slot immediately).
                self._active += 1
                self._admitted += 1
            else:
                if len(self._waiters) >= self.max_queue:
                    self._rejected += 1
                    raise QueueFull(self._active, len(self._waiters),
                                    self.max_queue)
                ticket = threading.Event()
                self._waiters.append(ticket)

        acquired = ticket is None
        try:
            if ticket is not None:
                started = time.monotonic()
                got = ticket.wait(self.queue_timeout)
                with self._lock:
                    if got or ticket.is_set():
                        # Handed a slot. (If wait expired in the same
                        # instant a handover happened, is_set() wins: we are
                        # here and the slot is ours - serve rather than
                        # fail after waiting essentially the full timeout.)
                        self._admitted += 1
                        acquired = True
                    else:
                        try:
                            position = self._waiters.index(ticket) + 1
                        except ValueError:      # pragma: no cover - defensive
                            position = 0
                        self._waiters.remove(ticket)
                        self._timed_out += 1
                        raise QueueTimeout(time.monotonic() - started,
                                           self.queue_timeout,
                                           position) from None
            yield
        finally:
            if acquired:
                self._release()

    def snapshot(self) -> dict[str, Any]:
        """Honest counters for the health endpoint (AGENTS §75)."""
        with self._lock:
            return {
                "capacity": self.capacity,
                "active": self._active,
                "queued": len(self._waiters),
                "admitted": self._admitted,
                "rejected": self._rejected,
                "timed_out": self._timed_out,
                "max_queue": self.max_queue,
                "queue_timeout_s": self.queue_timeout,
            }
