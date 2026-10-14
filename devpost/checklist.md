---
doc: checklist
status: approved
---

# Build Checklist

Build mode: fast

## Slices

- [x] **1. Native Rust AST engine scaffold with PyO3 bindings and basic pruning**
  Becomes usable: A compiled native Python extension `fastast._core` callable from Python that parses a Python snippet via Tree-Sitter, identifies function/class scopes and imports, strips unneeded bodies replacing them with indented `pass`, counts tokens via `tiktoken-rs` (`cl100k_base`), and returns `PruneResult` with verified 0 syntax errors.
  Why now: Proves the high-risk compiled native bridge (Rust + Tree-Sitter + PyO3 + tiktoken-rs + maturin) immediately in Slice 1. If native compilation, C-extension loading, or tree-sitter grammars have issues, we catch them on step 1 rather than after building Python layers.
  PRD ref: `prd.md > Dual-Rubric Pruning & AST Structural Repair`
  Spec ref: `spec.md > Stack`, `spec.md > Components > 1. Tree-Sitter Parser & AST Walker`, `spec.md > Components > 4. Native PyO3 Bridge`, `spec.md > File Structure`
  Build: Configure `Cargo.toml` (`pyo3`, `tree-sitter`, `tree-sitter-python`, `tiktoken-rs`) and `pyproject.toml` (maturin). Implement `src/parser.rs`, `src/repair.rs`, and `src/lib.rs`. Compile with `maturin develop`.
  Verify (mechanical): Run a Python one-liner importing `fastast._core.prune_file` on a test string with multiple functions, verifying `pass` replacement, token count, and `ast.parse()` validation.
  Learner check: Run `python -c "import fastast._core; res = fastast._core.prune_file('def foo():\n    return 42', 'bar', 0.5); print(res.pruned_code, res.latency_ms)"` to see the native compiled engine in action.
  Commit: `Initialize Rust Tree-Sitter core with PyO3 extension`

- [x] **2. Dual-rubric scoring, edge-case structural repair, and syntax fallbacks**
  Becomes usable: Full dual-rubric engine handling complex Python syntax: multi-line signatures, stacked decorators, enclosing classes/scopes, module docstrings, the zero-semantic-match API skeleton fallback, and pre-existing syntax error detection.
  Why now: The unique kernel of FastAST is syntax-guaranteed pruning under difficult real-world syntax edge cases. Proving and testing all syntax edge cases directly in native code before wrapping with network/MCP layers guarantees rock-solid reliability.
  PRD ref: `prd.md > Dual-Rubric Pruning & AST Structural Repair`, `prd.md > States and Boundaries`
  Spec ref: `spec.md > Components > 2. Dual-Rubric Scorer`, `spec.md > Components > 3. Deterministic Structural Repair Engine`, `spec.md > Important Failure Modes`
  Build: Implement `src/scorer.rs` with Jaccard token overlap for Rubric A and dependency tree tracing for Rubric B. Enhance `src/repair.rs` to preserve multi-line decorators, async defs, and enclosing classes, synthesize indented `pass`, strip body docstrings, and handle zero-match skeleton and malformed source. Add unit tests and complex fixtures.
  Verify (mechanical): Run `pytest tests/test_pruner.py` testing simple functions, stacked decorators, nested classes, async defs, zero matches, and invalid syntax.
  Learner check: Run the test suite on `tests/fixtures/sample_complex.py` and inspect the pruned output to confirm multi-line decorators and signatures are intact with valid syntax.
  Commit: `Implement dual-rubric scoring, edge-case repair, and syntax fallbacks`

- [ ] **3. FastMCP server interface for AI coding agents**
  Becomes usable: A running local MCP server implementing `prune_context` over JSON-RPC stdio, returning structured JSON with `pruned_code`, `cl100k_base` token metrics, line reduction metrics, and sub-15ms latency telemetry.
  Why now: Connects the native Rust core to the official MCP protocol, making FastAST directly callable by Claude Code, Cursor, and agentic workflows.
  PRD ref: `prd.md > The Core Journey`, `prd.md > Structured MCP Response`
  Spec ref: `spec.md > Components > 5. FastMCP Server`, `spec.md > Where It Runs and How Someone Tries It`
  Build: Create `python/fastast/server.py` using FastMCP. Define `prune_context` tool, validate syntax with `ast.parse()`, assemble the PRD JSON payload, and register the console script `fastast-mcp`.
  Verify (mechanical): Run an automated JSON-RPC stdio test script sending `tools/list` and `tools/call` for `prune_context` to `fastast-mcp`, checking the JSON response format and syntax validity.
  Learner check: Run `fastast-mcp` or test it via an MCP client call with a prompt and check the returned JSON metadata.
  Commit: `Add FastMCP server with JSON-RPC stdio prune_context tool`

- [ ] **4. CLI runner, 1,500+ line benchmark harness, and latency verification**
  Becomes usable: A developer CLI (`fastast prune <file> --query <query>`) and benchmark test suite executing on a 1,500+ line SWE-bench style Python module, demonstrating ~60–75% token reduction, 0 syntax errors, and <15ms execution time.
  Why now: Delivers the concrete "What Working Looks Like" hackathon demo deliverable—proving the sub-15ms speed claim and token savings on realistic large codebase files.
  PRD ref: `prd.md > Interaction Surface (Screens & Layout)`, `prd.md > What We're Building (Proof of Concept)`
  Spec ref: `spec.md > Components > 6. CLI Runner & Benchmark Suite`, `spec.md > Look and Feel`
  Build: Implement `python/fastast/cli.py` with arguments for input file, query, and threshold; create `tests/fixtures/sample_large.py` (1,500+ lines); add benchmark assertions in `tests/test_pruner.py`.
  Verify (mechanical): Run `uv run fastast prune tests/fixtures/sample_large.py --query "process_request"` and verify latency is <15ms, tokens reduced by >60%, and `ast.parse()` reports valid.
  Learner check: Run the CLI command on the benchmark fixture, observe the high-density terminal metrics, and review the pruned context.
  Commit: `Add CLI benchmark runner and 1500-line SWE-bench latency verification`

## Hands-on Checkpoints

- [ ] Early usable behavior explored — Slice 2 boundary (trying complex decorator and syntax repair in the native engine)
- [ ] Final kick-the-tires exploration and feedback completed — Slice 4 boundary (running CLI and MCP server on 1,500+ line benchmark file)

## Final Review

- [ ] Final review complete — feedback resolved and learner confirms ready to ship

## Code Tour and App Map

- [ ] Learning activity complete — guided route, focused alternative, prior practice connected, or brief recap
- [ ] Optional edit and transfer reflection addressed — offered/declined/already covered/not applicable as appropriate
- [ ] `devpost/app-map.html` generated from finished code, checked, and shown, including a project-grounded practice to reuse

Activity and evidence: [what actually happened; real document/test/code references; unfinished work if interrupted]
Route and stops: [actual paths and symbols; guided stops completed, or reference-only route]
Edit outcome: [tried/kept/reverted/declined/not applicable; verification if changed]
Reflection: [offered/answered/declined/already covered — personal answer belongs only in the ignored profile]
Activity mode: [live app and editor, explicit static fallback, focused alternative, prior practice, or recap]

## Revisions

