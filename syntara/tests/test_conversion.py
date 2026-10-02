"""Conversion wrappers: streaming, resumable, cancellable, cached (track 1i).

The fixtures are a fake engine launcher plus a fake converter, so the whole
wrapper path is exercised for real - dry-run planning via --print-argv,
line streaming with progress parsing, cache hits, resume-after-failure,
cancellation of the actual child process, and the CLI auto-trigger from a
planner proposal - without downloading or converting anything heavy.
"""
from __future__ import annotations

import contextlib
import io
import json
import os
import sys
import tempfile
import time
import unittest
from pathlib import Path
from unittest import mock

from syntara.cli import build_parser, main
from syntara.conversion import (ConversionError, ConversionService,
                                _classify, normalize_extra, plan_conversion)

_LAUNCHER_SOURCE = '''\
import json
import os
import subprocess
import sys

CONVERTER = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                         "fake_converter.py")


def main():
    argv = sys.argv[1:]
    if not argv or argv[0] != "convert":
        sys.stderr.write("fake launcher: expected `convert`\\n")
        return 2
    rest = argv[1:]
    print_argv = "--print-argv" in rest
    outdir = None
    keep = []
    i = 0
    while i < len(rest):
        token = rest[i]
        if token == "--print-argv":
            i += 1
            continue
        if token in ("--repo", "--outdir"):
            if token == "--outdir" and i + 1 < len(rest):
                outdir = rest[i + 1]
            i += 2
            continue
        keep.append(token)
        i += 1
    if not outdir:
        sys.stderr.write("fake launcher: --outdir is required\\n")
        return 2
    step = [sys.executable, CONVERTER, "--outdir", outdir] + keep
    if print_argv:
        print("__SYNTARA_ARGV__ " + json.dumps({"steps": [step]}))
        return 0
    return subprocess.call(step)


if __name__ == "__main__":
    sys.exit(main())
'''

_CONVERTER_SOURCE = '''\
import os
import sys
import time


def opt(name, default=None):
    if name in sys.argv:
        i = sys.argv.index(name)
        if i + 1 < len(sys.argv):
            return sys.argv[i + 1]
    return default


outdir = opt("--outdir") or "."
mode = opt("--mode", "ok")
counter_path = opt("--counter")
if counter_path:
    try:
        with open(counter_path, encoding="utf-8") as handle:
            count = int(handle.read().strip() or "0")
    except (OSError, ValueError):
        count = 0
    with open(counter_path, "w", encoding="utf-8") as handle:
        handle.write(str(count + 1))

if mode == "missing":
    sys.stderr.write("Traceback (most recent call last):\\n")
    sys.stderr.write("  ModuleNotFoundError: No module named 'torch'\\n")
    sys.exit(1)
if mode == "fail":
    sys.stderr.write("converter: shard 00003 is truncated (short read)\\n")
    sys.exit(1)
if mode == "sleep":
    print("[1/3] starting (slow)", flush=True)
    time.sleep(120)
    sys.exit(0)

print("[RESUME] 0 shard(s) already done", flush=True)
print("[1/3] shard one (10 GB free, ETA 0:10)", flush=True)
print("wrote model-00001.safetensors", flush=True)
print("[2/3] shard two (9 GB free, ETA 0:05)", flush=True)
print("[3/3] shard three (8 GB free, ETA 0:01)", flush=True)
os.makedirs(outdir, exist_ok=True)
with open(os.path.join(outdir, "done.marker"), "w",
          encoding="utf-8") as handle:
    handle.write("ok")
print("conversion complete", flush=True)
sys.exit(0)
'''


def _wait_terminal(service: ConversionService, job, timeout: float = 30.0):
    return service.wait(job.id, timeout=timeout)


