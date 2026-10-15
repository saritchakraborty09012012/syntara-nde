"""Runtime routing: match a local model artifact to a runtime that runs it.

One source of truth for "what can execute this path" (AGENTS §8/§12): the
router inspects real metadata (:mod:`syntara.model_inspect`), then ranks the
registered runtime adapters. The gateway calls :func:`build_runtime` instead
of hardcoding one backend, so adding an adapter is registering a candidate,
not editing the gateway.

Deterministic policy (documented order, no heuristics on filenames):

1. GGUF file          -> llama.cpp (the only GGUF-capable runtime);
2. diffusion pipeline -> diffusers adapter (image generation);
3. LittleBit artifact -> the LittleBit factorized runtime (primary);
4. checkpoint whose ``model_type`` the engine registry owns
                         -> the Syntara C engine suite (primary),
                            Transformers fallback below it;
5. any other recognized checkpoint -> Transformers fallback;
6. ONNX graph         -> honest "not executable yet" + conversion path;
7. anything else      -> actionable error, never a silent guess.

``SYNTARA_RUNTIME`` forces a candidate id (``llama.cpp``,
``syntara-engine-suite``, ``transformers``, ``diffusers``) when you want an
explicit choice; a forced candidate that is unavailable fails with its own
reason instead of silently falling back.
"""
from __future__ import annotations

import importlib.util
import os
import shlex
from pathlib import Path
from typing import Any

from .model_inspect import (KIND_DIFFUSION, KIND_GGUF, KIND_HF, KIND_ONNX,
                            inspect_path)

# Candidate ids (stable: environment override + tests key off these).
RT_LLAMA = "llama.cpp"
RT_ENGINE_SUITE = "syntara-engine-suite"
RT_TRANSFORMERS = "transformers"
RT_DIFFUSERS = "diffusers"
RT_LITTLEBIT = "littlebit"

_ENV_FORCE = "SYNTARA_RUNTIME"
_ENV_SERVER = "SYNTARA_OPENAI_SERVER"
_ENV_ENGINE = "SYNTARA_ENGINE"

_registry_cache: dict[str, Any] = {"key": None, "value": None}


def clear_cache() -> None:
    """Reset discovery caches (tests, and after installing a runtime)."""
    _registry_cache["key"] = None
    _registry_cache["value"] = None


def discover_openai_server() -> Path | None:
    """Locate the engine suite's OpenAI gateway script, or None.

    Precedence (explicit first, AGENTS §30): ``SYNTARA_OPENAI_SERVER``, the
    directory of ``SYNTARA_ENGINE``, the desktop bundle layout (script next
    to the package), then the repository layout (``c/`` next to the package).
    Never guessed from PATH - a generic ``openai_server.py`` elsewhere on
    PATH could be anything (AGENTS §25).
    """
    explicit = os.environ.get(_ENV_SERVER, "").strip()
    if explicit:
        p = Path(explicit).expanduser()
        return p if p.is_file() else None
    raw = os.environ.get(_ENV_ENGINE, "").strip()
    if raw:
        try:
            parts = shlex.split(raw)
        except ValueError:
            parts = []
        for token in parts:
            candidate = Path(token).expanduser()
            if candidate.is_file():
                sibling = candidate.parent / "openai_server.py"
                if sibling.is_file():
                    return sibling
                break
    package_root = Path(__file__).resolve().parents[1]
    for candidate in (package_root / "openai_server.py",
                      package_root / "c" / "openai_server.py"):
        if candidate.is_file():
            return candidate
    return None


def load_engine_registry() -> dict[str, Any] | None:
    """The engine suite's family registry, loaded from its real source.

    Returns ``{"model_types": {model_type: family_id}, "path": str}`` or
    None when the registry file is not present. Importing the actual
    ``family_registry.py`` (stdlib-only) keeps one source of truth: a new
    engine family shows up here the moment the registry declares it.
    """
    server = discover_openai_server()
    if server is None:
        return None
    registry_path = server.parent / "family_registry.py"
    if not registry_path.is_file():
        return None
    key = str(registry_path)
    if _registry_cache["key"] == key:
        return _registry_cache["value"]
    value: dict[str, Any] | None = None
    try:
        spec = importlib.util.spec_from_file_location(
            "syntara_engine_family_registry", registry_path)
        if spec is not None and spec.loader is not None:
            module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(module)
            mapping: dict[str, str] = {}
            for family in getattr(module, "FAMILIES", ()):
                family_id = getattr(family, "id", None)
                for model_type in getattr(family, "model_types", ()):
                    mapping[str(model_type)] = str(family_id)
            if mapping:
                value = {"model_types": mapping, "path": str(registry_path)}
    except Exception:  # noqa: BLE001 - a broken registry must not break routing
        value = None
    _registry_cache["key"] = key
    _registry_cache["value"] = value
    return value


