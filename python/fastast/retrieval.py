"""Phase 4: Retrieval, Ranking, and Evidence Selection (Query-time pruning).

Provides a token-conscious query layer over the persisted SymbolRecord and
EdgeRecord graph:
- Multi-factor candidate scoring and ranking
- Query-time pruning of low-confidence and low-relevance results
- Depth-limited and fan-out-capped graph neighborhood expansion
- Minimal bounded evidence snippet extraction (avoiding full-file dumps)
- Structured EvidenceBundle assembly for AI coding agents
"""

from __future__ import annotations

import re
import sqlite3
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional, Set, Tuple, Union

from fastast.graph import BUILTIN_CALL_NOISE
from fastast.model import (
    Candidate,
    EdgeRecord,
    EdgeRelation,
    EvidenceWindow,
    FileCategory,
    FileRecord,
    SymbolRecord,
)


def estimate_tokens(text: Optional[str]) -> int:
    """Estimate token count for a text snippet.

    Uses native tiktoken BPE when available via fastast._core,
    otherwise uses an accurate whitespace-word ratio fallback.
    """
    if not text:
        return 0
    try:
        from fastast import _core
        if hasattr(_core, "count_tokens"):
            return _core.count_tokens(text)
    except (ImportError, AttributeError):
        pass
    # Standard code approximation: whitespace tokens * 1.3
    words = text.split()
    return max(1, int(len(words) * 1.33))


@dataclass
class EvidenceBundle:
    """Compact structured evidence bundle returned to agents for code context."""

    query: str
    candidates: List[Candidate] = field(default_factory=list)
    symbols: List[Dict[str, Any]] = field(default_factory=list)
    files: List[Dict[str, Any]] = field(default_factory=list)
    relationships: List[Dict[str, Any]] = field(default_factory=list)
    snippets: List[Dict[str, Any]] = field(default_factory=list)
    meta: Dict[str, Any] = field(default_factory=dict)
    total_tokens_estimate: int = 0

    def to_dict(self) -> Dict[str, Any]:
        return {
            "query": self.query,
            "candidates": [c.to_dict() for c in self.candidates],
            "symbols": self.symbols,
            "files": self.files,
            "relationships": self.relationships,
            "snippets": self.snippets,
            "meta": self.meta,
            "total_tokens_estimate": self.total_tokens_estimate,
        }


def score_candidate(
    sym_name: str,
    sym_kind: str,
    file_path: str,
    file_category: str,
    sym_confidence: float,
    edge_count: int,
    query: str,
    target_kind: Optional[str] = None,
    target_path: Optional[str] = None,
    signature: Optional[str] = None,
    docstring: Optional[str] = None,
    bm25_score: float = 0.0,
    semantic_score: float = 0.0,
) -> Tuple[float, List[str]]:
    """Compute multi-factor relevance score and explainability reasons for a symbol candidate.

    Heuristic components:
    0. BM25 full-text score over name, signature, docstring, and path
    1. Semantic similarity score from dense vector embeddings
    2. Name match (exact, case-insensitive, prefix, word boundary, substring)
    3. Type match (target kind match or executable construct priority)
    4. Path relevance (target path match, query in path, source vs test category)
    5. Graph edge density & centrality (connected callers, callees, defines)
    6. Symbol extraction confidence from Phase 2
    """
    reasons: List[str] = []
    q = query.strip()
    q_lower = q.lower()
    name_lower = sym_name.lower()

    if bm25_score > 0.0:
        reasons.append(f"BM25 lexical match (score: {bm25_score:.2f})")
    if semantic_score > 0.0:
        reasons.append(f"Semantic match (score: {semantic_score:.2f})")

    # 1. Name Match Score (Weight: 0.40)
    name_score = 0.0
    if sym_name == q:
        name_score = 1.00
        reasons.append(f"Exact name match ('{sym_name}')")
    elif name_lower == q_lower:
        name_score = 0.95
        reasons.append(f"Case-insensitive exact match ('{sym_name}')")
    elif name_lower.startswith(q_lower):
        name_score = 0.80
        reasons.append(f"Prefix name match ('{sym_name}')")
    elif name_lower.endswith(q_lower):
        name_score = 0.70
        reasons.append(f"Suffix name match ('{sym_name}')")
    elif any(token == q_lower for token in re.split(r"[_\W]+", name_lower)):
        name_score = 0.65
        reasons.append(f"Word boundary match ('{sym_name}')")
    elif q_lower in name_lower:
        name_score = 0.50
        reasons.append(f"Substring name match ('{sym_name}')")
    elif signature and q_lower in signature.lower():
        name_score = 0.35
        reasons.append("Matched query in signature")
    elif docstring and q_lower in docstring.lower():
        name_score = 0.30
        reasons.append("Matched query in docstring")
    else:
        name_score = 0.00

    # 2. Type Match Score (Weight: 0.15)
    type_score = 0.0
    kind_lower = sym_kind.lower()
    if target_kind:
        if kind_lower == target_kind.lower():
            type_score = 1.00
            reasons.append(f"Target kind match: {sym_kind}")
        else:
            type_score = 0.10
    else:
        # Default priority for primary executable definitions
        if kind_lower in {"function", "async_function", "method", "class", "struct", "interface"}:
            type_score = 0.85
            reasons.append(f"Primary definition ({sym_kind})")
        elif kind_lower in {"variable", "constant", "field", "property"}:
            type_score = 0.60
            reasons.append(f"Value definition ({sym_kind})")
        elif kind_lower in {"module", "package", "file"}:
            type_score = 0.40
        else:
            type_score = 0.30

    # 3. Path Relevance Score (Weight: 0.15)
    path_score = 0.0
    path_lower = file_path.lower()
    cat_lower = (file_category or "").lower()

    if target_path:
        if target_path.lower() in path_lower:
            path_score = 1.00
            reasons.append(f"Target path match: {file_path}")
        else:
            path_score = 0.20
    else:
        if q_lower in path_lower:
            path_score = 0.90
            reasons.append(f"Path matches query term ('{file_path}')")
        elif cat_lower == FileCategory.SOURCE.value:
            path_score = 0.80
            reasons.append(f"Source file: {file_path}")
        elif cat_lower == FileCategory.TEST.value:
            path_score = 0.40
            reasons.append(f"Test file: {file_path}")
        elif cat_lower in {FileCategory.CONFIG.value, FileCategory.INFRA.value}:
            path_score = 0.35
        else:
            path_score = 0.25

    # 4. Graph Edge Centrality Score (Weight: 0.15)
    # Saturation curve: 0 edges -> 0.05, 1 edge -> 0.25, 3 edges -> 0.60, 6+ edges -> 1.00
    edge_score = min(1.00, edge_count / 6.0) if edge_count > 0 else 0.05
    if edge_count > 0:
        reasons.append(f"Graph degree: {edge_count} connected relations")

    # 5. AST Parser Confidence Score (Weight: 0.15)
    conf_score = max(0.0, min(1.0, float(sym_confidence)))
    if conf_score < 0.9:
        reasons.append(f"Syntax error penalty: {conf_score:.2f}")

    # Composite weighted score (Hybrid fusion across BM25, Semantic, and Structural signals)
    if bm25_score > 0.0 and semantic_score > 0.0:
        composite = (
            0.25 * semantic_score
            + 0.25 * bm25_score
            + 0.25 * name_score
            + 0.09 * type_score
            + 0.08 * path_score
            + 0.05 * edge_score
            + 0.04 * conf_score
        )
    elif semantic_score > 0.0:
        composite = (
            0.35 * semantic_score
            + 0.30 * name_score
            + 0.10 * type_score
            + 0.10 * path_score
            + 0.10 * edge_score
            + 0.05 * conf_score
        )
    elif bm25_score > 0.0:
        composite = (
            0.30 * bm25_score
            + 0.30 * name_score
            + 0.10 * type_score
            + 0.10 * path_score
            + 0.10 * edge_score
            + 0.10 * conf_score
        )
    else:
        composite = (
            0.40 * name_score
            + 0.15 * type_score
            + 0.15 * path_score
            + 0.15 * edge_score
            + 0.15 * conf_score
        )

    # Penalize low-confidence syntax errors when there is no direct name match
    if conf_score < 0.5 and name_score == 0.0:
        composite *= conf_score

    return round(composite, 4), reasons


