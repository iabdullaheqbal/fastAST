"""CLI runner and indexing tool for FastAST."""

import argparse
import json
import os
import sys
from pathlib import Path
from typing import Optional

from fastast import __version__
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


def run_scan(
    dir_path: str = ".",
    language: Optional[str] = None,
    category: Optional[str] = None,
    extra_ignores: Optional[list] = None,
    json_output: bool = False,
) -> int:
    """Scan and admit repository files based on multi-layer ignore rules."""
    root = Path(dir_path).resolve()
    if not root.exists():
        if json_output:
            print(json.dumps({"error": f"Directory not found: {dir_path}", "files": []}, indent=2))
        else:
            sys.stderr.write(f"Error: Directory not found: {dir_path}\n")
        return 1

    from fastast.discovery import discover_files

    langs = {language} if language else None
    cats = {category} if category else None

    records = discover_files(
        root,
        languages=langs,
        categories=cats,
        extra_ignores=extra_ignores,
    )

    cat_counts: dict = {}
    lang_counts: dict = {}
    for r in records:
        cat_counts[r.category] = cat_counts.get(r.category, 0) + 1
        lang_counts[r.language] = lang_counts.get(r.language, 0) + 1

    if json_output:
        payload = {
            "root": str(root),
            "total_files": len(records),
            "categories": cat_counts,
            "languages": lang_counts,
            "files": [r.to_dict() for r in records],
        }
        print(json.dumps(payload, indent=2))
        return 0

    print(f"FastAST Admission Scan for '{root}':")
    print(f"Total Admitted Files: {len(records)}")
    if cat_counts:
        print("Categories: " + ", ".join(f"{k}: {v}" for k, v in sorted(cat_counts.items())))
    if lang_counts:
        print("Languages:  " + ", ".join(f"{k}: {v}" for k, v in sorted(lang_counts.items())))
    print("\nAdmitted Files:")
    for r in records[:30]:
        print(f"  [{r.category:<7}] {r.path:<40} ({r.language}, {r.hash[:8]}..., {r.total_lines} lines)")
    if len(records) > 30:
        print(f"  ... and {len(records) - 30} more files.")
    return 0


def run_index(
    dir_path: str = ".",
    force: bool = False,
    quiet: bool = False,
    json_output: bool = False,
) -> int:
    """Index a repository into SQLite."""
    root = Path(dir_path).resolve()
    if not root.exists():
        if json_output:
            print(
                json.dumps(
                    {
                        "error": f"Directory not found: {dir_path}",
                        "repo_path": dir_path,
                        "indexed_files": 0,
                    },
                    indent=2,
                )
            )
        else:
            sys.stderr.write(f"Error: Directory not found: {dir_path}\n")
        return 1

    if root.is_file():
        root = root.parent

    try:
        res = index_repository(str(root), force_reindex=force)
    except Exception as exc:
        if json_output:
            print(
                json.dumps(
                    {
                        "error": f"Indexing failed: {exc}",
                        "repo_path": str(root),
                        "indexed_files": 0,
                    },
                    indent=2,
                )
            )
        else:
            sys.stderr.write(f"Error: Indexing failed: {exc}\n")
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
        print(f"{bold}FastAST Repository Indexing Complete{reset}")
        print(f"Path:     {cyan}{res['repo_path']}{reset}")
        print(f"Database: {cyan}{res['db_path']}{reset}")
        print(f"Latency:  {res['elapsed_ms']} ms")
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


