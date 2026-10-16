"""CLI runner and benchmark tool for FastAST."""

import argparse
import ast
import os
import sys
from pathlib import Path
from typing import Optional

from fastast._core import prune_file


def supports_color() -> bool:
    """Return True if terminal supports ANSI color formatting."""
    if os.getenv("NO_COLOR"):
        return False
    return sys.stdout.isatty()


def run_prune(
    file_path: str,
    query: str,
    threshold: float = 0.5,
    output_path: Optional[str] = None,
    show_preview: bool = False,
    quiet: bool = False,
) -> int:
    """Read a Python file, prune using native engine, and report metrics."""
    path = Path(file_path)
    if not path.is_file():
        sys.stderr.write(f"Error: File not found: {file_path}\n")
        return 1

    try:
        source_code = path.read_text(encoding="utf-8")
    except Exception as exc:
        sys.stderr.write(f"Error reading {file_path}: {exc}\n")
        return 1

    # Execute pruning via native Rust Tree-Sitter engine
    res = prune_file(source_code, query, threshold)

    # Validate output syntax
    syntax_ok = False
    if not res.has_syntax_error:
        try:
            ast.parse(res.pruned_code)
            syntax_ok = True
        except SyntaxError:
            syntax_ok = False

    line_savings = 0.0
    if res.total_lines > 0:
        line_savings = (
            (res.total_lines - res.kept_lines) / float(res.total_lines)
        ) * 100.0

    color = supports_color()
    bold = "\033[1m" if color else ""
    green = "\033[32m" if color else ""
    red = "\033[31m" if color else ""
    cyan = "\033[36m" if color else ""
    reset = "\033[0m" if color else ""

    if syntax_ok:
        badge = f"{green}{bold}VALID: ast.parse OK{reset}"
    else:
        badge = f"{red}{bold}SYNTAX ERROR{reset}"

    if not quiet:
        print(
            f"{bold}FastAST Pruning Complete in {cyan}{res.latency_ms:.2f}ms{reset} [{badge}]"
        )
        print(
            f"Tokens: {res.original_tokens:,} -> {res.pruned_tokens:,} "
            f"({bold}{res.savings_pct:.2f}% reduction{reset})"
        )
        print(
            f"Lines:  {res.total_lines:,} -> {res.kept_lines:,} "
            f"({line_savings:.2f}% reduction)"
        )

    # Save pruned code to destination file if requested
    if output_path:
        out = Path(output_path)
        out.write_text(res.pruned_code, encoding="utf-8")
        if not quiet:
            print(f"Output written to: {output_path}")

    # Display preview if requested
    if show_preview and not quiet:
        print(f"\n{bold}--- Pruned Code Preview ---{reset}")
        lines = res.pruned_code.splitlines()
        preview_limit = 60
        for line in lines[:preview_limit]:
            print(line)
        if len(lines) > preview_limit:
            print(f"{cyan}... [{len(lines) - preview_limit} more lines truncated in preview] ...{reset}")

    return 0 if syntax_ok else 2


def main() -> None:
    """CLI entrypoint for fastast."""
    parser = argparse.ArgumentParser(
        prog="fastast",
        description="FastAST: High-performance syntax-guaranteed context pruning for AI coding agents",
    )
    subparsers = parser.add_subparsers(dest="command", help="Available commands")

    # `prune` subcommand
    prune_parser = subparsers.add_parser(
        "prune", help="Prune a Python source file based on a focus query"
    )
    prune_parser.add_argument("file", help="Path to Python source file")
    prune_parser.add_argument(
        "-q", "--query", required=True, help="Semantic search query or symbol identifier"
    )
    prune_parser.add_argument(
        "-t",
        "--threshold",
        type=float,
        default=0.5,
        help="Relevance threshold (0.0 - 1.0, default: 0.5)",
    )
    prune_parser.add_argument(
        "-o", "--output", help="Optional path to write pruned code"
    )
    prune_parser.add_argument(
        "--preview", action="store_true", help="Print preview of pruned code to stdout"
    )

    # Support top-level argument fallback if invoked without 'prune' keyword
    parser.add_argument("file_fallback", nargs="?", help=argparse.SUPPRESS)
    parser.add_argument(
        "-q", "--query", dest="top_query", help=argparse.SUPPRESS
    )
    parser.add_argument(
        "-t", "--threshold", dest="top_threshold", type=float, default=0.5, help=argparse.SUPPRESS
    )
    parser.add_argument(
        "-o", "--output", dest="top_output", help=argparse.SUPPRESS
    )
    parser.add_argument(
        "--preview", dest="top_preview", action="store_true", help=argparse.SUPPRESS
    )

    args = parser.parse_args()

    if args.command == "prune":
        sys.exit(
            run_prune(
                args.file,
                args.query,
                args.threshold,
                args.output,
                args.preview,
            )
        )
    elif args.file_fallback and args.top_query:
        sys.exit(
            run_prune(
                args.file_fallback,
                args.top_query,
                args.top_threshold,
                args.top_output,
                args.top_preview,
            )
        )
    else:
        parser.print_help()
        sys.exit(1)


if __name__ == "__main__":
    main()

