"""Tests for Java AST parsing and indexing in FastAST."""

from pathlib import Path
import fastast
from fastast import index_code

FIXTURES_DIR = Path(__file__).parent / "fixtures"


def test_java_symbol_indexing():
    """Test AST symbol extraction for Java source code."""
    if index_code is None:
        return
    fixture_path = FIXTURES_DIR / "sample_simple.java"
    code = fixture_path.read_text(encoding="utf-8")

    res = index_code(code, language="java")
    assert not res.has_syntax_error
    assert res.total_lines > 25

    symbol_names = [s.name for s in res.symbols]
    assert "Calculator" in symbol_names
    assert "add" in symbol_names
    assert "subtract" in symbol_names
    assert "getResult" in symbol_names
    assert "main" in symbol_names

    # Check symbol kinds
    class_syms = [s for s in res.symbols if s.kind == "class"]
    assert any(s.name == "Calculator" for s in class_syms)

    method_syms = [s for s in res.symbols if "method" in s.kind]
    assert any(s.name == "add" for s in method_syms)
    assert any(s.name == "subtract" for s in method_syms)


def test_java_interface_and_generics():
    """Test Java Repository contract and generics indexing."""
    if index_code is None:
        return
    code = """package com.example;

import java.util.List;

public interface Repository<T> {
    T findById(String id);
    List<T> findAll();
}
"""
    res = index_code(code, language="java")
    assert not res.has_syntax_error
    sym_names = [s.name for s in res.symbols]
    assert "Repository" in sym_names
    assert "findById" in sym_names
    assert "findAll" in sym_names


def test_java_enum_and_record():
    """Test Java enum and record indexing."""
    if index_code is None:
        return
    code = """package com.example;

public enum Status {
    ACTIVE, INACTIVE, PENDING;
}

public record UserDto(String name, int age) {}
"""
    res = index_code(code, language="java")
    assert not res.has_syntax_error
    sym_names = [s.name for s in res.symbols]
    assert "Status" in sym_names
    assert "UserDto" in sym_names


if __name__ == "__main__":
    test_java_symbol_indexing()
    test_java_interface_and_generics()
    test_java_enum_and_record()
    print("All Java AST indexing tests passed successfully!")
