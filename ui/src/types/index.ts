// FastAST Lens Data Types & Engine Contracts

export interface HealthStatus {
  ok: boolean;
  status: 'healthy' | 'unindexed' | 'unreachable';
  repo_path: string;
  repo_name: string;
  db_path: string;
  db_exists: boolean;
  symbol_count: number;
  file_count: number;
  edge_count: number;
  call_count: number;
  import_count: number;
  last_index_time: string | null;
}

export interface RepoStats {
  repo_name: string;
  repo_path: string;
  db_path?: string;
  files: number;
  symbols: number;
  edges: number;
  calls: number;
  imports: number;
  communities_count?: number;
  languages: Record<string, number>;
  categories?: Record<string, number>;
  symbol_kinds?: Record<string, number>;
  last_index_time?: string | null;
}

export interface FileRecord {
  path: string;
  language: string;
  category: string;
  lines: number;
  tokens: number;
  status?: string;
  has_syntax_error?: boolean;
  symbol_count?: number;
}

export interface SymbolRecord {
  id: number;
  name: string;
  kind: string;
  signature: string;
  start_line: number;
  end_line: number;
  file_path: string;
  language: string;
  docstring?: string;
  parent_name?: string;
  confidence?: number;
}

export interface CallGraphEntry {
  caller?: string;
  callee?: string;
  file_path: string;
  line_number: number;
  kind?: string;
}

export interface CallGraphResponse {
  symbol: string;
  callers: CallGraphEntry[];
  callees: CallGraphEntry[];
}

export interface GraphNode {
  id: string;
  name: string;
  kind: string;
  file_path?: string;
  start_line?: number;
  end_line?: number;
  depth?: number;
}

export interface GraphEdge {
  src: string;
  dst: string;
  relation: 'calls' | 'imports' | 'defines' | 'inherits' | 'similar_to' | string;
  confidence?: number;
  line_number?: number;
}

export interface GraphNeighborhood {
  symbol: string;
  max_depth: number;
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface EvidenceCandidate {
  id?: number;
  name: string;
  kind: string;
  file_path: string;
  signature?: string;
  score: number;
  start_line: number;
  end_line: number;
  reasons?: string[];
  neighbors?: Array<{
    name?: string;
    symbol?: string;
    relation?: string;
    direction?: string;
    file_path?: string;
  }>;
}

export interface EvidenceSnippet {
  symbol_name: string;
  file_path: string;
  start_line: number;
  end_line: number;
  snippet: string;
  token_count: number;
  score?: number;
  reasons?: string[];
  neighbors?: Array<{
    name?: string;
    symbol?: string;
    relation?: string;
    direction?: string;
    file_path?: string;
  }>;
  omitted_lines?: number;
}

export interface EvidenceBundle {
  query: string;
  ranking_method: string;
  total_tokens_estimate: number;
  max_tokens: number;
  candidates: EvidenceCandidate[];
  snippets: EvidenceSnippet[];
}

export interface CommunityMember {
  id: number;
  name: string;
  kind: string;
  file_path: string;
  start_line: number;
  end_line: number;
  signature?: string;
}

export interface Community {
  id: number;
  name: string;
  member_count: number;
  modularity: number;
  color: string;
  sample_symbols: string[];
  sample_files: string[];
  members?: CommunityMember[];
}

export interface SimilarSymbol {
  name: string;
  kind: string;
  file_path: string;
  similarity: number;
  start_line: number;
  end_line: number;
}

export interface GlobeNode {
  id: string;
  symbol_id?: number;
  name: string;
  kind: string;
  signature: string;
  start_line: number;
  end_line: number;
  file_path: string;
  language: string;
  in_degree: number;
  out_degree: number;
  importance: number;
  comm: number;
  comm_name: string;
  comm_color: string;
  hop?: number;
  is_focus?: boolean;
}

export interface GlobeEdge {
  source: string;
  target: string;
  type: 'CALLS' | 'DEFINES' | 'IMPORTS' | 'INHERITS' | 'SIMILAR_TO' | string;
}

export interface GlobeCommunity {
  id: number;
  name: string;
  color: string;
  count: number;
}

export interface GlobeHubSymbol {
  id: number;
  name: string;
  kind: string;
  file_path: string;
  degree: number;
}

export interface GlobeTopology {
  mode?: 'neighborhood' | 'full' | string;
  depth?: number;
  focus_symbol?: string | null;
  nodes: GlobeNode[];
  edges: GlobeEdge[];
  communities: GlobeCommunity[];
  hub_symbols?: GlobeHubSymbol[];
  total_nodes: number;
  total_edges: number;
  repo_total_nodes?: number;
  repo_total_edges?: number;
}

export type ActiveTab =
  | 'globe'
  | 'explore'
  | 'architecture'
  | 'evidence'
  | 'coverage'
  | 'communities'
  | 'system';
