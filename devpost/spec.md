---
doc: spec
status: approved
---

# FastAST — Technical Specification

## How This Works, In Plain Language

FastAST is a high-performance codebase-memory engine (`AST → Graph → Retrieval`) and symbol graph service for AI coding agents. Coding agents need deep, accurate architectural awareness: locating where symbols are declared, imported, and called across hundreds of files without grepping entire directory trees or waiting for heavy language servers.

FastAST solves this with:
- **Repository Indexing & AST Extraction:** Walks the codebase, parses source files with native Tree-Sitter grammars across 9 languages (Python, Java, JavaScript, TypeScript, Rust, HTML, CSS, JSON, TOML), extracts an AST symbol graph (functions, classes, methods, interfaces, types, imports, and caller-to-callee invocations), and stores it in an indexed local SQLite database (`fastast.db`).
- **Symbol & Edge Graph:** Maintains a confidence-weighted code graph connecting files, symbols, definitions, and calls.
- **Hybrid Retrieval & Evidence Windows:** Delivers line-bounded code evidence and graph neighborhood context for LLM agents.
- **Incremental Caching:** Computes content hashes and modification timestamps to skip unchanged files instantly.
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
       │                                 └──► [SQLite DB: fastast.db via python/fastast/db.py]
       │
       ├──► query_symbols()    ──► [SQLite DB & Retrieval Engine]
       │
       └──► get_call_graph()   ──► [SQLite Graph Edge Traversal]
```

## Core Data Model

Defined in `src/model.rs` and `python/fastast/model.py`:
- **`FileRecord`**: `(path, language, hash, mtime, status, total_lines, total_tokens, has_syntax_error)`
- **`SymbolRecord`**: `(id, name, kind, file, start_line, end_line, confidence, signature, parent_name, docstring)`
- **`EdgeRecord`**: `(src, dst, relation, confidence, line_number)`
- **`Candidate`**: `(symbol_id, score, reasons, neighbors, evidence_window)`
- **`EvidenceWindow`**: `(start_line, end_line, snippet)`

## Stack

- **Rust (2021 Edition):**
  - `tree-sitter` (v0.22) & grammars (`tree-sitter-python`, `tree-sitter-java`, `tree-sitter-javascript`, `tree-sitter-typescript`, `tree-sitter-rust`, `tree-sitter-html`, `tree-sitter-css`): In-memory AST parsing, symbol extraction, and call relationship detection.
  - `serde_json` (v1.0) & `toml` (v1.1): Native configuration format parsers.
  - `tiktoken-rs` (v0.5): `cl100k_base` BPE tokenizer for token counting.
  - `pyo3` (v0.21): High-performance C-API bridge.
- **Python (>=3.10):**
  - `sqlite3`: Standard library embedded database with WAL mode, foreign keys, and indexed lookup tables.
  - `mcp`: Official Model Context Protocol SDK.
- **Storage:** Embedded SQLite database (`fastast.db`).

## SQLite Database Schema (`fastast.db`)

```sql
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    path TEXT UNIQUE NOT NULL,
    language TEXT NOT NULL DEFAULT 'python',
    hash TEXT NOT NULL,
    mtime REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'unchanged',
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
    confidence REAL NOT NULL DEFAULT 1.0,
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

CREATE TABLE IF NOT EXISTS edges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    file_id INTEGER NOT NULL,
    src TEXT NOT NULL,
    dst TEXT NOT NULL,
    relation TEXT NOT NULL DEFAULT 'calls',
    confidence REAL NOT NULL DEFAULT 1.0,
    line_number INTEGER,
    FOREIGN KEY(file_id) REFERENCES files(id) ON DELETE CASCADE
);
```

## Complete Algorithm Stack
Detailed design and formulas documented in `docs/ARCHITECTURE.md`.
