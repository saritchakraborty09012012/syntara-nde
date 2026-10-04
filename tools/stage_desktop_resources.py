#!/usr/bin/env python3
"""Stage the resources the Syntara desktop installer bundles.

The site's download buttons hand users an installer, not the source tree
(.github/workflows/desktop-installers.yml). An installer that contains only a
shell is not what "download the app" means, so the bundle carries the runtime
the shell spawns, in two directories under `desktop/src-tauri/resources`:

    resources/app/      the `syntara` Python package plus the flat modules it
                        imports from c/ (openai_server, family_registry,
                        tools/...). This is what `resolve_pkg_root` in
                        desktop/src-tauri/src/host.rs resolves
                        (<root>/syntara/__main__.py) and what the host runs
                        with `python -m syntara ...`.
    resources/python/   CPython: the python.org embeddable zip on Windows
                        (python.exe + pythonw.exe, which `resolve_python`
                        looks for) and python-build-standalone `install_only`
                        on macOS and Linux (bin/python3).

Layout, not source: the copy is the reachable file set, not the repository.
c/tools/pack_python.py already computes what syntara reaches; the desktop
bundle reuses it rather than maintaining a second list that would rot the way
the hand-written one did (#1296).

Untracked extras are copied when they exist and skipped, loudly, when they do
not: `syntara/runtime/bin` holds the llama.cpp binaries (they are not in git),
so a CI checkout has none and a developer machine may have a full set.

Usage:
    stage_desktop_resources.py --repo .                    # stage
    stage_desktop_resources.py --repo . --check            # verify only
    stage_desktop_resources.py --repo . --skip-python      # offline/dev
"""

from __future__ import annotations

import argparse
import os
import pathlib
import shutil
import subprocess
import sys
import tarfile
import tempfile
import urllib.request
import zipfile

# Read rather than restate the pin the runtime reports, so the version this
# script tells a packager to install and the version
# syntara/runtime/llama_cpp.py expects at runtime cannot drift apart. The
# module's top-level imports are stdlib-only, so this costs nothing at build
# time and does not drag the runtime's dependencies into the staging run.
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))
from syntara.runtime.llama_cpp import PINNED_RELEASE  # noqa: E402

# Pinned, not "latest": an installer that suddenly changes interpreter
# version between two builds of the same tag is not reproducible, and a URL
# that 404s takes the whole release with it. python.org's embeddable zip is
# the route docs/experiments/phase1d-embed-cpython.md verified (including the
# hidden pythonw.exe the host spawns); python.org publishes no embeddable
# build for macOS or Linux, so those use python-build-standalone.
WINDOWS_PYTHON_VERSION = "3.12.10"
PBS_TAG = "20261001"
PBS_PYTHON_VERSION = "3.12.15"
PBS_TARGETS = {
    "darwin": "aarch64-apple-darwin",
    "linux": "x86_64-unknown-linux-gnu",
}

# What a staged bundle must contain before a bundler is allowed to run. Every
# entry is asserted by --check, because a green workflow that ships an app
# which cannot start a host is the failure mode this script exists to stop.
REQUIRED_PACKAGE_FILES = ("syntara/__main__.py", "syntara/cli.py", "syntara/library.py")

# tauri-build validates every `bundle.resources` path at build time and fails
# with "resource path `resources\app` doesn't exist" when one is missing, so
# the two directories are tracked (as .gitkeep) and re-created here after the
# staging wipes them. Without that, a developer who ran this script locally
# would see two deletions in `git status` for files the repo needs.
KEEP_FILE = ".gitkeep"


def _reset(directory: pathlib.Path) -> None:
    if directory.exists():
        shutil.rmtree(directory)
    directory.mkdir(parents=True)
    (directory / KEEP_FILE).touch()


def python_archive() -> tuple[str, str]:
    """(url, kind) for this platform's interpreter."""
    if sys.platform == "win32":
        return (
            f"https://www.python.org/ftp/python/{WINDOWS_PYTHON_VERSION}/"
            f"python-{WINDOWS_PYTHON_VERSION}-embed-amd64.zip",
            "zip",
        )
    target = PBS_TARGETS.get(sys.platform)
    if target is None:
        raise SystemExit(f"FAIL: no bundled interpreter is defined for {sys.platform}")
    return (
        "https://github.com/astral-sh/python-build-standalone/releases/download/"
        f"{PBS_TAG}/cpython-{PBS_PYTHON_VERSION}+{PBS_TAG}-{target}-install_only.tar.gz",
        "tar",
    )


def download(url: str, destination: pathlib.Path) -> None:
    print(f"[stage] downloading {url}")
    request = urllib.request.Request(url, headers={"User-Agent": "syntara-packager"})
    with urllib.request.urlopen(request, timeout=300) as response, \
            destination.open("wb") as handle:
        shutil.copyfileobj(response, handle)


