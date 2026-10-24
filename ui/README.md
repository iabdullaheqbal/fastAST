# FastAST Lens — Codebase Memory & 3D Graph UI

**FastAST Lens** is the visual cockpit for FastAST, powered by **Vite + React 19 + TypeScript + Three.js** and designed using Google Stitch ("Obsidian Kinetic" theme).

---

## Features

1. **Galaxy / Globe Graph (Centerpiece)**
   - Spherical 3D Codebase Planet with nodes mapped via Fibonacci spherical projection.
   - Interactive mouse rotation across all 360° degrees, mouse wheel zoom, and polar camera angles.
   - Click-to-inspect raycaster highlighting connecting arcs (`CALLS`, `DEFINES`, `IMPORTS`).
   - Hop-depth filtering (1-Hop, 2-Hops, 3-Hops, Full Sphere).
   - Prominent community hub beacons and atmospheric outer glow.

2. **Explore**
   - High-speed symbol & file search with filters by kind (function, class, struct, type) and language.
   - Line coordinates, normalized AST signatures, docstrings, and in-degree/out-degree counts.
   - 1-click MCP stdio query snippet copy for agent harnesses.

3. **Architecture**
   - 5-layer blueprint overview: Tree-Sitter AST parser, SQLite WAL storage, Louvain modularity, Hybrid RRF retrieval, and MCP stdio bridge.

4. **Evidence Retrieval**
   - Token-bounded query search with interactive budget slider (500 to 4,000 tokens).
   - Compact syntax-fact snippets without LLM context window saturation.

5. **Index Coverage**
   - Live percentage coverage, multi-language breakdown bars (Python, Rust, TS/JS, Markdown, etc.).
   - Incremental xxHash3 caching status.

6. **Louvain Clusters**
   - Architectural community detection with modularity score ($Q=0.84$).
   - Central hub identification and community member drilldowns.

7. **System & Engine**
   - SQLite WAL status, schema migration version, integrity checks, and manual re-indexer trigger.
   - Native VS Code MCP (`.vscode/mcp.json`) integration reference.

---

## Getting Started

### 1. Launch FastAST API & UI together (Recommended)

From the repository root:

```bash
./start_ui.sh
```

This will automatically:
- Start the FastAST Python HTTP API server on `http://127.0.0.1:4200`
- Start the Vite dev server on `http://localhost:5173`

### 2. Run UI Independently

```bash
cd ui
npm install
npm run dev
```

Build for production:

```bash
npm run build
npm run preview
```

### 3. Backend API Server

To run just the Python API server:

```bash
fastast serve --port 4200
# or:
PYTHONPATH=python python3 python/fastast/api_server.py --port 4200
```
