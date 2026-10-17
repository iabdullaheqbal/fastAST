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


def test_multi_language_repository_indexing():
    """Verify repository indexing across all 9 supported languages."""
    with tempfile.TemporaryDirectory() as tmpdir:
        root = Path(tmpdir)

        # 1. Python file
        (root / "app.py").write_text("def py_main():\n    return 1\n")

        # 2. Rust file
        (root / "lib.rs").write_text("pub fn rust_compute(x: i32) -> i32 {\n    x * 2\n}\npub struct Config;\n")

        # 3. JavaScript file
        (root / "index.js").write_text("function jsHandler(req, res) {\n    return res;\n}\n")

        # 4. TypeScript file
        (root / "types.ts").write_text("interface UserProfile {\n    id: string;\n}\nfunction tsValidator() {}\n")

        # 5. Java file
        (root / "Service.java").write_text("public class Service {\n    public void executeTask() {}\n}\n")

        # 6. HTML file
        (root / "index.html").write_text("<!DOCTYPE html>\n<html><body><div id=\"content\"><form name=\"search\"></form></div></body></html>\n")

        # 7. CSS file
        (root / "styles.css").write_text(".main-header { font-size: 16px; }\n")

        # 8. JSON file
        (root / "package.json").write_text('{\n  "appName": "fastast-test",\n  "version": "1.0.0"\n}\n')

        # 9. TOML file
        (root / "config.toml").write_text('[database]\nport = 5432\n')

        # Run multi-language index
        res = index_repository(str(root), db_name="multi.db")
        assert res["total_files"] == 9
        assert res["indexed_files"] == 9
        assert res["error_files"] == 0
        assert res["total_symbols"] >= 9

        # Verify language breakdown
        langs = res["languages"]
        for expected in ["python", "rust", "javascript", "typescript", "java", "html", "css", "json", "toml"]:
            assert expected in langs
            assert langs[expected] == 1

        # Query symbols with language filter
        conn = get_connection(root / "multi.db")
        try:
            # Rust symbol search
            rust_syms = search_symbols(conn, "rust_compute", language="rust")
            assert len(rust_syms) == 1
            assert rust_syms[0]["name"] == "rust_compute"
            assert rust_syms[0]["language"] == "rust"

            # Filter by wrong language returns nothing
            wrong_lang = search_symbols(conn, "rust_compute", language="python")
            assert len(wrong_lang) == 0

            # TypeScript symbol search
            ts_syms = search_symbols(conn, "UserProfile", language="typescript")
            assert len(ts_syms) == 1
            assert ts_syms[0]["language"] == "typescript"

            # Java symbol search
            java_syms = search_symbols(conn, "Service", language="java")
            assert len(java_syms) == 1
            assert java_syms[0]["kind"] == "class"
            assert java_syms[0]["language"] == "java"

            # Cross-language search without filter
            all_syms = search_symbols(conn, "executeTask")
            assert len(all_syms) == 1
            assert all_syms[0]["name"] == "executeTask"
            assert all_syms[0]["language"] == "java"

        finally:
            conn.close()

        # Incremental skip check: reindexing with no modifications
        res2 = index_repository(str(root), db_name="multi.db")
        assert res2["indexed_files"] == 0
        assert res2["skipped_files"] == 9

        # Modify a single file (Rust) and verify partial reindexing
        time.sleep(0.01)
        (root / "lib.rs").write_text("pub fn rust_compute(x: i32) -> i32 {\n    x * 3\n}\npub fn new_helper() {}\n")
        res3 = index_repository(str(root), db_name="multi.db")
        assert res3["indexed_files"] == 1
        assert res3["skipped_files"] == 8

        conn2 = get_connection(root / "multi.db")
        try:
            updated = search_symbols(conn2, "new_helper", language="rust")
            assert len(updated) == 1
            assert updated[0]["name"] == "new_helper"
        finally:
            conn2.close()


if __name__ == "__main__":
    import time
    test_native_symbol_and_call_extraction()
    test_sqlite_schema_and_queries()
    test_repository_indexing()
    test_multi_language_repository_indexing()
    print("All indexer & SQLite tests passed successfully!")
