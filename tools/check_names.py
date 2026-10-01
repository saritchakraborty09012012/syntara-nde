#!/usr/bin/env python3
"""Name-purge gate: fail if a banned third-party brand token appears anywhere
in the shipped tree.

The banned tokens are the four third-party project names Syntara's brief
forbids (engine reference, model-server reference, chat-UI reference, agent
reference). They are defined only as regex fragments in BANNED_PATTERNS below,
deliberately written so that this file itself never contains one of the tokens
as contiguous text.

Matched case-insensitively:
  - in text files (reported path:line)
  - in binary files as ASCII and UTF-16LE byte sequences (feasible subset)
  - in file and folder names

Excluded from the scan (documented carve-outs, intentionally narrow):

  1. License/attribution files: NOTICE, LICENSE, THIRD_PARTY_NOTICES* —
     legally required copyright/branding text lives there and nowhere else.
  2. `tools/name_check_allowlist.txt` — literal external identifiers that
     cannot be renamed without breaking real downloads (e.g. third-party
     model-repository IDs). Every entry must carry a justification comment.

Skipped directories (never ship in the product): .git, node_modules, target,
__pycache__, _reference, .claude.

Exit codes: 0 = clean, 1 = violations found, 2 = usage/IO error.
"""

from __future__ import annotations

import argparse
import fnmatch
import os
import re
import sys
from pathlib import Path

# Built from fragments so this source file itself passes the gate.
_BANNED_SOURCES = [
    r"\bcolibr[i\u00ee]",
    r"\b" + "oll" + "ama",
    r"\bopen[\s\-_]?webui\b",
    r"\bopen[\s\-_]?code\b",
]
BANNED_PATTERNS = [re.compile(p, re.IGNORECASE) for p in _BANNED_SOURCES]

SKIP_DIRS = {".git", "node_modules", "target", "__pycache__", "_reference", ".claude"}

# License/attribution carve-out: exact file names (case-insensitive) at any depth.
LICENSE_FILES = {
    "notice",
    "license",
    "license.md",
    "license.txt",
    "third_party_notices",
    "third_party_notices.md",
    "third_party_notices.txt",
}

ALLOWLIST_DEFAULT = "tools/name_check_allowlist.txt"

# Context window (characters on each side) when deciding whether a match is
# covered by an allowlisted literal. Kept tight so that one allowlisted URL on
# a minified single-line bundle cannot mask an unrelated violation on the same
# line.
WINDOW = 160

# Binary extensions worth scanning as raw bytes (assets, executables, data).
BINARY_EXT = {
    ".png", ".jpg", ".jpeg", ".gif", ".ico", ".webp", ".svg", ".bmp",
    ".ttf", ".otf", ".woff", ".woff2", ".eot",
    ".exe", ".dll", ".so", ".dylib", ".a", ".lib", ".o", ".obj", ".pdb",
    ".bin", ".pdf", ".zip", ".gz", ".7z", ".rar", ".wasm", ".dat",
    ".gguf", ".safetensors", ".pt", ".onnx", ".sqlite", ".db",
}

# Huge model-weight blobs are data, not code: their content is covered by the
# file-name check, and scanning hundreds of MB of tensors buys nothing.
WEIGHT_EXT = {".safetensors", ".gguf", ".pt", ".bin"}
WEIGHT_MAX = 64 * 1024 * 1024


class Rule:
    __slots__ = ("path_glob", "literal")

    def __init__(self, path_glob: str, literal: str):
        self.path_glob = path_glob.lower()
        self.literal = literal.lower()

    def matches_path(self, rel: str) -> bool:
        rel = rel.lower().replace("\\", "/")
        return (
            self.path_glob == "*"
            or fnmatch.fnmatch(rel, self.path_glob)
            or fnmatch.fnmatch(rel.rsplit("/", 1)[-1], self.path_glob)
        )


def load_allowlist(path: Path) -> list[Rule]:
    rules: list[Rule] = []
    if not path.is_file():
        return rules
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        # format: [path-glob<whitespace>]literal   (glob optional -> "*")
        parts = line.split(None, 1)
        if len(parts) == 2 and ("*" in parts[0] or "/" in parts[0] or "." in parts[0]):
            rules.append(Rule(parts[0], parts[1]))
        else:
            rules.append(Rule("*", line))
    return rules


def _allowed(window: str, match_pos: int, rel: str, rules: list[Rule]) -> bool:
    """True when the match at match_pos sits inside an allowlisted literal."""
    w = window.lower()
    for r in rules:
        if not r.matches_path(rel):
            continue
        start = 0
        while True:
            i = w.find(r.literal, start)
            if i < 0:
                break
            if i <= match_pos < i + len(r.literal):
                return True
            start = i + 1
    return False


