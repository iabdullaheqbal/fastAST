"""FastAST MCP Server for AST-based repository indexing and symbol queries."""

import json
from pathlib import Path
from typing import Any, Dict, Optional

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

from fastast.db import get_call_graph as db_get_call_graph
from fastast.db import get_connection, search_symbols
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


def index_repository(directory_path: str = ".", force: bool = False) -> str:
    """Scan and index source files in a repository or directory into a persistent SQLite symbol index (.fastast.db).

    Recursively extracts functions, classes, methods, imports, and invocation calls
    for instant symbol lookup and call-graph generation. Incremental: skips unchanged
    files using SHA-256 caching unless force is True.

    Args:
        directory_path: Path to the repository or project directory (default: current directory '.').
        force: If True, forces reindexing of all files even if unchanged (default: False).

    Returns:
        JSON string containing repository indexing statistics:
            - db_path: Absolute path to the created/updated SQLite database.
            - total_files: Total candidate files scanned.
            - indexed_files: Files parsed and stored.
            - skipped_files: Unchanged files skipped via cache.
            - error_files: Files that failed parsing.
            - total_symbols: Total symbol definitions indexed.
            - total_imports: Total import statements indexed.
            - total_calls: Total function calls indexed.
            - elapsed_ms: Total indexing time in milliseconds.
    """
    path = Path(directory_path).resolve()
    if not path.exists():
        return json.dumps(
            {
                "error": f"Directory not found: '{directory_path}'",
                "directory_path": str(directory_path),
                "total_files": 0,
                "indexed_files": 0,
            },
            indent=2,
        )

    index_dir = str(path.parent if path.is_file() else path)

    try:
        res = do_index_repository(index_dir, force_reindex=force)
        return json.dumps(res, indent=2)
    except Exception as exc:
        return json.dumps(
            {
                "error": str(exc),
                "directory_path": str(directory_path),
            },
            indent=2,
        )


