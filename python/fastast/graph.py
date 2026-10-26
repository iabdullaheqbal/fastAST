"""Phase 3: Symbol / Edge Graph Builder (Graph-level pruning).

Constructs a clean, typed knowledge graph from extracted syntactic facts,
pruning ambiguous relations, noise, and low-confidence edges, and providing
fast bidirectional lookups and bounded multi-hop neighborhood traversals.
"""

from __future__ import annotations

from collections import defaultdict, deque
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional, Set, Tuple, Union

from fastast.model import (
    EdgeRecord,
    EdgeRelation,
    ExtractedFileFacts,
    FileRecord,
    SymbolRecord,
)

# Common built-in functions / identifiers across languages that generate call noise
BUILTIN_CALL_NOISE: Set[str] = {
    # Python
    "print", "len", "str", "int", "float", "bool", "list", "dict", "set", "tuple",
    "range", "type", "isinstance", "issubclass", "getattr", "setattr", "hasattr",
    "super", "enumerate", "zip", "map", "filter", "min", "max", "sum", "any", "all",
    "open", "repr", "id", "dir", "eval", "exec", "format", "iter", "next",
    # JavaScript / TypeScript
    "console", "log", "warn", "error", "info", "require", "parseInt", "parseFloat",
    "String", "Number", "Boolean", "Array", "Object", "Function", "Symbol", "Promise",
    # General
    "panic", "unwrap", "assert",
}


@dataclass
class Node:
    """Represents a node in the CodeGraph (file, module, class, function, method, etc.)."""

    id: str  # Unique canonical key, e.g. "path/to/file.py::func_name" or "name"
    name: str
    kind: str  # "function", "method", "class", "interface", "struct", "file", "module", etc.
    file_path: str
    start_line: int = 0
    end_line: int = 0
    confidence: float = 1.0
    signature: Optional[str] = None
    parent_name: Optional[str] = None
    docstring: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "kind": self.kind,
            "file_path": self.file_path,
            "start_line": self.start_line,
            "end_line": self.end_line,
            "confidence": self.confidence,
            "signature": self.signature,
            "parent_name": self.parent_name,
            "docstring": self.docstring,
            "metadata": self.metadata,
        }

    @classmethod
    def from_symbol_record(cls, sym: SymbolRecord) -> "Node":
        node_id = f"{sym.file}::{sym.name}" if sym.file else sym.name
        return cls(
            id=node_id,
            name=sym.name,
            kind=sym.kind,
            file_path=sym.file,
            start_line=sym.start_line,
            end_line=sym.end_line,
            confidence=sym.confidence,
            signature=sym.signature,
            parent_name=sym.parent_name,
            docstring=sym.docstring,
            metadata={"db_id": sym.id} if sym.id else {},
        )

    @classmethod
    def from_file_record(cls, file_rec: FileRecord) -> "Node":
        return cls(
            id=file_rec.path,
            name=Path(file_rec.path).name,
            kind="file",
            file_path=file_rec.path,
            start_line=1,
            end_line=file_rec.total_lines,
            confidence=1.0,
            metadata={
                "language": file_rec.language,
                "category": file_rec.category,
                "hash": file_rec.hash,
                "lines": file_rec.total_lines,
            },
        )


