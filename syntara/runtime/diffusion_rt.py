"""Diffusers image-generation runtime (the path that actually creates images).

Loads a local ``model_index.json`` diffusion pipeline through the optional
``diffusers`` package and serves the OpenAI images surface. Text chat on
this runtime fails with an honest "this model generates images" error - it
never pretends to be a text model (AGENTS §99).

Optional dependency, local-first (AGENTS §24/§25): torch/diffusers/PIL are
imported lazily, ``local_files_only=True`` keeps every load offline, and
``trust_remote_code=False`` refuses to execute a model repository's own
Python. Generation runs with a bounded step count so a local machine stays
responsive.
"""
from __future__ import annotations

import base64
import io
import os
import threading
import time
from pathlib import Path
from typing import Any

from .base import RuntimeNotAvailable, RuntimeError

_MAX_IMAGE_SIDE = 2048
_MAX_IMAGES = 4
_DEFAULT_STEPS = 30


def _install_hint() -> str:
    return ("pip install torch diffusers pillow (optional image-generation "
            "runtime; large download)")


def _trust_remote_code() -> bool:
    return os.environ.get("SYNTARA_TRUST_REMOTE_CODE", "").strip() in (
        "1", "true", "yes")


def _parse_size(size: Any, fallback: tuple[int, int]) -> tuple[int, int]:
    """``"1024x768"`` -> (1024, 768); anything else -> pipeline default."""
    if not isinstance(size, str) or "x" not in size.lower():
        return fallback
    try:
        width_s, height_s = size.lower().split("x", 1)
        width, height = int(width_s), int(height_s)
    except ValueError:
        return fallback
    if not (1 <= width <= _MAX_IMAGE_SIDE and 1 <= height <= _MAX_IMAGE_SIDE):
        raise RuntimeError(
            f"size {size!r} is out of range; use WxH with each side between "
            f"1 and {_MAX_IMAGE_SIDE}")
    return width, height


