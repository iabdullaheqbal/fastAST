"""Tests for FastMCP server and prune_context tool."""

import json
from fastast.server import prune_context


def test_prune_context_valid():
    code = """
import os

def helper():
    return 1

def target_func():
    val = helper()
    return val
"""
    raw = prune_context(code, "target_func", 0.5)
    data = json.loads(raw)

    assert data["syntax_valid"] is True
    assert "def target_func():" in data["pruned_code"]
    assert "val = helper()" in data["pruned_code"]
    assert "def helper():" in data["pruned_code"]
    assert "pass" in data["pruned_code"]
    assert data["original_tokens"] > 0
    assert data["pruned_tokens"] > 0
    assert "latency_ms" in data


def test_prune_context_syntax_error():
    broken = "def broken(:\n    pass"
    raw = prune_context(broken, "query", 0.5)
    data = json.loads(raw)

    assert data["syntax_valid"] is False
    assert data["error"] == "PREEXISTING_SYNTAX_ERROR"
    assert data["pruned_code"] == broken
    assert data["savings_pct"] == 0.0


def test_prune_context_empty():
    raw = prune_context("", "query", 0.5)
    data = json.loads(raw)

    assert data["syntax_valid"] is True
    assert data["pruned_code"] == ""
    assert data["original_tokens"] == 0
    assert data["pruned_tokens"] == 0


if __name__ == "__main__":
    test_prune_context_valid()
    test_prune_context_syntax_error()
    test_prune_context_empty()
    print("All server tests passed!")

