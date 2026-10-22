"""Tests for TOML AST parsing and indexing in FastAST."""

from pathlib import Path
from fastast import index_code

FIXTURES_DIR = Path(__file__).parent / "fixtures"


def test_toml_indexing():
    """Test symbol and dependency indexing on TOML configuration files."""
    if index_code is None:
        return
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


def test_toml_syntax_error():
    """Test malformed TOML gracefully sets syntax error flag."""
    if index_code is None:
        return
    broken_toml = '[package\nname = "unterminated'
    idx = index_code(broken_toml, language="toml")
    assert idx.has_syntax_error is True


if __name__ == "__main__":
    test_toml_indexing()
    test_toml_syntax_error()
    print("All TOML AST indexing tests passed successfully!")
