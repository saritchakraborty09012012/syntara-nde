"""Tests for the GGUF inspector (syntara.gguf_inspect).

Fixtures are built byte-by-byte from the documented GGUF layout (synthetic,
no network, no model download). The builder is independent from the parser
only in structure - both follow the spec, and a wrong constant in either
direction shows up as a failed assertion below.
"""

from __future__ import annotations

import contextlib
import io
import json
import os
import struct
import tempfile
import unittest

from syntara.gguf_inspect import GgufError, inspect_file

T_STR, T_U32, T_ARR = 8, 4, 9
GGUF_MAGIC = 0x46554747


def _s(text: str) -> bytes:
    raw = text.encode("utf-8")
    return struct.pack("<Q", len(raw)) + raw


def _kv_str(key: str, value: str):
    return key, T_STR, _s(value)


def _kv_u32(key: str, value: int):
    return key, T_U32, struct.pack("<I", value)


def _kv_str_array(key: str, values: list[str]):
    payload = struct.pack("<I", T_STR) + struct.pack("<Q", len(values))
    payload += b"".join(_s(v) for v in values)
    return key, T_ARR, payload


def _tensor(name: str, shape: list[int], type_id: int, nbytes: int, offset: int):
    return {"name": name, "shape": shape, "type_id": type_id,
            "nbytes": nbytes, "offset": offset}


