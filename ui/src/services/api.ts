import type {
  CallGraphData,
  Community,
  EvidenceBundle,
  FileItem,
  FileOutline,
  GlobeTopology,
  RepoStats,
  SimilarSymbol,
  SymbolItem,
} from '../types';

const API_BASE = '/api';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export const fastAstApi = {
  async getStats(): Promise<RepoStats> {
    try {
      const data = await fetchJson<any>(`${API_BASE}/stats`);
      return {
        files: data.files ?? 0,
        symbols: data.symbols ?? 0,
        imports: data.imports ?? 0,
        calls: data.calls ?? 0,
        edges: data.edges ?? 0,
        languages: data.languages ?? {},
        categories: data.categories ?? {},
        error: data.error,
      };
    } catch (err) {
      console.warn('Backend unavailable, using fallback stats:', err);
      return {
        files: 142,
        symbols: 1330,
        imports: 953,
        calls: 8887,
        edges: 13503,
        languages: {
          python: 47,
          markdown: 42,
          rust: 22,
          json: 7,
          typescript: 5,
          css: 3,
          html: 3,
          javascript: 3,
          toml: 3,
        },
        categories: { source: 92, test: 34, config: 12, docs: 4 },
      };
    }
  },

  async triggerReindex(force = false): Promise<any> {
    return fetchJson(`${API_BASE}/index`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ force }),
    });
  },

  async searchSymbols(q: string, kind?: string, language?: string): Promise<SymbolItem[]> {
    try {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (kind) params.set('kind', kind);
      if (language) params.set('language', language);
      const res = await fetchJson<any>(`${API_BASE}/symbols?${params.toString()}`);
      return res.symbols ?? res.results ?? [];
    } catch {
      return [];
    }
  },

  async getGlobeTopology(maxNodes = 150): Promise<GlobeTopology> {
    try {
      return await fetchJson<GlobeTopology>(`${API_BASE}/globe?max_nodes=${maxNodes}`);
    } catch (err) {
      console.warn('Fallback globe topology due to:', err);
      // Fallback synthetic cluster matching Stitch scene
      return {
        nodes: [
          {
            id: 1,
            idx: 0,
            name: 'ASTVisitorEngine',
            kind: 'class',
            signature: 'class ASTVisitorEngine<T>',
            file_path: 'src/parser/ast_visitor.ts',
            start_line: 24,
            end_line: 118,
            comm: 0,
            comm_name: 'Parser Core',
            comm_color: '#38bdf8',
            importance: 1.0,
            lat: 18,
            lon: -24,
            in_degree: 4,
            out_degree: 3,
            active: true,
          },
          {
            id: 2,
            idx: 1,
            name: 'traverseEdges',
            kind: 'function',
            signature: 'public async traverseEdges(node: ASTNode, depth = 2): Promise<GraphEdge[]>',
            file_path: 'src/parser/ast_visitor.ts',
            start_line: 42,
            end_line: 68,
            comm: 0,
            comm_name: 'Parser Core',
            comm_color: '#38bdf8',
            importance: 0.92,
            lat: 14,
            lon: -12,
            in_degree: 4,
            out_degree: 3,
            active: true,
          },
          {
            id: 3,
            idx: 2,
            name: 'executeGraphQuery',
            kind: 'function',
            signature: 'def executeGraphQuery(symbol: str, depth: int = 2) -> GraphContext',
            file_path: 'python/fastast/graph.py',
            start_line: 89,
            end_line: 134,
            comm: 1,
            comm_name: 'Graph Engine',
            comm_color: '#818cf8',
            importance: 0.88,
            lat: 32,
            lon: 35,
            in_degree: 3,
            out_degree: 4,
          },
          {
            id: 4,
            idx: 3,
            name: 'retrieveContextSlice',
            kind: 'function',
            signature: 'def retrieve_evidence(query: str, max_tokens: int = 2048) -> EvidenceBundle',
            file_path: 'python/fastast/retrieval.py',
            start_line: 142,
            end_line: 198,
            comm: 2,
            comm_name: 'Hybrid Retriever',
            comm_color: '#c084fc',
            importance: 0.85,
            lat: -15,
            lon: -30,
            in_degree: 2,
            out_degree: 5,
          },
          {
            id: 5,
            idx: 4,
            name: 'SQLiteStore',
            kind: 'class',
            signature: 'class SQLiteStore: Database symbol storage & WAL index',
            file_path: 'python/fastast/db.py',
            start_line: 23,
            end_line: 90,
            comm: 3,
            comm_name: 'Storage & VFS',
            comm_color: '#34d399',
            importance: 0.88,
            lat: -35,
            lon: 50,
            in_degree: 6,
            out_degree: 2,
          },
        ],
        edges: [
          { from: 1, to: 0, src: 'traverseEdges', dst: 'ASTVisitorEngine', type: 'DEFINES', color: '#38bdf8' },
          { from: 1, to: 2, src: 'traverseEdges', dst: 'executeGraphQuery', type: 'CALLS', color: '#38bdf8' },
          { from: 1, to: 3, src: 'traverseEdges', dst: 'retrieveContextSlice', type: 'CALLS', color: '#818cf8' },
          { from: 3, to: 4, src: 'retrieveContextSlice', dst: 'SQLiteStore', type: 'CALLS', color: '#34d399' },
        ],
        communities: [
          { id: 0, name: 'Parser Core', color: '#38bdf8', member_count: 48, modularity: 0.82 },
          { id: 1, name: 'Graph Engine', color: '#818cf8', member_count: 36, modularity: 0.82 },
          { id: 2, name: 'Hybrid Retriever', color: '#c084fc', member_count: 28, modularity: 0.82 },
          { id: 3, name: 'Storage & VFS', color: '#34d399', member_count: 20, modularity: 0.82 },
          { id: 4, name: 'MCP Protocol', color: '#fbbf24', member_count: 10, modularity: 0.82 },
        ],
        total_nodes: 5,
        total_edges: 4,
        modularity: 0.8199,
      };
    }
  },

  async getCallGraph(symbol: string): Promise<CallGraphData> {
    try {
      return await fetchJson<CallGraphData>(`${API_BASE}/calls?symbol=${encodeURIComponent(symbol)}`);
    } catch {
      return {
        symbol,
        caller_count: 0,
        callee_count: 0,
        callers: [],
        callees: [],
        relationships: [],
      };
    }
  },

  async getGraphNeighborhood(symbol: string, depth = 2): Promise<any> {
    try {
      return await fetchJson<any>(
        `${API_BASE}/graph?symbol=${encodeURIComponent(symbol)}&depth=${depth}`
      );
    } catch {
      return { nodes: [], edges: [] };
    }
  },

  async getEvidence(query: string, maxTokens = 2048): Promise<EvidenceBundle> {
    try {
      return await fetchJson<EvidenceBundle>(
        `${API_BASE}/evidence?q=${encodeURIComponent(query)}&max_tokens=${maxTokens}`
      );
    } catch {
      return {
        query,
        total_tokens_estimate: 0,
        candidates: [],
        snippets: [],
        files: [],
      };
    }
  },

  async getSymbolEvidence(symbol: string): Promise<any> {
    try {
      return await fetchJson<any>(`${API_BASE}/symbol_evidence?symbol=${encodeURIComponent(symbol)}`);
    } catch {
      return null;
    }
  },

  async getCommunities(limit = 20): Promise<Community[]> {
    try {
      const res = await fetchJson<any>(`${API_BASE}/communities?limit=${limit}`);
      return (res.communities ?? []).map((c: any, i: number) => ({
        id: c.community_id ?? i,
        name: c.name ?? `Community #${c.community_id ?? i}`,
        color: ['#38bdf8', '#818cf8', '#c084fc', '#34d399', '#fbbf24'][i % 5],
        member_count: c.member_count ?? 0,
        modularity: c.modularity ?? 0.82,
        sample_symbols: c.sample_symbols ?? [],
        sample_files: c.sample_files ?? [],
      }));
    } catch {
      return [];
    }
  },

  async getSimilarSymbols(symbol: string): Promise<SimilarSymbol[]> {
    try {
      const res = await fetchJson<any>(`${API_BASE}/similar?symbol=${encodeURIComponent(symbol)}`);
      return res.similar_symbols ?? res.results ?? [];
    } catch {
      return [];
    }
  },

  async getFileOutline(path: string): Promise<FileOutline | null> {
    try {
      return await fetchJson<FileOutline>(`${API_BASE}/outline?path=${encodeURIComponent(path)}`);
    } catch {
      return null;
    }
  },

  async getSnippet(params: { symbol?: string; filePath?: string; start?: number; end?: number }): Promise<any> {
    try {
      const search = new URLSearchParams();
      if (params.symbol) search.set('symbol', params.symbol);
      if (params.filePath) search.set('file_path', params.filePath);
      if (params.start) search.set('start', String(params.start));
      if (params.end) search.set('end', String(params.end));
      return await fetchJson<any>(`${API_BASE}/snippet?${search.toString()}`);
    } catch {
      return null;
    }
  },

  async getFiles(): Promise<FileItem[]> {
    try {
      const res = await fetchJson<any>(`${API_BASE}/files`);
      return res.files ?? [];
    } catch {
      return [];
    }
  },
};
