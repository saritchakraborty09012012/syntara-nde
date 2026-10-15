"""Quantization-aware calibration for LittleBit-style factors (paper §4).

Two modes:

* **weight-space** (default, data-free): fine-tune the continuous latent
  factors against the original dense weight with the SmoothSign proxy
  gradient, then re-binarize.  Cheap, safe, and useful as a refinement of
  Dual-SVID; no user data involved.

* **forward-space** (optional): match layer outputs on caller-supplied
  activation batches (the paper's actual QAT objective).  The caller owns
  the data pipeline; nothing here fetches or stores prompts.

After optimization the factors are re-extracted exactly as in
``littlebit_core.dual_svid_init`` (sign extraction + rank-1 scales), so the
result is a drop-in replacement that can be re-written into an artifact
part file.  No network access, no telemetry (AGENTS §23/§24).
"""

from __future__ import annotations

import time
from typing import Any, Callable, Iterable

from .littlebit_core import (SMOOTHSIGN_K, _sign, effective_weight,
                             smooth_sign)

EventSink = Callable[[dict[str, Any]], None]


def _require_torch():
    try:
        import torch
        return torch
    except ImportError as exc:  # pragma: no cover
        raise RuntimeError(
            "QAT requires PyTorch; install torch (CPU is sufficient)") \
            from exc


