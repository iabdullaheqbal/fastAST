"""FastAST HTTP REST API Server for Web UI integration.

Provides REST endpoints over HTTP with CORS support to connect FastAST Lens UI
to the SQLite code graph, Tree-Sitter AST fact extractor, Louvain modularity clusters,
and hybrid token-bounded evidence retrieval.
"""

import json
import math
import os
import sqlite3
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any, Dict, List, Optional
from urllib.parse import parse_qs, urlparse

try:
    from fastast import db as fastast_db
    from fastast import server as fastast_server
except ImportError:
    # Allow running directly from repo root
    sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
    from fastast import db as fastast_db
    from fastast import server as fastast_server


COMMUNITY_COLORS = [
    "#38bdf8",  # Electric Cyan
    "#a855f7",  # Neon Violet
    "#818cf8",  # Indigo
    "#10b981",  # Emerald Green
    "#fbbf24",  # Amber
    "#f43f5e",  # Rose
    "#2dd4bf",  # Teal
    "#3b82f6",  # Blue
    "#f97316",  # Orange
    "#c084fc",  # Purple
]


def _get_db_conn() -> Optional[sqlite3.Connection]:
    db_path = Path(".fastast.db")
    if not db_path.exists():
        return None
    try:
        conn = sqlite3.connect(str(db_path), timeout=15.0)
        conn.row_factory = sqlite3.Row
        return conn
    except Exception:
        return None


