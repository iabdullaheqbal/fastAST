"""Tests for Phase 4: Retrieval, Ranking, and Evidence Selection (Query-time pruning)."""

import io
import json
import sqlite3
import tempfile
import unittest
from contextlib import redirect_stdout
from pathlib import Path

from fastast.cli import run_query
from fastast.db import get_connection, init_db, store_file_data
from fastast.extractor import ExtractedFileFacts
from fastast.model import (
    Candidate,
    EdgeRecord,
    EdgeRelation,
    EvidenceWindow,
    FileCategory,
    FileRecord,
    SymbolRecord,
)
from fastast.retrieval import (
    EvidenceBundle,
    RetrievalEngine,
    estimate_tokens,
    get_callees,
    get_callers,
    get_related_files,
    get_snippet,
    get_symbol_by_name,
    get_symbol_by_path,
    retrieve_bundle,
    score_candidate,
    search_files,
    search_symbols,
)


class TestScoringHeuristic(unittest.TestCase):
    """Test candidate scoring and ranking heuristics."""

    def test_name_match_ordering(self):
        # Exact match should outscore prefix, which outscores substring
        score_exact, _ = score_candidate(
            sym_name="handle_request",
            sym_kind="function",
            file_path="src/api.py",
            file_category="source",
            sym_confidence=1.0,
            edge_count=2,
            query="handle_request",
        )
        score_prefix, _ = score_candidate(
            sym_name="handle_request_v2",
            sym_kind="function",
            file_path="src/api.py",
            file_category="source",
            sym_confidence=1.0,
            edge_count=2,
            query="handle_request",
        )
        score_sub, _ = score_candidate(
            sym_name="before_handle_request_hook",
            sym_kind="function",
            file_path="src/api.py",
            file_category="source",
            sym_confidence=1.0,
            edge_count=2,
            query="handle_request",
        )

        self.assertGreater(score_exact, score_prefix)
        self.assertGreater(score_prefix, score_sub)

    def test_source_vs_test_path_priority(self):
        # Source file should outrank test file for identical symbols
        score_source, _ = score_candidate(
            sym_name="authenticate",
            sym_kind="function",
            file_path="src/auth/service.py",
            file_category="source",
            sym_confidence=1.0,
            edge_count=1,
            query="authenticate",
        )
        score_test, _ = score_candidate(
            sym_name="authenticate",
            sym_kind="function",
            file_path="tests/test_auth.py",
            file_category="test",
            sym_confidence=1.0,
            edge_count=1,
            query="authenticate",
        )
        self.assertGreater(score_source, score_test)

    def test_edge_centrality_boost(self):
        # Central hub with multiple connected edges should outscore isolated leaf
        score_hub, _ = score_candidate(
            sym_name="dispatch",
            sym_kind="function",
            file_path="src/core.py",
            file_category="source",
            sym_confidence=1.0,
            edge_count=6,
            query="dispatch",
        )
        score_leaf, _ = score_candidate(
            sym_name="dispatch",
            sym_kind="function",
            file_path="src/core.py",
            file_category="source",
            sym_confidence=1.0,
            edge_count=0,
            query="dispatch",
        )
        self.assertGreater(score_hub, score_leaf)

    def test_type_match_priority(self):
        # Function/class should outscore container or value when kind is unspecified
        score_func, _ = score_candidate(
            sym_name="config",
            sym_kind="function",
            file_path="src/conf.py",
            file_category="source",
            sym_confidence=1.0,
            edge_count=1,
            query="config",
        )
        score_var, _ = score_candidate(
            sym_name="config",
            sym_kind="variable",
            file_path="src/conf.py",
            file_category="source",
            sym_confidence=1.0,
            edge_count=1,
            query="config",
        )
        self.assertGreater(score_func, score_var)


