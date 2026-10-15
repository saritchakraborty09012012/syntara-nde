"""Quality evaluation for compressed artifacts: perplexity + side-by-side text.

Local-first: evaluation runs entirely on the user's machine against a
local checkpoint.  The only optional network use is fetching the public
WikiText-2 benchmark *text* (MIT-licensed, via the Hugging Face
datasets-server JSON API, stdlib urllib, no extra dependency) when the user
passes ``--dataset wikitext`` and no local copy exists.  Prompts and model
outputs are never uploaded (AGENTS §23/§24).

Metrics:

* perplexity on a token window (causal LM NLL, exp of mean NLL);
* side-by-side greedy generations from the original vs. compressed model
  (deterministic, same prompt/seed) so drift is visible, not just numeric.
"""

from __future__ import annotations

import json
import math
import os
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any, Callable

EventSink = Callable[[dict[str, Any]], None]

WIKITEXT_ROWS_URL = (
    "https://datasets-server.huggingface.co/rows"
    "?dataset=Salesforce%2Fwikitext&config=wikitext-2-raw-v1"
    "&split=test&offset={offset}&length={length}"
)
_LOCAL_CACHE_NAME = "wikitext2-test.jsonl"


def _require_torch():
    try:
        import torch
        return torch
    except ImportError as exc:  # pragma: no cover
        raise RuntimeError(
            "evaluation requires PyTorch (CPU is sufficient)") from exc


def fetch_wikitext2(max_rows: int = 100, *, cache_dir: Path | None = None,
                    timeout: float = 30.0) -> list[str]:
    """Return up to ``max_rows`` WikiText-2 test paragraphs.

    Order of sources (local-first): cache file, then the HF rows API.
    The cache is a plain JSON-lines file under ``cache_dir`` (default: the
    user cache dir).  Network failure with no cache raises an actionable
    error; nothing else in evaluation depends on the network.
    """
    cache_dir = Path(cache_dir) if cache_dir else Path(
        os.environ.get("SYNTARA_CACHE_DIR",
                       Path.home() / ".cache" / "syntara"))
    cache = cache_dir / _LOCAL_CACHE_NAME
    if cache.is_file():
        rows: list[str] = []
        try:
            with open(cache, "r", encoding="utf-8") as fh:
                for line in fh:
                    doc = json.loads(line)
                    text = doc.get("text")
                    if isinstance(text, str) and text.strip():
                        rows.append(text)
        except (OSError, json.JSONDecodeError):
            rows = []
        if len(rows) >= min(max_rows, 10):
            return rows[:max_rows]
    rows = []
    try:
        offset = 0
        length = min(100, max_rows)
        while len(rows) < max_rows:
            url = WIKITEXT_ROWS_URL.format(offset=offset, length=length)
            req = urllib.request.Request(
                url, headers={"User-Agent": "syntara-eval/1.0"})
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                payload = json.loads(resp.read().decode("utf-8"))
            batch = payload.get("rows") or []
            if not batch:
                break
            for item in batch:
                row = item.get("row") if isinstance(item, dict) else None
                if isinstance(row, dict):
                    text = row.get("text")
                    if isinstance(text, str) and text.strip():
                        rows.append(text)
            offset += length
    except Exception as exc:  # noqa: BLE001 - offline or API change
        raise RuntimeError(
            "could not fetch WikiText-2 (no network or API changed) and no "
            f"local cache exists at {cache}; either connect once, or pass "
            "--dataset path/to/local.txt with your own evaluation text"
        ) from exc
    if not rows:
        raise RuntimeError("WikiText-2 fetch returned no usable rows")
    try:
        cache_dir.mkdir(parents=True, exist_ok=True)
        with open(cache, "w", encoding="utf-8") as fh:
            for text in rows:
                fh.write(json.dumps({"text": text}) + "\n")
    except OSError:
        pass  # cache is best-effort
    return rows[:max_rows]


def _load_local_text(path: Path, max_chars: int) -> str:
    text = path.read_text(encoding="utf-8", errors="replace")
    return text[:max_chars]


def perplexity_of(model: Any, tokenizer: Any, text: str, *,
                  max_tokens: int = 2048, stride: int = 512,
                  device: str = "cpu") -> dict[str, Any]:
    """Sliding-window causal perplexity of ``text`` under ``model``.

    Non-overlapping stride windows (stride >= context) keep memory bounded;
    window NLLs are token-count weighted.  Deterministic (greedyless,
    no sampling).
    """
    torch = _require_torch()
    enc = tokenizer(text, return_tensors="pt")
    input_ids = enc["input_ids"][0]
    total_tokens = int(min(max_tokens, input_ids.numel()))
    if total_tokens < 2:
        raise ValueError("evaluation text is too short (need >= 2 tokens)")
    window = min(1024, total_tokens)
    stride = max(1, min(stride, window))
    nll_sum = 0.0
    tok_count = 0
    seen = 0
    with torch.inference_mode():
        pos = 0
        while pos < total_tokens and seen < total_tokens:
            chunk = input_ids[pos:pos + window].unsqueeze(0).to(device)
            if chunk.shape[1] < 2:
                break
            labels = chunk.clone()
            out = model(input_ids=chunk, labels=labels)
            # out.loss is mean NLL over (chunk_len - 1) prediction sites
            n_sites = chunk.shape[1] - 1
            nll_sum += float(out.loss) * n_sites
            tok_count += n_sites
            seen += window if pos == 0 else stride
            pos += stride
    if tok_count == 0:
        raise RuntimeError("perplexity evaluation produced no tokens")
    mean_nll = nll_sum / tok_count
    return {
        "perplexity": round(math.exp(mean_nll), 4),
        "mean_nll": round(mean_nll, 6),
        "tokens_scored": tok_count,
        "window": window, "stride": stride,
    }