class RetrievalEngine:
    """High-performance query, ranking, and evidence selection engine."""

    def __init__(
        self,
        db_or_conn: Union[sqlite3.Connection, Path, str],
        repo_root: Optional[Union[Path, str]] = None,
    ):
        if isinstance(db_or_conn, sqlite3.Connection):
            self.conn = db_or_conn
            self._close_conn = False
            self.repo_root = Path(repo_root) if repo_root else Path(".")
        else:
            db_path = Path(db_or_conn)
            if not db_path.exists():
                raise FileNotFoundError(f"Database not found: {db_path}")
            from fastast.db import get_connection
            self.conn = get_connection(db_path)
            self._close_conn = True
            self.repo_root = Path(repo_root) if repo_root else db_path.parent

    def close(self) -> None:
        if self._close_conn and self.conn:
            self.conn.close()

    def __enter__(self) -> "RetrievalEngine":
        return self

    def __exit__(self, exc_type, exc_val, exc_tb) -> None:
        self.close()

    # ── Core Query API ───────────────────────────────────────────────────────

    def get_symbol_by_name(
        self, name: str, file_path: Optional[str] = None
    ) -> List[SymbolRecord]:
        """Exact lookup of symbols by name, with optional file path filter."""
        cur = self.conn.cursor()
        query = (
            """
            SELECT s.id, s.name, s.kind, s.signature, s.start_line, s.end_line,
                   s.confidence, s.docstring, f.path as file_path, p.name as parent_name
            FROM symbols s
            JOIN files f ON s.file_id = f.id
            LEFT JOIN symbols p ON s.parent_symbol_id = p.id
            WHERE s.name = ?
            """
        )
        params: List[Any] = [name]
        if file_path:
            query += " AND (f.path = ? OR f.path LIKE ?)"
            params.extend([file_path, f"%{file_path}"])

        query += " ORDER BY f.path, s.start_line"
        cur.execute(query, params)

        records = []
        for r in cur.fetchall():
            records.append(
                SymbolRecord(
                    name=r["name"],
                    kind=r["kind"],
                    file=r["file_path"],
                    start_line=r["start_line"],
                    end_line=r["end_line"],
                    confidence=r["confidence"],
                    id=r["id"],
                    signature=r["signature"],
                    parent_name=r["parent_name"],
                    docstring=r["docstring"],
                )
            )
        return records

    def get_symbol_by_path(self, path: str) -> List[SymbolRecord]:
        """Retrieve all symbols declared within a given file path, ordered by line."""
        cur = self.conn.cursor()
        cur.execute(
            """
            SELECT s.id, s.name, s.kind, s.signature, s.start_line, s.end_line,
                   s.confidence, s.docstring, f.path as file_path, p.name as parent_name
            FROM symbols s
            JOIN files f ON s.file_id = f.id
            LEFT JOIN symbols p ON s.parent_symbol_id = p.id
            WHERE f.path = ? OR f.path LIKE ?
            ORDER BY s.start_line ASC
            """,
            (path, f"%{path}"),
        )
        records = []
        for r in cur.fetchall():
            records.append(
                SymbolRecord(
                    name=r["name"],
                    kind=r["kind"],
                    file=r["file_path"],
                    start_line=r["start_line"],
                    end_line=r["end_line"],
                    confidence=r["confidence"],
                    id=r["id"],
                    signature=r["signature"],
                    parent_name=r["parent_name"],
                    docstring=r["docstring"],
                )
            )
        return records

    def get_callers(
        self, symbol_id: Union[int, str], limit: int = 20
    ) -> List[Dict[str, Any]]:
        """Retrieve inbound callers for a symbol (by symbol ID or symbol name)."""
        cur = self.conn.cursor()
        symbol_name = str(symbol_id)
        if isinstance(symbol_id, int) or symbol_id.isdigit():
            cur.execute("SELECT name FROM symbols WHERE id = ?", (int(symbol_id),))
            row = cur.fetchone()
            if row:
                symbol_name = row["name"]

        callers: List[Dict[str, Any]] = []

        # 1. From edges table
        cur.execute(
            """
            SELECT e.src, e.confidence, e.line_number, f.path as file_path, s.kind as caller_kind
            FROM edges e
            JOIN files f ON e.file_id = f.id
            LEFT JOIN symbols s ON s.name = e.src AND s.file_id = f.id
            WHERE e.dst = ? AND e.relation = 'calls' AND e.src != ?
            ORDER BY e.confidence DESC
            LIMIT ?
            """,
            (symbol_name, symbol_name, limit),
        )
        for r in cur.fetchall():
            if r["src"] in BUILTIN_CALL_NOISE:
                continue
            callers.append({
                "caller": r["src"],
                "caller_kind": r["caller_kind"] or "function",
                "file_path": r["file_path"],
                "line_number": r["line_number"],
                "confidence": r["confidence"],
            })

        # 2. Fallback to calls table if edges are empty
        if not callers:
            cur.execute(
                """
                SELECT c.line_number, f.path as file_path, s.name as caller_name, s.kind as caller_kind
                FROM calls c
                JOIN files f ON c.file_id = f.id
                LEFT JOIN symbols s ON c.caller_symbol_id = s.id
                WHERE c.callee_name = ?
                LIMIT ?
                """,
                (symbol_name, limit),
            )
            for r in cur.fetchall():
                name = r["caller_name"] or "<module>"
                if name in BUILTIN_CALL_NOISE:
                    continue
                callers.append({
                    "caller": name,
                    "caller_kind": r["caller_kind"] or "module",
                    "file_path": r["file_path"],
                    "line_number": r["line_number"],
                    "confidence": 0.85,
                })
        return callers

    def get_callees(
        self, symbol_id: Union[int, str], limit: int = 20
    ) -> List[Dict[str, Any]]:
        """Retrieve outbound callees for a symbol (by symbol ID or symbol name)."""
        cur = self.conn.cursor()
        symbol_name = str(symbol_id)
        if isinstance(symbol_id, int) or symbol_id.isdigit():
            cur.execute("SELECT name FROM symbols WHERE id = ?", (int(symbol_id),))
            row = cur.fetchone()
            if row:
                symbol_name = row["name"]

        callees: List[Dict[str, Any]] = []

        # 1. From edges table
        cur.execute(
            """
            SELECT e.dst, e.confidence, e.line_number, f.path as file_path, s.kind as callee_kind
            FROM edges e
            JOIN files f ON e.file_id = f.id
            LEFT JOIN symbols s ON s.name = e.dst
            WHERE e.src = ? AND e.relation = 'calls' AND e.dst != ?
            ORDER BY e.confidence DESC
            LIMIT ?
            """,
            (symbol_name, symbol_name, limit),
        )
        for r in cur.fetchall():
            if r["dst"] in BUILTIN_CALL_NOISE:
                continue
            callees.append({
                "callee": r["dst"],
                "callee_kind": r["callee_kind"] or "function",
                "file_path": r["file_path"],
                "line_number": r["line_number"],
                "confidence": r["confidence"],
            })

        # 2. Fallback to calls table
        if not callees:
            cur.execute(
                """
                SELECT c.callee_name, c.line_number, f.path as file_path
                FROM calls c
                JOIN symbols s ON c.caller_symbol_id = s.id
                JOIN files f ON c.file_id = f.id
                WHERE s.name = ?
                LIMIT ?
                """,
                (symbol_name, limit),
            )
            for r in cur.fetchall():
                if r["callee_name"] in BUILTIN_CALL_NOISE:
                    continue
                callees.append({
                    "callee": r["callee_name"],
                    "callee_kind": "function",
                    "file_path": r["file_path"],
                    "line_number": r["line_number"],
                    "confidence": 0.85,
                })
        return callees

    def get_related_files(
        self, symbol_id: Union[int, str]
    ) -> List[Dict[str, Any]]:
        """Retrieve repository files related to a symbol through calls, imports, defines, or inheritance."""
        cur = self.conn.cursor()
        symbol_name = str(symbol_id)
        origin_file = ""
        if isinstance(symbol_id, int) or symbol_id.isdigit():
            cur.execute(
                """
                SELECT s.name, f.path FROM symbols s
                JOIN files f ON s.file_id = f.id WHERE s.id = ?
                """,
                (int(symbol_id),),
            )
            row = cur.fetchone()
            if row:
                symbol_name = row["name"]
                origin_file = row["path"]

        related: Dict[str, Dict[str, Any]] = {}

        # Edges touching symbol
        cur.execute(
            """
            SELECT e.src, e.dst, e.relation, e.confidence, f.path as edge_file
            FROM edges e
            JOIN files f ON e.file_id = f.id
            WHERE e.src = ? OR e.dst = ?
            """,
            (symbol_name, symbol_name),
        )
        for r in cur.fetchall():
            path = r["edge_file"]
            if path and path != origin_file:
                if path not in related or r["confidence"] > related[path]["confidence"]:
                    related[path] = {
                        "path": path,
                        "relation": r["relation"],
                        "confidence": r["confidence"],
                        "reason": f"Connected via {r['relation']} ({r['src']} -> {r['dst']})",
                    }

        # Destination symbols defined in other files
        cur.execute(
            """
            SELECT DISTINCT f.path, e.relation, e.confidence, e.dst
            FROM edges e
            JOIN symbols s ON s.name = e.dst
            JOIN files f ON s.file_id = f.id
            WHERE e.src = ? AND f.path != ?
            """,
            (symbol_name, origin_file),
        )
        for r in cur.fetchall():
            path = r["path"]
            if path not in related:
                related[path] = {
                    "path": path,
                    "relation": r["relation"],
                    "confidence": r["confidence"],
                    "reason": f"Target symbol '{r['dst']}' defined here",
                }

        return list(related.values())

    def get_snippet(
        self,
        symbol_id: Union[int, str],
        window_lines: int = 5,
        max_snippet_lines: int = 60,
    ) -> Optional[EvidenceWindow]:
        """Extract a minimal, bounded evidence snippet around a symbol definition.

        Guarantees token-consciousness: caps snippet length to max_snippet_lines,
        inserting an omission indicator for long functions or classes.
        Degrades gracefully if the file is missing from disk.
        """
        window_lines = max(0, min(int(window_lines), 50))
        max_snippet_lines = max(5, min(int(max_snippet_lines), 500))

        cur = self.conn.cursor()
        if isinstance(symbol_id, int) or symbol_id.isdigit():
            cur.execute(
                """
                SELECT s.id, s.name, s.start_line, s.end_line, f.path as file_path
                FROM symbols s
                JOIN files f ON s.file_id = f.id
                WHERE s.id = ?
                """,
                (int(symbol_id),),
            )
        else:
            cur.execute(
                """
                SELECT s.id, s.name, s.start_line, s.end_line, f.path as file_path
                FROM symbols s
                JOIN files f ON s.file_id = f.id
                WHERE s.name = ?
                LIMIT 1
                """,
                (str(symbol_id),),
            )

        row = cur.fetchone()
        if not row:
            return None

        start_line = max(1, row["start_line"] - window_lines)
        end_line = row["end_line"] + window_lines

        # Resolve path safely against repo_root
        from fastast.config import validate_safe_path
        file_path_str = row["file_path"]
        candidate_paths = [
            Path(file_path_str),
            self.repo_root / file_path_str,
            Path.cwd() / file_path_str,
        ]
        target_path: Optional[Path] = None
        for p in candidate_paths:
            try:
                safe_p = validate_safe_path(p, self.repo_root)
                if safe_p.exists() and safe_p.is_file():
                    target_path = safe_p
                    break
            except Exception:
                continue

        if not target_path:
            # File missing or deleted: return bounded span with None snippet
            return EvidenceWindow(
                start_line=start_line,
                end_line=end_line,
                snippet=None,
            )

        try:
            with open(target_path, "r", encoding="utf-8", errors="replace") as f:
                all_lines = f.readlines()

            total_lines = len(all_lines)
            bounded_start = max(1, min(start_line, total_lines))
            bounded_end = max(bounded_start, min(end_line, total_lines))

            selected_lines = all_lines[bounded_start - 1 : bounded_end]

            # Token bounding: cap snippet length if symbol is very large
            if len(selected_lines) > max_snippet_lines:
                head_count = max_snippet_lines - 15
                tail_count = 15
                omitted = len(selected_lines) - (head_count + tail_count)
                snippet_lines = (
                    selected_lines[:head_count]
                    + [f"    ... [{omitted} lines omitted for brevity] ...\n"]
                    + selected_lines[-tail_count:]
                )
                snippet_str = "".join(snippet_lines)
            else:
                snippet_str = "".join(selected_lines)

            return EvidenceWindow(
                start_line=bounded_start,
                end_line=bounded_end,
                snippet=snippet_str,
            )
        except Exception:
            return EvidenceWindow(
                start_line=start_line,
                end_line=end_line,
                snippet=None,
            )

    def search_files(
        self, query: str, limit: int = 20
    ) -> List[Dict[str, Any]]:
        """Search and rank repository files by path, category, or language."""
        limit = max(1, min(int(limit), 200))

        cur = self.conn.cursor()
        q_clean = query.strip()
        like_query = f"%{q_clean}%"

        cur.execute(
            """
            SELECT f.id, f.path, f.language, f.category, f.total_lines,
                   COUNT(s.id) as symbol_count
            FROM files f
            LEFT JOIN symbols s ON s.file_id = f.id
            WHERE f.path LIKE ? OR f.category = ? OR f.language = ?
            GROUP BY f.id
            LIMIT 100
            """,
            (like_query, q_clean.lower(), q_clean.lower()),
        )

        ranked_files = []
        q_lower = q_clean.lower()
        for r in cur.fetchall():
            path_str = r["path"]
            path_lower = path_str.lower()

            # File scoring heuristic
            score = 0.5
            if Path(path_str).name.lower() == q_lower:
                score = 1.00
            elif q_lower in Path(path_str).name.lower():
                score = 0.85
            elif q_lower in path_lower:
                score = 0.70
            elif r["category"] == q_lower or r["language"] == q_lower:
                score = 0.60

            if r["category"] == FileCategory.SOURCE.value:
                score += 0.05
            elif r["category"] == FileCategory.TEST.value:
                score -= 0.10

            ranked_files.append({
                "path": path_str,
                "language": r["language"],
                "category": r["category"],
                "total_lines": r["total_lines"],
                "symbol_count": r["symbol_count"],
                "score": round(min(1.0, max(0.0, score)), 3),
            })

        ranked_files.sort(key=lambda x: x["score"], reverse=True)
        return ranked_files[:limit]

    # ── Candidate Ranking & Evidence Selection ───────────────────────────────

    def search_symbols(
        self,
        query: str,
        kind: Optional[str] = None,
        language: Optional[str] = None,
        file_path: Optional[str] = None,
        limit: int = 10,
        min_score: float = 0.25,
        expand_graph: bool = True,
        max_depth: int = 1,
        max_fanout: int = 5,
        window_lines: int = 3,
        max_tokens: Optional[int] = None,
        ranking_method: str = "hybrid",
    ) -> List[Candidate]:
        """Search, rank, and expand candidate symbols with hybrid BM25 + structural ranking.

        1. Fetches BM25 lexical relevance scores from SQLite FTS5 index.
        2. Retrieves candidate matches from SQLite (BM25 hits + exact/lexical LIKE matches).
        3. Computes multi-factor relevance scores (BM25, exact name, kind, path, edge density, confidence).
        4. Applies ranking fusion (weighted hybrid sum or Reciprocal Rank Fusion).
        5. Prunes candidates below min_score (query-time noise reduction).
        6. Keeps top-K candidates.
        7. For top candidates: extracts bounded evidence snippets and bounded graph neighbors.
        8. Enforces token budget if max_tokens is specified.
        """
        limit = max(1, min(int(limit), 200))
        if max_tokens is not None:
            max_tokens = max(1, min(int(max_tokens), 100000))
        window_lines = max(0, min(int(window_lines), 50))

        cur = self.conn.cursor()
        q_clean = query.strip()
        like_query = f"%{q_clean}%"

        # Split query terms for multi-word queries
        terms = [t for t in re.split(r"[\s_]+", q_clean) if t]
        if not terms:
            return []

        # 1. Retrieve Semantic dense vector scores (when hybrid, semantic, or rrf ranking)
        from fastast.db import search_symbols_bm25, search_symbols_semantic
        from fastast.embeddings import get_embedding_provider

        use_semantic = ranking_method.lower() in {"hybrid", "semantic", "rrf"}
        semantic_scores: Dict[int, float] = {}
        if use_semantic:
            try:
                provider = get_embedding_provider()
                query_vec = provider.embed_text(q_clean)
                model_ver = getattr(provider, "model_version", "1.0")
                semantic_scores = search_symbols_semantic(
                    self.conn,
                    query_vec,
                    limit=150,
                    model=provider.model_name,
                    model_version=model_ver,
                )
            except Exception:
                semantic_scores = {}
        semantic_ids = list(semantic_scores.keys())

        # 2. Retrieve BM25 full-text scores from SQLite FTS5 index (when hybrid, bm25, or rrf ranking)
        use_bm25 = ranking_method.lower() in {"hybrid", "bm25", "rrf"}
        bm25_scores = (
            search_symbols_bm25(self.conn, q_clean, limit=150) if use_bm25 else {}
        )
        bm25_ids = list(bm25_scores.keys())

        # 3. Build candidate retrieval SQL combining Semantic + BM25 matches + lexical LIKE
        sub_conds = ["(s.name LIKE ? OR s.signature LIKE ? OR s.docstring LIKE ? OR f.path LIKE ?)"]
        sub_params: List[Any] = [like_query, like_query, like_query, like_query]

        combined_candidate_ids = list(dict.fromkeys(bm25_ids + semantic_ids))
        if combined_candidate_ids:
            placeholders = ",".join("?" for _ in combined_candidate_ids)
            sub_conds.insert(0, f"s.id IN ({placeholders})")
            sub_params = combined_candidate_ids + sub_params

        conditions = [f"({' OR '.join(sub_conds)})"]
        params: List[Any] = sub_params

        if kind:
            conditions.append("s.kind = ?")
            params.append(kind)

        if language:
            conditions.append("f.language = ?")
            params.append(language.lower())

        if file_path:
            conditions.append("(f.path = ? OR f.path LIKE ?)")
            params.extend([file_path, f"%{file_path}"])

        where_clause = " AND ".join(conditions)

        cur.execute(
            f"""
            SELECT s.id, s.name, s.kind, s.signature, s.start_line, s.end_line,
                   s.confidence, s.docstring, f.path as file_path, f.category as file_category
            FROM symbols s
            JOIN files f ON s.file_id = f.id
            WHERE {where_clause}
            LIMIT 200
            """,
            params,
        )
        raw_rows = cur.fetchall()
        if not raw_rows:
            return []

        # Count edges for each symbol candidate in batch
        symbol_names = [r["name"] for r in raw_rows]
        edge_counts: Dict[str, int] = {}
        if symbol_names:
            placeholders = ",".join("?" for _ in symbol_names)
            cur.execute(
                f"""
                SELECT name, COUNT(*) as cnt FROM (
                    SELECT src as name FROM edges WHERE src IN ({placeholders})
                    UNION ALL
                    SELECT dst as name FROM edges WHERE dst IN ({placeholders})
                ) GROUP BY name
                """,
                symbol_names + symbol_names,
            )
            for er in cur.fetchall():
                edge_counts[er["name"]] = er["cnt"]

        # Score candidates
        scored_candidates: List[Tuple[float, List[str], Any, float, float]] = []
        for r in raw_rows:
            deg = edge_counts.get(r["name"], 0)
            bm25_val = bm25_scores.get(r["id"], 0.0)
            sem_val = semantic_scores.get(r["id"], 0.0)

            score, reasons = score_candidate(
                sym_name=r["name"],
                sym_kind=r["kind"],
                file_path=r["file_path"],
                file_category=r["file_category"],
                sym_confidence=r["confidence"],
                edge_count=deg,
                query=q_clean,
                target_kind=kind,
                target_path=file_path,
                signature=r["signature"],
                docstring=r["docstring"],
                bm25_score=bm25_val,
                semantic_score=sem_val,
            )

            # If pure semantic ranking was requested, elevate semantic weight
            if ranking_method.lower() == "semantic":
                name_exact = (
                    1.0
                    if r["name"] == q_clean or r["name"].lower() == q_clean.lower()
                    else 0.0
                )
                score = round(
                    0.60 * sem_val
                    + 0.20 * name_exact
                    + 0.10 * (1.0 if r["kind"] == kind else 0.5)
                    + 0.10 * min(1.0, deg / 6.0),
                    4,
                )

            # Query-time pruning: drop low-score noise
            if score < min_score:
                continue

            scored_candidates.append((score, reasons, r, bm25_val, sem_val))

        # Apply Reciprocal Rank Fusion (RRF) across Semantic, BM25, and Structural rankings
        if ranking_method.lower() == "rrf" and len(scored_candidates) >= 1:
            by_sem = sorted(scored_candidates, key=lambda x: x[4], reverse=True)
            sem_ranks = {item[2]["id"]: i + 1 for i, item in enumerate(by_sem)}

            by_bm25 = sorted(scored_candidates, key=lambda x: x[3], reverse=True)
            bm25_ranks = {item[2]["id"]: i + 1 for i, item in enumerate(by_bm25)}

            by_heur = sorted(scored_candidates, key=lambda x: x[0], reverse=True)
            heur_ranks = {item[2]["id"]: i + 1 for i, item in enumerate(by_heur)}

            k = 60.0
            max_rrf = (0.35 / (k + 1.0)) + (0.35 / (k + 1.0)) + (0.30 / (k + 1.0))
            rrf_candidates: List[Tuple[float, List[str], Any, float, float]] = []
            for score, reasons, r, bm25_v, sem_v in scored_candidates:
                r_sem = sem_ranks.get(r["id"], len(scored_candidates) + 50)
                r_bm25 = bm25_ranks.get(r["id"], len(scored_candidates) + 50)
                r_heur = heur_ranks.get(r["id"], len(scored_candidates) + 50)
                raw_rrf = (0.35 / (k + r_sem)) + (0.35 / (k + r_bm25)) + (0.30 / (k + r_heur))
                norm_rrf = round(raw_rrf / max_rrf, 4)
                reasons_with_rrf = reasons + [f"RRF score: {norm_rrf:.2f}"]
                rrf_candidates.append((norm_rrf, reasons_with_rrf, r, bm25_v, sem_v))

            scored_candidates = rrf_candidates

        # Sort descending by score
        scored_candidates.sort(key=lambda x: x[0], reverse=True)
        top_candidates = scored_candidates[:limit]

        results: List[Candidate] = []
        cumulative_tokens = 0

        for score, reasons, r, _bm25_v, _sem_v in top_candidates:
            sym_id = r["id"]
            sym_name = r["name"]

            # Extract bounded evidence window
            evidence = self.get_snippet(
                sym_id, window_lines=window_lines, max_snippet_lines=60
            ) or EvidenceWindow(start_line=r["start_line"], end_line=r["end_line"])

            # Expand bounded graph neighborhood
            neighbors: List[str] = []
            if expand_graph:
                neighbors = self._expand_bounded_neighbors(
                    sym_name, max_depth=max_depth, max_fanout=max_fanout
                )

            cand = Candidate(
                symbol_id=str(sym_id),
                score=score,
                reasons=reasons,
                neighbors=neighbors,
                evidence_window=evidence,
                name=sym_name,
                kind=r["kind"],
                file_path=r["file_path"],
                start_line=r["start_line"],
                end_line=r["end_line"],
                confidence=r["confidence"],
                signature=r["signature"],
            )

            cand_tokens = estimate_tokens(evidence.snippet)
            if max_tokens and (cumulative_tokens + cand_tokens > max_tokens) and results:
                # Token budget reached: stop appending lower candidates
                break

            cumulative_tokens += cand_tokens
            results.append(cand)

        return results

    def _expand_bounded_neighbors(
        self,
        start_symbol: str,
        max_depth: int = 1,
        max_fanout: int = 5,
        max_total_nodes: int = 15,
    ) -> List[str]:
        """Expand bounded 1-to-k hop graph neighbors with fan-out capping."""
        max_depth = max(1, min(int(max_depth), 3))
        max_fanout = max(1, min(int(max_fanout), 20))
        max_total_nodes = max(1, min(int(max_total_nodes), 50))

        cur = self.conn.cursor()
        visited: Set[str] = {start_symbol}
        current_level: Set[str] = {start_symbol}

        for _ in range(max_depth):
            next_level: Set[str] = set()
            for node in current_level:
                if len(visited) >= max_total_nodes:
                    break

                # Query outgoing and incoming edges for node
                cur.execute(
                    """
                    SELECT dst as neighbor FROM edges
                    WHERE src = ? AND confidence >= 0.60 AND dst != ?
                    LIMIT ?
                    """,
                    (node, node, max_fanout),
                )
                for row in cur.fetchall():
                    nbr = row["neighbor"]
                    if nbr not in BUILTIN_CALL_NOISE and nbr not in visited:
                        visited.add(nbr)
                        next_level.add(nbr)
                        if len(visited) >= max_total_nodes:
                            break

                if len(visited) >= max_total_nodes:
                    break

                cur.execute(
                    """
                    SELECT src as neighbor FROM edges
                    WHERE dst = ? AND confidence >= 0.60 AND src != ?
                    LIMIT ?
                    """,
                    (node, node, max_fanout),
                )
                for row in cur.fetchall():
                    nbr = row["neighbor"]
                    if nbr not in BUILTIN_CALL_NOISE and nbr not in visited:
                        visited.add(nbr)
                        next_level.add(nbr)
                        if len(visited) >= max_total_nodes:
                            break

            current_level = next_level
            if not current_level:
                break

        visited.discard(start_symbol)
        return sorted(visited)

    def retrieve_bundle(
        self,
        query: str,
        kind: Optional[str] = None,
        language: Optional[str] = None,
        file_path: Optional[str] = None,
        limit: int = 5,
        max_tokens: int = 2048,
        window_lines: int = 3,
        max_depth: int = 1,
        max_fanout: int = 5,
        ranking_method: str = "hybrid",
    ) -> EvidenceBundle:
        """Assemble a complete, token-bounded EvidenceBundle for an agent query."""
        candidates = self.search_symbols(
            query=query,
            kind=kind,
            language=language,
            file_path=file_path,
            limit=limit,
            expand_graph=True,
            max_depth=max_depth,
            max_fanout=max_fanout,
            window_lines=window_lines,
            max_tokens=max_tokens,
            ranking_method=ranking_method,
        )

        # Assemble compact symbol list
        symbols_list: List[Dict[str, Any]] = []
        files_set: Set[str] = set()
        relationships: List[Dict[str, Any]] = []
        total_tokens = 0

        cur = self.conn.cursor()
        for c in candidates:
            symbols_list.append({
                "id": c.symbol_id,
                "name": c.name,
                "kind": c.kind,
                "file_path": c.file_path,
                "start_line": c.start_line,
                "end_line": c.end_line,
                "score": c.score,
                "signature": c.signature,
                "reasons": c.reasons,
            })
            if c.file_path:
                files_set.add(c.file_path)

            if c.evidence_window and c.evidence_window.snippet:
                total_tokens += estimate_tokens(c.evidence_window.snippet)

            # Collect edges touching top candidates
            if c.name:
                cur.execute(
                    """
                    SELECT src, dst, relation, confidence, line_number
                    FROM edges
                    WHERE (src = ? OR dst = ?) AND confidence >= 0.60
                    LIMIT ?
                    """,
                    (c.name, c.name, max_fanout),
                )
                for er in cur.fetchall():
                    if er["dst"] in BUILTIN_CALL_NOISE:
                        continue
                    edge_dict = {
                        "src": er["src"],
                        "dst": er["dst"],
                        "relation": er["relation"],
                        "confidence": er["confidence"],
                        "line_number": er["line_number"],
                    }
                    if edge_dict not in relationships:
                        relationships.append(edge_dict)

        # Fetch file records
        files_list: List[Dict[str, Any]] = []
        for path_str in sorted(files_set):
            cur.execute(
                "SELECT path, language, category, total_lines FROM files WHERE path = ?",
                (path_str,),
            )
            frow = cur.fetchone()
            if frow:
                files_list.append({
                    "path": frow["path"],
                    "language": frow["language"],
                    "category": frow["category"],
                    "total_lines": frow["total_lines"],
                })

        snippets_list: List[Dict[str, Any]] = []
        for c in candidates:
            if c.evidence_window and c.evidence_window.snippet:
                snippets_list.append({
                    "symbol_id": c.symbol_id,
                    "name": c.name,
                    "file_path": c.file_path,
                    "start_line": c.evidence_window.start_line,
                    "end_line": c.evidence_window.end_line,
                    "code": c.evidence_window.snippet,
                    "tokens_estimate": estimate_tokens(c.evidence_window.snippet),
                })

        meta_info = {
            "query": query,
            "total_candidates": len(candidates),
            "total_symbols": len(symbols_list),
            "total_files": len(files_list),
            "total_relationships": len(relationships),
            "total_snippets": len(snippets_list),
            "total_tokens_estimate": total_tokens,
            "max_tokens_budget": max_tokens,
            "truncated": total_tokens >= max_tokens,
        }

        return EvidenceBundle(
            query=query,
            candidates=candidates,
            symbols=symbols_list,
            files=files_list,
            relationships=relationships,
            snippets=snippets_list,
            meta=meta_info,
            total_tokens_estimate=total_tokens,
        )

    def get_file_outline(
        self, file_path: Union[Path, str], max_docstring_chars: int = 100
    ) -> Optional[Dict[str, Any]]:
        """Retrieve structural outline of a file without full code dumps."""
        from fastast.evidence import EvidenceMaterializer
        materializer = EvidenceMaterializer(self.conn, repo_root=self.repo_root)
        return materializer.get_file_outline(file_path, max_docstring_chars=max_docstring_chars)

    def get_symbol_evidence(
        self,
        name_or_id: Union[int, str],
        window_lines: int = 3,
        max_snippet_lines: int = 50,
        max_neighbors: int = 5,
    ) -> Optional[Dict[str, Any]]:
        """Retrieve complete, bounded evidence package for a single symbol."""
        from fastast.evidence import EvidenceMaterializer
        materializer = EvidenceMaterializer(self.conn, repo_root=self.repo_root)
        return materializer.get_symbol_evidence(
            name_or_id,
            window_lines=window_lines,
            max_snippet_lines=max_snippet_lines,
            max_neighbors=max_neighbors,
        )

    def build_evidence_bundle(self, *args, **kwargs) -> EvidenceBundle:
        """Alias for retrieve_bundle."""
        return self.retrieve_bundle(*args, **kwargs)


