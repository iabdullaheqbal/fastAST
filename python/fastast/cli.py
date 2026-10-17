"""CLI runner and benchmark tool for FastAST."""

import argparse
import ast
import json
import os
import sys
from pathlib import Path
from typing import Optional

from fastast._core import prune_file
from fastast.db import get_call_graph, get_connection, search_symbols
from fastast.indexer import index_repository


# Module-level function aliases for backward compatibility
def cmd_prune(*args, **kwargs):
    """Alias for run_prune for backward compatibility."""
    return run_prune(*args, **kwargs)


def cmd_index(*args, **kwargs):
    """Alias for run_index for backward compatibility."""
    return run_index(*args, **kwargs)


def cmd_symbols(*args, **kwargs):
    """Alias for run_symbols for backward compatibility."""
    return run_symbols(*args, **kwargs)


def cmd_calls(*args, **kwargs):
    """Alias for run_calls for backward compatibility."""
    return run_calls(*args, **kwargs)


def supports_color() -> bool:
    """Return True if terminal supports ANSI color formatting."""
    if os.getenv("NO_COLOR"):
        return False
    return sys.stdout.isatty()


def detect_language_from_path(path: Path) -> Optional[str]:
    ext = path.suffix.lower().lstrip(".")
    mapping = {
        "py": "python",
        "pyi": "python",
        "pyw": "python",
        "js": "javascript",
        "jsx": "javascript",
        "mjs": "javascript",
        "cjs": "javascript",
        "ts": "typescript",
        "tsx": "typescript",
        "java": "java",
        "html": "html",
        "htm": "html",
        "css": "css",
    }
    return mapping.get(ext)


def run_prune(
    file_path: str,
    query: str,
    threshold: float = 0.5,
    output_path: Optional[str] = None,
    show_preview: bool = False,
    quiet: bool = False,
    json_output: bool = False,
    language: Optional[str] = None,
) -> int:
    """Read a source file, prune using native engine, and report metrics."""
    path = Path(file_path)
    if not path.is_file():
        sys.stderr.write(f"Error: File not found: {file_path}\n")
        return 1

    try:
        source_code = path.read_text(encoding="utf-8")
    except Exception as exc:
        sys.stderr.write(f"Error reading {file_path}: {exc}\n")
        return 1

    # Detect language from file path if not explicitly provided
    detected_lang = language or detect_language_from_path(path)

    # Execute pruning via native Rust Tree-Sitter engine
    res = prune_file(source_code, query, threshold, language=detected_lang)

    # Validate output syntax
    syntax_ok = not res.has_syntax_error
    if syntax_ok and (detected_lang in ("python", None)):
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

    # JSON output mode
    if json_output:
        output_dict = {
            "pruned_code": res.pruned_code,
            "original_tokens": res.original_tokens,
            "pruned_tokens": res.pruned_tokens,
            "savings_pct": res.savings_pct,
            "total_lines": res.total_lines,
            "kept_lines": res.kept_lines,
            "latency_ms": res.latency_ms,
            "has_syntax_error": res.has_syntax_error,
            "syntax_valid": syntax_ok,
        }
        print(json.dumps(output_dict, indent=2))
        return 0 if syntax_ok else 2

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
        print(f"\n{bold}PRUNED CODE:{reset}")
        lines = res.pruned_code.splitlines()
        for line in lines:
            print(line)

    return 0 if syntax_ok else 2


def run_index(
    repo_path: str = ".",
    force: bool = False,
    quiet: bool = False,
    json_output: bool = False,
) -> int:
    """Index a repository or file into SQLite."""
    color = supports_color() and not json_output
    bold = "\033[1m" if color else ""
    cyan = "\033[36m" if color else ""
    green = "\033[32m" if color else ""
    reset = "\033[0m" if color else ""

    # If a file path is given, use its parent directory for indexing
    path = Path(repo_path)
    if path.is_file():
        index_path = str(path.parent)
    else:
        index_path = repo_path

    try:
        res = index_repository(index_path, force_reindex=force)
    except Exception as exc:
        error_msg = {"error": str(exc)}
        if json_output:
            print(json.dumps(error_msg))
        else:
            sys.stderr.write(f"Error during indexing: {exc}\n")
        return 1

    if json_output:
        print(json.dumps(res, indent=2))
        return 0

    if not quiet:
        print(
            f"{bold}FastAST Repository Indexing Complete in {cyan}{res['elapsed_ms']:.2f}ms{reset}"
        )
        print(f"Database: {res['db_path']}")
        print(
            f"Files:    {res['total_files']:,} scanned ("
            f"{green}{res['indexed_files']:,} indexed{reset}, "
            f"{res['skipped_files']:,} skipped, {res['error_files']:,} errors)"
        )
        print(
            f"Graph:    {bold}{res['total_symbols']:,}{reset} symbols, "
            f"{res['total_imports']:,} imports, {res['total_calls']:,} calls"
        )

    return 0


