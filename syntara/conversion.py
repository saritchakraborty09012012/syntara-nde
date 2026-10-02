"""Checkpoint conversion with streaming, resumable, cancellable, cached runs.

Conversion is long-running and heavy (AGENTS §10, §68, §114), so this layer
wraps the engine's ``syntara convert`` with the four behaviors a raw
``subprocess.call`` does not have:

- streaming: child output is parsed into structured events as it happens;
- resumable: a failed or cancelled job re-runs the exact same argv, and each
  family's converter keeps its own shard-level resume state (manifests,
  skip-existing) so rerun == resume;
- cancellable: cancel() terminates the spawned process tree (Windows job
  object) and reports honestly that the output is resumable, not complete;
- cached: a conversion that already completed - keyed by its exact argv -
  returns immediately while its output directory still exists.

Routing (which converter, which precision flags, output-directory refusal)
stays in the engine launcher: the wrapper asks for the commands with
``syntara convert --print-argv`` and executes exactly what the launcher
prints. One source of truth, no duplicated family logic, and the launcher's
safety refusals apply verbatim (AGENTS §47: repository first).
"""
from __future__ import annotations

import collections
import hashlib
import json
import os
import re
import shlex
import subprocess
import threading
import time
from pathlib import Path
from typing import Any, Callable

from .runtime.process import ManagedProcess, popen_kwargs
from .store import default_data_dir

# The launcher prefixes its machine-readable answer with this marker so the
# banner/progress prints around it can never be mistaken for the payload.
ARGV_PREFIX = "__SYNTARA_ARGV__ "
EVENT_LIMIT = 500
DRY_RUN_TIMEOUT_S = 120.0
WAIT_POLL_S = 0.05
TERMINAL_STATUSES = ("completed", "failed", "cancelled")

_SHARD_RE = re.compile(r"\[(\d+)/(\d+)\]")
_RESUME_RE = re.compile(r"\[RESUME\][^\d]*(\d+)")
_WROTE_RE = re.compile(r"wrote\s+(\S+)")
_ETA_RE = re.compile(r"\bETA\s*[: ]\s*([0-9]+(?::[0-9]+)+)")
_MODULE_RE = re.compile(r"ModuleNotFoundError: No module named '([^']+)'"
                         r'|No module named \'([^\']+)\'')
_ERROR_TAIL_LINES = 8


class ConversionError(Exception):
    """A conversion cannot be planned or started; the message is actionable."""


def resolve_engine_launcher() -> list[str]:
    """The engine launcher argv from SYNTARA_ENGINE, or an actionable error.

    Same contract as the CLI's engine delegation: an explicit command (path
    or shlex-style string), never a guess from PATH - a ``syntara`` on PATH
    is usually the host CLI itself (AGENTS §30: explicit precedence).
    """
    raw = os.environ.get("SYNTARA_ENGINE")
    if not raw or not raw.strip():
        raise ConversionError(
            "SYNTARA_ENGINE is not set. Conversion runs through the engine "
            "launcher; set SYNTARA_ENGINE to it, e.g. "
            'SYNTARA_ENGINE="python <repo>/c/syntara".')
    try:
        launcher = shlex.split(raw)
    except ValueError as exc:
        raise ConversionError(
            f"SYNTARA_ENGINE is not a valid command: {exc}") from exc
    if not launcher:
        raise ConversionError(
            "SYNTARA_ENGINE is empty; set it to the engine launcher command.")
    return launcher


def plan_conversion(plan: dict[str, Any]) -> dict[str, Any]:
    """The planner's conversion proposal plus the model path it applies to.

    The planner never converts anything (resource_plan): it emits an
    advisory ``quantization.conversion`` block, and this turns a plan JSON
    into what ``start()`` needs - the source checkpoint (the plan's model
    path) and whether a conversion is called for at all.
    """
    quant = plan.get("quantization") or {}
    conversion = quant.get("conversion") or {}
    model = plan.get("model") or {}
    repo = model.get("path")
    return {
        "applicable": bool(conversion.get("applicable")),
        "script": conversion.get("script"),
        "reason": str(conversion.get("reason") or ""),
        "repo": repo if isinstance(repo, str) and repo else None,
    }


def normalize_extra(extra: list[str] | None) -> list[str]:
    """Passthrough flags as argparse's REMAINDER yields them (leading ``--``).

    ``syntara convert --repo r --outdir o -- --ebits 4`` arrives as
    ``['--', '--ebits', '4']``; the marker itself is not a converter flag.
    """
    flags = [token for token in (extra or []) if token is not None]
    if flags and flags[0] == "--":
        flags = flags[1:]
    return flags


