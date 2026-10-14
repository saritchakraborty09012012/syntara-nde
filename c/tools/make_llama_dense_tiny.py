#!/usr/bin/env python3
r"""Generate the tiny Llama-dense checkpoint used by tests/test_llama_dense_tiny.py.

numpy-only and deterministic: CI regenerates model.safetensors from SEED and
byte-identical weights come out on every platform (NumPy's PCG64 stream and
elementwise float32 arithmetic are platform-stable).  Unlike the MoE engines'
fixtures, the reference logits AND tokens are computed here by a float64
numpy oracle that re-implements HF LlamaForCausalLM's math (rmsnorm, half-split
RoPE, grouped-query attention, SwiGLU) — an independent second implementation
of the same equations the C engine runs in float32, so a wiring bug in either
one shows up as a mismatch instead of canceling out.

The fixture is deliberately the smallest checkpoint that still crosses every
distinct execution path of llama_dense.c:

  - grouped-query attention (4 query heads / 2 kv heads, group = 2)
  - per-head q_norm / k_norm BEFORE RoPE (Llama-3 style, optional tensors)
  - half-split RoPE at real absolute positions (prefill + decode)
  - SwiGLU MLP, untied lm_head, per-layer pre- and post-attention RMS norms

Geometry: hidden 32, 2 layers, head_dim 8, inter 64, vocab 261, ctx 512.

Greedy determinism is engineered, not hoped for: lm_head is a scaled cyclic
shift of embed_tokens, giving every position a wide top-1 logit margin instead
of relying on accidental near-ties between random rows, and the five special
rows (256-260) are zeroed so the greedy head can never emit a control token —
the generated sequence is guaranteed to stay in the plain byte range, which is
what the serve smoke test's payload-bytes comparison relies on.  The margin is
then verified, not assumed: the generator asserts a minimum top1-top2 logit gap
at every emitted position before writing ref.json.

The tokenizer is a GPT-2-style byte-level BPE with an EMPTY merges list, which
c/tok.h treats as rankbpe mode (tiktoken-style: merge by lowest vocab id of the
concatenation; with only single-byte entries in the vocab no pair ever merges,
so every ASCII letter is its own token with id == its byte value).  Five
Llama-3 control tokens live in added_tokens at ids 256-260.  The
pre_tokenizer's Split regex is cl100k WITHOUT \p{Lu} / \p{Han}, so tok.h stays
on its cl100k path.
"""

import argparse
import json
import struct
import sys
from pathlib import Path

import numpy as np

SEED = 20261014

HIDDEN = 32
LAYERS = 2
HEADS = 4
KV_HEADS = 2
HEAD_DIM = 8
INTER = 64
VOCAB = 261                 # 256 byte tokens + 5 Llama-3 specials
MAX_POS = 512
THETA = 10000.0
EPS = 1e-5
GEN_LEN = 8

BOS_ID = 256                # <|begin_of_text|>
EOS_ID = 257                # <|end_of_text|>
EOT_ID = 258                # <|eot_id|>
START_HEADER_ID = 259       # <|start_header_id|>
END_HEADER_ID = 260         # <|end_header_id|>
SPECIAL_IDS = (BOS_ID, EOS_ID, EOT_ID, START_HEADER_ID, END_HEADER_ID)
PROMPT_TEXT = "hi"
PROMPT_IDS = [BOS_ID, ord("h"), ord("i")]

# cl100k Split regex: deliberately contains neither \p{Lu} (would flip tok.h
# to its o200k path) nor \p{Han} (would flip it to the Kimi path).
CL100K_REGEX = (
    r"[^\r\n\p{L}\p{N}]?[\p{L}\p{M}]*(?:'s|'t|'re|'ve|'m|'ll|'d)?"
    r"|[^\r\n\p{L}\p{N}][\p{L}\p{M}]+(?:'s|'t|'re|'ve|'m|'ll|'d)?"
    r"|\p{N}{1,3}| ?[^\s\p{L}\p{N}]+[\r\n/]*|\s*[\r\n]+|\s+(?!\S)|\s+"
)

