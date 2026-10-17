"""Tests for FastMCP server and prune_context tool."""

import json
from pathlib import Path
from fastast.server import (
    get_call_graph,
    index_repository,
    prune_context,
    query_symbols,
)


def test_prune_context_valid():
    code = """
import os

def helper():
    return 1

def target_func():
    val = helper()
    return val
"""
    raw = prune_context(code, "target_func", 0.5)
    data = json.loads(raw)

    assert data["syntax_valid"] is True
    assert "def target_func():" in data["pruned_code"]
    assert "val = helper()" in data["pruned_code"]
    assert "def helper():" in data["pruned_code"]
    assert "pass" in data["pruned_code"]
    assert data["original_tokens"] > 0
    assert data["pruned_tokens"] > 0
    assert "latency_ms" in data


def test_prune_context_syntax_error():
    broken = "def broken(:\n    pass"
    raw = prune_context(broken, "query", 0.5)
    data = json.loads(raw)

    assert data["syntax_valid"] is False
    assert data["error"] == "PREEXISTING_SYNTAX_ERROR"
    assert data["pruned_code"] == broken
    assert data["savings_pct"] == 0.0


def test_prune_context_empty():
    raw = prune_context("", "query", 0.5)
    data = json.loads(raw)

    assert data["syntax_valid"] is True
    assert data["pruned_code"] == ""
    assert data["original_tokens"] == 0
    assert data["pruned_tokens"] == 0


def test_index_repository_tool(tmp_path: Path):
    f1 = tmp_path / "mod1.py"
    f1.write_text("def run_job(x):\n    return x * 2\n")

    res_raw = index_repository(str(tmp_path))
    data = json.loads(res_raw)

    assert data["total_files"] == 1
    assert data["indexed_files"] == 1
    assert data["total_symbols"] == 1
    assert Path(data["db_path"]).exists()


def test_query_symbols_tool(tmp_path: Path):
    f1 = tmp_path / "service.py"
    f1.write_text("class DatabaseEngine:\n    def connect(self):\n        pass\n")

    res_raw = query_symbols("DatabaseEngine", directory_path=str(tmp_path))
    data = json.loads(res_raw)

    assert data["count"] == 1
    assert data["symbols"][0]["name"] == "DatabaseEngine"
    assert data["symbols"][0]["kind"] == "class"


def test_get_call_graph_tool(tmp_path: Path):
    f1 = tmp_path / "pipeline.py"
    f1.write_text("def step_a():\n    pass\n\ndef step_b():\n    step_a()\n")

    res_raw = get_call_graph("step_a", directory_path=str(tmp_path))
    data = json.loads(res_raw)

    assert data["symbol"] == "step_a"
    assert data["caller_count"] == 1
    assert data["callers"][0]["caller"] == "step_b"


def test_prune_context_json():
    json_code = '{"name": "fastast", "version": "0.1.0", "unused": {"a": 1, "b": 2}}'
    raw = prune_context(json_code, "version", 0.5, language="json")
    data = json.loads(raw)

    assert data["syntax_valid"] is True
    assert "version" in data["pruned_code"]
    assert data["language"] == "json"


def test_prune_context_toml():
    toml_code = """
[package]
name = "fastast"
version = "0.1.0"

[dependencies]
serde = "1.0"
"""
    raw = prune_context(toml_code, "dependencies", 0.5, language="toml")
    data = json.loads(raw)

    assert data["syntax_valid"] is True
    assert "dependencies" in data["pruned_code"]
    assert data["language"] == "toml"


def test_prune_context_unsupported_language():
    code = "fn main() {}"
    raw = prune_context(code, "main", 0.5, language="unsupported_lang")
    data = json.loads(raw)

    assert data["syntax_valid"] is False
    assert data["error"] == "UNSUPPORTED_LANGUAGE"
    assert "Unsupported language" in data["message"]


def test_index_repository_not_found():
    raw = index_repository("/nonexistent/directory/path/here")
    data = json.loads(raw)

    assert "error" in data
    assert "Directory not found" in data["error"]


def test_query_symbols_empty():
    raw = query_symbols("")
    data = json.loads(raw)

    assert "error" in data
    assert "Query cannot be empty" in data["error"]
    assert data["count"] == 0


def test_get_call_graph_empty():
    raw = get_call_graph("")
    data = json.loads(raw)

    assert "error" in data
    assert "Symbol name cannot be empty" in data["error"]
    assert data["caller_count"] == 0


if __name__ == "__main__":
    import tempfile

    test_prune_context_valid()
    test_prune_context_syntax_error()
    test_prune_context_empty()
    test_prune_context_json()
    test_prune_context_toml()
    test_prune_context_unsupported_language()
    test_index_repository_not_found()
    test_query_symbols_empty()
    test_get_call_graph_empty()

    with tempfile.TemporaryDirectory() as td:
        test_index_repository_tool(Path(td))

    with tempfile.TemporaryDirectory() as td:
        test_query_symbols_tool(Path(td))

    with tempfile.TemporaryDirectory() as td:
        test_get_call_graph_tool(Path(td))

    print("All 12 server tests passed!")


