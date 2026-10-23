"""Louvain Community Detection and Modular Graph Clustering for FastAST.

Provides:
1. LouvainDetector: Modularity-optimizing community detection algorithm.
2. derive_community_name: Automatic semantic labeling for detected communities.
3. detect_and_store_communities: Runs community detection on SQLite symbol graph and stores results.
"""

from collections import Counter, defaultdict
import os
from pathlib import Path
import re
import sqlite3
import time
from typing import Any, Dict, List, Optional, Set, Tuple

from fastast.config import get_logger

logger = get_logger("fastast.community")


class LouvainDetector:
    """Modularity-based Louvain community detection on weighted undirected graphs."""

    def __init__(self, resolution: float = 1.0, max_iterations: int = 25) -> None:
        self.resolution = resolution
        self.max_iterations = max_iterations

    def fit(
        self,
        nodes: List[int],
        edges: List[Tuple[int, int, float]],
    ) -> Tuple[Dict[int, int], float]:
        """Run Louvain modularity optimization.

        Args:
            nodes: List of integer node IDs.
            edges: List of (u, v, weight) undirected edge tuples.

        Returns:
            Tuple of (node_id -> community_id mapping, modularity Q score).
        """
        if not nodes:
            return {}, 0.0

        if not edges:
            # Degenerate case: all disconnected
            return {n: i for i, n in enumerate(nodes)}, 0.0

        # Build weighted adjacency graph
        adj: Dict[int, Dict[int, float]] = defaultdict(lambda: defaultdict(float))
        k: Dict[int, float] = defaultdict(float)
        m = 0.0

        for u, v, w in edges:
            if u == v:
                continue
            adj[u][v] += w
            adj[v][u] += w
            k[u] += w
            k[v] += w
            m += w

        if m <= 0.0:
            return {n: i for i, n in enumerate(nodes)}, 0.0

        # Initial community assignments: each node in its own community
        community: Dict[int, int] = {n: n for n in nodes}
        sigma_tot: Dict[int, float] = {n: k[n] for n in nodes}
        sigma_in: Dict[int, float] = {n: 0.0 for n in nodes}

        # Local modularity optimization loop
        improved = True
        iterations = 0
        min_gain = 1e-4

        while improved and iterations < self.max_iterations:
            improved = False
            iterations += 1

            for u in nodes:
                c_u = community[u]
                k_u = k[u]

                # Tally weights from u to each neighboring community
                neigh_comm_weights: Dict[int, float] = defaultdict(float)
                for v, w in adj[u].items():
                    neigh_comm_weights[community[v]] += w

                # Remove u from current community
                k_u_in = neigh_comm_weights.get(c_u, 0.0)
                sigma_tot[c_u] -= k_u
                sigma_in[c_u] -= 2.0 * k_u_in

                best_comm = c_u
                best_gain = 0.0

                # Evaluate Delta Q for each candidate neighbor community
                for c_cand, w_in in neigh_comm_weights.items():
                    gain = (w_in / m) - (self.resolution * k_u * sigma_tot[c_cand]) / (
                        2.0 * m * m
                    )
                    if gain > best_gain:
                        best_gain = gain
                        best_comm = c_cand

                # Place u into chosen community
                community[u] = best_comm
                sigma_tot[best_comm] += k_u
                k_u_new_in = neigh_comm_weights.get(best_comm, 0.0)
                sigma_in[best_comm] += 2.0 * k_u_new_in

                if best_comm != c_u and best_gain > min_gain:
                    improved = True

        # Renumber communities contiguously by size (largest community = 0)
        comm_sizes = Counter(community.values())
        sorted_comms = [c for c, _ in comm_sizes.most_common()]
        remap = {orig: new_id for new_id, orig in enumerate(sorted_comms)}
        final_partition = {n: remap[community[n]] for n in nodes}

        # Calculate final modularity Q
        modularity = 0.0
        for u, v_map in adj.items():
            for v, w in v_map.items():
                if final_partition.get(u) == final_partition.get(v):
                    modularity += w - (self.resolution * k[u] * k[v]) / (2.0 * m)

        modularity = round(modularity / (2.0 * m), 4)
        return final_partition, modularity


def derive_community_name(
    community_id: int,
    symbols: List[Dict[str, Any]],
    hub_name: Optional[str] = None,
) -> str:
    """Generate a clean, descriptive name for a community based on its members."""
    if not symbols:
        return f"community-{community_id}"

    # Extract dominant directory/path component
    dirs = [
        str(Path(s.get("file_path", "")).parent)
        for s in symbols
        if s.get("file_path")
    ]
    dir_counter = Counter(d for d in dirs if d and d != ".")

    # Extract domain words from symbol names
    words: List[str] = []
    for s in symbols:
        name = s.get("name", "")
        for part in re.split(r"[_\W]+", name.lower()):
            if len(part) > 2 and part not in {
                "get", "set", "test", "run", "handle", "build", "create", "init"
            }:
                words.append(part)

    word_counter = Counter(words)
    label = ""
    if word_counter:
        top_word = word_counter.most_common(1)[0][0]
        label = top_word
    elif dir_counter:
        top_dir = dir_counter.most_common(1)[0][0]
        label = Path(top_dir).name
    else:
        label = f"module"

    hub_str = f" (hub: {hub_name})" if hub_name else ""
    return f"{label}{hub_str}"