def _interpret(line: str) -> dict[str, Any] | None:
    """A structured event from one converter output line, or None for plain.

    Tolerant by design: converters print human lines with slightly
    different shapes (shard counters, resume notices, written files, ETA).
    Unknown lines still stream through as ``line`` events.
    """
    resume = _RESUME_RE.search(line)
    if resume:
        return {"type": "resume", "already_done": int(resume.group(1))}
    shard = _SHARD_RE.search(line)
    if shard:
        event: dict[str, Any] = {"type": "progress",
                                 "done": int(shard.group(1)),
                                 "total": int(shard.group(2))}
        eta = _ETA_RE.search(line)
        if eta:
            event["eta"] = eta.group(1).strip()
        return event
    wrote = _WROTE_RE.search(line)
    if wrote:
        return {"type": "wrote", "file": wrote.group(1)}
    return None


def _classify(output: str, rc: int | None) -> tuple[str, str]:
    """Map a failed run to (error kind, human detail) the user can act on."""
    module = _MODULE_RE.search(output)
    if module:
        name = module.group(1) or module.group(2)
        return ("missing_dependency",
                f"the converter needs the Python module {name!r}, which the "
                f"engine's Python does not have. Install it where the "
                f"converter runs and rerun - rerun resumes.")
    tail = "\n".join(output.splitlines()[-_ERROR_TAIL_LINES:])
    if not tail:
        tail = f"the converter exited with code {rc} and printed nothing."
    return ("failed", tail)


class ConversionJob:
    """One conversion: exact commands, live status, bounded event stream."""

    def __init__(self, job_id: str, steps: list[list[str]], repo: str,
                 outdir: str) -> None:
        self.id = job_id
        self.steps = steps
        self.repo = repo
        self.outdir = outdir
        self.status = "queued"  # queued -> running -> completed|failed|cancelled
        self.rc: int | None = None
        self.error: str | None = None
        self.error_detail: str | None = None
        self.cached = False
        self.step_index = 0
        self.created = time.time()
        self.ended: float | None = None
        self.events: collections.deque[dict[str, Any]] = collections.deque(
            maxlen=EVENT_LIMIT)
        self._on_event: Callable[[dict[str, Any]], None] | None = None
        self._cancel_requested = False
        self._proc: ManagedProcess | None = None

    @property
    def done(self) -> bool:
        return self.status in TERMINAL_STATUSES

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "status": self.status,
            "repo": self.repo,
            "outdir": self.outdir,
            "rc": self.rc,
            "error": self.error,
            "error_detail": self.error_detail,
            "cached": self.cached,
            "step": self.step_index + 1,
            "steps": self.steps,
            "created": self.created,
            "ended": self.ended,
        }


