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
    run_prune,
    run_symbols,
    validate_syntax,
)

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


def test_validate_syntax():
    # Python
    ok, _ = validate_syntax("def add(a, b): return a + b", "python")
    assert ok is True
    ok, _ = validate_syntax("def broken(:", "python")
    assert ok is False

    # JSON
    ok, _ = validate_syntax('{"a": 1, "b": [2, 3]}', "json")
    assert ok is True
    ok, _ = validate_syntax('{"a": 1, broken}', "json")
    assert ok is False

    # TOML
    ok, _ = validate_syntax('[package]\nname = "fastast"', "toml")
    assert ok is True
    ok, _ = validate_syntax('[broken\nname = ', "toml")
    assert ok is False


def test_run_prune_python(tmp_path: Path):
    f = tmp_path / "test.py"
    f.write_text("def target(): return 42\ndef unused(): return 0\n")

    # Human readable
    ret = run_prune(str(f), "target", 0.5, quiet=True)
    assert ret == 0

    # JSON mode
    ret = run_prune(str(f), "target", 0.5, json_output=True)
    assert ret == 0


def test_run_prune_json_file(tmp_path: Path):
    f = tmp_path / "config.json"
    f.write_text('{"target_key": "val", "other": {"x": 1}}\n')

    ret = run_prune(str(f), "target_key", 0.5, json_output=True)
    assert ret == 0


def test_run_prune_toml_file(tmp_path: Path):
    f = tmp_path / "config.toml"
    f.write_text('[section]\ntarget = "value"\n[other]\nfoo = "bar"\n')

    ret = run_prune(str(f), "target", 0.5, json_output=True)
    assert ret == 0


def test_run_prune_missing_file():
    ret = run_prune("/nonexistent/path/to/missing.py", "query", 0.5)
    assert ret == 1


def test_run_prune_unsupported_language(tmp_path: Path):
    f = tmp_path / "test.txt"
    f.write_text("hello world")

    ret = run_prune(str(f), "hello", 0.5, language="brainfuck")
    assert ret == 1


def test_cli_subprocess_version():
    res = subprocess.run(
        [sys.executable, "-m", "fastast.cli", "--version"],
        capture_output=True,
        text=True,
    )
    assert res.returncode == 0
    assert "fastast 0.1.0" in res.stdout


def test_cli_subprocess_shorthand(tmp_path: Path):
    f = tmp_path / "simple.py"
    f.write_text("def foo(): return 1\ndef bar(): return 2\n")

    res = subprocess.run(
        [sys.executable, "-m", "fastast.cli", str(f), "-q", "foo", "--json"],
        capture_output=True,
        text=True,
    )
    assert res.returncode == 0
    data = json.loads(res.stdout)
    assert data["syntax_valid"] is True
    assert "def foo():" in data["pruned_code"]


if __name__ == "__main__":
    with tempfile.TemporaryDirectory() as td:
        tmp = Path(td)
        test_detect_language()
        test_validate_syntax()
        test_run_prune_python(tmp)
        test_run_prune_json_file(tmp)
        test_run_prune_toml_file(tmp)
        test_run_prune_missing_file()
        test_run_prune_unsupported_language(tmp)
        test_cli_subprocess_version()
        test_cli_subprocess_shorthand(tmp)

    print("All 9 CLI tests passed successfully!")

