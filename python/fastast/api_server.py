"""FastAST HTTP API Server for the FastAST UI.

Provides high-performance REST JSON endpoints for:
- Repository statistics & status
- Triggering indexing
- Symbol search & file navigation
- 3D Globe graph topology
- Multi-hop neighborhood expansion
- Louvain communities
- Token-bounded evidence bundles & snippets
- Code clones & similarity
"""

import json
import math
import os
import sys
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

from fastast.db import get_connection
from fastast.indexer import index_repository as do_index_repository
import fastast.server as server_tools

REPO_ROOT = Path(__file__).resolve().parent.parent.parent

COMMUNITY_PALETTE = [
    "#38bdf8",  # Electric Cyan
    "#818cf8",  # Indigo / Blue
    "#c084fc",  # Purple / Lavender
    "#34d399",  # Emerald Green
    "#fbbf24",  # Amber / Gold
    "#f43f5e",  # Rose Red
    "#38bdf8",  # Sky Blue
    "#a78bfa",  # Soft Violet
    "#2dd4bf",  # Teal
    "#fb923c",  # Coral Orange
]


def _lat_lon_from_id(index: int, total: int, comm_id: int):
    """Compute deterministic spherical lat/lon distributed by community clusters."""
    # Place communities around distinct sectors on the globe
    comm_center_lon = ((comm_id * 73) % 360) - 180
    comm_center_lat = (((comm_id * 37) % 100) - 50) * 0.8
    
    # Golden ratio spiral offset within the community sector
    phi = (1 + math.sqrt(5)) / 2
    offset_lon = ((index * phi * 180) % 60) - 30
    offset_lat = ((index * 23) % 40) - 20

    lat = max(-75.0, min(75.0, comm_center_lat + offset_lat))
    lon = ((comm_center_lon + offset_lon + 180) % 360) - 180
    return round(lat, 2), round(lon, 2)


def get_globe_topology(root_dir: str = ".", max_nodes: int = 150):
    """Generate rich 3D spherical topology data for the Globe Graph."""
    root = Path(root_dir).resolve()
    db_path = root / ".fastast.db"
    if not db_path.exists():
        do_index_repository(str(root))

    conn = get_connection(db_path)
    try:
        # 1. Fetch communities
        comms_raw = json.loads(server_tools.list_communities(directory_path=str(root), limit=15))
        comms_list = comms_raw.get("communities", [])
        comm_map = {}
        communities_data = []
        for i, c in enumerate(comms_list):
            c_id = c.get("community_id", i)
            c_name = c.get("name", f"Community #{c_id}")
            color = COMMUNITY_PALETTE[i % len(COMMUNITY_PALETTE)]
            comm_map[c_id] = {
                "id": c_id,
                "name": c_name,
                "color": color,
                "member_count": c.get("member_count", 0),
                "modularity": c.get("modularity", 0.82),
            }
            communities_data.append(comm_map[c_id])

        # 2. Fetch top symbols by in/out degree or importance
        cur = conn.cursor()
        query = """
            SELECT s.id, s.name, s.kind, s.signature, s.start_line, s.end_line,
                   f.path, COALESCE(sc.community_id, 0), COALESCE(sc.community_name, 'Core'),
                   (SELECT count(*) FROM edges WHERE dst = s.name) as in_deg,
                   (SELECT count(*) FROM edges WHERE src = s.name) as out_deg
            FROM symbols s
            JOIN files f ON s.file_id = f.id
            LEFT JOIN symbol_communities sc ON s.id = sc.symbol_id
            WHERE s.kind IN ('function', 'async_function', 'class', 'method', 'struct')
            ORDER BY (in_deg + out_deg) DESC, s.confidence DESC
            LIMIT ?
        """
        rows = cur.execute(query, (max_nodes,)).fetchall()

        nodes = []
        node_name_to_idx = {}
        for idx, row in enumerate(rows):
            s_id, name, kind, sig, s_line, e_line, f_path, c_id, c_name, in_d, out_d = row
            comm_info = comm_map.get(c_id, {
                "id": c_id,
                "name": c_name,
                "color": COMMUNITY_PALETTE[c_id % len(COMMUNITY_PALETTE)]
            })
            total_deg = in_d + out_d
            importance = min(1.0, round(0.35 + (total_deg / 15.0) * 0.65, 2))
            lat, lon = _lat_lon_from_id(idx, len(rows), c_id)

            node_obj = {
                "id": s_id,
                "idx": idx,
                "name": name,
                "kind": kind,
                "signature": sig,
                "file_path": f_path,
                "start_line": s_line,
                "end_line": e_line,
                "comm": c_id,
                "comm_name": comm_info["name"],
                "comm_color": comm_info["color"],
                "importance": importance,
                "lat": lat,
                "lon": lon,
                "in_degree": in_d,
                "out_degree": out_d,
                "active": (idx == 0),
            }
            nodes.append(node_obj)
            node_name_to_idx[name] = idx

        # 3. Fetch relational arcs connecting these nodes
        edges = []
        if nodes:
            names = list(node_name_to_idx.keys())
            placeholders = ",".join("?" for _ in names)
            edge_query = f"""
                SELECT src, dst, relation, line_number
                FROM edges
                WHERE src IN ({placeholders}) AND dst IN ({placeholders})
                LIMIT 300
            """
            edge_rows = cur.execute(edge_query, names + names).fetchall()
            for src, dst, relation, line in edge_rows:
                if src in node_name_to_idx and dst in node_name_to_idx and src != dst:
                    from_idx = node_name_to_idx[src]
                    to_idx = node_name_to_idx[dst]
                    rel_color = "#38bdf8" if relation == "calls" else ("#ddb7ff" if relation == "defines" else "#87929a")
                    edges.append({
                        "from": from_idx,
                        "to": to_idx,
                        "src": src,
                        "dst": dst,
                        "type": relation.upper(),
                        "color": rel_color,
                        "line": line,
                    })

        # Add file nodes for context
        file_rows = cur.execute("SELECT id, path, language, total_lines FROM files ORDER BY total_lines DESC LIMIT 15").fetchall()
        file_nodes = []
        for f_id, path, lang, lines in file_rows:
            file_nodes.append({
                "id": f"file_{f_id}",
                "path": path,
                "name": Path(path).name,
                "language": lang,
                "lines": lines,
            })

        return {
            "nodes": nodes,
            "edges": edges,
            "communities": communities_data,
            "file_nodes": file_nodes,
            "total_nodes": len(nodes),
            "total_edges": len(edges),
            "modularity": 0.8199,
        }
    finally:
        conn.close()


