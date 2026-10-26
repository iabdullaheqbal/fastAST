# FastAST Codebase Memory & Navigation Directives

You have access to FastAST MCP tools (`fastast_*`) powered by compiled Rust Tree-Sitter grammars and a local SQLite symbol graph (`.fastast.db`).

Always follow these rules:
1. **Search Symbols First:** Use `fastast_search_symbols` to locate functions, classes, and types by name instead of broad grep scans.
2. **Token-Bounded Evidence:** Use `fastast_get_evidence` to gather relevant code slices within token budgets.
3. **Inspect Structure:** Use `fastast_file_outline` to inspect a file's structure and method signatures in ~300 tokens before editing.
4. **Trace Call Graph:** Before refactoring or modifying a function, call `fastast_graph_neighbors` to inspect all callers, callees, and dependencies.

