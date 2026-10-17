"""Tests for Rust parsing, pruning, and indexing in FastAST."""

import json
import subprocess
import sys
from pathlib import Path

from fastast import index_code, prune_file

FIXTURES_DIR = Path(__file__).parent / "fixtures"


def test_rust_method_pruning_basic():
    """Test pruning Rust methods while preserving enclosing struct and impl blocks."""
    fixture_path = FIXTURES_DIR / "sample_simple.rs"
    code = fixture_path.read_text(encoding="utf-8")

    res = prune_file(code, "add", threshold=0.3, language="rust")
    assert not res.has_syntax_error

    # Enclosing struct and impl preserved
    assert "pub struct Calculator {" in res.pruned_code
    assert "impl Calculator {" in res.pruned_code

    # Matched method preserved with full implementation body
    assert "pub fn add(&mut self, a: i32, b: i32) -> i32 {" in res.pruned_code
    assert "self.result = a + b;" in res.pruned_code

    # Unmatched methods stubbed with valid Rust todo!() expression
    assert "pub fn new() -> Self { todo!() }" in res.pruned_code
    assert "pub fn subtract(&mut self, a: i32, b: i32) -> i32 { todo!() }" in res.pruned_code
    assert "pub fn get_result(&self) -> i32 { todo!() }" in res.pruned_code

    assert res.savings_pct > 0.0


def test_rust_trait_implementation_closure():
    """Test trait implementation closure where unkept trait methods are stubbed."""
    fixture_path = FIXTURES_DIR / "sample_simple.rs"
    code = fixture_path.read_text(encoding="utf-8")

    res = prune_file(code, "calculate", threshold=0.3, language="rust")
    assert not res.has_syntax_error

    # Trait definition and struct preserved
    assert "pub trait MathOperations {" in res.pruned_code
    assert "pub struct Calculator {" in res.pruned_code

    # Impl MathOperations for Calculator kept
    assert "impl MathOperations for Calculator {" in res.pruned_code

    # Matched method kept in full
    assert "fn calculate(&self, op: Operation, a: i32, b: i32) -> i32 {" in res.pruned_code
    assert "Operation::Add => a + b," in res.pruned_code

    # Sibling method stubbed to preserve trait implementation validity
    assert "fn reset(&mut self) { todo!() }" in res.pruned_code


def test_rust_module_and_free_function_pruning():
    """Test module container closure and free functions."""
    fixture_path = FIXTURES_DIR / "sample_simple.rs"
    code = fixture_path.read_text(encoding="utf-8")

    res = prune_file(code, "clamp", threshold=0.3, language="rust")
    assert not res.has_syntax_error

    # Module container preserved
    assert "pub mod utils {" in res.pruned_code
    assert "pub fn clamp(val: i32, min: i32, max: i32) -> i32 {" in res.pruned_code
    assert "min" in res.pruned_code


def test_rust_constants_and_statics():
    """Test pruning with constants and static variables."""
    code = """pub const BUFFER_SIZE: usize = 4096;
pub static GLOBAL_COUNTER: std::sync::atomic::AtomicUsize = std::sync::atomic::AtomicUsize::new(0);

pub fn use_buffer() -> usize {
    BUFFER_SIZE
}

pub fn unrelated_helper() -> bool {
    false
}
"""
    res = prune_file(code, "BUFFER_SIZE", threshold=0.3, language="rust")
    assert not res.has_syntax_error

    assert "pub const BUFFER_SIZE: usize = 4096;" in res.pruned_code
    assert "pub fn use_buffer() -> usize {" in res.pruned_code
    assert "unrelated_helper" not in res.pruned_code or "todo!()" in res.pruned_code


