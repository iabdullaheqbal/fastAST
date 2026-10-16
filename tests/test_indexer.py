"""Unit tests for FastAST SQLite schema, repository walker, and AST indexer."""

import sqlite3
import tempfile
from pathlib import Path
from fastast._core import index_code
from fastast.db import (
    get_call_graph,
    get_connection,
    get_repository_stats,
    init_db,
    search_symbols,
    store_file_data,
)
from fastast.indexer import find_python_files, index_repository


def test_native_symbol_and_call_extraction():
    code = """
import sys
from os import path as ospath

class TaskManager:
    \"\"\"Manages background jobs.\"\"\"
    def __init__(self, capacity: int = 10):
        self.capacity = capacity

    async def execute_job(self, job_id: str) -> bool:
        res = self.validate(job_id)
        return res

    def validate(self, job_id: str) -> bool:
        return len(job_id) > 0

def run_pipeline(name: str):
    mgr = TaskManager()
    mgr.validate(name)
"""
    res = index_code(code)

    assert res.has_syntax_error is False
    assert res.total_lines > 15
    assert res.total_tokens > 20

    # Verify extracted symbols
    sym_names = [s.name for s in res.symbols]
    assert "TaskManager" in sym_names
    assert "__init__" in sym_names
    assert "execute_job" in sym_names
    assert "validate" in sym_names
    assert "run_pipeline" in sym_names

    # Check kinds
    classes = [s for s in res.symbols if s.kind == "class"]
    assert len(classes) == 1
    assert classes[0].name == "TaskManager"
    assert "Manages background jobs" in (classes[0].docstring or "")

    methods = [s for s in res.symbols if s.kind == "method"]
    assert len(methods) == 3
    for m in methods:
        assert m.parent_name == "TaskManager"

    funcs = [s for s in res.symbols if s.kind == "function"]
    assert len(funcs) == 1
    assert funcs[0].name == "run_pipeline"

    # Verify extracted imports
    imp_modules = [imp.module for imp in res.imports]
    assert "sys" in imp_modules
    assert "os" in imp_modules
    aliased = [imp for imp in res.imports if imp.alias == "ospath"]
    assert len(aliased) == 1
    assert aliased[0].name == "path"

    # Verify extracted calls
    calls = res.calls
    callee_names = [c.callee_name for c in calls]
    assert "validate" in callee_names
    assert "TaskManager" in callee_names


def test_sqlite_schema_and_queries():
    with tempfile.TemporaryDirectory() as tmpdir:
        db_path = Path(tmpdir) / "test.db"
        conn = get_connection(db_path)
        init_db(conn)

        code = """
class Worker:
    def process(self, x):
        return self.compute(x)

    def compute(self, x):
        return x * 2

def entry():
    w = Worker()
    w.process(10)
"""
        res = index_code(code)
        file_id = store_file_data(conn, "app/worker.py", "hash123", 1000.0, res)
        assert file_id > 0

        # Query stats
        stats = get_repository_stats(conn)
        assert stats["files"] == 1
        assert stats["symbols"] == 4
        assert stats["calls"] == 3

        # Test search symbols
        matches = search_symbols(conn, "Worker")
        assert len(matches) == 1
        assert matches[0]["name"] == "Worker"
        assert matches[0]["kind"] == "class"
        assert matches[0]["file_path"] == "app/worker.py"

        methods = search_symbols(conn, "compute", kind="method")
        assert len(methods) == 1
        assert methods[0]["parent_name"] == "Worker"

        # Test call graph
        graph = get_call_graph(conn, "compute")
        assert graph["caller_count"] == 1
        assert graph["callers"][0]["caller"] == "process"

        graph_entry = get_call_graph(conn, "process")
        assert graph_entry["caller_count"] == 1
        assert graph_entry["callers"][0]["caller"] == "entry"


def test_repository_indexing():
    with tempfile.TemporaryDirectory() as tmpdir:
        root = Path(tmpdir)
        # Create test package
        pkg = root / "mypkg"
        pkg.mkdir()
        (pkg / "mod_a.py").write_text("def func_a():\n    return 42\n")
        (pkg / "mod_b.py").write_text("from mypkg.mod_a import func_a\ndef func_b():\n    return func_a()\n")

        # Run index
        res = index_repository(str(root), db_name="test.db")
        assert res["total_files"] == 2
        assert res["indexed_files"] == 2
        assert res["total_symbols"] == 2
        assert res["total_imports"] == 1
        assert res["total_calls"] == 1

        # Test incremental skip
        res2 = index_repository(str(root), db_name="test.db")
        assert res2["indexed_files"] == 0
        assert res2["skipped_files"] == 2


if __name__ == "__main__":
    test_native_symbol_and_call_extraction()
    test_sqlite_schema_and_queries()
    test_repository_indexing()
    print("All indexer & SQLite tests passed successfully!")
