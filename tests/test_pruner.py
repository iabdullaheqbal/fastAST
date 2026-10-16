import ast
from pathlib import Path
try:
    import pytest
except ImportError:
    pytest = None
from fastast._core import prune_file

FIXTURES_DIR = Path(__file__).parent / "fixtures"

def load_fixture(name: str) -> str:
    path = FIXTURES_DIR / name
    return path.read_text(encoding="utf-8")

def test_simple_pruning():
    code = load_fixture("sample_simple.py")
    res = prune_file(code, "compute_sum", 0.3)
    
    # Verify syntax
    ast.parse(res.pruned_code)
    
    assert "import os" in res.pruned_code
    assert "from typing import List, Optional" in res.pruned_code
    assert "def compute_sum(a: int, b: int) -> int:" in res.pruned_code
    assert "return result" in res.pruned_code
    assert "def compute_product(x: int, y: int) -> int:" in res.pruned_code
    assert "pass" in res.pruned_code
    assert res.savings_pct > 0
    assert not res.has_syntax_error

def test_class_and_method_preservation():
    code = load_fixture("sample_simple.py")
    res = prune_file(code, "process_items", 0.3)
    
    # Syntax check
    ast.parse(res.pruned_code)
    
    assert "class DataProcessor:" in res.pruned_code
    assert "def process_items(self, items: List[str]) -> List[str]:" in res.pruned_code
    assert "output.append(item.strip().upper())" in res.pruned_code
    assert "def reset(self) -> None:" in res.pruned_code
    assert "pass" in res.pruned_code

def test_complex_decorators_and_async_signatures():
    code = load_fixture("sample_complex.py")
    res = prune_file(code, "fetch_remote_resource", 0.3)
    
    # Verify syntax validity
    ast.parse(res.pruned_code)
    
    assert "@retry(" in res.pruned_code
    assert "attempts=5," in res.pruned_code
    assert "@lru_cache(maxsize=128)" in res.pruned_code
    assert "async def fetch_remote_resource(" in res.pruned_code
    assert "endpoint_url: str," in res.pruned_code
    assert "retry_on_status: Optional[List[int]] = None," in res.pruned_code
    assert "-> Dict[str, Any]:" in res.pruned_code
    assert "return {\"status\": 200" in res.pruned_code
    assert not res.has_syntax_error

def test_nested_classes_and_methods():
    code = load_fixture("sample_complex.py")
    res = prune_file(code, "terminate socket_id", 0.2)
    
    ast.parse(res.pruned_code)
    assert "class ConnectionManager:" in res.pruned_code
    assert "class InternalState:" in res.pruned_code
    assert "self.active = False" in res.pruned_code
    assert "pass" in res.pruned_code

def test_zero_semantic_match_fallback():
    code = load_fixture("sample_simple.py")
    res = prune_file(code, "completely_nonexistent_token_12345", 0.5)
    
    # Must be valid Python structural skeleton
    ast.parse(res.pruned_code)
    
    # Imports kept
    assert "import os" in res.pruned_code
    assert "import sys" in res.pruned_code
    # Signatures kept
    assert "def compute_sum" in res.pruned_code
    assert "def compute_product" in res.pruned_code
    assert "class DataProcessor:" in res.pruned_code
    # All implementations replaced with pass
    assert "return result" not in res.pruned_code
    assert "total = x * y" not in res.pruned_code
    assert "pass" in res.pruned_code
    assert res.savings_pct > 30.0

def test_preexisting_syntax_error_handling():
    broken_code = "def invalid_syntax(:\n    print(123)\n"
    res = prune_file(broken_code, "query", 0.5)
    
    assert res.has_syntax_error is True
    assert res.pruned_code == broken_code
    assert res.savings_pct == 0.0

def test_latency_under_15ms():
    code = load_fixture("sample_complex.py")
    # Warmup
    prune_file(code, "test", 0.5)
    
    # Measure
    res = prune_file(code, "fetch_remote_resource", 0.5)
    print(f"Latency: {res.latency_ms:.3f}ms")
    assert res.latency_ms < 15.0


if __name__ == "__main__":
    test_simple_pruning()
    test_class_and_method_preservation()
    test_complex_decorators_and_async_signatures()
    test_nested_classes_and_methods()
    test_zero_semantic_match_fallback()
    test_preexisting_syntax_error_handling()
    test_latency_under_15ms()
    print("All pruner tests passed!")
