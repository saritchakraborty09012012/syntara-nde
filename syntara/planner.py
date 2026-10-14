"""Diagnostic resource planner: ranked execution plans, no control effects.

Combines a model's real metadata (:mod:`syntara.model_inspect`) with the
machine's real hardware (:mod:`syntara.hardware`) and produces ranked,
deterministic execution plans with explicit assumptions and memory risks
(AGENTS §14/§15). Nothing here loads a model, changes a setting, or claims
a model will run - it says what is likely, why, and what to do next
(AGENTS §92: estimates are labeled estimates).

Sizing convention (same as gguf_inspect): weights x 1.25 headroom is the
RAM floor; KV cache and runtime overhead are flagged as unknowns unless
the config provides enough fields to bound them.
"""
from __future__ import annotations

from typing import Any

from .routing import rank

_OVERHEAD_GB = 0.75          # interpreter + runtime bookkeeping floor
_TRANSFORMERS_OVERHEAD = 1.15  # in-process fallback needs extra headroom


def _f(value: Any) -> float | None:
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _risks(est_ram_gb: float | None, free_ram_gb: float | None,
           decision: dict[str, Any], report: dict[str, Any]) -> list[dict[str, Any]]:
    risks: list[dict[str, Any]] = []
    if decision.get("selected") is None:
        risks.append({
            "id": "runtime",
            "level": "high",
            "message": f"no runtime can run this model yet: "
                       f"{decision.get('error') or 'unknown reason'}",
        })
    if est_ram_gb is not None and free_ram_gb is not None:
        if est_ram_gb > free_ram_gb:
            risks.append({
                "id": "memory",
                "level": "high",
                "message": (f"weights alone need about {est_ram_gb:.1f} GB "
                            f"but only {free_ram_gb:.1f} GB RAM is free; a "
                            "smaller quantization is required"),
            })
        elif est_ram_gb + _OVERHEAD_GB > free_ram_gb:
            risks.append({
                "id": "memory",
                "level": "medium",
                "message": (f"{est_ram_gb:.1f} GB weights plus runtime "
                            f"overhead may not fit in {free_ram_gb:.1f} GB "
                            "free RAM; expect swapping or a load failure"),
            })
        elif est_ram_gb > 0.7 * free_ram_gb:
            risks.append({
                "id": "memory",
                "level": "low",
                "message": (f"the model wants {est_ram_gb:.1f} GB of "
                            f"{free_ram_gb:.1f} GB free RAM; other heavy "
                            "applications may interfere"),
            })
    if report.get("data_complete") is False:
        risks.append({
            "id": "integrity",
            "level": "high",
            "message": "the checkpoint is incomplete (missing shards); "
                       "finish or re-fetch it before loading",
        })
    for warning in (report.get("warnings") or [])[:4]:
        risks.append({"id": "metadata", "level": "low", "message": warning})
    return risks


def _plan_for(candidate: dict[str, Any], report: dict[str, Any],
              hardware: dict[str, Any], est_ram_gb: float | None,
              context: int) -> dict[str, Any]:
    """One ranked execution plan for one runtime candidate."""
    ram = hardware.get("ram") or {}
    free_ram_gb = _f(ram.get("available_gb"))
    gpus = hardware.get("gpus") or []
    vram_gb = max((g for g in (_f(g.get("vram_gb")) for g in gpus)
                   if g is not None), default=None)
    candidate_id = candidate["id"]
    overhead = _OVERHEAD_GB
    if candidate_id == "transformers":
        overhead *= _TRANSFORMERS_OVERHEAD
    need_gb = (est_ram_gb + overhead) if est_ram_gb is not None else None

    fits: str = "unknown"
    if need_gb is not None and free_ram_gb is not None:
        fits = "yes" if need_gb <= free_ram_gb else "no"

    if candidate_id == "llama.cpp":
        residency = "llama.cpp managed (GPU if its build has one, else CPU)"
        quantization = report.get("quantization") or "GGUF (as stored)"
    elif candidate_id == "syntara-engine-suite":
        residency = ("hybrid/managed by the engine (CUDA/Vulkan when the "
                     "engine was built for it, CPU otherwise)")
        quantization = report.get("quantization") or (
            "engine format; run `syntara convert` if this is a raw "
            "checkpoint")
    elif candidate_id == "transformers":
        if fits == "yes" and vram_gb is not None and need_gb is not None \
                and need_gb <= vram_gb:
            residency = "GPU (fits in detected VRAM)"
        else:
            residency = "CPU (GPU either absent or too small)"
        quantization = report.get("quantization") or "as stored (fp32/bf16)"
    elif candidate_id == "diffusers":
        residency = "GPU if present, else CPU (slow)"
        quantization = report.get("quantization") or "pipeline default"
    else:
        residency = "unknown"
        quantization = report.get("quantization") or "unknown"

    reasons = []
    if candidate.get("primary"):
        reasons.append("primary runtime for this artifact kind")
    if candidate.get("detail"):
        reasons.append(str(candidate["detail"]))
    if fits == "no":
        reasons.append("does not fit free RAM as estimated")
    elif fits == "yes":
        reasons.append("fits free RAM as estimated")
    else:
        reasons.append("fit unknown: RAM could not be measured")

    return {
        "runtime": candidate_id,
        "label": candidate.get("label"),
        "available": bool(candidate.get("available")),
        "unavailable_reason": candidate.get("reason") or None,
        "residency": residency,
        "quantization": quantization,
        "context": context,
        "est_ram_gb": round(need_gb, 2) if need_gb is not None else None,
        "fits_free_ram": fits,
        "reasons": reasons,
    }


