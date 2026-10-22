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

def index_code(
    code_text: str,
    language: Optional[str] = None,
) -> FileIndexResult: ...
