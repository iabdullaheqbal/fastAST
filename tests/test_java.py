"""Tests for Java parsing, pruning, and indexing in FastAST."""

import json
import subprocess
import sys
from pathlib import Path

import fastast
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


def test_java_abstract_class_and_methods():
    """Test Java abstract class with abstract methods (must terminate with ;) and concrete methods."""
    code = """package com.example.service;

public abstract class BaseProcessor<T> {
    public abstract T process(T input);

    public boolean isValid(T input) {
        return input != null;
    }

    public void execute(T input) {
        if (isValid(input)) {
            process(input);
        }
    }
}
"""
    res = fastast.prune_file(code, "isValid", threshold=0.5, language="java")
    assert not res.has_syntax_error

    # Abstract method preserved without invalid body
    assert "public abstract T process(T input);" in res.pruned_code
    assert "process(T input) {" not in res.pruned_code

    # Matched method preserved
    assert "public boolean isValid(T input) {" in res.pruned_code
    assert "return input != null;" in res.pruned_code

    # Unmatched concrete method stubbed
    assert "public void execute(T input) {}" in res.pruned_code

    reparse = fastast.prune_file(res.pruned_code, "isValid", threshold=0.5, language="java")
    assert not reparse.has_syntax_error


def test_java_deep_transitive_dependency_closure():
    """Test multi-hop transitive dependency closure across classes, interfaces, and enums."""
    code = """package com.example.app;

public enum OrderStatus {
    PENDING, COMPLETED, CANCELLED
}

public class Order {
    private OrderStatus status;

    public OrderStatus getStatus() {
        return status;
    }
}

public interface OrderRepository {
    Order findById(String id);
}

public class OrderService {
    private OrderRepository repo;

    public Order getOrder(String id) {
        return repo.findById(id);
    }

    public void unneededServiceMethod() {
        System.out.println("not used");
    }
}

public class OrderController {
    private OrderService service;

    public Order show(String id) {
        return service.getOrder(id);
    }

    public void unneededControllerMethod() {
        System.out.println("also not used");
    }
}
"""
    res = fastast.prune_file(code, "show", threshold=0.5, language="java")
    assert not res.has_syntax_error

    # Controller kept with show implementation
    assert "public class OrderController {" in res.pruned_code
    assert "return service.getOrder(id);" in res.pruned_code
    assert "public void unneededControllerMethod() {}" in res.pruned_code

    # Service referenced by controller kept as skeleton with field and stubbed methods
    assert "public class OrderService {" in res.pruned_code
    assert "private OrderRepository repo;" in res.pruned_code

    # Repository interface referenced by service kept
    assert "public interface OrderRepository {" in res.pruned_code
    assert "Order findById(String id);" in res.pruned_code

    # Order class referenced by repository kept
    assert "public class Order {" in res.pruned_code

    # OrderStatus enum referenced by Order kept with constants
    assert "public enum OrderStatus {" in res.pruned_code
    assert "PENDING, COMPLETED, CANCELLED;" in res.pruned_code

    reparse = fastast.prune_file(res.pruned_code, "show", threshold=0.5, language="java")
    assert not reparse.has_syntax_error


def test_java_getter_setter_companion_pairing():
    """Test JavaBeans getter/setter companion pairing."""
    code = """package com.example;

public class Account {
    private int balance;
    private boolean active;

    public int getBalance() {
        return this.balance;
    }

    public void setBalance(int balance) {
        this.balance = balance;
    }

    public boolean isActive() {
        return this.active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public void auditLog() {
        System.out.println("Auditing account...");
    }
}
"""
    res = fastast.prune_file(code, "getBalance", threshold=0.5, language="java")
    assert not res.has_syntax_error

    # Both getter and setter for balance kept full
    assert "public int getBalance() {" in res.pruned_code
    assert "return this.balance;" in res.pruned_code
    assert "public void setBalance(int balance) {" in res.pruned_code
    assert "this.balance = balance;" in res.pruned_code

    # Other property methods stubbed with appropriate return type
    assert "public boolean isActive() { return false; }" in res.pruned_code
    assert "public void setActive(boolean active) {}" in res.pruned_code
    assert "public void auditLog() {}" in res.pruned_code

    reparse = fastast.prune_file(res.pruned_code, "getBalance", threshold=0.5, language="java")
    assert not reparse.has_syntax_error


