"""Phase 2 chat end-to-end smoke (track 2e).

Proves the chat surface the web client talks to works against the packaged
host, with every request on loopback (no internet access used or required):

  1. build the synthetic tiny GGUF (syntara.tests.gguf_fixtures, no network)
  2. start ``python -m syntara serve --model <tiny> --port <p>`` as a
     subprocess - the same entry point the desktop app drives
  3. GET  /health                      -> ready, loopback service
  4. POST /v1/chat/completions         -> completion + usage + queue-wait header
  5. POST /v1/chat/completions stream  -> SSE frames + [DONE] + queue-wait header
  6. CORS grant for the dev/desktop origin exposes retry-after and
     x-syntara-queue-wait-ms (what the web retry policy reads cross-origin)
  7. abort a stream mid-flight         -> host survives, next chat still works

Exit 0 only if every step passes. Prints a JSON report to stdout.
"""

from __future__ import annotations

import json
import os
import socket
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.request
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
DEV_ORIGIN = "http://127.0.0.1:5173"


def check(name: str, ok: bool, detail: str = "") -> dict:
    return {"name": name, "ok": bool(ok), "detail": detail}


def get(url: str, headers: dict | None = None, timeout: float = 30.0):
    req = urllib.request.Request(url, headers=headers or {})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.status, dict(resp.headers), resp.read()


def post(url: str, payload: dict, headers: dict | None = None,
         timeout: float = 120.0):
    req = urllib.request.Request(
        url, data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json", **(headers or {})},
        method="POST")
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.status, dict(resp.headers), resp.read()


