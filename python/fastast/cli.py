from __future__ import annotations

"""CLI runner and indexing tool for FastAST."""

import argparse
import json
import os
import sys
from pathlib import Path

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


def detect_language_from_path(path: Path) -> str | None:
    """Auto-detect canonical language identifier from file extension."""
    ext = path.suffix.lower().lstrip(".")
    return SUPPORTED_EXTENSIONS.get(ext)


def run_scan(
    dir_path: str = ".",
    language: str | None = None,
    category: str | None = None,
    extra_ignores: list | None = None,
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
            "results": [r.to_dict() for r in records],
            "meta": {
                "total_files": len(records),
                "categories": cat_counts,
                "languages": lang_counts,
            },
            "error": None,
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
        res["results"] = []
        res["meta"] = {
            "languages": res.get("languages", {}),
            "categories": res.get("categories", {}),
            "elapsed_ms": res.get("elapsed_ms", 0.0),
            "indexed_files": res.get("indexed_files", 0),
            "skipped_files": res.get("skipped_files", 0),
            "deleted_files": res.get("deleted_files", 0),
        }
        res["error"] = None
        print(json.dumps(res, indent=2))
        return 0

    color = supports_color() and not quiet
    bold = "\033[1m" if color else ""
    cyan = "\033[36m" if color else ""
    green = "\033[32m" if color else ""
    reset = "\033[0m" if color else ""

    if not quiet:
        deleted_count = res.get("deleted_files", 0)
        del_str = f", {deleted_count:,} deleted" if deleted_count > 0 else ""
        print(f"{bold}FastAST Repository Indexing Complete{reset}")
        print(f"Path:     {cyan}{res['repo_path']}{reset}")
        print(f"Database: {cyan}{res['db_path']}{reset}")
        print(f"Latency:  {res['elapsed_ms']} ms")
        print(
            f"Files:    {res['total_files']:,} scanned ("
            f"{green}{res['indexed_files']:,} indexed{reset}, "
            f"{res['skipped_files']:,} skipped{del_str}, {res['error_files']:,} errors)"
        )
        edges_str = f", {res['total_edges']:,} edges" if "total_edges" in res else ""
        print(
            f"Graph:    {bold}{res['total_symbols']:,}{reset} symbols{edges_str}, "
            f"{res['total_imports']:,} imports, {res['total_calls']:,} calls"
        )
        if res.get("languages"):
            lang_summary = ", ".join(f"{k} ({v})" for k, v in res["languages"].items())
            print(f"Languages: {lang_summary}")

    return 0


def run_symbols(
    query: str,
    kind: str | None = None,
    language: str | None = None,
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
            "results": symbols,
            "meta": {
                "kind": kind,
                "language": language,
                "limit": limit,
                "count": len(symbols),
            },
            "error": None,
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
        relationships = []
        for c in graph.get("callers", []):
            relationships.append({
                "src": c.get("caller"),
                "dst": graph.get("symbol"),
                "relation": "calls",
                "file_path": c.get("file_path"),
                "line_number": c.get("line_number"),
            })
        for c in graph.get("callees", []):
            relationships.append({
                "src": graph.get("symbol"),
                "dst": c.get("callee"),
                "relation": "calls",
                "file_path": c.get("file_path"),
                "line_number": c.get("line_number"),
            })
        output = {
            "call_graph": graph,
            "symbol": graph["symbol"],
            "caller_count": graph["caller_count"],
            "callee_count": graph["callee_count"],
            "callers": graph["callers"],
            "callees": graph["callees"],
            "relationships": relationships,
            "results": relationships,
            "meta": {
                "caller_count": graph["caller_count"],
                "callee_count": graph["callee_count"],
                "total_relationships": len(relationships),
            },
            "error": None,
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
    if not root.exists():
        if json_output:
            print(
                json.dumps(
                    {
                        "error": f"Directory not found: {dir_path}",
                        "symbol": symbol_name,
                        "total_nodes": 0,
                        "total_edges": 0,
                        "nodes": [],
                        "edges": [],
                    },
                    indent=2,
                )
            )
        else:
            sys.stderr.write(f"Error: Directory not found: {dir_path}\n")
        return 1

    if not symbol_name or not symbol_name.strip():
        if json_output:
            print(
                json.dumps(
                    {
                        "error": "Symbol name cannot be empty",
                        "total_nodes": 0,
                        "total_edges": 0,
                        "nodes": [],
                        "edges": [],
                    },
                    indent=2,
                )
            )
        else:
            sys.stderr.write("Error: Symbol name cannot be empty.\n")
        return 1

    db_path = root / ".fastast.db"
    if not db_path.exists():
        from fastast.indexer import index_repository
        index_repository(str(root))

    from fastast.db import get_connection, get_graph_neighborhood
    conn = get_connection(db_path)
    res = get_graph_neighborhood(conn, symbol_name.strip(), max_depth=max_depth, direction=direction)
    conn.close()

    if json_output:
        res["symbol"] = symbol_name.strip()
        res["results"] = res.get("nodes", [])
        res["relationships"] = res.get("edges", [])
        res["meta"] = {
            "depth": max_depth,
            "direction": direction,
            "total_nodes": res.get("total_nodes", len(res.get("nodes", []))),
            "total_edges": res.get("total_edges", len(res.get("edges", []))),
        }
        res["error"] = None
        print(json.dumps(res, indent=2))
        return 0

    if res.get("total_nodes", 0) <= 1 and not res.get("edges"):
        print(f"No graph relations found for '{symbol_name}' in {dir_path}.")
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


def run_query(
    query: str,
    dir_path: str = ".",
    kind: str | None = None,
    language: str | None = None,
    file_path: str | None = None,
    limit: int = 5,
    max_tokens: int = 2048,
    ranking_method: str = "hybrid",
    json_output: bool = False,
) -> int:
    """Retrieve ranked symbol evidence and bounded graph context for a query."""
    root = Path(dir_path).resolve()
    if not root.exists():
        if json_output:
            print(
                json.dumps(
                    {
                        "error": f"Directory not found: {dir_path}",
                        "query": query,
                        "candidates": [],
                        "results": [],
                        "evidence": [],
                        "relationships": [],
                        "meta": {},
                    },
                    indent=2,
                )
            )
        else:
            sys.stderr.write(f"Error: Directory not found: {dir_path}\n")
        return 1

    if not query or not query.strip():
        if json_output:
            print(
                json.dumps(
                    {
                        "error": "Query string cannot be empty",
                        "query": query,
                        "candidates": [],
                        "results": [],
                        "evidence": [],
                        "relationships": [],
                        "meta": {},
                    },
                    indent=2,
                )
            )
        else:
            sys.stderr.write("Error: Query string cannot be empty.\n")
        return 1

    db_path = root / ".fastast.db"
    if not db_path.exists():
        from fastast.indexer import index_repository
        index_repository(str(root))

    from fastast.retrieval import RetrievalEngine
    with RetrievalEngine(db_path, repo_root=root) as engine:
        bundle = engine.retrieve_bundle(
            query=query.strip(),
            kind=kind,
            language=language,
            file_path=file_path,
            limit=limit,
            max_tokens=max_tokens,
            ranking_method=ranking_method,
        )

    if json_output:
        data = bundle.to_dict()
        data["results"] = data.get("candidates", [])
        data["evidence"] = data.get("snippets", [])
        if "meta" not in data or not isinstance(data["meta"], dict):
            data["meta"] = {}
        data["meta"]["candidate_count"] = len(data.get("candidates", []))
        data["meta"]["ranking_method"] = ranking_method
        data["meta"]["max_tokens"] = max_tokens
        data["error"] = None
        print(json.dumps(data, indent=2))
        return 0

    print(f"FastAST Evidence Bundle for '{query}':")
    print(f"Total Candidates: {len(bundle.candidates)}, Estimated Tokens: ~{bundle.total_tokens_estimate}\n")

    if not bundle.candidates:
        print(f"No matching candidate symbols found for '{query}'.")
        return 0

    print("Top Candidates:")
    for idx, c in enumerate(bundle.candidates, start=1):
        print(f"  {idx}. {c.name} ({c.kind}, score={c.score:.2f}) in {c.file_path}:{c.start_line}-{c.end_line}")
        if c.reasons:
            print(f"     Reasons: {'; '.join(c.reasons)}")
        if c.neighbors:
            print(f"     Neighbors ({len(c.neighbors)}): {', '.join(c.neighbors[:5])}")
        if c.evidence_window and c.evidence_window.snippet:
            lines = c.evidence_window.snippet.strip().splitlines()
            preview = lines[:8]
            print(f"     Snippet (lines {c.evidence_window.start_line}-{c.evidence_window.end_line}):")
            for line in preview:
                print(f"       | {line}")
            if len(lines) > 8:
                print(f"       | ... [{len(lines) - 8} more lines]")
        print()

    if bundle.files:
        print("Relevant Files:")
        for f in bundle.files:
            print(f"  - {f['path']} ({f['category']}, {f['language']}, {f['total_lines']} lines)")

    if bundle.relationships:
        print("\nConnected Relationships:")
        for r in bundle.relationships[:10]:
            print(f"  {r['src']} --[{r['relation']} conf={r['confidence']}]--> {r['dst']}")

    return 0


def run_evidence(*args, **kwargs) -> int:
    """Alias for run_query to retrieve token-bounded evidence bundles."""
    return run_query(*args, **kwargs)


def run_outline(
    file_path: str,
    dir_path: str = ".",
    json_output: bool = False,
) -> int:
    """Display compact structural outline for a file."""
    root = Path(dir_path).resolve()
    if not root.exists():
        if json_output:
            print(json.dumps({"error": f"Directory not found: {dir_path}", "file_path": file_path, "classes": [], "functions": [], "other_symbols": [], "results": [], "meta": {}}, indent=2))
        else:
            sys.stderr.write(f"Error: Directory not found: {dir_path}\n")
        return 1

    from fastast.evidence import get_file_outline
    outline = get_file_outline(file_path, repo_root=root)
    if not outline:
        if json_output:
            print(json.dumps({"error": f"File not found in index: {file_path}", "file_path": file_path, "classes": [], "functions": [], "other_symbols": [], "results": [], "meta": {}}, indent=2))
        else:
            sys.stderr.write(f"Error: File not found in index: {file_path}\n")
        return 1

    if json_output:
        outline["results"] = (
            outline.get("classes", [])
            + outline.get("functions", [])
            + outline.get("other_symbols", [])
        )
        outline["meta"] = {
            "language": outline.get("language"),
            "total_lines": outline.get("total_lines", 0),
            "total_symbols": outline.get("total_symbols", 0),
            "total_imports": outline.get("total_imports", 0),
            "class_count": len(outline.get("classes", [])),
            "function_count": len(outline.get("functions", [])),
        }
        outline["error"] = None
        print(json.dumps(outline, indent=2))
        return 0

    print(f"File Outline: {outline['file_path']} ({outline['language']}, {outline['total_lines']} lines)")
    print(f"Total Symbols: {outline['total_symbols']}, Total Imports: {outline['total_imports']}\n")

    if outline["classes"]:
        print("Classes:")
        for c in outline["classes"]:
            doc_str = f" - {c['docstring_summary']}" if c.get("docstring_summary") else ""
            print(f"  class {c['name']} (lines {c['start_line']}-{c['end_line']}){doc_str}")
            for m in c.get("methods", []):
                print(f"    def {m['name']}{m.get('signature', '')} (lines {m['start_line']}-{m['end_line']})")

    if outline["functions"]:
        print("\nFunctions:")
        for fn in outline["functions"]:
            doc_str = f" - {fn['docstring_summary']}" if fn.get("docstring_summary") else ""
            print(f"  def {fn['name']}{fn.get('signature', '')} (lines {fn['start_line']}-{fn['end_line']}){doc_str}")

    if outline["other_symbols"]:
        print("\nOther Symbols:")
        for s in outline["other_symbols"][:10]:
            print(f"  {s['kind']} {s['name']} (lines {s['start_line']}-{s['end_line']})")

    return 0


def run_snippet(
    symbol: str | None = None,
    file_path: str | None = None,
    start_line: int | None = None,
    end_line: int | None = None,
    window_lines: int = 3,
    max_lines: int = 60,
    dir_path: str = ".",
    json_output: bool = False,
) -> int:
    """Extract bounded source snippet for a symbol or file line range."""
    root = Path(dir_path).resolve()
    if not root.exists():
        if json_output:
            print(json.dumps({"error": f"Directory not found: {dir_path}", "snippet": None, "evidence": None, "results": [], "meta": {}}, indent=2))
        else:
            sys.stderr.write(f"Error: Directory not found: {dir_path}\n")
        return 1

    from fastast.evidence import get_snippet
    window = get_snippet(
        symbol_id_or_name=symbol,
        file_path=file_path,
        start_line=start_line,
        end_line=end_line,
        window_lines=window_lines,
        max_snippet_lines=max_lines,
        repo_root=root,
    )

    if not window or not window.snippet:
        if json_output:
            print(json.dumps({"error": "Snippet not found or file unreadable", "snippet": None, "evidence": None, "results": [], "meta": {}}, indent=2))
        else:
            sys.stderr.write("Error: Snippet target not found or source file unreadable.\n")
        return 1

    if json_output:
        data = window.to_dict()
        data["evidence"] = data.get("snippet")
        data["results"] = [data.get("snippet")] if data.get("snippet") else []
        data["meta"] = {
            "start_line": data.get("start_line"),
            "end_line": data.get("end_line"),
            "is_truncated": data.get("is_truncated", False),
            "total_lines": data.get("total_lines", 0),
        }
        data["error"] = None
        print(json.dumps(data, indent=2))
        return 0

    target_name = symbol or f"{file_path}:{start_line}-{end_line}"
    print(f"Bounded Snippet for '{target_name}' (lines {window.start_line}-{window.end_line}):")
    print("-" * 60)
    print(window.snippet, end="" if window.snippet.endswith("\n") else "\n")
    print("-" * 60)
    return 0


def run_similar(
    symbol: str,
    dir_path: str = ".",
    limit: int = 10,
    min_sim: float = 0.5,
    json_output: bool = False,
) -> int:
    """Find near-duplicate or structurally similar symbols using MinHash + LSH."""
    root = Path(dir_path).resolve()
    if not root.exists():
        if json_output:
            print(
                json.dumps(
                    {"error": f"Directory not found: {dir_path}", "symbol": symbol, "similar_symbols": [], "results": [], "meta": {}},
                    indent=2,
                )
            )
        else:
            sys.stderr.write(f"Error: Directory not found: {dir_path}\n")
        return 1

    db_path = root / ".fastast.db"
    if not db_path.exists():
        if json_output:
            print(
                json.dumps(
                    {
                        "error": "Database not found. Run 'fastast index' first.",
                        "symbol": symbol,
                        "similar_symbols": [],
                        "results": [],
                        "meta": {},
                    },
                    indent=2,
                )
            )
        else:
            sys.stderr.write("Error: Index not found. Run 'fastast index' first.\n")
        return 1

    conn = get_connection(db_path)
    try:
        from fastast.db import get_similar_symbols

        sims = get_similar_symbols(conn, symbol, limit=limit, min_similarity=min_sim)
        if json_output:
            print(
                json.dumps(
                    {
                        "symbol": symbol,
                        "total_similar": len(sims),
                        "similar_symbols": sims,
                        "results": sims,
                        "meta": {
                            "total_similar": len(sims),
                            "min_similarity": min_sim,
                            "limit": limit,
                        },
                        "error": None,
                    },
                    indent=2,
                )
            )
            return 0

        print(f"Similar Symbols for '{symbol}' (MinHash Jaccard >= {min_sim:.2f}):")
        if not sims:
            print(
                f"  No near-duplicate or similar symbols found above similarity threshold {min_sim:.2f}."
            )
            return 0

        for idx, s in enumerate(sims, start=1):
            pct = int(round(s["similarity"] * 100))
            print(
                f"  {idx}. {s['name']} ({s['kind']}, {pct}% similar) in {s['file_path']}:{s['start_line']}-{s['end_line']}"
            )
            if s.get("signature"):
                print(f"     {s['signature']}")
        return 0
    finally:
        conn.close()


def run_communities(
    dir_path: str = ".",
    limit: int = 20,
    recompute: bool = False,
    json_output: bool = False,
) -> int:
    """List detected architectural communities using Louvain modularity clustering."""
    root = Path(dir_path).resolve()
    if not root.exists():
        if json_output:
            print(
                json.dumps(
                    {"error": f"Directory not found: {dir_path}", "communities": [], "results": [], "meta": {}},
                    indent=2,
                )
            )
        else:
            sys.stderr.write(f"Error: Directory not found: {dir_path}\n")
        return 1

    db_path = root / ".fastast.db"
    if not db_path.exists():
        if json_output:
            print(
                json.dumps(
                    {
                        "error": "Database not found. Run 'fastast index' first.",
                        "communities": [],
                        "results": [],
                        "meta": {},
                    },
                    indent=2,
                )
            )
        else:
            sys.stderr.write("Error: Index not found. Run 'fastast index' first.\n")
        return 1

    conn = get_connection(db_path)
    try:
        if recompute:
            from fastast.community import detect_and_store_communities

            detect_and_store_communities(conn)

        from fastast.db import list_communities

        comms = list_communities(conn, limit=limit)
        if json_output:
            print(
                json.dumps(
                    {
                        "total_communities": len(comms),
                        "communities": comms,
                        "results": comms,
                        "meta": {
                            "total_communities": len(comms),
                            "limit": limit,
                        },
                        "error": None,
                    },
                    indent=2,
                )
            )
            return 0

        print("Detected Architectural Communities (Louvain Modularity Clustering):")
        if not comms:
            print("  No communities detected. Try running with '--recompute'.")
            return 0

        for c in comms:
            print(
                f"  Community #{c['community_id']}: {c['name']} ({c['member_count']} symbols)"
            )
            if c.get("sample_symbols"):
                print(f"    Symbols: {', '.join(c['sample_symbols'][:6])}")
            if c.get("sample_files"):
                print(f"    Files:   {', '.join(c['sample_files'][:3])}")
        return 0
    finally:
        conn.close()


def run_community(
    symbol: str,
    dir_path: str = ".",
    json_output: bool = False,
) -> int:
    """Inspect community membership and peer symbols for a target symbol."""
    root = Path(dir_path).resolve()
    if not root.exists():
        if json_output:
            print(
                json.dumps(
                    {"error": f"Directory not found: {dir_path}", "symbol": symbol, "community": None, "results": [], "meta": {}},
                    indent=2,
                )
            )
        else:
            sys.stderr.write(f"Error: Directory not found: {dir_path}\n")
        return 1

    db_path = root / ".fastast.db"
    if not db_path.exists():
        if json_output:
            print(
                json.dumps(
                    {
                        "error": "Database not found. Run 'fastast index' first.",
                        "symbol": symbol,
                        "community": None,
                        "results": [],
                        "meta": {},
                    },
                    indent=2,
                )
            )
        else:
            sys.stderr.write("Error: Index not found. Run 'fastast index' first.\n")
        return 1

    conn = get_connection(db_path)
    try:
        from fastast.db import get_symbol_community

        comm = get_symbol_community(conn, symbol)
        if not comm:
            if json_output:
                print(
                    json.dumps(
                        {
                            "error": f"Symbol not found in community index: {symbol}",
                            "symbol": symbol,
                            "community": None,
                            "results": [],
                            "meta": {},
                        },
                        indent=2,
                    )
                )
            else:
                sys.stderr.write(
                    f"Error: Symbol not found or has no community assignment: {symbol}\n"
                )
            return 1

        if json_output:
            comm["results"] = comm.get("peers", [])
            comm["meta"] = {
                "community_id": comm.get("community_id"),
                "community_name": comm.get("community_name"),
                "modularity": comm.get("modularity", 0.0),
                "peer_count": len(comm.get("peers", [])),
            }
            comm["error"] = None
            print(json.dumps(comm, indent=2))
            return 0

        print(f"Community for '{symbol}':")
        print(f"  ID: {comm['community_id']} ({comm['community_name']})")
        print(f"  Modularity: {comm.get('modularity', 0.0)}")
        if comm.get("peers"):
            print(f"  Community Peers ({len(comm['peers'])}):")
            for p in comm["peers"][:10]:
                print(f"    - {p['name']} ({p['kind']}) in {p['file_path']}")
        return 0
    finally:
        conn.close()


def run_stats(
    dir_path: str = ".",
    json_output: bool = False,
) -> int:
    """Display repository index metrics and artifact statistics."""
    root = Path(dir_path).resolve()
    if not root.exists():
        if json_output:
            print(json.dumps({"error": f"Directory not found: {dir_path}", "results": [], "meta": {}}, indent=2))
        else:
            sys.stderr.write(f"Error: Directory not found: {dir_path}\n")
        return 1

    db_path = root / ".fastast.db"
    if not db_path.exists():
        if json_output:
            print(json.dumps({"error": "Index database not found. Run 'fastast index' first.", "results": [], "meta": {}}, indent=2))
        else:
            sys.stderr.write("Error: Index database not found. Run 'fastast index' first.\n")
        return 1

    conn = get_connection(db_path)
    try:
        from fastast.db import get_repository_stats
        stats = get_repository_stats(conn)
        if json_output:
            res_item = dict(stats)
            stats["results"] = [res_item]
            stats["meta"] = {
                "files": stats.get("files", 0),
                "symbols": stats.get("symbols", 0),
                "edges": stats.get("edges", 0),
                "languages": stats.get("languages", {}),
                "categories": stats.get("categories", {}),
            }
            stats["error"] = None
            print(json.dumps(stats, indent=2))
            return 0

        print(f"FastAST Repository Statistics for '{root}':")
        print(f"  Files Indexed:   {stats['files']}")
        print(f"  Total Symbols:   {stats['symbols']}")
        print(f"  Total Imports:   {stats['imports']}")
        print(f"  Total Calls:     {stats['calls']}")
        print(f"  Graph Edges:     {stats['edges']}")
        if stats.get("languages"):
            print("  Languages:       " + ", ".join(f"{k}: {v}" for k, v in stats["languages"].items()))
        if stats.get("categories"):
            print("  Categories:      " + ", ".join(f"{k}: {v}" for k, v in stats["categories"].items()))
        return 0
    finally:
        conn.close()


def run_doctor(
    dir_path: str = ".",
    full: bool = False,
    clean_locks: bool = False,
    json_output: bool = False,
) -> int:
    """Run comprehensive repository diagnostics and health checks."""
    from fastast.diagnostics import clean_stale_locks, diagnose_repository

    root = Path(dir_path).resolve()
    cleaned = False
    if clean_locks:
        cleaned = clean_stale_locks(root)

    report = diagnose_repository(root, full_integrity=full)
    if cleaned:
        report["recommendations"].insert(0, "Stale lock file was successfully cleaned.")

    if json_output:
        report["results"] = [report.copy()]
        report["meta"] = {
            "status": report.get("status"),
            "issues_count": len(report.get("issues", [])),
            "recommendations_count": len(report.get("recommendations", [])),
        }
        report["error"] = None if report.get("status") != "error" else "; ".join(report.get("issues", []))
        print(json.dumps(report, indent=2))
        return 0 if report.get("status") != "error" else 1

    status = report.get("status", "unknown").upper()
    print(f"FastAST Doctor Health Check: [{status}]")
    print(f"  Repository: {report['repository']['path']}")
    print(f"    Admitted disk files: {report['repository']['admitted_disk_files']}")
    print(f"    Config file found:   {report['repository']['config_file_exists']}")

    lock = report["lock"]
    print(f"  Lock Status: {'LOCKED' if lock['is_locked'] else 'FREE'}")
    if lock["is_locked"]:
        alive_str = "alive" if lock["pid_alive"] else "DEAD"
        print(f"    PID: {lock['pid']} ({alive_str}), age: {lock['age_seconds']}s")

    db = report["database"]
    print(f"  Database: {'PRESENT' if db['exists'] else 'NOT FOUND'}")
    if db["exists"]:
        size_kb = round(db["size_bytes"] / 1024.0, 1)
        integ_str = "OK" if db["integrity_ok"] else "FAIL"
        print(f"    Size: {size_kb} KB, Integrity: {integ_str}, Schema: v{db['user_version']}")

    cov = report["coverage"]
    print(f"  Coverage: {cov['db_files_count']} indexed / {cov['disk_files_count']} disk files")
    print(f"    Entities: {cov['symbols_count']} symbols, {cov['edges_count']} edges, {cov['calls_count']} calls")

    issues = report.get("issues", [])
    if issues:
        print("\n  Issues Detected:")
        for iss in issues:
            print(f"    [!] {iss}")

    recs = report.get("recommendations", [])
    if recs:
        print("\n  Recommendations:")
        for r in recs:
            print(f"    - {r}")

    return 0 if report.get("status") != "error" else 1


def run_watch(
    dir_path: str = ".",
    poll_interval: float = 0.5,
    debounce_ms: int | None = None,
    force: bool = False,
) -> int:
    """Run interactive foreground filesystem watcher."""
    from fastast.watcher import RepositoryWatcher

    root = Path(dir_path).resolve()
    print(f"Starting FastAST filesystem watcher on '{root}'...")

    def on_change(added, modified, deleted):
        parts = []
        if added:
            parts.append(f"{len(added)} added")
        if modified:
            parts.append(f"{len(modified)} modified")
        if deleted:
            parts.append(f"{len(deleted)} deleted")
        print(f"[change detected] {', '.join(parts)}")

    def on_complete(stats):
        print(
            f"[re-indexed] {stats.get('indexed_files', 0)} files indexed, "
            f"{stats.get('skipped_files', 0)} skipped in {stats.get('elapsed_ms', 0)}ms"
        )

    def on_err(exc):
        sys.stderr.write(f"[watcher error] {exc}\n")

    watcher = RepositoryWatcher(
        repo_path=root,
        poll_interval=poll_interval,
        debounce_ms=debounce_ms,
        on_change_detected=on_change,
        on_index_complete=on_complete,
        on_error=on_err,
    )
    if force:
        watcher.run_once(force=True)
    watcher.run_forever()
    return 0


def main() -> None:
    """CLI entrypoint for fastast."""
    parser = argparse.ArgumentParser(
        prog="fastast",
        description=(
            "FastAST: AST-based repository indexer for coding agents.\n"
            "Codebase-memory engine (AST -> Graph -> Retrieval) indexing 9 languages into SQLite."
        ),
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=(
            "examples:\n"
            "  fastast scan . -L python\n"
            "  fastast index .\n"
            "  fastast index /path/to/repo --force\n"
            "  fastast query 'handle_request' --limit 3\n"
            "  fastast query 'AuthService' --json\n"
            "  fastast symbols 'Config' -L python\n"
            "  fastast calls 'execute_query'\n"
            "  fastast graph 'handle_request' --depth 2\n"
            "  fastast graph 'UserService' --direction out --json"
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

    # `query` subcommand (Phase 4 Retrieval, ranking, and evidence selection)
    query_parser = subparsers.add_parser(
        "query",
        help="Query codebase memory for ranked symbols, evidence snippets, and bounded graph context",
        description="Retrieve token-conscious evidence bundles for AI coding agents.",
    )
    query_parser.add_argument(
        "query",
        help="Query symbol name, path, or text",
    )
    query_parser.add_argument(
        "-d",
        "--dir",
        default=".",
        help="Repository root directory (default: current directory)",
    )
    query_parser.add_argument(
        "-k",
        "--kind",
        help="Filter by symbol kind (e.g. function, class, method, struct)",
    )
    query_parser.add_argument(
        "-L",
        "--language",
        help="Filter by programming language (e.g. python, typescript, rust)",
    )
    query_parser.add_argument(
        "-f",
        "--file",
        dest="file_path",
        help="Filter or bias by target file path",
    )
    query_parser.add_argument(
        "-n",
        "--limit",
        type=int,
        default=5,
        help="Maximum candidate symbols to retrieve (default: 5)",
    )
    query_parser.add_argument(
        "--max-tokens",
        type=int,
        default=2048,
        help="Maximum total evidence snippet tokens budget (default: 2048)",
    )
    query_parser.add_argument(
        "--ranking",
        choices=["hybrid", "semantic", "rrf", "bm25", "heuristic"],
        default="hybrid",
        help="Ranking algorithm: hybrid (Semantic + BM25 + structural, default), semantic (dense vector), rrf (Reciprocal Rank Fusion), bm25, or heuristic",
    )
    query_parser.add_argument(
        "--json",
        action="store_true",
        help="Output evidence bundle as structured JSON",
    )

    # `evidence` subcommand (Phase 6 Evidence Materializer)
    evidence_parser = subparsers.add_parser(
        "evidence",
        help="Retrieve compact, token-bounded evidence bundle for a query",
        description="Extract ranked symbols, bounded code snippets, and key graph relationships.",
    )
    evidence_parser.add_argument("query", help="Query symbol name, path, or text")
    evidence_parser.add_argument("-d", "--dir", default=".", help="Repository root directory")
    evidence_parser.add_argument("-k", "--kind", help="Filter by symbol kind")
    evidence_parser.add_argument("-L", "--language", help="Filter by programming language")
    evidence_parser.add_argument("-f", "--file", dest="file_path", help="Filter by target file path")
    evidence_parser.add_argument("-n", "--limit", type=int, default=5, help="Maximum candidates to return")
    evidence_parser.add_argument("--max-tokens", type=int, default=2048, help="Token budget for snippets")
    evidence_parser.add_argument(
        "--ranking",
        choices=["hybrid", "semantic", "rrf", "bm25", "heuristic"],
        default="hybrid",
        help="Ranking algorithm: hybrid (default), semantic, rrf, bm25, or heuristic",
    )
    evidence_parser.add_argument("--json", action="store_true", help="Output evidence bundle as structured JSON")

    # `outline` subcommand (Phase 6 File-level pruning)
    outline_parser = subparsers.add_parser(
        "outline",
        help="Display structural outline of a file without raw source dumps",
        description="Show classes, methods, top-level functions, line spans, and signatures.",
    )
    outline_parser.add_argument("file", help="Target source file path")
    outline_parser.add_argument("-d", "--dir", default=".", help="Repository root directory")
    outline_parser.add_argument("--json", action="store_true", help="Output file outline as JSON")

    # `snippet` subcommand (Phase 6 Bounded snippet extraction)
    snippet_parser = subparsers.add_parser(
        "snippet",
        help="Extract a minimal bounded source snippet for a symbol or line range",
        description="Slice bounded code window without dumping full files.",
    )
    snippet_parser.add_argument("symbol", nargs="?", default=None, help="Symbol name or integer ID")
    snippet_parser.add_argument("-f", "--file", dest="file_path", help="Direct target file path")
    snippet_parser.add_argument("--start", type=int, default=None, help="Start line number (for direct file slicing)")
    snippet_parser.add_argument("--end", type=int, default=None, help="End line number (for direct file slicing)")
    snippet_parser.add_argument("-w", "--window", type=int, default=3, help="Context padding window lines")
    snippet_parser.add_argument("--max-lines", type=int, default=60, help="Maximum snippet lines before truncation")
    snippet_parser.add_argument("-d", "--dir", default=".", help="Repository root directory")
    snippet_parser.add_argument("--json", action="store_true", help="Output snippet as JSON")

    # `similar` subcommand (Phase 9 MinHash + LSH Near-Duplicate Detection)
    similar_parser = subparsers.add_parser(
        "similar",
        help="Find near-duplicate or structurally similar symbols using MinHash + LSH",
        description="Detect code clones, duplicate implementations, and similar symbols.",
    )
    similar_parser.add_argument("symbol", help="Target symbol name or integer ID")
    similar_parser.add_argument("-d", "--dir", default=".", help="Repository root directory")
    similar_parser.add_argument("-n", "--limit", type=int, default=10, help="Maximum similar symbols to return")
    similar_parser.add_argument("--min-sim", type=float, default=0.5, help="Minimum Jaccard similarity threshold (default: 0.5)")
    similar_parser.add_argument("--json", action="store_true", help="Output results as JSON")

    # `communities` subcommand (Phase 9 Louvain Modularity Clustering)
    communities_parser = subparsers.add_parser(
        "communities",
        help="List detected architectural communities using Louvain modularity clustering",
        description="Cluster the codebase graph into cohesive functional modules and domains.",
    )
    communities_parser.add_argument("-d", "--dir", default=".", help="Repository root directory")
    communities_parser.add_argument("-n", "--limit", type=int, default=20, help="Maximum communities to list")
    communities_parser.add_argument("--recompute", action="store_true", help="Force recomputation of community clusters")
    communities_parser.add_argument("--json", action="store_true", help="Output communities as JSON")

    # `community` subcommand (Phase 9 Single Symbol Community Inspection)
    community_parser = subparsers.add_parser(
        "community",
        help="Inspect community membership and peer symbols for a target symbol",
        description="View architectural community assignment, central hub, and peers.",
    )
    community_parser.add_argument("symbol", help="Target symbol name or integer ID")
    community_parser.add_argument("-d", "--dir", default=".", help="Repository root directory")
    community_parser.add_argument("--json", action="store_true", help="Output community info as JSON")

    # `stats` subcommand (Phase 10 Repository Statistics)
    stats_parser = subparsers.add_parser(
        "stats",
        help="Display repository index metrics and artifact statistics",
        description="Inspect indexed file counts, total symbols, imports, calls, and graph edges.",
    )
    stats_parser.add_argument("-d", "--dir", default=".", help="Repository root directory")
    stats_parser.add_argument("--json", action="store_true", help="Output statistics as JSON")

    # `doctor` subcommand (Production Hardening & Diagnostics)
    doctor_parser = subparsers.add_parser(
        "doctor",
        help="Diagnose repository health, database integrity, and lock status",
        description="Verify repository filesystem, lock state, SQLite integrity, and schema synchronization.",
    )
    doctor_parser.add_argument("-d", "--dir", default=".", help="Repository root directory")
    doctor_parser.add_argument("--full", action="store_true", help="Perform full SQLite integrity check instead of quick check")
    doctor_parser.add_argument("--clean-locks", action="store_true", help="Automatically release stale or dead locks")
    doctor_parser.add_argument("--json", action="store_true", help="Output diagnostic report as JSON")

    # `watch` subcommand (Production Background Watcher)
    watch_parser = subparsers.add_parser(
        "watch",
        help="Watch repository for changes and incrementally update the AST index",
        description="Background/daemon filesystem watcher with debouncing and safe locking.",
    )
    watch_parser.add_argument("-d", "--dir", default=".", help="Repository root directory")
    watch_parser.add_argument("--poll", type=float, default=0.5, help="Poll interval in seconds (default: 0.5)")
    watch_parser.add_argument("--debounce", type=int, default=None, help="Debounce quiet period in milliseconds (default: 300)")
    watch_parser.add_argument("--force", action="store_true", help="Force immediate initial index before watching")

    args = parser.parse_args()

    if args.command in ("query", "evidence"):
        sys.exit(
            run_query(
                args.query,
                dir_path=args.dir,
                kind=getattr(args, "kind", None),
                language=getattr(args, "language", None),
                file_path=getattr(args, "file_path", None),
                limit=args.limit,
                max_tokens=args.max_tokens,
                ranking_method=getattr(args, "ranking", "hybrid"),
                json_output=getattr(args, "json", False),
            )
        )
    elif args.command == "outline":
        sys.exit(
            run_outline(
                args.file,
                dir_path=args.dir,
                json_output=getattr(args, "json", False),
            )
        )
    elif args.command == "snippet":
        sys.exit(
            run_snippet(
                symbol=args.symbol,
                file_path=getattr(args, "file_path", None),
                start_line=getattr(args, "start", None),
                end_line=getattr(args, "end", None),
                window_lines=args.window,
                max_lines=args.max_lines,
                dir_path=args.dir,
                json_output=getattr(args, "json", False),
            )
        )
    elif args.command == "graph":
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
    elif args.command == "similar":
        sys.exit(
            run_similar(
                args.symbol,
                dir_path=args.dir,
                limit=args.limit,
                min_sim=args.min_sim,
                json_output=getattr(args, "json", False),
            )
        )
    elif args.command == "communities":
        sys.exit(
            run_communities(
                dir_path=args.dir,
                limit=args.limit,
                recompute=getattr(args, "recompute", False),
                json_output=getattr(args, "json", False),
            )
        )
    elif args.command == "community":
        sys.exit(
            run_community(
                args.symbol,
                dir_path=args.dir,
                json_output=getattr(args, "json", False),
            )
        )
    elif args.command == "stats":
        sys.exit(
            run_stats(
                dir_path=args.dir,
                json_output=getattr(args, "json", False),
            )
        )
    elif args.command == "doctor":
        sys.exit(
            run_doctor(
                dir_path=args.dir,
                full=getattr(args, "full", False),
                clean_locks=getattr(args, "clean_locks", False),
                json_output=getattr(args, "json", False),
            )
        )
    elif args.command == "watch":
        sys.exit(
            run_watch(
                dir_path=args.dir,
                poll_interval=getattr(args, "poll", 0.5),
                debounce_ms=getattr(args, "debounce", None),
                force=getattr(args, "force", False),
            )
        )
    else:
        parser.print_help()
        sys.exit(1)


if __name__ == "__main__":
    main()
