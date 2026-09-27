# Syntara implementation audit

This repository is the Syntara product work tree derived from the supplied upstream source.

## Product identity

- Product: **Syntara: The Universal Local AI Runtime by NDe: NoirDemons**
- Company: **NDe**
- Authentication: none required by Syntara itself
- Local-first: yes
- User-provided Syntara and NDe logos are used by the application and website.

## Implemented in this source tree

- Syntara-branded C launcher/build target and runtime entrypoint.
- Cross-platform desktop shell configuration for Syntara.
- Syntara Model Hub data model and hardware recommendation layer.
- Local model import metadata flow.
- Model attach/detach/delete controls.
- Local persistent memory UI with view/edit/delete/enable/disable/export.
- Local memory injection into chat context when enabled.
- Local backup/restore including conversations, memories, projects, settings, agent configs and model metadata; model weights are intentionally excluded.
- Chat UI with model selector, streaming API integration and multimodal image message plumbing.
- Agent-mode planning/permission-gate interface.
- Local API/developer surface.
- Dependency-free Python SDK.
- Developer CLI.
- n8n integration documentation/sample workflow.
- VS Code integration starter extension.
- Cursor-type IDE integration documentation.
- Premium landing page with direct platform download links and no auth flow.
- Light/dark/system UI themes and reduced-motion support.
- Desktop tray implementation in the Tauri source.
- Legal attribution files retained as required by upstream licenses.

## Native/research-heavy work still represented as architecture or extension points

Some Syntara goals require substantial native inference-engine development and platform-specific verification and therefore are not honestly represented as finished merely by UI scaffolding:

- Universal execution of every model architecture.
- Complete automatic conversion for every Hugging Face/Safetensors architecture.
- Production resumable large-model downloader implemented natively across all desktop OSes.
- Full sandboxed terminal/filesystem/browser execution for Agent Mode.
- Full automatic backend benchmarking/routing across every backend.
- All advanced dense/MoE streaming optimizations and low-level kernels.
- Application autostart implementation on every supported OS.
- Release signing, notarization, packaging and updater rollback in a real release pipeline.

These are deliberately kept behind clean interfaces so they can be implemented without rewriting the product architecture.

## Verification notes

- Native C Syntara target builds successfully with the available GCC/OpenMP toolchain.
- Python SDK and local Python modules pass `py_compile`.
- JSON configuration/workflow files parse successfully.
- Product-facing source files contain no upstream product-name or upstream-author references outside the required legal attribution files.
- The full desktop TypeScript/Tauri release build could not be completed in this environment because the npm dependency installation did not finish and Rust/Cargo is not installed in the execution environment.

## Web dashboard and integrations audit (0.3.0)

Verified in this environment:

- `web/`: `npm ci` succeeds; `npx tsc -b` passes; 20 vitest tests pass (runtime, storage, API); `vite build` succeeds (272 kB JS, 25 kB CSS, gzip 88 kB).
- `integrations/vscode/extension.js`: parses with `node --check`.
- `integrations/n8n/syntara-chat.json`: parse-valid JSON.
- Release asset contract: `.github/workflows/release.yml` assembles
  `syntara-<tag>-windows-x86_64.zip`, `syntara-<tag>-macos-arm64.tar.gz` and
  `syntara-<tag>-linux-x86_64.tar.gz`; `site/index.html` resolves those exact
  substrings for the direct-download links. Naming contract verified.

What the web audit found and fixed:

- Baseline was not green: 5 pre-existing `App.tsx` errors (a `Github` icon
  that does not exist in lucide-react `^1.24.0`, and a system-message object
  missing its required `id`, cascading into the transcript type). All
  resolved; the build is now clean from a fresh `npm ci`.
- The previous downloads view invoked a browser tab for a model URL and the
  previous agent run and metric grid were simulated. Replaced: real
  streaming chat for agents, a real streaming downloader, and measured
  tokens/sec + time-to-first-token in the metric grid.
