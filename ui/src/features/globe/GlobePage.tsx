import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { fastAstApi } from '../../services/api';
import type { CallGraphEntry, GlobeCommunity, GlobeNode, GlobeTopology, ImportEntry, RepoStats } from '../../types';

interface GlobePageProps {
  stats?: RepoStats | null;
  connectionVersion?: number;
  onNavigateToExplore?: (symbolName: string, filePath?: string) => void;
}

interface GraphNode2D {
  id: string;
  name: string;
  kind: string;
  filePath: string;
  startLine?: number;
  endLine?: number;
  x: number;
  y: number;
  radius: number;
  color: string;
  community: string;
  inDegree: number;
  outDegree: number;
  isCenter: boolean;
  isInbound: boolean;
  isOutbound: boolean;
  isImport?: boolean;
  isSubNode?: boolean;
  rawNode?: GlobeNode;
}

interface GraphEdge2D {
  from: string;
  to: string;
  type: string;
  color: string;
}

const EDGE_COLOR_MAP: Record<string, string> = {
  CALLS: '#38bdf8',
  IMPORTS: '#10b981',
  DEFINES: '#a855f7',
  INHERITS: '#f59e0b',
  SIMILAR_TO: '#ec4899',
};

const KIND_COLOR_MAP: Record<string, string> = {
  function: '#38bdf8',
  method: '#60a5fa',
  class: '#a855f7',
  type: '#818cf8',
  struct: '#f59e0b',
  file: '#10b981',
  module: '#10b981',
};

// Built-in fallback graph so the canvas is NEVER empty even if backend is starting or offline
const FALLBACK_TOPOLOGY: GlobeTopology = {
  mode: 'full',
  depth: 2,
  total_nodes: 18,
  total_edges: 20,
  repo_total_nodes: 142,
  repo_total_edges: 284,
  communities: [
    { id: 0, name: 'Database & Storage', color: '#38bdf8', count: 6 },
    { id: 1, name: 'API Server', color: '#10b981', count: 5 },
    { id: 2, name: 'AST Parser', color: '#a855f7', count: 3 },
    { id: 3, name: 'Imported Modules', color: '#34d399', count: 3 },
    { id: 4, name: 'Testing Suite', color: '#f59e0b', count: 1 },
  ],
  nodes: [
    // Database & Storage
    {
      id: 'get_call_graph',
      name: 'get_call_graph',
      kind: 'function',
      file_path: 'python/fastast/db.py',
      start_line: 120,
      end_line: 145,
      language: 'python',
      in_degree: 3,
      out_degree: 3,
      comm: 0,
      comm_name: 'Database & Storage',
      comm_color: '#38bdf8',
      importance: 0.95,
      signature: 'def get_call_graph(conn, symbol_name: str)',
    },
    {
      id: 'CodeGraph',
      name: 'CodeGraph',
      kind: 'class',
      file_path: 'python/fastast/graph.py',
      start_line: 15,
      end_line: 85,
      language: 'python',
      in_degree: 2,
      out_degree: 2,
      comm: 0,
      comm_name: 'Database & Storage',
      comm_color: '#38bdf8',
      importance: 0.9,
      signature: 'class CodeGraph',
    },
    {
      id: 'CodeGraph.add_node',
      name: 'CodeGraph.add_node',
      kind: 'method',
      file_path: 'python/fastast/graph.py',
      start_line: 30,
      end_line: 45,
      language: 'python',
      in_degree: 1,
      out_degree: 0,
      comm: 0,
      comm_name: 'Database & Storage',
      comm_color: '#38bdf8',
      importance: 0.7,
      signature: 'def add_node(self, node: Node) -> None',
    },
    {
      id: 'CodeGraph.add_edge',
      name: 'CodeGraph.add_edge',
      kind: 'method',
      file_path: 'python/fastast/graph.py',
      start_line: 50,
      end_line: 65,
      language: 'python',
      in_degree: 1,
      out_degree: 0,
      comm: 0,
      comm_name: 'Database & Storage',
      comm_color: '#38bdf8',
      importance: 0.7,
      signature: 'def add_edge(self, u: str, v: str, rel: str) -> None',
    },
    {
      id: 'sqlite.cursor',
      name: 'sqlite.cursor',
      kind: 'function',
      file_path: 'external:sqlite3',
      start_line: 1,
      end_line: 1,
      language: 'python',
      in_degree: 1,
      out_degree: 0,
      comm: 0,
      comm_name: 'Database & Storage',
      comm_color: '#38bdf8',
      importance: 0.6,
      signature: 'cursor()',
    },
    {
      id: 'format_edges',
      name: 'format_edges',
      kind: 'function',
      file_path: 'python/fastast/db.py',
      start_line: 165,
      end_line: 185,
      language: 'python',
      in_degree: 1,
      out_degree: 1,
      comm: 0,
      comm_name: 'Database & Storage',
      comm_color: '#38bdf8',
      importance: 0.7,
      signature: 'def format_edges(rows)',
    },

    // API Server
    {
      id: 'FastASTAPIHandler',
      name: 'FastASTAPIHandler',
      kind: 'class',
      file_path: 'python/fastast/api_server.py',
      start_line: 168,
      end_line: 230,
      language: 'python',
      in_degree: 2,
      out_degree: 2,
      comm: 1,
      comm_name: 'API Server',
      comm_color: '#10b981',
      importance: 0.88,
      signature: 'class FastASTAPIHandler(BaseHTTPRequestHandler)',
    },
    {
      id: 'FastASTAPIHandler.do_GET',
      name: 'FastASTAPIHandler.do_GET',
      kind: 'method',
      file_path: 'python/fastast/api_server.py',
      start_line: 218,
      end_line: 280,
      language: 'python',
      in_degree: 1,
      out_degree: 1,
      comm: 1,
      comm_name: 'API Server',
      comm_color: '#10b981',
      importance: 0.82,
      signature: 'def do_GET(self) -> None',
    },
    {
      id: 'FastASTAPIHandler.do_POST',
      name: 'FastASTAPIHandler.do_POST',
      kind: 'method',
      file_path: 'python/fastast/api_server.py',
      start_line: 190,
      end_line: 215,
      language: 'python',
      in_degree: 1,
      out_degree: 0,
      comm: 1,
      comm_name: 'API Server',
      comm_color: '#10b981',
      importance: 0.75,
      signature: 'def do_POST(self) -> None',
    },
    {
      id: 'handle_graph',
      name: 'handle_graph',
      kind: 'function',
      file_path: 'python/fastast/api_server.py',
      start_line: 84,
      end_line: 110,
      language: 'python',
      in_degree: 2,
      out_degree: 1,
      comm: 1,
      comm_name: 'API Server',
      comm_color: '#10b981',
      importance: 0.8,
      signature: 'def handle_graph(self) -> None',
    },
    {
      id: 'server.inspect',
      name: 'server.inspect',
      kind: 'method',
      file_path: 'python/fastast/server.py',
      start_line: 210,
      end_line: 235,
      language: 'python',
      in_degree: 1,
      out_degree: 1,
      comm: 1,
      comm_name: 'API Server',
      comm_color: '#10b981',
      importance: 0.75,
      signature: 'def inspect(self, symbol: str)',
    },

    // AST Parser & Extractor
    {
      id: 'ASTParser',
      name: 'ASTParser',
      kind: 'class',
      file_path: 'python/fastast/parser.py',
      start_line: 20,
      end_line: 95,
      language: 'python',
      in_degree: 2,
      out_degree: 2,
      comm: 2,
      comm_name: 'AST Parser',
      comm_color: '#a855f7',
      importance: 0.85,
      signature: 'class ASTParser',
    },
    {
      id: 'ASTParser.extract_symbols',
      name: 'ASTParser.extract_symbols',
      kind: 'method',
      file_path: 'python/fastast/parser.py',
      start_line: 35,
      end_line: 60,
      language: 'python',
      in_degree: 1,
      out_degree: 0,
      comm: 2,
      comm_name: 'AST Parser',
      comm_color: '#a855f7',
      importance: 0.75,
      signature: 'def extract_symbols(self, code: str)',
    },
    {
      id: 'parse_edge_kind',
      name: 'parse_edge_kind',
      kind: 'function',
      file_path: 'python/fastast/parser.py',
      start_line: 44,
      end_line: 60,
      language: 'python',
      in_degree: 1,
      out_degree: 0,
      comm: 2,
      comm_name: 'AST Parser',
      comm_color: '#a855f7',
      importance: 0.65,
      signature: 'def parse_edge_kind(kind: str)',
    },

    // Imported Modules
    {
      id: 'sqlite3',
      name: 'sqlite3',
      kind: 'module',
      file_path: 'external:sqlite3',
      start_line: 1,
      end_line: 1,
      language: 'python',
      in_degree: 1,
      out_degree: 0,
      comm: 3,
      comm_name: 'Imported Modules',
      comm_color: '#34d399',
      importance: 0.85,
      signature: 'import sqlite3',
    },
    {
      id: 'fastast.model',
      name: 'fastast.model',
      kind: 'module',
      file_path: 'python/fastast/model.py',
      start_line: 1,
      end_line: 50,
      language: 'python',
      in_degree: 1,
      out_degree: 0,
      comm: 3,
      comm_name: 'Imported Modules',
      comm_color: '#34d399',
      importance: 0.8,
      signature: 'from fastast.model import Candidate, SymbolRecord',
    },
    {
      id: 'typing',
      name: 'typing',
      kind: 'module',
      file_path: 'stdlib:typing',
      start_line: 1,
      end_line: 1,
      language: 'python',
      in_degree: 1,
      out_degree: 0,
      comm: 3,
      comm_name: 'Imported Modules',
      comm_color: '#34d399',
      importance: 0.75,
      signature: 'import typing',
    },

    // Testing Suite
    {
      id: 'test_get_call_graph',
      name: 'test_get_call_graph',
      kind: 'function',
      file_path: 'tests/test_db.py',
      start_line: 32,
      end_line: 55,
      language: 'python',
      in_degree: 0,
      out_degree: 1,
      comm: 4,
      comm_name: 'Testing Suite',
      comm_color: '#f59e0b',
      importance: 0.7,
      signature: 'def test_get_call_graph()',
    },
  ],
  edges: [
    // Sub-node definitions (DEFINES)
    { source: 'CodeGraph', target: 'CodeGraph.add_node', type: 'DEFINES' },
    { source: 'CodeGraph', target: 'CodeGraph.add_edge', type: 'DEFINES' },
    { source: 'FastASTAPIHandler', target: 'FastASTAPIHandler.do_GET', type: 'DEFINES' },
    { source: 'FastASTAPIHandler', target: 'FastASTAPIHandler.do_POST', type: 'DEFINES' },
    { source: 'ASTParser', target: 'ASTParser.extract_symbols', type: 'DEFINES' },

    // Invocations (CALLS)
    { source: 'FastASTAPIHandler.do_GET', target: 'handle_graph', type: 'CALLS' },
    { source: 'handle_graph', target: 'get_call_graph', type: 'CALLS' },
    { source: 'test_get_call_graph', target: 'get_call_graph', type: 'CALLS' },
    { source: 'server.inspect', target: 'get_call_graph', type: 'CALLS' },
    { source: 'get_call_graph', target: 'sqlite.cursor', type: 'CALLS' },
    { source: 'get_call_graph', target: 'format_edges', type: 'CALLS' },
    { source: 'format_edges', target: 'parse_edge_kind', type: 'CALLS' },

    // Imports (IMPORTS)
    { source: 'get_call_graph', target: 'sqlite3', type: 'IMPORTS' },
    { source: 'get_call_graph', target: 'fastast.model', type: 'IMPORTS' },
    { source: 'get_call_graph', target: 'typing', type: 'IMPORTS' },
  ],
};

