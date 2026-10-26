"""Production diagnostics, health checks, and repair utilities for FastAST repositories."""

from __future__ import annotations

import json
import os
from pathlib import Path
import sqlite3
import time
from typing import Any, Dict, List, Optional, Sequence, Set, Tuple, Union

from fastast.config import get_logger, load_config
from fastast.db import (
    CURRENT_SCHEMA_VERSION,
    check_database_integrity,
    get_connection,
    get_repository_stats,
)
from fastast.discovery import discover_files
from fastast.locking import RepositoryLock

logger = get_logger("fastast.diagnostics")


def clean_stale_locks(
    repo_path: Union[str, Path] = ".",
    lock_name: str = ".fastast.lock",
) -> bool:
    """Inspect and safely remove stale or abandoned repository lock files.

    Returns:
        True if an abandoned or stale lock was detected and removed; False otherwise.
    """
    root = Path(repo_path).resolve()
    lock_path = root / lock_name
    if not lock_path.exists():
        return False

    lock = RepositoryLock(root, lock_name=lock_name)
    info = lock._read_lock_info()
    return lock._try_break_stale_lock(info)


def diagnose_repository(
    repo_path: Union[str, Path] = ".",
    db_name: str = ".fastast.db",
    full_integrity: bool = False,
) -> Dict[str, Any]:
    """Perform comprehensive system diagnostics and health evaluation of a FastAST repository."""
    root = Path(repo_path).resolve()
    config = load_config(root)
    db_path = (root / db_name).resolve()
    lock_path = root / ".fastast.lock"

    issues: List[str] = []
    recommendations: List[str] = []

    # ── 1. Repository Filesystem & Configuration Checks ───────────────────────
    repo_info: Dict[str, Any] = {
        "path": str(root),
        "exists": root.exists(),
        "is_dir": root.is_dir() if root.exists() else False,
        "is_readable": os.access(root, os.R_OK) if root.exists() else False,
        "is_writable": os.access(root, os.W_OK) if root.exists() else False,
        "config_file_exists": (root / ".fastastrc.json").exists(),
        "admitted_disk_files": 0,
    }

    if not repo_info["exists"]:
        issues.append(f"Repository directory does not exist: {root}")
        return {
            "status": "error",
            "repo": repo_info,
            "issues": issues,
            "recommendations": ["Verify repository path and ensure directory exists."],
        }

    if not repo_info["is_dir"]:
        issues.append(f"Repository path is not a directory: {root}")
        return {
            "status": "error",
            "repo": repo_info,
            "issues": issues,
            "recommendations": ["Provide a path to a directory rather than a file."],
        }

    if not repo_info["is_writable"]:
        issues.append(f"Repository directory is not writable: {root}")
        recommendations.append("Ensure write permissions on repository root to allow indexing.")

    # Count admitted files on disk
    try:
        disk_records = discover_files(root, extra_ignores=[db_name, f"{db_name}*"])
        repo_info["admitted_disk_files"] = len(disk_records)
        disk_paths = {r.path for r in disk_records}
    except Exception as disc_err:
        issues.append(f"Error during file discovery: {disc_err}")
        disk_paths = set()

    # ── 2. Inter-Process Lock Inspection ─────────────────────────────────────
    lock_info: Dict[str, Any] = {
        "lock_file_path": str(lock_path),
        "exists": lock_path.exists(),
        "is_locked": False,
        "pid": None,
        "pid_alive": False,
        "created_at": None,
        "age_seconds": None,
        "is_stale": False,
    }

    if lock_path.exists():
        lock = RepositoryLock(root)
        meta = lock._read_lock_info()
        lock_info["is_locked"] = True
        if meta:
            pid = meta.get("pid")
            created_at = meta.get("created_at")
            lock_info["pid"] = pid
            lock_info["created_at"] = created_at
            if created_at:
                lock_info["age_seconds"] = round(time.time() - created_at, 1)

            if pid:
                is_alive = lock._is_pid_alive(pid)
                lock_info["pid_alive"] = is_alive
                if not is_alive:
                    lock_info["is_stale"] = True
                    issues.append(f"Dead lock detected: PID {pid} is no longer running.")
                    recommendations.append("Run 'fastast doctor --clean-locks' to release stale lock.")
                elif lock_info["age_seconds"] and lock_info["age_seconds"] > config.stale_lock_seconds:
                    lock_info["is_stale"] = True
                    issues.append(f"Expired lock detected: held for {lock_info['age_seconds']}s.")
                    recommendations.append("Run 'fastast doctor --clean-locks' to release expired lock.")
        else:
            lock_info["is_stale"] = True
            issues.append("Corrupted lock file with invalid metadata detected.")
            recommendations.append("Remove corrupted .fastast.lock file.")

    # ── 3. Database Integrity & Schema Checks ────────────────────────────────
    db_info: Dict[str, Any] = {
        "db_file_path": str(db_path),
        "exists": db_path.exists(),
        "size_bytes": db_path.stat().st_size if db_path.exists() else 0,
        "wal_exists": (root / f"{db_name}-wal").exists(),
        "shm_exists": (root / f"{db_name}-shm").exists(),
        "integrity_ok": False,
        "integrity_messages": [],
        "user_version": None,
        "schema_version": None,
        "migrations_count": 0,
    }

    db_paths: Set[str] = set()
    stats: Dict[str, Any] = {}

    if not db_path.exists():
        issues.append(f"Database not found: {db_name}. Repository has not been indexed.")
        recommendations.append("Run 'fastast index' to build the initial codebase symbol graph.")
    else:
        conn: Optional[sqlite3.Connection] = None
        try:
            conn = get_connection(db_path, busy_timeout_ms=5000)
            ok, msgs = check_database_integrity(conn, quick=not full_integrity)
            db_info["integrity_ok"] = ok
            db_info["integrity_messages"] = msgs
            if not ok:
                issues.append(f"Database corruption detected: {msgs}")
                recommendations.append("Rebuild database using 'fastast index --force' (corrupt DB will be backed up).")

            cur = conn.cursor()
            cur.execute("PRAGMA user_version;")
            row = cur.fetchone()
            db_info["user_version"] = row[0] if row else 0

            # Schema migrations check
            try:
                cur.execute("SELECT COUNT(*) FROM schema_migrations;")
                db_info["migrations_count"] = cur.fetchone()[0]
            except sqlite3.OperationalError as exc:
                logger.debug(f"schema_migrations table not found: {exc}")

            # Metadata check
            try:
                cur.execute("SELECT value FROM fastast_metadata WHERE key = 'schema_version';")
                meta_row = cur.fetchone()
                if meta_row:
                    db_info["schema_version"] = int(meta_row[0])
            except sqlite3.OperationalError as exc:
                logger.debug(f"fastast_metadata table not found: {exc}")

            if db_info["user_version"] != CURRENT_SCHEMA_VERSION:
                issues.append(
                    f"Schema version mismatch: database has v{db_info['user_version']}, "
                    f"current engine expects v{CURRENT_SCHEMA_VERSION}."
                )
                recommendations.append("Run 'fastast index --force' to apply schema migrations.")

            # Files in DB
            cur.execute("SELECT path FROM files;")
            db_paths = {r["path"] for r in cur.fetchall()}

            # Stats
            stats = get_repository_stats(conn)

            # Check FTS5 sync
            try:
                cur.execute("SELECT COUNT(*) FROM symbols_fts;")
                fts_count = cur.fetchone()[0]
                stats["fts_count"] = fts_count
                if fts_count < stats.get("symbols", 0):
                    issues.append(f"FTS5 index out of sync: {fts_count} entries vs {stats.get('symbols', 0)} symbols.")
                    recommendations.append("Run 'fastast index' to synchronize search indices.")
            except sqlite3.OperationalError as exc:
                logger.debug(f"FTS5 count check skipped: {exc}")
                stats["fts_count"] = 0

            # Check Embeddings count
            try:
                cur.execute("SELECT COUNT(*) FROM symbol_embeddings;")
                emb_count = cur.fetchone()[0]
                stats["embeddings_count"] = emb_count
            except sqlite3.OperationalError as exc:
                logger.debug(f"Embeddings count check skipped: {exc}")
                stats["embeddings_count"] = 0

            # Check Communities count
            try:
                cur.execute("SELECT COUNT(DISTINCT community_id) FROM symbol_communities;")
                comm_count = cur.fetchone()[0]
                stats["communities_count"] = comm_count
            except sqlite3.OperationalError as exc:
                logger.debug(f"Communities count check skipped: {exc}")
                stats["communities_count"] = 0

        except Exception as db_err:
            issues.append(f"Failed to inspect SQLite database: {db_err}")
            recommendations.append("Run 'fastast index --force' to recreate database.")
        finally:
            if conn:
                conn.close()

    # ── 4. Synchronization Coverage & Stale Detection ────────────────────────
    stale_files = list(db_paths - disk_paths)
    unindexed_files = list(disk_paths - db_paths)

    coverage_info: Dict[str, Any] = {
        "db_files_count": len(db_paths),
        "disk_files_count": len(disk_paths),
        "stale_db_files_count": len(stale_files),
        "stale_files_sample": stale_files[:5],
        "unindexed_files_count": len(unindexed_files),
        "unindexed_files_sample": unindexed_files[:5],
        "symbols_count": stats.get("symbols", 0),
        "edges_count": stats.get("edges", 0),
        "calls_count": stats.get("calls", 0),
        "imports_count": stats.get("imports", 0),
        "fts_entries_count": stats.get("fts_count", 0),
        "embeddings_count": stats.get("embeddings_count", 0),
        "communities_count": stats.get("communities_count", 0),
        "languages": stats.get("languages", {}),
    }

    if stale_files:
        issues.append(f"{len(stale_files)} files in database no longer exist on disk.")
        recommendations.append("Run 'fastast index' to clean stale records.")

    if unindexed_files and db_path.exists():
        issues.append(f"{len(unindexed_files)} files on disk are not yet indexed in database.")
        recommendations.append("Run 'fastast index' to index newly added files.")

    # ── 5. Overall Health Rating ─────────────────────────────────────────────
    if not db_path.exists():
        status = "warning"
    elif not db_info.get("integrity_ok", False) or lock_info.get("is_stale", False):
        status = "error"
    elif stale_files or unindexed_files or issues:
        status = "warning"
    else:
        status = "healthy"

    if status == "healthy" and not recommendations:
        recommendations.append("Repository index is healthy, up to date, and ready for queries.")

    return {
        "status": status,
        "repository": repo_info,
        "lock": lock_info,
        "database": db_info,
        "coverage": coverage_info,
        "issues": issues,
        "recommendations": recommendations,
    }

