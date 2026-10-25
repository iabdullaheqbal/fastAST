---
doc: checklist
status: approved
---

# Build Checklist

Build mode: fast

## Slices

- [x] **1. Native Multi-Language Tree-Sitter AST Scope and Symbol Extractor**
  Becomes usable: A compiled native Rust extension `fastast._core` callable from Python that parses source code across 9 languages (Python, Java, JavaScript, TypeScript, Rust, HTML, CSS, JSON, TOML) via Tree-Sitter, identifying definitions, symbols, imports, and function calls.
  Why now: Proves the high-performance multi-language parsing and symbol extraction core immediately.
  PRD ref: `prd.md > High-Performance AST Analysis`
  Spec ref: `spec.md > Stack`, `spec.md > Components > 1. Tree-Sitter Multi-Language Engine`
  Build: Configure `Cargo.toml` and implement language parsers under `src/`. Expose `index_code(code, language)` returning `FileIndexResult`.
  Verify (mechanical): Run multi-language tests verifying symbol and import extraction.
  Commit: `Implement multi-language Tree-Sitter AST extractor`

- [x] **2. SQLite Repository Indexer Schema and Store**
  Becomes usable: SQLite index database storing `files`, `symbols`, `imports`, and `calls` with indices, query methods (`find_symbol`, `get_calls_from_symbol`), and full repository walker with ignore filters (`.git`, `node_modules`, `target`, `.venv`).
  Why now: Provides persistent structured code graph storage for rapid queries by AI agents.
  PRD ref: `prd.md > SQLite Relational Index Store`
  Spec ref: `spec.md > Components > 2. SQLite Repository Indexer Engine`
  Build: Implement `python/fastast/indexer.py` with `RepositoryIndexer`, schema creation, recursive walker, and pure-Python fallback for environments without compiled binaries.
  Verify (mechanical): Run `tests/test_indexer.py`.
  Commit: `Implement SQLite repository indexer and schema`

- [x] **3. FastMCP Server Tools for Coding Agents**
  Becomes usable: Running MCP server implementing `index_repository`, `query_symbols`, and `get_call_graph` over JSON-RPC stdio.
  Why now: Connects FastAST directly to AI coding agents (Claude Code, Cursor) for repository-wide AST discovery.
  PRD ref: `prd.md > MCP Server Interface for Coding Agents`
  Spec ref: `spec.md > Components > 3. FastMCP Server`
  Build: Implement `python/fastast/server.py` with `index_repository`, `query_symbols`, and `get_call_graph`.
  Verify (mechanical): Run `tests/test_server.py`.
  Commit: `Implement FastMCP server with repository indexing tools`

- [x] **4. CLI Runner and Multi-Language Test Suites**
  Becomes usable: Full CLI (`fastast index/symbols/calls`) supporting JSON and human-readable output, plus comprehensive multi-language test coverage.
  Why now: Gives developers direct command-line access to index repositories, search symbols, and trace call graphs.
  PRD ref: `prd.md > CLI Command Interface`
  Spec ref: `spec.md > Components > 4. CLI Runner`
  Build: Implement `python/fastast/cli.py` with `index`, `symbols`, and `calls` subcommands.
  Verify (mechanical): Run all 13 test suites in `tests/`.
  Commit: `Implement CLI runner and complete test suites`

## Hands-on Checkpoints

- [x] Early usable behavior explored — Multi-language parsing & AST symbol extraction verified
- [x] Repository indexing, symbol search, and call graph queries verified via CLI and MCP

## Final Review

- [x] Final review complete — pruning fully dropped; FastAST is 100% focused on AST repository indexing for coding agents.

## Code Tour and App Map

- [x] Learning activity complete — guided code tour of Rust AST parser, SQLite graph store, and MCP retrieval tools.
- [x] Optional edit and transfer reflection addressed — verified incremental hash caching and token-bounded evidence materialization.
- [x] `devpost/app-map.html` generated from finished code, checked, and shown, highlighting architecture and reusable patterns.

Activity and evidence: Verified Rust AST engine (`src/`), SQLite WAL graph (`python/fastast/db.py`), FastMCP agent server (`python/fastast/server.py`), and CLI (`python/fastast/cli.py`).
Route and stops: `src/lib.rs` -> `python/fastast/indexer.py` -> `python/fastast/db.py` -> `python/fastast/server.py` -> `python/fastast/cli.py`.
Edit outcome: Clean builds, unit test suites passing across all 9 languages.
Activity mode: Live local execution, CLI verification, and interactive map in `devpost/app-map.html`.

## Submission Requirements Checklist

- [x] **New project:** Started from an empty folder during the Devpost "Build With AI: Basics" submission period.
- [x] **Built with skills:** Built using the Devpost Learn Skill Pack (`challengepost/learn-ai-basics`) inside the AI coding agent.
- [x] **Planning docs in repo:** Includes approved `scope.md`, `prd.md`, and `spec.md` in the `devpost/` directory.
- [x] **Public repository URL:** Verified and accessible at `https://github.com/iabdullaheqbal/fastAST`.
- [x] **Demo video:** 1-to-3 minute video walkthrough showing working indexing, symbol navigation, and call graph queries.
- [x] **Submission details:** Project name, short description, what it does, who it's for, and what was learned prepared in `devpost/submission.md`.
