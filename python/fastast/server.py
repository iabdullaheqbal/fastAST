"""FastAST MCP Server for AST-based repository indexing and codebase-memory retrieval.

Provides a comprehensive, standardized tool suite for AI coding agents
(Claude Code, Cursor, Windsurf, SWE-bench) over stdio JSON-RPC 2.0.
"""

import json
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union

try:
    from mcp.server.fastmcp import FastMCP
    MCP_AVAILABLE = True
except (ImportError, ModuleNotFoundError):
    try:
        from mcp.server.mcpserver import MCPServer as FastMCP
        MCP_AVAILABLE = True
    except (ImportError, ModuleNotFoundError):
        MCP_AVAILABLE = False
        FastMCP = None

from fastast.db import (
    get_call_graph as db_get_call_graph,
    get_connection,
    get_graph_neighborhood as db_get_graph_neighborhood,
    get_similar_symbols as db_get_similar,
    get_symbol_community as db_get_comm,
    list_communities as db_list_comm,
    search_symbols,
)
from fastast.indexer import index_repository as do_index_repository

# Supported language identifiers and common aliases
SUPPORTED_LANGUAGES = {
    "python",
    "py",
    "javascript",
    "js",
    "jsx",
    "mjs",
    "cjs",
    "typescript",
    "ts",
    "tsx",
    "mts",
    "cts",
    "java",
    "rust",
    "rs",
    "html",
    "htm",
    "css",
    "json",
    "toml",
}

# Only create mcp instance if MCP is available
mcp = None
if MCP_AVAILABLE and FastMCP is not None:
    mcp = FastMCP("fastast")


def _resolve_repo_root(directory_path: str = ".") -> Tuple[Optional[Path], Path]:
    """Resolve directory path to a valid repository root Path."""
    path = Path(directory_path).resolve()
    if not path.exists():
        return None, path
    if path.is_file():
        path = path.parent
    return path, path


# ── 1. Repository Indexing ───────────────────────────────────────────────────


def index_repository(directory_path: str = ".", force: bool = False) -> str:
    """Scan and index source files in a repository into a persistent SQLite symbol index (.fastast.db).

    Recursively extracts functions, classes, methods, imports, and invocation calls
    for instant symbol lookup and call-graph generation. Incremental: skips unchanged
    files using SHA-256 and content-hash caching unless force is True.

    Args:
        directory_path: Path to the repository or project directory (default: current directory '.').
        force: If True, forces reindexing of all files even if unchanged (default: False).

    Returns:
        JSON string containing repository indexing statistics, counts, and metadata.
    """
    root, raw_path = _resolve_repo_root(directory_path)
    if root is None:
        return json.dumps(
            {
                "error": f"Directory not found: '{directory_path}'",
                "directory_path": str(directory_path),
                "repo_path": str(directory_path),
                "total_files": 0,
                "indexed_files": 0,
                "skipped_files": 0,
                "error_files": 0,
                "results": [],
                "meta": {},
            },
            indent=2,
        )

    try:
        res = do_index_repository(str(root), force_reindex=force)
        res["results"] = []
        res["meta"] = {
            "languages": res.get("languages", {}),
            "categories": res.get("categories", {}),
            "elapsed_ms": res.get("elapsed_ms", 0.0),
            "indexed_files": res.get("indexed_files", 0),
            "skipped_files": res.get("skipped_files", 0),
            "deleted_files": res.get("deleted_files", 0),
        }
        res["error"] = None
        return json.dumps(res, indent=2)
    except Exception as exc:
        return json.dumps(
            {
                "error": str(exc),
                "directory_path": str(directory_path),
                "repo_path": str(root),
                "total_files": 0,
                "indexed_files": 0,
                "results": [],
                "meta": {},
            },
            indent=2,
        )


# ── 2. Symbol Search ─────────────────────────────────────────────────────────


