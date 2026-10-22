from typing import List, Optional

class ExtractedSymbol:
    name: str
    kind: str
    signature: str
    start_line: int
    end_line: int
    parent_name: Optional[str]
    docstring: Optional[str]

class ExtractedImport:
    module: str
    name: Optional[str]
    alias: Optional[str]
    line_number: int

class ExtractedCall:
    caller_name: Optional[str]
    callee_name: str
    line_number: int

class FileIndexResult:
    symbols: List[ExtractedSymbol]
    imports: List[ExtractedImport]
    calls: List[ExtractedCall]
    total_lines: int
    total_tokens: int
    has_syntax_error: bool

class FileRecord:
    path: str
    language: str
    hash: str
    mtime: float
    status: str
    category: str
    total_lines: int
    total_tokens: int
    has_syntax_error: bool
    def __init__(
        self,
        path: str,
        language: str,
        hash: str,
        mtime: float,
        status: str = "unchanged",
        category: str = "source",
        total_lines: int = 0,
        total_tokens: int = 0,
        has_syntax_error: bool = False,
    ) -> None: ...

class SymbolRecord:
    id: Optional[int]
    name: str
    kind: str
    file: str
    start_line: int
    end_line: int
    confidence: float
    signature: Optional[str]
    parent_name: Optional[str]
    docstring: Optional[str]
    def __init__(
        self,
        name: str,
        kind: str,
        file: str,
        start_line: int,
        end_line: int,
        confidence: float = 1.0,
        id: Optional[int] = None,
        signature: Optional[str] = None,
        parent_name: Optional[str] = None,
        docstring: Optional[str] = None,
    ) -> None: ...

class EdgeRecord:
    src: str
    dst: str
    relation: str
    confidence: float
    line_number: Optional[int]
    def __init__(
        self,
        src: str,
        dst: str,
        relation: str = "calls",
        confidence: float = 1.0,
        line_number: Optional[int] = None,
    ) -> None: ...

class EvidenceWindow:
    start_line: int
    end_line: int
    snippet: Optional[str]
    def __init__(
        self,
        start_line: int,
        end_line: int,
        snippet: Optional[str] = None,
    ) -> None: ...

class Candidate:
    symbol_id: str
    score: float
    reasons: List[str]
    neighbors: List[str]
    evidence_window: EvidenceWindow
    def __init__(
        self,
        symbol_id: str,
        score: float,
        reasons: Optional[List[str]] = None,
        neighbors: Optional[List[str]] = None,
        evidence_window: Optional[EvidenceWindow] = None,
    ) -> None: ...

class ExtractedFileFacts:
    file_path: str
    language: str
    symbols: List[SymbolRecord]
    edges: List[EdgeRecord]
    total_lines: int
    total_tokens: int
    has_syntax_error: bool
    error_message: Optional[str]
    def __init__(
        self,
        file_path: str,
        language: str = "python",
        symbols: Optional[List[SymbolRecord]] = None,
        edges: Optional[List[EdgeRecord]] = None,
        total_lines: int = 0,
        total_tokens: int = 0,
        has_syntax_error: bool = False,
        error_message: Optional[str] = None,
    ) -> None: ...

def index_code(
    code_text: str,
    language: Optional[str] = None,
) -> FileIndexResult: ...

def compute_xxh3(data: bytes) -> str: ...
def is_binary_content(data: bytes) -> bool: ...
def classify_path(path_str: str) -> str: ...
