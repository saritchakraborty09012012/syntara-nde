"""Tests for syntara.calibrate (first-run micro-bench, track 1h)."""
from __future__ import annotations

import json
import os
import tempfile
import unittest
from pathlib import Path
from unittest import mock

from syntara import calibrate


class _RecordingRuntime:
    def __init__(self, fail: bool = False, usage=None) -> None:
        self.calls: list[dict] = []
        self.fail = fail
        self.usage = usage

    def chat(self, body: dict) -> dict:
        if self.fail:
            raise RuntimeError("backend busy")
        self.calls.append(body)
        usage = self.usage if self.usage is not None else {
            "prompt_tokens": 6, "completion_tokens": 9, "total_tokens": 15}
        return {"id": "chatcmpl-cal", "usage": usage}


class _GatewayStub:
    def __init__(self, runtime, model_id: str = "fake-model") -> None:
        self.runtime = runtime
        self.served_model_id = model_id


class RunCalibrationTest(unittest.TestCase):
    def test_measures_one_short_turn(self):
        runtime = _RecordingRuntime()
        record = calibrate.run_calibration(runtime, "fake-model")
        self.assertEqual(len(runtime.calls), 1)
        self.assertEqual(runtime.calls[0]["max_tokens"], calibrate._MAX_TOKENS)
        self.assertEqual(record["model"], "fake-model")
        self.assertEqual(record["machine"], calibrate.machine_key())
        self.assertEqual(record["prompt_tokens"], 6)
        self.assertEqual(record["completion_tokens"], 9)
        self.assertGreater(record["tokens_per_s"], 0)
        self.assertIn("prefill+decode", record["label"])

    def test_backend_failure_returns_none(self):
        self.assertIsNone(calibrate.run_calibration(
            _RecordingRuntime(fail=True), "fake-model"))

    def test_missing_usage_returns_none(self):
        self.assertIsNone(calibrate.run_calibration(
            _RecordingRuntime(usage={}), "fake-model"))


class CacheTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.path = Path(self.tmp.name) / "calibration.json"
        patcher = mock.patch.object(
            calibrate, "calibration_path", lambda: self.path)
        patcher.start()
        self.addCleanup(patcher.stop)

    def test_first_run_measures_and_caches(self):
        runtime = _RecordingRuntime()
        calibrate.maybe_calibrate(_GatewayStub(runtime))
        self.assertEqual(len(runtime.calls), 1)
        data = json.loads(self.path.read_text(encoding="utf-8"))
        key = f"{calibrate.machine_key()}::fake-model"
        self.assertIn(key, data)
        self.assertEqual(data[key]["completion_tokens"], 9)

    def test_second_run_reads_the_cache_instead_of_measuring(self):
        calibrate.maybe_calibrate(_GatewayStub(_RecordingRuntime()))
        runtime = _RecordingRuntime()
        calibrate.maybe_calibrate(_GatewayStub(runtime))
        self.assertEqual(runtime.calls, [], "cached machine+model must skip")

    def test_a_different_model_calibrates_separately(self):
        calibrate.maybe_calibrate(_GatewayStub(_RecordingRuntime()))
        runtime = _RecordingRuntime()
        calibrate.maybe_calibrate(_GatewayStub(runtime, "other-model"))
        self.assertEqual(len(runtime.calls), 1)

    def test_env_disable_skips_measuring(self):
        runtime = _RecordingRuntime()
        with mock.patch.dict(os.environ, {calibrate._ENV_DISABLE: "0"}):
            self.assertFalse(calibrate.enabled())
            calibrate.maybe_calibrate(_GatewayStub(runtime))
        self.assertEqual(runtime.calls, [])

    def test_corrupt_cache_file_is_ignored(self):
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self.path.write_text("{not json", encoding="utf-8")
        self.assertEqual(calibrate.load_calibration(), {})
        runtime = _RecordingRuntime()
        calibrate.maybe_calibrate(_GatewayStub(runtime))
        self.assertEqual(len(runtime.calls), 1, "a corrupt cache must not "
                                                "block measuring")


class GatewayHookTest(unittest.TestCase):
    def test_synthetic_runtimes_do_not_start_calibration(self):
        from syntara.gateway import HostGateway
        from syntara.tests.test_gateway import FakeRuntime, _entry

        gw = HostGateway(_entry(), port=0, runtime_factory=FakeRuntime)
        gw.start()
        self.addCleanup(gw.stop)
        gw._start_calibration()
        self.assertIsNone(gw._calib_thread,
                          "test runtimes must never be measured")

    def test_real_runtime_kicks_the_background_thread(self):
        from syntara.gateway import HostGateway
        from syntara.tests.test_gateway import FakeRuntime, _entry

        gw = HostGateway(_entry(), port=0, runtime_factory=FakeRuntime)
        gw.start()
        self.addCleanup(gw.stop)
        gw._runtime_factory = None  # pretend the real adapter is in charge
        with mock.patch("syntara.calibrate.maybe_calibrate") as target:
            gw._start_calibration()
            self.assertIsNotNone(gw._calib_thread)
            gw._calib_thread.join(timeout=5)
            target.assert_called_once_with(gw)


if __name__ == "__main__":  # pragma: no cover
    unittest.main()