# ── Standalone API Functions ─────────────────────────────────────────────────

def _get_default_engine(
    db_or_conn: Optional[Union[sqlite3.Connection, Path, str]] = None,
    repo_root: Optional[Union[Path, str]] = None,
) -> RetrievalEngine:
    """Resolve or locate database and instantiate RetrievalEngine."""
    if db_or_conn is not None:
        return RetrievalEngine(db_or_conn, repo_root=repo_root)

    root = Path(repo_root) if repo_root else Path.cwd()
    db_path = root / ".fastast.db"
    if not db_path.exists():
        # Check current directory
        alt = Path.cwd() / ".fastast.db"
        if alt.exists():
            db_path = alt

    if not db_path.exists():
        from fastast.indexer import index_repository
        index_repository(str(root))

    return RetrievalEngine(db_path, repo_root=root)


def search_symbols(
    query_or_conn: Union[str, sqlite3.Connection, Path],
    query: Optional[str] = None,
    kind: Optional[str] = None,
    language: Optional[str] = None,
    file_path: Optional[str] = None,
    limit: int = 10,
    min_score: float = 0.25,
    expand_graph: bool = True,
    max_depth: int = 1,
    max_fanout: int = 5,
    window_lines: int = 3,
    max_tokens: Optional[int] = None,
    ranking_method: str = "hybrid",
    repo_root: Optional[Union[Path, str]] = None,
) -> List[Candidate]:
    """Search and rank candidate symbols with bounded evidence, graph neighbors, and BM25 hybrid ranking."""
    if isinstance(query_or_conn, (sqlite3.Connection, Path)) and query is not None:
        engine = RetrievalEngine(query_or_conn, repo_root=repo_root)
        actual_query = query
    elif isinstance(query_or_conn, str) and query is None:
        engine = _get_default_engine(repo_root=repo_root)
        actual_query = query_or_conn
    else:
        actual_query = str(query if query is not None else query_or_conn)
        engine = _get_default_engine(repo_root=repo_root)

    return engine.search_symbols(
        query=actual_query,
        kind=kind,
        language=language,
        file_path=file_path,
        limit=limit,
        min_score=min_score,
        expand_graph=expand_graph,
        max_depth=max_depth,
        max_fanout=max_fanout,
        window_lines=window_lines,
        max_tokens=max_tokens,
        ranking_method=ranking_method,
    )


