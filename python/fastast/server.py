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


def _validate_syntax(code: str, language: Optional[str]) -> bool:
    """Validate syntax of code for supported runtime parsers (Python, JSON, TOML)."""
    lang = (language or "python").strip().lower()
    if lang in ("python", "py"):
        try:
            ast.parse(code)
            return True
        except SyntaxError:
            return False
    elif lang == "json":
        try:
            json.loads(code)
            return True
        except Exception:
            return False
    elif lang == "toml":
        try:
            import tomllib
            tomllib.loads(code)
            return True
        except Exception:
            return False
    # For JS, TS, Java, Rust, HTML, CSS: Tree-sitter error checking in native engine
    return True


def prune_context(
    code_text: str,
    focus_query: str,
    threshold: float = 0.5,
    language: Optional[str] = None,
) -> str:
    """Prune source code to retain query-relevant logic while guaranteeing syntactically valid structure.

    Use this tool to reduce context token usage (typically 40-80% reduction) before feeding
    large files or modules into reasoning, planning, or code generation prompts. Irrelevant
    function, class, and block bodies are replaced with language-appropriate valid stubs
    (e.g., 'pass' in Python, empty bodies in JS/Rust, '{}' in JSON), while imports, signatures,
    and transitive dependencies are preserved.

    Supported languages:
        - python (or py)
        - javascript (or js, jsx, mjs, cjs)
        - typescript (or ts, tsx, mts, cts)
        - java
        - rust (or rs)
        - html (or htm)
        - css
        - json
        - toml

    Args:
        code_text: Complete source code snippet or file content to prune.
        focus_query: Target symbol, function name, keywords, or semantic intent to retain (e.g. 'auth_middleware', 'calculate_tax', 'ButtonProps').
        threshold: Relevance score cutoff between 0.0 and 1.0 (default: 0.5).
                   Use 0.7-0.9 for aggressive pruning (keeping only direct matches);
                   use 0.2-0.4 for broader retention (keeping related context and helpers).
        language: Optional language name (e.g. 'python', 'typescript', 'rust', 'json').
                  If omitted, defaults to 'python'.

    Returns:
        JSON string with keys:
            - pruned_code (str): The syntactically valid pruned code to insert into prompt context.
            - original_tokens (int): Estimated token count of the original input.
            - pruned_tokens (int): Estimated token count of the pruned output.
            - savings_pct (float): Percentage of tokens saved (0.0 to 100.0).
            - total_lines (int): Total line count of input.
            - kept_lines (int): Lines preserved in pruned output.
            - latency_ms (float): Execution latency in milliseconds (typically <1ms).
            - syntax_valid (bool): True if output passed AST/parser syntax verification.
            - language (str): The language parser used.
            - error (str, optional): Error code if an issue occurred (e.g. 'PREEXISTING_SYNTAX_ERROR').
    """
    lang_name = (language or "python").strip().lower()

    # Handle empty or whitespace-only code
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
                "language": lang_name,
            },
            indent=2,
        )

    # Normalize threshold (handle values passed as percentages e.g. 50 -> 0.5)
    try:
        norm_threshold = float(threshold)
        if norm_threshold > 1.0:
            norm_threshold = norm_threshold / 100.0 if norm_threshold <= 100.0 else 1.0
        norm_threshold = max(0.0, min(1.0, norm_threshold))
    except (ValueError, TypeError):
        norm_threshold = 0.5

    try:
        res = prune_file(code_text, focus_query or "", norm_threshold, language=language)
    except ValueError as val_err:
        return json.dumps(
            {
                "error": "UNSUPPORTED_LANGUAGE",
                "message": str(val_err),
                "pruned_code": code_text,
                "original_tokens": 0,
                "pruned_tokens": 0,
                "savings_pct": 0.0,
                "total_lines": len(code_text.splitlines()),
                "kept_lines": len(code_text.splitlines()),
                "latency_ms": 0.0,
                "syntax_valid": False,
                "language": lang_name,
            },
            indent=2,
        )
    except Exception as exc:
        return json.dumps(
            {
                "error": "PRUNING_FAILED",
                "message": str(exc),
                "pruned_code": code_text,
                "original_tokens": 0,
                "pruned_tokens": 0,
                "savings_pct": 0.0,
                "total_lines": len(code_text.splitlines()),
                "kept_lines": len(code_text.splitlines()),
                "latency_ms": 0.0,
                "syntax_valid": False,
                "language": lang_name,
            },
            indent=2,
        )

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
                "language": lang_name,
            },
            indent=2,
        )

    # Validate output syntax
    syntax_valid = not res.has_syntax_error
    if syntax_valid:
        syntax_valid = _validate_syntax(res.pruned_code, language)

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
                "language": lang_name,
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
            "language": lang_name,
        },
        indent=2,
    )


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
