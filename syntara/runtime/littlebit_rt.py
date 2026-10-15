"""LittleBit-style factorized inference runtime (in-process, CPU/GPU torch).

Loads a Syntara LittleBit artifact (see ``syntara.compress.artifact``) and
rebuilds the original architecture from ``config.json`` with the dense
weights *never materialized*: every compressed matrix becomes a
:class:`LittleBitLinear` module that evaluates

    Y = ((((X * g) @ V_s) * l) @ U_s^T) * h [+ residual path]

directly from packed binary factors (paper Eq. 5).  Passthrough tensors
(embeddings, norms, lm_head, ...) are loaded verbatim.

Chat/stream/cancel semantics match :class:`TransformersRuntime` (this
adapter subclasses it and only replaces ``load``/capabilities), so the
gateway, desktop app and SDK see the same Runtime interface.

Integrity: the artifact manifest checksum is verified at load; a mismatch
refuses to run (AGENTS §25).
"""

from __future__ import annotations

import os
import time
from pathlib import Path
from typing import Any

from ..compress import artifact as art
from ..compress.littlebit_core import forward_factorized, unpack_binary
from .base import RuntimeError, RuntimeNotAvailable
from .transformers_rt import TransformersRuntime


def _require_torch():
    try:
        import torch
        return torch
    except ImportError as exc:  # pragma: no cover
        raise RuntimeNotAvailable(
            "the LittleBit runtime needs PyTorch (CPU wheels are enough): "
            "pip install torch") from exc


class LittleBitLinear:
    """Factory producing an nn.Module implementing the factorized forward.

    Kept as a function-style factory so this module stays import-clean when
    torch is absent (the runtime package must never hard-import torch).
    ``kind="conv1d"`` builds a transformers-Conv1D-compatible module
    (bias added inside the factorized forward; ``nf`` attribute kept for
    shape probes) because Conv1D's stock forward calls torch.addmm on
    ``self.weight`` and cannot host a factorized weight in place.
    """

    @staticmethod
    def build(torch: Any, *, d_out: int, d_in: int, rank: int,
              u_sign: Any, v_sign: Any, h: Any, g: Any, ell: Any,
              residual: bool = False, u_res: Any = None, v_res: Any = None,
              h_res: Any = None, g_res: Any = None, ell_res: Any = None,
              bias: Any = None,  # noqa: ANN401
              kind: str = "linear") -> Any:  # noqa: ANN401

        class _LittleBitModule(torch.nn.Module):
            def __init__(self) -> None:
                super().__init__()
                self.d_out = int(d_out)
                self.d_in = int(d_in)
                self.rank = int(rank)
                self.kind = kind
                if kind == "conv1d":
                    self.nf = int(d_out)  # transformers Conv1D compat
                self.register_buffer(
                    "u_sign", u_sign.to(torch.float32), persistent=True)
                self.register_buffer(
                    "v_sign", v_sign.to(torch.float32), persistent=True)
                self.register_buffer("h", h.to(torch.float32),
                                     persistent=True)
                self.register_buffer("g", g.to(torch.float32),
                                     persistent=True)
                self.register_buffer("ell", ell.to(torch.float32),
                                     persistent=True)
                self.has_residual = bool(residual)
                if residual:
                    self.register_buffer(
                        "u_res", u_res.to(torch.float32), persistent=True)
                    self.register_buffer(
                        "v_res", v_res.to(torch.float32), persistent=True)
                    self.register_buffer(
                        "h_res", h_res.to(torch.float32), persistent=True)
                    self.register_buffer(
                        "g_res", g_res.to(torch.float32), persistent=True)
                    self.register_buffer(
                        "ell_res", ell_res.to(torch.float32),
                        persistent=True)
                if bias is not None:
                    self.register_buffer("bias", bias.to(torch.float32),
                                         persistent=True)
                else:
                    self.bias = None
                # meta-only shape probe (never allocated; avoids keeping a
                # dense-size scratch tensor per module)
                self.weight = torch.empty(d_out, d_in, device="meta")

            def forward(self, x: Any) -> Any:  # noqa: ANN401
                # Factorized buffers are fp32 for numerical stability, but
                # the surrounding model may run in bf16/fp16.  Compute in
                # fp32 then cast back so the module is dtype-transparent.
                out_dtype = x.dtype
                y = forward_factorized(x.float(), self.u_sign, self.v_sign,
                                       self.h, self.g, self.ell)
                if self.has_residual:
                    y = y + forward_factorized(
                        x.float(), self.u_res, self.v_res,
                        self.h_res, self.g_res, self.ell_res)
                if self.bias is not None:
                    y = y + self.bias
                return y.to(out_dtype)

            def extra_repr(self) -> str:
                return (f"d_out={self.d_out}, d_in={self.d_in}, "
                        f"rank={self.rank}, residual={self.has_residual}, "
                        f"kind={self.kind}")

        return _LittleBitModule()


