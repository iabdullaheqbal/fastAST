"""Repository walker and Tree-Sitter symbol graph indexer."""

import hashlib
import os
import time
from pathlib import Path
from typing import Any, Dict, List, Optional, Set

from fastast._core import index_code
from fastast.db import get_connection, get_file_record, get_repository_stats, init_db, store_file_data

DEFAULT_IGNORE_DIRS: Set[str] = {
    ".git",
    ".venv",
    "venv",
    "env",
    ".env",
    "__pycache__",
    "target",
    "node_modules",
    "build",
    "dist",
    "wheels",
    ".cache",
    ".pytest_cache",
    ".mypy_cache",
    ".ruff_cache",
    ".idea",
    ".vscode",
    ".gemini",
}


def compute_sha256(content: str) -> str:
    """Compute SHA256 hexadecimal hash of file contents."""
    return hashlib.sha256(content.encode("utf-8")).hexdigest()


def find_python_files(root_dir: Path, ignore_dirs: Optional[Set[str]] = None) -> List[Path]:
    """Recursively discover all Python source files while skipping ignored directories."""
    ignores = ignore_dirs or DEFAULT_IGNORE_DIRS
    py_files: List[Path] = []

    for root, dirs, files in os.walk(root_dir):
        # Prune ignored directory trees in-place
        dirs[:] = [d for d in dirs if d not in ignores and not d.endswith(".egg-info")]

        for file in files:
            if file.endswith(".py"):
                py_files.append(Path(root) / file)

    return sorted(py_files)


def index_repository(
    repo_path: str = ".",
    db_name: str = ".fastast.db",
    force_reindex: bool = False,
) -> Dict[str, Any]:
    """Scan directory, parse with native Tree-Sitter, and populate SQLite symbol graph.

    Args:
        repo_path: Root folder path to index.
        db_name: Database file name (created in repo_path).
        force_reindex: If True, re-parses all files regardless of mtime/hash.

    Returns:
        Dictionary summarizing files scanned, indexed, symbols, and elapsed latency.
    """
    start_time = time.perf_counter()
    root = Path(repo_path).resolve()
    db_path = root / db_name

    conn = get_connection(db_path)
    init_db(conn)

    python_files = find_python_files(root)

    indexed_count = 0
    skipped_count = 0
    error_count = 0

    for file_path in python_files:
        try:
            rel_path = str(file_path.relative_to(root))
        except ValueError:
            rel_path = str(file_path)

        stat = file_path.stat()
        mtime = stat.st_mtime

        # Check existing record for fast incremental skip
        existing = get_file_record(conn, rel_path)
        if not force_reindex and existing and abs(existing["mtime"] - mtime) < 0.001:
            skipped_count += 1
            continue

        try:
            code_text = file_path.read_text(encoding="utf-8", errors="replace")
        except Exception:
            error_count += 1
            continue

        file_hash = compute_sha256(code_text)

        # Hash check: if mtime changed but content is identical, update mtime and skip
        if not force_reindex and existing and existing["hash"] == file_hash:
            with conn:
                conn.execute(
                    "UPDATE files SET mtime = ? WHERE id = ?",
                    (mtime, existing["id"]),
                )
            skipped_count += 1
            continue

        # Parse AST with native Rust Tree-Sitter
        index_res = index_code(code_text)

        # Store in SQLite
        store_file_data(conn, rel_path, file_hash, mtime, index_res)
        indexed_count += 1

    stats = get_repository_stats(conn)
    elapsed_ms = (time.perf_counter() - start_time) * 1000.0

    return {
        "repo_path": str(root),
        "db_path": str(db_path),
        "total_files": len(python_files),
        "indexed_files": indexed_count,
        "skipped_files": skipped_count,
        "error_files": error_count,
        "total_symbols": stats["symbols"],
        "total_imports": stats["imports"],
        "total_calls": stats["calls"],
        "elapsed_ms": round(elapsed_ms, 2),
    }