class _ConversionFixture(unittest.TestCase):
    """Shared temp scripts, env and service (SYNTARA_ENGINE -> fake)."""

    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        root = Path(self.tmp.name)
        self.launcher_path = root / "fake_launcher.py"
        self.launcher_path.write_text(_LAUNCHER_SOURCE, encoding="utf-8")
        self.converter_path = root / "fake_converter.py"
        self.converter_path.write_text(_CONVERTER_SOURCE, encoding="utf-8")
        self.data_dir = root / "data"
        self.outdir = root / "converted"
        self.counter = root / "counter.txt"
        raw = f'"{sys.executable}" "{self.launcher_path}"'
        patcher = mock.patch.dict(os.environ, {"SYNTARA_ENGINE": raw})
        patcher.start()
        self.addCleanup(patcher.stop)
        self.engine_raw = raw

    def service(self) -> ConversionService:
        return ConversionService(data_dir=self.data_dir)

    def counter_value(self) -> int:
        try:
            return int(self.counter.read_text(encoding="utf-8").strip())
        except (OSError, ValueError):
            return 0

    def start_ok(self, service, **kwargs):
        defaults = dict(extra_flags=["--mode", "ok",
                                     "--counter", str(self.counter)])
        defaults.update(kwargs)
        return service.start("fake/source", str(self.outdir), **defaults)


class ServiceTest(_ConversionFixture):
    def test_streams_progress_and_completes(self):
        service = self.service()
        streamed: list[dict] = []
        job = self.start_ok(service, on_event=streamed.append)
        job = _wait_terminal(service, job)

        self.assertEqual(job.status, "completed")
        self.assertEqual(job.rc, 0)
        self.assertFalse(job.cached)
        self.assertTrue((self.outdir / "done.marker").exists())
        kinds = [(event.get("type"), event) for event in job.events]
        self.assertIn(("started",), [(k,) for k, _ in kinds])
        resume = [e for k, e in kinds if k == "resume"]
        self.assertEqual(resume[0]["already_done"], 0)
        progress = [e for k, e in kinds if k == "progress"]
        self.assertEqual(progress[0]["done"], 1)
        self.assertEqual(progress[0]["total"], 3)
        self.assertEqual(progress[0]["eta"], "0:10")
        wrote = [e for k, e in kinds if k == "wrote"]
        self.assertEqual(wrote[0]["file"], "model-00001.safetensors")
        lines = [e["text"] for k, e in kinds if k == "line"]
        self.assertTrue(any("conversion complete" in line for line in lines))
        self.assertEqual(kinds[-1][0], "done")
        # The UI callback saw the same live stream.
        self.assertTrue(streamed)
        self.assertEqual(streamed[0]["type"], "started")
        self.assertEqual(streamed[-1]["type"], "done")
        # The exact run is cached for the next identical request.
        cache = service._load_cache()
        self.assertEqual(cache[job.id]["status"], "completed")

    def test_completed_conversion_is_cached_and_force_reruns(self):
        service = self.service()
        first = _wait_terminal(service, self.start_ok(service))
        self.assertEqual(first.status, "completed")
        self.assertEqual(self.counter_value(), 1)

        second = _wait_terminal(service, self.start_ok(service))
        self.assertEqual(second.status, "completed")
        self.assertTrue(second.cached)
        self.assertEqual(self.counter_value(), 1, "cache hit must not respawn")
        self.assertTrue(any(event["type"] == "cached"
                            for event in second.events))

        forced = _wait_terminal(
            service, self.start_ok(service, force=True))
        self.assertFalse(forced.cached)
        self.assertEqual(self.counter_value(), 2, "--force reruns")

    def test_failure_is_classified_and_rerun_resumes(self):
        service = self.service()
        bad = self.start_ok(service, extra_flags=[
            "--mode", "missing", "--counter", str(self.counter)])
        bad = _wait_terminal(service, bad)
        self.assertEqual(bad.status, "failed")
        self.assertEqual(bad.error, "missing_dependency")
        self.assertIn("torch", bad.error_detail)
        self.assertEqual(self.counter_value(), 1)
        self.assertTrue(any(event["type"] == "failed"
                            for event in bad.events))

        # A failed job is not treated as completed: the rerun runs again.
        good = self.start_ok(service)
        good = _wait_terminal(service, good)
        self.assertEqual(good.status, "completed")
        self.assertEqual(self.counter_value(), 2)

    def test_cancel_stops_the_child_and_reports_resume(self):
        service = self.service()
        sleeping = self.start_ok(service, extra_flags=[
            "--mode", "sleep", "--counter", str(self.counter)])
        deadline = time.monotonic() + 15.0
        while sleeping._proc is None or not sleeping._proc.alive:
            self.assertLess(time.monotonic(), deadline,
                            "the converter never spawned")
            time.sleep(0.05)
        with self.assertRaises(ConversionError):
            service.wait(sleeping.id, timeout=0.3)

        cancelled = service.cancel(sleeping.id)
        self.assertIs(cancelled, sleeping)
        terminal = _wait_terminal(service, sleeping)
        self.assertEqual(terminal.status, "cancelled")
        self.assertIn("rerun to resume", terminal.error_detail)
        self.assertIsNotNone(terminal._proc.returncode,
                             "the child process must actually be dead")
        # Cancel of a finished job is idempotent, not an error.
        self.assertIs(service.cancel(sleeping.id), sleeping)

    def test_a_second_conversion_is_refused_while_one_runs(self):
        service = self.service()
        sleeping = self.start_ok(service, extra_flags=[
            "--mode", "sleep", "--counter", str(self.counter)])
        deadline = time.monotonic() + 15.0
        while sleeping._proc is None or not sleeping._proc.alive:
            self.assertLess(time.monotonic(), deadline)
            time.sleep(0.05)
        with self.assertRaises(ConversionError) as caught:
            self.start_ok(service)
        self.assertIn("already running", str(caught.exception))
        service.cancel(sleeping.id)
        _wait_terminal(service, sleeping)

    def test_missing_engine_launcher_is_actionable(self):
        with mock.patch.dict(os.environ, {"SYNTARA_ENGINE": ""}):
            service = self.service()
            with self.assertRaises(ConversionError) as caught:
                service.start("fake/source", str(self.outdir))
        self.assertIn("SYNTARA_ENGINE", str(caught.exception))

    def test_unrunnable_launcher_is_actionable(self):
        with mock.patch.dict(
                os.environ,
                {"SYNTARA_ENGINE": '"C:\\no\\such\\syntara-fake.exe"'}):
            service = self.service()
            with self.assertRaises(ConversionError) as caught:
                service.start("fake/source", str(self.outdir))
        self.assertIn("could not run the engine launcher",
                      str(caught.exception))

    def test_start_validates_inputs_before_planning(self):
        service = self.service()
        with self.assertRaises(ConversionError) as caught:
            service.start(None, str(self.outdir))
        self.assertIn("--repo is required", str(caught.exception))
        with self.assertRaises(ConversionError) as caught:
            service.start("fake/source", None)
        self.assertIn("--outdir is required", str(caught.exception))