def get_symbol_by_name(
    name: str,
    file_path: Optional[str] = None,
    db_or_conn: Optional[Union[sqlite3.Connection, Path, str]] = None,
    repo_root: Optional[Union[Path, str]] = None,
) -> List[SymbolRecord]:
    """Exact lookup of symbol records by name."""
    engine = _get_default_engine(db_or_conn, repo_root=repo_root)
    return engine.get_symbol_by_name(name, file_path=file_path)


def get_symbol_by_path(
    path: str,
    db_or_conn: Optional[Union[sqlite3.Connection, Path, str]] = None,
    repo_root: Optional[Union[Path, str]] = None,
) -> List[SymbolRecord]:
    """Retrieve all symbols defined in a file path."""
    engine = _get_default_engine(db_or_conn, repo_root=repo_root)
    return engine.get_symbol_by_path(path)


def get_callers(
    symbol_id: Union[int, str],
    limit: int = 20,
    db_or_conn: Optional[Union[sqlite3.Connection, Path, str]] = None,
    repo_root: Optional[Union[Path, str]] = None,
) -> List[Dict[str, Any]]:
    """Retrieve callers for a symbol."""
    engine = _get_default_engine(db_or_conn, repo_root=repo_root)
    return engine.get_callers(symbol_id, limit=limit)


