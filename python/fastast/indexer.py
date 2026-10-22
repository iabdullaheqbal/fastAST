"""Repository walker and Tree-Sitter symbol graph indexer across all supported languages."""

import os
import time
from pathlib import Path
from typing import Any, Dict, List, Optional, Set

try:
    from fastast._core import index_code
except ImportError:
    index_code = None

from fastast.db import (
    get_connection,
    get_file_record,
    get_repository_stats,
    init_db,
    store_file_data,
)
from fastast.discovery import (
    DEFAULT_HARDCODED_IGNORES as DEFAULT_IGNORE_DIRS,
    SUPPORTED_EXTENSIONS,
    DirectoryScanner,
    classify_file,
    compute_content_hash,
    compute_content_hash as compute_sha256,
    detect_file_language,
    discover_files,
)
from fastast.extractor import extract_file_facts


def find_source_files(
    root_dir: Path,
    ignore_dirs: Optional[Set[str]] = None,
    languages: Optional[Set[str]] = None,
    extra_ignores: Optional[List[str]] = None,
) -> List[Path]:
    """Recursively discover all supported source files while skipping ignored directories."""
    records = discover_files(
        root_dir=root_dir,
        extra_ignores=extra_ignores or (list(ignore_dirs) if ignore_dirs else None),
        languages=languages,
    )
    return [Path(root_dir) / r.path for r in records]


def find_python_files(root_dir: Path, ignore_dirs: Optional[Set[str]] = None) -> List[Path]:
    """Recursively discover Python files (preserved for backward compatibility)."""
    return find_source_files(root_dir, ignore_dirs=ignore_dirs, languages={"python"})


def index_repository(
    repo_path: str = ".",
    db_name: str = ".fastast.db",
    force_reindex: bool = False,
    languages: Optional[Set[str]] = None,
    extra_ignores: Optional[List[str]] = None,
    categories: Optional[Set[str]] = None,
) -> Dict[str, Any]:
    """Scan directory, parse all supported language files with native Tree-Sitter, and populate SQLite symbol graph.

    Supports Python, JavaScript, JSX, TypeScript, TSX, Java, Rust, HTML, CSS, JSON, and TOML.
    Skips unchanged files incrementally based on mtime and content hashes (xxHash3 / BLAKE2b).

    Args:
        repo_path: Root folder path to index.
        db_name: Database file name (created in repo_path).
        force_reindex: If True, re-parses all files regardless of mtime/hash.
        languages: Optional set of language names to restrict indexing to (e.g. {'python', 'rust'}).
        extra_ignores: Optional extra glob patterns to ignore.
        categories: Optional set of categories to restrict indexing to (e.g. {'source', 'config'}).

    Returns:
        Dictionary summarizing files scanned, indexed, symbols, and elapsed latency.
    """
    start_time = time.perf_counter()
    root = Path(repo_path).resolve()
    db_path = root / db_name

    conn = get_connection(db_path)
    init_db(conn)

    admitted_files = discover_files(
        root,
        extra_ignores=extra_ignores,
        languages=languages,
        categories=categories,
    )

    indexed_count = 0
    skipped_count = 0
    error_count = 0

    for record in admitted_files:
        rel_path = record.path
        file_path = root / rel_path
        mtime = record.mtime
        file_hash = record.hash

        # Check existing record for fast incremental skip
        existing = get_file_record(conn, rel_path)
        if not force_reindex and existing and abs(existing["mtime"] - mtime) < 0.001:
            skipped_count += 1
            continue

        # Hash check: if mtime changed but content is identical, update mtime and skip
        if not force_reindex and existing and existing["hash"] == file_hash:
            with conn:
                conn.execute(
                    "UPDATE files SET mtime = ? WHERE id = ?",
                    (mtime, existing["id"]),
                )
            skipped_count += 1
            continue

        try:
            code_text = file_path.read_text(encoding="utf-8", errors="replace")
        except Exception:
            error_count += 1
            continue

        # Extract structural facts (Tree-Sitter if available, else Python AST fallback)
        lang = record.language or "python"
        facts = extract_file_facts(code_text, rel_path, language=lang)
        if facts.error_message and not facts.symbols and not facts.edges:
            error_count += 1
            continue

        # Store in SQLite with category and status
        store_file_data(
            conn,
            rel_path,
            file_hash,
            mtime,
            facts,
            language=lang,
            category=record.category,
            status="indexed",
        )
        indexed_count += 1

    stats = get_repository_stats(conn)
    elapsed_ms = (time.perf_counter() - start_time) * 1000.0

    return {
        "repo_path": str(root),
        "db_path": str(db_path),
        "total_files": len(admitted_files),
        "indexed_files": indexed_count,
        "skipped_files": skipped_count,
        "error_files": error_count,
        "total_symbols": stats["symbols"],
        "total_imports": stats["imports"],
        "total_calls": stats["calls"],
        "languages": stats.get("languages", {}),
        "categories": stats.get("categories", {}),
        "elapsed_ms": round(elapsed_ms, 2),
    }
