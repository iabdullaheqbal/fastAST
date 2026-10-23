"""Comprehensive tests for FastAST CLI runner and utilities."""

import json
import subprocess
import sys
import tempfile
from pathlib import Path

from fastast.cli import (
    detect_language_from_path,
    run_calls,
    run_index,
    run_outline,
    run_query,
    run_snippet,
    run_stats,
    run_symbols,
)
from fastast.db import get_connection, init_db

FIXTURES_DIR = Path(__file__).parent / "fixtures"


def test_detect_language():
    assert detect_language_from_path(Path("app.py")) == "python"
    assert detect_language_from_path(Path("script.js")) == "javascript"
    assert detect_language_from_path(Path("component.tsx")) == "typescript"
    assert detect_language_from_path(Path("App.java")) == "java"
    assert detect_language_from_path(Path("main.rs")) == "rust"
    assert detect_language_from_path(Path("index.html")) == "html"
    assert detect_language_from_path(Path("style.css")) == "css"
    assert detect_language_from_path(Path("package.json")) == "json"
    assert detect_language_from_path(Path("Cargo.toml")) == "toml"
    assert detect_language_from_path(Path("unknown.xyz")) is None


def test_cli_subprocess_version():
    res = subprocess.run(
        [sys.executable, "-m", "fastast.cli", "--version"],
        capture_output=True,
        text=True,
        env={"PYTHONPATH": "python"},
    )
    assert res.returncode == 0
    assert "fastast 0.2.0" in res.stdout


def test_cli_subprocess_help():
    res = subprocess.run(
        [sys.executable, "-m", "fastast.cli", "--help"],
        capture_output=True,
        text=True,
        env={"PYTHONPATH": "python"},
    )
    assert res.returncode == 0
    assert "FastAST: AST-based repository indexer for coding agents." in res.stdout
    assert "index" in res.stdout
    assert "symbols" in res.stdout
    assert "calls" in res.stdout


def test_run_index_missing_dir():
    ret = run_index("/nonexistent/path/for/fastast", quiet=True)
    assert ret == 1


def test_run_symbols_missing_dir():
    ret = run_symbols("test_sym", dir_path="/nonexistent/path/for/fastast", quiet=True)
    assert ret == 1


def test_run_calls_missing_dir():
    ret = run_calls("test_call", dir_path="/nonexistent/path/for/fastast", quiet=True)
    assert ret == 1


def test_run_symbols_with_db(tmp_path: Path):
    db_path = tmp_path / ".fastast.db"
    conn = get_connection(db_path)
    init_db(conn)
    with conn:
        conn.execute(
            "INSERT INTO files (path, language, hash, mtime, total_lines, total_tokens) VALUES (?, ?, ?, ?, ?, ?)",
            ("app1.py", "python", "hash123", 1000.0, 10, 20),
        )
        file_id = conn.execute("SELECT id FROM files WHERE path = 'app1.py'").fetchone()[0]
        conn.execute(
            "INSERT INTO symbols (file_id, name, kind, signature, start_line, end_line) VALUES (?, ?, ?, ?, ?, ?)",
            (file_id, "handle_request", "function", "def handle_request():", 1, 5),
        )
    conn.close()

    ret = run_symbols("handle_request", dir_path=str(tmp_path), json_output=True)
    assert ret == 0


