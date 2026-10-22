"""Tests for FastMCP server, index_repository, query_symbols, and get_call_graph tools."""

import json
from pathlib import Path
import tempfile

from fastast.db import get_connection, init_db
from fastast.server import (
    get_call_graph,
    index_repository,
    query_symbols,
)


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


if __name__ == "__main__":
    test_index_repository_not_found()
    test_query_symbols_empty()
    test_get_call_graph_empty()

    with tempfile.TemporaryDirectory() as td:
        test_query_symbols_tool(Path(td))

    with tempfile.TemporaryDirectory() as td:
        test_get_call_graph_tool(Path(td))

    print("All server tests passed successfully!")
