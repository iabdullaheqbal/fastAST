"""Tests for Phase 8: Semantic Embeddings and Vector Search."""

import io
import json
import sqlite3
import tempfile
import unittest
from contextlib import redirect_stdout
from pathlib import Path

from fastast.cli import run_query
from fastast.db import (
    backfill_symbol_embeddings,
    delete_file_record,
    delete_symbol_embedding,
    get_connection,
    get_symbol_embedding,
    init_db,
    search_symbols_semantic,
    store_file_data,
    store_symbol_embedding,
)
from fastast.embeddings import (
    BaseEmbeddingProvider,
    CustomEmbeddingProvider,
    SemanticProjectionProvider,
    cosine_similarity,
    decode_embedding,
    encode_embedding,
    get_embedding_provider,
    prepare_symbol_text,
)
from fastast.evidence import build_evidence_bundle
from fastast.extractor import ExtractedFileFacts
from fastast.model import (
    EdgeRecord,
    EdgeRelation,
    FileCategory,
    SymbolRecord,
)
from fastast.retrieval import (
    EvidenceBundle,
    RetrievalEngine,
    score_candidate,
)


class TestEmbeddingProvider(unittest.TestCase):
    """Test embedding generation, serialization, and similarity calculation."""

    def setUp(self):
        self.provider = SemanticProjectionProvider(dimension=128)

    def test_embedding_dimension_and_normalization(self):
        vec = self.provider.embed_text("def authenticate_user(credentials): pass")
        self.assertEqual(len(vec), 128)

        # L2 norm should be approximately 1.0
        norm = sum(x * x for x in vec) ** 0.5
        self.assertAlmostEqual(norm, 1.0, places=4)

    def test_deterministic_embedding(self):
        vec1 = self.provider.embed_text("handle_database_transaction")
        vec2 = self.provider.embed_text("handle_database_transaction")
        self.assertEqual(vec1, vec2)

    def test_encode_and_decode_embedding(self):
        vec = self.provider.embed_text("verify_token_permission")
        blob = encode_embedding(vec)
        self.assertEqual(len(blob), 128 * 4)  # 128 floats * 4 bytes

        decoded = decode_embedding(blob)
        self.assertEqual(len(decoded), 128)
        for orig, dec in zip(vec, decoded):
            self.assertAlmostEqual(orig, dec, places=5)

    def test_concept_semantic_similarity(self):
        """Related concepts should have high cosine similarity; unrelated should have low."""
        q_auth = self.provider.embed_text("user authentication check")
        doc_auth = self.provider.embed_text(
            "def verify_login_credentials(session_token): Check user credentials"
        )
        doc_tax = self.provider.embed_text(
            "def calculate_vat_levies(amount): Computes fiscal duty and tax invoice"
        )
        doc_math = self.provider.embed_text(
            "def fibonacci_memoized(n): Computes dynamic programming series"
        )

        sim_auth = cosine_similarity(q_auth, doc_auth)
        sim_tax = cosine_similarity(q_auth, doc_tax)
        sim_math = cosine_similarity(q_auth, doc_math)

        self.assertGreater(sim_auth, 0.65)
        self.assertLess(sim_tax, 0.20)
        self.assertLess(sim_math, 0.20)
        self.assertGreater(sim_auth, sim_tax + 0.45)

    def test_custom_embedding_provider(self):
        """Test pluggable custom embedding provider."""
        def mock_embed(text: str):
            return [1.0 if "auth" in text else 0.0] * 64

        custom = CustomEmbeddingProvider(mock_embed, model_name="mock-model", dimension=64)
        self.assertEqual(custom.model_name, "mock-model")
        self.assertEqual(custom.dimension, 64)

        vec = custom.embed_text("auth handler")
        self.assertEqual(len(vec), 64)
        norm = sum(x * x for x in vec) ** 0.5
        self.assertAlmostEqual(norm, 1.0, places=4)


