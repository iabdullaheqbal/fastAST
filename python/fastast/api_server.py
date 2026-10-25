"""FastAST HTTP API Bridge for the Vite + React + Three.js Web UI.

Exposes live SQLite codebase memory endpoints on port 4200 with CORS enabled:
- GET  /api/health
- GET  /api/stats
- GET  /api/files
- GET  /api/symbols?q=&kind=&language=&limit=
- GET  /api/outline?file=
- GET  /api/snippet?symbol=&file=&start=&end=
- GET  /api/calls?symbol=
- GET  /api/graph?symbol=&depth=
- GET  /api/evidence?q=&max_tokens=&ranking=
- GET  /api/communities?limit=&community_id=
- GET  /api/similar?symbol=&limit=
- GET  /api/globe?mode=&symbol=&depth=&max_nodes=&max_edges=
- GET  /api/diagnose
- POST /api/index
"""

import datetime
import errno
import json
import math
import os
import socket
import sqlite3
import sys
import urllib.parse
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any, Dict, List, Optional, Set, Tuple

from fastast.config import get_logger
from fastast.db import (
    get_call_graph,
    get_connection,
    get_graph_neighborhood,
    get_similar_symbols,
    list_communities,
    search_symbols,
)
from fastast.diagnostics import diagnose_repository
from fastast.evidence import build_evidence_bundle, get_snippet
from fastast.indexer import index_repository
from fastast.retrieval import estimate_tokens

logger = get_logger("fastast.api_server")

REPO_PATH = Path(".").resolve()

COMMUNITY_PALETTE = [
    "#38bdf8",  # cyan
    "#a855f7",  # purple
    "#10b981",  # emerald
    "#f59e0b",  # amber
    "#ec4899",  # pink
    "#6366f1",  # indigo
    "#14b8a6",  # teal
    "#f43f5e",  # rose
]


def _get_db_path() -> Path:
    return REPO_PATH / ".fastast.db"


def _get_db_conn(auto_index: bool = False) -> sqlite3.Connection:
    db_path = _get_db_path()
    if not db_path.exists() and auto_index:
        index_repository(str(REPO_PATH))
    return get_connection(db_path)


def _get_health_payload() -> Dict[str, Any]:
    db_path = _get_db_path()
    db_exists = db_path.exists()
    last_index_time: Optional[str] = None
    symbol_count = 0
    file_count = 0
    edge_count = 0
    call_count = 0
    import_count = 0

    if db_exists:
        try:
            mtime = db_path.stat().st_mtime
            last_index_time = datetime.datetime.fromtimestamp(
                mtime, tz=datetime.timezone.utc
            ).isoformat()
        except OSError:
            last_index_time = None

        conn = get_connection(db_path)
        try:
            cur = conn.cursor()
            file_count = cur.execute("SELECT count(*) FROM files").fetchone()[0]
            symbol_count = cur.execute("SELECT count(*) FROM symbols").fetchone()[0]
            edge_count = cur.execute("SELECT count(*) FROM edges").fetchone()[0]
            call_count = cur.execute("SELECT count(*) FROM calls").fetchone()[0]
            import_count = cur.execute("SELECT count(*) FROM imports").fetchone()[0]
        except Exception as exc:
            logger.warning("Failed reading health counts: %s", exc)
        finally:
            conn.close()

    return {
        "ok": True,
        "status": "healthy" if (db_exists and file_count > 0) else "unindexed",
        "repo_path": str(REPO_PATH),
        "repo_name": REPO_PATH.name,
        "db_path": str(db_path),
        "db_exists": db_exists,
        "symbol_count": symbol_count,
        "file_count": file_count,
        "edge_count": edge_count,
        "call_count": call_count,
        "import_count": import_count,
        "last_index_time": last_index_time,
    }


def _query_file_symbols(conn: sqlite3.Connection, file_rel: str) -> Tuple[str, List[Dict[str, Any]]]:
    cur = conn.cursor()
    row = cur.execute(
        "SELECT id, path, language FROM files WHERE path = ? LIMIT 1",
        (file_rel,),
    ).fetchone()
    if not row and file_rel:
        row = cur.execute(
            "SELECT id, path, language FROM files WHERE path LIKE ? LIMIT 1",
            (f"%{file_rel}%",),
        ).fetchone()
    if not row:
        return file_rel, []

    file_id, resolved_path, lang = row[0], row[1], row[2]
    sym_rows = cur.execute(
        """
        SELECT s.id, s.name, s.kind, s.signature, s.start_line, s.end_line,
               s.docstring, s.confidence, p.name as parent_name
        FROM symbols s
        LEFT JOIN symbols p ON s.parent_symbol_id = p.id
        WHERE s.file_id = ?
        ORDER BY s.start_line ASC, s.id ASC
        """,
        (file_id,),
    ).fetchall()

    outline = [
        {
            "id": sr[0],
            "name": sr[1],
            "kind": sr[2],
            "signature": sr[3] or "",
            "start_line": sr[4],
            "end_line": sr[5],
            "file_path": resolved_path,
            "language": lang,
            "docstring": sr[6] or "",
            "confidence": sr[7],
            "parent_name": sr[8],
        }
        for sr in sym_rows
    ]
    return resolved_path, outline


