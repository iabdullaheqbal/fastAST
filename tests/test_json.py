"""Tests for JSON AST parsing and indexing in FastAST."""

from pathlib import Path
from fastast import index_code

FIXTURES_DIR = Path(__file__).parent / "fixtures"


def test_json_indexing():
    """Test symbol and dependency indexing on JSON documents."""
    if index_code is None:
        return
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


def test_json_syntax_error():
    """Test malformed JSON gracefully sets syntax error flag."""
    if index_code is None:
        return
    broken_json = '{"key": "unterminated string'
    idx = index_code(broken_json, language="json")
    assert idx.has_syntax_error is True


if __name__ == "__main__":
    test_json_indexing()
    test_json_syntax_error()
    print("All JSON AST indexing tests passed successfully!")
