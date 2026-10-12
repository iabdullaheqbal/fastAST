---
doc: prd
status: approved
---

# FastAST — Product Requirements

A high-performance, syntax-guaranteed context pruning MCP server for AI coding agents, powered by a native Rust Tree-Sitter engine.
Source: `scope.md > Who It's For`, `scope.md > The Unique Kernel`

## The Core Journey
Source: `scope.md > The Core Loop`, `scope.md > What "Working" Looks Like`

1. **Discovery & Connection:** An AI coding agent (e.g., Claude Code, Cursor) initializes a local MCP connection to the FastAST JSON-RPC server and discovers the `prune_context` tool.
2. **Context Request:** When reading a large Python file (up to 3,000 lines), the agent invokes `prune_context(code_text: str, focus_query: str, threshold: float = 0.5)`.
3. **Dual-Rubric Analysis & Structural Repair:** FastAST passes the payload to its native Rust engine via PyO3:
   - Evaluates query relevance (Rubric A) and traces AST structural dependencies (Rubric B).
   - Fuses scores and executes deterministic AST structural repair, ensuring decorators, scope headers, and required imports are preserved and unkept blocks receive indented `pass` placeholders.
4. **Validation & Delivery:** The tool validates syntax against Python's parser (`ast.parse()`), calculates token savings using `cl100k_base`, computes line reduction metrics, and returns the structured JSON payload to the agent in <15ms.
5. **Agent Ingestion:** The agent consumes the pruned code as clean, syntactically valid context, avoiding token bloat and context window exhaustion while successfully resolving the task.

## Interaction Surface (Screens & Layout)
Source: `scope.md > The Core Loop`

FastAST is a headless systems utility and MCP tool with two primary surfaces:
- **MCP Tool Interface:** `prune_context(code_text: str, focus_query: str, threshold: float = 0.5) -> str (JSON)`
- **CLI / Verification Runner:** A local CLI command (e.g., `uv run fastast prune <file> --query <query>`) that displays:
  - Benchmark execution timer (ms)
  - Original token count vs. Pruned token count (via `cl100k_base`)
  - Line count reduction (`kept_lines` vs. `total_lines`)
  - Token savings percentage
  - Syntax validity badge (`VALID [ast.parse OK]` or `SYNTAX ERROR`)
  - Preview of the pruned code

## Look and Feel
Source: `scope.md > Inspiration & Identity`

- **Tone & Aesthetic:** Minimal, deterministic, developer-first, and zero-overhead.
- **Output Formatting:** Clean JSON responses for MCP callers; concise, high-density terminal metrics with microsecond/millisecond precision for developer verification.

## Features and Behavior

### 1. Structured MCP Response
Source: `scope.md > The Core Loop`

When `prune_context` executes, it returns a serialized JSON object with the following schema:
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
- **Acceptance Criteria:**
  - [ ] Returned string is valid JSON parseable by standard JSON parsers.
  - [ ] `pruned_code` contains syntactically parseable Python code.
  - [ ] `original_tokens` and `pruned_tokens` calculated using standard `cl100k_base` tokenizer encoding.
  - [ ] `total_lines` and `kept_lines` reflect line counts before and after pruning.
  - [ ] `savings_pct` correctly reflects `((original_tokens - pruned_tokens) / original_tokens) * 100`.
  - [ ] `latency_ms` measures native Rust execution time and reports <15ms on files up to 3,000 lines.

### 2. Dual-Rubric Pruning & AST Structural Repair
Source: `scope.md > The Unique Kernel`

- **Rubric A (Semantic Relevance):** Computes lexical and keyword matching of code lines against the agent's `focus_query`.
- **Rubric B (Structural Dependency Support):** Tree-Sitter AST inspection in Rust identifies required syntactic anchors:
  - All module-level `import` and `from ... import ...` statements are preserved 100% by default.
  - Module-level docstrings are preserved.
  - Decorators (single or multi-line) preceding any preserved function or class are preserved 100% verbatim.
  - Full function and method signatures (including `async def`, multi-line parameter lists, and return type annotations) are preserved.
  - Enclosing scope headers (parent `class` or outer `def`) are retained when any nested method or statement is kept.
  - Pruned bodies of unkept functions/methods are deterministically replaced with an indented `pass` statement at the correct indentation level.
  - Function/method docstrings are preserved if the body is kept, and stripped if the body is pruned to `pass`.