- Downloader hardening: a cancelled File System Access save dialog now
  starts nothing (it previously fell back to buffering a multi-GB model in
  RAM); the in-memory fallback is capped at 1.5 GB with a clear error; the
  resume path truncates the destination before restarting after a 200
  response so a re-send cannot corrupt the file; removing a download row
  cancels any in-flight stream.
- Conversation regeneration and edit-and-resend were corrected to truncate
  the transcript at the right boundary so the user turn is not duplicated.

Remaining honest gaps (unchanged, documented as architecture/extension points
above): Tauri desktop release build, native resumable downloader on all
desktop OSes, sandboxed agent tool execution, and signed/notarized installers
require toolchains not present in this environment.

## Spec coverage matrix and 0.4.0 pass

- `docs/SPEC_COVERAGE_MATRIX.md` maps both product specs (the 265-item
  checklist and the phased plan) to concrete files with an honest
  ✅ implemented / 🟡 gated / 🔴 extension-point status per row.
- Web polish (0.4.0): LaTeX via KaTeX, document attachments (text + images)
  with round-trip through export/regenerate, download speed/ETA, model-card
  quantization tags + context, chat stop button (real abort), memory search +
  import, temperature/max-tokens in setup, keyboard shortcuts + aria-labels +
  focus-visible. Verified: `npx tsc -b` 0, 24 vitest tests pass, `vite build`
  exit 0 (bundle 538 kB JS due to KaTeX; fonts lazy-loaded).
- Python (0.4.0): SDK honors `SYNTARA_BASE_URL`/`SYNTARA_API_KEY` (explicit
  args win); `client.memories` surface + `LocalStore.update_memory`; CLI
  `models install|remove|benchmark|optimize` delegate to the engine via
  `SYNTARA_ENGINE` only (never guessed from `PATH`, avoiding recursion into
  the pip `syntara` console script). Verified: 50 unittest pass, CLI smoke OK.
- Integrations/site (0.4.0): n8n body now `JSON.stringify`-based (valid JSON,
  escaped prompt); VS Code declares `syntara.webUrl` in
  `contributes.configuration`; site downloads JS hardened (asset guards,
  architecture labels preserved) and the Windows install step no longer
  references the nonexistent `syntara.cmd`. All JSON re-validated; site JS
  `node --check` clean.

## Native/desktop and release pass (0.4.1)

- Added a `desktop` job to `.github/workflows/ci.yml`: installs the Tauri v2
  Linux system libraries, pins a stable Rust toolchain, builds `web/dist`
  (the Tauri `generate_context!` macro embeds it into the binary), then runs
  `cargo fmt --check` and `cargo check` on `desktop/src-tauri`. This was the
  one native artifact with no CI coverage at all: the engine matrix covers
  `c/` and every other job tests Python/C. It was not run locally (no Rust on
  this host); it becomes evidence on the first push/PR to dev/main. One thing
  CI will settle: `desktop/src-tauri/Cargo.toml` declares `features = []` on
  `tauri` while `lib.rs` uses `tauri::tray`; if that needs the `tray-icon`
  feature to compile, this job surfaces it immediately.
- Added `c/syntara.cmd`, the Windows command entry point that
  `.github/workflows/release.yml` copies into the archive (line 144 referenced
  it but the file was missing from the tree). It is a standard wrapper that
  forwards all arguments to `syntara.exe` next to it.
