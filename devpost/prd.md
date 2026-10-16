---
doc: prd
status: approved
---

# FastAST — Product Requirements

A high-performance, full-repository context engine and syntax-guaranteed context pruning MCP server for AI coding agents, powered by a native Rust Tree-Sitter engine and local SQLite symbol graph.
Source: `scope.md > Who It's For`, `scope.md > The Unique Kernel`

## The Core Journey
Source: `scope.md > The Core Loop`, `scope.md > What "Working" Looks Like`

1. **Discovery & Connection:** An AI coding agent (e.g., Claude Code, Cursor) initializes an MCP connection to the FastAST JSON-RPC server and discovers repository context tools: `index_repository`, `query_symbols`, `get_call_graph`, and `prune_context`.
2. **Repository Indexing:** The agent or developer initiates indexing for a project directory. FastAST walks the directory, parses all Python files with Tree-Sitter, extracts functions, classes, methods, imports, and calls, and populates the local SQLite database (`.fastast.db`).
3. **Symbol & Graph Discovery:** When an agent receives an engineering task (e.g., "Fix database timeout in task execution"), it calls `query_symbols("process_request")` and `get_call_graph("process_request")` to identify relevant files, signatures, and dependencies across the codebase.
4. **Context Pruning & Delivery:** For large relevant files, the agent calls `prune_context(code_text, focus_query, threshold=0.5)`. The native Rust engine prunes unneeded function bodies, inserting indented `pass` stubs with guaranteed 100% valid Python syntax in <15ms.
5. **Agent Ingestion:** The agent resolves tasks accurately using deep cross-module symbol awareness and compact prompt context without hitting context limits or syntax errors.

## Interaction Surface (Screens & Layout)
Source: `scope.md > The Core Loop`

FastAST exposes two primary interfaces:
- **MCP Tool Suite:**
  - `index_repository(directory: str = ".") -> str`: Scans and indexes the codebase.
  - `query_symbols(query: str, kind: Optional[str] = None) -> str`: Searches symbols (functions, classes, methods).
  - `get_call_graph(symbol_name: str) -> str`: Returns incoming/outgoing call relationships.
  - `prune_context(code_text: str, focus_query: str, threshold: float = 0.5) -> str`: Single-file dual-rubric AST pruner.
- **CLI Runner:**
  - `fastast index [dir]`: Indexes project directory into SQLite.
  - `fastast symbols <query>`: Queries symbols from the SQLite index.
  - `fastast calls <symbol>`: Traces call graph from the SQLite index.
  - `fastast prune <file> --query <query>`: Prunes single file and displays latency/token reduction metrics.

## Features and Behavior

### 1. Local SQLite Symbol & Dependency Graph
Source: `scope.md > The Unique Kernel`

FastAST manages a local SQLite database (`.fastast.db`) structured across 4 normalized tables:
- `files`: File paths, content hashes, modification timestamps, line counts, and token counts.
- `symbols`: Extracted functions, async functions, classes, and methods, including signatures, line spans, docstrings, and parent scope IDs.
- `imports`: All module-level and function-level import statements (`module`, `name`, `alias`, `line_number`).
- `calls`: Function/method call invocations linking caller symbols to callee names and line numbers.

**Acceptance Criteria:**
- [ ] Recursively indexes all `.py` files in the target directory, excluding `.git`, `.venv`, and `__pycache__`.
- [ ] Stores symbols with accurate line ranges and signatures.
- [ ] Records caller-to-callee relationships extracted by Tree-Sitter AST inspection.
- [ ] Supports re-indexing with file hash verification to update changed files.

### 2. Multi-File MCP Query Tools
Source: `scope.md > The Core Loop`

- **`index_repository`:** Returns summary JSON: `{ "indexed_files": 42, "total_symbols": 310, "total_calls": 580, "elapsed_ms": 65.2 }`.
- **`query_symbols`:** Returns matched symbols across the codebase with file paths, line ranges, and signatures.
- **`get_call_graph`:** Returns incoming callers (`callers`) and outgoing calls (`callees`) for a given symbol name.

### 3. Dual-Rubric Pruning & AST Structural Repair
Source: `scope.md > The Unique Kernel`

- Preserves the proven single-file pruning engine:
  - Preserves 100% of imports, decorators, and signatures.
  - Replaces unneeded bodies with indented `pass` placeholders.
  - Validates output with `ast.parse()`, achieving 60–75%+ token reduction in <15ms.

## States and Boundaries

- **Unindexed State:** If query tools are invoked before indexing, FastAST returns a clear diagnostic message prompt suggesting `index_repository`.
- **Zero Symbol Match State:** Returns an empty result list with helpful query hints.
- **Pre-existing Syntax Error State:** Malformed Python files are flagged in the `files` table and skipped gracefully without interrupting indexing of remaining files.
- **Storage Boundary:** Embedded SQLite database located at `.fastast.db` in the project root. Zero network dependencies.

## What We're Building

1. Native Rust Tree-Sitter AST symbol & call relationship extractor.
2. SQLite schema & database manager (`python/fastast/db.py`).
3. Repository walker and indexing pipeline (`python/fastast/indexer.py`).
4. Expanded FastMCP server exposing repository and pruning tools (`python/fastast/server.py`).
5. CLI commands for indexing, querying, and pruning (`python/fastast/cli.py`).
