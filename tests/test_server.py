"""Tests for FastMCP server, Phase 10 agent interface standardization, and all MCP tools."""

import json
from pathlib import Path
import tempfile

from fastast.db import get_connection, init_db
from fastast.server import (
    build_evidence_bundle,
    get_call_graph,
    get_community,
    get_file_outline,
    get_graph_neighborhood,
    get_similar_symbols,
    get_snippet,
    get_symbol_evidence,
    index_repository,
    list_communities,
    query,
    query_symbols,
    retrieve_evidence,
)


def test_index_repository_not_found():
    raw = index_repository("/nonexistent/directory/path/here")
    data = json.loads(raw)

    assert "error" in data
    assert "Directory not found" in data["error"]
    assert "meta" in data


def test_query_symbols_empty():
    raw = query_symbols("")
    data = json.loads(raw)

    assert "error" in data
    assert "Query cannot be empty" in data["error"]
    assert data["count"] == 0
    assert "results" in data
    assert "meta" in data


def test_get_call_graph_empty():
    raw = get_call_graph("")
    data = json.loads(raw)

    assert "error" in data
    assert "Symbol name cannot be empty" in data["error"]
    assert data["caller_count"] == 0
    assert "results" in data
    assert "relationships" in data


def test_query_symbols_tool(tmp_path: Path):
    db_path = tmp_path / ".fastast.db"
    conn = get_connection(db_path)
    init_db(conn)
    with conn:
        conn.execute(
            "INSERT INTO files (path, language, hash, mtime, total_lines, total_tokens) VALUES (?, ?, ?, ?, ?, ?)",
            ("service.py", "python", "hash1", 100.0, 5, 10),
        )
        fid = conn.execute("SELECT id FROM files WHERE path = 'service.py'").fetchone()[0]
        conn.execute(
            "INSERT INTO symbols (file_id, name, kind, signature, start_line, end_line) VALUES (?, ?, ?, ?, ?, ?)",
            (fid, "DatabaseEngine", "class", "class DatabaseEngine:", 1, 4),
        )
    conn.close()

    res_raw = query_symbols("DatabaseEngine", directory_path=str(tmp_path))
    data = json.loads(res_raw)

    assert data["count"] == 1
    assert data["symbols"][0]["name"] == "DatabaseEngine"
    assert data["symbols"][0]["kind"] == "class"
    assert data["results"][0]["name"] == "DatabaseEngine"
    assert data["error"] is None
    assert "meta" in data


def test_get_call_graph_tool(tmp_path: Path):
    db_path = tmp_path / ".fastast.db"
    conn = get_connection(db_path)
    init_db(conn)
    with conn:
        conn.execute(
            "INSERT INTO files (path, language, hash, mtime, total_lines, total_tokens) VALUES (?, ?, ?, ?, ?, ?)",
            ("pipeline.py", "python", "hash2", 100.0, 6, 12),
        )
        fid = conn.execute("SELECT id FROM files WHERE path = 'pipeline.py'").fetchone()[0]
        conn.execute(
            "INSERT INTO symbols (file_id, name, kind, signature, start_line, end_line) VALUES (?, ?, ?, ?, ?, ?)",
            (fid, "step_b", "function", "def step_b():", 4, 6),
        )
        sym_id = conn.execute("SELECT id FROM symbols WHERE name = 'step_b'").fetchone()[0]
        conn.execute(
            "INSERT INTO calls (file_id, caller_symbol_id, callee_name, line_number) VALUES (?, ?, ?, ?)",
            (fid, sym_id, "step_a", 5),
        )
    conn.close()

    res_raw = get_call_graph("step_a", directory_path=str(tmp_path))
    data = json.loads(res_raw)

    assert data["symbol"] == "step_a"
    assert data["caller_count"] == 1
    assert data["callers"][0]["caller"] == "step_b"
    assert "relationships" in data
    assert len(data["relationships"]) == 1
    assert data["relationships"][0]["src"] == "step_b"
    assert data["relationships"][0]["dst"] == "step_a"
    assert data["error"] is None