- FLAGGED, needs a release-architecture decision, and is the reason the
  release and Docker lanes are still listed as not-run here:
  `.github/workflows/release.yml` (verify step, lines 205-263) and
  `docker/Dockerfile.slim` (lines 40-54) treat `c/syntara` as an extensionless
  PYTHON launcher (`SourceFileLoader("syntara_pkg", "syntara")`,
  `python3 /app/syntara` entrypoint), while the tree's `c/syntara` is the
  built C ENGINE � a Linux x86-64 ELF produced by `make syntara` from
  `c/syntara.c`. The release archive-verify step and the Docker entrypoint
  cannot pass against this tree as-is. The tree does contain the Python
  ecosystem the release expects (`c/family_registry.py`, `c/openai_server.py`,
  `c/version.py`, `c/tools/*`, `c/resource_plan.py`, `c/doctor.py`), but no
  Python CLI entry script named `syntara`. Options, both requiring the owner
  (or a placeholder) rather than a blind guess that would break every tagged
  release: (a) reintroduce the Python CLI launcher and repoint the
  pack/verify/Docker steps at it, or (b) convert the packaging lane to treat
  `syntara` as the C engine and drop the Python-loader assertions. I did not
  invent a Python launcher or rewrite the release/Docker lanes.
- `c/syntara` (the committed ELF) is a build artifact sitting among sources;
  CI and the Docker stage rebuild it per platform. Left in place pending the
  decision above.
- `docs/SPEC_COVERAGE_MATRIX.md` updated: the desktop rows now distinguish
  "compiled/format-checked by CI" from "release packaging not proven here",
  and the release/Docker launcher contract is marked red pending the decision
  above.

## Native/desktop, release and launcher-concordance pass (0.4.2)

Resolves the 0.4.1 flag (c/syntara launcher vs C engine conflict) with a
complete evidence trace instead of a guess.

### Root cause and conclusion (option B)

`c/syntara` must be an extensionless **Python CLI launcher**, and the committed
file was the build artifact that clobbered it. Evidence:

- `flake.nix` runs `python c/syntara convert --model ...`; its wrapper resolves
  engine binaries beside the launcher.
- `c/tests/test_launcher_dispatch.py`, `test_env_defaults.py` and
  `test_cli_output.py` load `c/syntara` as Python (`SourceFileLoader`) and
  assert `engine_for`/`model_arch`/`_EXE`; ci.yml `python` and
  `windows-python-focused` jobs run them.
- `c/Makefile` `install` (lines 2035-2036) installs plain `syntara` to BINDIR
  as the CLI and the compiled `syntara$(EXE)` to LIBEXECDIR as the engine —
  two roles, and on Unix `EXE` is empty so the engine build lands on the same
  path as the launcher.
- `.gitignore` ignores the other extensionless engine artifacts (`glm53`,
  `qwen36`) but deliberately not `syntara` — it is committed source.
- `.dockerignore` says the build needs "engine sources + launcher";
  `Dockerfile.slim` `ENTRYPOINT ["python3", "/app/syntara"]`; release.yml's
  verify stage imports `c/syntara` as Python and calls `engine_for()`.
- `docs/deepseek-v4.md` documents `syntara.cmd web|doctor ...` as entry points
  of the Python launcher that routes to the right engine.
- No definition of `engine_for`, `_EXE` or `_BANNER_MODELS` exists anywhere in
  the tree — they live inside the missing launcher. `model_arch` exists only
  in `c/openai_server.py` (line 2795).

The committed `c/syntara` was a 613,032-byte Linux x86-64 ELF (magic
`7F 45 4C 46`), i.e. the `make syntara` engine artifact parked on the launcher
path. Option A (launcher really is the engine, packaging wrong) is refuted by
the launcher contract; the still-missing piece is the Python CLI source itself.

### Changes in this pass

- `c/syntara.cmd` now routes through the Python launcher
  (`python "%~dp0syntara" %*`) instead of `syntara.exe` — the .exe is the
  engine, not a user entry point.
- Removed the committed ELF from `c/syntara` (a build artifact; regenerated by
  `make syntara`; `clean.py` already listed it as removable). The launcher path
  now faithfully reflects "missing launcher" instead of a clobbering binary.
