from __future__ import annotations

import argparse
import json
import os
import shlex
import subprocess
import sys
from typing import Any

from ._version import __version__
from .client import Syntara, SyntaraError
from .conversion import (ConversionError, ConversionService, normalize_extra,
                         plan_conversion)
from .library import LibraryError
from .runtime import RuntimeError as RuntimeFailure


def _client(args: argparse.Namespace) -> Syntara:
    return Syntara(
        base_url=args.base_url,
        api_key=args.api_key,
        data_dir=args.data_dir,
    )


def _emit(obj: Any, as_json: bool) -> None:
    if as_json:
        print(json.dumps(obj, indent=2, default=str, ensure_ascii=False))
    elif isinstance(obj, (dict, list)):
        print(obj)
    else:
        print(obj)


def _run_engine(args: list[str]) -> int | None:
    """Delegate a heavy model operation to the engine launcher when available.

    The pip CLI is a thin developer wrapper: downloading weights, conversion,
    benchmarking and tuning live in the engine binary. ``SYNTARA_ENGINE``
    names the engine launcher (a path or a ``shlex``-style command such as
    ``python fakemodel.py``) and overrides discovery. The CLI never guesses an
    engine from ``PATH``: a ``syntara`` on ``PATH`` is usually this Python CLI
    itself, and silently unwinding that would recurse into this very command.

    Returns the child exit status when an engine ran, else ``None`` so the
    caller can fall back to its explanatory hint.
    """
    raw = os.environ.get("SYNTARA_ENGINE")
    if not raw:
        return None
    try:
        launcher = shlex.split(raw)
    except ValueError as exc:
        print(f"syntara: SYNTARA_ENGINE is not a valid command: {exc}", file=sys.stderr)
        return None
    try:
        result = subprocess.run([*launcher, *args], capture_output=True, text=True)
    except OSError as exc:
        print(f"syntara: could not run engine launcher {raw!r}: {exc}", file=sys.stderr)
        return None
    if result.stdout:
        print(result.stdout, end="")
    if result.stderr:
        print(result.stderr, end="", file=sys.stderr)
    return result.returncode


def _cmd_models(client: Syntara, args: argparse.Namespace) -> int:
    action = args.action
    if action in ("install", "remove", "benchmark", "optimize"):
        # Model download/lifecycle and engine benchmarking live on the desktop
        # side and in the engine launcher. When SYNTARA_ENGINE points at the
        # engine, delegate so `syntara models ...` stays automation-friendly.
        verb = {"install": "install", "remove": "remove",
                "benchmark": "bench", "optimize": "tune"}[action]
        engine_args = [verb] + ([args.topic] if args.topic else [])
        code = _run_engine(engine_args)
        if code is not None:
            return code
        hint = {
            "install": "Downloads and conversion are managed in the Syntara desktop "
                       "(Downloads) or on the engine side. Set SYNTARA_ENGINE to a "
                       "launcher of the engine binary to delegate `models install`.",
            "remove": "Model removal is a desktop/engine operation; the local API "
                      "does not delete model files. Set SYNTARA_ENGINE to delegate "
                      "to the engine's `remove` verb.",
            "benchmark": "Run `./syntara bench` on the engine side, or set "
                         "SYNTARA_ENGINE to delegate `models benchmark`; see "
                         "docs/benchmarking.md.",
            "optimize": "Run `./syntara tune` (autotune) or `./syntara plan` on the "
                        "engine side, or set SYNTARA_ENGINE to delegate "
                        "`models optimize`; see docs/tuning.md.",
        }[action]
        print(f"syntara models {action}: {hint}", file=sys.stderr)
        return 2

    if action in ("get", "run"):
        if not args.topic:
            print(f"syntara models {action}: a model id is required", file=sys.stderr)
            return 2

    if action == "list":
        models = client.models.list()
        if args.json:
            _emit(models, True)
        else:
            for model in models:
                print(model.get("id", ""))
        return 0

    if action == "get":
        model = client.models.get(args.topic)
        if args.json:
            _emit(model, True)
        else:
            print(model.get("id", ""))
            if model.get("created"):
                print(f"created: {model['created']}")
        return 0

    if action == "search":
        term = (args.topic or "").lower()
        matches = []
        for model in client.models.list():
            haystack = " ".join(str(v) for v in model.values()).lower()
            if not term or term in haystack:
                matches.append(model)
        if args.json:
            _emit(matches, True)
        else:
            for model in matches:
                print(model.get("id", ""))
        return 0

    if action == "run":
        # `models run` verifies the model is currently served and prints the
        # endpoint a caller can use right now.
        model = client.models.get(args.topic)
        print(f"{client.root_url}  model={model.get('id', '')}  ready")
        return 0

    return 2  # unreachable


