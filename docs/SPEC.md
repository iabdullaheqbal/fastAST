# FastAST Technical Specification

> **Specification Version**: 1.0  
> **Status**: Approved  
> **Target**: FastAST Core Engine & Agent Protocol

---

## 1. Domain Data Models

### 1.1. FileRecord
Represents an admitted repository file tracked in the persistent index.
- `path` (`string`): Normalized repository-relative file path.
- `language` (`string`): Detected language identifier (`python`, `typescript`, `rust`, etc.).
- `hash` (`string`): 64-bit or 256-bit content hash (xxHash3 or BLAKE3).
- `mtime` (`float`): Filesystem modification epoch timestamp.
- `category` (`string`): Semantic category (`source`, `test`, `config`, `docs`, `infra`, `generated`, `other`).
- `total_lines` (`integer`): Line count of the file.
- `total_tokens` (`integer`): Estimated BPE token count.
- `has_syntax_error` (`boolean`): True if AST parsing encountered syntax errors.

### 1.2. SymbolRecord
Represents a syntax declaration node within an admitted source file.
- `id` (`integer | null`): Database primary key.
- `name` (`string`): Symbol identifier (e.g. `execute_query`, `AuthService`).
- `kind` (`string`): Syntactic kind (`function`, `async_function`, `class`, `method`, `interface`, `struct`, `trait`).
- `file` (`string`): Relative file path.
- `start_line` (`integer`): 1-based start line number.
- `end_line` (`integer`): 1-based end line number.
- `confidence` (`float`): Extraction confidence score (0.0 to 1.0).
- `signature` (`string | null`): Function or class signature definition.
- `parent_name` (`string | null`): Name of enclosing class or module.
- `docstring` (`string | null`): Extracted docstring or documentation comments.

### 1.3. EdgeRecord
Represents a directed dependency edge in the code graph.
- `src` (`string`): Source symbol name or identifier.
- `dst` (`string`): Target symbol name or identifier.
- `relation` (`string`): Edge relation type (`calls`, `imports`, `defines`, `implements`, `inherits`, `similar_to`).
- `confidence` (`float`): Relation confidence score (0.0 to 1.0).
- `line_number` (`integer | null`): Call site or import line number.

### 1.4. EvidenceWindow & Candidate
Represents a ranked query match with bounded context for AI coding agents.
- `symbol_id` (`string`): Matched symbol ID or identifier.
- `score` (`float`): Relevance score computed via hybrid ranking.
- `reasons` (`list[string]`): Scoring explainability factors.
- `neighbors` (`list[string]`): Bounded 1-hop graph neighbors.
- `evidence_window`:
  - `start_line` (`integer`): Bounded start line with context padding.
  - `end_line` (`integer`): Bounded end line with context padding.
  - `snippet` (`string | null`): Bounded source code slice with middle omission indicators for large functions.

---

## 2. Query & Retrieval Specification

### 2.1. Scoring Function
Candidate score $S(c)$ combines dense semantic similarity, BM25 full-text rank, exact/substring name matches, type priority, path relevance, and degree centrality:
$$S(c) = w_{sem} S_{sem} + w_{bm25} S_{bm25} + w_{name} S_{name} + w_{type} S_{type} + w_{path} S_{path} + w_{deg} S_{deg}$$

Supported ranking strategies:
- `hybrid`: Weighted linear combination of Semantic, BM25, and structural signals.
- `rrf`: Reciprocal Rank Fusion ($k=60$) across dense, lexical, and structural rankings.
- `semantic`: Pure dense vector cosine similarity with structural tie-breaking.
- `bm25`: Pure FTS5 BM25 lexical ranking with confidence gating.

---

## 3. Protocol & Tooling Specification

FastAST exposes standard MCP JSON-RPC 2.0 tools over stdio:
- `index_repository`: Recursive incremental indexing.
- `query_symbols`: Name-based and substring symbol search.
- `get_call_graph`: Inbound callers and outbound callees.
- `get_graph_neighborhood`: Bounded multi-hop graph expansion.
- `retrieve_evidence` / `query`: Token-budgeted candidate bundles.
- `get_symbol_evidence`: Definition metadata, snippet, and 1-hop neighbors.
- `get_file_outline`: Hierarchical file structure without body code.
- `get_snippet`: Line-bounded code window with padding.
- `get_similar_symbols`: MinHash + LSH duplicate detection.
- `get_community` & `list_communities`: Louvain modularity clustering.
- `diagnose_repository`: Health, lock inspection, and SQLite integrity validation.