def plan(report: dict[str, Any],
         hardware: dict[str, Any],
         *, context: int | None = None) -> dict[str, Any]:
    """Rank execution plans for an inspect report on this hardware.

    Returns model facts, ranked ``plans``, memory ``risks``, explicit
    ``assumptions`` and the ``recommended`` plan (first that fits, else
    first available). Deterministic for identical inputs.
    """
    config = report.get("config") or {}
    estimates = report.get("estimates") or {}
    est_ram_gb = _f(estimates.get("ram_gb_min"))
    model_ctx = _f(config.get("context_length")) or _f(
        config.get("max_position_embeddings"))
    chosen_ctx = int(context or min(4096, int(model_ctx) if model_ctx else 4096))

    decision = rank(report)
    ram = hardware.get("ram") or {}
    free_ram_gb = _f(ram.get("available_gb"))

    plans = [_plan_for(candidate, report, hardware, est_ram_gb, chosen_ctx)
             for candidate in decision.get("candidates", [])]

    # Rank: available first, then fits (yes > unknown > no), input order.
    fits_rank = {"yes": 0, "unknown": 1, "no": 2}
    ordered = sorted(range(len(plans)),
                     key=lambda i: (not plans[i]["available"],
                                    fits_rank.get(plans[i]["fits_free_ram"], 1),
                                    i))
    plans = [plans[i] for i in ordered]
    for rank_no, entry in enumerate(plans, start=1):
        entry["rank"] = rank_no

    recommended = next((p for p in plans if p["available"]
                        and p["fits_free_ram"] != "no"), None)
    if recommended is None:
        recommended = next((p for p in plans if p["available"]), None)

    risks = _risks(est_ram_gb, free_ram_gb, decision, report)
    assumptions = [
        "RAM floor = weights x 1.25 (gguf_inspect convention); KV cache "
        "and backend overhead are extra unless noted",
        "GPU fit uses detected VRAM only; integrated GPUs share system RAM",
        "plans are advisory: the runtime itself still validates the model "
        "at load time",
    ]
    storage = hardware.get("storage") or {}
    free_disk = _f(storage.get("free_gb"))
    if (est_ram_gb is not None and free_disk is not None
            and report.get("kind") != "gguf-file"):
        weight_gb = _f(estimates.get("weight_mb"))
        if weight_gb is not None:
            weight_gb /= 1024.0
            if weight_gb is not None and weight_gb > free_disk:
                risks.append({
                    "id": "disk",
                    "level": "high",
                    "message": (f"weights (~{weight_gb:.1f} GB) exceed free "
                                f"disk ({free_disk:.1f} GB) at "
                                f"{storage.get('path')}"),
                })

    suggestions: list[str] = []
    if any(r["id"] == "memory" and r["level"] == "high" for r in risks):
        suggestions.append(
            "use a smaller quantization (for example a 4-bit GGUF of this "
            "model) or free RAM before loading")
    if recommended and recommended["runtime"] == "syntara-engine-suite" \
            and report.get("kind") == "hf-checkpoint":
        suggestions.append(
            "this is a raw checkpoint: if the engine rejects its weights at "
            "load time, prepare it with `syntara convert --repo <dir> "
            "--outdir <fresh-dir>` (or `syntara prepare` for the guided "
            "pipeline)")
    if decision.get("selected") is None and decision.get("error"):
        suggestions.append(str(decision["error"]))

    return {
        "model": {
            "path": report.get("path"),
            "kind": report.get("kind"),
            "architecture": report.get("architecture"),
            "model_type": report.get("model_type"),
            "modalities": report.get("modalities"),
            "estimates": estimates,
            "context": chosen_ctx,
        },
        "hardware": {
            "cpu": (hardware.get("cpu") or {}).get("arch"),
            "cores": (hardware.get("cpu") or {}).get("cores_logical"),
            "ram_free_gb": free_ram_gb,
            "ram_total_gb": (ram.get("total_gb")),
            "gpus": hardware.get("gpus") or [],
            "unknowns": hardware.get("unknowns") or [],
        },
        "plans": plans,
        "recommended": recommended,
        "risks": risks,
        "suggestions": suggestions,
        "assumptions": assumptions,
        "decision": {"selected": decision.get("selected"),
                     "error": decision.get("error")},
    }