CONFIG = {
    "architectures": ["LlamaForCausalLM"],
    "model_type": "llama",
    "hidden_size": HIDDEN,
    "intermediate_size": INTER,
    "num_hidden_layers": LAYERS,
    "num_attention_heads": HEADS,
    "num_key_value_heads": KV_HEADS,
    "head_dim": HEAD_DIM,
    "vocab_size": VOCAB,
    "max_position_embeddings": MAX_POS,
    "rms_norm_eps": EPS,
    "rope_theta": THETA,
    "rope_scaling": None,
    "attention_bias": False,
    "mlp_bias": False,
    "tie_word_embeddings": False,
    "bos_token_id": BOS_ID,
    "eos_token_id": EOS_ID,
    "pad_token_id": None,
}

ST_DTYPE = {np.dtype("float32"): "F32"}


def gpt2_bytes_to_unicode():
    """GPT-2 / ByteLevel byte -> unicode codepoint map (same table tok.h
    builds in tk_build_bytemap)."""
    direct = set(range(33, 127)) | set(range(161, 173)) | set(range(174, 256))
    mapping, n = {}, 0
    for b in range(256):
        if b in direct:
            mapping[b] = b
        else:
            mapping[b] = 256 + n
            n += 1
    return mapping


def build_tokenizer():
    byte2cp = gpt2_bytes_to_unicode()
    # vocab maps the byte-level unicode string to the raw byte's id, so a
    # single ASCII letter round-trips: id == ord(letter)
    vocab = {}
    for b in range(256):
        vocab[chr(byte2cp[b])] = b
    specials = [
        (BOS_ID, "<|begin_of_text|>"),
        (EOS_ID, "<|end_of_text|>"),
        (EOT_ID, "<|eot_id|>"),
        (START_HEADER_ID, "<|start_header_id|>"),
        (END_HEADER_ID, "<|end_header_id|>"),
    ]
    added = [
        {"id": sid, "content": content, "single_word": False,
         "lstrip": False, "rstrip": False, "normalized": False,
         "special": True}
        for sid, content in specials
    ]
    return {
        "version": "1.0",
        "truncation": None,
        "padding": None,
        "added_tokens": added,
        "normalizer": None,
        "pre_tokenizer": {
            "type": "Sequence",
            "pretokenizers": [
                {"type": "Split",
                 "pattern": {"Regex": CL100K_REGEX},
                 "behavior": "Isolated",
                 "invert": False},
                {"type": "ByteLevel", "add_prefix_space": False,
                 "trim_offsets": True, "use_regex": False},
            ],
        },
        "post_processor": None,
        "decoder": {"type": "ByteLevel", "add_prefix_space": True,
                    "trim_offsets": True, "use_regex": True},
        "model": {
            "type": "BPE",
            "dropout": None,
            "unk_token": None,
            "continuing_subword_prefix": None,
            "end_of_word_suffix": None,
            "fuse_unk": False,
            "byte_fallback": False,
            "ignore_merges": True,
            "vocab": vocab,
            "merges": [],
        },
    }


def build_tensors(seed):
    rng = np.random.default_rng(seed)
    tensors = {}

    def put(name, arr):
        assert name not in tensors, name
        tensors[name] = np.ascontiguousarray(arr)

    def normal(*shape, s=0.08):
        return (rng.standard_normal(shape) * s).astype(np.float32)

    def ones(n):
        return np.ones(n, dtype=np.float32)

    embed = normal(VOCAB, HIDDEN)
    put("model.embed_tokens.weight", embed)
    put("model.norm.weight", ones(HIDDEN))
    # scaled cyclic shift of the embedding: token t points firmly at
    # (t+1) % VOCAB, and the five special rows are zeroed so greedy argmax
    # can never land on a control token
    lm_head = np.roll(embed, -1, axis=0).astype(np.float64) * 3.0
    for sid in SPECIAL_IDS:
        lm_head[sid] = 0.0
    put("lm_head.weight", lm_head.astype(np.float32))

    for i in range(LAYERS):
        p = f"model.layers.{i}."
        put(p + "input_layernorm.weight", ones(HIDDEN))
        put(p + "post_attention_layernorm.weight", ones(HIDDEN))
        a = p + "self_attn."
        put(a + "q_proj.weight", normal(HEADS * HEAD_DIM, HIDDEN))
        put(a + "k_proj.weight", normal(KV_HEADS * HEAD_DIM, HIDDEN))
        put(a + "v_proj.weight", normal(KV_HEADS * HEAD_DIM, HIDDEN))
        put(a + "o_proj.weight", normal(HIDDEN, HEADS * HEAD_DIM))
        put(a + "q_norm.weight", ones(HEAD_DIM))
        put(a + "k_norm.weight", ones(HEAD_DIM))
        put(p + "mlp.gate_proj.weight", normal(INTER, HIDDEN))
        put(p + "mlp.up_proj.weight", normal(INTER, HIDDEN))
        put(p + "mlp.down_proj.weight", normal(HIDDEN, INTER))
    return tensors


