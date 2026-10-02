"""First-run micro-bench calibration (track 1h resilience).

On the first gateway load for a given machine + model, run one tiny
generation and record measured throughput next to the honest inputs
(prompt/completion tokens, wall time). The cache is keyed by machine and
model, so each combination measures once and later starts read instead
of measuring again.

Calibration is opportunistic: it runs in a background thread after the
gateway is ready, and any failure (backend hiccup, disabled env, disk
error) leaves the cache untouched instead of affecting serving (AGENTS
``optional feature must not break local functionality``).

``tokens_per_s`` is *mixed* prefill+decode throughput from one short
turn - it is labelled that way in the payload rather than pretending to
be a pure decode rate.
"""
from __future__ import annotations

import json
import os
import platform
import time
from pathlib import Path
from typing import Any

from .store import default_data_dir

# Env switch: any of 0/off/false disables the first-run calibration.
_ENV_DISABLE = "SYNTARA_CALIBRATE"

_PROMPT = "Reply with exactly one short sentence."
_MAX_TOKENS = 48


def calibration_path() -> Path:
    return default_data_dir() / "calibration.json"


def machine_key() -> str:
    """Cheap stable machine fingerprint (no model or user data)."""
    return "|".join((
        platform.system(),
        platform.machine(),
        platform.processor() or "",
        str(os.cpu_count() or 0),
    ))


def enabled() -> bool:
    return os.environ.get(_ENV_DISABLE, "").strip().lower() not in (
        "0", "off", "false", "no")


def load_calibration() -> dict[str, Any]:
    try:
        data = json.loads(calibration_path().read_text(encoding="utf-8"))
        return data if isinstance(data, dict) else {}
    except (OSError, ValueError):
        return {}


def save_calibration(data: dict[str, Any]) -> None:
    path = calibration_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(".json.tmp")
    tmp.write_text(json.dumps(data, indent=2, sort_keys=True),
                   encoding="utf-8")
    tmp.replace(path)  # atomic enough for a local cache


def _key(model_id: str) -> str:
    return f"{machine_key()}::{model_id}"


def calibration_for(model_id: str) -> dict[str, Any] | None:
    record = load_calibration().get(_key(model_id))
    return record if isinstance(record, dict) else None


def run_calibration(runtime: Any, model_id: str) -> dict[str, Any] | None:
    """One tiny turn through the runtime; None when nothing measurable."""
    started = time.monotonic()
    try:
        result = runtime.chat({
            "messages": [{"role": "user", "content": _PROMPT}],
            "max_tokens": _MAX_TOKENS,
            "temperature": 0,
        })
    except Exception:  # noqa: BLE001 - calibration is optional telemetry
        return None
    # Floor at 1 µs: some environments' monotonic clock reads 0.0 for a
    # fast turn, and a zero wall time would make throughput undefined.
    wall = max(time.monotonic() - started, 1e-6)
    usage = result.get("usage") if isinstance(result, dict) else None
    usage = usage if isinstance(usage, dict) else {}
    prompt = int(usage.get("prompt_tokens") or 0)
    completion = int(usage.get("completion_tokens") or 0)
    total = prompt + completion
    if total <= 0 or wall <= 0:
        return None
    return {
        "machine": machine_key(),
        "model": model_id,
        "ts": int(time.time()),
        "prompt_tokens": prompt,
        "completion_tokens": completion,
        "wall_s": round(wall, 3),
        # Honest label: mixed prefill+decode throughput of one short turn.
        "tokens_per_s": round(total / wall, 2),
        "label": "mixed prefill+decode, one short turn",
    }


def maybe_calibrate(gateway: Any) -> None:
    """Thread target: measure once per machine+model, then cache."""
    if not enabled():
        return
    model_id = str(gateway.served_model_id)
    if calibration_for(model_id) is not None:
        return
    record = run_calibration(gateway.runtime, model_id)
    if record is None:
        return
    data = load_calibration()
    data[_key(model_id)] = record
    try:
        save_calibration(data)
    except OSError:
        pass  # cache is best-effort; the measurement itself already ran
