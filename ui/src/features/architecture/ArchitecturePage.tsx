import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fastAstApi } from '../../services/api';
import type { Community, GlobeHubSymbol, RepoStats } from '../../types';

export const ArchitecturePage: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<RepoStats | null>(null);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [hubs, setHubs] = useState<GlobeHubSymbol[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fastAstApi.getStats(),
      fastAstApi.getCommunities(12),
      fastAstApi.getGlobeTopology({ mode: 'neighborhood', depth: 1 }),
    ])
      .then(([s, comms, globe]) => {
        setStats(s);
        setCommunities(comms);
        setHubs(globe.hub_symbols || []);
      })
      .catch((err) => {
        setApiError(err?.message || 'Failed to load live architecture data.');
      });
  }, []);

  const pipelineStages = [
    {
      num: '01',
      title: 'Discovery & Admission',
      module: 'python/fastast/discovery.py',
      desc: 'Multi-layer ignore filtering (.gitignore, .fastastignore) and SHA-256 content hashing.',
    },
    {
      num: '02',
      title: 'Rust Tree-Sitter AST Core',
      module: 'src/lib.rs',
      desc: 'Compiled Rust Tree-Sitter parsers extracting symbols, signatures, imports, and calls across 9 languages.',
    },
    {
      num: '03',
      title: 'SQLite WAL Graph Store',
      module: 'python/fastast/db.py',
      desc: 'Persistent relational graph (.fastast.db) storing files, symbols, calls, edges, and FTS5 postings.',
    },
    {
      num: '04',
      title: 'Hybrid Retrieval & Evidence',
      module: 'python/fastast/retrieval.py',
      desc: 'Combines BM25 lexical search, dense embeddings, and graph degree centrality into token-bounded snippets.',
    },
    {
      num: '05',
      title: 'Louvain & MinHash LSH',
      module: 'python/fastast/communities.py',
      desc: 'Detects modular subsystems via Louvain community detection and near-duplicate symbols via MinHash LSH.',
    },
    {
      num: '06',
      title: 'CLI, MCP & HTTP Bridge',
      module: 'python/fastast/api_server.py',
      desc: 'Exposes identical codebase memory tools over CLI, stdio MCP JSON-RPC, and HTTP REST API (:4200).',
    },
  ];

  return (
    <div className="arch-page">
      <div className="arch-header">
        <div>
          <h1 className="arch-title">Repository Architecture & Hotspots</h1>
          <p className="arch-subtitle">
            Live architectural subsystems, central hub symbols, and FastAST pipeline map
          </p>
        </div>
        {stats && (
          <div className="arch-metrics font-code">
            <span className="metric-chip">
              <strong>{stats.files}</strong> files
            </span>
            <span className="metric-chip">
              <strong className="text-primary">{stats.symbols}</strong> symbols
            </span>
            <span className="metric-chip">
              <strong className="text-tertiary">{stats.edges}</strong> edges
            </span>
          </div>
        )}
      </div>

      <div className="arch-scroll">
        {apiError && (
          <div className="api-error-banner">
            <div>{apiError}</div>
          </div>
        )}

        {/* 1. Live Architectural Hotspots & Subsystem Clusters */}
        <div className="arch-two-col">
          {/* Top Hub Symbols in Repository */}
          <div className="arch-panel">
            <div className="panel-hdr font-code">
              <span>Top Central Hub Symbols (Live Graph Degree)</span>
              <span className="text-primary">{hubs.length} hubs</span>
            </div>
            <div className="hubs-table-wrap font-code">
              {hubs.length > 0 ? (
                <table className="arch-table">
                  <thead>
                    <tr>
                      <th>Symbol</th>
                      <th>Kind</th>
                      <th>Module Path</th>
                      <th>Degree</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hubs.slice(0, 10).map((h) => (
                      <tr
                        key={h.id}
                        onClick={() =>
                          navigate(
                            `/explore?file=${encodeURIComponent(
                              h.file_path
                            )}&symbol=${encodeURIComponent(h.name)}`
                          )
                        }
                      >
                        <td className="text-primary font-semibold">{h.name}</td>
                        <td>
                          <span className="kind-pill">{h.kind}</span>
                        </td>
                        <td className="text-outline">{h.file_path}</td>
                        <td className="text-tertiary font-bold">{h.degree}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-4 text-outline text-xs">Loading hub symbols...</div>
              )}
            </div>
          </div>

          {/* Live Detected Subsystems (Communities) */}
          <div className="arch-panel">
            <div className="panel-hdr font-code">
              <span>Detected Architectural Subsystems (Louvain)</span>
              <span className="text-secondary">{communities.length} clusters</span>
            </div>
            <div className="subsystems-list font-code">
              {communities.slice(0, 8).map((c) => (
                <div
                  key={c.id}
                  className="subsystem-row"
                  onClick={() => navigate('/communities')}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="sub-dot"
                      style={{ backgroundColor: c.color }}
                    />
                    <span className="font-semibold text-on-surface truncate">
                      {c.name}
                    </span>
                  </div>
                  <span className="text-outline text-xs">
                    {c.member_count} symbols • Q={c.modularity}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 2. FastAST Engine Pipeline Map (Clickable to Explore source files) */}
        <div className="arch-panel">
          <div className="panel-hdr font-code">
            <span>FastAST Engine Pipeline Modules (Click any module to open in Explore)</span>
          </div>
          <div className="stages-grid">
            {pipelineStages.map((st) => (
              <div
                key={st.num}
                className="stage-card"
                onClick={() => navigate(`/explore?file=${encodeURIComponent(st.module)}`)}
              >
                <div className="stage-top font-code">
                  <span className="stage-num">{st.num}</span>
                  <span className="stage-mod">{st.module}</span>
                </div>
                <div className="stage-title">{st.title}</div>
                <p className="stage-desc">{st.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .arch-page {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          background: var(--surface-lowest);
          overflow: hidden;
        }
        .arch-header {
          padding: 14px 20px;
          background: var(--surface);
          border-bottom: 1px solid var(--hairline);
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-shrink: 0;
        }
        .arch-title {
          font-size: 15px;
          font-weight: 700;
          color: var(--on-surface);
          margin: 0;
        }
        .arch-subtitle {
          font-size: 12px;
          color: var(--outline);
          margin: 2px 0 0 0;
        }
        .arch-metrics {
          display: flex;
          gap: 8px;
        }
        .metric-chip {
          background: var(--surface-low);
          border: 1px solid var(--hairline);
          padding: 4px 10px;
          border-radius: 4px;
          font-size: 11.5px;
          color: var(--on-surface-variant);
        }
        .arch-scroll {
          flex: 1;
          overflow-y: auto;
          padding: 18px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          max-width: 1360px;
          width: 100%;
          margin: 0 auto;
        }
        .arch-two-col {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 16px;
        }
        .arch-panel {
          background: var(--surface);
          border: 1px solid var(--hairline);
          border-radius: 6px;
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .panel-hdr {
          display: flex;
          justify-content: space-between;
          font-size: 10.5px;
          text-transform: uppercase;
          color: var(--outline);
          font-weight: 700;
        }
        .hubs-table-wrap {
          overflow-x: auto;
        }
        .arch-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 11.5px;
        }
        .arch-table th {
          text-align: left;
          padding: 6px 8px;
          border-bottom: 1px solid var(--hairline);
          color: var(--outline);
          font-size: 10px;
          text-transform: uppercase;
        }
        .arch-table td {
          padding: 6px 8px;
          border-bottom: 1px solid var(--hairline);
          cursor: pointer;
        }
        .arch-table tr:hover td {
          background: var(--surface-low);
        }
        .kind-pill {
          background: var(--surface-high);
          color: var(--on-surface-variant);
          padding: 1px 5px;
          border-radius: 3px;
          font-size: 9.5px;
          text-transform: uppercase;
        }
        .subsystems-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .subsystem-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 8px 10px;
          background: var(--surface-low);
          border: 1px solid var(--hairline);
          border-radius: 5px;
          font-size: 12px;
          cursor: pointer;
        }
        .subsystem-row:hover {
          border-color: var(--primary);
        }
        .sub-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .stages-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 12px;
        }
        .stage-card {
          background: var(--surface-low);
          border: 1px solid var(--hairline);
          border-radius: 6px;
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          cursor: pointer;
        }
        .stage-card:hover {
          border-color: var(--primary);
          background: var(--surface-container);
        }
        .stage-top {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
        }
        .stage-num {
          color: var(--primary);
          font-weight: 700;
        }
        .stage-mod {
          color: var(--outline);
        }
        .stage-title {
          font-size: 13.5px;
          font-weight: 700;
          color: var(--on-surface);
        }
        .stage-desc {
          margin: 0;
          font-size: 11.5px;
          color: var(--on-surface-variant);
          line-height: 1.45;
        }
      `}</style>
    </div>
  );
};
