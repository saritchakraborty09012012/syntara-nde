"""Synthetic GGUF builders shared by the test suite.

Two builders:

* ``build_gguf`` - minimal structural fixtures for the header/metadata
  inspector tests (arbitrary kvs/tensors, truncation, corrupt headers).

* ``build_tiny_llama_gguf`` - a tiny but *structurally complete* llama-arch
  model (hparams, byte-level BPE vocab, all tensors) that the real pinned
  llama.cpp server binary actually loads. Validated end-to-end against
  llama.cpp release b11321: spawn -> health -> non-stream chat -> SSE
  stream. Output text is gibberish (random weights); that is expected and
  only proves the pipeline, not model quality.

Fixtures are byte-built with ``struct`` - stdlib only, no network.
"""
from __future__ import annotations

import struct

# GGUF metadata value types (format enum).
T_U32, T_I32, T_F32, T_STR, T_ARR = 4, 5, 6, 8, 9
GGUF_MAGIC = 0x46554747


def s(text: str) -> bytes:
    raw = text.encode("utf-8")
    return struct.pack("<Q", len(raw)) + raw


def kv_str(key: str, value: str):
    return key, T_STR, s(value)


def kv_u32(key: str, value: int):
    return key, T_U32, struct.pack("<I", value)


def kv_f32(key: str, value: float):
    return key, T_F32, struct.pack("<f", value)


def kv_str_array(key: str, values: list[str]):
    payload = struct.pack("<I", T_STR) + struct.pack("<Q", len(values))
    payload += b"".join(s(v) for v in values)
    return key, T_ARR, payload


def tensor(name: str, shape: list[int], type_id: int, nbytes: int,
           offset: int):
    return {"name": name, "shape": shape, "type_id": type_id,
            "nbytes": nbytes, "offset": offset}


def tensor_bytes(shape: list[int], type_id: int) -> int:
    """Payload bytes for the types the header tests use (per spec)."""
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
    n_tensors, n_kvs = override_counts if override_counts else (
        len(tensors), len(kvs))

    head = bytearray()
    head += struct.pack("<I", GGUF_MAGIC)
    head += struct.pack("<I", version)
    head += struct.pack("<Q", n_tensors)
    head += struct.pack("<Q", n_kvs)
    for key, vtype, value in kvs:
        head += s(key) + struct.pack("<I", vtype) + value
    for t in tensors:
        head += s(t["name"])
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
    blob = bytes(head) + bytes(end)
    if truncate:
        blob = blob[: len(blob) - truncate]
    with open(path, "wb") as fh:
        fh.write(blob)


def standard_kvs(arch: str = "llama", *, chat_template: bool = True) -> list:
    kvs = [
        kv_str("general.architecture", arch),
        kv_str("general.name", "tiny-test"),
        kv_u32("general.file_type", 15),
        kv_u32(f"{arch}.context_length", 4096),
    ]
    if chat_template:
        kvs.append(kv_str("tokenizer.chat_template", "{{ messages }}"))
    return kvs


# ---------------------------------------------------------------------------
# Tiny but complete llama model (proven against the real server binary).
# ---------------------------------------------------------------------------

N_EMBD, N_HEAD, N_LAYER, N_VOCAB = 64, 4, 2, 259
HEAD_DIM = N_EMBD // N_HEAD
N_KV_HEAD = N_HEAD
FFN = 128
TINY_CTX = 512

# GGML tensor type ids (different enum from the metadata value types above):
GGML_F32, GGML_F16 = 0, 1


def _f16(vals: list[float]) -> bytes:
    return struct.pack("<" + "e" * len(vals), *vals)


def _f32(vals: list[float]) -> bytes:
    return struct.pack("<" + "f" * len(vals), *vals)


def _deterministic(n: int) -> list[float]:
    return [((i * 37 + 11) % 200 - 100) / 100.0 for i in range(n)]


