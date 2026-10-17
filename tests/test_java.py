"""Tests for Java parsing, pruning, and indexing in FastAST."""

import json
import subprocess
import sys
from pathlib import Path

from fastast import index_code, prune_file

FIXTURES_DIR = Path(__file__).parent / "fixtures"


def test_java_method_pruning_basic():
    """Test pruning Java methods while preserving package, imports, and field declarations."""
    fixture_path = FIXTURES_DIR / "sample_simple.java"
    code = fixture_path.read_text(encoding="utf-8")

    res = prune_file(code, "add", threshold=0.5, language="java")
    assert not res.has_syntax_error

    # Package and imports preserved
    assert "package com.example;" in res.pruned_code
    assert "import java.util.ArrayList;" in res.pruned_code
    assert "import java.util.List;" in res.pruned_code

    # Class container preserved
    assert "public class Calculator {" in res.pruned_code
    assert "private int result;" in res.pruned_code

    # Matched method preserved with full implementation body
    assert "public int add(int a, int b) {" in res.pruned_code
    assert "result = a + b;" in res.pruned_code

    # Unmatched methods stubbed with valid Java return statements
    assert "public int subtract(int a, int b) { return 0; }" in res.pruned_code
    assert "public int getResult() { return 0; }" in res.pruned_code
    assert res.savings_pct > 0.0


def test_java_multiple_query_match():
    """Test matching multiple methods simultaneously in Java."""
    code = """package com.example.io;

import java.io.File;

public class FileManager {
    public void saveFile(String path, byte[] data) {
        System.out.println("Saving: " + path);
    }

    public byte[] loadFile(String path) {
        System.out.println("Loading: " + path);
        return new byte[0];
    }

    public boolean deleteFile(String path) {
        System.out.println("Deleting: " + path);
        return true;
    }
}
"""
    res = prune_file(code, "save load", threshold=0.3, language="java")
    assert not res.has_syntax_error

    # Both saveFile and loadFile kept in full
    assert "public void saveFile(String path, byte[] data) {" in res.pruned_code
    assert "System.out.println(\"Saving: \" + path);" in res.pruned_code
    assert "public byte[] loadFile(String path) {" in res.pruned_code
    assert "System.out.println(\"Loading: \" + path);" in res.pruned_code

    # deleteFile stubbed
    assert "public boolean deleteFile(String path) { return false; }" in res.pruned_code


def test_java_interface_and_generics():
    """Test Java interfaces with generic bounds and abstract methods."""
    code = """package com.example.repo;

import java.util.List;
import java.util.Optional;

public interface CrudRepository<T, ID> {
    Optional<T> findById(ID id);
    List<T> findAll();
    <S extends T> S save(S entity);
    void deleteById(ID id);
}
"""
    res = prune_file(code, "findById", threshold=0.5, language="java")
    assert not res.has_syntax_error

    # Interface header and signatures preserved with semicolons
    assert "public interface CrudRepository<T, ID> {" in res.pruned_code
    assert "Optional<T> findById(ID id);" in res.pruned_code
    assert "void deleteById(ID id);" in res.pruned_code


def test_java_enum_and_record():
    """Test Java enums and records."""
    code = """package com.example.model;

public enum Role {
    ADMIN, USER, GUEST;
}

public record UserDto(String id, String username, Role role) {
    public boolean isAdmin() {
        return role == Role.ADMIN;
    }
}
"""
    res = prune_file(code, "isAdmin", threshold=0.5, language="java")
    assert not res.has_syntax_error

    # Referenced Role enum preserved by dependency closure
    assert "public enum Role {" in res.pruned_code
    assert "public record UserDto(String id, String username, Role role) {" in res.pruned_code
    assert "public boolean isAdmin() {" in res.pruned_code


def test_java_nested_class():
    """Test Java inner / nested static classes."""
    code = """package com.example.tree;

public class BinaryTree {
    private Node root;

    public static class Node {
        public int val;
        public Node left;
        public Node right;

        public Node(int val) {
            this.val = val;
        }
    }

    public void insert(int val) {
        this.root = new Node(val);
    }

    public void unusedClear() {
        this.root = null;
    }
}
"""
    res = prune_file(code, "insert", threshold=0.5, language="java")
    assert not res.has_syntax_error

    # Outer class and insert kept
    assert "public class BinaryTree {" in res.pruned_code
    assert "public void insert(int val) {" in res.pruned_code
    # Inner class Node preserved by dependency closure because insert references Node
    assert "public static class Node {" in res.pruned_code
    # Unmatched method stubbed
    assert "public void unusedClear() {}" in res.pruned_code


def test_java_zero_semantic_match_skeleton():
    """Test zero semantic match produces structural skeleton."""
    code = """package com.example.service;

import java.util.Map;
import java.util.HashMap;

public class ConfigService {
    private Map<String, String> cache = new HashMap<>();

    public ConfigService() {
        this.cache.put("default", "val");
    }

    public String getConfig(String key) {
        return this.cache.get(key);
    }

    public boolean hasConfig(String key) {
        return this.cache.containsKey(key);
    }
}
"""
    res = prune_file(code, "nonExistentSearchQueryXYZ999", threshold=0.5, language="java")
    assert not res.has_syntax_error

    # Package and imports kept
    assert "package com.example.service;" in res.pruned_code
    assert "import java.util.Map;" in res.pruned_code

    # Class skeleton kept with field and stubbed methods
    assert "public class ConfigService {" in res.pruned_code
    assert "private Map<String, String> cache = new HashMap<>();" in res.pruned_code
    assert "public ConfigService() {}" in res.pruned_code
    assert "public String getConfig(String key) { return null; }" in res.pruned_code
    assert "public boolean hasConfig(String key) { return false; }" in res.pruned_code
    assert "this.cache.put" not in res.pruned_code


def test_java_symbol_indexing():
    """Test AST symbol extraction for Java source code."""
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


def test_java_syntax_reparse_validation():
    """Verify that pruned Java outputs are valid Tree-Sitter Java ASTs."""
    fixture_path = FIXTURES_DIR / "sample_simple.java"
    code = fixture_path.read_text(encoding="utf-8")

    res = prune_file(code, "add", threshold=0.5, language="java")
    assert not res.has_syntax_error

    # Re-parsing the pruned code must succeed with 0 syntax errors
    reparse = prune_file(res.pruned_code, "add", threshold=0.5, language="java")
    assert not reparse.has_syntax_error


def test_cli_prune_java():
    """Test CLI runner on Java source with auto-detected language."""
    fixture_path = FIXTURES_DIR / "sample_simple.java"
    result = subprocess.run(
        [
            sys.executable,
            "-m",
            "fastast.cli",
            "prune",
            str(fixture_path),
            "-q",
            "add",
            "--json",
        ],
        capture_output=True,
        text=True,
    )
    assert result.returncode == 0, f"CLI failed: {result.stderr}"
    data = json.loads(result.stdout)
    assert data["syntax_valid"] is True
    assert "add(int a, int b)" in data["pruned_code"]
    assert data["savings_pct"] > 0
    assert data["latency_ms"] < 25.0


if __name__ == "__main__":
    test_java_method_pruning_basic()
    test_java_multiple_query_match()
    test_java_interface_and_generics()
    test_java_enum_and_record()
    test_java_nested_class()
    test_java_zero_semantic_match_skeleton()
    test_java_symbol_indexing()
    test_java_syntax_reparse_validation()
    test_cli_prune_java()
    print("All 9 Java tests passed successfully!")
