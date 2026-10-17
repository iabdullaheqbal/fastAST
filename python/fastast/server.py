import ast
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

from fastast._core import prune_file
from fastast.db import get_call_graph as db_get_call_graph
from fastast.db import get_connection, search_symbols
from fastast.indexer import index_repository as do_index_repository

# Only create mcp instance if MCP is available
mcp = None
if MCP_AVAILABLE and FastMCP is not None:
    mcp = FastMCP("fastast")


def prune_context(
    code_text: str,
    focus_query: str,
    threshold: float = 0.5,
    language: Optional[str] = None,
) -> str:
    """Prune source code (Python, JavaScript, JSX, etc.) to retain query-relevant logic and valid structural syntax.

    Args:
        code_text: The complete code snippet or module content.
        focus_query: The semantic search query or symbol identifier to focus on.
        threshold: Relevance threshold between 0.0 and 1.0 (default: 0.5).
        language: Optional language name (e.g. 'python', 'javascript', 'jsx'). Defaults to python.

    Returns:
        JSON string containing the pruned code, token metrics, reduction stats,
        latency, and syntax validity.
    """
    if not code_text.strip():
        return json.dumps(
            {
                "pruned_code": "",
                "original_tokens": 0,
                "pruned_tokens": 0,
                "savings_pct": 0.0,
                "total_lines": 0,
                "kept_lines": 0,
                "latency_ms": 0.0,
                "syntax_valid": True,
            },
            indent=2,
        )

    res = prune_file(code_text, focus_query, threshold, language=language)

    if res.has_syntax_error:
        # Pre-existing syntax error in input code
        return json.dumps(
            {
                "error": "PREEXISTING_SYNTAX_ERROR",
                "pruned_code": code_text,
                "original_tokens": res.original_tokens,
                "pruned_tokens": res.pruned_tokens,
                "savings_pct": 0.0,
                "total_lines": res.total_lines,
                "kept_lines": res.total_lines,
                "latency_ms": round(res.latency_ms, 3),
                "syntax_valid": False,
            },
            indent=2,
        )

    # Validate output syntax
    syntax_valid = not res.has_syntax_error
    if syntax_valid and (language in ("python", None)):
        try:
            ast.parse(res.pruned_code)
            syntax_valid = True
        except SyntaxError:
            syntax_valid = False

    if not syntax_valid:
        return json.dumps(
            {
                "error": "PRUNING_SYNTAX_ERROR",
                "pruned_code": res.pruned_code,
                "original_tokens": res.original_tokens,
                "pruned_tokens": res.pruned_tokens,
                "savings_pct": round(res.savings_pct, 2),
                "total_lines": res.total_lines,
                "kept_lines": res.kept_lines,
                "latency_ms": round(res.latency_ms, 3),
                "syntax_valid": False,
            },
            indent=2,
        )

    return json.dumps(
        {
            "pruned_code": res.pruned_code,
            "original_tokens": res.original_tokens,
            "pruned_tokens": res.pruned_tokens,
            "savings_pct": round(res.savings_pct, 2),
            "total_lines": res.total_lines,
            "kept_lines": res.kept_lines,
            "latency_ms": round(res.latency_ms, 3),
            "syntax_valid": True,
        },
        indent=2,
    )


def index_repository(directory_path: str = ".") -> str:
    """Scan and index all Python files in a directory into a local SQLite symbol graph.

    Args:
        directory_path: Path to the repository or project directory (default: current directory).

    Returns:
        JSON string containing repository indexing statistics.
    """
    try:
        res = do_index_repository(directory_path)
        return json.dumps(res, indent=2)
    except Exception as exc:
        return json.dumps({"error": str(exc)}, indent=2)


def query_symbols(query: str, kind: Optional[str] = None, directory_path: str = ".") -> str:
    """Search for symbols (functions, classes, methods) in the indexed codebase.

    Args:
        query: Symbol name or substring to search for.
        kind: Optional symbol kind to filter by ('function', 'async_function', 'class', 'method').
        directory_path: Path to the repository directory (default: current directory).

    Returns:
        JSON string containing matching symbols with file locations and signatures.
    """
    try:
        db_path = Path(directory_path).resolve() / ".fastast.db"
        if not db_path.exists():
            do_index_repository(directory_path)

        conn = get_connection(db_path)
        try:
            results = search_symbols(conn, query, kind)
            return json.dumps(
                {
                    "query": query,
                    "kind": kind,
                    "count": len(results),
                    "symbols": results,
                },
                indent=2,
            )
        finally:
            conn.close()
    except Exception as exc:
        return json.dumps({"error": str(exc)}, indent=2)


def get_call_graph(symbol_name: str, directory_path: str = ".") -> str:
    """Retrieve the call graph (callers and callees) for a specific function or method.

    Args:
        symbol_name: Name of the function or method to inspect.
        directory_path: Path to the repository directory (default: current directory).

    Returns:
        JSON string listing all callers (who invokes this) and callees (what this invokes).
    """
    try:
        db_path = Path(directory_path).resolve() / ".fastast.db"
        if not db_path.exists():
            do_index_repository(directory_path)

        conn = get_connection(db_path)
        try:
            graph = db_get_call_graph(conn, symbol_name)
            return json.dumps(graph, indent=2)
        finally:
            conn.close()
    except Exception as exc:
        return json.dumps({"error": str(exc)}, indent=2)


# Register tools with MCP server if available
if mcp is not None:
    mcp.tool()(prune_context)
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
