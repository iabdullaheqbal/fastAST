export type SymbolKind =
  | 'function'
  | 'async_function'
  | 'class'
  | 'method'
  | 'struct'
  | 'type'
  | 'interface'
  | 'file'
  | 'module';

export type EdgeType =
  | 'CALLS'
  | 'IMPORTS'
  | 'DEFINES'
  | 'INHERITS'
  | 'SIMILAR_TO'
  | string;

export interface RepoStats {
  files: number;
  symbols: number;
  imports: number;
  calls: number;
  edges: number;
  languages: Record<string, number>;
  categories: Record<string, number>;
  error?: string | null;
}

export interface SymbolItem {
  id: number;
  name: string;
  kind: SymbolKind | string;
  signature: string;
  start_line: number;
  end_line: number;
  file_path: string;
  confidence?: number;
  docstring?: string | null;
  community_id?: number;
}

export interface GlobeNode {
  id: number | string;
  idx: number;
  name: string;
  kind: SymbolKind | string;
  signature?: string;
  file_path?: string;
  start_line?: number;
  end_line?: number;
  comm: number;
  comm_name: string;
  comm_color: string;
  importance: number;
  lat: number;
  lon: number;
  in_degree?: number;
  out_degree?: number;
  active?: boolean;
}

export interface GlobeEdge {
  from: number;
  to: number;
  src: string;
  dst: string;
  type: EdgeType;
  color: string;
  line?: number;
}

export interface Community {
  id: number;
  name: string;
  color: string;
  member_count: number;
  modularity?: number;
  sample_symbols?: string[];
  sample_files?: string[];
}

export interface GlobeTopology {
  nodes: GlobeNode[];
  edges: GlobeEdge[];
  communities: Community[];
  file_nodes?: Array<{
    id: string;
    path: string;
    name: string;
    language: string;
    lines: number;
  }>;
  total_nodes: number;
  total_edges: number;
  modularity: number;
}

export interface FileItem {
  id: number;
  path: string;
  language: string;
  category: string;
  total_lines: number;
  total_tokens: number;
  status: string;
  symbol_count: number;
}

export interface FileOutlineSymbol {
  name: string;
  kind: string;
  start_line: number;
  end_line: number;
  docstring?: string;
  signature?: string;
}

export interface FileOutlineClass {
  name: string;
  start_line: number;
  end_line: number;
  methods: FileOutlineSymbol[];
}

export interface FileOutline {
  file_path: string;
  language: string;
  total_lines: number;
  classes: FileOutlineClass[];
  functions: FileOutlineSymbol[];
  other_symbols: FileOutlineSymbol[];
}

export interface EvidenceSnippet {
  symbol_name?: string;
  file_path: string;
  start_line: number;
  end_line: number;
  snippet: string;
  token_count?: number;
  kind?: string;
}

export interface EvidenceBundle {
  query: string;
  total_tokens_estimate: number;
  candidates: Array<{
    name: string;
    kind: string;
    file_path: string;
    score?: number;
    start_line: number;
    end_line: number;
  }>;
  snippets: EvidenceSnippet[];
  files: string[];
  relationships?: Array<{
    src: string;
    dst: string;
    relation: string;
  }>;
}

export interface CallGraphRelationship {
  src: string;
  dst: string;
  relation: string;
  file_path?: string;
  line_number?: number;
}

export interface CallGraphData {
  symbol: string;
  caller_count: number;
  callee_count: number;
  callers: Array<{ caller: string; file_path: string; line_number: number }>;
  callees: Array<{ callee: string; file_path: string; line_number: number }>;
  relationships: CallGraphRelationship[];
}

export interface SimilarSymbol {
  symbol: string;
  file_path: string;
  similarity: number;
  kind?: string;
  start_line?: number;
}
