"""FastAST: High-performance syntax-guaranteed context pruner for AI coding agents."""

from typing import Optional

try:
    from fastast._core import PruneResult, prune_file
except ImportError:
    # Fallback or stub when native extension is being built
    PruneResult = None  # type: ignore
    prune_file = None  # type: ignore

try:
    from fastast.server import prune_context
except ImportError:
    prune_context = None  # type: ignore

__all__ = ["PruneResult", "prune_file", "prune_context"]
