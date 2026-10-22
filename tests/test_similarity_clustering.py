"""Tests for Phase 9: MinHash/LSH Similarity and Louvain Community Detection."""

import json
import sqlite3
import tempfile
from pathlib import Path

from fastast.community import (
    LouvainDetector,
    derive_community_name,
    detect_and_store_communities,
)
from fastast.db import (
    delete_file_record,
    get_connection,
    get_similar_symbols,
    get_symbol_community,
    init_db,
    list_communities,
)
from fastast.indexer import RepositoryIndexer
from fastast.similarity import (
    LSHIndex,
    MinHash,
    compute_jaccard_similarity,
    compute_similarity_pairs,
    extract_symbol_shingles,
    index_similarity,
)


def test_shingle_extraction_and_jaccard():
    """Verify shingle extraction splits tokens, signatures, and n-grams."""
    shingles1 = extract_symbol_shingles(
        name="getUserById",
        kind="function",
        signature="def getUserById(user_id: int) -> User:",
        docstring="Fetch a user by their unique primary key id.",
    )
    assert "user" in shingles1
    assert "get" in shingles1
    assert "kind:function" in shingles1
    assert "use" in shingles1  # 3-gram

    shingles2 = extract_symbol_shingles(
        name="get_user_by_id",
        kind="function",
        signature="def get_user_by_id(user_id: int) -> User:",
        docstring="Fetch user record by primary id.",
    )
    # High overlap between camelCase and snake_case equivalents
    jaccard = compute_jaccard_similarity(shingles1, shingles2)
    assert jaccard > 0.60

    # Completely unrelated symbol
    shingles_unrelated = extract_symbol_shingles(
        name="calculate_tax_rate",
        kind="function",
        signature="def calculate_tax_rate(amount: float) -> float:",
        docstring="Compute VAT and sales taxes.",
    )
    jaccard_unrelated = compute_jaccard_similarity(shingles1, shingles_unrelated)
    assert jaccard_unrelated < 0.20

    # Edge cases
    assert compute_jaccard_similarity(set(), set()) == 1.0
    assert compute_jaccard_similarity(shingles1, set()) == 0.0


def test_minhash_signature_and_lsh():
    """Verify MinHash produces deterministic signatures and LSH finds candidate pairs."""
    minhasher = MinHash(num_hashes=64)

    shingles_a = {"user", "fetch", "query", "database", "id", "record"}
    shingles_b = {"user", "fetch", "query", "database", "id", "record", "cache"}
    shingles_c = {"matrix", "multiply", "tensor", "dot", "eigenvalue", "vector"}

    sig_a1 = minhasher.compute_signature(shingles_a)
    sig_a2 = minhasher.compute_signature(shingles_a)
    assert sig_a1 == sig_a2, "MinHash must be strictly deterministic"

    sig_b = minhasher.compute_signature(shingles_b)
    sig_c = minhasher.compute_signature(shingles_c)

    # Estimate Jaccard between A and B should be very high
    est_ab = MinHash.estimate_jaccard(sig_a1, sig_b)
    assert est_ab >= 0.70

    # Estimate Jaccard between A and C should be very low
    est_ac = MinHash.estimate_jaccard(sig_a1, sig_c)
    assert est_ac <= 0.15

    # Test LSH Indexing
    lsh = LSHIndex(num_hashes=64, num_bands=16)
    lsh.add(1, sig_a1)
    lsh.add(2, sig_b)
    lsh.add(3, sig_c)

    pairs = lsh.find_candidate_pairs()
    # (1, 2) should collide in at least one band
    assert (1, 2) in pairs or (2, 1) in pairs
    # (1, 3) should not collide
    assert (1, 3) not in pairs and (3, 1) not in pairs


def test_compute_similarity_pairs():
    """Verify end-to-end similar symbol detection and threshold filtering."""
    symbols = [
        {
            "id": 101,
            "name": "parse_json_payload",
            "kind": "function",
            "signature": "def parse_json_payload(raw_data: str) -> dict:",
            "docstring": "Parse incoming JSON string safely into a dict.",
        },
        {
            "id": 102,
            "name": "parseJsonPayload",
            "kind": "function",
            "signature": "def parseJsonPayload(raw_str: str) -> dict:",
            "docstring": "Parse incoming JSON string into dictionary.",
        },
        {
            "id": 103,
            "name": "render_html_template",
            "kind": "function",
            "signature": "def render_html_template(template_name: str, context: dict) -> str:",
            "docstring": "Render Jinja template with context dictionary.",
        },
    ]

    pairs = compute_similarity_pairs(symbols, min_similarity=0.5)
    assert len(pairs) == 1
    u, v, sim = pairs[0]
    assert {u, v} == {101, 102}
    assert sim >= 0.5