def test_rust_async_and_unsafe_functions():
    """Test that async and unsafe function modifiers are preserved with todo!() stubs."""
    code = """pub struct NetworkClient;

impl NetworkClient {
    pub async fn fetch_data(&self, url: &str) -> Result<String, String> {
        Ok(format!("data from {}", url))
    }

    pub unsafe fn raw_memory_access(&self, ptr: *const u8) -> u8 {
        *ptr
    }

    pub fn ping(&self) -> bool {
        true
    }
}
"""
    res = prune_file(code, "fetch_data", threshold=0.3, language="rust")
    assert not res.has_syntax_error

    # Matched async method kept with body
    assert "pub async fn fetch_data(&self, url: &str) -> Result<String, String> {" in res.pruned_code
    assert 'Ok(format!("data from {}", url))' in res.pruned_code

    # Sibling unsafe and standard methods stubbed with todo!()
    assert "pub unsafe fn raw_memory_access(&self, ptr: *const u8) -> u8 { todo!() }" in res.pruned_code
    assert "pub fn ping(&self) -> bool { todo!() }" in res.pruned_code


def test_rust_generics_and_type_aliases():
    """Test generic structs, traits with bounds, and type aliases."""
    code = """use std::fmt::Display;

pub type CustomResult<T> = Result<T, Box<dyn std::error::Error>>;

pub struct Container<T: Display> {
    pub item: T,
}

impl<T: Display> Container<T> {
    pub fn display(&self) {
        println!("{}", self.item);
    }

    pub fn get(&self) -> &T {
        &self.item
    }
}
"""
    res = prune_file(code, "display", threshold=0.3, language="rust")
    assert not res.has_syntax_error

    assert "pub struct Container<T: Display> {" in res.pruned_code
    assert "impl<T: Display> Container<T> {" in res.pruned_code
    assert "pub fn display(&self) {" in res.pruned_code
    assert "pub fn get(&self) -> &T { todo!() }" in res.pruned_code


def test_rust_zero_semantic_match_skeleton():
    """Test that zero semantic matches produce a structural skeleton with todo!() stubs."""
    fixture_path = FIXTURES_DIR / "sample_simple.rs"
    code = fixture_path.read_text(encoding="utf-8")

    res = prune_file(code, "nonexistent_term_xyz", threshold=0.5, language="rust")
    assert not res.has_syntax_error

    # Uses preserved
    assert "use std::collections::HashMap;" in res.pruned_code

    # Structs and enums preserved
    assert "pub struct Calculator" in res.pruned_code
    assert "pub enum Operation" in res.pruned_code

    # Methods stubbed with todo!()
    assert "pub fn add(&mut self, a: i32, b: i32) -> i32 { todo!() }" in res.pruned_code
    assert "pub fn subtract(&mut self, a: i32, b: i32) -> i32 { todo!() }" in res.pruned_code

    # Bodies not in output
    assert "self.result = a + b;" not in res.pruned_code
    assert res.savings_pct > 0.0


def test_rust_symbol_indexing():
    """Test indexing Rust constructs into ExtractedSymbol structures."""
    fixture_path = FIXTURES_DIR / "sample_simple.rs"
    code = fixture_path.read_text(encoding="utf-8")

    index_res = index_code(code, language="rust")
    assert not index_res.has_syntax_error
    assert len(index_res.symbols) >= 10

    sym_dict = {s.name: s for s in index_res.symbols}

    assert "Calculator" in sym_dict
    assert sym_dict["Calculator"].kind == "struct"

    assert "Operation" in sym_dict
    assert sym_dict["Operation"].kind == "enum"

    assert "MathOperations" in sym_dict
    assert sym_dict["MathOperations"].kind == "trait"

    assert "add" in sym_dict
    assert sym_dict["add"].kind == "method"
    assert sym_dict["add"].parent_name == "Calculator"

    assert "clamp" in sym_dict
    assert sym_dict["clamp"].kind == "function"
    assert sym_dict["clamp"].parent_name == "utils"

    assert len(index_res.imports) >= 2
    assert any("HashMap" in imp.module for imp in index_res.imports)


