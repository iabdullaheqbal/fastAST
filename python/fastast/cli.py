"""CLI runner and benchmark tool for FastAST."""

import argparse
import ast
import json
import os
import sys
from pathlib import Path
from typing import Optional, Tuple

from fastast import __version__
from fastast._core import prune_file
from fastast.db import get_call_graph, get_connection, search_symbols
from fastast.indexer import index_repository

# Supported file extensions mapped to canonical language identifiers
SUPPORTED_EXTENSIONS = {
    "py": "python",
    "pyi": "python",
    "pyw": "python",
    "js": "javascript",
    "jsx": "javascript",
    "mjs": "javascript",
    "cjs": "javascript",
    "ts": "typescript",
    "tsx": "typescript",
    "mts": "typescript",
    "cts": "typescript",
    "java": "java",
    "html": "html",
    "htm": "html",
    "xhtml": "html",
    "css": "css",
    "rs": "rust",
    "json": "json",
    "jsonc": "json",
    "toml": "toml",
}

# User-friendly aliases for --language flag
LANGUAGE_ALIASES = {
    "py": "python",
    "python": "python",
    "js": "javascript",
    "javascript": "javascript",
    "jsx": "javascript",
    "ts": "typescript",
    "typescript": "typescript",
    "tsx": "typescript",
    "java": "java",
    "rs": "rust",
    "rust": "rust",
    "html": "html",
    "htm": "html",
    "css": "css",
    "json": "json",
    "toml": "toml",
}


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
    """Auto-detect canonical language identifier from file extension."""
    ext = path.suffix.lower().lstrip(".")
    return SUPPORTED_EXTENSIONS.get(ext)