def get_callees(
    symbol_id: Union[int, str],
    limit: int = 20,
    db_or_conn: Optional[Union[sqlite3.Connection, Path, str]] = None,
    repo_root: Optional[Union[Path, str]] = None,
) -> List[Dict[str, Any]]:
    """Retrieve callees for a symbol."""
    engine = _get_default_engine(db_or_conn, repo_root=repo_root)
    return engine.get_callees(symbol_id, limit=limit)


def get_related_files(
    symbol_id: Union[int, str],
    db_or_conn: Optional[Union[sqlite3.Connection, Path, str]] = None,
    repo_root: Optional[Union[Path, str]] = None,
) -> List[Dict[str, Any]]:
    """Retrieve repository files related to a symbol."""
    engine = _get_default_engine(db_or_conn, repo_root=repo_root)
    return engine.get_related_files(symbol_id)


def get_snippet(
    symbol_id: Union[int, str],
    window_lines: int = 5,
    max_snippet_lines: int = 60,
    db_or_conn: Optional[Union[sqlite3.Connection, Path, str]] = None,
    repo_root: Optional[Union[Path, str]] = None,
) -> Optional[EvidenceWindow]:
    """Retrieve minimal bounded evidence window around a symbol definition."""
    engine = _get_default_engine(db_or_conn, repo_root=repo_root)
    return engine.get_snippet(
        symbol_id, window_lines=window_lines, max_snippet_lines=max_snippet_lines
    )