def _cmd_chat(client: Syntara, args: argparse.Namespace) -> int:
    model = args.model or client.default_model()
    if args.message:
        message = " ".join(args.message)
        if args.no_stream:
            print(client.chat(model, message, system=args.system))
        else:
            for frame in client.stream_chat(model, message, system=args.system):
                if frame["delta"]:
                    sys.stdout.write(frame["delta"])
                    sys.stdout.flush()
            print()
        return 0

    # Interactive REPL.
    prompt = "syntara> "
    try:
        while True:
            sys.stdout.write(prompt)
            sys.stdout.flush()
            line = sys.stdin.readline()
            if not line:  # EOF (Ctrl-D / Ctrl-Z)
                break
            text = line.rstrip("\r\n")
            if text.strip().lower() in ("exit", "quit"):
                break
            if not text.strip():
                continue
            for frame in client.stream_chat(model, text, system=args.system):
                if frame["delta"]:
                    sys.stdout.write(frame["delta"])
                    sys.stdout.flush()
            print()
    except KeyboardInterrupt:
        print()
        return 0
    return 0


def _cmd_agents(client: Syntara, args: argparse.Namespace) -> int:
    result = client.agents.run(args.task, model=args.model, system=args.system,
                               max_steps=args.max_steps, temperature=args.temperature)
    if args.json:
        _emit(result, True)
    else:
        print(result.get("content", ""))
        if result.get("interrupted"):
            print(f"[agent stopped after {result['steps']} steps: " +
                  result["interrupted"] + "]", file=sys.stderr)
    return 0


def _cmd_project(client: Syntara, args: argparse.Namespace) -> int:
    if args.action == "list":
        _emit(client.projects.list(), args.json)
    elif args.action == "create":
        project = client.projects.create(args.name, description=args.description)
        _emit(project, args.json)
    elif args.action == "get":
        project = client.projects.get(args.name)
        if project is None:
            print(f"project {args.name!r} not found", file=sys.stderr)
            return 1
        _emit(project, args.json)
    elif args.action == "delete":
        if not client.projects.delete(args.name):
            print(f"project {args.name!r} not found", file=sys.stderr)
            return 1
        print(f"deleted project {args.name!r}")
    return 0


def _cmd_backup(client: Syntara, args: argparse.Namespace) -> int:
    if args.action == "create":
        path = client.backups.create(out=args.out, include=args.include)
        print(path)
    elif args.action == "list":
        _emit(client.backups.list(), args.json)
    elif args.action == "verify":
        result = client.backups.verify(args.archive)
        if result.get("ok"):
            _emit(result, args.json)
            return 0
        _emit(result, args.json)
        return 1
    elif args.action == "restore":
        try:
            summary = client.backups.restore(args.archive, include=args.include,
                                             merge=not args.no_merge)
        except ValueError as exc:
            print(f"syntara backup restore: {exc}", file=sys.stderr)
            return 1
        _emit(summary, args.json)
    return 0


def _cmd_serve(client: Syntara, args: argparse.Namespace) -> int:
    if not args.model:
        # Informational: where a gateway would be. `--model` starts one.
        if args.json:
            _emit({"base_url": client.base_url, "root_url": client.root_url,
                   "hint": "start a gateway with: syntara serve --model "
                           "<id-or-path>"}, True)
        else:
            print(client.root_url)
            print(f"OpenAI-compatible base: {client.base_url}")
            print("No gateway is running in this process; start one with: "
                  "syntara serve --model <id-or-path>")
        return 0

    from .gateway import HostGateway, default_api_key
    from .library import ModelLibrary

    library = ModelLibrary(args.data_dir)
    entry = library.resolve(args.model)
    gateway = HostGateway(
        entry, library=library, host=args.host, port=args.port,
        context=args.context, api_key=default_api_key())
    print(f"loading {entry['id']} from {entry['path']} ...", flush=True)
    gateway.start()
    print(f"serving model={entry['id']} at {gateway.url} "
          f"(OpenAI base {gateway.base_url}) - Ctrl-C to stop", flush=True)
    try:
        gateway.serve_forever()
    except KeyboardInterrupt:
        gateway.stop()
    if gateway.failure:
        # Supervision gave up (crash loop or failed reload): say why and
        # exit non-zero so scripts notice (AGENTS §73).
        print(f"host failed: {gateway.failure}", file=sys.stderr)
        return 1
    print("stopped", flush=True)
    return 0


