"""Tests for Phase 7: Advanced Retrieval (BM25 + Hybrid Ranking)."""

import io
import json
import sqlite3
import tempfile
import unittest
from contextlib import redirect_stdout
from pathlib import Path

from fastast.cli import run_query
from fastast.db import (
    delete_file_record,
    get_connection,
    init_db,
    sanitize_fts5_query,
    search_symbols_bm25,
    store_file_data,
)
from fastast.evidence import build_evidence_bundle
from fastast.extractor import ExtractedFileFacts
from fastast.model import (
    EdgeRecord,
    EdgeRelation,
    FileCategory,
    FileRecord,
    SymbolRecord,
)
from fastast.retrieval import (
    EvidenceBundle,
    RetrievalEngine,
    retrieve_bundle,
    score_candidate,
    search_symbols,
)


class TestFTS5Indexing(unittest.TestCase):
    """Test SQLite FTS5 index creation, triggers, sanitization, and BM25 scoring."""

    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.db_path = Path(self.temp_dir.name) / "test_fts5.db"
        self.conn = get_connection(self.db_path)
        init_db(self.conn)

    def tearDown(self):
        self.conn.close()
        self.temp_dir.cleanup()

    def test_fts5_table_and_triggers_exist(self):
        cur = self.conn.cursor()
        cur.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='symbols_fts';"
        )
        self.assertIsNotNone(cur.fetchone())

        cur.execute(
            "SELECT name FROM sqlite_master WHERE type='trigger' AND name IN ('symbols_ai', 'symbols_ad');"
        )
        triggers = [row[0] for row in cur.fetchall()]
        self.assertIn("symbols_ai", triggers)
        self.assertIn("symbols_ad", triggers)

    def test_sanitize_fts5_query(self):
        # Normal alphanumeric query
        sanitized = sanitize_fts5_query("query runner")
        self.assertIn('"query"*', sanitized)
        self.assertIn('"runner"*', sanitized)

        # Query with punctuation and symbols
        sanitized_punct = sanitize_fts5_query("foo(bar):baz-qux.test")
        self.assertIn('"foo"*', sanitized_punct)
        self.assertIn('"bar"*', sanitized_punct)
        self.assertIn('"baz"*', sanitized_punct)
        self.assertIn('"qux"*', sanitized_punct)

        # Empty or special-characters-only query
        self.assertEqual(sanitize_fts5_query(""), "")
        self.assertEqual(sanitize_fts5_query("   *** () +-- "), "")

    def test_fts5_insert_and_delete_triggers(self):
        sym_1 = SymbolRecord(
            name="parse_syntax_tree",
            kind="function",
            file="src/parser.py",
            start_line=10,
            end_line=30,
            confidence=1.0,
            signature="def parse_syntax_tree(source: str) -> Tree:",
            docstring="Performs AST tree-sitter parsing for syntax verification.",
        )
        facts = ExtractedFileFacts(
            file_path="src/parser.py",
            language="python",
            symbols=[sym_1],
            edges=[],
        )
        store_file_data(self.conn, facts)

        # Verify symbols_fts is populated
        cur = self.conn.cursor()
        cur.execute("SELECT rowid, name, signature, docstring FROM symbols_fts;")
        rows = cur.fetchall()
        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0][1], "parse_syntax_tree")
        self.assertEqual(
            rows[0][3], "Performs AST tree-sitter parsing for syntax verification."
        )

        # BM25 search for conceptual term in docstring
        bm25_scores = search_symbols_bm25(self.conn, "verification")
        self.assertEqual(len(bm25_scores), 1)
        self.assertIn(rows[0][0], bm25_scores)
        self.assertGreater(bm25_scores[rows[0][0]], 0.0)

        # Delete file and ensure trigger cleans up FTS5
        delete_file_record(self.conn, "src/parser.py")
        cur.execute("SELECT count(*) FROM symbols_fts;")
        count = cur.fetchone()[0]
        self.assertEqual(count, 0)

        # BM25 search should now return empty
        bm25_scores_after = search_symbols_bm25(self.conn, "verification")
        self.assertEqual(len(bm25_scores_after), 0)


