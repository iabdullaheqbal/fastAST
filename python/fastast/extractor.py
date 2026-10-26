"""Phase 2: Parser + Fact Extractor (Syntax-level pruning).

Parses admitted FileRecords using Tree-Sitter (or resilient Python AST fallback),
extracting only meaningful facts (declarations, imports, and calls) into
SymbolRecords and EdgeRecords ready for the graph layer.
"""

from __future__ import annotations

import ast
import json
import re
from pathlib import Path
from typing import Any, Dict, List, Optional, Sequence, Set, Tuple, Union

try:
    from fastast._core import ExtractedCall, ExtractedImport, index_code
except ImportError:
    index_code = None
    try:
        from fastast import ExtractedCall, ExtractedImport
    except ImportError:
        class ExtractedImport:  # type: ignore
            def __init__(self, module: str, name: Optional[str] = None, alias: Optional[str] = None, line_number: int = 0):
                self.module = module
                self.name = name
                self.alias = alias
                self.line_number = line_number

        class ExtractedCall:  # type: ignore
            def __init__(self, callee_name: str, caller_name: Optional[str] = None, line_number: int = 0):
                self.callee_name = callee_name
                self.caller_name = caller_name
                self.line_number = line_number

from fastast.model import (
    EdgeRecord,
    EdgeRelation,
    ExtractedFileFacts,
    FileRecord,
    FileStatus,
    SymbolRecord,
)