def _without_archive_root(tf: tarfile.TarFile) -> list[tarfile.TarInfo]:
    """Drop the archive's own top-level directory from every member.

    python-build-standalone ships a `python/` root (the Windows zip is flat,
    which is why only this branch ever needed this). `extractall` does not
    strip it, so unpacking into `<out>/python` produced
    `<out>/python/python/bin/python3` while `resolve_python` and `check()` both
    look one level down - every macOS and Linux staging run died on "the staged
    desktop resources are incomplete". TarFile only grew `strip_components` in
    3.14 and this runs on whatever interpreter the runner has, so the prefix is
    removed from the members here instead.
    """
    members: list[tarfile.TarInfo] = []
    for member in tf.getmembers():
        root, _, name = member.name.partition("/")
        if not name:
            continue  # the root directory entry itself
        member.name = name
        # A hardlink's target is archive-root relative, so it needs the same
        # prefix removed; a symlink's target is relative to its own directory,
        # which stripping the root does not change.
        if (member.issym() or member.islnk()) and member.linkname.startswith(f"{root}/"):
            member.linkname = member.linkname[len(root) + 1:]
        members.append(member)
    return members


def stage_python(out: pathlib.Path) -> None:
    """Extract the interpreter into <out>/python.

    Windows' zip unpacks flat (python.exe sits next to python312.dll), which is
    exactly the layout `resolve_python` probes for. python-build-standalone
    ships its own `python/` root, so POSIX keeps <out>/python/bin/python3.
    """
    target = out / "python"
    _reset(target)
    url, kind = python_archive()
    with tempfile.TemporaryDirectory() as tmp:
        archive = pathlib.Path(tmp) / ("python.zip" if kind == "zip" else "python.tar.gz")
        download(url, archive)
        if kind == "zip":
            with zipfile.ZipFile(archive) as zf:
                zf.extractall(target)
            _point_path_file_at_the_app(target)
        else:
            with tarfile.open(archive) as tf:
                tf.extractall(target, members=_without_archive_root(tf), filter="data")
    print(f"[stage] interpreter staged at {target}")


def _point_path_file_at_the_app(python_dir: pathlib.Path) -> None:
    """Teach the embeddable interpreter where the package is.

    The Windows embeddable build ships `python312._pth`, and a `._pth` file
    REPLACES sys.path: PYTHONPATH and the current directory are ignored, so
    `python -m syntara` answered "No module named syntara" with the package
    sitting one directory up - verified, not assumed. The fix is a relative
    entry (resolved against the `_pth` file's own directory, so it survives
    being installed under "Program Files" or anywhere else).
    """
    pth = next(iter(sorted(python_dir.glob("python*._pth"))), None)
    if pth is None:
        raise SystemExit(f"FAIL: {python_dir} has no python*._pth file to extend")
    lines = pth.read_text(encoding="utf-8").splitlines()
    entry = os.path.join("..", "app")
    if entry not in lines:
        lines.append(entry)
        pth.write_text("\n".join(lines) + "\n", encoding="utf-8")


def backend_binary() -> pathlib.Path:
    """Where discover_binary() expects the server inside a staged bundle.

    Relative to the staged app root, so callers join it under `app`
    themselves rather than double-counting that prefix.

    Mirrors BIN_NAME in syntara/runtime/llama_cpp.py; the two are asserted
    against each other by the packaging tests so they cannot drift.
    """
    name = "llama-server.exe" if sys.platform == "win32" else "llama-server"
    return pathlib.Path("syntara") / "runtime" / "bin" / name


