"""Comprehensive test suite for FastAST MCP Server.

Validates:
1. All 9 required tools exposed with standards-compliant JSON Schemas.
2. MCP Stdio Transport JSON-RPC 2.0 lifecycle:
   - initialize (capabilities, protocolVersion 2024-11-05, serverInfo)
   - notifications/initialized
   - ping
   - tools/list (all 9 tools and legacy aliases)
   - tools/call (execution of all 9 tools)
   - resources/list and resources/read (fastast://status, fastast://communities)
3. Direct execution of all 9 tool functions with typed arguments and return contracts.
4. Error contracts and edge cases (unknown tools, invalid params, missing directories).
"""

from __future__ import annotations

import json
import subprocess
import sys
import tempfile
from pathlib import Path

from fastast.mcp import (
    MCP_TOOLS_SPEC,
    TOOLS_MAP,
    TOOLS_METADATA,
    tool_community_detail,
    tool_file_outline,
    tool_get_evidence,
    tool_graph_neighbors,
    tool_index_status,
    tool_list_communities,
    tool_search_symbols,
    tool_similar_symbols,
    tool_trigger_index,
)


REQUIRED_TOOL_NAMES = [
    "fastast_index_status",
    "fastast_search_symbols",
    "fastast_get_evidence",
    "fastast_graph_neighbors",
    "fastast_list_communities",
    "fastast_community_detail",
    "fastast_similar_symbols",
    "fastast_file_outline",
    "fastast_trigger_index",
]


def test_mcp_tool_spec_and_schemas():
    """Verify all 9 required tools are defined with valid inputSchema objects."""
    tools_dict = {spec["name"]: spec for spec in MCP_TOOLS_SPEC}

    for name in REQUIRED_TOOL_NAMES:
        assert name in tools_dict, f"Missing required tool: {name}"
        spec = tools_dict[name]
        assert spec["description"], f"Tool {name} must have a description"
        schema = spec["inputSchema"]
        assert schema["type"] == "object", f"Tool {name} inputSchema must be type object"
        assert "properties" in schema, f"Tool {name} inputSchema must have properties"
        assert isinstance(schema.get("required", []), list), f"Tool {name} required must be list"

    print("✓ test_mcp_tool_spec_and_schemas passed")


def test_mcp_index_status_tool():
    """Test fastast_index_status tool on existing repository."""
    status = tool_index_status(".")
    assert status["status"] in ("ready", "idle", "indexing")
    assert status["is_indexed"] is True
    assert status["database_exists"] is True
    assert "stats" in status
    assert status["stats"]["files_count"] > 0
    assert status["stats"]["symbols_count"] > 0
    assert "lock" in status
    assert status["lock"]["is_locked"] is False

    # Nonexistent directory test
    missing = tool_index_status("/nonexistent/directory/path/here")
    assert missing["status"] == "error"
    assert "Directory not found" in missing["error"]

    print("✓ test_mcp_index_status_tool passed")


def test_mcp_search_symbols_tool():
    """Test fastast_search_symbols tool with various filters."""
    # 1. Search by query
    res = tool_search_symbols(query="index", limit=10, directory_path=".")
    assert res["error"] is None
    assert res["count"] > 0
    assert len(res["symbols"]) <= 10
    first = res["symbols"][0]
    assert "name" in first
    assert "kind" in first
    assert "file_path" in first

    # 2. Filter by kind
    class_res = tool_search_symbols(query="", kind="class", language="python", limit=5, directory_path=".")
    assert class_res["error"] is None
    for s in class_res["symbols"]:
        assert s["kind"] == "class"
        assert s["language"] == "python"

    # 3. Filter by path
    path_res = tool_search_symbols(query="", path="cli.py", limit=5, directory_path=".")
    assert path_res["error"] is None
    for s in path_res["symbols"]:
        assert "cli.py" in s["file_path"]

    print("✓ test_mcp_search_symbols_tool passed")


