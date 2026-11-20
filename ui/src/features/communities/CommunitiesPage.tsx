import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fastAstApi } from '../../services/api';
import type { Community } from '../../types';
import './CommunitiesPage.css';

export const CommunitiesPage: React.FC = () => {
  const navigate = useNavigate();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [selectedComm, setSelectedComm] = useState<Community | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [apiError, setApiError] = useState<string | null>(null);

  const loadCommunities = async () => {
    setIsLoading(true);
    setApiError(null);
    try {
      const data = await fastAstApi.getCommunities(30);
      setCommunities(data);
      if (data.length > 0) {
        setSelectedComm(data[0]);
      } else {
        setSelectedComm(null);
      }
    } catch (err: any) {
      setApiError(err?.message || 'Failed to load communities from /api/communities.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCommunities();
  }, []);

  const handleOpenExplore = (filePath?: string, symName?: string) => {
    const params = new URLSearchParams();
    if (filePath) params.set('file', filePath);
    if (symName) params.set('symbol', symName);
    navigate(`/explore?${params.toString()}`);
  };

  const handleFocusGlobe = (symName?: string) => {
    if (symName) {
      navigate(`/globe?symbol=${encodeURIComponent(symName)}`);
    } else {
      navigate('/globe');
    }
  };

  return (
    <div className="comm-page">
      <div className="comm-header">
        <div>
          <h1 className="comm-title">Louvain Modularity Communities</h1>
          <p className="comm-subtitle">
            Structural graph clusters detected from call, import, and definition edges
          </p>
        </div>
        <div className="comm-meta-badge font-code">
          <span className="material-symbols-outlined text-sm text-tertiary">bubble_chart</span>
          <span>{communities.length} Communities Loaded</span>
        </div>
      </div>

      {apiError && (
        <div className="p-4">
          <div className="api-error-banner">
            <div>{apiError}</div>
            <button className="api-retry-btn" onClick={loadCommunities}>
              Retry
            </button>
          </div>
        </div>
      )}

      <div className="comm-body">
        {/* Left: Community List */}
        <div className="comm-list-col">
          {isLoading ? (
            <div className="p-6 text-center text-outline font-code">
              Loading communities from SQLite...
            </div>
          ) : communities.length > 0 ? (
            communities.map((comm) => {
              const isSelected = selectedComm?.id === comm.id;
              return (
                <div
                  key={comm.id}
                  className={`comm-card ${isSelected ? 'comm-card-selected' : ''}`}
                  onClick={() => setSelectedComm(comm)}
                >
                  <div className="comm-card-top">
                    <div className="comm-name-wrap">
                      <span
                        className="comm-dot"
                        style={{ backgroundColor: comm.color }}
                      />
                      <span className="comm-card-name truncate">{comm.name}</span>
                    </div>
                    <span className="comm-card-count font-code">
                      {comm.member_count} symbols
                    </span>
                  </div>

                  {comm.sample_symbols && comm.sample_symbols.length > 0 && (
                    <div className="comm-card-samples font-code">
                      <span className="text-outline">Hubs: </span>
                      <span className="text-on-surface-variant">
                        {comm.sample_symbols.slice(0, 4).join(', ')}
                      </span>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="p-6 text-center text-outline font-code">
              No communities found in index. Run Re-index to compute Louvain clusters.
            </div>
          )}
        </div>

        {/* Right: Community Detail */}
        <div className="comm-detail-col">
          {selectedComm ? (
            <div className="comm-detail-card">
              <div className="detail-header">
                <div className="detail-title-group">
                  <span
                    className="detail-dot"
                    style={{ backgroundColor: selectedComm.color }}
                  />
                  <div>
                    <h2 className="detail-title">{selectedComm.name}</h2>
                    <span className="font-code text-xs text-outline">
                      Community #{selectedComm.id} • Modularity Q = {selectedComm.modularity} •{' '}
                      {selectedComm.member_count} symbols
                    </span>
                  </div>
                </div>

                <div className="detail-actions">
                  <button
                    className="btn-primary-sm"
                    onClick={() =>
                      handleFocusGlobe(
                        selectedComm.members?.[0]?.name || selectedComm.sample_symbols?.[0]
                      )
                    }
                  >
                    <span className="material-symbols-outlined text-xs">public</span>
                    <span>Focus Hub in Globe</span>
                  </button>
                  <button
                    className="btn-secondary-sm"
                    onClick={() =>
                      handleOpenExplore(
                        selectedComm.sample_files?.[0],
                        selectedComm.sample_symbols?.[0]
                      )
                    }
                  >
                    <span className="material-symbols-outlined text-xs">account_tree</span>
                    <span>Open in Explore</span>
                  </button>
                </div>
              </div>

              {/* Files in Community */}
              <div className="detail-section">
                <span className="section-label">
                  Contributing Files ({selectedComm.sample_files?.length || 0}) — Click to Explore
                </span>
                <div className="pills-wrap font-code">
                  {selectedComm.sample_files && selectedComm.sample_files.length > 0 ? (
                    selectedComm.sample_files.map((f, idx) => (
                      <button
                        key={idx}
                        className="file-pill"
                        onClick={() => handleOpenExplore(f)}
                      >
                        <span className="material-symbols-outlined text-xs text-primary">
                          description
                        </span>
                        <span>{f}</span>
                      </button>
                    ))
                  ) : (
                    <span className="text-outline text-xs">No files listed</span>
                  )}
                </div>
              </div>

              {/* Member Symbols Table */}
              <div className="detail-section">
                <span className="section-label">
                  Community Member Symbols ({selectedComm.members?.length || selectedComm.sample_symbols.length})
                </span>

                {selectedComm.members && selectedComm.members.length > 0 ? (
                  <div className="members-table-wrap font-code">
                    <table className="members-table">
                      <thead>
                        <tr>
                          <th>Kind</th>
                          <th>Symbol</th>
                          <th>File</th>
                          <th>Lines</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedComm.members.map((m) => (
                          <tr key={m.id}>
                            <td>
                              <span className="kind-chip">{m.kind}</span>
                            </td>
                            <td className="text-primary font-semibold">{m.name}</td>
                            <td className="text-outline">{m.file_path}</td>
                            <td className="text-outline">
                              L{m.start_line}–{m.end_line}
                            </td>
                            <td>
                              <div className="row-btns">
                                <button
                                  className="row-btn"
                                  onClick={() => handleOpenExplore(m.file_path, m.name)}
                                >
                                  Explore
                                </button>
                                <button
                                  className="row-btn"
                                  onClick={() => handleFocusGlobe(m.name)}
                                >
                                  Globe
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="pills-wrap font-code">
                    {selectedComm.sample_symbols.map((s, idx) => (
                      <button
                        key={idx}
                        className="file-pill"
                        onClick={() => handleFocusGlobe(s)}
                      >
                        <span className="text-primary">{s}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="comm-empty font-code">
              Select a community from the left list to inspect its member symbols and files.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