def build_tiny_llama_gguf(path: str) -> dict:
    """Build the tiny llama GGUF; returns the hparams used (for assertions)."""
    tokens = ["<unk>", "<s>", "</s>"] + [f"<0x{b:02X}>" for b in range(256)]
    assert len(tokens) == N_VOCAB
    merges: list[str] = []
    scores = [0.0] * N_VOCAB
    token_types = [1, 3, 3] + [6] * 256  # unk, bos/eos, byte-fallback

    kvs = [
        kv_str("general.architecture", "llama"),
        kv_str("general.name", "tiny-test"),
        kv_u32("llama.context_length", TINY_CTX),
        kv_u32("llama.embedding_length", N_EMBD),
        kv_u32("llama.block_count", N_LAYER),
        kv_u32("llama.feed_forward_length", FFN),
        kv_u32("llama.attention.head_count", N_HEAD),
        kv_u32("llama.attention.head_count_kv", N_KV_HEAD),
        kv_f32("llama.attention.layer_norm_rms_epsilon", 1e-5),
        kv_u32("llama.rope.dimension_start", 0),
        kv_u32("llama.rope.dimension_count", HEAD_DIM),
        kv_str("tokenizer.ggml.model", "llama"),
        kv_str_array("tokenizer.ggml.tokens", tokens),
        kv_arr_of("tokenizer.ggml.scores", T_F32, scores,
                  lambda v: struct.pack("<f", v)),
        kv_arr_of("tokenizer.ggml.token_type", T_I32, token_types,
                  lambda v: struct.pack("<i", v)),
        kv_str_array("tokenizer.ggml.merges", merges),
        kv_u32("tokenizer.ggml.unknown_token_id", 0),
        kv_u32("tokenizer.ggml.bos_token_id", 1),
        kv_u32("tokenizer.ggml.eos_token_id", 2),
        kv_u32("tokenizer.ggml.padding_token_id", 2),
    ]

    tensors: list[tuple[str, list[int], int, bytes]] = []
    tensors.append(("token_embd.weight", [N_EMBD, N_VOCAB], GGML_F16,
                    _f16(_deterministic(N_EMBD * N_VOCAB))))
    for layer in range(N_LAYER):
        p = f"blk.{layer}."
        tensors += [
            # Norms are f32: llama.cpp's CPU binary ops reject f16 norm
            # weights on this build (verified against release b11321).
            (p + "attn_norm.weight", [N_EMBD], GGML_F32,
             _f32(_deterministic(N_EMBD))),
            (p + "attn_q.weight", [N_EMBD, N_HEAD * HEAD_DIM], GGML_F16,
             _f16(_deterministic(N_EMBD * N_HEAD * HEAD_DIM))),
            (p + "attn_k.weight", [N_EMBD, N_KV_HEAD * HEAD_DIM], GGML_F16,
             _f16(_deterministic(N_EMBD * N_KV_HEAD * HEAD_DIM))),
            (p + "attn_v.weight", [N_EMBD, N_KV_HEAD * HEAD_DIM], GGML_F16,
             _f16(_deterministic(N_EMBD * N_KV_HEAD * HEAD_DIM))),
            (p + "attn_output.weight", [N_EMBD, N_EMBD], GGML_F16,
             _f16(_deterministic(N_EMBD * N_EMBD))),
            (p + "ffn_norm.weight", [N_EMBD], GGML_F32,
             _f32(_deterministic(N_EMBD))),
            (p + "ffn_gate.weight", [N_EMBD, FFN], GGML_F16,
             _f16(_deterministic(N_EMBD * FFN))),
            (p + "ffn_down.weight", [FFN, N_EMBD], GGML_F16,
             _f16(_deterministic(FFN * N_EMBD))),
            (p + "ffn_up.weight", [N_EMBD, FFN], GGML_F16,
             _f16(_deterministic(N_EMBD * FFN))),
        ]
    tensors += [
        ("output_norm.weight", [N_EMBD], GGML_F32, _f32(_deterministic(N_EMBD))),
        ("output.weight", [N_EMBD, N_VOCAB], GGML_F16,
         _f16(_deterministic(N_EMBD * N_VOCAB))),
    ]

    head = bytearray()
    head += struct.pack("<I", GGUF_MAGIC)
    head += struct.pack("<I", 3)
    head += struct.pack("<Q", len(tensors))
    head += struct.pack("<Q", len(kvs))
    for key, vtype, value in kvs:
        head += s(key) + struct.pack("<I", vtype) + value

    info_size = sum(len(s(name)) + 4 + 8 * len(shape) + 4 + 8
                    for name, shape, _, _ in tensors)
    data_start = len(head) + info_size
    data_start += (-data_start) % 32

    offsets: list[int] = []
    cur = data_start
    for _, _, _, payload in tensors:
        offsets.append(cur)
        cur += len(payload)
        cur += (-cur) % 32

    for (name, shape, tid, _), off in zip(tensors, offsets):
        head += s(name)
        head += struct.pack("<I", len(shape))
        for d in shape:
            head += struct.pack("<Q", d)
        head += struct.pack("<I", tid)
        # Tensor offsets are relative to the data section (verified against
        # the real parser: absolute offsets are rejected).
        head += struct.pack("<Q", off - data_start)
    head += b"\x00" * (data_start - len(head))

    blob = bytes(head)
    for (_, _, _, payload), off in zip(tensors, offsets):
        blob += b"\x00" * (off - len(blob)) + payload

    with open(path, "wb") as fh:
        fh.write(blob)
    return {"n_embd": N_EMBD, "n_layer": N_LAYER, "n_vocab": N_VOCAB,
            "ctx": TINY_CTX, "tensors": len(tensors)}


def kv_arr_of(key: str, elem_type: int, items: list, pack):
    payload = struct.pack("<I", elem_type) + struct.pack("<Q", len(items))
    payload += b"".join(pack(i) for i in items)
    return key, T_ARR, payload
