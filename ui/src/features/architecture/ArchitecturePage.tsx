import React from 'react';

export const ArchitecturePage: React.FC = () => {
  const layers = [
    {
      num: '01',
      title: 'Multi-Language AST Ingestion',
      tech: 'Rust Core + Tree-sitter (9 Languages)',
      color: '#38bdf8',
      desc: 'Blazing-fast parsing using tree-sitter grammars (Python, TypeScript, JavaScript, Rust, Java, HTML, CSS, JSON, TOML). Incrementally admits files with SHA-256 caching and skips unchanged files.',
      features: ['Tree-sitter native bindings', 'Deterministic hash caching', '142 files in 3.6s'],
    },
    {
      num: '02',
      title: 'Canonical Normalizer & Model',
      tech: 'SymbolRecord, FileRecord, EdgeRecord',
      color: '#818cf8',
      desc: 'Extracts classes, methods, functions, invocations, imports, and definitions into unified AST records with exact line/byte offsets and cyclomatic complexity metrics.',
      features: ['Zero raw-file dumping', 'Uniform cross-language schema', 'Deterministic IDs'],
    },
    {
      num: '03',
      title: 'Persistent Graph & FTS5 Storage',
      tech: 'SQLite 3 with WAL Mode & FTS5 (.fastast.db)',
      color: '#34d399',
      desc: 'High-concurrency SQLite storage with Write-Ahead Logging (WAL) and Full-Text Search 5. Stores 13,500+ edges and 1,330 symbols with sub-millisecond query latency.',
      features: ['WAL Mode Concurrency', 'FTS5 token indexing', 'Multi-process reader locks'],
    },
    {
      num: '04',
      title: 'Louvain Modularity Communities',
      tech: 'Graph Partitioning (Modularity Q=0.82)',
      color: '#c084fc',
      desc: 'Detects architectural clusters and functional subsystems automatically via Louvain modularity optimization on the call and import dependency graph.',
      features: ['20 cohesive communities', 'Hub symbol identification', 'Centroid ranking'],
    },
    {
      num: '05',
      title: 'Near-Duplicate Clone Detection',
      tech: 'MinHash + Locality Sensitive Hashing (LSH)',
      color: '#fbbf24',
      desc: 'Indexes symbol token n-grams into MinHash signatures and LSH buckets to detect copy-pasted implementations and structurally similar code across modules.',
      features: ['Jaccard similarity threshold', 'O(1) clone lookups', 'Refactoring candidates'],
    },
    {
      num: '06',
      title: 'Token-Bounded Hybrid Retrieval',
      tech: 'Dense Vector + BM25 + Graph Neighborhood',
      color: '#38bdf8',
      desc: 'Synthesizes hybrid reciprocal rank fusion (RRF) with bounded context expansion. Extracts minimal definition windows within strict token budgets for coding agents.',
      features: ['Strict token budget enforcement', 'Omission indicators', '1-Hop neighbor expansion'],
    },
    {
      num: '07',
      title: 'Agent Protocol Bridges',
      tech: 'MCP Protocol (Stdio JSON-RPC 2.0) & REST API (:4200)',
      color: '#f43f5e',
      desc: 'Seamless interoperability with Claude Code, Cursor, Windsurf, and custom autonomous agents via standardized Model Context Protocol tools and fast HTTP endpoints.',
      features: ['Standard MCP 2.0 tools', 'CORS-enabled REST API', 'Interactive Web Lens UI'],
    },
  ];

  return (
    <div className="arch-page">
      <div className="arch-header">
        <div className="arch-header-left">
          <span className="material-symbols-outlined text-primary text-2xl">layers</span>
          <div>
            <h1 className="arch-title">FastAST Engine Architecture</h1>
            <p className="arch-subtitle">
              End-to-end pipeline: Tree-sitter AST &rarr; Graph Graphing &rarr; SQLite Memory &rarr; Hybrid Retrieval
            </p>
          </div>
        </div>
        <div className="arch-metrics">
          <div className="metric-chip">
            <span className="text-outline text-xs">Modularity:</span>
            <span className="text-tertiary font-code font-bold">Q = 0.82</span>
          </div>
          <div className="metric-chip">
            <span className="text-outline text-xs">Total Graph Edges:</span>
            <span className="text-primary font-code font-bold">13,503</span>
          </div>
        </div>
      </div>

      <div className="arch-content-scroll">
        <div className="layers-grid">
          {layers.map((layer) => (
            <div key={layer.num} className="layer-card">
              <div className="layer-top">
                <span className="layer-num font-code" style={{ color: layer.color }}>
                  {layer.num}
                </span>
                <span className="layer-tech font-code">{layer.tech}</span>
              </div>
              <h3 className="layer-title">{layer.title}</h3>
              <p className="layer-desc">{layer.desc}</p>
              <div className="layer-features">
                {layer.features.map((f, i) => (
                  <span key={i} className="feature-pill">
                    <span className="dot" style={{ backgroundColor: layer.color }} />
                    {f}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .arch-page {
          width: 100%;
          height: calc(100vh - 56px);
          display: flex;
          flex-direction: column;
          background: var(--surface-lowest);
          overflow: hidden;
        }
        .arch-header {
          padding: 16px 24px;
          background: var(--surface);
          border-bottom: 1px solid var(--hairline);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .arch-header-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .arch-title {
          font-size: 16px;
          font-weight: 700;
          color: var(--on-surface);
          margin: 0;
        }
        .arch-subtitle {
          font-size: 12px;
          color: var(--outline);
          margin: 0;
          padding-top: 2px;
        }
        .arch-metrics {
          display: flex;
          gap: 12px;
        }
        .metric-chip {
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--surface-low);
          padding: 6px 12px;
          border-radius: 4px;
          border: 1px solid var(--hairline);
        }
        .arch-content-scroll {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
        }
        .layers-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
          gap: 16px;
          max-width: 1400px;
          margin: 0 auto;
        }
        .layer-card {
          background: var(--surface);
          border: 1px solid var(--hairline);
          border-radius: 8px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          transition: border-color 0.2s, transform 0.2s;
        }
        .layer-card:hover {
          border-color: var(--primary);
          transform: translateY(-2px);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
        }
        .layer-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .layer-num {
          font-size: 18px;
          font-weight: 700;
        }
        .layer-tech {
          font-size: 10px;
          color: var(--outline);
          background: var(--surface-low);
          padding: 2px 6px;
          border-radius: 3px;
        }
        .layer-title {
          margin: 0;
          font-size: 14px;
          font-weight: 600;
          color: var(--on-surface);
        }
        .layer-desc {
          margin: 0;
          font-size: 12px;
          color: var(--on-surface-variant);
          line-height: 1.5;
        }
        .layer-features {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: auto;
          padding-top: 8px;
        }
        .feature-pill {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          color: var(--outline);
          background: var(--surface-container);
          padding: 3px 8px;
          border-radius: 3px;
        }
        .dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
        }
      `}</style>
    </div>
  );
};
