# OpenAI-compatible API, KV contexts & web UI

The Python SDK and the developer CLI wrap this API from pip; see
[`docs/sdk-cli.md`](sdk-cli.md).

## `syntara serve`

`syntara serve` keeps one model process loaded and exposes a text-only
OpenAI-compatible HTTP API. The gateway uses only the Python standard library;
inference still runs in the same dependency-free C engine.

```bash
cd c
SYNTARA_MODEL=/nvme/glm52_i4 SYNTARA_API_KEY=local-secret ./syntara serve \
  --host 127.0.0.1 --port 8000 --model-id glm-5.2-syntara

curl http://127.0.0.1:8000/v1/chat/completions \
  -H 'Authorization: Bearer local-secret' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "glm-5.2-syntara",
    "messages": [{"role": "user", "content": "Hello"}],
    "stream": true
  }'
```

Implemented endpoints are `GET /v1/models`, `GET /v1/models/{model}`,
`POST /v1/chat/completions`, and legacy `POST /v1/completions`. Chat and
completion requests support JSON responses, SSE streaming, usage counts,
`max_tokens`/`max_completion_tokens`, `temperature`, `top_p`, and up to four
custom `stop` sequences. Stop sequences are removed from the response and end
generation early in both JSON and streaming modes. The extension
`x_syntara_ignore_leading_stop: true` discards leading stop sequences until
the first non-whitespace response content, which is useful for local templates
that occasionally emit a role marker before the answer; strict OpenAI stop
behavior remains the default for client-provided sequences. GLM chat requests
with no client `stop` automatically use the template's `<|user|>` and
`<|observation|>` role markers, patiently ignoring only leading markers; this
prevents a model-completed turn from silently generating a new user or tool
turn. Inkling chat and legacy completion requests receive no implicit GLM stop
sequences. The extension
`enable_thinking: true` enables GLM-5.2's reasoning block; the standard
`reasoning_effort` field also enables it unless set to `none`.

The server serves one generation at a time: the model stays in one persistent
process, so concurrent HTTP requests queue instead of loading duplicate model
copies. Tool calling depends on the active engine; see the support matrix below.
Images, log probabilities, and token penalties return an explicit error rather
than being silently ignored. Audio is accepted only by Inkling checkpoints with
audio support. The default bind address is localhost; set `SYNTARA_API_KEY` before
exposing the server beyond the machine.

### Tool-calling support

