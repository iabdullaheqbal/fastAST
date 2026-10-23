import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { ExplorePage } from './features/explore/ExplorePage';
import { GlobeGraph } from './features/globe/GlobeGraph';
import { ArchitecturePage } from './features/architecture/ArchitecturePage';
import { EvidencePage } from './features/evidence/EvidencePage';
import { CoveragePage } from './features/coverage/CoveragePage';
import { CommunitiesPage } from './features/communities/CommunitiesPage';
import { SystemPage } from './features/system/SystemPage';

export function App() {
  return (
    <Router>
      <div className="h-screen w-screen flex flex-col bg-[#0b0d13] text-[#e2e2eb] font-sans antialiased overflow-hidden">
        {/* Top Navbar */}
        <Navbar />

        {/* Workbench: Sidebar + Main Feature Viewport */}
        <div className="flex-1 flex overflow-hidden">
          <Sidebar />
          <div className="flex-1 flex flex-col overflow-hidden relative">
            <Routes>
              <Route path="/" element={<ExplorePage />} />
              <Route path="/globe" element={<GlobeGraph />} />
              <Route path="/architecture" element={<ArchitecturePage />} />
              <Route path="/evidence" element={<EvidencePage />} />
              <Route path="/coverage" element={<CoveragePage />} />
              <Route path="/communities" element={<CommunitiesPage />} />
              <Route path="/system" element={<SystemPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </div>
      </div>
    </Router>
  );
}

export default App;
