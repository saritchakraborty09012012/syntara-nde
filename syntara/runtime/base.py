"""Runtime adapter interface (AGENTS §12).

A runtime adapter owns runtime-specific details: command-line invocation,
ports, streaming protocol, GPU/backend selection and failure reporting. The
gateway only ever sees this interface.
"""
from __future__ import annotations

from typing import Any, Iterator, Protocol


class RuntimeError(Exception):
    """A runtime failed in a way the user can act on.

    The message must say what failed, what Syntara did, and what the user can
    try next (AGENTS §28). Raw stderr from the backend belongs in
    ``detail`` for logs/diagnostics.
    """

    def __init__(self, message: str, *, detail: str = "") -> None:
        super().__init__(message)
        self.detail = detail


class RuntimeNotAvailable(RuntimeError):
    """The runtime binary is missing or cannot be started on this machine."""


class Runtime(Protocol):
    """What the gateway requires from any backend that serves a model."""

    def load(self) -> None:
        """Load the model. Blocking until the backend is ready to generate.

        Raises RuntimeError/NotAvailable with an actionable message.
        """

    def unload(self) -> None:
        """Release the model and make sure no backend process is left behind."""

    @property
    def loaded(self) -> bool: ...

    def capabilities(self) -> dict[str, Any]:
        """Honest self-description: backend, binary, streaming, quantizations."""

    def chat(self, body: dict[str, Any]) -> dict[str, Any]:
        """Non-streaming chat. Returns the OpenAI-shaped completion object."""

    def stream(self, body: dict[str, Any]) -> Iterator[bytes]:
        """Yield raw SSE ``data:`` frames (bytes) for a streaming chat."""

    def health(self) -> dict[str, Any]:
        """Backend liveness beyond 'the process exists' (AGENTS §75)."""
