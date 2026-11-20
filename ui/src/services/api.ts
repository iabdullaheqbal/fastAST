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

const REQUEST_TIMEOUT_MS = 10000;

/**
 * Resolves the primary API base URL.
 * Priority:
 * 1. Vite environment variable `VITE_API_BASE_URL` or `VITE_API_URL`
 * 2. Runtime window config `window.__FASTAST_API_URL__` (for dynamic cloud/container injection)
 * 3. Default relative `/api` (works seamlessly for same-origin bundled UI and reverse proxies)
 */
export function getApiBase(): string {
  const envUrl = (import.meta as any).env?.VITE_API_BASE_URL || (import.meta as any).env?.VITE_API_URL;
  if (envUrl) {
    return String(envUrl).replace(/\/+$/, '');
  }
  if (typeof window !== 'undefined' && (window as any).__FASTAST_API_URL__) {
    return String((window as any).__FASTAST_API_URL__).replace(/\/+$/, '');
  }
  return '/api';
}

/**
 * Resolves an optional direct fallback URL when running in local development
 * (e.g. Vite dev server on port 5173 while FastAPI backend runs on port 4200).
 * For remote deployments, avoids hardcoded 127.0.0.1 to prevent mixed content and unreachable host errors.
 */
export function getDirectFallbackBase(): string | null {
  const envFallback = (import.meta as any).env?.VITE_API_DIRECT_FALLBACK;
  if (envFallback) {
    return String(envFallback).replace(/\/+$/, '');
  }

  if (typeof window === 'undefined') return null;

  const { hostname, protocol, port } = window.location;

  // If already on port 4200, relative `/api` is same-origin
  if (port === '4200') return null;

  // In local dev (localhost / 127.0.0.1 with Vite on 5173 or similar), attempt direct backend port
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
  if (isLocalhost) {
    return `${protocol}//${hostname}:4200/api`;
  }

  // On remote deployments, keep same origin
  return null;
}

/**
 * Returns a user-friendly display string representing the target API endpoint.
 */
export function getApiEndpointDisplay(): string {
  const base = getApiBase();
  if (base.startsWith('http://') || base.startsWith('https://')) {
    return base;
  }
  if (typeof window !== 'undefined') {
    return `${window.location.origin}${base}`;
  }
  return base;
}

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
  const apiBase = getApiBase();
  const directBase = getDirectFallbackBase();

  try {
    let res: Response | null = null;
    let primaryErr: any = null;

    try {
      res = await fetch(`${apiBase}${endpoint}`, {
        ...options,
        signal: controller.signal,
      });
      // If primary returned 502/504 Bad Gateway or 500, attempt direct fallback if available
      if (directBase && !res.ok && (res.status === 502 || res.status === 504 || res.status === 500)) {
        try {
          const directRes = await fetch(`${directBase}${endpoint}`, {
            ...options,
            signal: controller.signal,
          });
          if (directRes.ok) {
            res = directRes;
          }
        } catch {
          // Direct fallback failed, keep primary response
        }
      }
    } catch (err: any) {
      primaryErr = err;
      // Network failure on primary route, attempt direct fallback if available
      if (directBase) {
        try {
          res = await fetch(`${directBase}${endpoint}`, {
            ...options,
            signal: controller.signal,
          });
        } catch {
          throw primaryErr;
        }
      } else {
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
    const targetDesc = getApiEndpointDisplay();
    if (err?.name === 'AbortError') {
      throw new ApiConnectionError(
        `Request timed out after ${REQUEST_TIMEOUT_MS / 1000}s (${endpoint}). Ensure FastAST API server is running at ${targetDesc}.`,
        endpoint
      );
    }
    throw new ApiConnectionError(
      `Cannot reach FastAST API server at ${targetDesc} (${endpoint}). Start it with "fastast serve" or check your network configuration.`,
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
