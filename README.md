# FastAST

**High-performance Codebase-Memory Engine (`AST → Graph → Retrieval`) for AI coding agents.**

[![License: Apache-2.0](https://img.shields.io/badge/License-Apache--2.0-blue.svg)](LICENSE)
[![Version: 0.2.0](https://img.shields.io/badge/Version-0.2.0-green.svg)](pyproject.toml)
[![Language: Rust + Python](https://img.shields.io/badge/Language-Rust%20%2B%20Python-orange.svg)](https://www.rust-lang.org/)
[![Model Context Protocol](https://img.shields.io/badge/Protocol-MCP%20JSON--RPC-purple.svg)](https://modelcontextprotocol.io/)
[![Database: SQLite WAL](https://img.shields.io/badge/Database-SQLite%20WAL-blue.svg)](https://www.sqlite.org/)

FastAST equips AI coding agents (**Claude Code**, **Cursor**, **Codex**, **Windsurf**, and **SWE-bench harnesses**) with fast, local, deterministic repository memory across 9 languages:

1. **Multi-Language AST Extraction:** Parses source files with compiled Rust Tree-Sitter grammars to extract declarations, signatures, docstrings, imports, and call sites.
2. **Persistent Code Graph:** Stores normalized symbols and confidence-weighted relationships (`calls`, `imports`, `defines`, `inherits`) in a local SQLite WAL database (`.fastast.db`).
3. **Hybrid Retrieval & Token-Bounded Evidence:** Combines dense semantic embeddings, SQLite FTS5 BM25, and structural graph signals to return compact evidence bundles within a strict token budget.
4. **Structural Similarity & Community Clustering:** Detects near-duplicate code via MinHash + LSH and discovers cohesive architectural modules via Louvain modularity clustering.
5. **Agent-Native CLI & MCP Server:** Exposes identical capabilities via the `fastast` CLI, Python API, and `fastast-mcp` stdio server.

> Detailed Specifications: [Architecture (`docs/ARCH.md`)](docs/ARCH.md) · [Technical Specification (`docs/SPEC.md`)](docs/SPEC.md)

---

## Install

Requires **Python >= 3.10** (and **Rust >= 1.70** when building from source):

```bash
git clone https://github.com/iabdullaheqbal/fastAST.git
cd fastAST

# Install with pip or uv
pip install .
# or:
uv pip install .

# Verify CLI and MCP entrypoints
fastast --version
fastast-mcp --version
```

### FastAST Lens (3D Globe Graph & Web UI)

Launch the interactive 3D Globe Graph & Codebase Explorer:

```bash
# Start backend API (:4200) and frontend UI (:5173) together
./start_ui.sh

# Or run frontend independently
cd ui
npm install
npm run dev
```

For editable local development:

```bash
pip install -e .
```

---

## Quick Start

### 1. Scan & Index a Repository

```bash
# Preview admitted repository files and language breakdown
fastast scan .
fastast scan . -L python,rust

# Index repository into .fastast.db (incremental via xxHash3 / SHA-256 + mtime)
fastast index .
fastast index . --force
```

### 2. Query Codebase Memory & Evidence

Retrieve ranked symbols, bounded code snippets, and 1-hop graph context within a strict token budget:

```bash
# Hybrid retrieval (Dense Semantic + BM25 + graph heuristics)
fastast query "handle_request"

# Retrieve a token-bounded evidence bundle for conceptual or symbol queries
fastast evidence "database connection recovery" --max-tokens 1024

# Choose ranking mode: hybrid (default), semantic, rrf, bm25, or heuristic
fastast query "user authentication" --ranking semantic --limit 3
```

### 3. Inspect File Outlines, Snippets & Symbols

```bash
# Structural file outline (classes, methods, functions, line spans) without full file dumps
fastast outline python/fastast/indexer.py

# Extract a bounded code snippet around a symbol or line range
fastast snippet "index_repository"
fastast snippet -f python/fastast/db.py --start 1 --end 40

# Search symbol declarations by name, kind, or language
fastast symbols "RetrievalEngine"
fastast symbols "Config" -L python --kind class
```

### 4. Trace Call Hierarchy & Graph Neighborhoods

```bash
# Inspect inbound callers and outbound callees
fastast calls "index_repository"

# Multi-hop bounded graph neighborhood traversal
fastast graph "RetrievalEngine" --depth 2 --direction both
```

### 5. Code Similarity & Architectural Communities

```bash
# Find near-duplicate or structurally similar symbols (MinHash + LSH)
fastast similar "handle_request" --min-sim 0.5

# List cohesive functional modules detected via Louvain modularity clustering
fastast communities
fastast community "RetrievalEngine"
```

### 6. Diagnostics & Background Watcher

```bash
# Verify database integrity, schema version, lock state, and index coverage
fastast doctor .
fastast doctor . --full --clean-locks

# Watch repository for file changes and incrementally re-index
fastast watch .
```

> **JSON Mode:** Every CLI subcommand supports `--json` for structured agent automation (returning standardized `results`, `meta`, and `error` fields).

---

## MCP Setup

`fastast-mcp` is a native [Model Context Protocol](https://modelcontextprotocol.io/) server communicating over stdio JSON-RPC 2.0.

### Claude Code

Register FastAST using the Claude CLI:

### Model Context Protocol (MCP) Setup

FastAST exposes its core codebase-memory engine over a standards-compliant Model Context Protocol (MCP) JSON-RPC 2.0 server supporting **stdio** (primary) and **SSE/HTTP** transports.

#### Run Command
```bash
# Direct Python module invocation
python3 -m fastast.mcp

# Or via FastAST CLI
fastast mcp

# Or SSE transport on custom port
fastast mcp --transport sse --port 4200
```

#### 1. Cursor IDE
Add to `.cursor/mcp.json` or user `~/.cursor/mcp.json`:
```json
{
  "mcpServers": {
    "fastast": {
      "command": "python3",
      "args": ["-m", "fastast.mcp"],
      "cwd": "${workspaceFolder}",
      "env": {
        "PYTHONPATH": "${workspaceFolder}/python"
      }
    }
  }
}
```

#### 2. VS Code (Official MCP / Continue / Cline)
Add to `.vscode/mcp.json`:
```json
{
  "servers": {
    "fastast": {
      "type": "stdio",
      "command": "python3",
      "args": ["-m", "fastast.mcp"],
      "env": {
        "PYTHONPATH": "${workspaceFolder}/python"
      }
    }
  }
}
```
Or for **Continue** (`~/.continue/config.json`):
```json
{
  "experimental": {
    "modelContextProtocolServers": [
      {
        "transport": {
          "type": "stdio",
          "command": "python3",
          "args": ["-m", "fastast.mcp"],
          "env": {
            "PYTHONPATH": "/path/to/fastast/python"
          }
        }
      }
    ]
  }
}
```

#### 3. Claude Desktop
Add to `claude_desktop_config.json` (macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`, Linux: `~/.config/Claude/claude_desktop_config.json`, Windows: `%APPDATA%\Claude\claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "fastast": {
      "command": "python3",
      "args": ["-m", "fastast.mcp"],
      "cwd": "/path/to/repository",
      "env": {
        "PYTHONPATH": "/path/to/fastast/python"
      }
    }
  }
}
```

#### 4. Windsurf
Add to `~/.codeium/windsurf/mcp_config.json`:
```json
{
  "mcpServers": {
    "fastast": {
      "command": "python3",
      "args": ["-m", "fastast.mcp"],
      "cwd": "${workspaceFolder}"
    }
  }
}
```

#### 5. Zed
Add to `~/.config/zed/settings.json`:
```json
{
  "context_servers": [
    "fastast": {
      "command": {
        "path": "python3",
        "args": ["-m", "fastast.mcp"]
      }
    }
  ]
}
```

---

### Core MCP Tools Reference

| MCP Tool | Typed Inputs | Description |
| :--- | :--- | :--- |
| `fastast_index_status` | `directory_path?: string` | Return current project/index status (`idle` / `indexing` / `ready` / `error`) + repository file, symbol, and edge metrics. |
| `fastast_search_symbols` | `query: string`, `kind?: string`, `path?: string`, `community?: int`, `language?: string`, `limit?: int` | Search symbols across codebase with filters by kind, file path, community, or language. |
| `fastast_get_evidence` | `query?: string`, `symbol?: string`, `file_path?: string`, `start_line?: int`, `end_line?: int`, `max_tokens?: int` | Compact, token-bounded evidence bundle or code slices for a symbol or location (never dumps whole files). |
| `fastast_graph_neighbors` | `symbol: string`, `depth?: int`, `direction?: string`, `limit?: int` | Multi-hop neighborhood graph (nodes + confidence-weighted edges) for IDE/globe visualization. |
| `fastast_list_communities` | `limit?: int`, `directory_path?: string` | List detected architectural communities from Louvain modularity clustering ($Q \approx 0.82$). |
| `fastast_community_detail` | `community_id?: int`, `symbol?: string`, `limit?: int` | Detail, modularity metrics, sample files, and peer members of a specific community cluster. |
| `fastast_similar_symbols` | `symbol: string`, `min_similarity?: float`, `limit?: int` | Structural near-duplicate clone detection using MinHash ($m=64$) + Locality-Sensitive Hashing. |
| `fastast_file_outline` | `file_path: string`, `include_snippets?: bool` | Compact skeleton outline of classes, methods, functions, and key definition preview snippets. |
| `fastast_trigger_index` | `directory_path?: string`, `force?: bool` | Start or re-trigger incremental repository indexing into SQLite symbol graph (`.fastast.db`). |

*(Legacy tool aliases `index_repository`, `query_symbols`, `retrieve_evidence`, `get_call_graph`, `get_file_outline`, `get_snippet`, `get_similar_symbols`, `list_communities`, `diagnose_repository` are also preserved for backward compatibility).*

---

## Python API

```python
import fastast

# 1. Index a repository
stats = fastast.index_repository(".")

# 2. Retrieve token-bounded evidence bundle for an agent query
bundle = fastast.retrieve_bundle(
    "index_repository",
    repo_root=".",
    limit=5,
    max_tokens=2048,
    ranking_method="hybrid",
)

# 3. Inspect structural file outline or bounded snippet
outline = fastast.get_file_outline("python/fastast/indexer.py", repo_root=".")
snippet = fastast.get_snippet("index_repository", repo_root=".")
```

---

## Architecture Summary

FastAST pairs a native Rust PyO3 extension (`fastast._core`) with an embedded SQLite WAL store and a Python retrieval/MCP layer:

```text
[AI Agent: Claude Code / Cursor / CLI]
                  │
                  ▼  (CLI or JSON-RPC stdio)
     ┌─────────────────────────┐
     │  fastast / fastast-mcp  │
     └────────────┬────────────┘
                  │
      ┌───────────┴───────────┐
      ▼ (Index)               ▼ (Query & Evidence)
┌───────────────┐     ┌───────────────────────────────┐
│ Discovery &   │     │ Hybrid Retrieval Engine       │
│ Rust AST Core │     │ • FTS5 BM25 + Dense Vectors   │
│ (Tree-Sitter) │     │ • RRF & Graph Degree Scoring  │
└───────┬───────┘     │ • MinHash/LSH & Louvain       │
        │             │ • Token-Bounded Materializer  │
        ▼             └───────────────┬───────────────┘
┌─────────────────────────────────────┴───────────────┐
│ Local SQLite WAL Store (.fastast.db)                │
│ files · symbols · edges · calls · imports           │
│ symbols_fts · symbol_embeddings · symbol_similarity │
│ symbol_communities · schema_migrations              │
└─────────────────────────────────────────────────────┘
```

### Supported Languages

| Language | Extensions | Extracted Entities |
| :--- | :--- | :--- |
| **Python** | `.py`, `.pyi`, `.pyw` | Classes, functions, async functions, methods, docstrings, imports, calls |
| **TypeScript / TSX** | `.ts`, `.tsx`, `.mts`, `.cts` | Interfaces, types, enums, classes, functions, React components, calls |
| **JavaScript / JSX** | `.js`, `.jsx`, `.mjs`, `.cjs` | Classes, functions, arrow functions, methods, React components, JSDoc |
| **Rust** | `.rs` | Structs, enums, traits, impl blocks, functions, modules, macros, calls |
| **Java** | `.java` | Packages, classes, interfaces, enums, records, constructors, methods |
| **HTML** | `.html`, `.htm`, `.xhtml` | Semantic elements, IDs, classes, script/stylesheet links |
| **CSS** | `.css` | Rulesets, selectors, media queries, keyframes, `@import` rules |
| **JSON** | `.json`, `.jsonc` | Top-level keys, objects, arrays, dependency manifests |
| **TOML** | `.toml` | Tables, arrays of tables, configuration keys, crate/package dependencies |

### Operational Safety & Configuration

- **Path Containment:** All file reads validate canonical containment inside the repository root (`PathTraversalError` on escapes) and enforce a 10 MB file size cap.
- **Concurrency & Locking:** Atomic `.fastast.lock` with PID liveness checks, automatic stale lock reclamation, and SQLite `busy_timeout = 15000` ms.
- **Self-Healing DB:** Automatic `PRAGMA quick_check` verification; corrupt databases are safely backed up and rebuilt.
- **Configuration:** Supports `.fastastrc.json` or environment variables (`FASTAST_DB_NAME`, `FASTAST_MAX_TOKENS`, `FASTAST_DEFAULT_RANKING`, `FASTAST_LOG_LEVEL`).

---

## FastAST Lens — Interactive Web UI & 3D Globe Graph

FastAST includes **FastAST Lens**, a dark-theme developer workbench and 3D Codebase Planet visualization built with React, TypeScript, and Three.js based on the Google Stitch Obsidian Kinetic design system.

### Key Screens

1. **Galaxy / Globe Graph (`/globe`):**
   - **3D Spherical Topology:** AST nodes distributed on an interactive planetary sphere with dark glass core and atmospheric glow.
   - **Full Orbit & Zoom:** Drag to rotate the globe from any angle; mouse wheel to zoom into clusters.
   - **Great-Circle Relational Arcs:** Curved arcs represent `CALLS`, `IMPORTS`, `DEFINES`, `INHERITS`, and `SIMILAR_TO` relations.
   - **Interactive Node Selection:** Clicking any node highlights relational neighbors, projects a target beacon halo, and opens telemetry metrics in the right inspector.
   - **Louvain Modularity Sectors:** Color-coded clustering grouping symbols by architectural subsystems.
2. **Explore (`/explore`):** Tri-panel file navigator, bounded code snippets with syntax highlighting, omission indicators, and focus symbol inspection.
3. **Architecture (`/architecture`):** Visual technical blueprint of the 7-layer engine pipeline.
4. **Evidence Retrieval (`/evidence`):** Token-budgeted semantic search with instant JSON evidence bundle export for AI coding agents.
5. **Index Coverage (`/coverage`):** Multi-language breakdown across all 9 supported languages.
6. **Louvain Clusters (`/communities`):** Architectural modularity inspection ($Q=0.82$) and subsystem peer symbol drill-down.
7. **System & Engine (`/system`):** SQLite WAL integrity, lock manager, and diagnostic report (`fastast doctor`).

### Running the FastAST UI & Backend

#### 1. Start the FastAST API Server
```bash
# Start local REST API bridge (port 4200) with CORS enabled
fastast serve
# or with uv
uv run fastast serve --port 4200
```

#### 2. Start the Frontend Dev Server
```bash
cd ui
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser. API requests to `/api/*` are automatically proxied to `http://127.0.0.1:4200`.

#### 3. Convenient Root Command
```bash
# Launch UI from root directory
npm run ui
```

---

## Development & Testing

```bash
# Run the complete test suite
for f in tests/test_*.py; do
    PYTHONPATH=python python3 "$f"
done
```

## License

Licensed under the [Apache License, Version 2.0](LICENSE).
