# FastAST

**High-performance Codebase-Memory Engine (`AST → Graph → Retrieval`) for AI coding agents.**

[![License: Apache-2.0](https://img.shields.io/badge/License-Apache--2.0-blue.svg)](LICENSE)
[![Language: Rust + Python](https://img.shields.io/badge/Language-Rust%20%2B%20Python-orange.svg)](https://www.rust-lang.org/)
[![Model Context Protocol](https://img.shields.io/badge/Protocol-MCP%20JSON--RPC-purple.svg)](https://modelcontextprotocol.io/)
[![Database: SQLite WAL](https://img.shields.io/badge/Database-SQLite%20WAL-blue.svg)](https://www.sqlite.org/)
[![Architecture: AST → Graph → Retrieval](https://img.shields.io/badge/Architecture-AST%20→%20Graph%20→%20Retrieval-success.svg)](docs/ARCHITECTURE.md)

FastAST equips AI coding agents (**Claude Code**, **Cursor**, **Codex**, **Windsurf**, and **SWE-bench harnesses**) with instant, deterministic repository intelligence:

1. **AST Extraction (Tree-Sitter):** Scans entire project trees across 9 languages, parsing concrete syntax trees in sub-5ms latency and extracting declarations, imports, and calls.
2. **Symbol & Edge Graph:** Builds a normalized, confidence-weighted code graph in local SQLite (`files`, `symbols`, `imports`, `calls`, `edges`).
3. **Retrieval & Evidence Selection:** Delivers bounded evidence windows with exact line numbers, code snippets, and graph neighborhood context without context window saturation.
4. **Incremental Content Hashing:** Uses file modification timestamps and content hashes (xxHash3/BLAKE3) to skip unchanged files instantly.
5. **Agent-Native MCP Integration:** Built-in Model Context Protocol server exposing tools for automated symbol discovery and call graph traversal.

> 📖 **Full System Architecture**: Read the in-depth design specification in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

---

## Table of Contents

- [Key Features](#key-features)
- [Supported Languages](#supported-languages)
- [Installation](#installation)
- [Quick Start (CLI)](#quick-start-cli)
  - [1. Index Repository](#1-index-repository)
  - [2. Search Symbols](#2-search-symbols)
  - [3. Trace Call Graphs](#3-trace-call-graphs)
- [MCP Server Setup](#mcp-server-setup)
  - [Claude Code](#claude-code)
  - [Cursor IDE](#cursor-ide)
  - [Custom MCP Clients](#custom-mcp-clients)
- [MCP Tool Interface](#mcp-tool-interface)
  - [`index_repository`](#1-index_repository)
  - [`query_symbols`](#2-query_symbols)
  - [`get_call_graph`](#3-get_call_graph)
- [Architecture & Database Schema](#architecture--database-schema)
- [Development & Building from Source](#development--building-from-source)
- [License](#license)

---

## Key Features

- **Sub-Millisecond Symbol Lookups**: Pre-computes normalized symbol graphs and call hierarchies into local SQLite with indexed B-trees for instant querying.
- **Accurate AST Parsing**: Powered by native Tree-Sitter grammars and zero-copy Rust parsers—extracts exact signatures, line spans, docstrings, and parent enclosing classes.
- **Static Call Graph Extraction**: Discovers invocation links between functions, methods, and callees across the codebase to help agents estimate change blast radius.
- **Fast Incremental Indexing**: Automatically skips unchanged files via SHA-256 hash checks and mtime caching.
- **Official Model Context Protocol (MCP)**: Native JSON-RPC stdio server ready for Claude Code, Cursor, and any MCP-compliant coding agent.
- **100% Local & Offline**: Zero cloud dependencies, zero external telemetry, zero vector database bloat, zero API keys required.

---

## Supported Languages

FastAST provides dedicated AST parsers and symbol/import/call extraction across all major languages:

| Language | Extensions | Extracted Symbols & Constructs |
| :--- | :--- | :--- |
| **Python** | `.py`, `.pyi`, `.pyw` | Functions, async functions, classes, methods, docstrings, imports, call relationships |
| **TypeScript / TSX** | `.ts`, `.tsx`, `.mts`, `.cts` | Interfaces, type aliases, enums, functions, arrow functions, classes, methods, React components |
| **JavaScript / JSX** | `.js`, `.jsx`, `.mjs`, `.cjs` | Functions, async functions, arrow functions, classes, methods, getters, setters, React components, JSDoc |
| **Java** | `.java` | Packages, imports, classes, interfaces, enums, records, constructors, methods, fields |
| **Rust** | `.rs` | Functions, structs, enums, traits, impl blocks, modules, consts, statics, type aliases, calls |
| **HTML** | `.html`, `.htm`, `.xhtml` | Semantic sections (`<header>`, `<main>`, `<article>`, `<form>`), IDs (`#id`), classes (`.class`), `<link>`/`<script>` imports |
| **CSS** | `.css` | Rulesets, selectors, media queries, keyframe animations, `@import` statements |
| **JSON** | `.json`, `.jsonc` | Top-level objects, arrays, keys, package dependencies extracted as imports |
| **TOML** | `.toml` | Tables (`[table]`), arrays of tables (`[[bin]]`), configuration keys, dependencies extracted as imports |

---

## Installation

### From Source

Building FastAST requires **Python >= 3.10** and **Rust >= 1.70**:

```bash
git clone https://github.com/iabdullaheqbal/fastAST.git
cd fastAST

# Install in development mode
pip install -e .

# Or build release wheel using maturin
maturin build --release
```

---

## Quick Start (CLI)

FastAST includes a standalone CLI (`fastast`) with three primary commands: `index`, `symbols`, and `calls`.

### 1. Index Repository

Index a project directory into a lightweight, high-performance SQLite database (`.fastast.db`):

```bash
# Index the current repository
fastast index .

# Force re-indexing of all files (bypasses SHA-256 cache)
fastast index . --force

# Output indexing statistics in JSON format
fastast index . --json
```

#### Indexing Output Example
```text
FastAST Repository Indexing Complete
Path:     /workspace/myproject
Database: /workspace/myproject/.fastast.db
Latency:  84.32 ms
Files:    54 scanned (54 indexed, 0 skipped, 0 errors)
Graph:    428 symbols, 112 imports, 260 calls
Languages: python (32), typescript (14), rust (4), toml (4)
```

### 2. Search Symbols

Search for functions, classes, interfaces, or methods across the entire codebase with line ranges and signatures:

```bash
# Search by symbol name or substring
fastast symbols "handle_request"

# Filter by symbol kind (function, class, method, async_function)
fastast symbols "execute" --kind function

# Filter by programming language
fastast symbols "Config" -L python

# Output results as JSON for agent automation
fastast symbols "UserProfile" --json
```

### 3. Trace Call Graphs

Inspect inbound callers (who calls this) and outbound callees (what this calls) for any symbol:

```bash
fastast calls "execute_query"
```

```text
Call Graph for 'execute_query':
Callers (2):
  <- [python] handle_request (function) in src/api.py:42
  <- [python] batch_runner (function) in src/tasks.py:118
Callees (3):
  -> [python] validate_connection() at src/db.py:25
  -> [python] acquire_lock() at src/db.py:31
  -> [python] log_query() at src/db.py:88
```

---

## MCP Server Setup

FastAST includes a native [Model Context Protocol](https://modelcontextprotocol.io/) server (`fastast-mcp`) communicating over stdio JSON-RPC 2.0.

### Claude Code

Add FastAST as an MCP server using the `claude` CLI:

```bash
claude mcp add fastast -- fastast-mcp
```

Or configure manually in `~/.claude.json`:

```json
{
  "mcpServers": {
    "fastast": {
      "command": "fastast-mcp"
    }
  }
}
```

### Cursor IDE

Add FastAST to `.cursor/mcp.json` or through Cursor Settings → Features → MCP:

```json
{
  "mcpServers": {
    "fastast": {
      "command": "fastast-mcp"
    }
  }
}
```

### Custom MCP Clients (Codex, Windsurf, etc.)

Any client supporting MCP stdio can launch the server:

```bash
fastast-mcp
# or with python:
python -m fastast.server
```

---

## MCP Tool Interface

When connected as an MCP server, FastAST exposes 3 core tools to coding agents:

### 1. `index_repository`
Recursively scans and indexes files across the repository into the SQLite symbol and call graph.
- **Parameters:**
  - `directory_path` (`string`, optional, default: `"."`): Root directory to index.
  - `force` (`boolean`, optional, default: `false`): Force reindexing of all files even if unchanged.
- **Returns:** Summary JSON containing scanned files, indexed count, skipped count, symbols, imports, calls, and execution latency.

### 2. `query_symbols`
Searches for symbol definitions across the indexed codebase. If the repository is not yet indexed, it automatically indexes it first.
- **Parameters:**
  - `query` (`string`, required): Symbol identifier or substring (e.g. `'authenticate'`, `'Config'`).
  - `kind` (`string`, optional): Filter (`function`, `async_function`, `class`, `method`).
  - `directory_path` (`string`, optional, default: `"."`): Project root.
  - `limit` (`integer`, optional, default: `50`): Maximum matches to return.
  - `language` (`string`, optional): Language filter (`python`, `typescript`, `rust`, etc.).
- **Returns:** JSON list of matching symbols with file paths, signatures, line ranges, and docstrings.

### 3. `get_call_graph`
Returns incoming caller and outgoing callee relationships for a function or method.
- **Parameters:**
  - `symbol_name` (`string`, required): Target function or method name.
  - `directory_path` (`string`, optional, default: `"."`): Project root.
- **Returns:** Inbound callers and outbound callees with file paths and exact line references.

---

## Architecture & Database Schema

FastAST combines high-speed compiled Rust Tree-Sitter parsers with an embedded SQLite WAL database:

```
[Coding Agent: Claude Code / Cursor / Windsurf]
                        │
                        ▼ (1) JSON-RPC stdio
            [MCP Server: fastast-mcp]
           /                         \
          / (Query)                   \ (Index)
         ▼                             ▼
  [Symbol & Graph Queries]     [Indexer: indexer.py]
         │                             │
         │                             ├──► [Rust Core: _core] (Tree-Sitter AST Parsers)
         │                             └──► [SQLite DB: .fastast.db]
         ▼
  [Local SQLite Database: .fastast.db]
    ├── files table (file path, language, SHA-256 hash, mtime, line count, token count)
    ├── symbols table (name, kind, signature, line spans, docstring, parent symbol)
    ├── imports table (module, imported name, alias, line number)
    └── calls table (caller symbol ID, callee name, line number)
```

---

## Development & Building from Source

### Running Tests

FastAST contains unit and integration tests across CLI, MCP server, SQLite layer, and all supported languages:

```bash
# Run all test suites
for f in tests/test_*.py; do
    python3 "$f"
done
```

### Building Binary Extension

Build the native Rust PyO3 extension module:

```bash
maturin develop
```

Or build an optimized release wheel:

```bash
maturin build --release
```

---

## License

FastAST is open-source software licensed under the [Apache License, Version 2.0](LICENSE).
