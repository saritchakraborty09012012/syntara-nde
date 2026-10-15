"""Core mathematics for LittleBit-style latent-factorization compression.

Independent implementation of the method in arXiv:2506.13771 (NeurIPS 2025).
No code from the CC BY-NC 4.0 reference implementation is used.

Method summary (paper equations cited by number):

A dense weight W in R^{d_out x d_in} is approximated by a rank-r product
    W ~= U V^T                       (Eq. 1; U: d_out x r, V: d_in x r)
whose factors are binarized
    U_s = sign(U), V_s = sign(V)     (Eq. 2)
and compensated by three FP16 scale vectors
    h in R^{d_out}, g in R^{d_in}, l in R^r   (Eq. 3)
giving the effective weight
    W_hat = diag(h) U_s diag(l) V_s^T diag(g)  (Eq. 4)

The forward pass never materializes W_hat; for X in R^{seq x d_in}:

    Y = ((((X * g) @ V_s) * l) @ U_s^T) * h   (Eq. 5, Proposition 1)

optionally summed with an identically structured residual path that is
initialized from W - W_hat_0 (Eq. 9-10, Residual Compensation).

Per-path storage cost is r*(d_out+d_in) binary bits + 16*(d_out+d_in+r)
scale bits; with the residual path enabled the total is twice that
(Appendix D, Eq. 16-17).

Dual-SVID initialization (Section 3.2): truncated SVD with a symmetric
singular-value split, sign factors from the truncated factors, and scale
vectors from separate rank-1 approximations of |U| and |V| (Eq. 6-8).

Requires: torch (CPU is sufficient for factorization and inference).
"""

from __future__ import annotations

from typing import Any

import torch

# Paper's SmoothSign proxy gradient uses tanh(k*x) with k = 100 (Sec. 4.1).
SMOOTHSIGN_K = 100.0

# Ranks are rounded down to a multiple of this (matches the reference
# configuration `--min_split_dim 8`); below it the layer is not compressed.
RANK_MULTIPLE = 8
MIN_RANK = 8


def _sign(x: torch.Tensor) -> torch.Tensor:
    """Binarizing sign with a defined value at zero (0 -> +1)."""
    return torch.where(x >= 0, torch.ones_like(x), -torch.ones_like(x))


def bpw_for_rank(d_out: int, d_in: int, rank: int, *,
                 residual: bool) -> float:
    """Effective bits per weight for a layer at a given rank (Appendix D).

    b = f * (r*(d_out+d_in) + 16*(d_out+d_in+r)) / (d_out*d_in)
    with f = 2 when residual compensation is enabled, else f = 1.
    """
    if d_out <= 0 or d_in <= 0:
        raise ValueError(f"bad layer dims: {d_out}x{d_in}")
    if rank < 0:
        raise ValueError(f"bad rank: {rank}")
    per_path = rank * (d_out + d_in) + 16 * (d_out + d_in + rank)
    factor = 2 if residual else 1
    return factor * per_path / float(d_out * d_in)


def rank_for_bpw(d_out: int, d_in: int, bpw: float, *,
                 residual: bool = True,
                 min_rank: int = MIN_RANK,
                 multiple: int = RANK_MULTIPLE) -> int | None:
    """Latent rank that yields (approximately) the target bits per weight.

    Solves Eq. 17 (generalized to the non-residual case) for r, then rounds
    down to a multiple of ``multiple`` and clamps to ``min_rank``.  Returns
    None when the target is unattainable even at ``min_rank`` (the FP16
    scale overhead alone exceeds the budget for very small matrices).
    """
    if bpw <= 0:
        raise ValueError(f"bpw must be positive, got {bpw}")
    if d_out <= 0 or d_in <= 0:
        raise ValueError(f"bad layer dims: {d_out}x{d_in}")
    factor = 2 if residual else 1
    numer = bpw * d_out * d_in - factor * 16 * (d_out + d_in)
    denom = factor * (d_out + d_in + 16)
    raw = numer / denom
    r = int(raw) // multiple * multiple
    cap = min(d_out, d_in) // multiple * multiple
    if cap < min_rank:
        return None
    if r < min_rank:
        # Target too aggressive for this matrix; check min_rank is feasible.
        if bpw_for_rank(d_out, d_in, min_rank, residual=residual) > bpw * 1.25:
            return None
        return min(min_rank, cap)
    return min(r, cap)


