# Syntara spec coverage matrix

Coverage status for the two product specs evaluated against this source tree:

- `# Syntara — The Upgraded Colibrì.txt` (the 265-item feature checklist), and
- `# SYN TARA.txt` (the phased product/engineering plan).

Columns:

- **Status — ✅ Verified implemented**: behavior exists and was exercised in this
  environment.
- **Status — 🟡 Implemented, gated**: behavior exists but requires the native
  engine/desktop layer or a specific backend; the label is honest (no
  simulation).
- **Status — 🔴 Extension point**: intentionally not represented as finished;
  documented as an architecture/extension boundary.

Rows group the specs' feature areas; they do not claim per-item line numbers
(the source checklists are working documents, not pinned in this tree). Each
row names the concrete files that own the behavior.

## Model Hub and model management

| Feature | Status | Where |
| --- | --- | --- |
| Model catalog / hub list with real served models | ✅ | `web/src/App.tsx` (Models view), `syntara/client.py` `_Models` |
| Model cards: id, quant tag, context metadata | ✅ | `web/src/App.tsx` |
| Model get by id, structured 404 `model_not_found` | ✅ | `syntara/client.py` `_Models.get` |
| Install → streaming download to a user-picked file | ✅ | `web/src/App.tsx` (File System Access + bounded fallback) |
| Resumable downloads over HTTP Range (206 continue / 200 restart) | ✅ | `web/src/App.tsx` |
| Download progress, speed (MB/s) and ETA | ✅ | `web/src/App.tsx` (this iteration) |
| Cancel download; cancel releases the file handle | ✅ | `web/src/App.tsx` |
| Model removal (desktop/engine-gated) | 🟡 | CLI delegates via `SYNTARA_ENGINE` → engine `remove` (`syntara/cli.py`) |
| Import existing local model files (drag-and-drop / picker) | ✅ | `web/src/App.tsx` |
| Group-aware completion (shard siblings installed together; partial groups stay downloading) | ✅ | `web/src/App.tsx` (`onCompleted`), `web/src/lib/inspect.ts` (`groupComplete`, `pickInspectTarget`) |
| Auto-inspect after install → real arch/params/tokens/quant/ctx/RAM on the card | ✅ | `web/src/lib/inspect.ts` (`metaFromInspect`), `desktop/src-tauri/src/library.rs` (`library_inspect` → `syntara library add` / `syntara inspect`) |
| Partial/truncated model verdict (`partial` status, refusal reason, load blocked) | ✅ | `web/src/lib/inspect.ts`, `web/src/App.tsx` (Load guard), contract + e2e tests |
| Verdict badge chips on model cards | ✅ | `web/src/App.tsx`, `web/src/index.css` (`.inspect-badge`) |
| One-click load with health-poll progress (card + Installed tab) | ✅ | `web/src/lib/host-bridge.ts` (`waitHostReady`), `web/src/App.tsx` (`loadModel`) |
| Legacy local entries repaired once per session (badge backfill) | ✅ | `web/src/App.tsx` (auto-inspect effect) |
| Universal conversion/quantization, every-safetensors architecture | 🔴 | `docs/`, engine (`docs/tuning.md`) — native toolchain + weights required |
| Download queue / bandwidth scheduling | 🔴 | Architecture/extension point |

## Chat

| Feature | Status | Where |
| --- | --- | --- |
| Streaming chat over SSE with live token output | ✅ | `web/src/App.tsx`, `syntara/client.py` `stream_chat` |
| Stop generation (real abort of in-flight stream) | ✅ | `web/src/App.tsx` (composer stop button) |
| Per-conversation system prompt + KV cache slot | ✅ | `web/src/App.tsx` (Setup panel) |
| Markdown rendering, incl. LaTeX (`$…$`, `$$…$$`) via KaTeX | ✅ | `web/src/components/Markdown.tsx` (this iteration) |
| Copy / regenerate / edit-and-resend per message | ✅ | `web/src/App.tsx` |
| Attach documents into the prompt (text docs + images) | ✅ | `web/src/App.tsx` (this iteration) |
| Searchable conversation list, Ctrl/Cmd+K focus | ✅ | `web/src/App.tsx` (this iteration) |
| Conversation export (JSON, incl. attachments) | ✅ | `web/src/App.tsx` |
| Modalities beyond text/image | 🔴 | Extension point |

## Memory and persistence

| Feature | Status | Where |
| --- | --- | --- |
| Persistent memories (list/add/edit/delete/enable/disable) | ✅ | `web/src/App.tsx`, `syntara/store.py`, `syntara/client.py` `_Memories` (this iteration) |
| Memory injection into chat context when enabled | ✅ | `web/src/App.tsx` |
| Memory search filter | ✅ | `web/src/App.tsx` (this iteration) |
| Memory import (JSON) with feedback | ✅ | `web/src/App.tsx` (this iteration) |
| Semantic/embedding-backed memory retrieval | 🔴 | Extension point (embeddings not shipped) |