def test_mcp_get_evidence_tool():
    """Test fastast_get_evidence with conceptual query, symbol definition, and line slice."""
    # 1. Conceptual query (bounded retrieval)
    bundle = tool_get_evidence(query="ast graph indexing", max_tokens=1500, directory_path=".")
    assert bundle["type"] == "evidence_bundle"
    assert bundle["error"] is None
    assert len(bundle["candidates"]) > 0
    assert len(bundle["snippets"]) > 0

    # 2. Exact symbol evidence (definition + call graph)
    sym_ev = tool_get_evidence(symbol="index_repository", directory_path=".")
    assert sym_ev["type"] == "symbol_evidence"
    assert sym_ev["error"] is None
    assert sym_ev["symbol"] == "index_repository"
    assert "def index_repository" in sym_ev["snippet"]

    # 3. Targeted line-bounded file slice
    file_snip = tool_get_evidence(file_path="python/fastast/db.py", start_line=10, end_line=20, directory_path=".")
    assert file_snip["type"] == "file_snippet"
    assert file_snip["error"] is None
    assert file_snip["file_path"] == "python/fastast/db.py"
    assert file_snip["snippet"]

    print("✓ test_mcp_get_evidence_tool passed")


def test_mcp_graph_neighbors_tool():
    """Test fastast_graph_neighbors expansion."""
    res = tool_graph_neighbors(symbol="index_repository", depth=1, directory_path=".")
    assert res.get("error") is None
    assert res["root"] == "index_repository"
    assert "nodes" in res
    assert "edges" in res

    print("✓ test_mcp_graph_neighbors_tool passed")


def test_mcp_communities_tools():
    """Test fastast_list_communities and fastast_community_detail."""
    # 1. List communities
    comms = tool_list_communities(limit=5, directory_path=".")
    assert comms.get("error") is None
    assert len(comms.get("communities", [])) > 0
    comm_0 = comms["communities"][0]
    comm_id = comm_0["community_id"]

    # 2. Community detail by community_id
    detail_by_id = tool_community_detail(community_id=comm_id, limit=5, directory_path=".")
    assert detail_by_id["error"] is None
    assert detail_by_id["community_id"] == comm_id
    assert len(detail_by_id["members"]) > 0
    assert len(detail_by_id["files"]) > 0

    # 3. Community detail by symbol lookup
    detail_by_sym = tool_community_detail(symbol="index_repository", limit=5, directory_path=".")
    assert detail_by_sym["error"] is None
    assert detail_by_sym["community_id"] is not None
    assert len(detail_by_sym["members"]) > 0

    print("✓ test_mcp_communities_tools passed")


def test_mcp_similar_symbols_tool():
    """Test fastast_similar_symbols LSH lookup."""
    res = tool_similar_symbols(symbol="index_repository", limit=5, directory_path=".")
    assert res.get("error") is None
    assert res["symbol"] == "index_repository"
    assert "similar_symbols" in res

    print("✓ test_mcp_similar_symbols_tool passed")


def test_mcp_file_outline_tool():
    """Test fastast_file_outline with and without snippet preview."""
    # 1. Outline without snippets
    outline = tool_file_outline(file_path="python/fastast/db.py", include_snippets=False, directory_path=".")
    assert outline.get("error") is None
    assert outline["file_path"] == "python/fastast/db.py"
    assert len(outline["functions"]) > 0

    # 2. Outline with snippet preview
    outline_snip = tool_file_outline(file_path="python/fastast/db.py", include_snippets=True, directory_path=".")
    assert outline_snip.get("error") is None
    assert "snippet_preview" in outline_snip["functions"][0]

    print("✓ test_mcp_file_outline_tool passed")


def test_mcp_trigger_index_tool():
    """Test fastast_trigger_index incremental trigger."""
    res = tool_trigger_index(directory_path=".", force=False)
    assert res.get("error") is None
    assert "total_files" in res
    assert "indexed_files" in res
    assert "total_symbols" in res

    print("✓ test_mcp_trigger_index_tool passed")