class FastASTAPIHandler(BaseHTTPRequestHandler):
    def log_message(self, format: str, *args: Any) -> None:
        logger.debug("%s - %s", self.address_string(), format % args)

    def _send_json(self, data: Any, status: int = 200) -> None:
        payload = json.dumps(data, default=str).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(payload)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.end_headers()
        self.wfile.write(payload)

    def do_OPTIONS(self) -> None:
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.end_headers()

    def do_POST(self) -> None:
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        try:
            if path == "/api/index":
                force = False
                content_len = int(self.headers.get("Content-Length", "0") or "0")
                if content_len > 0:
                    raw_body = self.rfile.read(content_len).decode("utf-8", errors="replace")
                    try:
                        body_json = json.loads(raw_body)
                        force = bool(body_json.get("force", False))
                    except Exception:
                        pass
                res = index_repository(str(REPO_PATH), force_reindex=force)
                self._send_json(
                    {
                        "status": "indexed",
                        "summary": res,
                        "health": _get_health_payload(),
                    }
                )
            else:
                self._send_json({"error": f"Unknown POST endpoint: {path}"}, status=404)
        except Exception as e:
            logger.error("API POST error on %s: %s", path, e)
            self._send_json({"error": str(e)}, status=500)

    def do_GET(self) -> None:
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        params = urllib.parse.parse_qs(parsed.query)

        def get_param(key: str, default: Optional[str] = None) -> Optional[str]:
            vals = params.get(key)
            return vals[0] if vals else default

        try:
            if path == "/api/health":
                self._send_json(_get_health_payload())

            elif path == "/api/stats":
                health = _get_health_payload()
                conn = _get_db_conn(auto_index=True)
                try:
                    cur = conn.cursor()
                    files_count = cur.execute("SELECT count(*) FROM files").fetchone()[0]
                    symbols_count = cur.execute("SELECT count(*) FROM symbols").fetchone()[0]
                    edges_count = cur.execute("SELECT count(*) FROM edges").fetchone()[0]
                    calls_count = cur.execute("SELECT count(*) FROM calls").fetchone()[0]
                    imports_count = cur.execute("SELECT count(*) FROM imports").fetchone()[0]

                    langs_rows = cur.execute(
                        "SELECT language, count(*) as cnt FROM files GROUP BY language ORDER BY cnt DESC"
                    ).fetchall()
                    languages = {r[0]: r[1] for r in langs_rows if r[0]}

                    cats_rows = cur.execute(
                        "SELECT category, count(*) as cnt FROM files GROUP BY category ORDER BY cnt DESC"
                    ).fetchall()
                    categories = {r[0]: r[1] for r in cats_rows if r[0]}

                    kinds_rows = cur.execute(
                        "SELECT kind, count(*) as cnt FROM symbols GROUP BY kind ORDER BY cnt DESC"
                    ).fetchall()
                    symbol_kinds = {r[0]: r[1] for r in kinds_rows if r[0]}

                    comm_count = 0
                    try:
                        comm_count = cur.execute(
                            "SELECT count(DISTINCT community_id) FROM symbol_communities"
                        ).fetchone()[0]
                    except Exception:
                        pass

                    self._send_json(
                        {
                            "repo_name": REPO_PATH.name,
                            "repo_path": str(REPO_PATH),
                            "db_path": str(_get_db_path()),
                            "files": files_count,
                            "symbols": symbols_count,
                            "edges": edges_count,
                            "calls": calls_count,
                            "imports": imports_count,
                            "communities_count": comm_count,
                            "languages": languages,
                            "categories": categories,
                            "symbol_kinds": symbol_kinds,
                            "last_index_time": health.get("last_index_time"),
                        }
                    )
                finally:
                    conn.close()

            elif path == "/api/files":
                conn = _get_db_conn(auto_index=False)
                try:
                    cur = conn.cursor()
                    rows = cur.execute(
                        """
                        SELECT f.path, f.language, f.category, f.total_lines, f.total_tokens,
                               f.status, f.has_syntax_error, COUNT(s.id) as symbol_count
                        FROM files f
                        LEFT JOIN symbols s ON s.file_id = f.id
                        GROUP BY f.id
                        ORDER BY f.path ASC
                        """
                    ).fetchall()
                    files = [
                        {
                            "path": r[0],
                            "language": r[1],
                            "category": r[2],
                            "lines": r[3],
                            "tokens": r[4],
                            "status": r[5],
                            "has_syntax_error": bool(r[6]),
                            "symbol_count": r[7],
                        }
                        for r in rows
                    ]
                    self._send_json({"files": files, "count": len(files)})
                finally:
                    conn.close()

            elif path == "/api/symbols":
                q = get_param("q", "") or ""
                kind = get_param("kind")
                lang = get_param("language")
                limit = int(get_param("limit", "50") or "50")
                conn = _get_db_conn(auto_index=False)
                try:
                    results = search_symbols(conn, q, kind=kind, language=lang, limit=limit)
                    self._send_json({"symbols": results, "count": len(results)})
                finally:
                    conn.close()

            elif path == "/api/outline":
                file_rel = get_param("file", "") or ""
                conn = _get_db_conn(auto_index=False)
                try:
                    resolved_file, outline = _query_file_symbols(conn, file_rel)
                    self._send_json({"file": resolved_file, "outline": outline})
                finally:
                    conn.close()

            elif path == "/api/snippet":
                symbol = get_param("symbol")
                file_rel = get_param("file")
                start = get_param("start")
                end = get_param("end")
                start_line = int(start) if start and start.isdigit() else None
                end_line = int(end) if end and end.isdigit() else None

                conn = _get_db_conn(auto_index=False)
                try:
                    resolved_file = file_rel
                    if symbol and not resolved_file:
                        cur = conn.cursor()
                        srow = cur.execute(
                            """
                            SELECT f.path FROM symbols s
                            JOIN files f ON s.file_id = f.id
                            WHERE s.name = ? LIMIT 1
                            """,
                            (symbol,),
                        ).fetchone()
                        if srow:
                            resolved_file = srow[0]

                    window = get_snippet(
                        symbol_id_or_name=symbol,
                        file_path=file_rel,
                        start_line=start_line,
                        end_line=end_line,
                        window_lines=8,
                        max_snippet_lines=80,
                        db_or_conn=conn,
                        repo_root=REPO_PATH,
                    )
                    if window and window.snippet is not None:
                        self._send_json(
                            {
                                "content": window.snippet,
                                "file_path": resolved_file or file_rel or "",
                                "start_line": window.start_line,
                                "end_line": window.end_line,
                                "symbol": symbol,
                                "tokens": estimate_tokens(window.snippet),
                            }
                        )
                    else:
                        self._send_json(
                            {
                                "content": "",
                                "file_path": resolved_file or file_rel or "",
                                "start_line": start_line or 1,
                                "end_line": end_line or 1,
                                "symbol": symbol,
                                "tokens": 0,
                            }
                        )
                finally:
                    conn.close()

            elif path == "/api/calls":
                symbol = get_param("symbol", "") or ""
                conn = _get_db_conn(auto_index=False)
                try:
                    cg = get_call_graph(conn, symbol)
                    self._send_json(cg)
                finally:
                    conn.close()

            elif path == "/api/graph":
                symbol = get_param("symbol", "") or ""
                depth = int(get_param("depth", "2") or "2")
                conn = _get_db_conn(auto_index=False)
                try:
                    neighborhood = get_graph_neighborhood(
                        conn, symbol, max_depth=depth, direction="both"
                    )
                    self._send_json(neighborhood)
                finally:
                    conn.close()

            elif path == "/api/evidence":
                query = get_param("q", "") or ""
                max_tokens = int(get_param("max_tokens", "1500") or "1500")
                ranking = get_param("ranking", "hybrid") or "hybrid"
                if not query.strip():
                    self._send_json(
                        {
                            "query": "",
                            "ranking_method": ranking,
                            "total_tokens_estimate": 0,
                            "max_tokens": max_tokens,
                            "candidates": [],
                            "snippets": [],
                        }
                    )
                    return

                conn = _get_db_conn(auto_index=False)
                try:
                    bundle = build_evidence_bundle(
                        query=query,
                        limit=10,
                        max_tokens=max_tokens,
                        ranking_method=ranking,
                        db_or_conn=conn,
                        repo_root=REPO_PATH,
                    )
                    raw_dict = bundle.to_dict() if hasattr(bundle, "to_dict") else {}
                finally:
                    conn.close()

                raw_candidates = raw_dict.get("candidates", [])
                raw_snippets = raw_dict.get("snippets", [])

                candidates = []
                for c in raw_candidates:
                    nbrs = c.get("neighbors", [])
                    formatted_nbrs = [
                        {"name": n, "relation": "calls"} if isinstance(n, str) else n
                        for n in nbrs
                    ]
                    candidates.append(
                        {
                            "id": c.get("symbol_id") or c.get("id"),
                            "name": c.get("name", ""),
                            "kind": c.get("kind", "function"),
                            "file_path": c.get("file_path", ""),
                            "signature": c.get("signature", ""),
                            "score": round(float(c.get("score", 0.0)), 3),
                            "start_line": c.get("start_line", 1),
                            "end_line": c.get("end_line", 1),
                            "reasons": c.get("reasons", []),
                            "neighbors": formatted_nbrs,
                        }
                    )

                snippets = []
                for ev in raw_snippets:
                    content = ev.get("code") or ev.get("snippet") or ev.get("content") or ""
                    token_est = (
                        ev.get("tokens_estimate")
                        or ev.get("token_count")
                        or estimate_tokens(content)
                    )
                    snippets.append(
                        {
                            "symbol_name": ev.get("symbol_name") or ev.get("symbol") or "",
                            "file_path": ev.get("file_path", ""),
                            "start_line": ev.get("start_line", 1),
                            "end_line": ev.get("end_line", 1),
                            "snippet": content,
                            "token_count": token_est,
                            "score": round(float(ev.get("score", 0.0)), 3),
                            "reasons": ev.get("reasons", []),
                        }
                    )

                if not snippets and raw_candidates:
                    for c in raw_candidates:
                        ew = c.get("evidence_window") or {}
                        code = ew.get("snippet") or ""
                        if code:
                            snippets.append(
                                {
                                    "symbol_name": c.get("name", ""),
                                    "file_path": c.get("file_path", ""),
                                    "start_line": ew.get("start_line") or c.get("start_line", 1),
                                    "end_line": ew.get("end_line") or c.get("end_line", 1),
                                    "snippet": code,
                                    "token_count": estimate_tokens(code),
                                    "score": round(float(c.get("score", 0.0)), 3),
                                    "reasons": c.get("reasons", []),
                                }
                            )

                total_tok = raw_dict.get("total_tokens_estimate") or sum(
                    s["token_count"] for s in snippets
                )

                self._send_json(
                    {
                        "query": raw_dict.get("query", query),
                        "ranking_method": ranking,
                        "total_tokens_estimate": total_tok,
                        "max_tokens": max_tokens,
                        "candidates": candidates,
                        "snippets": snippets,
                    }
                )

            elif path == "/api/communities":
                limit = int(get_param("limit", "25") or "25")
                comm_id_param = get_param("community_id")
                conn = _get_db_conn(auto_index=False)
                try:
                    raw_comms = list_communities(conn, limit=limit)
                    cur = conn.cursor()

                    communities = []
                    for idx, c in enumerate(raw_comms):
                        cid = c.get("community_id", idx)
                        sample_symbols = c.get("sample_symbols", [])
                        sample_files = c.get("sample_files", [])

                        member_rows = cur.execute(
                            """
                            SELECT s.id, s.name, s.kind, f.path, s.start_line, s.end_line, s.signature
                            FROM symbol_communities sc
                            JOIN symbols s ON s.id = sc.symbol_id
                            JOIN files f ON f.id = s.file_id
                            WHERE sc.community_id = ?
                            ORDER BY (
                                (SELECT count(*) FROM calls c WHERE c.callee_name = s.name) +
                                (SELECT count(*) FROM calls c WHERE c.caller_symbol_id = s.id)
                            ) DESC, s.name ASC
                            LIMIT 40
                            """,
                            (cid,),
                        ).fetchall()

                        members = [
                            {
                                "id": mr[0],
                                "name": mr[1],
                                "kind": mr[2],
                                "file_path": mr[3],
                                "start_line": mr[4],
                                "end_line": mr[5],
                                "signature": mr[6] or "",
                            }
                            for mr in member_rows
                        ]

                        if not sample_files and members:
                            seen_f: List[str] = []
                            for m in members:
                                if m["file_path"] not in seen_f:
                                    seen_f.append(m["file_path"])
                            sample_files = seen_f[:8]

                        if not sample_symbols and members:
                            sample_symbols = [m["name"] for m in members[:8]]

                        comm_label = c.get("name") or f"Cluster {cid}"

                        comm_obj = {
                            "id": cid,
                            "name": comm_label,
                            "member_count": c.get("member_count", len(members)),
                            "modularity": round(float(c.get("modularity") or 0.82), 3),
                            "color": COMMUNITY_PALETTE[idx % len(COMMUNITY_PALETTE)],
                            "sample_symbols": sample_symbols[:10],
                            "sample_files": sample_files[:8],
                            "members": members,
                        }
                        communities.append(comm_obj)

                    if comm_id_param is not None and comm_id_param.isdigit():
                        target_cid = int(comm_id_param)
                        matching = [cm for cm in communities if cm["id"] == target_cid]
                        if matching:
                            self._send_json({"community": matching[0], "communities": communities})
                            return

                    self._send_json({"communities": communities, "count": len(communities)})
                finally:
                    conn.close()

            elif path == "/api/similar":
                symbol = get_param("symbol", "") or ""
                limit = int(get_param("limit", "10") or "10")
                conn = _get_db_conn(auto_index=False)
                try:
                    raw_sims = get_similar_symbols(conn, symbol, limit=limit, min_similarity=0.35)
                    sims = []
                    for s in raw_sims:
                        sims.append(
                            {
                                "name": s.get("name", ""),
                                "kind": s.get("kind", "function"),
                                "file_path": s.get("file_path", ""),
                                "similarity": round(float(s.get("similarity", 0.0)), 3),
                                "start_line": s.get("start_line", 1),
                                "end_line": s.get("end_line", 1),
                            }
                        )
                    self._send_json({"symbol": symbol, "similar": sims})
                finally:
                    conn.close()

            elif path == "/api/diagnose":
                diag = diagnose_repository(REPO_PATH)
                self._send_json(diag)

            elif path in ("/api/globe", "/api/galaxy"):
                mode = (get_param("mode", "full") or "full").lower()
                symbol = get_param("symbol")
                depth = max(1, min(3, int(get_param("depth", "2") or "2")))
                default_nodes = "240" if mode == "full" else str(90 + (depth - 1) * 60)
                default_edges = "800" if mode == "full" else "450"
                max_nodes = max(20, min(800, int(get_param("max_nodes", default_nodes) or default_nodes)))
                max_edges = max(40, min(2500, int(get_param("max_edges", default_edges) or default_edges)))
                conn = _get_db_conn(auto_index=False)
                try:
                    galaxy_data = _generate_galaxy_topology(
                        conn,
                        mode=mode,
                        focus_symbol=symbol,
                        depth=depth,
                        max_nodes=max_nodes,
                        max_edges=max_edges,
                    )
                    self._send_json(galaxy_data)
                finally:
                    conn.close()

            else:
                self._send_json({"error": f"Unknown endpoint: {path}"}, status=404)

        except Exception as e:
            logger.error("API error on %s: %s", path, e)
            self._send_json({"error": str(e)}, status=500)