def test_java_enum_with_methods_and_constants():
    """Test enums with constants and member methods."""
    code = """package com.example.math;

public enum Operation {
    PLUS("+") {
        public double apply(double x, double y) { return x + y; }
    },
    MINUS("-") {
        public double apply(double x, double y) { return x - y; }
    };

    private final String symbol;

    Operation(String symbol) {
        this.symbol = symbol;
    }

    public String getSymbol() {
        return this.symbol;
    }

    public void unusedHelper() {
        System.out.println("helper");
    }
}
"""
    res = fastast.prune_file(code, "getSymbol", threshold=0.5, language="java")
    assert not res.has_syntax_error

    # Constants block preserved before methods
    assert "PLUS(\"+\")" in res.pruned_code
    assert "MINUS(\"-\")" in res.pruned_code

    # Matched method kept
    assert "public String getSymbol() {" in res.pruned_code
    assert "return this.symbol;" in res.pruned_code

    # Unmatched helper method stubbed
    assert "public void unusedHelper() {}" in res.pruned_code

    reparse = fastast.prune_file(res.pruned_code, "getSymbol", threshold=0.5, language="java")
    assert not reparse.has_syntax_error


def test_java_overloads():
    """Test constructors and method overloads."""
    code = """package com.example.model;

public class User {
    private String id;
    private String email;

    public User(String id) {
        this.id = id;
        this.email = "default@example.com";
    }

    public User(String id, String email) {
        this.id = id;
        this.email = email;
    }

    public void log(String msg) {
        System.out.println("INFO: " + msg);
    }

    public void log(String msg, int level) {
        System.out.println("LEVEL " + level + ": " + msg);
    }
}
"""
    res = fastast.prune_file(code, "log level", threshold=0.3, language="java")
    assert not res.has_syntax_error

    # Constructors kept as skeletons
    assert "public User(String id) {}" in res.pruned_code
    assert "public User(String id, String email) {}" in res.pruned_code

    # Overloaded methods matched
    assert "public void log(String msg, int level) {" in res.pruned_code
    assert "LEVEL " in res.pruned_code

    reparse = fastast.prune_file(res.pruned_code, "log level", threshold=0.3, language="java")
    assert not reparse.has_syntax_error


def test_java_interface_default_and_static_methods():
    """Test Java interfaces with abstract, default, and static methods."""
    code = """package com.example.service;

public interface Greeter {
    void greet(String name);

    default String formatName(String name) {
        return name != null ? name.trim().toUpperCase() : "ANONYMOUS";
    }

    static Greeter createDefault() {
        return null;
    }
}
"""
    res = fastast.prune_file(code, "formatName", threshold=0.5, language="java")
    assert not res.has_syntax_error

    # Abstract method preserved with semicolon
    assert "void greet(String name);" in res.pruned_code

    # Default method kept full
    assert "default String formatName(String name) {" in res.pruned_code
    assert "return name != null ? name.trim().toUpperCase() : \"ANONYMOUS\";" in res.pruned_code

    # Static method stubbed with return type
    assert "static Greeter createDefault() { return null; }" in res.pruned_code

    reparse = fastast.prune_file(res.pruned_code, "formatName", threshold=0.5, language="java")
    assert not reparse.has_syntax_error


def test_java_docstring_and_call_graph_indexing():
    """Test Javadoc extraction and static call graph extraction."""
    code = """package com.example;

/**
 * Service for handling user authentication.
 */
public class AuthService {
    private String secretKey;

    /**
     * Authenticates a user.
     */
    public boolean login(String username, String password) {
        String hash = hashPassword(password);
        return verify(hash);
    }

    private String hashPassword(String raw) {
        return raw + secretKey;
    }

    private boolean verify(String hash) {
        return hash != null;
    }
}
"""
    res = fastast.index_code(code, language="java")
    assert not res.has_syntax_error

    sym_map = {s.name: s for s in res.symbols}
    assert "AuthService" in sym_map
    assert sym_map["AuthService"].docstring == "Service for handling user authentication."

    assert "login" in sym_map
    assert sym_map["login"].docstring == "Authenticates a user."
    assert sym_map["login"].parent_name == "AuthService"

    assert "hashPassword" in sym_map
    assert sym_map["hashPassword"].parent_name == "AuthService"

    call_pairs = [(c.caller_name, c.callee_name) for c in res.calls]
    assert ("login", "hashPassword") in call_pairs
    assert ("login", "verify") in call_pairs


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
    test_java_abstract_class_and_methods()
    test_java_deep_transitive_dependency_closure()
    test_java_getter_setter_companion_pairing()
    test_java_enum_with_methods_and_constants()
    test_java_overloads()
    test_java_interface_default_and_static_methods()
    test_java_docstring_and_call_graph_indexing()
    print("All 16 Java tests passed successfully!")