def query_symbols(
    query: str,
    kind: Optional[str] = None,
    directory_path: str = ".",
    limit: int = 50,
    language: Optional[str] = None,
) -> str:
    """Search for symbol definitions (functions, classes, methods, structs) across the indexed codebase.

    Locate symbol definitions, their exact line numbers, parameters, and docstrings
    across all supported languages (Python, JS, TS, Java, Rust, HTML, CSS, JSON, TOML).
    Automatically indexes the repository if not yet indexed.

    Args:
        query: Symbol name or substring to search for (e.g. 'authenticate_user', 'Config', 'process').
        kind: Optional symbol kind to filter by ('function', 'async_function', 'class', 'method', 'struct').
        directory_path: Path to the repository directory (default: current directory '.').
        limit: Maximum number of matching symbols to return (default: 50).
        language: Optional language to filter by ('python', 'javascript', 'typescript', 'java', 'rust', etc.).

    Returns:
        JSON string containing matching symbols, counts, and metadata.
    """
    if not query or not query.strip():
        return json.dumps(
            {
                "error": "Query cannot be empty",
                "query": query,
                "kind": kind,
                "language": language,
                "count": 0,
                "symbols": [],
                "results": [],
                "meta": {},
            },
            indent=2,
        )

    root, _ = _resolve_repo_root(directory_path)
    if root is None:
        return json.dumps(
            {
                "error": f"Directory not found: '{directory_path}'",
                "query": query,
                "kind": kind,
                "language": language,
                "count": 0,
                "symbols": [],
                "results": [],
                "meta": {},
            },
            indent=2,
        )

    db_path = root / ".fastast.db"
    try:
        if not db_path.exists():
            do_index_repository(str(root))

        conn = get_connection(db_path)
        try:
            results = search_symbols(
                conn, query.strip(), kind=kind, language=language, limit=limit
            )
            return json.dumps(
                {
                    "query": query,
                    "kind": kind,
                    "language": language,
                    "count": len(results),
                    "symbols": results,
                    "results": results,
                    "meta": {
                        "kind": kind,
                        "language": language,
                        "limit": limit,
                        "count": len(results),
                    },
                    "error": None,
                },
                indent=2,
            )
        finally:
            conn.close()
    except Exception as exc:
        return json.dumps(
            {
                "error": str(exc),
                "query": query,
                "kind": kind,
                "language": language,
                "count": 0,
                "symbols": [],
                "results": [],
                "meta": {},
            },
            indent=2,
        )


# ── 3. Call Hierarchy & Graph Neighborhood ───────────────────────────────────


def get_call_graph(
    symbol: str = "",
    symbol_name: Optional[str] = None,
    directory_path: str = ".",
) -> str:
    """Retrieve the call graph (callers and callees) for a specific function or method.

    Inspect invocation relationships across the codebase: who calls this symbol
    (callers) and what functions this symbol invokes (callees). Crucial for blast-radius
    estimation before editing or refactoring code. Automatically indexes if needed.

    Args:
        symbol: Exact name of the function or method to inspect (e.g. 'handle_request', 'validate').
        symbol_name: Backward-compatible alias for symbol.
        directory_path: Path to the repository directory (default: current directory '.').

    Returns:
        JSON string containing callers, callees, structured relationships, and metadata.
    """
    target = (symbol_name or symbol or "").strip()
    if not target:
        return json.dumps(
            {
                "error": "Symbol name cannot be empty",
                "symbol": target,
                "caller_count": 0,
                "callee_count": 0,
                "callers": [],
                "callees": [],
                "relationships": [],
                "results": [],
                "meta": {},
            },
            indent=2,
        )

    root, _ = _resolve_repo_root(directory_path)
    if root is None:
        return json.dumps(
            {
                "error": f"Directory not found: '{directory_path}'",
                "symbol": target,
                "caller_count": 0,
                "callee_count": 0,
                "callers": [],
                "callees": [],
                "relationships": [],
                "results": [],
                "meta": {},
            },
            indent=2,
        )

    db_path = root / ".fastast.db"
    try:
        if not db_path.exists():
            do_index_repository(str(root))

        conn = get_connection(db_path)
        try:
            graph = db_get_call_graph(conn, target)
            relationships = []
            for c in graph.get("callers", []):
                relationships.append({
                    "src": c.get("caller"),
                    "dst": target,
                    "relation": "calls",
                    "file_path": c.get("file_path"),
                    "line_number": c.get("line_number"),
                })
            for c in graph.get("callees", []):
                relationships.append({
                    "src": target,
                    "dst": c.get("callee"),
                    "relation": "calls",
                    "file_path": c.get("file_path"),
                    "line_number": c.get("line_number"),
                })
            graph["relationships"] = relationships
            graph["results"] = relationships
            graph["meta"] = {
                "caller_count": graph.get("caller_count", 0),
                "callee_count": graph.get("callee_count", 0),
                "total_relationships": len(relationships),
            }
            graph["error"] = None
            return json.dumps(graph, indent=2)
        finally:
            conn.close()
    except Exception as exc:
        return json.dumps(
            {
                "error": str(exc),
                "symbol": target,
                "caller_count": 0,
                "callee_count": 0,
                "callers": [],
                "callees": [],
                "relationships": [],
                "results": [],
                "meta": {},
            },
            indent=2,
        )