def query_symbols(
    query: str,
    kind: Optional[str] = None,
    directory_path: str = ".",
    limit: int = 50,
    language: Optional[str] = None,
) -> str:
    """Search for symbols (functions, classes, methods) across the indexed codebase.

    Use this tool to locate symbol definitions, their exact line numbers, parameters,
    and docstrings across all supported languages (Python, JS, TS, Java, Rust, HTML, CSS, JSON, TOML).
    If the repository is not yet indexed, it automatically indexes it first.

    Args:
        query: Symbol name or substring to search for (e.g. 'authenticate_user', 'Config', 'process').
        kind: Optional symbol kind to filter by ('function', 'async_function', 'class', 'method').
        directory_path: Path to the repository directory (default: current directory '.').
        limit: Maximum number of matching symbols to return (default: 50).
        language: Optional language to filter by ('python', 'javascript', 'typescript', 'java', 'rust', etc.).

    Returns:
        JSON string containing:
            - query (str): The search query.
            - kind (str, optional): The filter applied.
            - language (str, optional): The language filter applied.
            - count (int): Number of matching symbols found.
            - symbols (list): List of matching symbol dictionaries with fields:
                - name: Symbol identifier.
                - kind: Symbol kind ('function', 'class', 'method', etc.).
                - signature: Argument signature (e.g. '(self, request: Request) -> Response').
                - file_path: Relative file path where defined.
                - language: Programming language of the containing file.
                - start_line: 1-indexed start line.
                - end_line: 1-indexed end line.
                - docstring: First line or full docstring (if available).
                - parent_name: Enclosing class name (for methods).
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
            },
            indent=2,
        )

    root = Path(directory_path).resolve()
    if not root.exists():
        return json.dumps(
            {
                "error": f"Directory not found: '{directory_path}'",
                "query": query,
                "kind": kind,
                "language": language,
                "count": 0,
                "symbols": [],
            },
            indent=2,
        )

    if root.is_file():
        root = root.parent

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
            },
            indent=2,
        )


def get_call_graph(symbol_name: str, directory_path: str = ".") -> str:
    """Retrieve the call graph (callers and callees) for a specific function or method.

    Inspect invocation relationships across the codebase: who calls this symbol
    (callers) and what functions this symbol invokes (callees). Crucial for impact
    analysis and blast-radius estimation before refactoring or editing code.
    Automatically indexes the repository if needed.

    Args:
        symbol_name: Exact name of the function or method to inspect (e.g. 'handle_request', 'validate').
        directory_path: Path to the repository directory (default: current directory '.').

    Returns:
        JSON string containing:
            - symbol (str): The queried symbol name.
            - caller_count (int): Number of callers found.
            - callee_count (int): Number of callees found.
            - callers (list): Callers with caller name, kind, file_path, and line_number.
            - callees (list): Callees with callee name, file_path, and line_number.
    """
    if not symbol_name or not symbol_name.strip():
        return json.dumps(
            {
                "error": "Symbol name cannot be empty",
                "symbol": symbol_name,
                "caller_count": 0,
                "callee_count": 0,
                "callers": [],
                "callees": [],
            },
            indent=2,
        )

    root = Path(directory_path).resolve()
    if not root.exists():
        return json.dumps(
            {
                "error": f"Directory not found: '{directory_path}'",
                "symbol": symbol_name,
                "caller_count": 0,
                "callee_count": 0,
                "callers": [],
                "callees": [],
            },
            indent=2,
        )

    if root.is_file():
        root = root.parent

    db_path = root / ".fastast.db"
    try:
        if not db_path.exists():
            do_index_repository(str(root))

        conn = get_connection(db_path)
        try:
            graph = db_get_call_graph(conn, symbol_name.strip())
            return json.dumps(graph, indent=2)
        finally:
            conn.close()
    except Exception as exc:
        return json.dumps(
            {
                "error": str(exc),
                "symbol": symbol_name,
                "caller_count": 0,
                "callee_count": 0,
                "callers": [],
                "callees": [],
            },
            indent=2,
        )


def retrieve_evidence(
    query: str,
    directory_path: str = ".",
    kind: Optional[str] = None,
    language: Optional[str] = None,
    file_path: Optional[str] = None,
    limit: int = 5,
    max_tokens: int = 2048,
) -> str:
    """Retrieve token-bounded evidence bundle for an agent query.

    Ranks candidate symbols by relevance, expands 1-hop graph neighbors,
    extracts minimal definition snippets (avoiding whole-file dumps),
    and enforces a strict token budget.

    Args:
        query: Target symbol name, path, or text query.
        directory_path: Repository root directory (default: current directory '.').
        kind: Optional symbol kind filter ('function', 'class', 'method', etc.).
        language: Optional language filter ('python', 'typescript', 'rust', etc.).
        file_path: Optional file path filter or bias.
        limit: Maximum candidate symbols to retrieve (default: 5).
        max_tokens: Maximum token budget for evidence snippets (default: 2048).

    Returns:
        JSON string containing the structured EvidenceBundle.
    """
    return build_evidence_bundle(
        query=query,
        directory_path=directory_path,
        kind=kind,
        language=language,
        file_path=file_path,
        limit=limit,
        max_tokens=max_tokens,
    )


def build_evidence_bundle(
    query: str,
    directory_path: str = ".",
    kind: Optional[str] = None,
    language: Optional[str] = None,
    file_path: Optional[str] = None,
    limit: int = 5,
    max_tokens: int = 2048,
) -> str:
    """Build a compact, token-bounded EvidenceBundle for an agent query."""
    if not query or not query.strip():
        return json.dumps({"error": "Query string cannot be empty", "query": query, "candidates": []}, indent=2)

    root = Path(directory_path).resolve()
    if not root.exists():
        return json.dumps({"error": f"Directory not found: '{directory_path}'", "candidates": []}, indent=2)

    if root.is_file():
        root = root.parent

    db_path = root / ".fastast.db"
    try:
        if not db_path.exists():
            do_index_repository(str(root))

        from fastast.evidence import EvidenceMaterializer
        with EvidenceMaterializer(db_path, repo_root=root) as materializer:
            bundle = materializer.build_evidence_bundle(
                query=query,
                kind=kind,
                language=language,
                file_path=file_path,
                limit=limit,
                max_tokens=max_tokens,
            )
            return json.dumps(bundle.to_dict(), indent=2)
    except Exception as exc:
        return json.dumps({"error": str(exc), "candidates": []})


def get_symbol_evidence(
    symbol_name_or_id: str,
    directory_path: str = ".",
    window_lines: int = 3,
    max_snippet_lines: int = 50,
) -> str:
    """Retrieve complete, bounded evidence package for a single symbol.

    Returns definition metadata, bounded source snippet, and key incoming/outgoing
    graph neighbors (callers, callees, defines, inherits) without whole-file dumps.

    Args:
        symbol_name_or_id: Symbol identifier name or integer database ID.
        directory_path: Repository root directory (default: current directory '.').
        window_lines: Context padding lines around definition (default: 3).
        max_snippet_lines: Maximum snippet length before truncation (default: 50).

    Returns:
        JSON string containing structured symbol evidence.
    """
    if not symbol_name_or_id or not str(symbol_name_or_id).strip():
        return json.dumps({"error": "Symbol identifier cannot be empty"}, indent=2)

    root = Path(directory_path).resolve()
    if not root.exists():
        return json.dumps({"error": f"Directory not found: '{directory_path}'"}, indent=2)

    if root.is_file():
        root = root.parent

    db_path = root / ".fastast.db"
    try:
        if not db_path.exists():
            do_index_repository(str(root))

        from fastast.evidence import EvidenceMaterializer
        with EvidenceMaterializer(db_path, repo_root=root) as materializer:
            evidence = materializer.get_symbol_evidence(
                name_or_id=symbol_name_or_id.strip(),
                window_lines=window_lines,
                max_snippet_lines=max_snippet_lines,
            )
            if not evidence:
                return json.dumps({"error": f"Symbol not found: '{symbol_name_or_id}'", "found": False}, indent=2)
            return json.dumps(evidence, indent=2)
    except Exception as exc:
        return json.dumps({"error": str(exc)}, indent=2)


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
        JSON string containing the structural file outline.
    """
    if not file_path or not str(file_path).strip():
        return json.dumps({"error": "File path cannot be empty"}, indent=2)

    root = Path(directory_path).resolve()
    if not root.exists():
        return json.dumps({"error": f"Directory not found: '{directory_path}'"}, indent=2)

    if root.is_file():
        root = root.parent

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
                return json.dumps({"error": f"File not found in index: '{file_path}'", "found": False}, indent=2)
            return json.dumps(outline, indent=2)
    except Exception as exc:
        return json.dumps({"error": str(exc)}, indent=2)