class PlanAndHelpersTest(unittest.TestCase):
    def test_plan_conversion_reads_the_proposal_and_model_path(self):
        plan = {"quantization": {"conversion": {
                    "applicable": True, "script": "convert_x.py",
                    "reason": "policy allows"}},
                "model": {"path": "D:/models/source"}}
        proposal = plan_conversion(plan)
        self.assertTrue(proposal["applicable"])
        self.assertEqual(proposal["script"], "convert_x.py")
        self.assertEqual(proposal["repo"], "D:/models/source")

    def test_plan_conversion_reports_inapplicable_plans(self):
        plan = {"quantization": {"conversion": {
                    "applicable": False, "script": None,
                    "reason": "the policy keeps the stored weights"}}}
        proposal = plan_conversion(plan)
        self.assertFalse(proposal["applicable"])
        self.assertIsNone(proposal["repo"])
        self.assertIn("keeps the stored", proposal["reason"])

    def test_normalize_extra_drops_the_remainder_marker(self):
        self.assertEqual(normalize_extra(["--", "--ebits", "4"]),
                         ["--ebits", "4"])
        self.assertEqual(normalize_extra([]), [])
        self.assertEqual(normalize_extra(None), [])
        self.assertEqual(normalize_extra(["--group-size", "64"]),
                         ["--group-size", "64"])

    def test_cli_parser_keeps_passthrough_flags_after_dash_dash(self):
        args = build_parser().parse_args(
            ["convert", "--repo", "r", "--outdir", "o", "--", "--ebits", "4"])
        self.assertEqual(normalize_extra(args.extra), ["--ebits", "4"])

    def test_classify_points_at_the_missing_module(self):
        kind, detail = _classify(
            "Traceback:\nModuleNotFoundError: No module named 'torch'\n", 1)
        self.assertEqual(kind, "missing_dependency")
        self.assertIn("torch", detail)

    def test_classify_keeps_a_tail_for_plain_failures(self):
        kind, detail = _classify("converter: shard 00003 is truncated", 2)
        self.assertEqual(kind, "failed")
        self.assertIn("truncated", detail)