## Projects, backups, settings

| Feature | Status | Where |
| --- | --- | --- |
| Local projects CRUD | ✅ | `syntara/store.py`, `syntara/client.py` `_Projects`, CLI `project` |
| Offline `.syntara-backup` create/list/verify/restore, selective restore, zip path-traversal guards | ✅ | `syntara/store.py`, CLI `backup`, tests |
| Settings that never persist credentials | ✅ | `syntara/store.py`, `syntara/tests/test_store.py` |
| Workspace reset with confirmation | ✅ | `web/src/App.tsx` (Advanced panel) |
| Remote/cloud database | 🔴 | Deliberately absent (local-first) |

## Agents

| Feature | Status | Where |
| --- | --- | --- |
| Local agent loop with OpenAI-style tool calls | ✅ | `syntara/client.py` `_Agents`, CLI `agents run`/`agent` |
| Bound local handlers; unbound tool → honest interruption | ✅ | `syntara/tests/test_agents.py` |
| Plan + permission gate UI | ✅ | `web/src/App.tsx` (Agents view) |
| Sandboxed file/shell/browser tools | 🟡 | Desktop/engine-gated; labeled, not faked |

## Local API and developer surface

| Feature | Status | Where |
| --- | --- | --- |
| OpenAI-compatible `/v1` (chat/completions, streaming, completions, messages, models, brio) | ✅ | mock gateway + `syntara/client.py`, `web/src/lib/runtime.ts` |
| Auth optional, disabled by default; localhost-only bind | ✅ | `syntara/client.py` `_headers`/`api_key` |
| SDK env overrides (`SYNTARA_BASE_URL`, `SYNTARA_API_KEY`), explicit args win | ✅ | `syntara/client.py` (this iteration) |
| Structured errors (status + code + body) | ✅ | `syntara/client.py` `SyntaraError` |
| CLI: models/chat/agents/serve/health/profile/project/backup, `--json`, stable exit codes | ✅ | `syntara/cli.py`, tests |
| CLI engine delegation (`SYNTARA_ENGINE`, no PATH guessing to avoid recursion) | ✅ | `syntara/cli.py` (this iteration), tests |

## Integrations

| Feature | Status | Where |
| --- | --- | --- |
| n8n sample workflow with escaped JSON body expression | ✅ | `integrations/n8n/syntara-chat.json` (this iteration) |
| VS Code extension: Open Chat / Send / Explain | ✅ | `integrations/vscode/extension.js` |
| VS Code `syntara.webUrl` config declared in `contributes.configuration` | ✅ | `integrations/vscode/package.json` (this iteration) |
| Cursor/IDE documentation | ✅ | `integrations/cursor/README.md` |

## Website

| Feature | Status | Where |
| --- | --- | --- |
| Premium no-auth landing page | ✅ | `site/src/App.tsx` + `site/src/components/*` (React + Vite rebuild) |
| Download links resolved to real release assets + size tags | ✅ | `site/src/lib/releases.ts`, `site/src/components/DownloadBox.tsx`; naming contract matches `.github/workflows/release.yml` |
| Downloads JS hardened (guards, no clobber of architecture labels) | ✅ | `site/src/lib/releases.ts` (typed guard fetch; arch labels are constants) |
| Honest install guide (real `syntara.cmd` ships, restored from upstream) | ✅ | `site/src/components/Install.tsx`; `c/syntara.cmd` (audit 0.4.3) |
| Suit-theme UI (Syntra Suit image, Orbitron/Chakra Petch/Share Tech Mono) | ✅ | `site/src/index.css`, `site/public/syntara-suit.png`, `web/src/index.css` (CSS-only app skin) |

## Native engine, hardware backends, desktop packaging

