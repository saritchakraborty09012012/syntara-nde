# Syntara desktop

Tauri v2 shell for the shared React interface in `../web`.

This directory intentionally contains no second frontend. During development,
Tauri starts the Vite server from `web/`; release builds package `web/dist`.

## Development

The shared web UI landed in PR #23 and is already part of `main`. From the
repository root, install its dependencies and start the desktop shell:

```sh
cd web
npm ci
cd ../desktop
cargo install tauri-cli --version "^2.0.0" --locked
cargo tauri dev
```

The application connects to an OpenAI-compatible server configured in the UI.
Bundling the inference engine or managing its process is intentionally deferred:
the model is hundreds of gigabytes and must remain an external, user-selected
resource rather than an opaque application sidecar.

This first desktop increment only packages the existing UI in a native window.
It does not change the web application, start the inference engine, download
models, or add native filesystem and process permissions.

## Validation

```sh
cargo fmt --manifest-path src-tauri/Cargo.toml --check
cargo check --manifest-path src-tauri/Cargo.toml
```

## Publishing installers (Windows / macOS / Linux)

The download buttons on the site resolve to fixed asset names on GitHub Releases
(see `site/src/lib/releases.ts` and `.github/workflows/desktop-installers.yml`).

After CI fixes on `main`, an **old release tag can still serve broken installers**
until this workflow is run again. v1.0.1’s Windows asset was a 302 KB cargo build
script, not an NSIS installer — the site and `tools/verify_installer.py` now reject
anything that small.

**Republish or publish by hand** (rebuilds from current `main`, uploads with
`--clobber` onto the release):

1. GitHub → Actions → **Desktop installers** → **Run workflow**.
2. Branch: `main`.
3. Tag: an existing release to update (`v1.0.1`), or a **new** version string
   to release (`1.0.6`). A preflight job validates the name in seconds and
   creates the git tag at `main` when it does not exist, so the publish step
   no longer fails after a full build; an invalid name (or one colliding with
   a branch, e.g. `main`) fails before any build starts.

A manual dispatch never waits on `release.yml` — that wait only applies when
both workflows start from the same `v*` tag push. Portable source-free
archives only come from a `v*` tag a **human** pushes (a tag pushed with the
workflow token does not trigger other workflows).

**Ship a new version**: push a `v*` tag; `desktop-installers.yml` and
`release.yml` both attach to that release.

Local gate (same rules as CI):

```sh
python -m unittest -v syntara.tests.test_desktop_packaging
python tools/verify_installer.py --kind nsis path/to/Syntara-Windows-x64-Setup.exe
```
