import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { fastAstApi } from '../../services/api';
import type {
  CallGraphEntry,
  GlobeEdge,
  GlobeNode,
  GlobeTopology,
  RepoStats,
  SimilarSymbol,
  SymbolRecord,
} from '../../types';

interface GlobePageProps {
  stats: RepoStats | null;
  onNavigateToExplore?: (symbolName: string, filePath?: string) => void;
}

interface SimNode extends GlobeNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  fx: number | null;
  fy: number | null;
  degree: number;
  radius: number;
}

interface SimEdge {
  id: string;
  source: string;
  target: string;
  type: string;
}

const KIND_COLORS: Record<string, string> = {
  function: '#38bdf8',   // Cyan
  method: '#60a5fa',     // Blue
  class: '#a855f7',      // Purple
  interface: '#f59e0b',  // Amber
  struct: '#f59e0b',     // Amber
  type: '#eab308',       // Yellow
  module: '#10b981',     // Emerald
  file: '#10b981',       // Emerald
  variable: '#94a3b8',   // Slate
};

const COMMUNITY_PALETTE = [
  '#38bdf8',
  '#a855f7',
  '#10b981',
  '#f59e0b',
  '#ec4899',
  '#6366f1',
  '#14b8a6',
  '#f97316',
  '#84cc16',
  '#06b6d4',
];

const EDGE_COLORS: Record<string, string> = {
  CALLS: '#38bdf8',      // Cyan
  IMPORTS: '#10b981',    // Emerald
  DEFINES: '#a855f7',    // Purple
  INHERITS: '#f59e0b',   // Amber
  SIMILAR_TO: '#ec4899', // Pink
};

function getNodeColor(node: GlobeNode, colorBy: 'kind' | 'community'): string {
  if (colorBy === 'community') {
    if (node.comm_color) return node.comm_color;
    if (node.comm !== undefined && node.comm !== null) {
      return COMMUNITY_PALETTE[Math.abs(node.comm) % COMMUNITY_PALETTE.length];
    }
  }
  const k = (node.kind || 'function').toLowerCase();
  return KIND_COLORS[k] || '#38bdf8';
}