class PythonAstFactExtractor(ast.NodeVisitor):
    """Extracts structural symbols, imports, and call sites from Python AST."""

    def __init__(self, code_text: str, file_path: str):
        self.code_text = code_text
        self.lines = code_text.splitlines()
        self.file_path = file_path
        self.symbols: List[SymbolRecord] = []
        self.edges: List[EdgeRecord] = []
        self.imports: List[ExtractedImport] = []
        self.calls: List[ExtractedCall] = []
        self.scope_stack: List[Tuple[str, str]] = []  # (name, kind)

    def extract(self) -> Tuple[List[SymbolRecord], List[EdgeRecord], bool]:
        has_syntax_error = False
        try:
            tree = ast.parse(self.code_text, filename=self.file_path)
            self.visit(tree)
        except SyntaxError:
            has_syntax_error = True
            self._fallback_line_extraction()

        return self.symbols, self.edges, has_syntax_error

    def visit_ClassDef(self, node: ast.ClassDef) -> None:
        parent_name = self.scope_stack[-1][0] if self.scope_stack else None
        start_line = node.lineno
        end_line = getattr(node, "end_lineno", node.lineno)
        docstring = ast.get_docstring(node)

        # Build class signature from first line
        first_line = self.lines[start_line - 1].strip() if start_line <= len(self.lines) else f"class {node.name}:"
        signature = first_line.rstrip(":")

        sym = SymbolRecord(
            name=node.name,
            kind="class",
            file=self.file_path,
            start_line=start_line,
            end_line=end_line,
            confidence=1.0,
            signature=signature,
            parent_name=parent_name,
            docstring=docstring,
        )
        self.symbols.append(sym)

        if parent_name:
            self.edges.append(
                EdgeRecord(
                    src=parent_name,
                    dst=node.name,
                    relation=EdgeRelation.DEFINES.value,
                    confidence=1.0,
                    line_number=start_line,
                )
            )

        # Extract base class inheritance edges
        for base in node.bases:
            base_name = None
            if isinstance(base, ast.Name):
                base_name = base.id
            elif isinstance(base, ast.Attribute):
                base_name = base.attr
            if base_name and base_name not in {"object"}:
                self.edges.append(
                    EdgeRecord(
                        src=node.name,
                        dst=base_name,
                        relation=EdgeRelation.INHERITS.value,
                        confidence=1.0,
                        line_number=start_line,
                    )
                )

        self.scope_stack.append((node.name, "class"))
        self.generic_visit(node)
        self.scope_stack.pop()

    def visit_FunctionDef(self, node: ast.FunctionDef) -> None:
        self._handle_function(node, is_async=False)

    def visit_AsyncFunctionDef(self, node: ast.AsyncFunctionDef) -> None:
        self._handle_function(node, is_async=True)

    def _handle_function(self, node: Union[ast.FunctionDef, ast.AsyncFunctionDef], is_async: bool) -> None:
        is_method = bool(self.scope_stack and self.scope_stack[-1][1] == "class")
        parent_name = self.scope_stack[-1][0] if self.scope_stack else None

        if is_async:
            kind = "async_method" if is_method else "async_function"
        else:
            kind = "method" if is_method else "function"

        start_line = node.lineno
        end_line = getattr(node, "end_lineno", node.lineno)
        docstring = ast.get_docstring(node)

        first_line = self.lines[start_line - 1].strip() if start_line <= len(self.lines) else f"def {node.name}():"
        signature = first_line.rstrip(":")

        sym = SymbolRecord(
            name=node.name,
            kind=kind,
            file=self.file_path,
            start_line=start_line,
            end_line=end_line,
            confidence=1.0,
            signature=signature,
            parent_name=parent_name,
            docstring=docstring,
        )
        self.symbols.append(sym)

        if parent_name:
            self.edges.append(
                EdgeRecord(
                    src=parent_name,
                    dst=node.name,
                    relation=EdgeRelation.DEFINES.value,
                    confidence=1.0,
                    line_number=start_line,
                )
            )

        self.scope_stack.append((node.name, kind))
        self.generic_visit(node)
        self.scope_stack.pop()

    def visit_Import(self, node: ast.Import) -> None:
        for alias in node.names:
            module = alias.name
            target = alias.asname or alias.name
            self.imports.append(
                ExtractedImport(
                    module=module,
                    name=None,
                    alias=alias.asname,
                    line_number=node.lineno,
                )
            )
            self.edges.append(
                EdgeRecord(
                    src=self.file_path,
                    dst=module,
                    relation=EdgeRelation.IMPORTS.value,
                    confidence=1.0,
                    line_number=node.lineno,
                )
            )
        self.generic_visit(node)

    def visit_ImportFrom(self, node: ast.ImportFrom) -> None:
        module = node.module or "."
        for alias in node.names:
            target = f"{module}.{alias.name}" if alias.name != "*" else module
            self.imports.append(
                ExtractedImport(
                    module=module,
                    name=alias.name,
                    alias=alias.asname,
                    line_number=node.lineno,
                )
            )
            self.edges.append(
                EdgeRecord(
                    src=self.file_path,
                    dst=target,
                    relation=EdgeRelation.IMPORTS.value,
                    confidence=1.0,
                    line_number=node.lineno,
                )
            )
        self.generic_visit(node)

    def visit_Call(self, node: ast.Call) -> None:
        callee_name = None
        if isinstance(node.func, ast.Name):
            callee_name = node.func.id
        elif isinstance(node.func, ast.Attribute):
            callee_name = node.func.attr

        if callee_name:
            caller_name = self.scope_stack[-1][0] if self.scope_stack else None
            caller = caller_name if caller_name else f"<module:{Path(self.file_path).stem}>"
            confidence = 1.0 if self.scope_stack else 0.7
            self.calls.append(
                ExtractedCall(
                    callee_name=callee_name,
                    caller_name=caller_name,
                    line_number=node.lineno,
                )
            )
            self.edges.append(
                EdgeRecord(
                    src=caller,
                    dst=callee_name,
                    relation=EdgeRelation.CALLS.value,
                    confidence=confidence,
                    line_number=node.lineno,
                )
            )
            if caller_name and "." in caller_name:
                self.edges.append(
                    EdgeRecord(
                        src=caller_name.split(".")[-1],
                        dst=callee_name,
                        relation=EdgeRelation.CALLS.value,
                        confidence=confidence,
                        line_number=node.lineno,
                    )
                )
        self.generic_visit(node)

    def _fallback_line_extraction(self) -> None:
        """Regex-based fallback extraction for syntactically invalid Python source."""
        for idx, line in enumerate(self.lines, start=1):
            stripped = line.strip()
            # Functions
            m_fn = re.match(r"^(?:async\s+)?def\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(", stripped)
            if m_fn:
                name = m_fn.group(1)
                kind = "async_function" if "async " in stripped else "function"
                self.symbols.append(
                    SymbolRecord(
                        name=name,
                        kind=kind,
                        file=self.file_path,
                        start_line=idx,
                        end_line=idx,
                        confidence=0.85,
                        signature=stripped.rstrip(":"),
                    )
                )
                continue

            # Classes
            m_cls = re.match(r"^class\s+([a-zA-Z_][a-zA-Z0-9_]*)", stripped)
            if m_cls:
                name = m_cls.group(1)
                self.symbols.append(
                    SymbolRecord(
                        name=name,
                        kind="class",
                        file=self.file_path,
                        start_line=idx,
                        end_line=idx,
                        confidence=0.85,
                        signature=stripped.rstrip(":"),
                    )
                )
                continue

            # Imports
            if stripped.startswith("import ") or stripped.startswith("from "):
                self.edges.append(
                    EdgeRecord(
                        src=self.file_path,
                        dst=stripped.split()[1],
                        relation=EdgeRelation.IMPORTS.value,
                        confidence=0.85,
                        line_number=idx,
                    )
                )