def get_graph_neighborhood(
    symbol: str = "",
    symbol_name: Optional[str] = None,
    directory_path: str = ".",
    max_depth: int = 2,
    direction: str = "both",
) -> str:
    """Perform bounded multi-hop graph expansion from a symbol.

    Traverses symbol relationships (callers, callees, definitions, inheritance, imports)
    up to a depth limit without graph explosion. Crucial for understanding complete symbol context.

    Args:
        symbol: Root symbol name to expand from (e.g. 'UserService', 'handle_request').
        symbol_name: Backward-compatible alias for symbol.
        directory_path: Repository root directory (default: current directory '.').
        max_depth: Maximum hop depth for bounded traversal (default: 2, range: 1-5).
        direction: Traversal direction: 'both', 'out' (callees/imports), or 'in' (callers/references).

    Returns:
        JSON string containing traversed nodes, confidence-weighted edges, and hop depths.
    """
    target = (symbol_name or symbol or "").strip()
    if not target:
        return json.dumps(
            {
                "error": "Symbol name cannot be empty",
                "symbol": target,
                "nodes": [],
                "edges": [],
                "results": [],
                "relationships": [],
                "meta": {},
            },
            indent=2,
        )

    root, _ = _resolve_repo_root(directory_path)
    if root is None:
        return json.dumps(
            {
                "error": f"Directory not found: '{directory_path}'",
                "symbol": target,
                "nodes": [],
                "edges": [],
                "results": [],
                "relationships": [],
                "meta": {},
            },
            indent=2,
        )

    db_path = root / ".fastast.db"
    try:
        if not db_path.exists():
            do_index_repository(str(root))

        conn = get_connection(db_path)
        try:
            res = db_get_graph_neighborhood(
                conn, target, max_depth=max_depth, direction=direction
            )
            res["symbol"] = target
            res["results"] = res.get("nodes", [])
            res["relationships"] = res.get("edges", [])
            res["meta"] = {
                "depth": max_depth,
                "direction": direction,
                "total_nodes": res.get("total_nodes", len(res.get("nodes", []))),
                "total_edges": res.get("total_edges", len(res.get("edges", []))),
            }
            res["error"] = None
            return json.dumps(res, indent=2)
        finally:
            conn.close()
    except Exception as exc:
        return json.dumps(
            {
                "error": str(exc),
                "symbol": target,
                "nodes": [],
                "edges": [],
                "results": [],
                "relationships": [],
                "meta": {},
            },
            indent=2,
        )


# ── 4. Token-Bounded Evidence Retrieval ──────────────────────────────────────


