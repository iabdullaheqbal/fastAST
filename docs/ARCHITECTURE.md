# FastAST Architecture Specification

> **A High-Performance Codebase-Memory Engine**  
> **Pipeline**: `AST → Graph → Retrieval`  
> **Target Audience**: Autonomous AI Coding Agents (Claude Code, Cursor, SWE-bench evaluators) & LLM DevTools

---

## 1. Vision & Core Mission

Large software repositories contain millions of tokens of code across thousands of files. When an AI coding agent attempts to solve an issue, it faces two fundamental bottlenecks:
1. **Context Window Saturation**: Passing raw files or naive grep dumps exhausts token budgets, introduces distracting noise, and leads to context rot.
2. **Structural Blindness**: Plain-text regex or naive dense embeddings lack syntax comprehension; they cannot distinguish between symbol declarations, invocations, module imports, or type inheritance.

**FastAST** solves this as a native **Codebase-Memory Engine**. It analyzes source code via multi-language concrete syntax trees (ASTs), constructs a typed, confidence-weighted code graph, and delivers bounded, high-relevance evidence to agents through a hybrid retrieval pipeline.

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│ AST Extraction  │  ───► │   Code Graph    │  ───► │Hybrid Retrieval │
│  (Tree-Sitter)  │       │(Symbols & Edges)│       │ (BM25 + Graph)  │
└─────────────────┘       └─────────────────┘       └─────────────────┘
         │                         │                         │
         ▼                         ▼                         ▼
   Syntactic Nodes          Relational Edges          Bounded Evidence
  (Fn, Class, Import)     (Calls, Defines, Uses)    (Window, Score, Path)
```

---

## 2. Core Domain Data Model

The FastAST architecture is anchored on four fundamental primitives shared across Rust and Python layers:

### 2.1. `FileRecord`
Tracks indexed files, language identity, content fingerprints, and incremental indexing state.

```rust
pub struct FileRecord {
    pub path: String,             // Relative normalized repository path
    pub language: String,         // Detected language identifier (e.g., "python", "rust")
    pub hash: String,             // Fast 64-bit/256-bit content hash (xxHash3 / BLAKE3)
    pub mtime: f64,               // Filesystem modification epoch timestamp
    pub status: FileStatus,       // Indexing state: Unchanged | Added | Modified | Deleted | Error
    pub total_lines: usize,       // Total lines of code
    pub total_tokens: usize,      // BPE token count (cl100k_base)
    pub has_syntax_error: bool,   // Tree-sitter error recovery flag
}
```

### 2.2. `SymbolRecord`
Represents an extracted syntactic node (declaration or definition) within a file.

```rust
pub struct SymbolRecord {
    pub id: Option<i64>,          // Unique database identifier
    pub name: String,             // Symbol identifier (e.g., "handle_payment")
    pub kind: String,             // "function", "class", "method", "interface", "struct", "trait"
    pub file: String,             // Path of the containing file
    pub start_line: usize,        // 1-based start line in source
    pub end_line: usize,          // 1-based end line in source
    pub confidence: f32,          // Confidence score (0.0 - 1.0) of extraction accuracy
    pub signature: Option<String>,// Declaration signature string
    pub parent_name: Option<String>, // Enclosing parent symbol (class, struct, or module)
    pub docstring: Option<String>,// Extracted docstring / comment block
}
```

### 2.3. `EdgeRecord`
Represents a directed structural dependency between two symbols or entities.

```rust
pub struct EdgeRecord {
    pub src: String,              // Source symbol name or qualified path
    pub dst: String,              // Target callee, import, or parent symbol name
    pub relation: EdgeRelation,   // Calls | Imports | Defines | Implements | Inherits | References
    pub confidence: f32,          // Resolution confidence (1.0 = exact AST, 0.7 = heuristic)
    pub line_number: Option<usize>, // Source callsite or import line number
}
```

### 2.4. `Candidate` & `EvidenceWindow`
The output of retrieval: an actionable, scored symbol bundle with local neighborhood context and line-bounded snippet.

```rust
pub struct EvidenceWindow {
    pub start_line: usize,        // Starting line with context padding
    pub end_line: usize,          // Ending line with context padding
    pub snippet: Option<String>,  // Slice of raw source code
}

