"""FastMCP server implementation for FastAST context pruning."""

import ast
import json
from typing import Any, Dict

try:
    from mcp.server.fastmcp import FastMCP
except (ImportError, ModuleNotFoundError):
    from mcp.server.mcpserver import MCPServer as FastMCP

from fastast._core import prune_file

mcp = FastMCP("fastast")


@mcp.tool()
def prune_context(code_text: str, focus_query: str, threshold: float = 0.5) -> str:
    """Prune Python source code to retain query-relevant logic and valid structural syntax.

    Args:
        code_text: The complete Python code snippet or module content.
        focus_query: The semantic search query or symbol identifier to focus on.
        threshold: Relevance threshold between 0.0 and 1.0 (default: 0.5).

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

    res = prune_file(code_text, focus_query, threshold)

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

    # Validate output syntax using Python's ast parser
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


def main() -> None:
    """Run the FastAST MCP server over stdio."""
    mcp.run(transport="stdio")


if __name__ == "__main__":
    main()
