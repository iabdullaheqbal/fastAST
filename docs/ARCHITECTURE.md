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

### 3.7. BM25 Lexical Retrieval
- **Inverted Index**: Builds an embedded SQLite FTS5 virtual table (`symbols_fts`) over symbol names, parameter signatures, docstrings, and relative file paths using the `unicode61 remove_diacritics 2` tokenizer.
- **Automated Synchronization Triggers**:
  - `symbols_ai AFTER INSERT ON symbols`: Automatically inserts newly indexed symbols, signatures, docstrings, and paths into `symbols_fts`.
  - `symbols_ad AFTER DELETE ON symbols`: Automatically removes purged symbols from `symbols_fts`. Enabled with `PRAGMA recursive_triggers = ON;` so foreign key cascade deletions propagate cleanly.
- **Scoring Formula**:
  $$\text{Score}_{\text{BM25}}(D, Q) = \sum_{t \in Q} \text{IDF}(t) \cdot \frac{f(t, D) \cdot (k_1 + 1)}{f(t, D) + k_1 \cdot \left(1 - b + b \cdot \frac{|D|}{\text{avgdl}}\right)}$$
  (Default parameters: $k_1 = 1.2$, $b = 0.75$).
- **Field Boosting**: Multiplies term score by column weights: Symbol Name ($\times 3.0$) > Signature ($\times 2.0$) > Docstring ($\times 1.0$) > File Path ($\times 1.0$).
- **Score Normalization**: Raw negative FTS5 rank values are normalized into $[0.0, 1.0]$ via $1.0 / (1.0 + \log(1.0 + |\text{rank}|))$.

### 3.8. Embeddings & Semantic Search
- **Dense Vector Index**: Designed for dense embeddings to support high-level semantic intent queries (e.g., *"where is user authentication verified?"*).
- **Lightweight Embedding Models**: Quantized ONNX or MiniLM models running locally via Candle/tract, indexing symbol docstrings and structural summaries.
- **Vector Search**: Cosine similarity via HNSW or Flat IP vector table in SQLite.

### 3.9. Hybrid Ranking (Weighted Fusion & Reciprocal Rank Fusion)
- **Score Fusion**: FastAST supports two complementary ranking fusion modes:
  1. **Weighted Hybrid Sum (default)**:
     $$\text{Score} = 0.30 \cdot S_{\text{BM25}} + 0.30 \cdot S_{\text{name}} + 0.10 \cdot S_{\text{type}} + 0.10 \cdot S_{\text{path}} + 0.10 \cdot S_{\text{edge}} + 0.10 \cdot S_{\text{conf}}$$
  2. **Reciprocal Rank Fusion (RRF)**:
     $$\text{RRF}(d) = \sum_{m \in M} \frac{w_m}{k + \text{rank}_m(d)}$$
     where $k = 60$, fusing BM25 lexical rank and heuristic structural rank.
  3. **Heuristic Fallback**: Gracefully disables BM25 if the FTS5 table is unavailable or when invoked with `ranking_method="heuristic"`.
- **Explainability**: Every candidate carries `reasons: Vec<String>` specifying which modalities triggered the match (e.g., `"BM25 lexical match (score: 0.91)"`, `"Exact name match"`, `"Primary definition (function)"`).

### 3.10. MinHash + LSH (Locality Sensitive Hashing)
- **Near-Duplicate Detection**: Detects copy-pasted functions, boilerplate classes, and near-miss symbol variations.
- **Shingling & Signatures**: Decomposes code tokens into $k$-shingles, applies $m$ hash functions ($m = 128$) to form a MinHash signature.
- **LSH Bucketing**: Groups signatures into $b$ bands of $r$ rows ($b \times r = 128$). Identifies candidates sharing buckets with Jaccard similarity threshold $\theta \ge 0.8$.

### 3.11. Louvain Community Detection
- **Graph Modularity Optimization**: Unsupervised partitioning of the codebase call/import graph into functional architectural clusters (e.g., "auth", "payment", "rendering", "database").
- **Modularity Maximization**:
  $$Q = \frac{1}{2m} \sum_{i,j} \left[ A_{ij} - \frac{k_i k_j}{2m} \right] \delta(c_i, c_j)$$
- **Relevance Clustering**: If an agent queries a symbol in the "billing" community, other candidates belonging to the same Louvain cluster receive a proximity boost.

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

