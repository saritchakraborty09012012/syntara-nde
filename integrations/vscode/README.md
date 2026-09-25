# Syntara for VS Code

This integration talks only to the Syntara runtime on the user's machine. It does
not host model weights.

## Setup

Configure `syntara.baseUrl` and `syntara.model` in VS Code settings:

- `syntara.baseUrl` — default `http://127.0.0.1:8000/v1` (the local OpenAI-compatible endpoint)
- `syntara.model` — an installed local model id (e.g. `qwen`)
- `syntara.webUrl` — default `http://localhost:5173` (the web dashboard, used by "Open Chat")

## Commands

- `Syntara: Open Chat` — opens the local web dashboard in your browser for a full chat UI.
- `Syntara: Send Selection` — sends the current selection as a prompt; the answer is copied to your clipboard.
- `Syntara: Explain Selection` — asks the local model to explain the selected code; the answer opens in a markdown preview.

All requests go to `syntara.baseUrl`; nothing leaves the machine.