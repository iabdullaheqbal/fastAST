"""FastAST: AST-based repository indexer and codebase-memory engine for coding agents."""

from typing import List, Optional

from fastast.discovery import (
    DirectoryScanner,
    FileCategory,
    MultiLayerIgnore,
    classify_file,
    compute_content_hash,
    detect_file_language,
    discover_files,
)
from fastast.extractor import (
    extract_file_facts,
    parse_file_record,
    parse_file_records,
)
from fastast.graph import CodeGraph, Node
from fastast.retrieval import (
    EvidenceBundle,
    RetrievalEngine,
    estimate_tokens,
    get_callees,
    get_callers,
    get_related_files,
    get_snippet,
    get_symbol_by_name,
    get_symbol_by_path,
    retrieve_bundle,
    score_candidate,
    search_files,
)
from fastast.config import (
    FastASTConfig,
    PathTraversalError,
    load_config,
    validate_safe_path,
)
from fastast.db import (
    check_database_integrity,
    safe_repair_or_recreate_db,
)
from fastast.diagnostics import (
    clean_stale_locks,
    diagnose_repository,
)
from fastast.locking import (
    RepositoryLock,
    RepositoryLockedError,
)
from fastast.watcher import (
    RepositoryWatcher,
)
from fastast.model import (
    Candidate,
    EdgeRecord,
    EdgeRelation,
    EvidenceWindow,
    ExtractedFileFacts,
    FileCategory,
    FileRecord,
    FileStatus,
    SymbolRecord,
)

__version__ = "0.1.0"

try:
    from fastast._core import (
        ExtractedCall,
        ExtractedImport,
        ExtractedSymbol,
        FileIndexResult,
        index_code,
    )
