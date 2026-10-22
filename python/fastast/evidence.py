"""Phase 6: Evidence Materializer (File-level pruning).

Converts ranked graph and retrieval results into compact, token-conscious,
agent-safe evidence packages:
- Extracts exact definition ranges and bounded snippet windows (never full files by default)
- Generates structural file outlines (classes, methods, functions) without raw source dumps
- Assembles rich symbol evidence bundles with definition metadata, snippets, and key neighbors
- Enforces strict token and line budgets with omission indicators
- Degrades gracefully on missing or unreadable files
"""

import re
import sqlite3
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional, Set, Tuple, Union

from fastast.graph import BUILTIN_CALL_NOISE
from fastast.model import Candidate, EvidenceWindow, SymbolRecord
from fastast.retrieval import EvidenceBundle, RetrievalEngine, estimate_tokens


class EvidenceMaterializer:
    """Production-grade evidence materializer for AI coding agents."""

    def __init__(
        self,
        db_or_conn: Union[sqlite3.Connection, Path, str] = ".fastast.db",
        repo_root: Optional[Union[Path, str]] = None,
    ):
        if isinstance(db_or_conn, sqlite3.Connection):
            self.conn = db_or_conn
            self._close_conn = False
            self.repo_root = Path(repo_root) if repo_root else Path(".")
        else:
            db_path = Path(db_or_conn)
            if not db_path.exists() and repo_root:
                candidate = Path(repo_root) / db_path.name
                if candidate.exists():
                    db_path = candidate

            from fastast.db import get_connection, init_db

            if not db_path.exists():
                # Allow creating or initializing if pointing to a planned db path
                conn = get_connection(db_path)
                init_db(conn)
                self.conn = conn
            else:
                self.conn = get_connection(db_path)
            self._close_conn = True
            self.repo_root = Path(repo_root) if repo_root else db_path.parent

        self._retrieval_engine = RetrievalEngine(self.conn, repo_root=self.repo_root)

    def close(self) -> None:
        if self._close_conn and self.conn:
            self.conn.close()

    def __enter__(self) -> "EvidenceMaterializer":
        return self

    def __exit__(self, exc_type, exc_val, exc_tb) -> None:
        self.close()

    # ── 1. Snippet Extraction ────────────────────────────────────────────────

    def get_snippet(
        self,
        symbol_id_or_name: Optional[Union[int, str]] = None,
        file_path: Optional[Union[Path, str]] = None,
        start_line: Optional[int] = None,
        end_line: Optional[int] = None,
        window_lines: int = 3,
        max_snippet_lines: int = 60,
    ) -> Optional[EvidenceWindow]:
        """Extract a bounded source snippet with optional window padding.

        Accepts either:
        - `symbol_id_or_name`: resolves symbol definition lines and file from SQLite
        - `file_path` + `start_line` (+ optional `end_line`): slices file directly

        Caps snippet length to `max_snippet_lines` with an omission indicator.
        Degrades gracefully if file is missing on disk.
        """
        resolved_file: Optional[str] = None
        s_line: int = 1
        e_line: int = 1

        if symbol_id_or_name is not None:
            cur = self.conn.cursor()
            if isinstance(symbol_id_or_name, int) or str(symbol_id_or_name).isdigit():
                cur.execute(
                    """
                    SELECT s.id, s.name, s.start_line, s.end_line, f.path as file_path
                    FROM symbols s
                    JOIN files f ON s.file_id = f.id
                    WHERE s.id = ?
                    """,
                    (int(symbol_id_or_name),),
                )
            else:
                cur.execute(
                    """
                    SELECT s.id, s.name, s.start_line, s.end_line, f.path as file_path
                    FROM symbols s
                    JOIN files f ON s.file_id = f.id
                    WHERE s.name = ?
                    ORDER BY (s.end_line - s.start_line) DESC
                    LIMIT 1
                    """,
                    (str(symbol_id_or_name),),
                )
            row = cur.fetchone()
            if not row:
                return None
            resolved_file = row["file_path"]
            s_line = row["start_line"]
            e_line = row["end_line"]
        elif file_path is not None and start_line is not None:
            resolved_file = str(file_path)
            s_line = start_line
            e_line = end_line if end_line is not None else start_line
        else:
            return None

        bounded_start = max(1, s_line - window_lines)
        bounded_end = max(bounded_start, e_line + window_lines)

        # Locate file on disk
        target_path: Optional[Path] = None
        candidates = [
            Path(resolved_file),
            self.repo_root / resolved_file,
            Path.cwd() / resolved_file,
        ]
        for p in candidates:
            if p.exists() and p.is_file():
                target_path = p
                break

        if not target_path:
            # Degrade gracefully on missing file: return bounded coordinates without code
            return EvidenceWindow(
                start_line=bounded_start,
                end_line=bounded_end,
                snippet=None,
            )

        try:
            with open(target_path, "r", encoding="utf-8", errors="replace") as f:
                all_lines = f.readlines()

            total_lines = len(all_lines)
            actual_start = max(1, min(bounded_start, total_lines))
            actual_end = max(actual_start, min(bounded_end, total_lines))

            selected_lines = all_lines[actual_start - 1 : actual_end]

            if len(selected_lines) > max_snippet_lines:
                head_count = max(1, max_snippet_lines - 12)
                tail_count = 12
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
                start_line=actual_start,
                end_line=actual_end,
                snippet=snippet_str,
            )
        except Exception:
            return EvidenceWindow(
                start_line=bounded_start,
                end_line=bounded_end,
                snippet=None,
            )

    # ── 2. Symbol Evidence Packaging ─────────────────────────────────────────

    def get_symbol_evidence(
        self,
        name_or_id: Union[int, str],
        window_lines: int = 3,
        max_snippet_lines: int = 50,
        max_neighbors: int = 5,
    ) -> Optional[Dict[str, Any]]:
        """Retrieve complete, bounded evidence package for a single symbol.

        Includes:
        - Symbol definition metadata (name, kind, signature, line numbers, docstring)
        - Bounded definition code snippet
        - 1-hop incoming callers and outgoing callees
        - Structural parent-child relationships (defines) and inheritance
        - Related files connected through the graph
        """
        cur = self.conn.cursor()
        if isinstance(name_or_id, int) or str(name_or_id).isdigit():
            cur.execute(
                """
                SELECT s.id, s.name, s.kind, s.signature, s.start_line, s.end_line,
                       s.confidence, s.docstring, f.path as file_path, f.language as language,
                       p.name as parent_name
                FROM symbols s
                JOIN files f ON s.file_id = f.id
                LEFT JOIN symbols p ON s.parent_symbol_id = p.id
                WHERE s.id = ?
                """,
                (int(name_or_id),),
            )
        else:
            cur.execute(
                """
                SELECT s.id, s.name, s.kind, s.signature, s.start_line, s.end_line,
                       s.confidence, s.docstring, f.path as file_path, f.language as language,
                       p.name as parent_name
                FROM symbols s
                JOIN files f ON s.file_id = f.id
                LEFT JOIN symbols p ON s.parent_symbol_id = p.id
                WHERE s.name = ?
                ORDER BY (s.end_line - s.start_line) DESC
                LIMIT 1
                """,
                (str(name_or_id),),
            )

        row = cur.fetchone()
        if not row:
            return None

        sym_id = row["id"]
        sym_name = row["name"]
        file_path = row["file_path"]

        # Extract bounded snippet
        window = self.get_snippet(
            symbol_id_or_name=sym_id,
            window_lines=window_lines,
            max_snippet_lines=max_snippet_lines,
        )

        # Graph neighbors: callers & callees
        callers = self._retrieval_engine.get_callers(sym_id, limit=max_neighbors)
        callees = self._retrieval_engine.get_callees(sym_id, limit=max_neighbors)

        # Defines & Inherits edges
        defines_edges: List[Dict[str, Any]] = []
        inherits_edges: List[Dict[str, Any]] = []

        cur.execute(
            """
            SELECT e.src, e.dst, e.relation, e.confidence, e.line_number, f.path as file_path
            FROM edges e
            JOIN files f ON e.file_id = f.id
            WHERE (e.src = ? OR e.dst = ?) AND e.relation IN ('defines', 'inherits')
            LIMIT ?
            """,
            (sym_name, sym_name, max_neighbors * 2),
        )
        for er in cur.fetchall():
            item = {
                "src": er["src"],
                "dst": er["dst"],
                "relation": er["relation"],
                "confidence": er["confidence"],
                "line_number": er["line_number"],
                "file_path": er["file_path"],
            }
            if er["relation"] == "defines":
                defines_edges.append(item)
            elif er["relation"] == "inherits":
                inherits_edges.append(item)

        # Related files
        related_files = self._retrieval_engine.get_related_files(sym_id)

        tokens_est = estimate_tokens(window.snippet) if (window and window.snippet) else 0

        return {
            "symbol": {
                "id": row["id"],
                "name": row["name"],
                "kind": row["kind"],
                "signature": row["signature"],
                "docstring": row["docstring"],
                "file_path": row["file_path"],
                "language": row["language"],
                "start_line": row["start_line"],
                "end_line": row["end_line"],
                "confidence": row["confidence"],
                "parent_name": row["parent_name"],
            },
            "snippet": {
                "start_line": window.start_line if window else row["start_line"],
                "end_line": window.end_line if window else row["end_line"],
                "code": window.snippet if window else None,
                "lines_count": len((window.snippet or "").splitlines()) if window and window.snippet else 0,
                "tokens_estimate": tokens_est,
            },
            "relationships": {
                "callers": callers[:max_neighbors],
                "callees": callees[:max_neighbors],
                "defines": defines_edges[:max_neighbors],
                "inherits": inherits_edges[:max_neighbors],
            },
            "related_files": related_files[:max_neighbors],
        }

    # ── 3. Compact File Outline ──────────────────────────────────────────────

    def get_file_outline(
        self,
        file_path: Union[Path, str],
        max_docstring_chars: int = 100,
    ) -> Optional[Dict[str, Any]]:
        """Generate a compact structural outline of a file without dumping its raw content.

        Returns:
        - File metadata (path, language, category, total_lines)
        - Classes with their member methods, signatures, and line spans
        - Top-level functions with signatures and line spans
        - Imports summary
        - Never outputs full file source code body
        """
        cur = self.conn.cursor()
        path_str = str(file_path).strip()

        cur.execute(
            """
            SELECT id, path, language, category, total_lines
            FROM files
            WHERE path = ? OR path LIKE ?
            LIMIT 1
            """,
            (path_str, f"%{path_str}"),
        )
        file_row = cur.fetchone()
        if not file_row:
            return None

        file_id = file_row["id"]
        rel_path = file_row["path"]

        # Fetch symbols ordered by line
        cur.execute(
            """
            SELECT s.id, s.name, s.kind, s.signature, s.start_line, s.end_line,
                   s.confidence, s.docstring, s.parent_symbol_id, p.name as parent_name
            FROM symbols s
            LEFT JOIN symbols p ON s.parent_symbol_id = p.id
            WHERE s.file_id = ?
            ORDER BY s.start_line ASC
            """,
            (file_id,),
        )
        symbols = cur.fetchall()

        # Fetch imports
        cur.execute(
            """
            SELECT module, name, alias, line_number
            FROM imports
            WHERE file_id = ?
            ORDER BY line_number ASC
            """,
            (file_id,),
        )
        imports = [
            {
                "module": r["module"],
                "name": r["name"],
                "alias": r["alias"],
                "line": r["line_number"],
            }
            for r in cur.fetchall()
        ]

        classes: List[Dict[str, Any]] = []
        functions: List[Dict[str, Any]] = []
        other_symbols: List[Dict[str, Any]] = []

        class_map: Dict[str, Dict[str, Any]] = {}

        # First pass: collect classes
        for s in symbols:
            kind = s["kind"].lower()
            doc_sum = None
            if s["docstring"]:
                first_line = s["docstring"].strip().splitlines()[0].strip()
                doc_sum = first_line[:max_docstring_chars]

            if kind in {"class", "interface", "struct", "trait"}:
                c_info = {
                    "name": s["name"],
                    "kind": s["kind"],
                    "signature": s["signature"],
                    "start_line": s["start_line"],
                    "end_line": s["end_line"],
                    "docstring_summary": doc_sum,
                    "methods": [],
                }
                classes.append(c_info)
                class_map[s["name"]] = c_info

        # Second pass: methods and functions
        for s in symbols:
            kind = s["kind"].lower()
            parent = s["parent_name"]
            doc_sum = None
            if s["docstring"]:
                first_line = s["docstring"].strip().splitlines()[0].strip()
                doc_sum = first_line[:max_docstring_chars]

            if parent and parent in class_map:
                class_map[parent]["methods"].append({
                    "name": s["name"],
                    "kind": s["kind"],
                    "signature": s["signature"],
                    "start_line": s["start_line"],
                    "end_line": s["end_line"],
                    "docstring_summary": doc_sum,
                })
            elif kind in {"class", "interface", "struct", "trait"}:
                continue
            elif "function" in kind or kind == "method":
                functions.append({
                    "name": s["name"],
                    "kind": s["kind"],
                    "signature": s["signature"],
                    "start_line": s["start_line"],
                    "end_line": s["end_line"],
                    "docstring_summary": doc_sum,
                })
            else:
                other_symbols.append({
                    "name": s["name"],
                    "kind": s["kind"],
                    "signature": s["signature"],
                    "start_line": s["start_line"],
                    "end_line": s["end_line"],
                })

        return {
            "file_path": rel_path,
            "language": file_row["language"],
            "category": file_row["category"],
            "total_lines": file_row["total_lines"],
            "total_symbols": len(symbols),
            "total_imports": len(imports),
            "classes": classes,
            "functions": functions,
            "other_symbols": other_symbols,
            "imports": imports,
        }

    # ── 4. Evidence Bundle Builder ───────────────────────────────────────────

    def build_evidence_bundle(
        self,
        query: Optional[str] = None,
        candidates: Optional[List[Candidate]] = None,
        limit: int = 5,
        max_tokens: int = 2048,
        window_lines: int = 3,
        max_snippet_lines: int = 40,
        max_depth: int = 1,
        max_fanout: int = 5,
        kind: Optional[str] = None,
        language: Optional[str] = None,
        file_path: Optional[str] = None,
        ranking_method: str = "hybrid",
    ) -> EvidenceBundle:
        """Assemble an agent-safe, token-bounded EvidenceBundle.

        Balances snippet detail against token budget:
        - Includes high-confidence candidates and key relationships
        - Binds snippet line counts
        - If budget is saturated, sets truncated=True and retains remaining symbols
          as structural metadata without raw code
        """
        if candidates is None:
            if not query or not query.strip():
                return EvidenceBundle(query=query or "", meta={"total_candidates": 0, "truncated": False})
            candidates = self._retrieval_engine.search_symbols(
                query=query.strip(),
                kind=kind,
                language=language,
                file_path=file_path,
                limit=limit,
                expand_graph=True,
                max_depth=max_depth,
                max_fanout=max_fanout,
                window_lines=window_lines,
                max_tokens=None,  # Materializer enforces the snippet token budget and truncation
                ranking_method=ranking_method,
            )

        cur = self.conn.cursor()
        symbols_list: List[Dict[str, Any]] = []
        snippets_list: List[Dict[str, Any]] = []
        files_set: Set[str] = set()
        relationships: List[Dict[str, Any]] = []

        total_tokens = 0
        truncated = False

        for c in candidates:
            sym_dict = {
                "id": c.symbol_id,
                "name": c.name,
                "kind": c.kind,
                "file_path": c.file_path,
                "start_line": c.start_line,
                "end_line": c.end_line,
                "score": c.score,
                "signature": c.signature,
                "reasons": c.reasons,
            }
            symbols_list.append(sym_dict)
            if c.file_path:
                files_set.add(c.file_path)

            # Snippet extraction with token budget enforcement
            if c.evidence_window and c.evidence_window.snippet:
                snippet_code = c.evidence_window.snippet
                toks = estimate_tokens(snippet_code)
                if total_tokens + toks <= max_tokens:
                    total_tokens += toks
                    snippets_list.append({
                        "symbol_id": c.symbol_id,
                        "name": c.name,
                        "file_path": c.file_path,
                        "start_line": c.evidence_window.start_line,
                        "end_line": c.evidence_window.end_line,
                        "code": snippet_code,
                        "tokens_estimate": toks,
                    })
                else:
                    truncated = True

            # Collect key relationships
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

        # File metadata
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

        meta_info = {
            "query": query or "",
            "total_candidates": len(candidates),
            "total_symbols": len(symbols_list),
            "total_snippets": len(snippets_list),
            "total_files": len(files_list),
            "total_relationships": len(relationships),
            "total_tokens_estimate": total_tokens,
            "max_tokens_budget": max_tokens,
            "truncated": truncated,
        }

        return EvidenceBundle(
            query=query or "",
            candidates=candidates,
            symbols=symbols_list,
            files=files_list,
            relationships=relationships,
            snippets=snippets_list,
            meta=meta_info,
            total_tokens_estimate=total_tokens,
        )