def test_cli_prune_rust():
    """Test CLI fastast prune on a Rust file with --json output."""
    fixture_path = FIXTURES_DIR / "sample_simple.rs"
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
    assert "pub fn add" in data["pruned_code"]
    assert "todo!()" in data["pruned_code"]
    assert data["savings_pct"] > 0
    assert data["latency_ms"] < 25.0


def test_rust_derive_and_outer_attributes_preservation():
    """Test that #[derive(...)] and other outer attributes are preserved on kept items and removed on unkept ones."""
    code = """
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct User {
    pub id: u64,
    pub name: String,
}

#[derive(Debug, Clone)]
pub struct UnusedRecord {
    pub value: String,
}

impl User {
    #[inline]
    pub fn get_id(&self) -> u64 {
        self.id
    }

    pub fn reset(&mut self) {
        self.id = 0;
    }
}
"""
    res = prune_file(code, "User", threshold=0.3, language="rust")
    assert not res.has_syntax_error
    assert "#[derive(Debug, Clone, Serialize)]" in res.pruned_code
    assert '#[serde(rename_all = "camelCase")]' in res.pruned_code
    assert "pub struct User {" in res.pruned_code
    assert "UnusedRecord" not in res.pruned_code

    # Pruning for get_id preserves #[inline]
    res_fn = prune_file(code, "get_id", threshold=0.3, language="rust")
    assert not res_fn.has_syntax_error
    assert "#[inline]" in res_fn.pruned_code
    assert "pub fn get_id(&self) -> u64 {" in res_fn.pruned_code
    assert "self.id" in res_fn.pruned_code
    assert "pub fn reset(&mut self) { todo!() }" in res_fn.pruned_code


def test_rust_relative_indentation_preservation():
    """Test that nested control flow constructs maintain exact relative indentation inside methods."""
    code = """
pub struct Engine;

impl Engine {
    pub fn execute(&self, val: i32) -> i32 {
        if val > 0 {
            match val {
                1 => 10,
                2 => {
                    let y = val * 2;
                    y + 5
                }
                _ => 100,
            }
        } else {
            0
        }
    }

    pub fn other(&self) -> i32 {
        999
    }
}
"""
    res = prune_file(code, "execute", threshold=0.3, language="rust")
    assert not res.has_syntax_error
    assert "    pub fn execute(&self, val: i32) -> i32 {" in res.pruned_code
    assert "        if val > 0 {" in res.pruned_code
    assert "            match val {" in res.pruned_code
    assert "                1 => 10," in res.pruned_code
    assert "                2 => {" in res.pruned_code
    assert "                    let y = val * 2;" in res.pruned_code
    assert "    pub fn other(&self) -> i32 { todo!() }" in res.pruned_code


def test_rust_constructor_companion_closure():
    """Test that inherent impl constructors (new, default, etc.) are kept as skeletons when a method is kept full."""
    code = """
pub struct Storage {
    data: Vec<u8>,
}

impl Storage {
    pub fn new() -> Self {
        Self { data: Vec::new() }
    }

    pub fn write_payload(&mut self, payload: &[u8]) {
        self.data.extend_from_slice(payload);
    }

    pub fn clear(&mut self) {
        self.data.clear();
    }
}
"""
    res = prune_file(code, "write_payload", threshold=0.3, language="rust")
    assert not res.has_syntax_error
    assert "pub struct Storage {" in res.pruned_code
    assert "pub fn new() -> Self { todo!() }" in res.pruned_code
    assert "pub fn write_payload(&mut self, payload: &[u8]) {" in res.pruned_code
    assert "self.data.extend_from_slice(payload);" in res.pruned_code
    assert "pub fn clear(&mut self) { todo!() }" in res.pruned_code


