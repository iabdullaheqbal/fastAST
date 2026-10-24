import React, { useCallback, useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { AppHeader } from './components/AppHeader';
import { AppSidebar } from './components/AppSidebar';
import { ArchitecturePage } from './features/architecture/ArchitecturePage';
import { CommunitiesPage } from './features/communities/CommunitiesPage';
import { CoveragePage } from './features/coverage/CoveragePage';
import { EvidencePage } from './features/evidence/EvidencePage';
import { ExplorePage } from './features/explore/ExplorePage';
import { GlobePage } from './features/globe/GlobePage';
import { SystemPage } from './features/system/SystemPage';
import { fastAstApi } from './services/api';
import type { HealthStatus, RepoStats } from './types';

const AppWorkspace: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<RepoStats | null>(null);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isReindexing, setIsReindexing] = useState(false);

  const loadBackendState = useCallback(async () => {
    try {
      const [healthRes, statsRes] = await Promise.all([
        fastAstApi.getHealth(),
        fastAstApi.getStats(),
      ]);
      setHealth(healthRes);
      setStats(statsRes);
      setApiError(null);
    } catch (err: any) {
      setApiError(
        err?.message ||
          'Cannot connect to FastAST API Server on http://127.0.0.1:4200.'
      );
    }
  }, []);

  useEffect(() => {
    loadBackendState();
  }, [loadBackendState]);

  const handleSearchSubmit = (query: string) => {
    navigate(`/evidence?q=${encodeURIComponent(query)}`);
  };

  const handleReindex = async () => {
    setIsReindexing(true);
    try {
      await fastAstApi.triggerReindex(false);
      await loadBackendState();
    } catch (err: any) {
      setApiError(err?.message || 'Re-index request failed.');
    } finally {
      setIsReindexing(false);
    }
  };

  const handleNavigateToExplore = (symbolName: string, filePath?: string) => {
    const params = new URLSearchParams();
    if (filePath) params.set('file', filePath);
    if (symbolName) params.set('symbol', symbolName);
    navigate(`/explore?${params.toString()}`);
  };

  return (
    <div className="app-root">
      <AppHeader
        stats={stats}
        health={health}
        apiError={apiError}
        onSearchSubmit={handleSearchSubmit}
        onReindex={handleReindex}
        onRetryConnection={loadBackendState}
        isReindexing={isReindexing}
      />

      <div className="app-body">
        <AppSidebar stats={stats} health={health} apiError={apiError} />

        <div className="app-main-viewport">
          {apiError && (
            <div className="global-error-strip">
              <div className="api-error-banner">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className="material-symbols-outlined text-error">error</span>
                  <div>
                    <strong>Backend API Unreachable:</strong> {apiError} Run{' '}
                    <code>fastast serve --port 4200</code> or <code>./start_ui.sh</code> from the
                    repository root.
                  </div>
                </div>
                <button className="api-retry-btn" onClick={loadBackendState}>
                  Retry Connection
                </button>
              </div>
            </div>
          )}

          <Routes>
            <Route path="/" element={<Navigate to="/globe" replace />} />
            <Route
              path="/globe"
              element={
                <GlobePage
                  stats={stats}
                  onNavigateToExplore={handleNavigateToExplore}
                />
              }
            />
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/architecture" element={<ArchitecturePage />} />
            <Route path="/evidence" element={<EvidencePage />} />
            <Route path="/coverage" element={<CoveragePage />} />
            <Route path="/communities" element={<CommunitiesPage />} />
            <Route
              path="/system"
              element={
                <SystemPage
                  health={health}
                  apiError={apiError}
                  onRefreshGlobal={loadBackendState}
                />
              }
            />
            <Route path="*" element={<Navigate to="/globe" replace />} />
          </Routes>
        </div>
      </div>

      <style>{`
        .app-root {
          width: 100vw;
          height: 100vh;
          display: flex;
          flex-direction: column;
          background: var(--surface-lowest);
          overflow: hidden;
        }
        .app-body {
          flex: 1;
          display: flex;
          overflow: hidden;
          position: relative;
        }
        .app-main-viewport {
          flex: 1;
          height: calc(100vh - 52px);
          overflow: hidden;
          position: relative;
          display: flex;
          flex-direction: column;
        }
        .global-error-strip {
          padding: 10px 16px 0 16px;
          background: var(--surface-lowest);
          z-index: 35;
        }
      `}</style>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AppWorkspace />
    </BrowserRouter>
  );
};

export default App;