def _generate_galaxy_topology(
    conn: sqlite3.Connection,
    mode: str = "neighborhood",
    focus_symbol: Optional[str] = None,
    depth: int = 1,
    max_nodes: int = 110,
    max_edges: int = 450,
) -> Dict[str, Any]:
    """Build real 3D force-directed galaxy topology from SQLite symbol & edge tables.

    No spherical/Fibonacci projection. Nodes are positioned in 3D space on the client via
    force-directed physics.
    - mode='neighborhood' (default): Centered on `focus_symbol` (or top hub symbol),
      expanding real CALLS, DEFINES, IMPORTS, INHERITS, and SIMILAR_TO edges to form a dense
      local cluster (typically 55–150 nodes at 1-hop).
    - mode='full': Samples up to `max_nodes` connected symbols across all modules with up to
      `max_edges` real edges for a dense CBM-style repository galaxy.
    """
    cur = conn.cursor()

    repo_total_nodes = cur.execute("SELECT count(*) FROM symbols").fetchone()[0]
    repo_total_edges = cur.execute("SELECT count(*) FROM edges").fetchone()[0]

    # Load all source & test symbols so both core modules and test suites are represented
    all_rows = cur.execute(
        """
        SELECT
            s.id,
            s.name,
            s.kind,
            s.signature,
            s.start_line,
            s.end_line,
            f.path as file_path,
            f.language,
            (SELECT count(*) FROM calls c WHERE c.callee_name = s.name) as in_deg,
            (SELECT count(*) FROM calls c WHERE c.caller_symbol_id = s.id) as out_deg,
            sc.community_id,
            sc.community_name,
            f.category
        FROM symbols s
        JOIN files f ON s.file_id = f.id
        LEFT JOIN symbol_communities sc ON sc.symbol_id = s.id
        WHERE f.category IN ('source', 'test')
        ORDER BY (CASE WHEN f.category = 'source' THEN 1 ELSE 0 END) DESC,
                 (in_deg + out_deg) DESC,
                 s.id ASC
        """
    ).fetchall()

    if not all_rows:
        return {
            "mode": mode,
            "depth": depth,
            "focus_symbol": None,
            "nodes": [],
            "edges": [],
            "communities": [],
            "hub_symbols": [],
            "total_nodes": 0,
            "total_edges": 0,
            "repo_total_nodes": repo_total_nodes,
            "repo_total_edges": repo_total_edges,
        }

    sym_by_id: Dict[int, Dict[str, Any]] = {}
    syms_by_name: Dict[str, List[int]] = {}
    syms_by_file: Dict[str, List[int]] = {}

    for r in all_rows:
        sid = r[0]
        name = r[1]
        fpath = r[6]
        in_deg = int(r[8] or 0)
        out_deg = int(r[9] or 0)
        rec = {
            "id": sid,
            "name": name,
            "kind": r[2],
            "signature": r[3] or "",
            "start_line": r[4],
            "end_line": r[5],
            "file_path": fpath,
            "language": r[7],
            "in_deg": in_deg,
            "out_deg": out_deg,
            "degree": in_deg + out_deg,
            "db_comm_id": r[10],
            "db_comm_name": r[11],
            "category": r[12],
        }
        sym_by_id[sid] = rec
        syms_by_name.setdefault(name, []).append(sid)
        syms_by_file.setdefault(fpath, []).append(sid)

    seen_hub_names: Set[str] = set()
    hub_symbols: List[Dict[str, Any]] = []
    for r in all_rows:
        hname = r[1]
        if r[12] == "source" and hname not in seen_hub_names and len(hname) > 2:
            seen_hub_names.add(hname)
            hub_symbols.append(
                {
                    "id": r[0],
                    "name": hname,
                    "kind": r[2],
                    "file_path": r[6],
                    "degree": int(r[8] or 0) + int(r[9] or 0),
                }
            )
            if len(hub_symbols) >= 15:
                break

    real_pair_edges: Dict[Tuple[int, int], str] = {}
    adj: Dict[int, List[Tuple[int, str]]] = {}

    def add_real_edge(u: int, v: int, rel: str) -> None:
        if u == v or u not in sym_by_id or v not in sym_by_id:
            return
        key = (u, v)
        if key not in real_pair_edges and (v, u) not in real_pair_edges:
            real_pair_edges[key] = rel
            adj.setdefault(u, []).append((v, rel))
            adj.setdefault(v, []).append((u, rel))

    # 1. Calls from `calls` table
    call_rows = cur.execute(
        "SELECT caller_symbol_id, callee_name FROM calls WHERE caller_symbol_id IS NOT NULL"
    ).fetchall()
    for caller_id, callee_name in call_rows:
        if caller_id in sym_by_id and callee_name in syms_by_name:
            for target_id in syms_by_name[callee_name][:3]:
                add_real_edge(caller_id, target_id, "CALLS")

    # 2. Edges from `edges` table (calls, imports, defines, inherits)
    edge_rows = cur.execute(
        "SELECT src, dst, relation FROM edges WHERE confidence >= 0.35 LIMIT 15000"
    ).fetchall()
    for src_str, dst_str, rel_raw in edge_rows:
        rel_up = (rel_raw or "CALLS").upper()
        if rel_up not in ("CALLS", "IMPORTS", "DEFINES", "INHERITS", "SIMILAR_TO"):
            rel_up = "CALLS"

        src_name = src_str.split(":")[-1].split(".")[-1]
        dst_name = dst_str.split(":")[-1].split(".")[-1]

        src_ids = syms_by_name.get(src_str) or syms_by_name.get(src_name) or []
        dst_ids = syms_by_name.get(dst_str) or syms_by_name.get(dst_name) or []

        if not src_ids and src_str in syms_by_file and syms_by_file[src_str]:
            src_ids = [syms_by_file[src_str][0]]
        if not dst_ids and dst_str in syms_by_file and syms_by_file[dst_str]:
            dst_ids = [syms_by_file[dst_str][0]]

        if src_ids and dst_ids:
            add_real_edge(src_ids[0], dst_ids[0], rel_up)

    # 3. Parent-child symbol definitions (class -> method)
    parent_rows = cur.execute(
        "SELECT parent_symbol_id, id FROM symbols WHERE parent_symbol_id IS NOT NULL"
    ).fetchall()
    for pid, cid in parent_rows:
        add_real_edge(pid, cid, "DEFINES")

    # 4. Intra-file structural `DEFINES` links (connect each file's primary hub symbol to co-defined symbols in the same file)
    for _fpath, f_sids in syms_by_file.items():
        if len(f_sids) > 1:
            hub_sid = f_sids[0]
            for sib_sid in f_sids[1:35]:
                add_real_edge(hub_sid, sib_sid, "DEFINES")

    # 5. Cross-file `IMPORTS` links from `imports` table
    imp_rows = cur.execute(
        "SELECT f.path, i.module, i.name FROM imports i JOIN files f ON i.file_id = f.id"
    ).fetchall()
    for importer_path, mod_name, imp_sym in imp_rows:
        importer_sids = syms_by_file.get(importer_path)
        if not importer_sids:
            continue
        src_sid = importer_sids[0]
        if imp_sym and imp_sym in syms_by_name:
            add_real_edge(src_sid, syms_by_name[imp_sym][0], "IMPORTS")
        elif mod_name:
            mod_tail = mod_name.split(".")[-1]
            if mod_tail in syms_by_name:
                add_real_edge(src_sid, syms_by_name[mod_tail][0], "IMPORTS")

    # 6. Similarity links
    try:
        sim_rows = cur.execute(
            "SELECT src_symbol_id, dst_symbol_id FROM symbol_similarity WHERE similarity >= 0.50 LIMIT 1200"
        ).fetchall()
        for u_id, v_id in sim_rows:
            add_real_edge(u_id, v_id, "SIMILAR_TO")
    except Exception:
        pass

    selected_ids: List[int] = []
    hop_by_id: Dict[int, int] = {}
    center_id: Optional[int] = None

    # Resolve focus/center symbol if provided (works in both 'full' and 'neighborhood' modes)
    if focus_symbol and focus_symbol.strip():
        q_sym = focus_symbol.strip()
        if q_sym in syms_by_name:
            center_id = syms_by_name[q_sym][0]
        else:
            q_lower = q_sym.lower()
            for r in all_rows:
                if r[1].lower() == q_lower:
                    center_id = r[0]
                    break
            if center_id is None:
                for r in all_rows:
                    if q_lower in r[1].lower():
                        center_id = r[0]
                        break

    if center_id is None:
        for r in all_rows:
            if r[0] in adj and len(adj[r[0]]) > 0:
                center_id = r[0]
                break
        if center_id is None:
            center_id = all_rows[0][0]

    if mode != "full":
        center_name = sym_by_id[center_id]["name"]
        seed_ids = [center_id] + [
            sid for sid in syms_by_name.get(center_name, [])[:4] if sid != center_id
        ]
        for sid in seed_ids:
            selected_ids.append(sid)
            hop_by_id[sid] = 0

        frontier = list(seed_ids)
        min_desired_nodes = min(max_nodes, max(65, depth * 55))
        max_bfs_hops = max(depth, 3)

        for current_hop in range(1, max_bfs_hops + 1):
            if len(selected_ids) >= max_nodes:
                break
            if current_hop > depth and len(selected_ids) >= min_desired_nodes:
                break

            next_candidates: List[int] = []
            for u in frontier:
                for v, _rel in adj.get(u, []):
                    if v not in hop_by_id:
                        next_candidates.append(v)

            unique_cands = list(dict.fromkeys(next_candidates))
            unique_cands.sort(
                key=lambda sid: len(adj.get(sid, [])) + sym_by_id[sid]["degree"],
                reverse=True,
            )

            next_frontier: List[int] = []
            for v in unique_cands:
                if len(selected_ids) >= max_nodes:
                    break
                hop_by_id[v] = min(depth, current_hop)
                selected_ids.append(v)
                next_frontier.append(v)
            frontier = next_frontier
            if not frontier:
                break
    else:
        # Connected Graph ('full' default): guarantee center_id + its 1-hop neighborhood first,
        # then expand connected subgraph across top repository hubs.
        center_name = sym_by_id[center_id]["name"]
        primary_seeds = [center_id] + [
            sid for sid in syms_by_name.get(center_name, [])[:4] if sid != center_id
        ]
        for ps in primary_seeds:
            if ps not in hop_by_id and len(selected_ids) < max_nodes:
                selected_ids.append(ps)
                hop_by_id[ps] = 0

        # Immediately add 1-hop neighbors of the focus symbol so its full local call/define web is present
        for ps in primary_seeds:
            for nb, _rel in adj.get(ps, []):
                if nb not in hop_by_id and len(selected_ids) < max_nodes:
                    selected_ids.append(nb)
                    hop_by_id[nb] = 1

        seed_hubs = [
            r[0] for r in all_rows[:25] if r[0] not in hop_by_id and r[0] in adj and len(adj[r[0]]) > 0
        ]
        frontier = list(selected_ids)
        for sh in seed_hubs:
            if sh not in hop_by_id and len(selected_ids) < max_nodes:
                selected_ids.append(sh)
                hop_by_id[sh] = 1
                frontier.append(sh)

        # Expand connected neighbors from seeds so every node is part of a connected web
        while frontier and len(selected_ids) < max_nodes:
            next_cands: List[int] = []
            for u in frontier:
                u_hop = hop_by_id.get(u, 1)
                for v, _rel in adj.get(u, []):
                    if v not in hop_by_id:
                        hop_by_id[v] = u_hop + 1
                        next_cands.append(v)
            next_cands.sort(
                key=lambda sid: len(adj.get(sid, [])) + sym_by_id[sid]["degree"],
                reverse=True,
            )
            next_frontier = []
            for v in next_cands:
                if len(selected_ids) >= max_nodes:
                    break
                selected_ids.append(v)
                next_frontier.append(v)
            frontier = next_frontier

    selected_set = set(selected_ids)

    comm_map: Dict[str, int] = {}
    communities_list: List[Dict[str, Any]] = []

    for sid in selected_ids:
        rec = sym_by_id[sid]
        parts = rec["file_path"].split("/")
        comm_key = "/".join(parts[:2]) if len(parts) > 1 else parts[0]
        if comm_key not in comm_map:
            cid = len(comm_map)
            comm_map[comm_key] = cid
            communities_list.append(
                {
                    "id": cid,
                    "name": comm_key,
                    "color": COMMUNITY_PALETTE[cid % len(COMMUNITY_PALETTE)],
                    "count": 0,
                }
            )
        communities_list[comm_map[comm_key]]["count"] += 1

    nodes: List[Dict[str, Any]] = []
    for sid in selected_ids:
        rec = sym_by_id[sid]
        parts = rec["file_path"].split("/")
        comm_key = "/".join(parts[:2]) if len(parts) > 1 else parts[0]
        cid = comm_map[comm_key]
        color = COMMUNITY_PALETTE[cid % len(COMMUNITY_PALETTE)]
        hop_dist = hop_by_id.get(sid, 1)
        total_deg = len(adj.get(sid, [])) + rec["degree"]
        importance = min(1.0, round(0.25 + math.log1p(total_deg) / 5.5, 2))

        nodes.append(
            {
                "id": f"sym_{sid}",
                "symbol_id": sid,
                "name": rec["name"],
                "kind": rec["kind"],
                "signature": rec["signature"],
                "start_line": rec["start_line"],
                "end_line": rec["end_line"],
                "file_path": rec["file_path"],
                "language": rec["language"],
                "in_degree": rec["in_deg"],
                "out_degree": rec["out_deg"],
                "importance": importance,
                "comm": cid,
                "comm_name": comm_key,
                "comm_color": color,
                "hop": hop_dist,
                "is_focus": sid == center_id,
            }
        )

    candidate_edges = [
        ((u, v), rel)
        for (u, v), rel in real_pair_edges.items()
        if u in selected_set and v in selected_set
    ]
    rel_priority = {"CALLS": 0, "IMPORTS": 1, "INHERITS": 2, "SIMILAR_TO": 3, "DEFINES": 4}
    candidate_edges.sort(
        key=lambda item: (
            0 if (item[0][0] == center_id or item[0][1] == center_id) else 1,
            rel_priority.get(item[1], 5),
        )
    )

    edges_out: List[Dict[str, Any]] = []
    for (u, v), rel in candidate_edges[:max_edges]:
        edges_out.append(
            {
                "source": f"sym_{u}",
                "target": f"sym_{v}",
                "type": rel,
            }
        )

    focus_name = sym_by_id[center_id]["name"] if center_id in sym_by_id else None

    return {
        "mode": mode,
        "depth": depth,
        "focus_symbol": focus_name,
        "nodes": nodes,
        "edges": edges_out,
        "communities": communities_list,
        "hub_symbols": hub_symbols,
        "total_nodes": len(nodes),
        "total_edges": len(edges_out),
        "repo_total_nodes": repo_total_nodes,
        "repo_total_edges": repo_total_edges,
    }