class TestRetrievalEngine(unittest.TestCase):
    """Test full RetrievalEngine functionality with indexed repository files."""

    def setUp(self):
        self.tmpdir = tempfile.TemporaryDirectory()
        self.root = Path(self.tmpdir.name)
        self.db_path = self.root / ".fastast.db"

        # Create sample files
        self.auth_file = self.root / "auth.py"
        self.auth_file.write_text(
            "class AuthService:\n"
            "    def login(self, username, password):\n"
            "        hash_val = hash_password(password)\n"
            "        return verify(username, hash_val)\n\n"
            "def hash_password(pwd):\n"
            "    return 'hashed_' + pwd\n\n"
            "def verify(user, hash_val):\n"
            "    return True\n"
        )

        self.test_file = self.root / "test_auth.py"
        self.test_file.write_text(
            "def test_login():\n"
            "    s = AuthService()\n"
            "    assert s.login('admin', 'secret')\n"
        )

        # Index into database
        conn = get_connection(self.db_path)
        init_db(conn)

        # Store auth.py
        auth_facts = ExtractedFileFacts(
            file_path="auth.py",
            language="python",
            total_lines=11,
            symbols=[
                SymbolRecord(name="AuthService", kind="class", file="auth.py", start_line=1, end_line=5, confidence=1.0),
                SymbolRecord(name="login", kind="method", file="auth.py", start_line=2, end_line=5, parent_name="AuthService", confidence=1.0),
                SymbolRecord(name="hash_password", kind="function", file="auth.py", start_line=6, end_line=8, confidence=1.0),
                SymbolRecord(name="verify", kind="function", file="auth.py", start_line=9, end_line=11, confidence=1.0),
            ],
            edges=[
                EdgeRecord(src="AuthService", dst="login", relation="defines", confidence=1.0),
                EdgeRecord(src="login", dst="hash_password", relation="calls", confidence=0.95),
                EdgeRecord(src="login", dst="verify", relation="calls", confidence=0.90),
            ],
        )
        store_file_data(conn, auth_facts, language="python", category="source")

        # Store test_auth.py
        test_facts = ExtractedFileFacts(
            file_path="test_auth.py",
            language="python",
            total_lines=4,
            symbols=[
                SymbolRecord(name="test_login", kind="function", file="test_auth.py", start_line=1, end_line=4, confidence=1.0),
            ],
            edges=[
                EdgeRecord(src="test_login", dst="AuthService", relation="calls", confidence=0.85),
                EdgeRecord(src="test_login", dst="login", relation="calls", confidence=0.85),
            ],
        )
        store_file_data(conn, test_facts, language="python", category="test")

        conn.close()
        self.engine = RetrievalEngine(self.db_path, repo_root=self.root)

    def tearDown(self):
        self.engine.close()
        self.tmpdir.cleanup()

    def test_get_symbol_by_name(self):
        syms = self.engine.get_symbol_by_name("login")
        self.assertEqual(len(syms), 1)
        self.assertEqual(syms[0].name, "login")
        self.assertEqual(syms[0].kind, "method")
        self.assertEqual(syms[0].file, "auth.py")

        # Missing symbol
        empty = self.engine.get_symbol_by_name("nonexistent_func")
        self.assertEqual(len(empty), 0)

    def test_get_symbol_by_path(self):
        syms = self.engine.get_symbol_by_path("auth.py")
        names = [s.name for s in syms]
        self.assertIn("AuthService", names)
        self.assertIn("login", names)
        self.assertIn("hash_password", names)
        self.assertIn("verify", names)

    def test_get_callers_and_callees(self):
        # login is called by test_login
        callers = self.engine.get_callers("login")
        caller_names = [c["caller"] for c in callers]
        self.assertIn("test_login", caller_names)

        # login calls hash_password and verify
        callees = self.engine.get_callees("login")
        callee_names = [c["callee"] for c in callees]
        self.assertIn("hash_password", callee_names)
        self.assertIn("verify", callee_names)

    def test_get_related_files(self):
        related = self.engine.get_related_files("login")
        paths = [r["path"] for r in related]
        self.assertIn("test_auth.py", paths)

    def test_get_snippet_bounded(self):
        # Extract snippet for hash_password
        window = self.engine.get_snippet("hash_password", window_lines=1)
        self.assertIsNotNone(window)
        self.assertIn("def hash_password(pwd):", window.snippet)
        self.assertIn("return 'hashed_' + pwd", window.snippet)

        # Missing file should degrade gracefully
        window_missing = self.engine.get_snippet("missing_symbol")
        self.assertIsNone(window_missing)

    def test_search_files(self):
        files = self.engine.search_files("auth")
        self.assertEqual(len(files), 2)
        paths = [f["path"] for f in files]
        self.assertIn("auth.py", paths)
        self.assertIn("test_auth.py", paths)
        # auth.py (source) should outrank test_auth.py (test)
        self.assertGreaterEqual(files[0]["score"], files[1]["score"])

    def test_search_symbols_ranking_and_pruning(self):
        candidates = self.engine.search_symbols("login", limit=5)
        self.assertGreater(len(candidates), 0)

        top = candidates[0]
        # Primary login method in auth.py should rank #1
        self.assertEqual(top.name, "login")
        self.assertEqual(top.file_path, "auth.py")
        self.assertGreater(top.score, 0.70)

        # Check bounded evidence window attached
        self.assertIsNotNone(top.evidence_window)
        self.assertIn("def login", top.evidence_window.snippet)

        # Check bounded graph neighbors attached
        self.assertIn("hash_password", top.neighbors)
        self.assertIn("verify", top.neighbors)

    def test_token_budget_pruning(self):
        # Low token budget should prune lower-ranked candidates
        candidates = self.engine.search_symbols("auth", limit=5, max_tokens=20)
        self.assertLessEqual(len(candidates), 2)

    def test_retrieve_bundle(self):
        bundle = self.engine.retrieve_bundle("login", limit=3)
        self.assertIsInstance(bundle, EvidenceBundle)
        self.assertEqual(bundle.query, "login")
        self.assertGreater(len(bundle.candidates), 0)
        self.assertGreater(len(bundle.symbols), 0)
        self.assertGreater(len(bundle.files), 0)
        self.assertGreater(len(bundle.relationships), 0)
        self.assertGreater(bundle.total_tokens_estimate, 0)

        d = bundle.to_dict()
        self.assertIn("query", d)
        self.assertIn("candidates", d)
        self.assertIn("total_tokens_estimate", d)