class TestHybridRetrievalEngine(unittest.TestCase):
    """Test BM25 search, hybrid ranking, and RRF fusion."""

    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.repo_dir = Path(self.temp_dir.name)
        self.db_dir = self.repo_dir / ".fastast"
        self.db_dir.mkdir(parents=True, exist_ok=True)
        self.db_path = self.db_dir / "index.db"
        self.conn = get_connection(self.db_path)
        init_db(self.conn)

        # Create sample files on disk
        self.src_dir = self.repo_dir / "src"
        self.src_dir.mkdir(parents=True, exist_ok=True)

        billing_py = self.src_dir / "billing.py"
        billing_py.write_text(
            'def calculate_tax(amount: float) -> float:\n'
            '    """Computes fiscal duty and VAT levies for invoicing."""\n'
            '    return amount * 0.20\n\n'
            'def generate_invoice(user_id: int):\n'
            '    """Builds customer invoice and writes PDF statement."""\n'
            '    tax = calculate_tax(100.0)\n'
            '    return tax\n'
        )

        parser_py = self.src_dir / "parser.py"
        parser_py.write_text(
            'def parse_tokens(source: str):\n'
            '    """Tokenize source code into lexer tokens."""\n'
            '    return source.split()\n'
        )

        # Index billing.py
        sym_calc = SymbolRecord(
            name="calculate_tax",
            kind="function",
            file="src/billing.py",
            start_line=1,
            end_line=3,
            confidence=1.0,
            signature="def calculate_tax(amount: float) -> float:",
            docstring="Computes fiscal duty and VAT levies for invoicing.",
        )
        sym_inv = SymbolRecord(
            name="generate_invoice",
            kind="function",
            file="src/billing.py",
            start_line=5,
            end_line=8,
            confidence=1.0,
            signature="def generate_invoice(user_id: int):",
            docstring="Builds customer invoice and writes PDF statement.",
        )
        edge_call = EdgeRecord(
            src="generate_invoice",
            dst="calculate_tax",
            relation=EdgeRelation.CALLS,
            confidence=0.9,
        )
        store_file_data(
            self.conn,
            ExtractedFileFacts(
                file_path="src/billing.py",
                language="python",
                total_lines=8,
                symbols=[sym_calc, sym_inv],
                edges=[edge_call],
            ),
        )

        # Index parser.py
        sym_parse = SymbolRecord(
            name="parse_tokens",
            kind="function",
            file="src/parser.py",
            start_line=1,
            end_line=3,
            confidence=1.0,
            signature="def parse_tokens(source: str):",
            docstring="Tokenize source code into lexer tokens.",
        )
        store_file_data(
            self.conn,
            ExtractedFileFacts(
                file_path="src/parser.py",
                language="python",
                total_lines=3,
                symbols=[sym_parse],
                edges=[],
            ),
        )

        self.engine = RetrievalEngine(self.conn, repo_root=self.repo_dir)

    def tearDown(self):
        self.conn.close()
        self.temp_dir.cleanup()

    def test_docstring_concept_retrieval_via_bm25(self):
        """Verify BM25 finds symbols by docstring keywords that do NOT appear in symbol name."""
        results = self.engine.search_symbols(
            "fiscal duty", ranking_method="hybrid", limit=5
        )
        self.assertTrue(len(results) >= 1)
        # calculate_tax should be found because of 'fiscal duty' in docstring
        top_symbol = results[0]
        self.assertEqual(top_symbol.name, "calculate_tax")
        self.assertEqual(top_symbol.file_path, "src/billing.py")
        self.assertTrue(any("BM25 lexical match" in r for r in top_symbol.reasons))

    def test_exact_name_match_outranks_conceptual_docstring_match(self):
        """Exact name match should outrank conceptual BM25-only matches."""
        # Query 'calculate_tax' matches name exactly, and also BM25
        results = self.engine.search_symbols(
            "calculate_tax", ranking_method="hybrid", limit=5
        )
        self.assertTrue(len(results) >= 1)
        self.assertEqual(results[0].name, "calculate_tax")
        self.assertEqual(results[0].file_path, "src/billing.py")
        self.assertTrue(any("Exact name match" in r for r in results[0].reasons))

    def test_ranking_methods_comparison(self):
        """Compare hybrid vs rrf vs heuristic ranking results."""
        # Hybrid
        hybrid_results = self.engine.search_symbols(
            "invoice", ranking_method="hybrid", limit=5
        )
        self.assertTrue(len(hybrid_results) >= 1)
        self.assertEqual(hybrid_results[0].name, "generate_invoice")

        # RRF
        rrf_results = self.engine.search_symbols(
            "invoice", ranking_method="rrf", limit=5
        )
        self.assertTrue(len(rrf_results) >= 1)
        self.assertEqual(rrf_results[0].name, "generate_invoice")
        self.assertTrue(any("RRF score" in r for r in rrf_results[0].reasons))

        # Heuristic (Phase 4 legacy fallback)
        heur_results = self.engine.search_symbols(
            "generate_invoice", ranking_method="heuristic", limit=5
        )
        self.assertTrue(len(heur_results) >= 1)
        self.assertEqual(heur_results[0].name, "generate_invoice")
        # Should NOT contain BM25 score reason
        self.assertFalse(any("BM25 lexical match" in r for r in heur_results[0].reasons))

    def test_incremental_fts5_synchronization(self):
        """Updating a file's symbols keeps FTS5 synchronized."""
        # Query for old docstring 'lexer tokens'
        res1 = self.engine.search_symbols("lexer tokens", ranking_method="hybrid")
        self.assertEqual(len(res1), 1)
        self.assertEqual(res1[0].name, "parse_tokens")

        # Delete and re-index src/parser.py with new symbol
        delete_file_record(self.conn, "src/parser.py")
        sym_parse_ast = SymbolRecord(
            name="parse_ast_tree",
            kind="function",
            file="src/parser.py",
            start_line=1,
            end_line=3,
            confidence=1.0,
            signature="def parse_ast_tree(grammar: str):",
            docstring="Compiles concrete grammar into syntax trees.",
        )
        store_file_data(
            self.conn,
            ExtractedFileFacts(
                file_path="src/parser.py",
                language="python",
                total_lines=3,
                symbols=[sym_parse_ast],
                edges=[],
            ),
        )

        # Old query 'lexer tokens' should now return 0 results
        res_old = self.engine.search_symbols("lexer tokens", ranking_method="hybrid")
        self.assertEqual(len(res_old), 0)

        # New query 'syntax trees' should find 'parse_ast_tree'
        res_new = self.engine.search_symbols("syntax trees", ranking_method="hybrid")
        self.assertEqual(len(res_new), 1)
        self.assertEqual(res_new[0].name, "parse_ast_tree")

    def test_fts5_table_missing_fallback(self):
        """Engine should gracefully fall back to heuristic search if symbols_fts table is missing."""
        self.conn.execute("DROP TABLE IF EXISTS symbols_fts;")
        # Should not raise an error
        results = self.engine.search_symbols("calculate_tax", ranking_method="hybrid")
        self.assertTrue(len(results) >= 1)
        self.assertEqual(results[0].name, "calculate_tax")

    def test_retrieve_bundle_hybrid(self):
        """Verify retrieve_bundle works with ranking_method='hybrid' and returns evidence."""
        bundle = self.engine.retrieve_bundle(
            query="fiscal duty",
            ranking_method="hybrid",
            max_tokens=1000,
        )
        self.assertIsInstance(bundle, EvidenceBundle)
        self.assertTrue(len(bundle.candidates) >= 1)
        self.assertEqual(bundle.candidates[0].name, "calculate_tax")
        self.assertTrue(len(bundle.snippets) >= 1)
        self.assertIn("calculate_tax", bundle.snippets[0]["code"])


