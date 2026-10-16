from typing import List, Optional

class PruneResult:
    pruned_code: str
    original_tokens: int
    pruned_tokens: int
    savings_pct: float
    total_lines: int
    kept_lines: int
    latency_ms: float
    has_syntax_error: bool

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

def prune_file(code_text: str, focus_query: str, threshold: float = 0.5) -> PruneResult: ...
def index_code(code_text: str) -> FileIndexResult: ...