class FastASTHTTPServer(ThreadingHTTPServer):
    """Multi-threaded HTTP server allowing immediate socket address reuse (SO_REUSEADDR)."""

    allow_reuse_address = True
    daemon_threads = True


def run_api_server(port: int = 4200, host: str = "127.0.0.1") -> None:
    server = None
    try:
        server = FastASTHTTPServer((host, port), FastASTAPIHandler)
    except OSError as err:
        if err.errno == errno.EADDRINUSE:
            # Check if an existing FastAST API instance is already healthy on this port
            try:
                import urllib.request
                with urllib.request.urlopen(f"http://{host}:{port}/api/health", timeout=1.5) as resp:
                    if resp.status == 200:
                        print(f"FastAST API Server is already running and healthy at http://{host}:{port}")
                        # Keep process alive to prevent launcher script failures
                        while True:
                            import time
                            time.sleep(2)
            except Exception:
                pass

            # Try to reclaim port if held by a stale process
            import subprocess
            reclaimed = False
            try:
                res = subprocess.run(["fuser", "-k", "-9", f"{port}/tcp"], capture_output=True, timeout=2)
                if res.returncode == 0:
                    reclaimed = True
            except Exception:
                try:
                    pids = subprocess.check_output(["lsof", "-ti", f":{port}"], timeout=2).decode().split()
                    for pid in pids:
                        subprocess.run(["kill", "-9", pid], capture_output=True)
                    reclaimed = bool(pids)
                except Exception:
                    pass

            if reclaimed:
                import time
                time.sleep(0.5)
                try:
                    server = FastASTHTTPServer((host, port), FastASTAPIHandler)
                    print(f"Reclaimed port {port} from stale process.")
                except Exception:
                    reclaimed = False

            if not reclaimed:
                print(
                    f"\n[FastAST Error] Port {port} on {host} is already in use by another process.\n"
                    f"To free port {port}, run:\n"
                    f"  lsof -ti :{port} | xargs kill -9 2>/dev/null || fuser -k {port}/tcp\n"
                    f"Or specify an alternative port:\n"
                    f"  python -m fastast.cli serve --port 4201\n",
                    file=sys.stderr,
                )
                sys.exit(1)
        else:
            raise

    print(f"FastAST API Server listening on http://{host}:{port}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down FastAST API Server.")
    finally:
        server.server_close()


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="FastAST Web UI API Server")
    parser.add_argument("--port", type=int, default=4200, help="Port to listen on (default: 4200)")
    parser.add_argument("--host", default="127.0.0.1", help="Host address (default: 127.0.0.1)")
    args = parser.parse_args()
    run_api_server(port=args.port, host=args.host)