class TestStandaloneAndCli(unittest.TestCase):
    """Test standalone functions and CLI query subcommand."""

    def test_standalone_functions_with_conn(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            root = Path(tmpdir)
            db_path = root / ".fastast.db"
            conn = get_connection(db_path)
            init_db(conn)

            facts = ExtractedFileFacts(
                file_path="math_utils.py",
                language="python",
                total_lines=10,
                symbols=[
                    SymbolRecord(name="add", kind="function", file="math_utils.py", start_line=1, end_line=3, confidence=1.0),
                    SymbolRecord(name="multiply", kind="function", file="math_utils.py", start_line=5, end_line=7, confidence=1.0),
                ],
                edges=[
                    EdgeRecord(src="multiply", dst="add", relation="calls", confidence=1.0),
                ],
            )
            store_file_data(conn, facts, language="python", category="source")

            # search_symbols
            cands = search_symbols(conn, "add")
            self.assertEqual(len(cands), 1)
            self.assertEqual(cands[0].name, "add")

            # get_symbol_by_name
            syms = get_symbol_by_name("add", db_or_conn=conn)
            self.assertEqual(len(syms), 1)
            self.assertEqual(syms[0].name, "add")

            # get_symbol_by_path
            path_syms = get_symbol_by_path("math_utils.py", db_or_conn=conn)
            self.assertEqual(len(path_syms), 2)

            # get_callers & get_callees
            callers = get_callers("add", db_or_conn=conn)
            self.assertEqual(len(callers), 1)
            self.assertEqual(callers[0]["caller"], "multiply")

            callees = get_callees("multiply", db_or_conn=conn)
            self.assertEqual(len(callees), 1)
            self.assertEqual(callees[0]["callee"], "add")

            # search_files
            files = search_files("math", db_or_conn=conn)
            self.assertEqual(len(files), 1)

            # retrieve_bundle
            bundle = retrieve_bundle("multiply", db_or_conn=conn)
            self.assertGreater(len(bundle.candidates), 0)

            conn.close()

    def test_cli_query_runner(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            root = Path(tmpdir)
            (root / "service.py").write_text(
                "class PaymentGateway:\n"
                "    def charge(self, amount):\n"
                "        return True\n"
            )

            # CLI text output
            buf_text = io.StringIO()
            with redirect_stdout(buf_text):
                code = run_query("charge", dir_path=str(root))
            self.assertEqual(code, 0)
            self.assertIn("PaymentGateway", buf_text.getvalue())

            # CLI JSON output
            buf_json = io.StringIO()
            with redirect_stdout(buf_json):
                code_json = run_query("charge", dir_path=str(root), json_output=True)
            self.assertEqual(code_json, 0)
            data = json.loads(buf_json.getvalue())
            self.assertIn("candidates", data)
            self.assertGreater(len(data["candidates"]), 0)


class TestPhase7MultiSignalRanking(unittest.TestCase):
    """Verify Phase 7 multi-signal ranking, BM25 weighting, heuristic fallbacks, and bounded output."""

    def test_bm25_is_one_signal_not_whole_system(self):
        """BM25 is only one signal: exact name + graph degree + primary kind outscores docstring-only BM25 match."""
        # Candidate A: exact function name match + 5 connected edges, no docstring match
        score_a, reasons_a = score_candidate(
            sym_name="process_order",
            sym_kind="function",
            file_path="src/orders.py",
            file_category="source",
            sym_confidence=1.0,
            edge_count=5,
            query="process_order",
            bm25_score=0.70,
        )

        # Candidate B: weak name match ('utils'), 0 edges, but high BM25 match from keyword in docstring
        score_b, reasons_b = score_candidate(
            sym_name="misc_utils",
            sym_kind="variable",
            file_path="src/utils.py",
            file_category="source",
            sym_confidence=1.0,
            edge_count=0,
            query="process_order",
            docstring="Internal helper for process_order workflow",
            bm25_score=0.95,  # higher raw BM25 score
        )

        # Candidate A must outscore Candidate B because BM25 is not the whole system
        self.assertGreater(score_a, score_b)
        self.assertTrue(any("Exact name match" in r for r in reasons_a))
        self.assertTrue(any("BM25 lexical match" in r for r in reasons_b))

    def test_heuristic_fallback_when_fts_empty(self):
        """When FTS table is empty or missing, search_symbols seamlessly falls back to structural heuristic ranking."""
        with tempfile.TemporaryDirectory() as tmpdir:
            root = Path(tmpdir)
            db_path = root / ".fastast.db"
            conn = get_connection(db_path)
            init_db(conn)

            facts = ExtractedFileFacts(
                file_path="auth.py",
                language="python",
                total_lines=15,
                symbols=[
                    SymbolRecord(name="authenticate_user", kind="function", file="auth.py", start_line=1, end_line=5, confidence=1.0),
                ],
                edges=[],
            )
            store_file_data(conn, facts, language="python", category="source")

            # Intentionally clear FTS table to simulate missing/disabled FTS index
            with conn:
                conn.execute("DELETE FROM symbols_fts")

            # Must fall back to heuristic ranking without error
            with RetrievalEngine(conn, repo_root=root) as engine:
                results = engine.search_symbols("authenticate_user", ranking_method="hybrid")
                self.assertEqual(len(results), 1)
                self.assertEqual(results[0].name, "authenticate_user")
                self.assertGreater(results[0].score, 0.5)

    def test_fts_staleness_synchronization(self):
        """Verify that stale FTS tables (fewer rows than symbols) are auto-synchronized by init_db."""
        with tempfile.TemporaryDirectory() as tmpdir:
            root = Path(tmpdir)
            db_path = root / ".fastast.db"
            conn = get_connection(db_path)
            init_db(conn)

            # Insert file and symbol directly to bypass triggers and simulate stale FTS
            with conn:
                conn.execute(
                    "INSERT INTO files (path, language, hash, mtime, total_lines, total_tokens) VALUES ('stale.py', 'python', 'h1', 1.0, 10, 20)"
                )
                fid = conn.execute("SELECT id FROM files WHERE path = 'stale.py'").fetchone()[0]
                conn.execute(
                    "INSERT INTO symbols (file_id, name, kind, signature, start_line, end_line) VALUES (?, 'sync_target', 'function', 'def sync_target():', 1, 3)",
                    (fid,),
                )
                # Clear FTS to make it stale
                conn.execute("DELETE FROM symbols_fts")

            cur = conn.cursor()
            cur.execute("SELECT COUNT(*) FROM symbols_fts")
            self.assertEqual(cur.fetchone()[0], 0)

            # Calling init_db detects staleness and auto-syncs
            init_db(conn)
            cur.execute("SELECT COUNT(*) FROM symbols_fts")
            self.assertEqual(cur.fetchone()[0], 1)

    def test_bounded_output_k_and_snippets(self):
        """Verify output is strictly bounded by top-K and snippet line limits."""
        with tempfile.TemporaryDirectory() as tmpdir:
            root = Path(tmpdir)
            (root / "many.py").write_text("\n".join(f"def action_{i}(): pass" for i in range(20)))
            db_path = root / ".fastast.db"
            conn = get_connection(db_path)
            init_db(conn)

            symbols = [
                SymbolRecord(name=f"action_{i}", kind="function", file="many.py", start_line=i, end_line=i, confidence=1.0)
                for i in range(1, 21)
            ]
            facts = ExtractedFileFacts(
                file_path="many.py",
                language="python",
                total_lines=20,
                symbols=symbols,
                edges=[],
            )
            store_file_data(conn, facts, language="python", category="source")

            with RetrievalEngine(conn, repo_root=root) as engine:
                # Limit strictly bounds to k=3
                cands = engine.search_symbols("action", limit=3)
                self.assertEqual(len(cands), 3)

                # Snippet line bounds
                snip = engine.get_snippet("action_1", window_lines=1, max_snippet_lines=5)
                self.assertIsNotNone(snip)
                lines = (snip.snippet or "").splitlines()
                self.assertLessEqual(len(lines), 5)


if __name__ == "__main__":
    unittest.main()

