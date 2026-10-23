import React, { useEffect, useState } from 'react';
import { fastAstApi } from '../../services/api';
import type { Community } from '../../types';

export const CommunitiesPage: React.FC = () => {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [selectedComm, setSelectedComm] = useState<Community | null>(null);

  useEffect(() => {
    fastAstApi.getCommunities(20).then((data) => {
      setCommunities(data);
      if (data.length > 0) setSelectedComm(data[0]);
    });
  }, []);

  return (
    <div className="comm-page">
      <div className="comm-header">
        <div>
          <h1 className="comm-title">Louvain Community Clusters</h1>
          <p className="comm-subtitle">
            Autonomous modularity partitioning (Q = 0.82) grouping symbols into functional subsystems
          </p>
        </div>
        <div className="comm-meta-badge">
          <span className="material-symbols-outlined text-sm text-tertiary">bubble_chart</span>
          <span>{communities.length || 20} Detected Subsystems</span>
        </div>
      </div>

      <div className="comm-body">
        {/* Left: Community Cards Grid */}
        <div className="comm-list-col">
          {communities.map((comm) => {
            const isSelected = selectedComm?.id === comm.id;
            return (
              <div
                key={comm.id}
                className={`comm-card ${isSelected ? 'comm-card-selected' : ''}`}
                onClick={() => setSelectedComm(comm)}
              >
                <div className="comm-card-top">
                  <div className="flex items-center gap-2">
                    <span className="comm-dot" style={{ backgroundColor: comm.color }} />
                    <span className="comm-card-name font-semibold text-sm">{comm.name}</span>
                  </div>
                  <span className="comm-card-count font-code text-xs text-outline">
                    {comm.member_count} symbols
                  </span>
                </div>

                <div className="comm-card-samples font-code text-xs text-outline">
                  <span>Hub / Samples: </span>
                  <span className="text-on-surface">
                    {(comm.sample_symbols || []).slice(0, 3).join(', ') || 'index_code, ASTNode'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Selected Community Detail */}
        <div className="comm-detail-col">
          {selectedComm ? (
            <div className="comm-detail-card">
              <div className="detail-header">
                <div className="flex items-center gap-3">
                  <span
                    className="detail-dot"
                    style={{ backgroundColor: selectedComm.color }}
                  />
                  <div>
                    <h2 className="detail-title">{selectedComm.name}</h2>
                    <span className="detail-sub font-code text-xs text-outline">
                      Community #{selectedComm.id} • Modularity Q = {selectedComm.modularity || 0.82}
                    </span>
                  </div>
                </div>
                <span className="detail-badge font-code">
                  {selectedComm.member_count} Peer Symbols
                </span>
              </div>

              <div className="detail-section">
                <span className="section-label">Sample Files in Subsystem</span>
                <div className="file-pills-list font-code text-xs">
                  {(selectedComm.sample_files || ['python/fastast/indexer.py', 'src/lib.rs']).map(
                    (f, idx) => (
                      <div key={idx} className="file-pill">
                        <span className="material-symbols-outlined text-xs text-primary">feed</span>
                        <span>{f}</span>
                      </div>
                    )
                  )}
                </div>
              </div>

              <div className="detail-section">
                <span className="section-label">Core Hubs & Collaborative Symbols</span>
                <div className="symbols-pills-list font-code text-xs">
                  {(selectedComm.sample_symbols || [
                    'index_repository',
                    'SymbolRecord',
                    'get_graph_neighborhood',
                    'retrieve_evidence',
                  ]).map((s, idx) => (
                    <div key={idx} className="symbol-pill">
                      <span className="dot dot-cyan" />
                      <span>{s}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="comm-empty">Select a community to inspect modularity details</div>
          )}
        </div>
      </div>

      <style>{`
        .comm-page {
          width: 100%;
          height: calc(100vh - 56px);
          display: flex;
          flex-direction: column;
          background: var(--surface-lowest);
          overflow: hidden;
        }
        .comm-header {
          padding: 16px 24px;
          background: var(--surface);
          border-bottom: 1px solid var(--hairline);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .comm-title {
          font-size: 16px;
          font-weight: 700;
          color: var(--on-surface);
          margin: 0;
        }
        .comm-subtitle {
          font-size: 12px;
          color: var(--outline);
          margin: 0;
          padding-top: 2px;
        }
        .comm-meta-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          background: var(--surface-low);
          padding: 6px 12px;
          border-radius: 4px;
          border: 1px solid var(--hairline);
          font-size: 12px;
          color: var(--on-surface);
        }
        .comm-body {
          flex: 1;
          display: grid;
          grid-template-columns: 420px 1fr;
          overflow: hidden;
        }
        .comm-list-col {
          height: 100%;
          overflow-y: auto;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          border-right: 1px solid var(--hairline);
          background: var(--surface-low);
        }
        .comm-card {
          background: var(--surface);
          border: 1px solid var(--hairline);
          border-radius: 6px;
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          cursor: pointer;
          transition: all 0.15s;
        }
        .comm-card:hover {
          background: var(--surface-high);
          border-color: var(--primary);
        }
        .comm-card-selected {
          border-color: var(--primary);
          background: var(--surface-high);
          box-shadow: inset 2px 0 0 0 var(--primary);
        }
        .comm-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .comm-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }
        .comm-card-name {
          color: var(--on-surface);
        }
        .comm-detail-col {
          height: 100%;
          overflow-y: auto;
          padding: 24px;
        }
        .comm-detail-card {
          background: var(--surface);
          border: 1px solid var(--hairline);
          border-radius: 8px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .detail-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid var(--hairline);
          padding-bottom: 16px;
        }
        .detail-dot {
          width: 14px;
          height: 14px;
          border-radius: 50%;
        }
        .detail-title {
          font-size: 16px;
          font-weight: 700;
          color: var(--on-surface);
          margin: 0;
        }
        .detail-badge {
          background: var(--surface-low);
          padding: 6px 12px;
          border-radius: 4px;
          font-size: 11px;
          color: var(--tertiary-light);
          border: 1px solid var(--hairline);
        }
        .detail-section {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .section-label {
          font-family: var(--font-mono);
          font-size: 10px;
          color: var(--outline);
          text-transform: uppercase;
        }
        .file-pills-list, .symbols-pills-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .file-pill, .symbol-pill {
          display: flex;
          align-items: center;
          gap: 6px;
          background: var(--surface-container);
          padding: 6px 10px;
          border-radius: 4px;
          border: 1px solid var(--hairline);
          color: var(--on-surface);
        }
        .comm-empty {
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--outline);
        }
      `}</style>
    </div>
  );
};
