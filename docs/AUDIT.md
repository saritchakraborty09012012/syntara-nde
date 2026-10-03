# Syntara — Phase 0 baseline audit

**Status:** Phase 0 complete. This document records what the repository
actually does today, the brand-name purge that shipped with it, the licence
position, and the approved phase plan (0 → 5). Everything below marked
*verified* was checked against the tree in this pass; everything else is
explicitly labelled.

Scope: the Syntara product tree (this repository, branch `main`). The read-only
reference material used during the audit lives in `_reference/` (git-ignored,
excluded from all shipped scans).

---

## 1. Brand-name purge

Four third-party brand tokens must not appear anywhere in the shipped tree
case-insensitively — including binaries, bundle output and file names:

    engine reference · model-server reference · chat-UI reference · agent reference
    (exact identities are recorded only in THIRD_PARTY_NOTICES.md)

### Gate

| Piece | Location | Behaviour |
|---|---|---|
| Scanner | `tools/check_names.py` | Regexes with word boundaries over every file (text + ASCII/UTF-16LE byte sequences), plus file/folder names; exit 1 on any hit |
| Allowlist | `tools/name_check_allowlist.txt` | Literal external identifiers that cannot be renamed (third-party model-repository ids), each with a justification |
| Tests | `syntara/tests/test_name_purge.py` | Gate stays green; planted violations in all three forms are caught; allowlist works and cannot mask a sibling hit on the same (minified) line |
| CI | `.github/workflows/check.yml` → `name-purge` job | Runs scanner + tests on every push/PR |

### Documented carve-outs (exact, narrow)

1. **Licence files** — `NOTICE`, `LICENSE`, `THIRD_PARTY_NOTICES*` at any
   depth: legally required copyright and branding text lives there and
   nowhere else.
2. **`tools/name_check_allowlist.txt`** — external Hugging Face repository
   ids that contain a banned token; the model files only exist under those
   exact names, so download URLs keep the literal.

### Result (this pass)

- **1007 files scanned, 0 violations** (local run over the whole tree,
  including the git-ignored `web/dist` and `site/dist` bundles).
- 145 violations found and purged in 100 files, including: the legacy
  catalogue family key (renamed `inkling-int4-local`,
  `web/src/lib/model-catalog.ts:11326`, `syntara-state.ts:276`,
  `model-catalog.test.ts:27`), benchmark/reference prose in
  `docs/qwen36-cuda-tier.md` (now "the reference runtime"), engine comments
  that named a client (`c/deepseek_v4.c`, `c/openai_server.py`,
  `c/tests/test_gemm_largebatch.mm` → "agent"), and restore-history prose in
  `CHANGELOG.md` / `IMPLEMENTATION_AUDIT.md`.
- Both bundles were rebuilt from the purged sources (`npm run build` in
  `web/` and `site/`, exit 0).
- The source of the scanner deliberately contains no contiguous banned token
  (patterns are assembled from fragments), so the gate never flags itself.

---

## 2. Licence position

| Component | Licence | Record |
|---|---|---|
| Engine (`c/`, derived from the upstream reference source) | Apache-2.0 | `NOTICE` carries the upstream attribution and Apache-2.0 text |
| ds4 / ggml router adaptation | MIT | `THIRD_PARTY_NOTICES.md` |
| QDM download engine (desktop) | MIT | `THIRD_PARTY_NOTICES.md` + deviations in `MODIFICATIONS.md` |
| DeepGEMM/CUTLASS headers (fetched, not vendored) | MIT / BSD-3 | `THIRD_PARTY_NOTICES.md` |
| Model-server reference (consulted only) | MIT | `THIRD_PARTY_NOTICES.md` — no code copied |
| Agent reference (consulted only) | MIT | `THIRD_PARTY_NOTICES.md` — no code copied |
| Chat-UI reference (consulted only) | BSD-3 **+ branding terms** | `THIRD_PARTY_NOTICES.md` — **RESTRICTIVE: zero code copied by policy**, patterns only |

---

## 3. Verified findings (the gap the phases must close)

Syntara's mission is one seamless product (chat + agent) over models running
locally. Today's tree contains the pieces, but they are not wired into one
product:

1. **Nothing starts the engine.** Verified: the desktop Rust layer spawns
   only download-engine tasks (`desktop/src-tauri/src/qdm/engine.rs` — all
   `spawn` sites are queue/segment work); there is no `Command::new`/sidecar
   path that launches the inference engine or the local API server, and the
   web app has no server-start call. The UI talks to a gateway URL it assumes
   already exists (`state.settings.baseUrl`).
