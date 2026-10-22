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


# Register tools with MCP server if available
if mcp is not None:
    mcp.tool()(index_repository)
    mcp.tool()(query_symbols)
    mcp.tool()(get_call_graph)


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
