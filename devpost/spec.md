---
doc: spec
status: approved
---

# FastAST — Technical Specification

## How This Works, In Plain Language

FastAST is a high-performance repository context engine and syntax-guaranteed context pruning system. Coding agents face two major obstacles in real codebases:
1. **Finding relevant code:** Locating where symbols are declared, imported, and called across hundreds of files without grepping entire directory trees.
2. **Context window limits:** Reading entire modules wastes thousands of tokens, while naive line stripping breaks Python indentation and imports.

FastAST solves both:
- **Repository Indexing:** Walks the codebase, parses every Python file with Tree-Sitter, extracts an AST symbol graph (functions, classes, methods, imports, and caller-to-callee invocations), and stores it in an indexed local SQLite database (`.fastast.db`).
- **Context Pruning:** For matched files, FastAST selectively prunes irrelevant function bodies and replaces them with indented `pass` placeholders in native Rust, guaranteeing 100% syntactically valid Python in <15ms.
- **Agent Integration:** Exposes `index_repository`, `query_symbols`, `get_call_graph`, and `prune_context` via the Model Context Protocol (MCP) over JSON-RPC stdio.

## Architecture

```
[Agent: Claude Code / Cursor]
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
       ├──► get_call_graph()   ──► [SQLite DB Graph Query]
       │
       └──► prune_context()    ──► [Rust Core: src/lib.rs] (Tree-Sitter Dual-Rubric Pruning)
```

## Stack

- **Rust (2021 Edition):**
  - `tree-sitter` (v0.22) & `tree-sitter-python` (v0.21): In-memory AST parsing, symbol extraction, and call relationship detection.
  - `tiktoken-rs` (v0.5): `cl100k_base` BPE tokenizer.
  - `pyo3` (v0.21): High-performance C-API bridge.
- **Python (>=3.10):**
  - `sqlite3`: Standard library embedded database with WAL mode and indexed lookup tables.
  - `mcp`: Official Model Context Protocol SDK.
  - `ast`: Standard library Python syntax verification.
- **Storage:** Embedded SQLite database (`.fastast.db`).

## SQLite Database Schema (`.fastast.db`)

```sql
CREATE TABLE IF NOT EXISTS files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    path TEXT UNIQUE NOT NULL,
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
    kind TEXT NOT NULL, -- 'function', 'async_function', 'class', 'method'
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

CREATE INDEX IF NOT EXISTS idx_symbols_name ON symbols(name);
CREATE INDEX IF NOT EXISTS idx_symbols_file ON symbols(file_id);
CREATE INDEX IF NOT EXISTS idx_imports_module ON imports(module);
CREATE INDEX IF NOT EXISTS idx_calls_callee ON calls(callee_name);
CREATE INDEX IF NOT EXISTS idx_calls_caller ON calls(caller_symbol_id);
```

## Components

### 1. Native AST Symbol & Call Extractor (`src/lib.rs` & `src/parser.rs`)
- Extends the Rust core with `extract_file_symbols(code_text: &str) -> PyResult<ExtractedFileData>`.
- Identifies:
  - Functions, async functions, classes, and nested methods.
  - Signatures, line spans, and docstrings.
  - Import statements (`import ...`, `from ... import ...`).
  - Function call invocations (`call_expression`) and attributes, mapped to their enclosing caller function.

### 2. SQLite Database Manager (`python/fastast/db.py`)
- Initializes SQLite database with WAL journal mode.
- Provides transactional batch APIs:
  - `store_file_data(path, hash, mtime, lines, tokens, symbols, imports, calls)`
  - `search_symbols(query, kind)`
  - `get_call_graph(symbol_name)`
  - `get_file_symbols(file_path)`

### 3. Repository Walker & Indexer (`python/fastast/indexer.py`)
- Recursively discovers `.py` files, ignoring `.git`, `.venv`, `__pycache__`, `node_modules`, and `.egg-info`.
- Computes SHA256 hashes to skip unchanged files on re-indexing.
- Runs native Rust Tree-Sitter extraction and commits records into SQLite.

### 4. FastMCP Server (`python/fastast/server.py`)
- Exposes MCP tools:
  - `index_repository(directory_path: str = ".") -> str (JSON)`
  - `query_symbols(query: str, kind: Optional[str] = None) -> str (JSON)`
  - `get_call_graph(symbol_name: str) -> str (JSON)`
  - `prune_context(code_text: str, focus_query: str, threshold: float = 0.5) -> str (JSON)`

### 5. CLI Runner (`python/fastast/cli.py`)
- Subcommands:
  - `fastast index [directory]`
  - `fastast symbols <query>`
  - `fastast calls <symbol>`
  - `fastast prune <file> --query <query>`
