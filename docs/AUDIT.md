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
| 1b Profiler | `doctor.py` extended: ISA, RAM, GPU/VRAM, quick disk bench, battery; cached + pressure re-profile | **done this commit** — `c/doctor.py` hardware profile: ISA via Windows API/sysctl/proc-cpuinfo/arm64-baseline, installed+available RAM, GPU summary, battery/AC, bounded 16 MB disk bench; 7-day cache at `syntara/profile.json`, refreshed under memory pressure (<15% free) or `--reprofile`; `hardware` block in report JSON + text; 65/65 tests |
| 1c Planner | `resource_plan.py` extended: strategy, quant, offload, KV quant, ctx clamp, threads/batch, predicted mem + tok/s, human summary | **pending** |
| 1d Host | gateway → full host: library registry, bounded-queue scheduler, OOM ladder + reload predicate, engine supervision, localhost+token, health states, `/v1/models`, chat/completions, stop; Tauri spawns embedded pythonw hidden at app start | **partial** — packaging verified first `5d00f56`; library/gateway/runtime `7d5ac4c`; bounded-FIFO scheduler `fc260c0`; remaining: OOM ladder, reload predicate, supervision, health states beyond ok/degraded, stop, Tauri embedded spawn + desktop smoke |
| 1e Library UX | QDM completion → auto-inspect → badge → one-click load w/ progress; partial/sharded handling | **pending** |
| 1f Streaming runtime | 9 existing engines fully planner-driven (env injection), fallback + honest status | **pending** |
| 1g Standard runtime (GGUF-dense) | generic GGUF path: parser + decode for mainstream dense archs, BPE reuse, metadata-driven chat template | **delivered by decision** — decode delegated to the pinned llama.cpp subprocess adapter (`7d5ac4c`); no in-tree decoder, honest badge; real-model smoke opt-in, not yet run |
| 1h Resilience | first-run micro-bench calibration, memory guard pre-OOM, retry-lighter-plan, warm keep/idle unload, crash isolation | **pending** |
| 1i Conversion | streaming/resumable/cancellable/cached wrappers over per-family converters; auto-trigger on planner choice | **pending** |

Phase 1 order note: **packaging verification (1d's riskiest piece) was
executed first**, before the host was built, so the host is only built on a
proven embedding strategy (adjustment to the plan, as agreed).

---

## 6. Verification ledger (Phase 0 + Phase 1 tracks so far)

| Check | Result |
|---|---|
| `python tools/check_names.py` (whole tree, incl. dist) | **ran — clean (1009 files; 1013 after Phase 1a; 1075 after host library/gateway/runtime)** |
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
| Engine build (`make -C c check`) | **not run in this pass** (unchanged by Phase 0 edits except three comments) |
| Real-model inference smoke (user-scale GGUF) | **not run** — the full path is proven with a synthetic tiny model; a user-scale model lands with Phase 1c/2 |

Deviations from the original Phase 0 checklist: `docs/ARCHITECTURE.md` was
**not** created — the repository already carries a root `ARCHITECTURE.md`
(target diagram, brand-clean); duplicating it under `docs/` would create two
sources of truth. This audit references it instead, and §5 above records
which parts of that target diagram are actually implemented (see finding 1:
not yet).
