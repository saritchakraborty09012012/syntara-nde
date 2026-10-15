# LittleBit compression

`syntara compress` shrinks a locally held Hugging Face causal-LM checkpoint
into a **LittleBit-style ultra-low-bit artifact** — roughly 0.55 bits per
weight instead of 16 or 32 — then runs it through Syntara's normal routing
and runtime layers. The point is local-first: the model stays on your disk,
gets smaller, and keeps working through the same APIs.

The math (latent ±1 sign factorization, per-channel scales, SmoothSign QAT,
bits-per-weight rank budget) follows the LittleBit paper
(arXiv:2506.13771, NeurIPS 2025). The implementation in `syntara/compress/`
is an **independent reimplementation** — no code from the official
CC BY-NC 4.0 repository was copied. See `THIRD_PARTY_NOTICES.md`.

## Quick start

```bash
# compress at 0.55 bits-per-weight (residual branch on by default)
syntara compress path/to/model --outdir path/to/model-lb055 --bpw 0.55

# compare disk usage against the source
syntara storage path/to/model-lb055

# perplexity + side-by-side generations (integrity-checked)
syntara evaluate path/to/model-lb055 --source path/to/model --dataset wikitext --verify
```

The artifact is a normal model directory: it carries `config.json`, the
tokenizer sidecars, `littlebit.safetensors` and a `syntara_littlebit.json`
manifest. `syntara inspect` reports it as
`LittleBit 0.55 bpw +residual`, and routing selects the `littlebit`
runtime for it automatically — no special launcher is needed.

## How it works

1. **Validate** — source must be a directory with `config.json` and
   safetensors weights. Diffusion pipelines (`model_index.json`) and
   pickled `.bin`-only checkpoints are rejected with an actionable error;
   remote code is never executed.
2. **Census** — the architecture is instantiated on the *meta* device
   (`AutoModelForCausalLM.from_config`), so no weight values are
   allocated; every `nn.Linear`/`Conv1D` matrix is recorded with its
   geometry. Embeddings, norms and biases are passed through verbatim.
3. **Rank budget** — for each matrix the target bits-per-weight is
   converted into a rank (rounded to multiples of 8) so that
   signs + scales + residual signs land at the requested average.
   `--kv-factor` can spend extra bits on attention K/V projections.
4. **Factorize** — truncated SVD initialisation followed by the
   dual-SVID sign/rank-1 refinement; results are packed 1-bit-per-value
   (custom packer) with fp16 scales. With `--qat-steps N` each matrix
   gets N steps of weight-space SmoothSign QAT (lr 1e-2, best snapshot).
5. **Export** — per-tensor part files in a workspace directory with a
   journal, so an interrupted run resumes instead of restarting. Publish
   is atomic (swap with backup); the source checkpoint is never modified.

## Runtime

`LittleBitRuntime` (a `TransformersRuntime` subclass) deep-verifies the
manifest (sha256 + per-tensor dimension checks) before loading, copies
passthrough tensors first, then swaps each factorized module for a
`LittleBitLinear` that computes

```
Y = (((X * g) @ V_s) * ell) @ U_s^T * h      (+ residual branch)
```

without ever forming the dense `W`. Both `nn.Linear` and GPT-2-style
`Conv1D` modules are supported (the whole module is replaced, bias
preserved). Compute runs in fp32 internally and casts back to the input
dtype, so bf16/fp16 checkpoints stay dtype-transparent.

## Measured results (CPU, this repository)

| model | source | artifact | ratio | avg bpw | compress time |
|---|---|---|---|---|---|
| GPT-2 (124M) | 548.1 MB | 217.0 MB | 2.53x | 0.544 | 31 s (QAT-200: 18 min) |
| SmolLM2-135M | 269.1 MB | 67.3 MB | 4.00x | 0.526 | 59 s |

Generation throughput is close to the dense source (GPT-2: 14.0 vs
15.4 tok/s; SmolLM2: 7.8 vs 12.6 tok/s — the gap is the fp32 internal
compute of the factorized layers, not the factorization math).

## Honest limitations

- **Fidelity at 0.55 bpw is lossy.** Without QAT, wikitext perplexity
  degrades badly (GPT-2: 881k vs source 30). Weight-space QAT improves
  it ~8x (109k) but does **not** restore source quality — matching the
  paper would require task-loss QAT at training scale. Treat
  `--qat-steps` as a fidelity dial, and evaluate your own checkpoints
  with `syntara evaluate` before shipping.
- **Causal-LM safetensors only.** GGUF inputs, diffusion pipelines and
  `.bin`-only checkpoints are rejected (Test D verifies the rejection is
  clean and actionable).
- **Tied `lm_head`** is stored once with the embedding;
  `--include-lm-head` on a tied checkpoint raises a clear error.
- **Deep verification runs on every load** (hash of the weights file +
  tensor dims) — a deliberate security choice that costs a few seconds.
- Artifact load currently rebuilds factorized modules in Python; a
  prepacked cache would speed up cold starts.

## CLI flags

| flag | default | meaning |
|---|---|---|
| `--bpw` | 0.55 | target bits per weight for compressed matrices |
| `--no-residual` | residual on | drop the second sign pair (saves bits, lowers fidelity) |
| `--kv-factor` | 1.0 | multiply rank of attention K/V projections |
| `--include-lm-head` | off | attempt to compress the LM head (errors if tied) |
| `--min-layer-params` | 4096 | pass through matrices smaller than this |
| `--qat-steps` | 0 | SmoothSign QAT steps per matrix |
| `--fast-svd` | off | approximate SVD (faster, lower quality init) |
| `--force` | off | rebuild instead of resuming the workspace |

Exit codes follow the CLI conventions: `0` success, non-zero with a
`syntara: ...` message on failure. `syntara compress --help` lists the
authoritative flag set.
