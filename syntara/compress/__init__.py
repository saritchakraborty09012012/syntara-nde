"""LittleBit-style ultra-low-bit compression for Syntara.

This package implements an *original*, independently written compression
pipeline inspired by the method published in:

    Lee, Kim, You, Kim. "LittleBit: Ultra Low-Bit Quantization via Latent
    Factorization." NeurIPS 2025. arXiv:2506.13771.

The official reference implementation (github.com/SamsungLabs/LittleBit) is
licensed CC BY-NC 4.0 and is therefore NOT reused in this MIT-licensed
repository.  Only the mathematical method described in the paper is
implemented here (algorithms and formulas are not copyrightable expression);
see THIRD_PARTY_NOTICES.md for the full license analysis.

Public surface:

    littlebit_core   — math: ranks, Dual-SVID init, factorized forward,
                       binary packing, SmoothSign QAT primitive
    artifact         — on-disk artifact layout, integrity, atomic publish
    pipeline         — source model -> compressed artifact orchestration
    qat              — optional quantization-aware calibration (resumable)
    evaluate         — perplexity / output-quality measurement

Nothing in this package uploads model weights or prompts anywhere.
"""

from .littlebit_core import (  # noqa: F401
    SmoothSign,
    bpw_for_rank,
    dual_svid_init,
    effective_weight,
    factorize_matrix,
    forward_factorized,
    pack_binary,
    rank_for_bpw,
    unpack_binary,
)

__all__ = [
    "SmoothSign",
    "bpw_for_rank",
    "dual_svid_init",
    "effective_weight",
    "factorize_matrix",
    "forward_factorized",
    "pack_binary",
    "rank_for_bpw",
    "unpack_binary",
]