def detect_and_store_communities(conn: sqlite3.Connection) -> Dict[str, Any]:
    """Run Louvain community detection on SQLite symbol graph and store assignments."""
    cur = conn.cursor()

    # 1. Fetch symbols
    cur.execute(
        """
        SELECT s.id, s.name, s.kind, f.path as file_path
        FROM symbols s
        JOIN files f ON s.file_id = f.id
        """
    )
    symbol_rows = cur.fetchall()
    if not symbol_rows:
        return {"total_communities": 0, "modularity": 0.0, "communities": []}

    sym_by_id: Dict[int, Dict[str, Any]] = {
        r["id"]: {
            "id": r["id"],
            "name": r["name"],
            "kind": r["kind"],
            "file_path": r["file_path"],
        }
        for r in symbol_rows
    }
    sym_name_to_id: Dict[str, int] = {r["name"]: r["id"] for r in symbol_rows}
    nodes = list(sym_by_id.keys())

    # 2. Build edges from calls, defines, inherits, imports, and similarity
    edges: List[Tuple[int, int, float]] = []

    # Graph edges
    cur.execute(
        "SELECT src, dst, relation, confidence FROM edges WHERE src IS NOT NULL AND dst IS NOT NULL"
    )
    for row in cur.fetchall():
        src_name = row["src"]
        dst_name = row["dst"]
        rel = row["relation"]
        conf = float(row["confidence"] or 1.0)

        u = sym_name_to_id.get(src_name)
        v = sym_name_to_id.get(dst_name)
        if u and v and u != v:
            w = conf * (1.2 if rel in ("defines", "inherits") else 1.0)
            edges.append((u, v, w))

    # Add similarity edges with 0.7 damping
    try:
        cur.execute("SELECT src_symbol_id, dst_symbol_id, similarity FROM symbol_similarity")
        for row in cur.fetchall():
            u, v, sim = row[0], row[1], float(row[2])
            if u != v:
                edges.append((u, v, sim * 0.7))
    except sqlite3.Error as exc:
        logger.debug(f"Similarity edge query skipped: {exc}")

    # If no structural edges exist, fall back to file directory co-location edges
    if not edges and len(nodes) > 1:
        by_file: Dict[str, List[int]] = defaultdict(list)
        for s in sym_by_id.values():
            by_file[s["file_path"]].append(s["id"])
        for file_nodes in by_file.values():
            for i in range(len(file_nodes)):
                for j in range(i + 1, len(file_nodes)):
                    edges.append((file_nodes[i], file_nodes[j], 1.0))

    # 3. Fit Louvain
    detector = LouvainDetector(resolution=1.0)
    partition, modularity = detector.fit(nodes, edges)

    # 4. Group symbols by community and determine hub
    comm_members: Dict[int, List[Dict[str, Any]]] = defaultdict(list)
    degree_counter: Dict[int, int] = Counter()
    for u, v, _ in edges:
        degree_counter[u] += 1
        degree_counter[v] += 1

    for node_id, comm_id in partition.items():
        comm_members[comm_id].append(sym_by_id[node_id])

    # 5. Build assignments and store in database
    now = time.time()
    db_rows: List[Tuple[int, int, str, float, float]] = []
    communities_summary: List[Dict[str, Any]] = []

    for comm_id, members in sorted(comm_members.items(), key=lambda x: len(x[1]), reverse=True):
        # Identify central hub
        hub_sym = max(members, key=lambda s: degree_counter.get(s["id"], 0), default=members[0])
        comm_name = derive_community_name(comm_id, members, hub_name=hub_sym["name"])

        for s in members:
            db_rows.append((s["id"], comm_id, comm_name, modularity, now))

        communities_summary.append({
            "community_id": comm_id,
            "name": comm_name,
            "hub": hub_sym["name"],
            "total_symbols": len(members),
            "files": sorted(list({s["file_path"] for s in members}))[:5],
            "symbols": [s["name"] for s in members[:10]],
        })

    with conn:
        conn.execute("DELETE FROM symbol_communities")
        conn.executemany(
            """
            INSERT OR REPLACE INTO symbol_communities (symbol_id, community_id, community_name, modularity, updated_at)
            VALUES (?, ?, ?, ?, ?)
            """,
            db_rows,
        )

    return {
        "total_communities": len(comm_members),
        "modularity": modularity,
        "communities": communities_summary,
    }