2. **The download catalogue is remote-safetensors only.** Verified: every
   catalogue file entry is an HTTP `.safetensors` URL; GGUF appears only in
   FAQ copy and in local-import filename sniffing
   (`web/src/App.tsx` import branch labels the model *"Compatibility
   analysis pending"* — there is no real inspection step).
3. **Engine family support is a fixed list.** Verified:
   `c/family_registry.py` gates which architectures the engine accepts;
   nothing in the app registers or badges new families dynamically.
4. **Agent mode is a façade.** Verified: `runAgent`
   (`web/src/App.tsx:833`) sends one `streamChat` request (system prompt +
   user text) and renders the stream; there is no tool-execution loop, no
   permission model, and the UI itself says file/shell/git tools "stay gated
   to the desktop runtime".
5. **Health/lifecycle states are assumed, not observed.** The API-server
   lifecycle states (stopped/starting/ready/degraded/…) required by
   `AGENTS.md` §74 have no producer in the tree (follows from 1; not further
   instrumented in this pass).

Non-findings worth recording: the web app builds clean (`tsc -b`), 72/72
vitest tests pass after the family rename, and the Python SDK
(`syntara/`) is stdlib-only with a mock-gateway test suite.

---

## 4. Approved decisions (Phase 0 plan input)

- **Naming scheme:** `engine` (C binaries) · `host` (gateway/library/
  scheduler) · `library` · `runtime` strategies `streaming` | `standard` ·
  `agent` · `mode` (Chat|Agent) · `SYNTARA_*` env vars.
- **Generic runtime scope:** "GGUF-dense first" — mainstream dense
  architectures (Llama/Qwen2/Mistral/Gemma), quants Q8_0/F16/Q6_K/Q5_K/Q4_K.
  GGUF-MoE and foreign safetensors architectures stay honestly badged and
  come later; a format must never be silently dropped.
- **Host:** embed CPython — the desktop shell spawns a hidden `pythonw.exe`
  that runs the Python host; no cloud, no account, offline-first.
- **Packaging-first check (user adjustment):** before building the rest of
  the host, **first verify on Windows that an embedded CPython + `pyinstaller`
  (or equivalent) bundle actually runs** — this de-risks the whole host track
  and is the first task of Phase 1.
- **Honesty rule (user adjustment):** anything not actually executed is
  reported "not run". No invented test/build claims anywhere — in docs, PRs
  or this audit.
- **Tests:** synthetic fixtures by default; optional opt-in real-model smoke
  tests against a cached model (network allowed only there).
- **QDM keeps its name** (MIT port, already recorded).

---

## 5. Phase plan (exit criteria per phase)

Tracks 1a–1i are the approved plan order; "done" rows cite the commit that
delivered them. Earlier commits used interim labels (host work landed as
"Phase 1b/1c"); the mapping is recorded here so the history stays readable.

| Phase | Deliverable | Status / Exit criterion |
|---|---|---|
| **0 — Audit & gate** (this doc) | audit docs, name gate + tests + CI, licence records, purge | **done `f028c30`** — gate green locally and tests pass |
| **1 — Adaptive Engine** | see track table below | a local GGUF file can be inspected, loaded and streamed through the host on Windows, via a packaged build |
| **2 — Chat mode** | rewire to host API; picker = local models only + badges, no key fields; resume/queue/throttled-markdown lessons; no workspace concept in chat | **done `58e4cf5`** — tracks 2a–2e below; exit criterion met: `tools/chat_e2e.py` drives the packaged host end-to-end (9/9, loopback-only), web build exit 0, web tests 120/120 |
| **3 — Mode toggle** | single `Chat \| Agent` toggle replacing workspaces; per-mode history, shared picker, no reload, existing theme tokens | **done `ad13103`** — sidebar segmented tablist (`role="tab"`/`aria-selected`/roving tabindex/arrow keys) where the workspace switcher sat; modes are ordinary hash views (`#chat`, `#agents`) so switching never remounts or reloads the app and each mode keeps its history in App state (conversations vs. run log); shared `ModelPicker` now heads both panels; `VIEW_LABELS` is the single wording source for menu/eyebrow/document title; Alt+1…2 jump to the modes; exit criterion met by build exit 0 + **125/125** web tests incl. a server-rendered App-shell test asserting the toggle and panel wiring |
| **4 — Agent mode** | see track table below: TS loop (`web/src/lib/agent/`), tools as Tauri commands, permission system (once/always/deny, per-project), local-model tool-call layer (schema-constrained JSON + repair), tool cards/diffs/todo UI | tracks 4a–4c below; exit criterion: agent tools run and are gated; parser/repair/compaction unit tests + integration test vs mock gateway |
| **5 — Polish & hardening** | startup/memory/shutdown hygiene, child-process cleanup, in-app logs, first-run hardware scan → starter-model suggestion, final name-purge + full test matrix + production builds, docs/README sync | checklist from `AGENTS.md` §115 satisfied |

### Phase 1 tracks

| Track | Deliverable | Status |
|---|---|---|
| 1a Inspector | GGUF/safetensors/sharded inspection without loading weights; arch, params, GQA/MQA, MoE, tokenizer, ctx, quant, chat template, tool-calling | **done `64b8469`** — GGUF header path only (`syntara/gguf_inspect.py`, `syntara inspect`); safetensors/sharded detection still open (badged, not claimed) |
| 1b Profiler | `doctor.py` extended: ISA, RAM, GPU/VRAM, quick disk bench, battery; cached + pressure re-profile | **done `4758980`** — `c/doctor.py` hardware profile: ISA via Windows API/sysctl/proc-cpuinfo/arm64-baseline, installed+available RAM, GPU summary, battery/AC, bounded 16 MB disk bench; 7-day cache at `syntara/profile.json`, refreshed under memory pressure (<15% free) or `--reprofile`; `hardware` block in report JSON + text; 65/65 tests |
| 1c Planner | `resource_plan.py` extended: strategy, quant, offload, KV quant, ctx clamp, threads/batch, predicted mem + tok/s, human summary | **done `d4ffc11`** — `build_plan` now returns `execution` (cpu-resident/gpu-offload/hybrid + offload bytes + reason), `context` (requested/granted/clamped with halving clamp that keeps one expert slot per layer), `quantization` (policy-driven keep/repack + as-stored vs requantized-at-load), `kv_cache` (f16 bytes + share of RAM budget; advisory `KV8=1` only for MLA + syntara-core engines at ≥10% share, never exported), `batch` (advisory `SYNTARA_PREFILL_CHUNK` suggestion, not exported), `throughput` (labelled `heuristic-v1` low-confidence tok/s range, disk→GPU→CPU ordering); `format_plan` prints strategy/quant/kv/batch/speed/clamped-context lines; 86/86 planner tests (16 new incl. 4-class machine matrix) |
| 1d Host | gateway → full host: library registry, bounded-queue scheduler, OOM ladder + reload predicate, engine supervision, localhost+token, health states, `/v1/models`, chat/completions, stop; Tauri spawns embedded pythonw hidden at app start | **done** — packaging verified first `5d00f56`; library/gateway/runtime `7d5ac4c`; bounded-FIFO scheduler `fc260c0`; lifecycle states + supervision (reload-once, crash-loop give-up) + reload predicate + startup OOM ladder + `POST /stop` (stream cancel, 499 for non-stream) `959a41c`; desktop shell (spawn hidden pythonw at app start with honest `no_model`/`not_configured` states, `host_status/start/stop` commands, first-run log-directory fix, Job-Object process-tree teardown, comctl32 v6 manifest for test binaries) + desktop E2E smoke `581d723` |
| 1e Library UX | QDM completion → auto-inspect → badge → one-click load w/ progress; partial/sharded handling | **done `293268c`** — download completion groups shard siblings and only marks the group installed when every shard is on disk (partial groups stay `downloading`, so they cannot be loaded by accident); a new `library_inspect` Tauri command runs `syntara library add` first and falls back to header-only `syntara inspect` (one Python source of truth; complete files enter the index, truncated ones return an honest `partial` verdict with the refusal reason); `waitHostReady` polls `host_status` until `health.status === "ready"` then connects to the served library id; the model card gains real arch/params/quant/ctx/RAM fields, verdict badge chips, a `partial` status that blocks loading, and a Load button with phase progress (also on the Installed tab); legacy installed entries with an absolute local path but no badges are repaired once per session; 6 new Rust contract tests + 1 opt-in e2e test + 16 new vitest tests |
| 1f Streaming runtime | 9 existing engines fully planner-driven (env injection), fallback + honest status | **done `68af2b6`** — `environment_for_plan` injects the plan's **granted** context into each family's own context variable (`CTX`/`GLM53_MAXT`/`CTX_MAX`/`K3_MAXT`/`Q36_MAXT`/`Q38_MAXT`) when — and only when — the RAM clamp fired: the clamp used to be print-only while the engine allocated the requested size; `report_clamped_context` announces an applied clamp at launch and stays quiet when a user value won; `mirror_family_gpu_env` bridges the generic `SYNTARA_CUDA` protocol to the engines that read family switches — Kimi's `K3_CUDA` on request (its experts ran CPU while the launch claimed a tier) and V4's `DSV4_CUDA` + Kimi's `K3_VK` on `--gpu none` (V4's tier defaults ON, so the off-switch never reached it; Kimi's Vulkan auto-inits); gateway `/health` (authed) gains a `runtime` block: engine identity + the settings the child env actually carries (null when the plan never injected them); engines with no plan-managed runtime env (glm53 Metal/Vulkan, inkling `GPU_DEV`, olmoe, deepseek_v41, pinned llama.cpp adapter) are left platform-managed, not claimed; 18 new tests (3 clamp-injection, 5 notice, 6 mirror, 4 status) |
| 1g Standard runtime (GGUF-dense) | generic GGUF path: parser + decode for mainstream dense archs, BPE reuse, metadata-driven chat template | **done `0061d3d`** — decode delegated to the pinned llama.cpp subprocess adapter (`7d5ac4c`); no in-tree decoder, honest badge; **user-scale real-model smoke ran**: `Qwen2.5-3B-Instruct` Q4_K_M (2.1 GB real weights — approved dense arch/quant) served via `syntara serve --model` → health `ready`/backend `llama.cpp`/`loaded`, `/v1/models` lists it, non-stream chat returned content (usage 36/5), SSE 19 frames + `[DONE]`, `POST /stop`, teardown with **0 llama-server orphans (9/9)**; the smoke exposed a real orphan hole — a hard-killed gateway left `llama-server` running at full RAM — so `ManagedProcess.spawn` now binds children to a Windows **kill-on-close job object** (best-effort; struct verified `sizeof == 144` against `winnt.h`), closing on terminate; the 17.7 GiB Qwen3.8-27B found on `D:` was **not loaded** — it exceeds this machine's 15.3 GiB RAM (honest not-run) |
| 1h Resilience | first-run micro-bench calibration, memory guard pre-OOM, retry-lighter-plan, warm keep/idle unload, crash isolation | **done `b2e3d25`** — host: one-shot first-run calibration (`syntara/calibrate.py` — one short local turn measures tokens/s, cached per model+machine, exposed as `calibration` in `GET /profile`; background thread only when a real runtime is configured; `SYNTARA_CALIBRATE=0` skips); memory guard refuses a load whose plan `ram_gb_min` exceeds total RAM **before** any spawn (actionable message, state `failed`); idle unload via `SYNTARA_IDLE_UNLOAD_S` (state stays `ready`, `/health` gains an `idle` block, the next chat reloads on demand — it blocks while loading; a failed reload is 503 `runtime_not_ready` + `Retry-After: 5`, concurrent requests during a reload get 503 `restarting` + `Retry-After: 2`); supervision hardened (the loop records `supervisor error: …` and keeps running through its own exception and through `starting/stopping/stopped`; an idle-unload death is not misread as a crash); `starting`→503 `restarting` + `backend_error`→502 responses carry `Retry-After`; c-side **retry-lighter-plan**: `oom_class_failed` (SIGKILL `-9`, Windows `0xC0000017`, text markers, defective-checkpoint veto) + `lighter_plan` (halve the family context env, floor 512, and/or the cap) retried **exactly once** on OOM-class load/startup death in all three spawn paths — GLM direct chat, the non-glm `openai_server` subprocess (stderr drained for classification), and `cmd_serve` (`EngineExit.rc` surfaced from the engine's READY wait, port already released by `serve()`'s `finally`); 20 new host tests + 16 new c tests (incl. a real `cmd_chat` child proving the halved context env reaches the second engine) |
| 1i Conversion | streaming/resumable/cancellable/cached wrappers over per-family converters; auto-trigger on planner choice | **done `5984f67`** — the planner's quantization block gains an advisory `conversion` proposal (applicable only when the policy is `repack-allowed` **and** the family registers a converter; the plan still converts nothing — the invariant comment and the `does not convert` reason are untouched — and `format_plan` shows a `convert` line when applicable); engine `syntara convert --print-argv` prints the exact converter command list as one `__SYNTARA_ARGV__` JSON line without running anything, with banner/progress prints suppressed, so family routing, precision-flag acceptance and the output-refusal stay in the launcher (one source of truth); host `syntara/conversion.py` `ConversionService` executes exactly that argv with the four verbs — **streaming** (merged stdout/stderr pumped into `line`/`progress`/`resume`/`wrote` events with a live callback, bounded 500-event stream), **resumable** (failed/cancelled jobs rerun the exact same argv; byte-level resume is each converter's own manifest), **cancellable** (`cancel()` terminates the spawned child through `ManagedProcess` — Windows job object — and the result honestly says `rerun to resume`), **cached** (completed runs keyed by argv hash in `conversions.json` and skipped while the output directory exists; `--force` reruns; one conversion at a time — a second start is refused); new `syntara convert` CLI with `--repo/--outdir/--plan/--force/--json` and `--` passthrough, exit `0/1/2/130` (130 = cancelled), including the auto-trigger `syntara convert --plan plan.json --outdir <fresh>` that derives converter and `--repo` from the planner's proposal; `ManagedProcess` gained a `merge_streams` option (default unchanged) and now closes stdout as well on terminate; 19 new host tests + 2 process tests + 2 c tests |

