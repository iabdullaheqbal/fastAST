"""Tests for JavaScript and JSX AST parsing and indexing in FastAST."""

import textwrap
from pathlib import Path
from fastast import index_code

FIXTURES_DIR = Path(__file__).parent / "fixtures"


def test_js_symbol_indexing():
    """Test AST symbol and import extraction for JavaScript."""
    if index_code is None:
        return
    fixture_path = FIXTURES_DIR / "sample_simple.jsx"
    code = fixture_path.read_text(encoding="utf-8")

    res = index_code(code, language="jsx")
    assert not res.has_syntax_error
    assert res.total_lines > 30

    symbol_names = [s.name for s in res.symbols]
    assert "todoHeader" in symbol_names
    assert "todoItem" in symbol_names
    assert "TodoApp" in symbol_names
    assert "componentDidMount" in symbol_names
    assert "addTodo" in symbol_names
    assert "render" in symbol_names

    # Check symbol kinds
    arrow_syms = [s for s in res.symbols if "arrow" in s.kind]
    assert any(s.name == "todoHeader" for s in arrow_syms)

    class_syms = [s for s in res.symbols if s.kind == "class"]
    assert any(s.name == "TodoApp" for s in class_syms)

    method_syms = [s for s in res.symbols if "method" in s.kind or s.kind == "constructor"]
    assert any(s.name == "render" for s in method_syms)

    # Check parent_name for methods
    render_sym = next(s for s in res.symbols if s.name == "render")
    assert render_sym.parent_name == "TodoApp"


def test_jsdoc_and_call_extraction():
    """Test JSDoc comment extraction and ExtractedCall extraction for call graphs."""
    if index_code is None:
        return
    code = textwrap.dedent("""\
        /**
         * Calculates discount price.
         * @param {number} price
         * @returns {number}
         */
        export function calculateDiscount(price, rate) {
            validatePrice(price);
            return price * (1 - rate);
        }

        function validatePrice(p) {
            if (p < 0) throw new Error("Negative price");
        }
    """)
    res = index_code(code, language="javascript")
    assert not res.has_syntax_error

    calc_sym = next(s for s in res.symbols if s.name == "calculateDiscount")
    assert calc_sym.docstring is not None
    assert "Calculates discount price." in calc_sym.docstring

    # Check call graph extraction
    call_names = [(c.caller_name, c.callee_name) for c in res.calls]
    assert ("calculateDiscount", "validatePrice") in call_names


if __name__ == "__main__":
    test_js_symbol_indexing()
    test_jsdoc_and_call_extraction()
    print("All JavaScript AST indexing tests passed successfully!")