def retrieve_evidence(
    query: str,
    directory_path: str = ".",
    kind: Optional[str] = None,
    language: Optional[str] = None,
    file_path: Optional[str] = None,
    limit: int = 5,
    max_tokens: int = 2048,
    ranking_method: str = "hybrid",
) -> str:
    """Retrieve a compact, token-bounded evidence bundle for an agent query.

    Primary search & memory retrieval tool for AI coding agents.
    Combines dense semantic vector search with BM25 full-text matching and code graph structure.
    Ranks candidate symbols by relevance, expands 1-hop graph neighbors,
    extracts minimal definition snippets (avoiding whole-file dumps),
    and strictly enforces a token budget.

    Args:
        query: Target symbol name, conceptual phrase, or technical query.
        directory_path: Repository root directory (default: current directory '.').
        kind: Optional symbol kind filter ('function', 'class', 'method', etc.).
        language: Optional language filter ('python', 'typescript', 'rust', etc.).
        file_path: Optional file path filter or bias.
        limit: Maximum candidate symbols to retrieve (default: 5).
        max_tokens: Maximum token budget for evidence snippets (default: 2048).
        ranking_method: Ranking algorithm ('hybrid', 'semantic', 'rrf', 'bm25', or 'heuristic', default: 'hybrid').

    Returns:
        JSON string containing the structured EvidenceBundle.
    """
    if not query or not query.strip():
        return json.dumps(
            {
                "error": "Query string cannot be empty",
                "query": query,
                "candidates": [],
                "results": [],
                "symbols": [],
                "files": [],
                "relationships": [],
                "snippets": [],
                "evidence": [],
                "total_tokens_estimate": 0,
                "meta": {},
            },
            indent=2,
        )

    root, _ = _resolve_repo_root(directory_path)
    if root is None:
        return json.dumps(
            {
                "error": f"Directory not found: '{directory_path}'",
                "query": query,
                "candidates": [],
                "results": [],
                "symbols": [],
                "files": [],
                "relationships": [],
                "snippets": [],
                "evidence": [],
                "total_tokens_estimate": 0,
                "meta": {},
            },
            indent=2,
        )

    db_path = root / ".fastast.db"
    try:
        if not db_path.exists():
            do_index_repository(str(root))

        from fastast.evidence import EvidenceMaterializer

        with EvidenceMaterializer(db_path, repo_root=root) as materializer:
            bundle = materializer.build_evidence_bundle(
                query=query.strip(),
                kind=kind,
                language=language,
                file_path=file_path,
                limit=limit,
                max_tokens=max_tokens,
                ranking_method=ranking_method,
            )
            data = bundle.to_dict()
            data["results"] = data.get("candidates", [])
            data["evidence"] = data.get("snippets", [])
            if "meta" not in data or not isinstance(data["meta"], dict):
                data["meta"] = {}
            data["meta"]["candidate_count"] = len(data.get("candidates", []))
            data["meta"]["ranking_method"] = ranking_method
            data["meta"]["max_tokens"] = max_tokens
            data["error"] = None
            return json.dumps(data, indent=2)
    except Exception as exc:
        return json.dumps(
            {
                "error": str(exc),
                "query": query,
                "candidates": [],
                "results": [],
                "symbols": [],
                "files": [],
                "relationships": [],
                "snippets": [],
                "evidence": [],
                "total_tokens_estimate": 0,
                "meta": {},
            },
            indent=2,
        )


def query(
    query: str,
    directory_path: str = ".",
    kind: Optional[str] = None,
    language: Optional[str] = None,
    file_path: Optional[str] = None,
    limit: int = 5,
    max_tokens: int = 2048,
    ranking_method: str = "hybrid",
) -> str:
    """Alias for retrieve_evidence. Primary codebase search tool for AI coding agents."""
    return retrieve_evidence(
        query=query,
        directory_path=directory_path,
        kind=kind,
        language=language,
        file_path=file_path,
        limit=limit,
        max_tokens=max_tokens,
        ranking_method=ranking_method,
    )


