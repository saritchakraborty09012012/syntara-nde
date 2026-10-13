# Contributing to Syntara

Syntara is a local-first, open-source local-AI platform: the user's models run
on the user's device, core local features need no account, and privacy-first
behaviour is part of the contract, not a preference. Changes that quietly turn
any of that into a hosted or account-gated feature will be rejected.

`AGENTS.md` in the repository root is the detailed engineering standard for
this project (architecture, security, cross-platform rules, testing
expectations). Read it before a large change; this file is the practical
"how do I work here" version.

## Repository layout

| Path | What lives there |
| --- | --- |
| `c/` | The C11 inference engine, its Makefiles, tools and oracles. |
| `syntara/` | The Python runtime, gateway, CLI (`syntara`), SDK client and tests. |
| `web/` | The shared React + Vite + TypeScript UI used by both the browser app and the desktop shell. |
| `desktop/` | The Tauri v2 shell. It packages `web/dist`; there is no second frontend. |
| `site/` | The public marketing/docs site (React + Vite + Tailwind). |
| `integrations/` | n8n, VS Code and Cursor integration surfaces. |
| `docker/` | Container images for development and optional deployment. |
| `docs/` | Architecture, API, model and platform documentation. |
| `tools/` | Repository gates and maintenance scripts (name purge, installer verification). |
| `assets/`, `.github/` | Shared assets; CI, issue templates and release workflows. |

Dependency direction is `UI / SDK / API → application layer → core → runtime
adapter`. Do not make the core depend on the UI, the site, or a specific
integration.

## Development setup

Python 3.10+, Node 20+ and a C compiler cover everything below. No model
download is required to build or test.

### Web UI (`web/`)

```sh
npm --prefix web ci
npm --prefix web run dev      # Vite dev server
npm --prefix web run build    # type-check + production bundle
npm --prefix web test         # Vitest suite
```

### Marketing site (`site/`)

```sh
npm --prefix site ci
npm --prefix site run build   # tsc -b && vite build && stage the web app
```

### Desktop shell (`desktop/`)

```sh
cd web && npm ci && cd ../desktop
cargo install tauri-cli --version "^2.0.0" --locked
cargo tauri dev
cargo fmt --manifest-path src-tauri/Cargo.toml --check
cargo check --manifest-path src-tauri/Cargo.toml
```

See `desktop/README.md` for installer publishing (the site's download buttons
resolve fixed asset names produced by `.github/workflows/desktop-installers.yml`).

### Engine (`c/`) and Python (`syntara/`)

```sh
make check                        # from the repo root: portable CPU build + tests
make -C c check                   # the same gate from the engine directory
python -m unittest discover -s syntara/tests -v
python -m pip install -e .        # installs the `syntara` CLI
```

## Checks to run before opening a PR

Match the check to what you touched — CI runs all of these.

- Everything: `make check` (portable CPU build, C unit suites, Python
  standard-library tests; no CUDA, no downloads).
- `web/` changed: `npm --prefix web run build && npm --prefix web test`.
- `site/` changed: `npm --prefix site run build`.
- `desktop/` changed: the two `cargo` commands above.
- Whole tree: `python tools/check_names.py` (brand-name gate; external
  identifiers belong in `tools/name_check_allowlist.txt` with a justification).
- Packaging touched: `python -m unittest -v syntara.tests.test_desktop_packaging`.
- Performance claims: attach an experiment manifest and validate it with
  `python3 c/experiment_manifest.py path/to/result.json`; reports need the
  commit, exact commands, hardware, warm-up policy, run count and median
  throughput.

Do not weaken or delete a test to make a change pass. If a test encodes an
assumption your change invalidates, update it and say why in the PR.

## What a good pull request looks like

- **Focused.** One problem per PR; separate large refactors from feature work.
- **Verified honestly.** List exactly the commands you ran and their results.
  "Implemented, but I could not run X because Y" is acceptable; claiming a
  green build you did not run is not.
- **UI changes include before/after screenshots** (dark and light where it
  matters) and a note on keyboard/focus behaviour.
- **Failure paths handled.** Code touching files, processes, network,
  downloads or model loading needs its error cases tested.
- **Cross-platform considered.** Windows is a first-class target; do not
  assume POSIX paths, `/tmp`, or that Bash exists. macOS (including Apple
  Silicon) and Linux distributions each have their own quirks.
- **Docs synced** when you change architecture, public APIs, CLI commands,
  environment variables, install steps or supported model formats. Record
  user-facing changes in `CHANGELOG.md`.
- **No secrets, no telemetry, no model binaries, no generated build output**
  in the diff. Large files belong in releases or on the user's disk, never in
  git.

## Reporting issues

Use the GitHub issue tracker for bugs and feature requests. A useful report
includes your platform, Syntara version, model, quantization and backend, plus
the exact command or UI path and the full error text.

Security issues should go through a private GitHub Security Advisory on this
repository rather than a public issue. Do not attach model files, private
prompts or conversation logs to a public report.

## Review and merge

- Open pull requests against `main`.
- Every PR is reviewed for a clean build, the relevant test suites, and its
  own targeted validation before merge.
- Reviews prioritise correctness, security, data integrity, architecture and
  cross-platform behaviour over style. Follow the existing style of the file
  you are editing; formatting churn in an unrelated file belongs in its own PR.
