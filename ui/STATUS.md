# FastAST Lens UI — Status & Verification Report

## 1. What Works Now

### Phase A — Reliable Backend Connection (`:4200`)
- **Fixed Broken API Imports**: Resolved startup crashes in `python/fastast/api_server.py` where non-existent functions (`fastast.communities`, `extract_snippet`, `retrieve_context`, `find_similar_symbols`) were previously imported. Wired all endpoints to the canonical `fastast.db`, `fastast.evidence`, `fastast.retrieval`, and `fastast.diagnostics` APIs.
- **Unified Port (`4200`)**: Standardized on `http://127.0.0.1:4200` across `fastast serve`, `python/fastast/api_server.py`, `ui/vite.config.ts` (`/api` proxy), `start_ui.sh`, `ui/README.md`, and root `README.md`.
- **Health Endpoint (`GET /api/health`)**: Returns `{ ok, status, repo_path, repo_name, db_path, db_exists, symbol_count, file_count, edge_count, call_count, import_count, last_index_time }`.
- **No Silent Mock Data**: Removed silent fake fallback numbers (`142 files`, `1,330 symbols`, fake `traverseEdges` / `ASTVisitorEngine` nodes) from `ui/src/services/api.ts` and page components. Requests use a 10-second `AbortController` timeout and surface explicit `Backend API Unreachable` banners with retry and CLI launch instructions when the backend is offline.
- **System Health & Re-index Page (`/system`)**: Displays live API reachability (`YES` / `NO`), `.fastast.db` path and size, entity counts, last index timestamp, automated `fastast doctor` checks, and working **Incremental Re-index** / **Force Full Re-index** buttons.

### Phase B — CBM-Style 3D Force-Directed Galaxy Graph (`/globe`)
- **3D Force-Directed Layout (`ui/src/features/globe/forceLayout3d.ts` & `GlobePage.tsx`)**: Replaced the spherical lat/lon wireframe globe shell with an organic 3D force-directed physics simulation (`ForceGraphSimulation3D`) in empty dark space.
  - Combines 3D Coulomb node repulsion, Hooke spring attraction along real edges (`CALLS`, `DEFINES`, `IMPORTS`, `INHERITS`, `SIMILAR_TO`), community cluster cohesion, and hub centrality gravity.
  - Warm-starts 70 synchronous iterations and settles smoothly in `requestAnimationFrame` with natural 3D edge bundling toward cluster centroids.
  - Supports **Orbit** (left-drag), **3D Pan** (right-drag or Shift+drag), **Zoom** (scroll wheel), **Fit View** (frames the 3D bounding box of the active cluster), **Center Camera**, and **Re-layout** (reheats the force simulation).
  - Supports coloring nodes by **Symbol Kind** or **Module Cluster**.
- **Focused Neighborhood Default**: Starts in `mode=neighborhood` with `1-Hop` depth centered on the requested `?symbol=` query parameter or the top repository hub symbol (e.g., `16` nodes and `65` edges for `process_declaration` 1-hop, or `27` nodes and `94` edges for `index_repository` 1-hop).
- **Zero Fabricated Edges**: Removed the artificial intra-community edge generator in `_generate_globe_topology`. Only real `CALLS`, `DEFINES`, `IMPORTS`, `INHERITS`, and `SIMILAR_TO` edges from `.fastast.db` are rendered.
- **Explicit Depth & Mode Controls**: Supports `1-Hop`, `2-Hop`, `3-Hop`, and capped `Sampled Repo` overview toggles, plus a live symbol search box and top-hub quick-select pills.
- **Interactive Inspection & Navigation**:
  - Single-clicking a node highlights incident arcs and populates the right inspector with live `name`, `kind`, `file_path`, `start_line–end_line`, `signature`, `community`, `Inbound Callers` (`/api/calls`), `Outbound Callees`, and `Similar Symbols` (`/api/similar`).
  - Double-clicking a node (or clicking **Focus Neighborhood**) re-centers the graph neighborhood on that symbol.
  - Hovering any node displays a floating coordinate & degree tooltip.
  - **Open Evidence** and **Open in Explore** buttons deep-link directly to `/evidence?q=<symbol>` and `/explore?file=<file>&symbol=<symbol>`.
  - Node kind and edge relation checkboxes display real counts from the active graph and filter rendered objects dynamically.

### Phase C — End-to-End Explore, Evidence, Communities & Coverage Flows
- **Explore (`/explore`)**:
  - Live repository file tree (`/api/files`) with per-file symbol counts and path/language filtering.
  - Selecting a file loads its AST symbol outline (`/api/outline`); selecting a symbol loads its bounded source snippet (`/api/snippet`), inbound callers, outbound callees, and similar symbols.
  - Working center view tabs: **Bounded Snippet**, **AST Outline**, and **Call Neighborhood**.
  - Fixed URL parameter synchronization so deep-linking to `/explore?file=...&symbol=...` preserves the target symbol.
- **Evidence (`/evidence`)**:
  - Connects query input, ranking mode selector (`HYBRID`, `RRF`, `BM25`, `SEMANTIC`, `HEURISTIC`), and token budget selector (`1024`, `2048`, `4096`) to `/api/evidence`.
  - Displays ranked candidates with scores, ranking signal reasons (`Exact name match`, `BM25 lexical match`, `Primary definition`, etc.), 1-hop graph neighbors, and token-bounded code windows.
- **Communities (`/communities`)**:
  - Lists Louvain modularity clusters from `/api/communities` with member symbol tables (`kind`, `name`, `file_path`, `lines`) and direct **Explore** / **Globe** jump actions.
- **Coverage (`/coverage`)**:
  - Displays real admitted/indexed file counts, disk file counts, syntax error counts, language distribution bars, file category counts (`source`, `test`, `docs`, `config`), and AST symbol kind breakdowns from `/api/stats` and `/api/diagnose`.

### Phase D — Dense Engineering Visual Hierarchy & Live Architecture
- **Reduced Visual Noise**: Replaced excessive neon glow and low-contrast labels with a high-contrast, dense dark engineering workspace palette (`ui/src/styles/theme.css`).
- **Live Architecture Page (`/architecture`)**: Displays live central hub symbols by graph degree and live Louvain subsystem clusters alongside clickable FastAST pipeline module cards.

---

## 2. Known Limitations
- **Chunk Size Warning on Production Build**: Three.js (`three` package) is bundled into the main chunk (~946 KB minified / ~244 KB gzipped), which triggers Vite's default 500 KB chunk size informational notice during `npm run build`.
- **Single Active Repository per API Server Process**: `fastast serve` serves the repository directory from which it was launched (`REPO_PATH = Path(".").resolve()`). To inspect a different repository, run `fastast serve` inside that repository's root directory.

---

## 3. Exact Run Commands

### Option 1: Start Backend API (`:4200`) + Vite UI (`:5173`) Together
```bash
./start_ui.sh
```

### Option 2: Run Backend API and Frontend Separately
```bash
# Terminal 1 — Start FastAST HTTP API Server on http://127.0.0.1:4200
.venv/bin/fastast serve --port 4200
# or:
PYTHONPATH=python python3 -m fastast.cli serve --port 4200

# Terminal 2 — Start Vite Dev Server on http://localhost:5173
cd ui
npm install
npm run dev
```

### Option 3: Verify Production UI Build
```bash
cd ui
npm run build
npm run preview
```