def _find_spec_available(*module_names: str) -> tuple[bool, str]:
    for name in module_names:
        try:
            if importlib.util.find_spec(name) is None:
                return False, f"Python package {name!r} is not installed"
        except (ImportError, ValueError):
            return False, f"Python package {name!r} is not installed"
    return True, ""


def transformers_availability() -> tuple[bool, str]:
    ok, reason = _find_spec_available("torch", "transformers")
    if not ok:
        return False, (f"{reason}; install the optional fallback with "
                       "`pip install torch transformers`")
    return True, ""


def diffusers_availability() -> tuple[bool, str]:
    ok, reason = _find_spec_available("torch", "diffusers", "PIL")
    if not ok:
        return False, (f"{reason}; install the optional image-generation "
                       "runtime with `pip install torch diffusers pillow`")
    return True, ""


def _llama_availability() -> tuple[bool, str]:
    from .runtime.llama_cpp import discover_binary
    if discover_binary() is not None:
        return True, ""
    return False, ("the llama.cpp binary is not installed; run "
                   "tools/fetch_llama_cpp.ps1 (Windows) or "
                   "tools/fetch_llama_cpp.sh (Linux/macOS), or set "
                   "SYNTARA_LLAMA_BIN to an existing llama-server binary")


def _engine_suite_availability() -> tuple[bool, str, Path | None]:
    server = discover_openai_server()
    if server is None:
        return False, (f"the engine suite gateway was not found; set "
                       f"{_ENV_SERVER} to its openai_server.py or "
                       f"{_ENV_ENGINE} to the engine launcher (e.g. "
                       '"python <repo>/c/syntara")'), None
    return True, "", server


def _candidate(candidate_id: str, label: str, available: bool,
               reason: str, *, score: int, primary: bool,
               detail: str = "") -> dict[str, Any]:
    return {"id": candidate_id, "label": label, "available": available,
            "reason": reason, "score": score, "primary": primary,
            "detail": detail}


def rank(report: dict[str, Any]) -> dict[str, Any]:
    """Rank runtime candidates for an inspect report.

    Returns ``{"path", "kind", "candidates", "selected", "error"}``:
    candidates in best-first order (availability, then policy score), the
    selected id (or None), and an actionable error when nothing can run it.
    """
    kind = report.get("kind")
    path = report.get("path", "")
    candidates: list[dict[str, Any]] = []
    error: str | None = None

    if kind == KIND_GGUF:
        ok, reason = _llama_availability()
        candidates.append(_candidate(
            RT_LLAMA, "llama.cpp (GGUF runtime)", ok, reason,
            score=100, primary=True))
        if not ok:
            error = reason
    elif kind == KIND_DIFFUSION:
        ok, reason = diffusers_availability()
        candidates.append(_candidate(
            RT_DIFFUSERS, "diffusers (image generation)", ok, reason,
            score=100, primary=True))
        if not ok:
            error = reason
    elif kind == KIND_HF:
        compression = report.get("compression")
        if isinstance(compression, dict) and compression.get("detected"):
            # Factorized artifact: dense weights are not stored, so only the
            # LittleBit runtime can execute it (AGENTS §16: adapters own
            # format specifics; the router never guesses a dense loader).
            if not compression.get("valid"):
                reason = ("syntara_littlebit.json is present but invalid: "
                          + str(compression.get("error")
                                or "unreadable manifest"))
                candidates.append(_candidate(
                    RT_LITTLEBIT, "LittleBit factorized runtime", False,
                    reason, score=100, primary=True))
                candidates.append(_candidate(
                    RT_TRANSFORMERS, "PyTorch/Transformers fallback", False,
                    "cannot load a factorized artifact as dense weights",
                    score=10, primary=False))
                error = reason
            else:
                lb_ok, lb_reason = transformers_availability()
                label = compression.get("label") or "LittleBit artifact"
                candidates.append(_candidate(
                    RT_LITTLEBIT, f"LittleBit factorized runtime ({label})",
                    lb_ok, lb_reason or "", score=100, primary=True,
                    detail=f"manifest valid: {compression.get('algorithm')}"))
                candidates.append(_candidate(
                    RT_TRANSFORMERS, "PyTorch/Transformers fallback", False,
                    "dense weights are not stored in a LittleBit artifact",
                    score=10, primary=False))
                candidates.append(_candidate(
                    RT_ENGINE_SUITE, "Syntara C engine suite", False,
                    "the C engines read dense safetensors, not factorized "
                    "artifacts", score=10, primary=False))
                if not lb_ok:
                    error = lb_reason
        else:
            model_type = str(report.get("model_type") or "").lower()
            registry = load_engine_registry()
            engine_ok, engine_reason, _ = _engine_suite_availability()
            family_id = None
            family_owned = False
            if registry is not None:
                family_id = registry["model_types"].get(model_type)
                family_owned = family_id is not None
            elif engine_ok:
                # Server present but registry unreadable: the engine itself
                # will decide the family; do not claim an unverified match.
                family_owned = False
                engine_reason = (
                    "engine family check deferred: family_registry could "
                    "not be loaded next to openai_server.py")
            tf_ok, tf_reason = transformers_availability()
            if family_owned:
                detail = (f"engine family: {family_id} "
                          f"(model_type {model_type})")
                candidates.append(_candidate(
                    RT_ENGINE_SUITE, "Syntara C engine suite", engine_ok,
                    engine_reason, score=100, primary=True, detail=detail))
                candidates.append(_candidate(
                    RT_TRANSFORMERS, "PyTorch/Transformers fallback", tf_ok,
                    tf_reason, score=60, primary=False))
                if not engine_ok and not tf_ok:
                    error = f"{engine_reason}; {tf_reason}"
                elif not engine_ok:
                    error = None  # transformers fallback will run it
            else:
                why = (f"model_type {model_type!r} is not owned by any "
                       "engine family (see c/family_registry.py)")
                candidates.append(_candidate(
                    RT_ENGINE_SUITE, "Syntara C engine suite", False,
                    why, score=40, primary=False))
                candidates.append(_candidate(
                    RT_TRANSFORMERS, "PyTorch/Transformers fallback", tf_ok,
                    tf_reason, score=100, primary=True))
                if not tf_ok:
                    error = f"{why}; {tf_reason}"
    elif kind == KIND_ONNX:
        error = ("ONNX graphs are recognized but no ONNX execution adapter "
                 "ships yet; convert this model with `syntara convert "
                 "--repo <dir> --outdir <fresh-dir>` to run it through the "
                 "engine suite, or use the original safetensors checkpoint")
        candidates.append(_candidate(
            "onnx", "ONNX Runtime", False,
            "not implemented in this build", score=100, primary=True))
    else:
        error = ("this path is not a model Syntara can route; run "
                 "`syntara inspect <path>` to see what was found, or add a "
                 ".gguf file / checkpoint directory")
        candidates.append(_candidate(
            "unknown", "unrecognized artifact", False,
            error, score=0, primary=True))

    candidates.sort(key=lambda c: (not c["available"], -c["score"],
                                   c["id"]))
    selected: str | None = None
    forced = os.environ.get(_ENV_FORCE, "").strip()
    if forced:
        match = next((c for c in candidates if c["id"] == forced), None)
        if match is None:
            error = (f"{_ENV_FORCE}={forced!r} is not a known runtime for "
                     f"this model; known: "
                     + ", ".join(c["id"] for c in candidates))
        else:
            selected = match["id"]
            if not match["available"] and match["reason"]:
                error = match["reason"]
    else:
        available = next((c for c in candidates if c["available"]), None)
        if available is not None:
            selected = available["id"]
        elif error is None:
            error = "; ".join(c["reason"] for c in candidates
                              if c["reason"]) or "no runtime can run this model"
    return {"path": path, "kind": kind, "candidates": candidates,
            "selected": selected, "error": error}


