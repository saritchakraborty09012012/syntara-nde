"""General-purpose PyTorch/Transformers fallback runtime.

Runs any Hugging Face ``AutoModelForCausalLM``-style checkpoint that
transformers itself can load - the fallback of last resort when no native
engine family owns the model (AGENTS §12: runtime-specific details stay in
this adapter; the gateway only sees the Runtime interface).

Local-first and safe by default (AGENTS §24/§25):

- ``local_files_only=True``: a load never reaches the network;
- ``trust_remote_code=False``: model repositories are untrusted input and
  are never allowed to execute their own Python; set
  ``SYNTARA_TRUST_REMOTE_CODE=1`` explicitly if you own the checkpoint;
- optional dependency: torch/transformers are imported lazily, and their
  absence raises one actionable message instead of an ImportError chain.

Memory: the load happens in-process, so the gateway's memory guard (built
from the library's weight estimate) refuses impossible loads first.
"""
from __future__ import annotations

import json
import os
import threading
import time
import uuid
from pathlib import Path
from typing import Any, Iterator

from .base import GenerationCancelled, RuntimeNotAvailable, RuntimeError

_ENV_DTYPE = "SYNTARA_TORCH_DTYPE"
_ENV_TRUST = "SYNTARA_TRUST_REMOTE_CODE"
_MAX_PROMPT_SAFETY = 8  # tokens trimmed when the prompt would exceed context


def _install_hint() -> str:
    return ("pip install torch transformers (optional fallback runtime; "
            "large download)")


def _trust_remote_code() -> bool:
    return os.environ.get(_ENV_TRUST, "").strip() in ("1", "true", "yes")


class _StopOnCancel:
    """StoppingCriteria (duck-typed) that ends generation when cancelled."""

    def __init__(self, event: threading.Event) -> None:
        self._event = event

    def __call__(self, input_ids: Any = None, scores: Any = None,
                 **kwargs: Any) -> bool:
        return self._event.is_set()


def _sse(payload: dict[str, Any]) -> bytes:
    return b"data: " + json.dumps(payload, ensure_ascii=False).encode("utf-8") \
        + b"\n\n"