- `c/.gitignore` now documents why `syntara` is deliberately not ignored.
- New `c/tools/check_launcher_contract.py`: static, dependency-free check that
  `c/syntara` exists, is not an ELF, has a python shebang, parses, and defines
  `engine_for`/`model_arch`/_EXE. Wired three ways: new `launcher-contract`
  job in `.github/workflows/ci.yml`, `make check-launcher` in `c/Makefile`
  (also added to `.PHONY`), and a build-time `ast` gate in
  `docker/Dockerfile.slim` that fails the image build while `/app/syntara`
  is not Python. None of these weaken the release.yml verify assertions —
  they enforce the same contract earlier.
- `desktop/src-tauri/Cargo.toml`: `tauri` now enables `default` + `tray-icon`
  features. `lib.rs` uses `tauri::tray`; `features = []` had disabled the Tauri
  defaults that provide `wry`/`tray-icon`/image decoding. `Cargo.lock` already
  resolves `tray-icon` and `wry`, so the manifest change is lock-stable.
- `docs/SPEC_COVERAGE_MATRIX.md` updated with explicit statuses.

### Still red (genuine, not sidestepped)

- The Python CLI launcher source is absent and must not be fabricated. Until it
  is restored: the `launcher-contract` check fails (intended), the c/ launcher
  tests fail, release verify fails, and the Docker build fails at the ast gate.
- `SYNTARA_ENGINE=/app/syntara` in Docker is self-referential until that
  launcher defines engine discovery (`Dockerfile.slim` lines 40-41: the built
  engine ELF is overwritten by the launcher at the same name).

### NOT RUN (host is Windows, no Rust/GCC/make; py is the only Python)

- `cargo check`/`cargo fmt` (deadline: desktop CI job on push/PR).
- `make check`/`make portable`/`make test-c`, and `make check-launcher`
  (the script itself runs; see Verifications).
- Executing `c/syntara` as Python (launcher absent).
- Docker build (no Docker on this host) and release packaging (GitHub only).

## Native/desktop, release and launcher-restore pass (0.4.3)

Closes the 0.4.2 flag: the Python CLI launcher was recovered from the upstream
`colibri-main.zip` tree and a 9-part report was assembled.

### Where the launcher came from (classification A)

The tree was decreed unrecoverable until `colibri-main.zip` surfaced in the
Windows `%TEMP%` copy of the machine the tree was copied off of. Extracted
`c/coli` (the upstream launcher, byte-for-byte what the clone once carried) at
`C:\Users\sarit\AppData\Local\Temp\opencode\colibri-recovery\c__coli`, with a
matching `c__coli.cmd`, `c__Makefile`, `docker__Dockerfile.slim`,
`.github__workflows__release.yml`, `c__tools__clean.py` and `flake.nix`.

### Reconstruction (recorded, not guessed)

`c/syntara` was written from `c__coli` by an ordered rename transformation
(`restore_launcher.py`), applied top-down so that generated names (and the
42-line command-string generator) only ever see parameters already renamed:

1. URL fixup: `JustVugg/colibri` → `NoirDemons/Syntara`.
2. `COLI_` → `SYNTARA_` (32 occurrences; engine passes itself the recorded
   `SYNTARA_*` variables, double-dash `--syntara-*` flags and help text).
3. `:coli build` → `:syntara build` (make tagline).
4. `Colibri` → `Syntara` (title-case prose), then `colibri` → `syntara`,
   then bare `coli` → `syntara` (paths and identifiers).
5. `<snap>/syntara.json`, `c/syntara.c`, `c/syntara.cmd` paths as upstream.

Post-rename fixups (upstream-state drift, byte-faithful otherwise):

- **KV magic**: the restored probe read `b"COLIKV1\0"` (upstream). The tree
  engine uses `"SYNTARAKV1\0"` (`c/kv_persist.h`), so the probe was set to
  match, or resume would never find the engine's saved `.syntara_kv`.