def stage_app(repo: pathlib.Path, out: pathlib.Path,
              require_backend: bool = False) -> None:
    """Copy the python package and the flat c/ modules into <out>/app."""
    app = out / "app"
    _reset(app)

    # The package the host actually imports. `tests` and `__pycache__` are
    # skipped: neither is reachable at runtime and both grow the installer.
    shutil.copytree(
        repo / "syntara",
        app / "syntara",
        ignore=shutil.ignore_patterns("__pycache__", "tests", "*.pyc"),
    )

    # The flat modules under c/ (openai_server.py, family_registry.py, the
    # tools/ scripts). pack_python computes that set from the imports, so the
    # bundle cannot drift from the code the way a hand-written list did.
    subprocess.run(
        [sys.executable, str(repo / "c" / "tools" / "pack_python.py"),
         str(repo / "c"), str(app)],
        check=True,
    )

    # llama.cpp binaries for the host runtime. Untracked by design, so this is
    # optional for a developer running the app from source - but a *published
    # installer* must carry them, and that is what --require-backend enforces.
    # Shipping an installer that installs cleanly and then cannot serve a
    # model is the failure this replaces: see the "NOTE" this used to print,
    # which every installer run emitted while still publishing the bundle.
    runtime_bin = repo / "syntara" / "runtime" / "bin"
    if runtime_bin.is_dir():
        shutil.copytree(runtime_bin, app / "syntara" / "runtime" / "bin", dirs_exist_ok=True)
        print(f"[stage] llama.cpp runtime copied from {runtime_bin}")
    elif require_backend:
        print(
            "FAIL: syntara/runtime/bin is absent, so this bundle would install "
            "without an inference backend.\n"
            "  Run tools/fetch_llama_cpp.py first (it installs the pinned\n"
            f"  llama.cpp {PINNED_RELEASE} payload there), or set\n"
            "  SYNTARA_LLAMA_BIN if you are pointing at your own build."
        )
        raise SystemExit(1)
    else:
        print(
            "[stage] NOTE: syntara/runtime/bin is absent (it is not tracked); "
            "the bundle will not ship llama.cpp binaries"
        )
    print(f"[stage] python package staged at {app}")


def interpreters(out: pathlib.Path) -> tuple[pathlib.Path, pathlib.Path]:
    """The staged interpreter's preferred and fallback paths for this platform.

    Split out of missing_pieces so the presence rule can be tested without
    staging a real interpreter.
    """
    root = out / "python"
    if sys.platform == "win32":
        return root / "pythonw.exe", root / "python.exe"
    return root / "bin" / "python3", root / "python3"


def missing_pieces(out: pathlib.Path, require_backend: bool = False) -> list[str]:
    """Every file the staged tree must contain before it may be bundled.

    Split out of check() because the rules are the contract the installer
    build depends on, and a rule that can only be exercised by staging a whole
    bundle is a rule nobody tests.
    """
    app = out / "app"
    missing = [name for name in REQUIRED_PACKAGE_FILES if not (app / name).is_file()]
    where, fallback = interpreters(out)
    if not (where.is_file() or fallback.is_file()):
        missing.append(str(where.relative_to(out)))
    if require_backend and not (app / backend_binary()).is_file():
        missing.append(str(backend_binary()))
    return missing


def check(out: pathlib.Path, require_backend: bool = False) -> int:
    """Assert the staged tree can actually run the host."""
    app = out / "app"
    missing = missing_pieces(out, require_backend)
    where, fallback = interpreters(out)
    if not missing:
        # Presence is not enough: run the bundled interpreter against the
        # bundled package. This is the same command the desktop host builds
        # (`python -m syntara ...` with PYTHONPATH at the package root), so a
        # bundle that cannot import its own package fails here instead of in
        # a user's terminal after the install finished.
        run = [str(where if where.is_file() else fallback), "-c",
               "import syntara, openai_server; print('bundle ok')"]
        probe = subprocess.run(run, cwd=app, env={**os.environ,
                                                   "PYTHONPATH": str(app),
                                                   "PYTHONNOUSERSITE": "1"},
                               capture_output=True, text=True)
        if probe.returncode != 0:
            print("FAIL: the bundled interpreter cannot import the bundled package:")
            print((probe.stderr or probe.stdout).strip()[:2000])
            return 1
        print("[stage] bundle probe:", probe.stdout.strip())
    if missing:
        print("FAIL: the staged desktop resources are incomplete:")
        for name in missing:
            print(f"  {name}")
        print("Run tools/stage_desktop_resources.py before bundling.")
        return 1
    print(f"OK: staged desktop resources at {out} carry the package and an interpreter")
    return 0



def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo", default=".", help="repository root (default: .)")
    parser.add_argument("--out", default=None,
                        help="resources directory (default: <repo>/desktop/src-tauri/resources)")
    parser.add_argument("--skip-python", action="store_true",
                        help="do not download the interpreter (offline dev runs)")
    parser.add_argument("--require-backend", action="store_true",
                        help="fail unless a llama.cpp server binary is staged; "
                             "use this when the tree is going to be published, "
                             "not when running the app from source")
    parser.add_argument("--check", action="store_true",
                        help="only verify an already staged tree")
    args = parser.parse_args(argv[1:])

    repo = pathlib.Path(args.repo).resolve()
    out = pathlib.Path(args.out).resolve() if args.out else repo / "desktop" / "src-tauri" / "resources"
    out.mkdir(parents=True, exist_ok=True)

    if args.check:
        return check(out, require_backend=args.require_backend)
    stage_app(repo, out, require_backend=args.require_backend)
    if not args.skip_python:
        stage_python(out)
    return check(out, require_backend=args.require_backend)


if __name__ == "__main__":
    sys.exit(main(sys.argv))
