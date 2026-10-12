---
doc: scope
status: approved
---

# FastAST

A high-performance, syntax-guaranteed context pruning MCP server for AI coding agents, powered by a native Rust Tree-Sitter engine.

## The Unique Kernel
Dual-rubric AST pruning coupled with deterministic structural repair: scoring code by combining lexical/semantic query relevance with Tree-Sitter structural dependency tracing (enclosing scopes, imports, variable defs), then synthesizing missing headers and `pass` placeholders to ensure 60–75% token reduction with guaranteed 100% syntactically valid Python in <15ms.

## Who It's For
AI coding agents (e.g., Claude Code, Cursor, SWE-bench evaluation runners) and developers building LLM coding workflows who currently suffer from token bloat, context window exhaustion, and syntax breakage caused by naive regex/line-based pruning.

## The Core Loop
1. The AI agent invokes the local MCP tool `prune_context(code_text, focus_query, threshold=0.5)`.
2. FastAST passes the code into the native Rust core via PyO3, parses the Tree-Sitter AST, and computes relevance and dependency masks.
3. The engine structurally repairs all pruned blocks (inserting required imports, scope headers, and `pass` bodies).
4. The agent receives back a compact, syntactically parseable snippet with token savings metadata in <15ms.

## Inspiration & Identity
- High-speed developer systems tools like `ripgrep`, `ruff`, and `tree-sitter`.
- Aesthetic: Deterministic, minimal, blazing fast, and developer-trustworthy.

## Why This Matters to the Learner
Solves real-world context window congestion and API cost bloat in agentic software engineering. Delivers an end-to-end Rust–PyO3–FastMCP integration running at sub-15ms speed while practicing disciplined spec-driven development.

## What "Working" Looks Like
In the hackathon demo:
1. Claude Code or Cursor connects to the local FastMCP server.
2. The agent reads a 1,500+ line Python module (e.g., from SWE-bench) via `prune_context`.
3. Output displays:
   - **Token Reduction:** ~60–75% reduction (e.g., 8,000 tokens down to 2,000 tokens).
   - **Benchmark Timer:** Rust core execution time in milliseconds (<15ms target).
   - **Syntax Validation:** Executing Python's `ast.parse()` on the pruned string returns 0 syntax errors.

## The POC Boundary
- **Language:** Python only (`tree-sitter-python`).
- **Input:** Single Python file or snippet (up to 3,000 lines) + user/agent query.
- **Engine Stack:** Rust AST dependency tracer + lexical semantic scorer, PyO3 maturin bindings, local FastMCP JSON-RPC server.
- **Verification:** Automated unit test running `ast.parse()` and timing execution on sample Python files.

## Later
- Multi-file dependency graphs and cross-module symbol resolution.
- SQLite indexing for persistent codebase symbol caches.
- Multi-language AST support (TypeScript, Go, Rust).

## Explicitly Cut
- **Full repository dependency graphs:** Out of scope for a single-file context optimization PoC; introduces heavy I/O and indexing overhead.
- **Neural CRF sequence labeling / PyTorch models:** Explicitly cut because neural inference introduces severe latency and heavy dependencies, defeating the <15ms target.
- **Package firewall / slopsquatting detection:** Cut as an orthogonal problem unrelated to context window pruning.

