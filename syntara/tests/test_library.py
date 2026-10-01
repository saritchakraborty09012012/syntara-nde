"""Tests for syntara.library (local GGUF catalogue).

All fixtures are synthetic GGUF files from syntara.tests.gguf_fixtures;
no real models, no network.
"""
from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

from syntara.library import LibraryError, ModelLibrary
from syntara.tests.gguf_fixtures import (
    build_gguf,
    standard_kvs as _standard_kvs,
    tensor as _tensor,
    tensor_bytes as _tensor_bytes,
)


def make_valid_gguf(path: Path) -> None:
    nbytes = _tensor_bytes([64, 1], 1)
    build_gguf(str(path), kvs=_standard_kvs(),
               tensors=[_tensor("weight", [64, 1], 1, nbytes, 0)])


class LibraryTest(unittest.TestCase):
    def setUp(self) -> None:
        self._tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self._tmp.cleanup)
        self.root = Path(self._tmp.name)
        self.lib = ModelLibrary(self.root)
        self.src = self.root / "Alpha Test.gguf"
        make_valid_gguf(self.src)

    # ------------------------------------------------------------ add / list

    def test_add_in_place_and_list_status_ok(self):
        entry = self.lib.add(self.src)
        self.assertEqual(entry["id"], "alpha-test")
        self.assertEqual(entry["status"], "ok")
        self.assertFalse(entry["copied"])
        listed = self.lib.list()
        self.assertEqual(len(listed), 1)
        self.assertEqual(listed[0]["model"]["architecture"], "llama")
        self.assertEqual(listed[0]["model"]["context_length"], 4096)

    def test_add_twice_same_file_returns_same_entry(self):
        first = self.lib.add(self.src)
        second = self.lib.add(self.src)
        self.assertEqual(first["id"], second["id"])
        self.assertEqual(len(self.lib.list()), 1)

    def test_copy_into_library_keeps_original(self):
        entry = self.lib.add(self.src, copy=True)
        self.assertTrue(entry["copied"])
        self.assertNotEqual(entry["path"], str(self.src))
        self.assertTrue(Path(entry["path"]).is_file())
        self.assertTrue(self.src.is_file())
        self.assertIn(str(self.root / "models"), entry["path"])

    def test_add_missing_file_is_actionable(self):
        with self.assertRaises(LibraryError) as ctx:
            self.lib.add(self.root / "nope.gguf")
        self.assertIn("file not found", str(ctx.exception))

    def test_add_corrupt_file_is_rejected(self):
        bad = self.root / "bad.gguf"
        bad.write_bytes(b"not a gguf file at all")
        with self.assertRaises(LibraryError) as ctx:
            self.lib.add(bad)
        self.assertIn("cannot add", str(ctx.exception))

    def test_add_truncated_data_is_rejected(self):
        trunc = self.root / "trunc.gguf"
        make_valid_gguf(trunc)
        raw = trunc.read_bytes()
        trunc.write_bytes(raw[:-8])
        with self.assertRaises(LibraryError) as ctx:
            self.lib.add(trunc)
        self.assertIn("incomplete", str(ctx.exception))

    def test_unique_ids_for_same_stem(self):
        other_dir = self.root / "other"
        other_dir.mkdir()
        other = other_dir / "Alpha Test.gguf"
        make_valid_gguf(other)
        self.assertEqual(self.lib.add(self.src)["id"], "alpha-test")
        self.assertEqual(self.lib.add(other)["id"], "alpha-test-2")

    def test_explicit_duplicate_id_rejected(self):
        self.lib.add(self.src, model_id="mine")
        other = self.root / "Beta.gguf"
        make_valid_gguf(other)
        with self.assertRaises(LibraryError):
            self.lib.add(other, model_id="mine")

    def test_explicit_id_conflicting_with_existing_path_rejected(self):
        self.lib.add(self.src)  # auto id: alpha-test
        with self.assertRaises(LibraryError) as ctx:
            self.lib.add(self.src, model_id="mine")
        self.assertIn("alpha-test", str(ctx.exception))

    # ---------------------------------------------------------- status rules

    def test_status_missing_when_file_deleted(self):
        entry = self.lib.add(self.src)
        self.src.unlink()
        self.assertEqual(self.lib.get(entry["id"])["status"], "missing")

    def test_status_modified_when_file_changes(self):
        entry = self.lib.add(self.src)
        self.src.write_bytes(self.src.read_bytes() + b"\x00")
        self.assertEqual(self.lib.get(entry["id"])["status"], "modified")

    def test_get_unknown_returns_none(self):
        self.assertIsNone(self.lib.get("ghost"))

    # --------------------------------------------------------------- resolve

    def test_resolve_by_path_auto_registers(self):
        entry = self.lib.resolve(str(self.src))
        self.assertEqual(entry["id"], "alpha-test")
        self.assertEqual(len(self.lib.list()), 1)

    def test_resolve_unknown_lists_known_ids(self):
        self.lib.add(self.src)
        with self.assertRaises(LibraryError) as ctx:
            self.lib.resolve("ghost")
        message = str(ctx.exception)
        self.assertIn("alpha-test", message)
        self.assertIn("not a file path", message)

    def test_resolve_missing_entry_hints_re_add(self):
        entry = self.lib.add(self.src)
        self.src.unlink()
        with self.assertRaises(LibraryError) as ctx:
            self.lib.resolve(entry["id"])
        self.assertIn("syntara library add", str(ctx.exception))

    # ------------------------------------------------------------------ scan

    def test_scan_registers_valid_and_reports_skipped(self):
        folder = self.root / "scanme"
        folder.mkdir()
        make_valid_gguf(folder / "one.gguf")
        (folder / "broken.gguf").write_bytes(b"garbage")
        result = self.lib.scan(folder)
        self.assertEqual(result["scanned"], 2)
        self.assertEqual(result["added"], ["one"])
        self.assertEqual(len(result["skipped"]), 1)
        self.assertIn("cannot add", result["skipped"][0]["reason"])

    def test_scan_directory_not_found(self):
        with self.assertRaises(LibraryError):
            self.lib.scan(self.root / "no-such-dir")

    # ---------------------------------------------------------------- remove

    def test_remove_keeps_file_on_disk(self):
        entry = self.lib.add(self.src)
        result = self.lib.remove(entry["id"])
        self.assertFalse(result["file_deleted"])
        self.assertEqual(self.lib.list(), [])
        self.assertTrue(self.src.is_file())

    def test_remove_delete_file_requires_expectation_match(self):
        entry = self.lib.add(self.src)
        self.src.write_bytes(self.src.read_bytes() + b"\x00")  # changed
        with self.assertRaises(LibraryError) as ctx:
            self.lib.remove(entry["id"], delete_file=True, expect=entry)
        self.assertIn("changed", str(ctx.exception))
        self.assertTrue(self.src.is_file())

    def test_remove_delete_file_actually_deletes(self):
        entry = self.lib.add(self.src)
        result = self.lib.remove(entry["id"], delete_file=True, expect=entry)
        self.assertTrue(result["file_deleted"])
        self.assertFalse(self.src.exists())

    def test_remove_unknown_id(self):
        with self.assertRaises(LibraryError):
            self.lib.remove("ghost")

    def test_corrupt_index_file_treated_as_empty(self):
        self.lib.add(self.src)
        self.lib.index_path.write_text("{{{ not json", encoding="utf-8")
        self.assertEqual(self.lib.list(), [])


if __name__ == "__main__":
    unittest.main()
