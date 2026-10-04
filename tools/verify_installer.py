#!/usr/bin/env python3
"""Refuse to publish a release asset that is not the installer it claims to be.

The website's download buttons resolve
`releases/latest/download/Syntara-Windows-x64-Setup.exe`
(site/src/lib/releases.ts). Whatever is published under that name is what
every Windows user runs, and the release job's only check was that *a* file
of the right name existed - which says nothing about what is inside it.

That gap shipped on v1.0.1. The build step searched the whole cargo target
tree for `*.exe` and took the first hit, which was a build script belonging
to one of the dependencies' crates: 302,592 bytes, no NSIS header, no version
resource, and on launch it printed
`Environment variable $RUSTC is not set during execution of build script`
and exited. Three green jobs published it, and the failure only surfaced on a
user's machine.

So the artifact is inspected rather than trusted. Each container format has a
signature that says what it is, and this script requires that signature:

    nsis       a PE that carries NSIS's uncompressed first header - the
               0xDEADBEEF magic plus the "NullsoftInst" signature string.
               Both were confirmed present in real NSIS installers and
               absent from the impostor; see the note on _find_nsis_header.
    dmg        a UDIF disk image: the final 512 bytes are the `koly` trailer.
    appimage   an ELF whose bytes 8-9 are the "AI" type marker.

A minimum size is asserted as well. The signatures above are the real gate;
the floor is the cheap second net for an artifact that has the right magic and
no payload, and it is set far below the real installers (56 MB for the dmg,
151 MB for the AppImage) so it cannot fail a legitimate build.

Usage:
    verify_installer.py --kind nsis path/to/setup.exe
    verify_installer.py --kind appimage path/to/AppImage
"""

from __future__ import annotations

import argparse
import pathlib
import sys

# Below this, the file cannot be a Syntara installer whatever its magic says.
# The smallest real artifact in this repository is the macOS dmg at ~56 MB;
# 5 MiB leaves an order of magnitude of headroom for a leaner future build
# while still rejecting the 302 KB impostor by a factor of seventeen.
MIN_BYTES = 5 * 1024 * 1024

# NSIS writes its first header uncompressed at the start of the compressed
# data block, immediately after the PE image, and 7-Zip finds it by scanning.
# Both markers are required: the 4-byte magic is short enough to occur by
# chance in a multi-megabyte binary, while "NullsoftInst" appearing in a file
# that is not an NSIS installer is not a thing that happens.
NSIS_MAGIC = b"\xef\xbe\xad\xde"
NSIS_SIGNATURE = b"NullsoftInst"

# The UDIF trailer is exactly one 512-byte sector at the end of the image.
DMG_TRAILER_BYTES = 512
DMG_MAGIC = b"koly"

APPIMAGE_ELF = b"\x7fELF"
APPIMAGE_TYPE_OFFSET = 8
APPIMAGE_TYPE = b"AI"

# Streamed rather than read whole: the AppImage is 151 MB and this runs in a
# build step that has no reason to hold a copy in memory.
_CHUNK = 1024 * 1024


class Problem(Exception):
    """A reason this file is not the installer it was published as."""


def _scan_nsis(path: pathlib.Path) -> tuple[int, int]:
    """Return (magic_offset, signature_offset), -1 where absent.

    Scanned in overlapping chunks so a marker straddling a chunk boundary is
    still found, without holding the file in memory.
    """
    magic_at = -1
    sig_at = -1
    overlap = max(len(NSIS_MAGIC), len(NSIS_SIGNATURE)) - 1
    with path.open("rb") as handle:
        base = 0
        tail = b""
        while True:
            chunk = handle.read(_CHUNK)
            if not chunk:
                break
            window = tail + chunk
            if magic_at < 0:
                found = window.find(NSIS_MAGIC)
                if found >= 0:
                    magic_at = base - len(tail) + found
            if sig_at < 0:
                found = window.find(NSIS_SIGNATURE)
                if found >= 0:
                    sig_at = base - len(tail) + found
            if magic_at >= 0 and sig_at >= 0:
                break
            base += len(chunk)
            tail = window[-overlap:] if overlap else b""
    return magic_at, sig_at