pub struct Candidate {
    pub symbol_id: String,        // Target symbol ID or qualified name
    pub score: f32,               // Composite hybrid retrieval score
    pub reasons: Vec<String>,     // Explainability trace (e.g., "BM25 match", "1-hop caller")
    pub neighbors: Vec<String>,   // Adjacent 1-hop and 2-hop graph neighbors
    pub evidence_window: EvidenceWindow, // Precise code snippet for LLM context
}
```

---

## 3. Full Algorithm Stack

FastAST integrates 18 concrete algorithms and systems designed to operate concurrently at sub-millisecond latencies:

### 3.1. File Discovery + Ignore Rules
- **Mechanism**: Multi-threaded directory traversal using the Rust `ignore` engine (leveraging `.gitignore`, `.ignore`, and `.fastastignore` precedence).
- **Rule Ordering**: CLI overrides > `.fastastignore` > project `.gitignore` > global gitignore > default system excludes (`.git`, `node_modules`, `target`, `dist`, `.venv`, `__pycache__`).
- **Binary Sniffing**: Inspects the first 1,024 bytes of each candidate file for null bytes (`0x00`) to eliminate binaries and assets before parsing.

### 3.2. xxHash3 / BLAKE3 Content Hashing
- **Fingerprinting**: Uses `xxHash3` (64-bit / 128-bit) for ultra-fast (15+ GB/s) cache invalidation. When cryptographic verification across machines is required, `BLAKE3` provides tree-hashing verified security.
- **Cache Invalidation**: Computes `hash(file_bytes)`. If `(mtime, size, hash)` matches SQLite `FileRecord`, file parsing is skipped entirely in $O(1)$ time.

### 3.3. Tree-Sitter Concrete Syntax Tree Parsing
- **Multi-Language Coverage**: Native parsers for Python, JavaScript, TypeScript, Java, Rust, HTML, CSS, JSON, and TOML.
- **Fault-Tolerant Parsing**: Tree-sitter generates resilient syntax trees even across incomplete edits or syntax errors, preserving valid sibling scopes.
- **Zero-Copy Slicing**: AST nodes reference byte offsets in the raw source buffer without heap allocation.

### 3.4. Hybrid LSP-Style Resolution
- **Phase 1 (Intra-file Scope Resolution)**: Resolves local variables, nested functions, and class members against lexical symbol tables.
- **Phase 2 (Inter-file Import Graph Linking)**: Matches unqualified calls (e.g. `validate()`) against file `imports` tables to resolve fully-qualified symbols (e.g. `auth.service.validate`).
- **Confidence Scoring**:
  - Exact resolved import + type signature: `confidence = 1.0`
  - Same module / file resolution: `confidence = 0.9`
  - Package-level heuristic match: `confidence = 0.7`
  - Unresolved dynamic call / duck typing: `confidence = 0.4`

### 3.5. Graph Construction
- **Directed Property Graph**: Nodes = `{File, Symbol, Module}`, Edges = `{Calls, Imports, Defines, Implements, Inherits, References}`.
- **Dual Representation**:
  - **Relational Store**: Stored in SQLite `edges` table for indexed relational queries.
  - **In-Memory Adjacency List**: `petgraph` or compressed sparse row (CSR) graph in Rust memory for sub-millisecond graph traversals.

### 3.6. BFS / Bounded Traversal
- **Constrained Neighborhood Search**: Starting from a seed candidate symbol, traverses directed edges up to $k$ hops ($k \in [1, 3]$).
- **Confidence Decay**: Edge traversal decays score:
  $$\text{Score}(v) = \text{Score}(u) \cdot \text{Confidence}(e_{u,v}) \cdot \lambda^{\text{hop}}$$
  where $\lambda \in [0.7, 0.9]$ is the hop attenuation factor.
- **Cycle Safety & Budget**: Maintains a visited set and strict max-node expansion limit (default: 50 nodes) to prevent traversing massive dependency cycles.

### 3.7. BM25 Lexical Retrieval (Phase 7: Multi-Signal Lexical Ranking)
- **BM25 as One Signal, Not the Entire System**: Pure full-text lexical matching easily produces false positives in codebases (e.g. matching terms inside comments, test files, or obsolete docstrings over primary definitions). In FastAST, **BM25 is strictly one signal** contributing to a multi-signal hybrid scoring model.
- **Signal Combination**: BM25 lexical relevance is dynamically weighted alongside six complementary structural signals:
  1. **BM25 Lexical Score ($S_{\text{BM25}}$)**: Normalized FTS5 score over symbol name, parameter signature, docstring, and relative file path.
  2. **Exact Name Match ($S_{\text{name}}$)**: Deterministic identifier match (exact case = 1.0, case-insensitive = 0.95, prefix = 0.80, suffix = 0.70, word boundary = 0.65, substring = 0.50).
  3. **Path Relevance ($S_{\text{path}}$)**: Target path proximity and file category prioritization (source files = 0.80, test files = 0.40, config/infra = 0.35).
  4. **Symbol Kind Priority ($S_{\text{type}}$)**: Prioritizes executable architectural constructs (functions, methods, classes, interfaces, structs = 0.85) over value declarations (variables, constants = 0.60) or module wrappers (0.40).
  5. **Graph Degree & Neighbor Strength ($S_{\text{edge}}$)**: Structural degree centrality ($\min(1.0, \text{deg} / 6.0)$), boosting central architectural hubs connected via callers, callees, and inheritance.
  6. **Parser Confidence ($S_{\text{conf}}$)**: Extraction confidence from Tree-Sitter AST parsing, penalizing partial syntax-error recoveries.
  7. **Optional Semantic Embedding Score ($S_{\text{semantic}}$)**: Cosine similarity from dense vector projections when semantic ranking is active.
- **Graceful Fallback to Heuristic Ranking**:
  - If SQLite FTS5 is unpopulated, empty, stale, or encounters query tokenization syntax errors, FastAST **never crashes or returns empty results**.
  - It automatically falls back to pure AST structural heuristic ranking:
    $$\text{Score}_{\text{heur}} = 0.40 \cdot S_{\text{name}} + 0.15 \cdot S_{\text{type}} + 0.15 \cdot S_{\text{path}} + 0.15 \cdot S_{\text{edge}} + 0.15 \cdot S_{\text{conf}}$$
  - Self-healing FTS synchronization detects stale tables (`fts_count < sym_count`) and automatically backfills missing entries during database initialization.
- **Strict Bounded Output**:
  - **Top-$K$ Candidate Pruning**: Retains strictly the top-$K$ scored candidates (default $k=5$), pruning irrelevant noise below `min_score`.
  - **Snippet Line Bounding**: Code snippets are bounded to `max_snippet_lines` (default 40–60 lines) with explicit omission notices (`... [N lines omitted for brevity] ...`).
  - **Token Budgeting**: Overall evidence assembly respects `max_tokens` budgets, setting `truncated: true` and omitting subsequent code bodies while preserving structural metadata.
- **Inverted Index**: Builds an embedded SQLite FTS5 virtual table (`symbols_fts`) over symbol names, parameter signatures, docstrings, and relative file paths using the `unicode61 remove_diacritics 2` tokenizer.
- **Automated Synchronization Triggers**:
  - `symbols_ai AFTER INSERT ON symbols`: Automatically inserts newly indexed symbols, signatures, docstrings, and paths into `symbols_fts`.
  - `symbols_ad AFTER DELETE ON symbols`: Automatically removes purged symbols from `symbols_fts`. Enabled with `PRAGMA recursive_triggers = ON;` so foreign key cascade deletions propagate cleanly.
- **Scoring Formula**:
  $$\text{Score}_{\text{BM25}}(D, Q) = \sum_{t \in Q} \text{IDF}(t) \cdot \frac{f(t, D) \cdot (k_1 + 1)}{f(t, D) + k_1 \cdot \left(1 - b + b \cdot \frac{|D|}{\text{avgdl}}\right)}$$
  (Default parameters: $k_1 = 1.2$, $b = 0.75$).
- **Field Boosting**: Multiplies term score by column weights: Symbol Name ($\times 3.0$) > Signature ($\times 2.0$) > Docstring ($\times 1.0$) > File Path ($\times 1.0$).
- **Score Normalization**: Raw negative FTS5 rank values are normalized into $[0.0, 1.0]$ via $1.0 / (1.0 + \log(1.0 + |\text{rank}|))$.

### 3.8. Dense Semantic Embeddings & Vector Search (Phase 8: Multi-Signal Semantic Fusion)

FastAST's Phase 8 design stresses six non-negotiable architectural principles:
1. **Embeddings are One Signal Among Several**: In codebases, dense embeddings alone cannot discern exact identifier names, method signatures, or fine-grained scope boundaries. Semantic cosine similarity is strictly **one signal among several** (typically 25% weight in default hybrid ranking), working alongside lexical BM25, deterministic name matching, kind priority, path relevance, graph degree centrality, and parser confidence.
2. **Exact and Strong Lexical Matches Still Matter**: Software engineering retrieval fundamentally differs from prose search. When an engineer or coding agent queries an identifier (e.g. `verify_login_credentials` or `execute_query`), an exact or prefix lexical match on the symbol identifier must strongly anchor or top the rank. Exact name matches receive high dedicated weight ($0.25 - 0.30$) with stratified matching tiers (exact case = 1.0, case-insensitive = 0.95, prefix = 0.80, suffix = 0.70, word boundary = 0.65, substring = 0.50), preventing fuzzy semantic associations from overtaking real declarations.
3. **Graph Structure and Path Relevance Remain Critical**: Code is inherently relational and structured:
   - **Graph Centrality ($S_{\text{edge}}$)**: Hub symbols with high in-degree (callers) or out-degree (callees) receive a centrality boost (up to $+0.10$), prioritizing core reusable logic over leaf utilities.
   - **Path Relevance ($S_{\text{path}}$)**: Production source files (`src/`, `lib/`, `packages/`) receive positive bias ($0.80$), while test fixtures (`test/`, `spec/`), mocks, and configuration files are penalized ($0.25 - 0.40$).
4. **Semantic Results are Fused with BM25 + Structural Rank, Not Replacing Them**:
   - Dense vector retrieval does not discard or overwrite lexical or structural ranking.
   - Results are fused via **Weighted Hybrid Scoring** or **Reciprocal Rank Fusion (RRF)**, combining dense vector rank, BM25 text rank, and AST structural rank into an explainable ensemble.
5. **Graceful Fallback When Embeddings are Missing or Stale**:
   - When the `symbol_embeddings` table is unpopulated, stale (e.g. newly created files not yet embedded), or if embedding generation fails, the retrieval engine **gracefully falls back** to BM25 + heuristic structural ranking without crashing or returning empty sets:
     $$\text{Fallback Score} = 0.30 \cdot S_{\text{bm25}} + 0.30 \cdot S_{\text{name}} + 0.10 \cdot S_{\text{type}} + 0.10 \cdot S_{\text{path}} + 0.10 \cdot S_{\text{edge}} + 0.10 \cdot S_{\text{conf}}$$
   - If both embeddings and BM25 are unavailable, it degrades to pure AST structural scoring ($0.40 S_{\text{name}} + 0.15 S_{\text{type}} + 0.15 S_{\text{path}} + 0.15 S_{\text{edge}} + 0.15 S_{\text{conf}}$).
   - Stale embeddings are detected and refreshed via incremental synchronization (`backfill_symbol_embeddings`).
6. **Local-First and Token-Conscious**:
   - **100% Local-First**: The default `SemanticProjectionProvider` generates 128-dimensional dense vectors offline with zero external network calls, zero cloud API keys, and zero heavyweight dependencies, executing in microseconds per symbol.
   - **Strictly Token-Conscious**: Embeddings serve purely for candidate pruning and ranking. Results are strictly bounded by top-$K$ limits (`limit=10`), bounded snippet extraction windows (default 5–15 lines, hard-capped at 60), and token budgets (default: 3,500 tokens), preventing context window blowups.

- **Vector Storage Schema & Versioning**:
  - `symbol_embeddings`:
    - `symbol_id INTEGER PRIMARY KEY`: Foreign key references `symbols(id) ON DELETE CASCADE`.
    - `model TEXT NOT NULL`: Model identifier string (e.g. `fastast-projection-128`).
    - `model_version TEXT NOT NULL DEFAULT '1.0'`: Explicit model version tracking.
    - `generation_id INTEGER NOT NULL DEFAULT 1`: Monotonic generation counter for atomic cohort invalidation.
    - `dimensions INTEGER NOT NULL`: Vector length (e.g. 128, 384).
    - `norm REAL NOT NULL DEFAULT 1.0`: Stored scalar $L_2$ norm for verification.
    - `section TEXT NOT NULL DEFAULT 'symbol'`: Granularity label (`symbol`, `signature`, `docstring`).
    - `file_id INTEGER`: Foreign key references `files(id) ON DELETE CASCADE`.
    - `embedding BLOB NOT NULL`: Packed IEEE 754 32-bit float BLOB (`struct.pack(f"{len}f")`).
    - `updated_at REAL NOT NULL`: Epoch timestamp of embedding creation.
  - `file_embeddings`: Optional file-level embedding storage for coarse repository clustering and high-level routing.
  - **Schema Migration Safety**: `init_db()` verifies table existence and uses `ALTER TABLE symbol_embeddings ADD COLUMN ...` to dynamically migrate legacy databases without data loss.
- **Incremental Embedding Maintenance**:
  - **Added/Changed Symbols**: Recomputed atomically inside the indexing transaction.
  - **Deleted Symbols & Purged Files**: Automatically purged via SQLite `ON DELETE CASCADE` foreign keys on `file_id` and `symbol_id`.
  - **Stale Embedding Invalidation**: `invalidate_stale_embeddings(conn, model, version)` drops out-of-date model versions, while `backfill_symbol_embeddings()` detects un-embedded or version-mismatched symbols and brings vectors up to date.
- **Calibrated Semantic Score Normalization**:
  - Raw cosine similarity $\text{sim} \in [-1.0, 1.0]$ is pruned below relevance threshold $\theta_{\text{min}} = 0.25$.
  - Values $\ge 0.25$ are mapped through a calibrated monotonic transfer function into a stable ranking score:
    $$S_{\text{semantic}} = \min\left(1.0, \max\left(0.0, \frac{\text{sim} - 0.25}{1.0 - 0.25} \times 0.90 + 0.10\right)\right)$$
  - Raw embedding scores are **never directly mixed uncalibrated with BM25**, ensuring parity across scoring domains.
- **Unified Retrieval Engine Integration**:
  - Dense semantic querying lives directly within `RetrievalEngine.search_symbols()` and `retrieve_bundle()`.
  - Automatically fuses semantic, BM25, exact name match, and structural graph traversal by default (`--ranking hybrid`).
- **Pluggable Architecture**:
  - `SemanticProjectionProvider` (default): Fast, offline-first, zero-dependency 128-dimensional projection vectorizer combining software domain concept taxonomy mapping, subword/character 3-gram feature hashing, and $L_2$ hypersphere normalization.
  - `FastembedProvider`: Optional pluggable wrapper for `BAAI/bge-small-en-v1.5` via fastembed.
  - `SentenceTransformersProvider`: Optional pluggable wrapper for `all-MiniLM-L6-v2` via sentence-transformers.
  - `CustomEmbeddingProvider`: Adapter for user-supplied callable embedding functions with custom versioning.

### 3.9. Hybrid Ranking & Multi-Modal Fusion
- **Score Fusion Modes**: FastAST supports four complementary ranking modes:
  1. **Weighted Hybrid Sum (default)**:
     $$\text{Score} = 0.25 \cdot S_{\text{semantic}} + 0.25 \cdot S_{\text{BM25}} + 0.25 \cdot S_{\text{name}} + 0.09 \cdot S_{\text{type}} + 0.08 \cdot S_{\text{path}} + 0.05 \cdot S_{\text{edge}} + 0.04 \cdot S_{\text{conf}}$$
  2. **Pure Semantic Ranking (`--ranking semantic`)**:
     $$\text{Score} = 0.60 \cdot S_{\text{semantic}} + 0.20 \cdot S_{\text{name}} + 0.10 \cdot S_{\text{type}} + 0.10 \cdot S_{\text{edge}}$$
  3. **Multi-Modal Reciprocal Rank Fusion (`--ranking rrf`)**:
     $$\text{RRF}(d) = \frac{0.35}{k + \text{rank}_{\text{semantic}}(d)} + \frac{0.35}{k + \text{rank}_{\text{BM25}}(d)} + \frac{0.30}{k + \text{rank}_{\text{heur}}(d)}$$
     where $k = 60$, fusing dense semantic vector rank, BM25 lexical rank, and structural graph rank.
  4. **Heuristic Fallback (`--ranking heuristic`)**: Pure AST structural heuristic matching when lexical/semantic models are intentionally bypassed.
- **Explainability**: Every candidate carries `reasons: Vec<String>` detailing attribution (e.g., `"Semantic match (score: 0.88)"`, `"BM25 lexical match (score: 0.95)"`, `"Exact name match ('search_symbols')"`).

### 3.10. MinHash + LSH (Locality Sensitive Hashing)
- **Near-Duplicate & Clone Detection**: Detects copy-pasted functions, boilerplate classes, parallel interface implementations, and near-miss symbol variations without quadratic $O(N^2)$ comparisons.
- **Shingling & Tokenization**: Decomposes symbol names (splitting camelCase, snake_case, and punctuation), signatures, docstring prefixes, and character 3-grams into normalized shingle sets.
- **MinHash Signatures**: Applies $m = 64$ deterministic linear congruential hash permutations over Carter-Wegman Mersenne prime $2^{31} - 1$ ($h_i(x) = (a_i \cdot x + b_i) \bmod (2^{31}-1)$).
- **LSH Band Partitioning**: Partitions the 64-dimensional signature into $b = 16$ bands of $r = 4$ rows each. Candidate pairs share an identical bucket in at least one band, providing an $S$-curve transition threshold at $t = (1/b)^{1/r} = (1/16)^{1/4} = 0.50$.
- **Exact Jaccard Verification**: Evaluates true Jaccard similarity $J(A, B) = \frac{|A \cap B|}{|A \cup B|}$ for candidate pairs and retains matches exceeding `min_similarity` (default: 0.50).
- **SQLite Persistence**: Stores symmetric pairs in `symbol_similarity` (`src_symbol_id`, `dst_symbol_id`, `similarity`, `created_at`) with `FOREIGN KEY ... ON DELETE CASCADE` for automated incremental cleanup.

### 3.11. Louvain Community Detection
- **Graph Modularity Optimization**: Unsupervised partitioning of the codebase symbol/file relationship graph into functional architectural clusters (e.g., "auth", "payment", "rendering", "database").
- **Modularity Maximization**:
  $$Q = \frac{1}{2m} \sum_{i,j} \left[ A_{ij} - \gamma \frac{k_i k_j}{2m} \right] \delta(c_i, c_j)$$
  where $\gamma = 1.0$ resolution, $m$ is total edge weight, $k_i$ is node degree, and $\delta(c_i, c_j) = 1$ when nodes share a community.
- **Graph Edges**: Aggregates structural graph edges (`calls`, `defines`, `inherits`, `imports`) weighted by AST confidence, augmented with MinHash `symbol_similarity` edges (damped by $0.7$), with file directory co-location fallbacks for sparse graphs.
- **Automatic Semantic Labeling**: Assigns human-readable labels to communities based on dominant directory prefixes, high-frequency domain keywords, and central hub symbols ($c_{\text{hub}} = \arg\max_{v \in C} \deg(v)$).
- **Persistence & API**: Stored in `symbol_communities` (`symbol_id`, `community_id`, `community_name`, `modularity`, `updated_at`) with cascade deletion. Exposed via `get_symbol_community`, `list_communities`, CLI, and MCP.

### 3.12. Aho-Corasick Multi-Pattern String Matching
- **Linear-Time Symbol Discovery**: Builds a finite state automaton from all indexed symbol names.
- **Instant Call-Site Discovery**: Scans raw source files in $O(N + M)$ time without full AST re-parsing, locating every callsite and reference across huge codebases in single-digit milliseconds.

### 3.13. SQLite Storage Layer
- **ACID & WAL**: Embedded SQLite using Write-Ahead Logging (`PRAGMA journal_mode = WAL`) and memory-mapped I/O (`PRAGMA mmap_size = 268435456`).
- **Normalized Schema**:
  - `files`: File metadata, language, hash, mtime, status, token counts.
  - `symbols`: Symbol nodes, signatures, docstrings, confidence, line spans.
  - `imports`: Module import declarations and aliases.
  - `calls`: Unresolved call invocations.
  - `edges`: Directed, confidence-annotated graph edges (`src`, `dst`, `relation`, `confidence`).
  - `symbols_fts`: SQLite FTS5 full-text index with unicode61 tokenizer & sync triggers.
  - `symbol_embeddings`: Dense 128-dim vectors, model name, dimensions, packed float BLOB.
  - `symbol_similarity`: MinHash/LSH near-duplicate symbol pairs with Jaccard similarity scores and cascade deletion.
  - `symbol_communities`: Louvain modularity community IDs, human-readable semantic names, and modularity scores with cascade deletion.
- **Prepared Statements & Transactions**: Batch inserts inside single transactions yielding 50,000+ symbol inserts per second.

### 3.14. LZ4 / zstd Compression
- **Storage Compaction**: Compressed storage for large docstrings, AST serialization blobs, and inverted index posting lists.
- **Throughput Profile**: LZ4 for decompression at 3+ GB/s during query time; zstd (level 3) for long-term on-disk symbol archive databases.

### 3.15. Parallel Workers
- **Work-Stealing Concurrency**: Built on Rust's `rayon` thread pool.
- **Pipelined Stages**:
  $$\text{Walk} \xrightarrow{\text{channel}} \text{Hash Check} \xrightarrow{\text{parallel Rayon}} \text{AST Parse} \xrightarrow{\text{parallel}} \text{Extract} \xrightarrow{\text{batch}} \text{SQLite Write}$$
- **Zero Lock Contention**: Workers extract symbols into thread-local vectors; a dedicated database writer thread commits batches.

### 3.16. Incremental Indexing
- **Differential Scan**: Compares repository filesystem state against SQLite `files` table:
  - Unmodified (`hash` and `mtime` match): Skipped entirely ($0$ AST operations).
  - Modified: Old symbols and edges deleted in a transaction; new AST parsed and inserted.
  - Deleted: File record and all cascading symbols/edges purged.
- **Re-indexing Speed**: 10,000-file repository re-indexes in <100ms when only 3 files change.

### 3.17. String Interning
- **Deduplication**: Identifiers such as `"function"`, `"class"`, common package names (`"typing"`, `"std"`, `"react"`), and file paths appear tens of thousands of times.
- **Interner**: Uses an atomic string interner (`lasso` or `string-interner`), storing integer `Spur` / `SymbolId` representations.
- **Efficiency**: Reduces graph memory footprint by up to 70% and accelerates edge comparison from string comparison $O(L)$ to integer equality $O(1)$.

### 3.18. Coordination & Locking
- **Multi-Process Concurrency**: SQLite WAL mode permits concurrent readers (e.g. MCP query server) while the background indexer thread writes updates.
- **Thread Coordination**: In-process `parking_lot::RwLock` protects the in-memory graph and interner. File-based lock (`.fastast.lock`) prevents conflicting indexer processes from corrupting the database.

### 3.19. Agent Interface Polish & MCP Completeness (Phase 10)
- **Standardized MCP Tool Surface**:
  - `index_repository`: Recursive repository parsing and AST facts extraction into `.fastast.db`.
  - `get_repository_stats`: High-level metrics (total files, symbols, imports, calls, edges, languages, categories).
  - `query_symbols`: Fast exact and prefix symbol lookups with kind/language filters.
  - `get_call_graph`: Invocations blast-radius analysis (callers and callees).
  - `get_graph_neighborhood`: Bounded multi-hop graph expansion (depth 1–3) with cycle prevention.
  - `retrieve_evidence` (aliases: `query`, `build_evidence_bundle`): Primary natural-language/intent search tool combining dense semantic vectors, BM25 text match, and graph centrality into compact snippet bundles under token budgets.
  - `get_symbol_evidence`: Definition metadata, bounded window snippet, and immediate callers/callees.
  - `get_file_outline`: Structural outline of classes, methods, and functions without dumping raw file bodies.
  - `get_snippet`: Minimal bounded source window with line range, window padding, and omission indicators.
  - `get_similar_symbols`: MinHash + LSH duplicate and clone detection with Jaccard thresholds.
  - `get_community`: Louvain modularity cluster membership and peer symbol discovery.
  - `list_communities`: Functional module overview across the entire repository.
- **Unified Output Contract**:
  Every MCP tool and CLI JSON response strictly satisfies a predictable, machine-readable envelope:
  - `results`: Canonical list of returned entities (symbols, relationships, nodes, snippets, or communities).
  - `candidates`: Primary ranked symbol candidates (for search/retrieval).
  - `evidence` / `snippets`: Minimal structured source snippets (bounded to context budgets).
  - `relationships`: Directed graph edges (callers, callees, definitions, imports).
  - `meta`: Operational metadata (counts, filters, budget limits, truncated flags).
  - `error`: Structured error string when arguments or filesystem paths are invalid; `null` on success.
- **CLI Subcommand Parity**:
  All major MCP tools expose identical CLI subcommands with `--json` support:
  `fastast stats`, `fastast query`, `fastast outline`, `fastast snippet`, `fastast graph`, `fastast symbols`, `fastast calls`, `fastast similar`, `fastast communities`, `fastast community`, `fastast scan`, `fastast index`.
- **Agent Usability & Token-Conscious Guarantees**:
  - Clear "Agent Guidance" sections embedded in tool docstrings explaining when and how agents should call each tool.
  - Automatic graceful degradation on empty queries, missing paths, and unindexed repositories.
  - Strict absence of raw, full-file dumps by default.

---

## 4. End-to-End Execution Flow

### 4.1. Ingestion Pipeline (`AST → Graph`)
```
[Source Files] 
       │
       ▼
 [Discovery] ────────► [xxHash3 Fingerprint] ──► Match? ──► [SKIP (0ms)]
                               │ No match
                               ▼
                    [Tree-Sitter AST Parse]
                               │
                               ▼
                  [Scope & Symbol Extraction]
                               │
                               ▼
               [LSP-Style Resolution & Graph Edges]
                               │
                               ▼
               [Batch Transaction Commit to SQLite]