def get_snippet(
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
        symbol_name_or_id: Optional symbol name or ID to locate and slice.
        file_path: Optional relative file path for direct line slicing.
        start_line: 1-based start line (required if file_path is used).
        end_line: 1-based end line (optional, defaults to start_line).
        window_lines: Context padding lines before and after (default: 3).
        max_snippet_lines: Maximum snippet length (default: 60).
        directory_path: Repository root directory (default: current directory '.').

    Returns:
        JSON string containing the bounded EvidenceWindow.
    """
    root = Path(directory_path).resolve()
    if not root.exists():
        return json.dumps({"error": f"Directory not found: '{directory_path}'"}, indent=2)

    if root.is_file():
        root = root.parent

    db_path = root / ".fastast.db"
    try:
        if not db_path.exists():
            do_index_repository(str(root))

        from fastast.evidence import EvidenceMaterializer
        with EvidenceMaterializer(db_path, repo_root=root) as materializer:
            window = materializer.get_snippet(
                symbol_id_or_name=symbol_name_or_id,
                file_path=file_path,
                start_line=start_line,
                end_line=end_line,
                window_lines=window_lines,
                max_snippet_lines=max_snippet_lines,
            )
            if not window:
                return json.dumps({"error": "Snippet target not found", "found": False}, indent=2)
            return json.dumps(window.to_dict(), indent=2)
    except Exception as exc:
        return json.dumps({"error": str(exc)}, indent=2)


# Register tools with MCP server if available
if mcp is not None:
    mcp.tool()(index_repository)
    mcp.tool()(query_symbols)
    mcp.tool()(get_call_graph)
    mcp.tool()(retrieve_evidence)
    mcp.tool()(build_evidence_bundle)
    mcp.tool()(get_symbol_evidence)
    mcp.tool()(get_file_outline)
    mcp.tool()(get_snippet)


def main() -> None:
    """Run the FastAST MCP server over stdio."""
    if mcp is None:
        raise RuntimeError("MCP server is not available. Please install mcp.")
    mcp.run(transport="stdio")


def create_server():
    """Factory function to create and return the MCP server instance.

    This is provided for backward compatibility with code that expects
    to instantiate the server programmatically.
    """
    return mcp


if __name__ == "__main__":
    main()
