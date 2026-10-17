"""Tests for JavaScript and JSX parsing, pruning, and indexing in FastAST."""

import json
import subprocess
import sys
from pathlib import Path

from fastast import index_code, prune_file

FIXTURES_DIR = Path(__file__).parent / "fixtures"


def check_node_syntax(code: str):
    """Verify code is syntactically valid according to Node.js."""
    res = subprocess.run(
        ["node", "--input-type=module", "--check", "-"],
        input=code,
        capture_output=True,
        text=True,
    )
    assert res.returncode == 0, f"Node syntax error:\n{res.stderr}\nCode:\n{code}"


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
    check_node_syntax(res.pruned_code)


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
    check_node_syntax(res.pruned_code)


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
    check_node_syntax(res.pruned_code)


def test_jsx_components_and_hooks():
    """Test React functional component and JSX element preservation."""
    fixture_path = FIXTURES_DIR / "sample_simple.jsx"
    code = fixture_path.read_text(encoding="utf-8")

    res = prune_file(code, "TodoItem", 0.5, language="jsx")
    assert not res.has_syntax_error
    assert "export function TodoItem({ todo, onToggle, onDelete }) {" in res.pruned_code
    assert "<input" in res.pruned_code
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
    check_node_syntax(res.pruned_code)


def test_js_syntax_validity_with_node():
    """Verify pruned JavaScript syntax using Node.js."""
    fixture_path = FIXTURES_DIR / "sample_simple.js"
    code = fixture_path.read_text(encoding="utf-8")

    res = prune_file(code, "calculateSum", 0.5, language="javascript")
    assert not res.has_syntax_error
    check_node_syntax(res.pruned_code)


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

    method_syms = [s for s in res.symbols if "method" in s.kind or s.kind == "constructor"]
    assert any(s.name == "render" for s in method_syms)

    # Check parent_name for methods
    render_sym = next(s for s in res.symbols if s.name == "render")
    assert render_sym.parent_name == "TodoApp"


def test_multi_hop_react_component_closure():
    """Test transitive multi-hop dependency closure in React JSX:
    App -> renders <TodoList /> -> renders <TodoItem /> -> renders <TodoButton />
    """
    code = """
import React from 'react';

export const TodoButton = ({ onClick, label }) => {
    return <button onClick={onClick}>{label}</button>;
};

export const TodoItem = ({ item }) => {
    return (
        <li>
            <span>{item.text}</span>
            <TodoButton onClick={() => {}} label="Done" />
        </li>
    );
};

export const TodoList = ({ items }) => {
    return (
        <ul>
            {items.map(i => <TodoItem key={i.id} item={i} />)}
        </ul>
    );
};

export const App = () => {
    const items = [{ id: 1, text: 'Test' }];
    return (
        <div className="app">
            <h1>Todo App</h1>
            <TodoList items={items} />
        </div>
    );
};

export const UnrelatedWidget = () => {
    return <aside>Unrelated sidebar content</aside>;
};
"""
    res = prune_file(code, "App", 0.5, language="jsx")
    assert not res.has_syntax_error
    # App is kept full
    assert "export const App = () => {" in res.pruned_code
    assert '<div className="app">' in res.pruned_code
    # Multi-hop closure pulled in TodoList, TodoItem, and TodoButton full
    assert "export const TodoList = ({ items }) => {" in res.pruned_code
    assert "export const TodoItem = ({ item }) => {" in res.pruned_code
    assert "export const TodoButton = ({ onClick, label }) => {" in res.pruned_code
    # UnrelatedWidget is stubbed
    assert "export const UnrelatedWidget = () => {};" in res.pruned_code
    assert "Unrelated sidebar content" not in res.pruned_code
    assert res.savings_pct > 0.0


def test_react_custom_hook_closure():
    """Test that custom hooks referenced in components are pulled into dependency closure."""
    code = """
import React, { useState, useEffect } from 'react';

export function useAuth() {
    const [user, setUser] = useState(null);
    useEffect(() => {
        fetch('/api/user').then(r => r.json()).then(setUser);
    }, []);
    return user;
}

export function UserProfile() {
    const user = useAuth();
    if (!user) return <div>Loading...</div>;
    return <div>Welcome, {user.name}!</div>;
}

export function UnrelatedFooter() {
    return <footer>Copyright 2026</footer>;
}
"""
    res = prune_file(code, "UserProfile", 0.5, language="jsx")
    assert not res.has_syntax_error
    assert "export function UserProfile() {" in res.pruned_code
    # useAuth was pulled into closure because UserProfile references it
    assert "export function useAuth() {" in res.pruned_code
    assert "fetch('/api/user')" in res.pruned_code
    # UnrelatedFooter is stubbed
    assert "export function UnrelatedFooter() {}" in res.pruned_code
    assert "Copyright 2026" not in res.pruned_code


