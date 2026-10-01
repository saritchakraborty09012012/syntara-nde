"""Tests for syntara.scheduler (FIFO admission control).

Pure threading tests: no HTTP, no model, no network.
"""
from __future__ import annotations

import threading
import time
import unittest

from syntara.scheduler import (QueueFull, QueueTimeout, Scheduler,
                               DEFAULT_CAPACITY, DEFAULT_MAX_QUEUE,
                               DEFAULT_QUEUE_TIMEOUT)


def _wait_until(predicate, timeout: float = 5.0) -> bool:
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        if predicate():
            return True
        time.sleep(0.01)
    return predicate()


class SchedulerBasicsTest(unittest.TestCase):
    def test_immediate_admission_when_idle(self):
        sched = Scheduler()
        with sched.admit():
            snap = sched.snapshot()
            self.assertEqual(snap["active"], 1)
            self.assertEqual(snap["queued"], 0)
            self.assertEqual(snap["admitted"], 1)
        snap = sched.snapshot()
        self.assertEqual(snap["active"], 0)
        self.assertEqual(snap["admitted"], 1)

    def test_invalid_parameters_rejected(self):
        with self.assertRaises(ValueError):
            Scheduler(capacity=0)
        with self.assertRaises(ValueError):
            Scheduler(max_queue=-1)
        with self.assertRaises(ValueError):
            Scheduler(queue_timeout=0)

    def test_snapshot_keys_for_health(self):
        snap = Scheduler().snapshot()
        for key in ("capacity", "active", "queued", "admitted", "rejected",
                    "timed_out", "max_queue", "queue_timeout_s"):
            self.assertIn(key, snap)
        self.assertEqual(snap["capacity"], DEFAULT_CAPACITY)
        self.assertEqual(snap["max_queue"], DEFAULT_MAX_QUEUE)
        self.assertEqual(snap["queue_timeout_s"], DEFAULT_QUEUE_TIMEOUT)