# ── Standalone Convenience API Functions ─────────────────────────────────────

def _get_default_materializer(
    db_or_conn: Optional[Union[sqlite3.Connection, Path, str]] = None,
    repo_root: Optional[Union[Path, str]] = None,
) -> EvidenceMaterializer:
    if db_or_conn is not None:
        return EvidenceMaterializer(db_or_conn, repo_root=repo_root)

    root = Path(repo_root or ".").resolve()
    db_path = root / ".fastast.db"
    if not db_path.exists():
        from fastast.indexer import index_repository
        index_repository(str(root))
    return EvidenceMaterializer(db_path, repo_root=root)


def get_symbol_evidence(
    name_or_id: Union[int, str],
    db_or_conn: Optional[Union[sqlite3.Connection, Path, str]] = None,
    repo_root: Optional[Union[Path, str]] = None,
    window_lines: int = 3,
    max_snippet_lines: int = 50,
    max_neighbors: int = 5,
) -> Optional[Dict[str, Any]]:
    """Retrieve structured symbol evidence package (metadata, snippet, neighbors)."""
    materializer = _get_default_materializer(db_or_conn, repo_root=repo_root)
    return materializer.get_symbol_evidence(
        name_or_id,
        window_lines=window_lines,
        max_snippet_lines=max_snippet_lines,
        max_neighbors=max_neighbors,
    )


