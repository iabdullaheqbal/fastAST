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
  - [7. Detect Similar Symbols (MinHash + LSH)](#7-detect-similar-symbols-minhash--lsh)
  - [8. Community & Module Discovery (Louvain)](#8-community--module-discovery-louvain)
  - [9. Repository Diagnostics (Doctor)](#9-repository-diagnostics-doctor)
  - [10. Background Watcher (Watch)](#10-background-watcher-watch)
- [MCP Server Setup](#mcp-server-setup)
  - [Claude Code](#claude-code)
  - [Cursor IDE](#cursor-ide)
  - [Custom MCP Clients](#custom-mcp-clients)
- [MCP Tool Interface](#mcp-tool-interface)
  - [`index_repository`](#1-index_repository)
  - [`query_symbols`](#2-query_symbols)
  - [`get_call_graph`](#3-get_call_graph)
  - [`get_graph_neighborhood`](#4-get_graph_neighborhood)
  - [`retrieve_evidence` / `query`](#5-retrieve_evidence--query)
  - [`get_symbol_evidence`](#6-get_symbol_evidence)
  - [`get_file_outline`](#7-get_file_outline)
  - [`get_snippet`](#8-get_snippet)
  - [`get_similar_symbols`](#9-get_similar_symbols)
  - [`get_community`](#10-get_community)
  - [`list_communities`](#11-list_communities)
  - [`diagnose_repository`](#12-diagnose_repository)
- [CLI and MCP Parity Matrix](#cli-and-mcp-parity-matrix)
- [Standardized Agent Response Format](#standardized-agent-response-format)
- [Production Hardening & Operational Readiness](#production-hardening--operational-readiness)
- [Architecture & Database Schema](#architecture--database-schema)
- [Development & Building from Source](#development--building-from-source)
- [License](#license)

---

## Key Features

- **Sub-Millisecond Symbol Lookups**: Pre-computes normalized symbol graphs and call hierarchies into local SQLite with indexed B-trees for instant querying.
- **Accurate AST Parsing**: Powered by native Tree-Sitter grammars and zero-copy Rust parsers—extracts exact signatures, line spans, docstrings, and parent enclosing classes.
- **Static Call Graph Extraction**: Discovers invocation links between functions, methods, and callees across the codebase to help agents estimate change blast radius.
- **Near-Duplicate Detection (MinHash + LSH)**: Detects code clones, duplicate logic, and API variations using 64-permutation MinHash signatures and 16-band Locality-Sensitive Hashing without quadratic $O(N^2)$ comparisons.
- **Community & Module Detection (Louvain Modularity)**: Clusters the symbol-call graph into functional architectural communities with Louvain modularity optimization ($Q$), automatic semantic labeling, and central hub discovery.
- **Dense Semantic + BM25 Hybrid Retrieval**: Fuses 128-dim projection embeddings with SQLite FTS5 BM25 and structural heuristics (Reciprocal Rank Fusion or weighted sum).
- **Fast Incremental Indexing**: Automatically skips unchanged files via SHA-256/xxHash3 hash checks and mtime caching with cascade deletions.
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

### 7. Detect Similar Symbols (MinHash + LSH)

Find near-duplicate functions, code clones, and parallel interface implementations across the codebase using MinHash ($m=64$) and Locality-Sensitive Hashing ($b=16, r=4$):

```bash
# Find near-duplicate implementations of a function or class
fastast similar "handle_request"

# Adjust minimum Jaccard similarity threshold (0.0 to 1.0, default: 0.50)
fastast similar "validate_token" --min-sim 0.60

# Output results as JSON
fastast similar "parse_json_payload" --json
```

```text
Similar Symbols for 'handle_request' (MinHash Jaccard >= 0.50):
  1. handle_incoming_request (function, 68% similar) in service.py:5-7
     def handle_incoming_request(req)
```

### 8. Community & Module Discovery (Louvain)

Inspect cohesive functional clusters, modules, and central hub symbols partitioned via Louvain graph modularity optimization:

```bash
# List all detected architectural communities
fastast communities

# Recompute Louvain modularity clusters on the current graph
fastast communities --recompute

# Inspect community membership, central hub, and peer symbols for a specific target
fastast community "handle_request"

# Output community details as JSON
fastast community "handle_request" --json
```

```text
Detected Architectural Communities (Louvain Modularity Clustering):
  Community #0: request (hub: handle_request) (3 symbols)
    Symbols: parse_json_data, handle_request, handle_incoming_request
    Files: parser.py, service.py
```

### 9. Repository Diagnostics (Doctor)

Inspect repository health, database integrity, schema version, lock state, and index coverage:

```bash
# Perform standard repository diagnostics
fastast doctor .

# Perform deep SQLite integrity check
fastast doctor . --full

# Output diagnostics as structured JSON
fastast doctor . --json

# Automatically reclaim stale or dead locks
fastast doctor . --clean-locks
```

```text
FastAST Doctor Health Check: [HEALTHY]
  Repository: /workspace/myproject
    Admitted disk files: 126
    Config file found:   True
  Lock Status: FREE
  Database: PRESENT
    Size: 3244.0 KB, Integrity: OK, Schema: v10
  Coverage: 126 indexed / 126 disk files
    Entities: 1035 symbols, 6757 edges, 5347 calls

  Recommendations:
    - Repository index is healthy, up to date, and ready for queries.
```

### 10. Background Watcher (Watch)

Run an interactive background filesystem watcher that continuously monitors admitted source files, debounces rapid multi-file saves, and incrementally refreshes the AST symbol index:

```bash
# Start background watcher with default 300ms debounce
fastast watch .

# Configure custom poll interval (seconds) and debounce quiet period (milliseconds)
fastast watch . --poll 0.5 --debounce 250

# Force an immediate baseline index before beginning watch loop
fastast watch . --force
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

When connected as an MCP server, FastAST exposes a complete suite of codebase-memory tools to AI coding agents:

### 1. `index_repository`
Recursively scans and indexes files across the repository into the SQLite symbol and call graph.
- **Parameters:**
  - `directory_path` (`string`, optional, default: `"."`): Root directory to index.
  - `force` (`boolean`, optional, default: `false`): Force reindexing of all files even if unchanged.
- **Returns:** Summary JSON containing scanned files, indexed count, skipped count, symbols, imports, calls, execution latency, and metadata.

### 2. `query_symbols`
Searches for symbol definitions (functions, classes, methods, structs) across the indexed codebase. If the repository is not yet indexed, it automatically indexes it first.
- **Parameters:**
  - `query` (`string`, required): Symbol identifier or substring (e.g. `'authenticate'`, `'Config'`).
  - `kind` (`string`, optional): Filter (`function`, `async_function`, `class`, `method`, `struct`).
  - `directory_path` (`string`, optional, default: `"."`): Project root.
  - `limit` (`integer`, optional, default: `50`): Maximum matches to return.
  - `language` (`string`, optional): Language filter (`python`, `typescript`, `rust`, etc.).
- **Returns:** JSON list of matching symbols with file paths, signatures, line ranges, and docstrings.

### 3. `get_call_graph`
Returns incoming caller and outgoing callee relationships for a function or method.
- **Parameters:**
  - `symbol` (`string`, required): Target function or method name (also accepts `symbol_name`).
  - `directory_path` (`string`, optional, default: `"."`): Project root.
- **Returns:** Inbound callers, outbound callees, structured relationships, and caller/callee counts.

### 4. `get_graph_neighborhood`
Traverses the multi-hop code graph neighborhood (callers, callees, definitions, inheritance, imports) from a root symbol up to a bounded depth limit.
- **Parameters:**
  - `symbol` (`string`, required): Root symbol name to expand from (e.g. `'UserService'`, `'handle_request'`).
  - `directory_path` (`string`, optional, default: `"."`): Project root.
  - `max_depth` (`integer`, optional, default: `2`): Traversal hop limit (1 to 5).
  - `direction` (`string`, optional, default: `"both"`): Direction (`"both"`, `"out"`, or `"in"`).
- **Returns:** JSON containing traversed nodes, confidence-weighted edges, and hop depths.

### 5. `retrieve_evidence` / `query`
Primary search and codebase-memory retrieval tool for coding agents. Combines Dense Semantic Embeddings + SQLite FTS5 BM25 retrieval with structural heuristics (exact name match, symbol kind priority, path proximity, edge degree), expands 1-hop graph neighbors, extracts bounded code snippets, and strictly enforces token budgets.
- **Parameters:**
  - `query` (`string`, required): Target symbol name, conceptual phrase, or technical query.
  - `directory_path` (`string`, optional, default: `"."`): Project root.
  - `kind` (`string`, optional): Symbol kind filter (`function`, `class`, `method`).
  - `language` (`string`, optional): Language filter (`python`, `typescript`, `rust`, etc.).
  - `file_path` (`string`, optional): Target file path filter.
  - `limit` (`integer`, optional, default: `5`): Maximum candidates to return.
  - `max_tokens` (`integer`, optional, default: `2048`): Token budget for evidence snippets.
  - `ranking_method` (`string`, optional, default: `"hybrid"`): Ranking algorithm (`"hybrid"`, `"semantic"`, `"rrf"`, `"bm25"`, or `"heuristic"`).
- **Returns:** JSON containing top-ranked candidates, bounded snippets, relevant files, connected relationships, and token estimates.

### 6. `get_symbol_evidence`
Retrieves a complete, bounded evidence package for a specific symbol: definition metadata, bounded source snippet, and key incoming/outgoing graph neighbors without full file dumps.
- **Parameters:**
  - `symbol` (`string`, required): Target symbol identifier or integer database ID (also accepts `symbol_name_or_id`).
  - `directory_path` (`string`, optional, default: `"."`): Project root.
  - `window_lines` (`integer`, optional, default: `3`): Context padding lines before and after.
  - `max_snippet_lines` (`integer`, optional, default: `50`): Maximum snippet lines before middle truncation.
- **Returns:** JSON containing symbol declaration, bounded snippet, callers, callees, and metadata.

### 7. `get_file_outline`
Retrieves a compact structural outline of a file (classes, methods, top-level functions, line spans, docstrings) without raw code dumps. Essential for token-efficient file exploration.
- **Parameters:**
  - `file_path` (`string`, required): Target file relative or absolute path.
  - `directory_path` (`string`, optional, default: `"."`): Project root.
  - `max_docstring_chars` (`integer`, optional, default: `100`): Maximum characters per docstring summary.
- **Returns:** JSON containing hierarchical classes, methods, functions, and import counts.

### 8. `get_snippet`
Extracts a minimal, bounded source code snippet for a symbol or direct file line range without whole-file dumps.
- **Parameters:**
  - `symbol` (`string`, optional): Symbol name or ID to slice.
  - `file_path` (`string`, optional): Direct file path (used with `start_line`).
  - `start_line` (`integer`, optional): 1-based start line.
  - `end_line` (`integer`, optional): 1-based end line.
  - `window_lines` (`integer`, optional, default: `3`): Context padding lines.
  - `max_snippet_lines` (`integer`, optional, default: `60`): Maximum snippet lines.
  - `directory_path` (`string`, optional, default: `"."`): Project root.
- **Returns:** JSON containing bounded snippet text, start/end lines, truncation flag, and total lines.

### 9. `get_similar_symbols`
Retrieves near-duplicate or structurally similar symbols across the codebase using MinHash ($m=64$) and Locality-Sensitive Hashing ($b=16, r=4$).
- **Parameters:**
  - `symbol` (`string`, required): Target symbol name or integer database ID.
  - `directory_path` (`string`, optional, default: `"."`): Project root.
  - `limit` (`integer`, optional, default: `10`): Maximum matches to return.
  - `min_similarity` (`number`, optional, default: `0.5`): Minimum Jaccard similarity threshold (0.0 to 1.0).
- **Returns:** JSON containing list of similar symbols with file paths, line ranges, signatures, and similarity percentages.

### 10. `get_community`
Retrieves architectural community membership, central hub symbol, and peer symbols for a target symbol using Louvain graph modularity clustering.
- **Parameters:**
  - `symbol` (`string`, required): Target symbol name or integer database ID.
  - `directory_path` (`string`, optional, default: `"."`): Project root.
- **Returns:** JSON containing community ID, community name, graph modularity score, and neighboring peer symbols.

### 11. `list_communities`
Lists all detected architectural modules and functional communities across the codebase.
- **Parameters:**
  - `directory_path` (`string`, optional, default: `"."`): Project root.
  - `limit` (`integer`, optional, default: `20`): Maximum communities to return.
- **Returns:** JSON summary of detected communities with member counts, central hubs, and sample files.

### 12. `diagnose_repository`
Runs comprehensive system diagnostics, lock status checks, SQLite integrity validation, and synchronization analysis.
- **Parameters:**
  - `directory_path` (`string`, optional, default: `"."`): Project root.
  - `full_integrity` (`boolean`, optional, default: `false`): Run full SQLite integrity check.
- **Returns:** JSON report containing status (`healthy`, `warning`, `error`), issues list, and actionable recommendations.

---

## CLI and MCP Parity Matrix

Every major capability in FastAST is available identically via standalone CLI and Model Context Protocol:

| Capability | CLI Command | MCP Tool | Primary Output |
| :--- | :--- | :--- | :--- |
| **Repository Indexing** | `fastast index [dir]` | `index_repository` | Indexed files, symbol counts, latency |
| **Symbol Search** | `fastast symbols <query>` | `query_symbols` | Exact declarations, line spans, signatures |
| **Call Hierarchy** | `fastast calls <symbol>` | `get_call_graph` | Inbound callers and outbound callees |
| **Graph Traversal** | `fastast graph <symbol>` | `get_graph_neighborhood` | Multi-hop nodes and confidence edges |
| **Evidence Retrieval** | `fastast query <query>` | `retrieve_evidence` / `query` | Token-bounded candidates & snippets |
| **Symbol Evidence** | `fastast snippet <sym>` | `get_symbol_evidence` | Declaration snippet + connected neighbors |
| **File Outline** | `fastast outline <file>` | `get_file_outline` | Hierarchical class/method skeleton |
| **Bounded Snippet** | `fastast snippet -f <file>` | `get_snippet` | Sliced source window with context padding |
| **Similar Clones** | `fastast similar <symbol>` | `get_similar_symbols` | Near-duplicate functions (MinHash/LSH) |
| **Community Context** | `fastast community <symbol>` | `get_community` | Architectural cluster & peer symbols |
| **Community List** | `fastast communities` | `list_communities` | Functional modules & central hub symbols |
| **Repository Health** | `fastast doctor [dir]` | `diagnose_repository` | Integrity check, lock state, recommendations |
| **Background Watcher** | `fastast watch [dir]` | *(Background Daemon)* | Debounced continuous incremental AST index |
| **Admission Scan** | `fastast scan [dir]` | *(Internal scanner)* | Admitted files, categories, xxHash3 |

---

## Standardized Agent Response Format

All FastAST MCP tools and CLI commands with `--json` return standardized, agent-friendly JSON structures:

- **`results` / `candidates`**: Primary list of matching items (symbols, candidates, communities, or peers).
- **`evidence` / `snippets`**: Minimal, bounded source code snippets formatted for LLM ingestion.
- **`relationships`**: Connected graph edges (`src`, `dst`, `relation`, `confidence`).
- **`meta`**: Execution context, including counts, token estimates, pagination limits, and applied filters.
- **`error`**: Set to `null` on successful execution, or an informative error string on failure.

---

## Production Hardening & Operational Readiness

FastAST is engineered for zero-maintenance, high-reliability deployment in mission-critical agent environments:

### 1. Filesystem Containment & Path Traversal Prevention
- All file access in `index_file`, `get_snippet`, and `search_symbols` is verified via `validate_safe_path()`.
- Rejects directory traversal attempts (`../../etc/passwd`), absolute path escapes, and unapproved symlink jailbreaks with `PathTraversalError`.
- Never reads files exceeding `max_file_size_bytes` (default 10 MB) into memory.

### 2. Inter-Process Mutual Exclusion & Stale Lock Reclamation
- Prevents concurrent writer collisions across CLI, MCP, and daemon watcher sessions using atomic file locks (`.fastast.lock`).
- Contains owner PID, host, and timestamp metadata.
- Automatically reclaims abandoned locks if the owning process has exited (`os.kill(pid, 0)`) or if lock age exceeds `stale_lock_seconds`.

### 3. SQLite Persistence Safety & Automatic Corruption Recovery
- Configured with `PRAGMA busy_timeout = 15000` (15s) to eliminate spurious `database is locked` concurrency errors.
- Enforces strict foreign keys (`PRAGMA foreign_keys = ON`) with cascade deletions on file changes.
- Automatic corruption detection (`check_database_integrity` via `PRAGMA quick_check`).
- If a corrupt database is detected, `safe_repair_or_recreate_db` archives the damaged file as `.fastast.db.corrupt.<timestamp>` and transparently reinitializes a pristine database.
- Schema migration tracking via `schema_migrations` and `PRAGMA user_version` (Version 10).

### 4. Bounded Resource Guarantees
- Graph expansion is strictly bounded (`max_depth <= 3`, `max_fanout <= 20`, `max_total_nodes <= 50`).
- Snippet line lengths are clamped (`window_lines <= 50`, `max_snippet_lines <= 500`).
- Candidate query generation is capped (`limit <= 200`, `max_tokens <= 100,000`).

### 5. Centralized Configuration
Configurable via `.fastastrc.json` in the project root or environment variables:
| Environment Variable | Config Property | Default | Description |
| :--- | :--- | :--- | :--- |
| `FASTAST_DB_NAME` | `db_name` | `.fastast.db` | SQLite database file name |
| `FASTAST_MAX_TOKENS` | `max_tokens` | `2048` | Default token budget for evidence bundles |
| `FASTAST_LOG_LEVEL` | `log_level` | `INFO` | Logging level (`DEBUG`, `INFO`, `WARNING`, `ERROR`) |
| `FASTAST_LOCK_TIMEOUT`| `lock_timeout_seconds` | `30.0` | Maximum seconds to wait for repository lock |
| `FASTAST_WATCH_DEBOUNCE_MS` | `watch_debounce_ms` | `300` | Quiet window before triggering watcher index |
| `FASTAST_MAX_FILE_SIZE` | `max_file_size_bytes` | `10485760` | Maximum admitted file size in bytes (10 MB) |
| `FASTAST_DEFAULT_RANKING` | `default_ranking_method` | `hybrid` | Default ranking: `hybrid`, `semantic`, `rrf`, `bm25` |

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
    ├── symbol_embeddings table (dense vectors, model, dimensions, packed float BLOB)
    ├── symbol_similarity table (MinHash/LSH near-duplicate symbol pairs with Jaccard similarity & cascade delete)
    ├── symbol_communities table (Louvain modularity clusters, semantic names, modularity score & cascade delete)
    ├── schema_migrations table (migration version, applied timestamp, description)
    └── fastast_metadata table (key-value system properties, schema version)
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
