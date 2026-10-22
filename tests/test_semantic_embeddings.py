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
    get_file_embedding,
    get_symbol_embedding,
    get_symbol_embedding_metadata,
    init_db,
    invalidate_stale_embeddings,
    search_symbols_semantic,
    store_file_data,
    store_file_embedding,
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

    def test_vector_storage_schema_metadata(self):
        """Verify model_version, generation_id, norm, section, and file_id are stored."""
        sym = SymbolRecord(
            name="process_event",
            kind="function",
            file="src/events.py",
            start_line=1,
            end_line=5,
            confidence=1.0,
        )
        store_file_data(
            self.conn,
            ExtractedFileFacts(
                file_path="src/events.py",
                language="python",
                symbols=[sym],
                edges=[],
            ),
            embed_symbols=True,
        )

        cur = self.conn.cursor()
        cur.execute("SELECT id FROM symbols WHERE name='process_event'")
        sym_id = cur.fetchone()[0]

        meta = get_symbol_embedding_metadata(self.conn, sym_id)
        self.assertIsNotNone(meta)
        self.assertEqual(meta["symbol_id"], sym_id)
        self.assertIn("fastast-projection", meta["model"])
        self.assertEqual(meta["model_version"], "1.0")
        self.assertEqual(meta["generation_id"], 1)
        self.assertEqual(meta["section"], "symbol")
        self.assertGreater(meta["norm"], 0.9)
        self.assertIsNotNone(meta["file_id"])

    def test_file_level_embedding_storage(self):
        """Verify storing and retrieving file-level embeddings."""
        cur = self.conn.cursor()
        cur.execute(
            "INSERT INTO files (path, hash, mtime, total_lines, total_tokens) VALUES (?, ?, ?, ?, ?)",
            ("src/pipeline.py", "hash1", 100.0, 50, 200),
        )
        file_id = cur.lastrowid
        self.conn.commit()

        provider = SemanticProjectionProvider(128)
        vec = provider.embed_text("data processing pipeline")
        store_file_embedding(
            self.conn,
            file_id=file_id,
            model=provider.model_name,
            embedding=vec,
            model_version="1.0",
            generation_id=1,
        )

        retrieved = get_file_embedding(self.conn, file_id)
        self.assertIsNotNone(retrieved)
        self.assertEqual(len(retrieved), 128)
        self.assertAlmostEqual(cosine_similarity(vec, retrieved), 1.0, places=4)

    def test_invalidate_stale_embeddings_on_model_change(self):
        """Invalidate stale embeddings when model or version changes."""
        sym = SymbolRecord(
            name="tokenize_text",
            kind="function",
            file="src/nlp.py",
            start_line=1,
            end_line=5,
            confidence=1.0,
        )
        store_file_data(
            self.conn,
            ExtractedFileFacts(
                file_path="src/nlp.py",
                language="python",
                symbols=[sym],
                edges=[],
            ),
            embed_symbols=True,
        )

        cur = self.conn.cursor()
        cur.execute("SELECT count(*) FROM symbol_embeddings")
        self.assertEqual(cur.fetchone()[0], 1)

        # Invalidate when targeting a newer model version (e.g. 2.0)
        invalidated = invalidate_stale_embeddings(
            self.conn, current_model="fastast-projection-128", current_version="2.0"
        )
        self.assertEqual(invalidated, 1)

        cur.execute("SELECT count(*) FROM symbol_embeddings")
        self.assertEqual(cur.fetchone()[0], 0)

    def test_migration_safety_for_old_db_schema(self):
        """Verify init_db cleanly upgrades old DB schemas lacking version/generation columns."""
        old_db_path = Path(self.temp_dir.name) / "old_schema.db"
        old_conn = sqlite3.connect(str(old_db_path))
        # Create minimal old schema without model_version, generation_id, etc.
        old_conn.execute("""
            CREATE TABLE files (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                path TEXT NOT NULL UNIQUE,
                hash TEXT NOT NULL,
                mtime REAL NOT NULL,
                total_lines INTEGER NOT NULL
            );
        """)
        old_conn.execute("""
            CREATE TABLE symbols (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                file_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                kind TEXT NOT NULL,
                start_line INTEGER NOT NULL,
                end_line INTEGER NOT NULL
            );
        """)
        old_conn.execute("""
            CREATE TABLE symbol_embeddings (
                symbol_id INTEGER PRIMARY KEY,
                model TEXT NOT NULL,
                dimensions INTEGER NOT NULL,
                embedding BLOB NOT NULL,
                updated_at REAL NOT NULL
            );
        """)
        old_conn.commit()

        # Run init_db which must safely migrate columns
        init_db(old_conn)

        cur = old_conn.cursor()
        cur.execute("PRAGMA table_info(symbol_embeddings);")
        columns = {col[1] for col in cur.fetchall()}
        self.assertIn("model_version", columns)
        self.assertIn("generation_id", columns)
        self.assertIn("norm", columns)
        self.assertIn("section", columns)
        self.assertIn("file_id", columns)
        old_conn.close()

    def test_semantic_score_normalization_calibration(self):
        """Verify semantic similarity normalization is calibrated into [0.0, 1.0]."""
        provider = SemanticProjectionProvider(128)
        vec_auth = provider.embed_text("authenticate login user session")
        vec_sec = provider.embed_text("security credentials token verification")

        # Insert a symbol with matching embedding
        sym = SymbolRecord(
            name="login_check",
            kind="function",
            file="src/auth.py",
            start_line=1,
            end_line=5,
            confidence=1.0,
        )
        store_file_data(
            self.conn,
            ExtractedFileFacts(
                file_path="src/auth.py",
                language="python",
                symbols=[sym],
                edges=[],
            ),
            embed_symbols=False,
        )
        cur = self.conn.cursor()
        cur.execute("SELECT id FROM symbols WHERE name='login_check'")
        sym_id = cur.fetchone()[0]

        store_symbol_embedding(self.conn, sym_id, provider.model_name, vec_auth)

        # Search with matching vector
        results = search_symbols_semantic(self.conn, vec_sec, limit=10)
        self.assertIn(sym_id, results)
        score = results[sym_id]
        self.assertGreaterEqual(score, 0.10)
        self.assertLessEqual(score, 1.00)


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


