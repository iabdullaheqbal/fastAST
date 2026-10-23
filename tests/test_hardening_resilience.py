"""Tests for production hardening, security boundaries, corruption recovery, locking, watcher, and diagnostics."""

import json
import os
from pathlib import Path
import shutil
import sqlite3
import sys
import tempfile
import time
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "python"))

from fastast.config import (
    FastASTConfig,
    PathTraversalError,
    load_config,
    validate_safe_path,
)
from fastast.db import (
    CURRENT_SCHEMA_VERSION,
    check_database_integrity,
    get_connection,
    safe_repair_or_recreate_db,
)
from fastast.diagnostics import clean_stale_locks, diagnose_repository
from fastast.evidence import EvidenceMaterializer
from fastast.indexer import RepositoryIndexer, index_repository
from fastast.locking import RepositoryLock, RepositoryLockedError
from fastast.watcher import RepositoryWatcher


class TestHardeningResilience(unittest.TestCase):
    def setUp(self):
        self.test_dir = tempfile.mkdtemp(prefix="fastast_hardening_test_")
        self.root = Path(self.test_dir).resolve()

        # Create basic source tree
        self.src_dir = self.root / "src"
        self.src_dir.mkdir(parents=True, exist_ok=True)
        self.file1 = self.src_dir / "service.py"
        self.file1.write_text(
            "class AuthService:\n"
            "    def authenticate(self, username, password):\n"
            "        return True\n"
            "\n"
            "def login(user, pw):\n"
            "    svc = AuthService()\n"
            "    return svc.authenticate(user, pw)\n",
            encoding="utf-8",
        )

    def tearDown(self):
        shutil.rmtree(self.test_dir, ignore_errors=True)

    # ── 1. Security Boundaries & Path Traversal ──────────────────────────────

    def test_path_traversal_rejection(self):
        """Ensure paths escaping the repository root are strictly rejected."""
        # 1. Direct path validation
        with self.assertRaises(PathTraversalError):
            validate_safe_path("../../etc/passwd", self.root)

        with self.assertRaises(PathTraversalError):
            validate_safe_path("/etc/passwd", self.root)

        with self.assertRaises(PathTraversalError):
            validate_safe_path(self.root.parent / "escape.py", self.root)

        # Valid in-repo path succeeds
        valid = validate_safe_path("src/service.py", self.root)
        self.assertEqual(valid, self.file1)

        # 2. Indexer rejection
        indexer = RepositoryIndexer(repo_path=self.root)
        res = indexer.index_file("/etc/passwd")
        self.assertEqual(res["status"], "failed")
        self.assertIn("Access denied", res["error"])

        # 3. EvidenceMaterializer rejection
        indexer.run()
        with EvidenceMaterializer(repo_root=self.root) as mat:
            snippet = mat.get_snippet(file_path="../../etc/passwd", start_line=1, end_line=5)
            # Must return None snippet, not reading external files
            self.assertIsNotNone(snippet)
            self.assertIsNone(snippet.snippet)

    # ── 2. File Size Limits ──────────────────────────────────────────────────

    def test_file_size_limit_handling(self):
        """Oversized files exceeding max_file_size_bytes must be skipped safely."""
        indexer = RepositoryIndexer(repo_path=self.root)
        # Temporarily set tiny max size
        indexer.config.max_file_size_bytes = 40  # 40 bytes, service.py is ~150 bytes

        res = indexer.index_file("src/service.py")
        self.assertEqual(res["status"], "skipped")
        self.assertIn("file_size_exceeded", res["reason"])

        # In EvidenceMaterializer
        with EvidenceMaterializer(repo_root=self.root) as mat:
            mat.config.max_file_size_bytes = 40
            snippet = mat.get_snippet(file_path="src/service.py", start_line=1, end_line=5)
            self.assertIsNone(snippet.snippet)

    # ── 3. Inter-Process Repository Locking & Stale Reclamation ──────────────

    def test_repository_lock_mutual_exclusion(self):
        """Lock must prevent concurrent acquisitions and raise RepositoryLockedError on timeout."""
        lock1 = RepositoryLock(self.root, timeout=0.5)
        lock2 = RepositoryLock(self.root, timeout=0.2)

        self.assertTrue(lock1.acquire())
        self.assertTrue(lock1.is_locked)

        # Second lock attempt should fail within timeout
        with self.assertRaises(RepositoryLockedError):
            lock2.acquire()

        lock1.release()
        self.assertFalse(lock1.is_locked)

        # Now second lock succeeds
        self.assertTrue(lock2.acquire())
        lock2.release()

    def test_stale_lock_auto_reclamation(self):
        """Dead process PID or expired locks must be reclaimed automatically."""
        lock_path = self.root / ".fastast.lock"
        # Simulate an abandoned lock with an inactive PID (e.g. 99999999)
        fake_lock_data = {
            "pid": 99999999,
            "created_at": time.time() - 100,
            "token": "fake-stale-token",
        }
        lock_path.write_text(json.dumps(fake_lock_data), encoding="utf-8")

        # RepositoryLock should detect dead PID and acquire successfully
        lock = RepositoryLock(self.root, timeout=1.0)
        self.assertTrue(lock.acquire())
        self.assertTrue(lock.is_locked)
        lock.release()
        self.assertFalse(lock_path.exists())

    # ── 4. SQLite Corruption Recovery & Migration Verification ───────────────

    def test_corrupt_database_detection_and_auto_repair(self):
        """Corrupt database files must be detected, backed up, and recreated cleanly."""
        # 1. Build initial index
        indexer = RepositoryIndexer(repo_path=self.root)
        stats1 = indexer.run()
        self.assertEqual(stats1["indexed_files"], 1)

        db_path = self.root / ".fastast.db"
        self.assertTrue(db_path.exists())

        # Verify initial integrity
        conn = get_connection(db_path)
        ok, msgs = check_database_integrity(conn)
        conn.close()
        self.assertTrue(ok)

        # 2. Corrupt database by writing garbage
        db_path.write_text("CORRUPTED_RAW_GARBAGE_DATA_12345", encoding="utf-8")

        # Diagnostics must flag error
        diag = diagnose_repository(self.root)
        self.assertEqual(diag["status"], "error")
        self.assertFalse(diag["database"]["integrity_ok"])

        # 3. Next indexer.run() must auto-recover
        stats2 = indexer.run()
        self.assertEqual(stats2["indexed_files"], 1)

        # A backup file should have been preserved
        backups = list(self.root.glob(".fastast.db.corrupt.*"))
        self.assertTrue(len(backups) >= 1)

        # New DB should be 100% healthy
        diag_after = diagnose_repository(self.root)
        self.assertEqual(diag_after["status"], "healthy")
        self.assertTrue(diag_after["database"]["integrity_ok"])
        self.assertEqual(diag_after["database"]["user_version"], CURRENT_SCHEMA_VERSION)

    # ── 5. Repeated Indexing Stability & Idempotency ──────────────────────────

    def test_repeated_indexing_stability(self):
        """Repeated sequential index runs must be stable, fast, and idempotent."""
        indexer = RepositoryIndexer(repo_path=self.root)

        # Run 1: initial
        r1 = indexer.run()
        self.assertEqual(r1["indexed_files"], 1)
        self.assertEqual(r1["skipped_files"], 0)
        initial_symbols = r1["total_symbols"]

        # Runs 2-5: all files should be skipped cleanly
        for i in range(2, 6):
            r = indexer.run()
            self.assertEqual(r["indexed_files"], 0, f"Run {i} re-indexed files unexpectedly")
            self.assertEqual(r["skipped_files"], 1, f"Run {i} failed to skip unmodified file")
            self.assertEqual(r["total_symbols"], initial_symbols)

    # ── 6. Background Watcher Lifecycle & Debouncing ──────────────────────────

    def test_watcher_lifecycle_and_incremental_indexing(self):
        """RepositoryWatcher must debounce file events and incrementally re-index."""
        watcher = RepositoryWatcher(
            repo_path=self.root,
            poll_interval=0.1,
            debounce_ms=100,
        )

        try:
            # Initial run
            res1 = watcher.run_once(force=True)
            self.assertIsNotNone(res1)
            self.assertEqual(res1["indexed_files"], 1)

            # Start background thread
            watcher.start()
            self.assertTrue(watcher.is_running)

            # Add a new file
            new_file = self.src_dir / "helper.py"
            new_file.write_text("def assist():\n    return 42\n", encoding="utf-8")

            # Wait for watcher poll + debounce (100ms poll + 100ms debounce + margin)
            time.sleep(0.4)

            # Check stats
            db_conn = get_connection(self.root / ".fastast.db")
            cur = db_conn.cursor()
            cur.execute("SELECT path FROM files WHERE path = 'src/helper.py'")
            row = cur.fetchone()
            db_conn.close()
            self.assertIsNotNone(row, "Watcher did not automatically index new file")

        finally:
            stopped = watcher.stop(timeout=2.0)
            self.assertTrue(stopped)
            self.assertFalse(watcher.is_running)

    # ── 7. Diagnostics Health Evaluation ─────────────────────────────────────

    def test_diagnostics_healthy_and_stale_detection(self):
        """diagnose_repository must accurately report health and detect stale files."""
        # 1. Unindexed repository
        d0 = diagnose_repository(self.root)
        self.assertEqual(d0["status"], "warning")
        self.assertFalse(d0["database"]["exists"])

        # 2. Indexed repository
        indexer = RepositoryIndexer(repo_path=self.root)
        indexer.run()

        d1 = diagnose_repository(self.root)
        self.assertEqual(d1["status"], "healthy")
        self.assertEqual(d1["coverage"]["db_files_count"], 1)
        self.assertEqual(d1["coverage"]["stale_db_files_count"], 0)
        self.assertEqual(d1["coverage"]["unindexed_files_count"], 0)

        # 3. Delete file without indexing -> must flag warning and stale count
        self.file1.unlink()
        d2 = diagnose_repository(self.root)
        self.assertEqual(d2["status"], "warning")
        self.assertEqual(d2["coverage"]["stale_db_files_count"], 1)
        self.assertIn("files in database no longer exist on disk", "; ".join(d2["issues"]))

        # 4. Clean stale files by running indexer
        indexer.run()
        d3 = diagnose_repository(self.root)
        self.assertEqual(d3["status"], "healthy")
        self.assertEqual(d3["coverage"]["db_files_count"], 0)
        self.assertEqual(d3["coverage"]["stale_db_files_count"], 0)

    # ── 8. MCP & CLI Diagnostics Tooling ─────────────────────────────────────

    def test_mcp_diagnose_repository_tool(self):
        """server.diagnose_repository must return valid JSON diagnostic bundle."""
        from fastast.server import diagnose_repository as mcp_diagnose

        indexer = RepositoryIndexer(repo_path=self.root)
        indexer.run()

        raw_json = mcp_diagnose(str(self.root))
        data = json.loads(raw_json)

        self.assertIn("status", data)
        self.assertEqual(data["status"], "healthy")
        self.assertIn("database", data)
        self.assertTrue(data["database"]["integrity_ok"])
        self.assertIn("results", data)
        self.assertIn("meta", data)
if __name__ == "__main__":
    unittest.main()

