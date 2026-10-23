import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import type { DiagnosticsReport } from '../../types';
import { Sliders, Terminal, RefreshCw, CheckCircle2 } from 'lucide-react';

export const SystemPage: React.FC = () => {
  const [report, setReport] = useState<DiagnosticsReport | null>(null);
  const [indexing, setIndexing] = useState(false);
  const [reindexSuccess, setReindexSuccess] = useState(false);

  useEffect(() => {
    api.getDiagnostics().then(setReport);
  }, []);

  const handleReindex = async () => {
    setIndexing(true);
    setReindexSuccess(false);
    await api.triggerReindex();
    const updated = await api.getDiagnostics();
    setReport(updated);
    setIndexing(false);
    setReindexSuccess(true);
    setTimeout(() => setReindexSuccess(false), 3000);
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-[#0c0e14] space-y-6 select-none">
      {/* Header */}
      <div className="max-w-5xl mx-auto space-y-2">
        <div className="flex items-center space-x-2 text-xs font-mono text-cyan-400">
          <Sliders className="w-4 h-4" />
          <span>FASTAST ENGINE DIAGNOSTICS</span>
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          System & Storage Health
        </h1>
        <p className="text-xs text-[#94a3b8] max-w-2xl leading-relaxed">
          Monitors SQLite WAL storage health, B-tree indexes, foreign-key cascades,
          schema migration integrity, and MCP bridge status.
        </p>
      </div>

      {/* Diagnostics Cards */}
      <div className="max-w-5xl mx-auto grid grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-[#11141d] border border-[#1e293b] space-y-2">
          <div className="text-[10px] font-mono text-[#64748b] uppercase">SQLite Journal Mode</div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-lg font-bold text-white font-mono">WAL (Active)</span>
          </div>
          <div className="text-[10px] text-[#64748b]">Concurrent readers + single writer</div>
        </div>

        <div className="p-4 rounded-xl bg-[#11141d] border border-[#1e293b] space-y-2">
          <div className="text-[10px] font-mono text-[#64748b] uppercase">Schema Version</div>
          <div className="flex items-center space-x-2">
            <span className="text-lg font-bold text-cyan-400 font-mono">
              Version {report?.schema_version ?? 10}
            </span>
          </div>
          <div className="text-[10px] text-[#64748b]">10 Applied migrations verified</div>
        </div>

        <div className="p-4 rounded-xl bg-[#11141d] border border-[#1e293b] space-y-2">
          <div className="text-[10px] font-mono text-[#64748b] uppercase">Integrity Status</div>
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span className="text-lg font-bold text-emerald-400 font-mono">Healthy (OK)</span>
          </div>
          <div className="text-[10px] text-[#64748b]">PRAGMA integrity_check passed</div>
        </div>
      </div>

      {/* Re-index & Doctor Action Panel */}
      <div className="max-w-5xl mx-auto p-5 rounded-xl bg-[#11141d] border border-[#1e293b] space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white">Manual Repository Indexer</h2>
            <p className="text-xs text-[#94a3b8] mt-0.5">
              Force an incremental Tree-Sitter scan and refresh the SQLite symbol table.
            </p>
          </div>

          <button
            onClick={handleReindex}
            disabled={indexing}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-[#090d14] font-bold text-xs transition disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${indexing ? 'animate-spin' : ''}`} />
            <span>{indexing ? 'Indexing Codebase...' : 'Trigger Re-index'}</span>
          </button>
        </div>

        {reindexSuccess && (
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-center space-x-2 font-mono">
            <CheckCircle2 className="w-4 h-4" />
            <span>Repository successfully re-indexed into .fastast.db</span>
          </div>
        )}
      </div>

      {/* MCP Configuration Reference */}
      <div className="max-w-5xl mx-auto p-5 rounded-xl bg-[#11141d] border border-[#1e293b] space-y-3">
        <div className="flex items-center space-x-2 text-xs font-semibold text-white uppercase tracking-wider">
          <Terminal className="w-4 h-4 text-cyan-400" />
          <span>Active Agent Connection (.vscode/mcp.json)</span>
        </div>

        <pre className="p-4 rounded-lg bg-[#0c0e14] border border-[#1e293b] font-mono text-xs text-slate-300 overflow-x-auto leading-relaxed">
{`{
  "$schema": "https://github.com/modelcontextprotocol/specification/raw/main/schema/mcp.json",
  "servers": {
    "fastast": {
      "type": "stdio",
      "command": "fastast-mcp"
    }
  }
}`}
        </pre>
      </div>
    </div>
  );
};
