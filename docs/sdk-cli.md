# Syntara Python SDK and Developer CLI

The `syntara` pip package (`syntara-engine` on PyPI) is a thin, dependency-free
wrapper around the local Syntara runtime. In the normal flow neither "the
SDK" nor the model leave the user's machine:

```
Python program  ->  Syntara SDK  ->  local runtime (127.0.0.1)  ->  local model
```

No account, no cloud identity, works offline once the runtime is serving a model.

## Install

```bash
pip install syntara-engine
```

The SDK only ever talks to `http://127.0.0.1:<port>/v1`. Override with
`SYNTARA_BASE_URL` or the `--base-url` flag (default `http://127.0.0.1:8000/v1`).
`SYNTARA_API_KEY` is sent as a Bearer token when set.

## SDK

```python
from syntara import Syntara

client = Syntara()

# Chat (non-streaming / streaming and collecting)
print(client.chat("qwen", "Explain quantum entanglement"))

for frame in client.stream_chat("qwen", "Write a haiku"):
    if frame["delta"]:
        print(frame["delta"], end="")

# Models the runtime serves
print(client.models.list())
print(client.models.get("qwen"))

# Runtime health and telemetry
print(client.health())
print(client.profile())

# Brio mode: score a closed set of options instead of generating
print(client.brio("qwen", "Merge or request changes?", ["merge", "request changes"]))

# A small local agent loop (tools execute on this machine)
client.agents.run("Summarize all open TODOs in this repo", tools={"scan": scan_fn})

# Local, offline projects and backups
client.projects.create("my-project", description="...")
client.backups.create(out="/path/to/backup.syntara-backup")
client.backups.verify("/path/to/backup.syntara-backup")
client.backups.restore("/path/to/backup.syntara-backup", include="projects,settings")
```

Errors raise `SyntaraError` with `.status`, `.code` and `.body` when the
runtime returned a decorated error (for example `model_not_found`).

### Agent loop

`agents.run(task, ...)` sends the task to `/v1/chat/completions`. If the model
family opts into OpenAI-style tool calls, it honors them and feeds results back
for up to `max_steps` iterations. `tools` maps tool names to local callables
which receive the parsed JSON arguments. A tool call with no bound handler
stops the loop and is reported honestly in the result.

### Projects, memories, chats and backups

Backups are a first-class, offline feature because Syntara has no account:

- `.syntara-backup` is a zip archive containing a `manifest.json` plus the
  selected sections: `chats.json` / `chats/*.json`, `memories.json`,
  `projects.json`, `settings.json` and optionally `models.json` (metadata and
  references only — never model weights).
- `verify_backup` checks the manifest, required files and rejects zip entries
  that could escape the target directory (path traversal).
- `restore_backup` restores selected sections (`chats`, `memories`, `projects`,
  `settings`), merging by default and replacing with `merge=False`.

User data lives in `$SYNTARA_HOME` (set), else `%LOCALAPPDATA%\Syntara` on
Windows, else `XDG_DATA_HOME/syntara` or `~/.local/share/syntara`.

## CLI

The CLI talks to the **same local control/API layer** as the desktop and SDK.
It runs as the installed `syntara` command, or in-tree without installing via
`python -m syntara ...`.

```bash
syntara models list
syntara models get qwen
syntara models search qwen
syntara models run qwen        # confirm the model is served right now

syntara inspect model.gguf     # metadata, quants, size estimate, badges
syntara inspect model.gguf --json

syntara chat                   # interactive (streaming REPL)
syntara chat "ask me anything" # one-shot
syntara chat --model qwen "..."

syntara agents run "<task>"    # or: syntara agent "<task>"
syntara serve
syntara health
syntara profile

syntara project list
syntara project create my-project --description "..."
syntara project get my-project

syntara backup create [--out path]
syntara backup list
syntara backup verify <archive>
syntara backup restore <archive> [--include chats,projects] [--no-merge]
```

Add `--json` anywhere for machine-readable output. Exit codes: `0` success,
`1` runtime/connection or file-format error, `2` usage error or unsupported
verb.

Global flags: `--base-url`, `--api-key`, `--data-dir`, `--json`,
`--version`.

### Inspecting a model file

`syntara inspect <file.gguf>` reads only the GGUF header (key-value metadata
and tensor information) plus bounded slices of the data section, so a
multi-gigabyte model is reported in milliseconds without loading it. It needs
no runtime and makes no network calls. The report includes:

- format (version, alignment), architecture, name, context length;
- tensor count, parameters, bytes per quantization type;
- a rough minimum-RAM estimate (weights × 1.25, documented in the report);
- tokenizer size and chat-template presence;
- compatibility badges that distinguish `ok` / `warn` / `error` for:
  format integrity, data completeness, the Phase-1 dense policy
  (architecture and quantization), runtime support, and chat template.

Badges never overstate: an architecture outside the current policy scope is
reported as `warn` ("not in the approved scope"), not as broken. A truncated
or corrupt file produces a clear structural error on stderr (exit `1`)
naming what failed and where. Use `--json` for the full machine-readable
report (large arrays are summarised, not dumped).

### What the CLI does not do (and why)

Model **download, deletion, benchmarking and optimization** are engine-side
operations (`./syntara bench|tune|convert` on the engine build, or the desktop
Downloads view). The local control/API surface does not expose them, so the
CLI's `models install|remove|benchmark|optimize` verbs exit `2` with a pointer
to the right tool instead of pretending a backend exists.

## Tests

The suite is stdlib-only and needs no runtime or network:

```bash
py -m unittest discover -s syntara/tests -t . -v
```

`mock_gateway.py` is a mini implementation of the gateway endpoints used by
the SDK/CLI tests.