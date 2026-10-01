"""Name-purge gate tests (tools/check_names.py).

The gate must (a) stay green on this repository, (b) actually catch a planted
violation, and (c) honour the documented allowlist carve-out. Planted fixtures
live in temp directories outside the repository, and the tokens are assembled
from fragments so this test file itself never contains a banned literal as
contiguous text.
"""

from __future__ import annotations

import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
CHECKER = REPO_ROOT / "tools" / "check_names.py"
ALLOWLIST = REPO_ROOT / "tools" / "name_check_allowlist.txt"

# Assembled from fragments: contiguous literals would make this file a
# violation and the gate would fail on its own test.
_BANNED = "oll" + "ama"
_BANNED_2 = "colibr" + "i"
# Reassembles at runtime to an allowlisted external repository id, while the
# source text stays token-free for the scanner.
_ALLOWLISTED_REPO = "Inkling-" + "coli" + "bri" + "-int4"


def _run(root: Path, allowlist: Path | None = None) -> subprocess.CompletedProcess:
    cmd = [sys.executable, "-X", "utf8", str(CHECKER), "--root", str(root), "--quiet"]
    if allowlist is not None:
        cmd += ["--allowlist", str(allowlist)]
    return subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8")


class NamePurgeTest(unittest.TestCase):
    def test_repository_is_clean(self):
        """The shipped tree contains no banned names (the Phase 0 gate)."""
        proc = _run(REPO_ROOT, allowlist=ALLOWLIST)
        self.assertEqual(
            proc.returncode,
            0,
            f"banned names found:\n{proc.stdout}{proc.stderr}",
        )

    def test_detects_planted_violation(self):
        """A banned token in a text file, a file name, or a binary fails."""
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "README.md").write_text(
                f"reference runtime: {_BANNED}\n", encoding="utf-8"
            )
            (root / f"{_BANNED_2}-family.md").write_text("name\n", encoding="utf-8")
            # 16 NUL bytes keeps the scanner in binary mode for the UTF-16 path.
            (root / "blob.bin").write_bytes(
                (_BANNED + "\x00").encode("utf-16le") + b"\x00" * 16
            )
            proc = _run(root)
        self.assertEqual(proc.returncode, 1, proc.stdout + proc.stderr)
        self.assertIn("README.md", proc.stdout)
        self.assertIn("-family.md", proc.stdout)
        self.assertIn("blob.bin", proc.stdout)

    def test_allowlisted_external_identifier_is_permitted(self):
        """A literal external repository id on the allowlist passes."""
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "catalog.md").write_text(
                f"https://huggingface.co/x/{_ALLOWLISTED_REPO}\n", encoding="utf-8"
            )
            allowlist = root / "allowlist.txt"
            allowlist.write_text(f"* {_ALLOWLISTED_REPO}\n", encoding="utf-8")
            proc = _run(root, allowlist=allowlist)
        self.assertEqual(proc.returncode, 0, proc.stdout + proc.stderr)

    def test_allowlist_does_not_mask_unrelated_hits_on_same_line(self):
        """A tight window stops one allowlisted URL from hiding a sibling
        violation on the same (e.g. minified) line."""
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            pad = "x" * 400  # pushes the two matches outside the window
            (root / "bundle.js").write_text(
                f"var a='{_ALLOWLISTED_REPO}';{pad}var b='{_BANNED}';\n",
                encoding="utf-8",
            )
            allowlist = root / "allowlist.txt"
            allowlist.write_text(f"* {_ALLOWLISTED_REPO}\n", encoding="utf-8")
            proc = _run(root, allowlist=allowlist)
        self.assertEqual(proc.returncode, 1, proc.stdout + proc.stderr)


if __name__ == "__main__":
    unittest.main()