def search_files(
    query: str,
    limit: int = 20,
    db_or_conn: Optional[Union[sqlite3.Connection, Path, str]] = None,
    repo_root: Optional[Union[Path, str]] = None,
) -> List[Dict[str, Any]]:
    """Search and rank repository files matching a query."""
    engine = _get_default_engine(db_or_conn, repo_root=repo_root)
    return engine.search_files(query, limit=limit)


def retrieve_bundle(
    query: str,
    kind: Optional[str] = None,
    language: Optional[str] = None,
    file_path: Optional[str] = None,
    limit: int = 5,
    max_tokens: int = 2048,
    window_lines: int = 3,
    max_depth: int = 1,
    max_fanout: int = 5,
    ranking_method: str = "hybrid",
    db_or_conn: Optional[Union[sqlite3.Connection, Path, str]] = None,
    repo_root: Optional[Union[Path, str]] = None,
) -> EvidenceBundle:
    """Retrieve structured EvidenceBundle for an agent query with BM25 hybrid ranking."""
    engine = _get_default_engine(db_or_conn, repo_root=repo_root)
    return engine.retrieve_bundle(
        query=query,
        kind=kind,
        language=language,
        file_path=file_path,
        limit=limit,
        max_tokens=max_tokens,
        window_lines=window_lines,
        max_depth=max_depth,
        max_fanout=max_fanout,
        ranking_method=ranking_method,
    )