def test_rust_getter_setter_companion_pairing():
    """Test that getter and setter methods are paired as companions."""
    code = """
pub struct BankAccount {
    balance: i64,
}

impl BankAccount {
    pub fn balance(&self) -> i64 {
        self.balance
    }

    pub fn set_balance(&mut self, amount: i64) {
        self.balance = amount;
    }

    pub fn unrelated_audit(&self) -> bool {
        true
    }
}
"""
    res = prune_file(code, "balance", threshold=0.3, language="rust")
    assert not res.has_syntax_error
    assert "pub fn balance(&self) -> i64 {" in res.pruned_code
    assert "pub fn set_balance(&mut self, amount: i64) {" in res.pruned_code or "pub fn set_balance" in res.pruned_code
    assert "unrelated_audit" not in res.pruned_code or "todo!()" in res.pruned_code


def test_rust_multi_hop_dependency_closure():
    """Test multi-hop transitive closure: task calls helper, helper references struct."""
    code = """
pub struct DatabaseConfig {
    pub url: String,
}

pub fn db_helper(cfg: &DatabaseConfig) -> String {
    format!("Connecting to {}", cfg.url)
}

pub fn start_worker() -> String {
    let cfg = DatabaseConfig { url: "postgres://localhost/db".to_string() };
    db_helper(&cfg)
}

pub fn unused_standalone() {
    println!("not needed");
}
"""
    res = prune_file(code, "start_worker", threshold=0.3, language="rust")
    assert not res.has_syntax_error
    assert "pub struct DatabaseConfig {" in res.pruned_code
    assert "pub fn db_helper(cfg: &DatabaseConfig) -> String {" in res.pruned_code
    assert "pub fn start_worker() -> String {" in res.pruned_code
    assert "unused_standalone" not in res.pruned_code


def test_rust_docstring_indexing():
    """Test extracting doc comments (/// and /** */) into ExtractedSymbol.docstring."""
    code = """
/// Service managing user sessions.
pub struct SessionService {
    timeout: u32,
}

impl SessionService {
    /// Validates whether the given session token is active.
    pub fn is_valid(&self, token: &str) -> bool {
        !token.is_empty()
    }

    /**
     * Terminate the given session.
     */
    pub fn terminate(&mut self, token: &str) {
        // no-op
    }
}
"""
    index_res = index_code(code, language="rust")
    assert not index_res.has_syntax_error

    sym_dict = {s.name: s for s in index_res.symbols}
    assert "SessionService" in sym_dict
    assert sym_dict["SessionService"].docstring == "Service managing user sessions."

    assert "is_valid" in sym_dict
    assert sym_dict["is_valid"].docstring == "Validates whether the given session token is active."
    assert sym_dict["is_valid"].parent_name == "SessionService"

    assert "terminate" in sym_dict
    assert "Terminate the given session." in (sym_dict["terminate"].docstring or "")


def test_rust_call_graph_extraction():
    """Test call graph extraction for scoped calls, method calls, free functions, and macros."""
    code = """
fn execute_flow() {
    let mut builder = QueryBuilder::new();
    builder.with_limit(10);
    run_query();
    println!("Query complete");
}
"""
    index_res = index_code(code, language="rust")
    assert not index_res.has_syntax_error

    calls = [(c.caller_name, c.callee_name, c.line_number) for c in index_res.calls]
    assert ("execute_flow", "new", 3) in calls
    assert ("execute_flow", "with_limit", 4) in calls
    assert ("execute_flow", "run_query", 5) in calls
    assert ("execute_flow", "println", 6) in calls


if __name__ == "__main__":
    test_rust_method_pruning_basic()
    test_rust_trait_implementation_closure()
    test_rust_module_and_free_function_pruning()
    test_rust_constants_and_statics()
    test_rust_async_and_unsafe_functions()
    test_rust_generics_and_type_aliases()
    test_rust_zero_semantic_match_skeleton()
    test_rust_symbol_indexing()
    test_cli_prune_rust()
    test_rust_derive_and_outer_attributes_preservation()
    test_rust_relative_indentation_preservation()
    test_rust_constructor_companion_closure()
    test_rust_getter_setter_companion_pairing()
    test_rust_multi_hop_dependency_closure()
    test_rust_docstring_indexing()
    test_rust_call_graph_extraction()
    print("All 16 Rust tests passed successfully!")