def build_evidence_bundle(
    query: str,
    directory_path: str = ".",
    kind: Optional[str] = None,
    language: Optional[str] = None,
    file_path: Optional[str] = None,
    limit: int = 5,
    max_tokens: int = 2048,
    ranking_method: str = "hybrid",
) -> str:
    """Backward-compatible alias for retrieve_evidence."""
    return retrieve_evidence(
        query=query,
        directory_path=directory_path,
        kind=kind,
        language=language,
        file_path=file_path,
        limit=limit,
        max_tokens=max_tokens,
        ranking_method=ranking_method,
    )


# ── 5. Specific Symbol Evidence & Snippet Tools ──────────────────────────────


def get_symbol_evidence(
    symbol: str = "",
    symbol_name_or_id: Optional[str] = None,
    directory_path: str = ".",
    window_lines: int = 3,
    max_snippet_lines: int = 50,
) -> str:
    """Retrieve complete, bounded evidence package for a specific symbol.

    Returns definition metadata, bounded source snippet, and key incoming/outgoing
    graph neighbors (callers, callees, defines, inherits) without whole-file dumps.

    Args:
        symbol: Target symbol name or integer database ID.
        symbol_name_or_id: Backward-compatible alias for symbol.
        directory_path: Repository root directory (default: current directory '.').
        window_lines: Context padding lines around definition (default: 3).
        max_snippet_lines: Maximum snippet length before truncation (default: 50).

    Returns:
        JSON string containing structured symbol evidence, snippet, and relationships.
    """
    target = (symbol_name_or_id or symbol or "").strip()
    if not target:
        return json.dumps(
            {
                "error": "Symbol identifier cannot be empty",
                "symbol": None,
                "evidence": None,
                "snippet": None,
                "found": False,
                "results": [],
                "relationships": [],
                "meta": {},
            },
            indent=2,
        )

    root, _ = _resolve_repo_root(directory_path)
    if root is None:
        return json.dumps(
            {
                "error": f"Directory not found: '{directory_path}'",
                "symbol": None,
                "evidence": None,
                "snippet": None,
                "found": False,
                "results": [],
                "relationships": [],
                "meta": {},
            },
            indent=2,
        )

    db_path = root / ".fastast.db"
    try:
        if not db_path.exists():
            do_index_repository(str(root))

        from fastast.evidence import EvidenceMaterializer

        with EvidenceMaterializer(db_path, repo_root=root) as materializer:
            evidence = materializer.get_symbol_evidence(
                name_or_id=target,
                window_lines=window_lines,
                max_snippet_lines=max_snippet_lines,
            )
            if not evidence:
                return json.dumps(
                    {
                        "error": f"Symbol not found: '{target}'",
                        "symbol": None,
                        "evidence": None,
                        "snippet": None,
                        "found": False,
                        "results": [],
                        "relationships": [],
                        "meta": {},
                    },
                    indent=2,
                )
            evidence["evidence"] = evidence.get("snippet")
            evidence["results"] = [evidence.get("symbol")] if evidence.get("symbol") else []
            evidence["meta"] = {
                "window_lines": window_lines,
                "max_snippet_lines": max_snippet_lines,
                "caller_count": len(evidence.get("callers", [])),
                "callee_count": len(evidence.get("callees", [])),
                "relationship_count": len(evidence.get("relationships", [])),
            }
            evidence["error"] = None
            return json.dumps(evidence, indent=2)
    except Exception as exc:
        return json.dumps(
            {
                "error": str(exc),
                "symbol": None,
                "evidence": None,
                "snippet": None,
                "found": False,
                "results": [],
                "relationships": [],
                "meta": {},
            },
            indent=2,
        )


