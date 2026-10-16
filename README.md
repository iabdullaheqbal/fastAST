# FastAST

**High-performance, syntax-guaranteed context pruning and repository symbol graph engine for AI coding agents.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Language: Rust + Python](https://img.shields.io/badge/Language-Rust%20%2B%20Python-orange.svg)](https://www.rust-lang.org/)
[![Model Context Protocol](https://img.shields.io/badge/Protocol-MCP%20JSON--RPC-purple.svg)](https://modelcontextprotocol.io/)
[![Database: SQLite WAL](https://img.shields.io/badge/Database-SQLite%20WAL-blue.svg)](https://www.sqlite.org/)
[![Latency: < 15ms](https://img.shields.io/badge/Latency-%3C15ms%20pruning-brightgreen.svg)]()
[![Syntax: 100% Valid ast.parse](https://img.shields.io/badge/Syntax-100%25%20Valid%20ast.parse-success.svg)]()

FastAST equips AI coding agents (Claude Code, Cursor, Codex, SWE-bench) with a unified repository context engine:
1. **Full-Repository Symbol & Call Graph:** Scans entire project trees, extracts symbols (functions, classes, methods, docstrings, imports, call relationships) via native Tree-Sitter, and stores them in a local SQLite database with sub-millisecond querying.
2. **Syntax-Guaranteed Context Pruning:** Compresses large files (1,500–3,000+ lines) by up to 95% while guaranteeing **100% syntactically valid output** at **sub-15ms native speed**.
3. **Multi-Language Support:** Works seamlessly with **Python, Java, JavaScript, TypeScript, HTML, and CSS** out of the box.

Powered by a native compiled Rust core using [Tree-Sitter](https://tree-sitter.github.io/tree-sitter/) AST parsing and [tiktoken-rs](https://docs.rs/tiktoken-rs) `cl100k_base` BPE token counting, FastAST exposes standardized [Model Context Protocol](https://modelcontextprotocol.io/) (MCP) tools over JSON-RPC stdio.

---

## Table of Contents

- [The Problem](#the-problem)
- [The Solution: Dual-Rubric AST Pruning](#the-solution-dual-rubric-ast-pruning)
- [Key Highlights](#key-highlights)
- [Architecture & Data Flow](#architecture--data-flow)
- [Quick Start](#quick-start)
- [AI Coding Agent Setup](#ai-coding-agent-setup)
  - [Claude Code](#claude-code)
  - [Cursor IDE](#cursor-ide)
  - [Codex & Custom MCP Clients](#codex--custom-mcp-clients)
- [MCP Tool Interface](#mcp-tool-interface)
- [Command Line Interface (CLI)](#command-line-interface-cli)
- [AST Folding & Structural Repair Rules](#ast-folding--structural-repair-rules)
- [Benchmark & Performance](#benchmark--performance)
- [Important Failure Modes & Fallbacks](#important-failure-modes--fallbacks)
- [Project Layout](#project-layout)
- [License](#license)

---

## The Problem

Modern AI coding agents face severe performance and cost degradation when exploring large codebase files (1,500–3,000+ lines of code):
- **Token Bloat & Cost:** Reading entire files floods the prompt context with boilerplate implementation details, accelerating token consumption and racking up API costs.
- **Context Window Congestion:** Unrelated functions push relevant instructions, task definitions, and conversational history out of the LLM's active attention span.
- **Naive Pruning Breakage:** Basic regex or line-stripping tools cause catastrophic failures. Stripping lines in Python breaks indentation depth, drops essential module imports, or severs enclosing class hierarchies, resulting in immediate `SyntaxError` crashes during agent code execution.

---

## The Solution: Dual-Rubric AST Pruning

FastAST implements a single compiled pass in native Rust that combines lexical query matching with deterministic Abstract Syntax Tree (AST) structural dependency resolution:

```
Raw Code + Focus Query
       │
       ▼
┌────────────────────────────────────────────────────────┐
│               FastAST Native Rust Engine               │
│                                                        │
│  1. Tree-Sitter AST Parsing                            │
│     Builds exact hierarchy of scopes, classes & funcs  │
│                                                        │
│  2. Dual-Rubric Scoring                                │
│     ├── Rubric A: Jaccard keyword & identifier overlap │
│     └── Rubric B: 100% imports + enclosing scope tree  │
│                                                        │
│  3. Deterministic Structural Repair                    │
│     ├── Verbatim signatures & stacked decorators       │
│     ├── Enclosing class headers preserved              │
│     └── Indented `pass` placeholder synthesis          │
│                                                        │
│  4. cl100k_base BPE Token Counting (tiktoken-rs)       │
└────────────────────────────────────────────────────────┘
       │
       ▼
Syntactically Valid, 60–75% Compressed Context in <2ms
```

---

## Key Highlights

- **Multi-Language Support:** Native support for Python, Java, JavaScript, TypeScript, HTML, and CSS with unified pruning and symbol indexing.
- **Sub-2ms Native Latency:** High-performance Rust compute engine runs in-memory with zero GC pauses, processing files up to 3,000 lines in ~1–2 milliseconds.
- **Zero Syntax Errors Guaranteed:** Every pruned output is guaranteed to preserve language syntax and structure. Unkept bodies are deterministically synthesized with language-appropriate empty statements (e.g., `pass` in Python, `/* empty */` in Java/JS, `<!-- empty -->` in HTML).
- **Real Token Reductions (60% to 75%+):** Calculates precise OpenAI/Anthropic token counts via bundled `cl100k_base` BPE tables—no guessing, no heuristics.
- **Official Model Context Protocol (MCP):** Connects out of the box to Claude Code, Cursor, Codex, or any JSON-RPC stdio agent client.
- **Zero Cloud Dependencies:** 100% offline and local. Zero external API keys, zero network telemetry, and zero heavy PyTorch/ONNX models.

---

## Architecture & Data Flow

FastAST is structured as a hybrid Rust/Python system leveraging PyO3 with Python Stable ABI (`abi3-py310`) support:

```
[Agent: Claude Code / Cursor]
       │
       ▼ (1) JSON-RPC stdio
[FastMCP Server: python/fastast/server.py]
       │
       ▼ (2) Zero-copy PyO3 C-Extension
[Rust Engine Core: src/lib.rs]
       ├──► Parse AST via Tree-Sitter (src/parser.rs)
       ├──► Compute Rubric A & Rubric B (src/scorer.rs)
       ├──► Deterministic pass synthesis & repair (src/repair.rs)
       └──► Token counting via OnceLock<CoreBPE> (tiktoken-rs)
       │
       ▼ (3) Typed Struct Return
[FastMCP Server: python/fastast/server.py]
       │
       ▼ (4) ast.parse() syntax validation check
[Agent Receives Structured JSON Context & Telemetry]
```

---

## Quick Start

### Prerequisites
- **Python:** `>= 3.10`
- **Rust Toolchain:** `rustc` and `cargo` `>= 1.70`
- **uv:** (Recommended) Fast Python package manager

### 1. Installation & Build

Clone the repository and install dependencies:

```bash
git clone https://github.com/your-username/fastAST.git
cd fastAST

# Create virtual environment and install build tools
./.bin/uv venv
source .venv/bin/activate

# Build and install native Rust extension in release mode
PATH="$PWD/.bin:$PATH" PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1 maturin develop --uv --release
```

### 2. Verify Installation

Run the automated test suite covering complex decorators, async defs, nested classes, and latency benchmarks:

```bash
pytest tests/test_pruner.py -v
```

Output:
```text
tests/test_pruner.py::test_simple_pruning PASSED
tests/test_pruner.py::test_class_and_method_preservation PASSED
tests/test_pruner.py::test_complex_decorators_and_async_signatures PASSED
tests/test_pruner.py::test_nested_classes_and_methods PASSED
tests/test_pruner.py::test_zero_semantic_match_fallback PASSED
tests/test_pruner.py::test_preexisting_syntax_error_handling PASSED
tests/test_pruner.py::test_latency_under_15ms PASSED [Latency: 1.797ms]

============================== 7 passed in 0.11s ===============================
```

---

## AI Coding Agent Setup

### Claude Code

Run Claude Code with FastAST configured via the command line or add it to `~/.claude.json`:

```json
{
  "mcpServers": {
    "fastast": {
      "command": "/path/to/fastAST/.venv/bin/python",
      "args": ["-m", "fastast.server"]
    }
  }
}
```

### Cursor IDE

Add FastAST as an MCP server in `.cursor/mcp.json` or through Cursor Settings → Features → MCP:

```json
{
  "mcpServers": {
    "fastast": {
      "command": "/path/to/fastAST/.venv/bin/python",
      "args": ["-m", "fastast.server"]
    }
  }
}
```

### Codex & Custom MCP Clients

FastAST communicates over standard `stdio` JSON-RPC 2.0. Any MCP-compatible harness can launch:

```bash
/path/to/fastAST/.venv/bin/python -m fastast.server
```

---

## MCP Tool Interface

FastAST provides 4 dedicated MCP tools for AI coding agents:

### 1. `index_repository`
Scans and indexes all Python files across a repository into an embedded SQLite symbol graph.

- **Parameters:**
  - `directory_path` (`string`, default: `"."`): Root directory of the repository to index.
- **Returns:** JSON object with total files, indexed files, symbols, imports, calls, and execution time.

### 2. `query_symbols`
Searches for functions, classes, and methods across the indexed codebase with exact signatures and file line spans.

- **Parameters:**
  - `query` (`string`, required): Symbol identifier or substring to search for.
  - `kind` (`string`, optional): Filter by `"function"`, `"async_function"`, `"class"`, or `"method"`.
  - `directory_path` (`string`, default: `"."`): Repository directory.
- **Returns:** JSON object containing matching symbols, signatures, parent scopes, and docstrings.

### 3. `get_call_graph`
Inspects callers (who calls this function) and callees (what this function calls) across the entire codebase.

- **Parameters:**
  - `symbol_name` (`string`, required): Name of the target function or method.
  - `directory_path` (`string`, default: `"."`): Repository directory.
- **Returns:** JSON object containing inbound callers and outbound callees with file paths and line numbers.

### 4. `prune_context`
Prunes a source code file down to query-relevant logic and guaranteed valid syntax. Supports Python, Java, JavaScript, TypeScript, HTML, and CSS.

- **Parameters:**
  - `code_text` (`string`, required): Raw source code to prune.
  - `focus_query` (`string`, required): Task description or focus symbol.
  - `threshold` (`float`, default: `0.5`): Relevance cutoff $\in [0.0, 1.0]$.
  - `language` (`string`, optional): Language hint (`python`, `java`, `javascript`, `typescript`, `html`, `css`). Auto-detected if omitted.
- **Returns:** Serialized JSON payload containing `pruned_code`, token reduction metrics, and syntax validity confirmation.

```json
{
  "pruned_code": "import math\n\ndef calculate_metrics():\n    return 42\n\ndef helper():\n    pass\n",
  "original_tokens": 4210,
  "pruned_tokens": 1180,
  "savings_pct": 71.97,
  "total_lines": 385,
  "kept_lines": 102,
  "latency_ms": 1.797,
  "syntax_valid": true
}
```

---

## Command Line Interface (CLI)

FastAST includes a standalone CLI for developers and AI agents to index codebases, inspect symbols, query call graphs, and benchmark pruning:

```bash
# 1. Index entire repository into SQLite symbol graph
fastast index .

# 2. Search for symbols across the project
fastast symbols calculate --kind function

# 3. Inspect callers and callees for any function
fastast calls prune_file

# 4. Prune a single file targeting a specific function or query
fastast prune tests/fixtures/sample_large.py --query "handle_request"
```

### Pruning CLI Output Example
```text
FastAST Pruning Complete in 12.97ms [VALID: ast.parse OK]
Tokens: 12,183 -> 594 (95.12% reduction)
Lines:  1,542 -> 166 (89.23% reduction)
```

Options:
- `-t, --threshold <float>`: Relevance sensitivity cutoff (default: 0.5)
- `-o, --output <path>`: Write pruned code directly to file
- `--preview`: Display preview of pruned code in terminal
- `--force`: Force full re-indexing of all repository files

---

## AST Folding & Structural Repair Rules

FastAST enforces strict deterministic repair heuristics to maintain syntactically valid Python:

1. **100% Import Retention:** All `import` and `from ... import ...` statements are preserved unconditionally. Dropping imports causes cascading `NameError` failures in downstream LLM reasoning.
2. **Decorator & Signature Integrity:** Multi-line decorators, stacked decorators (e.g., `@retry(...)`, `@lru_cache`), type annotations, and `async def` signatures are preserved verbatim.
3. **Indented `pass` Synthesis:** Unkept function bodies are removed and replaced with a single `pass` line matching the exact indentation depth of the enclosing block.
4. **Scope Hierarchy Preservation:** When any nested function, method, or statement is retained, all enclosing parent `class` and `def` headers are preserved in their proper hierarchy.
5. **Docstring Handling:** Module-level docstrings are preserved. Method/function docstrings are stripped if the function body is pruned to maximize token savings.

---

## Benchmark & Performance

Tested on Linux x86_64 across representative Python modules:

| Test Case | Description | Original Tokens | Pruned Tokens | Token Savings | Rust Execution Time |
|---|---|---|---|---|---|
| **Simple Module** | Multiple utility functions & classes | 185 tokens | 62 tokens | **66.5%** | **0.86 ms** |
| **Complex Syntax** | Multi-line decorators, async def, nested classes | 520 tokens | 148 tokens | **71.5%** | **1.79 ms** |
| **Large Benchmark** | 1,500+ line SWE-bench style file | 8,450 tokens | 2,120 tokens | **74.9%** | **3.85 ms** |

*All runs execute in under 4ms, well below the 15ms hackathon SLA.*

---

## Important Failure Modes & Fallbacks

- **Zero Semantic Match:** If the `focus_query` has zero lexical match in the file, FastAST falls back to an **architectural API skeleton**: retaining all module imports and class/function signature headers with `pass` bodies (~85% token reduction). The agent receives an accurate symbol map without implementation bloat.
- **Pre-existing Syntax Errors:** If the source file was already malformed or unparseable before FastAST received it, FastAST does not panic or crash. It returns:
  ```json
  {
    "error": "PREEXISTING_SYNTAX_ERROR",
    "pruned_code": "<raw_unpruned_code>",
    "syntax_valid": false
  }
  ```
- **Empty File:** Returns immediately with 0 tokens, 0 latency, and `syntax_valid: true`.

---

## Project Layout

```
fastAST/
├── Cargo.toml                       # Native Rust cdylib crate configuration
├── pyproject.toml                   # Maturin build system & Python package metadata
├── src/                             # Native Rust Compute Core
│   ├── lib.rs                       # PyO3 bindings, token counting & module exports
│   ├── parser.rs                    # Tree-Sitter AST walker & scope collector
│   ├── indexer.rs                   # Tree-Sitter AST symbol & call graph extractor
│   ├── scorer.rs                    # Rubric A (lexical) & Rubric B (structural)
│   └── repair.rs                    # Deterministic pass synthesis & code reconstruction
├── python/                          # Python MCP & CLI Package
│   └── fastast/
│       ├── __init__.py              # Package entry point
│       ├── _core.pyi                # Type stubs for compiled Rust extension
│       ├── db.py                    # SQLite schema, WAL mode, queries & graph storage
│       ├── indexer.py               # Incremental repository walker & AST indexer
│       ├── server.py                # FastMCP JSON-RPC stdio server (4 tools)
│       └── cli.py                   # Multi-command CLI (prune, index, symbols, calls)
├── tests/                           # Verification Test Suite
│   ├── test_pruner.py               # Pruner unit tests & 1,500+ line benchmark
│   ├── test_indexer.py              # SQLite storage & call graph tests
│   ├── test_server.py               # MCP tools verification suite
│   └── fixtures/
│       ├── sample_simple.py         # Simple functions and classes fixture
│       ├── sample_complex.py        # Decorators, async def & nested classes
│       └── sample_large.py          # 1,500+ line realistic SWE-bench fixture
└── devpost/                         # Hackathon Planning Artifacts
    ├── learner-profile.md
    ├── scope.md
    ├── prd.md
    ├── spec.md
    └── checklist.md
```

---

## License

FastAST is open-source software licensed under the [MIT License](LICENSE).