def build_evidence_bundle(
    query: Optional[str] = None,
    candidates: Optional[List[Candidate]] = None,
    kind: Optional[str] = None,
    language: Optional[str] = None,
    file_path: Optional[str] = None,
    limit: int = 5,
    max_tokens: int = 2048,
    window_lines: int = 3,
    max_snippet_lines: int = 40,
    max_depth: int = 1,
    max_fanout: int = 5,
    ranking_method: str = "hybrid",
    db_or_conn: Optional[Union[sqlite3.Connection, Path, str]] = None,
    repo_root: Optional[Union[Path, str]] = None,
) -> EvidenceBundle:
    """Build a complete, token-bounded EvidenceBundle."""
    from fastast.evidence import build_evidence_bundle as do_build
    return do_build(
        query=query,
        candidates=candidates,
        limit=limit,
        max_tokens=max_tokens,
        window_lines=window_lines,
        max_snippet_lines=max_snippet_lines,
        max_depth=max_depth,
        max_fanout=max_fanout,
        kind=kind,
        language=language,
        file_path=file_path,
        ranking_method=ranking_method,
        db_or_conn=db_or_conn,
        repo_root=repo_root,
    )


def get_file_outline(
    file_path: Union[Path, str],
    db_or_conn: Optional[Union[sqlite3.Connection, Path, str]] = None,
    repo_root: Optional[Union[Path, str]] = None,
    max_docstring_chars: int = 100,
) -> Optional[Dict[str, Any]]:
    """Retrieve structural outline of a file without full code dumps."""
    from fastast.evidence import get_file_outline as do_outline
    return do_outline(
        file_path,
        db_or_conn=db_or_conn,
        repo_root=repo_root,
        max_docstring_chars=max_docstring_chars,
    )


def get_symbol_evidence(
    name_or_id: Union[int, str],
    db_or_conn: Optional[Union[sqlite3.Connection, Path, str]] = None,
    repo_root: Optional[Union[Path, str]] = None,
    window_lines: int = 3,
    max_snippet_lines: int = 50,
    max_neighbors: int = 5,
) -> Optional[Dict[str, Any]]:
    """Retrieve structured symbol evidence package (metadata, snippet, neighbors)."""
    from fastast.evidence import get_symbol_evidence as do_evidence
    return do_evidence(
        name_or_id,
        db_or_conn=db_or_conn,
        repo_root=repo_root,
        window_lines=window_lines,
        max_snippet_lines=max_snippet_lines,
        max_neighbors=max_neighbors,
    )