const FALLBACK_IMPORTS: ImportEntry[] = [
  { module: 'sqlite3', name: null, file_path: 'python/fastast/db.py', line_number: 4 },
  { module: 'fastast.model', name: 'Candidate', file_path: 'python/fastast/db.py', line_number: 10 },
  { module: 'typing', name: 'Dict', file_path: 'python/fastast/db.py', line_number: 7 },
  { module: 'fastast.config', name: 'get_logger', file_path: 'python/fastast/db.py', line_number: 9 },
];

export const GlobePage: React.FC<GlobePageProps> = ({ connectionVersion = 0, onNavigateToExplore }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Core Data
  const [topology, setTopology] = useState<GlobeTopology>(FALLBACK_TOPOLOGY);
  const [selectedNode, setSelectedNode] = useState<GlobeNode>(FALLBACK_TOPOLOGY.nodes[0]);
  const [callers, setCallers] = useState<CallGraphEntry[]>([]);
  const [callees, setCallees] = useState<CallGraphEntry[]>([]);
  const [imports, setImports] = useState<ImportEntry[]>(FALLBACK_IMPORTS);
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [isLoadingCalls, setIsLoadingCalls] = useState<boolean>(false);
  const [copiedBundle, setCopiedBundle] = useState<boolean>(false);

  // Filters & Controls
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeHop, setActiveHop] = useState<1 | 2 | 'all'>(1);
  const [filterEdges, setFilterEdges] = useState<Record<string, boolean>>({
    CALLS: true,
    IMPORTS: true,
    DEFINES: true,
    SIMILAR_TO: true,
  });
  const [animRunning, setAnimRunning] = useState<boolean>(true);

  // Canvas Viewport Pan & Zoom Transform
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState<number>(1.0);
  const simNodesRef = useRef<GraphNode2D[]>([]);

  // 1. Fetch live topology from FastAST backend (with graceful fallback and reconnect sync)
  const fetchTopology = useCallback((hopCount?: 1 | 2 | 'all') => {
    const isAll = (hopCount ?? activeHop) === 'all';
    fastAstApi
      .getGlobeTopology({
        mode: 'full',
        maxNodes: isAll ? 450 : 200,
        maxEdges: isAll ? 1400 : 600,
      })
      .then((data) => {
        if (data && data.nodes && data.nodes.length > 0) {
          setTopology(data);
          setIsOffline(false);
        } else {
          setIsOffline(true);
        }
      })
      .catch(() => {
        setIsOffline(true);
      });
  }, [activeHop]);

  useEffect(() => {
    fetchTopology();
  }, [connectionVersion, fetchTopology]);

  // 2. Fetch live callers, callees, and imports whenever selected node changes
  useEffect(() => {
    if (!selectedNode) {
      setCallers([]);
      setCallees([]);
      setImports([]);
      return;
    }
    setIsLoadingCalls(true);
    fastAstApi
      .getCallGraph(selectedNode.name)
      .then((cg) => {
        setCallers(cg.callers || []);
        setCallees(cg.callees || []);
        setImports(cg.imports || []);
        setIsLoadingCalls(false);
      })
      .catch(() => {
        setCallers([]);
        setCallees([]);
        setImports([]);
        setIsLoadingCalls(false);
      });
  }, [selectedNode]);

  // Compute actual live edge counts from real data and imports
  const edgeCounts = useMemo(() => {
    const counts: Record<string, number> = { CALLS: 0, IMPORTS: 0, DEFINES: 0, SIMILAR_TO: 0 };
    (topology.edges || []).forEach((e) => {
      const t = (e.type || 'CALLS').toUpperCase();
      counts[t] = (counts[t] || 0) + 1;
    });
    if (imports.length > counts.IMPORTS) {
      counts.IMPORTS = imports.length;
    }
    return counts;
  }, [topology.edges, imports]);

  // Filtered search list of symbols
  const filteredSymbols = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return (topology.nodes || [])
      .filter((n) => n.name.toLowerCase().includes(q) || (n.file_path && n.file_path.toLowerCase().includes(q)))
      .slice(0, 10);
  }, [searchQuery, topology.nodes]);

  // Reset view to center
  const handleRecenter = useCallback(() => {
    setPan({ x: 0, y: 0 });
    setZoom(1.0);
  }, []);

  // Copy token-budgeted LLM evidence slice
  const handleCopyBundle = () => {
    if (!selectedNode) return;
    const bundleText = JSON.stringify(
      {
        symbol: selectedNode.name,
        kind: selectedNode.kind,
        file: selectedNode.file_path,
        signature: selectedNode.signature,
        community: selectedNode.comm_name,
        in_degree: selectedNode.in_degree,
        out_degree: selectedNode.out_degree,
        callers: callers.map((c) => ({ caller: c.caller, file: c.file_path, line: c.line_number })),
        callees: callees.map((c) => ({ callee: c.callee, file: c.file_path, line: c.line_number })),
        imports: imports.map((i) => ({ module: i.module, name: i.name, file: i.file_path, line: i.line_number })),
      },
      null,
      2
    );
    navigator.clipboard.writeText(bundleText);
    setCopiedBundle(true);
    setTimeout(() => setCopiedBundle(false), 2000);
  };

  // 3. Main 2D Canvas Interaction & Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let animOffset = 0;
    let isDraggingNode = false;
    let isPanning = false;
    let draggedNode: GraphNode2D | null = null;
    let pointerStart = { x: 0, y: 0 };
    let hasMoved = false;

    // Fast node lookup index
    const nodeLookup = new Map<string, GlobeNode>();
    topology.nodes.forEach((n) => {
      nodeLookup.set(n.id, n);
      nodeLookup.set(n.name, n);
    });

    const activeNode = selectedNode || topology.nodes[0];
    if (!activeNode) return;

    // Viewport dimensions
    const width = container.clientWidth || 900;
    const height = container.clientHeight || 650;

    // Assemble 2D graph nodes
    const nodesMap = new Map<string, GraphNode2D>();
    const edgesList: GraphEdge2D[] = [];

    const centerKey = activeNode.name;
    const centerColor = activeNode.comm_color || KIND_COLOR_MAP[activeNode.kind] || '#38bdf8';

    // Center Active Focus Node
    nodesMap.set(centerKey, {
      id: activeNode.id,
      name: activeNode.name,
      kind: activeNode.kind || 'function',
      filePath: activeNode.file_path || '',
      startLine: activeNode.start_line,
      endLine: activeNode.end_line,
      x: width / 2,
      y: height / 2,
      radius: 22,
      color: centerColor,
      community: activeNode.comm_name || 'Core',
      inDegree: activeNode.in_degree || callers.length,
      outDegree: activeNode.out_degree || callees.length,
      isCenter: true,
      isInbound: false,
      isOutbound: false,
      isImport: false,
      rawNode: activeNode,
    });

    // Extract callers & callees from both API calls and topology edges
    const inboundNames = new Set<string>();
    callers.forEach((c) => {
      if (c.caller) inboundNames.add(c.caller);
    });
    topology.edges.forEach((e) => {
      const s = (e as any).source ?? (e as any).src;
      const d = (e as any).target ?? (e as any).dst;
      if (d === activeNode.id || d === activeNode.name) {
        const srcNode = nodeLookup.get(s);
        if (srcNode) inboundNames.add(srcNode.name);
      }
    });

    const outboundNames = new Set<string>();
    callees.forEach((c) => {
      if (c.callee) outboundNames.add(c.callee);
    });
    topology.edges.forEach((e) => {
      const s = (e as any).source ?? (e as any).src;
      const d = (e as any).target ?? (e as any).dst;
      if (s === activeNode.id || s === activeNode.name) {
        const dstNode = nodeLookup.get(d);
        if (dstNode) outboundNames.add(dstNode.name);
      }
    });

    const isAllMode = activeHop === 'all';
    const isTwoHop = activeHop === 2;

    // Place Inbound Callers on the Left
    const callerArr = Array.from(inboundNames).slice(0, isAllMode ? 100 : isTwoHop ? 16 : 8);
    callerArr.forEach((cName, idx) => {
      const raw = nodeLookup.get(cName);
      const targetY = height / 2 + (idx - (callerArr.length - 1) / 2) * (isAllMode ? 46 : 62);
      const targetX = Math.max(90, width / 2 - (isAllMode ? 320 : 250));
      const col = raw?.comm_color || KIND_COLOR_MAP[raw?.kind || 'function'] || '#38bdf8';

      nodesMap.set(cName, {
        id: raw?.id || cName,
        name: cName,
        kind: raw?.kind || 'function',
        filePath: raw?.file_path || '',
        startLine: raw?.start_line,
        endLine: raw?.end_line,
        x: targetX,
        y: targetY,
        radius: 15,
        color: col,
        community: raw?.comm_name || 'Caller',
        inDegree: raw?.in_degree || 1,
        outDegree: raw?.out_degree || 1,
        isCenter: false,
        isInbound: true,
        isOutbound: false,
        isImport: false,
        isSubNode: raw?.kind === 'method' || raw?.kind === 'function',
        rawNode: raw,
      });

      if (filterEdges.CALLS) {
        edgesList.push({
          from: cName,
          to: centerKey,
          type: 'CALLS',
          color: '#38bdf8',
        });
      }
    });

    // Place Outbound Callees on the Right
    const calleeArr = Array.from(outboundNames).slice(0, isAllMode ? 100 : isTwoHop ? 16 : 8);
    calleeArr.forEach((cName, idx) => {
      const raw = nodeLookup.get(cName);
      const targetY = height / 2 + (idx - (calleeArr.length - 1) / 2) * (isAllMode ? 46 : 62);
      const targetX = Math.min(width - 90, width / 2 + (isAllMode ? 320 : 250));
      const col = raw?.comm_color || KIND_COLOR_MAP[raw?.kind || 'function'] || '#a855f7';

      nodesMap.set(cName, {
        id: raw?.id || cName,
        name: cName,
        kind: raw?.kind || 'function',
        filePath: raw?.file_path || '',
        startLine: raw?.start_line,
        endLine: raw?.end_line,
        x: targetX,
        y: targetY,
        radius: 15,
        color: col,
        community: raw?.comm_name || 'Callee',
        inDegree: raw?.in_degree || 1,
        outDegree: raw?.out_degree || 1,
        isCenter: false,
        isInbound: false,
        isOutbound: true,
        isImport: false,
        isSubNode: raw?.kind === 'method' || raw?.kind === 'function',
        rawNode: raw,
      });

      if (filterEdges.CALLS) {
        edgesList.push({
          from: centerKey,
          to: cName,
          type: 'CALLS',
          color: '#a855f7',
        });
      }
    });

    // Extract and Place Imports Nodes at the Top
    const importItems: { id: string; name: string; module: string; file_path?: string; line?: number }[] = [];
    const seenImports = new Set<string>();

    imports.forEach((imp) => {
      const impKey = imp.name ? `${imp.name}` : imp.module;
      if (!seenImports.has(impKey) && impKey !== centerKey) {
        seenImports.add(impKey);
        importItems.push({
          id: `imp_${impKey}`,
          name: impKey,
          module: imp.module,
          file_path: imp.file_path,
          line: imp.line_number,
        });
      }
    });

    topology.edges.forEach((e) => {
      const relType = (e.type || '').toUpperCase();
      if (relType === 'IMPORTS') {
        const s = (e as any).source ?? (e as any).src;
        const d = (e as any).target ?? (e as any).dst;
        const sName = nodeLookup.get(s)?.name || s;
        const dName = nodeLookup.get(d)?.name || d;
        if ((s === activeNode.id || s === activeNode.name || sName === activeNode.name) && dName !== centerKey) {
          if (!seenImports.has(dName)) {
            seenImports.add(dName);
            const raw = nodeLookup.get(d);
            importItems.push({
              id: raw?.id || `imp_${dName}`,
              name: dName,
              module: dName,
              file_path: raw?.file_path,
              line: raw?.start_line,
            });
          }
        }
      }
    });

    if (filterEdges.IMPORTS) {
      const importArr = importItems.slice(0, isAllMode ? 100 : isTwoHop ? 16 : 8);
      importArr.forEach((imp, idx) => {
        const raw = nodeLookup.get(imp.name) || nodeLookup.get(imp.module);
        const count = importArr.length;
        const spreadWidth = Math.min(width - 240, Math.max(220, count * (isAllMode ? 85 : 105)));
        const targetX = width / 2 + (count > 1 ? (idx / (count - 1) - 0.5) * spreadWidth : 0);
        const arcOffset = count > 2 ? Math.sin((idx / (count - 1)) * Math.PI) * 26 : 0;
        const targetY = Math.max(75, height / 2 - (isAllMode ? 220 : 180) - arcOffset);

        nodesMap.set(imp.name, {
          id: imp.id,
          name: imp.name,
          kind: raw?.kind || 'module',
          filePath: imp.file_path || raw?.file_path || '',
          startLine: imp.line || raw?.start_line,
          endLine: raw?.end_line,
          x: targetX,
          y: targetY,
          radius: 14,
          color: '#10b981',
          community: raw?.comm_name || 'Imported Module',
          inDegree: raw?.in_degree || 1,
          outDegree: raw?.out_degree || 0,
          isCenter: false,
          isInbound: false,
          isOutbound: false,
          isImport: true,
          isSubNode: false,
          rawNode: raw,
        });

        edgesList.push({
          from: centerKey,
          to: imp.name,
          type: 'IMPORTS',
          color: '#10b981',
        });
      });
    }

    // 2-Hop / All Expansion Nodes
    if (isAllMode) {
      // In "All" mode: EVERY node and sub-node in the repository appears!
      const commMap = new Map<number, GlobeNode[]>();
      topology.nodes.forEach((n) => {
        if (!nodesMap.has(n.name)) {
          const cId = n.comm ?? 0;
          if (!commMap.has(cId)) commMap.set(cId, []);
          commMap.get(cId)!.push(n);
        }
      });

      const totalComms = Math.max(1, commMap.size);
      let commIdx = 0;

      commMap.forEach((cNodes) => {
        // Position community clusters in an elliptical orbit around the center
        const commAngle = (commIdx / totalComms) * 2 * Math.PI - Math.PI / 2;
        const clusterDist = Math.max(300, Math.min(width, height) * 0.44);
        const clusterCenterX = width / 2 + Math.cos(commAngle) * clusterDist;
        const clusterCenterY = height / 2 + Math.sin(commAngle) * (clusterDist * 0.76);

        cNodes.forEach((n, localIdx) => {
          // Sub-nodes arranged in expanding concentric rings around their cluster center
          const ringIndex = Math.floor(Math.sqrt(localIdx));
          const itemsInRing = Math.max(4, ringIndex * 6);
          const ringPos = localIdx - ringIndex * ringIndex;
          const ringRadius = 40 + ringIndex * 34;
          const localAngle = (ringPos / itemsInRing) * 2 * Math.PI;

          const nodeX = clusterCenterX + Math.cos(localAngle) * ringRadius;
          const nodeY = clusterCenterY + Math.sin(localAngle) * (ringRadius * 0.85);

          const col = n.comm_color || KIND_COLOR_MAP[n.kind] || '#38bdf8';
          const isSubNode =
            n.kind === 'method' ||
            n.kind === 'function' ||
            n.kind === 'type' ||
            (Boolean(n.signature) && n.signature.includes('('));

          nodesMap.set(n.name, {
            id: n.id,
            name: n.name,
            kind: n.kind,
            filePath: n.file_path,
            startLine: n.start_line,
            endLine: n.end_line,
            x: nodeX,
            y: nodeY,
            radius: n.kind === 'class' || n.kind === 'module' ? 16 : isSubNode ? 10 : 13,
            color: col,
            community: n.comm_name || 'Subsystem',
            inDegree: n.in_degree || 1,
            outDegree: n.out_degree || 1,
            isCenter: false,
            isInbound: false,
            isOutbound: false,
            isImport: n.kind === 'module' && (n.file_path?.startsWith('external') || n.file_path?.startsWith('stdlib')),
            isSubNode: isSubNode,
            rawNode: n,
          });
        });
        commIdx++;
      });
    } else if (isTwoHop) {
      // 2-Hop expansion
      const limit = 40;
      let added = 0;
      for (const n of topology.nodes) {
        if (added >= limit) break;
        if (nodesMap.has(n.name)) continue;

        const isConnected = topology.edges.some((e) => {
          const s = (e as any).source ?? (e as any).src;
          const d = (e as any).target ?? (e as any).dst;
          const sName = nodeLookup.get(s)?.name || s;
          const dName = nodeLookup.get(d)?.name || d;
          return (sName === n.name && nodesMap.has(dName)) || (dName === n.name && nodesMap.has(sName));
        });

        if (isConnected) {
          const angle = (added / limit) * Math.PI * 2;
          const dist = 310;
          nodesMap.set(n.name, {
            id: n.id,
            name: n.name,
            kind: n.kind,
            filePath: n.file_path,
            startLine: n.start_line,
            endLine: n.end_line,
            x: width / 2 + Math.cos(angle) * dist,
            y: height / 2 + Math.sin(angle) * (dist * 0.72),
            radius: 12,
            color: n.comm_color || KIND_COLOR_MAP[n.kind] || '#34d399',
            community: n.comm_name,
            inDegree: n.in_degree || 1,
            outDegree: n.out_degree || 1,
            isCenter: false,
            isInbound: false,
            isOutbound: false,
            isImport: false,
            isSubNode: n.kind === 'method' || n.kind === 'function',
            rawNode: n,
          });
          added++;
        }
      }
    }

    // Connect edges between all active nodes on canvas
    if (isTwoHop || isAllMode) {
      topology.edges.forEach((e) => {
        const s = (e as any).source ?? (e as any).src;
        const d = (e as any).target ?? (e as any).dst;
        const sName = nodeLookup.get(s)?.name || s;
        const dName = nodeLookup.get(d)?.name || d;
        const relType = (e.type || 'CALLS').toUpperCase();

        if (filterEdges[relType] && nodesMap.has(sName) && nodesMap.has(dName)) {
          if (!edgesList.some((ex) => ex.from === sName && ex.to === dName)) {
            edgesList.push({
              from: sName,
              to: dName,
              type: relType,
              color: EDGE_COLOR_MAP[relType] || '#38bdf8',
            });
          }
        }
      });
    }

    const currentNodes = Array.from(nodesMap.values());
    simNodesRef.current = currentNodes;

    // ResizeObserver ensures canvas always matches container exactly
    const resizeCanvas = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w > 0 && h > 0) {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.floor(w * dpr);
        canvas.height = Math.floor(h * dpr);
      }
    };
    resizeCanvas();

    const resizeObserver = new ResizeObserver(resizeCanvas);
    resizeObserver.observe(container);

    // Coordinate conversion considering pan and zoom
    const getCanvasPoint = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      const rawX = clientX - rect.left;
      const rawY = clientY - rect.top;
      return {
        x: (rawX - (rect.width / 2 + pan.x)) / zoom + rect.width / 2,
        y: (rawY - (rect.height / 2 + pan.y)) / zoom + rect.height / 2,
      };
    };

    // Pointer Events
    const handleMouseDown = (e: MouseEvent) => {
      pointerStart = { x: e.clientX, y: e.clientY };
      hasMoved = false;

      const pt = getCanvasPoint(e.clientX, e.clientY);
      const hit = simNodesRef.current.find((n) => {
        const dx = n.x - pt.x;
        const dy = n.y - pt.y;
        return Math.sqrt(dx * dx + dy * dy) <= n.radius + 6;
      });

      if (hit) {
        isDraggingNode = true;
        draggedNode = hit;
      } else {
        isPanning = true;
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - pointerStart.x;
      const dy = e.clientY - pointerStart.y;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) hasMoved = true;

      if (isDraggingNode && draggedNode) {
        const pt = getCanvasPoint(e.clientX, e.clientY);
        draggedNode.x = pt.x;
        draggedNode.y = pt.y;
      } else if (isPanning) {
        setPan((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
        pointerStart = { x: e.clientX, y: e.clientY };
      } else {
        const pt = getCanvasPoint(e.clientX, e.clientY);
        const hovering = simNodesRef.current.some((n) => {
          const ndx = n.x - pt.x;
          const ndy = n.y - pt.y;
          return Math.sqrt(ndx * ndx + ndy * ndy) <= n.radius + 6;
        });
        canvas.style.cursor = hovering ? 'pointer' : 'grab';
      }
    };

    const handleMouseUp = () => {
      if (isDraggingNode && draggedNode && !hasMoved) {
        // Click on node -> focus it!
        if (draggedNode.rawNode) {
          setSelectedNode(draggedNode.rawNode);
        } else {
          const found = nodeLookup.get(draggedNode.name);
          if (found) {
            setSelectedNode(found);
          } else {
            // For import nodes that might not have a rawNode yet, create a synthetic GlobeNode
            setSelectedNode({
              id: draggedNode.id,
              name: draggedNode.name,
              kind: draggedNode.kind,
              file_path: draggedNode.filePath,
              start_line: draggedNode.startLine || 1,
              end_line: draggedNode.endLine || 1,
              language: 'python',
              in_degree: draggedNode.inDegree,
              out_degree: draggedNode.outDegree,
              comm: 0,
              comm_name: draggedNode.community,
              comm_color: draggedNode.color,
              importance: 0.8,
              signature: `import ${draggedNode.name}`,
            });
          }
        }
      }
      isDraggingNode = false;
      isPanning = false;
      draggedNode = null;
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
      setZoom((prev) => Math.min(2.5, Math.max(0.4, prev * zoomFactor)));
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('wheel', handleWheel, { passive: false });

    // 60 FPS Render loop
    const render = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;

      if (w <= 0 || h <= 0) {
        animId = requestAnimationFrame(render);
        return;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, w, h);

      // Apply pan & zoom relative to center
      ctx.translate(w / 2 + pan.x, h / 2 + pan.y);
      ctx.scale(zoom, zoom);
      ctx.translate(-w / 2, -h / 2);

      // 1. Grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1;
      const step = 44;
      for (let x = -600; x < w + 600; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, -600);
        ctx.lineTo(x, h + 600);
        ctx.stroke();
      }
      for (let y = -600; y < h + 600; y += step) {
        ctx.beginPath();
        ctx.moveTo(-600, y);
        ctx.lineTo(w + 600, y);
        ctx.stroke();
      }

      // 2. Render Edges & Animated Light Particles
      edgesList.forEach((edge, idx) => {
        const source = nodesMap.get(edge.from);
        const target = nodesMap.get(edge.to);
        if (!source || !target) return;

        const isIncident = edge.from === activeNode.name || edge.to === activeNode.name;
        const isImportEdge = edge.type === 'IMPORTS';

        ctx.strokeStyle = isIncident ? edge.color : 'rgba(100, 116, 139, 0.25)';
        ctx.lineWidth = isIncident ? (isImportEdge ? 2.0 : 2.2) : 1.0;

        if (isImportEdge) {
          ctx.setLineDash([5, 4]); // Dashed line for import dependencies
        } else {
          ctx.setLineDash([]);
        }

        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        ctx.lineTo(target.x, target.y);
        ctx.stroke();
        ctx.setLineDash([]); // Reset line dash for arrowheads and nodes

        // Arrowhead pointing in the direction of call/import
        const headlen = 7;
        const angle = Math.atan2(target.y - source.y, target.x - source.x);
        const tipDist = target.radius + 3;
        const tipX = target.x - tipDist * Math.cos(angle);
        const tipY = target.y - tipDist * Math.sin(angle);

        ctx.fillStyle = isIncident ? edge.color : 'rgba(100, 116, 139, 0.4)';
        ctx.beginPath();
        ctx.moveTo(tipX, tipY);
        ctx.lineTo(tipX - headlen * Math.cos(angle - Math.PI / 7), tipY - headlen * Math.sin(angle - Math.PI / 7));
        ctx.lineTo(tipX - headlen * Math.cos(angle + Math.PI / 7), tipY - headlen * Math.sin(angle + Math.PI / 7));
        ctx.closePath();
        ctx.fill();

        // Directional animated pulse particles
        if (animRunning && isIncident) {
          const t = (animOffset * 0.015 + idx * 0.25) % 1;
          const px = source.x + (target.x - source.x) * t;
          const py = source.y + (target.y - source.y) * t;
          ctx.beginPath();
          ctx.arc(px, py, 3.5, 0, Math.PI * 2);
          ctx.fillStyle = edge.color;
          ctx.shadowColor = edge.color;
          ctx.shadowBlur = 8;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      });

      // 3. Render Nodes
      currentNodes.forEach((node) => {
        const isCenter = node.isCenter;
        const isNeighbor = node.isInbound || node.isOutbound;
        const isImport = node.isImport;

        // Radiant halo for central node or subtle glow for import node
        if (isCenter) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius + 10, 0, Math.PI * 2);
          ctx.fillStyle = `${node.color}33`;
          ctx.fill();
        } else if (isImport) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius + 6, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(16, 185, 129, 0.16)';
          ctx.fill();
        }

        // Main node body
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = isCenter
          ? node.color
          : isImport
          ? 'rgba(16, 185, 129, 0.22)'
          : isNeighbor
          ? `${node.color}dd`
          : '#1e293b';
        ctx.fill();

        ctx.strokeStyle = isCenter ? '#ffffff' : isImport ? '#10b981' : node.color;
        ctx.lineWidth = isCenter ? 2.5 : isImport ? 2.0 : 1.8;
        if (isImport) {
          ctx.setLineDash([3, 3]);
        } else {
          ctx.setLineDash([]);
        }
        ctx.stroke();
        ctx.setLineDash([]);

        // Node Label
        ctx.font = isCenter ? 'bold 12px monospace' : isImport ? '600 11px monospace' : '11px monospace';
        ctx.fillStyle = isCenter ? '#ffffff' : isImport ? '#34d399' : isNeighbor ? '#f1f5f9' : '#94a3b8';
        const label = node.name;
        const textWidth = ctx.measureText(label).width;
        ctx.fillText(label, node.x - textWidth / 2, node.y + node.radius + 15);

        // Subtitle badge
        if (isCenter || isNeighbor || isImport || node.isSubNode || activeHop === 'all') {
          ctx.font = '9px sans-serif';
          ctx.fillStyle = isCenter
            ? node.color
            : isImport
            ? '#10b981'
            : node.isSubNode
            ? '#c084fc'
            : 'rgba(255, 255, 255, 0.6)';
          const sub = isCenter
            ? 'ACTIVE FOCUS'
            : isImport
            ? 'IMPORTS'
            : node.isInbound
            ? 'CALLS THIS'
            : node.isOutbound
            ? 'INVOKED BY THIS'
            : node.isSubNode
            ? (node.kind ? node.kind.toUpperCase() : 'SUB-NODE')
            : (node.kind ? node.kind.toUpperCase() : 'NODE');
          const subWidth = ctx.measureText(sub).width;
          ctx.fillText(sub, node.x - subWidth / 2, node.y - node.radius - 6);
        }
      });

      ctx.restore();

      if (animRunning) {
        animOffset += 1;
      }
      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('wheel', handleWheel);
    };
  }, [topology, selectedNode, callers, callees, imports, activeHop, filterEdges, animRunning, pan, zoom]);

  return (
    <div className="graph2d-page-layout">
      {/* 1. LEFT PANEL: SEARCH & LIVE EDGE FILTERS */}
      <aside className="graph2d-left-panel">
        <div className="panel-header">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-base">hub</span>
            <span className="panel-title">Graph Explorer</span>
          </div>
          <span className="text-xs text-outline">{topology.nodes.length} nodes</span>
        </div>

        <div className="panel-scrollable">
          {/* Quick Search */}
          <div className="filter-section">
            <div className="search-box">
              <span className="material-symbols-outlined text-xs text-outline">search</span>
              <input
                type="text"
                placeholder="Find symbol..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              {searchQuery && (
                <button className="clear-btn" onClick={() => setSearchQuery('')}>
                  ✕
                </button>
              )}
            </div>

            {filteredSymbols.length > 0 && (
              <div className="search-dropdown">
                {filteredSymbols.map((s) => (
                  <div
                    key={s.id}
                    className="search-item"
                    onClick={() => {
                      setSelectedNode(s);
                      setSearchQuery('');
                      handleRecenter();
                    }}
                  >
                    <span className="font-semibold text-primary truncate">{s.name}</span>
                    <span className="text-[10px] text-outline truncate">{s.file_path}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Hop Radius Depth */}
          <div className="filter-section">
            <span className="filter-title">Neighborhood Depth</span>
            <div className="hop-pill-group">
              <button
                className={`hop-pill ${activeHop === 1 ? 'hop-pill-active' : ''}`}
                onClick={() => {
                  setActiveHop(1);
                  setZoom(1.0);
                  setPan({ x: 0, y: 0 });
                }}
              >
                1-Hop
              </button>
              <button
                className={`hop-pill ${activeHop === 2 ? 'hop-pill-active' : ''}`}
                onClick={() => {
                  setActiveHop(2);
                  setZoom(0.85);
                  setPan({ x: 0, y: 0 });
                }}
              >
                2-Hop
              </button>
              <button
                className={`hop-pill ${activeHop === 'all' ? 'hop-pill-active' : ''}`}
                onClick={() => {
                  setActiveHop('all');
                  setZoom(0.68);
                  setPan({ x: 0, y: 0 });
                  fetchTopology('all');
                }}
              >
                All
              </button>
            </div>
          </div>

          {/* Edge Filter Checkboxes with Real Live Counts */}
          <div className="filter-section">
            <span className="filter-title">Edge Filters</span>
            <div className="flex flex-col gap-2 mt-2">
              <label className="filter-row">
                <input
                  type="checkbox"
                  checked={filterEdges.CALLS}
                  onChange={(e) => setFilterEdges({ ...filterEdges, CALLS: e.target.checked })}
                  className="accent-sky-500"
                />
                <span className="color-dot bg-sky-400" />
                <span className="filter-label">Calls</span>
                <span className="filter-count text-sky-400">{edgeCounts.CALLS || 0}</span>
              </label>

              <label className="filter-row">
                <input
                  type="checkbox"
                  checked={filterEdges.IMPORTS}
                  onChange={(e) => setFilterEdges({ ...filterEdges, IMPORTS: e.target.checked })}
                  className="accent-emerald-500"
                />
                <span className="color-dot bg-emerald-400" />
                <span className="filter-label">Imports</span>
                <span className="filter-count text-emerald-400">{edgeCounts.IMPORTS || 0}</span>
              </label>

              <label className="filter-row">
                <input
                  type="checkbox"
                  checked={filterEdges.DEFINES}
                  onChange={(e) => setFilterEdges({ ...filterEdges, DEFINES: e.target.checked })}
                  className="accent-purple-500"
                />
                <span className="color-dot bg-purple-400" />
                <span className="filter-label">Defines</span>
                <span className="filter-count text-purple-400">{edgeCounts.DEFINES || 0}</span>
              </label>

              <label className="filter-row">
                <input
                  type="checkbox"
                  checked={filterEdges.SIMILAR_TO}
                  onChange={(e) => setFilterEdges({ ...filterEdges, SIMILAR_TO: e.target.checked })}
                  className="accent-pink-500"
                />
                <span className="color-dot bg-pink-400" />
                <span className="filter-label">Similar To</span>
                <span className="filter-count text-pink-400">{edgeCounts.SIMILAR_TO || 0}</span>
              </label>
            </div>
          </div>

          {/* Subsystem Communities (Live from DB) */}
          <div className="filter-section">
            <span className="filter-title">Communities (Louvain)</span>
            <div className="flex flex-col gap-1.5 mt-2">
              {(topology.communities || []).slice(0, 6).map((c: GlobeCommunity) => (
                <div
                  key={c.id}
                  className="community-item"
                  onClick={() => {
                    const firstMember = topology.nodes.find((n) => n.comm === c.id);
                    if (firstMember) {
                      setSelectedNode(firstMember);
                      handleRecenter();
                    }
                  }}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }} />
                    <span className="text-xs truncate">{c.name}</span>
                  </div>
                  <span className="text-[10px] text-outline font-mono">{c.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* 2. CENTER CANVAS: DEDICATED 2D INTERACTIVE GRAPH */}
      <main ref={containerRef} className="graph2d-viewport">
        <canvas ref={canvasRef} className="graph2d-canvas" />

        {/* Top Floating HUD Bar */}
        <div className="canvas-hud">
          <div className="hud-metric-pill">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold text-white">2D Code Graph</span>
            <span className="text-xs text-outline font-mono">
              {topology.total_nodes ?? topology.nodes.length} Nodes • {topology.total_edges ?? topology.edges.length} Edges
            </span>
            {isOffline && (
              <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded flex items-center gap-1.5">
                <span>Sample Mode (Backend Offline)</span>
                <button
                  onClick={() => {
                    fastAstApi.getGlobeTopology({ maxNodes: 200 }).then((data) => {
                      if (data?.nodes?.length) {
                        setTopology(data);
                        setSelectedNode(data.nodes[0]);
                        setIsOffline(false);
                      }
                    });
                  }}
                  className="underline hover:text-white font-semibold cursor-pointer"
                  title="Retry fetching live topology"
                >
                  Retry
                </button>
              </span>
            )}
          </div>

          <div className="hud-actions">
            <button
              className="hud-btn"
              onClick={() => setAnimRunning(!animRunning)}
              title="Toggle edge particle flow animation"
            >
              <span className="material-symbols-outlined text-sm">{animRunning ? 'pause' : 'play_arrow'}</span>
              <span>{animRunning ? 'Pause' : 'Play'}</span>
            </button>
            <button className="hud-btn" onClick={handleRecenter} title="Recenter graph view">
              <span className="material-symbols-outlined text-sm">center_focus_strong</span>
              <span>Recenter</span>
            </button>
          </div>
        </div>

        {/* Bottom Hint */}
        <div className="canvas-hint">
          <span className="material-symbols-outlined text-xs text-primary">mouse</span>
          <span>Click node to focus callers/callees • Drag node to rearrange • Scroll to zoom • Drag background to pan</span>
        </div>
      </main>

      {/* 3. RIGHT INSPECTOR PANEL: FOCUSED SYMBOL DETAILS */}
      <aside className="graph2d-right-panel">
        <div className="panel-header">
          <span className="panel-title">Symbol Inspector</span>
          <span className="kind-badge uppercase">{selectedNode.kind || 'SYMBOL'}</span>
        </div>

        <div className="panel-scrollable">
          {/* Symbol Hero Card */}
          <div className="inspector-card">
            <div className="text-sm font-bold font-mono text-white break-all">{selectedNode.name}</div>
            <div className="text-xs font-mono text-outline mt-1 break-all">
              {selectedNode.file_path}:{selectedNode.start_line || 1}
            </div>

            <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-[var(--hairline)]">
              <div className="stat-box">
                <span className="stat-label">In-Degree</span>
                <span className="stat-val text-sky-400 font-mono">{selectedNode.in_degree || callers.length}</span>
              </div>
              <div className="stat-box">
                <span className="stat-label">Out-Degree</span>
                <span className="stat-val text-purple-400 font-mono">{selectedNode.out_degree || callees.length}</span>
              </div>
            </div>

            <div className="mt-3 text-xs flex items-center justify-between text-outline">
              <span>Subsystem:</span>
              <span className="font-semibold text-primary">{selectedNode.comm_name || 'Core'}</span>
            </div>
          </div>

          {/* Inbound Callers List */}
          <div className="edge-group-section">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-sky-400">Inbound Callers ({callers.length})</span>
              <span className="text-[10px] text-outline font-mono">SQLite Edges</span>
            </div>

            {isLoadingCalls ? (
              <div className="text-xs text-outline py-2">Loading callers...</div>
            ) : callers.length > 0 ? (
              <div className="flex flex-col gap-1.5">
                {callers.map((c, idx) => {
                  const cName = c.caller || 'caller';
                  return (
                    <div
                      key={idx}
                      className="edge-node-row"
                      onClick={() => {
                        const target = topology.nodes.find((n) => n.name === cName || n.id === cName);
                        if (target) {
                          setSelectedNode(target);
                          handleRecenter();
                        } else {
                          onNavigateToExplore?.(cName, c.file_path);
                        }
                      }}
                      title={`Focus ${cName}`}
                    >
                      <div className="truncate">
                        <span className="text-xs font-mono text-sky-300 font-semibold truncate block">
                          ← {cName}
                        </span>
                        <span className="text-[10px] text-outline truncate block">
                          {c.file_path ? c.file_path.split('/').pop() : ''}:{c.line_number || 1}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-xs text-outline italic py-1">No inbound callers recorded</div>
            )}
          </div>

          {/* Outbound Callees List */}
          <div className="edge-group-section">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-purple-400">Outbound Callees ({callees.length})</span>
              <span className="text-[10px] text-outline font-mono">SQLite Edges</span>
            </div>

            {isLoadingCalls ? (
              <div className="text-xs text-outline py-2">Loading callees...</div>
            ) : callees.length > 0 ? (
              <div className="flex flex-col gap-1.5">
                {callees.map((c, idx) => {
                  const cName = c.callee || 'callee';
                  return (
                    <div
                      key={idx}
                      className="edge-node-row"
                      onClick={() => {
                        const target = topology.nodes.find((n) => n.name === cName || n.id === cName);
                        if (target) {
                          setSelectedNode(target);
                          handleRecenter();
                        } else {
                          onNavigateToExplore?.(cName, c.file_path);
                        }
                      }}
                      title={`Focus ${cName}`}
                    >
                      <div className="truncate">
                        <span className="text-xs font-mono text-purple-300 font-semibold truncate block">
                          → {cName}
                        </span>
                        <span className="text-[10px] text-outline truncate block">
                          {c.file_path ? c.file_path.split('/').pop() : ''}:{c.line_number || 1}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-xs text-outline italic py-1">No outbound callees recorded</div>
            )}
          </div>

          {/* Imported Dependencies List */}
          <div className="edge-group-section">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-emerald-400">Imported Dependencies ({imports.length})</span>
              <span className="text-[10px] text-outline font-mono">Imports Table</span>
            </div>

            {isLoadingCalls ? (
              <div className="text-xs text-outline py-2">Loading imports...</div>
            ) : imports.length > 0 ? (
              <div className="flex flex-col gap-1.5 max-h-[190px] overflow-y-auto pr-1">
                {imports.map((imp, idx) => {
                  const label = imp.name ? `${imp.name} (${imp.module})` : imp.module;
                  return (
                    <div
                      key={idx}
                      className="edge-node-row edge-node-row-import"
                      onClick={() => {
                        const target = topology.nodes.find(
                          (n) => n.name === (imp.name || imp.module) || n.name === imp.module
                        );
                        if (target) {
                          setSelectedNode(target);
                          handleRecenter();
                        } else {
                          onNavigateToExplore?.(imp.name || imp.module, imp.file_path);
                        }
                      }}
                      title={`Inspect ${label}`}
                    >
                      <div className="truncate">
                        <span className="text-xs font-mono text-emerald-300 font-semibold truncate block">
                          ⇲ {label}
                        </span>
                        <span className="text-[10px] text-outline truncate block">
                          {imp.file_path ? imp.file_path.split('/').pop() : ''}:{imp.line_number || 1}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-xs text-outline italic py-1">No imports recorded for this symbol</div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="mt-auto pt-4 flex flex-col gap-2">
            <button
              className="action-btn action-btn-primary"
              onClick={() => onNavigateToExplore?.(selectedNode.name, selectedNode.file_path)}
            >
              <span className="material-symbols-outlined text-sm">code</span>
              <span>Open in Code Explorer</span>
            </button>

            <button className="action-btn action-btn-secondary" onClick={handleCopyBundle}>
              <span className="material-symbols-outlined text-sm">content_copy</span>
              <span>{copiedBundle ? 'Copied Bundle!' : 'Copy LLM Evidence Bundle'}</span>
            </button>
          </div>
        </div>
      </aside>

      <style>{`
        .graph2d-page-layout {
          position: relative;
          width: 100%;
          height: calc(100vh - 56px);
          display: flex;
          background: #080b11;
          color: var(--on-surface);
          overflow: hidden;
        }

        /* 1. Left Panel */
        .graph2d-left-panel {
          width: 280px;
          flex-shrink: 0;
          height: 100%;
          background: var(--surface-low);
          border-right: 1px solid var(--hairline);
          display: flex;
          flex-direction: column;
          z-index: 20;
        }
        .panel-header {
          height: 48px;
          padding: 0 16px;
          border-bottom: 1px solid var(--hairline);
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: var(--surface);
          flex-shrink: 0;
        }
        .panel-title {
          font-size: 13px;
          font-weight: 700;
          letter-spacing: -0.01em;
        }
        .panel-scrollable {
          flex: 1;
          overflow-y: auto;
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .filter-section {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .filter-title {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--outline);
        }

        /* Search */
        .search-box {
          position: relative;
          display: flex;
          align-items: center;
          background: var(--surface);
          border: 1px solid var(--hairline);
          border-radius: 6px;
          padding: 6px 8px;
          gap: 6px;
        }
        .search-input {
          background: transparent;
          border: none;
          color: var(--on-surface);
          font-size: 12px;
          outline: none;
          width: 100%;
        }
        .clear-btn {
          color: var(--outline);
          font-size: 11px;
          cursor: pointer;
          background: none;
          border: none;
        }
        .search-dropdown {
          margin-top: 4px;
          background: var(--surface);
          border: 1px solid var(--hairline);
          border-radius: 6px;
          max-height: 180px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
        }
        .search-item {
          padding: 6px 10px;
          cursor: pointer;
          border-bottom: 1px solid var(--hairline);
          display: flex;
          flex-direction: column;
          transition: background 0.15s;
        }
        .search-item:hover {
          background: var(--surface-high);
        }

        /* Hop Pills */
        .hop-pill-group {
          display: flex;
          background: var(--surface);
          border: 1px solid var(--hairline);
          border-radius: 6px;
          padding: 2px;
          gap: 2px;
        }
        .hop-pill {
          flex: 1;
          padding: 4px 8px;
          font-size: 11px;
          font-weight: 600;
          border-radius: 4px;
          background: transparent;
          border: none;
          color: var(--outline);
          cursor: pointer;
          transition: all 0.15s;
        }
        .hop-pill-active {
          background: var(--primary);
          color: #080b11;
        }

        /* Filter Rows */
        .filter-row {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          cursor: pointer;
          padding: 2px 0;
        }
        .color-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .filter-label {
          flex: 1;
          color: var(--on-surface);
        }
        .filter-count {
          font-family: var(--font-mono);
          font-size: 11px;
        }

        /* Community rows */
        .community-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 5px 8px;
          border-radius: 4px;
          background: var(--surface);
          cursor: pointer;
          transition: background 0.15s;
        }
        .community-item:hover {
          background: var(--surface-high);
        }

        /* 2. Center Canvas Viewport */
        .graph2d-viewport {
          position: relative;
          flex: 1;
          height: 100%;
          background: #080b11;
          overflow: hidden;
        }
        .graph2d-canvas {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          touch-action: none;
        }
        .canvas-hud {
          position: absolute;
          top: 14px;
          left: 18px;
          right: 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          pointer-events: none;
          z-index: 10;
        }
        .hud-metric-pill {
          pointer-events: auto;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 14px;
          background: rgba(15, 23, 42, 0.85);
          border: 1px solid var(--hairline);
          border-radius: 20px;
          backdrop-filter: blur(8px);
        }
        .hud-actions {
          pointer-events: auto;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .hud-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: rgba(15, 23, 42, 0.85);
          border: 1px solid var(--hairline);
          border-radius: 6px;
          color: var(--on-surface);
          font-size: 12px;
          cursor: pointer;
          backdrop-filter: blur(8px);
          transition: background 0.15s;
        }
        .hud-btn:hover {
          background: var(--surface-high);
        }
        .canvas-hint {
          position: absolute;
          bottom: 14px;
          left: 18px;
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 5px 12px;
          background: rgba(15, 23, 42, 0.85);
          border: 1px solid var(--hairline);
          border-radius: 6px;
          font-size: 11px;
          color: var(--outline);
          backdrop-filter: blur(8px);
          pointer-events: none;
          z-index: 10;
        }

        /* 3. Right Inspector Panel */
        .graph2d-right-panel {
          width: 320px;
          flex-shrink: 0;
          height: 100%;
          background: var(--surface-low);
          border-left: 1px solid var(--hairline);
          display: flex;
          flex-direction: column;
          z-index: 20;
        }
        .kind-badge {
          font-family: var(--font-mono);
          font-size: 10px;
          font-weight: 600;
          padding: 2px 6px;
          border-radius: 4px;
          background: rgba(56, 189, 248, 0.15);
          color: #38bdf8;
          border: 1px solid rgba(56, 189, 248, 0.3);
        }
        .inspector-card {
          background: var(--surface);
          border: 1px solid var(--hairline);
          border-radius: 8px;
          padding: 12px;
        }
        .stat-box {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .stat-label {
          font-size: 10px;
          text-transform: uppercase;
          color: var(--outline);
        }
        .stat-val {
          font-size: 14px;
          font-weight: 700;
        }
        .edge-group-section {
          background: var(--surface);
          border: 1px solid var(--hairline);
          border-radius: 8px;
          padding: 12px;
        }
        .edge-node-row {
          padding: 6px 8px;
          border-radius: 4px;
          background: var(--surface-lowest);
          border: 1px solid var(--hairline);
          cursor: pointer;
          transition: all 0.15s;
        }
        .edge-node-row:hover {
          background: var(--surface-high);
          border-color: rgba(56, 189, 248, 0.4);
        }
        .edge-node-row-import:hover {
          background: rgba(16, 185, 129, 0.08);
          border-color: rgba(16, 185, 129, 0.4);
        }
        .action-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 9px 12px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          border: none;
          transition: all 0.15s;
        }
        .action-btn-primary {
          background: var(--primary);
          color: #080b11;
        }
        .action-btn-primary:hover {
          filter: brightness(1.1);
        }
        .action-btn-secondary {
          background: var(--surface);
          color: var(--on-surface);
          border: 1px solid var(--hairline);
        }
        .action-btn-secondary:hover {
          background: var(--surface-high);
        }
      `}</style>
    </div>
  );
};

