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
| **2 — Chat mode** | rewire to host API; picker = local models only + badges, no key fields; resume/queue/throttled-markdown lessons; no workspace concept in chat | chat works offline against the packaged app end-to-end |
| **3 — Mode toggle** | single `Chat \| Agent` toggle replacing workspaces; per-mode history, shared picker, no reload, existing theme tokens | mode switch preserves context; no full reload |
| **4 — Agent mode** | TS loop (`web/src/lib/agent/`), tools as Tauri commands, permission system (once/always/deny, per-project), local-model tool-call layer (schema-constrained JSON + repair), tool cards/diffs/todo UI | agent tools run and are gated; parser/repair/compaction unit tests + integration test vs mock gateway |
| **5 — Polish & hardening** | startup/memory/shutdown hygiene, child-process cleanup, in-app logs, first-run hardware scan → starter-model suggestion, final name-purge + full test matrix + production builds, docs/README sync | checklist from `AGENTS.md` §115 satisfied |

### Phase 1 tracks

| Track | Deliverable | Status |
|---|---|---|
| 1a Inspector | GGUF/safetensors/sharded inspection without loading weights; arch, params, GQA/MQA, MoE, tokenizer, ctx, quant, chat template, tool-calling | **done `64b8469`** — GGUF header path only (`syntara/gguf_inspect.py`, `syntara inspect`); safetensors/sharded detection still open (badged, not claimed) |
| 1b Profiler | `doctor.py` extended: ISA, RAM, GPU/VRAM, quick disk bench, battery; cached + pressure re-profile | **done `4758980`** — `c/doctor.py` hardware profile: ISA via Windows API/sysctl/proc-cpuinfo/arm64-baseline, installed+available RAM, GPU summary, battery/AC, bounded 16 MB disk bench; 7-day cache at `syntara/profile.json`, refreshed under memory pressure (<15% free) or `--reprofile`; `hardware` block in report JSON + text; 65/65 tests |
| 1c Planner | `resource_plan.py` extended: strategy, quant, offload, KV quant, ctx clamp, threads/batch, predicted mem + tok/s, human summary | **done `d4ffc11`** — `build_plan` now returns `execution` (cpu-resident/gpu-offload/hybrid + offload bytes + reason), `context` (requested/granted/clamped with halving clamp that keeps one expert slot per layer), `quantization` (policy-driven keep/repack + as-stored vs requantized-at-load), `kv_cache` (f16 bytes + share of RAM budget; advisory `KV8=1` only for MLA + syntara-core engines at ≥10% share, never exported), `batch` (advisory `SYNTARA_PREFILL_CHUNK` suggestion, not exported), `throughput` (labelled `heuristic-v1` low-confidence tok/s range, disk→GPU→CPU ordering); `format_plan` prints strategy/quant/kv/batch/speed/clamped-context lines; 86/86 planner tests (16 new incl. 4-class machine matrix) |
| 1d Host | gateway → full host: library registry, bounded-queue scheduler, OOM ladder + reload predicate, engine supervision, localhost+token, health states, `/v1/models`, chat/completions, stop; Tauri spawns embedded pythonw hidden at app start | **done** — packaging verified first `5d00f56`; library/gateway/runtime `7d5ac4c`; bounded-FIFO scheduler `fc260c0`; lifecycle states + supervision (reload-once, crash-loop give-up) + reload predicate + startup OOM ladder + `POST /stop` (stream cancel, 499 for non-stream) `959a41c`; desktop shell (spawn hidden pythonw at app start with honest `no_model`/`not_configured` states, `host_status/start/stop` commands, first-run log-directory fix, Job-Object process-tree teardown, comctl32 v6 manifest for test binaries) + desktop E2E smoke `581d723` |
| 1e Library UX | QDM completion → auto-inspect → badge → one-click load w/ progress; partial/sharded handling | **done this commit** — download completion groups shard siblings and only marks the group installed when every shard is on disk (partial groups stay `downloading`, so they cannot be loaded by accident); a new `library_inspect` Tauri command runs `syntara library add` first and falls back to header-only `syntara inspect` (one Python source of truth; complete files enter the index, truncated ones return an honest `partial` verdict with the refusal reason); `waitHostReady` polls `host_status` until `health.status === "ready"` then connects to the served library id; the model card gains real arch/params/quant/ctx/RAM fields, verdict badge chips, a `partial` status that blocks loading, and a Load button with phase progress (also on the Installed tab); legacy installed entries with an absolute local path but no badges are repaired once per session; 6 new Rust contract tests + 1 opt-in e2e test + 16 new vitest tests |
| 1f Streaming runtime | 9 existing engines fully planner-driven (env injection), fallback + honest status | **done this commit** — `environment_for_plan` injects the plan's **granted** context into each family's own context variable (`CTX`/`GLM53_MAXT`/`CTX_MAX`/`K3_MAXT`/`Q36_MAXT`/`Q38_MAXT`) when — and only when — the RAM clamp fired: the clamp used to be print-only while the engine allocated the requested size; `report_clamped_context` announces an applied clamp at launch and stays quiet when a user value won; `mirror_family_gpu_env` bridges the generic `SYNTARA_CUDA` protocol to the engines that read family switches — Kimi's `K3_CUDA` on request (its experts ran CPU while the launch claimed a tier) and V4's `DSV4_CUDA` + Kimi's `K3_VK` on `--gpu none` (V4's tier defaults ON, so the off-switch never reached it; Kimi's Vulkan auto-inits); gateway `/health` (authed) gains a `runtime` block: engine identity + the settings the child env actually carries (null when the plan never injected them); engines with no plan-managed runtime env (glm53 Metal/Vulkan, inkling `GPU_DEV`, olmoe, deepseek_v41, pinned llama.cpp adapter) are left platform-managed, not claimed; 18 new tests (3 clamp-injection, 5 notice, 6 mirror, 4 status) |
| 1g Standard runtime (GGUF-dense) | generic GGUF path: parser + decode for mainstream dense archs, BPE reuse, metadata-driven chat template | **done this commit** — decode delegated to the pinned llama.cpp subprocess adapter (`7d5ac4c`); no in-tree decoder, honest badge; **user-scale real-model smoke ran**: `Qwen2.5-3B-Instruct` Q4_K_M (2.1 GB real weights — approved dense arch/quant) served via `syntara serve --model` → health `ready`/backend `llama.cpp`/`loaded`, `/v1/models` lists it, non-stream chat returned content (usage 36/5), SSE 19 frames + `[DONE]`, `POST /stop`, teardown with **0 llama-server orphans (9/9)**; the smoke exposed a real orphan hole — a hard-killed gateway left `llama-server` running at full RAM — so `ManagedProcess.spawn` now binds children to a Windows **kill-on-close job object** (best-effort; struct verified `sizeof == 144` against `winnt.h`), closing on terminate; the 17.7 GiB Qwen3.8-27B found on `D:` was **not loaded** — it exceeds this machine's 15.3 GiB RAM (honest not-run) |
| 1h Resilience | first-run micro-bench calibration, memory guard pre-OOM, retry-lighter-plan, warm keep/idle unload, crash isolation | **pending** |
| 1i Conversion | streaming/resumable/cancellable/cached wrappers over per-family converters; auto-trigger on planner choice | **pending** |

Phase 1 order note: **packaging verification (1d's riskiest piece) was
executed first**, before the host was built, so the host is only built on a
proven embedding strategy (adjustment to the plan, as agreed).

---

## 6. Verification ledger (Phase 0 + Phase 1 tracks so far)

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

Deviations from the original Phase 0 checklist: `docs/ARCHITECTURE.md` was
**not** created — the repository already carries a root `ARCHITECTURE.md`
(target diagram, brand-clean); duplicating it under `docs/` would create two
sources of truth. This audit references it instead, and §5 above records
which parts of that target diagram are actually implemented (see finding 1:
not yet).