class DiffusionRuntime:
    """Runtime adapter for one in-process diffusion pipeline."""

    def __init__(self, model_path: str | os.PathLike[str], *,
                 context: int | None = None,
                 threads: int | None = None,
                 startup_timeout: float = 600.0) -> None:
        self.model_path = str(model_path)
        self.context = context    # not applicable to image generation
        self.threads = threads
        self.startup_timeout = float(startup_timeout)
        self._pipeline: Any | None = None
        self._device: str = "cpu"
        self._lock = threading.Lock()  # one image batch at a time

    # ------------------------------------------------------------- lifecycle

    @property
    def loaded(self) -> bool:
        return self._pipeline is not None

    def _import_backend(self) -> tuple[Any, Any, Any]:
        try:
            import torch  # noqa: PLC0415 - lazy optional dependency
        except ImportError as exc:
            raise RuntimeNotAvailable(
                f"image generation needs PyTorch ({_install_hint()})") from exc
        try:
            import diffusers  # noqa: PLC0415
        except ImportError as exc:
            raise RuntimeNotAvailable(
                f"image generation needs the diffusers package "
                f"({_install_hint()})") from exc
        try:
            from PIL import Image  # noqa: PLC0415, F401
        except ImportError as exc:
            raise RuntimeNotAvailable(
                f"image generation needs Pillow for PNG encoding "
                f"({_install_hint()})") from exc
        return torch, diffusers, None

    def load(self) -> None:
        if self.loaded:
            return
        pipeline_dir = Path(self.model_path).expanduser()
        if not (pipeline_dir / "model_index.json").is_file():
            raise RuntimeError(
                f"{pipeline_dir} has no model_index.json, so it is not a "
                "diffusion pipeline; run `syntara inspect` on it to see "
                "what it contains")
        torch, diffusers, _ = self._import_backend()
        trust = _trust_remote_code()
        try:
            pipeline = diffusers.DiffusionPipeline.from_pretrained(
                str(pipeline_dir), local_files_only=True,
                trust_remote_code=trust)
        except Exception as exc:  # noqa: BLE001 - diffusers raises many types
            raise RuntimeError(
                f"diffusers could not load this pipeline: {exc}",
                detail=str(exc)) from exc
        self._device = "cuda" if torch.cuda.is_available() else "cpu"
        try:
            pipeline.to(self._device)
        except Exception as exc:  # noqa: BLE001 - e.g. CUDA OOM
            raise RuntimeError(
                f"could not move the pipeline to {self._device}: {exc}; free "
                "GPU memory or use a smaller pipeline", detail=str(exc)
            ) from exc
        self._pipeline = pipeline

    def unload(self) -> None:
        pipeline, self._pipeline = self._pipeline, None
        if pipeline is not None:
            try:
                import torch  # noqa: PLC0415
                del pipeline
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
            "backend": "diffusers",
            "available": available,
            "unavailable_reason": reason or None,
            "formats": ["diffusion-pipeline"],
            "streaming": False,
            "chat": False,
            "images": True,
            "device": self._device if self.loaded else "auto",
            "trust_remote_code": _trust_remote_code(),
            "modalities": ["text-input", "image-output"],
        }

    def health(self) -> dict[str, Any]:
        info: dict[str, Any] = {
            "backend": "diffusers",
            "loaded": self.loaded,
            "model": os.path.basename(self.model_path.rstrip("/\\")),
            "device": self._device,
        }
        if self.loaded:
            try:
                import diffusers  # noqa: PLC0415
                info["diffusers"] = getattr(diffusers, "__version__",
                                            "unknown")
            except ImportError:
                pass
        return info

    # ------------------------------------------------------------- generation

    def generate_image(self, body: dict[str, Any]) -> dict[str, Any]:
        """OpenAI ``/v1/images/generations`` body -> images response."""
        pipeline = self._pipeline
        if pipeline is None:
            raise RuntimeError("no pipeline is loaded in the runtime")
        prompt = body.get("prompt")
        if not isinstance(prompt, str) or not prompt.strip():
            raise RuntimeError(
                "the request needs a non-empty 'prompt' string")
        try:
            count = int(body.get("n", 1))
        except (TypeError, ValueError):
            count = 1
        if not 1 <= count <= _MAX_IMAGES:
            raise RuntimeError(
                f"'n' must be between 1 and {_MAX_IMAGES} (got {count})")
        try:
            steps = int(body.get("steps", _DEFAULT_STEPS))
        except (TypeError, ValueError):
            steps = _DEFAULT_STEPS
        if not 1 <= steps <= 150:
            raise RuntimeError(
                f"'steps' must be between 1 and 150 (got {steps})")
        width, height = _parse_size(body.get("size"), self._default_size())
        with self._lock:
            generator = self._generator()
            kwargs: dict[str, Any] = {
                "prompt": prompt,
                "num_images_per_prompt": count,
                "width": width,
                "height": height,
                "num_inference_steps": steps,
            }
            if generator is not None:
                kwargs["generator"] = generator
            guidance = body.get("guidance_scale")
            if isinstance(guidance, (int, float)):
                kwargs["guidance_scale"] = float(guidance)
            try:
                import torch  # noqa: PLC0415
                with torch.inference_mode():
                    result = pipeline(**kwargs)
            except RuntimeError as exc:
                if "out of memory" in str(exc).lower():
                    raise RuntimeError(
                        "the image pipeline ran out of memory; reduce size "
                        "or steps, or use a smaller pipeline",
                        detail=str(exc)) from exc
                raise
            images = list(getattr(result, "images", []) or [])
        if not images:
            raise RuntimeError(
                "the pipeline returned no images; see detail for backend "
                "output", detail=str(result)[:500])
        data = []
        for image in images:
            buffer = io.BytesIO()
            image.save(buffer, format="PNG")
            data.append({"b64_json": base64.b64encode(
                buffer.getvalue()).decode("ascii")})
        return {"created": int(time.time()), "data": data}

    def _default_size(self) -> tuple[int, int]:
        unet = getattr(self._pipeline, "unet", None)
        vae = getattr(self._pipeline, "vae", None)
        for component in (unet, vae):
            sample_size = getattr(component, "config", None)
            sample_size = getattr(sample_size, "sample_size", None) \
                if sample_size is not None else None
            if isinstance(sample_size, int) and 0 < sample_size <= 4096:
                return sample_size, sample_size
        return 512, 512

    def _generator(self) -> Any | None:
        seed = os.environ.get("SYNTARA_IMAGE_SEED", "").strip()
        if not seed:
            return None
        try:
            import torch  # noqa: PLC0415
        except ImportError:
            return None
        try:
            value = int(seed)
        except ValueError:
            raise RuntimeError(
                f"SYNTARA_IMAGE_SEED={seed!r} must be an integer") from None
        device = self._device
        return torch.Generator(device=device).manual_seed(value)

    # ------------------------------------------------------------------ chat

    def chat(self, body: dict[str, Any]) -> dict[str, Any]:
        raise RuntimeError(
            "this model is an image generator, not a text model: use "
            "POST /v1/images/generations with {\"prompt\": ...}, or serve "
            "a text model with `syntara serve --model <text-model>`")

    def stream(self, body: dict[str, Any]) -> Any:
        # Deliberately not a generator: raise at call time so the gateway
        # reports one clear 502 message instead of an empty SSE stream.
        raise RuntimeError(
            "streaming chat is not available for an image generator: use "
            "POST /v1/images/generations, or serve a text model instead")
