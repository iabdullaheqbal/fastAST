"""Tests for TOML parsing, pruning, and indexing in FastAST."""

import json
import subprocess
import sys
import tomllib
from pathlib import Path

from fastast import index_code, prune_file

FIXTURES_DIR = Path(__file__).parent / "fixtures"


def test_toml_prune_key_pair():
    """Test pruning TOML to keep a specific dependency in [dependencies]."""
    fixture_path = FIXTURES_DIR / "sample_simple.toml"
    code = fixture_path.read_text(encoding="utf-8")

    res = prune_file(code, "dependencies pyo3", threshold=0.3, language="toml")
    assert not res.has_syntax_error

    parsed = tomllib.loads(res.pruned_code)
    assert "dependencies" in parsed
    assert "pyo3" in parsed["dependencies"]

    # Unrelated dependencies and tables pruned
    assert "serde_json" not in parsed["dependencies"]
    assert "tree-sitter" not in parsed["dependencies"]
    assert "package" not in parsed
    assert "profile" not in parsed
    assert res.savings_pct > 0.0


def test_toml_prune_entire_table():
    """Test pruning TOML where querying an entire table keeps all its keys."""
    fixture_path = FIXTURES_DIR / "sample_simple.toml"
    code = fixture_path.read_text(encoding="utf-8")

    res = prune_file(code, "dependencies", threshold=0.5, language="toml")
    assert not res.has_syntax_error

    parsed = tomllib.loads(res.pruned_code)
    assert "dependencies" in parsed
    deps = parsed["dependencies"]
    assert "pyo3" in deps
    assert "serde_json" in deps
    assert "toml" in deps
    assert "tiktoken-rs" in deps

    # Other tables not kept
    assert "dev-dependencies" not in parsed
    assert "profile" not in parsed


def test_toml_prune_array_of_tables():
    """Test pruning TOML array of tables [[bin]] to keep only the matching entry."""
    fixture_path = FIXTURES_DIR / "sample_simple.toml"
    code = fixture_path.read_text(encoding="utf-8")

    res = prune_file(code, "bin fastast-cli", threshold=0.3, language="toml")
    assert not res.has_syntax_error

    parsed = tomllib.loads(res.pruned_code)
    assert "bin" in parsed
    bins = parsed["bin"]
    assert len(bins) == 1
    assert bins[0]["name"] == "fastast-cli"
    assert bins[0]["path"] == "src/bin/cli.rs"


def test_toml_nested_table():
    """Test pruning nested TOML table [profile.release]."""
    fixture_path = FIXTURES_DIR / "sample_simple.toml"
    code = fixture_path.read_text(encoding="utf-8")

    res = prune_file(code, "profile release lto", threshold=0.3, language="toml")
    assert not res.has_syntax_error

    parsed = tomllib.loads(res.pruned_code)
    assert "profile" in parsed
    assert "release" in parsed["profile"]
    assert parsed["profile"]["release"].get("lto") == "thin"


def test_toml_zero_match_structural_skeleton():
    """Test zero semantic match produces table skeleton with valid TOML."""
    fixture_path = FIXTURES_DIR / "sample_simple.toml"
    code = fixture_path.read_text(encoding="utf-8")

    res = prune_file(code, "nonExistentKeyXYZ999", threshold=0.5, language="toml")
    assert not res.has_syntax_error

    parsed = tomllib.loads(res.pruned_code)
    # Top-level tables present in skeleton
    assert "package" in parsed
    assert "dependencies" in parsed
    assert "dev-dependencies" in parsed
    assert "bin" in parsed
    assert "profile" in parsed


def test_toml_valid_syntax_guaranteed():
    """Test multiple query variations always result in 100% valid TOML."""
    fixture_path = FIXTURES_DIR / "sample_simple.toml"
    code = fixture_path.read_text(encoding="utf-8")

    queries = [
        "edition 2021",
        "lib cdylib",
        "tempfile",
        "bench",
        "opt-level",
    ]

    for q in queries:
        res = prune_file(code, q, threshold=0.3, language="toml")
        assert not res.has_syntax_error, f"Failed on query: {q}"
        try:
            val = tomllib.loads(res.pruned_code)
            assert isinstance(val, dict)
        except Exception as exc:
            raise AssertionError(f"Invalid TOML produced for query '{q}': {exc}\n{res.pruned_code}")


def test_toml_empty_code_and_query():
    """Test empty input and empty query handling."""
    res_empty = prune_file("", "test", threshold=0.3, language="toml")
    assert res_empty.pruned_code == ""
    assert not res_empty.has_syntax_error

    sample = '[package]\nname = "fastast"'
    res_no_query = prune_file(sample, "", threshold=0.3, language="toml")
    assert tomllib.loads(res_no_query.pruned_code) == {"package": {"name": "fastast"}}


def test_toml_syntax_error_fallback():
    """Test malformed TOML gracefully triggers syntax error fallback."""
    broken_toml = '[package\nname = "unterminated'
    res = prune_file(broken_toml, "package", threshold=0.3, language="toml")
    assert res.has_syntax_error
    assert res.pruned_code == broken_toml


def test_toml_indexing():
    """Test symbol indexing on TOML configuration files."""
    fixture_path = FIXTURES_DIR / "sample_simple.toml"
    code = fixture_path.read_text(encoding="utf-8")

    idx = index_code(code, language="toml")
    assert not idx.has_syntax_error
    assert idx.total_lines > 0

    sym_names = [s.name for s in idx.symbols]
    assert "package" in sym_names
    assert "dependencies" in sym_names
    assert "bin" in sym_names
    assert "pyo3" in sym_names

    # Imports extracted from dependencies
    import_mods = [i.module for i in idx.imports]
    assert "pyo3" in import_mods
    assert "serde_json" in import_mods


def test_toml_cli_prune():
    """Test CLI prune on TOML file with automatic language detection."""
    fixture_path = FIXTURES_DIR / "sample_simple.toml"

    cmd = [
        sys.executable,
        "-m",
        "fastast.cli",
        "prune",
        str(fixture_path),
        "-q",
        "dependencies pyo3",
        "--json",
    ]
    proc = subprocess.run(cmd, capture_output=True, text=True, check=True)
    out = json.loads(proc.stdout)
    assert out["syntax_valid"] is True
    assert not out["has_syntax_error"]

    pruned = tomllib.loads(out["pruned_code"])
    assert "dependencies" in pruned
    assert "pyo3" in pruned["dependencies"]
