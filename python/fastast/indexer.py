"""Phase 5: Full Repository Indexer.

Production-grade, end-to-end repository indexing pipeline for FastAST:
- Repository file discovery and admission (Phase 1)
- Incremental indexing via mtime and content hash (xxHash3 / BLAKE2b)
- Clean deletion of stale rows when files are removed from disk
- Syntactic fact extraction with syntax error tolerance (Phase 2)
- Relational and graph edge storage in SQLite (Phase 3 & db)
- Rich indexing statistics (files, symbols, edges, calls, imports, languages)
- Integrated CLI and MCP server support
"""

import os
import sqlite3
import time
from pathlib import Path
from typing import Any, Callable, Dict, List, Optional, Set, Union

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
from fastast.model import ExtractedFileFacts, FileRecord


class RepositoryIndexer:
    """Production-grade repository walker, incremental indexer, and graph database builder."""

    def __init__(
        self,
        repo_path: Union[str, Path] = ".",
        db_name: str = ".fastast.db",
        db_path: Optional[Union[str, Path]] = None,
        languages: Optional[Set[str]] = None,
        extra_ignores: Optional[List[str]] = None,
        categories: Optional[Set[str]] = None,
    ):
        self.repo_path = Path(repo_path).resolve()
        if db_path is not None:
            self.db_path = Path(db_path).resolve()
        else:
            self.db_path = (self.repo_path / db_name).resolve()

        self.languages = {lang.lower() for lang in languages} if languages else None
        self.extra_ignores = extra_ignores
        self.categories = {cat.lower() for cat in categories} if categories else None

    def clean_deleted_files(
        self, conn: sqlite3.Connection, current_admitted_paths: Set[str]
    ) -> int:
        """Purge stale database rows for files that no longer exist in the repository.

        SQLite foreign key constraints with ON DELETE CASCADE automatically clean
        associated symbols, imports, calls, and graph edges.
        """
        cur = conn.cursor()
        cur.execute("SELECT path FROM files")
        existing_db_paths = {row["path"] for row in cur.fetchall()}

        deleted_paths = existing_db_paths - current_admitted_paths
        if not deleted_paths:
            return 0

        with conn:
            cur.executemany(
                "DELETE FROM files WHERE path = ?",
                [(p,) for p in deleted_paths],
            )
        return len(deleted_paths)

    def index_single_file(
        self,
        file_path: Union[Path, str],
        conn: Optional[sqlite3.Connection] = None,
        force: bool = False,
    ) -> Dict[str, Any]:
        """Index or re-index a single file into the SQLite database.

        Returns a dictionary summarizing status ('indexed', 'skipped', or 'failed')
        and extracted entity counts.
        """
        return self.index_file(file_path, conn=conn, force=force)

    def index_file(
        self,
        file_path: Union[Path, str],
        conn: Optional[sqlite3.Connection] = None,
        force: bool = False,
    ) -> Dict[str, Any]:
        """Index or re-index a single file into the SQLite database.

        Returns a dictionary summarizing status ('indexed', 'skipped', or 'failed')
        and extracted entity counts.
        """
        path_obj = Path(file_path)
        if not path_obj.is_absolute():
            abs_path = (self.repo_path / path_obj).resolve()
            rel_path = str(path_obj)
        else:
            abs_path = path_obj.resolve()
            try:
                rel_path = str(abs_path.relative_to(self.repo_path))
            except ValueError:
                rel_path = str(abs_path)

        if not abs_path.exists() or not abs_path.is_file():
            return {
                "path": rel_path,
                "status": "failed",
                "error": f"File does not exist: {abs_path}",
                "symbols": 0,
                "edges": 0,
            }

        should_close = False
        if conn is None:
            conn = get_connection(self.db_path)
            init_db(conn)
            should_close = True

        try:
            stat = abs_path.stat()
            mtime = stat.st_mtime
            try:
                code_text = abs_path.read_text(encoding="utf-8", errors="replace")
            except Exception as read_err:
                return {
                    "path": rel_path,
                    "status": "failed",
                    "error": f"Read error: {read_err}",
                    "symbols": 0,
                    "edges": 0,
                }

            file_hash = compute_content_hash(code_text)

            existing = get_file_record(conn, rel_path)
            if not force and existing:
                if abs(existing["mtime"] - mtime) < 0.001:
                    return {
                        "path": rel_path,
                        "status": "skipped",
                        "reason": "mtime_match",
                        "symbols": 0,
                        "edges": 0,
                    }
                if existing["hash"] == file_hash:
                    with conn:
                        conn.execute(
                            "UPDATE files SET mtime = ? WHERE id = ?",
                            (mtime, existing["id"]),
                        )
                    return {
                        "path": rel_path,
                        "status": "skipped",
                        "reason": "hash_match",
                        "symbols": 0,
                        "edges": 0,
                    }

            lang = detect_file_language(abs_path) or "python"
            category = classify_file(abs_path, code_text)
            facts = extract_file_facts(code_text, rel_path, language=lang)

            store_file_data(
                conn,
                rel_path,
                file_hash,
                mtime,
                facts,
                language=lang,
                category=category,
                status="indexed",
            )

            return {
                "path": rel_path,
                "status": "indexed",
                "language": lang,
                "category": category,
                "symbols": len(facts.symbols),
                "edges": len(facts.edges),
                "has_syntax_error": facts.has_syntax_error,
            }
        finally:
            if should_close:
                conn.close()

    def run(
        self,
        force_reindex: bool = False,
        progress_callback: Optional[Callable[[str, int, int], None]] = None,
    ) -> Dict[str, Any]:
        """Execute full or incremental repository indexing across all admitted files.

        Pipeline stages:
        1. Discover admitted files according to ignore rules, category, and language filters.
        2. Detect and purge stale database records for deleted files.
        3. Check mtime and content hash to skip unmodified files in O(1) time.
        4. Parse and extract syntactic symbols, calls, imports, and edges.
        5. Atomically insert or update database tables.
        6. Compute and return aggregate repository statistics.

        Args:
            force_reindex: If True, re-parses and overwrites all files regardless of mtime/hash.
            progress_callback: Optional callback invoked as fn(rel_path, current_index, total_files).

        Returns:
            Dictionary of indexing summary and repository graph statistics.
        """
        start_time = time.perf_counter()

        if not self.repo_path.exists():
            raise FileNotFoundError(f"Repository directory not found: {self.repo_path}")

        conn = get_connection(self.db_path)
        init_db(conn)

        try:
            # 1. Discover admitted files
            extra = list(self.extra_ignores or [])
            db_name = self.db_path.name
            extra.extend([db_name, f"{db_name}*", "*.db", "*.db-wal", "*.db-shm"])
            admitted_files = discover_files(
                self.repo_path,
                extra_ignores=extra,
                languages=self.languages,
                categories=self.categories,
            )

            current_paths = {record.path for record in admitted_files}

            # 2. Clean deleted files from previous indexing runs
            deleted_count = self.clean_deleted_files(conn, current_paths)

            indexed_count = 0
            skipped_count = 0
            failed_count = 0
            syntax_error_count = 0
            total_admitted = len(admitted_files)

            # 3. Process candidate files
            for idx, record in enumerate(admitted_files, start=1):
                rel_path = record.path
                file_path = self.repo_path / rel_path
                mtime = record.mtime
                file_hash = record.hash

                if progress_callback:
                    try:
                        progress_callback(rel_path, idx, total_admitted)
                    except Exception:
                        pass

                # Incremental skip checks
                existing = get_file_record(conn, rel_path)
                if not force_reindex and existing:
                    # Fast mtime check
                    if abs(existing["mtime"] - mtime) < 0.001:
                        skipped_count += 1
                        continue

                    # Content hash check (handles touch / checkout without change)
                    if existing["hash"] == file_hash:
                        with conn:
                            conn.execute(
                                "UPDATE files SET mtime = ? WHERE id = ?",
                                (mtime, existing["id"]),
                            )
                        skipped_count += 1
                        continue

                # Read source text
                try:
                    code_text = file_path.read_text(encoding="utf-8", errors="replace")
                except Exception:
                    failed_count += 1
                    continue

                # Content hash verification
                if not file_hash or file_hash == "mockhash":
                    file_hash = compute_content_hash(code_text)

                if not force_reindex and existing and existing["hash"] == file_hash:
                    with conn:
                        conn.execute(
                            "UPDATE files SET mtime = ? WHERE id = ?",
                            (mtime, existing["id"]),
                        )
                    skipped_count += 1
                    continue

                # Extract AST facts
                lang = record.language or detect_file_language(file_path) or "python"
                try:
                    facts = extract_file_facts(code_text, rel_path, language=lang)
                    if facts.has_syntax_error:
                        syntax_error_count += 1
                except Exception as parse_err:
                    # Robustness: syntax/parse errors do not crash whole index run
                    facts = ExtractedFileFacts(
                        file_path=rel_path,
                        language=lang,
                        total_lines=len(code_text.splitlines()),
                        total_tokens=len(code_text.split()),
                        has_syntax_error=True,
                        error_message=str(parse_err),
                    )
                    syntax_error_count += 1

                # Persist in SQLite
                try:
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
                except Exception:
                    failed_count += 1

            # 4. Fetch final repository statistics
            stats = get_repository_stats(conn)
            elapsed_ms = (time.perf_counter() - start_time) * 1000.0

            return {
                "repo_path": str(self.repo_path),
                "db_path": str(self.db_path),
                "total_files": total_admitted,
                "indexed_files": indexed_count,
                "skipped_files": skipped_count,
                "deleted_files": deleted_count,
                "failed_files": failed_count,
                "error_files": failed_count,  # backward compatibility alias
                "syntax_error_files": syntax_error_count,
                "total_symbols": stats.get("symbols", 0),
                "total_edges": stats.get("edges", 0),
                "total_imports": stats.get("imports", 0),
                "total_calls": stats.get("calls", 0),
                "languages": stats.get("languages", {}),
                "categories": stats.get("categories", {}),
                "elapsed_ms": round(elapsed_ms, 2),
            }
        finally:
            conn.close()

    def get_stats(self) -> Dict[str, Any]:
        """Retrieve current repository statistics from the indexed database."""
        if not self.db_path.exists():
            return {
                "files": 0,
                "symbols": 0,
                "imports": 0,
                "calls": 0,
                "edges": 0,
                "languages": {},
                "categories": {},
            }
        conn = get_connection(self.db_path)
        try:
            return get_repository_stats(conn)
        finally:
            conn.close()