def test_evidence_materializer_mcp_tools(tmp_path: Path):
    """Test MCP Phase 6 & Phase 10 evidence tools with standardized outputs."""
    (tmp_path / "app.py").write_text(
        "class OrderService:\n"
        "    def create_order(self, item_id: str) -> bool:\n"
        "        return len(item_id) > 0\n"
    )
    # Run index tool
    index_res = json.loads(index_repository(str(tmp_path)))
    assert index_res["error"] is None
    assert index_res["total_symbols"] >= 2
    assert "meta" in index_res

    # 1. get_symbol_evidence tool
    res_ev = get_symbol_evidence("create_order", directory_path=str(tmp_path))
    ev_data = json.loads(res_ev)
    assert "symbol" in ev_data
    assert ev_data["symbol"]["name"] == "create_order"
    assert "snippet" in ev_data
    assert "evidence" in ev_data
    assert "def create_order" in ev_data["snippet"]["code"]
    assert ev_data["error"] is None
    assert "meta" in ev_data

    # 2. get_file_outline tool
    res_out = get_file_outline("app.py", directory_path=str(tmp_path))
    out_data = json.loads(res_out)
    assert out_data["file_path"] == "app.py"
    assert len(out_data["classes"]) == 1
    assert out_data["classes"][0]["name"] == "OrderService"
    assert len(out_data["classes"][0]["methods"]) == 1
    assert "results" in out_data
    assert out_data["error"] is None
    assert "meta" in out_data

    # 3. get_snippet tool
    res_snip = get_snippet(symbol_name_or_id="create_order", directory_path=str(tmp_path))
    snip_data = json.loads(res_snip)
    assert "snippet" in snip_data
    assert "evidence" in snip_data
    assert "create_order" in snip_data["snippet"]
    assert snip_data["error"] is None
    assert "meta" in snip_data

    # 4. build_evidence_bundle & retrieve_evidence tools
    res_bundle = build_evidence_bundle("OrderService", directory_path=str(tmp_path))
    bundle_data = json.loads(res_bundle)
    assert "candidates" in bundle_data
    assert "results" in bundle_data
    assert len(bundle_data["candidates"]) > 0
    assert "snippets" in bundle_data
    assert "evidence" in bundle_data
    assert bundle_data["error"] is None

    # Test query alias tool
    res_query = query("OrderService", directory_path=str(tmp_path))
    query_data = json.loads(res_query)
    assert query_data["candidates"][0]["name"] == "OrderService"
    assert query_data["error"] is None


def test_graph_neighborhood_and_parameter_aliases(tmp_path: Path):
    """Test get_graph_neighborhood tool and parameter alias consistency."""
    (tmp_path / "models.py").write_text(
        "class BaseModel:\n    pass\n\n"
        "class UserModel(BaseModel):\n    def get_id(self): return 1\n"
    )
    index_repository(str(tmp_path))

    # Test get_graph_neighborhood
    res_graph = get_graph_neighborhood("UserModel", directory_path=str(tmp_path), max_depth=2)
    graph_data = json.loads(res_graph)
    assert graph_data["symbol"] == "UserModel"
    assert "nodes" in graph_data
    assert "results" in graph_data
    assert "relationships" in graph_data
    assert graph_data["error"] is None
    assert "meta" in graph_data

    # Test parameter aliases for get_call_graph (symbol=...)
    cg_res = json.loads(get_call_graph(symbol="get_id", directory_path=str(tmp_path)))
    assert cg_res["symbol"] == "get_id"
    assert cg_res["error"] is None

    # Test parameter aliases for get_snippet (symbol=...)
    snip_res = json.loads(get_snippet(symbol="get_id", directory_path=str(tmp_path)))
    assert "get_id" in snip_res["snippet"]
    assert snip_res["error"] is None


def test_similarity_and_community_mcp_tools(tmp_path: Path):
    """Test get_similar_symbols, get_community, and list_communities MCP tools."""
    (tmp_path / "clones.py").write_text(
        "def calculate_area(width: float, height: float) -> float:\n"
        "    '''Compute rectangle area.'''\n"
        "    return width * height\n\n"
        "def calculate_box_area(width: float, height: float) -> float:\n"
        "    '''Compute box rectangle area.'''\n"
        "    return width * height\n"
    )
    index_repository(str(tmp_path))

    # 1. get_similar_symbols
    sim_res = json.loads(get_similar_symbols("calculate_area", directory_path=str(tmp_path), min_similarity=0.4))
    assert sim_res["symbol"] == "calculate_area"
    assert "similar_symbols" in sim_res
    assert "results" in sim_res
    assert len(sim_res["results"]) >= 1
    assert sim_res["results"][0]["name"] == "calculate_box_area"
    assert sim_res["error"] is None
    assert "meta" in sim_res

    # 2. get_community
    comm_res = json.loads(get_community("calculate_area", directory_path=str(tmp_path)))
    assert comm_res["symbol_name"] == "calculate_area"
    assert "community_id" in comm_res
    assert "results" in comm_res
    assert comm_res["error"] is None
    assert "meta" in comm_res

    # 3. list_communities
    comms_res = json.loads(list_communities(directory_path=str(tmp_path)))
    assert "communities" in comms_res
    assert "results" in comms_res
    assert comms_res["total_communities"] >= 1
    assert comms_res["error"] is None
    assert "meta" in comms_res


if __name__ == "__main__":
    test_index_repository_not_found()
    test_query_symbols_empty()
    test_get_call_graph_empty()

    with tempfile.TemporaryDirectory() as td:
        test_query_symbols_tool(Path(td))

    with tempfile.TemporaryDirectory() as td:
        test_get_call_graph_tool(Path(td))

    with tempfile.TemporaryDirectory() as td:
        test_evidence_materializer_mcp_tools(Path(td))

    with tempfile.TemporaryDirectory() as td:
        test_graph_neighborhood_and_parameter_aliases(Path(td))

    with tempfile.TemporaryDirectory() as td:
        test_similarity_and_community_mcp_tools(Path(td))

    print("All Phase 10 server and MCP standardization tests passed successfully!")
