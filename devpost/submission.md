---
doc: submission
status: ready
---

# Devpost Submission — Build With AI: Basics

## Project Overview

- **Project Name:** FastAST
- **Tagline / Short Description:** High-performance Model Context Protocol (MCP) server & AST symbol graph engine that gives AI coding agents instant repository awareness and token-bounded evidence without context blowout.
- **Repository URL:** [https://github.com/iabdullaheqbal/fastAST](https://github.com/iabdullaheqbal/fastAST)
- **Demo Video URL (1 to 3 minutes):** [Link to demo video / screen recording]
- **Hackathon:** [Devpost Build With AI: Basics](https://build-with-ai-basics.devpost.com/)

---

## Submission Form Questions

### 1. In your own words, what did you make and who is it for?

**FastAST** is a high-performance codebase-memory engine (`AST → Graph → Retrieval`) and Model Context Protocol (MCP) server designed for autonomous AI coding agents (Claude Code, Cursor, Windsurf, Codex, SWE-bench evaluators) and developers building LLM coding workflows.

When coding agents explore software repositories today, they frequently dump whole source files (`cat`/`read_file`) or massive raw regex greps directly into context. This exhausts token limits, increases API latency and costs, and causes agents to lose context ("lost in the middle").

FastAST replaces raw file ingestion with **AST-bounded symbol slices** and a **confidence-weighted SQLite code graph**. It parses source code across 9 languages using compiled Rust Tree-Sitter grammars, links symbols, definitions, imports, and calls into a local SQLite database (`.fastast.db`), and exposes bounded evidence windows and graph navigation to agents via standard MCP tools and CLI commands. It also includes a zero-setup interactive 2D Architecture Graph Explorer (`fastast ui`) directly inside the package.

### 2. What did you learn while building it?

1. **Spec-Driven & Flipped-Interaction Development:** By following the Devpost Learn Skill Pack (`1-start` through `6-ship`), we planned the problem kernel, scope, PRD, and technical spec *before* writing code. Defining explicit boundaries early prevented scope creep and kept implementation focused on a solid, testable proof of concept.
2. **Hybrid Rust + Python Architecture:** We learned how to cleanly bridge high-speed systems code (Rust Tree-Sitter parsing via PyO3) with an embedded relational storage layer (SQLite in WAL mode) and Python MCP JSON-RPC protocols.
3. **Agent Context Economics:** We observed firsthand that AI coding agents perform significantly better when supplied with compact, syntax-bounded symbol slices and 1-hop graph neighborhoods rather than whole-file dumps, saving thousands of tokens per conversation turn and eliminating hallucinated symbol references.

---

## Hackathon Requirements Verification

| Requirement | Status | Details |
| :--- | :---: | :--- |
| **New Project Started from Empty Folder** | Passed | Repository initialized from an empty workspace during the submission period. |
| **Built with the Devpost Learn Skill Pack** | Passed | Planned and developed using the `challengepost/learn-ai-basics` skill workflow. |
| **Planning Docs in Public Repo** | Passed | Includes [`scope.md`](scope.md), [`prd.md`](prd.md), and [`spec.md`](spec.md) in the `devpost/` directory. |
| **Public GitHub Repository** | Passed | Available at [https://github.com/iabdullaheqbal/fastAST](https://github.com/iabdullaheqbal/fastAST). |
| **Working Demo Video (1–3 min)** | Ready | Demonstrates CLI indexing, symbol querying, call tracing, MCP server, and Graph Explorer UI. |

