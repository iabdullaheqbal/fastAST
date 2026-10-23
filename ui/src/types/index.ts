export type SymbolKind =
  | 'function'
  | 'method'
  | 'class'
  | 'struct'
  | 'type'
  | 'interface'
  | 'module'
  | 'file'
  | 'variable'
  | 'constant';

export interface SymbolItem {
  id?: number | string;
  name: string;
  kind: SymbolKind | string;
  file_path: string;
  line_start: number;
  line_end: number;
  signature?: string;
  docstring?: string;
  parent_symbol?: string;
  language?: string;
}

export interface RepositoryStats {
  files: number;
  symbols: number;
  imports: number;
  calls: number;
  edges: number;
  languages: Record<string, number>;
  categories?: Record<string, number>;
  db_path?: string;
  error?: string | null;
}

export interface GlobeNode {
  id: number;
  name: string;
  kind: string;
  comm: number;
  file: string;
  lines: string;
  signature?: string;
  importance: number;
  lat: number;
  lon: number;
  x: number;
  y: number;
  z: number;
  active?: boolean;
}

export interface GlobeEdge {
  from: number;
  to: number;
  type: string;
  weight: number;
}

export interface CommunityItem {
  id: number;
  name: string;
  color?: string | number;
  size?: number;
  hub_symbol?: string;
  members_count?: number;
  description?: string;
}

export interface GlobeGraphData {
  communities: CommunityItem[];
  nodes: GlobeNode[];
  edges: GlobeEdge[];
  meta: {
    total_nodes: number;
    total_edges: number;
    radius: number;
    louvain_modularity: number;
  };
}

export interface EvidenceItem {
  symbol_name: string;
  file_path: string;
  lines: string;
  score?: number;
  estimated_tokens?: number;
  snippet?: string;
  signature?: string;
  reason?: string;
  callers?: string[];
  callees?: string[];
}

export interface EvidenceBundle {
  query: string;
  total_tokens: number;
  budget_tokens: number;
  items: EvidenceItem[];
  meta?: Record<string, unknown>;
}

export interface FileOutlineItem {
  name: string;
  kind: string;
  line_start: number;
  line_end: number;
  signature?: string;
  children?: FileOutlineItem[];
}

export interface DiagnosticsReport {
  database_valid: boolean;
  schema_version: number;
  wal_mode: boolean;
  file_count: number;
  symbol_count: number;
  integrity_check: string;
  lock_status: string;
}

