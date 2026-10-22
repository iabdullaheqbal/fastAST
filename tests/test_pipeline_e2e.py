"""End-to-End Pipeline & Resilience Integration Tests for FastAST.

Covers:
- Complete pipeline: Discover -> Extract -> Graph -> Retrieve Bundle
- Missing and deleted file handling
- Empty database and zero-match degradation
- Low-confidence and noise pruning across layers
- Snippet line bounding and strict token budget enforcement
- CLI end-to-end subcommand orchestration
"""

import io
import json
import sqlite3
import tempfile
import unittest
from contextlib import redirect_stdout
from pathlib import Path

from fastast.cli import run_graph, run_index, run_query, run_scan, run_symbols
from fastast.db import get_connection, init_db, store_file_data
from fastast.discovery import discover_files
from fastast.extractor import parse_file_records
from fastast.graph import CodeGraph
from fastast.model import (
    Candidate,
    EdgeRecord,
    EdgeRelation,
    EvidenceWindow,
    ExtractedFileFacts,
    FileCategory,
    FileRecord,
    SymbolRecord,
)
from fastast.retrieval import RetrievalEngine, estimate_tokens, retrieve_bundle, search_symbols


class TestFullPipelineE2E(unittest.TestCase):
    """Test the complete multi-file, multi-layer FastAST pipeline."""

    def setUp(self):
        self.tmpdir = tempfile.TemporaryDirectory()
        self.root = Path(self.tmpdir.name)

        # 1. Create a realistic project structure
        (self.root / "models").mkdir(parents=True)
        (self.root / "services").mkdir(parents=True)
        (self.root / "utils").mkdir(parents=True)
        (self.root / "tests").mkdir(parents=True)

        (self.root / "models" / "user.py").write_text(
            "class User:\n"
            "    def __init__(self, username, email):\n"
            "        self.username = username\n"
            "        self.email = email\n\n"
            "    def is_valid(self):\n"
            "        return bool(self.username and self.email)\n"
        )

        (self.root / "services" / "base.py").write_text(
            "class BaseService:\n"
            "    def log_action(self, action):\n"
            "        return f'Action logged: {action}'\n"
        )

        (self.root / "services" / "auth.py").write_text(
            "from services.base import BaseService\n"
            "from models.user import User\n"
            "from utils.crypto import hash_token, verify_credentials\n\n"
            "class AuthService(BaseService):\n"
            "    def login(self, username, password):\n"
            "        user = User(username, 'user@example.com')\n"
            "        if not user.is_valid():\n"
            "            return False\n"
            "        token = hash_token(password)\n"
            "        self.log_action('login_attempt')\n"
            "        return verify_credentials(user, token)\n"
        )

        (self.root / "utils" / "crypto.py").write_text(
            "def hash_token(secret):\n"
            "    _ = len(secret)  # Builtin call to test noise pruning\n"
            "    return f'tok_{secret}'\n\n"
            "def verify_credentials(user, token):\n"
            "    return True\n"
        )

        (self.root / "tests" / "test_auth.py").write_text(
            "from services.auth import AuthService\n\n"
            "def test_auth_login():\n"
            "    service = AuthService()\n"
            "    assert service.login('admin', 'pass')\n"
        )

        (self.root / "config.toml").write_text(
            "[server]\n"
            "host = '127.0.0.1'\n"
            "port = 8080\n"
        )

    def tearDown(self):
        self.tmpdir.cleanup()

    def test_complete_discovery_to_retrieval_flow(self):
        # ── Step 1: File Admission Layer (Repo-level Pruning) ────────────────
        admitted = discover_files(self.root)
        self.assertGreaterEqual(len(admitted), 6)

        categories = {r.category for r in admitted}
        self.assertIn(FileCategory.SOURCE.value, categories)
        self.assertIn(FileCategory.TEST.value, categories)
        self.assertIn(FileCategory.CONFIG.value, categories)

        for rec in admitted:
            self.assertTrue(len(rec.hash) > 0)
            self.assertGreater(rec.total_lines, 0)

        # ── Step 2: Parser + Fact Extractor (Syntax-level Pruning) ───────────
        facts = parse_file_records(admitted, repo_root=self.root)
        self.assertEqual(len(facts), len(admitted))

        all_symbols = [s for f in facts for s in f.symbols]
        all_edges = [e for f in facts for e in f.edges]

        symbol_names = {s.name for s in all_symbols}
        self.assertIn("AuthService", symbol_names)
        self.assertIn("login", symbol_names)
        self.assertIn("User", symbol_names)
        self.assertIn("hash_token", symbol_names)

        # Verify inheritance edge was extracted
        inherits_edges = [e for e in all_edges if e.relation == EdgeRelation.INHERITS.value]
        self.assertTrue(any(e.src == "AuthService" and e.dst == "BaseService" for e in inherits_edges))

        # ── Step 3: Graph Construction (Graph-level Pruning) ─────────────────
        graph = CodeGraph.from_facts(facts)
        # Built-in noise `len` should have been pruned from graph calls
        crypto_calls = graph.get_outgoing_edges("hash_token", relation="calls")
        self.assertNotIn("len", [e.dst for e in crypto_calls])

        # Bounded BFS traversal from AuthService
        traversal = graph.bounded_traversal("AuthService", max_depth=2, direction="both")
        traversed_names = {n["name"] for n in traversal["nodes"]}
        self.assertIn("AuthService", traversed_names)
        self.assertIn("login", traversed_names)
        self.assertIn("BaseService", traversed_names)

        # ── Step 4: Storage & Retrieval Pipeline (Query-time Pruning) ────────
        db_path = self.root / ".fastast.db"
        conn = get_connection(db_path)
        init_db(conn)
        for f in facts:
            store_file_data(conn, f)
        conn.close()

        with RetrievalEngine(db_path, repo_root=self.root) as engine:
            bundle = engine.retrieve_bundle("login", limit=3)
            self.assertGreater(len(bundle.candidates), 0)

            # Top candidate must be AuthService.login
            top = bundle.candidates[0]
            self.assertEqual(top.name, "login")
            self.assertGreater(top.score, 0.75)
            self.assertIn("services/auth.py", top.file_path)

            # Evidence snippet must be bounded and accurate
            self.assertIsNotNone(top.evidence_window.snippet)
            self.assertIn("def login(self, username, password):", top.evidence_window.snippet)

            # Connected graph neighbors attached
            self.assertIn("hash_token", top.neighbors)

            # Bundle must be compact (not thousands of lines)
            self.assertLess(bundle.total_tokens_estimate, 500)


