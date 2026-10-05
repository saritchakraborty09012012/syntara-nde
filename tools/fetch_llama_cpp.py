#!/usr/bin/env python3
"""Fetch the pinned llama.cpp server that Syntara's GGUF runtime drives.

Why this exists in Python rather than only as tools/fetch_llama_cpp.ps1: the
desktop installer bundles this binary, and the installer is built on three
operating systems. The PowerShell script hard-errored on anything but Windows
("build llama.cpp from source and set SYNTARA_LLAMA_BIN"), so the macOS and
Linux installers shipped with no inference backend at all - every installer
workflow run printed the staging script's "the bundle will not ship llama.cpp
binaries" note and produced an app whose host died at
`RuntimeNotAvailable: the GGUF runtime binary is not installed`.

The pins live here and the PowerShell script now calls this module, so there
is one list of URLs and checksums rather than two that drift (the failure mode
that produced #1296 for the Python payload).

The server executable is a small stub that loads companion shared libraries
(llama-server-impl, llama, ggml, mtmd, libomp), so the whole flat payload
beside it is installed - pruning "unneeded" files by hand is how a backend
that starts on the build machine stops starting on a user's.

Treating the archive as untrusted input (AGENTS S59/S62): the SHA-256 is
checked before anything is extracted, member names are validated against
absolute paths and traversal, and only files directly beside the server
binary are taken.

Usage:
    tools/fetch_llama_cpp.py                      # fetch for this machine
    tools/fetch_llama_cpp.py --force              # re-download
    tools/fetch_llama_cpp.py --from-archive f.tgz # offline, still checksummed

Nothing from llama.cpp is vendored in this repository; see
THIRD_PARTY_NOTICES.md for the licence.
"""

from __future__ import annotations

import argparse
import hashlib
import pathlib
import platform
import shutil
import subprocess
import sys
import tarfile
import tempfile
import urllib.request
import zipfile

# Pinned, not "latest": two builds of the same tag that ship different
# inference engines are not reproducible, and a URL that moves takes the
# release with it. Also the release syntara/runtime/llama_cpp.py reports as
# PINNED_RELEASE, so the two must be changed together.
RELEASE = "b11321"

# (sys.platform, canonical arch) -> (archive name, sha256)
#
# The canonical arch comes from _normalize_machine, not from platform.machine()
# directly: CPython reports "AMD64" (upper-case) on Windows, not "x86_64", so
# keying these on the raw string silently misses on the Windows runner and
# ships the bundle without a backend - the same defect this script fixes.
ARCHIVES = {
    ("win32", "x64"): (
        f"llama-{RELEASE}-bin-win-cpu-x64.zip",
        "8f8c0c6501b075f52deff59537c05acd57d8621a0a7935f29b7d7c4812892569",
    ),
    ("darwin", "arm64"): (
        f"llama-{RELEASE}-bin-macos-arm64.tar.gz",
        "5f47ffa4de936853004e7403a09d87616022e5af16651d71fc66a96b261886fb",
    ),
    ("linux", "x64"): (
        f"llama-{RELEASE}-bin-ubuntu-x64.tar.gz",
        "b53d1a8fc0e31752d0309172e711c7bc8c0c11f9f1d6607766a6ac880da6badc",
    ),
}

# Every spelling of one machine that appears in practice across CPython builds,
# musl toolchains and the Linux kernel's own naming.
_ARCH_ALIASES = {
    "amd64": "x64",
    "x86_64": "x64",
    "x64": "x64",
    "arm64": "arm64",
    "aarch64": "arm64",
}

BASE_URL = f"https://github.com/ggml-org/llama.cpp/releases/download/{RELEASE}"

# CPU-only builds on purpose. A GPU build is 10-20x larger, and the desktop
# runtime has no way to select a backend at install time; a CPU build runs
# everywhere, and the hardware backends belong in the app's own detection
# layer rather than in the packaging (AGENTS S13).

_DOWNLOAD_TIMEOUT = 600


class FetchError(Exception):
    """A reason the backend cannot be installed."""


def server_name(sys_platform: str) -> str:
    """Matches BIN_NAME in syntara/runtime/llama_cpp.py, which is what
    discover_binary() looks for. If one moves, both move.

    Derived from the platform being installed for rather than from the host,
    so `--platform linux` extracts llama-server rather than looking for
    llama-server.exe.
    """
    return "llama-server.exe" if sys_platform == "win32" else "llama-server"


def target_dir(repo: pathlib.Path) -> pathlib.Path:
    """The directory discover_binary() probes: <repo>/syntara/runtime/bin."""
    return repo / "syntara" / "runtime" / "bin"


def _normalize_machine(machine: str) -> str:
    """Fold platform.machine()'s spelling onto ARCHIVES' canonical arch."""
    return _ARCH_ALIASES.get(machine.strip().lower(), machine.strip().lower())


