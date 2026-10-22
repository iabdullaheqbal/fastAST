---
doc: scope
status: approved
---

# FastAST

A high-performance, full-repository AST-based code indexer and MCP server for AI coding agents, powered by a native Rust Tree-Sitter parsing engine and local SQLite symbol graph.

## The Unique Kernel
High-speed repository-wide AST symbol, import, and call graph indexing stored in local SQLite:
1. Recursively scans and parses source files across 8+ languages (Python, Java, JavaScript, TypeScript, Rust, HTML, CSS, JSON, TOML) using Tree-Sitter and native parsers.
2. Extracts definitions (functions, classes, methods, interfaces, types), import statements, and invocation call relationships.
3. Populates an indexed local SQLite database (`.fastast.db`) with SHA-256 incremental caching.
4. Enables coding agents to instantly query symbols and trace call graphs across the codebase in milliseconds.

## Who It's For
AI coding agents (e.g., Claude Code, Cursor, Codex, SWE-agent evaluation runners) and developers building LLM coding workflows who need deep, accurate repository awareness and symbol navigation across multi-file codebases.

## The Core Loop
1. FastAST indexes the project repository into a local SQLite database (`.fastast.db`), parsing source files via native Rust Tree-Sitter.
2. The AI agent connects via Model Context Protocol (MCP) or CLI and invokes tools:
   - `index_repository(directory_path, force=False)`: Scans and populates the SQLite symbol graph incrementally.
   - `query_symbols(query, kind, language, limit)`: Finds functions, classes, methods, and signatures across the repository.
   - `get_call_graph(symbol_name)`: Traces callers and callees to understand code dependencies.
3. The agent receives accurate, cross-module structural awareness and exact file/line locations in milliseconds.

## Inspiration & Identity
- High-speed systems and developer tools like `ripgrep`, `ctags`, `tree-sitter`, and `sqlite`.
- Aesthetic: Deterministic, minimal, blazing fast, and developer-trustworthy.

## Why This Matters
Solves symbol discovery and architectural awareness across large codebases without naive grepping, vector hallucination, or heavy language server setups.

## What "Working" Looks Like
1. The developer or agent triggers repository indexing on a multi-file project via `fastast index .` or MCP.
2. FastAST parses all source files, populating SQLite tables: `files`, `symbols`, `imports`, and `calls`.
3. Agent queries symbols (e.g. `query_symbols("process_request")`) or inspects invocations (`get_call_graph("process_request")`) and receives instant structured results with exact file paths and line ranges.

## The Boundary
- **Languages:** Python, JavaScript/JSX, TypeScript/TSX, Java, Rust, HTML, CSS, JSON, and TOML.
- **Database:** Local embedded SQLite (`.fastast.db`) with WAL mode and zero cloud dependencies.
- **Symbol Graph:** Functions, async functions, classes, methods, interfaces, enums, imports, and caller/callee relationships.
- **Engine Stack:** Rust Tree-Sitter parsers + PyO3 bridge + Python SQLite indexer + FastMCP JSON-RPC stdio server + CLI.

## Explicitly Cut
- **Code Context Pruning:** Completely dropped. FastAST focuses strictly on robust AST-based repository indexing and symbol discovery.
- **Neural / PyTorch vector embeddings:** Explicitly cut to maintain sub-millisecond throughput and zero heavy dependencies.
- **Cloud-hosted graph databases (Neo4j, etc.):** Cut in favor of local, zero-config SQLite.
- **In-place code rewriting:** FastAST remains strictly a non-destructive indexing and query engine; it never modifies source files on disk.
