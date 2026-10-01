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

| Phase | Deliverable | Exit criterion |
|---|---|---|
| **0 — Audit & gate** (this doc) | audit docs, name gate + tests + CI, licence records, purge | name gate green locally **and** tests pass; committed |
| **1 — Engine bring-up** | 1a: GGUF inspector (metadata/quants/compat) → **1d: embedded-CPython packaging verified on Windows first** → 1b: host library + gateway → 1c: scheduler | a local GGUF file can be inspected, loaded and streamed through the host on Windows, via a packaged build |
| **2 — Chat product** | unified chat UX over the host (streaming, cancel, model picker, lifecycle states with a real producer) | chat works offline against the packaged app end-to-end |
| **3 — Agent product** | real tool loop (file/shell/git) behind explicit permissions, sharing the chat session store | one product: Chat and Agent modes share conversations/state; agent tools run and are gated |
| **4 — Integrations** | OpenAI-compatible surface documentation + Python SDK against the real host; integration thinness check | SDK + endpoint tests pass against the packaged host |
| **5 — Polish & release** | lifecycle observability, error-recovery copy, cross-platform pass, docs sync | checklist from `AGENTS.md` §115 satisfied |

Phase 1 order note: **1d (packaging verification) precedes 1b/1c** so the
host is only built once the embedding strategy is proven.

---

## 6. Verification ledger (Phase 0)

| Check | Result |
|---|---|
| `python tools/check_names.py` (whole tree, incl. dist) | **ran — clean (1007 files)** |
| `python -m unittest syntara.tests.test_name_purge` | **ran — 4/4 pass** |
| `npm --prefix web run build` (`tsc -b && vite build`) | **ran — exit 0** |
| `npm --prefix site run build` | **ran — exit 0** |
| `npm --prefix web run test` (vitest) | **ran — 72/72 pass** |
| CI `name-purge` job | **added; not run locally** (runs on push/PR) |
| Engine build (`make -C c check`) | **not run in this pass** (unchanged by Phase 0 edits except three comments) |
| Real-model inference smoke | **not run** (no model fixture selected yet — Phase 1) |

Deviations from the original Phase 0 checklist: `docs/ARCHITECTURE.md` was
**not** created — the repository already carries a root `ARCHITECTURE.md`
(target diagram, brand-clean); duplicating it under `docs/` would create two
sources of truth. This audit references it instead, and §5 above records
which parts of that target diagram are actually implemented (see finding 1:
not yet).