def _regex_extract_general(
    code_text: str, file_path: str, language: str
) -> Tuple[List[SymbolRecord], List[EdgeRecord], bool]:
    """Lightweight generic structural extractor for languages when native engine is unavailable."""
    symbols: List[SymbolRecord] = []
    edges: List[EdgeRecord] = []
    lines = code_text.splitlines()

    # Generic patterns
    fn_pattern = re.compile(
        r"^(?:pub\s+|export\s+|public\s+|private\s+|protected\s+|static\s+|async\s+)*"
        r"(?:fn|function|def|void|int|bool|string)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*[\(<]"
    )
    cls_pattern = re.compile(
        r"^(?:pub\s+|export\s+|public\s+|private\s+|abstract\s+)*"
        r"(?:class|struct|interface|trait|enum)\s+([a-zA-Z_][a-zA-Z0-9_]*)"
    )
    import_pattern = re.compile(
        r"^(?:use\s+|import\s+|from\s+)([\w\.:/\\-]+)"
    )
    call_pattern = re.compile(
        r"\b([a-zA-Z_][a-zA-Z0-9_]*)\s*\("
    )

    for idx, line in enumerate(lines, start=1):
        stripped = line.strip()
        if not stripped or stripped.startswith("//") or stripped.startswith("#"):
            continue

        m_cls = cls_pattern.match(stripped)
        if m_cls:
            name = m_cls.group(1)
            kind = "class"
            if "interface" in stripped:
                kind = "interface"
            elif "struct" in stripped:
                kind = "struct"
            elif "trait" in stripped:
                kind = "trait"
            elif "enum" in stripped:
                kind = "enum"

            symbols.append(
                SymbolRecord(
                    name=name,
                    kind=kind,
                    file=file_path,
                    start_line=idx,
                    end_line=idx,
                    confidence=0.75,
                    signature=stripped.rstrip("{").strip(),
                )
            )
            continue

        m_fn = fn_pattern.match(stripped)
        if m_fn:
            name = m_fn.group(1)
            symbols.append(
                SymbolRecord(
                    name=name,
                    kind="function",
                    file=file_path,
                    start_line=idx,
                    end_line=idx,
                    confidence=0.75,
                    signature=stripped.rstrip("{").strip(),
                )
            )
            continue

        m_imp = import_pattern.match(stripped)
        if m_imp:
            target = m_imp.group(1).rstrip(";")
            edges.append(
                EdgeRecord(
                    src=file_path,
                    dst=target,
                    relation=EdgeRelation.IMPORTS.value,
                    confidence=0.85,
                    line_number=idx,
                )
            )

    return symbols, edges, False


def _extract_json_facts(
    code_text: str, file_path: str
) -> Tuple[List[SymbolRecord], List[EdgeRecord], bool]:
    """Extract structural property keys from JSON."""
    symbols: List[SymbolRecord] = []
    edges: List[EdgeRecord] = []
    try:
        data = json.loads(code_text)
        if isinstance(data, dict):
            for idx, key in enumerate(data.keys(), start=1):
                symbols.append(
                    SymbolRecord(
                        name=key,
                        kind="property",
                        file=file_path,
                        start_line=idx,
                        end_line=idx,
                        confidence=1.0,
                        signature=f'"{key}"',
                    )
                )
        return symbols, edges, False
    except Exception:
        return symbols, edges, True


