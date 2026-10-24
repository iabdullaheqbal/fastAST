"""Tests for Rust AST parsing and indexing in FastAST."""

import textwrap
from pathlib import Path
from fastast import index_code

FIXTURES_DIR = Path(__file__).parent / "fixtures"


def test_rust_symbol_indexing():
    """Test indexing Rust constructs into ExtractedSymbol structures."""
    if index_code is None:
        return
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


def test_rust_docstring_indexing():
    """Test extracting doc comments (/// and /** */) into ExtractedSymbol.docstring."""
    if index_code is None:
        return
    code = textwrap.dedent("""\
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
    """)
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
    if index_code is None:
        return
    code = textwrap.dedent("""\
        fn execute_flow() {
            let mut builder = QueryBuilder::new();
            builder.with_limit(10);
            run_query();
            println!("Query complete");
        }
    """)
    index_res = index_code(code, language="rust")
    assert not index_res.has_syntax_error

    calls = [(c.caller_name, c.callee_name, c.line_number) for c in index_res.calls]
    assert ("execute_flow", "new", 2) in calls
    assert ("execute_flow", "with_limit", 3) in calls
    assert ("execute_flow", "run_query", 4) in calls
    assert ("execute_flow", "println", 5) in calls


if __name__ == "__main__":
    test_rust_symbol_indexing()
    test_rust_docstring_indexing()
    test_rust_call_graph_extraction()
    print("All Rust AST indexing tests passed successfully!")
