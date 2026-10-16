"""Tests for Python wrapper layers (CLI and MCP server interfaces)."""

import json
import subprocess
import sys
from pathlib import Path

import pytest


FIXTURES_DIR = Path(__file__).parent / "fixtures"


def test_cli_prune_json_output():
    """Test CLI prune command with JSON output."""
    fixture = FIXTURES_DIR / "sample_simple.py"
    
    result = subprocess.run(
        [
            sys.executable, "-m", "fastast.cli",
            "prune",
            str(fixture),
            "--query", "compute_sum",
            "--json"
        ],
        capture_output=True,
        text=True,
        cwd=Path(__file__).parent.parent
    )
    
    assert result.returncode == 0, f"CLI failed: {result.stderr}"
    
    output = json.loads(result.stdout)
    assert "pruned_code" in output
    assert "original_tokens" in output
    assert "pruned_tokens" in output
    assert "savings_pct" in output
    assert "syntax_valid" in output
    assert output["syntax_valid"] is True
    assert output["savings_pct"] > 0


def test_cli_prune_human_readable():
    """Test CLI prune command with human-readable output."""
    fixture = FIXTURES_DIR / "sample_simple.py"
    
    result = subprocess.run(
        [
            sys.executable, "-m", "fastast.cli",
            "prune",
            str(fixture),
            "--query", "compute_product",
            "--threshold", "0.3"
        ],
        capture_output=True,
        text=True,
        cwd=Path(__file__).parent.parent
    )
    
    assert result.returncode == 0, f"CLI failed: {result.stderr}"
    assert "FastAST Pruning Complete" in result.stdout
    assert "Tokens:" in result.stdout
    assert "Lines:" in result.stdout


def test_cli_index_command():
    """Test CLI index command."""
    fixture = FIXTURES_DIR / "sample_simple.py"
    
    result = subprocess.run(
        [
            sys.executable, "-m", "fastast.cli",
            "index",
            str(fixture),
            "--json"
        ],
        capture_output=True,
        text=True,
        cwd=Path(__file__).parent.parent
    )
    
    assert result.returncode == 0, f"CLI failed: {result.stderr}"
    
    output = json.loads(result.stdout)
    assert "symbols" in output
    assert "count" in output
    
    # Check for expected symbols
    symbol_names = [s["name"] for s in output["symbols"]]
    assert "compute_sum" in symbol_names
    assert "compute_product" in symbol_names
    assert "DataProcessor" in symbol_names


def test_cli_symbols_command():
    """Test CLI symbols command (alias for index)."""
    fixture = FIXTURES_DIR / "sample_simple.py"
    
    result = subprocess.run(
        [
            sys.executable, "-m", "fastast.cli",
            "symbols",
            str(fixture),
            "--json"
        ],
        capture_output=True,
        text=True,
        cwd=Path(__file__).parent.parent
    )
    
    assert result.returncode == 0, f"CLI failed: {result.stderr}"
    
    output = json.loads(result.stdout)
    assert "symbols" in output


def test_cli_calls_command():
    """Test CLI calls command."""
    fixture = FIXTURES_DIR / "sample_complex.py"
    
    result = subprocess.run(
        [
            sys.executable, "-m", "fastast.cli",
            "calls",
            str(fixture),
            "--json"
        ],
        capture_output=True,
        text=True,
        cwd=Path(__file__).parent.parent
    )
    
    assert result.returncode == 0, f"CLI failed: {result.stderr}"
    
    output = json.loads(result.stdout)
    assert "call_graph" in output


def test_cli_show_code_flag():
    """Test CLI with --show-code flag."""
    fixture = FIXTURES_DIR / "sample_simple.py"
    
    result = subprocess.run(
        [
            sys.executable, "-m", "fastast.cli",
            "prune",
            str(fixture),
            "--query", "compute_sum",
            "--show-code"
        ],
        capture_output=True,
        text=True,
        cwd=Path(__file__).parent.parent
    )
    
    assert result.returncode == 0, f"CLI failed: {result.stderr}"
    assert "PRUNED CODE:" in result.stdout
    assert "def compute_sum" in result.stdout


def test_cli_nonexistent_file():
    """Test CLI with non-existent file."""
    result = subprocess.run(
        [
            sys.executable, "-m", "fastast.cli",
            "prune",
            "/nonexistent/file.py",
            "--query", "test"
        ],
        capture_output=True,
        text=True,
        cwd=Path(__file__).parent.parent
    )
    
    assert result.returncode == 1
    assert "File not found" in result.stderr


def test_server_imports():
    """Test that server module imports without errors."""
    try:
        from fastast import server
        assert hasattr(server, 'create_server')
        assert hasattr(server, 'main')
        assert hasattr(server, 'MCP_AVAILABLE')
        
        # Only test server creation if MCP is available
        if server.MCP_AVAILABLE:
            srv = server.create_server()
            assert srv is not None
    except ImportError as e:
        pytest.skip(f"Server module import failed: {e}")


def test_cli_imports():
    """Test that CLI module imports without errors."""
    from fastast import cli
    assert hasattr(cli, 'main')
    assert hasattr(cli, 'cmd_prune')
    assert hasattr(cli, 'cmd_index')
    assert hasattr(cli, 'cmd_symbols')
    assert hasattr(cli, 'cmd_calls')
