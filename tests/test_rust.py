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
    print("All 9 Rust tests passed successfully!")