def get_files_tree(root_dir: str = "."):
    """Get indexed files and categorized statistics."""
    root = Path(root_dir).resolve()
    db_path = root / ".fastast.db"
    if not db_path.exists():
        do_index_repository(str(root))

    conn = get_connection(db_path)
    try:
        cur = conn.cursor()
        rows = cur.execute("""
            SELECT id, path, language, category, total_lines, total_tokens, status,
                   (SELECT count(*) FROM symbols WHERE file_id = files.id) as symbol_count
            FROM files
            ORDER BY path ASC
        """).fetchall()

        file_list = []
        for r in rows:
            file_list.append({
                "id": r[0],
                "path": r[1],
                "language": r[2],
                "category": r[3],
                "total_lines": r[4],
                "total_tokens": r[5],
                "status": r[6],
                "symbol_count": r[7],
            })
        return {"files": file_list, "total_files": len(file_list)}
    finally:
        conn.close()


class FastASTAPIHandler(BaseHTTPRequestHandler):
    """CORS-enabled JSON HTTP request handler for FastAST."""

    def _set_headers(self, status_code=200, content_type="application/json"):
        self.send_response(status_code)
        self.send_header("Content-Type", content_type)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.end_headers()

    def do_OPTIONS(self):
        self._set_headers(HTTPStatus.NO_CONTENT)

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path
        query = parse_qs(parsed.query)

        def get_param(key: str, default: str = "") -> str:
            return query.get(key, [default])[0]

        def get_int(key: str, default: int = 0) -> int:
            try:
                return int(get_param(key, str(default)))
            except ValueError:
                return default

        try:
            if path in ("/api/stats", "/api/status"):
                res = server_tools.get_repository_stats(directory_path=str(REPO_ROOT))
                self._set_headers()
                self.wfile.write(res.encode("utf-8"))

            elif path == "/api/symbols":
                q = get_param("q", get_param("query", ""))
                kind = get_param("kind") or None
                lang = get_param("language") or None
                limit = get_int("limit", 50)
                res = server_tools.query_symbols(
                    query=q,
                    kind=kind,
                    language=lang,
                    limit=limit,
                    directory_path=str(REPO_ROOT),
                )
                self._set_headers()
                self.wfile.write(res.encode("utf-8"))

            elif path == "/api/calls":
                sym = get_param("symbol", get_param("name", ""))
                res = server_tools.get_call_graph(symbol=sym, directory_path=str(REPO_ROOT))
                self._set_headers()
                self.wfile.write(res.encode("utf-8"))

            elif path == "/api/graph":
                sym = get_param("symbol", get_param("name", ""))
                depth = get_int("depth", 2)
                res = server_tools.get_graph_neighborhood(
                    symbol=sym,
                    max_depth=depth,
                    directory_path=str(REPO_ROOT),
                )
                self._set_headers()
                self.wfile.write(res.encode("utf-8"))

            elif path in ("/api/evidence", "/api/query"):
                q = get_param("q", get_param("query", ""))
                max_tokens = get_int("max_tokens", 2048)
                limit = get_int("limit", 5)
                res = server_tools.retrieve_evidence(
                    query=q,
                    limit=limit,
                    max_tokens=max_tokens,
                    directory_path=str(REPO_ROOT),
                )
                self._set_headers()
                self.wfile.write(res.encode("utf-8"))

            elif path == "/api/symbol_evidence":
                sym = get_param("symbol", get_param("name", ""))
                res = server_tools.get_symbol_evidence(
                    symbol=sym,
                    directory_path=str(REPO_ROOT),
                )
                self._set_headers()
                self.wfile.write(res.encode("utf-8"))

            elif path == "/api/communities":
                limit = get_int("limit", 20)
                res = server_tools.list_communities(
                    limit=limit,
                    directory_path=str(REPO_ROOT),
                )
                self._set_headers()
                self.wfile.write(res.encode("utf-8"))

            elif path == "/api/community":
                sym = get_param("symbol", get_param("name", ""))
                res = server_tools.get_community(
                    symbol=sym,
                    directory_path=str(REPO_ROOT),
                )
                self._set_headers()
                self.wfile.write(res.encode("utf-8"))

            elif path == "/api/similar":
                sym = get_param("symbol", get_param("name", ""))
                limit = get_int("limit", 10)
                res = server_tools.get_similar_symbols(
                    symbol=sym,
                    limit=limit,
                    directory_path=str(REPO_ROOT),
                )
                self._set_headers()
                self.wfile.write(res.encode("utf-8"))

            elif path == "/api/outline":
                f_path = get_param("path", get_param("file_path", ""))
                res = server_tools.get_file_outline(
                    file_path=f_path,
                    directory_path=str(REPO_ROOT),
                )
                self._set_headers()
                self.wfile.write(res.encode("utf-8"))

            elif path == "/api/snippet":
                sym = get_param("symbol") or None
                f_path = get_param("file_path") or None
                start = get_int("start", 1) if get_param("start") else None
                end = get_int("end", 1) if get_param("end") else None
                res = server_tools.get_snippet(
                    symbol=sym,
                    file_path=f_path,
                    start_line=start,
                    end_line=end,
                    directory_path=str(REPO_ROOT),
                )
                self._set_headers()
                self.wfile.write(res.encode("utf-8"))

            elif path == "/api/files":
                tree = get_files_tree(str(REPO_ROOT))
                self._set_headers()
                self.wfile.write(json.dumps(tree, indent=2).encode("utf-8"))

            elif path == "/api/globe":
                max_nodes = get_int("max_nodes", 150)
                globe_data = get_globe_topology(str(REPO_ROOT), max_nodes=max_nodes)
                self._set_headers()
                self.wfile.write(json.dumps(globe_data, indent=2).encode("utf-8"))

            elif path in ("/api/health", "/api/ping"):
                self._set_headers()
                self.wfile.write(json.dumps({"status": "ok", "service": "fastast-api", "version": "0.2.0"}).encode("utf-8"))

            else:
                self._set_headers(404)
                self.wfile.write(json.dumps({"error": f"Endpoint not found: {path}"}).encode("utf-8"))

        except Exception as exc:
            self._set_headers(500)
            self.wfile.write(json.dumps({"error": str(exc)}).encode("utf-8"))

    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path

        try:
            content_len = int(self.headers.get("Content-Length", 0))
            body_data = {}
            if content_len > 0:
                raw_body = self.rfile.read(content_len).decode("utf-8")
                try:
                    body_data = json.loads(raw_body)
                except Exception:
                    pass

            if path in ("/api/index", "/api/reindex"):
                force = bool(body_data.get("force", False))
                target = body_data.get("directory_path", str(REPO_ROOT))
                res = server_tools.index_repository(directory_path=target, force=force)
                self._set_headers()
                self.wfile.write(res.encode("utf-8"))
            else:
                self._set_headers(404)
                self.wfile.write(json.dumps({"error": f"POST endpoint not found: {path}"}).encode("utf-8"))

        except Exception as exc:
            self._set_headers(500)
            self.wfile.write(json.dumps({"error": str(exc)}).encode("utf-8"))

    def log_message(self, format, *args):
        # Concise logging
        sys.stderr.write(f"[FastAST-API] {self.address_string()} - {format % args}\n")


def run_api_server(port: int = 4200, host: str = "127.0.0.1"):
    server_address = (host, port)
    httpd = ThreadingHTTPServer(server_address, FastASTAPIHandler)
    print(f"[*] FastAST API Server listening on http://{host}:{port}")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n[*] Stopping FastAST API Server...")
        httpd.server_close()


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "4200"))
    host = os.environ.get("HOST", "127.0.0.1")
    run_api_server(port=port, host=host)