- **Engine-resolution self-guard + installed fallback**: the resolution block
  now refuses a sibling `syntara` whose `realpath` equals this script's own
  (the 0.4.2 failure mode), and after the `c/`-sibling checks falls back to
  `LIBEXECDIR`: `_ins_syntara` then `_ins_glm(_EXE)`. On POSIX the engine is
  plain `glm`; on Windows it is `syntara.exe`. `TOOLS` and `sys.path` adjust
  accordingly.
- **`--help` build hint** points at `make -C c syntara` (the alias).

`c/syntara.cmd` was restored the same way from `c__coli.cmd`: the full upstream
60-line wrapper (`SYNTARA_HERE`/`SYNTARA_PY`, `syntara` PV cmd) replaces the
0.4.2 8-line stub. `docs/ENVIRONMENT.md`, `docs/SPEC_COVERAGE_MATRIX.md`,
`CHANGELOG.md` and this file updated; no `docs/MODIFICATIONS.md` is tracked and
none was manufactured.

### The Unix filename collision, resolved with the design's own evidence

`c/syntara` is committed Python (launcher); the GLM engine built as plain
`syntara` on POSIX would land on that path. Instead of guessing, the split was
read out of the tree the launcher installs into:

- launcher resolution tries sibling `syntara` (guarded), sibling `glm`, then
  installed `syntara[_EXE]`/`glm[_EXE]` (written in the restored source);
- `family_registry.py` `process_names=("syntara","glm")` and
  `engine_aliases=("glm",)`;
- pre-#391 clean.py list kept `"glm","glm.exe"` (and `"syntara.exe"`) —
  so on POSIX the engine artifact always was `glm`, kept by the Makefile.

So the engine is name-split by build host: `syntara.exe` under Windows
(`_EXE=".exe"`), plain `glm` elsewhere, and `c/Makefile` now encodes that:

- `ENGINE_REAL = $(if $(EXE),syntara$(EXE),glm)`, defined after the platform
  chain and before `all:`; `all:`/big rule/`portable:`/`install:` build it.
- `make syntara` is kept as the platform-free alias (docs, CI hints, Docker
  build stage, `--help`) — `.PHONY` on every platform.
- `.PHONY: glm` only under `ifneq ($(EXE),)`; on POSIX `glm` is the real file
  target and must not be phony.
- `install:` stages the launcher under `$(BINDIR)/syntara` and the engine under
  `$(LIBEXECDIR)/$(ENGINE_REAL)`; on POSIX the launcher can resolve
  `libexec/syntara/glm`; on Windows the launcher resolves `syntara.exe`.
- DLL-host builds (`test_backend_loader.py`) use `EXE=_cudadll.exe` /
  `EXE=_hipdll.exe` overrides, which map onto `ENGINE_REAL` identically
  (`syntara_cudadll.exe`).

Downstreams follow:

- `c/tools/clean.py` drops the bare `"syntara"` entry (it is the committed
  launcher, never an artifact) and keeps `"syntara.exe"`, `"glm"`, `"glm.exe"`.
- `.github/workflows/release.yml`: build/`ls`/`cp`/`verify`/PYCHK are split on
  `matrix.ext` (`ENGINE=$([ .exe ] && echo syntara || echo glm)`); archives ship
  `c/syntara`, `c/syntara.cmd` and the engine.
- `.github/workflows/ci.yml`: the run sites that launch/nmap the engine
  (`ldd glm`, `./glm`, `nm glm`, two `./glm 64 16 16` oracle runs) now use the
  real name; `make syntara` sites keep working through the alias.
- `docker/Dockerfile.slim`: builds `/src/c/glm`, ships `/app/glm`, sets
  `SYNTARA_ENGINE=/app/glm` and `SYNTARA_DOCKER_GLM_ONLY=1`; the ast gate now
  asserts `/app/syntara` is Python AND `/app/glm` is ELF.
