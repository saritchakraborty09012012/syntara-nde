# Syntara + n8n

Use n8n's HTTP Request/OpenAI-compatible nodes against the local Syntara endpoint:

```text
POST http://127.0.0.1:8000/v1/chat/completions
Content-Type: application/json
```

Inference stays on the machine that runs Syntara. The model name must be a model
that is installed in your local Syntara installation.

## Template

`syntara-chat.json` is a single HTTP Request node. It expects an input item with:

- `prompt` — the user message (required)
- `model` — model id; when the field is missing, `qwen` is used as a fallback

Example prior node output: `{ "prompt": "Summarize this thread", "model": "llama-3.1-8b" }`

## Streaming

The template uses non-streaming completions. To stream, POST with
`"stream": true` and parse the `text/event-stream` response with n8n's SSE
support; only do this if your workflow consumes chunks correctly — a client that
ignores SSE events will hang waiting for a normal JSON body.

## Security

Keep `127.0.0.1` as the bind address unless you deliberately expose Syntara to
your LAN, and recreate workflows after changing the endpoint. Do not point this
node at a public internet address.