def test_run_calls_with_db(tmp_path: Path):
    db_path = tmp_path / ".fastast.db"
    conn = get_connection(db_path)
    init_db(conn)
    with conn:
        conn.execute(
            "INSERT INTO files (path, language, hash, mtime, total_lines, total_tokens) VALUES (?, ?, ?, ?, ?, ?)",
            ("app2.py", "python", "hash123", 1000.0, 10, 20),
        )
        file_id = conn.execute("SELECT id FROM files WHERE path = 'app2.py'").fetchone()[0]
        conn.execute(
            "INSERT INTO symbols (file_id, name, kind, signature, start_line, end_line) VALUES (?, ?, ?, ?, ?, ?)",
            (file_id, "caller_func", "function", "def caller_func():", 1, 5),
        )
        sym_id = conn.execute("SELECT id FROM symbols WHERE name = 'caller_func'").fetchone()[0]
        conn.execute(
            "INSERT INTO calls (file_id, caller_symbol_id, callee_name, line_number) VALUES (?, ?, ?, ?)",
            (file_id, sym_id, "callee_func", 3),
        )
    conn.close()

    ret = run_calls("callee_func", dir_path=str(tmp_path), json_output=True)
    assert ret == 0


def test_run_stats_cli(tmp_path: Path):
    """Test fastast stats CLI subcommand and JSON contract."""
    (tmp_path / "app.py").write_text("def my_func(): pass\n")
    run_index(str(tmp_path), quiet=True)

    # Missing dir test
    ret_err = run_stats("/nonexistent/dir", json_output=True)
    assert ret_err == 1

    # Valid repo test
    ret = run_stats(str(tmp_path), json_output=True)
    assert ret == 0

    # Subprocess execution test
    res = subprocess.run(
        [sys.executable, "-m", "fastast.cli", "stats", "-d", str(tmp_path), "--json"],
        capture_output=True,
        text=True,
        env={"PYTHONPATH": "python"},
    )
    assert res.returncode == 0
    data = json.loads(res.stdout)
    assert "files" in data
    assert "symbols" in data
    assert "results" in data
    assert "meta" in data
    assert data["error"] is None


def test_run_query_outline_snippet_cli(tmp_path: Path):
    """Test query, outline, snippet subcommands in CLI matching MCP contracts."""
    (tmp_path / "service.py").write_text(
        "class ServiceEngine:\n"
        "    def run_worker(self) -> None:\n"
        "        pass\n"
    )
    run_index(str(tmp_path), quiet=True)

    # 1. query
    res_q = subprocess.run(
        [sys.executable, "-m", "fastast.cli", "query", "run_worker", "-d", str(tmp_path), "--json"],
        capture_output=True,
        text=True,
        env={"PYTHONPATH": "python"},
    )
    assert res_q.returncode == 0
    q_data = json.loads(res_q.stdout)
    assert "candidates" in q_data
    assert "results" in q_data
    assert "meta" in q_data

    # 2. outline
    res_out = subprocess.run(
        [sys.executable, "-m", "fastast.cli", "outline", "service.py", "-d", str(tmp_path), "--json"],
        capture_output=True,
        text=True,
        env={"PYTHONPATH": "python"},
    )
    assert res_out.returncode == 0
    out_data = json.loads(res_out.stdout)
    assert "classes" in out_data
    assert "results" in out_data
    assert out_data["error"] is None

    # 3. snippet
    res_snip = subprocess.run(
        [sys.executable, "-m", "fastast.cli", "snippet", "run_worker", "-d", str(tmp_path), "--json"],
        capture_output=True,
        text=True,
        env={"PYTHONPATH": "python"},
    )
    assert res_snip.returncode == 0
    snip_data = json.loads(res_snip.stdout)
    assert "snippet" in snip_data
    assert "results" in snip_data
    assert snip_data["error"] is None


if __name__ == "__main__":
    with tempfile.TemporaryDirectory() as td:
        tmp = Path(td)
        test_detect_language()
        test_cli_subprocess_version()
        test_cli_subprocess_help()
        test_run_index_missing_dir()
        test_run_symbols_missing_dir()
        test_run_calls_missing_dir()
        test_run_symbols_with_db(tmp)
        test_run_calls_with_db(tmp)

    with tempfile.TemporaryDirectory() as td:
        test_run_stats_cli(Path(td))

    with tempfile.TemporaryDirectory() as td:
        test_run_query_outline_snippet_cli(Path(td))

    print("All CLI tests passed successfully!")
