"""Compression pipeline: source HF checkpoint -> LittleBit-style artifact.

Stages (each recorded, resumable where noted):

    validate   source layout, architecture support, disk budget
    inspect    meta-device module census (no weight RAM cost)
    factorize  per-tensor Dual-SVID factorization (journal-resumable)
    export     pack signs, write safetensors, copy tokenizer/config
    publish    checksum + atomic directory publish

The source checkpoint is opened read-only and is never modified.  The
artifact is a separate directory.  Progress is reported through ``on_event``
callables; cancellation is cooperative through a ``cancel`` predicate.
"""

from __future__ import annotations

import json
import os
import shutil
import time
from pathlib import Path
from typing import Any, Callable, Iterable

from . import artifact as art
from .littlebit_core import (RANK_MULTIPLE, factorize_matrix, pack_binary)

EventSink = Callable[[dict[str, Any]], None]
CancelCheck = Callable[[], bool]

_JOURNAL_NAME = "journal.json"
_PARTS_DIR = "parts"


class CompressError(ValueError):
    """User-facing compression failure with an actionable message."""


def _emit(on_event: EventSink | None, payload: dict[str, Any]) -> None:
    if on_event is not None:
        on_event(payload)


def _check_cancel(cancel: CancelCheck | None, stage: str) -> None:
    if cancel is not None and cancel():
        raise CompressError(
            f"compression cancelled during {stage}; the workspace was kept "
            "— rerun with the same output directory to resume")


def _require_torch():
    try:
        import torch  # noqa: F401
        return torch
    except ImportError as exc:  # pragma: no cover - env dependent
        raise CompressError(
            "the LittleBit-style compressor requires PyTorch; install it "
            "with `pip install torch` (CPU wheels are sufficient)") from exc


def _require_transformers():
    try:
        import transformers  # noqa: F401
        return transformers
    except ImportError as exc:  # pragma: no cover - env dependent
        raise CompressError(
            "the compressor needs the transformers package to interpret "
            "checkpoint architectures; `pip install transformers`") from exc


def _read_json(path: Path) -> dict[str, Any] | None:
    try:
        doc = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return None
    return doc if isinstance(doc, dict) else None


def _validate_source(source: Path) -> dict[str, Any]:
    if not source.is_dir():
        raise CompressError(f"{source}: not a directory")
    config = _read_json(source / "config.json")
    if config is None:
        if (source / "model_index.json").is_file():
            raise CompressError(
                f"{source}: this is a diffusers pipeline (model_index.json), "
                "not a causal-LM checkpoint — the LittleBit compressor "
                "supports text-generation safetensors models only; run the "
                "pipeline's components (e.g. unet/) individually if needed")
        raise CompressError(
            f"{source}: config.json missing or unreadable — only "
            "Hugging Face safetensors checkpoints can be compressed")
    index = art.source_identity(source)
    if not index["shards"]:
        raise CompressError(
            f"{source}: no *.safetensors / *.bin weight files found")
    bin_only = [n for n in index["shards"] if n.endswith(".bin")]
    st_only = [n for n in index["shards"] if n.endswith(".safetensors")]
    if not st_only:
        raise CompressError(
            "this checkpoint stores weights as pickled .bin files; the "
            "compressor only reads safetensors (no pickle, no code "
            "execution). Re-export the model with safe_serialization=True "
            "first")
    if bin_only:
        pass  # .bin shards ignored; safetensors carry the weights
    return {"config": config, "identity": index}


