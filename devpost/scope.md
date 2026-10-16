---
doc: scope
status: approved
---

# FastAST

A high-performance, full-repository context engine and syntax-guaranteed context pruning MCP server for AI coding agents, powered by a native Rust Tree-Sitter engine and local SQLite symbol graph.

## The Unique Kernel
High-speed repository-wide AST symbol indexing stored in local SQLite coupled with dual-rubric, syntax-guaranteed pruning:
1. Scans and parses every Python file across an entire repository using Rust Tree-Sitter.
2. Builds an indexed symbol graph (functions, classes, methods, imports, and call relationships) in local SQLite.
3. Enables coding agents to query symbols and call graphs across the codebase while extracting syntactically guaranteed, 60–75%+ pruned context with 0 syntax errors.

## Who It's For
AI coding agents (e.g., Claude Code, Cursor, Codex, SWE-agent evaluation runners) and developers building LLM coding workflows who need deep repository awareness without context window congestion, token cost bloat, or syntax breakage.

## The Core Loop
1. FastAST indexes the project repository into a local SQLite database (`.fastast.db`), parsing all Python files via native Rust Tree-Sitter.
2. The AI agent connects via Model Context Protocol (MCP) and invokes tools:
   - `index_repository(directory_path)`: Scans and populates the SQLite symbol graph.
   - `query_symbols(query, kind)`: Finds functions, classes, and signatures across the entire repository.
   - `get_call_graph(symbol_name)`: Traces callers and callees to understand code dependencies.
   - `prune_context(code_text, focus_query, threshold=0.5)`: Prunes unneeded logic with guaranteed valid syntax.
3. The agent receives accurate, cross-module context and compact, syntactically parseable code in milliseconds.

## Inspiration & Identity
- High-speed systems and developer tools like `ripgrep`, `ruff`, `ctags`, and `tree-sitter`.
- Aesthetic: Deterministic, minimal, blazing fast, and developer-trustworthy.

## Why This Matters
Moves FastAST from a single-file context pruner to an end-to-end repository context engine. Solves both symbol discovery across multi-file codebases and prompt token bloat during agentic execution.

## What "Working" Looks Like
1. The developer or agent triggers repository indexing on a multi-file project.
2. Tree-Sitter parses all Python files, populating SQLite tables: `files`, `symbols`, `imports`, and `calls`.
3. Agent queries symbols or callers (e.g. `get_call_graph("process_request")`) and receives instant structured dependency graphs.
4. Agent retrieves pruned files for matched symbols, demonstrating sub-15ms pruning with 0 syntax errors.

## The POC Boundary
- **Language:** Python only (`tree-sitter-python`).
- **Database:** Local embedded SQLite (`.fastast.db`) with zero cloud dependencies.
- **Symbol Graph:** Functions, async functions, classes, methods, imports, and caller/callee relationships.
- **Engine Stack:** Rust Tree-Sitter parser + PyO3 bridge + Python SQLite indexer + FastMCP JSON-RPC stdio server.

## Later
- Multi-language AST symbol graphs (TypeScript, Go, Rust).
- Incremental file watching with `notify` / watchdog.
- Git diff-aware re-indexing.

## Explicitly Cut
- **Neural / PyTorch vector embeddings:** Explicitly cut to maintain sub-15ms throughput and zero heavy dependencies.
- **Cloud-hosted graph databases (Neo4j, etc.):** Cut in favor of local, zero-config SQLite.
- **In-place code rewriting:** FastAST remains strictly an in-memory context engine; it never modifies user source files on disk.
