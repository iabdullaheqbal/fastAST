import React, { useEffect, useState } from 'react';
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
import type { RepoStats } from './types';

const AppContent: React.FC = () => {
  const [stats, setStats] = useState<RepoStats | null>(null);
  const [isReindexing, setIsReindexing] = useState(false);
  const navigate = useNavigate();

  const loadStats = async () => {
    try {
      const data = await fastAstApi.getStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handleReindex = async () => {
    setIsReindexing(true);
    try {
      await fastAstApi.triggerReindex(true);
      await loadStats();
    } catch (err) {
      console.error('Reindex failed:', err);
    } finally {
      setIsReindexing(false);
    }
  };

  const handleSearch = (_q: string) => {
    navigate('/evidence');
  };

  const handleNavigateToExplore = (_symbolName?: string, _filePath?: string) => {
    navigate('/explore');
  };

  return (
    <div className="app-layout">
      {/* Pinned Left Sidebar */}
      <AppSidebar stats={stats} />

      {/* Main Workspace Frame */}
      <div className="workbench-main">
        <AppHeader
          stats={stats}
          onReindex={handleReindex}
          isReindexing={isReindexing}
          onSearch={handleSearch}
        />

        {/* Viewport Content */}
        <main className="workbench-viewport">
          <Routes>
            <Route path="/" element={<Navigate to="/globe" replace />} />
            <Route
              path="/globe"
              element={<GlobePage onNavigateToExplore={handleNavigateToExplore} />}
            />
            <Route
              path="/explore"
              element={<ExplorePage />}
            />
            <Route path="/architecture" element={<ArchitecturePage />} />
            <Route path="/evidence" element={<EvidencePage />} />
            <Route path="/coverage" element={<CoveragePage />} />
            <Route path="/communities" element={<CommunitiesPage />} />
            <Route path="/system" element={<SystemPage />} />
            <Route path="*" element={<Navigate to="/globe" replace />} />
          </Routes>
        </main>
      </div>

      <style>{`
        .app-layout {
          display: flex;
          width: 100vw;
          height: 100vh;
          overflow: hidden;
          background: var(--surface-lowest);
        }
        .workbench-main {
          margin-left: 256px;
          flex: 1;
          display: flex;
          flex-direction: column;
          height: 100vh;
          overflow: hidden;
        }
        .workbench-viewport {
          margin-top: 56px;
          flex: 1;
          height: calc(100vh - 56px);
          overflow: hidden;
          position: relative;
        }
      `}</style>
    </div>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