def scan_text(rel: str, text: str, rules: list[Rule], out: list[str]) -> None:
    for lineno, line in enumerate(text.splitlines(), 1):
        for pat in BANNED_PATTERNS:
            for m in pat.finditer(line):
                lo = max(0, m.start() - WINDOW)
                hi = min(len(line), m.end() + WINDOW)
                if _allowed(line[lo:hi], m.start() - lo, rel, rules):
                    continue
                snippet = line.strip()
                if len(snippet) > 200:
                    snippet = snippet[:200] + "..."
                out.append(f"{rel}:{lineno}: matched {m.group(0)!r} -> {snippet}")
                break  # one report per pattern per line is enough


def scan_bytes(rel: str, data: bytes, rules: list[Rule], out: list[str]) -> None:
    # latin-1 decoding preserves byte<->char offsets 1:1, so spans map to bytes.
    text = data.decode("latin-1")
    for pat in BANNED_PATTERNS:
        for m in pat.finditer(text):
            lo = max(0, m.start() - WINDOW)
            hi = min(len(data), m.end() + WINDOW)
            if _allowed(data[lo:hi].decode("latin-1"), m.start() - lo, rel, rules):
                continue
            out.append(f"{rel}:binary@{m.start()}: matched {m.group(0)!r}")
            break
    # UTF-16LE variant (Windows resources / wide strings)
    try:
        u16 = data.decode("utf-16le", errors="ignore")
    except Exception:
        return
    if "\x00" not in u16[:2000]:
        return
    for pat in BANNED_PATTERNS:
        for m in pat.finditer(u16):
            byte_start = m.start() * 2
            lo = max(0, m.start() - WINDOW)
            hi = min(len(u16), m.end() + WINDOW)
            if _allowed(u16[lo:hi], m.start() - lo, rel, rules):
                continue
            out.append(f"{rel}:binary-utf16@{byte_start}: matched {m.group(0)!r}")
            break


def scan_names(rel: str, out: list[str]) -> None:
    for part in rel.replace("\\", "/").split("/"):
        for pat in BANNED_PATTERNS:
            if pat.search(part):
                out.append(f"NAME: {rel}  (component {part!r} matches a banned token)")
                break


def iter_files(root: Path):
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = sorted(d for d in dirnames if d not in SKIP_DIRS)
        for fn in sorted(filenames):
            yield Path(dirpath) / fn


def main(argv: list[str]) -> int:
    ap = argparse.ArgumentParser(
        description="Fail when a banned third-party brand token appears in the tree."
    )
    ap.add_argument("--root", default=None, help="tree to scan (default: repo root)")
    ap.add_argument("--allowlist", default=None, help="allowlist file")
    ap.add_argument("--quiet", action="store_true", help="print nothing on success")
    args = ap.parse_args(argv)

    repo_root = Path(args.root) if args.root else Path(__file__).resolve().parent.parent
    if not repo_root.is_dir():
        print(f"error: not a directory: {repo_root}", file=sys.stderr)
        return 2
    allowlist_path = (
        Path(args.allowlist) if args.allowlist else repo_root / ALLOWLIST_DEFAULT
    )
    rules = load_allowlist(allowlist_path)

    violations: list[str] = []
    n_files = 0
    for p in iter_files(repo_root):
        rel = str(p.relative_to(repo_root))
        n_files += 1
        scan_names(rel, violations)
        if p.name.lower() in LICENSE_FILES:
            continue
        try:
            data = p.read_bytes()
        except OSError as e:
            print(f"warning: cannot read {rel}: {e}", file=sys.stderr)
            continue
        is_binary = (
            p.suffix.lower() in BINARY_EXT
            or b"\x00" in data[:8192]
            or _not_utf8(data)
        )
        if is_binary:
            if p.suffix.lower() in WEIGHT_EXT and len(data) > WEIGHT_MAX:
                continue
            scan_bytes(rel, data, rules, violations)
        else:
            scan_text(rel, data.decode("utf-8", errors="replace"), rules, violations)

    if violations:
        print(f"NAME PURGE FAILED - {len(violations)} violation(s) in {n_files} files:")
        for v in violations:
            print(f"  {v}")
        print(
            "\nBanned third-party brand tokens must not appear in the shipped tree.\n"
            "License/attribution files and tools/name_check_allowlist.txt are the\n"
            "only documented carve-outs."
        )
        return 1
    if not args.quiet:
        print(f"name purge OK - {n_files} files scanned, no banned names found.")
    return 0


def _not_utf8(data: bytes) -> bool:
    try:
        data.decode("utf-8")
        return False
    except UnicodeDecodeError:
        return True


if __name__ == "__main__":
    # Console code pages (cp1252 on Windows) cannot encode some source
    # characters we may echo back in violation reports.
    for stream in (sys.stdout, sys.stderr):
        try:
            stream.reconfigure(encoding="utf-8", errors="replace")
        except Exception:
            pass
    sys.exit(main(sys.argv[1:]))
