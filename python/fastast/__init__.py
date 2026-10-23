from __future__ import annotations

"""FastAST: High-performance codebase-memory engine (AST -> Graph -> Retrieval) for coding agents."""

import logging

from fastast.community import (
    detect_and_store_communities,
)
from fastast.config import (
    FastASTConfig,
    load_config,
)
from fastast.db import (
    get_call_graph,
    get_graph_neighborhood,
    get_similar_symbols,
    get_symbol_community,
    list_communities,
    search_symbols,
    search_symbols_bm25,
    search_symbols_semantic,
)
from fastast.diagnostics import (
    diagnose_repository,
)
from fastast.discovery import (
    FileCategory,
    discover_files,
)
from fastast.embeddings import (
    BaseEmbeddingProvider,
    SemanticProjectionProvider,
    get_embedding_provider,
)
from fastast.evidence import (
    EvidenceMaterializer,
    build_evidence_bundle,
    get_file_outline,
    get_snippet,
    get_symbol_evidence,
)
from fastast.extractor import (
    extract_file_facts,
    parse_file_record,
    parse_file_records,
)
from fastast.graph import CodeGraph, Node
from fastast.indexer import (
    RepositoryIndexer,
    index_repository,
)
from fastast.model import (
    Candidate,
    EdgeRecord,
    EdgeRelation,
    EvidenceWindow,
    ExtractedFileFacts,
    FileRecord,
    FileStatus,
    SymbolRecord,
)
from fastast.retrieval import (
    EvidenceBundle,
    RetrievalEngine,
    get_callees,
    get_callers,
    get_related_files,
    get_symbol_by_name,
    get_symbol_by_path,
    retrieve_bundle,
    search_files,
)
from fastast.similarity import (
    index_similarity,
)
from fastast.watcher import (
    RepositoryWatcher,
)

__version__ = "0.2.0"

_logger = logging.getLogger("fastast")

try:
    from fastast._core import (
        ExtractedCall,
        ExtractedImport,
        ExtractedSymbol,
        FileIndexResult,
        index_code,
    )
except ImportError as _core_err:
    _logger.debug(
        "Native FastAST _core extension not loaded; using Python fallback classes: %s",
        _core_err,
    )

    class ExtractedSymbol:  # type: ignore
        def __init__(
            self,
            name: str,
            kind: str,
            signature: str = "",
            start_line: int = 0,
            end_line: int = 0,
            parent_name: str | None = None,
            docstring: str | None = None,
        ):
            self.name = name
            self.kind = kind
            self.signature = signature
            self.start_line = start_line
            self.end_line = end_line
            self.parent_name = parent_name
            self.docstring = docstring

    class ExtractedImport:  # type: ignore
        def __init__(
            self,
            module: str,
            name: str | None = None,
            alias: str | None = None,
            line_number: int = 0,
        ):
            self.module = module
            self.name = name
            self.alias = alias
            self.line_number = line_number

    class ExtractedCall:  # type: ignore
        def __init__(
            self,
            callee_name: str,
            caller_name: str | None = None,
            line_number: int = 0,
        ):
            self.caller_name = caller_name
            self.callee_name = callee_name
            self.line_number = line_number

    class FileIndexResult:  # type: ignore
        def __init__(
            self,
            symbols: list[ExtractedSymbol] | None = None,
            imports: list[ExtractedImport] | None = None,
            calls: list[ExtractedCall] | None = None,
            total_lines: int = 0,
            total_tokens: int = 0,
            has_syntax_error: bool = False,
        ):
            self.symbols = symbols or []
            self.imports = imports or []
            self.calls = calls or []
            self.total_lines = total_lines
            self.total_tokens = total_tokens
            self.has_syntax_error = has_syntax_error

    index_code = None  # type: ignore

__all__ = [
    # Version
    "__version__",
    # Indexing & Discovery
    "index_repository",
    "RepositoryIndexer",
    "discover_files",
    "index_code",
    "extract_file_facts",
    "parse_file_record",
    "parse_file_records",
    # Search, Retrieval & Evidence
    "retrieve_bundle",
    "build_evidence_bundle",
    "get_symbol_evidence",
    "get_file_outline",
    "get_snippet",
    "search_symbols",
    "search_symbols_bm25",
    "search_symbols_semantic",
    "search_files",
    "get_symbol_by_name",
    "get_symbol_by_path",
    "RetrievalEngine",
    "EvidenceMaterializer",
    "EvidenceBundle",
    # Graph & Call Hierarchy
    "get_call_graph",
    "get_graph_neighborhood",
    "get_callers",
    "get_callees",
    "get_related_files",
    "CodeGraph",
    "Node",
    # Similarity, Communities & Embeddings
    "get_similar_symbols",
    "index_similarity",
    "get_symbol_community",
    "list_communities",
    "detect_and_store_communities",
    "BaseEmbeddingProvider",
    "SemanticProjectionProvider",
    "get_embedding_provider",
    # Core Domain Models
    "FileRecord",
    "SymbolRecord",
    "EdgeRecord",
    "EvidenceWindow",
    "Candidate",
    "ExtractedFileFacts",
    "FileStatus",
    "FileCategory",
    "EdgeRelation",
    "ExtractedSymbol",
    "ExtractedImport",
    "ExtractedCall",
    "FileIndexResult",
    # Operations, Config & Diagnostics
    "FastASTConfig",
    "load_config",
    "RepositoryWatcher",
    "diagnose_repository",
]
