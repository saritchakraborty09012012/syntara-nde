# Syntara

![Syntara](assets/syntara-logo.png)

[![CI](https://github.com/saritchakraborty09012012/syntara-nde/actions/workflows/ci.yml/badge.svg)](https://github.com/saritchakraborty09012012/syntara-nde/actions/workflows/ci.yml)
[![check](https://github.com/saritchakraborty09012012/syntara-nde/actions/workflows/check.yml/badge.svg)](https://github.com/saritchakraborty09012012/syntara-nde/actions/workflows/check.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

**The Universal Local AI Runtime by NDe: NoirDemons.**

Syntara brings model discovery, import, compatibility analysis, preparation, hardware-aware execution, local Chat, Agent workflows, persistent memory, backups, developer APIs and cross-platform desktop UX into one zero-auth product.

Your models run on your device. Syntara orchestrates, optimizes, exposes and manages them — it does not host your inference in a cloud service.

- **Zero account** — no login, signup, activation or cloud identity for core local use.
- **Offline-first** — once software and models are on disk, inference needs no network.
- **Capability-based** — hardware is detected by what it can do, not by marketing names; CPU fallback always exists.
- **Honest** — unsupported endpoints, degraded backends and missing capabilities are reported as such, not hidden.

## Contents

- [Download](#download)
- [Quick start](#quick-start)
- [What you get](#what-you-get)
- [Product architecture](#product-architecture)
- [Supported model families](#supported-model-families)
- [Engine suite and runtime routing](#engine-suite-and-runtime-routing)
- [Model preparation and selective-SSD placement](#model-preparation-and-selective-ssd-placement)
- [Hardware profiler and planner](#hardware-profiler-and-planner)
- [Local API](#local-api)
- [Python SDK](#python-sdk)
- [Developer CLI](#developer-cli)
- [Desktop, web and integrations](#desktop-web-and-integrations)
- [Build from source](#build-from-source)
- [Repository layout](#repository-layout)
- [Testing](#testing)
- [Configuration](#configuration)
- [Data, offline behaviour and backups](#data-offline-behaviour-and-backups)
- [No account philosophy](#no-account-philosophy)
- [Security](#security)
- [Troubleshooting](#troubleshooting)
- [Documentation](#documentation)
- [Development](#development)
- [Legal and attribution](#legal-and-attribution)

## Download

The product website is designed to put downloads first:

- Windows
- macOS
- Linux
- additional builds as they are released

Prebuilt engine archives are published on the
[Releases page](https://github.com/saritchakraborty09012012/syntara-nde/releases):
unpack one, install [Python 3](https://www.python.org/downloads/), and the `syntara`
launcher finds the engine next to itself — no compiler, no renaming, no
configuration. No Syntara account is required.

> **ARM64 Linux note:** the published Linux archive is x86_64 only. On Graviton,
> Ampere, Raspberry Pi or an aarch64 VM, build from source — the engine is
> portable C with OpenMP and needs no ARM-specific flags.

## Quick start

```bash
git clone https://github.com/saritchakraborty09012012/syntara-nde.git
cd syntara/c && ./setup.sh        # checks compiler + OpenMP, builds, self-tests

SYNTARA_MODEL=/path/to/model ./syntara chat
```

Useful first commands:

```bash
SYNTARA_MODEL=/path/to/model ./syntara doctor   # what is missing and how to fix it
SYNTARA_MODEL=/path/to/model ./syntara plan     # where the model will live (RAM/disk/GPU)
SYNTARA_MODEL=/path/to/model ./syntara serve    # local OpenAI-compatible API
```

A GPU is optional — the engine runs CPU-only by default. Full platform-by-platform
prerequisites (Linux packages, MSYS2/UCRT64, macOS Homebrew) and model-acquisition
paths (pre-converted container vs. `./syntara convert`) are in
[`docs/quickstart.md`](docs/quickstart.md).

## What you get

- **Chat Mode** — local conversations with streaming output, grammar constraints and isolated KV contexts.
- **Agent Mode** — a local tool loop with per-project permission gates (file writes and process runs always ask; `always` grants are stored per project).
- **OpenAI-compatible local API** — `/v1/chat/completions`, streaming, tool-calling where the family supports it, plus an Anthropic-protocol `/v1/messages` endpoint for coding CLIs and editors.
- **Python SDK and developer CLI** — chat, models, health, telemetry, projects, backups and agent loops from your own scripts.
- **Model Hub and download manager** — HF-verified catalog with honest gated/missing flags and a stdlib verification gate; seamless transfers through Quantum Download Manager.
- **Projects and persistent local memory** — conversations, notes and context stay on disk, per project.
- **Local backup / import / restore** — full-fidelity local archives, no cloud dependency.
- **Desktop shell** — Windows, macOS, Linux and ChromeOS (via the Linux container); Light / Dark / System modes; the shell auto-starts the local host on loopback.
- **n8n / VS Code / Cursor integration surface** — automation and editors connect to the same local endpoint.

## Product architecture

```text
Syntara
  ↓
Chat · Agents · API · SDK · CLI · n8n
  ↓
Control Plane
  ├─ Model Hub
  ├─ Model Manager
  ├─ Download Manager
  ├─ Projects
  ├─ Local Memory
  └─ Backup / Restore
  ↓
Universal Model Layer
  ├─ Model inspection (formats, tensors, quantization)
  ├─ Preparation pipeline (inspect → analyze → validate → convert)
  └─ Selective-SSD placement
  ↓
Runtime Router (capability-based, ranked)
  ├─ C engine suite (10 families, GGUF kept working)
  ├─ llama.cpp backend
  ├─ Transformers CPU fallback
  └─ Diffusion / image-gen backend
  ↓
Hardware Profiler + Planner (RAM · VRAM · CPU · GPU · SSD tiers)
  ↓
CPU · GPU · RAM · VRAM · SSD
```

Dependency direction stays `UI / SDK / API → application layer → core → runtime
adapter`. The core never depends on a specific UI, integration or website.

## Supported model families

Ten model families are registered with the engine, each with its own planner, memory model and quantization path:

- **GLM-5.2/5.3** (744B MoE) and **GLM-5.3-Flash** (321B, vision)
- **Inkling** (975B)
- **Kimi K3** (2.8T)
- **DeepSeek V4 Flash** (284B) and **DeepSeek V4.1 Flash** (552B, vision)
- **Qwen3.8-Flash-Next** (125B + 51B n-gram)
- **Qwen3.6** (35B-A3B)
- **OLMoE** (7B)
- **Llama** (dense GQA)

The registry lives in `c/family_registry.py`; the translated READMEs in this repository describe the same ten families in their own language. GGUF artifacts that do not match a registered family still run through the llama.cpp path.

## Engine suite and runtime routing

Syntara ships a suite of native C engines — one per registered family — behind a single launcher. GGUF models keep working through the llama.cpp path; anything the engine suite cannot claim falls through a ranked, capability-based router rather than failing outright:

1. **C engine suite** — best path when the local artifact matches a registered family (fastest, lowest overhead, no Python runtime needed).
2. **llama.cpp** — GGUF and llama.cpp-compatible artifacts.
3. **Transformers (CPU)** — generic Safetensors/transformer checkpoints when no engine claims them; honest about being the fallback, not a performance promise.
4. **Diffusion backend** — image-generation models through the same routing surface.

Every candidate is probed for actual availability (binary present, libraries importable, hardware usable) and ranked before selection; the decision and its reasons are observable, not implicit. Runtime selection is reported through telemetry, so a fallback is never mistaken for the path you asked for.

## Model preparation and selective-SSD placement

Loading a raw multi-hundred-gigabyte checkpoint is not a plan. Syntara's preparation pipeline runs before first execution:

- **Inspect** — parse safetensors/GGUF headers, tensor shapes, dtypes and quantization without reading whole files into memory.
- **Analyze** — match tensors to a known family, estimate memory and compute needs.
- **Validate** — reject incompatible or corrupt artifacts early with actionable errors.
- **Convert** — route to the right conversion/quantization tool (int4 rANS, FP8→int4, family-specific paths) with resumable, cancellable progress.
- **Selective-SSD placement** — decide what stays on fast local NVMe, what can live on a slower tier and what must be resident in RAM/VRAM, based on the hardware profile.

Originals are preserved; conversions never silently replace the user's files.

## Hardware profiler and planner

Syntara detects capabilities, not marketing names:

- CPU cores/threads and instruction-set features
- GPU backends where present (CUDA, Vulkan, Metal, DirectML)
- System RAM, VRAM and shared GPU memory
- Storage tiers and free space

The planner turns that profile plus the model's actual metadata into a ranked execution plan (resident layers, KV budget, offload tiers, context limits). If an accelerator is absent, Syntara explains and falls back to CPU rather than crashing. When memory is genuinely insufficient, the gateway constrains the posture (reduced context/offload) instead of refusing an impossible load outright.

## Local API

`syntara serve` keeps one model process loaded and exposes a text-only
OpenAI-compatible HTTP API on loopback. The gateway uses only the Python
standard library; inference runs in the same dependency-free C engine.

```bash
cd c
SYNTARA_MODEL=/nvme/glm52_i4 SYNTARA_API_KEY=local-secret ./syntara serve \
  --host 127.0.0.1 --port 8000 --model-id glm-5.2-syntara

curl http://127.0.0.1:8000/v1/chat/completions \
  -H 'Authorization: Bearer local-secret' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "glm-5.2-syntara",
    "messages": [{"role": "user", "content": "Hello"}],
    "stream": true
  }'
```

**Implemented endpoints** — `GET /v1/models`, `GET /v1/models/{model}`,
`POST /v1/chat/completions`, legacy `POST /v1/completions`, plus an
Anthropic-protocol `POST /v1/messages` on the same port so coding CLIs and
editors can point at Syntara without a shim:

```bash
export ANTHROPIC_BASE_URL=http://localhost:8000
```

Chat and completion requests support JSON responses, SSE streaming, usage
counts, `max_tokens`/`max_completion_tokens`, `temperature`, `top_p`, and up to
four custom `stop` sequences. Isolated KV contexts, tool-calling (where the
family supports it), Brio scoring (`POST /v1/brio`) and the web dashboard are
documented in [`docs/api.md`](docs/api.md).

The default bind address is localhost. Binding beyond loopback is an explicit
choice with a visible address and port — Syntara never silently becomes an
internet-facing server.

## Python SDK

```bash
pip install syntara-engine
```

The SDK is a thin, dependency-free wrapper around the local runtime. It only
ever talks to `http://127.0.0.1:<port>/v1` (override with `SYNTARA_BASE_URL`;
`SYNTARA_API_KEY` is sent as a Bearer token when set).

```python
from syntara import Syntara

client = Syntara()

print(client.chat("qwen", "Explain quantum entanglement"))

for frame in client.stream_chat("qwen", "Write a haiku"):
    if frame["delta"]:
        print(frame["delta"], end="")

print(client.models.list())
print(client.health())

client.agents.run("Summarize all open TODOs in this repo", tools={"scan": scan_fn})
client.backups.create(out="/path/to/backup.syntara-backup")
```

Errors raise `SyntaraError` with `.status`, `.code` and `.body` when the runtime
returned a decorated error (for example `model_not_found`). Full reference:
[`docs/sdk-cli.md`](docs/sdk-cli.md).

## Developer CLI

The `syntara` command (`python -m syntara ...` also works) exposes
automation-friendly verbs with stable exit codes — `0` success, non-zero failure,
`130` cancelled (`syntara convert`):

| Group | Commands |
| --- | --- |
| Models | `syntara models list` · `get` · `search` · `run` |
| Inspect | `syntara inspect model.gguf [--json]` |
| Chat / agents | `syntara chat [ "..."]` · `syntara agents run "<task>"` |
| Serve | `syntara serve --model <id-or-path>` |
| Library | `syntara library list` · `add` · `scan` · `get` · `remove` |
| Convert | `syntara convert --repo <dir-or-hf-id> --outdir <fresh-dir>` |
| Projects | `syntara project list` · `create` · `get` |
| Backups | `syntara backup create` · `list` · `verify` · `restore` |
| Diagnostics | `syntara health` · `syntara profile` · `syntara doctor` |

## Desktop, web and integrations

- **`desktop/`** — Tauri desktop shell for Windows, macOS, Linux and ChromeOS
  (via the Linux container). Light / Dark / System theming; the shell
  auto-starts the local host on loopback. Model discovery, download progress,
  runtime selection, hardware information, streaming output, logs, settings and
  API-server control all live here.
- **`web/`** — web dashboard frontend served alongside the local API.
- **`site/`** — public product website with downloads, platform list and
  documentation entry points.
- **`integrations/`** — n8n, VS Code and Cursor material. All of them connect to
  the same stable local endpoint; integration code stays thin and never
  reimplements model loading.

## Build from source

The native core builds with a C11 compiler and `make`; the desktop shell uses
Tauri (Rust); the web dashboard is a Vite build. See `docs/quickstart.md` for the
guided path and `docs/` for per-platform notes (Windows, Metal, CUDA, Vulkan).

```bash
# native engine + launcher
make -C c syntara

# the whole C family suite
make -C c syntara glm53 inkling kimi_k3 olmoe qwen36 qwen38 deepseek_v41 llama_dense

# the repo's own dependency-free gate (clean + portable CPU build + C suites + Python stdlib tests)
make -C c check

# C test suite (unit + oracle fixtures)
make -C c test-c

# Python test suite (routing, planner, SDK, gateway)
make -C c test-python
```

Optional GPU backends are opt-in (`CUDA=1`, `VK=1`, `METAL=1`, `HIP=1`); the CPU
path always remains available. `ARCH=native` unlocks the vector instructions your
specific chip has.

## Repository layout

| Path | Role |
| --- | --- |
| `c/` | Native engine suite, family registry, OpenAI-compatible gateway, segment runtime, tools |
| `syntara/` | Core Python platform: routing, preparation, hardware profiler, planner, SDK client, CLI |
| `desktop/` | Tauri desktop shell |
| `web/` | Web dashboard frontend |
| `site/` | Public product website |
| `integrations/` | n8n, VS Code and Cursor integration material |
| `docker/` | Container definitions for development and optional deployment |
| `docs/` | Architecture, quickstart, per-family notes, API and SDK references |
| `tools/` | Maintenance and fetch scripts |
| `.github/` | CI workflows, issue templates, repository automation |

## Testing

Syntara is gated by tests that assert real behavior, not coverage:

- **C suite** (`make -C c test-c`) — engine unit tests plus token-exact tiny-oracle fixtures per family (a miniature model generated from a pinned script, asserted byte- and token-identical against a NumPy/PyTorch reference).
- **ASan + UBSan** (`make -C c test-asan`) — the same C suite under sanitizers in CI.
- **Segment conformance** — every registered family must ship a KV/state fixture; the count is a compile-time contract, not a comment.
- **Python suite** — routing, preparation pipeline, hardware planner, gateway protocol, SDK client.
- **Cross-platform CI** — Linux, macOS (arm64), Windows (UCRT64), musl/Alpine, ARM, plus Vulkan-on-Lavapipe and CUDA syntax legs.

CI runs with read-only permissions: no job writes to the repository. See
`.github/workflows/` for the exact legs.

## Configuration

Configuration follows a clear precedence: defaults → config file → environment
variables → explicit CLI/API arguments.

Every environment variable is documented in [`docs/ENVIRONMENT.md`](docs/ENVIRONMENT.md),
grouped by the component that reads it. Common ones:

| Variable | Default | Effect |
| --- | --- | --- |
| `SYNTARA_HOME` | `%LOCALAPPDATA%\Syntara` / `XDG_DATA_HOME/syntara` / `~/.local/share/syntara` | Root of the per-user data directory: store, backups, model library index |
| `SYNTARA_MODEL` | unset | Path to the model folder the engine loads |
| `SYNTARA_GATEWAY_KEY` | unset | When set, every gateway request must send `Authorization: Bearer <value>` |
| `SYNTARA_BASE_URL` | `http://127.0.0.1:8000/v1` | SDK/CLI endpoint override |
| `SYNTARA_IDLE_UNLOAD_S` | `0` (keep warm) | Unload the model after this many idle seconds |
| `RAM_GB` | `0` (auto — 88% of free RAM) | RAM budget for the resident/streamed expert working set |
| `KV_SLOTS` | `1` | Independent KV conversation slots in serve mode (1–16) |
| `SEED` | unset (clock + PID) | Fixed value = reproducible sampling |

## Data, offline behaviour and backups

- User data lives under `SYNTARA_HOME` (see table above). Nothing is scattered
  through the repository or the model directories.
- Backups are `.syntara-backup` zip archives with a `manifest.json` plus the
  selected sections (`chats`, `memories`, `projects`, `settings`, optionally
  `models.json` metadata — never model weights). `backup verify` rejects zip
  entries that could escape the target directory.
- `restore` merges by default and can replace with `--no-merge`.
- After models and software are installed, loading a model, generating text, the
  local API, local chat history, configuration and runtime management all work
  with no network.

## No account philosophy

Syntara does not require a Syntara login, signup, activation account or cloud identity. Persistent data is designed to remain on the user's device unless the user explicitly exports or connects another service.

After models and software are installed, core inference works offline. Network use is limited to what you explicitly ask for: model downloads, catalog verification and optional integrations. The local API server binds to loopback by default; exposing it to a LAN is an explicit choice with visible address and port.

## Security

- Subprocesses are launched with argument arrays, never shell string concatenation.
- Downloaded model metadata and archives are treated as untrusted input; archive extraction is guarded against path traversal.
- Local endpoints bind to `127.0.0.1` unless you opt into network access; `SYNTARA_GATEWAY_KEY` adds Bearer auth when set.
- Backups are validated on verify and restore (manifest + path-escape checks).
- No telemetry, prompt uploads or model uploads in the core local path.
- Secrets are never committed; nothing in the repository needs a credential to run local inference.

To report a vulnerability, open a private security advisory or an issue describing impact without posting exploit details publicly.

## Troubleshooting

| Symptom | First move |
| --- | --- |
| Engine exits before printing anything | Install the OpenMP runtime (`libgomp1` on Debian/Ubuntu); `syntara doctor` names the missing library |
| Something is missing (compiler, model files, permissions) | `SYNTARA_MODEL=/path/to/model ./syntara doctor` — read-only, tells you exactly what to fix |
| "Where will this model live?" | `./syntara plan` shows the RAM/disk/GPU placement before you commit |
| Slow generation | Experts stream from disk — a fast NVMe SSD is the biggest factor; `--topp 0.85` reads fewer bytes per token with no quality loss |
| GPU not used | Backends are opt-in (`CUDA=1`, `VK=1`, `METAL=1`, `HIP=1`); the CPU path is the safe default and the router explains its choice |
| Client seems hung against the API | Smoke-test with the `curl` above first; a cold start loads resident weights before the first token |
| Model file registered from a folder fails to run | Re-register with `syntara library scan <directory>` so the path is stored correctly |

Per-platform detail: [`docs/windows.md`](docs/windows.md),
[`docs/cuda.md`](docs/cuda.md), [`docs/vulkan.md`](docs/vulkan.md),
[`docs/metal.md`](docs/metal.md), [`docs/tuning.md`](docs/tuning.md).

## Documentation

- `docs/quickstart.md` — zero to a running model
- `docs/api.md` — OpenAI-compatible API, KV contexts, web UI
- `docs/sdk-cli.md` — Python SDK and developer CLI
- `docs/ENVIRONMENT.md` — every environment variable, documented
- `docs/FORMATS.md` — supported model formats and inspection
- `docs/llama.md` — the Llama dense engine and its no-conversion path
- per-family notes (`docs/glm53-flash.md`, `docs/kimi_k3.md`, `docs/qwen38.md`, `docs/deepseek-v41.md`, …)
- `ARCHITECTURE.md`, `GPU_BACKENDS.md`, `IMPLEMENTATION_AUDIT.md`, `CHANGELOG.md` — architecture, backends, audit history and release notes at the repo root
- translated READMEs — `README.it.md`, `README.zh-CN.md`, `README.zh-TW.md`

## Development

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for repository layout, development setup
and the checks to run before opening a PR. In short:

```bash
make -C c check    # the repo's own gate: clean + portable build + C + Python tests
```

Before declaring work done: confirm the requirement, keep the change in the right
layer, handle errors, consider cross-platform effects, run the relevant checks,
and report honestly what was and was not verified.

The deep inference engine remains a low-level systems component. Universal model compatibility is implemented at the platform layer through format detection, architecture adapters and backend routing rather than by forcing every model into one proprietary format.

## Legal and attribution

Syntara is released under the MIT License (see [`LICENSE`](LICENSE)) and contains
modified third-party code released under its original licenses. The root
`LICENSE`, `NOTICE` and `THIRD_PARTY_NOTICES.md` files are preserved for the
required legal attributions. See `MODIFICATIONS.md` for the Syntara changes in
this distribution.

Version numbers are tracked per component: the desktop shell in
`desktop/src-tauri/tauri.conf.json`, the Python package in `syntara/_version.py`,
and release tags on the Releases page.