class SerialisationTest(unittest.TestCase):
    def test_fifo_order_across_waiters(self):
        sched = Scheduler(capacity=1, max_queue=8, queue_timeout=10.0)
        order: list[int] = []
        hold = threading.Event()
        started = threading.Event()

        def holder():
            with sched.admit():
                started.set()
                hold.wait(10.0)

        def waiter(n: int):
            with sched.admit():
                order.append(n)

        threads = [threading.Thread(target=holder)]
        threads += [threading.Thread(target=waiter, args=(i,))
                    for i in range(1, 5)]
        threads[0].start()
        self.assertTrue(started.wait(5.0))
        for t in threads[1:]:
            t.start()
        self.assertTrue(_wait_until(
            lambda: sched.snapshot()["queued"] == 4), "waiters never queued")
        hold.set()
        for t in threads:
            t.join(timeout=10.0)
        self.assertEqual(order, [1, 2, 3, 4])
        self.assertEqual(sched.snapshot()["admitted"], 5)
        self.assertEqual(sched.snapshot()["active"], 0)

    def test_queue_full_raises_and_counts_rejection(self):
        sched = Scheduler(capacity=1, max_queue=1, queue_timeout=10.0)
        hold = threading.Event()
        started = threading.Event()

        def holder():
            with sched.admit():
                started.set()
                hold.wait(10.0)

        def waiter():
            with sched.admit():
                pass

        ht = threading.Thread(target=holder)
        ht.start()
        self.assertTrue(started.wait(5.0))
        wt = threading.Thread(target=waiter)
        wt.start()
        self.assertTrue(_wait_until(
            lambda: sched.snapshot()["queued"] == 1))

        with self.assertRaises(QueueFull) as ctx:
            with sched.admit():
                pass
        self.assertIn("queue is full", str(ctx.exception))
        snap = sched.snapshot()
        self.assertEqual(snap["rejected"], 1)
        self.assertEqual(snap["queued"], 1)   # the earlier waiter kept its place

        hold.set()
        ht.join(timeout=5.0)
        wt.join(timeout=5.0)
        self.assertEqual(sched.snapshot()["active"], 0)

    def test_queue_timeout_is_honest_and_scheduler_recovers(self):
        sched = Scheduler(capacity=1, max_queue=2, queue_timeout=0.2)
        hold = threading.Event()
        started = threading.Event()

        def holder():
            with sched.admit():
                started.set()
                hold.wait(10.0)

        ht = threading.Thread(target=holder)
        ht.start()
        self.assertTrue(started.wait(5.0))

        began = time.monotonic()
        with self.assertRaises(QueueTimeout) as ctx:
            with sched.admit():
                pass
        elapsed = time.monotonic() - began
        self.assertGreaterEqual(elapsed, 0.15)
        self.assertLess(elapsed, 2.0)
        message = str(ctx.exception)
        self.assertIn("waited", message)
        self.assertIn("position 1", message)
        snap = sched.snapshot()
        self.assertEqual(snap["timed_out"], 1)
        self.assertEqual(snap["queued"], 0)
        self.assertEqual(snap["rejected"], 0)

        hold.set()
        ht.join(timeout=5.0)
        # The slot must be usable again after the timeout + release.
        with sched.admit():
            self.assertEqual(sched.snapshot()["active"], 1)
        self.assertEqual(sched.snapshot()["admitted"], 2)

    def test_capacity_above_one_runs_concurrently(self):
        sched = Scheduler(capacity=2, max_queue=4, queue_timeout=5.0)
        lock = threading.Lock()
        active_now = 0
        max_seen = 0
        barrier = threading.Barrier(2, timeout=5.0)

        def worker():
            nonlocal active_now, max_seen
            with sched.admit():
                with lock:
                    active_now += 1
                    max_seen = max(max_seen, active_now)
                barrier.wait()          # both must be inside simultaneously
                time.sleep(0.05)
                with lock:
                    active_now -= 1

        threads = [threading.Thread(target=worker) for _ in range(2)]
        for t in threads:
            t.start()
        for t in threads:
            t.join(timeout=10.0)
        self.assertEqual(max_seen, 2)


class SlotHandoverTest(unittest.TestCase):
    def test_slot_is_never_idle_while_queued(self):
        # With a waiter present, releasing must hand the slot over directly:
        # observe active staying at 1 across the handover.
        sched = Scheduler(capacity=1, max_queue=4, queue_timeout=10.0)
        hold = threading.Event()
        started = threading.Event()
        samples: list[tuple[int, int]] = []

        def holder():
            with sched.admit():
                started.set()
                hold.wait(10.0)

        def waiter():
            with sched.admit():
                pass

        ht = threading.Thread(target=holder)
        ht.start()
        self.assertTrue(started.wait(5.0))
        wt = threading.Thread(target=waiter)
        wt.start()
        self.assertTrue(_wait_until(
            lambda: sched.snapshot()["queued"] == 1))

        stop = threading.Event()

        def sampler():
            while not stop.is_set():
                snap = sched.snapshot()
                samples.append((snap["active"], snap["queued"]))
                time.sleep(0.005)

        st = threading.Thread(target=sampler)
        st.start()
        hold.set()
        ht.join(timeout=5.0)
        wt.join(timeout=5.0)
        stop.set()
        st.join(timeout=5.0)
        self.assertTrue(samples)
        # The invariant: capacity is never idle while someone is queued, and
        # capacity is never exceeded. (Handover happens under the same lock
        # the snapshot reads, so an inconsistent pair cannot be observed.)
        for active, queued in samples:
            self.assertLessEqual(active, 1)
            if queued > 0:
                self.assertEqual(active, 1,
                                 "slot went idle while requests were queued")
        self.assertEqual(sched.snapshot()["active"], 0)


if __name__ == "__main__":
    unittest.main()
