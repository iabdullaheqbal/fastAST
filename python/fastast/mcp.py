"""FastAST Model Context Protocol (MCP) Server.

Provides a standardized, high-performance MCP interface for AI coding agents and IDEs:
Cursor, VS Code (Continue, Cline, Official MCP), Claude Desktop, Windsurf, Zed, etc.
Supports stdio transport (primary) and SSE/HTTP transport with zero mandatory dependencies.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import uuid
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any, Callable, Dict, List, Optional, Tuple
from urllib.parse import parse_qs, urlparse

from fastast import __version__
from fastast.config import get_db_path, get_lock_path
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
from fastast.server import (
    _resolve_repo_root,
    diagnose_repository,
    get_call_graph,
    get_community,
    get_file_outline,
    get_graph_neighborhood,
    get_repository_stats,
    get_similar_symbols,
    get_snippet,
    get_symbol_evidence,
    index_repository,
    list_communities,
    query_symbols,
    retrieve_evidence,
)


# =============================================================================
# 1. Core Tool Implementations (9 Required MCP Tools)
# =============================================================================

def tool_index_status(
    directory_path: str = ".",
    path: Optional[str] = None,
    dir_path: Optional[str] = None,
) -> Dict[str, Any]:
    """Return current project and indexing status (idle / indexing / ready / error) plus repository stats.

    Args:
        directory_path: Path to the repository root directory (default: current directory '.').
        path: Alias for directory_path.
        dir_path: Alias for directory_path.
    """
    root, _ = _resolve_repo_root(directory_path, path=path, dir_path=dir_path)
    target_dir = path or dir_path or directory_path or "."
    if root is None or not root.exists():
        return {
            "status": "error",
            "error": f"Directory not found: '{target_dir}'",
            "is_indexed": False,
            "repository_path": str(target_dir),
        }

    db_path = get_db_path(root)
    lock_path = get_lock_path(root, db_path)

    # Check lock state
    is_locked = False
    lock_pid = None
    lock_stale = False
    if lock_path.exists():
        try:
            with open(lock_path, "r", encoding="utf-8") as f:
                content = f.read().strip()
                if content.isdigit():
                    lock_pid = int(content)
                    is_locked = True
        except Exception:
            is_locked = True

    if not db_path.exists():
        return {
            "status": "indexing" if is_locked else "idle",
            "is_indexed": False,
            "message": "Repository is not yet indexed. Run fastast_trigger_index to build index.",
            "repository_path": str(root),
            "database_exists": False,
            "lock": {"is_locked": is_locked, "pid": lock_pid},
            "stats": {"files": 0, "symbols": 0, "edges": 0, "calls": 0, "languages": {}},
        }

    try:
        diag_raw = json.loads(diagnose_repository(directory_path=str(root)))
        stats_raw = json.loads(get_repository_stats(directory_path=str(root)))

        status = "indexing" if is_locked else "ready"
        if diag_raw.get("status") == "error":
            status = "error"

        coverage = diag_raw.get("coverage", {})
        database = diag_raw.get("database", {})

        return {
            "status": status,
            "is_indexed": True,
            "repository_path": str(root),
            "database_exists": True,
            "database": {
                "path": str(db_path),
                "size_bytes": database.get("size_bytes", 0),
                "schema_version": database.get("schema_version", 10),
                "integrity_ok": database.get("integrity_ok", True),
            },
            "stats": {
                "files_count": stats_raw.get("files", coverage.get("db_files_count", 0)),
                "symbols_count": stats_raw.get("symbols", coverage.get("symbols_count", 0)),
                "edges_count": stats_raw.get("edges", coverage.get("edges_count", 0)),
                "calls_count": stats_raw.get("calls", coverage.get("calls_count", 0)),
                "imports_count": stats_raw.get("imports", coverage.get("imports_count", 0)),
                "communities_count": coverage.get("communities_count", 0),
                "languages": stats_raw.get("languages", coverage.get("languages", {})),
                "unindexed_files_count": coverage.get("unindexed_files_count", 0),
            },
            "lock": {
                "is_locked": is_locked,
                "pid": lock_pid,
                "is_stale": lock_stale,
            },
            "issues": diag_raw.get("issues", []),
            "recommendations": diag_raw.get("recommendations", []),
        }
    except Exception as exc:
        return {
            "status": "error",
            "error": str(exc),
            "repository_path": str(root),
            "is_indexed": False,
        }


def tool_search_symbols(
    query: str = "",
    name: Optional[str] = None,
    q: Optional[str] = None,
    kind: Optional[str] = None,
    path: Optional[str] = None,
    file_path: Optional[str] = None,
    community: Optional[int] = None,
    community_id: Optional[int] = None,
    language: Optional[str] = None,
    limit: int = 50,
    directory_path: str = ".",
) -> Dict[str, Any]:
    """Search for symbols across the indexed repository with flexible filtering.

    Args:
        query: Symbol name, identifier, or search query.
        name: Optional alias for query.
        q: Optional alias for query.
        kind: Optional symbol kind to filter ('function', 'class', 'method', 'struct', 'interface', 'type').
        path: Optional file path substring filter (e.g. 'src/', 'db.py').
        file_path: Optional alias for path.
        community: Optional Louvain community cluster ID to restrict search to.
        community_id: Optional alias for community.
        language: Optional language filter ('python', 'typescript', 'rust', 'javascript', etc.).
        limit: Maximum number of matching symbols to return (default: 50).
        directory_path: Repository root directory (default: current directory '.').
    """
    root, _ = _resolve_repo_root(directory_path)
    if not root:
        return {"error": f"Directory not found: {directory_path}", "symbols": [], "count": 0}

    db_path = get_db_path(root)
    if not db_path.exists():
        return {
            "error": "Repository not indexed yet. Please call fastast_trigger_index first.",
            "symbols": [],
            "count": 0,
        }

    search_target = (name or q or query or "").strip()
    target_path = file_path or path
    target_comm = community_id if community_id is not None else community

    conn = get_connection(db_path)
    try:
        conditions: List[str] = []
        params: List[Any] = []

        if search_target:
            conditions.append("(s.name LIKE ? OR s.signature LIKE ?)")
            params.extend([f"%{search_target}%", f"%{search_target}%"])

        if kind:
            conditions.append("s.kind = ?")
            params.append(kind.strip().lower())

        if target_path:
            conditions.append("f.path LIKE ?")
            params.append(f"%{target_path.strip()}%")

        if target_comm is not None:
            conditions.append("sc.community_id = ?")
            params.append(int(target_comm))

        if language:
            conditions.append("f.language = ?")
            params.append(language.strip().lower())

        where_clause = " AND ".join(conditions) if conditions else "1=1"
        params.append(limit)

        cur = conn.cursor()
        cur.execute(
            f"""
            SELECT s.id, s.name, s.kind, s.signature, s.start_line, s.end_line, s.docstring,
                   f.path as file_path, f.language as language,
                   sc.community_id, sc.community_name
            FROM symbols s
            JOIN files f ON s.file_id = f.id
            LEFT JOIN symbol_communities sc ON s.id = sc.symbol_id
            WHERE {where_clause}
            ORDER BY LENGTH(s.name) ASC, s.name ASC
            LIMIT ?
            """,
            params,
        )

        symbols = []
        for r in cur.fetchall():
            symbols.append({
                "id": r[0],
                "name": r[1],
                "kind": r[2],
                "signature": r[3],
                "start_line": r[4],
                "end_line": r[5],
                "docstring": r[6],
                "file_path": r[7],
                "language": r[8],
                "community_id": r[9],
                "community_name": r[10],
            })

        return {
            "query": search_target,
            "count": len(symbols),
            "symbols": symbols,
            "filters": {
                "kind": kind,
                "path": target_path,
                "community": target_comm,
                "language": language,
            },
            "error": None,
        }
    finally:
        conn.close()


def tool_get_evidence(
    query: Optional[str] = None,
    q: Optional[str] = None,
    symbol: Optional[str] = None,
    symbol_name: Optional[str] = None,
    file_path: Optional[str] = None,
    start_line: Optional[int] = None,
    end_line: Optional[int] = None,
    max_tokens: int = 2048,
    ranking_method: str = "hybrid",
    directory_path: str = ".",
) -> Dict[str, Any]:
    """Retrieve compact, token-bounded evidence snippets and relations (never whole files).

    Guarantees strict token containment: extracts minimal definition context windows
    and inserts omission markers for large bodies. Ideal for agent reasoning and patch planning.

    Args:
        query: Conceptual query, task phrase, or natural language intent.
        q: Alias for query.
        symbol: Exact symbol name to retrieve definition and call relations for.
        symbol_name: Alias for symbol.
        file_path: Optional path to a file to slice line-bounded code from.
        start_line: Optional 1-based start line if inspecting a specific file region.
        end_line: Optional 1-based end line if inspecting a specific file region.
        max_tokens: Maximum token budget ceiling (default: 2048).
        ranking_method: Retrieval scoring model ('hybrid', 'bm25', 'semantic', 'rrf').
        directory_path: Repository root directory (default: current directory '.').
    """
    root, _ = _resolve_repo_root(directory_path)
    if not root:
        return {"error": f"Directory not found: {directory_path}", "snippets": []}

    target_symbol = symbol or symbol_name
    target_query = query or q

    # Path 1: Line-bounded snippet directly by file location
    if file_path and start_line is not None:
        raw_res = json.loads(
            get_snippet(
                file_path=file_path,
                start_line=start_line,
                end_line=end_line,
                directory_path=str(root),
                max_snippet_lines=min(60, max_tokens // 25),
            )
        )
        return {
            "type": "file_snippet",
            "file_path": file_path,
            "start_line": raw_res.get("start_line", start_line),
            "end_line": raw_res.get("end_line", end_line or start_line),
            "snippet": raw_res.get("snippet", ""),
            "is_truncated": raw_res.get("meta", {}).get("is_truncated", False),
            "token_estimate": len(raw_res.get("snippet", "").split()) * 2,
            "error": raw_res.get("error"),
        }

    # Path 2: Exact symbol definition + immediate call graph context
    if target_symbol and not target_query:
        raw_res = json.loads(
            get_symbol_evidence(
                symbol=target_symbol,
                directory_path=str(root),
                max_snippet_lines=min(60, max_tokens // 25),
            )
        )
        snip = raw_res.get("snippet")
        if isinstance(snip, dict):
            snip_code = snip.get("code") or snip.get("snippet") or ""
            start_l = snip.get("start_line")
            end_l = snip.get("end_line")
            tok_est = snip.get("tokens_estimate") or len(snip_code.split()) * 2
        else:
            snip_code = str(snip or "")
            start_l = raw_res.get("start_line")
            end_l = raw_res.get("end_line")
            tok_est = len(snip_code.split()) * 2

        sym_obj = raw_res.get("symbol")
        if isinstance(sym_obj, dict):
            sym_name = sym_obj.get("name") or target_symbol
            sym_kind = sym_obj.get("kind")
            sym_file = sym_obj.get("file_path")
            sym_sig = sym_obj.get("signature")
        else:
            sym_name = str(sym_obj or target_symbol)
            sym_kind = raw_res.get("kind")
            sym_file = raw_res.get("file_path")
            sym_sig = raw_res.get("signature")

        return {
            "type": "symbol_evidence",
            "symbol": sym_name,
            "kind": sym_kind,
            "file_path": sym_file,
            "start_line": start_l,
            "end_line": end_l,
            "signature": sym_sig,
            "snippet": snip_code,
            "callers": raw_res.get("callers", []),
            "callees": raw_res.get("callees", []),
            "relationships": raw_res.get("relationships", []),
            "token_estimate": tok_est,
            "error": raw_res.get("error"),
        }

    # Path 3: Hybrid search & evidence retrieval
    search_q = target_query or target_symbol or "main"
    raw_res = json.loads(
        retrieve_evidence(
            query=search_q,
            directory_path=str(root),
            max_tokens=max_tokens,
            ranking_method=ranking_method,
        )
    )

    return {
        "type": "evidence_bundle",
        "query": search_q,
        "total_tokens_estimate": raw_res.get("total_tokens_estimate", 0),
        "candidates": raw_res.get("candidates", []),
        "snippets": raw_res.get("snippets", []),
        "files": raw_res.get("files", []),
        "relationships": raw_res.get("relationships", []),
        "error": raw_res.get("error"),
    }


def tool_graph_neighbors(
    symbol: str = "",
    name: Optional[str] = None,
    depth: int = 2,
    direction: str = "both",
    limit: int = 50,
    directory_path: str = ".",
) -> Dict[str, Any]:
    """Return the relational neighborhood graph for a symbol (nodes and edges).

    Suitable for blast-radius estimation, architecture inspection, and graph visualization.

    Args:
        symbol: Anchor symbol name to expand outward from (e.g. 'handle_request', 'SQLiteStore').
        name: Alias for symbol.
        depth: Maximum graph expansion depth (range 1-5, default: 2).
        direction: Edge traversal direction ('both', 'out', or 'in').
        limit: Maximum nodes to return (default: 50).
        directory_path: Repository root directory (default: current directory '.').
    """
    target = (name or symbol or "").strip()
    root, _ = _resolve_repo_root(directory_path)
    if not root:
        return {"error": f"Directory not found: {directory_path}", "nodes": [], "edges": []}

    raw = json.loads(
        get_graph_neighborhood(
            symbol=target,
            directory_path=str(root),
            max_depth=depth,
            direction=direction,
        )
    )
    raw["nodes"] = (raw.get("nodes") or [])[:limit]
    return raw


def tool_list_communities(
    limit: int = 20,
    directory_path: str = ".",
) -> Dict[str, Any]:
    """List detected functional subsystems and architectural modules from Louvain community clustering.

    Args:
        limit: Maximum communities to return (default: 20).
        directory_path: Repository root directory (default: current directory '.').
    """
    root, _ = _resolve_repo_root(directory_path)
    if not root:
        return {"error": f"Directory not found: {directory_path}", "communities": []}

    return json.loads(list_communities(directory_path=str(root), limit=limit))


def tool_community_detail(
    community_id: Optional[int] = None,
    symbol: Optional[str] = None,
    limit: int = 50,
    directory_path: str = ".",
) -> Dict[str, Any]:
    """Detail and member symbols of a specific architectural community cluster.

    Args:
        community_id: Numeric community identifier (e.g. 0, 1, 2).
        symbol: Optional symbol name to automatically look up its enclosing community.
        limit: Maximum member symbols to return (default: 50).
        directory_path: Repository root directory (default: current directory '.').
    """
    root, _ = _resolve_repo_root(directory_path)
    if not root:
        return {"error": f"Directory not found: {directory_path}", "members": []}

    db_path = get_db_path(root)
    if not db_path.exists():
        return {"error": "Repository not indexed yet. Call fastast_trigger_index first.", "members": []}

    conn = get_connection(db_path)
    try:
        target_comm_id = community_id
        comm_name = None
        modularity = 0.82

        # If community_id not provided, resolve from symbol
        if target_comm_id is None and symbol:
            cur = conn.cursor()
            cur.execute(
                """
                SELECT sc.community_id, sc.community_name, sc.modularity
                FROM symbols s
                JOIN symbol_communities sc ON s.id = sc.symbol_id
                WHERE s.name = ?
                LIMIT 1
                """,
                (symbol.strip(),),
            )
            row = cur.fetchone()
            if row:
                target_comm_id, comm_name, modularity = row[0], row[1], row[2]
            else:
                return {
                    "error": f"No community mapping found for symbol '{symbol}'",
                    "community_id": None,
                    "members": [],
                }

        if target_comm_id is None:
            return {"error": "Either community_id or symbol must be provided", "members": []}

        cur = conn.cursor()
        if comm_name is None:
            cur.execute(
                "SELECT community_name, modularity FROM symbol_communities WHERE community_id = ? LIMIT 1",
                (target_comm_id,),
            )
            row = cur.fetchone()
            if row:
                comm_name, modularity = row[0], row[1]
            else:
                comm_name = f"Community #{target_comm_id}"

        # Fetch members
        cur.execute(
            """
            SELECT s.id, s.name, s.kind, s.signature, s.start_line, s.end_line, f.path as file_path
            FROM symbol_communities sc
            JOIN symbols s ON sc.symbol_id = s.id
            JOIN files f ON s.file_id = f.id
            WHERE sc.community_id = ?
            ORDER BY s.name ASC
            LIMIT ?
            """,
            (target_comm_id, limit),
        )

        members = []
        unique_files = set()
        for r in cur.fetchall():
            members.append({
                "id": r[0],
                "name": r[1],
                "kind": r[2],
                "signature": r[3],
                "start_line": r[4],
                "end_line": r[5],
                "file_path": r[6],
            })
            unique_files.add(r[6])

        # Total member count
        cur.execute(
            "SELECT COUNT(*) FROM symbol_communities WHERE community_id = ?",
            (target_comm_id,),
        )
        total_members = cur.fetchone()[0]

        return {
            "community_id": target_comm_id,
            "name": comm_name,
            "modularity": modularity,
            "total_members": total_members,
            "returned_members_count": len(members),
            "members": members,
            "files": sorted(list(unique_files)),
            "error": None,
        }
    finally:
        conn.close()


def tool_similar_symbols(
    symbol: str = "",
    name: Optional[str] = None,
    min_similarity: float = 0.5,
    limit: int = 10,
    directory_path: str = ".",
) -> Dict[str, Any]:
    """Find structurally similar symbols using MinHash and Locality-Sensitive Hashing (LSH).

    Detects code clones, duplicate logic, and parallel implementations across modules.

    Args:
        symbol: Target symbol name or database ID.
        name: Alias for symbol.
        min_similarity: Minimum Jaccard similarity threshold (0.0 to 1.0, default: 0.5).
        limit: Maximum similar symbols to return (default: 10).
        directory_path: Repository root directory (default: current directory '.').
    """
    target = (name or symbol or "").strip()
    root, _ = _resolve_repo_root(directory_path)
    if not root:
        return {"error": f"Directory not found: {directory_path}", "similar_symbols": []}

    return json.loads(
        get_similar_symbols(
            symbol=target,
            directory_path=str(root),
            min_similarity=min_similarity,
            limit=limit,
        )
    )


def tool_file_outline(
    file_path: str = "",
    file: Optional[str] = None,
    path: Optional[str] = None,
    include_snippets: bool = False,
    directory_path: str = ".",
) -> Dict[str, Any]:
    """Generate a compact AST skeleton outline of classes, methods, functions, and key snippets for a file.

    Args:
        file_path: Relative path to the target source file (e.g. 'src/parser.ts', 'python/fastast/db.py').
        file: Alias for file_path.
        path: Alias for file_path.
        include_snippets: If true, attaches preview snippet headers for the top symbols in the outline.
        directory_path: Repository root directory (default: current directory '.').
    """
    target_file = file_path or file or path or ""
    root, _ = _resolve_repo_root(directory_path)
    if not root:
        return {"error": f"Directory not found: {directory_path}"}

    raw = json.loads(get_file_outline(file_path=target_file, directory_path=str(root)))

    if include_snippets and not raw.get("error"):
        # Enrich classes and functions with compact snippet headers
        for fn in (raw.get("functions") or [])[:5]:
            try:
                snip = json.loads(
                    get_snippet(
                        file_path=target_file,
                        start_line=fn.get("start_line", 1),
                        end_line=min(fn.get("end_line", 1), fn.get("start_line", 1) + 4),
                        directory_path=str(root),
                        max_snippet_lines=6,
                    )
                )
                fn["snippet_preview"] = snip.get("snippet")
            except Exception:
                pass

    return raw


def tool_trigger_index(
    directory_path: str = ".",
    force: bool = False,
) -> Dict[str, Any]:
    """Start or re-trigger incremental repository indexing into SQLite (.fastast.db).

    Args:
        directory_path: Target repository path to index (default: current directory '.').
        force: If True, forces complete re-index of all files even if SHA-256 is unchanged.
    """
    root, _ = _resolve_repo_root(directory_path)
    if not root:
        return {"error": f"Directory not found: {directory_path}", "success": False}

    raw = json.loads(
        index_repository(
            directory_path=str(root),
            force=force,
        )
    )
    return raw


# =============================================================================
# 2. Tool Registry & JSON Schema Definitions
# =============================================================================

MCP_TOOLS_SPEC: List[Dict[str, Any]] = [
    {
        "name": "fastast_index_status",
        "description": "Return current project and indexing status (idle / indexing / ready / error) plus repository metrics.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "directory_path": {
                    "type": "string",
                    "description": "Path to the repository root directory (default: current directory '.')",
                    "default": ".",
                }
            },
            "required": [],
        },
        "handler": tool_index_status,
    },
    {
        "name": "fastast_search_symbols",
        "description": "Search for symbols by name / query with optional filters (kind, path, community, language).",
        "inputSchema": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "Symbol name or substring to search for (e.g. 'handle_request', 'Config', 'Visitor')",
                },
                "kind": {
                    "type": "string",
                    "description": "Filter by symbol kind ('function', 'class', 'method', 'struct', 'interface', 'type')",
                },
                "path": {
                    "type": "string",
                    "description": "Filter by file path substring (e.g. 'parser/', 'db.py')",
                },
                "community": {
                    "type": "integer",
                    "description": "Filter by Louvain community cluster ID (from fastast_list_communities)",
                },
                "language": {
                    "type": "string",
                    "description": "Filter by language ('python', 'typescript', 'rust', 'javascript', etc.)",
                },
                "limit": {
                    "type": "integer",
                    "description": "Maximum number of symbols to return (default: 50)",
                    "default": 50,
                },
                "directory_path": {
                    "type": "string",
                    "description": "Repository root directory (default: '.')",
                    "default": ".",
                },
            },
            "required": ["query"],
        },
        "handler": tool_search_symbols,
    },
    {
        "name": "fastast_get_evidence",
        "description": "Return compact, token-bounded evidence bundle or code snippets for a symbol or location (never full files).",
        "inputSchema": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "Conceptual task query or phrase (e.g. 'JWT token signature validation')",
                },
                "symbol": {
                    "type": "string",
                    "description": "Exact symbol name to retrieve definition and immediate call graph for",
                },
                "file_path": {
                    "type": "string",
                    "description": "Path to source file if requesting a targeted line range",
                },
                "start_line": {
                    "type": "integer",
                    "description": "1-based start line if inspecting a specific code slice",
                },
                "end_line": {
                    "type": "integer",
                    "description": "1-based end line if inspecting a specific code slice",
                },
                "max_tokens": {
                    "type": "integer",
                    "description": "Token budget ceiling for returned code (default: 2048)",
                    "default": 2048,
                },
                "ranking_method": {
                    "type": "string",
                    "description": "Scoring model ('hybrid', 'bm25', 'semantic', 'rrf')",
                    "default": "hybrid",
                },
                "directory_path": {
                    "type": "string",
                    "description": "Repository root directory (default: '.')",
                    "default": ".",
                },
            },
            "required": [],
        },
        "handler": tool_get_evidence,
    },
    {
        "name": "fastast_graph_neighbors",
        "description": "Return relational neighborhood graph for a symbol (nodes + edges) suitable for IDE visualization.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "symbol": {
                    "type": "string",
                    "description": "Anchor symbol name to expand from (e.g. 'execute_query', 'ASTVisitor')",
                },
                "depth": {
                    "type": "integer",
                    "description": "Hop expansion depth (1 to 5, default: 2)",
                    "default": 2,
                },
                "direction": {
                    "type": "string",
                    "description": "Traversal direction ('both', 'out', or 'in')",
                    "default": "both",
                },
                "limit": {
                    "type": "integer",
                    "description": "Maximum nodes to return (default: 50)",
                    "default": 50,
                },
                "directory_path": {
                    "type": "string",
                    "description": "Repository root directory (default: '.')",
                    "default": ".",
                },
            },
            "required": ["symbol"],
        },
        "handler": tool_graph_neighbors,
    },
    {
        "name": "fastast_list_communities",
        "description": "List detected functional subsystems and architectural clusters from Louvain modularity clustering.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "limit": {
                    "type": "integer",
                    "description": "Maximum number of communities to return (default: 20)",
                    "default": 20,
                },
                "directory_path": {
                    "type": "string",
                    "description": "Repository root directory (default: '.')",
                    "default": ".",
                },
            },
            "required": [],
        },
        "handler": tool_list_communities,
    },
    {
        "name": "fastast_community_detail",
        "description": "Retrieve full details and member symbols of a specific architectural community cluster.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "community_id": {
                    "type": "integer",
                    "description": "Numeric ID of the Louvain community to inspect (e.g. 0, 1, 2)",
                },
                "symbol": {
                    "type": "string",
                    "description": "Optional symbol name to automatically look up its enclosing community",
                },
                "limit": {
                    "type": "integer",
                    "description": "Maximum member symbols to return (default: 50)",
                    "default": 50,
                },
                "directory_path": {
                    "type": "string",
                    "description": "Repository root directory (default: '.')",
                    "default": ".",
                },
            },
            "required": [],
        },
        "handler": tool_community_detail,
    },
    {
        "name": "fastast_similar_symbols",
        "description": "Find structurally similar symbols using MinHash and Locality-Sensitive Hashing (LSH) for clone detection.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "symbol": {
                    "type": "string",
                    "description": "Target symbol name or database ID to find near-duplicates for",
                },
                "min_similarity": {
                    "type": "number",
                    "description": "Minimum Jaccard similarity threshold (0.0 to 1.0, default: 0.5)",
                    "default": 0.5,
                },
                "limit": {
                    "type": "integer",
                    "description": "Maximum similar symbols to return (default: 10)",
                    "default": 10,
                },
                "directory_path": {
                    "type": "string",
                    "description": "Repository root directory (default: '.')",
                    "default": ".",
                },
            },
            "required": ["symbol"],
        },
        "handler": tool_similar_symbols,
    },
    {
        "name": "fastast_file_outline",
        "description": "Generate a compact outline of classes, methods, functions, and key snippets for a source file.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "file_path": {
                    "type": "string",
                    "description": "Relative path to source file (e.g. 'python/fastast/db.py', 'src/lib.rs')",
                },
                "include_snippets": {
                    "type": "boolean",
                    "description": "If true, attaches definition preview snippets for top symbols",
                    "default": False,
                },
                "directory_path": {
                    "type": "string",
                    "description": "Repository root directory (default: '.')",
                    "default": ".",
                },
            },
            "required": ["file_path"],
        },
        "handler": tool_file_outline,
    },
    {
        "name": "fastast_trigger_index",
        "description": "Start or re-trigger incremental indexing of repository files into SQLite symbol graph (.fastast.db).",
        "inputSchema": {
            "type": "object",
            "properties": {
                "directory_path": {
                    "type": "string",
                    "description": "Repository directory to index (default: '.')",
                    "default": ".",
                },
                "force": {
                    "type": "boolean",
                    "description": "Force reindexing all files even if unchanged (default: false)",
                    "default": False,
                },
            },
            "required": [],
        },
        "handler": tool_trigger_index,
    },
]

# Backwards-compatible aliases for tools
LEGACY_ALIASES: Dict[str, Tuple[Callable[..., Any], str]] = {
    "index_repository": (tool_trigger_index, "Alias for fastast_trigger_index"),
    "get_repository_stats": (tool_index_status, "Alias for fastast_index_status"),
    "query_symbols": (tool_search_symbols, "Alias for fastast_search_symbols"),
    "get_call_graph": (
        lambda symbol="", directory_path=".": json.loads(get_call_graph(symbol=symbol, directory_path=directory_path)),
        "Trace incoming callers and outgoing callees of a symbol",
    ),
    "get_graph_neighborhood": (tool_graph_neighbors, "Alias for fastast_graph_neighbors"),
    "retrieve_evidence": (tool_get_evidence, "Alias for fastast_get_evidence"),
    "query": (tool_get_evidence, "Alias for fastast_get_evidence"),
    "build_evidence_bundle": (tool_get_evidence, "Alias for fastast_get_evidence"),
    "get_symbol_evidence": (tool_get_evidence, "Alias for fastast_get_evidence"),
    "get_file_outline": (tool_file_outline, "Alias for fastast_file_outline"),
    "get_snippet": (
        lambda file_path="", start_line=1, end_line=None, symbol=None, directory_path=".": json.loads(
            get_snippet(file_path=file_path, start_line=start_line, end_line=end_line, symbol=symbol, directory_path=directory_path)
        ),
        "Retrieve targeted line-bounded code snippet",
    ),
    "get_similar_symbols": (tool_similar_symbols, "Alias for fastast_similar_symbols"),
    "get_community": (tool_community_detail, "Alias for fastast_community_detail"),
    "list_communities": (tool_list_communities, "Alias for fastast_list_communities"),
    "diagnose_repository": (
        lambda directory_path=".": json.loads(diagnose_repository(directory_path=directory_path)),
        "Verify SQLite database integrity and health",
    ),
}

# Combine into master tools registry
TOOLS_MAP: Dict[str, Callable[..., Any]] = {}
TOOLS_METADATA: List[Dict[str, Any]] = []

for spec in MCP_TOOLS_SPEC:
    TOOLS_MAP[spec["name"]] = spec["handler"]
    TOOLS_METADATA.append({
        "name": spec["name"],
        "description": spec["description"],
        "inputSchema": spec["inputSchema"],
    })

for alias_name, (handler, desc) in LEGACY_ALIASES.items():
    TOOLS_MAP[alias_name] = handler
    # Provide simple schema for legacy tool aliases
    TOOLS_METADATA.append({
        "name": alias_name,
        "description": desc,
        "inputSchema": {
            "type": "object",
            "properties": {
                "query": {"type": "string"},
                "symbol": {"type": "string"},
                "name": {"type": "string"},
                "directory_path": {"type": "string", "default": "."},
                "max_tokens": {"type": "integer", "default": 2048},
                "limit": {"type": "integer", "default": 50},
                "depth": {"type": "integer", "default": 2},
                "file_path": {"type": "string"},
                "start_line": {"type": "integer"},
                "end_line": {"type": "integer"},
                "force": {"type": "boolean", "default": False},
            },
        },
    })


# =============================================================================
# 3. Standards-Compliant MCP Stdio Server (JSON-RPC 2.0)
# =============================================================================

def run_stdio_server() -> None:
    """Run standards-compliant Model Context Protocol server over stdio.

    Emits only JSON-RPC 2.0 messages over stdout. All diagnostic logs are routed to stderr.
    """
    sys.stderr.write(f"FastAST MCP Server v{__version__} listening on stdio (JSON-RPC 2.0)\n")
    sys.stderr.flush()

    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue

        try:
            req = json.loads(line)
        except json.JSONDecodeError as exc:
            err_resp = {
                "jsonrpc": "2.0",
                "id": None,
                "error": {"code": -32700, "message": f"Parse error: {exc}"},
            }
            sys.stdout.write(json.dumps(err_resp) + "\n")
            sys.stdout.flush()
            continue

        method = req.get("method")
        req_id = req.get("id")

        # 1. Initialize
        if method == "initialize":
            resp = {
                "jsonrpc": "2.0",
                "id": req_id,
                "result": {
                    "protocolVersion": "2024-11-05",
                    "capabilities": {
                        "tools": {"listChanged": False},
                        "resources": {"subscribe": False, "listChanged": False},
                    },
                    "serverInfo": {
                        "name": "fastast",
                        "version": __version__,
                    },
                },
            }
            sys.stdout.write(json.dumps(resp) + "\n")
            sys.stdout.flush()

        # 2. Notifications
        elif method in ("notifications/initialized", "initialized"):
            pass

        # 3. Ping
        elif method == "ping":
            resp = {"jsonrpc": "2.0", "id": req_id, "result": {}}
            sys.stdout.write(json.dumps(resp) + "\n")
            sys.stdout.flush()

        # 4. Tools List
        elif method == "tools/list":
            resp = {
                "jsonrpc": "2.0",
                "id": req_id,
                "result": {
                    "tools": TOOLS_METADATA,
                },
            }
            sys.stdout.write(json.dumps(resp) + "\n")
            sys.stdout.flush()

        # 5. Tools Call
        elif method == "tools/call":
            params = req.get("params", {})
            tool_name = params.get("name")
            args = params.get("arguments", {})

            if tool_name in TOOLS_MAP:
                handler = TOOLS_MAP[tool_name]
                try:
                    result_data = handler(**args)
                    if isinstance(result_data, str):
                        content_text = result_data
                    else:
                        content_text = json.dumps(result_data, indent=2)

                    resp = {
                        "jsonrpc": "2.0",
                        "id": req_id,
                        "result": {
                            "content": [
                                {
                                    "type": "text",
                                    "text": content_text,
                                }
                            ],
                            "isError": False,
                        },
                    }
                except Exception as exc:
                    resp = {
                        "jsonrpc": "2.0",
                        "id": req_id,
                        "result": {
                            "content": [
                                {
                                    "type": "text",
                                    "text": f"Error executing {tool_name}: {exc}",
                                }
                            ],
                            "isError": True,
                        },
                    }
            else:
                resp = {
                    "jsonrpc": "2.0",
                    "id": req_id,
                    "error": {
                        "code": -32601,
                        "message": f"Tool '{tool_name}' not found",
                    },
                }

            sys.stdout.write(json.dumps(resp) + "\n")
            sys.stdout.flush()

        # 6. Resources List
        elif method == "resources/list":
            resources = [
                {
                    "uri": "fastast://status",
                    "name": "FastAST Index Status",
                    "description": "Current repository index status and metrics",
                    "mimeType": "application/json",
                },
                {
                    "uri": "fastast://communities",
                    "name": "FastAST Louvain Communities",
                    "description": "Architectural subsystem clusters",
                    "mimeType": "application/json",
                },
            ]
            resp = {
                "jsonrpc": "2.0",
                "id": req_id,
                "result": {"resources": resources},
            }
            sys.stdout.write(json.dumps(resp) + "\n")
            sys.stdout.flush()

        # 7. Resources Read
        elif method == "resources/read":
            params = req.get("params", {})
            uri = params.get("uri", "")

            if uri == "fastast://status":
                text = json.dumps(tool_index_status("."), indent=2)
            elif uri == "fastast://communities":
                text = json.dumps(tool_list_communities(20, "."), indent=2)
            else:
                text = json.dumps({"error": f"Unknown resource URI: {uri}"})

            resp = {
                "jsonrpc": "2.0",
                "id": req_id,
                "result": {
                    "contents": [
                        {
                            "uri": uri,
                            "mimeType": "application/json",
                            "text": text,
                        }
                    ]
                },
            }
            sys.stdout.write(json.dumps(resp) + "\n")
            sys.stdout.flush()

        # 8. Unhandled method
        elif req_id is not None:
            resp = {
                "jsonrpc": "2.0",
                "id": req_id,
                "error": {
                    "code": -32601,
                    "message": f"Method '{method}' not supported",
                },
            }
            sys.stdout.write(json.dumps(resp) + "\n")
            sys.stdout.flush()


# =============================================================================
# 4. Optional SSE / HTTP Transport Server
# =============================================================================

class MCPSSEHandler(BaseHTTPRequestHandler):
    """HTTP handler supporting both MCP Server-Sent Events (SSE) and JSON-RPC POST."""

    active_sessions: Dict[str, MCPSSEHandler] = {}

    def log_message(self, format: str, *args: Any) -> None:
        # Route access logs to stderr
        sys.stderr.write("%s - - [%s] %s\n" % (self.address_string(), self.log_date_time_string(), format % args))
        sys.stderr.flush()

    def do_OPTIONS(self) -> None:
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.end_headers()

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path == "/sse":
            session_id = str(uuid.uuid4())
            self.send_response(200)
            self.send_header("Content-Type", "text/event-stream")
            self.send_header("Cache-Control", "no-cache")
            self.send_header("Connection", "keep-alive")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()

            # Register session
            MCPSSEHandler.active_sessions[session_id] = self

            # Send endpoint event
            endpoint_msg = f"/messages?sessionId={session_id}"
            self.wfile.write(f"event: endpoint\ndata: {endpoint_msg}\n\n".encode("utf-8"))
            self.wfile.flush()

            sys.stderr.write(f"MCP SSE connection established for session {session_id}\n")
            sys.stderr.flush()

            # Keep alive
            try:
                while True:
                    self.wfile.write(b": ping\n\n")
                    self.wfile.flush()
                    import time
                    time.sleep(15)
            except (ConnectionResetError, BrokenPipeError):
                pass
            finally:
                MCPSSEHandler.active_sessions.pop(session_id, None)

        elif parsed.path in ("/", "/status", "/health"):
            status_data = tool_index_status(".")
            body = json.dumps(status_data, indent=2).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
        else:
            self.send_response(404)
            self.end_headers()

    def do_POST(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path in ("/messages", "/mcp"):
            content_length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_length).decode("utf-8")
            try:
                req = json.loads(body)
            except json.JSONDecodeError:
                self.send_response(400)
                self.end_headers()
                return

            resp = self._handle_jsonrpc(req)

            # If sessionId provided, also send over SSE stream
            query = parse_qs(parsed.query)
            session_id = query.get("sessionId", [None])[0]
            if session_id and session_id in MCPSSEHandler.active_sessions:
                sse_handler = MCPSSEHandler.active_sessions[session_id]
                try:
                    sse_handler.wfile.write(f"event: message\ndata: {json.dumps(resp)}\n\n".encode("utf-8"))
                    sse_handler.wfile.flush()
                except Exception:
                    pass

            resp_bytes = json.dumps(resp, indent=2).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Content-Length", str(len(resp_bytes)))
            self.end_headers()
            self.wfile.write(resp_bytes)
        else:
            self.send_response(404)
            self.end_headers()

    def _handle_jsonrpc(self, req: Dict[str, Any]) -> Dict[str, Any]:
        method = req.get("method")
        req_id = req.get("id")

        if method == "initialize":
            return {
                "jsonrpc": "2.0",
                "id": req_id,
                "result": {
                    "protocolVersion": "2024-11-05",
                    "capabilities": {"tools": {"listChanged": False}},
                    "serverInfo": {"name": "fastast", "version": __version__},
                },
            }
        elif method in ("notifications/initialized", "initialized"):
            return {"jsonrpc": "2.0", "id": req_id, "result": {}}
        elif method == "ping":
            return {"jsonrpc": "2.0", "id": req_id, "result": {}}
        elif method == "tools/list":
            return {"jsonrpc": "2.0", "id": req_id, "result": {"tools": TOOLS_METADATA}}
        elif method == "tools/call":
            params = req.get("params", {})
            name = params.get("name")
            args = params.get("arguments", {})
            if name in TOOLS_MAP:
                try:
                    res = TOOLS_MAP[name](**args)
                    text = res if isinstance(res, str) else json.dumps(res, indent=2)
                    return {
                        "jsonrpc": "2.0",
                        "id": req_id,
                        "result": {"content": [{"type": "text", "text": text}], "isError": False},
                    }
                except Exception as exc:
                    return {
                        "jsonrpc": "2.0",
                        "id": req_id,
                        "result": {"content": [{"type": "text", "text": f"Error: {exc}"}], "isError": True},
                    }
            return {"jsonrpc": "2.0", "id": req_id, "error": {"code": -32601, "message": f"Tool '{name}' not found"}}
        return {"jsonrpc": "2.0", "id": req_id, "error": {"code": -32601, "message": f"Method '{method}' not supported"}}


def run_sse_server(host: str = "127.0.0.1", port: int = 4200) -> None:
    """Run MCP server over HTTP/SSE transport."""
    server = ThreadingHTTPServer((host, port), MCPSSEHandler)
    sys.stderr.write(f"FastAST MCP SSE Server running on http://{host}:{port}/sse\n")
    sys.stderr.flush()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        sys.stderr.write("\nShutting down FastAST MCP SSE Server.\n")
        server.server_close()


# =============================================================================
# 5. CLI Entrypoint
# =============================================================================

def main() -> None:
    """CLI entrypoint for fastast.mcp."""
    parser = argparse.ArgumentParser(
        prog="fastast-mcp",
        description=f"FastAST Model Context Protocol (MCP) Server v{__version__} for IDEs and AI coding agents.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=(
            "IDE Setup Examples:\n"
            "  Claude Code:     claude mcp add fastast -- python3 -m fastast.mcp\n"
            "  Cursor IDE:      Add to .cursor/mcp.json:\n"
            '                   {"mcpServers": {"fastast": {"command": "python3", "args": ["-m", "fastast.mcp"]}}}\n'
            "  VS Code / Cline: Add to .vscode/mcp.json under mcpServers\n"
            "  Windsurf:        Add to ~/.codeium/windsurf/mcp_config.json\n"
        ),
    )
    parser.add_argument("-v", "--version", action="version", version=f"fastast-mcp {__version__}")
    parser.add_argument(
        "--transport",
        choices=["stdio", "sse", "http"],
        default="stdio",
        help="Transport mechanism (default: stdio)",
    )
    parser.add_argument(
        "--port",
        type=int,
        default=4200,
        help="Port for SSE/HTTP transport (default: 4200)",
    )
    parser.add_argument(
        "--host",
        default="127.0.0.1",
        help="Host for SSE/HTTP transport (default: 127.0.0.1)",
    )
    parser.add_argument(
        "-d",
        "--dir",
        default=".",
        help="Target repository directory (default: '.')",
    )

    args = parser.parse_args()

    if args.dir and args.dir != ".":
        os.chdir(args.dir)

    if args.transport == "stdio":
        run_stdio_server()
    else:
        run_sse_server(host=args.host, port=args.port)


if __name__ == "__main__":
    main()