def validate_syntax(code: str, language: Optional[str]) -> Tuple[bool, str]:
    """Validate syntax using language-specific runtime parser when available.

    Returns:
        (is_valid, status_message)
    """
    lang = (language or "python").strip().lower()
    if lang in ("python", "py"):
        try:
            ast.parse(code)
            return True, "ast.parse OK"
        except SyntaxError as exc:
            return False, f"SyntaxError at line {exc.lineno}"
    elif lang == "json":
        try:
            json.loads(code)
            return True, "json.loads OK"
        except Exception:
            return False, "Invalid JSON"
    elif lang == "toml":
        try:
            import tomllib
            tomllib.loads(code)
            return True, "tomllib.loads OK"
        except Exception:
            return False, "Invalid TOML"
    # For JS, TS, Java, Rust, HTML, CSS: Tree-Sitter error checking handled in native engine
    return True, "Tree-sitter OK"


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
        if json_output:
            print(
                json.dumps(
                    {
                        "error": f"File not found: {file_path}",
                        "file": file_path,
                        "syntax_valid": False,
                    },
                    indent=2,
                )
            )
        else:
            sys.stderr.write(f"Error: File not found: {file_path}\n")
        return 1

    try:
        source_code = path.read_text(encoding="utf-8")
    except Exception as exc:
        if json_output:
            print(
                json.dumps(
                    {
                        "error": f"Error reading {file_path}: {exc}",
                        "file": file_path,
                        "syntax_valid": False,
                    },
                    indent=2,
                )
            )
        else:
            sys.stderr.write(f"Error reading {file_path}: {exc}\n")
        return 1

    # Resolve language (explicit flag takes precedence, else auto-detect from extension)
    if language:
        canonical_lang = LANGUAGE_ALIASES.get(language.strip().lower())
        if not canonical_lang:
            supported = ", ".join(sorted(set(LANGUAGE_ALIASES.values())))
            if json_output:
                print(
                    json.dumps(
                        {
                            "error": f"Unsupported language '{language}'. Supported: {supported}",
                            "file": file_path,
                            "syntax_valid": False,
                        },
                        indent=2,
                    )
                )
            else:
                sys.stderr.write(
                    f"Error: Unsupported language '{language}'.\n"
                    f"Supported languages: {supported}\n"
                )
            return 1
        detected_lang = canonical_lang
    else:
        detected_lang = detect_language_from_path(path) or "python"

    # Clamp threshold between 0.0 and 1.0
    try:
        norm_threshold = float(threshold)
        if norm_threshold > 1.0:
            norm_threshold = norm_threshold / 100.0 if norm_threshold <= 100.0 else 1.0
        norm_threshold = max(0.0, min(1.0, norm_threshold))
    except (ValueError, TypeError):
        norm_threshold = 0.5

    # Execute pruning via native Tree-Sitter engine
    try:
        res = prune_file(source_code, query, norm_threshold, language=detected_lang)
    except Exception as exc:
        if json_output:
            print(
                json.dumps(
                    {
                        "error": f"Pruning failed: {exc}",
                        "file": file_path,
                        "syntax_valid": False,
                    },
                    indent=2,
                )
            )
        else:
            sys.stderr.write(f"Error: Pruning failed: {exc}\n")
        return 1

    # Validate output syntax
    syntax_ok = not res.has_syntax_error
    validator_detail = "Syntax error in code"
    if syntax_ok:
        syntax_ok, validator_detail = validate_syntax(res.pruned_code, detected_lang)

    line_savings = 0.0
    if res.total_lines > 0:
        line_savings = (
            (res.total_lines - res.kept_lines) / float(res.total_lines)
        ) * 100.0

    # JSON output mode
    if json_output:
        output_dict = {
            "language": detected_lang,
            "query": query,
            "threshold": norm_threshold,
            "pruned_code": res.pruned_code,
            "original_tokens": res.original_tokens,
            "pruned_tokens": res.pruned_tokens,
            "savings_pct": res.savings_pct,
            "total_lines": res.total_lines,
            "kept_lines": res.kept_lines,
            "line_savings_pct": round(line_savings, 2),
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
        badge = f"{green}{bold}VALID: {validator_detail}{reset}"
    else:
        badge = f"{red}{bold}SYNTAX ERROR{reset}"

    if not quiet:
        lang_tag = f" [Language: {bold}{detected_lang}{reset} | {badge}]"
        print(
            f"{bold}FastAST Pruning Complete in {cyan}{res.latency_ms:.2f}ms{reset}{lang_tag}"
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
        print(f"\n{bold}PRUNED CODE:{reset} ({detected_lang})")
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
    """Index a repository or directory into SQLite."""
    path = Path(repo_path).resolve()
    if not path.exists():
        if json_output:
            print(
                json.dumps(
                    {
                        "error": f"Path not found: {repo_path}",
                        "repo_path": repo_path,
                    },
                    indent=2,
                )
            )
        else:
            sys.stderr.write(f"Error: Path not found: {repo_path}\n")
        return 1

    index_path = str(path.parent if path.is_file() else path)

    try:
        res = index_repository(index_path, force_reindex=force)
    except Exception as exc:
        error_msg = {"error": str(exc)}
        if json_output:
            print(json.dumps(error_msg, indent=2))
        else:
            sys.stderr.write(f"Error during indexing: {exc}\n")
        return 1

    if json_output:
        print(json.dumps(res, indent=2))
        return 0

    color = supports_color() and not quiet
    bold = "\033[1m" if color else ""
    cyan = "\033[36m" if color else ""
    green = "\033[32m" if color else ""
    reset = "\033[0m" if color else ""

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
        if res.get("languages"):
            lang_summary = ", ".join(f"{k} ({v})" for k, v in res["languages"].items())
            print(f"Languages: {lang_summary}")

    return 0


def run_symbols(
    query: str,
    kind: Optional[str] = None,
    language: Optional[str] = None,
    limit: int = 50,
    dir_path: str = ".",
    quiet: bool = False,
    json_output: bool = False,
) -> int:
    """Search symbols across indexed repository."""
    root = Path(dir_path).resolve()
    if not root.exists():
        if json_output:
            print(
                json.dumps(
                    {
                        "error": f"Directory not found: {dir_path}",
                        "query": query,
                        "language": language,
                        "symbols": [],
                    },
                    indent=2,
                )
            )
        else:
            sys.stderr.write(f"Error: Directory not found: {dir_path}\n")
        return 1

    if root.is_file():
        root = root.parent

    db_path = root / ".fastast.db"
    if not db_path.exists():
        if not quiet and not json_output:
            print("Index not found. Indexing repository first...")
        index_repository(str(root))

    conn = get_connection(db_path)
    try:
        symbols = search_symbols(
            conn, query, kind=kind, language=language, limit=limit
        )
    finally:
        conn.close()

    if json_output:
        output = {
            "query": query,
            "kind": kind,
            "language": language,
            "count": len(symbols),
            "symbols": symbols,
        }
        print(json.dumps(output, indent=2))
        return 0

    color = supports_color() and not quiet
    bold = "\033[1m" if color else ""
    cyan = "\033[36m" if color else ""
    yellow = "\033[33m" if color else ""
    reset = "\033[0m" if color else ""

    if not quiet:
        kind_str = f" [{kind}]" if kind else ""
        lang_str = f" [{language}]" if language else ""
        if not symbols:
            print(f"No symbols found matching '{query}'{kind_str}{lang_str}.")
            return 0

        print(
            f"{bold}Found {len(symbols)} symbol(s) matching '{query}'{kind_str}{lang_str}:{reset}"
        )
        for s in symbols:
            parent = f"{s['parent_name']}." if s.get("parent_name") else ""
            lang_badge = f"{cyan}[{s['language']}]{reset} " if s.get("language") else ""
            print(
                f"  {lang_badge}{yellow}[{s['kind']}]{reset} {bold}{parent}{s['name']}{reset}{s['signature']} "
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
    root = Path(dir_path).resolve()
    if not root.exists():
        if json_output:
            print(
                json.dumps(
                    {
                        "error": f"Directory not found: {dir_path}",
                        "symbol": symbol_name,
                        "call_graph": {},
                    },
                    indent=2,
                )
            )
        else:
            sys.stderr.write(f"Error: Directory not found: {dir_path}\n")
        return 1

    if root.is_file():
        root = root.parent

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
        # Wrap call graph for backward compatibility while providing top-level fields
        output = {
            "call_graph": graph,
            "symbol": graph["symbol"],
            "caller_count": graph["caller_count"],
            "callee_count": graph["callee_count"],
            "callers": graph["callers"],
            "callees": graph["callees"],
        }
        print(json.dumps(output, indent=2))
        return 0

    color = supports_color() and not quiet
    bold = "\033[1m" if color else ""
    cyan = "\033[36m" if color else ""
    green = "\033[32m" if color else ""
    yellow = "\033[33m" if color else ""
    reset = "\033[0m" if color else ""

    if not quiet:
        print(f"{bold}Call Graph for '{symbol_name}':{reset}")
        print(f"{green}Callers ({graph['caller_count']}):{reset}")
        if not graph["callers"]:
            print("  (no callers found in indexed files)")
        else:
            for c in graph["callers"]:
                lang_tag = f"[{c['language']}] " if c.get("language") else ""
                print(
                    f"  <- {bold}{lang_tag}{c['caller']}{reset} ({c['caller_kind']}) "
                    f"in {cyan}{c['file_path']}:{c['line_number']}{reset}"
                )

        print(f"{yellow}Callees ({graph['callee_count']}):{reset}")
        if not graph["callees"]:
            print("  (no callees invoked)")
        else:
            for c in graph["callees"]:
                lang_tag = f"[{c['language']}] " if c.get("language") else ""
                print(
                    f"  -> {bold}{lang_tag}{c['callee']}{reset}() "
                    f"at {cyan}{c['file_path']}:{c['line_number']}{reset}"
                )

    return 0


def main() -> None:
    """CLI entrypoint for fastast."""
    parser = argparse.ArgumentParser(
        prog="fastast",
        description=(
            "FastAST: Ultra-fast, syntax-guaranteed context pruner & codebase intelligence engine.\n"
            "Prunes source code across 8 languages (Python, JS/TS, Java, Rust, HTML, CSS, JSON, TOML)\n"
            "by 40-80% to fit LLM context windows while guaranteeing structural validity."
        ),
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=(
            "examples:\n"
            "  fastast prune src/app.py -q 'login_user' --preview\n"
            "  fastast prune config.json -q 'database' --json\n"
            "  fastast prune Cargo.toml -q 'dependencies' --preview\n"
            "  fastast index .\n"
            "  fastast symbols 'handle_request' --kind function\n"
            "  fastast calls 'execute_query'\n"
            "  fastast src/handler.py -q 'validate'  # shorthand prune"
        ),
    )
    parser.add_argument(
        "-v",
        "--version",
        action="version",
        version=f"fastast {__version__}",
    )

    subparsers = parser.add_subparsers(dest="command", help="Available commands")

    # `prune` subcommand
    prune_parser = subparsers.add_parser(
        "prune",
        help="Prune a source file based on a focus query while guaranteeing syntax",
        description=(
            "Prune source code (Python, JS/JSX, TS/TSX, Java, Rust, HTML, CSS, JSON, TOML)\n"
            "by removing query-irrelevant function/class/block bodies and replacing them\n"
            "with valid language stubs (e.g. 'pass', empty blocks, '{}')."
        ),
    )
    prune_parser.add_argument(
        "file",
        help="Path to source file to prune",
    )
    prune_parser.add_argument(
        "-q",
        "--query",
        required=True,
        help="Target symbol name, keywords, or semantic intent to retain",
    )
    prune_parser.add_argument(
        "-t",
        "--threshold",
        type=float,
        default=0.5,
        help="Relevance threshold between 0.0 and 1.0 (default: 0.5)",
    )
    prune_parser.add_argument(
        "-o",
        "--output",
        help="Optional path to write pruned code",
    )
    prune_parser.add_argument(
        "--preview",
        action="store_true",
        help="Print preview of pruned code to stdout",
    )
    prune_parser.add_argument(
        "--show-code",
        action="store_true",
        help="Show pruned code on stdout (alias for --preview)",
    )
    prune_parser.add_argument(
        "--json",
        action="store_true",
        help="Output results as JSON with token metrics, reduction stats, and code",
    )
    prune_parser.add_argument(
        "-l",
        "--language",
        help="Explicit language override (python, javascript, typescript, java, rust, html, css, json, toml)",
    )
    prune_parser.add_argument(
        "-s",
        "--silent",
        "--quiet",
        dest="quiet",
        action="store_true",
        help="Suppress non-error status output",
    )

    # `index` subcommand
    index_parser = subparsers.add_parser(
        "index",
        help="Index a repository into a local SQLite symbol graph (.fastast.db)",
        description="Recursively scan and extract functions, classes, methods, imports, and calls into SQLite.",
    )
    index_parser.add_argument(
        "dir",
        nargs="?",
        default=".",
        help="Root directory of the repository (default: current directory)",
    )
    index_parser.add_argument(
        "--force",
        action="store_true",
        help="Force reindexing all files even if unchanged",
    )
    index_parser.add_argument(
        "--json",
        action="store_true",
        help="Output indexing statistics in JSON format",
    )
    index_parser.add_argument(
        "-s",
        "--silent",
        "--quiet",
        dest="quiet",
        action="store_true",
        help="Suppress progress output",
    )

    # `symbols` subcommand
    symbols_parser = subparsers.add_parser(
        "symbols",
        help="Search for symbols in the indexed repository",
        description="Search symbols by name or substring. Automatically creates index if not present.",
    )
    symbols_parser.add_argument(
        "query",
        help="Symbol name or substring to search for",
    )
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
        "-L",
        "--language",
        help="Filter symbols by programming language (python, rust, javascript, typescript, java, etc.)",
    )
    symbols_parser.add_argument(
        "-d",
        "--dir",
        default=".",
        help="Repository root directory (default: current directory)",
    )
    symbols_parser.add_argument(
        "--json",
        action="store_true",
        help="Output results as JSON",
    )
    symbols_parser.add_argument(
        "-s",
        "--silent",
        "--quiet",
        dest="quiet",
        action="store_true",
        help="Suppress status output",
    )

    # `calls` subcommand
    calls_parser = subparsers.add_parser(
        "calls",
        help="Display call graph (callers and callees) for a symbol",
        description="Inspect invocation hierarchy: callers (who calls this) and callees (what this calls).",
    )
    calls_parser.add_argument(
        "symbol",
        help="Function or method name to inspect",
    )
    calls_parser.add_argument(
        "-d",
        "--dir",
        default=".",
        help="Repository root directory (default: current directory)",
    )
    calls_parser.add_argument(
        "--json",
        action="store_true",
        help="Output results as JSON",
    )
    calls_parser.add_argument(
        "-s",
        "--silent",
        "--quiet",
        dest="quiet",
        action="store_true",
        help="Suppress status output",
    )

    # Check for shorthand invocation: `fastast <file> -q <query>`
    subcommands = {"prune", "index", "symbols", "calls"}
    help_version = {"-h", "--help", "-v", "--version"}
    raw_args = sys.argv[1:]

    if (
        raw_args
        and not any(a in subcommands for a in raw_args)
        and not any(a in help_version for a in raw_args)
    ):
        args = parser.parse_args(["prune"] + raw_args)
    else:
        args = parser.parse_args()

    if args.command == "prune":
        sys.exit(
            run_prune(
                args.file,
                args.query,
                args.threshold,
                args.output,
                show_preview=getattr(args, "show_code", False)
                or getattr(args, "preview", False),
                quiet=getattr(args, "quiet", False),
                json_output=getattr(args, "json", False),
                language=getattr(args, "language", None),
            )
        )
    elif args.command == "index":
        sys.exit(
            run_index(
                args.dir,
                force=args.force,
                quiet=getattr(args, "quiet", False),
                json_output=getattr(args, "json", False),
            )
        )
    elif args.command == "symbols":
        sys.exit(
            run_symbols(
                args.query,
                kind=args.kind,
                language=getattr(args, "language", None),
                limit=args.limit,
                dir_path=args.dir,
                quiet=getattr(args, "quiet", False),
                json_output=getattr(args, "json", False),
            )
        )
    elif args.command == "calls":
        sys.exit(
            run_calls(
                args.symbol,
                dir_path=args.dir,
                quiet=getattr(args, "quiet", False),
                json_output=getattr(args, "json", False),
            )
        )
    else:
        parser.print_help()
        sys.exit(1)


if __name__ == "__main__":
    main()