def _census(source: Path, config: dict[str, Any]) -> list[dict[str, Any]]:
    """Meta-device model census: every linear-ish weight with its geometry.

    Uses AutoModelForCausalLM.from_config on the meta device, so no weight
    values are allocated.  Handles nn.Linear and transformers Conv1D
    (weight stored transposed).  Remote code is never executed.
    """
    torch = _require_torch()
    _require_transformers()
    from transformers import AutoConfig, AutoModelForCausalLM

    try:
        hf_config = AutoConfig.from_pretrained(
            str(source), local_files_only=True, trust_remote_code=False)
        with torch.device("meta"):
            model = AutoModelForCausalLM.from_config(hf_config)
    except Exception as exc:  # noqa: BLE001 - report, don't crash the CLI
        raise CompressError(
            "could not instantiate this architecture from its config "
            "without executing remote code: "
            f"{type(exc).__name__}: {exc}. Supported: dense transformer "
            "LMs with standard Linear/Conv1D layers (Llama, GPT-2, OPT, "
            "Qwen2, Phi, Gemma families and similar)") from exc

    entries: list[dict[str, Any]] = []
    try:
        from transformers.pytorch_utils import Conv1D
    except Exception:  # pragma: no cover - very old transformers
        Conv1D = ()  # type: ignore[assignment]
    named = dict(model.named_modules())
    for name, module in named.items():
        weight = getattr(module, "weight", None)
        if weight is None or not hasattr(weight, "shape") or weight.dim() != 2:
            continue
        kind: str | None = None
        if isinstance(module, torch.nn.Linear):
            kind = "linear"           # weight: (d_out, d_in)
        elif Conv1D and isinstance(module, Conv1D):
            kind = "conv1d"           # weight: (d_in, d_out)
        if kind is None:
            continue
        if name.endswith("lm_head"):
            entries.append({"name": f"{name}.weight", "module": name,
                            "kind": kind,
                            "d_out": int(weight.shape[0]),
                            "d_in": int(weight.shape[1]),
                            "special": "lm_head"})
            continue
        entries.append({
            "name": f"{name}.weight", "module": name, "kind": kind,
            # geometry in Linear terms (d_out, d_in) regardless of storage:
            "d_out": int(weight.shape[0] if kind == "linear"
                         else weight.shape[1]),
            "d_in": int(weight.shape[1] if kind == "linear"
                        else weight.shape[0]),
            "has_bias": getattr(module, "bias", None) is not None,
        })
    del model
    if not entries:
        raise CompressError(
            "no 2D linear weight matrices were found in this architecture; "
            "nothing to compress")
    return entries


def _is_kv_projection(name: str) -> bool:
    base = name[:-len(".weight")] if name.endswith(".weight") else name
    leaf = base.rsplit(".", 1)[-1]
    return leaf in ("k_proj", "v_proj")


def _plan_tensors(census: Iterable[dict[str, Any]], *, bpw: float,
                  residual: bool, kv_factor: float,
                  min_layer_params: int,
                  include_lm_head: bool) -> list[dict[str, Any]]:
    plan: list[dict[str, Any]] = []
    for entry in census:
        d_out, d_in = entry["d_out"], entry["d_in"]
        params = d_out * d_in
        item = dict(entry)
        item["params"] = params
        if entry.get("special") == "lm_head" and not include_lm_head:
            item.update(action="passthrough",
                        reason="lm_head excluded by default")
            plan.append(item)
            continue
        if params < min_layer_params:
            item.update(action="passthrough",
                        reason=f"below min_layer_params ({params} "
                               f"< {min_layer_params})")
            plan.append(item)
            continue
        rank = _rank_for(item, bpw=bpw, residual=residual,
                         kv_factor=kv_factor)
        if rank is None:
            item.update(action="passthrough",
                        reason="rank infeasible at this bit budget "
                               "(scale overhead dominates small matrices)")
            plan.append(item)
            continue
        item.update(action="littlebit", rank=rank)
        plan.append(item)
    return plan