- **Acceptance Criteria:**
  - [ ] `ast.parse(result["pruned_code"])` completes with zero syntax errors on all valid Python inputs.
  - [ ] Functions with pruned bodies contain `pass` matching the enclosing indentation.
  - [ ] Multi-line function signatures and decorators remain intact.

## States and Boundaries
Source: `scope.md > The POC Boundary`, `scope.md > What "Working" Looks Like`

- **Normal Matching State:** Query matches specific functions or classes; FastAST returns pruned code retaining imports, relevant bodies, and stubbed sibling methods with 60–75% token reduction in <15ms.
- **Zero Semantic Match State:** If `focus_query` has zero lexical/semantic relevance to the file, FastAST returns a pure structural API skeleton: all imports, class definitions, and function signatures with `pass` bodies (~80–90% token reduction), providing the agent an architectural map of the file.
- **Pre-existing Syntax Error State:** If the input code is already malformed or unparseable prior to pruning, FastAST does not crash. It returns:
  ```json
  {
    "error": "PREEXISTING_SYNTAX_ERROR",
    "pruned_code": "<raw_unpruned_code>",
    "syntax_valid": false
  }
  ```
- **Session Boundary:** FastAST is completely stateless; no files or sessions are cached to disk.

## Product Decisions

- **Token Counting via `cl100k_base`:** Uses standard `cl100k_base` (matching OpenAI/Anthropic tokenizer standards used by modern coding agents).
- **Line Telemetry alongside Token Telemetry:** Exposes `total_lines` and `kept_lines` in the JSON response so callers and demo displays can observe both line and token compaction.
- **JSON Payload over Raw String:** The MCP tool returns JSON metadata rather than only a string so the agent and caller can observe token savings and latency telemetry directly.
- **100% Import Retention:** Imports are always retained because missing imports cause cascading symbol resolution errors in downstream agent code generation.
- **Pass Placeholder Synthesis:** Synthesizing `pass` rather than leaving empty blocks guarantees valid Python grammar across all indentation levels.
- **Structural Skeleton Fallback on Zero Match:** Returning an API skeleton rather than an empty string or error ensures the agent still learns what symbols exist in the file.
- **Graceful Degradation on Malformed Input:** Echoing back original source with a warning on pre-existing syntax errors prevents pipeline breakage in autonomous agent loops.

## What We're Building (Proof of Concept)
Source: `scope.md > The POC Boundary`

1. Rust compute engine utilizing `tree-sitter` and `tree-sitter-python` for AST traversal, lexical relevance scoring, and deterministic `pass` synthesis.
2. PyO3 bridge (built with maturin) exposing the Rust pruner to Python with zero-copy string transfer.
3. FastMCP local server implementing the `prune_context` tool over standard JSON-RPC (stdio).
4. CLI / benchmark runner script verifying token savings, latency (<15ms), line reductions, and syntax validity (`ast.parse()`) across sample benchmark files.

## Deferred From the POC
Source: `scope.md > Later`

- **Multi-file Cross-Module Tracing:** Multi-file dependency graph resolution is deferred to keep the hackathon PoC focused on single-file context optimization.
- **Persistent SQLite Cache:** Caching parsed ASTs across sessions is deferred; the native Rust engine in-memory parse is fast enough (<15ms) without disk caching.
- **Additional Languages:** TypeScript, Go, and Rust AST pruning are deferred to post-hackathon releases.

## Non-Goals
Source: `scope.md > Explicitly Cut`

- **No Neural/PyTorch Embeddings or CRF Models:** Strictly avoiding neural inference to prevent heavy dependencies and guarantee the sub-15ms latency budget.
- **No In-Place File Rewriting:** FastAST never modifies files on disk; it is strictly an in-memory context optimizer for agent prompts.
- **No Package Firewalling / Dependency Scanning:** Out of scope and orthogonal to AST context pruning.

## Open Questions

- *Resolved:* Token estimation uses `cl100k_base`.