def get_file_outline(
    file_path: str,
    directory_path: str = ".",
    max_docstring_chars: int = 100,
) -> str:
    """Retrieve a compact structural outline of a file without raw source content.

    Returns hierarchical classes, methods, top-level functions, line numbers,
    and docstring summaries. Crucial for token-efficient file exploration.

    Args:
        file_path: Relative or absolute path of the target file.
        directory_path: Repository root directory (default: current directory '.').
        max_docstring_chars: Maximum characters per docstring summary (default: 100).

    Returns:
        JSON string containing the structural file outline and symbol counts.
    """
    if not file_path or not str(file_path).strip():
        return json.dumps(
            {
                "error": "File path cannot be empty",
                "file_path": file_path,
                "found": False,
                "classes": [],
                "functions": [],
                "other_symbols": [],
                "results": [],
                "meta": {},
            },
            indent=2,
        )

    root, _ = _resolve_repo_root(directory_path)
    if root is None:
        return json.dumps(
            {
                "error": f"Directory not found: '{directory_path}'",
                "file_path": file_path,
                "found": False,
                "classes": [],
                "functions": [],
                "other_symbols": [],
                "results": [],
                "meta": {},
            },
            indent=2,
        )

    db_path = root / ".fastast.db"
    try:
        if not db_path.exists():
            do_index_repository(str(root))

        from fastast.evidence import EvidenceMaterializer

        with EvidenceMaterializer(db_path, repo_root=root) as materializer:
            outline = materializer.get_file_outline(
                file_path=file_path.strip(),
                max_docstring_chars=max_docstring_chars,
            )
            if not outline:
                return json.dumps(
                    {
                        "error": f"File not found in index: '{file_path}'",
                        "file_path": file_path,
                        "found": False,
                        "classes": [],
                        "functions": [],
                        "other_symbols": [],
                        "results": [],
                        "meta": {},
                    },
                    indent=2,
                )
            outline["results"] = (
                outline.get("classes", [])
                + outline.get("functions", [])
                + outline.get("other_symbols", [])
            )
            outline["meta"] = {
                "language": outline.get("language"),
                "total_lines": outline.get("total_lines", 0),
                "total_symbols": outline.get("total_symbols", 0),
                "total_imports": outline.get("total_imports", 0),
                "class_count": len(outline.get("classes", [])),
                "function_count": len(outline.get("functions", [])),
            }
            outline["error"] = None
            return json.dumps(outline, indent=2)
    except Exception as exc:
        return json.dumps(
            {
                "error": str(exc),
                "file_path": file_path,
                "found": False,
                "classes": [],
                "functions": [],
                "other_symbols": [],
                "results": [],
                "meta": {},
            },
            indent=2,
        )


def get_snippet(
    symbol: Optional[str] = None,
    symbol_name_or_id: Optional[str] = None,
    file_path: Optional[str] = None,
    start_line: Optional[int] = None,
    end_line: Optional[int] = None,
    window_lines: int = 3,
    max_snippet_lines: int = 60,
    directory_path: str = ".",
) -> str:
    """Extract a minimal, bounded source snippet for a symbol or file line range.

    Guarantees token-consciousness: caps snippet length and inserts omission
    indicators for large functions. Never dumps entire files.

    Args:
        symbol: Optional symbol name or ID to locate and slice.
        symbol_name_or_id: Backward-compatible alias for symbol.
        file_path: Optional relative file path for direct line slicing.
        start_line: 1-based start line (required if file_path is used).
        end_line: 1-based end line (optional, defaults to start_line).
        window_lines: Context padding lines before and after (default: 3).
        max_snippet_lines: Maximum snippet length (default: 60).
        directory_path: Repository root directory (default: current directory '.').

    Returns:
        JSON string containing the bounded EvidenceWindow.
    """
    sym = (symbol_name_or_id or symbol or "").strip() or None
    root, _ = _resolve_repo_root(directory_path)
    if root is None:
        return json.dumps(
            {
                "error": f"Directory not found: '{directory_path}'",
                "found": False,
                "snippet": None,
                "evidence": None,
                "meta": {},
            },
            indent=2,
        )

    db_path = root / ".fastast.db"
    try:
        if not db_path.exists():
            do_index_repository(str(root))

        from fastast.evidence import EvidenceMaterializer

        with EvidenceMaterializer(db_path, repo_root=root) as materializer:
            window = materializer.get_snippet(
                symbol_id_or_name=sym,
                file_path=file_path,
                start_line=start_line,
                end_line=end_line,
                window_lines=window_lines,
                max_snippet_lines=max_snippet_lines,
            )
            if not window:
                return json.dumps(
                    {
                        "error": "Snippet target not found",
                        "found": False,
                        "snippet": None,
                        "evidence": None,
                        "meta": {},
                    },
                    indent=2,
                )
            data = window.to_dict()
            data["evidence"] = data.get("snippet")
            data["meta"] = {
                "start_line": data.get("start_line"),
                "end_line": data.get("end_line"),
                "is_truncated": data.get("is_truncated", False),
                "total_lines": data.get("total_lines", 0),
            }
            data["error"] = None
            return json.dumps(data, indent=2)
    except Exception as exc:
        return json.dumps(
            {
                "error": str(exc),
                "found": False,
                "snippet": None,
                "evidence": None,
                "meta": {},
            },
            indent=2,
        )