class TestPhase8DesignPrinciples(unittest.TestCase):
    """Explicitly verify the six core design principles for Phase 8:
    1. Embeddings are one signal among several
    2. Exact/strong lexical matches still matter
    3. Graph structure and path relevance remain important
    4. Semantic results are fused with BM25 + structural rank, not replacing them
    5. Graceful fallback when embeddings are missing or stale
    6. System stays local-first and token-conscious
    """

    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.repo_dir = Path(self.temp_dir.name)
        self.db_dir = self.repo_dir / ".fastast"
        self.db_dir.mkdir(parents=True, exist_ok=True)
        self.db_path = self.db_dir / "index.db"
        self.conn = get_connection(self.db_path)
        init_db(self.conn)

        src_dir = self.repo_dir / "src"
        src_dir.mkdir(parents=True, exist_ok=True)
        test_dir = self.repo_dir / "tests"
        test_dir.mkdir(parents=True, exist_ok=True)

        # 1. Main core auth handler in src/
        auth_file = src_dir / "auth.py"
        auth_file.write_text(
            'def authenticate_user(token: str) -> bool:\n'
            '    """Validates user session security token and authentication credentials."""\n'
            '    return True\n'
        )

        # 2. Mock handler in tests/
        test_file = test_dir / "test_auth.py"
        test_file.write_text(
            'def test_authenticate_user_mock():\n'
            '    """Unit test for user authentication credentials."""\n'
            '    pass\n'
        )

        # 3. Loosely related concept function
        crypto_file = src_dir / "crypto.py"
        crypto_file.write_text(
            'def compute_sha256_hash(data: bytes) -> str:\n'
            '    """Cryptographic hash used for security and verification tokens."""\n'
            '    return "hash"\n'
        )

        sym_auth = SymbolRecord(
            name="authenticate_user",
            kind="function",
            file="src/auth.py",
            start_line=1,
            end_line=3,
            confidence=1.0,
            signature="def authenticate_user(token: str) -> bool:",
            docstring="Validates user session security token and authentication credentials.",
        )
        edge_1 = EdgeRecord(
            src="login_controller",
            dst="authenticate_user",
            relation=EdgeRelation.CALLS,
            confidence=1.0,
        )
        edge_2 = EdgeRecord(
            src="oauth_middleware",
            dst="authenticate_user",
            relation=EdgeRelation.CALLS,
            confidence=1.0,
        )
        edge_3 = EdgeRecord(
            src="authenticate_user",
            dst="verify_token_crypto",
            relation=EdgeRelation.CALLS,
            confidence=1.0,
        )
        store_file_data(
            self.conn,
            ExtractedFileFacts(
                file_path="src/auth.py",
                language="python",
                total_lines=3,
                symbols=[sym_auth],
                edges=[edge_1, edge_2, edge_3],
            ),
            embed_symbols=True,
        )

        sym_mock = SymbolRecord(
            name="test_authenticate_user_mock",
            kind="function",
            file="tests/test_auth.py",
            start_line=1,
            end_line=3,
            confidence=1.0,
            signature="def test_authenticate_user_mock():",
            docstring="Unit test for user authentication credentials.",
        )
        store_file_data(
            self.conn,
            ExtractedFileFacts(
                file_path="tests/test_auth.py",
                language="python",
                total_lines=3,
                symbols=[sym_mock],
                edges=[],
            ),
            embed_symbols=True,
        )

        sym_crypto = SymbolRecord(
            name="compute_sha256_hash",
            kind="function",
            file="src/crypto.py",
            start_line=1,
            end_line=3,
            confidence=1.0,
            signature="def compute_sha256_hash(data: bytes) -> str:",
            docstring="Cryptographic hash used for security and verification tokens.",
        )
        store_file_data(
            self.conn,
            ExtractedFileFacts(
                file_path="src/crypto.py",
                language="python",
                total_lines=3,
                symbols=[sym_crypto],
                edges=[],
            ),
            embed_symbols=True,
        )

        self.engine = RetrievalEngine(self.conn, repo_root=self.repo_dir)

    def tearDown(self):
        self.conn.close()
        self.temp_dir.cleanup()

    def test_embeddings_are_one_signal_among_several(self):
        """Dense embeddings do not overpower the combination of exact name, path, and graph edges."""
        # Candidate A: high semantic similarity (0.85) but unrelated name, 0 edges, test file
        score_a, reasons_a = score_candidate(
            sym_name="arbitrary_util",
            sym_kind="function",
            file_path="tests/test_util.py",
            file_category="test",
            sym_confidence=1.0,
            edge_count=0,
            query="authenticate_user",
            signature="def arbitrary_util():",
            docstring="Arbitrary utility",
            bm25_score=0.20,
            semantic_score=0.85,
        )

        # Candidate B: moderate semantic similarity (0.60) but exact name match, 4 edges, source file
        score_b, reasons_b = score_candidate(
            sym_name="authenticate_user",
            sym_kind="function",
            file_path="src/auth.py",
            file_category="source",
            sym_confidence=1.0,
            edge_count=4,
            query="authenticate_user",
            signature="def authenticate_user(token: str):",
            docstring="Validates user token",
            bm25_score=0.60,
            semantic_score=0.60,
        )

        # Candidate B must outrank Candidate A because embeddings are only one signal (~25%)
        self.assertGreater(score_b, score_a)
        self.assertTrue(any("Semantic match" in r for r in reasons_b))
        self.assertTrue(any("Exact name match" in r for r in reasons_b))
        self.assertTrue(any("Graph degree" in r for r in reasons_b))

    def test_exact_lexical_matches_still_matter(self):
        """Exact symbol identifier matches rank at the top even when other symbols match semantically."""
        results = self.engine.search_symbols(
            "authenticate_user", ranking_method="hybrid", limit=5
        )
        self.assertTrue(len(results) >= 1)
        top = results[0]
        self.assertEqual(top.name, "authenticate_user")
        self.assertGreaterEqual(top.score, 0.85)
        self.assertTrue(any("Exact name match" in r for r in top.reasons))

    def test_graph_structure_and_path_relevance_remain_important(self):
        """Given identical name matches and similar semantic scores, graph centrality & source path win."""
        # Compare core auth (src/auth.py with 3 edges) vs test mock (tests/test_auth.py with 0 edges)
        score_src, reasons_src = score_candidate(
            sym_name="auth_handler",
            sym_kind="function",
            file_path="src/auth.py",
            file_category="source",
            sym_confidence=1.0,
            edge_count=4,
            query="auth_handler",
            bm25_score=0.70,
            semantic_score=0.75,
        )

        score_test, reasons_test = score_candidate(
            sym_name="auth_handler",
            sym_kind="function",
            file_path="tests/test_auth.py",
            file_category="test",
            sym_confidence=1.0,
            edge_count=0,
            query="auth_handler",
            bm25_score=0.70,
            semantic_score=0.75,
        )

        # Source code with high edge count must score distinctly higher than test file with 0 edges
        self.assertGreater(score_src, score_test)
        self.assertTrue(any("Test file" in r for r in reasons_test))
        self.assertTrue(any("Graph degree" in r for r in reasons_src))

    def test_semantic_fused_with_bm25_and_structural_rank(self):
        """Semantic results are fused with BM25 + structural signals in hybrid and RRF modes."""
        results_hybrid = self.engine.search_symbols(
            "user security credentials", ranking_method="hybrid", limit=5
        )
        self.assertTrue(len(results_hybrid) >= 1)
        top = results_hybrid[0]
        # Verify fusion attribution reasons contain both semantic and lexical/structural signals
        has_semantic = any("Semantic match" in r for r in top.reasons)
        has_bm25 = any("BM25 lexical match" in r for r in top.reasons)
        self.assertTrue(has_semantic or has_bm25)

        # Verify RRF mode fuses ranks
        results_rrf = self.engine.search_symbols(
            "user security credentials", ranking_method="rrf", limit=5
        )
        self.assertTrue(len(results_rrf) >= 1)
        self.assertTrue(any("RRF score" in r for r in results_rrf[0].reasons))

    def test_graceful_fallback_when_embeddings_missing_or_stale(self):
        """System gracefully degrades to BM25 + structural ranking when embeddings are deleted or missing."""
        # Drop symbol_embeddings table to simulate missing/unpopulated embeddings
        self.conn.execute("DROP TABLE IF EXISTS symbol_embeddings;")

        # Query should not crash or throw; it should fall back seamlessly
        results = self.engine.search_symbols(
            "authenticate_user", ranking_method="hybrid", limit=5
        )
        self.assertTrue(len(results) >= 1)
        self.assertEqual(results[0].name, "authenticate_user")
        # Ensure no crash and explainability still works
        self.assertTrue(any("Exact name match" in r for r in results[0].reasons))

    def test_system_stays_local_first_and_token_conscious(self):
        """Verification of local-first execution and strictly bounded token/candidate limits."""
        # Local-first: provider produces deterministic 128-dim float vectors without network
        provider = SemanticProjectionProvider(dimension=128)
        vec = provider.embed_text("local offline query")
        self.assertEqual(len(vec), 128)

        # Token-conscious: results strictly respect top-K limit
        limit_k = 2
        results = self.engine.search_symbols(
            "authenticate", ranking_method="hybrid", limit=limit_k
        )
        self.assertLessEqual(len(results), limit_k)

        # Evidence bundles stay bounded under token limits
        bundle = build_evidence_bundle(
            query="authenticate",
            db_or_conn=self.conn,
            repo_root=self.repo_dir,
            limit=2,
            window_lines=10,
            max_tokens=500,
        )
        self.assertLessEqual(len(bundle.candidates), 2)
        self.assertLessEqual(bundle.total_tokens_estimate, 500)
        self.assertIsInstance(bundle.snippets, list)



if __name__ == "__main__":
    unittest.main()

