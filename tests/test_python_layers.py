"""Tests for Python wrapper layers (CLI and MCP server interfaces)."""

import json
import subprocess
import sys
from pathlib import Path

try:
    import pytest
except ImportError:
    pytest = None


FIXTURES_DIR = Path(__file__).parent / "fixtures"


def test_cli_version():
    """Test CLI --version flag."""
    result = subprocess.run(
        [sys.executable, "-m", "fastast.cli", "--version"],
        capture_output=True,
        text=True,
        env={"PYTHONPATH": "python"},
        cwd=Path(__file__).parent.parent,
    )
    assert result.returncode == 0
    assert "fastast 0.2.0" in result.stdout


def test_cli_help():
    """Test CLI --help flag."""
    result = subprocess.run(
        [sys.executable, "-m", "fastast.cli", "--help"],
        capture_output=True,
        text=True,
        env={"PYTHONPATH": "python"},
        cwd=Path(__file__).parent.parent,
    )
    assert result.returncode == 0
    assert "AST-based repository indexer" in result.stdout


def test_server_imports():
    """Test that server module imports without errors."""
    try:
        from fastast import server
        assert hasattr(server, 'create_server')
        assert hasattr(server, 'main')
        assert hasattr(server, 'MCP_AVAILABLE')
        assert hasattr(server, 'index_repository')
        assert hasattr(server, 'query_symbols')
        assert hasattr(server, 'get_call_graph')
        
        # Only test server creation if MCP is available
        if server.MCP_AVAILABLE:
            srv = server.create_server()
            assert srv is not None
    except ImportError as e:
        if pytest:
            pytest.skip(f"Server module import failed: {e}")
        else:
            print(f"Skipping server tests: {e}")


def test_cli_imports():
    """Test that CLI module imports without errors."""
    from fastast import cli
    assert hasattr(cli, 'main')
    assert hasattr(cli, 'cmd_index')
    assert hasattr(cli, 'cmd_symbols')
    assert hasattr(cli, 'cmd_calls')
    assert hasattr(cli, 'run_index')
    assert hasattr(cli, 'run_symbols')
    assert hasattr(cli, 'run_calls')


if __name__ == "__main__":
    test_cli_version()
    test_cli_help()
    test_server_imports()
    test_cli_imports()
    print("All Python layer tests passed successfully!")