def run_graph(
    symbol_name: str,
    dir_path: str = ".",
    max_depth: int = 2,
    direction: str = "both",
    json_output: bool = False,
) -> int:
    """Perform bounded graph traversal from a symbol."""
    root = Path(dir_path).resolve()
    db_path = root / ".fastast.db"
    if not db_path.exists():
        from fastast.indexer import index_repository
        index_repository(str(root))

    from fastast.db import get_connection, get_graph_neighborhood
    conn = get_connection(db_path)
    res = get_graph_neighborhood(conn, symbol_name, max_depth=max_depth, direction=direction)
    conn.close()

    if json_output:
        print(json.dumps(res, indent=2))
        return 0

    print(f"Graph Neighborhood for '{symbol_name}' (depth={max_depth}):")
    print(f"Total Nodes: {res['total_nodes']}, Total Edges: {res['total_edges']}")
    print("\nTraversed Nodes:")
    for n in res["nodes"]:
        name = n.get("name") or n.get("id")
        depth = res["hop_depths"].get(name, res["hop_depths"].get(n["id"], 0))
        conf = res["node_confidences"].get(name, res["node_confidences"].get(n["id"], 1.0))
        print(f"  [Hop {depth}] {name} ({n.get('kind', 'symbol')}, conf={conf})")
    print("\nTraversed Edges:")
    for e in res["edges"]:
        print(f"  {e['src']} --[{e['relation']} conf={e['confidence']}]--> {e['dst']}")
    return 0


def main() -> None:
    """CLI entrypoint for fastast."""
    parser = argparse.ArgumentParser(
        prog="fastast",
        description=(
            "FastAST: AST-based repository indexer for coding agents.\n"
            "Indexes source code across 8+ languages into SQLite using AST analysis."
        ),
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=(
            "examples:\n"
            "  fastast index .\n"
            "  fastast index /path/to/repo --force\n"
            "  fastast symbols 'handle_request' --kind function\n"
            "  fastast symbols 'Config' -L python\n"
            "  fastast calls 'execute_query'"
        ),
    )
    parser.add_argument(
        "-v",
        "--version",
        action="version",
        version=f"fastast {__version__}",
    )

    subparsers = parser.add_subparsers(dest="command", help="Available commands")

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

    # `scan` subcommand (Phase 1 file admission)
    scan_parser = subparsers.add_parser(
        "scan",
        help="Scan and admit repository files applying multi-layer ignore rules",
        description="Discover admitted files, calculate content hashes (xxHash3/BLAKE2b), and classify by category.",
    )
    scan_parser.add_argument(
        "dir",
        nargs="?",
        default=".",
        help="Repository root directory to scan (default: current directory)",
    )
    scan_parser.add_argument(
        "-L",
        "--language",
        help="Filter by language (e.g. python, rust, javascript)",
    )
    scan_parser.add_argument(
        "-C",
        "--category",
        choices=["source", "test", "config", "docs", "infra", "generated", "other"],
        help="Filter by file category",
    )
    scan_parser.add_argument(
        "--json",
        action="store_true",
        help="Output admitted files as JSON",
    )

    # `graph` subcommand (Phase 3 multi-hop neighborhood expansion)
    graph_parser = subparsers.add_parser(
        "graph",
        help="Bounded graph traversal and neighborhood expansion for a symbol",
        description="Inspect multi-hop symbol neighborhood, callers, callees, definitions, and imports.",
    )
    graph_parser.add_argument(
        "symbol",
        help="Root symbol to expand neighborhood from",
    )
    graph_parser.add_argument(
        "-d",
        "--dir",
        default=".",
        help="Repository root directory (default: current directory)",
    )
    graph_parser.add_argument(
        "--depth",
        type=int,
        default=2,
        help="Maximum hop depth for bounded traversal (default: 2)",
    )
    graph_parser.add_argument(
        "--direction",
        choices=["both", "out", "in"],
        default="both",
        help="Traversal direction: out (callees), in (callers), or both",
    )
    graph_parser.add_argument(
        "--json",
        action="store_true",
        help="Output graph neighborhood as JSON",
    )

    args = parser.parse_args()

    if args.command == "graph":
        sys.exit(
            run_graph(
                args.symbol,
                dir_path=args.dir,
                max_depth=args.depth,
                direction=args.direction,
                json_output=getattr(args, "json", False),
            )
        )
    elif args.command == "scan":
        sys.exit(
            run_scan(
                args.dir,
                language=getattr(args, "language", None),
                category=getattr(args, "category", None),
                json_output=getattr(args, "json", False),
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