def _rank_for(item: dict[str, Any], *, bpw: float, residual: bool,
              kv_factor: float) -> int | None:
    from .littlebit_core import bpw_for_rank, rank_for_bpw

    d_out, d_in = item["d_out"], item["d_in"]
    kvf = kv_factor if (kv_factor > 1.0
                        and _is_kv_projection(item["name"])) else 1.0
    r = rank_for_bpw(d_out, d_in, bpw, residual=residual)
    if r is None:
        return None
    if kvf != 1.0:
        r = int(r * kvf) // RANK_MULTIPLE * RANK_MULTIPLE
        r = max(r, 8)
        r = min(r, min(d_out, d_in) // RANK_MULTIPLE * RANK_MULTIPLE)
        if r < 8:
            return None
    # feasibility re-check with the (possibly inflated) rank
    if bpw_for_rank(d_out, d_in, r, residual=residual) > 16:
        return None
    return r


def _load_weight(source: Path, name: str,
                 weight_map: dict[str, str]) -> Any:  # noqa: ANN401
    from safetensors import safe_open

    shard = weight_map.get(name)
    if shard is None:
        raise CompressError(
            f"tensor {name!r} is not present in any safetensors shard")
    path = source / shard
    if not path.is_file():
        raise CompressError(f"shard missing: {path}")
    with safe_open(str(path), framework="pt", device="cpu") as fh:
        return fh.get_tensor(name)


def _load_many(source: Path, names: Iterable[str],
               weight_map: dict[str, str]
               ) -> dict[str, Any]:  # noqa: ANN401
    """Load several tensors, opening each shard only once.

    Repeatedly opening and closing a large memory-mapped safetensors file
    (once per tensor) has been observed to crash with a native access
    violation on Windows after the heap is fragmented by factorization;
    a single handle per shard avoids the churn.
    """
    from safetensors import safe_open

    by_shard: dict[str, list[str]] = {}
    for name in names:
        shard = weight_map.get(name)
        if shard is None:
            raise CompressError(
                f"tensor {name!r} is not present in any safetensors shard")
        by_shard.setdefault(shard, []).append(name)
    out: dict[str, Any] = {}
    for shard, shard_names in by_shard.items():
        path = source / shard
        if not path.is_file():
            raise CompressError(f"shard missing: {path}")
        with safe_open(str(path), framework="pt", device="cpu") as fh:
            for name in shard_names:
                out[name] = fh.get_tensor(name)
    return out


def _workspace_for(outdir: Path) -> Path:
    return outdir.with_name(outdir.name + art.WORKSPACE_SUFFIX)


def _load_journal(ws: Path, fingerprint: str) -> dict[str, Any] | None:
    path = ws / _JOURNAL_NAME
    journal = _read_json(path)
    if journal is None:
        return None
    if journal.get("fingerprint") != fingerprint:
        return None  # settings/source changed: start over
    return journal


def _save_journal(ws: Path, journal: dict[str, Any]) -> None:
    art.write_json_atomic(ws / _JOURNAL_NAME, journal)


def compress(source: str | os.PathLike[str],
             outdir: str | os.PathLike[str], *,
             bpw: float = 0.55,
             residual: bool = True,
             kv_factor: float = 1.0,
             include_lm_head: bool = False,
             min_layer_params: int = 4096,
             force: bool = False,
             fast_svd: bool = False,
             seed: int = 0,
             qat_steps: int = 0,
             on_event: EventSink | None = None,
             cancel: CancelCheck | None = None) -> dict[str, Any]:
    """Compress ``source`` into a LittleBit-style artifact at ``outdir``.

    Returns the published manifest.  Raises :class:`CompressError` with an
    actionable message on any validation failure; a previously created
    workspace is kept so the same command can resume after interruption.
    """
    torch = _require_torch()
    _require_transformers()
    from safetensors.torch import save_file

    source = Path(source).expanduser().resolve()
    outdir = Path(outdir).expanduser().resolve()
    t_start = time.time()
    _emit(on_event, {"type": "stage", "stage": "validate"})

    if outdir == source or source in outdir.parents and outdir == source:
        raise CompressError("output directory must not be the source model")
    if outdir.exists() and any(outdir.iterdir()) and not force:
        raise CompressError(
            f"output directory exists and is not empty: {outdir} "
            "(choose a fresh directory or pass --force)")

    facts = _validate_source(source)
    config = facts["config"]
    identity = facts["identity"]

    settings = {
        "target_bpw": float(bpw), "residual": bool(residual),
        "kv_factor": float(kv_factor),
        "include_lm_head": bool(include_lm_head),
        "min_layer_params": int(min_layer_params),
        "scales_dtype": "float16",
        "fast_svd": bool(fast_svd), "seed": int(seed),
        "qat_steps": int(qat_steps),
    }
    fingerprint = json.dumps(
        {"settings": settings,
         "meta": identity["meta_sha256"],
         "shards": {k: v["size"] for k, v in identity["shards"].items()}},
        sort_keys=True)

    # --- disk budget: workspace needs roughly the artifact size ----------
    free_gb = shutil.disk_usage(outdir.parent if outdir.parent.exists()
                                else source).free / 1e9
    est_gb = max(0.2, identity["weight_bytes_estimate"]
                 if "weight_bytes_estimate" in identity
                 else sum(v["size"] for v in identity["shards"].values())
                 / 1e9 * max(0.05, min(bpw, 16) / 16) + 0.1)
    if free_gb < est_gb + 0.2:
        raise CompressError(
            f"insufficient disk space near {outdir.parent}: "
            f"{free_gb:.1f} GB free, about {est_gb:.1f} GB needed for the "
            "artifact workspace")

    _check_cancel(cancel, "validate")
    _emit(on_event, {"type": "stage", "stage": "inspect"})
    census = _census(source, config)
    plan = _plan_tensors(census, bpw=bpw, residual=residual,
                         kv_factor=kv_factor,
                         min_layer_params=min_layer_params,
                         include_lm_head=include_lm_head)
    todo = [p for p in plan if p["action"] == "littlebit"]
    passthrough = [p for p in plan if p["action"] == "passthrough"]
    _emit(on_event, {"type": "census", "total": len(plan),
                     "compress": len(todo), "passthrough": len(passthrough)})

    index = _weight_index(source)
    weight_map = index["weight_map"]
    # architecture name -> shard-native key (prefix conventions differ)
    resolved: dict[str, str] = {}
    missing = []
    for p in plan:
        key = art.resolve_shard_key(p["name"], weight_map)
        if key is not None:
            resolved[p["name"]] = key
            continue
        # tied embeddings: lm_head often aliases the token embedding and is
        # therefore absent as a standalone tensor; the passthrough loop
        # resolves the tie.  Compressing a tied lm_head is not supported.
        if p["name"] in ("lm_head.weight", "lm_head"):
            if p["action"] == "littlebit":
                raise CompressError(
                    "lm_head is tied to the token embedding in this "
                    "checkpoint; --include-lm-head cannot compress a "
                    "tied head (it is stored once with the embedding)")
            continue
        missing.append(p["name"])
    if missing:
        raise CompressError(
            "tensors referenced by the architecture are absent from the "
            f"checkpoint shards: {missing[:5]}")

    # --- workspace with journal-resumable per-tensor work ----------------
    ws = _workspace_for(outdir)
    if ws.exists():
        if force:
            shutil.rmtree(ws)
        # else: keep for resume
    ws.mkdir(parents=True, exist_ok=True)
    parts_dir = ws / _PARTS_DIR
    parts_dir.mkdir(exist_ok=True)
    journal = _load_journal(ws, fingerprint)
    done: dict[str, dict[str, Any]] = {}
    if journal is not None:
        done = dict(journal.get("done") or {})
        _emit(on_event, {"type": "resume", "already_done": len(done),
                         "remaining": len(todo) - len(done)})
    else:
        for stale in parts_dir.glob("*.safetensors"):
            stale.unlink()
        journal = {"fingerprint": fingerprint, "done": {}}

    generator = torch.Generator().manual_seed(int(seed))
    tensors_out: list[dict[str, Any]] = []
    packed_store: dict[str, Any] = {}
    n_done = 0
    total_todo = len(todo)
    for item in todo:
        name = item["name"]
        n_done += 1
        if name in done:
            part_path = parts_dir / f"{done[name]['part']}"
            if part_path.is_file():
                from safetensors.torch import load_file
                packed_store.update(load_file(str(part_path)))
                tensors_out.append(done[name]["entry"])
                _emit(on_event, {"type": "tensor", "name": name,
                                 "index": n_done, "total": total_todo,
                                 "cached": True})
                continue
        _check_cancel(cancel, f"tensor {name}")
        t0 = time.time()
        w = _load_weight(source, resolved.get(name, name), weight_map)
        w = w.float()
        if item["kind"] == "conv1d":
            # Conv1D stores (d_in, d_out); factorize the Linear-equivalent
            # transpose so the forward contract y = x @ W stays intact.
            w = w.t().contiguous()
        result = factorize_matrix(
            w, rank=item["rank"], residual=residual, fast_svd=fast_svd,
            generator=generator)
        if result is None:  # pragma: no cover - rank already vetted
            raise CompressError(f"{name}: factorization unexpectedly failed")
        qat_info: dict[str, Any] | None = None
        if qat_steps > 0:
            from .qat import calibrate_weight
            refined = calibrate_weight(
                w, rank=item["rank"], residual=residual, steps=qat_steps,
                generator=generator, cancel=cancel,
                on_event=(lambda ev, _n=name: _emit(
                    on_event, {"type": "qat", "tensor": _n, **ev}))
                if on_event else None)
            for key in ("u_sign", "v_sign", "h", "g", "ell",
                        "init_rel_error"):
                if key in refined:
                    result[key] = refined[key]
            if residual:
                for key in ("res_u_sign", "res_v_sign", "res_h", "res_g",
                            "res_ell", "init_rel_error_residual"):
                    if key in refined:
                        result[key] = refined[key]
            qat_info = refined.get("qat")
        elif "qat" in result:
            result.pop("qat", None)
        key_base = name
        entry_keys = {
            "u": f"{key_base}.lb.u", "v": f"{key_base}.lb.v",
            "h": f"{key_base}.lb.h", "g": f"{key_base}.lb.g",
            "ell": f"{key_base}.lb.ell",
        }
        packed_store[entry_keys["u"]] = pack_binary(result["u_sign"])
        packed_store[entry_keys["v"]] = pack_binary(result["v_sign"])
        packed_store[entry_keys["h"]] = result["h"].to(torch.float16)
        packed_store[entry_keys["g"]] = result["g"].to(torch.float16)
        packed_store[entry_keys["ell"]] = result["ell"].to(torch.float16)
        entry = {
            "name": name, "action": "littlebit", "kind": item["kind"],
            "d_out": result["d_out"], "d_in": result["d_in"],
            "rank": result["rank"], "residual": bool(residual),
            "params": item["params"], "bpw": round(result["bpw"], 6),
            "init_rel_error": round(result.get("init_rel_error", 0.0), 6),
            "keys": entry_keys,
        }
        if qat_info is not None:
            entry["qat"] = qat_info
        if residual:
            res_keys = {
                "u_res": f"{key_base}.lb.u_res",
                "v_res": f"{key_base}.lb.v_res",
                "h_res": f"{key_base}.lb.h_res",
                "g_res": f"{key_base}.lb.g_res",
                "ell_res": f"{key_base}.lb.ell_res",
            }
            packed_store[res_keys["u_res"]] = pack_binary(result["res_u_sign"])
            packed_store[res_keys["v_res"]] = pack_binary(result["res_v_sign"])
            packed_store[res_keys["h_res"]] = result["res_h"].to(torch.float16)
            packed_store[res_keys["g_res"]] = result["res_g"].to(torch.float16)
            packed_store[res_keys["ell_res"]] = result["res_ell"].to(
                torch.float16)
            entry["keys"].update(res_keys)
            entry["init_rel_error_residual"] = round(
                result.get("init_rel_error_residual", 0.0), 6)
        # per-tensor part file keeps resume granular
        part_name = f"{n_done:05d}.safetensors"
        sub = {k: v for k, v in packed_store.items()
               if k.startswith(key_base + ".")}
        save_file(sub, str(parts_dir / part_name))
        done[name] = {"part": part_name, "entry": entry}
        journal["done"] = done
        _save_journal(ws, journal)
        tensors_out.append(entry)
        _emit(on_event, {"type": "tensor", "name": name, "index": n_done,
                         "total": total_todo, "rank": result["rank"],
                         "bpw": round(result["bpw"], 4),
                         "seconds": round(time.time() - t0, 2)})
        del w, result

    # --- passthrough tensors (embeddings, norms, biases, lm_head, ...) --
    _check_cancel(cancel, "passthrough")
    _emit(on_event, {"type": "stage", "stage": "export"})
    # shard keys already claimed (factorized + passthrough); the
    # catch-all must not copy factorized matrices again verbatim
    used_keys: set[str] = set(resolved.values())
    # resolve tied aliases (lm_head -> token embedding) before loading
    tie_alts: dict[str, str] = {}
    for item in passthrough:
        name = item["name"]
        if resolved.get(name) is not None:
            continue
        if name in ("lm_head.weight", "lm_head"):
            for cand in weight_map:
                base = (cand[:-len(".weight")]
                        if cand.endswith(".weight") else cand)
                if base.rsplit(".", 1)[-1] in ("embed_tokens", "wte"):
                    tie_alts[name] = cand
                    break
        if name not in tie_alts:
            raise CompressError(f"passthrough tensor missing: {name}")
    pt_names = [resolved[i["name"]] for i in passthrough
                if i["name"] in resolved]
    pt_names += list(tie_alts.values())
    pt_loaded = _load_many(source, pt_names, weight_map)
    for item in passthrough:
        name = item["name"]
        if name in tie_alts:
            key = tie_alts[name]
            w = pt_loaded.pop(key)
            packed_store[key] = w
            tensors_out.append({
                "name": name, "action": "passthrough",
                "keys": {"weight": key}, "params": item["params"],
                "reason": "tied to " + key,
            })
            used_keys.add(key)
            del w
            continue
        key = resolved[name]
        w = pt_loaded.pop(key)
        packed_store[key] = w
        tensors_out.append({
            "name": name, "action": "passthrough",
            "keys": {"weight": key}, "params": item["params"],
        })
        del w
    # any remaining checkpoint tensors (norms, biases, rotary buffers...)
    remaining = sorted(set(weight_map) - used_keys)
    rest_loaded = _load_many(source, remaining, weight_map)
    for tname in remaining:
        w = rest_loaded.pop(tname)
        packed_store[tname] = w
        tensors_out.append({
            "name": tname, "action": "passthrough",
            "keys": {"weight": tname},
            "params": int(w.numel()) if w.dim() >= 1 else 0,
            "reason": "not selected for compression",
        })
        del w
    del rest_loaded

    # --- write weights, copy sidecars, checksum, publish -----------------
    weights_path = ws / art.WEIGHTS_NAME
    save_file(packed_store, str(weights_path))
    del packed_store
    copied = art.copy_source_sidecars(source, ws)
    if "config.json" not in copied:
        raise CompressError("config.json could not be copied into artifact")
    digest = art.sha256_file(weights_path)

    total_params = sum(int(p["params"]) for p in tensors_out)
    comp_params = sum(int(p["params"]) for p in tensors_out
                      if p["action"] == "littlebit")
    weighted_bpw = 0.0
    if comp_params:
        weighted_bpw = (sum(p["params"] * p["bpw"] for p in tensors_out
                            if p["action"] == "littlebit") / comp_params)
    artifact_bytes = weights_path.stat().st_size + sum(
        (ws / c).stat().st_size for c in copied if (ws / c).is_file())
    totals = {
        "total_params": total_params,
        "compressed_params": comp_params,
        "compressed_tensors": len(todo),
        "passthrough_tensors": len(tensors_out) - len(todo),
        "weighted_bpw_compressed": round(weighted_bpw, 6),
        "artifact_bytes": artifact_bytes,
        "source_weight_bytes": sum(v["size"] for v in
                                   identity["shards"].values()),
        "elapsed_seconds": round(time.time() - t_start, 2),
    }
    qat_done = [t.get("qat") for t in tensors_out if t.get("qat")]
    qat_summary = {"performed": bool(qat_done)}
    if qat_done:
        qat_summary.update({
            "steps": qat_steps,
            "tensors_calibrated": len(qat_done),
            "mode": qat_done[0].get("mode"),
        })
    manifest = art.build_manifest(
        settings=settings, source=identity, tensors=tensors_out,
        totals=totals, weights_sha256=digest, copied_files=copied,
        qat=qat_summary)
    art.write_json_atomic(ws / art.MANIFEST_NAME, manifest)
    _check_cancel(cancel, "publish")
    art.publish_workspace(ws, outdir, force=force)
    _emit(on_event, {"type": "done", "manifest": manifest,
                     "artifact": str(outdir)})
    return manifest


def _weight_index(source: Path) -> dict[str, Any]:
    from ..model_inspect import _weight_index as wi
    return wi(source)
