# Syntara

![Syntara](assets/syntara-logo.png)

**syntara v1.12.0 — The Universal Local AI Runtime by NDe: NoirDemons.**

Syntara brings model discovery, import, compatibility analysis, preparation, hardware-aware execution, local Chat, Agent workflows, persistent memory, backups, developer APIs and cross-platform desktop UX into one zero-auth product.

Your models run on your device. Syntara orchestrates, optimizes, exposes and manages them — it does not host your inference in a cloud service.

## Download

The product website is designed to put downloads first:

- Windows
- macOS
- Linux
- additional builds as they are released

No Syntara account is required.

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

The registry lives in `c/family_registry.py`; the translated READMEs in this repository describe the same ten families in their own language.

## Engine suite and runtime routing

Syntara ships a suite of native C engines — one per registered family — behind a single launcher. GGUF models keep working through the llama.cpp path; anything the engine suite cannot claim falls through a ranked, capability-based router rather than failing outright:

1. **C engine suite** — best path when the local artifact matches a registered family (fastest, lowest overhead, no Python runtime needed).
2. **llama.cpp** — GGUF and llama.cpp-compatible artifacts.
3. **Transformers (CPU)** — generic Safetensors/transformer checkpoints when no engine claims them; honest about being the fallback, not a performance promise.
4. **Diffusion backend** — image-generation models through the same routing surface.

Every candidate is probed for actual availability (binary present, libraries importable, hardware usable) and ranked before selection; the decision and its reasons are observable, not implicit.

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

The planner turns that profile plus the model's actual metadata into a ranked execution plan (resident layers, KV budget, offload tiers, context limits). If an accelerator is absent, Syntara explains and falls back to CPU rather than crashing.

## Build from source

The native core builds with a C11 compiler and `make`; the desktop shell uses Tauri (Rust); the web dashboard is a Vite build. See `docs/quickstart.md` for the guided path and `docs/` for per-platform notes (Windows, Metal, CUDA, Vulkan).

```bash
# native engine + launcher
make -C c syntara

# the whole C family suite
make -C c syntara glm53 inkling kimi_k3 olmoe qwen36 qwen38 deepseek_v41 llama_dense

# C test suite (unit + oracle fixtures)
make -C c test-c

# Python test suite (routing, planner, SDK, gateway)
make -C c test-python
```

Optional GPU backends are opt-in (`CUDA=1`, `VK=1`, `METAL=1`, `HIP=1`); the CPU path always remains available.

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

## Testing

Syntara is gated by tests that assert real behavior, not coverage:

- **C suite** (`make -C c test-c`) — engine unit tests plus token-exact tiny-oracle fixtures per family (a miniature model generated from a pinned script, asserted byte- and token-identical against a NumPy/PyTorch reference).
- **ASan + UBSan** (`make -C c test-asan`) — the same C suite under sanitizers in CI.
- **Segment conformance** — every registered family must ship a KV/state fixture; the count is a compile-time contract, not a comment.
- **Python suite** — routing, preparation pipeline, hardware planner, gateway protocol, SDK client.
- **Cross-platform CI** — Linux, macOS (arm64), Windows (UCRT64), musl/Alpine, ARM, plus Vulkan-on-Lavapipe and CUDA syntax legs.

## No account philosophy

Syntara does not require a Syntara login, signup, activation account or cloud identity. Persistent data is designed to remain on the user's device unless the user explicitly exports or connects another service.

After models and software are installed, core inference works offline. Network use is limited to what you explicitly ask for: model downloads, catalog verification and optional integrations. The local API server binds to loopback by default; exposing it to a LAN is an explicit choice with visible address and port.

## Security

- Subprocesses are launched with argument arrays, never shell string concatenation.
- Downloaded model metadata and archives are treated as untrusted input; archive extraction is guarded against path traversal.
- Local endpoints bind to `127.0.0.1` unless you opt into network access.
- No telemetry, prompt uploads or model uploads in the core local path.

## Documentation

- `docs/quickstart.md` — zero to a running model
- `docs/api.md` — OpenAI-compatible API, KV contexts, web UI
- `docs/sdk-cli.md` — Python SDK and developer CLI
- `docs/ENVIRONMENT.md` — every environment variable, documented
- `docs/llama.md` — the Llama dense engine and its no-conversion path
- per-family notes (`docs/glm53-flash.md`, `docs/kimi_k3.md`, `docs/qwen38.md`, `docs/deepseek-v41.md`, …)

## Development

The repository contains the native execution core, desktop application, web UI, model management layer, Python SDK, CLI and integration material.

The deep inference engine remains a low-level systems component. Universal model compatibility is implemented at the platform layer through format detection, architecture adapters and backend routing rather than by forcing every model into one proprietary format.

## Legal and attribution

Syntara contains modified third-party code released under its original licenses. The root `LICENSE`, `NOTICE` and `THIRD_PARTY_NOTICES.md` files are preserved for the required legal attributions. See `MODIFICATIONS.md` for the Syntara changes in this distribution.
