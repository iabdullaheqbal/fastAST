---
doc: spec
status: draft
---

# FastAST — Technical Specification

## How This Works, In Plain Language

FastAST is a high-speed Python context optimization engine designed for AI coding agents. When an agent reads a large codebase file (1,500–3,000+ lines), passing the entire file wastes thousands of prompt tokens and risks hitting LLM context limits. Simple line-stripping tools cause catastrophic syntax errors by breaking Python indentation or pruning needed imports.

FastAST solves this with a single compiled pass in native Rust:
1. It parses the Python file into an Abstract Syntax Tree (AST) using `tree-sitter-python`.
2. It scores lines across two rubrics: **Rubric A** (lexical/query matching against the agent's prompt) and **Rubric B** (structural dependencies like imports, class definitions, and enclosing scopes).
3. It fuses the scores and executes deterministic structural repair: any pruned function body is cleanly replaced with an indented `pass` placeholder, preserving all decorators, multi-line signatures, and parent classes.
4. It counts original and pruned tokens using `cl100k_base` (`tiktoken-rs`), validates syntax with Python's `ast.parse()`, and returns a structured JSON payload in <15ms over standard MCP JSON-RPC.

## The Core Journey Through the System
Implements `prd.md > The Core Journey`

```
[Agent: Claude / Cursor]
       │
       ▼ (1) JSON-RPC stdio
[FastMCP Server: python/fastast/server.py]
       │
       ▼ (2) Zero-copy PyO3 call
[Rust Core Engine: src/lib.rs]
       │
       ├──► (3) Parse AST with tree-sitter-python (src/parser.rs)
       ├──► (4) Compute Rubric A (lexical) & Rubric B (structural) (src/scorer.rs)
       ├──► (5) Deterministic pass synthesis & indentation repair (src/repair.rs)
       └──► (6) Token counting with tiktoken-rs (cl100k_base)
       │
       ▼ (7) Returns Rust Struct -> Python Dict
[FastMCP Server: python/fastast/server.py]
       │
       ▼ (8) ast.parse() validation check (Python)
[Agent: Receives compact, 100% valid Python context in <15ms]
```

## Stack

- **Rust (2021 Edition):** High-performance systems language for the core parsing and repair engine. Ensures sub-15ms throughput and zero garbage-collection jitter.
  - [`tree-sitter`](https://docs.rs/tree-sitter): Fast, incremental AST parser generator.
  - [`tree-sitter-python`](https://docs.rs/tree-sitter-python): Python grammar bindings for tree-sitter.
  - [`tiktoken-rs`](https://docs.rs/tiktoken-rs): High-performance pure-Rust tokenizer implementing OpenAI's `cl100k_base` BPE encoding.
  - [`pyo3`](https://pyo3.rs): Rust bindings for Python, allowing zero-copy GIL-released native execution.
- **Python (>=3.10):** Host environment and MCP protocol server.
  - [`maturin`](https://www.maturin.rs): Build system and zero-config packaging for PyO3 Rust extension modules.
  - [`mcp`](https://github.com/modelcontextprotocol/python-sdk) / FastMCP: Standard Model Context Protocol library exposing tools to AI agents over JSON-RPC stdio.
  - `ast` (Python Standard Library): Used for final syntax validation (`ast.parse()`).

## Where It Runs and How Someone Tries It

### Runtime Environment
- Runs locally on the developer's machine as a local CLI tool and background MCP stdio server.
- No external internet access, API keys, or cloud databases required.

### Build and Run Instructions

1. **Build the native extension:**
   ```bash
   uv run maturin develop
   ```

2. **Run the CLI / Benchmark Runner:**
   ```bash
   uv run fastast prune tests/fixtures/sample_module.py --query "calculate_metrics"
   ```

3. **Run the MCP Server:**
   ```bash
   uv run fastast-mcp
   ```

4. **Connect Claude Code / Cursor:**
   Add to your agent's MCP configuration (`claude_desktop_config.json` or `.cursor/mcp.json`):
   ```json
   {
     "mcpServers": {
       "fastast": {
         "command": "uv",
         "args": ["run", "--directory", "/home/abdullah/D_Drive/fastAST", "fastast-mcp"]
       }
     }
   }
   ```

## Look and Feel
Implements `prd.md > Look and Feel`

- **MCP Wire Output:** High-density, machine-readable JSON matching the PRD schema.
- **CLI Output:** Minimalist developer output inspired by `ruff` and `ripgrep`:
  ```
  FastAST Pruning Complete in 4.12ms [VALID: ast.parse OK]
  Tokens: 4,210 -> 1,180 (71.97% reduction)
  Lines:  385 -> 102 (73.51% reduction)
  ```

## Components

### 1. Tree-Sitter Parser & AST Walker (`src/parser.rs`)
Implements `prd.md > Dual-Rubric Pruning & AST Structural Repair`

- Initializes `tree-sitter::Parser` with `tree_sitter_python::language()`.
- Walks the AST and constructs an in-memory index of code spans:
  - Imports (`import_statement`, `import_from_statement`)
  - Class definitions (`class_definition`) and enclosing headers
  - Function definitions (`function_definition`, `async_function_definition`)
  - Decorators (`decorator`, stacked and multi-line decorators)
  - Docstrings (module-level and function-level `expression_statement` strings)
  - Statements, expressions, and identifier symbol tokens

### 2. Dual-Rubric Scorer (`src/scorer.rs`)
Implements `prd.md > Dual-Rubric Pruning & AST Structural Repair`

- **Rubric A (Lexical Matching):**
  - Tokenizes `focus_query` into unique identifiers, keywords, and string literal tokens.
  - Extracts symbol identifiers and words from AST statement spans.
  - Computes a normalized Jaccard-style token overlap score $\in [0.0, 1.0]$.
  - Marks statements exceeding `threshold` as semantically relevant.
- **Rubric B (Structural Dependency Support):**
  - Flags all module imports for 100% unconditional retention.
  - Traverses upward from any retained statement to mark all enclosing parent `class` and `def` scope headers.
  - Marks all preceding decorators for any retained or stubbed function/class.

### 3. Deterministic Structural Repair Engine (`src/repair.rs`)
Implements `prd.md > Dual-Rubric Pruning & AST Structural Repair`

- Generates the final output code buffer line by line:
  - If a function/method body has no kept statements, preserves the full signature and decorators, and appends an indented `pass` statement matching the function's internal indentation level.
  - Strips docstrings of pruned functions; retains module-level docstrings.
  - If `focus_query` has zero matches across the entire file, executes the **Zero Semantic Match** path, emitting a pure structural API skeleton (all imports + all top-level class/function headers with `pass` bodies).
  - Handles multi-line signatures and complex parameter lists verbatim without truncation.

### 4. Native PyO3 Bridge (`src/lib.rs`)
Implements `prd.md > Structured MCP Response`

- Exposes `fastast._core.prune_file(code_text: &str, focus_query: &str, threshold: f64) -> PyResult<PruneResult>`.
- Tokenizes original and pruned code using `tiktoken_rs::cl100k_base()`.
- Times native execution with `std::time::Instant`.
- Returns a typed struct with fields: `pruned_code`, `original_tokens`, `pruned_tokens`, `savings_pct`, `total_lines`, `kept_lines`, `latency_ms`.

### 5. FastMCP Server (`python/fastast/server.py`)
Implements `prd.md > Structured MCP Response`, `prd.md > States and Boundaries`

- Instantiates a local `FastMCP("fastast")` server.
- Exposes tool:
  ```python
  @mcp.tool()
  def prune_context(code_text: str, focus_query: str, threshold: float = 0.5) -> str:
      ...
  ```
- Validates syntax of `pruned_code` using Python's `ast.parse()`.
- Implements the graceful failure state: if source code was already malformed, catches `SyntaxError` and returns `{"error": "PREEXISTING_SYNTAX_ERROR", "pruned_code": code_text, "syntax_valid": false}`.
- Serializes result to JSON string.

### 6. CLI Runner & Benchmark Suite (`python/fastast/cli.py`)
Implements `prd.md > Interaction Surface (Screens & Layout)`

- Parses CLI arguments: input file, query, threshold, and output flags.
- Benchmarks execution across test fixtures and formats terminal output with latency and savings metrics.

## Data Model

### Rust Native Struct (`src/lib.rs`)
```rust
#[pyclass]
#[derive(Clone)]
pub struct PruneResult {
    #[pyo3(get)]
    pub pruned_code: String,
    #[pyo3(get)]
    pub original_tokens: usize,
    #[pyo3(get)]
    pub pruned_tokens: usize,
    #[pyo3(get)]
    pub savings_pct: f64,
    #[pyo3(get)]
    pub total_lines: usize,
    #[pyo3(get)]
    pub kept_lines: usize,
    #[pyo3(get)]
    pub latency_ms: f64,
}
```

### MCP Tool Output JSON Schema (`python/fastast/server.py`)
```json
{
  "pruned_code": "string",
  "original_tokens": 4200,
  "pruned_tokens": 1250,
  "savings_pct": 70.2,
  "total_lines": 350,
  "kept_lines": 110,
  "latency_ms": 3.8,
  "syntax_valid": true
}
```

## File Structure

```
fastAST/
├── Cargo.toml                       # Native Rust cdylib crate config
├── pyproject.toml                   # Maturin build system & Python dependencies
├── src/                             # Rust native core
│   ├── lib.rs                       # PyO3 module bindings & entry point
│   ├── parser.rs                    # Tree-Sitter parsing & AST walker
│   ├── scorer.rs                    # Rubric A (lexical) & Rubric B (structural)
│   └── repair.rs                    # Pass synthesis & indentation repair
├── python/                          # Python package
│   └── fastast/
│       ├── __init__.py              # Package init & re-exports
│       ├── _core.pyi                # Type stubs for PyO3 Rust extension
│       ├── server.py                # FastMCP server (JSON-RPC stdio)
│       └── cli.py                   # CLI runner & benchmark harness
├── tests/                           # Verification tests & fixtures
│   ├── test_pruner.py               # End-to-end syntax & latency tests
│   └── fixtures/
│       ├── sample_simple.py         # Small test module with classes/functions
│       ├── sample_complex.py        # Decorators, async def, multi-line signatures
│       └── sample_large.py          # 1,500+ line SWE-bench style benchmark file
└── devpost/                         # Devpost hackathon planning artifacts
    ├── learner-profile.md
    ├── scope.md
    ├── prd.md
    └── spec.md
```

## External Services and Dependencies

- **`tree-sitter` (v0.22+) & `tree-sitter-python` (v0.21+):** Embedded C/Rust parser. Local, in-memory, zero network access.
- **`tiktoken-rs` (v0.5+):** Local Rust BPE tokenizer using bundled `cl100k_base` vocabulary files. Zero network access.
- **`pyo3` (v0.21+):** Rust-to-CPython C-API bridge.
- **`mcp` (v1.0+):** Official Python SDK for Model Context Protocol.

## Important Failure Modes
Implements `prd.md > States and Boundaries`

1. **Pre-Existing Syntax Error in Source Code:**
   - *Failure:* Calling agent passes a file that has broken indentation or unclosed strings before pruning.
   - *Behavior:* Tree-Sitter detects parse error flags; Python `ast.parse()` confirms failure.
   - *Fallback:* FastAST returns graceful error object with original code untouched:
     `{"error": "PREEXISTING_SYNTAX_ERROR", "pruned_code": original_code, "syntax_valid": false}`.
2. **Zero Semantic Match:**
   - *Failure:* The agent queries for a symbol or keyword that does not exist in the file.
   - *Fallback:* FastAST returns a 100% syntactically valid API skeleton (all imports + top-level class/def signatures with `pass` bodies), giving the agent a clean architectural overview without implementation bloat.
3. **Empty Input String:**
   - *Failure:* Agent calls `prune_context` on an empty string.
   - *Fallback:* Returns immediately with `pruned_code: ""`, 0 tokens, and `syntax_valid: true`.

## What Was Simplified and Why

- **Lexical/Jaccard AST overlap instead of Neural Embeddings:** Avoids ONNX/PyTorch runtime dependencies and ensures the core engine runs in <5ms rather than 200ms+.
- **Single-file scope instead of repository-wide symbol graphs:** Keeps the hackathon MVP focused and fully verified within the 2–4 hour active build target.
- **In-memory AST parsing instead of persistent SQLite index:** Rust Tree-Sitter parses 3,000 lines of Python in ~1–2ms, rendering disk caching unnecessary overhead.

## Decisions and Open Issues

- **Rust Token Counting:** Verified to happen inside Rust via `tiktoken-rs` to keep the entire hot path GIL-free.
- **Early Verification Targets for Build:**
  1. Multi-line function signatures with type annotations
  2. Stacked decorators (single and multi-line)
  3. Nested classes and nested methods
  4. Async functions (`async def`) and async context blocks
  5. Docstring preservation/stripping rules
  6. Malformed input error handling