def _cmd_library(args: argparse.Namespace) -> int:
    from .library import ModelLibrary

    library = ModelLibrary(args.data_dir)
    action = args.action
    target = args.target

    if action == "list":
        entries = library.list()
        if args.json:
            _emit(entries, True)
        elif not entries:
            print("library is empty - add a GGUF file with: "
                  "syntara library add <file.gguf>")
        else:
            for e in entries:
                ctx = (e.get("model") or {}).get("context_length") or "?"
                print(f"{e['id']:<28} {e['status']:<8} "
                      f"{(e.get('model') or {}).get('architecture', '?'):<10} "
                      f"ctx={ctx}  {e['path']}")
        return 0

    if action == "get":
        entry = library.get(target) if target else None
        if entry is None:
            print(f"syntara library get: no model with id {target!r}",
                  file=sys.stderr)
            return 1
        _emit(entry, True)
        return 0

    if action == "add":
        if not target:
            print("syntara library add: a GGUF file path is required",
                  file=sys.stderr)
            return 2
        entry = library.add(target, copy=args.copy)
        if args.json:
            _emit(entry, True)
        else:
            print(f"added {entry['id']} -> {entry['path']}")
        return 0

    if action == "scan":
        result = library.scan(target or ".", copy=args.copy)
        if args.json:
            _emit(result, True)
        else:
            for model_id in result["added"]:
                print(f"added {model_id}")
            for skip in result["skipped"]:
                print(f"skipped {skip['path']}: {skip['reason']}",
                      file=sys.stderr)
            print(f"scanned {result['scanned']} file(s), "
                  f"added {len(result['added'])}, "
                  f"skipped {len(result['skipped'])}")
        return 0

    if action == "remove":
        if not target:
            print("syntara library remove: a model id is required",
                  file=sys.stderr)
            return 2
        entry = library.get(target)
        if entry is None:
            print(f"syntara library remove: no model with id {target!r}",
                  file=sys.stderr)
            return 1
        if args.delete_file and not args.yes:
            size_mb = round((entry.get("size") or 0) / (1024 * 1024), 1)
            print("Refusing to delete the model file without confirmation.\n"
                  f"  id:   {entry['id']}\n"
                  f"  file: {entry['path']}\n"
                  f"  size: {size_mb} MB\n"
                  "Re-run with --yes to permanently delete this file, or "
                  "omit --delete-file to only remove it from the library.",
                  file=sys.stderr)
            return 2
        result = library.remove(target, delete_file=args.delete_file,
                                expect=entry)
        if args.json:
            _emit(result, True)
        else:
            if result["file_deleted"]:
                print(f"removed {target} and deleted {result['deleted_path']}")
            else:
                print(f"removed {target} from the library "
                      f"(file kept at {entry['path']})")
        return 0

    return 2  # unreachable


def _cmd_health(client: Syntara, args: argparse.Namespace) -> int:
    body = client.health()
    if args.json:
        _emit(body, True)
    else:
        print(f"status: {body.get('status', '?')}")
        scheduler = body.get("scheduler")
        if isinstance(scheduler, dict):
            print(f"scheduler: capacity={scheduler.get('capacity')} "
                  f"active={scheduler.get('active')} "
                  f"queued={scheduler.get('queued')} "
                  f"admitted={scheduler.get('admitted')} "
                  f"rejected={scheduler.get('rejected')} "
                  f"timed_out={scheduler.get('timed_out')}")
        hwinfo = body.get("hwinfo")
        if isinstance(hwinfo, dict):
            print(f"hardware: {hwinfo.get('cpu', '?')} / {hwinfo.get('gpu', '?')} "
                  f"ram={hwinfo.get('ram_avail_gb')} GB free")
    return 0


