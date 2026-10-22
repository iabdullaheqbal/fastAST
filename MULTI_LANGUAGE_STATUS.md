# Multi-Language Support Status

## Current Status: 9 Languages Fully Supported ✅

FastAST implements native Tree-Sitter AST parsing, symbol indexing, import extraction, and call graph analysis across 9 languages:

- ✅ **Python** (`.py`, `.pyw`, `.pyi`)
- ✅ **JavaScript** (`.js`, `.jsx`, `.mjs`, `.cjs`)
- ✅ **TypeScript** (`.ts`, `.tsx`, `.mts`, `.cts`)
- ✅ **Java** (`.java`)
- ✅ **Rust** (`.rs`)
- ✅ **HTML** (`.html`, `.htm`)
- ✅ **CSS** (`.css`)
- ✅ **JSON** (`.json`)
- ✅ **TOML** (`.toml`)

---

## Architectural Implementation

Each language has a dedicated module under `src/` adhering to the AST extraction interface:

```
src/
├── lib.rs                  # Native C-extension bridge & index_code() entrypoint
├── language.rs             # Language enum & extension detection
├── parser.rs               # Universal Tree-Sitter AST parser wrapper
├── indexer.rs              # Python-specific AST symbol walker
├── java/mod.rs             # Java AST symbol/import/call extractor
├── javascript/mod.rs       # JS AST symbol/import/call extractor
├── typescript/mod.rs       # TS AST symbol/import/call extractor
├── rust/mod.rs             # Rust AST symbol/import/call extractor
├── html/mod.rs             # HTML element/attribute extractor
├── css/mod.rs              # CSS rule & selector extractor
├── json/mod.rs             # JSON key-value structure extractor
└── toml/mod.rs             # TOML table & key extractor
```

---

## Verification & Test Coverage

Each language has automated test suites in `tests/`:
- `tests/test_python_layers.py`: Python symbols, calls, imports, CLI tests
- `tests/test_java.py`: Java class/method/import extraction
- `tests/test_javascript.py`: JS functions, classes, imports
- `tests/test_typescript.py`: TS types, interfaces, arrow functions
- `tests/test_rust.py`: Rust structs, enums, traits, functions, use statements
- `tests/test_html.py`: HTML element/attribute extraction
- `tests/test_css.py`: CSS selectors, rules, `@import`
- `tests/test_json.py`: JSON key structures
- `tests/test_toml.py`: TOML tables and keys
- `tests/test_multi_language.py`: Cross-language end-to-end indexing
- `tests/test_indexer.py`: SQLite index database, queries, and repository walker