# ── 6. Similarity & Community Detection Tools ────────────────────────────────


def get_similar_symbols(
    symbol: str,
    directory_path: str = ".",
    limit: int = 10,
    min_similarity: float = 0.5,
) -> str:
    """Retrieve near-duplicate or structurally similar symbols using MinHash + LSH.

    Finds code clones, duplicate implementations, and parallel patterns across the codebase.

    Args:
        symbol: Target symbol name or integer database ID.
        directory_path: Repository root directory (default: current directory '.').
        limit: Maximum similar symbols to return (default: 10).
        min_similarity: Minimum Jaccard similarity threshold (0.0 to 1.0, default: 0.5).

    Returns:
        JSON string containing the list of similar symbols.
    """
    if not symbol or not str(symbol).strip():
        return json.dumps(
            {
                "error": "Symbol identifier cannot be empty",
                "symbol": symbol,
                "total_similar": 0,
                "similar_symbols": [],
                "results": [],
                "meta": {},
            },
            indent=2,
        )

    root, _ = _resolve_repo_root(directory_path)
    if root is None:
        return json.dumps(
            {
                "error": f"Directory not found: '{directory_path}'",
                "symbol": symbol,
                "total_similar": 0,
                "similar_symbols": [],
                "results": [],
                "meta": {},
            },
            indent=2,
        )

    db_path = root / ".fastast.db"
    try:
        if not db_path.exists():
            do_index_repository(str(root))

        conn = get_connection(db_path)
        try:
            sims = db_get_similar(
                conn, symbol.strip(), limit=limit, min_similarity=min_similarity
            )
            return json.dumps(
                {
                    "symbol": symbol,
                    "total_similar": len(sims),
                    "similar_symbols": sims,
                    "results": sims,
                    "meta": {
                        "total_similar": len(sims),
                        "min_similarity": min_similarity,
                        "limit": limit,
                    },
                    "error": None,
                },
                indent=2,
            )
        finally:
            conn.close()
    except Exception as exc:
        return json.dumps(
            {
                "error": str(exc),
                "symbol": symbol,
                "total_similar": 0,
                "similar_symbols": [],
                "results": [],
                "meta": {},
            },
            indent=2,
        )


