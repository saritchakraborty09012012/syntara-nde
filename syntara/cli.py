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
    if args.json:
        _emit({"base_url": client.base_url, "root_url": client.root_url}, True)
    else:
        print(client.root_url)
        print(f"OpenAI-compatible base: {client.base_url}")
    return 0


def _cmd_health(client: Syntara, args: argparse.Namespace) -> int:
    body = client.health()
    if args.json:
        _emit(body, True)
    else:
        print(f"status: {body.get('status', '?')}")
        scheduler = body.get("scheduler")
        if isinstance(scheduler, dict):
            print(f"scheduler: capacity={scheduler.get('capacity')} "
                  f"queued={scheduler.get('queued')} admitted={scheduler.get('admitted')}")
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

    sub.add_parser("serve", parents=[common],
                   help="Print the local endpoint the CLI talks to")

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
        if args.command == "health":
            return _cmd_health(client, args)
        if args.command == "profile":
            return _cmd_profile(client, args)
        if args.command == "project":
            return _cmd_project(client, args)
        if args.command == "backup":
            return _cmd_backup(client, args)
        return 0
    except (SyntaraError, ValueError, OSError) as exc:
        print(f"syntara: {exc}", file=sys.stderr)
        if getattr(exc, "code", None):
            print(f"syntara: error code: {exc.code}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())