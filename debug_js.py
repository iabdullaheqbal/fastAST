#!/usr/bin/env python
"""Debug JavaScript pruning behavior."""

from fastast import prune_file, index_code

def test_class_methods():
    """Test JavaScript classes and method stubbing."""
    code = """class PaymentProcessor extends BaseProcessor {
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
    print("Original code:")
    print(code)
    print("\n" + "="*80 + "\n")
    
    res = prune_file(code, "processPayment", 0.5, language="javascript")
    print("Has syntax error:", res.has_syntax_error)
    print("Pruned code:")
    print(res.pruned_code)
    
    print("\n" + "="*80 + "\n")
    print('Contains "unusedCleanup() {":', 'unusedCleanup() {' in res.pruned_code)
    print('Contains "unusedCleanup() {}":', 'unusedCleanup() {}' in res.pruned_code)
    
    # Check what's actually in the pruned code
    lines = res.pruned_code.split('\n')
    for i, line in enumerate(lines):
        if 'unusedCleanup' in line:
            print(f"Line {i}: {line}")
    
    print("\n" + "="*80 + "\n")
    print("Indexing test:")
    idx = index_code(code, language="javascript")
    print(f"Symbols found: {[s.name for s in idx.symbols]}")
    for s in idx.symbols:
        print(f"  - {s.name} (kind: {s.kind}, parent: {s.parent_name})")

def test_nested_functions():
    """Test nested functions inside functions."""
    code = """export function processOrder(order) {
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
    print("\n" + "="*80 + "\n")
    print("Test nested functions:")
    print("Original code:")
    print(code)
    
    res = prune_file(code, "processOrder", 0.5, language="javascript")
    print("\nPruned code:")
    print(res.pruned_code)
    
    print("\nContains nested functions:")
    print('  "function validate(o) {":', 'function validate(o) {' in res.pruned_code)
    print('  "function calculateSubtotal(items) {":', 'function calculateSubtotal(items) {' in res.pruned_code)

if __name__ == "__main__":
    test_class_methods()
    test_nested_functions()