function hashString(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export const GlobePage: React.FC<GlobePageProps> = ({
  onNavigateToExplore,
}) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSymbol = searchParams.get('symbol') || '';

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Graph Data & Shared-Space State
  const [topology, setTopology] = useState<GlobeTopology | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [maxNodesLimit, setMaxNodesLimit] = useState<number>(240);

  // Scope filter within the shared graph space ('all' is default first-class view)
  const [hopScope, setHopScope] = useState<'all' | 1 | 2>('all');
  const [selectedNodeId, setSelectedNodeId] = useState<string>(initialSymbol);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  // Simulation controls
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const isPausedRef = useRef<boolean>(false);
  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  const [colorBy, setColorBy] = useState<'kind' | 'community'>('kind');
  const [labelMode, setLabelMode] = useState<'smart' | 'all' | 'focus'>('all');

  // Edge Type Filters
  const [edgeFilters, setEdgeFilters] = useState<Record<string, boolean>>({
    CALLS: true,
    DEFINES: true,
    IMPORTS: true,
    INHERITS: true,
    SIMILAR_TO: true,
  });

  // Node Kind Filters
  const [kindFilters, setKindFilters] = useState<Record<string, boolean>>({
    function: true,
    method: true,
    class: true,
    other: true,
  });

  // Symbol Search in Left Panel
  const [symbolQuery, setSymbolQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<SymbolRecord[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  // Right Inspector Details State
  const [callers, setCallers] = useState<CallGraphEntry[]>([]);
  const [callees, setCallees] = useState<CallGraphEntry[]>([]);
  const [similarSymbols, setSimilarSymbols] = useState<SimilarSymbol[]>([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState<boolean>(false);

  // Physics Simulation Refs (kept in refs for 60fps rendering without React re-render lag)
  const simNodesRef = useRef<SimNode[]>([]);
  const simEdgesRef = useRef<SimEdge[]>([]);
  const nodeMapRef = useRef<Map<string, SimNode>>(new Map());
  const alphaRef = useRef<number>(1.0);

  // Camera / Viewport transform in 2D canvas space
  const cameraRef = useRef<{ x: number; y: number; zoom: number }>({
    x: 0,
    y: 0,
    zoom: 1.0,
  });
  const targetCameraRef = useRef<{ x: number; y: number; zoom: number } | null>(null);

  // Mouse interaction refs
  const dragNodeRef = useRef<SimNode | null>(null);
  const isPanningRef = useRef<boolean>(false);
  const pointerDownPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const lastPointerPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const didDragRef = useRef<boolean>(false);

  // Build or merge nodes/edges into the shared simulation space
  const syncSimulationGraph = useCallback(
    (newNodes: GlobeNode[], newEdges: GlobeEdge[], preservePositions = false) => {
      const existingMap = preservePositions ? nodeMapRef.current : new Map<string, SimNode>();
      const nextMap = new Map<string, SimNode>();

      // Compute degrees
      const degreeCount = new Map<string, number>();
      const dedupedEdges: SimEdge[] = [];
      const seenEdgeKeys = new Set<string>();

      for (const e of newEdges) {
        if (!e.source || !e.target || e.source === e.target) continue;
        const edgeType = (e.type || 'CALLS').toUpperCase();
        const key = `${e.source}->${e.target}:${edgeType}`;
        if (seenEdgeKeys.has(key)) continue;
        seenEdgeKeys.add(key);
        dedupedEdges.push({
          id: key,
          source: e.source,
          target: e.target,
          type: edgeType,
        });
        degreeCount.set(e.source, (degreeCount.get(e.source) || 0) + 1);
        degreeCount.set(e.target, (degreeCount.get(e.target) || 0) + 1);
      }

      // Group communities/files for organic initial seeding
      const groupCenters = new Map<string, { x: number; y: number }>();
      let groupIdx = 0;

      const simNodes: SimNode[] = newNodes.map((n, idx) => {
        const prev = existingMap.get(n.id);
        const deg =
          degreeCount.get(n.id) ?? Math.max(1, (n.in_degree || 0) + (n.out_degree || 0));
        const radius = Math.max(4.5, Math.min(13, 4.5 + Math.log2(1 + deg) * 1.85));

        if (prev) {
          prev.name = n.name || prev.name;
          prev.kind = n.kind || prev.kind;
          prev.file_path = n.file_path || prev.file_path;
          prev.start_line = n.start_line ?? prev.start_line;
          prev.end_line = n.end_line ?? prev.end_line;
          prev.signature = n.signature ?? prev.signature;
          prev.comm = n.comm ?? prev.comm;
          prev.comm_name = n.comm_name || prev.comm_name;
          prev.comm_color = n.comm_color || prev.comm_color;
          prev.degree = deg;
          prev.radius = radius;
          nextMap.set(n.id, prev);
          return prev;
        }

        // Seed position by community or file directory so clusters form naturally
        const groupKey =
          n.comm !== undefined && n.comm !== null
            ? `comm:${n.comm}`
            : `dir:${(n.file_path || '').split('/').slice(0, 2).join('/')}`;

        let center = groupCenters.get(groupKey);
        if (!center) {
          const goldenAngle = groupIdx * 2.399963229728653;
          const dist = 70 * Math.sqrt(groupIdx + 1);
          center = {
            x: Math.cos(goldenAngle) * dist,
            y: Math.sin(goldenAngle) * dist,
          };
          groupCenters.set(groupKey, center);
          groupIdx++;
        }

        const h = hashString(n.id + String(idx));
        const localAngle = ((h % 360) * Math.PI) / 180;
        const localDist = 18 + ((h >> 8) % 65);

        const simNode: SimNode = {
          ...n,
          x: center.x + Math.cos(localAngle) * localDist,
          y: center.y + Math.sin(localAngle) * localDist,
          vx: 0,
          vy: 0,
          fx: null,
          fy: null,
          degree: deg,
          radius,
        };
        nextMap.set(n.id, simNode);
        return simNode;
      });

      // Filter edges so both endpoints exist
      const validEdges = dedupedEdges.filter(
        (e) => nextMap.has(e.source) && nextMap.has(e.target)
      );

      // Run synchronous warm-up ticks on initial load so the graph opens already well-organized
      if (!preservePositions && simNodes.length > 0) {
        runForceSteps(simNodes, validEdges, nextMap, 85, 0.85);
      }

      simNodesRef.current = simNodes;
      simEdgesRef.current = validEdges;
      nodeMapRef.current = nextMap;
      alphaRef.current = preservePositions ? 0.45 : 0.6;
    },
    []
  );

  // Load the connected graph into shared space
  const loadConnectedGraph = useCallback(
    async (focusSym?: string, maxNodes = maxNodesLimit) => {
      setIsLoading(true);
      setApiError(null);
      try {
        const symToRequest = focusSym !== undefined ? focusSym : selectedNodeId;
        const data = await fastAstApi.getGlobeTopology({
          mode: 'full',
          symbol: symToRequest || undefined,
          depth: 2,
          maxNodes,
          maxEdges: Math.round(maxNodes * 3.5),
        });

        let nodes = data.nodes || [];
        let edges = data.edges || [];

        // If an older server instance returned a tiny set or missed the focus symbol, merge its neighborhood
        if (symToRequest && !nodes.some((n) => n.id === symToRequest || n.name === symToRequest)) {
          try {
            const sub = await fastAstApi.getGlobeTopology({
              mode: 'neighborhood',
              symbol: symToRequest,
              depth: 2,
              maxNodes: 120,
              maxEdges: 320,
            });
            const existingIds = new Set(nodes.map((n) => n.id));
            for (const sn of sub.nodes || []) {
              if (!existingIds.has(sn.id)) {
                nodes.push(sn);
                existingIds.add(sn.id);
              }
            }
            edges = [...edges, ...(sub.edges || [])];
          } catch {
            // ignore optional neighborhood supplement failure
          }
        }

        const mergedTopology: GlobeTopology = {
          ...data,
          mode: 'full',
          nodes,
          edges,
        };

        setTopology(mergedTopology);
        syncSimulationGraph(nodes, edges, false);

        // Pick active selected node
        if (symToRequest) {
          const match =
            nodes.find((n) => n.id === symToRequest) ||
            nodes.find((n) => n.name === symToRequest);
          if (match) {
            setSelectedNodeId(match.id);
            const sn = nodeMapRef.current.get(match.id);
            if (sn) {
              targetCameraRef.current = { x: -sn.x, y: -sn.y, zoom: 1.15 };
            }
          }
        } else if (nodes.length > 0) {
          // Select the primary hub (or get_call_graph if present) so the center ring + inspector are populated immediately
          const preferred =
            nodes.find((n) => n.name === 'get_call_graph') ||
            nodes.find((n) => n.id === data.focus_symbol) ||
            [...nodes].sort(
              (a, b) =>
                (b.in_degree || 0) +
                (b.out_degree || 0) -
                ((a.in_degree || 0) + (a.out_degree || 0))
            )[0];
          if (preferred) {
            setSelectedNodeId(preferred.id);
            const sn = nodeMapRef.current.get(preferred.id);
            if (sn) {
              targetCameraRef.current = { x: -sn.x * 0.5, y: -sn.y * 0.5, zoom: 0.95 };
            }
          }
        }
      } catch (err: any) {
        setApiError(err?.message || 'Failed to load connected graph topology.');
      } finally {
        setIsLoading(false);
      }
    },
    [maxNodesLimit, selectedNodeId, syncSimulationGraph]
  );

  useEffect(() => {
    loadConnectedGraph(initialSymbol, maxNodesLimit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maxNodesLimit]);

  // Select a symbol in the SAME shared graph space (merging its neighborhood if not yet present)
  const focusSymbolInSharedSpace = useCallback(
    async (symbolNameOrId: string, filePath?: string) => {
      if (!symbolNameOrId) return;

      // 1. Check if already in our shared graph space
      const currentNodes = simNodesRef.current;
      const existing =
        currentNodes.find((n) => n.id === symbolNameOrId) ||
        currentNodes.find(
          (n) => n.name === symbolNameOrId && (!filePath || n.file_path === filePath)
        ) ||
        currentNodes.find((n) => n.name === symbolNameOrId);

      if (existing) {
        setSelectedNodeId(existing.id);
        setSearchParams({ symbol: existing.name }, { replace: true });
        alphaRef.current = Math.max(alphaRef.current, 0.35);
        targetCameraRef.current = {
          x: -existing.x,
          y: -existing.y,
          zoom: Math.max(cameraRef.current.zoom, 1.15),
        };
      }

      // 2. Also expand/merge its 1-hop neighborhood into the shared graph if it has missing neighbors or isn't loaded yet
      try {
        const sub = await fastAstApi.getGlobeTopology({
          mode: 'neighborhood',
          symbol: symbolNameOrId,
          depth: 1,
          maxNodes: 80,
          maxEdges: 200,
        });

        if (sub.nodes && sub.nodes.length > 0) {
          const allNodesMap = new Map<string, GlobeNode>();
          for (const n of simNodesRef.current) {
            allNodesMap.set(n.id, n);
          }
          let addedCount = 0;
          const anchor = existing || { x: 0, y: 0 };

          for (const sn of sub.nodes) {
            if (!allNodesMap.has(sn.id)) {
              allNodesMap.set(sn.id, sn);
              addedCount++;
              // Seed near the anchor node so it expands smoothly in-place
              const h = hashString(sn.id);
              const angle = ((h % 360) * Math.PI) / 180;
              const dist = 45 + (h % 55);
              nodeMapRef.current.set(sn.id, {
                ...sn,
                x: anchor.x + Math.cos(angle) * dist,
                y: anchor.y + Math.sin(angle) * dist,
                vx: 0,
                vy: 0,
                fx: null,
                fy: null,
                degree: (sn.in_degree || 0) + (sn.out_degree || 0) || 1,
                radius: 6,
              });
            }
          }

          const combinedEdges: GlobeEdge[] = [
            ...simEdgesRef.current.map((e) => ({
              source: e.source,
              target: e.target,
              type: e.type,
            })),
            ...(sub.edges || []),
          ];

          if (addedCount > 0 || (sub.edges && sub.edges.length > 0)) {
            const combinedNodes = Array.from(allNodesMap.values());
            syncSimulationGraph(combinedNodes, combinedEdges, true);
            setTopology((prev) =>
              prev
                ? {
                    ...prev,
                    nodes: combinedNodes,
                    edges: combinedEdges,
                  }
                : null
            );
          }

          const targetNode =
            nodeMapRef.current.get(symbolNameOrId) ||
            Array.from(nodeMapRef.current.values()).find((n) => n.name === symbolNameOrId);

          if (targetNode) {
            setSelectedNodeId(targetNode.id);
            setSearchParams({ symbol: targetNode.name }, { replace: true });
            targetCameraRef.current = {
              x: -targetNode.x,
              y: -targetNode.y,
              zoom: Math.max(cameraRef.current.zoom, 1.15),
            };
          }
        }
      } catch {
        // Keep existing graph state if neighborhood fetch fails
      }
    },
    [setSearchParams, syncSimulationGraph]
  );

  // Selected Node object
  const selectedNode = useMemo(() => {
    if (!selectedNodeId || !topology) return null;
    return (
      topology.nodes.find((n) => n.id === selectedNodeId) ||
      topology.nodes.find((n) => n.name === selectedNodeId) ||
      null
    );
  }, [selectedNodeId, topology]);

  // Fetch inspector details (Callers, Callees, Similar Symbols) when selectedNode changes
  // AND ensure any callers/callees are linked in the shared space!
  useEffect(() => {
    if (!selectedNode) {
      setCallers([]);
      setCallees([]);
      setSimilarSymbols([]);
      return;
    }

    let cancelled = false;
    setIsLoadingDetails(true);

    Promise.all([
      fastAstApi.getCallGraph(selectedNode.name).catch(() => ({
        symbol: selectedNode.name,
        callers: [],
        callees: [],
      })),
      fastAstApi.getSimilarSymbols(selectedNode.name, 8).catch(() => []),
    ]).then(([callData, simData]) => {
      if (cancelled) return;
      const inCallers = callData.callers || [];
      const outCallees = callData.callees || [];
      setCallers(inCallers);
      setCallees(outCallees);
      setSimilarSymbols(simData || []);
      setIsLoadingDetails(false);

      // Ensure callers & callees exist in the shared simulation space so they are visibly connected around the selected node
      if (inCallers.length > 0 || outCallees.length > 0) {
        const currentMap = nodeMapRef.current;
        const centerSim = currentMap.get(selectedNode.id);
        if (!centerSim) return;

        const updatedNodes: GlobeNode[] = [...simNodesRef.current];
        const updatedEdges: GlobeEdge[] = simEdgesRef.current.map((e) => ({
          source: e.source,
          target: e.target,
          type: e.type,
        }));
        let changed = false;

        const findOrAddCallNode = (
          entryName: string,
          entryFile: string,
          entryLine: number,
          entryKind: string,
          idx: number,
          isCaller: boolean
        ): string => {
          const existingByName =
            simNodesRef.current.find(
              (n) => n.name === entryName && (!entryFile || n.file_path === entryFile)
            ) || simNodesRef.current.find((n) => n.name === entryName);

          if (existingByName) {
            return existingByName.id;
          }

          const newId = `${entryFile || 'repo'}::${entryName}`;
          if (!currentMap.has(newId)) {
            const angle = ((idx * 47 + (isCaller ? 20 : 200)) * Math.PI) / 180;
            const dist = 75 + (idx % 4) * 22;
            const newNode: SimNode = {
              id: newId,
              name: entryName,
              kind: entryKind || 'function',
              signature: `${entryName}()`,
              file_path: entryFile || '',
              language: '',
              start_line: entryLine || 1,
              end_line: entryLine || 1,
              in_degree: isCaller ? 0 : 1,
              out_degree: isCaller ? 1 : 0,
              importance: 1,
              comm: centerSim.comm ?? 0,
              comm_name: centerSim.comm_name || 'Connected',
              comm_color: centerSim.comm_color || '#38bdf8',
              x: centerSim.x + Math.cos(angle) * dist,
              y: centerSim.y + Math.sin(angle) * dist,
              vx: 0,
              vy: 0,
              fx: null,
              fy: null,
              degree: 2,
              radius: 5.5,
            };
            currentMap.set(newId, newNode);
            updatedNodes.push(newNode);
            changed = true;
          }
          return newId;
        };

        inCallers.slice(0, 20).forEach((caller, idx) => {
          const callerName = caller.caller || caller.callee || '';
          if (!callerName) return;
          const callerId = findOrAddCallNode(
            callerName,
            caller.file_path,
            caller.line_number,
            caller.kind || 'function',
            idx,
            true
          );
          const hasEdge = updatedEdges.some(
            (e) =>
              (e.source === callerId && e.target === selectedNode.id) ||
              (e.source === selectedNode.id && e.target === callerId)
          );
          if (!hasEdge && callerId !== selectedNode.id) {
            updatedEdges.push({
              source: callerId,
              target: selectedNode.id,
              type: 'CALLS',
            });
            changed = true;
          }
        });

        outCallees.slice(0, 20).forEach((callee, idx) => {
          const calleeName = callee.callee || callee.caller || '';
          if (!calleeName) return;
          const calleeId = findOrAddCallNode(
            calleeName,
            callee.file_path,
            callee.line_number,
            callee.kind || 'function',
            idx,
            false
          );
          const hasEdge = updatedEdges.some(
            (e) =>
              (e.source === selectedNode.id && e.target === calleeId) ||
              (e.source === calleeId && e.target === selectedNode.id)
          );
          if (!hasEdge && calleeId !== selectedNode.id) {
            updatedEdges.push({
              source: selectedNode.id,
              target: calleeId,
              type: 'CALLS',
            });
            changed = true;
          }
        });

        if (changed) {
          syncSimulationGraph(updatedNodes, updatedEdges, true);
          setTopology((prev) =>
            prev
              ? {
                  ...prev,
                  nodes: updatedNodes,
                  edges: updatedEdges,
                }
              : null
          );
        }
      }
    });

    return () => {
      cancelled = true;
    };
  }, [selectedNode, syncSimulationGraph]);

  // Symbol Search debounce in left panel
  useEffect(() => {
    if (!symbolQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fastAstApi.searchSymbols(symbolQuery.trim(), undefined, undefined, 15);
        setSearchResults(res);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 180);
    return () => clearTimeout(timer);
  }, [symbolQuery]);

  // Compute Hop Distances from Selected Node + Visible Sets
  const { visibleNodeIds, visibleEdges, oneHopIds, twoHopIds, edgeTypeCounts, kindCounts } =
    useMemo(() => {
      const nodes = topology?.nodes || [];
      const edges = topology?.edges || [];

      const eCounts: Record<string, number> = {
        CALLS: 0,
        DEFINES: 0,
        IMPORTS: 0,
        INHERITS: 0,
        SIMILAR_TO: 0,
      };
      for (const e of edges) {
        const t = (e.type || 'CALLS').toUpperCase();
        eCounts[t] = (eCounts[t] || 0) + 1;
      }

      const kCounts: Record<string, number> = {
        function: 0,
        method: 0,
        class: 0,
        other: 0,
      };
      for (const n of nodes) {
        const k = (n.kind || 'function').toLowerCase();
        if (k === 'function') kCounts.function++;
        else if (k === 'method') kCounts.method++;
        else if (k === 'class' || k === 'struct' || k === 'interface' || k === 'type')
          kCounts.class++;
        else kCounts.other++;
      }

      // Filter nodes by kind toggle
      const kindAllowed = new Set<string>();
      for (const n of nodes) {
        const k = (n.kind || 'function').toLowerCase();
        const bucket =
          k === 'function'
            ? 'function'
            : k === 'method'
              ? 'method'
              : k === 'class' || k === 'struct' || k === 'interface' || k === 'type'
                ? 'class'
                : 'other';
        if (kindFilters[bucket] || n.id === selectedNodeId) {
          kindAllowed.add(n.id);
        }
      }

      // Filter edges by active edge type toggles
      const activeEdges = edges.filter((e) => {
        const t = (e.type || 'CALLS').toUpperCase();
        return (
          edgeFilters[t] !== false &&
          kindAllowed.has(e.source) &&
          kindAllowed.has(e.target)
        );
      });

      // Compute 1-hop and 2-hop sets around selectedNodeId
      const hop1 = new Set<string>();
      const hop2 = new Set<string>();
      if (selectedNodeId) {
        hop1.add(selectedNodeId);
        for (const e of activeEdges) {
          if (e.source === selectedNodeId) hop1.add(e.target);
          else if (e.target === selectedNodeId) hop1.add(e.source);
        }
        for (const id of hop1) {
          hop2.add(id);
        }
        for (const e of activeEdges) {
          if (hop1.has(e.source)) hop2.add(e.target);
          if (hop1.has(e.target)) hop2.add(e.source);
        }
      }

      // Determine visible nodes based on hopScope ('all' vs 1 vs 2)
      const visNodes = new Set<string>();
      if (hopScope === 'all' || !selectedNodeId) {
        for (const id of kindAllowed) visNodes.add(id);
      } else if (hopScope === 1) {
        for (const id of hop1) {
          if (kindAllowed.has(id)) visNodes.add(id);
        }
      } else {
        for (const id of hop2) {
          if (kindAllowed.has(id)) visNodes.add(id);
        }
      }

      const visEdges = activeEdges.filter(
        (e) => visNodes.has(e.source) && visNodes.has(e.target)
      );

      return {
        visibleNodeIds: visNodes,
        visibleEdges: visEdges,
        oneHopIds: hop1,
        twoHopIds: hop2,
        edgeTypeCounts: eCounts,
        kindCounts: kCounts,
      };
    }, [topology, edgeFilters, kindFilters, selectedNodeId, hopScope]);

  // Fit all currently visible nodes in the viewport
  const handleFitView = useCallback(() => {
    const visible = simNodesRef.current.filter((n) => visibleNodeIds.has(n.id));
    if (visible.length === 0) return;

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    for (const n of visible) {
      if (n.x < minX) minX = n.x;
      if (n.x > maxX) maxX = n.x;
      if (n.y < minY) minY = n.y;
      if (n.y > maxY) maxY = n.y;
    }

    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    const spanX = Math.max(120, maxX - minX + 120);
    const spanY = Math.max(120, maxY - minY + 120);

    const rect = canvasRef.current?.getBoundingClientRect();
    const width = rect?.width || 900;
    const height = rect?.height || 650;

    const zoom = Math.max(0.28, Math.min(2.2, Math.min(width / spanX, height / spanY) * 0.88));
    targetCameraRef.current = { x: -cx, y: -cy, zoom };
  }, [visibleNodeIds]);

  // Center on currently selected node
  const handleCenterSelected = useCallback(() => {
    if (!selectedNodeId) {
      handleFitView();
      return;
    }
    const sn = nodeMapRef.current.get(selectedNodeId);
    if (sn) {
      targetCameraRef.current = {
        x: -sn.x,
        y: -sn.y,
        zoom: Math.max(cameraRef.current.zoom, 1.25),
      };
    }
  }, [selectedNodeId, handleFitView]);

  // Re-heat physics simulation
  const handleRelayout = useCallback(() => {
    for (const n of simNodesRef.current) {
      n.fx = null;
      n.fy = null;
    }
    setIsPaused(false);
    alphaRef.current = 0.9;
  }, []);

  // Main 2D Canvas Force Simulation + Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const resizeCanvas = () => {
      const parent = containerRef.current;
      if (!parent || !canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = parent.clientWidth;
      const h = parent.clientHeight;
      if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
        canvas.width = Math.floor(w * dpr);
        canvas.height = Math.floor(h * dpr);
      }
    };

    resizeCanvas();
    const resizeObserver = new ResizeObserver(resizeCanvas);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    const renderFrame = () => {
      animationFrameId = requestAnimationFrame(renderFrame);

      resizeCanvas();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = canvas.width / dpr;
      const height = canvas.height / dpr;

      // Smooth camera interpolation
      if (targetCameraRef.current) {
        const cam = cameraRef.current;
        const tgt = targetCameraRef.current;
        cam.x += (tgt.x - cam.x) * 0.14;
        cam.y += (tgt.y - cam.y) * 0.14;
        cam.zoom += (tgt.zoom - cam.zoom) * 0.14;
        if (
          Math.abs(tgt.x - cam.x) < 0.4 &&
          Math.abs(tgt.y - cam.y) < 0.4 &&
          Math.abs(tgt.zoom - cam.zoom) < 0.005
        ) {
          targetCameraRef.current = null;
        }
      }

      // Physics step if not paused
      const nodes = simNodesRef.current;
      const edges = simEdgesRef.current;
      if (!isPausedRef.current && nodes.length > 0 && alphaRef.current > 0.008) {
        runForceSteps(
          nodes,
          edges,
          nodeMapRef.current,
          1,
          alphaRef.current,
          selectedNodeId,
          oneHopIds
        );
        alphaRef.current *= 0.985;
      }

      // Clear background (#080b11 CBM dark canvas)
      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.fillStyle = '#080b11';
      ctx.fillRect(0, 0, width, height);

      const cam = cameraRef.current;
      const centerX = width / 2 + cam.x * cam.zoom;
      const centerY = height / 2 + cam.y * cam.zoom;

      // Subtle architectural coordinate grid
      const gridStep = 80 * cam.zoom;
      if (gridStep >= 18) {
        ctx.strokeStyle = 'rgba(30, 41, 59, 0.35)';
        ctx.lineWidth = 1;
        const startX = ((centerX % gridStep) + gridStep) % gridStep;
        const startY = ((centerY % gridStep) + gridStep) % gridStep;
        ctx.beginPath();
        for (let x = startX; x < width; x += gridStep) {
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
        }
        for (let y = startY; y < height; y += gridStep) {
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
        }
        ctx.stroke();
      }

      // Apply camera transform
      ctx.translate(centerX, centerY);
      ctx.scale(cam.zoom, cam.zoom);

      const hasSelection = Boolean(selectedNodeId);

      // 1. Draw Edges
      for (const edge of visibleEdges) {
        const src = nodeMapRef.current.get(edge.source);
        const tgt = nodeMapRef.current.get(edge.target);
        if (!src || !tgt) continue;

        const isIncidentToSelected =
          hasSelection &&
          (edge.source === selectedNodeId || edge.target === selectedNodeId);
        const isIncidentToHovered =
          Boolean(hoveredNodeId) &&
          (edge.source === hoveredNodeId || edge.target === hoveredNodeId);
        const isTwoHopEdge =
          hasSelection &&
          oneHopIds.has(edge.source) &&
          oneHopIds.has(edge.target);

        const edgeType = (edge.type || 'CALLS').toUpperCase();
        const baseColor = EDGE_COLORS[edgeType] || '#38bdf8';

        ctx.beginPath();
        ctx.moveTo(src.x, src.y);
        ctx.lineTo(tgt.x, tgt.y);

        if (isIncidentToSelected || isIncidentToHovered) {
          ctx.strokeStyle = baseColor;
          ctx.globalAlpha = 0.88;
          ctx.lineWidth = Math.max(1.4, 2.0 / Math.sqrt(cam.zoom));
        } else if (isTwoHopEdge) {
          ctx.strokeStyle = baseColor;
          ctx.globalAlpha = 0.38;
          ctx.lineWidth = 1.1 / Math.sqrt(cam.zoom);
        } else {
          ctx.strokeStyle = baseColor;
          ctx.globalAlpha = hasSelection ? 0.16 : 0.28;
          ctx.lineWidth = 0.9 / Math.sqrt(cam.zoom);
        }
        ctx.stroke();

        // Draw subtle directional arrow on incident CALLS edges
        if ((isIncidentToSelected || isIncidentToHovered) && edgeType === 'CALLS') {
          const dx = tgt.x - src.x;
          const dy = tgt.y - src.y;
          const dist = Math.hypot(dx, dy);
          if (dist > tgt.radius + src.radius + 10) {
            const ux = dx / dist;
            const uy = dy / dist;
            const tipX = tgt.x - ux * (tgt.radius + 3);
            const tipY = tgt.y - uy * (tgt.radius + 3);
            const arrowLen = 6 / Math.sqrt(cam.zoom);
            const arrowWing = 3.2 / Math.sqrt(cam.zoom);

            ctx.beginPath();
            ctx.moveTo(tipX, tipY);
            ctx.lineTo(
              tipX - ux * arrowLen - uy * arrowWing,
              tipY - uy * arrowLen + ux * arrowWing
            );
            ctx.lineTo(
              tipX - ux * arrowLen + uy * arrowWing,
              tipY - uy * arrowLen - ux * arrowWing
            );
            ctx.closePath();
            ctx.fillStyle = baseColor;
            ctx.globalAlpha = 0.92;
            ctx.fill();
          }
        }
      }

      // 2. Draw Nodes
      for (const node of nodes) {
        if (!visibleNodeIds.has(node.id)) continue;

        const isSelected = node.id === selectedNodeId;
        const isHovered = node.id === hoveredNodeId;
        const isOneHop = oneHopIds.has(node.id);
        const isTwoHop = twoHopIds.has(node.id);

        const color = getNodeColor(node, colorBy);
        const r = isSelected ? node.radius * 1.25 : isHovered ? node.radius * 1.15 : node.radius;

        ctx.globalAlpha =
          !hasSelection || isSelected || isHovered || isOneHop
            ? 1.0
            : isTwoHop
              ? 0.72
              : 0.42;

        // Selected node outer glow & double highlight ring (matches CBM reference screenshot)
        if (isSelected) {
          const glowRadius = r + 14 / Math.sqrt(cam.zoom);
          const grad = ctx.createRadialGradient(
            node.x,
            node.y,
            r * 0.5,
            node.x,
            node.y,
            glowRadius
          );
          grad.addColorStop(0, 'rgba(56, 189, 248, 0.45)');
          grad.addColorStop(1, 'rgba(56, 189, 248, 0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(node.x, node.y, glowRadius, 0, Math.PI * 2);
          ctx.fill();

          // Outer bright cyan ring
          ctx.beginPath();
          ctx.arc(node.x, node.y, r + 5.5 / Math.sqrt(cam.zoom), 0, Math.PI * 2);
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 2.2 / Math.sqrt(cam.zoom);
          ctx.stroke();

          // Inner crisp white ring
          ctx.beginPath();
          ctx.arc(node.x, node.y, r + 2.2 / Math.sqrt(cam.zoom), 0, Math.PI * 2);
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.4 / Math.sqrt(cam.zoom);
          ctx.stroke();
        } else if (isHovered) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, r + 4 / Math.sqrt(cam.zoom), 0, Math.PI * 2);
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.6 / Math.sqrt(cam.zoom);
          ctx.stroke();
        } else if (hasSelection && isOneHop) {
          // Subtle ring around direct connected callers/callees
          ctx.beginPath();
          ctx.arc(node.x, node.y, r + 2.5 / Math.sqrt(cam.zoom), 0, Math.PI * 2);
          ctx.strokeStyle = color;
          ctx.globalAlpha = 0.65;
          ctx.lineWidth = 1.1 / Math.sqrt(cam.zoom);
          ctx.stroke();
          ctx.globalAlpha = 1.0;
        }

        // Main node circle
        ctx.beginPath();
        ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();

        // Crisp dark border around node
        ctx.lineWidth = 1.2 / Math.sqrt(cam.zoom);
        ctx.strokeStyle = isSelected ? '#ffffff' : '#080b11';
        ctx.stroke();
      }

      // 3. Draw Visible Symbol Labels (CBM style monospace labels)
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';

      for (const node of nodes) {
        if (!visibleNodeIds.has(node.id)) continue;

        const isSelected = node.id === selectedNodeId;
        const isHovered = node.id === hoveredNodeId;
        const isOneHop = oneHopIds.has(node.id);
        const isHub = node.degree >= 5;

        let shouldShowLabel = false;
        if (isSelected || isHovered || isOneHop) {
          shouldShowLabel = true;
        } else if (labelMode === 'all') {
          shouldShowLabel = cam.zoom >= 0.42 || isHub;
        } else if (labelMode === 'smart') {
          shouldShowLabel = cam.zoom >= 0.75 || isHub;
        } else if (labelMode === 'focus') {
          shouldShowLabel = isSelected || isHovered || isOneHop;
        }

        if (!shouldShowLabel) continue;

        const fontSize =
          (isSelected || isHovered ? 12.5 : isOneHop ? 11 : 10) /
          Math.pow(cam.zoom, 0.35);
        ctx.font = `${isSelected || isHovered ? '700' : '500'} ${fontSize.toFixed(1)}px "JetBrains Mono", monospace`;

        const labelText =
          node.name.length > 34 && !isSelected && !isHovered
            ? `${node.name.slice(0, 32)}…`
            : node.name;

        const r = isSelected ? node.radius * 1.25 : node.radius;
        const labelY = node.y + r + 4 / Math.sqrt(cam.zoom);

        ctx.globalAlpha =
          isSelected || isHovered
            ? 1.0
            : isOneHop
              ? 0.95
              : !hasSelection
                ? 0.85
                : 0.55;

        // Pill background on selected / hovered / 1-hop labels for high legibility over edges
        if (isSelected || isHovered || isOneHop) {
          const textWidth = ctx.measureText(labelText).width;
          const padX = 5 / Math.sqrt(cam.zoom);
          const padY = 2 / Math.sqrt(cam.zoom);
          const boxW = textWidth + padX * 2;
          const boxH = fontSize + padY * 2;

          ctx.fillStyle = isSelected
            ? 'rgba(14, 22, 38, 0.94)'
            : 'rgba(10, 14, 23, 0.84)';
          ctx.beginPath();
          ctx.roundRect(
            node.x - boxW / 2,
            labelY - padY,
            boxW,
            boxH,
            4 / Math.sqrt(cam.zoom)
          );
          ctx.fill();

          if (isSelected) {
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 1.1 / Math.sqrt(cam.zoom);
            ctx.stroke();
          }
        } else {
          // Subtle text halo for non-pill labels
          ctx.strokeStyle = 'rgba(8, 11, 17, 0.9)';
          ctx.lineWidth = 2.8 / Math.sqrt(cam.zoom);
          ctx.strokeText(labelText, node.x, labelY);
        }

        ctx.fillStyle = isSelected
          ? '#ffffff'
          : isHovered
            ? '#f8fafc'
            : isOneHop
              ? '#e2e8f0'
              : '#94a3b8';
        ctx.fillText(labelText, node.x, labelY);
      }

      ctx.restore();
    };

    animationFrameId = requestAnimationFrame(renderFrame);
    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
    };
  }, [
    colorBy,
    hoveredNodeId,
    labelMode,
    oneHopIds,
    selectedNodeId,
    twoHopIds,
    visibleEdges,
    visibleNodeIds,
  ]);

  // Convert screen coordinates to world simulation coordinates
  const screenToWorld = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const sx = clientX - rect.left;
    const sy = clientY - rect.top;
    const cam = cameraRef.current;
    const centerX = rect.width / 2 + cam.x * cam.zoom;
    const centerY = rect.height / 2 + cam.y * cam.zoom;
    return {
      x: (sx - centerX) / cam.zoom,
      y: (sy - centerY) / cam.zoom,
    };
  }, []);

  // Find node under cursor
  const findNodeAtWorldPos = useCallback(
    (wx: number, wy: number): SimNode | null => {
      const nodes = simNodesRef.current;
      const hitPadding = 4 / Math.sqrt(cameraRef.current.zoom);
      for (let i = nodes.length - 1; i >= 0; i--) {
        const n = nodes[i];
        if (!visibleNodeIds.has(n.id)) continue;
        const dx = wx - n.x;
        const dy = wy - n.y;
        const hitR = n.radius + hitPadding;
        if (dx * dx + dy * dy <= hitR * hitR) {
          return n;
        }
      }
      return null;
    },
    [visibleNodeIds]
  );

  // Canvas Pointer Handlers (Drag node, Pan canvas, Click node, Hover node)
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.button !== 0) return;
    targetCameraRef.current = null;
    pointerDownPosRef.current = { x: e.clientX, y: e.clientY };
    lastPointerPosRef.current = { x: e.clientX, y: e.clientY };
    didDragRef.current = false;

    const world = screenToWorld(e.clientX, e.clientY);
    const hitNode = findNodeAtWorldPos(world.x, world.y);

    if (hitNode) {
      dragNodeRef.current = hitNode;
      hitNode.fx = hitNode.x;
      hitNode.fy = hitNode.y;
      alphaRef.current = Math.max(alphaRef.current, 0.3);
    } else {
      isPanningRef.current = true;
    }
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const dx = e.clientX - lastPointerPosRef.current.x;
    const dy = e.clientY - lastPointerPosRef.current.y;
    lastPointerPosRef.current = { x: e.clientX, y: e.clientY };

    const totalMove = Math.hypot(
      e.clientX - pointerDownPosRef.current.x,
      e.clientY - pointerDownPosRef.current.y
    );
    if (totalMove > 4) {
      didDragRef.current = true;
    }

    if (dragNodeRef.current) {
      const world = screenToWorld(e.clientX, e.clientY);
      dragNodeRef.current.fx = world.x;
      dragNodeRef.current.fy = world.y;
      dragNodeRef.current.x = world.x;
      dragNodeRef.current.y = world.y;
      alphaRef.current = Math.max(alphaRef.current, 0.25);
      return;
    }

    if (isPanningRef.current) {
      cameraRef.current.x += dx / cameraRef.current.zoom;
      cameraRef.current.y += dy / cameraRef.current.zoom;
      return;
    }

    // Hover detection
    const world = screenToWorld(e.clientX, e.clientY);
    const hit = findNodeAtWorldPos(world.x, world.y);
    setHoveredNodeId(hit ? hit.id : null);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const draggedNode = dragNodeRef.current;
    dragNodeRef.current = null;
    isPanningRef.current = false;

    if (draggedNode) {
      if (!e.shiftKey) {
        draggedNode.fx = null;
        draggedNode.fy = null;
      }
      if (!didDragRef.current) {
        // Clicked node: select in shared space
        setSelectedNodeId(draggedNode.id);
        setSearchParams({ symbol: draggedNode.name }, { replace: true });
        alphaRef.current = Math.max(alphaRef.current, 0.25);
      }
    }
  };

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    targetCameraRef.current = null;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left - rect.width / 2;
    const mouseY = e.clientY - rect.top - rect.height / 2;

    const cam = cameraRef.current;
    const zoomFactor = e.deltaY < 0 ? 1.12 : 0.89;
    const nextZoom = Math.max(0.2, Math.min(4.0, cam.zoom * zoomFactor));

    // Zoom toward cursor
    const wx = mouseX / cam.zoom - cam.x;
    const wy = mouseY / cam.zoom - cam.y;
    cam.zoom = nextZoom;
    cam.x = mouseX / nextZoom - wx;
    cam.y = mouseY / nextZoom - wy;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '270px 1fr 330px',
        height: '100%',
        width: '100%',
        overflow: 'hidden',
        background: 'var(--bg-base)',
      }}
    >
      {/* LEFT PANEL: Connected Graph Controls & Filters */}
      <aside
        style={{
          borderRight: '1px solid var(--border-subtle)',
          background: 'var(--bg-panel)',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          padding: '12px',
          gap: '14px',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
              CODEBASE GRAPH
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Connected force-directed space
            </div>
          </div>
          <span className="badge badge-cyan" style={{ fontSize: '10px' }}>
            {visibleNodeIds.size}N · {visibleEdges.length}E
          </span>
        </div>

        {/* Symbol Search */}
        <div style={{ position: 'relative' }}>
          <div
            style={{
              fontSize: '10px',
              fontWeight: 600,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '6px',
            }}
          >
            Focus / Locate Symbol
          </div>
          <input
            type="text"
            className="input"
            placeholder="Search symbol (e.g. get_call_graph)..."
            value={symbolQuery}
            onChange={(e) => setSymbolQuery(e.target.value)}
            style={{ width: '100%', fontSize: '12px' }}
          />
          {symbolQuery.trim().length > 0 && (
            <div
              style={{
                position: 'absolute',
                top: '56px',
                left: 0,
                right: 0,
                zIndex: 30,
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-strong)',
                borderRadius: '6px',
                maxHeight: '240px',
                overflowY: 'auto',
                boxShadow: '0 8px 24px rgba(0,0,0,0.55)',
              }}
            >
              {isSearching ? (
                <div style={{ padding: '8px 10px', fontSize: '11px', color: 'var(--text-muted)' }}>
                  Searching symbols...
                </div>
              ) : searchResults.length === 0 ? (
                <div style={{ padding: '8px 10px', fontSize: '11px', color: 'var(--text-muted)' }}>
                  No matching symbols
                </div>
              ) : (
                searchResults.map((sym) => (
                  <button
                    key={`${sym.file_path}:${sym.name}:${sym.start_line}`}
                    onClick={() => {
                      setSymbolQuery('');
                      setSearchResults([]);
                      focusSymbolInSharedSpace(sym.name, sym.file_path);
                    }}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      width: '100%',
                      padding: '7px 10px',
                      border: 'none',
                      borderBottom: '1px solid var(--border-subtle)',
                      background: 'transparent',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        width: '100%',
                      }}
                    >
                      <span
                        className="mono"
                        style={{
                          fontSize: '11.5px',
                          fontWeight: 600,
                          color: 'var(--accent-cyan)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {sym.name}
                      </span>
                      <span
                        style={{
                          marginLeft: 'auto',
                          fontSize: '9.5px',
                          color: 'var(--text-muted)',
                        }}
                      >
                        {sym.kind}
                      </span>
                    </div>
                    <span
                      className="mono"
                      style={{
                        fontSize: '10px',
                        color: 'var(--text-muted)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: '100%',
                      }}
                    >
                      {sym.file_path}
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Graph Scope (All Connected default vs Optional Hop Filter in Same Space) */}
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '6px',
            }}
          >
            <span
              style={{
                fontSize: '10px',
                fontWeight: 600,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Graph Scope (Shared Space)
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr 1fr', gap: '4px' }}>
            <button
              className={`btn btn-sm ${hopScope === 'all' ? 'btn-primary' : ''}`}
              onClick={() => setHopScope('all')}
              title="Show all connected symbols and files together in one shared space"
              style={{ fontSize: '11px', padding: '5px 6px' }}
            >
              All Connected
            </button>
            <button
              className={`btn btn-sm ${hopScope === 2 ? 'btn-primary' : ''}`}
              onClick={() => setHopScope(2)}
              title="Filter to 2-hop neighborhood around selected node in same space"
              style={{ fontSize: '11px', padding: '5px 6px' }}
            >
              2 Hops
            </button>
            <button
              className={`btn btn-sm ${hopScope === 1 ? 'btn-primary' : ''}`}
              onClick={() => setHopScope(1)}
              title="Filter to direct 1-hop callers/callees in same space"
              style={{ fontSize: '11px', padding: '5px 6px' }}
            >
              1 Hop
            </button>
          </div>
        </div>

        {/* Edge Type Filters */}
        <div>
          <div
            style={{
              fontSize: '10px',
              fontWeight: 600,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '6px',
            }}
          >
            Edge Filters
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {(
              [
                { key: 'CALLS', label: 'Calls', color: EDGE_COLORS.CALLS },
                { key: 'IMPORTS', label: 'Imports', color: EDGE_COLORS.IMPORTS },
                { key: 'DEFINES', label: 'Defines', color: EDGE_COLORS.DEFINES },
                { key: 'INHERITS', label: 'Inherits', color: EDGE_COLORS.INHERITS },
                { key: 'SIMILAR_TO', label: 'Similar', color: EDGE_COLORS.SIMILAR_TO },
              ] as const
            ).map((item) => (
              <label
                key={item.key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '5px 8px',
                  borderRadius: '5px',
                  background: edgeFilters[item.key]
                    ? 'rgba(255,255,255,0.03)'
                    : 'transparent',
                  border: '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  fontSize: '11.5px',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    checked={Boolean(edgeFilters[item.key])}
                    onChange={(e) =>
                      setEdgeFilters((prev) => ({
                        ...prev,
                        [item.key]: e.target.checked,
                      }))
                    }
                  />
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '2px',
                      background: item.color,
                      display: 'inline-block',
                    }}
                  />
                  <span>{item.label}</span>
                </span>
                <span className="mono" style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                  {edgeTypeCounts[item.key] || 0}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Node Kind Filters */}
        <div>
          <div
            style={{
              fontSize: '10px',
              fontWeight: 600,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '6px',
            }}
          >
            Symbol Kinds
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {(
              [
                { key: 'function', label: 'Functions', color: KIND_COLORS.function },
                { key: 'method', label: 'Methods', color: KIND_COLORS.method },
                { key: 'class', label: 'Classes & Types', color: KIND_COLORS.class },
                { key: 'other', label: 'Files & Modules', color: KIND_COLORS.module },
              ] as const
            ).map((item) => (
              <label
                key={item.key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '5px 8px',
                  borderRadius: '5px',
                  background: kindFilters[item.key]
                    ? 'rgba(255,255,255,0.03)'
                    : 'transparent',
                  border: '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  fontSize: '11.5px',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    checked={Boolean(kindFilters[item.key])}
                    onChange={(e) =>
                      setKindFilters((prev) => ({
                        ...prev,
                        [item.key]: e.target.checked,
                      }))
                    }
                  />
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: item.color,
                      display: 'inline-block',
                    }}
                  />
                  <span>{item.label}</span>
                </span>
                <span className="mono" style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                  {kindCounts[item.key] || 0}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Visual & Density Settings */}
        <div>
          <div
            style={{
              fontSize: '10px',
              fontWeight: 600,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '6px',
            }}
          >
            Display & Density
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
              <button
                className={`btn btn-sm ${colorBy === 'kind' ? 'btn-primary' : ''}`}
                onClick={() => setColorBy('kind')}
                style={{ fontSize: '11px' }}
              >
                Color: Kind
              </button>
              <button
                className={`btn btn-sm ${colorBy === 'community' ? 'btn-primary' : ''}`}
                onClick={() => setColorBy('community')}
                style={{ fontSize: '11px' }}
              >
                Color: Cluster
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px' }}>
              <button
                className={`btn btn-sm ${labelMode === 'all' ? 'btn-primary' : ''}`}
                onClick={() => setLabelMode('all')}
                style={{ fontSize: '10.5px', padding: '4px' }}
              >
                All Labels
              </button>
              <button
                className={`btn btn-sm ${labelMode === 'smart' ? 'btn-primary' : ''}`}
                onClick={() => setLabelMode('smart')}
                style={{ fontSize: '10.5px', padding: '4px' }}
              >
                Auto Labels
              </button>
              <button
                className={`btn btn-sm ${labelMode === 'focus' ? 'btn-primary' : ''}`}
                onClick={() => setLabelMode('focus')}
                style={{ fontSize: '10.5px', padding: '4px' }}
              >
                Focus Only
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px' }}>
              {(
                [
                  { label: '140 Nodes', value: 140 },
                  { label: '240 Nodes', value: 240 },
                  { label: '380 Nodes', value: 380 },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.value}
                  className={`btn btn-sm ${maxNodesLimit === opt.value ? 'btn-primary' : ''}`}
                  onClick={() => setMaxNodesLimit(opt.value)}
                  style={{ fontSize: '10.5px', padding: '4px' }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* CENTER CANVAS: Shared Force-Directed Graph Space */}
      <main
        ref={containerRef}
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          background: '#080b11',
          userSelect: 'none',
        }}
      >
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          style={{
            width: '100%',
            height: '100%',
            display: 'block',
            cursor: dragNodeRef.current
              ? 'grabbing'
              : hoveredNodeId
                ? 'pointer'
                : 'grab',
          }}
        />

        {/* Top-Left Floating Status & Active Symbol Pill */}
        <div
          style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 12px',
            borderRadius: '6px',
            background: 'rgba(13, 17, 26, 0.88)',
            border: '1px solid var(--border-subtle)',
            backdropFilter: 'blur(6px)',
            pointerEvents: 'none',
          }}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: isPaused ? '#f59e0b' : '#10b981',
            }}
          />
          <span style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
            {hopScope === 'all'
              ? 'Connected Graph (All)'
              : `${hopScope}-Hop Subgraph`}
          </span>
          {selectedNode && (
            <>
              <span style={{ color: 'var(--text-muted)' }}>·</span>
              <span
                className="mono"
                style={{ fontSize: '11.5px', color: 'var(--accent-cyan)', fontWeight: 600 }}
              >
                {selectedNode.name}
              </span>
              <span className="mono" style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                ({Math.max(0, oneHopIds.size - 1)} direct neighbors)
              </span>
            </>
          )}
        </div>

        {/* Top-Right Floating Simulation & Viewport Toolbar (Includes Pause Float) */}
        <div
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '5px 8px',
            borderRadius: '6px',
            background: 'rgba(13, 17, 26, 0.9)',
            border: '1px solid var(--border-subtle)',
            backdropFilter: 'blur(6px)',
          }}
        >
          <button
            className={`btn btn-sm ${isPaused ? 'btn-primary' : ''}`}
            onClick={() => {
              const next = !isPaused;
              setIsPaused(next);
              if (!next) {
                alphaRef.current = Math.max(alphaRef.current, 0.45);
              }
            }}
            title={isPaused ? 'Resume force simulation' : 'Freeze / Pause floating motion'}
            style={{ fontSize: '11px', padding: '4px 9px' }}
          >
            {isPaused ? '▶ Resume Float' : '⏸ Pause Float'}
          </button>
          <button
            className="btn btn-sm"
            onClick={handleRelayout}
            title="Re-heat force simulation layout"
            style={{ fontSize: '11px', padding: '4px 8px' }}
          >
            ↻ Re-layout
          </button>
          <button
            className="btn btn-sm"
            onClick={handleCenterSelected}
            title="Center viewport on selected node"
            style={{ fontSize: '11px', padding: '4px 8px' }}
          >
            ◎ Center Focus
          </button>
          <button
            className="btn btn-sm"
            onClick={handleFitView}
            title="Fit entire visible graph in viewport"
            style={{ fontSize: '11px', padding: '4px 8px' }}
          >
            ⊡ Fit All
          </button>
        </div>

        {/* Bottom-Left Legend & Controls Hint */}
        <div
          style={{
            position: 'absolute',
            bottom: '12px',
            left: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '5px 10px',
            borderRadius: '6px',
            background: 'rgba(13, 17, 26, 0.84)',
            border: '1px solid var(--border-subtle)',
            fontSize: '10.5px',
            color: 'var(--text-muted)',
            pointerEvents: 'none',
          }}
        >
          <span>Click node: Inspect & ring</span>
          <span>·</span>
          <span>Drag node: Reposition (Shift+Drag to pin)</span>
          <span>·</span>
          <span>Scroll: Zoom</span>
        </div>

        {/* Loading / Error Overlays */}
        {isLoading && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(8, 11, 17, 0.72)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              zIndex: 20,
            }}
          >
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
              Building connected codebase graph...
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
              Computing force-directed layout across symbols & call edges
            </div>
          </div>
        )}

        {apiError && !isLoading && (
          <div
            style={{
              position: 'absolute',
              top: '60px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(127, 29, 29, 0.92)',
              border: '1px solid #ef4444',
              borderRadius: '6px',
              padding: '10px 16px',
              color: '#fee2e2',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              zIndex: 25,
            }}
          >
            <span>{apiError}</span>
            <button
              className="btn btn-sm"
              onClick={() => loadConnectedGraph(selectedNodeId, maxNodesLimit)}
            >
              Retry
            </button>
          </div>
        )}
      </main>

      {/* RIGHT PANEL: Symbol Inspector with Callers, Callees, and Similar Symbols */}
      <aside
        style={{
          borderLeft: '1px solid var(--border-subtle)',
          background: 'var(--bg-panel)',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          padding: '14px',
          gap: '14px',
        }}
      >
        {!selectedNode ? (
          <div
            style={{
              padding: '24px 12px',
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: '12px',
            }}
          >
            Click any node in the connected graph to inspect its signature, callers, callees, and
            similar symbols.
          </div>
        ) : (
          <>
            {/* Symbol Header */}
            <div
              style={{
                borderBottom: '1px solid var(--border-subtle)',
                paddingBottom: '12px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginBottom: '6px',
                }}
              >
                <span
                  className="badge"
                  style={{
                    background: `${getNodeColor(selectedNode, 'kind')}22`,
                    color: getNodeColor(selectedNode, 'kind'),
                    border: `1px solid ${getNodeColor(selectedNode, 'kind')}55`,
                    textTransform: 'uppercase',
                    fontSize: '10px',
                  }}
                >
                  {selectedNode.kind || 'symbol'}
                </span>
                {selectedNode.comm !== undefined && selectedNode.comm !== null && (
                  <span className="badge" style={{ fontSize: '10px' }}>
                    {selectedNode.comm_name || `Cluster #${selectedNode.comm}`}
                  </span>
                )}
                <span
                  className="mono"
                  style={{ marginLeft: 'auto', fontSize: '10.5px', color: 'var(--text-muted)' }}
                >
                  {Math.max(0, oneHopIds.size - 1)} linked
                </span>
              </div>

              <div
                className="mono"
                style={{
                  fontSize: '15px',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  wordBreak: 'break-all',
                  marginBottom: '4px',
                }}
              >
                {selectedNode.name}
              </div>

              <div
                className="mono"
                style={{
                  fontSize: '11px',
                  color: 'var(--text-secondary)',
                  wordBreak: 'break-all',
                }}
              >
                {selectedNode.file_path}
                {selectedNode.start_line ? `:${selectedNode.start_line}` : ''}
                {selectedNode.end_line && selectedNode.end_line !== selectedNode.start_line
                  ? `-${selectedNode.end_line}`
                  : ''}
              </div>

              {selectedNode.signature && (
                <pre
                  className="mono"
                  style={{
                    marginTop: '8px',
                    padding: '8px',
                    borderRadius: '5px',
                    background: 'var(--bg-base)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '10.5px',
                    color: 'var(--text-secondary)',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    maxHeight: '88px',
                    overflowY: 'auto',
                  }}
                >
                  {selectedNode.signature}
                </pre>
              )}

              {/* Action Buttons */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '6px',
                  marginTop: '10px',
                }}
              >
                <button
                  className="btn btn-sm btn-primary"
                  onClick={() => {
                    if (onNavigateToExplore) {
                      onNavigateToExplore(selectedNode.name, selectedNode.file_path);
                    } else {
                      navigate(
                        `/explore?symbol=${encodeURIComponent(selectedNode.name)}&file=${encodeURIComponent(selectedNode.file_path || '')}`
                      );
                    }
                  }}
                  style={{ fontSize: '11px' }}
                >
                  Open in Explore
                </button>
                <button
                  className="btn btn-sm"
                  onClick={() =>
                    navigate(`/evidence?q=${encodeURIComponent(selectedNode.name)}`)
                  }
                  style={{ fontSize: '11px' }}
                >
                  Build Evidence
                </button>
              </div>
            </div>

            {/* Inbound Callers (Clicking focuses node in the SAME shared graph space) */}
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '6px',
                }}
              >
                <span
                  style={{
                    fontSize: '10.5px',
                    fontWeight: 700,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Inbound Callers
                </span>
                <span className="badge badge-cyan" style={{ fontSize: '10px' }}>
                  {callers.length}
                </span>
              </div>

              {isLoadingDetails ? (
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Loading callers...
                </div>
              ) : callers.length === 0 ? (
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  No inbound callers recorded
                </div>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    maxHeight: '190px',
                    overflowY: 'auto',
                  }}
                >
                  {callers.map((caller, idx) => {
                    const callerName = caller.caller || caller.callee || 'unknown';
                    return (
                      <button
                        key={`caller-${callerName}-${caller.file_path}-${idx}`}
                        onClick={() => focusSymbolInSharedSpace(callerName, caller.file_path)}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'flex-start',
                          padding: '6px 8px',
                          borderRadius: '5px',
                          background: 'var(--bg-base)',
                          border: '1px solid var(--border-subtle)',
                          cursor: 'pointer',
                          textAlign: 'left',
                          width: '100%',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            width: '100%',
                          }}
                        >
                          <span style={{ color: '#38bdf8', fontSize: '10px' }}>←</span>
                          <span
                            className="mono"
                            style={{
                              fontSize: '11.5px',
                              fontWeight: 600,
                              color: 'var(--text-primary)',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {callerName}
                          </span>
                        </div>
                        {caller.file_path && (
                          <span
                            className="mono"
                            style={{
                              fontSize: '10px',
                              color: 'var(--text-muted)',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              maxWidth: '100%',
                            }}
                          >
                            {caller.file_path}
                            {caller.line_number ? `:${caller.line_number}` : ''}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Outbound Callees (Clicking focuses node in the SAME shared graph space) */}
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '6px',
                }}
              >
                <span
                  style={{
                    fontSize: '10.5px',
                    fontWeight: 700,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Outbound Callees
                </span>
                <span className="badge badge-cyan" style={{ fontSize: '10px' }}>
                  {callees.length}
                </span>
              </div>

              {isLoadingDetails ? (
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Loading callees...
                </div>
              ) : callees.length === 0 ? (
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  No outbound callees recorded
                </div>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    maxHeight: '190px',
                    overflowY: 'auto',
                  }}
                >
                  {callees.map((callee, idx) => {
                    const calleeName = callee.callee || callee.caller || 'unknown';
                    return (
                      <button
                        key={`callee-${calleeName}-${callee.file_path}-${idx}`}
                        onClick={() => focusSymbolInSharedSpace(calleeName, callee.file_path)}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'flex-start',
                          padding: '6px 8px',
                          borderRadius: '5px',
                          background: 'var(--bg-base)',
                          border: '1px solid var(--border-subtle)',
                          cursor: 'pointer',
                          textAlign: 'left',
                          width: '100%',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            width: '100%',
                          }}
                        >
                          <span style={{ color: '#10b981', fontSize: '10px' }}>→</span>
                          <span
                            className="mono"
                            style={{
                              fontSize: '11.5px',
                              fontWeight: 600,
                              color: 'var(--text-primary)',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {calleeName}
                          </span>
                        </div>
                        {callee.file_path && (
                          <span
                            className="mono"
                            style={{
                              fontSize: '10px',
                              color: 'var(--text-muted)',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              maxWidth: '100%',
                            }}
                          >
                            {callee.file_path}
                            {callee.line_number ? `:${callee.line_number}` : ''}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Similar Symbols (MinHash/LSH) */}
            {similarSymbols.length > 0 && (
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '6px',
                  }}
                >
                  <span
                    style={{
                      fontSize: '10.5px',
                      fontWeight: 700,
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    Similar Symbols
                  </span>
                  <span className="badge" style={{ fontSize: '10px' }}>
                    {similarSymbols.length}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {similarSymbols.map((sim, idx) => (
                    <button
                      key={`sim-${sim.name}-${idx}`}
                      onClick={() => focusSymbolInSharedSpace(sim.name, sim.file_path)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '5px 8px',
                        borderRadius: '5px',
                        background: 'var(--bg-base)',
                        border: '1px solid var(--border-subtle)',
                        cursor: 'pointer',
                        width: '100%',
                      }}
                    >
                      <span
                        className="mono"
                        style={{
                          fontSize: '11px',
                          color: 'var(--text-primary)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {sim.name}
                      </span>
                      <span
                        className="mono"
                        style={{ fontSize: '10px', color: '#ec4899', fontWeight: 600 }}
                      >
                        {Math.round((sim.similarity || 0) * 100)}%
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </aside>
    </div>
  );
};

/**
 * Fast 2D force-directed physics solver for connected codebase graphs.
 * Combines many-body repulsion, spring edge attraction, community cohesion,
 * and gentle radial organization around the currently selected symbol.
 */
function runForceSteps(
  nodes: SimNode[],
  edges: SimEdge[],
  nodeMap: Map<string, SimNode>,
  iterations: number,
  initialAlpha: number,
  selectedNodeId?: string,
  oneHopIds?: Set<string>
): void {
  const nLen = nodes.length;
  if (nLen === 0) return;

  let alpha = initialAlpha;
  const repulsionStrength = 950;
  const idealEdgeDist = 72;

  for (let iter = 0; iter < iterations; iter++) {
    // 1. Pairwise repulsive force (charge)
    for (let i = 0; i < nLen; i++) {
      const a = nodes[i];
      for (let j = i + 1; j < nLen; j++) {
        const b = nodes[j];
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        let distSq = dx * dx + dy * dy;
        if (distSq < 16) {
          dx = (Math.random() - 0.5) * 4;
          dy = (Math.random() - 0.5) * 4;
          distSq = 16;
        }
        // Cutoff long-range repulsion beyond 520px to keep clusters cohesive
        if (distSq > 270000) continue;

        const minSep = a.radius + b.radius + 16;
        const force = (repulsionStrength * alpha) / distSq;
        const dist = Math.sqrt(distSq);
        let fx = (dx / dist) * force;
        let fy = (dy / dist) * force;

        // Extra collision prevention so labels & nodes stay readable
        if (dist < minSep) {
          const push = ((minSep - dist) / minSep) * 1.8 * alpha;
          fx += (dx / dist) * push;
          fy += (dy / dist) * push;
        }

        a.vx -= fx;
        a.vy -= fy;
        b.vx += fx;
        b.vy += fy;
      }
    }

    // 2. Spring attraction along connected edges
    for (let i = 0; i < edges.length; i++) {
      const e = edges[i];
      const src = nodeMap.get(e.source);
      const tgt = nodeMap.get(e.target);
      if (!src || !tgt) continue;

      const dx = tgt.x - src.x;
      const dy = tgt.y - src.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;

      const targetDist =
        e.type === 'DEFINES'
          ? idealEdgeDist * 0.78
          : e.type === 'CALLS'
            ? idealEdgeDist
            : idealEdgeDist * 1.15;

      const strength = e.type === 'CALLS' ? 0.085 : 0.065;
      const displacement = (dist - targetDist) * strength * alpha;
      const fx = (dx / dist) * displacement;
      const fy = (dy / dist) * displacement;

      src.vx += fx;
      src.vy += fy;
      tgt.vx -= fx;
      tgt.vy -= fy;
    }

    // 3. Gentle radial organization of 1-hop neighbors around selected node in shared space
    const sel = selectedNodeId ? nodeMap.get(selectedNodeId) : undefined;
    if (sel && oneHopIds && oneHopIds.size > 1) {
      for (const id of oneHopIds) {
        if (id === selectedNodeId) continue;
        const nb = nodeMap.get(id);
        if (!nb) continue;
        const dx = nb.x - sel.x;
        const dy = nb.y - sel.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const desiredOrbit = 92;
        const pull = (desiredOrbit - dist) * 0.04 * alpha;
        nb.vx += (dx / dist) * pull;
        nb.vy += (dy / dist) * pull;
      }
    }

    // 4. Weak center gravity & velocity integration
    for (let i = 0; i < nLen; i++) {
      const n = nodes[i];
      if (n.fx !== null && n.fy !== null) {
        n.x = n.fx;
        n.y = n.fy;
        n.vx = 0;
        n.vy = 0;
        continue;
      }

      // Weak center pull so disconnected sub-components don't drift off-screen
      n.vx -= n.x * 0.004 * alpha;
      n.vy -= n.y * 0.004 * alpha;

      // Damping
      n.vx *= 0.72;
      n.vy *= 0.72;

      // Clamp max step
      const speed = Math.hypot(n.vx, n.vy);
      if (speed > 18) {
        n.vx = (n.vx / speed) * 18;
        n.vy = (n.vy / speed) * 18;
      }

      n.x += n.vx;
      n.y += n.vy;
    }

    alpha *= 0.98;
  }
}
