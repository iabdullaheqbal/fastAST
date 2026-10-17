# FastAST

**High-performance, syntax-guaranteed context pruning and repository symbol graph engine for AI coding agents.**

[![License: Apache-2.0](https://img.shields.io/badge/License-Apache--2.0-blue.svg)](LICENSE)
[![Language: Rust + Python](https://img.shields.io/badge/Language-Rust%20%2B%20Python-orange.svg)](https://www.rust-lang.org/)
[![Model Context Protocol](https://img.shields.io/badge/Protocol-MCP%20JSON--RPC-purple.svg)](https://modelcontextprotocol.io/)
[![Database: SQLite WAL](https://img.shields.io/badge/Database-SQLite%20WAL-blue.svg)](https://www.sqlite.org/)
[![Latency: < 15ms](https://img.shields.io/badge/Latency-%3C15ms%20pruning-brightgreen.svg)]()
[![Syntax: 100% Guaranteed](https://img.shields.io/badge/Syntax-100%25%20Guaranteed-success.svg)]()

FastAST equips AI coding agents (**Claude Code**, **Cursor**, **Codex**, **Windsurf**, and **SWE-bench harnesses**) with a unified repository context engine:

1. **Full-Repository Symbol & Call Graph:** Scans entire project trees, extracts symbols (functions, classes, methods, docstrings, imports, call relationships), and stores them in a local SQLite database for sub-millisecond retrieval.
2. **Syntax-Guaranteed Context Pruning:** Compresses large files (1,500–3,000+ lines) by up to 95% while guaranteeing **100% syntactically valid output** at **sub-15ms native speed**.
3. **Multi-Language Support:** First-class pruning and symbol indexing for 8+ languages: **Python, JavaScript, TypeScript, Java, Rust, HTML, CSS, JSON, and TOML**.

---

## Table of Contents

- [Key Features](#key-features)
- [Supported Languages](#supported-languages)
- [Installation](#installation)
- [Quick Start (CLI)](#quick-start-cli)
- [MCP Server Setup](#mcp-server-setup)
  - [Claude Code](#claude-code)
  - [Cursor IDE](#cursor-ide)
  - [Custom MCP Clients](#custom-mcp-clients)
- [MCP Tool Interface](#mcp-tool-interface)
- [Full-Repository Indexing](#full-repository-indexing)
- [Architecture Overview](#architecture-overview)
- [Development & Building from Source](#development--building-from-source)
- [License](#license)

---

## Key Features

- **Deterministic Syntax Guarantees**: Never produces broken code. Unkept bodies are synthesized with valid language-appropriate stubs (`pass` in Python, `{ todo!() }` in Rust, `/* empty */` in JS/TS/Java, `<!-- empty -->` in HTML, `{}`/`[]` in JSON).
- **Sub-15ms Native Speed**: Compiled pure Rust core with zero-copy PyO3 bindings processes multi-thousand line files in 1–15 milliseconds with zero garbage collection overhead.
- **Accurate Token Reductions**: Measures real OpenAI/Anthropic token consumption via built-in `cl100k_base` BPE tables (`tiktoken-rs`)—no estimates or guesswork.
- **Local SQLite Symbol & Call Graph**: Fast incremental repository walker with caller/callee tracing, symbol search, and SHA-256 change caching.
- **Official Model Context Protocol (MCP)**: Native JSON-RPC stdio server ready for Claude Code, Cursor, and any MCP-compliant coding agent.
- **100% Local & Offline**: Zero cloud dependencies, zero external telemetry, zero API keys required.

---

## Supported Languages

FastAST provides dedicated AST parsers, dual-rubric scoring, dependency closure, and syntactic repair across all major languages:

| Language | Extensions | Pruning Strategy & Syntax Stubs |
| :--- | :--- | :--- |
| **Python** | `.py`, `.pyi`, `.pyw` | Scope stubs (`pass`), stacked decorator preservation, import closure |
| **TypeScript / TSX** | `.ts`, `.tsx`, `.mts`, `.cts` | Interfaces, type aliases, enums, React components, stubs (`/* empty */`) |
| **JavaScript / JSX** | `.js`, `.jsx`, `.mjs`, `.cjs` | Functions, classes, methods, arrow functions, React components |
| **Java** | `.java` | Classes, interfaces, enums, constructors, methods (`/* empty */`) |
| **Rust** | `.rs` | Functions, structs, enums, traits, impl blocks (`{ todo!() }`) |
| **HTML** | `.html`, `.htm` | Structural hierarchy preservation, semantic sections (`<header>`, `<main>`, `<article>`) |
| **CSS** | `.css` | Rulesets, selectors, media queries, keyframe blocks |
| **JSON** | `.json` | Key-value pruning, object/array stubs (`{}` / `[]`), valid JSON output |
| **TOML** | `.toml` | Tables (`[table]`), arrays of tables (`[[bin]]`), key-value filtering, valid TOML output |

---

## Installation

### From PyPI (Recommended - No Rust Required)

FastAST publishes pre-built binary wheels for Linux (`manylinux`), macOS (Intel & Apple Silicon), and Windows with stable ABI support (`cp310-abi3`):

```bash
# Using pip:
pip install fastast

# Using uv:
uv add fastast

# As a standalone CLI tool:
uv tool install fastast
```

### From Source

Building from source requires **Python >= 3.10** and **Rust >= 1.70**:

```bash
git clone https://github.com/iabdullaheqbal/fastAST.git
cd fastAST

# Install in development mode
pip install -e .

# Or build release wheels using maturin
maturin build --release
```

---

## Quick Start (CLI)

FastAST includes a standalone CLI (`fastast`) with four primary commands: `prune`, `index`, `symbols`, and `calls`.

### 1. Context Pruning

Prune a large file targeting a specific function or query:

```bash
# Prune Python file focusing on a specific function
fastast prune tests/fixtures/sample_large.py -q "handle_request" --preview

# Prune TypeScript / TSX component
fastast prune src/components/UserProfile.tsx -q "UserProfile Avatar"

# Prune JSON configuration down to relevant dependencies
fastast prune package.json -q "scripts test"

# Prune TOML configuration targeting specific crates
fastast prune Cargo.toml -q "dependencies pyo3"

# Output structured metrics as JSON for agent automation
fastast prune src/database.py -q "ConnectionPool" --json
```

#### Pruning Output Example
```text
FastAST Pruning Complete in 1.24ms [VALID: ast.parse OK]
Tokens: 12,183 -> 594 (95.12% reduction)
Lines:  1,542 -> 166 (89.23% reduction)
```

CLI Pruning Flags:
- `-q, --query <str>`: Query keywords, function names, or task descriptions.
- `-t, --threshold <float>`: Relevance sensitivity cutoff (default: `0.5`, range `0.0`–`1.0`).
- `-o, --output <path>`: Write pruned code directly to file.
- `--preview`: Display pruned code preview in terminal.
- `--json`: Output full telemetry JSON (`pruned_code`, `savings_pct`, `latency_ms`, `syntax_valid`).

---

## Full-Repository Indexing

FastAST indexes your codebase into a lightweight, high-performance SQLite database (`.fastast.db`) stored directly in your project root.

### 1. Index Repository
```bash
# Index the current repository
fastast index .

# Force re-indexing of all files (bypasses SHA-256 cache)
fastast index . --force

# JSON output mode
fastast index . --json
```

```text
FastAST Repository Indexing Complete in 142.18ms
Database: /workspace/project/.fastast.db
Files:    48 scanned (48 indexed, 0 skipped, 0 errors)
Graph:    312 symbols, 94 imports, 186 calls
```

### 2. Search Symbols
Search for functions, classes, interfaces, or methods across the entire codebase with line ranges and signatures:

```bash
fastast symbols "execute" --kind function
fastast symbols "DatabasePool"
```

### 3. Trace Call Graphs
Inspect all callers (inbound) and callees (outbound) for any function:

```bash
fastast calls "prune_file"
```

```text
Call Graph for 'prune_file':
Callers (3):
  <- run_prune (function) in python/fastast/cli.py:91
  <- prune_context (function) in python/fastast/server.py:53
Callees (4):
  -> parse_ast() at src/lib.rs:113
  -> collect_scopes() at src/lib.rs:147
  -> evaluate_scopes() at src/lib.rs:148
  -> reconstruct_code() at src/lib.rs:149
```

---

## MCP Server Setup

FastAST includes a native [Model Context Protocol](https://modelcontextprotocol.io/) server (`fastast-mcp`) providing stdio JSON-RPC 2.0 communication.

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

When connected as an MCP server, FastAST exposes 4 tools to coding agents:

### 1. `prune_context`
Prunes a source code file down to query-relevant logic while guaranteeing syntactically valid code.
- **Parameters:**
  - `code_text` (`string`, required): Source code content to prune.
  - `focus_query` (`string`, required): Search terms, function names, or task intent.
  - `threshold` (`float`, optional, default `0.5`): Relevance cutoff $\in [0.0, 1.0]$.
  - `language` (`string`, optional): Language hint (`python`, `javascript`, `typescript`, `java`, `rust`, `html`, `css`, `json`, `toml`).
- **Returns:** JSON object containing `pruned_code`, `savings_pct`, `pruned_tokens`, and `syntax_valid`.

### 2. `index_repository`
Indexes files across the repository into the SQLite symbol and call graph.
- **Parameters:**
  - `directory_path` (`string`, optional, default `"."`): Root directory to index.
- **Returns:** Summary of indexed files, extracted symbols, imports, and execution latency.

### 3. `query_symbols`
Searches for symbol definitions across the repository.
- **Parameters:**
  - `query` (`string`, required): Symbol identifier or substring.
  - `kind` (`string`, optional): Filter (`function`, `class`, `method`, `interface`, etc.).
  - `directory_path` (`string`, optional, default `"."`): Project root.
- **Returns:** List of matching symbols with file paths, signatures, docstrings, and line spans.

### 4. `get_call_graph`
Returns caller and callee relationships for a given function or method.
- **Parameters:**
  - `symbol_name` (`string`, required): Target function or method name.
  - `directory_path` (`string`, optional, default `"."`): Project root.
- **Returns:** Inbound callers and outbound callees with exact line references.

---

## Architecture Overview

FastAST combines native compiled Tree-Sitter parsing with Python bindings:

```
[Coding Agent: Claude Code / Cursor / Windsurf]
                        │
                        ▼ (1) JSON-RPC stdio
           [MCP Server: fastast-mcp]
          /                         \
         / (Tools)                   \ (Index)
        ▼                             ▼
 [Core: fastast._core]       [SQLite Index: .fastast.db]
   ├── Tree-Sitter Parsers     ├── files table (SHA-256 & mtime)
   ├── Dual-Rubric Scorer      ├── symbols table (functions, classes, lines)
   ├── Dependency Closure      ├── imports table (module relationships)
   ├── AST Structural Repair   └── calls table (call graph relationships)
   └── BPE Token Counting
        │
        ▼
 [Guaranteed Valid Pruned Code + Metrics]
```

### Dual-Rubric & Dependency Closure Engine

1. **Rubric A (Semantic Relevance):** Evaluates Jaccard subtoken overlap between the query and identifiers, class names, method signatures, and keywords.
2. **Rubric B (Dependency Closure):** Automatically retains all structural companions:
   - Enclosing scopes (parent classes, functions, and interfaces).
   - Module imports required by retained logic.
   - Control-flow companions (`try`/`except`/`finally`, `if`/`else`).
3. **Query-Adaptive Gating:** Automatically detects structural vs. functional query intent, dynamically balancing semantic relevance against structural breadth.
4. **Zero-Match Skeleton Fallback:** If a query has no lexical match, FastAST returns a clean architectural skeleton (imports + signatures with stubbed bodies) so the agent receives the file API map without token bloat.

---

## Development & Building from Source

### Running Tests

FastAST contains unit and integration tests across all 8 supported languages:

```bash
# Run multi-language test suite
python tests/test_multi_language.py

# Run individual language test suites
python tests/test_pruner.py        # Python pruning & closure tests
python tests/test_rust.py          # Rust structs, traits, and impl blocks
python tests/test_typescript.py    # TypeScript & TSX components
python tests/test_javascript.py    # JavaScript & JSX components
python tests/test_java.py          # Java classes & methods
python tests/test_html.py          # HTML structural pruning
python tests/test_css.py           # CSS rulesets & media queries
python tests/test_json.py          # JSON key-value & array filtering
python tests/test_toml.py          # TOML tables & array of tables
python tests/test_server.py        # MCP server tool tests
```

### Building Binary Wheels

Build an optimized release wheel:

```bash
maturin build --release
```

Generated wheels are saved to `target/wheels/`.

---

## License

FastAST is open-source software licensed under the [Apache License, Version 2.0](LICENSE).
