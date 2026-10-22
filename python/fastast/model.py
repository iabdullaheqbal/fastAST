"""Core domain data model for FastAST Codebase-Memory Engine (AST → Graph → Retrieval)."""

from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional


class FileStatus(str, Enum):
    UNCHANGED = "unchanged"
    ADDED = "added"
    MODIFIED = "modified"
    DELETED = "deleted"
    ERROR = "error"


class FileCategory(str, Enum):
    SOURCE = "source"
    TEST = "test"
    CONFIG = "config"
    DOCS = "docs"
    INFRA = "infra"
    GENERATED = "generated"
    OTHER = "other"


class EdgeRelation(str, Enum):
    CALLS = "calls"
    IMPORTS = "imports"
    DEFINES = "defines"
    IMPLEMENTS = "implements"
    INHERITS = "inherits"
    REFERENCES = "references"
    SIMILAR_TO = "similar_to"


@dataclass
class FileRecord:
    """Represents an indexed file record in the repository store."""

    path: str
    language: str
    hash: str
    mtime: float
    status: str = FileStatus.UNCHANGED.value
    category: str = FileCategory.SOURCE.value
    total_lines: int = 0
    total_tokens: int = 0
    has_syntax_error: bool = False

    def to_dict(self) -> Dict[str, Any]:
        return {
            "path": self.path,
            "language": self.language,
            "hash": self.hash,
            "mtime": self.mtime,
            "status": self.status,
            "category": self.category,
            "total_lines": self.total_lines,
            "total_tokens": self.total_tokens,
            "has_syntax_error": self.has_syntax_error,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "FileRecord":
        return cls(
            path=data["path"],
            language=data.get("language", "python"),
            hash=data["hash"],
            mtime=float(data["mtime"]),
            status=data.get("status", FileStatus.UNCHANGED.value),
            category=data.get("category", FileCategory.SOURCE.value),
            total_lines=int(data.get("total_lines", 0)),
            total_tokens=int(data.get("total_tokens", 0)),
            has_syntax_error=bool(data.get("has_syntax_error", False)),
        )


@dataclass
class SymbolRecord:
    """Represents an extracted symbol node in the code graph."""

    name: str
    kind: str
    file: str
    start_line: int
    end_line: int
    confidence: float = 1.0
    id: Optional[int] = None
    signature: Optional[str] = None
    parent_name: Optional[str] = None
    docstring: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "kind": self.kind,
            "file": self.file,
            "start_line": self.start_line,
            "end_line": self.end_line,
            "confidence": self.confidence,
            "signature": self.signature,
            "parent_name": self.parent_name,
            "docstring": self.docstring,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "SymbolRecord":
        return cls(
            name=data["name"],
            kind=data["kind"],
            file=data.get("file", data.get("file_path", "")),
            start_line=int(data["start_line"]),
            end_line=int(data["end_line"]),
            confidence=float(data.get("confidence", 1.0)),
            id=data.get("id"),
            signature=data.get("signature"),
            parent_name=data.get("parent_name"),
            docstring=data.get("docstring"),
        )


@dataclass
class EdgeRecord:
    """Represents a directed edge connecting two symbols/entities in the code graph."""

    src: str
    dst: str
    relation: str = EdgeRelation.CALLS.value
    confidence: float = 1.0
    line_number: Optional[int] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "src": self.src,
            "dst": self.dst,
            "relation": self.relation,
            "confidence": self.confidence,
            "line_number": self.line_number,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "EdgeRecord":
        return cls(
            src=data["src"],
            dst=data["dst"],
            relation=data.get("relation", EdgeRelation.CALLS.value),
            confidence=float(data.get("confidence", 1.0)),
            line_number=data.get("line_number"),
        )


@dataclass
class EvidenceWindow:
    """Bounded evidence window providing exact line numbers and code snippet for a candidate."""

    start_line: int
    end_line: int
    snippet: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "start_line": self.start_line,
            "end_line": self.end_line,
            "snippet": self.snippet,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "EvidenceWindow":
        return cls(
            start_line=int(data["start_line"]),
            end_line=int(data["end_line"]),
            snippet=data.get("snippet"),
        )


@dataclass
class Candidate:
    """Represents a candidate symbol retrieved for agent query evidence."""

    symbol_id: str
    score: float
    reasons: List[str] = field(default_factory=list)
    neighbors: List[str] = field(default_factory=list)
    evidence_window: EvidenceWindow = field(default_factory=lambda: EvidenceWindow(0, 0))
    name: Optional[str] = None
    kind: Optional[str] = None
    file_path: Optional[str] = None
    start_line: int = 0
    end_line: int = 0
    confidence: float = 1.0
    signature: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        d: Dict[str, Any] = {
            "symbol_id": self.symbol_id,
            "score": self.score,
            "reasons": self.reasons,
            "neighbors": self.neighbors,
            "evidence_window": self.evidence_window.to_dict(),
        }
        if self.name:
            d["name"] = self.name
        if self.kind:
            d["kind"] = self.kind
        if self.file_path:
            d["file_path"] = self.file_path
        if self.start_line:
            d["start_line"] = self.start_line
        if self.end_line:
            d["end_line"] = self.end_line
        if self.confidence is not None:
            d["confidence"] = self.confidence
        if self.signature:
            d["signature"] = self.signature
        return d

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "Candidate":
        ew_data = data.get("evidence_window", {})
        if isinstance(ew_data, EvidenceWindow):
            ew = ew_data
        elif isinstance(ew_data, dict):
            ew = EvidenceWindow.from_dict(ew_data)
        else:
            ew = EvidenceWindow(0, 0)

        return cls(
            symbol_id=str(data["symbol_id"]),
            score=float(data["score"]),
            reasons=list(data.get("reasons", [])),
            neighbors=list(data.get("neighbors", [])),
            evidence_window=ew,
            name=data.get("name"),
            kind=data.get("kind"),
            file_path=data.get("file_path"),
            start_line=int(data.get("start_line", 0)),
            end_line=int(data.get("end_line", 0)),
            confidence=float(data.get("confidence", 1.0)),
            signature=data.get("signature"),
        )


@dataclass
class ExtractedFileFacts:
    """Represents extracted syntactic facts (symbols + graph edges) for a single file."""

    file_path: str
    language: str = "python"
    symbols: List[SymbolRecord] = field(default_factory=list)
    edges: List[EdgeRecord] = field(default_factory=list)
    imports: List[Any] = field(default_factory=list)
    calls: List[Any] = field(default_factory=list)
    total_lines: int = 0
    total_tokens: int = 0
    has_syntax_error: bool = False
    error_message: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "file_path": self.file_path,
            "language": self.language,
            "symbols": [s.to_dict() for s in self.symbols],
            "edges": [e.to_dict() for e in self.edges],
            "imports": [getattr(i, "to_dict", lambda: i)() for i in self.imports],
            "calls": [getattr(c, "to_dict", lambda: c)() for c in self.calls],
            "total_lines": self.total_lines,
            "total_tokens": self.total_tokens,
            "has_syntax_error": self.has_syntax_error,
            "error_message": self.error_message,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "ExtractedFileFacts":
        symbols = [SymbolRecord.from_dict(s) for s in data.get("symbols", [])]
        edges = [EdgeRecord.from_dict(e) for e in data.get("edges", [])]
        return cls(
            file_path=data["file_path"],
            language=data.get("language", "python"),
            symbols=symbols,
            edges=edges,
            imports=data.get("imports", []),
            calls=data.get("calls", []),
            total_lines=int(data.get("total_lines", 0)),
            total_tokens=int(data.get("total_tokens", 0)),
            has_syntax_error=bool(data.get("has_syntax_error", False)),
            error_message=data.get("error_message"),
        )