except ImportError:
    class ExtractedSymbol:  # type: ignore
        def __init__(
            self,
            name: str,
            kind: str,
            signature: str = "",
            start_line: int = 0,
            end_line: int = 0,
            parent_name: Optional[str] = None,
            docstring: Optional[str] = None,
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
            name: Optional[str] = None,
            alias: Optional[str] = None,
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
            caller_name: Optional[str] = None,
            line_number: int = 0,
        ):
            self.caller_name = caller_name
            self.callee_name = callee_name
            self.line_number = line_number

    class FileIndexResult:  # type: ignore
        def __init__(
            self,
            symbols: Optional[List[ExtractedSymbol]] = None,
            imports: Optional[List[ExtractedImport]] = None,
            calls: Optional[List[ExtractedCall]] = None,
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

try:
    from fastast.indexer import RepositoryIndexer, index_repository
    from fastast.db import (
        backfill_symbol_embeddings,
        delete_file_record,
        delete_symbol_embedding,
        get_call_graph,
        get_graph_neighborhood,
        get_similar_symbols,
        get_symbol_community,
        get_symbol_embedding,
        list_communities,
        sanitize_fts5_query,
        search_symbols,
        search_symbols_bm25,
        search_symbols_semantic,
        store_symbol_embedding,
    )
    from fastast.similarity import (
        LSHIndex,
        MinHash,
        compute_jaccard_similarity,
        compute_similarity_pairs,
        extract_symbol_shingles,
        index_similarity,
    )
    from fastast.community import (
        LouvainDetector,
        derive_community_name,
        detect_and_store_communities,
    )
    from fastast.embeddings import (
        BaseEmbeddingProvider,
        SemanticProjectionProvider,
        cosine_similarity,
        decode_embedding,
        encode_embedding,
        get_embedding_provider,
        prepare_symbol_text,
    )
    from fastast.evidence import (
        EvidenceMaterializer,
        build_evidence_bundle,
        get_file_outline,
        get_snippet,
        get_symbol_evidence,
    )
except ImportError:
    RepositoryIndexer = None  # type: ignore
    index_repository = None  # type: ignore
    search_symbols = None  # type: ignore
    search_symbols_bm25 = None  # type: ignore
    search_symbols_semantic = None  # type: ignore
    sanitize_fts5_query = None  # type: ignore
    delete_file_record = None  # type: ignore
    get_call_graph = None  # type: ignore
    get_graph_neighborhood = None  # type: ignore
    get_similar_symbols = None  # type: ignore
    get_symbol_community = None  # type: ignore
    list_communities = None  # type: ignore
    EvidenceMaterializer = None  # type: ignore
    build_evidence_bundle = None  # type: ignore
    get_file_outline = None  # type: ignore
    get_symbol_evidence = None  # type: ignore
    BaseEmbeddingProvider = None  # type: ignore
    SemanticProjectionProvider = None  # type: ignore
    get_embedding_provider = None  # type: ignore
    encode_embedding = None  # type: ignore
    decode_embedding = None  # type: ignore
    cosine_similarity = None  # type: ignore
    store_symbol_embedding = None  # type: ignore
    get_symbol_embedding = None  # type: ignore
    delete_symbol_embedding = None  # type: ignore
    backfill_symbol_embeddings = None  # type: ignore
    prepare_symbol_text = None  # type: ignore
    LSHIndex = None  # type: ignore
    MinHash = None  # type: ignore
    compute_jaccard_similarity = None  # type: ignore
    compute_similarity_pairs = None  # type: ignore
    extract_symbol_shingles = None  # type: ignore
    index_similarity = None  # type: ignore
    LouvainDetector = None  # type: ignore
    derive_community_name = None  # type: ignore
    detect_and_store_communities = None  # type: ignore

__all__ = [
    "__version__",
    "index_code",
    "ExtractedSymbol",
    "ExtractedImport",
    "ExtractedCall",
    "FileIndexResult",
    "FileRecord",
    "SymbolRecord",
    "EdgeRecord",
    "EvidenceWindow",
    "Candidate",
    "FileStatus",
    "FileCategory",
    "EdgeRelation",
    "ExtractedFileFacts",
    "discover_files",
    "DirectoryScanner",
    "MultiLayerIgnore",
    "classify_file",
    "detect_file_language",
    "compute_content_hash",
    "extract_file_facts",
    "parse_file_record",
    "parse_file_records",
    "CodeGraph",
    "Node",
    "RetrievalEngine",
    "EvidenceBundle",
    "estimate_tokens",
    "get_symbol_by_name",
    "get_symbol_by_path",
    "get_callers",
    "get_callees",
    "get_related_files",
    "get_snippet",
    "search_files",
    "retrieve_bundle",
    "build_evidence_bundle",
    "get_symbol_evidence",
    "get_file_outline",
    "EvidenceMaterializer",
    "score_candidate",
    "RepositoryIndexer",
    "index_repository",
    "search_symbols",
    "search_symbols_bm25",
    "search_symbols_semantic",
    "sanitize_fts5_query",
    "delete_file_record",
    "get_call_graph",
    "get_graph_neighborhood",
    "BaseEmbeddingProvider",
    "SemanticProjectionProvider",
    "get_embedding_provider",
    "encode_embedding",
    "decode_embedding",
    "cosine_similarity",
    "store_symbol_embedding",
    "get_symbol_embedding",
    "delete_symbol_embedding",
    "backfill_symbol_embeddings",
    "prepare_symbol_text",
    "extract_symbol_shingles",
    "compute_jaccard_similarity",
    "MinHash",
    "LSHIndex",
    "compute_similarity_pairs",
    "index_similarity",
    "get_similar_symbols",
    "LouvainDetector",
    "derive_community_name",
    "detect_and_store_communities",
    "get_symbol_community",
    "list_communities",
    "FastASTConfig",
    "load_config",
    "validate_safe_path",
    "PathTraversalError",
    "RepositoryLock",
    "RepositoryLockedError",
    "RepositoryWatcher",
    "diagnose_repository",
    "clean_stale_locks",
    "check_database_integrity",
    "safe_repair_or_recreate_db",
]
