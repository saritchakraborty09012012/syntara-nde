"""Token-exact checks for the Llama-dense engine against its numpy oracle.

The fixture comes from tools/make_llama_dense_tiny.py (numpy, deterministic):
a 2-layer GQA checkpoint whose ref.json logits were computed by a float64
numpy re-implementation of HF LlamaForCausalLM — a second author of the same
equations, so a wiring bug in the C engine shows up as a mismatch instead of
canceling out.

What is checked:
  - REF harness: prefill logits agree with the oracle within 1e-3 (float32
    engine vs float64 oracle; measured ~1e-6) and the greedy 8-token
    generation is token-exact
  - SERVE smoke: READY, HWINFO, DATA payload bytes equal the generated token
    ids (byte-level vocab, id == byte), DONE STAT with the right token
    counts, PROF with the standard nine fields, and no TIERS/EMAP/HITS (this
    engine has no expert cache to report)
  - logprobs: a request with logprobs=k gets the numeric tail on every DATA
    header, a request without it gets the legacy byte-for-byte frame
  - CONTEXT_EXCEEDED: prompt_tokens + requested > CTX is the structured
    frame the gateway maps to a 400, with the three numbers filled in
  - missing SNAP exits 1 with the shared launcher help naming Llama

The ENGINE name below is parsed by test_family_registry's python-job check:
keep the `("llama_dense.exe" if os.name == "nt" else "llama_dense")` shape.
"""

import json
import os
import subprocess
import sys
import unittest
from pathlib import Path

HERE = Path(__file__).resolve().parent.parent
ENGINE = HERE / ("llama_dense.exe" if os.name == "nt" else "llama_dense")
FIXTURE = Path(os.environ.get("SYNTARA_LLAMA_DENSE_FIXTURE",
                              str(HERE / "llama_dense_tiny")))
PROMPT = b"<|begin_of_text|>hi"      # encodes to [256, 104, 105] = 3 tokens
MAX_TOKENS = 8


def _read_frame_payload(process, header):
    """Consume the DATA payload that follows *header*; return its bytes."""
    size = int(header.split()[2])
    payload = process.stdout.read(size)
    newline = process.stdout.readline()
    if newline not in (b"\n", b"\r\n"):
        raise AssertionError(f"DATA payload not newline-terminated: {newline!r}")
    return payload


def _run_ref(fixture=None):
    fixture = fixture or FIXTURE
    environment = {**os.environ, "SNAP": str(fixture)}
    result = subprocess.run(
        [str(ENGINE), str(fixture / "ref.json")],
        env=environment, capture_output=True, text=True, timeout=120)
    if result.returncode != 0:
        raise AssertionError(
            f"engine exited {result.returncode}:\n{result.stderr[-2000:]}")
    lines = {}
    for name in ("REF_IDS", "REF_LOGITS", "REF_GEN"):
        found = [l for l in result.stdout.splitlines() if l.startswith(name + " ")]
        if len(found) != 1:
            raise AssertionError(f"expected exactly one {name} line, got {found}")
        lines[name] = found[0]
    return lines


def _serve_turn(prompt, max_tokens, logprobs=0, ctx=None):
    """Spawn the engine in serve mode, submit one prompt, collect the turn."""
    environment = {**os.environ, "SNAP": str(FIXTURE), "SERVE": "1"}
    if ctx is not None:
        environment["CTX"] = str(ctx)
    process = subprocess.Popen(
        [str(ENGINE)], env=environment, stdin=subprocess.PIPE,
        stdout=subprocess.PIPE, stderr=subprocess.PIPE, bufsize=0)
    try:
        saw_hwinfo = False
        while b"READY" not in (line := process.stdout.readline()):
            if not line:
                raise AssertionError(
                    "engine exited before READY: "
                    + process.stderr.read().decode(errors="replace")[-2000:])
        # READY is followed by STAT (inside write_ready) and then HWINFO
        while not saw_hwinfo:
            line = process.stdout.readline()
            if not line:
                raise AssertionError(
                    "engine exited before HWINFO: "
                    + process.stderr.read().decode(errors="replace")[-2000:])
            if line.decode("latin-1", "replace").startswith("HWINFO "):
                saw_hwinfo = True
        # 7 positional fields; logprobs=k is an extension key, not field 8
        # (serve_codec.h: fields containing '=' open the extension region)
        header = f"SUBMIT 7 0 {len(prompt)} {max_tokens} 0 1"
        if logprobs:
            header += f" logprobs={logprobs}"
        header += "\n"
        process.stdin.write(header.encode() + prompt + b"\n")
        process.stdin.flush()
        frames, payloads = [], []
        saw_done = False
        for _ in range(400):
            line = process.stdout.readline()
            if not line:
                raise AssertionError(
                    "engine closed the stream mid-turn: "
                    + process.stderr.read().decode(errors="replace")[-2000:])
            text = line.decode("latin-1").rstrip("\n")
            kind = text.split(" ", 1)[0]
            if kind == "DATA":
                payloads.append(_read_frame_payload(process, text))
                frames.append(text)
            else:
                frames.append(text)
                if kind == "ERROR":
                    return frames, payloads, saw_hwinfo
                if kind == "DONE":
                    saw_done = True
                # PROF follows DONE (serve_one prints DONE then PROF); keep
                # reading one more line so the turn's PROF is on the record
                if saw_done and kind == "PROF":
                    return frames, payloads, saw_hwinfo
        raise AssertionError(f"no DONE or ERROR within 400 lines: {frames[-5:]}")
    finally:
        process.stdin.close()
        try:
            process.wait(30)
        except subprocess.TimeoutExpired:
            process.kill()
            process.wait()
        process.stdout.close()
        process.stderr.close()


