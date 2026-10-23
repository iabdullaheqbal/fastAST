import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import type { EvidenceBundle } from '../../types';
import { Search, Sliders, Copy, Check } from 'lucide-react';

export const EvidencePage: React.FC = () => {
  const [query, setQuery] = useState('index_repository AST extraction');
  const [budget, setBudget] = useState(1500);
  const [bundle, setBundle] = useState<EvidenceBundle | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  useEffect(() => {
    runSearch();
  }, [budget]);

  const runSearch = async () => {
    setLoading(true);
    const res = await api.retrieveEvidence(query, budget);
    setBundle(res);
    setLoading(false);
  };

  const handleCopy = (snippet: string, idx: number) => {
    navigator.clipboard.writeText(snippet);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-[#0c0e14] space-y-6 select-none">
      {/* Header */}
      <div className="max-w-5xl mx-auto space-y-2">
        <div className="flex items-center space-x-2 text-xs font-mono text-amber-400">
          <Search className="w-4 h-4" />
          <span>TOKEN-CONSCIOUS RETRIEVAL ENGINE</span>
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Evidence Retrieval & Context Bundles
        </h1>
        <p className="text-xs text-[#94a3b8] max-w-2xl leading-relaxed">
          Retrieves compact AST fact slices, definition signatures, and 1-hop caller/callee context
          within an exact token budget to eliminate LLM context saturation.
        </p>
      </div>

      {/* Query & Budget Bar */}
      <div className="max-w-5xl mx-auto p-4 rounded-xl bg-[#11141d] border border-[#1e293b] space-y-4">
        <div className="flex items-center space-x-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-[#64748b] absolute left-3 top-3" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && runSearch()}
              placeholder="Query concept or symbol (e.g. 'AST parsing', 'SQLite WAL commit', 'Louvain modularity')..."
              className="w-full bg-[#161b26] border border-[#232b3e] rounded-lg pl-9 pr-3 py-2.5 text-xs text-white placeholder-[#64748b] focus:outline-none focus:border-amber-400"
            />
          </div>
          <button
            onClick={runSearch}
            disabled={loading}
            className="px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-[#090d14] font-bold text-xs transition shadow-sm disabled:opacity-50"
          >
            {loading ? 'Retrieving...' : 'Retrieve Evidence'}
          </button>
        </div>

        {/* Token Budget Slider */}
        <div className="flex items-center justify-between text-xs pt-1 border-t border-[#1e293b]">
          <div className="flex items-center space-x-3">
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[#cbd5e1] font-mono">Max Token Budget:</span>
            <input
              type="range"
              min="500"
              max="4000"
              step="250"
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              className="w-48 accent-amber-400 cursor-pointer"
            />
            <span className="font-mono text-amber-400 font-bold">{budget} Tokens</span>
          </div>

          <div className="flex items-center space-x-2 text-[11px] font-mono text-[#64748b]">
            <span>Used: <strong className="text-white">{bundle?.total_tokens ?? 720} tok</strong></span>
            <span>•</span>
            <span className="text-emerald-400 font-semibold">
              Saved ~{Math.max(0, 15000 - (bundle?.total_tokens ?? 720))} tok vs raw files
            </span>
          </div>
        </div>
      </div>

      {/* Evidence Cards */}
      <div className="max-w-5xl mx-auto space-y-4">
        {bundle?.items.map((item, idx) => (
          <div
            key={idx}
            className="p-5 rounded-xl bg-[#11141d] border border-[#1e293b] space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono font-bold text-white">{item.symbol_name}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#161b26] text-[#94a3b8] border border-[#232b3e]">
                  {item.file_path}:{item.lines}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                  {item.estimated_tokens} tokens
                </span>
              </div>

              <button
                onClick={() => handleCopy(item.snippet || item.signature || '', idx)}
                className="flex items-center space-x-1.5 px-2 py-1 rounded bg-[#161b26] hover:bg-[#1e2536] border border-[#232b3e] text-[11px] text-[#cbd5e1] transition"
              >
                {copiedIdx === idx ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedIdx === idx ? 'Copied' : 'Copy Snippet'}</span>
              </button>
            </div>

            {item.signature && (
              <div className="p-2.5 rounded bg-[#0c0e14] border border-[#1e293b] font-mono text-[11px] text-cyan-300">
                {item.signature}
              </div>
            )}

            {item.snippet && (
              <pre className="p-3 rounded bg-[#0c0e14] border border-[#1e293b] font-mono text-xs text-[#e2e2eb] overflow-x-auto leading-relaxed">
                <code>{item.snippet}</code>
              </pre>
            )}

            <div className="flex items-center justify-between text-[11px] font-mono text-[#64748b] pt-1">
              <span>{item.reason}</span>
              <div className="flex items-center space-x-3">
                {item.callers && item.callers.length > 0 && (
                  <span>Callers: <strong className="text-cyan-400">{item.callers.length}</strong></span>
                )}
                {item.callees && item.callees.length > 0 && (
                  <span>Callees: <strong className="text-indigo-400">{item.callees.length}</strong></span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
