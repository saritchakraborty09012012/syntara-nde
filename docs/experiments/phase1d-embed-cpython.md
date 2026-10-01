# Phase 1d — embedded-CPython packaging verification (Windows)

**Status:** verified 2026-10-01 on Windows 10/11 (this host), Python 3.12.0.
**Why first:** the host track (Phase 1b/1c) is built on a desktop shell that
spawns a hidden `pythonw.exe`. If packaging cannot be proven, the host
architecture changes — so it was proven before any host code was written.

## What was tested

| Route | Artifact | Command contract |
|---|---|---|
| **A — embeddable zip** (primary) | `python-3.12.0-embed-amd64.zip` extracted, `python312._pth` with `import site` left commented | `python.exe script.py` and hidden `pythonw.exe script.py` |
| **A3 — embeddable + pip** (dependency path) | same zip, `import site` enabled, `get-pip.py`, one pure-Python dep installed | `python.exe -c "import packaging"` |
| **B — PyInstaller onedir** (fallback) | `pyinstaller --onedir` bundle, 20.4 MB | `host_smoke.exe` |

All runs used a **stripped environment**: `PATH` contains only
`%SystemRoot%\System32;%SystemRoot%` (no system Python), `PYTHONHOME` and
`PYTHONPATH` unset — proving the bundle does not lean on the host machine's
Python installation.

## The probe

`tools/packaging_smoke.py` is the exact probe used (kept in-repo so the
verification is reproducible). It writes `smoke_result.json` next to itself
(under `pythonw.exe` there is no console, so the file is the contract) and
exits 0 only if every check passes:

1. interpreter comes from the bundle (`python312._pth` present, or `frozen`)
2. site isolation (embed route: `ENABLE_USER_SITE is None`, no
   `site-packages` on `sys.path`)
3. stdlib imports the host needs (`json`, `http.server`, `ssl`, `asyncio`)
4. `sqlite3` round-trip (its DLL must resolve from the bundle)
5. TLS context builds
6. subprocess of the bundled `python.exe` (embed route only)
7. asyncio event loop runs
8. a localhost HTTP server binds an ephemeral port and answers (gateway smoke)
9. environment purity (`PYTHONHOME`/`PYTHONPATH` empty) + temp-dir writability

## Results

| Route | Exit | Checks |
|---|---|---|
| A `python.exe` | 0 | 9/9 OK |
| A2 `pythonw.exe` (hidden) | 0 | 9/9 OK |
| A3 embed + pip + `packaging` | 0 | import resolved from the bundle's own `Lib\site-packages` |
| B PyInstaller onedir | 0 | 7 OK + 2 frozen-mode n/a (site isolation / bundled-interpreter checks do not apply to frozen bundles) |

## Decision

- **Primary host packaging = embeddable zip route**: it matches the
  approved architecture (desktop shell spawns a hidden `pythonw.exe`), keeps
  the interpreter inspectable/patchable, and keeps app code as normal
  Python files. Site stays disabled for the runtime image; the proven A3
  path (enable site + pip) is available if a dependency is ever genuinely
  required.
- **PyInstaller onedir stays the fallback** if the embed route hits an
  unblockable blocker during Tauri sidecar integration (SmartScreen/code
  signing behaviour of onefile bundles is a known risk; onedir was used for
  that reason).

## Not covered (honestly out of scope for 1d)

- Tauri sidecar wiring and process lifecycle (Phase 1b/2 integration).
- Real GGUF host code inside the bundle (Phase 1a output will be re-probed
  with this same script once the host exists).
- Codesigning / SmartScreen reputation (release engineering, Phase 5).
- Non-Windows packaging (macOS `.app`/Linux builds — Phase 5 cross-platform
  pass); the embeddable-zip mechanism is Windows-specific by design.

## Reproduce

```powershell
# 1. embeddable route
Invoke-WebRequest https://www.python.org/ftp/python/3.12.0/python-3.12.0-embed-amd64.zip -OutFile embed.zip
Expand-Archive embed.zip embed
$env:PATH="$env:SystemRoot\System32;$env:SystemRoot"
Remove-Item Env:PYTHONHOME,Env:PYTHONPATH -ErrorAction SilentlyContinue
& embed\python.exe tools\packaging_smoke.py   # expect exit 0 + smoke_result.json

# 2. pyinstaller route
python -m venv venv; venv\Scripts\pip install pyinstaller
venv\Scripts\pyinstaller --onedir --noconfirm tools\packaging_smoke.py
& dist\packaging_smoke\packaging_smoke.exe     # expect exit 0
```
