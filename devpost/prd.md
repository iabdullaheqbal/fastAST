---
doc: prd
status: approved
---

# FastAST — Product Requirements

A high-performance codebase-memory engine (`AST → Graph → Retrieval`) and MCP server for AI coding agents, powered by a native Rust Tree-Sitter parsing engine, local SQLite symbol/edge graph, and hybrid evidence retrieval.
Source: `scope.md > Who It's For`, `scope.md > The Unique Kernel`

## The Core Journey
Source: `scope.md > The Core Loop`, `scope.md > What "Working" Looks Like`

1. **Discovery & Connection:** An AI coding agent (e.g., Claude Code, Cursor) initializes an MCP connection to the FastAST JSON-RPC server and discovers codebase-memory tools: `index_repository`, `query_symbols`, and `get_call_graph`.
2. **Repository Indexing & AST Extraction:** The agent or developer initiates indexing for a project directory via `index_repository` or CLI `fastast index .`. FastAST walks the directory, parses all supported language files with Tree-Sitter, extracts symbols, imports, and calls, and populates the local SQLite database (`fastast.db`).
3. **Symbol/Edge Graph Construction:** FastAST builds a confidence-weighted code graph connecting files, symbols, definitions, calls, and imports into normalized tables (`files`, `symbols`, `imports`, `calls`, `edges`).
4. **Hybrid Retrieval & Candidate Selection:** When an agent queries a concept or symbol, FastAST retrieves relevant symbols via BM25 lexical match, expands local graph neighborhoods via bounded BFS traversal, and generates actionable `Candidate` bundles with exact line-bounded `EvidenceWindow` snippets.
5. **Agent Ingestion:** The agent resolves tasks accurately using deep cross-module structural awareness without context window saturation.

## Interaction Surface (Screens & Layout)
Source: `scope.md > The Core Loop`

FastAST exposes two primary interfaces:
- **MCP Tool Suite:**
  - `index_repository(directory_path: str = ".", force: bool = False) -> str`: Scans and indexes the codebase into SQLite.
  - `query_symbols(query: str, kind: Optional[str] = None, directory_path: str = ".", limit: int = 50, language: Optional[str] = None) -> str`: Searches symbols (functions, classes, methods, interfaces, etc.) with confidence scores.
  - `get_call_graph(symbol_name: str, directory_path: str = ".", direction: str = "both") -> str`: Returns incoming/outgoing call relationships.
- **CLI Runner:**
  - `fastast index [dir] [--db <path>] [--force] [--json]`: Indexes project directory into SQLite.
  - `fastast symbols <db> [--query <term>] [-k kind] [-L language] [-l limit] [--json]`: Queries symbols from the SQLite index.
  - `fastast calls <db> --symbol <name> [--direction <callers|callees|both>] [--json]`: Traces call graph from the SQLite index.

## Features and Behavior

### 1. Local SQLite Symbol & Dependency Graph
Source: `scope.md > The Unique Kernel`

FastAST manages a local SQLite database (`fastast.db`) structured across 5 normalized tables:
- `files`: File paths, language, content hashes (xxHash3/BLAKE3), mtime, status, line counts, token counts, syntax error flags.
- `symbols`: Extracted functions, classes, methods, interfaces, structs, enums, signatures, line spans, docstrings, confidence scores, and parent scope IDs.
- `imports`: All module-level and scoped import statements (`module`, `name`, `alias`, `line_number`).
- `calls`: Function/method call invocations linking caller symbols to callee names and line numbers.
- `edges`: Directed graph edges connecting symbols (`src`, `dst`, `relation`, `confidence`, `line_number`).

**Acceptance Criteria:**
- [x] Recursively indexes all supported language files in the target directory, excluding `.git`, `.venv`, `node_modules`, etc.
- [x] Stores symbols with accurate line ranges and signatures across 9 languages.
- [x] Records caller-to-callee and definition relationships with confidence scoring.
- [x] Supports incremental re-indexing with hash and mtime verification.

### 2. Multi-File MCP Query Tools
Source: `scope.md > The Core Loop`

- **`index_repository`:** Returns summary JSON: `{ "files_indexed": 42, "symbols_indexed": 310, "calls_indexed": 580, "elapsed_ms": 65.2 }`.
- **`query_symbols`:** Returns matched symbols across the codebase with file paths, line ranges, kinds, signatures, and confidence.
- **`get_call_graph`:** Returns incoming callers (`callers`) and outgoing calls (`callees`) for a given symbol name.

## States and Boundaries

- **Unindexed State:** If query tools are invoked before indexing, FastAST automatically creates and populates the index first.
- **Zero Symbol Match State:** Returns an empty result list with clean JSON structure.
- **Pre-existing Syntax Error State:** Malformed files are flagged in the `files` table and skipped gracefully without interrupting indexing of remaining files.
- **Storage Boundary:** Embedded SQLite database located at `fastast.db` in the project root. Zero network dependencies.

## What We've Built

1. Native Rust Tree-Sitter AST symbol & call relationship extractor (`src/`).
2. Core domain data models: `FileRecord`, `SymbolRecord`, `EdgeRecord`, `Candidate`, `EvidenceWindow` (`src/model.rs` and `python/fastast/model.py`).
3. SQLite schema, graph edges & database manager (`python/fastast/db.py`).
4. Incremental repository walker and indexing pipeline (`python/fastast/indexer.py`).
5. FastMCP server exposing repository and symbol tools (`python/fastast/server.py`).
6. CLI commands for indexing, symbol querying, and call graphs (`python/fastast/cli.py`).