class CliTest(_ConversionFixture):
    def _plan_file(self, applicable: bool) -> Path:
        path = Path(self.tmp.name) / "plan.json"
        reason = ("experimental-fast policy allows repacked weights"
                  if applicable else
                  "the policy keeps the stored weights as they are")
        path.write_text(json.dumps({
            "quantization": {"conversion": {
                "applicable": applicable,
                "script": "convert_x.py" if applicable else None,
                "reason": reason}},
            "model": {"path": "fake/source"},
        }), encoding="utf-8")
        return path

    def test_plan_auto_trigger_runs_the_conversion(self):
        plan = self._plan_file(applicable=True)
        out = io.StringIO()
        with contextlib.redirect_stdout(out):
            code = main(["convert", "--plan", str(plan),
                         "--outdir", str(self.outdir),
                         "--data-dir", str(self.data_dir),
                         "--", "--mode", "ok",
                         "--counter", str(self.counter)])
        self.assertEqual(code, 0)
        text = out.getvalue()
        self.assertIn("conversion completed:", text)
        self.assertIn("[1/3] shard one", text)
        self.assertEqual(self.counter_value(), 1)
        self.assertTrue((self.outdir / "done.marker").exists())

    def test_plan_auto_trigger_without_outdir_explains_the_command(self):
        plan = self._plan_file(applicable=True)
        err = io.StringIO()
        with contextlib.redirect_stderr(err):
            code = main(["convert", "--plan", str(plan),
                         "--data-dir", str(self.data_dir)])
        self.assertEqual(code, 2)
        self.assertIn("--outdir", err.getvalue())
        self.assertIn("fake/source", err.getvalue())
        self.assertEqual(self.counter_value(), 0, "nothing must run")

    def test_inapplicable_plan_exits_zero_with_the_reason(self):
        plan = self._plan_file(applicable=False)
        out = io.StringIO()
        with contextlib.redirect_stdout(out):
            code = main(["convert", "--plan", str(plan),
                         "--data-dir", str(self.data_dir)])
        self.assertEqual(code, 0)
        self.assertIn("keeps the stored weights", out.getvalue())

    def test_json_mode_streams_event_objects(self):
        plan = self._plan_file(applicable=True)
        out = io.StringIO()
        with contextlib.redirect_stdout(out):
            code = main(["convert", "--json", "--plan", str(plan),
                         "--outdir", str(self.outdir),
                         "--data-dir", str(self.data_dir),
                         "--", "--mode", "ok",
                         "--counter", str(self.counter)])
        self.assertEqual(code, 0)
        events = [json.loads(line) for line in out.getvalue().splitlines()
                  if line.strip()]
        self.assertTrue(events)
        self.assertEqual(events[0]["type"], "started")
        self.assertEqual(events[-1]["type"], "done")
        self.assertTrue(any(event["type"] == "progress"
                            for event in events))

    def test_usage_error_without_repo_and_outdir_returns_two(self):
        err = io.StringIO()
        with contextlib.redirect_stderr(err):
            code = main(["convert", "--data-dir", str(self.data_dir)])
        self.assertEqual(code, 2)
        self.assertIn("--repo", err.getvalue())


if __name__ == "__main__":
    unittest.main()
