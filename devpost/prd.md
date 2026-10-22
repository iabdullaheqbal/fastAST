---
doc: prd
status: approved
---

# FastAST — Product Requirements

A high-performance, full-repository AST-based code indexer and MCP server for AI coding agents, powered by a native Rust Tree-Sitter parsing engine and local SQLite symbol graph.
Source: `scope.md > Who It's For`, `scope.md > The Unique Kernel`

## The Core Journey
Source: `scope.md > The Core Loop`, `scope.md > What "Working" Looks Like`

1. **Discovery & Connection:** An AI coding agent (e.g., Claude Code, Cursor) initializes an MCP connection to the FastAST JSON-RPC server and discovers repository indexer tools: `index_repository`, `query_symbols`, and `get_call_graph`.
2. **Repository Indexing:** The agent or developer initiates indexing for a project directory via `index_repository` or CLI `fastast index .`. FastAST walks the directory, parses all supported language files with Tree-Sitter, extracts symbols, imports, and calls, and populates the local SQLite database (`.fastast.db`).
3. **Symbol Discovery:** When an agent receives an engineering task (e.g., "Fix database timeout in task execution"), it calls `query_symbols("process_request")` to locate exact file paths, signatures, line numbers, and docstrings across the codebase.
4. **Call Graph Tracing:** The agent calls `get_call_graph("process_request")` to trace callers and callees, understanding invocation dependencies before planning or editing code.
5. **Agent Ingestion:** The agent resolves tasks accurately using deep cross-module symbol and call graph awareness with deterministic sub-millisecond retrieval.

## Interaction Surface (Screens & Layout)
Source: `scope.md > The Core Loop`

FastAST exposes two primary interfaces:
- **MCP Tool Suite:**
  - `index_repository(directory_path: str = ".", force: bool = False) -> str`: Scans and indexes the codebase.
  - `query_symbols(query: str, kind: Optional[str] = None, directory_path: str = ".", limit: int = 50, language: Optional[str] = None) -> str`: Searches symbols (functions, classes, methods, interfaces, etc.).
  - `get_call_graph(symbol_name: str, directory_path: str = ".") -> str`: Returns incoming/outgoing call relationships.
- **CLI Runner:**
  - `fastast index [dir] [--force] [--json]`: Indexes project directory into SQLite.
  - `fastast symbols <query> [-k kind] [-L language] [-l limit] [--json]`: Queries symbols from the SQLite index.
  - `fastast calls <symbol> [--json]`: Traces call graph from the SQLite index.

## Features and Behavior

### 1. Local SQLite Symbol & Dependency Graph
Source: `scope.md > The Unique Kernel`

FastAST manages a local SQLite database (`.fastast.db`) structured across 4 normalized tables:
- `files`: File paths, language, content hashes, modification timestamps, line counts, token counts, syntax error flags.
- `symbols`: Extracted functions, async functions, classes, methods, interfaces, enums, signatures, line spans, docstrings, and parent scope IDs.
- `imports`: All module-level and scoped import statements (`module`, `name`, `alias`, `line_number`).
- `calls`: Function/method call invocations linking caller symbols to callee names and line numbers.

**Acceptance Criteria:**
- [x] Recursively indexes all supported language files in the target directory, excluding `.git`, `.venv`, `node_modules`, etc.
- [x] Stores symbols with accurate line ranges and signatures across 8+ languages.
- [x] Records caller-to-callee relationships extracted by Tree-Sitter AST inspection.
- [x] Supports incremental re-indexing with SHA-256 hash and mtime verification.

### 2. Multi-File MCP Query Tools
Source: `scope.md > The Core Loop`

- **`index_repository`:** Returns summary JSON: `{ "indexed_files": 42, "total_symbols": 310, "total_calls": 580, "elapsed_ms": 65.2 }`.
- **`query_symbols`:** Returns matched symbols across the codebase with file paths, line ranges, kinds, and signatures.
- **`get_call_graph`:** Returns incoming callers (`callers`) and outgoing calls (`callees`) for a given symbol name.

## States and Boundaries

- **Unindexed State:** If query tools are invoked before indexing, FastAST automatically creates and populates the index first.
- **Zero Symbol Match State:** Returns an empty result list with clear JSON structure.
- **Pre-existing Syntax Error State:** Malformed files are flagged in the `files` table and skipped gracefully without interrupting indexing of remaining files.
- **Storage Boundary:** Embedded SQLite database located at `.fastast.db` in the project root. Zero network dependencies.

## What We've Built

1. Native Rust Tree-Sitter AST symbol & call relationship extractor (`src/`).
2. SQLite schema & database manager (`python/fastast/db.py`).
3. Incremental repository walker and indexing pipeline (`python/fastast/indexer.py`).
4. FastMCP server exposing repository and symbol tools (`python/fastast/server.py`).
5. CLI commands for indexing, symbol querying, and call graphs (`python/fastast/cli.py`).
