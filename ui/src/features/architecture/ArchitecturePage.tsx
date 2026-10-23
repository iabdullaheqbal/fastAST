import { Layers, Database, Cpu, Search, Sparkles, Terminal } from 'lucide-react';

export const ArchitecturePage: React.FC = () => {
  const layers = [
    {
      id: 'ast',
      title: '1. Multi-Language Tree-Sitter AST Extraction',
      badge: 'Rust Core (sub-5ms)',
      color: 'border-cyan-500/30 bg-cyan-500/5 text-cyan-400',
      icon: <Cpu className="w-5 h-5 text-cyan-400" />,
      desc: 'Zero-copy Tree-Sitter parsing across 9 supported languages (Python, JS, TS, Java, Rust, HTML, CSS, JSON, TOML). Extracts declarations, parameters, signatures, docstrings, imports, and invocations.',
      metrics: ['9 Languages', 'Tree-Sitter Grammars', 'Incremental Hashing'],
    },
    {
      id: 'graph',
      title: '2. Persistent Code Graph & SQLite WAL Store',
      badge: 'Local SQLite WAL',
      color: 'border-indigo-500/30 bg-indigo-500/5 text-indigo-400',
      icon: <Database className="w-5 h-5 text-indigo-400" />,
      desc: 'Stores normalized entities (`files`, `symbols`, `imports`, `calls`, `edges`) with recursive trigger cascades, indexed B-trees, and concurrency-safe WAL journal mode in `.fastast.db`.',
      metrics: ['126 Files', '1,267 Symbols', '13,346 Edges'],
    },
    {
      id: 'cluster',
      title: '3. Louvain Modularity & MinHash Structural Similarity',
      badge: 'Graph Topology',
      color: 'border-purple-500/30 bg-purple-500/5 text-purple-400',
      icon: <Sparkles className="w-5 h-5 text-purple-400" />,
      desc: 'Detects cohesive architectural modules with Louvain modularity optimization ($Q=0.84$). Employs 64-permutation MinHash signatures with 16-band Locality-Sensitive Hashing (LSH) for clone detection.',
      metrics: ['Louvain Q=0.84', '20 Communities', 'MinHash + LSH'],
    },
    {
      id: 'retrieval',
      title: '4. Hybrid Dense + BM25 FTS5 Token-Conscious Retrieval',
      badge: 'RRF Ranker',
      color: 'border-amber-500/30 bg-amber-500/5 text-amber-400',
      icon: <Search className="w-5 h-5 text-amber-400" />,
      desc: 'Blends dense semantic embeddings with SQLite FTS5 BM25 lexical ranking and graph degree centrality using Reciprocal Rank Fusion (RRF). Eliminates context saturation through layered pruning.',
      metrics: ['FTS5 BM25', 'Dense Projections', 'Token Budgets'],
    },
    {
      id: 'agent',
      title: '5. Agent-Native Model Context Protocol (MCP) Bridge',
      badge: 'JSON-RPC 2.0 stdio',
      color: 'border-emerald-500/30 bg-emerald-500/5 text-emerald-400',
      icon: <Terminal className="w-5 h-5 text-emerald-400" />,
      desc: 'Standardized tool suite exposed over stdio JSON-RPC 2.0 for Claude Code, Cursor, Windsurf, and SWE-bench harnesses. Complete CLI parity between `fastast` and `fastast-mcp`.',
      metrics: ['13 Tools', 'Claude Code Ready', 'Cursor IDE Ready'],
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-[#0c0e14] space-y-8 select-none">
      {/* Header */}
      <div className="max-w-5xl mx-auto space-y-2">
        <div className="flex items-center space-x-2 text-xs font-mono text-cyan-400">
          <Layers className="w-4 h-4" />
          <span>CODEBASE MEMORY BLUEPRINT</span>
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          FastAST System Architecture
        </h1>
        <p className="text-xs text-[#94a3b8] max-w-2xl leading-relaxed">
          High-performance pipeline decoupling large codebases into compact, token-bounded evidence windows
          via Tree-Sitter syntax extraction, SQLite graph relational memory, and hybrid RRF retrieval.
        </p>
      </div>

      {/* Layered Pipeline Cards */}
      <div className="max-w-5xl mx-auto space-y-4">
        {layers.map((layer, idx) => (
          <div
            key={layer.id}
            className="p-5 rounded-xl bg-[#11141d] border border-[#1e293b] hover:border-[#28334a] transition space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-[#161b26] border border-[#232b3e]">
                  {layer.icon}
                </div>
                <h2 className="text-sm font-bold text-white">{layer.title}</h2>
              </div>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${layer.color}`}>
                {layer.badge}
              </span>
            </div>

            <p className="text-xs text-[#cbd5e1] leading-relaxed pl-11">
              {layer.desc}
            </p>

            <div className="flex items-center space-x-2 pl-11 pt-1">
              {layer.metrics.map((m) => (
                <span
                  key={m}
                  className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#161b26] text-[#94a3b8] border border-[#232b3e]"
                >
                  {m}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
