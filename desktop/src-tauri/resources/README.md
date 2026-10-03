# Bundled resources (generated)

Everything in this directory is produced by

```text
python3 tools/stage_desktop_resources.py --repo .
```

and is **not** tracked in git. The installer workflow
(`.github/workflows/desktop-installers.yml`) runs that script before
`tauri build`, and the script's `--check` mode executes the bundled
interpreter against the bundled package, so a payload that cannot start the
local host fails the build instead of the user's machine.

| Path | What it is | Read by |
|---|---|---|
| `app/` | The `syntara` Python package plus the flat modules it imports from `c/` (`openai_server.py`, `family_registry.py`, `tools/…`). | `resolve_pkg_root()` in `src/host.rs`, which spawns `python -m syntara serve …` |
| `python/` | CPython: the python.org embeddable build on Windows (`python.exe` + `pythonw.exe`), python-build-standalone `install_only` on macOS and Linux (`bin/python3`). | `resolve_python()` in `src/host.rs` |

Two details that are easy to get wrong and are therefore asserted rather than
documented:

- The Windows embeddable build ships `python312._pth`, which **replaces**
  `sys.path`: `PYTHONPATH` and the current directory are ignored, so the
  staging script appends a relative `../app` entry. Without it
  `python -m syntara` answers "No module named syntara" with the package
  sitting one directory up.
- `syntara/runtime/bin` (the llama.cpp binaries) is not tracked either. The
  staging script copies it when it exists and says so loudly when it does not.

Only this README is tracked, so a fresh clone has the directory the
`tauri.conf.json` resource mapping points at.