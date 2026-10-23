# FastAST Architecture Specification

> **Pipeline**: `AST → Graph → Retrieval`  
> **Audience**: Autonomous AI Coding Agents (Claude Code, Cursor, SWE-bench evaluators) & LLM DevTools

---

## 1. System Overview

FastAST operates as an embedded, deterministic Codebase-Memory Engine for software repositories. It parses source files across 9 languages into concrete syntax trees, maps declarations and relationships into a local SQLite graph database, and serves token-bounded evidence context to agents.

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│ AST Extraction  │  ───► │   Code Graph    │  ───► │Hybrid Retrieval │
│  (Tree-Sitter)  │       │(Symbols & Edges)│       │ (BM25 + Graph)  │
└─────────────────┘       └─────────────────┘       └─────────────────┘
         │                         │                         │
         ▼                         ▼                         ▼
   Syntactic Nodes          Relational Edges          Bounded Evidence
  (Fn, Class, Import)     (Calls, Defines, Uses)    (Window, Score, Path)
```

---

## 2. Layered Pruning Pipeline

1. **Repo-Level Pruning (Admission Layer)**:
   - Eliminates build directories, vendor paths, test caches, and binaries using hardcoded, `.gitignore`, and `.fastastignore` rules.
   - Computes incremental content hashes (xxHash3/BLAKE3) to skip unchanged files in O(1) time.

2. **Syntax-Level Pruning (AST Fact Extractor)**:
   - Uses Tree-Sitter grammars across Python, TypeScript, JavaScript, Java, Rust, HTML, CSS, JSON, and TOML.
   - Extracts functions, methods, classes, interfaces, imports, and calls. Discards non-semantic syntax and boilerplate.

3. **Graph-Level Pruning (Code Graph Builder)**:
   - Normalizes references, filters noise functions (`print`, `len`, `console.log`, `panic!`), and prunes low-confidence relations (< 0.60).
   - Generates typed edges: `DEFINES`, `CALLS`, `IMPORTS`, `IMPLEMENTS`, `INHERITS`.

4. **Query-Time Pruning (Hybrid Retrieval & Evidence Selection)**:
   - Multi-factor candidate scoring combining BM25 lexical relevance, dense vector similarity, exact name match, kind priority, and graph degree centrality.
   - Expands bounded 1-hop neighborhoods and extracts minimal snippet windows with line budgets.

---

## 3. Storage Architecture

FastAST stores all repository state in an embedded SQLite database (`.fastast.db`) with Write-Ahead Logging (`WAL`):

- `files`: File records, content hashes, mtime, line counts, and categories.
- `symbols`: Extracted symbol declarations, signatures, line numbers, docstrings, confidence.
- `imports`: Module import relationships, imported names, aliases.
- `calls`: Invocation call sites, caller symbol IDs, callee names, line numbers.
- `edges`: Directed graph edges with relationship types and confidence scores.
- `symbols_fts`: SQLite FTS5 virtual table for BM25 lexical search with automatic synchronization triggers.
- `symbol_embeddings`: 128-dimensional dense vector embeddings for semantic similarity.
- `symbol_similarity`: MinHash + LSH near-duplicate candidate pairs with Jaccard scores.
- `symbol_communities`: Louvain modularity clusters, semantic labels, and central hub nodes.
- `schema_migrations` & `fastast_metadata`: Migration history, system properties, and schema versioning.

---

## 4. Production Hardening & Operational Safety

- **Path Traversal Protection**: All paths validated against the repository root via `validate_safe_path()`, blocking jailbreak attempts.
- **Inter-Process Locking**: `RepositoryLock` uses atomic file creation (`.fastast.lock`) with active PID liveness verification.
- **SQLite Resilience**: Configured with `PRAGMA busy_timeout = 15000` (15s) and automated corruption isolation via `safe_repair_or_recreate_db()`.
- **Background Watcher**: `RepositoryWatcher` provides debounced continuous incremental AST updates.