def find_source_files(
    root_dir: Path,
    ignore_dirs: Optional[Set[str]] = None,
    languages: Optional[Set[str]] = None,
    extra_ignores: Optional[List[str]] = None,
) -> List[Path]:
    """Recursively discover all admitted source files while respecting ignore rules."""
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
    progress_callback: Optional[Callable[[str, int, int], None]] = None,
) -> Dict[str, Any]:
    """Scan directory, parse all supported language files, and populate SQLite symbol graph.

    Supports Python, JavaScript, JSX, TypeScript, TSX, Java, Rust, HTML, CSS, JSON, and TOML.
    Skips unchanged files incrementally based on mtime and content hashes (xxHash3 / BLAKE2b).
    Cleans up stale rows for deleted files.

    Args:
        repo_path: Root folder path to index.
        db_name: Database file name (created in repo_path).
        force_reindex: If True, re-parses all files regardless of mtime/hash.
        languages: Optional set of language names to restrict indexing to.
        extra_ignores: Optional extra glob patterns to ignore.
        categories: Optional set of categories to restrict indexing to.
        progress_callback: Optional progress callback function.

    Returns:
        Dictionary summarizing files scanned, indexed, skipped, deleted, and graph counts.
    """
    indexer = RepositoryIndexer(
        repo_path=repo_path,
        db_name=db_name,
        languages=languages,
        extra_ignores=extra_ignores,
        categories=categories,
    )
    return indexer.run(
        force_reindex=force_reindex,
        progress_callback=progress_callback,
    )