Phase 1 order note: **packaging verification (1d's riskiest piece) was
executed first**, before the host was built, so the host is only built on a
proven embedding strategy (adjustment to the plan, as agreed).

### Phase 2 tracks

| Track | Deliverable | Status |
|---|---|---|
| 2a Host auto-connect + local-only picker | web chat connects to the packaged host without a URL pasted (desktop `host_status` → connect when running, quiet browser probe otherwise); model picker shows installed library entries only (no bundled catalog rows), quant/context badges, loaded/installed/no-file states; dead API-key state removed | **done `e97aecf`** — `picker.ts`/`ModelPicker.tsx`/`hostBaseFromStatus`, 100/100 web tests at that commit |
| 2b Queue + bounded retry | composer stays typable during generation: FIFO queue chips flushed from a post-commit effect (queued sends resolve their conversation from fresh state); structured `ApiError` + `parseRetryAfter`; retry policy for 503 (loading) / 502 (restart) / 504 (queue timeout) / no-HTTP with Retry-After capped at 15 s and 4 attempts, never once partial output landed; notices in an info strip; non-retryable failures keep partial text | **done `5c4d204`** — new `lib/send.ts` + 12 tests, 112/112 web tests |
| 2c Resume + throttled streaming + durable persistence | stopped/failed answers keep their partial and set `stopped`; Continue streams into the SAME assistant message (nudge is request-only) and a second stop stays resumable; Stop before the first token drops the empty bubble; stream deltas buffered to ≤1 write per 80 ms (each write stores accumulated text — also fixes the pre-existing transcript bug where every save rebuilt from the snapshot and only the last delta survived); Markdown memoised; state flushed synchronously on `pagehide`/`beforeunload`/hidden/unmount so closing mid-generation keeps the tail | **done `6b64c8d`** — `createDeltaBuffer`/`canContinue` tests, 119/119 web tests |
| 2d No workspace concept in chat | Projects view, NAV entry, `View` member and `createProject` removed (persisted `projects`/`selectedProjectId` kept for agent mode; `#projects` bookmarks fall back to chat); copy purge (sidebar `Workspace`→`Menu`, `Reset workspace`→`Reset app data`, agent hero, defaults, i18n en/it, aria id); dead `project-*` CSS stripped | **done `f704629`** — 120/120 web tests, grep sweep clean |
| 2e Offline E2E + host header fixes | host now EMITS `x-syntara-queue-wait-ms` on json and stream successes (measured scheduler wait, 0 when immediate) and EXPOSES `retry-after` + `x-syntara-queue-wait-ms` to granted CORS origins (cross-origin JS previously read null — the retry policy was dead in the packaged app); `tools/chat_e2e.py` drives the packaged host loopback-only: health → completion → SSE → CORS → mid-stream abort → host survives | **done `58e4cf5`** — e2e 9/9, host suite 191/191, web 120/120 |

### Phase 4 tracks

| Track | Deliverable | Status |
|---|---|---|
| 4a Agent loop (pure TS) | `web/src/lib/agent/`: `loop.ts` orchestrator (`runAgentLoop` — round budget, honest interruptions, abort, usage accumulation, injectable transport/executors); `parse.ts` tool-call extraction (native `tool_calls` + fenced/bare JSON fallback, bounded repair rounds `REPAIR_LIMIT=2`, `parseNativeArguments` never executes guessed args); `compact.ts` history compaction (system+task pinned, window never starts on an orphaned `tool` result, tool-usage marker); `permissions.ts` once/always/deny policy (`fs_write`/`proc_run` gated, grant keys per project, deny never stored); `api.ts` gains `chatOnce` non-streaming wire call | **done this commit** — unit tests for parser/repair, compaction, permissions, loop (fake transport/executor/gate: native + fallback flows, unbound/max-steps/repair-limit interruptions, deny, once-per-run, abort, error, compaction) + integration test driving the whole loop against a scripted **loopback mock gateway over real HTTP**; build exit 0, **165/165 web tests (21 files, +40)**, name gate clean (1109 files) |
| 4b Tools as Tauri commands | `desktop/src-tauri/src/agent_tools.rs`: `fs_read`/`fs_list`/`fs_write` (project-root scoped, path validation), `proc_run` (argv array, no shell, timeout, output caps) + `todo` in-memory list; command registration, web invoke wrapper, Rust contract tests | **done this commit** — `resolve_under` refuses absolute/rooted/`..`/drive paths and symlink escapes before any I/O; `fs_read` serves UTF-8 text with a 256 KiB cap (binary/non-UTF-8 refused honestly), `fs_list` sorts folders first and caps at 500 entries, `fs_write` creates parents and caps at 1 MiB; `proc_run` takes an argv array (no shell), drains both pipes on threads at 64 KiB/stream, kills on timeout (1–300 s clamp), path-like programs resolve under the root while bare names use PATH; `todo_get`/`todo_set` sanitize (trim, drop empty, 200×2000 caps) into managed app state; commands registered in `lib.rs`, typed web wrapper `web/src/lib/agent-tools.ts`; 17 new Rust contract tests (incl. real `cmd` runs: echo, timeout kill, output-cap), host contract still 11/11, web build exit 0 + **166/166** tests, name gate clean (1113 files) |
| 4c Agent UI wiring | App: project root + `ProjectItem.permissions` grants state, run flow consuming `AgentEvent`s into tool cards / diff view / todo panel / permission prompts (once/always/deny), styles on existing theme tokens; docs sync (matrix Phase 4 rows, ledger) | planned |

---

## 6. Verification ledger (Phases 0–4)

| Check | Result |
|---|---|
| `python tools/check_names.py` (whole tree, incl. dist) | **ran — clean (1009 files; 1013 after Phase 1a; 1075 after host library/gateway/runtime; 1079 after desktop 1d)** |
| `python -m unittest syntara.tests.test_name_purge` | **ran — 4/4 pass** |
| `npm --prefix web run build` (`tsc -b && vite build`) | **ran — exit 0** |
| `npm --prefix site run build` | **ran — exit 0** |
| `npm --prefix web run test` (vitest) | **ran — 72/72 pass** |
| CI `name-purge` job | **added; not run locally** (runs on push/PR) |
| Phase 1d packaging probe: embeddable `python.exe` + hidden `pythonw.exe`, stripped PATH | **ran — 9/9 checks, exit 0** |
| Phase 1d packaging probe: embeddable + pip + pure-Python dependency | **ran — dependency resolves from the bundle** |
| Phase 1d packaging probe: PyInstaller onedir (fallback route) | **ran — exit 0, 20.4 MB bundle** |
| Phase 1a: `syntara.inspect` unit suite (main env, `python -m unittest`) | **ran — 13/13 pass; 2 quant-oracle tests skipped (gguf package not installed there)** |
| Phase 1a: same suite in a temp venv with the official `gguf` package installed | **ran — 15/15 pass (oracle tests execute there)** |
| Phase 1a: cross-validation — official `gguf` writer → Syntara reader (shapes, bytes, type ids, counts, KVs) | **ran — 0 mismatches** |
| Phase 1a: `GGML_QUANT_SIZES` table cross-check | **ran — 0 mismatches after fixing 3 transcription errors the oracle caught (`q8_1` size, missing `tq1_0`/`tq2_0`)** |
| Phase 1a: `python -m py_compile syntara/gguf_inspect.py syntara/cli.py syntara/tests/test_gguf_inspect.py` | **ran — exit 0** |
| Phase 1b: `tools/fetch_llama_cpp.ps1` (pinned URL + SHA-256, flat-extract with entry-name validation) | **ran — checksum ok, install ok, `--version` reports build 11321, second run idempotent** |
| Phase 1b: GGUF runtime adapter against the real backend binary | **ran — 11/11 pass (spawn → health → chat → SSE stream → unload, no orphan process; non-GGUF rejected before spawn)** |
| Phase 1b: gateway suite (fake runtime, loopback only) | **ran — 18/18 pass (routing, SSE passthrough, 400/401/404/501/502/503, CORS allow-list, API key, bind address)** |
| Phase 1b: library suite (synthetic GGUF fixtures) | **ran — 22/22 pass (add/dedupe/copy/scan/status/resolve/remove incl. delete-without-`--yes` guard)** |
| Phase 1b: full suite `python -m unittest discover -s syntara/tests -t .` | **ran — 120/120 pass, 2 skipped (quant-oracle tests, venv-only)** |
| Phase 1b: CLI e2e — `syntara library add/list/get`, `remove --delete-file` without `--yes` | **ran — as documented; deletion guard exits 2 and names file + size** |
| Phase 1b: gateway e2e — `syntara serve --model <tiny.gguf> --port 8123` (real CLI, real llama.cpp) | **ran — `/health` ok/backend `llama.cpp`; non-stream chat usage 56/15; SSE stream 8 frames incl. `[DONE]`; `/profile` seq=2; `/v1/models` id correct; backend process cleaned up afterwards** |
| Phase 1b: `python -m py_compile` over all new modules | **ran — exit 0** |
| Host scheduler: unit suite (`syntara.tests.test_scheduler`) | **ran — 8/8 pass (FIFO order, queue-full rejection, queue timeout + recovery, slot-handover invariant, capacity > 1, snapshot shape)** |
| Host scheduler: gateway integration (concurrent chats, 429 + `Retry-After`, 504 wait report) | **ran — gateway suite 21/21 pass** |
| Host scheduler: full suite `python -m unittest discover -s syntara/tests -t .` | **ran — 131/131 pass, 2 skipped (quant-oracle, venv-only)** |
| Profiler (1b): `python -m unittest tests.test_doctor` (from `c/`) | **ran — 65/65 pass (48 existing + 17 new: ISA/battery/disk probes, cache hit, TTL, memory-pressure refresh, force, corrupt-cache fallback, formatting, run_doctor integration)** |
| Profiler (1b): real CLI `syntara doctor --reprofile`, then a cached run | **ran — fresh probe renders cores/ISA/RAM/battery/disk bench with `profile fresh`; second run serves `profile cache` with current available RAM** |
| Profiler (1b): full `c/` suite `python -m unittest discover -s tests` (TEMP redirected to D:) | **ran — 1092 tests: 948 pass, 137 skipped, 7 errors — all pre-existing `test_rans_repack` cp1252-locale failures, confirmed identical on a clean checkout (not caused by this work); `test_resource_plan` ENOSPC cases pass with TEMP on D:** |
| Planner (1c): `python -m unittest tests.test_resource_plan` (from `c/`, TEMP on D:) | **ran — 86/86 pass (70 existing + 16 new: execution strategies, policy quant, KV8 advisory + silence, context clamp + no-clamp, batch advice, throughput ordering, format lines, JSON safety, 4-class machine matrix)** |
| Planner (1c): full `c/` suite `python -m unittest discover -s tests` | **ran — 1108 tests: 971 pass, 137 skipped, same 7 pre-existing rans errors, no new failures** |
| Planner (1c): `python tools/check_names.py` | **ran — clean (1077 files)** |
| Host 1d: gateway suite incl. lifecycle/supervision/stop tests (`syntara.tests.test_gateway`) | **ran — 30/30 pass (21 existing + 9 new: start/ready/stop + startup failure, reload predicate & reload, supervisor recover/failed-reload→503/crash-loop give-up, POST /stop idle + stream cancel + 499 non-stream)** |
| Host 1d: full suite `python -m unittest discover -t . -s syntara/tests` | **ran — 145/145 pass, 2 skipped (quant-oracle, venv-only)** |
| Host 1d: real-backend tier `syntara.tests.test_runtime_llamacpp` (pinned binary, tiny synthetic GGUF) | **ran — 15/15 pass (7 real: spawn→health→chat→stream→unload with refactored OOM-ladder load; 4 new ladder/marker tests)** |
| Desktop 1d: `cargo +stable-x86_64-pc-windows-gnu check` (no MSVC on this machine; MinGW toolchain) | **ran — 0 errors; 6 pre-existing qdm warnings** |
| Desktop 1d: `cargo ... fmt --check` | **ran — clean** |
| Desktop 1d: `cargo ... test` | **ran — 5/5 pass (`tests/host_contract.rs`) + doc-tests 0** — contract tests moved out of `src/host.rs`: `cargo::rustc-link-arg-tests` only reaches `[[test]]` targets, so unit-test harnesses cannot embed the comctl32 v6 manifest and died with STATUS_ENTRYPOINT_NOT_FOUND before main (`tauri-plugin-dialog` static-imports `TaskDialogIndirect`); `[lib]/[[bin]] test = false` + integration target gets the manifest |
| Desktop 1d: `cargo ... build --bin syntara-desktop` | **ran — exe produced and launched** |
| Desktop 1d: E2E smoke — tiny GGUF fixture → `syntara library add` → app launch (`SYNTARA_PYTHON`/`SYNTARA_PKG_ROOT`/`SYNTARA_MODEL`/`SYNTARA_HOST_PORT`) → `GET /health` | **ran — ready in 4.2 s: `status=ready`, `backend=llama.cpp`, `loaded=true`, `context=512`, scheduler block; host log shows `serving model=tiny-smoke`** |
| Desktop 1d: E2E smoke — graceful close (WM_CLOSE to the `Tauri Window`) → process-tree teardown | **ran — app exited cleanly, 0 orphan `pythonw`, 0 orphan `llama-server` (Job Object `KILL_ON_JOB_CLOSE`), port 8123 closed**; the first run also caught a real first-run bug (missing app log directory → `File::create` failed → host never spawned), fixed |
| Desktop 1d toolchain note | Linker warning `.rsrc merge failure: multiple non-default manifests` = known WinLibs/binutils bug (sourceware PR 34362: default-manifest + user-manifest); benign here — verified manifests present in both test and app binaries, tests execute, app reaches ready |
| Desktop 1e: `cargo ... fmt --check` | **ran — clean** |
| Desktop 1e: `cargo ... test` | **ran — 11/11 pass (`tests/host_contract.rs`: 5 existing + 6 new library-bridge contract tests pinning argv, mapper, partial-not-registered, camelCase serialization) + doc-tests 0; `tests/library_e2e.rs` compiled but ignored by default (hermetic)** |
| Desktop 1e: opt-in E2E `cargo ... test --test library_e2e -- --ignored` (`SYNTARA_PYTHON`/`SYNTARA_PKG_ROOT`, `SYNTARA_HOME` redirected to temp) | **ran — pass (1.34 s): fixture GGUF built by the package's own builder → `library add` registers it (arch `llama`, non-empty quant labels, badges, library id, `dataComplete=true`); half-truncated copy → outcome `partial` with the refusal reason, `libraryId=null` (never indexed)** |
| Web 1e: `npm run build` (`tsc -b` + vite build) | **ran — clean** |
| Web 1e: `npm test` (vitest, node env) | **ran — 88/88 pass across 13 files (16 new: group completion, inspect-target preference, `metaFromInspect` verdict mapping, param/context formatters, badge labels, `waitHostReady` failure paths with injected status)** |
| Library 1e: host suite `python -X utf8 -m unittest discover -t . -s syntara/tests` | **ran — 145/145 pass, 2 skipped (quant-oracle, venv-only — unchanged)** |
| Library 1e: full `c/` suite `python -X utf8 -m unittest discover -s tests` (TEMP on D:) | **ran — 1108 tests, 7 errors (same known `test_rans_repack`/locale failures), no new failures** |
| Library 1e: `python tools/check_names.py` | **ran — clean (1084 files)** |
| Streaming runtime (1f): `python -m unittest tests.test_resource_plan tests.test_env_defaults tests.test_auto_tier_vram_notice` (from `c/`, TEMP on D:) | **ran — 140/140 pass (14 new: granted-context injection + no-clamp-untouched + explicit-wins, applied-clamp notice + 4 silence cases, family-GPU mirror 6 cases)** |
| Streaming runtime (1f): gateway suite `python -m unittest tests.test_openai_server` | **ran — 180 pass, 1 skip (4 new: `runtime_status` verbatim/null/family-switch + auth-gated `/health` runtime block)** |
| Streaming runtime (1f): full `c/` suite `python -m unittest discover -s tests` | **ran — 1126 tests: 982 pass, 137 skipped, same 7 pre-existing rans/verifier errors (identical IDs confirmed), no new failures** |
| Streaming runtime (1f): `runtime_status` real-family smoke (`family_by_id` × qwen36/kimi/glm/deepseek_v4) | **ran — OK: identity + family context env + verbatim settings; empty env → all nulls** |
| Streaming runtime (1f): host suite + name gate (regression) | **ran — host 145/145 pass, 2 skipped; name gate clean (1085 files)** |
| Live `syntara serve` e2e with a built C engine | **not run** — C engines are not built in this pass; `serve()` wiring is covered by module import, unit tests and the HTTP auth test, but no real engine child was spawned |
| Engine build (`make -C c check`) | **not run in this pass** (unchanged by Phase 0 edits except three comments) |
| Real-model inference smoke (user-scale GGUF) | **ran (9/9)** — `Qwen2.5-3B-Instruct` Q4_K_M, 2,104,932,768 B (fetched for this opt-in, which the approved decision allows: "network allowed only there"): `syntara serve --model <gguf> --port 8199` → `/health` `{"status":"ready","model":"qwen2.5-3b-instruct-q4_k_m","runtime":{"backend":"llama.cpp","loaded":true}}`; `/v1/models` → the same id; non-stream chat → `Hello, world!` (`prompt_tokens 36, completion 5`); SSE → 19 frames + `[DONE]`; `POST /stop` accepted; hard-kill teardown → **0 llama-server orphans** (job-object fix below); the 17.7 GiB `D:\Qwen Model\Qwen3.8-27B-Q4_K_M.gguf` was **not loaded** — 15.3 GiB RAM / 10.4 GiB commit headroom cannot fit it |
| Orphan backend after parent death (found by the 1g smoke) | **fixed** — killing the gateway process left `llama-server` running (cooperative `Gateway.stop()` only covers Ctrl-C); `ManagedProcess.spawn` now calls `bind_lifetime_to_parent` (Windows job object, `JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE`, best-effort with graceful fallback), `terminate()` releases the handle once the child is reaped; 4 new tests in `syntara/tests/test_process.py` (struct sizes, bind, kill-on-close, pid-less noop) |
| Resilience (1h): host new suites `syntara.tests.test_resilience` + `syntara.tests.test_calibrate` | **ran — 20/20 pass** (10: memory guard before spawn, no-estimate passthrough, idle unload → ready → on-demand reload, zero-timeout keeps warm, fault-tolerant env parse, supervisor exception survival, 502/503 `Retry-After`, failed-reload state; 10: measure → cache → cache-hit per model, corrupt cache ignored, env disable, background thread only for real runtimes, background thread never for synthetic runtimes) |
| Resilience (1h): full host suite `python -X utf8 -m unittest discover -t . -s syntara\tests` | **ran — 169/169 pass, 2 skipped (quant-oracle, venv-only)** |
| Resilience (1h): `python -X utf8 -m unittest tests.test_oom_retry` (from `c/`, TEMP on D:) | **ran — 16/16 pass** (classification incl. SIGKILL/`0xC0000017`/defective veto, `lighter_plan` floors/mutation, non-glm chat retry with cap `8→4` + env `8192→4096`, serve retry via `EngineExit.rc` + non-OOM/`ValueError` no-retry, GLM real-`cmd_chat`-child integration: OOM death → banner → second spawn with the halved context env **reaching the engine** → chat completes) |
| Resilience (1h): full `c/` suite `python -X utf8 -m unittest discover -s tests` (TEMP on D:) | **ran — 1142 tests: 7 errors (same known `test_rans_repack`/locale + verifier failures), 137 skipped, no new failures** |
| Resilience (1h): manual gateway probe (idle unload → reload-on-demand → memory guard) | **ran** — idle timeout fired, state stayed `ready`, next chat reloaded and returned 200; guard refused an impossible load with the actionable message and state `failed` |
| Resilience (1h): a real engine provoked into actual out-of-memory | **not run** — no real OOM was inflicted on this machine; classification and the one-retry loop are covered by fake processes and a fixture-engine child, not by a genuine memory kill |
| Resilience (1h): `python tools/check_names.py` | **ran — clean (1090 files)** |
| Conversion (1i): host `syntara.tests.test_conversion` + `syntara.tests.test_process` | **ran — 19/19 + 2/2 pass** (streaming with parsed `progress`/`resume`/`wrote` events + live callback + marker file; cache hit spawns nothing while `--force` reruns; missing-dependency classification with the module named; cancel kills the actual child and reports `rerun to resume`; concurrent start refused; missing/unrunnable `SYNTARA_ENGINE` both actionable; input validation before planning; plan auto-trigger through `main()` in human and `--json` mode, inapplicable plan exits 0 with its reason, usage errors exit 2, `--` passthrough through argparse; `merge_streams` both modes with the default unchanged) |
| Conversion (1i): full host suite `python -X utf8 -m unittest discover -t . -s syntara\tests` | **ran — 190/190 pass, 2 skipped (quant-oracle, venv-only)** |
| Conversion (1i): c `tests.test_convert_routing` + `tests.test_resource_plan.PlannerDecisionTest` | **ran — 16/16 + 15/15 pass** (byte-for-byte converter commands unchanged; `--print-argv` emits exactly one machine-readable line, spawns nothing, `sys.exit(0)`, and the MTP pass still spells int8; the conversion proposal follows the policy choice and `format_plan` names it) |
| Conversion (1i): full `c/` suite `python -X utf8 -m unittest discover -s tests` (TEMP on D:) | **ran — 1144 tests: 7 errors (same known `test_rans_repack`/locale + verifier failures), 137 skipped, no new failures** |
| Conversion (1i): `syntara convert --print-argv` against the real launcher (default GLM repo, fresh outdir) | **ran — exit 0**, one `__SYNTARA_ARGV__` line with both steps (`convert_fp8_to_int4.py` with `--ebits 4`, then the int8 MTP pass with `--ebits 8 --mtp`), no converter spawned |
| Conversion (1i): `syntara convert --help` (host CLI) | **ran — exit 0**, documents `--repo/--outdir/--plan/--force` and the `--` passthrough |
| Conversion (1i): a real multi-GB checkpoint actually converted | **not run** — a real conversion takes hours and no small real checkpoint is present on this machine; the wrapper path (planning, streaming, cancel, cache, resume) is covered by fake launcher/converter children instead |
| Conversion (1i): `python tools/check_names.py` | **ran — clean (1092 files)** |
| Chat 2a–2d: `npm run build` (`tsc -b` + vite build), from `web/` | **ran — exit 0** after every track |
| Chat 2a–2d: `npm test` (vitest, node env) | **ran — 100/100 (2a) → 112/112 (2b, +12 retry-policy) → 119/119 (2c, +7 buffer/resume) → 120/120 (2d, +1 `#projects` fallback), 15 files** |
| Chat 2a: local-only picker + auto-connect | **ran via unit tests** (`picker.test.ts` merge/badges, `host-bridge.test.ts` `hostBaseFromStatus`); the desktop `no_model`→quiet and `running`→connect transitions were reviewed against `host.rs`, **not clicked through a GUI** |
| Chat 2b: retry policy | **ran — unit tests** (attempt cap, Retry-After parse/cap, partial-output veto, status classes); **a live gateway was not provoked into a real 503/502/504 cycle** |
| Chat 2c: resume/throttle/persistence | **ran — unit tests** for `createDeltaBuffer`/`canContinue`; stop→Continue and mid-stream tab close **were not driven in a browser** |
| Chat 2d: workspace removal | **ran — build + 120/120 tests + grep sweep** (no `workspace` in shipped UI copy); no GUI click-through |
| Chat 2e: host emits `x-syntara-queue-wait-ms` (json + stream) | **ran — host suite 191/191 pass, 2 skipped** (new `test_chat_success_carries_queue_wait_header`) |
| Chat 2e: CORS `Access-Control-Expose-Headers: retry-after, x-syntara-queue-wait-ms` for granted origins | **ran — host suite** (extended `test_cors_grants_known_origin_only`; ungranted origins get neither grant nor expose list) |
| Chat 2e: `python tools/chat_e2e.py` (packaged host, loopback-only) | **ran — 9/9, exit 0**: tiny GGUF built → `syntara serve` ready (`model=tiny-llama`) → completion (content + usage, wait `0`) → SSE 15 frames + `[DONE]` → queue-wait header on both paths → dev origin exposed headers → mid-stream client abort → host still serves → process exited, no orphans |
| Chat 2e: offline claim | **by construction, not by disabling the NIC** — every e2e request targets `127.0.0.1` and the chat path performs no other network calls; the machine itself was online |
| Chat 2e: full Tauri GUI chat session | **not run** — the packaged host is driven by the script; a human click-through of the desktop shell was not performed in this pass |
| Chat 2e: `python tools/check_names.py` | **ran — clean (1099 files; +2 = the new `tools/chat_e2e.py` and its gitignored report)** |
| Mode toggle (3): `npm run build` (`tsc -b` + vite build), from `web/` | **ran — exit 0** |
| Mode toggle (3): `npm test` (vitest, node env) | **ran — 125/125 (16 files)**: +3 route tests (`#chat`/`#agents` routing, canonical id list, singular labels) and a new `app-shell.test.tsx` that server-renders the real `App` with stubbed browser globals and asserts the tablist/tabs/aria-selected state, the chat panel, and that the menu no longer lists Chat/Agents |
| Mode toggle (3): GUI click-through of an actual mode switch | **not run** — no browser/webview automation in this environment; the switch is the same `navigate()` hash path every sidebar item already uses, and the render test covers initial wiring |
| Mode toggle (3): `python tools/check_names.py` | **ran — clean (1100 files; +1 = `web/src/app-shell.test.tsx`)** |
| Agent loop (4a): `npm run build` (`tsc -b` + vite build), from `web/` | **ran — exit 0** (`tsconfig.app.json` gains `"types": ["node"]` — TS 7 no longer auto-includes `@types/node`, needed by the mock-gateway test's `node:http` import) |
| Agent loop (4a): `npm test` (vitest, node env) | **ran — 165/165 (21 files)**: +40 tests across 5 new files (`parse.test.ts` 12: fenced/bare/variant keys, unclosed fence → repair, unknown `tool` name, string-literal brace scanning, prose-JSON ignored, native argument refusal; `compact.test.ts` 4; `permissions.test.ts` 6; `loop.test.ts` 14; `integration.test.ts` 4) |
| Agent loop (4a): integration test vs mock gateway | **ran — over real HTTP on loopback** (`node:http` server scripted like the host: native `tool_calls` dialect, JSON-fence dialect, OpenAI-shaped 503 + `Retry-After`): `chatOnce` wire round-trip, `ApiError` mapping, full loop native + fallback completions |
| Agent loop (4a): honest interruptions | **ran — unit tests** for `tools_not_bound`, `max_steps`, `unparseable_tool_call` (repair limit), transport `error`, `aborted`; each returns pending tool calls or a structured reason instead of a wrong final answer |
| Agent loop (4a): real local model emitting tool calls | **not run** — no model is loaded on this 15.3 GiB machine; native + fallback dialects are exercised against the scripted gateway instead |
| Agent loop (4a): GUI agent run (tool cards/permissions) | **not run** — UI lands in track 4c; no webview automation here |
| Agent loop (4a): `python tools/check_names.py` | **ran — clean (1109 files; +9 = `web/src/lib/agent/` sources + tests)** |
| Agent tools (4b): `cargo +stable-x86_64-pc-windows-gnu check --tests` | **ran — 0 errors**; warnings are pre-existing (6 qdm dead-code, `HostJob` privacy, `qdm/engine.rs` unused variable) — none in `agent_tools.rs` |
| Agent tools (4b): `cargo ... fmt --check` | **ran — clean** (after `cargo fmt`) |
| Agent tools (4b): `cargo ... test` | **ran — agent_tools_contract 17/17 pass** (path scoping: 6 escape shapes refused; read: text/cap/binary/non-UTF-8/dir/missing; list: sort + truncation + file refusal; write: parents/escape/empty/oversize/dir; proc: real `cmd /c echo`, timeout kill < 10 s, output-cap exactness; todo sanitize; timeout clamp; camelCase) + host_contract **11/11**, library_e2e still opt-in-ignored |
| Agent tools (4b): real `proc_run` child processes | **ran — via contract tests** (echo child, timeout-killed busy loop, 2000-line chatty child capped at exactly 1000 bytes); no grandchild-bearing commands were used, so nothing could orphan |
| Agent tools (4b): web `npm run build` + `npm test` | **ran — build exit 0; 166/166 (22 files, +1 `agent-tools.test.ts`)** |
| Agent tools (4b): invoking the commands from the packaged GUI | **not run** — the wrapper compiles and the Rust side is contract-tested, but no webview click-through drives `fs_read`/`proc_run` yet (the run flow lands in track 4c) |
| Agent tools (4b): `python tools/check_names.py` | **ran — clean (1113 files; +4 = Rust module + contract test + web wrapper + its test)** |

Deviations from the original Phase 0 checklist: `docs/ARCHITECTURE.md` was
**not** created — the repository already carries a root `ARCHITECTURE.md`
(target diagram, brand-clean); duplicating it under `docs/` would create two
sources of truth. This audit references it instead, and §5 above records
which parts of that target diagram are actually implemented (see finding 1:
not yet).