def _ensure_fixture():
    if (FIXTURE / "model.safetensors").is_file():
        return
    try:
        import numpy  # noqa: F401
    except ImportError:
        raise unittest.SkipTest(
            "tiny fixture absent and numpy unavailable to build it")
    generator = HERE / "tools" / "make_llama_dense_tiny.py"
    subprocess.run(
        [sys.executable, str(generator), "--output", str(FIXTURE), "--force"],
        check=True, capture_output=True, text=True, timeout=120)


@unittest.skipUnless(ENGINE.exists(), "llama_dense engine is not built")
class LlamaDenseTinyTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        _ensure_fixture()
        if not (FIXTURE / "config.json").is_file():
            raise unittest.SkipTest(f"no tiny fixture at {FIXTURE}")
        cls.ref = json.loads((FIXTURE / "ref.json").read_text())
        cls.config = json.loads((FIXTURE / "config.json").read_text())

    # ---- REF harness ----------------------------------------------------

    def test_prefill_logits_match_the_oracle(self):
        lines = _run_ref()
        engine = [float(x) for x in lines["REF_LOGITS"].split()[1:]]
        oracle = self.ref["logits"]
        self.assertEqual(len(engine), self.config["vocab_size"])
        self.assertEqual(len(engine), len(oracle))
        worst = max(abs(a - b) for a, b in zip(engine, oracle))
        self.assertLess(worst, 1e-3,
                        f"float32 engine drifted {worst:.3e} from the "
                        f"float64 oracle")

    def test_greedy_generation_is_token_exact(self):
        lines = _run_ref()
        got_ids = [int(x) for x in lines["REF_IDS"].split()[1:]]
        got_gen = [int(x) for x in lines["REF_GEN"].split()[1:]]
        self.assertEqual(got_ids, self.ref["ids"])
        self.assertEqual(got_gen, self.ref["gen"])

    def test_the_oracle_bites(self):
        """A corrupted lm_head byte must move the logits: a comparator that
        accepts anything would pass silently otherwise."""
        import shutil
        import struct
        import tempfile
        corrupt = Path(tempfile.mkdtemp(prefix="llama-dense-bite-"))
        try:
            for name in ("config.json", "tokenizer.json", "ref.json"):
                shutil.copy(FIXTURE / name, corrupt / name)
            raw = bytearray((FIXTURE / "model.safetensors").read_bytes())
            header_len = struct.unpack("<Q", bytes(raw[:8]))[0]
            header = json.loads(bytes(raw[8:8 + header_len]))
            lo, _ = header["lm_head.weight"]["data_offsets"]
            raw[8 + header_len + lo + 13] ^= 0x40
            (corrupt / "model.safetensors").write_bytes(bytes(raw))
            lines = _run_ref(corrupt)
            engine = [float(x) for x in lines["REF_LOGITS"].split()[1:]]
            worst = max(abs(a - b) for a, b in zip(engine, self.ref["logits"]))
            self.assertGreater(worst, 1e-4,
                               "corrupting an lm_head byte left the logits "
                               "unchanged: the oracle does not bite")
        finally:
            shutil.rmtree(corrupt.parent, ignore_errors=True)

    # ---- SERVE mode -----------------------------------------------------

    def test_serve_smoke_streams_the_oracle_generation(self):
        frames, payloads, saw_hwinfo = _serve_turn(PROMPT, MAX_TOKENS)
        kinds = [f.split(" ", 1)[0] for f in frames]
        self.assertTrue(saw_hwinfo, "HWINFO must follow READY for the dashboard")
        self.assertIn("DONE", kinds)
        self.assertIn("PROF", kinds)
        self.assertNotIn("TIERS", kinds, "dense engine has no expert tiers")
        self.assertNotIn("EMAP", kinds, "dense engine has no expert map")
        self.assertNotIn("HITS", kinds, "dense engine has no expert hits")
        # byte-level vocab: each generated id < 256 decodes to its own byte,
        # so the concatenated payload IS the oracle's token-id sequence
        self.assertEqual(b"".join(payloads),
                         bytes(self.ref["gen"]))
        done = next(f for f in frames if f.startswith("DONE ")).split()
        # DONE <id> STAT <tok> <tps> <hit%> <rss> <prompt_tok> <len_limited>
        self.assertEqual(done[:4], ["DONE", "7", "STAT", str(MAX_TOKENS)])
        self.assertEqual(int(done[7]), len(self.ref["ids"]),
                         "prompt_tokens must be the encoded prompt length")
        self.assertEqual(int(done[8]), 1,
                         "a max_tokens-limited turn reports length_limited")
        prof = next(f for f in frames if f.startswith("PROF ")).split()
        self.assertEqual(len(prof), 10, prof)
        self.assertEqual(int(prof[3]), MAX_TOKENS, "completion tokens")
        self.assertEqual(int(prof[9]), MAX_TOKENS,
                         "prefill plus one step per token but the last")

    def test_logprobs_tail_rides_the_data_headers(self):
        k = 2
        frames, payloads, _ = _serve_turn(PROMPT, MAX_TOKENS, logprobs=k)
        data = [f for f in frames if f.startswith("DATA ")]
        self.assertEqual(len(payloads), MAX_TOKENS)
        self.assertEqual(len(data), MAX_TOKENS)
        for header in data:
            fields = header.split()
            # DATA <id> <n> <lp> <k> [tid tlp]*k
            self.assertGreaterEqual(len(fields), 5 + 2 * k, header)
            self.assertEqual(fields[0], "DATA")
            self.assertEqual(fields[1], "7")
            float(fields[3])                    # chosen-token logprob
            self.assertEqual(int(fields[4]), k)  # top-k asked for
            for pair in range(k):
                int(fields[5 + 2 * pair])        # tid
                float(fields[6 + 2 * pair])      # tlp

    def test_logprobs_free_requests_keep_the_legacy_frame(self):
        frames, _, _ = _serve_turn(PROMPT, MAX_TOKENS, logprobs=0)
        for header in (f for f in frames if f.startswith("DATA ")):
            self.assertEqual(len(header.split()), 3, header)

    def test_context_exceeded_is_the_structured_frame(self):
        frames, _, _ = _serve_turn(PROMPT, MAX_TOKENS, ctx=8)
        error = next((f for f in frames if f.startswith("ERROR ")), None)
        self.assertIsNotNone(error, frames)
        fields = error.split()
        self.assertEqual(fields[:3], ["ERROR", "7", "CONTEXT_EXCEEDED"], fields)
        numbers = dict(field.split("=", 1) for field in fields[3:])
        self.assertEqual(numbers, {
            "prompt_tokens": str(len(self.ref["ids"])),
            "requested": str(MAX_TOKENS),
            "capacity": "8",
        })

    def test_a_request_that_fits_ctx_is_served(self):
        frames, payloads, _ = _serve_turn(PROMPT, 3, ctx=8)
        self.assertTrue(
            any(f.startswith("DONE 7 ") for f in frames),
            f"3-token prompt + 3 tokens must fit CTX=8: {frames}")

    # ---- launcher path --------------------------------------------------

    def test_missing_snap_prints_the_launcher_help(self):
        environment = {k: v for k, v in os.environ.items() if k != "SNAP"}
        result = subprocess.run([str(ENGINE)], env=environment,
                                capture_output=True, text=True, timeout=60)
        self.assertEqual(result.returncode, 1)
        self.assertIn("this is the Llama engine", result.stderr)
        self.assertIn("syntara", result.stderr)


if __name__ == "__main__":
    unittest.main()