class TransformersRuntime:
    """Runtime adapter that drives one in-process transformers model."""

    def __init__(self, model_path: str | os.PathLike[str], *,
                 context: int | None = None,
                 threads: int | None = None,
                 startup_timeout: float = 300.0) -> None:
        self.model_path = str(model_path)
        self.context = int(context or 4096)
        self.threads = threads
        self.startup_timeout = float(startup_timeout)
        self._model: Any | None = None
        self._tokenizer: Any | None = None
        self._device: str = "cpu"
        self._lock = threading.Lock()
        self._cancel_event = threading.Event()
        self._cancelled = False

    # ------------------------------------------------------------- lifecycle

    @property
    def loaded(self) -> bool:
        return self._model is not None

    def _import_backend(self) -> tuple[Any, Any]:
        try:
            import torch  # noqa: PLC0415 - lazy optional dependency
        except ImportError as exc:
            raise RuntimeNotAvailable(
                f"the Transformers fallback needs PyTorch ({_install_hint()})"
            ) from exc
        try:
            import transformers  # noqa: PLC0415
        except ImportError as exc:
            raise RuntimeNotAvailable(
                f"the Transformers fallback needs the transformers package "
                f"({_install_hint()})") from exc
        return torch, transformers

    @staticmethod
    def _dtype_kwargs(torch: Any) -> dict[str, Any]:
        wanted = os.environ.get(_ENV_DTYPE, "auto").strip() or "auto"
        if wanted == "auto":
            return {"dtype": "auto"}
        mapping = {"float16": getattr(torch, "float16", None),
                   "bfloat16": getattr(torch, "bfloat16", None),
                   "float32": getattr(torch, "float32", None)}
        value = mapping.get(wanted)
        if value is None:
            raise RuntimeError(
                f"{_ENV_DTYPE}={wanted!r} is not a torch dtype; use auto, "
                "float16, bfloat16 or float32")
        return {"dtype": value}

    def load(self) -> None:
        if self.loaded:
            return
        model_dir = Path(self.model_path).expanduser()
        if not model_dir.is_dir():
            raise RuntimeError(
                f"model directory not found: {model_dir}; the Transformers "
                "fallback runs checkpoint directories")
        if not (model_dir / "config.json").is_file():
            raise RuntimeError(
                f"{model_dir} has no config.json; run `syntara inspect` on "
                "it to see what it contains")
        torch, transformers = self._import_backend()
        trust = _trust_remote_code()
        common = {"local_files_only": True, "trust_remote_code": trust}
        try:
            self._tokenizer = transformers.AutoTokenizer.from_pretrained(
                str(model_dir), **common)
        except Exception as exc:  # noqa: BLE001 - transformers raises many types
            raise RuntimeError(
                f"transformers could not load the tokenizer from "
                f"{model_dir}: {exc}", detail=str(exc)) from exc
        model_cls = transformers.AutoModelForCausalLM
        dtype_kwargs = self._dtype_kwargs(torch)
        try:
            try:
                model = model_cls.from_pretrained(str(model_dir), **common,
                                                  **dtype_kwargs)
            except TypeError:
                # transformers renamed `dtype` to `torch_dtype` (or back);
                # retry with the legacy kwarg rather than loading in fp32.
                legacy = {"torch_dtype": dtype_kwargs["dtype"]}
                model = model_cls.from_pretrained(str(model_dir), **common,
                                                  **legacy)
        except Exception as exc:  # noqa: BLE001
            raise RuntimeError(
                "transformers could not load this checkpoint: "
                f"{exc}", detail=str(exc)) from exc
        self._device = "cuda" if torch.cuda.is_available() else "cpu"
        if self.threads:
            try:
                torch.set_num_threads(int(self.threads))
            except (TypeError, ValueError, RuntimeError):
                pass
        try:
            model.to(self._device)
        except Exception as exc:  # noqa: BLE001 - e.g. CUDA OOM
            raise RuntimeError(
                f"could not move the model to {self._device}: {exc}; retry "
                "with a smaller model or free GPU memory", detail=str(exc)
            ) from exc
        model.eval()
        self._model = model

    def unload(self) -> None:
        model, self._model = self._model, None
        self._tokenizer = None
        if model is not None:
            try:
                import torch  # noqa: PLC0415
                del model
                if torch.cuda.is_available():
                    torch.cuda.empty_cache()
            except ImportError:
                pass

    def capabilities(self) -> dict[str, Any]:
        available = True
        reason = ""
        try:
            self._import_backend()
        except RuntimeNotAvailable as exc:
            available, reason = False, str(exc)
        return {
            "backend": "transformers",
            "available": available,
            "unavailable_reason": reason or None,
            "formats": ["safetensors", "pytorch-bin"],
            "streaming": True,
            "device": self._device if self.loaded else "auto",
            "trust_remote_code": _trust_remote_code(),
            "process_model": "in-process (shares this host's memory)",
            "modalities": ["text-input", "text-output"],
        }

    def health(self) -> dict[str, Any]:
        info: dict[str, Any] = {
            "backend": "transformers",
            "loaded": self.loaded,
            "model": os.path.basename(self.model_path.rstrip("/\\")),
            "device": self._device,
        }
        if self.loaded:
            try:
                import torch  # noqa: PLC0415
                info["torch"] = getattr(torch, "__version__", "unknown")
            except ImportError:
                pass
        return info

    # ----------------------------------------------------------------- chat

    def cancel(self) -> None:
        # Never takes the generation lock: cancel must work while chat()
        # or stream() is holding it (same rule as the llama.cpp adapter).
        self._cancelled = True
        self._cancel_event.set()

    def _require_ready(self) -> tuple[Any, Any]:
        if self._model is None or self._tokenizer is None:
            raise RuntimeError("no model is loaded in the runtime")
        return self._model, self._tokenizer

    def _render_prompt(self, tokenizer: Any, body: dict[str, Any]) -> str:
        messages = body.get("messages")
        if isinstance(messages, list) and messages:
            template = getattr(tokenizer, "chat_template", None)
            if template:
                try:
                    return str(tokenizer.apply_chat_template(
                        messages, tokenize=False, add_generation_prompt=True))
                except Exception:  # noqa: BLE001 - fall back to plain render
                    pass
            lines = []
            for message in messages:
                role = str(message.get("role", "user"))
                content = message.get("content", "")
                if isinstance(content, list):
                    content = " ".join(
                        part.get("text", "") for part in content
                        if isinstance(part, dict))
                lines.append(f"{role}: {content}")
            lines.append("assistant:")
            return "\n".join(lines)
        prompt = body.get("prompt")
        if isinstance(prompt, str) and prompt:
            return prompt
        raise RuntimeError(
            "the request has neither messages nor a prompt; send an "
            "OpenAI-style chat body")

    def _generation_kwargs(self, body: dict[str, Any],
                           input_length: int) -> dict[str, Any]:
        requested = body.get("max_tokens") or body.get("max_completion_tokens")
        try:
            requested = int(requested) if requested else 512
        except (TypeError, ValueError):
            requested = 512
        room = max(1, self.context - input_length)
        max_new = max(1, min(requested, room))
        try:
            temperature = float(body.get("temperature", 0.7))
        except (TypeError, ValueError):
            temperature = 0.7
        kwargs: dict[str, Any] = {"max_new_tokens": max_new,
                                  "do_sample": temperature > 0}
        if kwargs["do_sample"]:
            kwargs["temperature"] = temperature
            try:
                kwargs["top_p"] = float(body.get("top_p", 0.95))
            except (TypeError, ValueError):
                pass
        eos = getattr(self._model, "generation_config", None)
        eos_id = getattr(eos, "eos_token_id", None) if eos else None
        pad_id = getattr(self._tokenizer, "pad_token_id", None)
        if pad_id is None:
            pad_id = eos_id
        if pad_id is not None:
            kwargs["pad_token_id"] = pad_id
        stopping = kwargs.setdefault("stopping_criteria", _StopList())
        stopping.append(_StopOnCancel(self._cancel_event))
        return kwargs

    def _encode(self, torch: Any, tokenizer: Any, prompt: str) -> dict[str, Any]:
        encoded = tokenizer(prompt, return_tensors="pt")
        moved = {}
        for key, value in encoded.items():
            moved[key] = value.to(self._device) if hasattr(value, "to") \
                else value
        length = int(moved["input_ids"].shape[-1])
        if length >= self.context:
            trimmed = tokenizer.decode(
                moved["input_ids"][0][-_MAX_PROMPT_SAFETY:],
                skip_special_tokens=True)
            raise RuntimeError(
                f"the prompt is {length} tokens but this gateway serves a "
                f"{self.context}-token context; shorten the prompt or raise "
                f"--context (it ends ...{trimmed[-80:]!r})")
        return moved

    def _finish(self, body: dict[str, Any], text: str,
                prompt_tokens: int, completion_tokens: int) -> dict[str, Any]:
        return {
            "id": "chatcmpl-" + uuid.uuid4().hex,
            "object": "chat.completion",
            "created": int(time.time()),
            "model": str(body.get("model") or "syntara"),
            "choices": [{
                "index": 0,
                "message": {"role": "assistant", "content": text},
                "finish_reason": "stop",
            }],
            "usage": {
                "prompt_tokens": prompt_tokens,
                "completion_tokens": completion_tokens,
                "total_tokens": prompt_tokens + completion_tokens,
            },
        }

    def chat(self, body: dict[str, Any]) -> dict[str, Any]:
        torch, _ = self._import_backend()
        model, tokenizer = self._require_ready()
        with self._lock:
            self._cancelled = False
            self._cancel_event.clear()
            prompt = self._render_prompt(tokenizer, body)
            inputs = self._encode(torch, tokenizer, prompt)
            prompt_tokens = int(inputs["input_ids"].shape[-1])
            gen_kwargs = self._generation_kwargs(body, prompt_tokens)
            try:
                with torch.inference_mode():
                    output = model.generate(**inputs, **gen_kwargs)
            except RuntimeError as exc:
                if "out of memory" in str(exc).lower():
                    raise RuntimeError(
                        "the fallback runtime ran out of memory while "
                        "generating; use a smaller model/quantization or "
                        "close other applications", detail=str(exc)) from exc
                raise
            if self._cancel_event.is_set():
                raise GenerationCancelled()
            generated = output[0][prompt_tokens:]
            text = tokenizer.decode(generated, skip_special_tokens=True)
        return self._finish(body, text, prompt_tokens,
                            int(generated.shape[-1]))

    def stream(self, body: dict[str, Any]) -> Iterator[bytes]:
        torch, transformers = self._import_backend()
        model, tokenizer = self._require_ready()
        with self._lock:
            self._cancelled = False
            self._cancel_event.clear()
            prompt = self._render_prompt(tokenizer, body)
            inputs = self._encode(torch, tokenizer, prompt)
            prompt_tokens = int(inputs["input_ids"].shape[-1])
            gen_kwargs = self._generation_kwargs(body, prompt_tokens)
            streamer = transformers.TextIteratorStreamer(
                tokenizer, skip_prompt=True, skip_special_tokens=True)
            gen_kwargs["streamer"] = streamer
            result: dict[str, Any] = {}

            def _run() -> None:
                try:
                    with torch.inference_mode():
                        result["output"] = model.generate(**inputs, **gen_kwargs)
                except Exception as exc:  # noqa: BLE001 - surfaced below
                    result["error"] = exc

            thread = threading.Thread(target=_run, daemon=True,
                                      name="transformers-generate")
            chunk_id = "chatcmpl-" + uuid.uuid4().hex
            created = int(time.time())
            model_name = str(body.get("model") or "syntara")
            thread.start()
            first = True
            for piece in streamer:
                if self._cancel_event.is_set():
                    break
                text = piece or ""
                if not text and first:
                    continue
                chunk = {
                    "id": chunk_id, "object": "chat.completion.chunk",
                    "created": created, "model": model_name,
                    "choices": [{
                        "index": 0,
                        "delta": ({"role": "assistant", "content": text}
                                  if first else {"content": text}),
                        "finish_reason": None,
                    }],
                }
                first = False
                yield _sse(chunk)
            error = result.get("error")
            if error is not None:
                raise RuntimeError(
                    "generation failed in the fallback runtime: "
                    f"{error}", detail=str(error))
            completion_tokens = 0
            output = result.get("output")
            if output is not None:
                try:
                    completion_tokens = int(output.shape[-1]) - prompt_tokens
                except (AttributeError, TypeError):
                    pass
            yield _sse({
                "id": chunk_id, "object": "chat.completion.chunk",
                "created": created, "model": model_name,
                "choices": [{"index": 0, "delta": {},
                             "finish_reason": "stop"}],
                "usage": {"prompt_tokens": prompt_tokens,
                          "completion_tokens": max(0, completion_tokens),
                          "total_tokens": prompt_tokens
                          + max(0, completion_tokens)},
            })
            yield b"data: [DONE]\n\n"
            thread.join(timeout=5.0)
            if self._cancel_event.is_set():
                raise GenerationCancelled()


class _StopList(list):
    """stopping_criteria container accepted by transformers.generate().

    A plain list subclass keeps this module import-clean when the optional
    transformers package is absent (the adapter must never hard-import it).
    """
