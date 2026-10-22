# Multi-Language Support in FastAST

FastAST provides comprehensive multi-language support for AST parsing, symbol indexing, import extraction, and call graph analysis across **9 languages**: Python, Java, JavaScript, TypeScript, Rust, HTML, CSS, JSON, and TOML.

## Supported Languages

### 1. **Python** ✓
- **File Extensions:** `.py`, `.pyw`, `.pyi`
- **Features:**
  - Function, async function, class, and method extraction
  - Decorator extraction
  - Module import tracking (`import`, `from ... import`)
  - Function and method call site extraction
  - Token counting via `cl100k_base`

### 2. **JavaScript** ✓
- **File Extensions:** `.js`, `.jsx`, `.mjs`, `.cjs`
- **Features:**
  - Function declarations, arrow functions, async functions
  - Class and method declarations
  - ES6 `import` / CommonJS `require` statements
  - Call expressions

### 3. **TypeScript** ✓
- **File Extensions:** `.ts`, `.tsx`, `.mts`, `.cts`
- **Features:**
  - Function, class, and interface declarations
  - Method and arrow function extraction
  - Type-annotated signatures
  - Import declarations and call sites

### 4. **Java** ✓
- **File Extensions:** `.java`
- **Features:**
  - Class and interface definitions
  - Method declarations
  - Package and import statements
  - Method invocation calls

### 5. **Rust** ✓
- **File Extensions:** `.rs`
- **Features:**
  - Struct, enum, trait, and impl block extraction
  - Function and method definitions
  - `use` import declarations
  - Function and method call extraction

### 6. **HTML** ✓
- **File Extensions:** `.html`, `.htm`
- **Features:**
  - Tag element indexing
  - ID and class attribute symbol extraction
  - External script and stylesheet link extraction

### 7. **CSS** ✓
- **File Extensions:** `.css`
- **Features:**
  - Rule sets, class selectors, ID selectors
  - `@import` rule extraction
  - Custom property and selector indexing

### 8. **JSON** ✓
- **File Extensions:** `.json`
- **Features:**
  - Key-value structure parsing
  - Root and nested key symbol extraction
  - Schema dependency tracking

### 9. **TOML** ✓
- **File Extensions:** `.toml`
- **Features:**
  - Table and section header extraction
  - Configuration key indexing
  - Dependency table parsing

---

## Language Detection & Indexing API

FastAST automatically detects language from file extensions during repository indexing, or language can be passed directly:

```python
from fastast import index_code

# Index code in Python
result = index_code(source_code, language="python")

print(f"Symbols found: {len(result.symbols)}")
for sym in result.symbols:
    print(f"  {sym.kind}: {sym.name} (lines {sym.start_line}-{sym.end_line})")

print(f"Imports found: {len(result.imports)}")
for imp in result.imports:
    print(f"  {imp.module}")

print(f"Calls found: {len(result.calls)}")
for call in result.calls:
    print(f"  {call.callee}")
```

---

## Repository Indexer & SQLite Schema

When indexing a directory via `fastast index <dir> --db <db_path>` or via `RepositoryIndexer`:

```python
from fastast.indexer import RepositoryIndexer

indexer = RepositoryIndexer("fastast.db")
stats = indexer.index_directory("./my_project")
print(f"Indexed {stats['files_indexed']} files, {stats['symbols_indexed']} symbols.")

# Query symbols
symbols = indexer.find_symbol("handle_request")

# Query calls
calls = indexer.get_calls_from_symbol("main")
```

The database stores:
- **`files`**: `id`, `path`, `language`, `token_count`, `last_modified`
- **`symbols`**: `id`, `file_id`, `name`, `kind`, `start_line`, `end_line`, `parent`
- **`imports`**: `id`, `file_id`, `module`, `imported_names`, `line`
- **`calls`**: `id`, `file_id`, `caller_symbol`, `callee`, `line`

---

## MCP Server Integration

Coding agents connect to FastAST using the MCP protocol:
- `index_repository(directory_path, db_path)`: Scans and indexes the repository.
- `query_symbols(query, db_path, kind)`: Finds symbol definitions across the indexed codebase.
- `get_call_graph(symbol_name, db_path, direction)`: Traces callers and callees for a symbol.