def _build_hf_model(model_dir: Path, *, trust: bool) -> tuple[Any, Any]:
    import transformers
    common = {"local_files_only": True, "trust_remote_code": trust}
    tokenizer = transformers.AutoTokenizer.from_pretrained(
        str(model_dir), **common)
    model = transformers.AutoModelForCausalLM.from_pretrained(
        str(model_dir), **common, dtype="auto")
    model.eval()
    return model, tokenizer


def _build_littlebit_model(artifact_dir: Path) -> tuple[Any, Any]:
    from ..runtime.littlebit_rt import LittleBitRuntime
    rt = LittleBitRuntime(str(artifact_dir))
    rt.load()
    return rt._model, rt._tokenizer  # noqa: SLF001 - evaluate is in-family


def evaluate_artifact(artifact_dir: str | os.PathLike[str],
                      *, source: str | os.PathLike[str] | None = None,
                      dataset: str = "wikitext", max_tokens: int = 2048,
                      rows: int = 64, prompts: list[str] | None = None,
                      max_new_tokens: int = 48,
                      on_event: EventSink | None = None) -> dict[str, Any]:
    """Compare a LittleBit artifact against its source checkpoint.

    Returns a JSON-serializable report: per-model perplexity, the ratio,
    per-prompt greedy generations, and artifact integrity status.
    """
    torch = _require_torch()
    artifact_dir = Path(artifact_dir).expanduser().resolve()
    from . import artifact as art
    manifest = art.load_manifest(artifact_dir)
    report: dict[str, Any] = {
        "artifact": str(artifact_dir),
        "algorithm": manifest["algorithm"],
        "settings": manifest["settings"],
        "totals": manifest["totals"],
    }
    if on_event:
        on_event({"type": "stage", "stage": "load_artifact"})
    trust = os.environ.get("SYNTARA_TRUST_REMOTE_CODE", "").strip() in (
        "1", "true", "yes")

    if dataset == "wikitext":
        text = "\n".join(fetch_wikitext2(rows))
    else:
        path = Path(dataset)
        if not path.is_file():
            raise ValueError(
                f"--dataset must be 'wikitext' or a local text file; "
                f"got {dataset!r}")
        text = _load_local_text(path, max_chars=max_tokens * 8)

    cb_model, tokenizer = _build_littlebit_model(artifact_dir)
    device = "cuda" if torch.cuda.is_available() else "cpu"
    cb_model.to(device)
    if on_event:
        on_event({"type": "stage", "stage": "perplexity_compressed"})
    report["compressed"] = perplexity_of(
        cb_model, tokenizer, text, max_tokens=max_tokens, device=device)

    if source is not None:
        source = Path(source).expanduser().resolve()
        report["source_path"] = str(source)
        if on_event:
            on_event({"type": "stage", "stage": "load_source"})
        src_model, src_tok = _build_hf_model(source, trust=trust)
        src_model.to(device)
        if on_event:
            on_event({"type": "stage", "stage": "perplexity_source"})
        report["source"] = perplexity_of(
            src_model, src_tok, text, max_tokens=max_tokens, device=device)
        ratio = (report["compressed"]["perplexity"]
                 / max(report["source"]["perplexity"], 1e-9))
        report["perplexity_ratio"] = round(ratio, 4)

        default_prompts = [
            "The capital of France is",
            "In computer science, a cache is",
            "Once upon a time",
        ]
        prompt_list = prompts if prompts else default_prompts
        generations: list[dict[str, Any]] = []
        with torch.inference_mode():
            for prompt in prompt_list:
                src_ids = src_tok(prompt, return_tensors="pt").input_ids.to(
                    device)
                cb_ids = tokenizer(prompt, return_tensors="pt").input_ids.to(
                    device)
                src_out = src_model.generate(
                    src_ids, max_new_tokens=max_new_tokens, do_sample=False)
                cb_out = cb_model.generate(
                    cb_ids, max_new_tokens=max_new_tokens, do_sample=False)
                generations.append({
                    "prompt": prompt,
                    "source": src_tok.decode(
                        src_out[0][src_ids.shape[1]:],
                        skip_special_tokens=True),
                    "compressed": tokenizer.decode(
                        cb_out[0][cb_ids.shape[1]:],
                        skip_special_tokens=True),
                })
                if on_event:
                    on_event({"type": "generation", "prompt": prompt})
        report["generations"] = generations
        del src_model
    del cb_model
    return report