def stream_post(url: str, payload: dict, timeout: float = 120.0,
                stop_after_frames: int | None = None):
    """POST a stream request; return (status, headers, frames, saw_done).

    stop_after_frames closes the connection after N data frames to simulate
    the user pressing Stop mid-generation.
    """
    req = urllib.request.Request(
        url, data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"}, method="POST")
    frames: list[bytes] = []
    saw_done = False
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        status, headers = resp.status, dict(resp.headers)
        while True:
            line = resp.readline()
            if not line:
                break
            if line.startswith(b"data: "):
                body = line[6:].strip()
                if body == b"[DONE]":
                    saw_done = True
                    break
                frames.append(body)
                if stop_after_frames is not None and len(frames) >= stop_after_frames:
                    break
        # Drop the socket without draining: what the Stop button causes.
    return status, headers, frames, saw_done


def wait_ready(base: str, timeout_s: float = 60.0) -> dict:
    deadline = time.monotonic() + timeout_s
    last: Exception | str = "not attempted"
    while time.monotonic() < deadline:
        try:
            _, _, raw = get(f"{base}/health", timeout=5.0)
            body = json.loads(raw)
            if body.get("ready"):
                return body
            last = f"status={body.get('status')}"
        except (urllib.error.URLError, OSError, ValueError) as exc:
            last = str(exc)
        time.sleep(0.4)
    raise RuntimeError(f"host never became ready within {timeout_s}s: {last}")


def main() -> int:
    sys.path.insert(0, str(REPO))
    from syntara.tests.gguf_fixtures import build_tiny_llama_gguf

    steps: list[dict] = []
    report_path = Path(__file__).with_name("chat_e2e_result.json")
    with tempfile.TemporaryDirectory(prefix="syntara-chat-e2e-") as tmp:
        model = Path(tmp) / "tiny-llama.gguf"
        build_tiny_llama_gguf(str(model))
        steps.append(check("tiny-gguf-built", model.exists(), str(model)))

        with socket.socket() as probe:
            probe.bind(("127.0.0.1", 0))
            port = probe.getsockname()[1]
        base = f"http://127.0.0.1:{port}"

        log_path = Path(tmp) / "host.log"
        with open(log_path, "wb") as log_file:
            proc = subprocess.Popen(
                [sys.executable, "-X", "utf8", "-m", "syntara", "serve",
                 "--model", str(model), "--port", str(port), "--json"],
                cwd=str(REPO), stdout=log_file, stderr=subprocess.STDOUT,
                env={**os.environ, "PYTHONIOENCODING": "utf-8"})
            try:
                health = wait_ready(base)
                steps.append(check(
                    "host-ready", health.get("status") == "ready",
                    f"status={health.get('status')} model={health.get('model')}"))
                served = str(health.get("model") or "")

                # 1. non-stream chat: the shape the web client renders.
                status, headers, raw = post(f"{base}/v1/chat/completions", {
                    "model": served,
                    "messages": [{"role": "user",
                                  "content": "Reply with one short word."}],
                    "temperature": 0.2, "max_completion_tokens": 24,
                    "enable_thinking": False, "stream": False})
                body = json.loads(raw)
                content = body["choices"][0]["message"]["content"]
                wait = headers.get("x-syntara-queue-wait-ms")
                steps.append(check(
                    "chat-completion", status == 200 and bool(content)
                    and bool(body.get("usage")),
                    f"status={status} chars={len(content)} wait={wait}"))
                steps.append(check(
                    "queue-wait-header-json",
                    wait is not None and wait.isdigit(),
                    f"header={wait!r}"))

                # 2. streaming: frames + terminal [DONE] + queue-wait header.
                status, headers, frames, saw_done = stream_post(
                    f"{base}/v1/chat/completions", {
                        "model": served,
                        "messages": [{"role": "user",
                                      "content": "Count from one to five."}],
                        "temperature": 0.0, "max_completion_tokens": 64,
                        "enable_thinking": False, "stream": True,
                        "stream_options": {"include_usage": True}})
                wait = headers.get("x-syntara-queue-wait-ms")
                steps.append(check(
                    "chat-stream", status == 200 and bool(frames) and saw_done,
                    f"status={status} frames={len(frames)} done={saw_done}"))
                steps.append(check(
                    "queue-wait-header-stream",
                    wait is not None and wait.isdigit(),
                    f"header={wait!r}"))

                # 3. CORS: the web UI reads Retry-After/queue-wait cross-origin.
                status, headers, _ = get(
                    f"{base}/health", headers={"Origin": DEV_ORIGIN})
                exposed = (headers.get("Access-Control-Expose-Headers")
                           or "").lower()
                steps.append(check(
                    "cors-exposes-web-headers",
                    headers.get("Access-Control-Allow-Origin") == DEV_ORIGIN
                    and "retry-after" in exposed
                    and "x-syntara-queue-wait-ms" in exposed,
                    f"allow={headers.get('Access-Control-Allow-Origin')} "
                    f"expose={exposed!r}"))

                # 4. abort mid-stream, then prove the host still serves.
                stream_post(f"{base}/v1/chat/completions", {
                    "model": served,
                    "messages": [{"role": "user",
                                  "content": "Write a long paragraph."}],
                    "temperature": 0.2, "max_completion_tokens": 1024,
                    "enable_thinking": False, "stream": True},
                    stop_after_frames=1)
                status, _, raw = post(f"{base}/v1/chat/completions", {
                    "model": served,
                    "messages": [{"role": "user", "content": "Say ok."}],
                    "temperature": 0.0, "max_completion_tokens": 8,
                    "enable_thinking": False, "stream": False})
                steps.append(check(
                    "host-survives-client-abort",
                    status == 200 and bool(json.loads(raw)["choices"]),
                    f"follow-up status={status}"))
            except Exception as exc:  # noqa: BLE001 - one report for the run
                steps.append(check("e2e-exception", False, repr(exc)))
            finally:
                proc.terminate()
                try:
                    proc.wait(timeout=15)
                except subprocess.TimeoutExpired:
                    proc.kill()
                    proc.wait(timeout=15)
        steps.append(check("host-process-exited",
                           proc.returncode is not None,
                           f"returncode={proc.returncode}"))

    ok = all(step["ok"] for step in steps)
    report = {"ok": ok, "steps": steps}
    report_path.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(json.dumps(report, indent=2))
    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