class ConversionService:
    """Plans, runs, cancels, resumes and caches checkpoint conversions.

    One conversion runs at a time (AGENTS §64): a converter is a RAM/CPU
    bound job, and two writers into one output directory would corrupt it.
    """

    def __init__(self, *, data_dir: str | os.PathLike | None = None,
                 launcher: list[str] | None = None,
                 dry_run_timeout: float = DRY_RUN_TIMEOUT_S) -> None:
        base = Path(data_dir) if data_dir else default_data_dir()
        self.cache_path = base / "conversions.json"
        self.launcher = list(launcher) if launcher else None
        self.dry_run_timeout = dry_run_timeout
        self._jobs: dict[str, ConversionJob] = {}
        self._active: str | None = None
        self._lock = threading.Lock()

    # ------------------------------------------------------------- planning

    def _plan_steps(self, repo: str, outdir: str,
                    extra_flags: list[str]) -> tuple[str, list[list[str]]]:
        """Ask the launcher which converter commands to run (--print-argv)."""
        launcher = self.launcher or resolve_engine_launcher()
        argv = [*launcher, "convert", "--repo", repo, "--outdir", outdir,
                *extra_flags, "--print-argv"]
        try:
            result = subprocess.run(  # noqa: S603 - trusted argv parts
                argv, capture_output=True, timeout=self.dry_run_timeout,
                **popen_kwargs())
        except OSError as exc:
            raise ConversionError(
                f"could not run the engine launcher {launcher[0]!r}: {exc}. "
                f"Check SYNTARA_ENGINE.") from exc
        except subprocess.TimeoutExpired:
            raise ConversionError(
                "the engine launcher did not answer --print-argv within "
                f"{self.dry_run_timeout:g}s; check the launcher with "
                "`syntara doctor` on the engine side.") from None
        stdout = (result.stdout or b"").decode("utf-8", errors="replace")
        for line in stdout.splitlines():
            if line.startswith(ARGV_PREFIX):
                payload = line[len(ARGV_PREFIX):]
                try:
                    steps = json.loads(payload).get("steps")
                except ValueError:
                    steps = None
                if (isinstance(steps, list) and steps
                        and all(isinstance(step, list) and step
                                for step in steps)):
                    key = hashlib.sha256(
                        json.dumps(steps, ensure_ascii=False).encode("utf-8")
                    ).hexdigest()
                    return key[:16], [[str(part) for part in step]
                                      for step in steps]
                raise ConversionError(
                    "the engine launcher printed a malformed --print-argv "
                    "answer; update the engine side (steps payload invalid).")
        stderr = (result.stderr or b"").decode("utf-8", errors="replace")
        detail = stderr.strip() or stdout.strip() or "(no output)"
        raise ConversionError(
            "the engine launcher could not plan the conversion "
            f"(exit {result.returncode}):\n{detail}")

    # ---------------------------------------------------------------- cache

    def _load_cache(self) -> dict[str, Any]:
        try:
            data = json.loads(self.cache_path.read_text(encoding="utf-8"))
        except (OSError, ValueError):
            return {}
        return data if isinstance(data, dict) else {}

    def _save_cache(self, cache: dict[str, Any]) -> str | None:
        try:
            self.cache_path.parent.mkdir(parents=True, exist_ok=True)
            tmp = self.cache_path.with_name(self.cache_path.name + ".tmp")
            tmp.write_text(json.dumps(cache, ensure_ascii=False, indent=2),
                           encoding="utf-8")
            os.replace(tmp, self.cache_path)
            return None
        except OSError as exc:
            # The cache only saves a future rerun; losing it must never fail
            # a conversion that actually ran. The caller surfaces this as a
            # warning event instead of pretending it did not happen.
            return str(exc)

    # -------------------------------------------------------------- events

    @staticmethod
    def _emit(job: ConversionJob, event: dict[str, Any]) -> None:
        event = {"t": round(time.time(), 3), **event}
        job.events.append(event)
        callback = job._on_event
        if callback is not None:
            try:
                callback(event)
            except Exception:  # noqa: BLE001 - a UI callback must not kill the worker
                pass

    # ---------------------------------------------------------- lifecycle

    def start(self, repo: str | None, outdir: str | None, *,
              extra_flags: list[str] | None = None, force: bool = False,
              on_event: Callable[[dict[str, Any]], None] | None = None
              ) -> ConversionJob:
        """Plan, then run one conversion in the background. Returns the job.

        Raises ConversionError when it cannot start: missing inputs, a
        missing engine launcher, a launcher that cannot plan, or another
        conversion already running.
        """
        if not repo:
            raise ConversionError(
                "--repo is required: the source checkpoint (a local "
                "directory or an HF repo id).")
        if not outdir:
            raise ConversionError(
                "--outdir is required: the fresh directory the converted "
                "checkpoint is written to (the engine refuses one that "
                "already holds a checkpoint).")
        extra = normalize_extra(extra_flags)
        key, steps = self._plan_steps(repo, outdir, extra)
        with self._lock:
            active = self._jobs.get(self._active) if self._active else None
            if active is not None and not active.done:
                raise ConversionError(
                    f"conversion {active.id} is already running on "
                    f"{active.outdir}; wait for it or cancel it first.")
            cache = self._load_cache()
            entry = None if force else cache.get(key)
            if (isinstance(entry, dict)
                    and entry.get("status") == "completed"
                    and os.path.isdir(outdir)):
                job = ConversionJob(key, steps, repo, outdir)
                job.cached = True
                job.status = "completed"
                job.ended = time.time()
                job._on_event = on_event
                self._emit(job, {"type": "cached",
                                 "text": f"already converted (cache hit): {outdir}"})
                self._jobs[job.id] = job
                return job
            job = ConversionJob(key, steps, repo, outdir)
            job._on_event = on_event
            job.status = "running"
            self._jobs[job.id] = job
            self._active = job.id
            self._emit(job, {"type": "started", "repo": repo,
                             "outdir": outdir, "steps": len(steps)})
            worker = threading.Thread(target=self._run, args=(job,),
                                      daemon=True, name="conversion")
            worker.start()
            return job

    def _run(self, job: ConversionJob) -> None:
        output_parts: list[str] = []
        terminal = "completed"
        try:
            for index, argv in enumerate(job.steps):
                if job._cancel_requested:
                    terminal = "cancelled"
                    break
                job.step_index = index
                self._emit(job, {"type": "step", "step": index + 1,
                                 "total": len(job.steps)})
                proc = ManagedProcess(argv, merge_streams=True)
                job._proc = proc
                proc.spawn()
                stream = proc.proc.stdout if proc.proc else None
                try:
                    if stream is not None:
                        for raw in iter(stream.readline, b""):
                            line = raw.decode("utf-8",
                                              errors="replace").rstrip("\r\n")
                            if not line:
                                continue
                            output_parts.append(line)
                            self._emit(job, {"type": "line", "text": line})
                            interpreted = _interpret(line)
                            if interpreted is not None:
                                self._emit(job, interpreted)
                finally:
                    # Close our end of the merged pipe; the cancel path
                    # never closes it (the reader thread owns it), so a
                    # cancelled job still drains to EOF without a leak.
                    if stream is not None:
                        try:
                            stream.close()
                        except OSError:
                            pass
                rc = proc.wait(timeout=30.0)
                job.rc = rc
                if job._cancel_requested:
                    terminal = "cancelled"
                    break
                if rc is None:
                    # EOF came from a closed pipe but the process lingers.
                    proc.terminate()
                    job.rc = proc.wait(timeout=5.0)
                    terminal = "failed"
                    job.error = "failed"
                    job.error_detail = (
                        "the converter stopped producing output and was "
                        "terminated; rerun to resume.")
                    break
                if rc != 0:
                    terminal = "failed"
                    job.error, job.error_detail = _classify(
                        "\n".join(output_parts), rc)
                    break
            if terminal == "completed" and job._cancel_requested:
                terminal = "cancelled"
        except RuntimeError as exc:
            terminal = "failed"
            job.error = "engine_not_found"
            job.error_detail = str(exc)
        except Exception as exc:  # noqa: BLE001 - a wrapper must not strand a running job
            # The job still reaches a terminal status (AGENTS §28): an
            # unexpected wrapper error is reported, never left "running".
            # A cancel tears the pipe down under the reader - that noise is
            # part of cancelling, not a separate failure.
            if job._cancel_requested:
                terminal = "cancelled"
            else:
                terminal = "failed"
                job.error = "wrapper_error"
                job.error_detail = (
                    f"conversion wrapper error: {exc}; rerun to resume.")
        finally:
            with self._lock:
                job.ended = time.time()
                if terminal == "cancelled":
                    job.error = "cancelled"
                    job.error_detail = (
                        "cancelled - rerun to resume; shards already "
                        "written are kept (each converter resumes from its "
                        "own manifest).")
                    self._emit(job, {"type": "cancelled",
                                     "text": job.error_detail})
                elif terminal == "failed":
                    self._emit(job, {"type": "failed",
                                     "error": job.error,
                                     "detail": job.error_detail})
                else:
                    self._emit(job, {"type": "done",
                                     "outdir": job.outdir})
                self._record(job, terminal)
                if self._active == job.id:
                    self._active = None
                # Publish the status last: once wait() can observe a
                # terminal status, the cache already says the same thing.
                job.status = terminal

    def _record(self, job: ConversionJob, status: str) -> None:
        cache = self._load_cache()
        cache[job.id] = {
            "status": status,
            "rc": job.rc,
            "error": job.error,
            "repo": job.repo,
            "outdir": job.outdir,
            "steps": job.steps,
            "ended": job.ended,
        }
        problem = self._save_cache(cache)
        if problem:
            self._emit(job, {"type": "warning",
                             "text": f"conversion cache not saved: {problem}"})

    # -------------------------------------------------------------- control

    def job(self, job_id: str) -> ConversionJob:
        job = self._jobs.get(job_id)
        if job is None:
            raise ConversionError(f"no such conversion: {job_id}")
        return job

    def cancel(self, job_id: str | None = None) -> ConversionJob:
        """Stop the running conversion (whole process tree). Idempotent."""
        with self._lock:
            target = job_id or self._active
            job = self._jobs.get(target) if target else None
            if job is None:
                raise ConversionError(
                    "no conversion is running; nothing to cancel.")
            if job.done:
                return job
            job._cancel_requested = True
            proc = job._proc
        if proc is not None:
            proc.terminate(grace=3.0)
        return job

    def wait(self, job_id: str | None = None,
             timeout: float | None = None) -> ConversionJob:
        """Block until the job reaches a terminal status (or the timeout)."""
        with self._lock:
            target = job_id or self._active
        job = self.job(target) if target else None
        if job is None:
            raise ConversionError("no conversion to wait for.")
        deadline = None if timeout is None else time.monotonic() + timeout
        while not job.done:
            if deadline is not None and time.monotonic() >= deadline:
                raise ConversionError(
                    f"conversion {job.id} is still {job.status} after "
                    f"{timeout:g}s.")
            time.sleep(WAIT_POLL_S)
        return job