def test_nested_functions_and_closures():
    """Test nested functions inside functions are indexed and preserved."""
    code = """
export function processOrder(order) {
    function validate(o) {
        return o && o.items && o.items.length > 0;
    }

    function calculateSubtotal(items) {
        return items.reduce((acc, it) => acc + it.price * it.qty, 0);
    }

    if (!validate(order)) {
        throw new Error("Invalid order");
    }

    return calculateSubtotal(order.items);
}

export function unusedOrderExporter() {
    return { status: "not_exported" };
}
"""
    # Test indexing captures nested functions with parent_name
    idx = index_code(code, language="javascript")
    names = [s.name for s in idx.symbols]
    assert "processOrder" in names
    assert "validate" in names
    assert "calculateSubtotal" in names

    val_sym = next(s for s in idx.symbols if s.name == "validate")
    assert val_sym.parent_name == "processOrder"

    # Test pruning keeping processOrder
    res = prune_file(code, "processOrder", 0.5, language="javascript")
    assert not res.has_syntax_error
    assert "export function processOrder(order) {" in res.pruned_code
    assert "function validate(o) {" in res.pruned_code
    assert "function calculateSubtotal(items) {" in res.pruned_code
    assert "export function unusedOrderExporter() {}" in res.pruned_code
    check_node_syntax(res.pruned_code)


def test_companion_getters_setters_and_constructor():
    """Test getter/setter pairing and constructor preservation in classes."""
    code = """
export class BankAccount {
    constructor(initial) {
        this._balance = initial || 0;
    }

    get balance() {
        return this._balance;
    }

    set balance(val) {
        if (val < 0) throw new Error("Negative balance");
        this._balance = val;
    }

    deposit(amount) {
        this.balance = this.balance + amount;
        return this.balance;
    }

    unusedAudit() {
        console.log("Audit log");
    }
}
"""
    res = prune_file(code, "balance", 0.5, language="javascript")
    assert not res.has_syntax_error
    assert "export class BankAccount {" in res.pruned_code
    # Constructor kept as skeleton stub
    assert "constructor(initial) {}" in res.pruned_code
    # Both getter and setter are kept
    assert "get balance() {" in res.pruned_code
    assert "set balance(val) {" in res.pruned_code
    assert "unusedAudit() {}" in res.pruned_code
    check_node_syntax(res.pruned_code)


def test_concise_arrow_functions_and_hocs():
    """Test concise arrow functions and React HOCs (memo, forwardRef)."""
    code = """
import React, { memo, forwardRef } from 'react';

export const square = x => x * x;

export const MemoCard = memo(({ title }) => {
    return <div>{title}</div>;
});

export const CustomInput = forwardRef((props, ref) => {
    return <input ref={ref} {...props} />;
});

export const UnusedItem = () => <span>Unused</span>;
"""
    idx = index_code(code, language="jsx")
    names = [s.name for s in idx.symbols]
    assert "square" in names
    assert "MemoCard" in names
    assert "CustomInput" in names

    res = prune_file(code, "MemoCard", 0.5, language="jsx")
    assert not res.has_syntax_error
    assert "MemoCard = memo(({ title }) => {" in res.pruned_code
    # Concise arrow is cleanly stubbed
    assert "export const square = x => {};" in res.pruned_code
    assert "export const UnusedItem = () => {};" in res.pruned_code


def test_export_default_variations():
    """Test export default arrow, anonymous function, and class."""
    code = """
export default (x, y) => {
    const sum = x + y;
    return sum * 2;
};
"""
    res = prune_file(code, "sum", 0.5, language="javascript")
    assert not res.has_syntax_error
    assert "export default (x, y) => {" in res.pruned_code
    check_node_syntax(res.pruned_code)

    # Test stubbing on zero match
    res_zero = prune_file(code, "nonexistent", 0.5, language="javascript")
    assert not res_zero.has_syntax_error
    assert "export default (x, y) => {};" in res_zero.pruned_code
    check_node_syntax(res_zero.pruned_code)


def test_jsdoc_and_call_extraction():
    """Test JSDoc comment extraction and ExtractedCall extraction for call graphs."""
    code = """
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
"""
    res = index_code(code, language="javascript")
    assert not res.has_syntax_error

    calc_sym = next(s for s in res.symbols if s.name == "calculateDiscount")
    assert calc_sym.docstring is not None
    assert "Calculates discount price." in calc_sym.docstring

    # Check call graph extraction
    call_names = [(c.caller_name, c.callee_name) for c in res.calls]
    assert ("calculateDiscount", "validatePrice") in call_names


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
    test_multi_hop_react_component_closure()
    test_react_custom_hook_closure()
    test_nested_functions_and_closures()
    test_companion_getters_setters_and_constructor()
    test_concise_arrow_functions_and_hocs()
    test_export_default_variations()
    test_jsdoc_and_call_extraction()
    test_cli_prune_js()
    print("All 16 JavaScript & JSX tests passed successfully!")
