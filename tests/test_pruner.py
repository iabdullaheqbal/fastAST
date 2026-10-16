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


def test_large_benchmark_1500_lines():
    code = load_fixture("sample_large.py")
    lines_count = len(code.splitlines())
    assert lines_count >= 1500, f"Expected 1500+ lines, got {lines_count}"

    # Warmup
    for _ in range(2):
        prune_file(code, "warmup", 0.5)

    # Benchmark test on realistic query (best of 3 runs to account for OS scheduling jitter)
    runs = [prune_file(code, "process_request", 0.5) for _ in range(3)]
    res = min(runs, key=lambda r: r.latency_ms)

    # Verify syntax validity
    ast.parse(res.pruned_code)
    assert not res.has_syntax_error

    # Verify target function and imports are preserved
    assert "class RequestProcessingEngine:" in res.pruned_code
    assert "def process_request(" in res.pruned_code
    assert "import abc" in res.pruned_code
    assert "import asyncio" in res.pruned_code
    assert "class EnterpriseWorkerHandler" in res.pruned_code
    assert "pass" in res.pruned_code

    # Verify latency < 15ms
    print(f"Large fixture latency: {res.latency_ms:.3f}ms")
    assert res.latency_ms < 15.0, f"Expected <15ms latency, got {res.latency_ms:.3f}ms"

    # Verify token savings > 60%
    print(f"Large fixture savings: {res.savings_pct:.2f}%")
    assert res.savings_pct > 60.0, f"Expected >60% savings, got {res.savings_pct:.2f}%"


def test_try_except_finally_companion_closure():
    code = """
import logging

def execute_network_call(url: str):
    logger = logging.getLogger("net")
    try:
        response = fetch_raw_data(url)
    except ConnectionError as err:
        logger.error(err)
        return None
    finally:
        cleanup_sockets()
"""
    # Query targets line in try block
    res_try = prune_file(code, "fetch_raw_data", 0.5)
    ast.parse(res_try.pruned_code)
    assert not res_try.has_syntax_error
    assert "try:" in res_try.pruned_code
    assert "response = fetch_raw_data(url)" in res_try.pruned_code
    # Must have companion except or finally to be valid Python
    assert "except ConnectionError as err:" in res_try.pruned_code
    assert "pass" in res_try.pruned_code

    # Query targets line in except block
    res_exc = prune_file(code, "cleanup_sockets", 0.5)
    ast.parse(res_exc.pruned_code)
    assert not res_exc.has_syntax_error
    assert "try:" in res_exc.pruned_code
    assert "finally:" in res_exc.pruned_code
    assert "cleanup_sockets()" in res_exc.pruned_code


def test_if_else_companion_closure():
    code = """
def route_priority(level: int) -> str:
    if level > 10:
        return "CRITICAL_FLOW"
    else:
        return "STANDARD_FLOW"
"""
    # Query targets else block
    res = prune_file(code, "STANDARD_FLOW", 0.5)
    ast.parse(res.pruned_code)
    assert not res.has_syntax_error
    # Companion if must be kept even though its body was not matched
    assert "if level > 10:" in res.pruned_code
    assert "pass" in res.pruned_code
    assert "else:" in res.pruned_code
    assert 'return "STANDARD_FLOW"' in res.pruned_code


def test_symbol_definition_closure():
    code = """
def process_data_pipeline(source: str):
    raw_buffer = load_raw_buffer(source)
    transformed_records = transform(raw_buffer)
    persist_records(transformed_records)
"""
    # Query targets only the final persistence call
    res = prune_file(code, "persist_records", 0.5)
    ast.parse(res.pruned_code)
    assert not res.has_syntax_error
    assert "persist_records(transformed_records)" in res.pruned_code
    # Symbol definition closure must retain transformed_records definition
    assert "transformed_records = transform(raw_buffer)" in res.pruned_code
    # Transitive definition: raw_buffer definition must also be kept
    assert "raw_buffer = load_raw_buffer(source)" in res.pruned_code


def test_control_flow_with_and_for_closure():
    code = """
def parse_logs(file_path: str):
    with open(file_path) as log_file:
        for line in log_file:
            emit_telemetry_event(line)
"""
    res = prune_file(code, "emit_telemetry_event", 0.5)
    ast.parse(res.pruned_code)
    assert not res.has_syntax_error
    assert "with open(file_path) as log_file:" in res.pruned_code
    assert "for line in log_file:" in res.pruned_code
    assert "emit_telemetry_event(line)" in res.pruned_code


def test_module_level_symbol_dependency():
    code = """
DEFAULT_TIMEOUT_SEC: int = 45

def worker_routine():
    wait_time = DEFAULT_TIMEOUT_SEC
    return wait_time

def unused_routine():
    pass
"""
    res = prune_file(code, "worker_routine", 0.5)
    ast.parse(res.pruned_code)
    assert not res.has_syntax_error
    assert "DEFAULT_TIMEOUT_SEC: int = 45" in res.pruned_code
    assert "def worker_routine():" in res.pruned_code
    assert "wait_time = DEFAULT_TIMEOUT_SEC" in res.pruned_code


if __name__ == "__main__":
    test_simple_pruning()
    test_class_and_method_preservation()
    test_complex_decorators_and_async_signatures()
    test_nested_classes_and_methods()
    test_zero_semantic_match_fallback()
    test_preexisting_syntax_error_handling()
    test_latency_under_15ms()
    test_large_benchmark_1500_lines()
    test_try_except_finally_companion_closure()
    test_if_else_companion_closure()
    test_symbol_definition_closure()
    test_control_flow_with_and_for_closure()
    test_module_level_symbol_dependency()
    print("All 13 pruner tests passed!")