def get_community(
    symbol: str,
    directory_path: str = ".",
) -> str:
    """Retrieve community assignment, central hub, and peer symbols for a target symbol.

    Provides architectural modularity context using Louvain graph community detection.

    Args:
        symbol: Target symbol name or integer database ID.
        directory_path: Repository root directory (default: current directory '.').

    Returns:
        JSON string containing community membership details.
    """
    if not symbol or not str(symbol).strip():
        return json.dumps(
            {
                "error": "Symbol identifier cannot be empty",
                "symbol": symbol,
                "community": None,
                "results": [],
                "meta": {},
            },
            indent=2,
        )

    root, _ = _resolve_repo_root(directory_path)
    if root is None:
        return json.dumps(
            {
                "error": f"Directory not found: '{directory_path}'",
                "symbol": symbol,
                "community": None,
                "results": [],
                "meta": {},
            },
            indent=2,
        )

    db_path = root / ".fastast.db"
    try:
        if not db_path.exists():
            do_index_repository(str(root))

        conn = get_connection(db_path)
        try:
            comm = db_get_comm(conn, symbol.strip())
            if not comm:
                return json.dumps(
                    {
                        "error": f"Symbol not found in community index: '{symbol}'",
                        "symbol": symbol,
                        "community": None,
                        "results": [],
                        "meta": {},
                    },
                    indent=2,
                )
            comm["results"] = comm.get("peers", [])
            comm["meta"] = {
                "community_id": comm.get("community_id"),
                "community_name": comm.get("community_name"),
                "modularity": comm.get("modularity", 0.0),
                "peer_count": len(comm.get("peers", [])),
            }
            comm["error"] = None
            return json.dumps(comm, indent=2)
        finally:
            conn.close()
    except Exception as exc:
        return json.dumps(
            {
                "error": str(exc),
                "symbol": symbol,
                "community": None,
                "results": [],
                "meta": {},
            },
            indent=2,
        )


def list_communities(
    directory_path: str = ".",
    limit: int = 20,
) -> str:
    """List detected architectural communities and modules from Louvain graph clustering.

    Groups symbols into functional modules (e.g. auth, billing, db, parser) with member counts.

    Args:
        directory_path: Repository root directory (default: current directory '.').
        limit: Maximum communities to return (default: 20).

    Returns:
        JSON string containing the summary of detected communities.
    """
    root, _ = _resolve_repo_root(directory_path)
    if root is None:
        return json.dumps(
            {
                "error": f"Directory not found: '{directory_path}'",
                "total_communities": 0,
                "communities": [],
                "results": [],
                "meta": {},
            },
            indent=2,
        )

    db_path = root / ".fastast.db"
    try:
        if not db_path.exists():
            do_index_repository(str(root))

        conn = get_connection(db_path)
        try:
            comms = db_list_comm(conn, limit=limit)
            return json.dumps(
                {
                    "total_communities": len(comms),
                    "communities": comms,
                    "results": comms,
                    "meta": {
                        "total_communities": len(comms),
                        "limit": limit,
                    },
                    "error": None,
                },
                indent=2,
            )
        finally:
            conn.close()
    except Exception as exc:
        return json.dumps(
            {
                "error": str(exc),
                "total_communities": 0,
                "communities": [],
                "results": [],
                "meta": {},
            },
            indent=2,
        )


# Register tools with MCP server if available
if mcp is not None:
    mcp.tool()(index_repository)
    mcp.tool()(query_symbols)
    mcp.tool()(get_call_graph)
    mcp.tool()(get_graph_neighborhood)
    mcp.tool()(retrieve_evidence)
    mcp.tool()(query)
    mcp.tool()(build_evidence_bundle)
    mcp.tool()(get_symbol_evidence)
    mcp.tool()(get_file_outline)
    mcp.tool()(get_snippet)
    mcp.tool()(get_similar_symbols)
    mcp.tool()(get_community)
    mcp.tool()(list_communities)


def main() -> None:
    """Run the FastAST MCP server over stdio."""
    if mcp is None:
        raise RuntimeError("MCP server is not available. Please install mcp.")
    mcp.run(transport="stdio")


def create_server():
    """Factory function to create and return the MCP server instance."""
    return mcp


__all__ = [
    "index_repository",
    "query_symbols",
    "get_call_graph",
    "get_graph_neighborhood",
    "retrieve_evidence",
    "query",
    "build_evidence_bundle",
    "get_symbol_evidence",
    "get_file_outline",
    "get_snippet",
    "get_similar_symbols",
    "get_community",
    "list_communities",
    "create_server",
    "main",
]
