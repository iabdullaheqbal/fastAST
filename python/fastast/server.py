"""FastAST MCP Server for AST-based repository indexing and codebase-memory retrieval.

Provides a comprehensive, standardized tool suite for AI coding agents
(Claude Code, Cursor, Windsurf, SWE-bench) over stdio JSON-RPC 2.0.
"""

from __future__ import annotations

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

from fastast.config import get_db_path
from fastast.db import (
    get_call_graph as db_get_call_graph,
    get_connection,
    get_graph_neighborhood as db_get_graph_neighborhood,
    get_repository_stats as db_get_repo_stats,
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


def _resolve_repo_root(
    directory_path: str = ".",
    path: Optional[str] = None,
    dir_path: Optional[str] = None,
) -> Tuple[Optional[Path], Path]:
    """Resolve directory path to a valid repository root Path with alias support."""
    target = path or dir_path or directory_path or "."
    resolved = Path(target).resolve()
    if not resolved.exists():
        return None, resolved
    if resolved.is_file():
        resolved = resolved.parent
    return resolved, resolved


# ── 1. Repository Indexing & Statistics ──────────────────────────────────────


def index_repository(
    directory_path: str = ".",
    force: bool = False,
    path: Optional[str] = None,
    dir_path: Optional[str] = None,
) -> str:
    """Scan and index source files in a repository into a persistent SQLite symbol index (.fastast.db).

    Recursively extracts functions, classes, methods, imports, and invocation calls
    for instant symbol lookup and call-graph generation. Incremental: skips unchanged
    files using SHA-256 and content-hash caching unless force is True.

    Agent Guidance:
        Run this tool before executing queries or graph traversals if the repository
        has not yet been indexed or after switching branches.

    Args:
        directory_path: Path to the repository or project directory (default: current directory '.').
        force: If True, forces full reindexing of all files even if unchanged (default: False).
        path: Optional alias for directory_path.
        dir_path: Optional alias for directory_path.

    Returns:
        JSON string containing repository indexing statistics, counts, and metadata.
    """
    root, raw_path = _resolve_repo_root(directory_path, path=path, dir_path=dir_path)
    target_dir = path or dir_path or directory_path
    if root is None:
        return json.dumps(
            {
                "error": f"Directory not found: '{target_dir}'",
                "directory_path": str(target_dir),
                "repo_path": str(target_dir),
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
            "total_files": res.get("total_files", 0),
            "total_symbols": res.get("total_symbols", 0),
            "total_edges": res.get("total_edges", 0),
        }
        res["error"] = None
        return json.dumps(res, indent=2)
    except Exception as exc:
        return json.dumps(
            {
                "error": str(exc),
                "directory_path": str(target_dir),
                "repo_path": str(root),
                "total_files": 0,
                "indexed_files": 0,
                "results": [],
                "meta": {},
            },
            indent=2,
        )


def get_repository_stats(
    directory_path: str = ".",
    path: Optional[str] = None,
    dir_path: Optional[str] = None,
) -> str:
    """Retrieve summary metrics and artifact counts for the indexed repository.

    Provides a fast, high-level repository overview: total files, symbols, imports, calls,
    graph edges, and breakdowns by language and file category.

    Agent Guidance:
        Call this tool first upon connecting to a repository to understand its size,
        primary programming languages, and AST graph richness.

    Args:
        directory_path: Repository root directory (default: current directory '.').
        path: Optional alias for directory_path.
        dir_path: Optional alias for directory_path.

    Returns:
        JSON string containing repository statistics.
    """
    root, _ = _resolve_repo_root(directory_path, path=path, dir_path=dir_path)
    target_dir = path or dir_path or directory_path
    if root is None:
        return json.dumps(
            {
                "error": f"Directory not found: '{target_dir}'",
                "stats": {},
                "results": [],
                "meta": {},
            },
            indent=2,
        )

    db_path = get_db_path(root)
    try:
        if not db_path.exists():
            do_index_repository(str(root))

        conn = get_connection(db_path)
        try:
            stats = db_get_repo_stats(conn)
            res_item = dict(stats)
            stats["results"] = [res_item]
            stats["meta"] = {
                "files": stats.get("files", 0),
                "symbols": stats.get("symbols", 0),
                "edges": stats.get("edges", 0),
                "languages": stats.get("languages", {}),
                "categories": stats.get("categories", {}),
            }
            stats["error"] = None
            return json.dumps(stats, indent=2)
        finally:
            conn.close()
    except Exception as exc:
        return json.dumps(
            {
                "error": str(exc),
                "stats": {},
                "results": [],
                "meta": {},
            },
            indent=2,
        )


# ── 2. Symbol Search ─────────────────────────────────────────────────────────


def query_symbols(
    query: str = "",
    name: Optional[str] = None,
    q: Optional[str] = None,
    kind: Optional[str] = None,
    directory_path: str = ".",
    path: Optional[str] = None,
    dir_path: Optional[str] = None,
    limit: int = 50,
    language: Optional[str] = None,
) -> str:
    """Search for symbol definitions (functions, classes, methods, structs) across the indexed codebase.

    Locate symbol definitions, their exact line numbers, parameters, and docstrings
    across all supported languages (Python, JS, TS, Java, Rust, HTML, CSS, JSON, TOML).
    Automatically indexes the repository if not yet indexed.

    Agent Guidance:
        Use this tool when looking for specific function or class definitions by name.
        To search by conceptual intent or retrieve code snippets, use `retrieve_evidence` instead.

    Args:
        query: Symbol name or substring to search for (e.g. 'authenticate_user', 'Config', 'process').
        name: Optional alias for query.
        q: Optional alias for query.
        kind: Optional symbol kind to filter by ('function', 'async_function', 'class', 'method', 'struct').
        directory_path: Path to the repository directory (default: current directory '.').
        path: Optional alias for directory_path.
        dir_path: Optional alias for directory_path.
        limit: Maximum number of matching symbols to return (default: 50).
        language: Optional language to filter by ('python', 'javascript', 'typescript', 'java', 'rust', etc.).

    Returns:
        JSON string containing matching symbols, counts, and metadata.
    """
    target = (name or q or query or "").strip()
    if not target:
        return json.dumps(
            {
                "error": "Query cannot be empty",
                "query": target,
                "kind": kind,
                "language": language,
                "count": 0,
                "symbols": [],
                "results": [],
                "meta": {},
            },
            indent=2,
        )

    root, _ = _resolve_repo_root(directory_path, path=path, dir_path=dir_path)
    target_dir = path or dir_path or directory_path
    if root is None:
        return json.dumps(
            {
                "error": f"Directory not found: '{target_dir}'",
                "query": target,
                "kind": kind,
                "language": language,
                "count": 0,
                "symbols": [],
                "results": [],
                "meta": {},
            },
            indent=2,
        )

    db_path = get_db_path(root)
    try:
        if not db_path.exists():
            do_index_repository(str(root))

        conn = get_connection(db_path)
        try:
            results = search_symbols(
                conn, target, kind=kind, language=language, limit=limit
            )
            return json.dumps(
                {
                    "query": target,
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
                "query": target,
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
    name: Optional[str] = None,
    directory_path: str = ".",
    path: Optional[str] = None,
    dir_path: Optional[str] = None,
) -> str:
    """Retrieve the call graph (callers and callees) for a specific function or method.

    Inspect invocation relationships across the codebase: who calls this symbol
    (callers) and what functions this symbol invokes (callees). Crucial for blast-radius
    estimation before editing or refactoring code. Automatically indexes if needed.

    Agent Guidance:
        Call this tool before modifying a function or method to find all callers that
        might be affected, or to trace the execution flow downstream.

    Args:
        symbol: Exact name of the function or method to inspect (e.g. 'handle_request', 'validate').
        symbol_name: Backward-compatible alias for symbol.
        name: Optional alias for symbol.
        directory_path: Path to the repository directory (default: current directory '.').
        path: Optional alias for directory_path.
        dir_path: Optional alias for directory_path.

    Returns:
        JSON string containing callers, callees, structured relationships, and metadata.
    """
    target = (name or symbol_name or symbol or "").strip()
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

    root, _ = _resolve_repo_root(directory_path, path=path, dir_path=dir_path)
    target_dir = path or dir_path or directory_path
    if root is None:
        return json.dumps(
            {
                "error": f"Directory not found: '{target_dir}'",
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

    db_path = get_db_path(root)
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
    name: Optional[str] = None,
    directory_path: str = ".",
    path: Optional[str] = None,
    dir_path: Optional[str] = None,
    max_depth: int = 2,
    depth: Optional[int] = None,
    direction: str = "both",
) -> str:
    """Perform bounded multi-hop graph expansion from a root symbol.

    Traverses symbol relationships (callers, callees, definitions, inheritance, imports)
    up to a depth limit without graph explosion. Crucial for understanding complete symbol context.

    Agent Guidance:
        Use this tool when you need a broader multi-hop relationship map (depth 1-3)
        around a core architectural symbol without pulling in unneeded files.

    Args:
        symbol: Root symbol name to expand from (e.g. 'UserService', 'handle_request').
        symbol_name: Backward-compatible alias for symbol.
        name: Optional alias for symbol.
        directory_path: Repository root directory (default: current directory '.').
        path: Optional alias for directory_path.
        dir_path: Optional alias for directory_path.
        max_depth: Maximum hop depth for bounded traversal (default: 2, range: 1-5).
        depth: Optional alias for max_depth.
        direction: Traversal direction: 'both', 'out' (callees/imports), or 'in' (callers/references).

    Returns:
        JSON string containing traversed nodes, confidence-weighted edges, and hop depths.
    """
    target = (name or symbol_name or symbol or "").strip()
    effective_depth = depth if depth is not None else max_depth
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

    root, _ = _resolve_repo_root(directory_path, path=path, dir_path=dir_path)
    target_dir = path or dir_path or directory_path
    if root is None:
        return json.dumps(
            {
                "error": f"Directory not found: '{target_dir}'",
                "symbol": target,
                "nodes": [],
                "edges": [],
                "results": [],
                "relationships": [],
                "meta": {},
            },
            indent=2,
        )

    db_path = get_db_path(root)
    try:
        if not db_path.exists():
            do_index_repository(str(root))

        conn = get_connection(db_path)
        try:
            res = db_get_graph_neighborhood(
                conn, target, max_depth=effective_depth, direction=direction
            )
            res["symbol"] = target
            res["results"] = res.get("nodes", [])
            res["relationships"] = res.get("edges", [])
            res["meta"] = {
                "depth": effective_depth,
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
    query: str = "",
    q: Optional[str] = None,
    directory_path: str = ".",
    path: Optional[str] = None,
    dir_path: Optional[str] = None,
    kind: Optional[str] = None,
    language: Optional[str] = None,
    file_path: Optional[str] = None,
    file: Optional[str] = None,
    limit: int = 5,
    max_tokens: int = 2048,
    ranking_method: str = "hybrid",
    ranking: Optional[str] = None,
) -> str:
    """Retrieve a compact, token-bounded evidence bundle for an agent query.

    Primary search & memory retrieval tool for AI coding agents.
    Combines dense semantic vector search with BM25 full-text matching and code graph structure.
    Ranks candidate symbols by relevance, expands 1-hop graph neighbors,
    extracts minimal definition snippets (avoiding whole-file dumps),
    and strictly enforces a token budget.

    Agent Guidance:
        USE THIS TOOL AS YOUR FIRST CHOICE when searching for code to solve a task.
        Accepts natural language intent (e.g. 'user authentication token verification')
        or exact identifiers. Returns compact code snippets under token limits.

    Args:
        query: Target symbol name, conceptual phrase, or technical query.
        q: Optional alias for query.
        directory_path: Repository root directory (default: current directory '.').
        path: Optional alias for directory_path.
        dir_path: Optional alias for directory_path.
        kind: Optional symbol kind filter ('function', 'class', 'method', etc.).
        language: Optional language filter ('python', 'typescript', 'rust', etc.).
        file_path: Optional file path filter or bias.
        file: Optional alias for file_path.
        limit: Maximum candidate symbols to retrieve (default: 5).
        max_tokens: Maximum token budget for evidence snippets (default: 2048).
        ranking_method: Ranking algorithm ('hybrid', 'semantic', 'rrf', 'bm25', or 'heuristic', default: 'hybrid').
        ranking: Optional alias for ranking_method.

    Returns:
        JSON string containing the structured EvidenceBundle.
    """
    target = (q or query or "").strip()
    target_file = file or file_path
    effective_ranking = ranking or ranking_method
    if not target:
        return json.dumps(
            {
                "error": "Query string cannot be empty",
                "query": target,
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

    root, _ = _resolve_repo_root(directory_path, path=path, dir_path=dir_path)
    target_dir = path or dir_path or directory_path
    if root is None:
        return json.dumps(
            {
                "error": f"Directory not found: '{target_dir}'",
                "query": target,
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

    db_path = get_db_path(root)
    try:
        if not db_path.exists():
            do_index_repository(str(root))

        from fastast.evidence import EvidenceMaterializer

        with EvidenceMaterializer(db_path, repo_root=root) as materializer:
            bundle = materializer.build_evidence_bundle(
                query=target,
                kind=kind,
                language=language,
                file_path=target_file,
                limit=limit,
                max_tokens=max_tokens,
                ranking_method=effective_ranking,
            )
            data = bundle.to_dict()
            data["results"] = data.get("candidates", [])
            data["evidence"] = data.get("snippets", [])
            if "meta" not in data or not isinstance(data["meta"], dict):
                data["meta"] = {}
            data["meta"]["candidate_count"] = len(data.get("candidates", []))
            data["meta"]["ranking_method"] = effective_ranking
            data["meta"]["max_tokens"] = max_tokens
            data["error"] = None
            return json.dumps(data, indent=2)
    except Exception as exc:
        return json.dumps(
            {
                "error": str(exc),
                "query": target,
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
    query: str = "",
    q: Optional[str] = None,
    directory_path: str = ".",
    path: Optional[str] = None,
    dir_path: Optional[str] = None,
    kind: Optional[str] = None,
    language: Optional[str] = None,
    file_path: Optional[str] = None,
    file: Optional[str] = None,
    limit: int = 5,
    max_tokens: int = 2048,
    ranking_method: str = "hybrid",
    ranking: Optional[str] = None,
) -> str:
    """Alias for retrieve_evidence. Primary codebase search tool for AI coding agents."""
    return retrieve_evidence(
        query=query,
        q=q,
        directory_path=directory_path,
        path=path,
        dir_path=dir_path,
        kind=kind,
        language=language,
        file_path=file_path,
        file=file,
        limit=limit,
        max_tokens=max_tokens,
        ranking_method=ranking_method,
        ranking=ranking,
    )


def build_evidence_bundle(
    query: str = "",
    q: Optional[str] = None,
    directory_path: str = ".",
    path: Optional[str] = None,
    dir_path: Optional[str] = None,
    kind: Optional[str] = None,
    language: Optional[str] = None,
    file_path: Optional[str] = None,
    file: Optional[str] = None,
    limit: int = 5,
    max_tokens: int = 2048,
    ranking_method: str = "hybrid",
    ranking: Optional[str] = None,
) -> str:
    """Backward-compatible alias for retrieve_evidence."""
    return retrieve_evidence(
        query=query,
        q=q,
        directory_path=directory_path,
        path=path,
        dir_path=dir_path,
        kind=kind,
        language=language,
        file_path=file_path,
        file=file,
        limit=limit,
        max_tokens=max_tokens,
        ranking_method=ranking_method,
        ranking=ranking,
    )


# ── 5. Specific Symbol Evidence & Snippet Tools ──────────────────────────────


def get_symbol_evidence(
    symbol: str = "",
    symbol_name_or_id: Optional[str] = None,
    name: Optional[str] = None,
    directory_path: str = ".",
    path: Optional[str] = None,
    dir_path: Optional[str] = None,
    window_lines: int = 3,
    max_snippet_lines: int = 50,
) -> str:
    """Retrieve complete, bounded evidence package for a specific symbol.

    Returns definition metadata, bounded source snippet, and key incoming/outgoing
    graph neighbors (callers, callees, defines, inherits) without whole-file dumps.

    Agent Guidance:
        Call this tool when you already know a symbol's name and want its exact code
        definition plus immediate callers and callees in a single compact call.

    Args:
        symbol: Target symbol name or integer database ID.
        symbol_name_or_id: Backward-compatible alias for symbol.
        name: Optional alias for symbol.
        directory_path: Repository root directory (default: current directory '.').
        path: Optional alias for directory_path.
        dir_path: Optional alias for directory_path.
        window_lines: Context padding lines around definition (default: 3).
        max_snippet_lines: Maximum snippet length before truncation (default: 50).

    Returns:
        JSON string containing structured symbol evidence, snippet, and relationships.
    """
    target = (name or symbol_name_or_id or symbol or "").strip()
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

    root, _ = _resolve_repo_root(directory_path, path=path, dir_path=dir_path)
    target_dir = path or dir_path or directory_path
    if root is None:
        return json.dumps(
            {
                "error": f"Directory not found: '{target_dir}'",
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

    db_path = get_db_path(root)
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
    file_path: str = "",
    file: Optional[str] = None,
    directory_path: str = ".",
    path: Optional[str] = None,
    dir_path: Optional[str] = None,
    max_docstring_chars: int = 100,
) -> str:
    """Retrieve a compact structural outline of a file without raw source content.

    Returns hierarchical classes, methods, top-level functions, line numbers,
    and docstring summaries. Crucial for token-efficient file exploration.

    Agent Guidance:
        Call this tool instead of reading an entire source file when you need to know
        what functions or classes exist in a file and their line boundaries.

    Args:
        file_path: Relative or absolute path of the target file.
        file: Optional alias for file_path.
        directory_path: Repository root directory (default: current directory '.').
        path: Optional alias for directory_path.
        dir_path: Optional alias for directory_path.
        max_docstring_chars: Maximum characters per docstring summary (default: 100).

    Returns:
        JSON string containing the structural file outline and symbol counts.
    """
    target_file = (file or file_path or "").strip()
    if not target_file:
        return json.dumps(
            {
                "error": "File path cannot be empty",
                "file_path": target_file,
                "found": False,
                "classes": [],
                "functions": [],
                "other_symbols": [],
                "results": [],
                "meta": {},
            },
            indent=2,
        )

    root, _ = _resolve_repo_root(directory_path, path=path, dir_path=dir_path)
    target_dir = path or dir_path or directory_path
    if root is None:
        return json.dumps(
            {
                "error": f"Directory not found: '{target_dir}'",
                "file_path": target_file,
                "found": False,
                "classes": [],
                "functions": [],
                "other_symbols": [],
                "results": [],
                "meta": {},
            },
            indent=2,
        )

    db_path = get_db_path(root)
    try:
        if not db_path.exists():
            do_index_repository(str(root))

        from fastast.evidence import EvidenceMaterializer

        with EvidenceMaterializer(db_path, repo_root=root) as materializer:
            outline = materializer.get_file_outline(
                file_path=target_file,
                max_docstring_chars=max_docstring_chars,
            )
            if not outline:
                return json.dumps(
                    {
                        "error": f"File not found in index: '{target_file}'",
                        "file_path": target_file,
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
                "file_path": target_file,
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
    name: Optional[str] = None,
    file_path: Optional[str] = None,
    file: Optional[str] = None,
    start_line: Optional[int] = None,
    start: Optional[int] = None,
    end_line: Optional[int] = None,
    end: Optional[int] = None,
    window_lines: int = 3,
    window: Optional[int] = None,
    max_snippet_lines: int = 60,
    max_lines: Optional[int] = None,
    directory_path: str = ".",
    path: Optional[str] = None,
    dir_path: Optional[str] = None,
) -> str:
    """Extract a minimal, bounded source snippet for a symbol or file line range.

    Guarantees token-consciousness: caps snippet length and inserts omission
    indicators for large functions. Never dumps entire files.

    Agent Guidance:
        Use this tool to view the implementation of a specific line range or symbol
        with precisely controlled context windows.

    Args:
        symbol: Optional symbol name or ID to locate and slice.
        symbol_name_or_id: Backward-compatible alias for symbol.
        name: Optional alias for symbol.
        file_path: Optional relative file path for direct line slicing.
        file: Optional alias for file_path.
        start_line: 1-based start line (required if file_path is used).
        start: Optional alias for start_line.
        end_line: 1-based end line (optional, defaults to start_line).
        end: Optional alias for end_line.
        window_lines: Context padding lines before and after (default: 3).
        window: Optional alias for window_lines.
        max_snippet_lines: Maximum snippet length (default: 60).
        max_lines: Optional alias for max_snippet_lines.
        directory_path: Repository root directory (default: current directory '.').
        path: Optional alias for directory_path.
        dir_path: Optional alias for directory_path.

    Returns:
        JSON string containing the bounded EvidenceWindow.
    """
    sym = (name or symbol_name_or_id or symbol or "").strip() or None
    target_file = file or file_path
    effective_start = start if start is not None else start_line
    effective_end = end if end is not None else end_line
    effective_window = window if window is not None else window_lines
    effective_max = max_lines if max_lines is not None else max_snippet_lines

    root, _ = _resolve_repo_root(directory_path, path=path, dir_path=dir_path)
    target_dir = path or dir_path or directory_path
    if root is None:
        return json.dumps(
            {
                "error": f"Directory not found: '{target_dir}'",
                "found": False,
                "snippet": None,
                "evidence": None,
                "results": [],
                "meta": {},
            },
            indent=2,
        )

    db_path = get_db_path(root)
    try:
        if not db_path.exists():
            do_index_repository(str(root))

        from fastast.evidence import EvidenceMaterializer

        with EvidenceMaterializer(db_path, repo_root=root) as materializer:
            win = materializer.get_snippet(
                symbol_id_or_name=sym,
                file_path=target_file,
                start_line=effective_start,
                end_line=effective_end,
                window_lines=effective_window,
                max_snippet_lines=effective_max,
            )
            if not win:
                return json.dumps(
                    {
                        "error": "Snippet target not found",
                        "found": False,
                        "snippet": None,
                        "evidence": None,
                        "results": [],
                        "meta": {},
                    },
                    indent=2,
                )
            data = win.to_dict()
            data["evidence"] = data.get("snippet")
            data["results"] = [data.get("snippet")] if data.get("snippet") else []
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
                "results": [],
                "meta": {},
            },
            indent=2,
        )


# ── 6. Similarity & Community Detection Tools ────────────────────────────────


def get_similar_symbols(
    symbol: str = "",
    symbol_name_or_id: Optional[str] = None,
    name: Optional[str] = None,
    directory_path: str = ".",
    path: Optional[str] = None,
    dir_path: Optional[str] = None,
    limit: int = 10,
    min_similarity: float = 0.5,
    min_sim: Optional[float] = None,
) -> str:
    """Retrieve near-duplicate or structurally similar symbols using MinHash + LSH.

    Finds code clones, duplicate implementations, and parallel patterns across the codebase.

    Agent Guidance:
        Use this tool to discover duplicate code patterns, copy-pasted logic, or parallel
        implementations of similar concepts across modules.

    Args:
        symbol: Target symbol name or integer database ID.
        symbol_name_or_id: Backward-compatible alias for symbol.
        name: Optional alias for symbol.
        directory_path: Repository root directory (default: current directory '.').
        path: Optional alias for directory_path.
        dir_path: Optional alias for directory_path.
        limit: Maximum similar symbols to return (default: 10).
        min_similarity: Minimum Jaccard similarity threshold (0.0 to 1.0, default: 0.5).
        min_sim: Optional alias for min_similarity.

    Returns:
        JSON string containing the list of similar symbols.
    """
    target = (name or symbol_name_or_id or symbol or "").strip()
    effective_min_sim = min_sim if min_sim is not None else min_similarity
    if not target:
        return json.dumps(
            {
                "error": "Symbol identifier cannot be empty",
                "symbol": target,
                "total_similar": 0,
                "similar_symbols": [],
                "results": [],
                "meta": {},
            },
            indent=2,
        )

    root, _ = _resolve_repo_root(directory_path, path=path, dir_path=dir_path)
    target_dir = path or dir_path or directory_path
    if root is None:
        return json.dumps(
            {
                "error": f"Directory not found: '{target_dir}'",
                "symbol": target,
                "total_similar": 0,
                "similar_symbols": [],
                "results": [],
                "meta": {},
            },
            indent=2,
        )

    db_path = get_db_path(root)
    try:
        if not db_path.exists():
            do_index_repository(str(root))

        conn = get_connection(db_path)
        try:
            sims = db_get_similar(
                conn, target, limit=limit, min_similarity=effective_min_sim
            )
            return json.dumps(
                {
                    "symbol": target,
                    "total_similar": len(sims),
                    "similar_symbols": sims,
                    "results": sims,
                    "meta": {
                        "total_similar": len(sims),
                        "min_similarity": effective_min_sim,
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
                "symbol": target,
                "total_similar": 0,
                "similar_symbols": [],
                "results": [],
                "meta": {},
            },
            indent=2,
        )


def get_community(
    symbol: str = "",
    symbol_name_or_id: Optional[str] = None,
    name: Optional[str] = None,
    directory_path: str = ".",
    path: Optional[str] = None,
    dir_path: Optional[str] = None,
) -> str:
    """Retrieve community assignment, central hub, and peer symbols for a target symbol.

    Provides architectural modularity context using Louvain graph community detection.

    Agent Guidance:
        Use this tool to understand what functional subsystem (e.g. auth, billing, database)
        a symbol belongs to, and what peer symbols collaborate closely with it.

    Args:
        symbol: Target symbol name or integer database ID.
        symbol_name_or_id: Backward-compatible alias for symbol.
        name: Optional alias for symbol.
        directory_path: Repository root directory (default: current directory '.').
        path: Optional alias for directory_path.
        dir_path: Optional alias for directory_path.

    Returns:
        JSON string containing community membership details.
    """
    target = (name or symbol_name_or_id or symbol or "").strip()
    if not target:
        return json.dumps(
            {
                "error": "Symbol identifier cannot be empty",
                "symbol": target,
                "community": None,
                "results": [],
                "meta": {},
            },
            indent=2,
        )

    root, _ = _resolve_repo_root(directory_path, path=path, dir_path=dir_path)
    target_dir = path or dir_path or directory_path
    if root is None:
        return json.dumps(
            {
                "error": f"Directory not found: '{target_dir}'",
                "symbol": target,
                "community": None,
                "results": [],
                "meta": {},
            },
            indent=2,
        )

    db_path = get_db_path(root)
    try:
        if not db_path.exists():
            do_index_repository(str(root))

        conn = get_connection(db_path)
        try:
            comm = db_get_comm(conn, target)
            if not comm:
                return json.dumps(
                    {
                        "error": f"Symbol not found in community index: '{target}'",
                        "symbol": target,
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
                "symbol": target,
                "community": None,
                "results": [],
                "meta": {},
            },
            indent=2,
        )


def list_communities(
    directory_path: str = ".",
    path: Optional[str] = None,
    dir_path: Optional[str] = None,
    limit: int = 20,
) -> str:
    """List detected architectural communities and modules from Louvain graph clustering.

    Groups symbols into functional modules (e.g. auth, billing, db, parser) with member counts.

    Agent Guidance:
        Call this tool to get an architectural breakdown of all functional subsystems
        in the codebase and discover major module clusters.

    Args:
        directory_path: Repository root directory (default: current directory '.').
        path: Optional alias for directory_path.
        dir_path: Optional alias for directory_path.
        limit: Maximum communities to return (default: 20).

    Returns:
        JSON string containing the summary of detected communities.
    """
    root, _ = _resolve_repo_root(directory_path, path=path, dir_path=dir_path)
    target_dir = path or dir_path or directory_path
    if root is None:
        return json.dumps(
            {
                "error": f"Directory not found: '{target_dir}'",
                "total_communities": 0,
                "communities": [],
                "results": [],
                "meta": {},
            },
            indent=2,
        )

    db_path = get_db_path(root)
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


def diagnose_repository(
    directory_path: str = ".",
    full_integrity: bool = False,
    path: Optional[str] = None,
    dir_path: Optional[str] = None,
) -> str:
    """Run comprehensive system diagnostics, lock checks, and SQLite integrity validation.

    Agent Guidance:
        Use this tool when encountering unexpected errors, suspecting database corruption,
        or validating index status before large refactorings or code searches.

    Args:
        directory_path: Path to the repository or project directory (default: '.').
        full_integrity: If True, executes PRAGMA integrity_check instead of PRAGMA quick_check.
        path: Optional alias for directory_path.
        dir_path: Optional alias for directory_path.

    Returns:
        JSON string containing repository diagnostic details, health rating, and recommendations.
    """
    root, _ = _resolve_repo_root(directory_path, path=path, dir_path=dir_path)
    target_dir = path or dir_path or directory_path
    if root is None:
        return json.dumps(
            {
                "status": "error",
                "error": f"Directory not found: '{target_dir}'",
                "directory_path": str(target_dir),
                "issues": [f"Directory not found: '{target_dir}'"],
                "recommendations": ["Verify directory path."],
                "results": [],
                "meta": {},
            },
            indent=2,
        )

    from fastast.diagnostics import diagnose_repository as do_diagnose
    try:
        report = do_diagnose(root, full_integrity=full_integrity)
        report["results"] = [report.copy()]
        report["meta"] = {
            "status": report.get("status"),
            "issues_count": len(report.get("issues", [])),
            "recommendations_count": len(report.get("recommendations", [])),
        }
        report["error"] = None if report.get("status") != "error" else "; ".join(report.get("issues", []))
        return json.dumps(report, indent=2)
    except Exception as exc:
        return json.dumps(
            {
                "status": "error",
                "error": str(exc),
                "directory_path": str(root),
                "issues": [str(exc)],
                "recommendations": ["Re-index the repository using index_repository with force=True."],
                "results": [],
                "meta": {},
            },
            indent=2,
        )


# Register tools with MCP server if available
if mcp is not None:
    try:
        from fastast.mcp import (
            tool_community_detail,
            tool_file_outline,
            tool_get_evidence,
            tool_graph_neighbors,
            tool_index_status,
            tool_list_communities,
            tool_search_symbols,
            tool_similar_symbols,
            tool_trigger_index,
        )
        mcp.tool()(tool_index_status)
        mcp.tool()(tool_search_symbols)
        mcp.tool()(tool_get_evidence)
        mcp.tool()(tool_graph_neighbors)
        mcp.tool()(tool_list_communities)
        mcp.tool()(tool_community_detail)
        mcp.tool()(tool_similar_symbols)
        mcp.tool()(tool_file_outline)
        mcp.tool()(tool_trigger_index)
    except Exception:
        pass
    mcp.tool()(index_repository)
    mcp.tool()(get_repository_stats)
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
    mcp.tool()(diagnose_repository)


def main() -> None:
    """Run the FastAST MCP server."""
    from fastast.mcp import main as mcp_main
    mcp_main()


def _run_builtin_stdio_server() -> None:
    """Built-in lightweight JSON-RPC 2.0 stdio server for MCP clients (VS Code, Cursor, Windsurf).
    
    Provides full Model Context Protocol compatibility without third-party dependencies.
    """
    import sys
    from fastast import __version__

    tools_registry = {
        "index_repository": (index_repository, "Incrementally parse and index repository files into .fastast.db"),
        "get_repository_stats": (get_repository_stats, "Return summary counts of indexed files, symbols, calls, and languages"),
        "query_symbols": (query_symbols, "Search for symbol definitions (functions, classes, methods) across the indexed codebase"),
        "get_call_graph": (get_call_graph, "Trace direct incoming callers and outgoing callees of a named symbol"),
        "get_graph_neighborhood": (get_graph_neighborhood, "Extract bounded graph neighborhood around an anchor symbol within hop depth"),
        "retrieve_evidence": (retrieve_evidence, "Hybrid dense + BM25 retrieval returning ranked candidates and token-bounded snippets"),
        "query": (query, "Alias for retrieve_evidence"),
        "build_evidence_bundle": (build_evidence_bundle, "Assemble compact, deduplicated evidence bundle within max_tokens budget"),
        "get_symbol_evidence": (get_symbol_evidence, "Retrieve full symbol definition metadata, bounded source window, and callers/callees"),
        "get_file_outline": (get_file_outline, "Generate compact skeleton outline of classes, methods, and functions in a file"),
        "get_snippet": (get_snippet, "Retrieve targeted source code snippet with line numbers"),
        "get_similar_symbols": (get_similar_symbols, "Find structurally similar symbols using MinHash and Locality-Sensitive Hashing"),
        "get_community": (get_community, "Retrieve Louvain community cluster and central hub for a symbol"),
        "list_communities": (list_communities, "List all detected architectural communities, sizes, and hubs"),
        "diagnose_repository": (diagnose_repository, "Verify SQLite database integrity, schema version, and lock state"),
    }

    tools_list = []
    for tname, (_, tdesc) in tools_registry.items():
        tools_list.append({
            "name": tname,
            "description": tdesc,
            "inputSchema": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "Search query or symbol name"},
                    "symbol": {"type": "string", "description": "Symbol name"},
                    "name": {"type": "string", "description": "Alias for symbol"},
                    "directory_path": {"type": "string", "description": "Repository path", "default": "."},
                    "max_tokens": {"type": "integer", "description": "Token budget ceiling", "default": 1500},
                    "limit": {"type": "integer", "description": "Max results to return", "default": 50},
                    "depth": {"type": "integer", "description": "Hop depth", "default": 2},
                    "file_path": {"type": "string", "description": "Path to source file"}
                }
            }
        })

    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        try:
            req = json.loads(line)
        except json.JSONDecodeError:
            continue

        method = req.get("method")
        req_id = req.get("id")

        if method == "initialize":
            resp = {
                "jsonrpc": "2.0",
                "id": req_id,
                "result": {
                    "protocolVersion": "2024-11-05",
                    "capabilities": {
                        "tools": {"listChanged": False}
                    },
                    "serverInfo": {
                        "name": "fastast",
                        "version": __version__
                    }
                }
            }
            sys.stdout.write(json.dumps(resp) + "\n")
            sys.stdout.flush()

        elif method == "notifications/initialized":
            pass

        elif method == "ping":
            resp = {"jsonrpc": "2.0", "id": req_id, "result": {}}
            sys.stdout.write(json.dumps(resp) + "\n")
            sys.stdout.flush()

        elif method == "tools/list":
            resp = {
                "jsonrpc": "2.0",
                "id": req_id,
                "result": {
                    "tools": tools_list
                }
            }
            sys.stdout.write(json.dumps(resp) + "\n")
            sys.stdout.flush()

        elif method == "tools/call":
            params = req.get("params", {})
            tool_name = params.get("name")
            args = params.get("arguments", {})

            if tool_name in tools_registry:
                fn, _ = tools_registry[tool_name]
                try:
                    res_raw = fn(**args)
                    if isinstance(res_raw, (dict, list)):
                        res_text = json.dumps(res_raw, indent=2)
                    else:
                        res_text = str(res_raw)
                    resp = {
                        "jsonrpc": "2.0",
                        "id": req_id,
                        "result": {
                            "content": [{"type": "text", "text": res_text}],
                            "isError": False
                        }
                    }
                except Exception as exc:
                    resp = {
                        "jsonrpc": "2.0",
                        "id": req_id,
                        "result": {
                            "content": [{"type": "text", "text": f"Error executing tool {tool_name}: {exc}"}],
                            "isError": True
                        }
                    }
            else:
                resp = {
                    "jsonrpc": "2.0",
                    "id": req_id,
                    "error": {
                        "code": -32601,
                        "message": f"Tool not found: {tool_name}"
                    }
                }
            sys.stdout.write(json.dumps(resp) + "\n")
            sys.stdout.flush()

        elif req_id is not None:
            # Fallback for other methods with id
            resp = {
                "jsonrpc": "2.0",
                "id": req_id,
                "error": {
                    "code": -32601,
                    "message": f"Method not supported: {method}"
                }
            }
            sys.stdout.write(json.dumps(resp) + "\n")
            sys.stdout.flush()


def create_server():
    """Factory function to create and return the MCP server instance."""
    return mcp


__all__ = [
    "index_repository",
    "get_repository_stats",
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
    "diagnose_repository",
    "create_server",
    "main",
]


if __name__ == "__main__":
    main()