def calibrate_weight(w: Any,  # noqa: ANN401 - torch.Tensor
                     *, rank: int, residual: bool = True,
                     steps: int = 200, lr: float = 1e-2,
                     k: float = SMOOTHSIGN_K,
                     generator: Any | None = None,  # noqa: ANN401
                     on_event: EventSink | None = None,
                     cancel: Callable[[], bool] | None = None
                     ) -> dict[str, Any]:
    """Weight-space QAT: refine latents so ||W_hat(QAT) - W|| shrinks.

    Returns the same dict layout as ``dual_svid_init`` plus timing stats.
    The original Dual-SVID init is used as the starting point; a failed or
    cancelled run falls back to the un-calibrated init (never worse).
    The learned signs AND scales are kept — scales are part of the
    optimized parameterization, not re-estimated afterwards.
    """
    torch = _require_torch()
    from .littlebit_core import dual_svid_init

    t0 = time.time()
    init = dual_svid_init(w, rank, residual=residual, generator=generator)
    if steps <= 0:
        return {**init, "qat": {"performed": False, "steps": 0}}

    wf = w.float()
    w_norm = float(torch.linalg.norm(wf)) or 1.0
    # continuous latents (pre-sign) and scales, leaf tensors for autograd
    u = init["u_lat"].clone().float().requires_grad_(True)
    v = init["v_lat"].clone().float().requires_grad_(True)
    h = init["h"].clone().float().requires_grad_(True)
    g = init["g"].clone().float().requires_grad_(True)
    ell = init["ell"].clone().float().requires_grad_(True)
    ru = rv = rh = rg = rell = None
    if residual:
        ru = init["res_u_lat"].clone().float().requires_grad_(True)
        rv = init["res_v_lat"].clone().float().requires_grad_(True)
        rh = init["res_h"].clone().float().requires_grad_(True)
        rg = init["res_g"].clone().float().requires_grad_(True)
        rell = init["res_ell"].clone().float().requires_grad_(True)

    params = [u, v, h, g, ell] + ([ru, rv, rh, rg, rell] if residual
                                  else [])
    opt = torch.optim.Adam(params, lr=lr)
    best = {i: p.detach().clone() for i, p in enumerate(params)}
    best_loss = float("inf")
    loss_val = float("inf")
    for step in range(int(steps)):
        if cancel is not None and cancel():
            break
        opt.zero_grad(set_to_none=True)
        us, vs = smooth_sign(u, k), smooth_sign(v, k)
        w_hat = (us * h.unsqueeze(1)) @ ((vs * g.unsqueeze(1)) * ell).t()
        if residual:
            rus, rvs = smooth_sign(ru, k), smooth_sign(rv, k)
            w_hat = w_hat + (rus * rh.unsqueeze(1)) @ (
                (rvs * rg.unsqueeze(1)) * rell).t()
        loss = torch.mean((w_hat - wf) ** 2)
        loss.backward()
        opt.step()
        loss_val = float(loss.detach())
        if loss_val < best_loss:
            best_loss = loss_val
            for i, p in enumerate(params):
                best[i] = p.detach().clone()
        if on_event is not None and (step % max(1, steps // 10) == 0
                                     or step == steps - 1):
            on_event({"type": "qat_step", "step": step + 1,
                      "total": steps, "loss": round(loss_val, 8)})

    with torch.no_grad():
        for i, p in enumerate(params):
            p.copy_(best[i])
        # extract signs from optimized latents; KEEP the optimized scales
        u_sign = _sign(u.detach()).to(torch.int8)
        v_sign = _sign(v.detach()).to(torch.int8)
        h_new, g_new, ell_new = h.detach(), g.detach(), ell.detach()
        out: dict[str, Any] = {
            "d_out": init["d_out"], "d_in": init["d_in"],
            "rank": init["rank"], "u_sign": u_sign, "v_sign": v_sign,
            "h": h_new, "g": g_new, "ell": ell_new,
            "u_lat": u.detach(), "v_lat": v.detach(),
        }
        total = effective_weight(u_sign, v_sign, h_new, g_new, ell_new)
        out["init_rel_error"] = float(
            torch.linalg.norm(wf - total) / w_norm)
        if residual:
            ru_sign = _sign(ru.detach()).to(torch.int8)
            rv_sign = _sign(rv.detach()).to(torch.int8)
            out.update({"res_u_sign": ru_sign, "res_v_sign": rv_sign,
                        "res_h": rh.detach(), "res_g": rg.detach(),
                        "res_ell": rell.detach(),
                        "res_u_lat": ru.detach(),
                        "res_v_lat": rv.detach()})
            total2 = total + effective_weight(ru_sign, rv_sign,
                                              rh.detach(), rg.detach(),
                                              rell.detach())
            out["init_rel_error_residual"] = float(
                torch.linalg.norm(wf - total2) / w_norm)
    out["qat"] = {
        "performed": True, "steps": int(steps), "lr": lr, "k": k,
        "mode": "weight-space", "final_loss": round(loss_val, 8),
        "seconds": round(time.time() - t0, 2),
        "cancelled": bool(cancel is not None and cancel()),
    }
    return out


def calibrate_forward(
        w: Any,  # noqa: ANN401 - original dense weight (d_out, d_in)
        batches: Iterable[tuple[Any, Any]],  # (x, y) activation pairs
        *, rank: int, residual: bool = True, steps: int = 200,
        lr: float = 1e-2, k: float = SMOOTHSIGN_K,
        on_event: EventSink | None = None,
        cancel: Callable[[], bool] | None = None) -> dict[str, Any]:
    """Forward-space QAT: match layer outputs on given activation pairs.

    ``batches`` yields (x, y) where x is (batch, d_in) inputs and y the
    original dense layer output (batch, d_out).  The caller collects these
    (e.g. with forward hooks on a calibration sample); nothing is persisted
    by this function.  Returns a ``dual_svid_init``-compatible dict with
    learned signs and scales.
    """
    torch = _require_torch()
    from .littlebit_core import dual_svid_init

    t0 = time.time()
    init = dual_svid_init(w, rank, residual=residual)
    batch_list = [(x.float(), y.float()) for x, y in batches]
    if not batch_list:
        raise ValueError("calibrate_forward needs at least one (x, y) "
                         "activation batch")
    if steps <= 0:
        return {**init, "qat": {"performed": False, "steps": 0}}

    u = init["u_lat"].clone().float().requires_grad_(True)
    v = init["v_lat"].clone().float().requires_grad_(True)
    h = init["h"].clone().float().requires_grad_(True)
    g = init["g"].clone().float().requires_grad_(True)
    ell = init["ell"].clone().float().requires_grad_(True)
    ru = rv = rh = rg = rell = None
    if residual:
        ru = init["res_u_lat"].clone().float().requires_grad_(True)
        rv = init["res_v_lat"].clone().float().requires_grad_(True)
        rh = init["res_h"].clone().float().requires_grad_(True)
        rg = init["res_g"].clone().float().requires_grad_(True)
        rell = init["res_ell"].clone().float().requires_grad_(True)
    params = [u, v, h, g, ell] + ([ru, rv, rh, rg, rell] if residual
                                  else [])
    opt = torch.optim.Adam(params, lr=lr)
    best = {i: p.detach().clone() for i, p in enumerate(params)}
    best_loss = float("inf")
    loss_val = float("inf")
    n = len(batch_list)
    for step in range(int(steps)):
        if cancel is not None and cancel():
            break
        x, y = batch_list[step % n]
        opt.zero_grad(set_to_none=True)
        us, vs = smooth_sign(u, k), smooth_sign(v, k)
        out = (((x * g) @ vs) * ell) @ us.t() * h
        if residual:
            rus, rvs = smooth_sign(ru, k), smooth_sign(rv, k)
            out = out + (((x * rg) @ rvs) * rell) @ rus.t() * rh
        loss = torch.mean((out - y) ** 2)
        loss.backward()
        opt.step()
        loss_val = float(loss.detach())
        if loss_val < best_loss:
            best_loss = loss_val
            for i, p in enumerate(params):
                best[i] = p.detach().clone()
        if on_event is not None and (step % max(1, steps // 10) == 0
                                     or step == steps - 1):
            on_event({"type": "qat_step", "step": step + 1,
                      "total": steps, "loss": round(loss_val, 8)})
    with torch.no_grad():
        for i, p in enumerate(params):
            p.copy_(best[i])
        u_sign = _sign(u.detach()).to(torch.int8)
        v_sign = _sign(v.detach()).to(torch.int8)
        h_new, g_new, ell_new = h.detach(), g.detach(), ell.detach()
        wf = w.float()
        w_norm = float(torch.linalg.norm(wf)) or 1.0
        total = effective_weight(u_sign, v_sign, h_new, g_new, ell_new)
        out = {
            "d_out": init["d_out"], "d_in": init["d_in"],
            "rank": init["rank"], "u_sign": u_sign, "v_sign": v_sign,
            "h": h_new, "g": g_new, "ell": ell_new,
            "u_lat": u.detach(), "v_lat": v.detach(),
            "init_rel_error": float(torch.linalg.norm(wf - total)
                                    / w_norm),
        }
        if residual:
            ru_sign = _sign(ru.detach()).to(torch.int8)
            rv_sign = _sign(rv.detach()).to(torch.int8)
            out.update({"res_u_sign": ru_sign, "res_v_sign": rv_sign,
                        "res_h": rh.detach(), "res_g": rg.detach(),
                        "res_ell": rell.detach(),
                        "res_u_lat": ru.detach(),
                        "res_v_lat": rv.detach()})
            total2 = total + effective_weight(ru_sign, rv_sign,
                                              rh.detach(), rg.detach(),
                                              rell.detach())
            out["init_rel_error_residual"] = float(
                torch.linalg.norm(wf - total2) / w_norm)
    out["qat"] = {
        "performed": True, "steps": int(steps), "lr": lr, "k": k,
        "mode": "forward-space", "final_loss": round(loss_val, 8),
        "seconds": round(time.time() - t0, 2),
        "cancelled": bool(cancel is not None and cancel()),
    }
    return out