def _cmd_profile(client: Syntara, args: argparse.Namespace) -> int:
    body = client.profile()
    if args.json:
        _emit(body, True)
    else:
        turns = body.get("turns", [])
        print(f"turns: {len(turns)}")
        if turns:
            last = turns[-1]
            print(f"latest: prompt={last.get('prompt_tokens')} "
                  f"completion={last.get('completion_tokens')} "
                  f"wall={last.get('wall_s', 0):.2f}s")
    return 0


def _cmd_inspect(args: argparse.Namespace) -> int:
    from .gguf_inspect import inspect_file  # deferred: keeps `syntara --help` light

    report = inspect_file(args.path)
    if args.json:
        print(json.dumps(report, indent=2, default=str, ensure_ascii=False))
        return 0
    fmt = report["format"]
    model = report["model"]
    tens = report["tensors"]
    est = report["estimates"]
    print(f"GGUF v{fmt['version']}  {report['path']}")
    print(f"  model        : {model['name'] or '-'}  "
          f"(arch={model['architecture']}, ctx={model['context_length'] or '?'})")
    quants = ", ".join(f"{k}x{v}" for k, v in tens["by_type"].items())
    print(f"  tensors      : {tens['count']}  "
          f"({est['params_billion']}B params, weights {est['weight_mb']} MB)")
    print(f"  quantizations: {quants or '-'}")
    print(f"  file         : {est['file_mb']} MB"
          + (f", est. RAM >= {est['ram_gb_min']} GB" if est["ram_gb_min"] else ""))
    if not report["data_complete"]:
        print("  DATA INCOMPLETE: file is truncated or still downloading")
    for b in report["compatibility"]["badges"]:
        print(f"  [{b['level']:5}] {b['id']}: {b['message']}")
    for w in report["warnings"]:
        print(f"  warning: {w}")
    return 0


def _cmd_convert(args: argparse.Namespace) -> int:
    """Stream, resume, cancel and cache a checkpoint conversion.

    With ``--plan`` this is the auto-trigger: the planner's advisory
    ``quantization.conversion`` block picks the converter and the plan's
    model path becomes ``--repo`` (AGENTS §114: the feature includes its
    CLI surface, not just the core function).
    """
    repo = args.repo
    outdir = args.outdir
    if args.plan:
        try:
            if args.plan == "-":
                plan = json.load(sys.stdin)
            else:
                with open(args.plan, encoding="utf-8") as handle:
                    plan = json.load(handle)
        except (OSError, ValueError) as exc:
            print(f"syntara: cannot read plan {args.plan!r}: {exc}",
                  file=sys.stderr)
            return 2
        if not isinstance(plan, dict):
            print(f"syntara: plan {args.plan!r} is not a plan JSON object",
                  file=sys.stderr)
            return 2
        proposal = plan_conversion(plan)
        if not proposal["applicable"]:
            if args.json:
                print(json.dumps({"type": "result", **proposal},
                                 ensure_ascii=False))
            else:
                print(f"no conversion called for by this plan: "
                      f"{proposal['reason']}")
            return 0
        repo = repo or proposal["repo"]
        if not repo:
            print("syntara: the plan carries no model path; pass "
                  "--repo <source checkpoint>", file=sys.stderr)
            return 2
        if not outdir:
            print("syntara: this plan allows a conversion; pass a fresh "
                  "--outdir <dir>, e.g.:", file=sys.stderr)
            print(f"  syntara convert --repo {repo} "
                  f"--outdir {repo}-converted", file=sys.stderr)
            return 2
    if not repo or not outdir:
        print("syntara: convert needs --repo <source> and --outdir <fresh "
              "dir> (or --plan <file>); see `syntara convert --help`",
              file=sys.stderr)
        return 2

    as_json = args.json

    def show(event: dict) -> None:
        if as_json:
            print(json.dumps(event, ensure_ascii=False), flush=True)
        elif event["type"] == "line":
            print(event["text"], flush=True)
        elif event["type"] == "step" and event["total"] > 1:
            print(f"step {event['step']}/{event['total']}: converter",
                  flush=True)

    service = ConversionService(data_dir=args.data_dir)
    job = None
    try:
        job = service.start(repo, outdir,
                            extra_flags=normalize_extra(args.extra),
                            force=args.force, on_event=show)
        job = service.wait(job.id)
    except ConversionError as exc:
        print(f"syntara: {exc}", file=sys.stderr)
        return 2
    except KeyboardInterrupt:
        if job is not None:
            try:
                service.cancel(job.id)
                service.wait(job.id, timeout=15.0)
            except ConversionError:
                pass
        print("syntara: conversion cancelled - rerun to resume "
              "(already-written shards are kept)", file=sys.stderr)
        return 130

    if job.status == "completed":
        if not as_json:
            if job.cached:
                print(f"already converted (cache hit): {job.outdir}")
            else:
                print(f"conversion completed: {job.outdir}")
        return 0
    if job.status == "failed":
        print(f"syntara: conversion failed ({job.error or 'error'}):",
              file=sys.stderr)
        if job.error_detail:
            print(job.error_detail, file=sys.stderr)
        print("rerun the same command to resume from the last written shard.",
              file=sys.stderr)
        return 1
    print("syntara: conversion cancelled - rerun to resume "
          "(already-written shards are kept)", file=sys.stderr)
    return 130