def write_safetensors(path, tensors):
    header, offset = {}, 0
    for name, arr in tensors.items():
        header[name] = {
            "dtype": ST_DTYPE[arr.dtype],
            "shape": list(arr.shape),
            "data_offsets": [offset, offset + arr.nbytes],
        }
        offset += arr.nbytes
    blob = json.dumps(header, separators=(",", ":"), sort_keys=False).encode()
    blob += b" " * ((-len(blob)) % 8)
    with open(path, "wb") as fh:
        fh.write(struct.pack("<Q", len(blob)))
        fh.write(blob)
        for arr in tensors.values():
            fh.write(arr.tobytes())


# ---------------------------------------------------------------------------
# float64 oracle: one-token-at-a-time HF LlamaForCausalLM, in numpy
# ---------------------------------------------------------------------------

def rmsnorm(x, w, eps):
    ms = np.mean(x.astype(np.float64) ** 2, axis=-1, keepdims=True)
    return (x.astype(np.float64) * (1.0 / np.sqrt(ms + eps))
            * w.astype(np.float64))


def rope_half(x, pos):
    """Half-split RoPE (HF rotate_half): pair (j, j + hd/2) rotated by
    theta^(-2j/hd) at absolute position pos, applied per head row."""
    hd = x.shape[-1]
    j = np.arange(hd // 2)
    inv = THETA ** (-2.0 * j / hd)
    ang = pos * inv
    cs, sn = np.cos(ang), np.sin(ang)
    x1 = x[..., :hd // 2].astype(np.float64)
    x2 = x[..., hd // 2:].astype(np.float64)
    out = np.empty(x1.shape[:-1] + (hd,), dtype=np.float64)
    out[..., :hd // 2] = x1 * cs - x2 * sn
    out[..., hd // 2:] = x2 * cs + x1 * sn
    return out


def oracle_forward(tensors, ids):
    """Run the model over ids[0..len-1]; return float64 logits of the LAST
    position, plus the per-position greedy argmax trace."""
    x = tensors["model.embed_tokens.weight"].astype(np.float64)[list(ids)]
    S = len(ids)
    G = HEADS // KV_HEADS
    for i in range(LAYERS):
        p = f"model.layers.{i}."
        a = p + "self_attn."
        h = rmsnorm(x, tensors[p + "input_layernorm.weight"], EPS)
        q = h @ tensors[a + "q_proj.weight"].astype(np.float64).T
        k = h @ tensors[a + "k_proj.weight"].astype(np.float64).T
        v = h @ tensors[a + "v_proj.weight"].astype(np.float64).T
        q = q.reshape(S, HEADS, HEAD_DIM)
        k = k.reshape(S, KV_HEADS, HEAD_DIM)
        v = v.reshape(S, KV_HEADS, HEAD_DIM)
        # per-head q/k norm BEFORE RoPE (Llama-3), weight is ones here
        for hh in range(HEADS):
            q[:, hh] = rmsnorm(q[:, hh], tensors[a + "q_norm.weight"], EPS)
        for kvh in range(KV_HEADS):
            k[:, kvh] = rmsnorm(k[:, kvh], tensors[a + "k_norm.weight"], EPS)
        for pos in range(S):
            q[pos] = rope_half(q[pos], pos)
            k[pos] = rope_half(k[pos], pos)
        scale = 1.0 / np.sqrt(HEAD_DIM)
        ctx = np.empty((S, HEADS, HEAD_DIM), dtype=np.float64)
        for hh in range(HEADS):
            kvh = hh // G
            for pos in range(S):
                scores = (q[pos, hh] @ k[:pos + 1, kvh].T) * scale
                weights = np.exp(scores - scores.max())
                weights /= weights.sum()
                ctx[pos, hh] = weights @ v[:pos + 1, kvh]
        attn = ctx.reshape(S, HEADS * HEAD_DIM) \
            @ tensors[a + "o_proj.weight"].astype(np.float64).T
        x = x + attn
        h = rmsnorm(x, tensors[p + "post_attention_layernorm.weight"], EPS)
        gate = h @ tensors[p + "mlp.gate_proj.weight"].astype(np.float64).T
        up = h @ tensors[p + "mlp.up_proj.weight"].astype(np.float64).T
        silu = gate / (1.0 + np.exp(-gate))
        mlp = (silu * up) @ tensors[p + "mlp.down_proj.weight"].astype(np.float64).T
        x = x + mlp
    last = rmsnorm(x[-1], tensors["model.norm.weight"], EPS)
    logits = last @ tensors["lm_head.weight"].astype(np.float64).T
    return logits


def oracle_generate(tensors, prompt_ids, gen_len, min_margin):
    """Greedy decode gen_len tokens; assert a wide top1-top2 margin at every
    step so the float32 engine cannot flip the argmax."""
    ids = list(prompt_ids)
    prefill_logits = oracle_forward(tensors, ids)
    gen = []
    logits = prefill_logits
    for step in range(gen_len):
        order = np.argsort(logits)[::-1]
        top1, top2 = int(order[0]), float(logits[order[0]] - logits[order[1]])
        assert top1 not in SPECIAL_IDS, (
            f"seed {SEED}: greedy step {step} lands on special id {top1}")
        assert top2 >= min_margin, (
            f"seed {SEED}: step {step} top1-top2 margin {top2:.4f} "
            f"< {min_margin}")
        gen.append(top1)
        ids.append(top1)
        logits = oracle_forward(tensors, ids)
    return prefill_logits, gen


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--output", default="./llama_dense_tiny")
    parser.add_argument("--force", action="store_true",
                        help="overwrite an existing model.safetensors")
    parser.add_argument("--min-margin", type=float, default=0.05,
                        help="minimum top1-top2 logit gap per greedy step")
    args = parser.parse_args()

    out = Path(args.output)
    out.mkdir(parents=True, exist_ok=True)
    model_path = out / "model.safetensors"
    if model_path.exists() and not args.force:
        print(f"{model_path} exists; use --force to regenerate",
              file=sys.stderr)
        return 1

    # The cyclic-shift lm_head already keeps specials out of argmax; the
    # seed loop only has to confirm the margin.  First seed wins normally.
    chosen = None
    for attempt in range(64):
        seed = SEED + attempt
        tensors = build_tensors(seed)
        try:
            prefill_logits, gen = oracle_generate(
                tensors, PROMPT_IDS, GEN_LEN, args.min_margin)
        except AssertionError as exc:
            print(f"seed {seed} rejected: {exc}", file=sys.stderr)
            continue
        chosen = (seed, tensors, prefill_logits, gen)
        break
    if chosen is None:
        print("no seed produced a wide-margin greedy sequence",
              file=sys.stderr)
        return 1
    seed, tensors, prefill_logits, gen = chosen

    write_safetensors(model_path, tensors)
    (out / "config.json").write_text(json.dumps(CONFIG, indent=2) + "\n")
    (out / "tokenizer.json").write_text(
        json.dumps(build_tokenizer(), separators=(",", ":")) + "\n")

    gen_text = bytes(g for g in gen if g < 256).decode("utf-8", "replace")
    ref = {
        "ids": PROMPT_IDS,
        "text": PROMPT_TEXT,
        "logits": [float(v) for v in prefill_logits],
        "gen": gen,
        "gen_text": gen_text,
        "seed": seed,
    }
    (out / "ref.json").write_text(json.dumps(ref, indent=2) + "\n")

    total = sum(a.nbytes for a in tensors.values())
    print(f"{out}: {len(tensors)} tensors, {total / 1e3:.1f} kB, "
          f"{LAYERS} layers GQA {HEADS}/{KV_HEADS}, hidden {HIDDEN}, "
          f"seed {seed}, gen {gen}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