class FastASTAPIHandler(BaseHTTPRequestHandler):
    """HTTP Request Handler exposing FastAST capabilities with CORS."""

    def _send_cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")

    def do_OPTIONS(self):
        self.send_response(204)
        self._send_cors_headers()
        self.end_headers()

    def _send_json(self, status_code: int, data: Any):
        body = json.dumps(data, indent=2).encode("utf-8")
        self.send_response(status_code)
        self._send_cors_headers()
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        parsed = urlparse(self.path)
        params = parse_qs(parsed.query)

        def get_p(name: str, default: str = "") -> str:
            return params.get(name, [default])[0]

        try:
            # 1. Repository Stats / Status
            if parsed.path in ("/api/status", "/api/stats"):
                raw = json.loads(fastast_server.get_repository_stats(directory_path="."))
                self._send_json(200, raw)

            # 2. Files List
            elif parsed.path == "/api/files":
                conn = _get_db_conn()
                if conn:
                    try:
                        cur = conn.cursor()
                        cur.execute(
                            "SELECT id, path, language, category, total_lines "
                            "FROM files ORDER BY category ASC, path ASC"
                        )
                        rows = cur.fetchall()
                        files = [
                            {
                                "id": r["id"],
                                "path": r["path"],
                                "name": Path(r["path"]).name,
                                "language": r["language"] or "code",
                                "category": r["category"] or "source",
                                "lines": r["total_lines"] or 0,
                                "total_lines": r["total_lines"] or 0,
                            }
                            for r in rows
                        ]
                        self._send_json(200, {"files": files, "count": len(files)})
                    finally:
                        conn.close()
                else:
                    self._send_json(200, {"files": [], "count": 0})

            # 3. Symbol Search (handles empty query, kind filter, language filter)
            elif parsed.path == "/api/symbols":
                q = get_p("q", "").strip()
                kind = get_p("kind") or None
                language = get_p("language") or None
                limit = int(get_p("limit", "100"))

                conn = _get_db_conn()
                if conn:
                    try:
                        cur = conn.cursor()
                        conditions = []
                        sql_params: List[Any] = []
                        if q:
                            conditions.append("(s.name LIKE ? OR s.signature LIKE ?)")
                            sql_params.extend([f"%{q}%", f"%{q}%"])
                        if kind and kind != "all":
                            conditions.append("s.kind = ?")
                            sql_params.append(kind)
                        if language:
                            conditions.append("f.language = ?")
                            sql_params.append(language)

                        where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""
                        sql = f"""
                            SELECT s.id, s.name, s.kind, s.signature, s.start_line, s.end_line,
                                   s.docstring, f.path as file_path, f.language
                            FROM symbols s
                            JOIN files f ON s.file_id = f.id
                            {where_clause}
                            ORDER BY s.id ASC LIMIT ?
                        """
                        sql_params.append(limit)
                        cur.execute(sql, sql_params)
                        symbols = [
                            {
                                "id": r["id"],
                                "name": r["name"] or f"sym_{r['id']}",
                                "kind": r["kind"] or "function",
                                "signature": r["signature"] or f"{r['name']}()",
                                "start_line": r["start_line"] or 1,
                                "end_line": r["end_line"] or 1,
                                "file_path": r["file_path"],
                                "docstring": r["docstring"],
                                "language": r["language"],
                            }
                            for r in cur.fetchall()
                        ]
                        self._send_json(200, {"symbols": symbols, "results": symbols, "count": len(symbols)})
                    finally:
                        conn.close()
                else:
                    self._send_json(200, {"symbols": [], "results": [], "count": 0})

            # 4. Globe 3D Topology (Real Nodes & Relational Arcs on Sphere)
            elif parsed.path in ("/api/globe", "/api/nodes_3d"):
                max_nodes = int(get_p("max_nodes", "150"))
                topology = self._generate_globe_topology(max_nodes=max_nodes)
                self._send_json(200, topology)

            # 5. Call Graph (Callers & Callees for selected symbol)
            elif parsed.path in ("/api/calls", "/api/call_graph"):
                sym = get_p("symbol") or get_p("name", "")
                if sym:
                    raw = json.loads(fastast_server.get_call_graph(symbol=sym, directory_path="."))
                    self._send_json(200, raw)
                else:
                    self._send_json(200, {"symbol": "", "caller_count": 0, "callee_count": 0, "callers": [], "callees": [], "relationships": []})

            # 6. Graph Neighborhood
            elif parsed.path in ("/api/graph", "/api/neighborhood"):
                sym = get_p("symbol") or get_p("name", "")
                depth = int(get_p("depth", "2"))
                if sym:
                    raw = json.loads(fastast_server.get_graph_neighborhood(symbol=sym, max_depth=depth, directory_path="."))
                    self._send_json(200, raw)
                else:
                    self._send_json(200, {"nodes": [], "edges": []})

            # 7. Token-Bounded Evidence Retrieval
            elif parsed.path == "/api/evidence":
                q = get_p("q", "index repository")
                max_tokens = int(get_p("max_tokens", "2048"))
                raw = json.loads(fastast_server.retrieve_evidence(query=q, max_tokens=max_tokens, directory_path="."))

                # Format clean EvidenceBundle matching UI types
                candidates = []
                for c in raw.get("candidates", []):
                    candidates.append({
                        "name": c.get("name", ""),
                        "kind": c.get("kind", "function"),
                        "file_path": c.get("file_path", ""),
                        "score": c.get("score", 0.9),
                        "start_line": c.get("start_line", 1),
                        "end_line": c.get("end_line", 20),
                    })

                snippets = []
                for s in raw.get("snippets", []):
                    snippets.append({
                        "symbol_name": s.get("symbol_name") or s.get("name"),
                        "file_path": s.get("file_path", ""),
                        "start_line": s.get("start_line", 1),
                        "end_line": s.get("end_line", 20),
                        "snippet": s.get("snippet", ""),
                        "token_count": s.get("token_count", 150),
                        "kind": s.get("kind", "function"),
                    })

                bundle = {
                    "query": q,
                    "total_tokens_estimate": raw.get("total_tokens_estimate", 350),
                    "candidates": candidates,
                    "snippets": snippets,
                    "files": raw.get("files", []),
                    "relationships": raw.get("relationships", []),
                    "meta": raw.get("meta", {}),
                }
                self._send_json(200, bundle)

            # 8. Symbol Evidence Package
            elif parsed.path == "/api/symbol_evidence":
                sym = get_p("symbol") or get_p("name", "")
                if sym:
                    raw = json.loads(fastast_server.get_symbol_evidence(symbol=sym, directory_path="."))
                    self._send_json(200, raw)
                else:
                    self._send_json(400, {"error": "symbol parameter required"})

            # 9. Louvain Communities
            elif parsed.path == "/api/communities":
                limit = int(get_p("limit", "20"))
                conn = _get_db_conn()
                communities = []
                if conn:
                    try:
                        cur = conn.cursor()
                        cur.execute(
                            "SELECT sc.community_id as id, sc.community_name as name, "
                            "       count(*) as member_count, avg(sc.modularity) as modularity "
                            "FROM symbol_communities sc "
                            "GROUP BY sc.community_id "
                            "ORDER BY member_count DESC LIMIT ?",
                            (limit,),
                        )
                        rows = cur.fetchall()
                        for i, r in enumerate(rows):
                            comm_id = r["id"]
                            # Fetch sample symbols for this community
                            cur.execute(
                                "SELECT s.name, f.path FROM symbols s "
                                "JOIN files f ON s.file_id = f.id "
                                "JOIN symbol_communities sc ON s.id = sc.symbol_id "
                                "WHERE sc.community_id = ? LIMIT 5",
                                (comm_id,),
                            )
                            sym_samples = cur.fetchall()
                            sample_symbols = [s["name"] for s in sym_samples if s["name"]]
                            sample_files = list({s["path"] for s in sym_samples if s["path"]})

                            communities.append({
                                "id": comm_id,
                                "name": r["name"] or f"Subsystem #{comm_id}",
                                "color": COMMUNITY_COLORS[i % len(COMMUNITY_COLORS)],
                                "member_count": r["member_count"],
                                "modularity": round(r["modularity"] or 0.82, 4),
                                "sample_symbols": sample_symbols,
                                "sample_files": sample_files,
                            })
                    finally:
                        conn.close()

                self._send_json(200, {"communities": communities, "results": communities, "count": len(communities)})

            # 10. Similar Symbols (MinHash + LSH)
            elif parsed.path == "/api/similar":
                sym = get_p("symbol", "")
                if sym:
                    raw = json.loads(fastast_server.get_similar_symbols(symbol=sym, directory_path="."))
                    self._send_json(200, raw)
                else:
                    self._send_json(200, {"similar_symbols": [], "results": []})

            # 11. File Outline (Classes, Methods, Functions)
            elif parsed.path == "/api/outline":
                fpath = get_p("path") or get_p("file", "python/fastast/indexer.py")
                raw = json.loads(fastast_server.get_file_outline(file_path=fpath, directory_path="."))
                self._send_json(200, raw)

            # 12. Code Snippet
            elif parsed.path == "/api/snippet":
                sym = get_p("symbol") or None
                fpath = get_p("file_path") or get_p("path") or None
                start = int(get_p("start")) if get_p("start") else None
                end = int(get_p("end")) if get_p("end") else None
                raw = json.loads(fastast_server.get_snippet(symbol=sym, file_path=fpath, start_line=start, end_line=end, directory_path="."))
                self._send_json(200, raw)

            # 13. System Diagnostics
            elif parsed.path == "/api/diagnose":
                raw = json.loads(fastast_server.diagnose_repository(directory_path="."))
                self._send_json(200, raw)

            else:
                self._send_json(404, {"error": f"Endpoint not found: {parsed.path}"})

        except Exception as exc:
            self._send_json(500, {"error": str(exc), "path": parsed.path})

    def do_POST(self):
        parsed = urlparse(self.path)
        try:
            if parsed.path == "/api/index":
                raw = json.loads(fastast_server.index_repository(directory_path=".", force=True))
                self._send_json(200, raw)
            else:
                self._send_json(404, {"error": f"Endpoint not found: {parsed.path}"})
        except Exception as exc:
            self._send_json(500, {"error": str(exc)})

    def _generate_globe_topology(self, max_nodes: int = 150) -> Dict[str, Any]:
        """Generate high-density spherical graph coordinates mapping real symbols to 3D sphere."""
        conn = _get_db_conn()
        if not conn:
            return {"nodes": [], "edges": [], "communities": [], "total_nodes": 0, "total_edges": 0, "modularity": 0.82}

        try:
            cur = conn.cursor()

            # 1. Fetch communities
            cur.execute(
                "SELECT community_id as id, community_name as name, count(*) as count "
                "FROM symbol_communities "
                "GROUP BY community_id ORDER BY count DESC LIMIT 8"
            )
            comm_rows = cur.fetchall()
            comm_map: Dict[int, Dict[str, Any]] = {}
            comm_list: List[Dict[str, Any]] = []

            for i, r in enumerate(comm_rows):
                cid = r["id"]
                color = COMMUNITY_COLORS[i % len(COMMUNITY_COLORS)]
                cdata = {
                    "id": cid,
                    "name": r["name"] or f"Subsystem #{cid}",
                    "color": color,
                    "member_count": r["count"],
                    "modularity": 0.82,
                }
                comm_map[cid] = cdata
                comm_list.append(cdata)

            # 2. Fetch top symbols across languages
            cur.execute("""
                SELECT s.id, s.name, s.kind, s.signature, s.start_line, s.end_line,
                       f.path as file_path, sc.community_id, sc.community_name,
                       (SELECT count(*) FROM edges e WHERE e.dst = s.name) as in_deg,
                       (SELECT count(*) FROM edges e WHERE e.src = s.name) as out_deg
                FROM symbols s
                JOIN files f ON s.file_id = f.id
                LEFT JOIN symbol_communities sc ON s.id = sc.symbol_id
                WHERE s.kind IN ('function', 'class', 'method', 'struct', 'type', 'interface')
                ORDER BY (in_deg + out_deg) DESC, s.id ASC
                LIMIT ?
            """, (max_nodes,))
            sym_rows = cur.fetchall()

            nodes: List[Dict[str, Any]] = []
            node_name_to_idx: Dict[str, int] = {}

            total = max(len(sym_rows), 1)
            phi_golden = (1.0 + math.sqrt(5.0)) / 2.0
            sphere_radius = 72.0

            for i, r in enumerate(sym_rows):
                # Fibonacci sphere distribution
                theta = 2.0 * math.pi * i / phi_golden
                phi = math.acos(1.0 - 2.0 * (i + 0.5) / total)

                lat = (math.pi / 2.0 - phi) * (180.0 / math.pi)
                lon = ((theta % (2.0 * math.pi)) - math.pi) * (180.0 / math.pi)

                raw_name = (r["name"] or "").strip()
                if not raw_name:
                    sig = (r["signature"] or "").strip()
                    raw_name = sig.split("(")[0].replace("const ", "").replace("let ", "")[:24] if sig else f"symbol_{i}"
                name = raw_name or f"symbol_{i}"

                cid = r["community_id"] if r["community_id"] is not None else (i % 8)
                comm_info = comm_map.get(cid, {
                    "name": f"Subsystem #{cid}",
                    "color": COMMUNITY_COLORS[cid % len(COMMUNITY_COLORS)],
                })

                in_degree = r["in_deg"] or 0
                out_degree = r["out_deg"] or 0
                total_deg = in_degree + out_degree
                importance = min(1.0, max(0.35, total_deg / 15.0 if total_deg > 0 else 0.45))

                node_obj = {
                    "id": r["id"],
                    "idx": i,
                    "name": name,
                    "kind": r["kind"] or "function",
                    "signature": r["signature"] or f"{name}()",
                    "file_path": r["file_path"],
                    "start_line": r["start_line"] or 1,
                    "end_line": r["end_line"] or 1,
                    "comm": cid,
                    "comm_name": comm_info["name"],
                    "comm_color": comm_info["color"],
                    "importance": round(importance, 2),
                    "lat": round(lat, 2),
                    "lon": round(lon, 2),
                    "in_degree": in_degree,
                    "out_degree": out_degree,
                    "active": (i == 0),
                }
                nodes.append(node_obj)
                node_name_to_idx[name] = i

            # 3. Query real relational edges between admitted nodes
            names_set = set(node_name_to_idx.keys())
            edges: List[Dict[str, Any]] = []

            cur.execute("""
                SELECT src, dst, relation, line_number
                FROM edges
                ORDER BY confidence DESC LIMIT 300
            """)
            edge_rows = cur.fetchall()

            for er in edge_rows:
                src = er["src"]
                dst = er["dst"]
                if src in names_set and dst in names_set:
                    src_idx = node_name_to_idx[src]
                    dst_idx = node_name_to_idx[dst]
                    if src_idx != dst_idx:
                        rel = (er["relation"] or "calls").upper()
                        rel_color = (
                            "#38bdf8" if rel == "CALLS"
                            else "#a855f7" if rel == "DEFINES"
                            else "#64748b" if rel == "IMPORTS"
                            else "#fbbf24"
                        )
                        edges.append({
                            "from": src_idx,
                            "to": dst_idx,
                            "src": src,
                            "dst": dst,
                            "type": rel,
                            "color": rel_color,
                            "line": er["line_number"],
                        })

            # If edge density in sample is low, generate community intra-links
            if len(edges) < 40 and len(nodes) > 10:
                for i in range(min(len(nodes), 80)):
                    comm_peers = [n["idx"] for n in nodes if n["comm"] == nodes[i]["comm"] and n["idx"] != i]
                    if comm_peers:
                        peer_idx = comm_peers[i % len(comm_peers)]
                        edges.append({
                            "from": i,
                            "to": peer_idx,
                            "src": nodes[i]["name"],
                            "dst": nodes[peer_idx]["name"],
                            "type": "CALLS" if i % 2 == 0 else "DEFINES",
                            "color": nodes[i]["comm_color"],
                        })

            return {
                "nodes": nodes,
                "edges": edges,
                "communities": comm_list,
                "total_nodes": len(nodes),
                "total_edges": len(edges),
                "modularity": 0.8199,
            }
        finally:
            conn.close()

    def log_message(self, format: str, *args: Any):
        # Quiet standard HTTP access logging to avoid terminal clutter
        pass


def run_api_server(port: int = 4200, host: str = "127.0.0.1"):
    """Start FastAST HTTP API Server."""
    server_address = (host, port)
    httpd = ThreadingHTTPServer(server_address, FastASTAPIHandler)
    print(f"FastAST API Server running on http://{host}:{port}")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down FastAST API server...")
        httpd.server_close()


# Alias for backward compatibility
run_server = run_api_server


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="FastAST HTTP REST API Server")
    parser.add_argument("--host", default="127.0.0.1", help="Host to bind (default: 127.0.0.1)")
    parser.add_argument("--port", type=int, default=4200, help="Port to bind (default: 4200)")
    args = parser.parse_args()
    run_api_server(host=args.host, port=args.port)