def truncated_svd(w: torch.Tensor, rank: int, *,
                  fast: bool = False,
                  generator: torch.Generator | None = None
                  ) -> tuple[torch.Tensor, torch.Tensor]:
    """Best rank-``rank`` factorization W ~= U V^T with a symmetric split.

    U = U_svd[:, :r] * sqrt(S), V = V_svd[:, :r] * sqrt(S) so that
    U V^T = U_svd diag(S) V_svd^T (the exact truncated SVD reconstruction).
    ``fast=True`` uses the randomized svd_lowrank estimator (much cheaper
    for very large matrices; slightly lower fidelity).
    """
    if rank < 1:
        raise ValueError(f"rank must be >= 1, got {rank}")
    rank = min(rank, min(w.shape))
    wf = w.float()
    root: torch.Tensor | None = None
    if fast:
        q = min(rank + 8, min(wf.shape))
        u, s, v = torch.svd_lowrank(wf, q=q, niter=2, generator=generator)
        u, s, v = u[:, :rank], s[:rank], v[:, :rank]
        root = torch.sqrt(torch.clamp(s, min=0.0))
    else:
        # torch.linalg.svd returns Vh (V-hermitian): W = U diag(S) Vh.
        # V = Vh.T, so the latent V factor is Vh[:rank, :] transposed.
        u, s, vh = torch.linalg.svd(wf, full_matrices=False)
        u, s = u[:, :rank], s[:rank]
        v = vh[:rank, :].t()  # (d_in, rank) — true V, not Vh
        root = torch.sqrt(torch.clamp(s, min=0.0))
    return u * root.unsqueeze(0), v * root.unsqueeze(0)


def _rank_one(m: torch.Tensor) -> tuple[torch.Tensor, torch.Tensor]:
    """Best rank-1 factorization M ~= a b^T for M >= 0 (used on |U|, |V|).

    Returns (a, b) with a.shape = (M.shape[0],), b.shape = (M.shape[1],),
    split symmetrically through sqrt(sigma_1) like truncated_svd.
    """
    u, s, vh = torch.linalg.svd(m.float(), full_matrices=False)
    root = torch.sqrt(torch.clamp(s[:1], min=0.0))
    # vh[0, :] is row 0 of Vh = column 0 of V (the rank-1 right vector)
    return (u[:, 0] * root[0], vh[0, :] * root[0])


def dual_svid_init(w: torch.Tensor, rank: int, *,
                   residual: bool = True,
                   fast_svd: bool = False,
                   generator: torch.Generator | None = None
                   ) -> dict[str, Any]:
    """Dual-SVID initialization (paper Section 3.2) for one weight matrix.

    Returns a dict with, for the primary path and (when residual=True) the
    residual path:
        u_sign/v_sign: sign factors as int8 {-1,+1}, shapes (d_out,r)/(d_in,r)
        h/g/ell:       FP32 scale vectors, shapes (d_out,)/(d_in,)/(r,)
    plus the full-precision latent factors (u_lat/v_lat) that a QAT pass
    would fine-tune, and the reconstruction error statistics.
    """
    if w.dim() != 2:
        raise ValueError(f"expected a 2D weight, got shape {tuple(w.shape)}")
    d_out, d_in = int(w.shape[0]), int(w.shape[1])
    rank = min(rank, d_out, d_in)

    u_lat, v_lat = truncated_svd(w, rank, fast=fast_svd, generator=generator)
    u_sign = _sign(u_lat).to(torch.int8)
    v_sign = _sign(v_lat).to(torch.int8)
    h, ell_u = _rank_one(u_lat.abs())
    g, ell_v = _rank_one(v_lat.abs())
    ell = ell_u * ell_v

    out: dict[str, Any] = {
        "d_out": d_out, "d_in": d_in, "rank": rank,
        "u_sign": u_sign, "v_sign": v_sign,
        "h": h, "g": g, "ell": ell,
        "u_lat": u_lat, "v_lat": v_lat,
    }

    with torch.no_grad():
        w0 = effective_weight(u_sign, v_sign, h, g, ell)
        err0 = torch.linalg.norm(w.float() - w0)
        out["init_rel_error"] = float(err0 / torch.linalg.norm(w.float()))
        if residual:
            res = w.float() - w0
            ru, rv = truncated_svd(res, rank, fast=fast_svd,
                                   generator=generator)
            ru_sign = _sign(ru).to(torch.int8)
            rv_sign = _sign(rv).to(torch.int8)
            rh, r_ell_u = _rank_one(ru.abs())
            rg, r_ell_v = _rank_one(rv.abs())
            out.update({
                "res_u_sign": ru_sign, "res_v_sign": rv_sign,
                "res_h": rh, "res_g": rg, "res_ell": r_ell_u * r_ell_v,
                "res_u_lat": ru, "res_v_lat": rv,
            })
            total = w0 + effective_weight(ru_sign, rv_sign, rh, rg,
                                          r_ell_u * r_ell_v)
            err1 = torch.linalg.norm(w.float() - total)
            out["init_rel_error_residual"] = float(
                err1 / torch.linalg.norm(w.float()))
    return out


def effective_weight(u_sign: torch.Tensor, v_sign: torch.Tensor,
                     h: torch.Tensor, g: torch.Tensor,
                     ell: torch.Tensor) -> torch.Tensor:
    """Materialize W_hat = diag(h) U_s diag(ell) V_s^T diag(g) (Eq. 4).

    Only for verification/tests — inference must use forward_factorized.
    """
    us = u_sign.float() * h.unsqueeze(1)
    vs = v_sign.float() * g.unsqueeze(1)
    return (us * ell.unsqueeze(0)) @ vs.t()


