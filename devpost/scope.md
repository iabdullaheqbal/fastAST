---
doc: scope
status: approved
---

# FastAST: Codebase-Memory Engine (AST → Graph → Retrieval)

A high-performance codebase-memory engine for AI coding agents, powered by a native Rust Tree-Sitter parsing engine, local SQLite symbol/edge graph, and hybrid evidence retrieval.

## The Unique Kernel
High-speed codebase memory that turns raw source code into an actionable structural graph for AI agents:
1. **Repo Indexing & AST Extraction**: Recursively discovers and parses source files across 9 languages (Python, Java, JavaScript, TypeScript, Rust, HTML, CSS, JSON, TOML) using Tree-Sitter and content hashing (xxHash3/BLAKE3).
2. **Symbol/Edge Graph**: Extracts definitions (functions, classes, methods, interfaces, types), imports, and calls, constructing a confidence-weighted code graph in local SQLite.
3. **Retrieval & Evidence Selection**: Provides hybrid retrieval (BM25 + graph BFS neighborhood expansion) delivering bounded evidence windows with exact file locations and code snippets to AI coding agents.

## Who It's For
AI coding agents (e.g., Claude Code, Cursor, Codex, SWE-bench evaluators) and developers building LLM coding workflows who need deep, accurate repository awareness, symbol navigation, and bounded evidence without token context saturation.

## The Core Loop
1. FastAST indexes the project repository into a local SQLite database (`fastast.db`) using incremental change detection.
2. The AI agent connects via Model Context Protocol (MCP) or CLI and invokes tools:
   - `index_repository(directory_path)`: Scans and populates the SQLite symbol/edge graph incrementally.
   - `query_symbols(query, kind, language)`: Finds functions, classes, methods, and signatures with confidence scores.
   - `get_call_graph(symbol_name, direction)`: Traces callers and callees to understand code dependencies.
3. The agent receives accurate structural awareness and bounded evidence windows in milliseconds.

## Inspiration & Identity
- High-speed systems and developer tools like `ripgrep`, `ctags`, `tree-sitter`, and `sqlite`.
- Aesthetic: Deterministic, minimal, blazing fast, and developer-trustworthy.

## Why This Matters
Solves context explosion and structural blindness across large codebases without naive grepping, hallucinated symbol lookups, or heavy language server setups.

## What "Working" Looks Like
1. The developer or agent triggers repository indexing on a multi-file project via `fastast index .` or MCP.
2. FastAST parses all source files, populating SQLite tables: `files`, `symbols`, `imports`, `calls`, and `edges`.
3. Agent queries symbols (e.g. `query_symbols("process_request")`) or inspects invocations (`get_call_graph("process_request")`) and receives instant structured candidate evidence with line ranges and neighborhood context.

## The Boundary
- **Languages:** Python, JavaScript/JSX, TypeScript/TSX, Java, Rust, HTML, CSS, JSON, and TOML.
- **Database:** Local embedded SQLite (`fastast.db`) with WAL mode and zero cloud dependencies.
- **Symbol & Edge Graph:** Functions, classes, methods, interfaces, traits, imports, and caller/callee relationships with confidence scoring.
- **Engine Stack:** Rust Tree-Sitter parsers + PyO3 bridge + SQLite storage + FastMCP JSON-RPC stdio server + CLI.

## Explicitly Out of Scope
- **Dual-rubric code pruning:** Completely dropped. FastAST focuses strictly on AST repository indexing, symbol/edge graphs, and hybrid retrieval.
- **Heavy cloud graph databases (Neo4j, etc.):** Cut in favor of local, zero-config embedded SQLite.
- **In-place code rewriting:** FastAST remains strictly a non-destructive indexing and retrieval engine; it never modifies source files on disk.