def _verify_nsis(path: pathlib.Path) -> None:
    with path.open("rb") as handle:
        if handle.read(2) != b"MZ":
            raise Problem(
                "not a Windows executable (no MZ header), so it cannot be an "
                "NSIS installer"
            )
    magic_at, sig_at = _scan_nsis(path)
    if magic_at < 0 or sig_at < 0:
        missing = []
        if magic_at < 0:
            missing.append(f"{NSIS_MAGIC.hex()} first-header magic")
        if sig_at < 0:
            missing.append(f'"{NSIS_SIGNATURE.decode()}" signature')
        raise Problem(
            "a Windows executable, but not an NSIS installer: no "
            + " and no ".join(missing)
            + ". This is what a cargo build script or the bare application "
            "binary looks like, and running it installs nothing."
        )


def _verify_dmg(path: pathlib.Path) -> None:
    size = path.stat().st_size
    if size < DMG_TRAILER_BYTES:
        raise Problem(
            f"too small to hold a {DMG_TRAILER_BYTES}-byte UDIF trailer "
            f"({size} bytes)"
        )
    with path.open("rb") as handle:
        handle.seek(-DMG_TRAILER_BYTES, 2)
        trailer = handle.read(DMG_TRAILER_BYTES)
    if not trailer.startswith(DMG_MAGIC):
        raise Problem(
            f'no "{DMG_MAGIC.decode()}" trailer in the final '
            f"{DMG_TRAILER_BYTES} bytes, so this is not a UDIF disk image"
        )


def _verify_appimage(path: pathlib.Path) -> None:
    with path.open("rb") as handle:
        head = handle.read(APPIMAGE_TYPE_OFFSET + len(APPIMAGE_TYPE))
    if not head.startswith(APPIMAGE_ELF):
        raise Problem("not an ELF binary, so it cannot be an AppImage")
    marker = head[APPIMAGE_TYPE_OFFSET:APPIMAGE_TYPE_OFFSET + len(APPIMAGE_TYPE)]
    if marker != APPIMAGE_TYPE:
        raise Problem(
            "an ELF binary, but bytes 8-9 are "
            f"{marker.hex()} rather than {APPIMAGE_TYPE.hex()}; the AppImage "
            "type marker is missing, so this is the bare application binary"
        )


VERIFIERS = {
    "nsis": _verify_nsis,
    "dmg": _verify_dmg,
    "appimage": _verify_appimage,
}


def verify(path: pathlib.Path, kind: str) -> None:
    """Raise Problem unless path is a real installer of the given kind."""
    if not path.is_file():
        raise Problem(f"{path} does not exist or is not a file")
    size = path.stat().st_size
    if size < MIN_BYTES:
        raise Problem(
            f"{size} bytes is below the {MIN_BYTES}-byte floor for a Syntara "
            "installer. A file this small is not an installer whatever its "
            "first bytes look like - check that the bundler's output was "
            "copied rather than some other executable from the target tree."
        )
    VERIFIERS[kind](path)


def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("path", help="the artifact about to be published")
    parser.add_argument("--kind", required=True, choices=sorted(VERIFIERS),
                        help="container format the artifact must actually be")
    args = parser.parse_args(argv[1:])

    path = pathlib.Path(args.path)
    try:
        verify(path, args.kind)
    except Problem as problem:
        size = path.stat().st_size if path.is_file() else 0
        print(f"FAIL: {path} is not a usable {args.kind} artifact: {problem}")
        print(f"  size: {size} bytes")
        return 1
    print(f"OK: {path.name} is a real {args.kind} artifact "
          f"({path.stat().st_size} bytes)")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))