```

### 4.2. Retrieval Pipeline (`Graph → Evidence`)
```
[Agent Query] (e.g. "auth token validator")
       │
       ├───────────────────────────────┐
       ▼                               ▼
[BM25 Lexical Search]     [Dense Vector / Semantic]
       │                               │
       └───────────────┬───────────────┘
                       ▼
              [Initial Top-K Candidates]
                       │
                       ▼
            [Bounded BFS Graph Traversal]
           (Callers, Callees, Louvain Boost)
                       │
                       ▼
               [Hybrid RRF Ranking]
                       │
                       ▼
         [Evidence Window Extraction]
        (Bounded lines, context snippet)
                       │
                       ▼
   [JSON Payload to Coding Agent via MCP]
```

---

## 5. Proposed Rust Workspace & Module Architecture

To support clean isolation, testability, and future scalability into independent crates, the codebase is structured around a modular workspace layout:

```
fastast/
├── Cargo.toml                       # Workspace root Cargo manifest
├── crates/
│   ├── fastast-discovery/           # File discovery, gitignore, binary sniffing, xxHash3
│   │   ├── src/
│   │   │   ├── walker.rs            # Multi-threaded filesystem traversal
│   │   │   ├── ignore.rs            # Ignore rules and pattern evaluation
│   │   │   ├── hasher.rs            # xxHash3 and BLAKE3 content hashing
│   │   │   └── lib.rs
│   │   └── Cargo.toml
│   │
│   ├── fastast-parsing/             # Tree-Sitter grammars and AST extraction
│   │   ├── src/
│   │   │   ├── language.rs          # Language detection and grammar mappings
│   │   │   ├── parser.rs            # Tree-Sitter parser pool and error recovery
│   │   │   ├── languages/           # Per-language AST visitors (py, rs, js, ts, java, ...)
│   │   │   ├── extractor.rs         # Symbol, import, and callsite extraction
│   │   │   └── lib.rs
│   │   └── Cargo.toml
│   │
│   ├── fastast-graph/               # Symbol graph, resolution, and topological algorithms
│   │   ├── src/
│   │   │   ├── model.rs             # FileRecord, SymbolRecord, EdgeRecord, Candidate
│   │   │   ├── resolution.rs        # Two-phase hybrid LSP-style import resolution
│   │   │   ├── traversal.rs         # Bounded BFS and k-hop neighborhood search
│   │   │   ├── community.rs         # Louvain community detection on call graph
│   │   │   └── lib.rs
│   │   └── Cargo.toml
│   │
│   ├── fastast-storage/             # SQLite database, string interning, and compression
│   │   ├── src/
│   │   │   ├── schema.rs            # SQLite tables, indices, migrations
│   │   │   ├── store.rs             # Connection pooling, batch writes, WAL config
│   │   │   ├── interner.rs          # Thread-safe string interning
│   │   │   ├── compression.rs       # LZ4/zstd compression wrappers
│   │   │   └── lib.rs
│   │   └── Cargo.toml
│   │
│   ├── fastast-search/              # Lexical, semantic, and pattern search engines
│   │   ├── src/
│   │   │   ├── bm25.rs              # BM25 inverted index and scoring
│   │   │   ├── vector.rs            # Dense embeddings and cosine similarity
│   │   │   ├── minhash.rs           # MinHash + LSH duplicate/clone detection
│   │   │   ├── aho_corasick.rs      # Multi-pattern string matching automaton
│   │   │   └── lib.rs
│   │   └── Cargo.toml
│   │
│   ├── fastast-retrieval/           # Candidate generation, hybrid fusion, evidence windows
│   │   ├── src/
│   │   │   ├── rrf.rs               # Reciprocal Rank Fusion hybrid scoring
│   │   │   ├── evidence.rs          # Window boundary calculation and snippet extraction
│   │   │   ├── pipeline.rs          # End-to-end query execution pipeline
│   │   │   └── lib.rs
│   │   └── Cargo.toml
│   │
│   └── fastast-mcp/                 # Native/Python MCP server and CLI runner
│       ├── src/
│       │   ├── tools.rs             # MCP tool handlers (index, query, call_graph)
│       │   ├── protocol.rs          # JSON-RPC stdio protocol handler
│       │   └── lib.rs
│       └── Cargo.toml
│
├── python/                          # Python bindings & fallback distribution
│   └── fastast/
│       ├── __init__.py              # Public exports
│       ├── model.py                 # Dataclasses: FileRecord, SymbolRecord, EdgeRecord, Candidate
│       ├── db.py                    # SQLite engine and schema migrations
│       ├── indexer.py               # Repository indexer and recursive walker
│       ├── server.py                # FastMCP stdio server
│       └── cli.py                   # Terminal command-line interface
│
└── tests/                           # Multi-language and integration test suites
```

### 4.2. In-Tree Modular Mapping (Phase 0 Foundation)
During Phase 0, all core Rust modules live cleanly within `src/` to ensure immediate compilation with `pyo3` and `maturin`, directly preparing for extraction into crates:
- `src/model.rs` $\rightarrow$ Core Data Model (`FileRecord`, `SymbolRecord`, `EdgeRecord`, `Candidate`)
- `src/parser.rs` & `src/<lang>/` $\rightarrow$ `fastast-parsing`
- `src/language.rs` $\rightarrow$ Language Detection
- `src/indexer.rs` $\rightarrow$ AST Symbol Walker
- `python/fastast/db.py` $\rightarrow$ `fastast-storage`
- `python/fastast/indexer.py` $\rightarrow$ `fastast-discovery`
- `python/fastast/server.py` $\rightarrow$ `fastast-mcp`
- `python/fastast/cli.py` $\rightarrow$ `fastast-cli`

---

## 6. Verification and Guarantees

1. **Sub-10ms AST Extraction**: Native C-speed Tree-Sitter parsing handles 1,000+ line files in under 5ms.
2. **Deterministic Confidence**: Every edge and candidate has an explicit confidence attribution.
3. **Bounded Context**: Agents never receive raw, unmetered files; evidence is precisely bounded with line numbers and snippets.
4. **Zero Cloud Dependencies**: 100% local operation using embedded SQLite and local native libraries.

