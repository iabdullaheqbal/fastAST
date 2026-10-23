import { useEffect, useState } from 'react';
import { api } from '../services/api';
import type { RepositoryStats } from '../types';
import { RefreshCw, Terminal, Cpu } from 'lucide-react';

interface NavbarProps {
  onReindex?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onReindex }) => {
  const [stats, setStats] = useState<RepositoryStats | null>(null);
  const [reindexing, setReindexing] = useState(false);

  useEffect(() => {
    api.getStats().then(setStats);
  }, []);

  const handleReindex = async () => {
    setReindexing(true);
    await api.triggerReindex();
    const updated = await api.getStats();
    setStats(updated);
    setReindexing(false);
    if (onReindex) onReindex();
  };

  return (
    <header className="h-14 border-b border-[#1e293b] bg-[#0b0f17] px-4 flex items-center justify-between z-30 select-none">
      {/* Brand & Project Identity */}
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <Cpu className="w-4 h-4 text-white" />
        </div>
        <div className="flex items-center space-x-2">
          <span className="font-bold tracking-tight text-sm text-white">FastAST</span>
          <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            Lens
          </span>
          <span className="text-[11px] text-[#64748b] hidden md:inline">
            Codebase Memory Engine (AST → Graph → Retrieval)
          </span>
        </div>
      </div>

      {/* Center Metrics Badges */}
      <div className="hidden lg:flex items-center space-x-3 text-xs">
        <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-[#161b26] border border-[#232b3e]">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-[#94a3b8]">Index:</span>
          <span className="text-emerald-400 font-mono font-medium">Synced WAL</span>
        </div>

        <div className="flex items-center space-x-2 px-2.5 py-1 rounded bg-[#161b26] border border-[#232b3e] text-[#94a3b8] font-mono">
          <span><b>{stats?.files ?? 126}</b> files</span>
          <span>•</span>
          <span><b>{stats?.symbols ?? 1267}</b> symbols</span>
          <span>•</span>
          <span><b>{stats?.edges ?? 13346}</b> edges</span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-2.5">
        <button
          onClick={handleReindex}
          disabled={reindexing}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-[#161b26] hover:bg-[#1e2536] border border-[#232b3e] text-[#cbd5e1] hover:text-white transition disabled:opacity-50"
          title="Force incremental re-index scan"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${reindexing ? 'animate-spin' : ''}`} />
          <span>{reindexing ? 'Indexing...' : 'Re-index'}</span>
        </button>

        <div className="flex items-center px-2 py-1 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-xs font-mono">
          <Terminal className="w-3.5 h-3.5 mr-1" />
          <span>MCP :5174</span>
        </div>
      </div>
    </header>
  );
};