- `flake.nix`: engine stages as `lib/syntara/glm`; installCheck adds
  `test -x $out/lib/syntara/glm`; the `engine` app calls it directly.
- Contract tests were special-cased where the registry still names the GLM
  family by source stem `syntara`: `test_launcher_dispatch.py` accepts
  (`syntara|syntara.exe|glm|glm.exe`); `test_registry_engine_agreement.py`
  matches the `$(ENGINE_REAL):` rule only for the GLM artifact;
  `test_family_registry.py`'s build/install/CI/release coverage asserts the
  aliased build, `$(LIBEXECDIR)/$(ENGINE_REAL)` install, `glm` in clean, and
  `cp c/glm dist/glm` + `cp c/syntara dist/` in release;
  `test_makefile_deps.py` folds the `$(ENGINE_REAL):` rule back under the
  registered `syntara` build target so its header-prerequisite audit still
  covers the GLM engine.

### Verifications (real, on this host)

- `c/tools/check_launcher_contract.py`: OK (launcher present, non-ELF, shebang,
  parses, `engine_for`/`model_arch`/`_EXE` found).
- `py -3 -m unittest`: `test_launcher_dispatch`, `test_env_defaults`,
  `test_cli_output` — 71/71 OK; `test_registry_engine_agreement` — 2/2 OK;
  `test_makefile_deps` — 2/2 OK;
  `test_build_install_ci_and_release_cover_registered_engines` — OK.
- Full `unittest discover` (999 tests): 2 failures + 7 errors + 149 skips, all
  pre-existing/host-only (see Still red below); nothing introduced by this pass.
- The repository-root `audit10.py`: 7/7 PASS (python-compile-syntara, unittest-suite,
  cli-smoke incl. `--help` exit-2 on unknown command, json-validity,
  branding-no-old-name, required-files, no-generated-artifacts).
- Launcher head-state smoke: `GLM` resolves to `_LIBEXEC/syntara.exe` on this
  host (no engine built under `c/`), `_EXE=".exe"`, `TOOLS` under `_LIBEXEC`.
- `c/syntara.cmd` residual scan for `coli`/`COLI`: empty.

### Still red (pre-existing, untouched by this pass)

- `test_family_registry.py::test_every_readme_names_every_family` — no README
  names the `glm53` family display name (`GLM-5.3-Flash`).
- `test_family_registry.py::test_the_site_shows_the_version_and_every_family` —
  `site/index.html` no longer contains the `Currently shipping <b>v…</b>`
  marker. Both are documentation/site contracts unrelated to the launcher.
- 7 errors, all host-only and absent on CI (UTF-8 locale / enough disk):
  `test_glm53_cap_launch_source` (whole module) and
  `test_openai_tools_v41_e2e` (2 cases) call `.read_text()` without an
  encoding, so cp1252 chokes on the tree's UTF-8 files — in particular the
  first now reads the restored `c/syntara` and, under UTF-8, validates the
  glm53 `cap_for_launch` launch form it contains; `test_resource_plan`
  (3 cases) hits `OSError [Errno 28] No space left on device` writing
  safetensors fixtures to TEMP on this host.

### NOT RUN (host is Windows, no make/gcc/clang/rust/Docker/nix)

- `make` targets (alias `syntara`, `all`, `portable`, `install`,
  `check-launcher`, `clean`) and the engine run the launcher dispatches to.
- C/CUDA builds, `test-backend-loader`, `test-c`; OpenMP/no-GPU fallback paths.
- Docker build/run (incl. the new `/app/glm` ast gate) and nix build.
- Full GitHub Actions runs (`linux-python-focused`, `linux-gpu`, `musl`,
  CPU/CUDA Windows jobs, `launcher-contract`, desktop cargo, release packaging).
- So the Unix `make install` layout and release `glm` packaging remain
  verified-by-inspection only; the split is enforced by the tests above that
  read `Makefile`, `clean.py`, `ci.yml` and `release.yml` statically.