class TestPipelineResilience(unittest.TestCase):
    """Test edge cases, missing files, empty states, and pruning bounds."""

    def setUp(self):
        self.tmpdir = tempfile.TemporaryDirectory()
        self.root = Path(self.tmpdir.name)
        self.db_path = self.root / ".fastast.db"
        self.conn = get_connection(self.db_path)
        init_db(self.conn)

    def tearDown(self):
        self.conn.close()
        self.tmpdir.cleanup()

    def test_deleted_file_graceful_handling(self):
        # 1. Create and store a file
        temp_file = self.root / "transient.py"
        temp_file.write_text("def ephemeral_func():\n    return 42\n")

        facts = ExtractedFileFacts(
            file_path="transient.py",
            language="python",
            total_lines=2,
            symbols=[
                SymbolRecord(name="ephemeral_func", kind="function", file="transient.py", start_line=1, end_line=2, confidence=1.0),
            ],
        )
        store_file_data(self.conn, facts)

        # 2. Delete the physical file from disk
        temp_file.unlink()
        self.assertFalse(temp_file.exists())

        # 3. Query should NOT crash; snippet should degrade to None gracefully
        engine = RetrievalEngine(self.conn, repo_root=self.root)
        bundle = engine.retrieve_bundle("ephemeral_func")
        self.assertEqual(len(bundle.candidates), 1)

        cand = bundle.candidates[0]
        self.assertEqual(cand.name, "ephemeral_func")
        # Bounds exist, but snippet is None since file was removed
        self.assertEqual(cand.evidence_window.start_line, 1)
        self.assertIsNone(cand.evidence_window.snippet)

    def test_empty_db_and_no_match_queries(self):
        engine = RetrievalEngine(self.conn, repo_root=self.root)

        # Empty database returns empty results cleanly
        cands = engine.search_symbols("any_symbol")
        self.assertEqual(cands, [])

        bundle = engine.retrieve_bundle("any_query")
        self.assertEqual(len(bundle.candidates), 0)
        self.assertEqual(bundle.total_tokens_estimate, 0)

        syms = engine.get_symbol_by_name("nonexistent")
        self.assertEqual(syms, [])

        callers = engine.get_callers("nonexistent")
        self.assertEqual(callers, [])

        callees = engine.get_callees("nonexistent")
        self.assertEqual(callees, [])

        related = engine.get_related_files("nonexistent")
        self.assertEqual(related, [])

        files = engine.search_files("nonexistent")
        self.assertEqual(files, [])

    def test_low_confidence_pruning(self):
        # Store high confidence symbol and low confidence noise
        facts = ExtractedFileFacts(
            file_path="noisy.py",
            language="python",
            total_lines=20,
            symbols=[
                SymbolRecord(name="good_symbol", kind="function", file="noisy.py", start_line=1, end_line=5, confidence=1.0),
                SymbolRecord(name="broken_syntax_symbol", kind="function", file="noisy.py", start_line=10, end_line=15, confidence=0.2),
            ],
            edges=[
                EdgeRecord(src="good_symbol", dst="target_a", relation="calls", confidence=0.9),
                EdgeRecord(src="good_symbol", dst="weak_noise", relation="calls", confidence=0.3),  # Low confidence
            ],
        )
        store_file_data(self.conn, facts)

        engine = RetrievalEngine(self.conn, repo_root=self.root)

        # Graph expansion should drop edge with 0.3 confidence
        cands = engine.search_symbols("good_symbol")
        self.assertEqual(len(cands), 1)
        self.assertIn("target_a", cands[0].neighbors)
        self.assertNotIn("weak_noise", cands[0].neighbors)

        # Broken symbol with confidence 0.2 and no name match should be pruned below min_score
        noisy_matches = engine.search_symbols("xyz_nomatch", min_score=0.25)
        self.assertEqual(len(noisy_matches), 0)

    def test_snippet_bounds_on_large_symbol(self):
        # Create a file with a large symbol (120 lines)
        large_code_lines = ["def massive_processor():\n"]
        for i in range(1, 120):
            large_code_lines.append(f"    step_{i} = do_work({i})\n")
        large_code_lines.append("    return True\n")

        large_file = self.root / "massive.py"
        large_file.write_text("".join(large_code_lines))

        facts = ExtractedFileFacts(
            file_path="massive.py",
            language="python",
            total_lines=121,
            symbols=[
                SymbolRecord(name="massive_processor", kind="function", file="massive.py", start_line=1, end_line=121, confidence=1.0),
            ],
        )
        store_file_data(self.conn, facts)

        engine = RetrievalEngine(self.conn, repo_root=self.root)
        snippet_window = engine.get_snippet("massive_processor", window_lines=2, max_snippet_lines=40)
        self.assertIsNotNone(snippet_window)
        self.assertIsNotNone(snippet_window.snippet)

        snippet_lines = snippet_window.snippet.splitlines()
        # Should be bounded to max_snippet_lines + 1 (the omission marker line)
        self.assertLessEqual(len(snippet_lines), 45)
        self.assertIn("lines omitted for brevity", snippet_window.snippet)
        self.assertIn("def massive_processor():", snippet_lines[0])
        self.assertIn("return True", snippet_lines[-1])

    def test_strict_token_budget_pruning(self):
        # Store three symbols in DB
        code_file = self.root / "multi.py"
        code_file.write_text(
            "def alpha():\n    return 'alpha'\n\n"
            "def beta():\n    return 'beta'\n\n"
            "def gamma():\n    return 'gamma'\n"
        )
        facts = ExtractedFileFacts(
            file_path="multi.py",
            language="python",
            total_lines=8,
            symbols=[
                SymbolRecord(name="candidate_alpha", kind="function", file="multi.py", start_line=1, end_line=2, confidence=1.0),
                SymbolRecord(name="candidate_beta", kind="function", file="multi.py", start_line=4, end_line=5, confidence=1.0),
                SymbolRecord(name="candidate_gamma", kind="function", file="multi.py", start_line=7, end_line=8, confidence=1.0),
            ],
        )
        store_file_data(self.conn, facts)

        engine = RetrievalEngine(self.conn, repo_root=self.root)
        # Without token budget: returns all 3
        all_cands = engine.search_symbols("candidate", limit=5)
        self.assertEqual(len(all_cands), 3)

        # With a tiny token budget of 15 tokens: prunes after first candidate
        bounded_cands = engine.search_symbols("candidate", limit=5, max_tokens=15)
        self.assertLessEqual(len(bounded_cands), 2)