class LittleBitRuntime(TransformersRuntime):
    """Runtime adapter that drives one in-process factorized model."""

    def __init__(self, model_path: str | os.PathLike[str], **kwargs: Any
                 ) -> None:  # noqa: ANN003
        super().__init__(model_path, **kwargs)
        self._manifest: dict[str, Any] | None = None

    # ----------------------------------------------------------------- load

    def load(self) -> None:
        if self.loaded:
            return
        torch = _require_torch()
        try:
            import transformers
        except ImportError as exc:
            raise RuntimeNotAvailable(
                "the LittleBit runtime needs the transformers package: "
                "pip install transformers") from exc
        model_dir = Path(self.model_path).expanduser().resolve()
        manifest = art.load_manifest(model_dir)
        # deep integrity check (checksum + tensor dims) before any loading
        try:
            art.validate_manifest(manifest, artifact_dir=model_dir,
                                  deep=True)
        except art.ArtifactError as exc:
            raise RuntimeError(
                f"artifact integrity check failed: {exc}", detail=str(exc)
            ) from exc
        self._manifest = manifest

        trust = _trust_env()
        common = {"local_files_only": True, "trust_remote_code": trust}
        try:
            tokenizer = transformers.AutoTokenizer.from_pretrained(
                str(model_dir), **common)
        except Exception as exc:  # noqa: BLE001
            raise RuntimeError(
                f"tokenizer could not be loaded from the artifact: {exc}",
                detail=str(exc)) from exc

        from safetensors import safe_open
        weights_name = manifest["files"]["weights"]
        weights_path = model_dir / weights_name

        # Build the architecture skeleton from config, then fill parameters
        # from the packed artifact.  from_config allocates one fp32 scratch
        # copy of the architecture (no weight file read); each parameter is
        # then overwritten or the module replaced with a factorized one.
        try:
            hf_config = transformers.AutoConfig.from_pretrained(
                str(model_dir), **common)
            model = transformers.AutoModelForCausalLM.from_config(hf_config)
        except Exception as exc:  # noqa: BLE001
            raise RuntimeError(
                f"could not rebuild the architecture from config.json: "
                f"{exc}", detail=str(exc)) from exc

        entries = {e["name"]: e for e in manifest["tensors"]}
        named_modules = dict(model.named_modules())
        module_keys = list(named_modules.keys())

        def _locate(param_name: str) -> tuple[Any, str] | tuple[None, None]:
            """(module, attr) for a manifest tensor name, prefix-tolerant."""
            if param_name.endswith(".weight"):
                base, attr = param_name[:-len(".weight")], "weight"
            elif param_name.endswith(".bias"):
                base, attr = param_name[:-len(".bias")], "bias"
            else:
                base, _, attr = param_name.rpartition(".")
            resolved = art.resolve_module_key(base, module_keys)
            if resolved is None:
                return None, None
            module = named_modules.get(resolved)
            return (module, attr) if module is not None else (None, None)

        replaced = 0
        passthrough = 0
        with safe_open(str(weights_path), framework="pt", device="cpu") as fh:
            # Pass 1: verbatim copies (embeddings, norms, biases, lm_head)
            # BEFORE any module swaps, so factorized modules capture the
            # correct bias values when they are built in pass 2.
            for name, entry in entries.items():
                if entry["action"] != "passthrough":
                    continue
                key = entry["keys"].get("weight")
                if key is None or key not in fh.keys():
                    raise RuntimeError(
                        f"artifact is missing tensor {key!r} for {name}")
                tensor = fh.get_tensor(key)
                module, attr = _locate(name)
                if module is None:
                    continue
                param = getattr(module, attr, None)
                if param is None:
                    continue
                if tuple(param.shape) != tuple(tensor.shape):
                    # tied lm_head: shape mismatch means it aliases the
                    # embedding; leave the tie intact
                    continue
                with torch.no_grad():
                    param.copy_(tensor.to(param.dtype))
                passthrough += 1
            # Pass 2: swap factorized modules (captures bias from pass 1)
            for name, entry in entries.items():
                if entry["action"] != "littlebit":
                    continue
                module_path, _, attr = name.rpartition(".")
                resolved = art.resolve_module_key(
                    module_path if attr == "weight" else name,
                    module_keys)
                if resolved is None:
                    continue
                module = named_modules.get(resolved)
                if module is None:
                    continue
                parent_path, _, parent_attr = resolved.rpartition(".")
                parent = named_modules.get(parent_path)
                keys = entry["keys"]
                u_sign = unpack_binary(
                    fh.get_tensor(keys["u"]),
                    (entry["d_out"], entry["rank"]))
                v_sign = unpack_binary(
                    fh.get_tensor(keys["v"]),
                    (entry["d_in"], entry["rank"]))
                h = fh.get_tensor(keys["h"]).float()
                g = fh.get_tensor(keys["g"]).float()
                ell = fh.get_tensor(keys["ell"]).float()
                residual = bool(entry.get("residual"))
                res_kwargs: dict[str, Any] = {}
                if residual:
                    res_kwargs = {
                        "u_res": unpack_binary(
                            fh.get_tensor(keys["u_res"]),
                            (entry["d_out"], entry["rank"])),
                        "v_res": unpack_binary(
                            fh.get_tensor(keys["v_res"]),
                            (entry["d_in"], entry["rank"])),
                        "h_res": fh.get_tensor(keys["h_res"]).float(),
                        "g_res": fh.get_tensor(keys["g_res"]).float(),
                        "ell_res": fh.get_tensor(keys["ell_res"]).float(),
                    }
                is_conv1d = type(module).__name__ == "Conv1D"
                # both nn.Linear and Conv1D biases survive the module swap
                bias_param = getattr(module, "bias", None)
                bias = (bias_param.data if bias_param is not None
                        and tuple(bias_param.shape) == (entry["d_out"],)
                        else None)
                lb_module = LittleBitLinear.build(
                    torch, d_out=entry["d_out"], d_in=entry["d_in"],
                    rank=entry["rank"], u_sign=u_sign, v_sign=v_sign,
                    h=h, g=g, ell=ell, residual=residual,
                    bias=bias,
                    kind="conv1d" if is_conv1d else "linear",
                    **res_kwargs)
                if parent is None:
                    raise RuntimeError(
                        f"{name}: parent module not found during swap")
                setattr(parent, parent_attr, lb_module)
                named_modules[resolved] = lb_module
                replaced += 1

        if replaced == 0:
            raise RuntimeError(
                "the artifact contained no factorized tensors; it is "
                "corrupt or was produced by an incompatible version")
        if self.threads:
            try:
                torch.set_num_threads(int(self.threads))
            except (TypeError, ValueError, RuntimeError):
                pass
        self._device = "cuda" if torch.cuda.is_available() else "cpu"
        try:
            model.to(self._device)
        except Exception as exc:  # noqa: BLE001
            raise RuntimeError(
                f"could not move the factorized model to {self._device}: "
                f"{exc}", detail=str(exc)) from exc
        model.eval()
        self._model = model
        self._tokenizer = tokenizer
        self._replaced = replaced
        self._passthrough = passthrough

    # -------------------------------------------------------- capabilities

    def capabilities(self) -> dict[str, Any]:
        caps = super().capabilities()
        caps["backend"] = "littlebit"
        caps["formats"] = ["syntara-littlebit-artifact"]
        caps["compression"] = {
            "algorithm": art.ALGORITHM,
            "paper": "arXiv:2506.13771",
            "qat": ((self._manifest or {}).get("method") or {}).get("qat"),
        }
        if self.loaded:
            caps["replaced_tensors"] = getattr(self, "_replaced", 0)
            caps["passthrough_tensors"] = getattr(self, "_passthrough", 0)
        return caps

    def health(self) -> dict[str, Any]:
        info = super().health()
        info["backend"] = "littlebit"
        if self._manifest is not None:
            info["algorithm"] = self._manifest["algorithm"]
            info["settings"] = self._manifest["settings"]
            info["totals"] = self._manifest["totals"]
        return info


def _trust_env() -> bool:
    from .transformers_rt import _trust_remote_code
    return _trust_remote_code()
