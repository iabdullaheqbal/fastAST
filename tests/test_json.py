"""Tests for JSON parsing, pruning, and indexing in FastAST."""

import json
import subprocess
import sys
from pathlib import Path

from fastast import index_code, prune_file

FIXTURES_DIR = Path(__file__).parent / "fixtures"


def test_json_prune_key_pair():
    """Test pruning JSON to keep a specific key-value pair and its parent."""
    fixture_path = FIXTURES_DIR / "sample_simple.json"
    code = fixture_path.read_text(encoding="utf-8")

    res = prune_file(code, "scripts test", threshold=0.3, language="json")
    assert not res.has_syntax_error

    parsed = json.loads(res.pruned_code)
    assert "scripts" in parsed
    assert parsed["scripts"].get("test") == "jest --coverage"

    # Unrelated keys pruned
    assert "build" not in parsed["scripts"]
    assert "lint" not in parsed["scripts"]
    assert "dependencies" not in parsed
    assert "devDependencies" not in parsed
    assert res.savings_pct > 0.0


def test_json_prune_entire_object():
    """Test pruning JSON where querying an entire object keeps all its contents."""
    fixture_path = FIXTURES_DIR / "sample_simple.json"
    code = fixture_path.read_text(encoding="utf-8")

    res = prune_file(code, "dependencies", threshold=0.3, language="json")
    assert not res.has_syntax_error

    parsed = json.loads(res.pruned_code)
    assert "dependencies" in parsed
    deps = parsed["dependencies"]
    assert "express" in deps
    assert "tree-sitter" in deps
    assert "sqlite3" in deps
    assert "zod" in deps

    # Scripts and repository omitted
    assert "scripts" not in parsed
    assert "repository" not in parsed


def test_json_prune_array():
    """Test pruning JSON with array of keywords."""
    fixture_path = FIXTURES_DIR / "sample_simple.json"
    code = fixture_path.read_text(encoding="utf-8")

    res = prune_file(code, "keywords", threshold=0.3, language="json")
    assert not res.has_syntax_error

    parsed = json.loads(res.pruned_code)
    assert "keywords" in parsed
    assert isinstance(parsed["keywords"], list)
    assert "ast" in parsed["keywords"]
    assert "pruning" in parsed["keywords"]


def test_json_zero_match_structural_skeleton():
    """Test zero semantic match produces top-level structural skeleton with valid JSON."""
    fixture_path = FIXTURES_DIR / "sample_simple.json"
    code = fixture_path.read_text(encoding="utf-8")

    res = prune_file(code, "nonExistentKeyXYZ999", threshold=0.5, language="json")
    assert not res.has_syntax_error

    parsed = json.loads(res.pruned_code)
    # Top-level keys preserved
    assert parsed.get("name") == "fastast-app"
    assert parsed.get("version") == "1.0.0"
    # Complex children preserved as empty skeletons
    assert parsed.get("scripts") == {}
    assert parsed.get("dependencies") == {}
    assert parsed.get("devDependencies") == {}
    assert parsed.get("keywords") == []


def test_json_valid_syntax_guaranteed():
    """Test multiple query variations always result in 100% valid JSON."""
    fixture_path = FIXTURES_DIR / "sample_simple.json"
    code = fixture_path.read_text(encoding="utf-8")

    queries = [
        "express",
        "typescript jest",
        "repository git url",
        "description",
        "start node dist",
    ]

    for q in queries:
        res = prune_file(code, q, threshold=0.3, language="json")
        assert not res.has_syntax_error, f"Failed on query: {q}"
        try:
            val = json.loads(res.pruned_code)
            assert isinstance(val, (dict, list))
        except json.JSONDecodeError as exc:
            raise AssertionError(f"Invalid JSON produced for query '{q}': {exc}\n{res.pruned_code}")


def test_json_empty_code_and_query():
    """Test empty input and empty query handling."""
    res_empty = prune_file("", "test", threshold=0.3, language="json")
    assert res_empty.pruned_code == ""
    assert not res_empty.has_syntax_error

    sample = '{"key": "value"}'
    res_no_query = prune_file(sample, "", threshold=0.3, language="json")
    assert json.loads(res_no_query.pruned_code) == {"key": "value"}


def test_json_syntax_error_fallback():
    """Test malformed JSON gracefully triggers syntax error fallback."""
    broken_json = '{"key": "unterminated string'
    res = prune_file(broken_json, "key", threshold=0.3, language="json")
    assert res.has_syntax_error
    assert res.pruned_code == broken_json


def test_json_indexing():
    """Test symbol indexing on JSON documents."""
    fixture_path = FIXTURES_DIR / "sample_simple.json"
    code = fixture_path.read_text(encoding="utf-8")

    idx = index_code(code, language="json")
    assert not idx.has_syntax_error
    assert idx.total_lines > 0

    sym_names = [s.name for s in idx.symbols]
    assert "name" in sym_names
    assert "scripts" in sym_names
    assert "dependencies" in sym_names
    assert "keywords" in sym_names

    # Imports extracted from dependencies
    import_mods = [i.module for i in idx.imports]
    assert "express" in import_mods
    assert "tree-sitter" in import_mods


def test_json_cli_prune():
    """Test CLI prune on JSON file with automatic language detection."""
    fixture_path = FIXTURES_DIR / "sample_simple.json"

    cmd = [
        sys.executable,
        "-m",
        "fastast.cli",
        "prune",
        str(fixture_path),
        "-q",
        "scripts test",
        "--json",
    ]
    proc = subprocess.run(cmd, capture_output=True, text=True, check=True)
    out = json.loads(proc.stdout)
    assert out["syntax_valid"] is True
    assert not out["has_syntax_error"]

    pruned = json.loads(out["pruned_code"])
    assert "scripts" in pruned
    assert "test" in pruned["scripts"]
