"""Syntara local AI SDK.

Connects to the Syntara runtime on the same machine; model weights remain local.
Also manages local, offline user data (projects and ``.syntara-backup``
archives) with no account and no cloud dependency.
"""
from ._version import __version__
from .client import Syntara, SyntaraError
from .store import LocalStore, default_data_dir

__all__ = ["Syntara", "SyntaraError", "LocalStore", "default_data_dir", "__version__"]