def get_snippet(
    symbol_id_or_name: Optional[Union[int, str]] = None,
    file_path: Optional[Union[Path, str]] = None,
    start_line: Optional[int] = None,
    end_line: Optional[int] = None,
    window_lines: int = 3,
    max_snippet_lines: int = 60,
    db_or_conn: Optional[Union[sqlite3.Connection, Path, str]] = None,
    repo_root: Optional[Union[Path, str]] = None,
) -> Optional[EvidenceWindow]:
    """Retrieve bounded code snippet for a symbol or file line range."""
    materializer = _get_default_materializer(db_or_conn, repo_root=repo_root)
    return materializer.get_snippet(
        symbol_id_or_name=symbol_id_or_name,
        file_path=file_path,
        start_line=start_line,
        end_line=end_line,
        window_lines=window_lines,
        max_snippet_lines=max_snippet_lines,
    )


def get_file_outline(
    file_path: Union[Path, str],
    db_or_conn: Optional[Union[sqlite3.Connection, Path, str]] = None,
    repo_root: Optional[Union[Path, str]] = None,
    max_docstring_chars: int = 100,
) -> Optional[Dict[str, Any]]:
    """Retrieve structural outline of a file without full code dumps."""
    materializer = _get_default_materializer(db_or_conn, repo_root=repo_root)
    return materializer.get_file_outline(file_path, max_docstring_chars=max_docstring_chars)


def build_evidence_bundle(
    query: Optional[str] = None,
    candidates: Optional[List[Candidate]] = None,
    limit: int = 5,
    max_tokens: int = 2048,
    window_lines: int = 3,
    max_snippet_lines: int = 40,
    max_depth: int = 1,
    max_fanout: int = 5,
    kind: Optional[str] = None,
    language: Optional[str] = None,
    file_path: Optional[str] = None,
    ranking_method: str = "hybrid",
    db_or_conn: Optional[Union[sqlite3.Connection, Path, str]] = None,
    repo_root: Optional[Union[Path, str]] = None,
) -> EvidenceBundle:
    """Build a complete, token-bounded EvidenceBundle."""
    materializer = _get_default_materializer(db_or_conn, repo_root=repo_root)
    return materializer.build_evidence_bundle(
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
    )