class CodeGraph:
    """In-memory directed property graph representing repository symbols and dependencies."""

    def __init__(self, min_confidence: float = 0.6, prune_builtins: bool = True):
        self.min_confidence = min_confidence
        self.prune_builtins = prune_builtins

        # Core graph storage
        self.nodes: Dict[str, Node] = {}
        self._symbol_to_nodes: Dict[str, List[str]] = defaultdict(list)
        self._outgoing: Dict[str, List[EdgeRecord]] = defaultdict(list)
        self._incoming: Dict[str, List[EdgeRecord]] = defaultdict(list)

        # Edge deduplication tracking: (src, dst, relation) -> index in outgoing
        self._edge_index: Set[Tuple[str, str, str]] = set()

    def add_node(self, node: Node) -> None:
        """Add or update a node in the graph."""
        self.nodes[node.id] = node
        if node.id not in self._symbol_to_nodes[node.name]:
            self._symbol_to_nodes[node.name].append(node.id)

    def add_edge(self, edge: EdgeRecord) -> bool:
        """Add an edge if it satisfies graph-level pruning criteria.

        Returns True if admitted, False if pruned.
        """
        # Pruning Rule 1: Confidence threshold
        if edge.confidence < self.min_confidence:
            return False

        # Pruning Rule 2: Trivial self-loops
        if edge.src == edge.dst:
            return False

        # Pruning Rule 3: Built-in noise for call edges
        if self.prune_builtins and edge.relation == EdgeRelation.CALLS.value:
            if edge.dst in BUILTIN_CALL_NOISE:
                return False

        # Pruning Rule 4: Edge deduplication (keep highest confidence)
        edge_key = (edge.src, edge.dst, edge.relation)
        if edge_key in self._edge_index:
            # Update existing edge if new one has higher confidence
            for existing in self._outgoing[edge.src]:
                if existing.dst == edge.dst and existing.relation == edge.relation:
                    if edge.confidence > existing.confidence:
                        existing.confidence = edge.confidence
                        existing.line_number = edge.line_number
            return False

        self._edge_index.add(edge_key)
        self._outgoing[edge.src].append(edge)
        self._incoming[edge.dst].append(edge)
        return True

    def get_node(self, node_id: str) -> Optional[Node]:
        """Retrieve node by canonical node ID."""
        return self.nodes.get(node_id)

    def lookup_symbol(
        self,
        name: str,
        kind: Optional[str] = None,
        file_path: Optional[str] = None,
    ) -> List[Node]:
        """Find nodes matching a symbol name with optional kind and file filters."""
        node_ids = self._symbol_to_nodes.get(name, [])
        matches = [self.nodes[nid] for nid in node_ids if nid in self.nodes]

        if kind:
            matches = [n for n in matches if n.kind == kind]
        if file_path:
            matches = [n for n in matches if n.file_path == file_path]

        return matches

    def get_outgoing_edges(
        self, node_key: str, relation: Optional[str] = None
    ) -> List[EdgeRecord]:
        """Get edges originating from a node or symbol name."""
        edges = self._outgoing.get(node_key, [])
        if not edges and "::" in node_key:
            # Also check simple symbol name
            simple_name = node_key.split("::")[-1]
            edges = self._outgoing.get(simple_name, [])

        if relation:
            edges = [e for e in edges if e.relation == relation]
        return edges

    def get_incoming_edges(
        self, node_key: str, relation: Optional[str] = None
    ) -> List[EdgeRecord]:
        """Get edges targeting a node or symbol name."""
        edges = self._incoming.get(node_key, [])
        if not edges and "::" in node_key:
            simple_name = node_key.split("::")[-1]
            edges = self._incoming.get(simple_name, [])

        if relation:
            edges = [e for e in edges if e.relation == relation]
        return edges

    def get_neighbors(
        self,
        node_key: str,
        direction: str = "both",
        relation: Optional[str] = None,
    ) -> List[str]:
        """Return unique 1-hop neighbor identifiers."""
        neighbors: Set[str] = set()

        if direction in ("out", "both"):
            for e in self.get_outgoing_edges(node_key, relation=relation):
                neighbors.add(e.dst)

        if direction in ("in", "both"):
            for e in self.get_incoming_edges(node_key, relation=relation):
                neighbors.add(e.src)

        return sorted(neighbors)

    def bounded_traversal(
        self,
        start_symbol: str,
        max_depth: int = 2,
        max_nodes: int = 50,
        min_confidence: float = 0.5,
        direction: str = "both",
        decay_factor: float = 0.85,
    ) -> Dict[str, Any]:
        """Execute depth-bounded, confidence-decayed Breadth-First Search (BFS).

        Args:
            start_symbol: Initial symbol name or node ID.
            max_depth: Maximum hops from start.
            max_nodes: Maximum node budget to prevent unbounded expansion.
            min_confidence: Pruning threshold during traversal.
            direction: 'out' (callees/imports), 'in' (callers), or 'both'.
            decay_factor: Hop attenuation multiplier per traversal level.

        Returns:
            Dictionary containing visited nodes, traversed edges, hop levels, and confidence scores.
        """
        visited_nodes: Set[str] = set()
        visited_edges: List[EdgeRecord] = []
        hop_depths: Dict[str, int] = {}
        node_confidences: Dict[str, float] = {}

        # Queue items: (current_node_key, depth, confidence)
        queue: deque[Tuple[str, int, float]] = deque([(start_symbol, 0, 1.0)])
        visited_nodes.add(start_symbol)
        hop_depths[start_symbol] = 0
        node_confidences[start_symbol] = 1.0

        while queue and len(visited_nodes) < max_nodes:
            curr_key, depth, curr_conf = queue.popleft()

            if depth >= max_depth:
                continue

            # Outgoing expansion
            if direction in ("out", "both"):
                for edge in self.get_outgoing_edges(curr_key):
                    next_conf = curr_conf * edge.confidence * decay_factor
                    if next_conf < min_confidence:
                        continue

                    if edge.dst not in visited_nodes:
                        if len(visited_nodes) >= max_nodes:
                            continue
                        visited_nodes.add(edge.dst)
                        visited_edges.append(edge)
                        hop_depths[edge.dst] = depth + 1
                        node_confidences[edge.dst] = round(next_conf, 3)
                        queue.append((edge.dst, depth + 1, next_conf))
                    else:
                        visited_edges.append(edge)

            # Incoming expansion
            if direction in ("in", "both"):
                for edge in self.get_incoming_edges(curr_key):
                    next_conf = curr_conf * edge.confidence * decay_factor
                    if next_conf < min_confidence:
                        continue

                    if edge.src not in visited_nodes:
                        if len(visited_nodes) >= max_nodes:
                            continue
                        visited_nodes.add(edge.src)
                        visited_edges.append(edge)
                        hop_depths[edge.src] = depth + 1
                        node_confidences[edge.src] = round(next_conf, 3)
                        queue.append((edge.src, depth + 1, next_conf))
                    else:
                        visited_edges.append(edge)

        # Resolve node objects
        resolved_nodes: List[Dict[str, Any]] = []
        for key in sorted(visited_nodes):
            node_obj = self.get_node(key)
            if node_obj:
                resolved_nodes.append(node_obj.to_dict())
            else:
                # Check simple name lookup
                matched = self.lookup_symbol(key)
                if matched:
                    resolved_nodes.append(matched[0].to_dict())
                else:
                    resolved_nodes.append({
                        "id": key,
                        "name": key,
                        "kind": "unresolved",
                        "file_path": "",
                    })

        return {
            "root": start_symbol,
            "total_nodes": len(resolved_nodes),
            "total_edges": len(visited_edges),
            "max_depth_reached": max(hop_depths.values()) if hop_depths else 0,
            "hop_depths": hop_depths,
            "node_confidences": node_confidences,
            "nodes": resolved_nodes,
            "edges": [e.to_dict() for e in visited_edges],
        }

    # ── Factory Constructors ─────────────────────────────────────────────────

    @classmethod
    def from_facts(
        cls,
        facts_list: List[ExtractedFileFacts],
        min_confidence: float = 0.6,
        prune_builtins: bool = True,
    ) -> "CodeGraph":
        """Build CodeGraph directly from a list of ExtractedFileFacts."""
        graph = cls(min_confidence=min_confidence, prune_builtins=prune_builtins)

        for facts in facts_list:
            # Add file node
            file_node = Node(
                id=facts.file_path,
                name=Path(facts.file_path).name,
                kind="file",
                file_path=facts.file_path,
                start_line=1,
                end_line=facts.total_lines,
                confidence=0.85 if facts.has_syntax_error else 1.0,
                metadata={"language": facts.language},
            )
            graph.add_node(file_node)

            # Add symbol nodes
            for sym in facts.symbols:
                node = Node.from_symbol_record(sym)
                graph.add_node(node)

            # Add edges with pruning
            for edge in facts.edges:
                graph.add_edge(edge)

        return graph

    @classmethod
    def from_db(
        cls,
        db_path: Union[Path, str],
        min_confidence: float = 0.6,
        prune_builtins: bool = True,
    ) -> "CodeGraph":
        """Build CodeGraph by loading tables from an indexed SQLite database."""
        from fastast.db import get_connection

        path = Path(db_path)
        if not path.exists():
            raise FileNotFoundError(f"Database not found: {db_path}")

        conn = get_connection(path)
        graph = cls(min_confidence=min_confidence, prune_builtins=prune_builtins)

        # 1. Load files
        cur = conn.cursor()
        cur.execute("SELECT path, language, hash, total_lines, status, category FROM files")
        for row in cur.fetchall():
            node = Node(
                id=row["path"],
                name=Path(row["path"]).name,
                kind="file",
                file_path=row["path"],
                start_line=1,
                end_line=row["total_lines"],
                confidence=1.0,
                metadata={
                    "language": row["language"],
                    "hash": row["hash"],
                    "category": row["category"],
                },
            )
            graph.add_node(node)

        # 2. Load symbols
        cur.execute(
            """
            SELECT s.id, s.name, s.kind, s.signature, s.start_line, s.end_line,
                   s.confidence, s.docstring, f.path as file_path, p.name as parent_name
            FROM symbols s
            JOIN files f ON s.file_id = f.id
            LEFT JOIN symbols p ON s.parent_symbol_id = p.id
            """
        )
        for row in cur.fetchall():
            sym_rec = SymbolRecord(
                id=row["id"],
                name=row["name"],
                kind=row["kind"],
                file=row["file_path"],
                start_line=row["start_line"],
                end_line=row["end_line"],
                confidence=row["confidence"],
                signature=row["signature"],
                parent_name=row["parent_name"],
                docstring=row["docstring"],
            )
            node = Node.from_symbol_record(sym_rec)
            graph.add_node(node)

        # 3. Load edges
        cur.execute("SELECT src, dst, relation, confidence, line_number FROM edges")
        for row in cur.fetchall():
            edge = EdgeRecord(
                src=row["src"],
                dst=row["dst"],
                relation=row["relation"],
                confidence=row["confidence"],
                line_number=row["line_number"],
            )
            graph.add_edge(edge)

        conn.close()
        return graph

    @classmethod
    def from_repo(
        cls,
        repo_path: Union[Path, str] = ".",
        languages: Optional[Set[str]] = None,
        min_confidence: float = 0.6,
        prune_builtins: bool = True,
    ) -> "CodeGraph":
        """Convenience end-to-end pipeline: Discovery -> Parser -> CodeGraph."""
        from fastast.discovery import discover_files
        from fastast.extractor import parse_file_records

        root = Path(repo_path)
        records = discover_files(root, languages=languages)
        facts_list = parse_file_records(records, repo_root=root)
        return cls.from_facts(facts_list, min_confidence=min_confidence, prune_builtins=prune_builtins)