def run_symbols(
    query: str,
    kind: Optional[str] = None,
    limit: int = 50,
    dir_path: str = ".",
    quiet: bool = False,
    json_output: bool = False,
) -> int:
    """Search symbols across indexed repository."""
    color = supports_color() and not json_output
    bold = "\033[1m" if color else ""
    cyan = "\033[36m" if color else ""
    yellow = "\033[33m" if color else ""
    reset = "\033[0m" if color else ""

    root = Path(dir_path).resolve()
    db_path = root / ".fastast.db"
    if not db_path.exists():
        if not quiet and not json_output:
            print("Index not found. Indexing repository first...")
        index_repository(str(root))

    conn = get_connection(db_path)
    try:
        symbols = search_symbols(conn, query, kind=kind, limit=limit)
    finally:
        conn.close()

    if json_output:
        output = {
            "query": query,
            "kind": kind,
            "count": len(symbols),
            "symbols": symbols,
        }
        print(json.dumps(output, indent=2))
        return 0

    if not quiet:
        kind_str = f" [{kind}]" if kind else ""
        print(f"{bold}Found {len(symbols)} symbol(s) matching '{query}'{kind_str}:{reset}")
        for s in symbols:
            parent = f"{s['parent_name']}." if s["parent_name"] else ""
            print(
                f"  {yellow}[{s['kind']}]{reset} {bold}{parent}{s['name']}{reset}{s['signature']} "
                f"-> {cyan}{s['file_path']}:{s['start_line']}-{s['end_line']}{reset}"
            )
            if s.get("docstring"):
                first_line = s["docstring"].strip().splitlines()[0].strip()
                if first_line:
                    print(f"    {first_line[:80]}")

    return 0


def run_calls(
    symbol_name: str,
    dir_path: str = ".",
    quiet: bool = False,
    json_output: bool = False,
) -> int:
    """Display callers and callees for a symbol."""
    color = supports_color() and not json_output
    bold = "\033[1m" if color else ""
    cyan = "\033[36m" if color else ""
    green = "\033[32m" if color else ""
    yellow = "\033[33m" if color else ""
    reset = "\033[0m" if color else ""

    root = Path(dir_path).resolve()
    db_path = root / ".fastast.db"
    if not db_path.exists():
        if not quiet and not json_output:
            print("Index not found. Indexing repository first...")
        index_repository(str(root))

    conn = get_connection(db_path)
    try:
        graph = get_call_graph(conn, symbol_name)
    finally:
        conn.close()

    if json_output:
        # Wrap the call graph in a top-level "call_graph" key for consistency
        output = {
            "call_graph": graph
        }
        print(json.dumps(output, indent=2))
        return 0

    if not quiet:
        print(f"{bold}Call Graph for '{symbol_name}':{reset}")
        print(f"{green}Callers ({graph['caller_count']}):{reset}")
        if not graph["callers"]:
            print("  (no callers found in indexed files)")
        else:
            for c in graph["callers"]:
                print(
                    f"  <- {bold}{c['caller']}{reset} ({c['caller_kind']}) "
                    f"in {cyan}{c['file_path']}:{c['line_number']}{reset}"
                )

        print(f"{yellow}Callees ({graph['callee_count']}):{reset}")
        if not graph["callees"]:
            print("  (no callees invoked)")
        else:
            for c in graph["callees"]:
                print(
                    f"  -> {bold}{c['callee']}{reset}() "
                    f"at {cyan}{c['file_path']}:{c['line_number']}{reset}"
                )

    return 0


def main() -> None:
    """CLI entrypoint for fastast."""
    parser = argparse.ArgumentParser(
        prog="fastast",
        description="FastAST: High-performance syntax-guaranteed context pruning and repository symbol engine",
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
    prune_parser.add_argument(
        "--show-code", action="store_true", help="Show pruned code on stdout"
    )
    prune_parser.add_argument(
        "--json", action="store_true", help="Output results as JSON"
    )
    prune_parser.add_argument(
        "-l", "--language", help="Source code language (python, javascript, jsx, java, etc.)"
    )

    # `index` subcommand
    index_parser = subparsers.add_parser(
        "index", help="Index a repository into a local SQLite symbol graph"
    )
    index_parser.add_argument(
        "dir",
        nargs="?",
        default=".",
        help="Root directory of the repository (default: current directory)",
    )
    index_parser.add_argument(
        "--force", action="store_true", help="Force reindexing all files"
    )
    index_parser.add_argument(
        "--json", action="store_true", help="Output results as JSON"
    )

    # `symbols` subcommand
    symbols_parser = subparsers.add_parser(
        "symbols", help="Search for symbols in the indexed repository"
    )
    symbols_parser.add_argument("query", help="Symbol name or substring to search")
    symbols_parser.add_argument(
        "-k",
        "--kind",
        choices=["function", "async_function", "class", "method"],
        help="Filter by symbol kind",
    )
    symbols_parser.add_argument(
        "-l",
        "--limit",
        type=int,
        default=50,
        help="Maximum number of symbols to return (default: 50)",
    )
    symbols_parser.add_argument(
        "-d",
        "--dir",
        default=".",
        help="Repository root directory (default: current directory)",
    )
    symbols_parser.add_argument(
        "--json", action="store_true", help="Output results as JSON"
    )

    # `calls` subcommand
    calls_parser = subparsers.add_parser(
        "calls", help="Display call graph (callers and callees) for a symbol"
    )
    calls_parser.add_argument("symbol", help="Function or method name")
    calls_parser.add_argument(
        "-d",
        "--dir",
        default=".",
        help="Repository root directory (default: current directory)",
    )
    calls_parser.add_argument(
        "--json", action="store_true", help="Output results as JSON"
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
                getattr(args, 'show_code', False) or getattr(args, 'preview', False),
                json_output=getattr(args, 'json', False),
                language=getattr(args, 'language', None),
            )
        )
    elif args.command == "index":
        sys.exit(
            run_index(
                args.dir,
                force=args.force,
                json_output=getattr(args, 'json', False),
            )
        )
    elif args.command == "symbols":
        sys.exit(
            run_symbols(
                args.query,
                kind=args.kind,
                limit=args.limit,
                dir_path=args.dir,
                json_output=getattr(args, 'json', False),
            )
        )
    elif args.command == "calls":
        sys.exit(
            run_calls(
                args.symbol,
                dir_path=args.dir,
                json_output=getattr(args, 'json', False),
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