class TestEmbeddingStorageAndDatabase(unittest.TestCase):
    """Test SQLite symbol_embeddings table, cascade deletes, and search."""

    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.db_path = Path(self.temp_dir.name) / "test_embeddings.db"
        self.conn = get_connection(self.db_path)
        init_db(self.conn)

    def tearDown(self):
        self.conn.close()
        self.temp_dir.cleanup()

    def test_table_exists(self):
        cur = self.conn.cursor()
        cur.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='symbol_embeddings';"
        )
        self.assertIsNotNone(cur.fetchone())

    def test_store_and_get_embedding(self):
        # Insert file and symbol first to satisfy foreign key
        sym_1 = SymbolRecord(
            name="authenticate_session",
            kind="function",
            file="src/auth.py",
            start_line=1,
            end_line=10,
            confidence=1.0,
        )
        facts = ExtractedFileFacts(
            file_path="src/auth.py",
            language="python",
            symbols=[sym_1],
            edges=[],
        )
        store_file_data(self.conn, facts, embed_symbols=False)

        cur = self.conn.cursor()
        cur.execute("SELECT id FROM symbols WHERE name='authenticate_session'")
        sym_id = cur.fetchone()[0]

        provider = SemanticProjectionProvider(128)
        vec = provider.embed_text("authenticate_session")
        store_symbol_embedding(self.conn, sym_id, provider.model_name, vec)

        retrieved = get_symbol_embedding(self.conn, sym_id)
        self.assertIsNotNone(retrieved)
        self.assertEqual(len(retrieved), 128)
        self.assertAlmostEqual(cosine_similarity(vec, retrieved), 1.0, places=4)

        # Delete symbol embedding
        delete_symbol_embedding(self.conn, sym_id)
        self.assertIsNone(get_symbol_embedding(self.conn, sym_id))

    def test_cascade_delete_file_removes_embeddings(self):
        """Deleting a file record cascades and deletes its symbol embeddings."""
        sym_1 = SymbolRecord(
            name="render_page",
            kind="function",
            file="src/ui.py",
            start_line=1,
            end_line=5,
            confidence=1.0,
        )
        facts = ExtractedFileFacts(
            file_path="src/ui.py",
            language="python",
            symbols=[sym_1],
            edges=[],
        )
        # store_file_data with embed_symbols=True (default) automatically generates embeddings
        store_file_data(self.conn, facts, embed_symbols=True)

        cur = self.conn.cursor()
        cur.execute("SELECT count(*) FROM symbol_embeddings")
        count_before = cur.fetchone()[0]
        self.assertEqual(count_before, 1)

        # Cascade delete via file record
        delete_file_record(self.conn, "src/ui.py")

        cur.execute("SELECT count(*) FROM symbol_embeddings")
        count_after = cur.fetchone()[0]
        self.assertEqual(count_after, 0)

    def test_backfill_symbol_embeddings(self):
        """Backfill generates embeddings for symbols currently lacking them."""
        sym_1 = SymbolRecord(
            name="query_database",
            kind="function",
            file="src/db.py",
            start_line=1,
            end_line=5,
            confidence=1.0,
        )
        store_file_data(
            self.conn,
            ExtractedFileFacts(
                file_path="src/db.py",
                language="python",
                symbols=[sym_1],
                edges=[],
            ),
            embed_symbols=False,
        )

        cur = self.conn.cursor()
        cur.execute("SELECT count(*) FROM symbol_embeddings")
        self.assertEqual(cur.fetchone()[0], 0)

        added = backfill_symbol_embeddings(self.conn)
        self.assertEqual(added, 1)

        cur.execute("SELECT count(*) FROM symbol_embeddings")
        self.assertEqual(cur.fetchone()[0], 1)