def select(sys_platform: str, machine: str) -> tuple[str, str]:
    """(archive name, sha256) for a platform, or explain what to do instead."""
    arch = _normalize_machine(machine)
    try:
        return ARCHIVES[(sys_platform, arch)]
    except KeyError:
        raise FetchError(
            f"no pinned llama.cpp {RELEASE} build for {sys_platform}/{arch}. "
            "Build llama.cpp from source (https://github.com/ggml-org/llama.cpp) "
            f"and set SYNTARA_LLAMA_BIN to the resulting "
            f"{server_name(sys_platform)}; "
            "syntara/runtime/llama_cpp.py reads that variable before any "
            "bundled path."
        ) from None


def sha256_of(path: pathlib.Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def download(url: str, destination: pathlib.Path) -> None:
    print(f"[llama] downloading {url}")
    request = urllib.request.Request(url, headers={"User-Agent": "syntara-packager"})
    with urllib.request.urlopen(request, timeout=_DOWNLOAD_TIMEOUT) as response, \
            destination.open("wb") as handle:
        shutil.copyfileobj(response, handle)


def _reject_unsafe(name: str) -> str:
    """Validate an archive member name and return it in normalised form.

    The pinned archives are flat payloads under one root, so anything with an
    interior `..`, an absolute path, a drive letter or a backslash is a layout
    change or an attack, and both deserve a loud failure rather than a
    best-effort extraction.
    """
    if "\\" in name:
        raise FetchError(f"archive member has a backslash: {name!r}")
    if name.startswith("/") or pathlib.PurePosixPath(name).is_absolute():
        raise FetchError(f"archive member is an absolute path: {name!r}")
    parts = pathlib.PurePosixPath(name).parts
    if any(part == ".." for part in parts):
        raise FetchError(f"archive member escapes the destination: {name!r}")
    # PurePosixPath calls "C:/Windows/system32" relative, because a tar spec
    # has no drive letters - but the destination here may be a Windows
    # filesystem, where that name is absolute and would escape the payload
    # directory. zipfile strips it silently, which is not loud enough.
    if parts and len(parts[0]) >= 2 and parts[0][1] == ":":
        raise FetchError(f"archive member carries a drive letter: {name!r}")
    return "/".join(parts)


def _payload_prefix(names: list[str], server: str) -> str:
    """The directory the payload sits in, from the server binary's location.

    llama.cpp's Windows zip is flat; the POSIX tarballs nest everything under a
    `llama-<release>/` root. Deriving the prefix from where the server binary
    actually is handles both without hard-coding either layout, and fails
    loudly if the server binary is not at the top of its own directory.
    """
    owners = [n for n in names if pathlib.PurePosixPath(n).name == server]
    if not owners:
        raise FetchError(
            f"the pinned archive has no {server}; the URL or the release "
            "layout changed and this script's pins need re-checking"
        )
    parents = {str(pathlib.PurePosixPath(n).parent) for n in owners}
    if len(parents) != 1:
        raise FetchError(
            f"{server} appears in more than one directory ({sorted(parents)}); "
            "refusing to guess which payload is the runtime"
        )
    parent = parents.pop()
    if parent in (".", "/"):
        return ""
    return parent + "/"


def extract_zip(archive: pathlib.Path, dest: pathlib.Path, server: str) -> None:
    with zipfile.ZipFile(archive) as zf:
        infos = zf.infolist()
        prefix = _payload_prefix([_reject_unsafe(i.filename) for i in infos], server)
        picked = 0
        for info in infos:
            name = _reject_unsafe(info.filename)
            if info.is_dir():
                continue
            if not name.startswith(prefix):
                continue
            # Directly beside the server binary, not nested deeper: those
            # would be samples, licences or a second copy of the payload.
            if name[len(prefix):].find("/") >= 0:
                continue
            out = dest / name[len(prefix):]
            out.parent.mkdir(parents=True, exist_ok=True)
            with zf.open(info) as src, out.open("wb") as dst:
                shutil.copyfileobj(src, dst)
            picked += 1
    if not picked:
        raise FetchError(f"no payload files were extracted from {archive.name}")


def extract_tar(archive: pathlib.Path, dest: pathlib.Path, server: str) -> None:
    with tarfile.open(archive) as tf:
        members = tf.getmembers()
        names = [_reject_unsafe(m.name) for m in members]
        prefix = _payload_prefix(names, server)
        picked = 0
        # Links are resolved after the loop, so a link may point at a sibling
        # that has not been written yet.
        links: list[tuple[pathlib.Path, str]] = []
        for member, name in zip(members, names):
            if not name.startswith(prefix):
                continue
            if name[len(prefix):].find("/") >= 0:
                continue
            out = dest / name[len(prefix):]
            if member.issym() or member.islnk():
                links.append((out, member.linkname))
                continue
            if not member.isfile():
                continue
            source = tf.extractfile(member)
            if source is None:
                continue
            out.parent.mkdir(parents=True, exist_ok=True)
            with source, out.open("wb") as handle:
                shutil.copyfileobj(source, handle)
            # Deliberately not tarfile.extract(filter="data"): the `filter`
            # keyword only exists on CPython >=3.11.4, and macos-latest still
            # puts Xcode's 3.9 `python3` on PATH ahead of any newer build, which
            # made both POSIX legs fail with a TypeError on a keyword the Windows
            # leg never reaches because Windows ships a zip. Member names are
            # already validated individually above, so the filter was redundant.
            #
            # extract() would have applied the member's mode, so the exec bit has
            # to be set explicitly: without it the server binary installs
            # present-but-unrunnable and dies at exec() with EACCES.
            if member.mode & 0o100:
                out.chmod(0o755)
            picked += 1
        # Repeated until no further progress, because the payloads chain links:
        # libggml.dylib -> libggml.0.dylib -> libggml.0.25.3.dylib, and the
        # middle link is stored after the one that needs it.
        root = dest.resolve()
        pending = list(links)
        while pending:
            deferred = []
            progress = 0
            for out, linkname in pending:
                # A tar symlink's linkname is relative to the link's own
                # directory, not the destination, so it is resolved from
                # out.parent. Every link in these payloads points at a sibling;
                # anything resolving outside the payload root is refused rather
                # than followed, so an archive cannot make the installer read or
                # expose a path outside it (AGENTS S59/S62).
                base = out.parent.resolve()
                target = base / linkname
                if base != root or root not in target.resolve().parents:
                    raise FetchError(
                        f"archive member {out.name} links outside the payload "
                        f"directory ({linkname}); refusing to create it"
                    )
                if not target.exists():
                    deferred.append((out, linkname))
                    continue
                if out.exists() or out.is_symlink():
                    out.unlink()
                try:
                    out.symlink_to(target.name)
                except (OSError, NotImplementedError) as problem:
                    # Creating a symlink needs a privilege Windows does not
                    # grant by default, and this script also runs on a Windows
                    # dev box. Copying the real file gives an equivalent
                    # payload: the dlopen'd library is the same bytes either way.
                    print(f"[llama] symlink {out.name} -> {target.name} "
                          f"unavailable ({problem}); copying instead")
                    shutil.copy2(target, out)
                progress += 1
            picked += progress
            if not progress:
                raise FetchError(
                    "archive links point outside the payload or at members it "
                    f"does not contain: {sorted(str(o.name) for o, _ in deferred)[:5]}"
                    "; the pinned layout changed and this script's handling of "
                    "it needs re-checking"
                )
            pending = deferred
    if not picked:
        raise FetchError(f"no payload files were extracted from {archive.name}")


def smoke_test(binary: pathlib.Path) -> str:
    """Run `<server> --version`.

    Proves the stub can actually load the companion libraries beside it, which
    is the failure this whole script exists to prevent. A backend that is
    present but unloadable is the same defect as one that is missing.
    """
    try:
        # Bytes, not text=True: llama.cpp's banner is ASCII today, but a
        # stray non-UTF-8 byte in stderr would raise UnicodeDecodeError out of
        # subprocess and surface as a traceback instead of a reason.
        done = subprocess.run(
            [str(binary), "--version"],
            capture_output=True, timeout=120,
        )
    except (OSError, subprocess.SubprocessError) as problem:
        raise FetchError(
            f"{binary} could not be launched ({problem}); the companion "
            "libraries beside it may not have been extracted, or the file lost "
            "its executable bit"
        ) from None
    output = _text(done.stdout) or _text(done.stderr)
    if done.returncode != 0:
        raise FetchError(
            f"{binary} --version exited {done.returncode}: {output[:400]}"
        )
    # Guarded rather than splitlines()[0]: a successful run that printed
    # nothing used to raise IndexError, i.e. an unexplained traceback instead
    # of "this binary is not a usable backend".
    first = next((line.strip() for line in output.splitlines() if line.strip()), "")
    if not first:
        raise FetchError(
            f"{binary} --version exited 0 but printed nothing; this is not a "
            "usable llama.cpp server, so refusing to ship it"
        )
    return first


def _text(raw: bytes | None) -> str:
    """Decode captured output without ever raising on undecodable bytes."""
    if not raw:
        return ""
    return raw.decode("utf-8", "replace").strip()


def install(repo: pathlib.Path, *, force: bool = False,
            archive_path: pathlib.Path | None = None,
            sys_platform: str | None = None,
            machine: str | None = None) -> pathlib.Path:
    """Install the pinned backend into <repo>/syntara/runtime/bin."""
    sys_platform = sys_platform or sys.platform
    machine = machine or platform.machine()
    name, expected = select(sys_platform, machine)
    server = server_name(sys_platform)
    dest = target_dir(repo)
    binary = dest / server

    if binary.is_file() and not force and archive_path is None:
        print(f"[llama] already installed: {binary} (use --force to re-fetch)")
        return binary

    dest.mkdir(parents=True, exist_ok=True)
    if archive_path is None:
        with tempfile.TemporaryDirectory() as tmp:
            archive = pathlib.Path(tmp) / name
            download(f"{BASE_URL}/{name}", archive)
            _verify(archive, expected, name)
            _clear(dest)
            _extract(archive, dest, name, server)
    else:
        _verify(archive_path, expected, name)
        _clear(dest)
        _extract(archive_path, dest, name, server)

    if not binary.is_file():
        raise FetchError(
            f"{binary} is missing after extracting {name}; the archive layout "
            "changed and this script's handling of it needs re-checking"
        )
    # Only meaningful for the host's own platform: --platform exists so the
    # other two layouts can be exercised from one machine, and a foreign
    # binary cannot be executed here. Both sides normalised, because
    # platform.machine() is "AMD64" here and "x86_64" on the Linux runner.
    native = (sys_platform == sys.platform
              and _normalize_machine(machine) == _normalize_machine(platform.machine()))
    if native:
        print(f"[llama] {smoke_test(binary)}")
    else:
        print(f"[llama] {name} payload staged for {sys_platform}/{machine} "
              "(smoke test skipped: not this machine's platform)")
    print(f"[llama] installed: {binary}")
    return binary


def _verify(archive: pathlib.Path, expected: str, name: str) -> None:
    # Checked before hashing so a mistyped --from-archive reads as the mistake
    # it is, rather than as a FileNotFoundError traceback from pathlib.
    if not archive.is_file():
        raise FetchError(
            f"{archive} does not exist; --from-archive needs the pinned "
            f"{name}, which is downloaded from {BASE_URL}"
        )
    actual = sha256_of(archive)
    if actual != expected:
        raise FetchError(
            f"{name} checksum mismatch - refusing to extract.\n"
            f"  expected: {expected}\n  actual:   {actual}\n"
            "The download was corrupted or the pin is stale; do not proceed "
            "until this is explained."
        )
    print(f"[llama] checksum ok ({name})")


def _clear(dest: pathlib.Path) -> None:
    """Empty the destination so a stale library cannot outlive its binary.

    An older pin's ggml-cpu-*.dll left behind next to a newer llama-server is
    a runtime crash that reproduces nowhere else, so the directory is rebuilt
    rather than merged into.
    """
    for entry in dest.iterdir():
        if entry.is_dir():
            shutil.rmtree(entry)
        else:
            entry.unlink()


def _extract(archive: pathlib.Path, dest: pathlib.Path, name: str,
             server: str) -> None:
    if name.endswith(".zip"):
        extract_zip(archive, dest, server)
    elif name.endswith(".tar.gz"):
        extract_tar(archive, dest, server)
    else:
        raise FetchError(f"unknown archive kind for {name}")


def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo", default=None,
                        help="repository root (default: the parent of tools/)")
    parser.add_argument("--force", action="store_true",
                        help="re-download even when a backend is already present")
    parser.add_argument("--from-archive", default=None,
                        help="install from a local archive instead of "
                             "downloading (still checksum-verified)")
    parser.add_argument("--dest", default=None,
                        help="install directory (default: "
                             "<repo>/syntara/runtime/bin)")
    # Overridable so the extraction of all three pinned layouts can be tested
    # from one machine; the pins are still keyed on the real platform.
    parser.add_argument("--platform", default=None, help=argparse.SUPPRESS)
    parser.add_argument("--machine", default=None, help=argparse.SUPPRESS)
    args = parser.parse_args(argv[1:])

    repo = pathlib.Path(args.repo).resolve() if args.repo \
        else pathlib.Path(__file__).resolve().parent.parent
    try:
        binary = install(
            repo,
            force=args.force,
            archive_path=pathlib.Path(args.from_archive).resolve()
            if args.from_archive else None,
            sys_platform=args.platform,
            machine=args.machine,
        )
    except FetchError as problem:
        print(f"FAIL: {problem}")
        return 1
    if args.dest:
        wanted = pathlib.Path(args.dest).resolve()
        wanted.mkdir(parents=True, exist_ok=True)
        server = server_name(args.platform or sys.platform)
        shutil.copy2(binary, wanted / server)
        print(f"[llama] also copied to {wanted / server}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))