"""Runtime adapter layer (AGENTS §12): everything runtime-specific lives here.

The application layer (gateway, CLI, SDK) talks to the ``Runtime`` interface
only; command-line invocation, ports, process lifecycle and backend-specific
wire formats stay behind the adapter.
"""
from __future__ import annotations

from .base import GenerationCancelled, Runtime, RuntimeError, RuntimeNotAvailable

__all__ = ["GenerationCancelled", "Runtime", "RuntimeError",
           "RuntimeNotAvailable"]