def build_runtime(path: str | os.PathLike[str], *,
                  context: int | None = None,
                  threads: int | None = None,
                  startup_timeout: float = 120.0,
                  report: dict[str, Any] | None = None) -> Any:
    """Instantiate the best available runtime for ``path``.

    Raises ``syntara.runtime.base.RuntimeError`` with an actionable message
    when no candidate can run it (AGENTS §28).
    """
    from .runtime.base import RuntimeError as RuntimeFailure

    report = report if report is not None else inspect_path(path)
    decision = rank(report)
    selected = decision["selected"]
    if selected is None:
        raise RuntimeFailure(
            f"cannot run {decision['path']}: {decision['error'] or 'no runtime available'}")
    if selected == RT_LLAMA:
        from .runtime.llama_cpp import LlamaCppRuntime
        # The llama.cpp server needs the model *file*.  inspect_path
        # resolves containers (a directory holding a single GGUF, or a
        # magic-detected file) down to the actual file in report["path"];
        # the caller may have passed the container itself - e.g. a library
        # entry registered from a folder - so prefer the resolved path.
        return LlamaCppRuntime(report.get("path") or path, context=context,
                               threads=threads,
                               startup_timeout=startup_timeout)
    if selected == RT_ENGINE_SUITE:
        from .runtime.engine_suite import EngineSuiteRuntime
        return EngineSuiteRuntime(path, context=context, threads=threads,
                                  startup_timeout=startup_timeout)
    if selected == RT_LITTLEBIT:
        from .runtime.littlebit_rt import LittleBitRuntime
        return LittleBitRuntime(path, context=context, threads=threads,
                                startup_timeout=startup_timeout)
    if selected == RT_TRANSFORMERS:
        from .runtime.transformers_rt import TransformersRuntime
        return TransformersRuntime(path, context=context, threads=threads,
                                   startup_timeout=startup_timeout)
    if selected == RT_DIFFUSERS:
        from .runtime.diffusion_rt import DiffusionRuntime
        return DiffusionRuntime(path, startup_timeout=startup_timeout)
    raise RuntimeFailure(f"unknown runtime selected: {selected}")
