# Llama dense engine (`c/llama_dense.c`)

A sibling engine for dense Llama checkpoints (Llama-3 family and compatible
GQA variants), following the one-engine-per-family pattern (`syntara.c` =
GLM-5.2, `olmoe.c`, `kimi_k3.c`). It shares `st.h`, `json.h`, `tok.h`,
`sample.h`, `cli_args.h`, `serve_codec.h` and `omp_tune.h`, and touches
nothing in the other engines. CPU-only: no `SYNTARA_CUDA` code and the
Makefile rule links `NOCUDA_LDFLAGS`, so the planner never offers a VRAM
tier for this family.

```
make llama_dense
./llama_dense <dir> <max_new_tokens> <ref.json>
```

Or through the launcher, which is where the chat template lives:

```
syntara chat  --model <dir>
syntara serve --model <dir>
syntara web   --model <dir>
```

## Getting the model

No conversion is needed. The engine loads BF16, F16 or F32 safetensors
directly through `st_read_f32` (which upcasts all three to F32 in memory),
so a standard Hugging Face Llama snapshot runs as-is: copy `config.json`,
`tokenizer.json` and the `model*.safetensors` shards into one directory and
point `--model` / `SNAP` at it. `syntara convert` will refuse the checkpoint
with a pointer here rather than guessing at a quantization path.

## Architecture notes

Conventional grouped-query attention (GQA) with rotary position embeddings
and a dense SwiGLU MLP per layer — no experts, no recurrent state, no
hyper-connections. The KV cache is sized `num_hidden_layers * CTX *
num_key_value_heads * head_dim` floats for K and the same for V; a config
without `num_key_value_heads` falls back to full MHA (every head), matching
the Hugging Face default. RoPE is the standard `rotate_half` formulation
with `inv_freq` computed at load time.

The chat template is Llama-3's (`<|begin_of_text|>` … `<|start_header_id|>`
… `<|eot_id|>` frames), rendered by `render_chat_llama` in
`openai_server.py`; the engine's tokenizer maps the specials to ids 256–260
(BOS, EOS, EOT, start_header, end_header), which are the tokens the sampler
stops on. Tool use and thinking blocks do not exist in this template, so
the gateway refuses tool parameters for this family rather than emitting
syntax the model was never trained on.

The wire protocol (SERVE mode) is byte-identical to the other engines:
READY/STAT/HWINFO on startup, DATA frames (optionally with a logprob tail),
DONE with prompt-token and length-limit counters, PROF with wall-clock and
per-phase timings. The engine reads `CTX` for its context window, the same
variable the planner injects.

## Tiny oracle fixture

`tools/make_llama_dense_tiny.py` generates a deterministic miniature
checkpoint (2 layers, hidden 32, GQA 4/2, ~141 kB) plus a float64 oracle of
the forward pass, both seeded so the generated token ids are stable. The
fixture's lm_head is a cyclic shift of the embedding scaled ×3 with special
rows zeroed, guaranteeing greedy generation never lands on a control token.
`tests/test_llama_dense_tiny.py` compares the engine's F32 logits against
the oracle (max abs error < 1e-3, measured ~1e-6) and asserts token-exact
generation, serve-mode framing, the logprob tail and the structured
CONTEXT_EXCEEDED frame. Regenerate with:

```
python3 tools/make_llama_dense_tiny.py --output llama_dense_tiny
```

## Environment variables

| Variable | Read by | Meaning |
| --- | --- | --- |
| `CTX` | `c/llama_dense.c` | Context window (prompt + generation). The planner injects the granted value; default 4096, registered maximum 131072. |
| `SNAP` | `c/llama_dense.c` | Model directory, same as the other engines (the launcher sets it). |
| `MAX_NEW` / `TEMP` / `NUCLEUS` | `c/llama_dense.c` | Generation length, temperature and top-p, identical semantics to the sibling engines. |
| `OMP_NUM_THREADS` | `omp_tune.h` | Thread ceiling for the OpenMP regions (attention and MLP GEMMs). |