def test_louvain_community_detector():
    """Verify Louvain partitions a modular graph into distinct cohesive communities."""
    # Graph with 2 distinct clusters (triangles) connected by a single weak bridge:
    # Cluster A: 1 - 2 - 3 - 1
    # Cluster B: 4 - 5 - 6 - 4
    # Bridge: 3 - 4
    nodes = [1, 2, 3, 4, 5, 6]
    edges = [
        (1, 2, 1.0),
        (2, 3, 1.0),
        (3, 1, 1.0),
        (4, 5, 1.0),
        (5, 6, 1.0),
        (6, 4, 1.0),
        (3, 4, 0.2),  # Weak bridge
    ]

    detector = LouvainDetector(resolution=1.0)
    partition, modularity = detector.fit(nodes, edges)

    assert modularity > 0.30, f"Expected strong modularity, got {modularity}"
    # Nodes in Cluster A should share the same community ID
    assert partition[1] == partition[2] == partition[3]
    # Nodes in Cluster B should share the same community ID
    assert partition[4] == partition[5] == partition[6]
    # Cluster A and Cluster B must be separate communities
    assert partition[1] != partition[4]

    # Test disconnected graph degenerate handling
    empty_det = LouvainDetector()
    p_empty, q_empty = empty_det.fit([], [])
    assert p_empty == {} and q_empty == 0.0

    p_disc, q_disc = empty_det.fit([10, 20, 30], [])
    assert len(set(p_disc.values())) == 3
    assert q_disc == 0.0


def test_derive_community_name():
    """Verify automatic community naming from dominant paths and symbols."""
    symbols = [
        {"name": "AuthTokenVerifier", "file_path": "src/auth/token.py"},
        {"name": "authenticate_user", "file_path": "src/auth/login.py"},
        {"name": "refreshToken", "file_path": "src/auth/token.py"},
    ]
    name = derive_community_name(0, symbols, hub_name="authenticate_user")
    assert "auth" in name.lower()
    assert "authenticate_user" in name


def test_db_similarity_and_community_persistence_and_cascades():
    """Verify storing similarities and communities in SQLite with foreign key cascades."""
    with tempfile.NamedTemporaryFile(suffix=".db") as tmp:
        db_path = Path(tmp.name)
        conn = get_connection(db_path)
        init_db(conn)

        with conn:
            # Insert file
            conn.execute(
                "INSERT INTO files (id, path, hash, mtime, language, category, total_lines, total_tokens) "
                "VALUES (1, 'src/api.py', 'hash1', 1000.0, 'python', 'source', 100, 200)"
            )
            # Insert symbols
            conn.execute(
                "INSERT INTO symbols (id, file_id, name, kind, signature, docstring, start_line, end_line) "
                "VALUES (10, 1, 'validate_email', 'function', 'def validate_email(email: str) -> bool:', 'Check email validity', 10, 20)"
            )
            conn.execute(
                "INSERT INTO symbols (id, file_id, name, kind, signature, docstring, start_line, end_line) "
                "VALUES (20, 1, 'validate_user_email', 'function', 'def validate_user_email(email: str) -> bool:', 'Check email validity', 30, 40)"
            )
            conn.execute(
                "INSERT INTO symbols (id, file_id, name, kind, signature, docstring, start_line, end_line) "
                "VALUES (30, 1, 'compute_stats', 'function', 'def compute_stats() -> dict:', 'Aggregate stats', 50, 60)"
            )

        # Index similarity
        added = index_similarity(conn, min_similarity=0.4)
        assert added >= 1

        # Query similar symbols
        sims = get_similar_symbols(conn, "validate_email")
        assert len(sims) >= 1
        assert sims[0]["name"] == "validate_user_email"
        assert sims[0]["similarity"] >= 0.4

        # Run community detection
        comm_res = detect_and_store_communities(conn)
        assert comm_res["total_communities"] >= 1

        # Query community for symbol
        comm = get_symbol_community(conn, "validate_email")
        assert comm is not None
        assert comm["symbol_name"] == "validate_email"
        assert "community_id" in comm
        assert "peers" in comm

        # List communities
        comms_list = list_communities(conn)
        assert len(comms_list) >= 1
        assert comms_list[0]["member_count"] >= 1

        # Test CASCADE DELETION when file is deleted
        delete_file_record(conn, "src/api.py")

        # Symbols, similarity, and communities must be cleanly cascaded out
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) FROM symbols")
        assert cur.fetchone()[0] == 0
        cur.execute("SELECT COUNT(*) FROM symbol_similarity")
        assert cur.fetchone()[0] == 0
        cur.execute("SELECT COUNT(*) FROM symbol_communities")
        assert cur.fetchone()[0] == 0

        conn.close()


