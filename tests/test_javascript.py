"""Tests for JavaScript and JSX parsing, pruning, and indexing in FastAST."""

import json
import subprocess
import sys
from pathlib import Path

from fastast import index_code, prune_file

FIXTURES_DIR = Path(__file__).parent / "fixtures"


def test_js_function_pruning():
    """Test pruning regular JavaScript functions."""
    code = """
import { helper } from './utils';

export function calculateTotal(items) {
    let sum = 0;
    for (const item of items) {
        sum += item.price;
    }
    return sum;
}

export function unusedReportGenerator() {
    console.log("Generating report...");
    return { status: "done" };
}
"""
    res = prune_file(code, "calculateTotal", 0.5, language="javascript")
    assert not res.has_syntax_error
    assert "export function calculateTotal(items) {" in res.pruned_code
    assert "sum += item.price;" in res.pruned_code
    assert "export function unusedReportGenerator() {}" in res.pruned_code
    assert res.savings_pct > 0.0


def test_js_arrow_functions():
    """Test arrow functions with block and concise bodies."""
    code = """
export const computeTax = (amount, rate) => {
    const tax = amount * rate;
    return tax;
};

export const formatCurrency = (val) => `$${val.toFixed(2)}`;

export const unusedAnalytics = (event) => {
    track(event);
};
"""
    res = prune_file(code, "computeTax", 0.5, language="javascript")
    assert not res.has_syntax_error
    assert "export const computeTax = (amount, rate) => {" in res.pruned_code
    assert "return tax;" in res.pruned_code
    assert "export const unusedAnalytics = (event) => {};" in res.pruned_code


def test_js_class_and_methods():
    """Test JavaScript classes and method stubbing."""
    code = """
class PaymentProcessor extends BaseProcessor {
    constructor(config) {
        super();
        this.config = config;
    }

    async processPayment(amount) {
        this.validate(amount);
        return await this.charge(amount);
    }

    unusedCleanup() {
        this.resetBuffers();
    }
}
"""
    res = prune_file(code, "processPayment", 0.5, language="javascript")
    assert not res.has_syntax_error
    assert "class PaymentProcessor extends BaseProcessor {" in res.pruned_code
    assert "async processPayment(amount) {" in res.pruned_code
    assert "this.validate(amount);" in res.pruned_code
    assert "constructor(config) {}" in res.pruned_code
    assert "unusedCleanup() {}" in res.pruned_code


def test_jsx_components_and_hooks():
    """Test React functional component and JSX element preservation."""
    fixture_path = FIXTURES_DIR / "sample_simple.jsx"
    code = fixture_path.read_text(encoding="utf-8")

    res = prune_file(code, "TodoItem", 0.5, language="jsx")
    assert not res.has_syntax_error
    assert "export function TodoItem({ todo, onToggle, onDelete }) {" in res.pruned_code
    assert "<input" in res.pruned_code
    assert "TodoHeader" in res.pruned_code
    assert "TodoHeader = ({ title }) => {};" in res.pruned_code
    assert res.savings_pct > 0.0


def test_jsx_class_component():
    """Test React Class Component with methods in JSX."""
    fixture_path = FIXTURES_DIR / "sample_simple.jsx"
    code = fixture_path.read_text(encoding="utf-8")

    res = prune_file(code, "addTodo", 0.5, language="jsx")
    assert not res.has_syntax_error
    assert "export default class TodoApp extends React.Component {" in res.pruned_code
    assert "addTodo(text) {" in res.pruned_code
    assert "componentDidMount() {}" in res.pruned_code


def test_js_zero_semantic_match_skeleton():
    """Test zero semantic match returns full structural skeleton."""
    code = """
import { A } from './a';
import { B } from './b';

function funcA() {
    return 1;
}

function funcB() {
    return 2;
}

class Service {
    run() {
        return true;
    }
}
"""
    res = prune_file(code, "nonexistentSymbolXYZ", 0.5, language="javascript")
    assert not res.has_syntax_error
    assert "import { A } from './a';" in res.pruned_code
    assert "import { B } from './b';" in res.pruned_code
    assert "function funcA() {}" in res.pruned_code
    assert "function funcB() {}" in res.pruned_code
    assert "class Service {}" in res.pruned_code


def test_js_syntax_validity_with_node():
    """Verify pruned JavaScript syntax using Node.js."""
    fixture_path = FIXTURES_DIR / "sample_simple.js"
    code = fixture_path.read_text(encoding="utf-8")

    res = prune_file(code, "calculateSum", 0.5, language="javascript")
    assert not res.has_syntax_error

    # Verify Node.js can parse the pruned output without syntax errors
    # Wrap in function/eval check to verify syntax
    node_check = subprocess.run(
        ["node", "--check", "-"],
        input=res.pruned_code,
        capture_output=True,
        text=True,
    )
    assert node_check.returncode == 0, f"Node syntax error: {node_check.stderr}"


def test_js_symbol_indexing():
    """Test AST symbol and import extraction for JavaScript."""
    fixture_path = FIXTURES_DIR / "sample_simple.jsx"
    code = fixture_path.read_text(encoding="utf-8")

    res = index_code(code, language="jsx")
    assert not res.has_syntax_error
    assert res.total_lines > 30

    symbol_names = [s.name for s in res.symbols]
    assert "TodoHeader" in symbol_names
    assert "TodoItem" in symbol_names
    assert "TodoApp" in symbol_names
    assert "componentDidMount" in symbol_names
    assert "addTodo" in symbol_names
    assert "render" in symbol_names

    # Check symbol kinds
    arrow_syms = [s for s in res.symbols if "arrow" in s.kind]
    assert any(s.name == "TodoHeader" for s in arrow_syms)

    class_syms = [s for s in res.symbols if s.kind == "class"]
    assert any(s.name == "TodoApp" for s in class_syms)

    method_syms = [s for s in res.symbols if "method" in s.kind]
    assert any(s.name == "render" for s in method_syms)


def test_cli_prune_js():
    """Test CLI runner on JavaScript fixture."""
    fixture_path = FIXTURES_DIR / "sample_simple.js"
    result = subprocess.run(
        [
            sys.executable,
            "-m",
            "fastast.cli",
            "prune",
            str(fixture_path),
            "-q",
            "Calculator",
            "--json",
        ],
        capture_output=True,
        text=True,
    )
    assert result.returncode == 0, f"CLI failed: {result.stderr}"
    data = json.loads(result.stdout)
    assert data["syntax_valid"] is True
    assert "Calculator" in data["pruned_code"]
    assert data["savings_pct"] > 0


if __name__ == "__main__":
    test_js_function_pruning()
    test_js_arrow_functions()
    test_js_class_and_methods()
    test_jsx_components_and_hooks()
    test_jsx_class_component()
    test_js_zero_semantic_match_skeleton()
    test_js_syntax_validity_with_node()
    test_js_symbol_indexing()
    test_cli_prune_js()
    print("All 9 JavaScript & JSX tests passed successfully!")