class TestCliOrchestrationE2E(unittest.TestCase):
    """Test CLI commands work end-to-end with clear outputs and robust error handling."""

    def setUp(self):
        self.tmpdir = tempfile.TemporaryDirectory()
        self.root = Path(self.tmpdir.name)
        (self.root / "app.py").write_text(
            "class AppServer:\n"
            "    def start(self):\n"
            "        self.listen()\n\n"
            "    def listen(self):\n"
            "        pass\n"
        )

    def tearDown(self):
        self.tmpdir.cleanup()

    def test_cli_scan_index_symbols_graph_query_pipeline(self):
        # 1. fastast scan
        buf = io.StringIO()
        with redirect_stdout(buf):
            code_scan = run_scan(str(self.root))
        self.assertEqual(code_scan, 0)
        self.assertIn("Admitted Files:", buf.getvalue())

        # 2. fastast index
        buf = io.StringIO()
        with redirect_stdout(buf):
            code_index = run_index(str(self.root))
        self.assertEqual(code_index, 0)
        self.assertIn("FastAST Repository Indexing Complete", buf.getvalue())

        # 3. fastast symbols
        buf = io.StringIO()
        with redirect_stdout(buf):
            code_syms = run_symbols("start", dir_path=str(self.root))
        self.assertEqual(code_syms, 0)
        self.assertIn("AppServer.start", buf.getvalue())

        # 4. fastast graph
        buf = io.StringIO()
        with redirect_stdout(buf):
            code_graph = run_graph("AppServer", dir_path=str(self.root), max_depth=2)
        self.assertEqual(code_graph, 0)
        self.assertIn("Graph Neighborhood", buf.getvalue())

        # 5. fastast query
        buf = io.StringIO()
        with redirect_stdout(buf):
            code_query = run_query("start", dir_path=str(self.root))
        self.assertEqual(code_query, 0)
        self.assertIn("FastAST Evidence Bundle", buf.getvalue())
        self.assertIn("Top Candidates:", buf.getvalue())

    def test_cli_error_paths(self):
        buf = io.StringIO()
        with redirect_stdout(buf):
            # Missing directory on query
            code = run_query("anything", dir_path="/nonexistent/directory/fastast/test", json_output=True)
            self.assertEqual(code, 1)

            # Empty query string
            code_empty = run_query("", dir_path=str(self.root), json_output=True)
            self.assertEqual(code_empty, 1)

            # Missing directory on graph
            code_graph = run_graph("anything", dir_path="/nonexistent/directory/fastast/test", json_output=True)
            self.assertEqual(code_graph, 1)


if __name__ == "__main__":
    unittest.main()