def _common_options() -> argparse.ArgumentParser:
    # default=argparse.SUPPRESS so a subparser can never clobber a value the
    # main parser already parsed from the command line (argparse re-applies
    # subparser defaults over the shared namespace).
    common = argparse.ArgumentParser(add_help=False)
    common.add_argument("--base-url", default=argparse.SUPPRESS)
    common.add_argument("--api-key", default=argparse.SUPPRESS)
    common.add_argument("--data-dir", default=argparse.SUPPRESS,
                        help="user-data directory for projects/backups "
                             "(default: $SYNTARA_HOME or the OS per-user data dir)")
    common.add_argument("--json", action="store_true", default=argparse.SUPPRESS,
                        help="machine-readable JSON output")
    return common


def build_parser() -> argparse.ArgumentParser:
    common = _common_options()
    parser = argparse.ArgumentParser(prog="syntara",
                                     description="Syntara local AI developer CLI",
                                     parents=[common])
    parser.add_argument("--version", action="version", version=__version__)
    sub = parser.add_subparsers(dest="command")

    models = sub.add_parser("models", parents=[common],
                            help="Inspect models served by the local runtime")
    models.add_argument("action", choices=["list", "get", "search", "run",
                                           "install", "remove", "benchmark", "optimize"])
    models.add_argument("topic", nargs="?",
                        help="model id (get/run) or search term (search)")

    chat = sub.add_parser("chat", parents=[common],
                          help="Chat with a local model (interactive without a message)")
    chat.add_argument("--model", default=None)
    chat.add_argument("message", nargs="*")
    chat.add_argument("--system", default=None)
    chat.add_argument("--no-stream", action="store_true")

    agents = sub.add_parser("agents", parents=[common], help="Run a local agent loop")
    agents_sub = agents.add_subparsers(dest="agent_action", required=True)
    run_agents = agents_sub.add_parser("run", parents=[common],
                                       help="Run an agent on a task")
    run_agents.add_argument("task")
    run_agents.add_argument("--model", default=None)
    run_agents.add_argument("--system", default=None)
    run_agents.add_argument("--max-steps", type=int, default=3)
    run_agents.add_argument("--temperature", type=float, default=0.2)

    agent = sub.add_parser("agent", parents=[common], help="Alias for `agents run`")
    agent.add_argument("task")
    agent.add_argument("--model", default=None)
    agent.add_argument("--system", default=None)
    agent.add_argument("--max-steps", type=int, default=3)
    agent.add_argument("--temperature", type=float, default=0.2)

    serve = sub.add_parser(
        "serve", parents=[common],
        help="Start the local gateway (--model) or print the endpoint")
    serve.add_argument("--model", default=None,
                       help="library id or GGUF path to serve (starts the "
                            "gateway; without it, prints the endpoint)")
    serve.add_argument("--host", default="127.0.0.1",
                       help="bind address (default: loopback only)")
    serve.add_argument("--port", type=int, default=8000)
    serve.add_argument("--context", type=int, default=None,
                       help="context window override (default: min(4096, "
                            "model context))")

    library = sub.add_parser(
        "library", parents=[common],
        help="Manage local GGUF model files (offline catalogue)")
    library.add_argument("action",
                         choices=["list", "get", "add", "scan", "remove"])
    library.add_argument("target", nargs="?",
                         help="file path (add), directory (scan), or model "
                              "id (get/remove)")
    library.add_argument("--copy", action="store_true",
                         help="(add/scan) copy the file into the library "
                              "instead of referencing it in place")
    library.add_argument("--delete-file", action="store_true",
                         help="(remove) also delete the model file from disk")
    library.add_argument("--yes", action="store_true",
                         help="(remove --delete-file) confirm deletion")

    inspect = sub.add_parser("inspect", parents=[common],
                             help="Inspect a local GGUF file (metadata, quants, compatibility)")
    inspect.add_argument("path", help="path to a .gguf model file")

    convert = sub.add_parser(
        "convert", parents=[common],
        help="Convert a checkpoint with the family's converter "
             "(streaming, resumable, cancellable, cached)")
    convert.add_argument("--repo", default=None,
                         help="source checkpoint: local directory or HF repo id")
    convert.add_argument("--outdir", default=None,
                         help="fresh output directory (the engine refuses one "
                              "that already holds a checkpoint)")
    convert.add_argument("--plan", default=None, metavar="FILE",
                         help="plan JSON ('-' for stdin): take the converter "
                              "and --repo from the planner's choice")
    convert.add_argument("--force", action="store_true",
                         help="run again even if this exact conversion already "
                              "completed")
    convert.add_argument("extra", nargs=argparse.REMAINDER,
                         help="after --: passed through to the engine's "
                              "convert (e.g. -- --ebits 4)")

    sub.add_parser("health", parents=[common], help="Read local runtime health")
    sub.add_parser("profile", parents=[common], help="Read per-turn runtime telemetry")

    project = sub.add_parser("project", parents=[common], help="Manage local projects")
    project.add_argument("action", choices=["list", "create", "get", "delete"])
    project.add_argument("name", nargs="?")
    project.add_argument("--description", default="")

    backup = sub.add_parser("backup", parents=[common],
                            help="Local, offline backups (chats/memories/projects/settings)")
    backup.add_argument("action", choices=["create", "list", "verify", "restore"])
    backup.add_argument("archive", nargs="?")
    backup.add_argument("--out", default=None, help="(create) destination file or directory")
    backup.add_argument("--include", default=None,
                        help="comma-separated sections: chats,memories,projects,settings")
    backup.add_argument("--no-merge", action="store_true", help="(restore) replace instead of merge")
    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    if not args.command:
        parser.print_help()
        return 0
    # Resolve the shared options centrally (their argparse default is
    # SUPPRESS), so every value a subparser saw stays intact.
    args.base_url = getattr(args, "base_url", None) or (
        os.environ.get("SYNTARA_BASE_URL", "http://127.0.0.1:8000/v1"))
    args.api_key = getattr(args, "api_key", None) or os.environ.get("SYNTARA_API_KEY", "")
    args.data_dir = getattr(args, "data_dir", None)
    args.json = bool(getattr(args, "json", False))
    try:
        client = _client(args)
        if args.command == "models":
            return _cmd_models(client, args)
        if args.command == "chat":
            return _cmd_chat(client, args)
        if args.command == "agents":
            if args.agent_action == "run":
                return _cmd_agents(client, args)
            return 2
        if args.command == "agent":
            return _cmd_agents(client, args)
        if args.command == "serve":
            return _cmd_serve(client, args)
        if args.command == "library":
            return _cmd_library(args)
        if args.command == "inspect":
            return _cmd_inspect(args)
        if args.command == "convert":
            return _cmd_convert(args)
        if args.command == "health":
            return _cmd_health(client, args)
        if args.command == "profile":
            return _cmd_profile(client, args)
        if args.command == "project":
            return _cmd_project(client, args)
        if args.command == "backup":
            return _cmd_backup(client, args)
        return 0
    except (SyntaraError, LibraryError, RuntimeFailure, ValueError, OSError) as exc:
        print(f"syntara: {exc}", file=sys.stderr)
        detail = getattr(exc, "detail", "")
        if detail:
            print("syntara: backend detail (last lines):", file=sys.stderr)
            print("\n".join(str(detail).splitlines()[-12:]), file=sys.stderr)
        if getattr(exc, "code", None):
            print(f"syntara: error code: {exc.code}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())