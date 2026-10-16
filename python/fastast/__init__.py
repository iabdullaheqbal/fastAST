"""FastAST: High-performance syntax-guaranteed context pruner for AI coding agents."""

from typing import Optional

try:
    from fastast._core import (
        ExtractedCall,
        ExtractedImport,
        ExtractedSymbol,
        FileIndexResult,
        PruneResult,
        index_code,
        prune_file,
    )
except ImportError:
    PruneResult = None  # type: ignore
    prune_file = None  # type: ignore
    index_code = None  # type: ignore
    ExtractedSymbol = None  # type: ignore
    ExtractedImport = None  # type: ignore
    ExtractedCall = None  # type: ignore
    FileIndexResult = None  # type: ignore

try:
    from fastast.server import prune_context
except ImportError:
    prune_context = None  # type: ignore

try:
    from fastast.indexer import index_repository
    from fastast.db import get_call_graph, search_symbols
except ImportError:
    index_repository = None  # type: ignore
    search_symbols = None  # type: ignore
    get_call_graph = None  # type: ignore

__all__ = [
    "PruneResult",
    "prune_file",
    "index_code",
    "ExtractedSymbol",
    "ExtractedImport",
    "ExtractedCall",
    "FileIndexResult",
    "prune_context",
    "index_repository",
    "search_symbols",
    "get_call_graph",
]