| Engine | OpenAI `tools` | Anthropic `tool_use` | Native format |
|---|---|---|---|
| GLM-5.2 (`syntara`) | yes | yes | `<tool_call>` blocks |
| DeepSeek V4 | yes | yes | native DSML tool-call blocks |
| Inkling | no | no | active tool declarations/choices return HTTP 400 |
| Kimi K3 | yes | yes | native XTML `tools`/`call`/`argument` blocks (#1143) |
| Qwen3.8-Flash-Next | no | no | active tool declarations/choices return HTTP 400 |
| OLMoE | no | no | active tool declarations/choices return HTTP 400 |

On supported engines, pass OpenAI `tools` and optionally `tool_choice` to
`/v1/chat/completions`. The Anthropic endpoint translates `tools`,
`tool_use`/`tool_result`, and the `auto`, `any`, `none`, and forced-tool choice
modes into the active engine's native prompt and back into protocol responses.
Protocol support does not guarantee that every quantized model emits valid
tool syntax; `SYNTARA_TOOL_SALVAGE=1` is an opt-in recovery path for malformed GLM
int4 tool calls. DeepSeek V4 uses its strict native DSML parser instead.

When a reverse proxy or MagicDNS hostname preserves a public `Host` header,
trust that exact hostname with repeatable `--allowed-host` options. The
comma-separated `SYNTARA_ALLOWED_HOSTS` environment variable is equivalent:

```bash
SYNTARA_ALLOWED_HOSTS=llm.example.com ./syntara serve --model /nvme/glm52_i4
# or: ./syntara serve --model /nvme/glm52_i4 --allowed-host llm.example.com
```

Only configure hostnames or IP addresses you control; there is no wildcard.
This setting extends the DNS-rebinding allowlist and is independent of CORS and
API-key authentication.

Browser access from the Vite development server and Tauri local origins is
enabled by default. Repeat `--cors-origin https://your-ui.example` to allow
another exact origin, or use `--cors-origin '*'` only on a trusted local
network.

The engine owns its KV contexts, so HTTP generation uses a bounded FIFO
admission queue instead of pretending to run unsafe parallel sequences.
Configure it with `--max-queue N` (default 8) and `--queue-timeout SECONDS`
(default 300), or the `SYNTARA_MAX_QUEUE` / `SYNTARA_QUEUE_TIMEOUT` environment
variables. Saturated and timed-out requests receive OpenAI-shaped HTTP 429
errors before streaming headers are sent. `GET /health` exposes
active/queued/completed/rejected counters, and successful generation responses
include `x-syntara-queue-wait-ms`.

## Anthropic-protocol endpoint (`/v1/messages`)

The same server also speaks the **Anthropic Messages API**, so clients that only talk
to Anthropic endpoints — Claude Code, the Anthropic SDKs — work against syntara
without a shim. Nothing to enable: `/v1/messages` is served alongside
`/v1/chat/completions` on the same port.

```bash
curl http://127.0.0.1:8000/v1/messages \
  -H 'x-api-key: local' -H 'content-type: application/json' \
  -d '{"model":"glm-5.2-syntara","max_tokens":128,
       "messages":[{"role":"user","content":"Hello"}]}'
```

For Claude Code, point it at the server and give it any non-empty key:

```bash
export ANTHROPIC_BASE_URL=http://localhost:8000
export ANTHROPIC_API_KEY=local            # only enforced if you set SYNTARA_API_KEY
export ANTHROPIC_MODEL=glm-5.2-syntara
claude
```

Supported on every served architecture: system prompts (string or text blocks),
multi-turn `user`/`assistant` messages, streaming with the full named-event
sequence (`message_start` → `content_block_*` → `message_delta` → `message_stop`,
plus protocol `ping` keepalives during long prefills), `stop_reason`, Anthropic
`usage` field names, and `x-api-key` authentication (`Authorization: Bearer`
also works). The gateway renders each request with the active engine's native
chat template; GLM, Inkling, Kimi K3, Qwen3.8, OLMoE, and DeepSeek V4 prompts are not
interchangeable. Where the engine exposes a reasoning mode, extended thinking
is enabled with `{"thinking": {"type": "enabled"}}` and translated to that
architecture's reasoning protocol; OLMoE disables it explicitly.

Tool use follows the per-engine matrix above. Unsupported engines reject active
tool declarations and choices explicitly instead of feeding another
architecture's markers to an incompatible tokenizer.

Not supported, and refused explicitly rather than ignored: `stop_sequences`,
`top_k`, and non-text content blocks (images, documents). Errors use Anthropic's
own `{"type":"error","error":{...}}` envelope on this path. Architecture-local
features that have not been wired to this protocol are likewise rejected with
an explicit error.

> The prefill warning below applies here too, and applies *hardest* to Claude Code:
> its system prompt and tool catalog are large, and on a disk-streaming CPU path
> that is a long silent wait before the first token. Read it before you connect.

## Connect a coding CLI or editor

The API is OpenAI-compatible, so most coding CLIs and editor extensions work by
pointing them at Syntara as an *OpenAI-compatible* provider. Three settings:

- **Base URL** — `http://localhost:8000/v1`
- **Model** — `glm-5.2-syntara` (or whatever you pass to `--model-id`)
- **API key** — any non-empty string, e.g. `local`

Syntara needs **no** API key by default, but many clients refuse to start without
one — give them any dummy value. The key is only enforced if you set `SYNTARA_API_KEY`.

Smoke-test the endpoint first (no key needed unless you set one):

```bash
curl http://127.0.0.1:8000/v1/chat/completions \
  -H 'Content-Type: application/json' \
  -d '{"model":"glm-5.2-syntara","messages":[{"role":"user","content":"hi"}]}'
```

**aider**

```bash
export OPENAI_API_BASE=http://localhost:8000/v1
export OPENAI_API_KEY=local
aider --model openai/glm-5.2-syntara     # the openai/ prefix routes to OPENAI_API_BASE
```

**crush** — add a provider to `crush.json` (`~/.config/crush/crush.json`, or
`%USERPROFILE%\AppData\Local\crush\crush.json` on Windows):

```json
{
  "$schema": "https://charm.land/crush.json",
  "providers": {
    "syntara": {
      "name": "Syntara",
      "type": "openai-compat",
      "base_url": "http://localhost:8000/v1/",
      "api_key": "local",
      "models": [
        { "name": "GLM-5.2 (Syntara)", "id": "glm-5.2-syntara",
          "context_window": 131072, "default_max_tokens": 1024 }
      ]
    }
  }
}
```

The `"api_key": "local"` dummy is what satisfies clients that demand a key.
`context_window` is only the client's budget display — set it to whatever your
KV configuration actually allows.

**Continue, Cline / Roo, `llm`, the OpenAI SDKs, …** — set the provider's base
URL to `http://localhost:8000/v1`, the model to `glm-5.2-syntara`, and any dummy
key (`OPENAI_API_KEY` / `OPENAI_BASE_URL` for env-based tools).

> **Set your expectations before connecting an agentic CLI.** Two costs dominate,
> and the first one is invisible until you know it's there:
>
> 1. **Prefill.** Coding agents (crush, aider in repo-map mode, Cline, …) send a
>    large system prompt plus tool definitions — often 10–20k tokens — *before
>    your first word*. Prefill on the CPU-streaming path runs at a few tokens per
>    second (it is attention-bound, see #153), so a 15k-token agent preamble is
>    **an hour of silent "thinking" before the first output token**. The client
>    looks hung; it isn't. Smoke-test with the tiny `curl` above first — if that
>    answers in about a minute, the pipeline works and what you're paying for is
>    prompt size.
> 2. **Decode.** Roughly 1 tok/s for a large model, so multi-turn agent loops
>    (which re-pay the growing context every turn) compound the cost.
>
> Practical guidance: single surgical asks with a short context work; iterative
> agent sessions against a disk-streaming 744B model do not resemble a hosted
> API and mostly won't be worth the wait. If your client lets you trim or disable
> its system preamble and tool catalog, do it.

## Isolated KV contexts

`syntara serve --kv-slots N` allocates up to 16 independent sequence contexts.
Requests select one with the optional integer `cache_slot` field; ordinary
OpenAI clients omit it and keep the original slot 0 behavior.

```json
{
  "model": "glm-5.2-syntara",
  "messages": [{"role": "user", "content": "Continue this conversation"}],
  "cache_slot": 1
}
```

Each slot owns its token history, compressed MLA/DSA KV memory, MTP window, and
crash-safe persistence file (`.syntara_kv`, `.syntara_kv.1`, ...). The engine matches
each request's tokenized prompt against the slot's history and reuses the common
KV prefix, so stateless HTTP turns keep their cache across requests and even
across engine restarts. Use `SYNTARA_KV_SLOTS=N` as the environment equivalent.
Start small: at the default 4096-token context, every slot costs hundreds of MB.

## Web dashboard

One command serves the OpenAI-compatible API **and** the web console on the
same port, then opens your browser when the engine is ready:

```bash
cd web && npm install && npm run build   # once
./syntara web --model <model-dir>
```

`syntara web` differs from `syntara serve` only in opening a browser — both serve the
dashboard on the same port. On a headless host (no display, often no GPU at all)
use `syntara serve`, or `syntara web --no-browser`, and point a browser at it from
another machine. Nothing in the dashboard needs a desktop session on the host.

What you get is one workspace with a dock to switch page:

- **Chat**: streaming answers, a reasoning toggle, image input where the engine
  supports it, the KV slot to answer in, and the conversation exported as a file;
- **Brio**: closed-set answers. A document, a question and the only answers
  allowed; the engine reads the probability of each answer, generates nothing,
  and reports an entropy that says when it is not sure. Same thing as
  `POST /v1/brio` (see [brio.md](brio.md));
- **Brain**, two views. *Explore* draws the
  [measured expert atlas](https://github.com/NoirDemons/Syntara/issues/175) of GLM-5.2 as a cortex with ten regions to
  enter (publish `experts.json` from `tools/expert_atlas/analyze.py --web`).
  *Live routing* shows the model actually running: one cell per expert,
  colour = tier, brightness = routing heat, and the experts routed in each
  turn flash white and decay;
- **Profiling**: where the engine spends each turn, by phase (I/O wait, expert
  matmul, attention, LM head, other), the disk service overlapped with compute,
  and the last 30 turns as a trend;
- a light and a dark theme.

The dashboard talks to the engine over a small line protocol and plain JSON
endpoints — nothing heavier than the engine itself. `web/` is a pure OpenAI-API
client (React + TypeScript) and also works against any other compatible
endpoint; the terminal `syntara chat` remains the first-class interface.

The layout is responsive down to phone widths; the per-turn time breakdown and
the tok/s trend live on the Profiling page:

<p align="center">
  <img src="media/syntara-mobile.png" width="270" alt="the dashboard on a phone-sized viewport" />
  &nbsp;&nbsp;
  <img src="media/syntara-profiling.png" width="560" alt="the Profiling page: where the engine spends each turn" />
</p>
