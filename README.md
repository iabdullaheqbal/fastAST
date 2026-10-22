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
- [Token Reduction via Layered Pruning](#token-reduction-via-layered-pruning)
- [Supported Languages](#supported-languages)
- [Installation](#installation)
- [Quick Start (CLI)](#quick-start-cli)
  - [1. Index Repository](#1-index-repository)
  - [2. Search Symbols](#2-search-symbols)
  - [3. Trace Call Graphs](#3-trace-call-graphs)
  - [4. Bounded Graph Traversal](#4-bounded-graph-traversal)
  - [5. Scan Admitted Files](#5-scan-admitted-files)
  - [6. Token-Conscious Evidence Query](#6-token-conscious-evidence-query)
- [MCP Server Setup](#mcp-server-setup)
  - [Claude Code](#claude-code)
  - [Cursor IDE](#cursor-ide)
  - [Custom MCP Clients](#custom-mcp-clients)
- [MCP Tool Interface](#mcp-tool-interface)
  - [`index_repository`](#1-index_repository)
  - [`query_symbols`](#2-query_symbols)
  - [`get_call_graph`](#3-get_call_graph)
  - [`retrieve_evidence`](#4-retrieve_evidence)
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

## Token Reduction via Layered Pruning

Traditional retrieval approaches dump entire files into model context windows, resulting in token exhaustion, high inference latency, and context distraction. FastAST uses a four-stage **Layered Pruning Pipeline** that reduces a codebase down to only the exact evidence required for a query:

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. Repo-Level Pruning (File Admission)                                      │
│    • Drops .git, node_modules, build artifacts, test caches, and binaries    │
│    • Multi-layer ignores (.gitignore, .fastastignore, hardcoded patterns)   │
│    • Token Reduction: Eliminates 60%-80% of repository file bloat            │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 2. Syntax-Level Pruning (AST Fact Extraction)                               │
│    • Discards non-semantic tokens, comments, and boilerplate               │
│    • Extracts only high-value symbols, signatures, imports, and calls        │
│    • Token Reduction: Cuts admitted file footprint by 75%-90%                │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 3. Graph-Level Pruning (Relation Filtering)                                 │
│    • Suppresses built-in call noise (print, len, console, panic, etc.)      │
│    • Eliminates self-loops and prunes low-confidence relations (< 0.60)     │
│    • Token Reduction: Drops over 50% of raw graph relationship clutter       │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 4. Query-Time Pruning (Semantic Embeddings + BM25 + Hybrid Ranking)         │
│    • Dense semantic vector search via 128-dim projection embeddings         │
│    • BM25 full-text search over symbols, signatures, docstrings, and paths  │
│    • Multi-factor fusion (Semantic, BM25, exact name, kind, path, degree)   │
│    • Support for weighted hybrid sum and Reciprocal Rank Fusion (RRF)       │
│    • Fan-out-capped 1-hop neighborhood expansion (depth 1-3, fan-out ≤ 5)   │
│    • Extracts minimal bounded snippets (omitting middle for large symbols)  │
│    • Enforces strict token budget (e.g. 1024-2048 tokens total)             │
│    • Token Reduction: Delivers compact evidence bundle (99%+ reduction)     │
└─────────────────────────────────────────────────────────────────────────────┘
```

| Pruning Stage | Scope | Action Taken | Resulting Artifact |
| :--- | :--- | :--- | :--- |
| **Layer 1: Repo-Level** | Whole Repository | Ignore rules, binary sniffing, content hashing | `FileRecord` set |
| **Layer 2: Syntax-Level** | Admitted Files | Tree-sitter AST extraction of declarations | `SymbolRecord` + raw edges |
| **Layer 3: Graph-Level** | Extracted Facts | Deduplication, confidence thresholding, noise filtering | Typed `CodeGraph` |
| **Layer 4: Query-Time** | Graph + Evidence | Multi-factor ranking, bounded snippets, token budgeting | `EvidenceBundle` |

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

### 4. Bounded Graph Traversal

Traverse multi-hop code relationships (`defines`, `calls`, `inherits`, `imports`) from any symbol with depth bounding and confidence attenuation:

```bash
# Expand 2-hop neighborhood from a class or function
fastast graph "UserService" --depth 2

# Inspect outbound dependencies (callees and imports)
fastast graph "UserService" --direction out

# Inspect inbound dependencies (callers and references)
fastast graph "UserService" --direction in

# Output structured JSON for agent reasoning
fastast graph "UserService" --json
```

```text
Graph Neighborhood for 'UserService' (depth=2):
Total Nodes: 6, Total Edges: 7

Traversed Nodes:
  [Hop 0] UserService (class, conf=1.0)
  [Hop 1] BaseService (class, conf=0.85)
  [Hop 1] authenticate (method, conf=0.85)
  [Hop 2] verify_hash (function, conf=0.72)
  [Hop 2] find_by_email (function, conf=0.68)

Traversed Edges:
  UserService --[inherits conf=1.0]--> BaseService
  UserService --[defines conf=1.0]--> authenticate
  authenticate --[calls conf=0.95]--> verify_hash
  authenticate --[calls conf=0.9]--> find_by_email
```

### 5. Scan Admitted Files

Run the File Admission Layer (multi-layer ignore rules, xxHash3 content hashing, language detection, and file classification) without modifying the database:

```bash
# Scan repository file admission status
fastast scan .

# Filter by language
fastast scan . -L python,typescript

# Output admitted FileRecords as JSON
fastast scan . --json
```

### 6. Token-Conscious Evidence Query

Retrieve compact, token-bounded evidence bundles for coding agents. Ranks candidates using advanced **Hybrid Ranking** (Dense Semantic Embeddings + SQLite FTS5 BM25 + exact name matching, symbol type matching, file path relevance, graph degree, and AST confidence):

```bash
# Query evidence for a symbol or concept (uses Semantic + BM25 + structural hybrid ranking by default)
fastast query "handle_request"

# Conceptual queries with zero exact name match (finds targets via dense semantic embeddings)
fastast query "user authentication check"

# Pure semantic dense vector retrieval
fastast query "database persistence layer" --ranking semantic

# Select ranking algorithm: hybrid (default), semantic, rrf (Reciprocal Rank Fusion), bm25, or heuristic
fastast query "calculate_tax" --ranking hybrid
fastast query "calculate_tax" --ranking semantic
fastast query "calculate_tax" --ranking rrf
fastast query "calculate_tax" --ranking bm25
fastast query "calculate_tax" --ranking heuristic

# Filter by kind and cap candidate count
fastast query "authenticate" --kind function --limit 3

# Bias towards a specific file path
fastast query "charge" --file "src/billing"

# Enforce a strict token budget (e.g. 1024 tokens)
fastast query "UserService" --max-tokens 1024

# Output structured JSON evidence bundle for LLM prompt assembly
fastast query "handle_request" --json
```

```text
FastAST Evidence Bundle for 'handle_request':
Total Candidates: 1, Estimated Tokens: ~64

Top Candidates:
  1. handle_request (function, score=0.92) in src/api/handlers.py:10-25
     Reasons: BM25 lexical match (score: 0.95); Exact name match ('handle_request'); Primary definition (function); Source file: src/api/handlers.py; Graph degree: 3 connected relations
     Neighbors (2): validate_token, execute_query
     Snippet (lines 8-28):
       | def handle_request(req):
       |     validate_token(req.headers)
       |     return execute_query(req.body)

Relevant Files:
  - src/api/handlers.py (source, python, 120 lines)

Connected Relationships:
  handle_request --[calls conf=0.95]--> validate_token
  handle_request --[calls conf=0.9]--> execute_query
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

### 4. `retrieve_evidence`
Retrieves a ranked, token-conscious evidence bundle for coding agents. Combines Dense Semantic Embeddings + SQLite FTS5 BM25 retrieval with structural heuristics (exact name match, symbol kind priority, path proximity, edge degree), expands 1-hop graph neighbors, extracts bounded code snippets, and strictly enforces token budgets.
- **Parameters:**
  - `query` (`string`, required): Target symbol name, conceptual phrase, or text query.
  - `directory_path` (`string`, optional, default: `"."`): Project root.
  - `kind` (`string`, optional): Symbol kind filter (`function`, `class`, `method`).
  - `language` (`string`, optional): Language filter (`python`, `typescript`, `rust`, etc.).
  - `file_path` (`string`, optional): Target file path filter.
  - `limit` (`integer`, optional, default: `5`): Maximum candidates to return.
  - `max_tokens` (`integer`, optional, default: `2048`): Token budget for evidence snippets.
  - `ranking_method` (`string`, optional, default: `"hybrid"`): Ranking algorithm (`"hybrid"`, `"semantic"`, `"rrf"`, `"bm25"`, or `"heuristic"`).
- **Returns:** JSON containing top-ranked candidates, bounded snippets, relevant files, connected relationships, and token estimates.

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
    ├── calls table (caller symbol ID, callee name, line number)
    ├── edges table (src symbol, dst symbol, relation, confidence, line number)
    ├── symbols_fts virtual table (SQLite FTS5 full-text index with unicode61 tokenizer & sync triggers)
    └── symbol_embeddings table (dense vectors, model, dimensions, packed float BLOB)
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