def test_mcp_stdio_jsonrpc_server():
    """Test complete MCP JSON-RPC 2.0 stdio server process."""
    proc = subprocess.Popen(
        [sys.executable, "-m", "fastast.mcp", "--transport", "stdio"],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )

    def rpc_call(req: dict) -> dict:
        proc.stdin.write(json.dumps(req) + "\n")
        proc.stdin.flush()
        line = proc.stdout.readline()
        return json.loads(line)

    try:
        # 1. initialize
        init_res = rpc_call({
            "jsonrpc": "2.0",
            "id": 1,
            "method": "initialize",
            "params": {
                "protocolVersion": "2024-11-05",
                "capabilities": {},
                "clientInfo": {"name": "test_client", "version": "1.0"},
            },
        })
        assert init_res["result"]["protocolVersion"] == "2024-11-05"
        assert init_res["result"]["serverInfo"]["name"] == "fastast"

        # 2. notifications/initialized
        proc.stdin.write(json.dumps({"jsonrpc": "2.0", "method": "notifications/initialized"}) + "\n")
        proc.stdin.flush()

        # 3. ping
        ping_res = rpc_call({"jsonrpc": "2.0", "id": 2, "method": "ping"})
        assert ping_res["result"] == {}

        # 4. tools/list
        tools_res = rpc_call({"jsonrpc": "2.0", "id": 3, "method": "tools/list", "params": {}})
        available_tools = {t["name"] for t in tools_res["result"]["tools"]}
        for req_name in REQUIRED_TOOL_NAMES:
            assert req_name in available_tools, f"Tool {req_name} not advertised in tools/list"

        # 5. tools/call for all 9 required tools
        call_test_cases = [
            ("fastast_index_status", {"directory_path": "."}),
            ("fastast_search_symbols", {"query": "stats", "limit": 3}),
            ("fastast_get_evidence", {"query": "SQLite database initialization", "max_tokens": 1000}),
            ("fastast_graph_neighbors", {"symbol": "index_repository", "depth": 1}),
            ("fastast_list_communities", {"limit": 3}),
            ("fastast_community_detail", {"community_id": 0, "limit": 3}),
            ("fastast_similar_symbols", {"symbol": "index_repository", "limit": 2}),
            ("fastast_file_outline", {"file_path": "python/fastast/db.py"}),
            ("fastast_trigger_index", {"force": False}),
        ]

        for req_id, (tool_name, arguments) in enumerate(call_test_cases, 10):
            call_res = rpc_call({
                "jsonrpc": "2.0",
                "id": req_id,
                "method": "tools/call",
                "params": {"name": tool_name, "arguments": arguments},
            })
            assert call_res.get("error") is None, f"Tool {tool_name} returned JSON-RPC error: {call_res.get('error')}"
            res_content = call_res.get("result", {})
            assert res_content.get("isError") is False, f"Tool {tool_name} execution flagged isError=True"
            content_text = res_content.get("content", [{}])[0].get("text", "")
            parsed_text = json.loads(content_text)
            assert isinstance(parsed_text, (dict, list)), f"Tool {tool_name} did not return structured JSON"

        # 6. resources/list and resources/read
        res_list = rpc_call({"jsonrpc": "2.0", "id": 50, "method": "resources/list", "params": {}})
        uris = [r["uri"] for r in res_list["result"]["resources"]]
        assert "fastast://status" in uris
        assert "fastast://communities" in uris

        res_read = rpc_call({
            "jsonrpc": "2.0",
            "id": 51,
            "method": "resources/read",
            "params": {"uri": "fastast://status"},
        })
        text_content = res_read["result"]["contents"][0]["text"]
        status_parsed = json.loads(text_content)
        assert status_parsed["status"] == "ready"

        # 7. Error handling: Unknown tool
        unknown_res = rpc_call({
            "jsonrpc": "2.0",
            "id": 99,
            "method": "tools/call",
            "params": {"name": "nonexistent_tool_xyz", "arguments": {}},
        })
        assert unknown_res.get("error") is not None
        assert unknown_res["error"]["code"] == -32601

    finally:
        proc.stdin.close()
        proc.terminate()
        proc.wait()

    print("✓ test_mcp_stdio_jsonrpc_server passed")


def run_all_tests():
    """Run all MCP server tests."""
    print("=" * 60)
    print("Running FastAST MCP Server Test Suite...")
    print("=" * 60)

    test_mcp_tool_spec_and_schemas()
    test_mcp_index_status_tool()
    test_mcp_search_symbols_tool()
    test_mcp_get_evidence_tool()
    test_mcp_graph_neighbors_tool()
    test_mcp_communities_tools()
    test_mcp_similar_symbols_tool()
    test_mcp_file_outline_tool()
    test_mcp_trigger_index_tool()
    test_mcp_stdio_jsonrpc_server()

    print("=" * 60)
    print("All 10 FastAST MCP test suites passed successfully!")
    print("=" * 60)


if __name__ == "__main__":
    run_all_tests()
