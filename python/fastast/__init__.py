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
    from fastast.indexer import index_repository
    from fastast.db import get_call_graph, search_symbols
except ImportError:
    index_repository = None  # type: ignore
    search_symbols = None  # type: ignore
    get_call_graph = None  # type: ignore

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
    "index_repository",
    "search_symbols",
    "get_call_graph",
]