| Feature | Status | Where |
| --- | --- | --- |
| Engine launcher contract (`install/remove/bench/tune/convert/plan/serve/chat`) | ✅ | `c/syntara` (Python CLI, 74 defs) restored from the upstream reference-tree launcher via the rename mapping; `engine_for`/`model_arch`/`_EXE` all present; 71 c/ launcher+CLI tests pass (audit 0.4.3) |
| Release/Docker `syntara` launcher contract | ✅ | `release.yml` verify + `Dockerfile.slim` treat `c/syntara` as a Python CLI; restored launcher satisfies them; the GLM engine is name-split (`syntara.exe` on Windows / `glm` on POSIX) so a build can never clobber the launcher path (audit 0.4.3) |
| C build target | 🟡 | Compilable per docs; no gcc/toolchain available here to re-verify |
| GPU backends (CUDA/Metal/Vulkan/ROCm/DirectML) + auto-routing | 🔴 | Docs + capability layer; verification requires real hardware |
| Planner-driven launch: plan → env injection for all 9 engines; RAM-clamped context reaches the family's own context variable; generic CUDA protocol mirrored to family switches (Kimi `K3_CUDA`/`K3_VK`, V4 `DSV4_CUDA`) | ✅ | `c/resource_plan.py` (`environment_for_plan`), `c/syntara` (`mirror_family_gpu_env`), tests in `test_resource_plan`/`test_env_defaults` |
| Launch honesty: unapplied VRAM tier and applied context clamp are announced at launch; silent when nothing diverged or a user value won | ✅ | `c/syntara` (`report_unapplied_vram_tier`, `report_clamped_context`), `tests/test_auto_tier_vram_notice.py` |
| Gateway runtime status: authed `/health` reports engine identity + the settings the child env actually carries (null, never the plan's printed intention) | ✅ | `c/openai_server.py` (`runtime_status`), `tests/test_openai_server.py` (auth-gated, #SEC-8) |
| Standard runtime (GGUF-dense, strategy `standard`): pinned llama.cpp subprocess adapter verified end-to-end against real weights (Qwen2.5-3B Q4_K_M, 2.1 GB): health/models/non-stream chat/SSE/stop, usage counters real | ✅ | `syntara/runtime/llama_cpp.py`; opt-in smoke + ledger entry (audit 1g) |
| Backend never outlives its host: hard-killed gateway still terminates `llama-server` (Windows kill-on-close job object, struct size verified against `winnt.h`, graceful fallback when assignment is refused) | ✅ | `syntara/runtime/process.py` (`bind_lifetime_to_parent`), `syntara/tests/test_process.py` (4 tests) |
| OOM-class retry with a strictly lighter plan: exactly one respawn (halved family context env, floor 512, and/or halved cap) after an OOM-class load/startup death; defective checkpoints and unclassified deaths keep the original error | ✅ | `c/syntara` (`oom_class_failed`/`lighter_plan` in the GLM chat, non-glm server-spawn and `serve` paths), `c/openai_server.py` (`EngineExit.rc`), `c/tests/test_oom_retry.py` (16 tests incl. a real `cmd_chat` child) |
| Memory guard + idle unload + crash isolation (host): impossible loads refused before spawn; `SYNTARA_IDLE_UNLOAD_S` warm-keep with on-demand reload; supervisor survives its own exceptions | ✅ | `syntara/gateway.py`, `syntara/tests/test_resilience.py` (10 tests) |
| First-run calibration: one short local turn measures tokens/s per model, cached, surfaced as `calibration` in `GET /profile`; `SYNTARA_CALIBRATE=0` skips | ✅ | `syntara/calibrate.py`, `syntara/tests/test_calibrate.py` (10 tests) |
| Tauri desktop shell (tray) | 🟡 | `desktop/src-tauri/`; `tauri` now opts into defaults + `tray-icon` (audit 0.4.2) because `lib.rs` uses `tauri::tray`; `cargo check` + `cargo fmt` run in the CI desktop job, release packaging needs Rust/Cargo |
| Desktop CI (cargo fmt + cargo check) | ✅ | `.github/workflows/ci.yml` desktop job (this iteration) |
| Launcher-contract enforcement (c/syntara is Python, never an engine ELF) | ✅ | `c/tools/check_launcher_contract.py` (OK on the restored launcher), ci.yml `launcher-contract` job, `make check-launcher`, Docker ast gate (audit 0.4.2/0.4.3) |
| Desktop installers, autostart, signed updater with rollback | 🔴 | `.github/workflows/release.yml` lane exists; not runnable locally |
| Native resumable large-file downloader on all desktop OSes | 🟡 | Web downloader verified; native path is engine-side (desktop-gated) |

## Cross-cutting

| Feature | Status | Where |
| --- | --- | --- |
| Zero-account core, offline-first, local-first | ✅ | No auth anywhere; all persistence local |
| Light/dark/system themes, reduced motion | ✅ | `web/src/index.css` |
| Keyboard navigation, focus-visible, aria-labels | ✅ | `web/src/App.tsx`, `web/src/index.css` (this iteration) |
| Strict error handling, no swallowed failures | ✅ | `syntara/client.py`, tests incl. failure paths |
| No model binaries / generated artifacts committed | ✅ | `audit10.py` pass 7 |

## Not verified locally (no toolchain/hardware) — read as 🔴 until proven

Native C engine build/run, Tauri release packaging, and every GPU backend
production path. These are documented in `IMPLEMENTATION_AUDIT.md` as
extension points, and are the only rows where implementation status cannot be
proven in this environment.