def extract_file_facts(
    code_text: str,
    file_path: str,
    language: Optional[str] = None,
) -> ExtractedFileFacts:
    """Parse source code and extract structural facts into SymbolRecords and EdgeRecords.

    Uses native Tree-Sitter (_core.index_code) if compiled, with robust Python AST
    and language fallbacks when running pure Python.
    """
    total_lines = len(code_text.splitlines())
    total_tokens = len(code_text.split())
    lang = (language or "python").lower()

    # 1. Try native Tree-Sitter extraction if available
    if index_code is not None:
        try:
            res = index_code(code_text, language=lang)
            confidence = 0.85 if res.has_syntax_error else 1.0

            symbols: List[SymbolRecord] = []
            edges: List[EdgeRecord] = []

            for sym in res.symbols:
                kind = sym.kind
                if sym.kind == "method" and sym.signature and "async " in sym.signature:
                    kind = "async_method"
                elif sym.kind == "function" and sym.signature and "async " in sym.signature:
                    kind = "async_function"

                symbols.append(
                    SymbolRecord(
                        name=sym.name,
                        kind=kind,
                        file=file_path,
                        start_line=sym.start_line,
                        end_line=sym.end_line,
                        confidence=confidence,
                        signature=sym.signature,
                        parent_name=sym.parent_name,
                        docstring=sym.docstring,
                    )
                )
                if sym.parent_name:
                    edges.append(
                        EdgeRecord(
                            src=sym.parent_name,
                            dst=sym.name,
                            relation=EdgeRelation.DEFINES.value,
                            confidence=1.0,
                            line_number=sym.start_line,
                        )
                    )
                # Extract inheritance edges from class signature
                if sym.kind == "class" and sym.signature:
                    m_base = re.search(r"class\s+\w+\s*\(([^)]+)\)", sym.signature)
                    if m_base:
                        for b in m_base.group(1).split(","):
                            base_name = b.strip()
                            if base_name and base_name not in {"object", ""}:
                                edges.append(
                                    EdgeRecord(
                                        src=sym.name,
                                        dst=base_name.split(".")[-1],
                                        relation=EdgeRelation.INHERITS.value,
                                        confidence=1.0,
                                        line_number=sym.start_line,
                                    )
                                )

            for imp in res.imports:
                target = f"{imp.module}.{imp.name}" if imp.name else imp.module
                edges.append(
                    EdgeRecord(
                        src=file_path,
                        dst=target,
                        relation=EdgeRelation.IMPORTS.value,
                        confidence=1.0,
                        line_number=imp.line_number,
                    )
                )

            for call in res.calls:
                caller = call.caller_name or f"<module:{Path(file_path).stem}>"
                conf = 1.0 if call.caller_name else 0.7
                edges.append(
                    EdgeRecord(
                        src=caller,
                        dst=call.callee_name,
                        relation=EdgeRelation.CALLS.value,
                        confidence=conf,
                        line_number=call.line_number,
                    )
                )
                if caller and "." in caller:
                    edges.append(
                        EdgeRecord(
                            src=caller.split(".")[-1],
                            dst=call.callee_name,
                            relation=EdgeRelation.CALLS.value,
                            confidence=conf,
                            line_number=call.line_number,
                        )
                    )

            return ExtractedFileFacts(
                file_path=file_path,
                language=lang,
                symbols=symbols,
                edges=edges,
                imports=list(res.imports),
                calls=list(res.calls),
                total_lines=res.total_lines or total_lines,
                total_tokens=res.total_tokens or total_tokens,
                has_syntax_error=res.has_syntax_error,
            )
        except Exception as exc:
            # Fall through to Python fallback on any native engine exception
            pass

    # 2. Resilient Python / Language Fallback
    try:
        raw_imports = []
        raw_calls = []
        if lang == "python":
            extractor = PythonAstFactExtractor(code_text, file_path)
            symbols, edges, has_err = extractor.extract()
            raw_imports = extractor.imports
            raw_calls = extractor.calls
        elif lang == "json":
            symbols, edges, has_err = _extract_json_facts(code_text, file_path)
        else:
            symbols, edges, has_err = _regex_extract_general(code_text, file_path, lang)

        return ExtractedFileFacts(
            file_path=file_path,
            language=lang,
            symbols=symbols,
            edges=edges,
            imports=raw_imports,
            calls=raw_calls,
            total_lines=total_lines,
            total_tokens=total_tokens,
            has_syntax_error=has_err,
        )
    except Exception as exc:
        return ExtractedFileFacts(
            file_path=file_path,
            language=lang,
            symbols=[],
            edges=[],
            total_lines=total_lines,
            total_tokens=total_tokens,
            has_syntax_error=True,
            error_message=str(exc),
        )


def parse_file_record(
    file_record: FileRecord,
    repo_root: Union[Path, str] = ".",
) -> ExtractedFileFacts:
    """Read and parse an admitted FileRecord into structural facts."""
    root = Path(repo_root)
    full_path = root / file_record.path

    if not full_path.exists():
        return ExtractedFileFacts(
            file_path=file_record.path,
            language=file_record.language,
            symbols=[],
            edges=[],
            total_lines=file_record.total_lines,
            total_tokens=file_record.total_tokens,
            has_syntax_error=True,
            error_message=f"File not found on disk: {file_record.path}",
        )

    try:
        code_text = full_path.read_text(encoding="utf-8", errors="replace")
    except Exception as exc:
        return ExtractedFileFacts(
            file_path=file_record.path,
            language=file_record.language,
            symbols=[],
            edges=[],
            total_lines=file_record.total_lines,
            total_tokens=file_record.total_tokens,
            has_syntax_error=True,
            error_message=f"Failed to read file: {exc}",
        )

    facts = extract_file_facts(code_text, file_record.path, file_record.language)
    file_record.has_syntax_error = facts.has_syntax_error
    if facts.total_lines:
        file_record.total_lines = facts.total_lines
    if facts.total_tokens:
        file_record.total_tokens = facts.total_tokens

    return facts


def parse_file_records(
    file_records: List[FileRecord],
    repo_root: Union[Path, str] = ".",
) -> List[ExtractedFileFacts]:
    """Parse a batch of admitted FileRecords into structural facts."""
    results: List[ExtractedFileFacts] = []
    for rec in file_records:
        facts = parse_file_record(rec, repo_root=repo_root)
        results.append(facts)
    return results

