# Third-party notices

Portions of `backend_cuda_dsv4.cu`, including the DeepSeek-V4 GPU router
selection algorithm, are adapted from `ds4_cuda.cu` in the ds4 project:
https://github.com/antirez/ds4

MIT License

Copyright (c) 2026 The ds4.c authors
Copyright (c) 2023-2026 The ggml authors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

The pinned DeepSeek-V4 reference runner in `c/tools/dsv4_vllm_reference.py`
executes an unmodified vLLM checkout (commit
`ffd46bfab2128bb84146050e98b51a617c6575ab`) as a behavioural oracle for the
native port; no vLLM code is vendored.

## DeepGEMM sm120 headers (fetched, not vendored: `c/third_party/deepgemm/`)

The DeepSeek V4 CUDA tier's DeepGEMM flavour (`make cuda-dsv4-dg-dll`,
`Makefile.deepseek-v4 DEEPGEMM=1`) compiles against headers that
`c/tools/fetch_deepgemm.sh` checks out at a pinned commit into the gitignored
`c/third_party/deepgemm/`; nothing from them is committed to this repository.
What that checkout contains, and the licences that apply when you build with it:

- DeepGEMM (MIT, Copyright (c) 2025 DeepSeek), from the community sm120 port
  https://github.com/bvolpato/DeepGEMM branch `sm120-full` @
  39fb4447a062b418fd08ce17cd308adb28559417, with
  `c/patches-deepgemm-sm120-msvc.patch` applied at fetch time. License text:
  `c/third_party/deepgemm/LICENSE` after the fetch.
- NVIDIA CUTLASS / CuTe (BSD-3-Clause), the `third-party/cutlass` submodule of
  that commit @ f3fde58372d33e9a5650ba7b80fc48b3b49d40c8. License text:
  `c/third_party/deepgemm/third-party/cutlass/LICENSE.txt` after the fetch.

## Quantum Download Manager (desktop download engine: `desktop/src-tauri/src/qdm/`)

Portions of `desktop/src-tauri/src/qdm/` — the multi-segment HTTP download
engine, its persisted queue/state model and its Tauri command surface — are
adapted from QDM (Quantum Download Manager):
https://github.com/PBhadoo/QDM

The Syntara port keeps the core transfer engine and drops the yt-dlp/HLS/DASH,
browser-monitoring and notification features; the deviations are listed in
`MODIFICATIONS.md`.

MIT License

Copyright (c) 2026 Parveen Bhadoo

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## Design-consultation references (no code copied)

These projects were studied read-only during the Phase 0 audit as behavioural
references. No source file from them is vendored, adapted or linked; they are
recorded here because this file — unlike the rest of the tree — is the
documented place where exact third-party identities may appear.

### Ollama (MIT)

https://github.com/ollama/ollama — Copyright (c) Ollama
Consulted for local model-server lifecycle, model registry and HTTP API
behaviour. MIT licensed; no code incorporated.
(Occasionally referenced as "the reference runtime" in benchmark tables,
e.g. `docs/qwen36-cuda-tier.md`, to keep the shipped tree free of brand
tokens.)

### opencode (MIT)

https://github.com/sst/opencode — MIT licensed.
Consulted for agent-loop architecture (sessions, tool execution, permission
model, plan/apply split). No code incorporated. Shipped docs and comments
refer to this class of client generically as "agent".

### Open WebUI (BSD 3-Clause + additional branding terms)

https://github.com/open-webui/open-webui
Consulted for chat interface patterns (message grouping, streaming
re-render, model picker). **RESTRICTIVE:** beyond BSD-3 the project attaches
branding/non-endorsement conditions, so by policy **zero code was copied** —
layout and interaction ideas only. Do not vendor anything from it.