def forward_factorized(x: torch.Tensor, u_sign: torch.Tensor,
                       v_sign: torch.Tensor, h: torch.Tensor,
                       g: torch.Tensor, ell: torch.Tensor) -> torch.Tensor:
    """Factorized forward Y = (((X*g) @ V_s) * ell) @ U_s^T * h (Eq. 5).

    ``u_sign`` is (d_out, r) as {-1,+1} floats, ``v_sign`` is (d_in, r).
    Operates on the factorized representation; W_hat is never formed.
    """
    y = (x * g) @ v_sign
    y = y * ell
    y = y @ u_sign.t()
    return y * h


class SmoothSign(torch.autograd.Function):
    """Binarization with the SmoothSign proxy gradient (paper Sec. 4.1).

    Forward: sign(x) (0 -> +1).  Backward: the proxy gradient tanh(k*x)
    itself (k = 100) — NOT the derivative of tanh.  For |x| beyond a few
    times 1/k this saturates to +-1 (a smoothed straight-through
    estimator); inside the narrow band around 0 it ramps linearly with
    slope k.  This is the quantization-aware-training primitive; it is not
    used at inference time (inference consumes already-binarized stored
    signs).
    """

    @staticmethod
    def forward(ctx: Any, x: torch.Tensor,  # noqa: ANN001
                k: float = SMOOTHSIGN_K) -> torch.Tensor:
        ctx.save_for_backward(x)
        ctx.k = k
        return _sign(x)

    @staticmethod
    def backward(ctx: Any, grad_out: torch.Tensor):  # noqa: ANN001
        (x,) = ctx.saved_tensors
        k = ctx.k
        grad_in = grad_out * torch.tanh(k * x)
        return grad_in, None


def smooth_sign(x: torch.Tensor,
                k: float = SMOOTHSIGN_K) -> torch.Tensor:
    """Functional wrapper around :class:`SmoothSign`."""
    return SmoothSign.apply(x, k)


def pack_binary(sign: torch.Tensor) -> torch.Tensor:
    """Pack a {-1,+1} tensor into uint8 bit-packings (row-major, MSB-first).

    -1 maps to bit 1, +1 to bit 0.  The last byte is zero-padded; the
    original shape is recorded separately (in the artifact manifest).
    Implemented with shifts because torch has no packbits equivalent.
    """
    if sign.numel() == 0:
        raise ValueError("cannot pack an empty tensor")
    bits = (sign.reshape(-1) < 0).to(torch.int64)  # -1 -> 1
    n = bits.numel()
    pad = (8 - n % 8) % 8
    if pad:
        bits = torch.cat([bits, bits.new_zeros(pad)])
    shifts = torch.arange(7, -1, -1, dtype=torch.int64, device=bits.device)
    packed = (bits.reshape(-1, 8) << shifts).sum(dim=1)
    return packed.to(torch.uint8)


def unpack_binary(packed: torch.Tensor,
                  shape: tuple[int, ...]) -> torch.Tensor:
    """Inverse of :func:`pack_binary`; returns {-1,+1} float32."""
    n = 1
    for s in shape:
        n *= s
    byte = packed.reshape(-1).to(torch.int64)
    shifts = torch.arange(7, -1, -1, dtype=torch.int64,
                          device=byte.device)
    bits = ((byte.unsqueeze(1) >> shifts) & 1).reshape(-1)[:n]
    out = torch.where(bits.bool(), -1.0, 1.0)
    return out.reshape(shape)


def factorize_matrix(w: torch.Tensor, *, bpw: float | None = None,
                     rank: int | None = None, residual: bool = True,
                     kv_factor: float = 1.0, fast_svd: bool = False,
                     generator: torch.Generator | None = None
                     ) -> dict[str, Any] | None:
    """Factorize one weight matrix at a target BPW or explicit rank.

    Returns the :func:`dual_svid_init` dict enriched with the achieved
    ``rank``/``bpw``/``bpw_no_residual`` accounting, or ``None`` when the
    layer cannot be compressed at this budget (rank would fall below the
    minimum).  ``kv_factor`` multiplies the rank of attention K/V
    projections (GQA protection, paper Appendix B.3).
    """
    if (bpw is None) == (rank is None):
        raise ValueError("provide exactly one of bpw= or rank=")
    d_out, d_in = int(w.shape[0]), int(w.shape[1])
    if rank is None:
        r = rank_for_bpw(d_out, d_in, float(bpw), residual=residual)
        if r is None:
            return None
        if kv_factor != 1.0 and kv_factor > 0:
            r = int(r * kv_factor) // RANK_MULTIPLE * RANK_MULTIPLE
            r = max(r, MIN_RANK)
            r = min(r, min(d_out, d_in) // RANK_MULTIPLE * RANK_MULTIPLE)
            if r < MIN_RANK:
                return None
    else:
        r = int(rank)
        if r < 1:
            raise ValueError(f"rank must be >= 1, got {r}")
    result = dual_svid_init(w, r, residual=residual, fast_svd=fast_svd,
                            generator=generator)
    result["bpw"] = bpw_for_rank(d_out, d_in, result["rank"],
                                 residual=residual)
    result["bpw_target"] = bpw
    return result
