---
doc: spec
status: approved
---

# FastAST — Technical Specification

## How This Works, In Plain Language

FastAST is a high-performance repository indexing engine and symbol graph service for AI coding agents. Coding agents need deep, accurate architectural awareness: locating where symbols are declared, imported, and called across hundreds of files without grepping entire directory trees or waiting for heavy language servers.

FastAST solves this with:
- **Repository Indexing:** Walks the codebase, parses source files with native Tree-Sitter grammars across 8+ languages (Python, Java, JavaScript, TypeScript, Rust, HTML, CSS, JSON, TOML), extracts an AST symbol graph (functions, classes, methods, interfaces, types, imports, and caller-to-callee invocations), and stores it in an indexed local SQLite database (`.fastast.db`).
- **Incremental Caching:** Computes SHA-256 hashes and modification timestamps to skip unchanged files instantly.
- **Agent Integration:** Exposes `index_repository`, `query_symbols`, and `get_call_graph` via the Model Context Protocol (MCP) over JSON-RPC stdio.
- **CLI Utilities:** Offers `fastast index`, `fastast symbols`, and `fastast calls` for developer terminal use.

## Architecture

```
[Agent: Claude Code / Cursor / Windsurf]
       │
       ▼ (1) MCP JSON-RPC Stdio
[FastMCP Server: python/fastast/server.py]
       │
       ├──► index_repository() ──► [Indexer: python/fastast/indexer.py]
       │                                 │
       │                                 ├──► [Rust Core: src/lib.rs] (Tree-Sitter AST extraction)
       │                                 └──► [SQLite DB: .fastast.db via python/fastast/db.py]
       │
       ├──► query_symbols()    ──► [SQLite DB Query]
       │
       └──► get_call_graph()   ──► [SQLite DB Graph Query]
```

## Stack

- **Rust (2021 Edition):**
  - `tree-sitter` (v0.22) & grammars (`tree-sitter-python`, `tree-sitter-java`, `tree-sitter-javascript`, `tree-sitter-typescript`, `tree-sitter-rust`, `tree-sitter-html`, `tree-sitter-css`): In-memory AST parsing, symbol extraction, and call relationship detection.
  - `serde_json` (v1.0) & `toml` (v1.1): Native configuration format parsers.
  - `tiktoken-rs` (v0.5): `cl100k_base` BPE tokenizer for token counting.
  - `pyo3` (v0.21): High-performance C-API bridge.
- **Python (>=3.10):**
  - `sqlite3`: Standard library embedded database with WAL mode, foreign keys, and indexed lookup tables.
  - `mcp`: Official Model Context Protocol SDK.
- **Storage:** Embedded SQLite database (`.fastast.db`).

## SQLite Database Schema (`.fastast.db`)

```sql
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    path TEXT UNIQUE NOT NULL,
    language TEXT NOT NULL DEFAULT 'python',
    hash TEXT NOT NULL,
    mtime REAL NOT NULL,
    total_lines INTEGER NOT NULL,
    total_tokens INTEGER NOT NULL,
    has_syntax_error INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS symbols (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    file_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    kind TEXT NOT NULL,
    signature TEXT NOT NULL,
    start_line INTEGER NOT NULL,
    end_line INTEGER NOT NULL,
    parent_symbol_id INTEGER,
    docstring TEXT,
    FOREIGN KEY(file_id) REFERENCES files(id) ON DELETE CASCADE,
    FOREIGN KEY(parent_symbol_id) REFERENCES symbols(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS imports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    file_id INTEGER NOT NULL,
    module TEXT NOT NULL,
    name TEXT,
    alias TEXT,
    line_number INTEGER NOT NULL,
    FOREIGN KEY(file_id) REFERENCES files(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS calls (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    file_id INTEGER NOT NULL,
    caller_symbol_id INTEGER,
    callee_name TEXT NOT NULL,
    line_number INTEGER NOT NULL,
    FOREIGN KEY(file_id) REFERENCES files(id) ON DELETE CASCADE,
    FOREIGN KEY(caller_symbol_id) REFERENCES symbols(id) ON DELETE SET NULL
);
```

## MCP Tools Interface

1. **`index_repository`**
   - Inputs: `directory_path` (str, default: '.'), `force` (bool, default: False)
   - Outputs: JSON summary with scanned files, indexed count, skipped count, symbols, imports, calls, elapsed time.

2. **`query_symbols`**
   - Inputs: `query` (str), `kind` (optional str), `directory_path` (str), `limit` (int, default: 50), `language` (optional str)
   - Outputs: JSON list of matched symbols with names, signatures, file paths, line ranges, and docstrings.

3. **`get_call_graph`**
   - Inputs: `symbol_name` (str), `directory_path` (str)
   - Outputs: JSON call hierarchy with incoming callers and outgoing callees.