def test_indexer_integration_and_cli():
    """Verify repository indexing automatically populates similarity & communities, plus CLI commands."""
    with tempfile.TemporaryDirectory() as tmpdir:
        root = Path(tmpdir)

        # Create two modular files with near-duplicate and calling functions
        service_py = root / "service.py"
        service_py.write_text(
            'def handle_request(req):\n    """Process incoming request."""\n    return parse_json_data(req)\n\n'
            'def handle_incoming_request(req):\n    """Process incoming request payload."""\n    return parse_json_data(req)\n'
        )

        parser_py = root / "parser.py"
        parser_py.write_text(
            'def parse_json_data(data):\n    """Parse json payload dictionary."""\n    return {}\n'
        )

        indexer = RepositoryIndexer(repo_path=root)
        result = indexer.run()
        assert result["indexed_files"] == 2
        assert result["total_symbols"] >= 3

        db_path = root / ".fastast.db"
        assert db_path.exists()

        conn = get_connection(db_path)
        try:
            # Verify similarity records created
            cur = conn.cursor()
            cur.execute("SELECT COUNT(*) FROM symbol_similarity")
            sim_count = cur.fetchone()[0]
            assert sim_count >= 2  # symmetric pairs

            # Verify community records created
            cur.execute("SELECT COUNT(*) FROM symbol_communities")
            comm_count = cur.fetchone()[0]
            assert comm_count >= 3
        finally:
            conn.close()

        # Test CLI commands
        from fastast.cli import run_communities, run_community, run_similar

        # Test run_similar CLI
        code = run_similar("handle_request", dir_path=str(root), min_sim=0.3, json_output=True)
        assert code == 0

        # Test run_communities CLI
        code = run_communities(dir_path=str(root), json_output=True)
        assert code == 0

        # Test run_community CLI
        code = run_community("handle_request", dir_path=str(root), json_output=True)
        assert code == 0


def test_mcp_server_tools():
    """Verify MCP tools for similar symbols and communities return valid JSON responses."""
    with tempfile.TemporaryDirectory() as tmpdir:
        root = Path(tmpdir)
        (root / "math_ops.py").write_text(
            "def calculate_area(width: float, height: float) -> float:\n"
            "    '''Compute rectangle area.'''\n"
            "    return width * height\n\n"
            "def calculate_box_area(width: float, height: float) -> float:\n"
            "    '''Compute box rectangle area.'''\n"
            "    return width * height\n"
        )

        # Index repo first
        indexer = RepositoryIndexer(repo_path=root)
        indexer.run()

        from fastast.server import get_community, get_similar_symbols, list_communities as mcp_list_comms

        # Test get_similar_symbols
        sim_json = get_similar_symbols("calculate_area", directory_path=str(root), min_similarity=0.3)
        sim_data = json.loads(sim_json)
        assert "similar_symbols" in sim_data
        assert len(sim_data["similar_symbols"]) >= 1
        assert sim_data["similar_symbols"][0]["name"] == "calculate_box_area"

        # Test get_community
        comm_json = get_community("calculate_area", directory_path=str(root))
        comm_data = json.loads(comm_json)
        assert "community_id" in comm_data
        assert "symbol_name" in comm_data

        # Test list_communities
        comms_json = mcp_list_comms(directory_path=str(root))
        comms_data = json.loads(comms_json)
        assert "communities" in comms_data
        assert comms_data["total_communities"] >= 1


if __name__ == "__main__":
    test_shingle_extraction_and_jaccard()
    test_minhash_signature_and_lsh()
    test_compute_similarity_pairs()
    test_louvain_community_detector()
    test_derive_community_name()
    test_db_similarity_and_community_persistence_and_cascades()
    test_indexer_integration_and_cli()
    test_mcp_server_tools()
    print("All Phase 9 similarity and clustering tests passed successfully!")