class TestSemanticRetrievalAndRanking(unittest.TestCase):
    """Test conceptual semantic query, hybrid ranking fusion, and fallback."""

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

        security_py = self.src_dir / "security.py"
        security_py.write_text(
            'def verify_login_credentials(session_token: str) -> bool:\n'
            '    """Validates user authentication token against active session principal."""\n'
            '    return True\n'
        )

        billing_py = self.src_dir / "billing.py"
        billing_py.write_text(
            'def calculate_vat_duty(amount: float) -> float:\n'
            '    """Computes fiscal tax levies for invoice payment."""\n'
            '    return amount * 0.15\n'
        )

        sym_sec = SymbolRecord(
            name="verify_login_credentials",
            kind="function",
            file="src/security.py",
            start_line=1,
            end_line=3,
            confidence=1.0,
            signature="def verify_login_credentials(session_token: str) -> bool:",
            docstring="Validates user authentication token against active session principal.",
        )
        store_file_data(
            self.conn,
            ExtractedFileFacts(
                file_path="src/security.py",
                language="python",
                total_lines=3,
                symbols=[sym_sec],
                edges=[],
            ),
            embed_symbols=True,
        )

        sym_bill = SymbolRecord(
            name="calculate_vat_duty",
            kind="function",
            file="src/billing.py",
            start_line=1,
            end_line=3,
            confidence=1.0,
            signature="def calculate_vat_duty(amount: float) -> float:",
            docstring="Computes fiscal tax levies for invoice payment.",
        )
        store_file_data(
            self.conn,
            ExtractedFileFacts(
                file_path="src/billing.py",
                language="python",
                total_lines=3,
                symbols=[sym_bill],
                edges=[],
            ),
            embed_symbols=True,
        )

        self.engine = RetrievalEngine(self.conn, repo_root=self.repo_dir)

    def tearDown(self):
        self.conn.close()
        self.temp_dir.cleanup()

    def test_conceptual_query_weak_lexical_overlap(self):
        """A conceptual query with zero exact name match retrieves the semantic target."""
        # Query 'auth security principal' does NOT match 'verify_login_credentials' in name
        results = self.engine.search_symbols(
            "auth security principal", ranking_method="hybrid", limit=5
        )
        self.assertTrue(len(results) >= 1)
        top = results[0]
        self.assertEqual(top.name, "verify_login_credentials")
        self.assertEqual(top.file_path, "src/security.py")
        self.assertTrue(any("Semantic match" in r for r in top.reasons))

    def test_exact_name_match_outranks_pure_semantic_match(self):
        """Exact name match queries achieve top ranking."""
        results = self.engine.search_symbols(
            "verify_login_credentials", ranking_method="hybrid", limit=5
        )
        self.assertTrue(len(results) >= 1)
        top = results[0]
        self.assertEqual(top.name, "verify_login_credentials")
        self.assertGreaterEqual(top.score, 0.90)
        self.assertTrue(any("Exact name match" in r for r in top.reasons))

    def test_ranking_methods(self):
        """Verify hybrid, semantic, rrf, and heuristic ranking methods."""
        # Hybrid
        hybrid_res = self.engine.search_symbols(
            "invoice taxes", ranking_method="hybrid", limit=5
        )
        self.assertTrue(len(hybrid_res) >= 1)
        self.assertEqual(hybrid_res[0].name, "calculate_vat_duty")

        # Semantic
        semantic_res = self.engine.search_symbols(
            "invoice taxes", ranking_method="semantic", limit=5
        )
        self.assertTrue(len(semantic_res) >= 1)
        self.assertEqual(semantic_res[0].name, "calculate_vat_duty")

        # RRF
        rrf_res = self.engine.search_symbols(
            "invoice taxes", ranking_method="rrf", limit=5
        )
        self.assertTrue(len(rrf_res) >= 1)
        self.assertEqual(rrf_res[0].name, "calculate_vat_duty")
        self.assertTrue(any("RRF score" in r for r in rrf_res[0].reasons))

        # Heuristic (Phase 4 structural only, no semantic score)
        heur_res = self.engine.search_symbols(
            "calculate_vat_duty", ranking_method="heuristic", limit=5
        )
        self.assertTrue(len(heur_res) >= 1)
        self.assertEqual(heur_res[0].name, "calculate_vat_duty")
        self.assertFalse(any("Semantic match" in r for r in heur_res[0].reasons))

    def test_fallback_when_embeddings_missing(self):
        """Engine gracefully falls back when symbol_embeddings table is dropped."""
        self.conn.execute("DROP TABLE IF EXISTS symbol_embeddings;")
        results = self.engine.search_symbols(
            "verify_login_credentials", ranking_method="hybrid"
        )
        self.assertTrue(len(results) >= 1)
        self.assertEqual(results[0].name, "verify_login_credentials")

    def test_cli_query_with_semantic_ranking(self):
        """CLI fastast query with --ranking semantic and --json output."""
        stdout_buf = io.StringIO()
        with redirect_stdout(stdout_buf):
            ret = run_query(
                query="authentication token principal",
                dir_path=str(self.repo_dir),
                ranking_method="semantic",
                json_output=True,
            )
        self.assertEqual(ret, 0)
        data = json.loads(stdout_buf.getvalue())
        self.assertIn("candidates", data)
        self.assertTrue(len(data["candidates"]) >= 1)
        self.assertEqual(data["candidates"][0]["name"], "verify_login_credentials")
        self.assertTrue(
            any("Semantic match" in r for r in data["candidates"][0]["reasons"])
        )


if __name__ == "__main__":
    unittest.main()