class TestCLIRankingIntegration(unittest.TestCase):
    """Test CLI fastast query with --ranking flag and json output."""

    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.repo_dir = Path(self.temp_dir.name)
        self.db_dir = self.repo_dir / ".fastast"
        self.db_dir.mkdir(parents=True, exist_ok=True)
        self.db_path = self.db_dir / "index.db"
        self.conn = get_connection(self.db_path)
        init_db(self.conn)

        # Write sample file to disk for snippets
        sample_file = self.repo_dir / "math_utils.py"
        sample_file.write_text(
            'def fibonacci_memoized(n: int) -> int:\n'
            '    """Computes fibonacci sequence using dynamic programming memoization."""\n'
            '    return n\n'
        )

        sym_rec = SymbolRecord(
            name="fibonacci_memoized",
            kind="function",
            file="math_utils.py",
            start_line=1,
            end_line=3,
            confidence=1.0,
            signature="def fibonacci_memoized(n: int) -> int:",
            docstring="Computes fibonacci sequence using dynamic programming memoization.",
        )
        store_file_data(
            self.conn,
            ExtractedFileFacts(
                file_path="math_utils.py",
                language="python",
                total_lines=3,
                symbols=[sym_rec],
                edges=[],
            ),
        )
        self.conn.close()

    def tearDown(self):
        self.temp_dir.cleanup()

    def test_cli_query_with_hybrid_and_rrf(self):
        # Hybrid ranking CLI test
        stdout_hybrid = io.StringIO()
        with redirect_stdout(stdout_hybrid):
            ret = run_query(
                query="dynamic programming memoization",
                dir_path=str(self.repo_dir),
                ranking_method="hybrid",
                json_output=True,
            )
        self.assertEqual(ret, 0)
        data = json.loads(stdout_hybrid.getvalue())
        self.assertIn("candidates", data)
        self.assertTrue(len(data["candidates"]) >= 1)
        self.assertEqual(
            data["candidates"][0]["name"], "fibonacci_memoized"
        )

        # RRF ranking CLI test
        stdout_rrf = io.StringIO()
        with redirect_stdout(stdout_rrf):
            ret = run_query(
                query="fibonacci",
                dir_path=str(self.repo_dir),
                ranking_method="rrf",
                json_output=True,
            )
        self.assertEqual(ret, 0)
        data_rrf = json.loads(stdout_rrf.getvalue())
        self.assertIn("candidates", data_rrf)
        self.assertTrue(len(data_rrf["candidates"]) >= 1)
        self.assertEqual(
            data_rrf["candidates"][0]["name"], "fibonacci_memoized"
        )


if __name__ == "__main__":
    unittest.main()