def _tensor_bytes(shape: list[int], type_id: int) -> int:
    """Payload bytes for the types the tests use (block sizes per spec)."""
    if type_id == 1:      # f16
        n = 1
        for d in shape:
            n *= d
        return n * 2
    if type_id == 12:     # q4_k: 144 bytes per 256-weight block
        rows = 1
        for d in shape[1:]:
            rows *= d
        return (shape[0] // 256) * 144 * rows
    raise AssertionError(f"builder lacks size rule for type {type_id}")


def build_gguf(path: str, *, version: int = 3, kvs: list | None = None,
               tensors: list | None = None, truncate: int = 0,
               override_counts: tuple[int, int] | None = None) -> None:
    kvs = kvs or []
    tensors = tensors or []
    n_tensors, n_kvs = override_counts if override_counts else (len(tensors), len(kvs))

    head = bytearray()
    head += struct.pack("<I", GGUF_MAGIC)
    head += struct.pack("<I", version)
    head += struct.pack("<Q", n_tensors)
    head += struct.pack("<Q", n_kvs)
    for key, vtype, value in kvs:
        head += _s(key) + struct.pack("<I", vtype) + value
    for t in tensors:
        head += _s(t["name"])
        head += struct.pack("<I", len(t["shape"]))
        for d in t["shape"]:
            head += struct.pack("<Q", d)
        head += struct.pack("<I", t["type_id"])
        head += struct.pack("<Q", t["offset"])
    pad = (-len(head)) % 32
    head += b"\x00" * pad

    end = 0
    for t in tensors:
        end = max(end, t["offset"] + t["nbytes"])
    payload = bytes(end)

    blob = bytes(head) + payload
    if truncate:
        blob = blob[: len(blob) - truncate]
    with open(path, "wb") as fh:
        fh.write(blob)


def _standard_kvs(arch: str = "llama", *, chat_template: bool = True) -> list:
    kvs = [
        _kv_str("general.architecture", arch),
        _kv_str("general.name", "tiny-test"),
        _kv_u32("general.file_type", 15),
        _kv_u32(f"{arch}.context_length", 4096),
    ]
    if chat_template:
        kvs.append(_kv_str("tokenizer.chat_template",
                           "{{ messages }}"))
    return kvs


class InspectValidFileTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.path = os.path.join(self.tmp.name, "tiny.gguf")

    def tearDown(self):
        self.tmp.cleanup()

    def test_valid_v3_full_report(self):
        # 2x q4_k blocks (256x2) + f16 vector (64)
        t1 = _tensor("blk.0.attn_q.weight", [256, 2], 12, 0, 0)
        t1["nbytes"] = _tensor_bytes(t1["shape"], 12)
        t2 = _tensor("output_norm.weight", [64], 1, 0, t1["nbytes"])
        t2["nbytes"] = _tensor_bytes(t2["shape"], 1)
        build_gguf(self.path, kvs=_standard_kvs(), tensors=[t1, t2])

        rep = inspect_file(self.path)
        self.assertTrue(rep["data_complete"])
        self.assertEqual(rep["format"]["version"], 3)
        self.assertEqual(rep["format"]["alignment"], 32)
        self.assertEqual(rep["model"]["architecture"], "llama")
        self.assertEqual(rep["model"]["context_length"], 4096)
        self.assertEqual(rep["tensors"]["count"], 2)
        self.assertEqual(rep["tensors"]["parameters"], 256 * 2 + 64)
        self.assertEqual(rep["tensors"]["weight_bytes"],
                         t1["nbytes"] + t2["nbytes"])
        self.assertEqual(rep["tensors"]["by_type"], {"f16": 1, "q4_k": 1})
        self.assertTrue(rep["tensors"]["bytes_verified"])
        self.assertEqual(rep["tokenizer"]["tokens"], 0)
        self.assertTrue(rep["tokenizer"]["has_chat_template"])
        self.assertEqual(rep["warnings"], [])
        badges = {b["id"]: b for b in rep["compatibility"]["badges"]}
        self.assertEqual(badges["data"]["level"], "ok")
        self.assertEqual(badges["dense-policy-architecture"]["level"], "ok")
        self.assertEqual(badges["dense-policy-quantization"]["level"], "ok")
        self.assertEqual(badges["chat-template"]["level"], "ok")
        self.assertTrue(rep["compatibility"]["architecture_in_scope"])
        self.assertTrue(rep["compatibility"]["approved_quants_present"])

    def test_truncated_data_reports_incomplete(self):
        t1 = _tensor("blk.0.weight", [256, 4], 12, 0, 0)
        t1["nbytes"] = _tensor_bytes(t1["shape"], 12)
        build_gguf(self.path, kvs=_standard_kvs(), tensors=[t1], truncate=64)
        rep = inspect_file(self.path)
        self.assertFalse(rep["data_complete"])
        self.assertTrue(any("truncated" in w for w in rep["warnings"]))
        badges = {b["id"]: b for b in rep["compatibility"]["badges"]}
        self.assertEqual(badges["data"]["level"], "error")
        # metadata still reported despite the missing payload
        self.assertEqual(rep["model"]["architecture"], "llama")

    def test_out_of_scope_architecture_badges_warn(self):
        t1 = _tensor("w", [256], 12, 0, 0)
        t1["nbytes"] = _tensor_bytes(t1["shape"], 12)
        build_gguf(self.path, kvs=_standard_kvs(arch="falcon"),
                   tensors=[t1])
        rep = inspect_file(self.path)
        self.assertFalse(rep["compatibility"]["architecture_in_scope"])
        badges = {b["id"]: b for b in rep["compatibility"]["badges"]}
        self.assertEqual(badges["dense-policy-architecture"]["level"], "warn")
        self.assertIn("falcon", badges["dense-policy-architecture"]["message"])

    def test_tokenizer_array_is_summarised(self):
        tokens = [f"tok{i}" for i in range(10_000)]
        kvs = _standard_kvs() + [_kv_str_array("tokenizer.ggml.tokens", tokens)]
        t1 = _tensor("w", [256], 12, 0, 0)
        t1["nbytes"] = _tensor_bytes(t1["shape"], 12)
        build_gguf(self.path, kvs=kvs, tensors=[t1])
        rep = inspect_file(self.path)
        self.assertEqual(rep["tokenizer"]["tokens"], 10_000)
        stored = rep["metadata"]["values"]["tokenizer.ggml.tokens"]
        self.assertEqual(stored["_array_count"], 10_000)
        self.assertEqual(len(stored["_sample"]), 5)
        self.assertTrue(any("10000 entries" in w for w in rep["warnings"]))

    def test_unknown_tensor_type_warns_and_bounds_bytes(self):
        t1 = _tensor("w", [256], 999, 128, 0)
        build_gguf(self.path, kvs=_standard_kvs(), tensors=[t1])
        rep = inspect_file(self.path)
        self.assertFalse(rep["tensors"]["bytes_verified"])
        self.assertTrue(any("unknown type id 999" in w for w in rep["warnings"]))
        self.assertIn("unknown(999)", rep["tensors"]["by_type"])


class InspectErrorTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.path = os.path.join(self.tmp.name, "bad.gguf")

    def tearDown(self):
        self.tmp.cleanup()

    def test_bad_magic_is_a_clear_error(self):
        with open(self.path, "wb") as fh:
            fh.write(b"NOTG" + b"\x00" * 64)
        with self.assertRaises(GgufError) as ctx:
            inspect_file(self.path)
        self.assertIn("not a GGUF file", str(ctx.exception))
        self.assertIn("not a GGUF model file", str(ctx.exception))

    def test_v1_rejected_with_conversion_hint(self):
        build_gguf(self.path, version=1)
        with self.assertRaises(GgufError) as ctx:
            inspect_file(self.path)
        self.assertIn("version 1", str(ctx.exception))
        self.assertIn("re-export", str(ctx.exception))

    def test_absurd_counts_rejected_before_array_read(self):
        build_gguf(self.path, override_counts=(0, 10**12))
        with self.assertRaises(GgufError) as ctx:
            inspect_file(self.path)
        self.assertIn("corrupt", str(ctx.exception))

    def test_header_truncation_names_the_offset(self):
        with open(self.path, "wb") as fh:
            fh.write(struct.pack("<I", GGUF_MAGIC) + struct.pack("<I", 3))
        with self.assertRaises(GgufError) as ctx:
            inspect_file(self.path)
        self.assertIn("truncated", str(ctx.exception))

    def test_missing_file(self):
        with self.assertRaises(GgufError) as ctx:
            inspect_file(os.path.join(self.tmp.name, "nope.gguf"))
        self.assertIn("cannot open", str(ctx.exception))


class InspectCliTest(unittest.TestCase):
    def setUp(self):
        from syntara.cli import build_parser  # noqa: F401  (wiring smoke)
        self.tmp = tempfile.TemporaryDirectory()
        self.path = os.path.join(self.tmp.name, "tiny.gguf")
        t1 = _tensor("w", [256], 12, 0, 0)
        t1["nbytes"] = _tensor_bytes(t1["shape"], 12)
        build_gguf(self.path, kvs=_standard_kvs(), tensors=[t1])

    def tearDown(self):
        self.tmp.cleanup()

    def _run(self, argv: list[str]) -> tuple[int, str]:
        from syntara.cli import main
        buf = io.StringIO()
        with contextlib.redirect_stdout(buf):
            code = main(argv)
        return code, buf.getvalue()

    def test_inspect_json_output(self):
        code, out = self._run(["inspect", "--json",
                               "--data-dir", self.tmp.name, self.path])
        self.assertEqual(code, 0)
        rep = json.loads(out)
        self.assertEqual(rep["model"]["architecture"], "llama")

    def test_inspect_human_output(self):
        code, out = self._run(["inspect", "--data-dir", self.tmp.name,
                               self.path])
        self.assertEqual(code, 0)
        self.assertIn("GGUF v3", out)
        self.assertIn("arch=llama", out)
        self.assertIn("q4_kx1", out)

    def test_inspect_missing_file_exits_nonzero(self):
        from syntara.cli import main
        err = io.StringIO()
        with contextlib.redirect_stderr(err):
            code = main(["inspect", "--data-dir", self.tmp.name,
                         os.path.join(self.tmp.name, "nope.gguf")])
        self.assertEqual(code, 1)
        self.assertIn("syntara:", err.getvalue())


try:
    from gguf.constants import GGML_QUANT_SIZES  # type: ignore
    _HAS_GGUF_PKG = True
except Exception:  # noqa: BLE001
    GGML_QUANT_SIZES = None
    _HAS_GGUF_PKG = False


@unittest.skipUnless(_HAS_GGUF_PKG,
                     "gguf package not installed; run: pip install gguf")
class QuantTableOracleTest(unittest.TestCase):
    """Cross-check syntara's quantization table against the official gguf
    package's GGML_QUANT_SIZES (independent implementation of the same
    spec). Catches transcription drift in block/type sizes."""

    def test_quant_sizes_match_official_table(self):
        from syntara.gguf_inspect import (_TENSOR_TYPES, _block_size,
                                          _type_size)
        mismatches = []
        for tid, name in _TENSOR_TYPES.items():
            if tid not in GGML_QUANT_SIZES:
                continue
            off_block, off_size = GGML_QUANT_SIZES[tid]
            my_block = _block_size(name)
            my_size = _type_size(name, my_block)
            if (off_block, off_size) != (my_block, my_size):
                mismatches.append(
                    f"{name} (id {tid}): syntara=({my_block}, {my_size}) "
                    f"official=({off_block}, {off_size})")
        self.assertEqual(mismatches, [])

    def test_every_known_type_has_a_block_size(self):
        from syntara.gguf_inspect import _TENSOR_TYPES, _block_size
        zero = [name for name in _TENSOR_TYPES.values()
                if _block_size(name) == 0]
        self.assertEqual(zero, [])


if __name__ == "__main__":
    unittest.main()
