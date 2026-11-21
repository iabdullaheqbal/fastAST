import type {
  CallGraphResponse,
  Community,
  EvidenceBundle,
  FileRecord,
  GlobeTopology,
  GraphNeighborhood,
  HealthStatus,
  RepoStats,
  SimilarSymbol,
  SymbolRecord,
} from '../types';

const API_BASE = '/api';
const DIRECT_API_BASE = 'http://127.0.0.1:4200/api';
const REQUEST_TIMEOUT_MS = 10000;

export class ApiConnectionError extends Error {
  status?: number;
  endpoint: string;

  constructor(message: string, endpoint: string, status?: number) {
    super(message);
    this.name = 'ApiConnectionError';
    this.endpoint = endpoint;
    this.status = status;
  }
}

async function fetchJson<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    let res: Response | null = null;
    let primaryErr: any = null;

    try {
      res = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        signal: controller.signal,
      });
      // If Vite proxy returned 502/504 Bad Gateway or 500, attempt direct fallback to port 4200
      if (!res.ok && (res.status === 502 || res.status === 504 || res.status === 500)) {
        try {
          const directRes = await fetch(`${DIRECT_API_BASE}${endpoint}`, {
            ...options,
            signal: controller.signal,
          });
          if (directRes.ok) {
            res = directRes;
          }
        } catch {
          // Direct fallback failed, keep proxy response
        }
      }
    } catch (err: any) {
      primaryErr = err;
      // Network failure on proxy route, attempt direct connect
      try {
        res = await fetch(`${DIRECT_API_BASE}${endpoint}`, {
          ...options,
          signal: controller.signal,
        });
      } catch {
        throw primaryErr;
      }
    }

    if (!res || !res.ok) {
      const status = res?.status;
      let errMsg = status ? `HTTP ${status} on ${endpoint}` : `Failed request on ${endpoint}`;
      try {
        const errBody = await res?.json();
        if (errBody?.error) {
          errMsg = errBody.error;
        }
      } catch {
        // ignore non-json error body
      }
      throw new ApiConnectionError(errMsg, endpoint, status);
    }
    return await res.json();
  } catch (err: any) {
    if (err instanceof ApiConnectionError) {
      throw err;
    }
    if (err?.name === 'AbortError') {
      throw new ApiConnectionError(
        `Request timed out after ${REQUEST_TIMEOUT_MS / 1000}s (${endpoint}). Ensure FastAST API server is running on port 4200.`,
        endpoint
      );
    }
    throw new ApiConnectionError(
      `Cannot reach FastAST API server at http://127.0.0.1:4200 (${endpoint}). Start it with "fastast serve" or "./start_ui.sh".`,
      endpoint
    );
  } finally {
    clearTimeout(timer);
  }
}

export const fastAstApi = {
  async getHealth(): Promise<HealthStatus> {
    return await fetchJson<HealthStatus>('/health');
  },

  async getStats(): Promise<RepoStats> {
    return await fetchJson<RepoStats>('/stats');
  },

  async getFiles(): Promise<FileRecord[]> {
    const data = await fetchJson<{ files: FileRecord[] }>('/files');
    return data.files || [];
  },

  async searchSymbols(
    query: string,
    kind?: string,
    language?: string,
    limit = 60
  ): Promise<SymbolRecord[]> {
    const params = new URLSearchParams({ q: query, limit: String(limit) });
    if (kind && kind !== 'all') params.set('kind', kind);
    if (language && language !== 'all') params.set('language', language);
    const data = await fetchJson<{ symbols: SymbolRecord[] }>(`/symbols?${params}`);
    return data.symbols || [];
  },

  async getOutline(filePath: string): Promise<SymbolRecord[]> {
    const params = new URLSearchParams({ file: filePath });
    const data = await fetchJson<{ outline: SymbolRecord[] }>(`/outline?${params}`);
    return data.outline || [];
  },

  async getSnippet(
    symbol?: string,
    file?: string,
    start?: number,
    end?: number
  ): Promise<{
    content: string;
    file_path: string;
    start_line: number;
    end_line: number;
    symbol?: string;
    tokens?: number;
  } | null> {
    const params = new URLSearchParams();
    if (symbol) params.set('symbol', symbol);
    if (file) params.set('file', file);
    if (start !== undefined) params.set('start', String(start));
    if (end !== undefined) params.set('end', String(end));
    return await fetchJson(`/snippet?${params}`);
  },

  async getCallGraph(symbol: string): Promise<CallGraphResponse> {
    const params = new URLSearchParams({ symbol });
    return await fetchJson<CallGraphResponse>(`/calls?${params}`);
  },

  async getGraphNeighborhood(symbol: string, depth = 2): Promise<GraphNeighborhood> {
    const params = new URLSearchParams({ symbol, depth: String(depth) });
    return await fetchJson<GraphNeighborhood>(`/graph?${params}`);
  },

  async getEvidence(
    query: string,
    maxTokens = 1500,
    ranking: 'hybrid' | 'rrf' | 'bm25' | 'semantic' | 'heuristic' = 'hybrid'
  ): Promise<EvidenceBundle> {
    const params = new URLSearchParams({
      q: query,
      max_tokens: String(maxTokens),
      ranking,
    });
    return await fetchJson<EvidenceBundle>(`/evidence?${params}`);
  },

  async getCommunities(limit = 25): Promise<Community[]> {
    const data = await fetchJson<{ communities: Community[] }>(`/communities?limit=${limit}`);
    return data.communities || [];
  },

  async getSimilarSymbols(symbol: string, limit = 10): Promise<SimilarSymbol[]> {
    const params = new URLSearchParams({ symbol, limit: String(limit) });
    const data = await fetchJson<{ similar: SimilarSymbol[] }>(`/similar?${params}`);
    return data.similar || [];
  },

  async getGlobeTopology(options?: {
    mode?: 'neighborhood' | 'full';
    symbol?: string;
    depth?: number;
    maxNodes?: number;
    maxEdges?: number;
  }): Promise<GlobeTopology> {
    const params = new URLSearchParams();
    params.set('mode', options?.mode || 'full');
    if (options?.symbol) params.set('symbol', options.symbol);
    params.set('depth', String(options?.depth ?? 2));
    params.set('max_nodes', String(options?.maxNodes ?? 240));
    params.set('max_edges', String(options?.maxEdges ?? 800));
    return await fetchJson<GlobeTopology>(`/globe?${params}`);
  },

  async getDiagnostics(): Promise<any> {
    return await fetchJson('/diagnose');
  },

  async triggerReindex(force = false): Promise<{
    status: string;
    summary: any;
    health: HealthStatus;
  }> {
    return await fetchJson('/index', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ force }),
    });
  },
};
