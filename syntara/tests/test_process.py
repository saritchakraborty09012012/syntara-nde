"""ManagedProcess lifetime tests (AGENTS §27: no orphan backends).

The kill-on-close job object is the hard-kill safety net: when the parent
interpreter dies for any reason - including TerminateProcess, which no
``atexit`` hook survives - Windows must terminate the child with it.
"""
from __future__ import annotations

import sys
import time
import unittest
from types import SimpleNamespace

from syntara.runtime.process import (
    ManagedProcess,
    _release_job,
    bind_lifetime_to_parent,
)

_SLEEPER = [sys.executable, "-c", "import time; time.sleep(120)"]


class BindLifetimeTest(unittest.TestCase):
    def test_bind_is_a_noop_without_a_pid(self) -> None:
        self.assertIsNone(bind_lifetime_to_parent(SimpleNamespace(pid=None)))


@unittest.skipUnless(sys.platform == "win32", "job objects are Windows-only")
class KillOnCloseJobTest(unittest.TestCase):
    def test_struct_sizes_match_the_sdk(self) -> None:
        # SetInformationJobObject rejects wrong sizes with ERROR_BAD_LENGTH,
        # so a drifted struct would silently disable the orphan safety net.
        import ctypes

        from syntara.runtime import process as proc_mod

        self.assertEqual(ctypes.sizeof(proc_mod._BasicLimitInformation), 64)
        self.assertEqual(ctypes.sizeof(proc_mod._ExtendedLimitInformation), 144)

    def test_spawn_binds_the_child_to_a_kill_on_close_job(self) -> None:
        proc = ManagedProcess(_SLEEPER)
        proc.spawn()
        try:
            self.assertIsNotNone(proc._job)
            self.assertTrue(proc.alive)
        finally:
            proc.terminate()
        self.assertFalse(proc.alive)
        self.assertIsNone(proc._job, "terminate() must release the job handle")

    def test_closing_the_job_handle_kills_the_child(self) -> None:
        # Closing the last job handle is exactly what a parent crash does.
        proc = ManagedProcess(_SLEEPER)
        proc.spawn()
        try:
            self.assertIsNotNone(proc._job)
            handle, proc._job = proc._job, None
            _release_job(handle)
            deadline = time.monotonic() + 10.0
            while proc.alive and time.monotonic() < deadline:
                time.sleep(0.1)
            self.assertFalse(
                proc.alive,
                "kill-on-close did not terminate the child after the job "
                "handle closed")
        finally:
            proc.terminate()


if __name__ == "__main__":  # pragma: no cover
    unittest.main()
