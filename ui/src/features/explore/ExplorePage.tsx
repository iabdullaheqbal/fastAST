import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import type { SymbolItem } from '../../types';
import { Search, Copy, Check } from 'lucide-react';

export const ExplorePage: React.FC = () => {
  const [symbols, setSymbols] = useState<SymbolItem[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState<SymbolItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [kindFilter, setKindFilter] = useState<string>('all');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSymbols();
  }, [searchQuery, kindFilter]);

  const loadSymbols = async () => {
    setLoading(true);
    const filter = kindFilter === 'all' ? undefined : kindFilter;
    const res = await api.querySymbols(searchQuery, filter, 80);
    setSymbols(res);
    if (!selectedSymbol && res.length > 0) {
      setSelectedSymbol(res[0]);
    }
    setLoading(false);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 flex overflow-hidden bg-[#0c0e14]">
      {/* ───────────────────────────────────────────────────────────── */}
      {/* LEFT SYMBOL SEARCH & LIST */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="w-[420px] lg:w-[480px] shrink-0 border-r border-[#1e293b] bg-[#11141d] flex flex-col">
        {/* Search Input Bar */}
        <div className="p-3.5 border-b border-[#1e293b] space-y-2.5">
          <div className="relative">
            <Search className="w-4 h-4 text-[#64748b] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search symbols, functions, classes, files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#161b26] border border-[#232b3e] rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-[#64748b] focus:outline-none focus:border-cyan-500 transition"
            />
          </div>

          {/* Kind Filter Pills */}
          <div className="flex items-center space-x-1.5 overflow-x-auto text-xs pb-0.5">
            {['all', 'function', 'class', 'struct', 'type'].map((k) => (
              <button
                key={k}
                onClick={() => setKindFilter(k)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium capitalize transition ${
                  kindFilter === k
                    ? 'bg-cyan-500 text-[#090d14] font-bold shadow-sm'
                    : 'bg-[#161b26] text-[#94a3b8] hover:text-white border border-[#232b3e]'
                }`}
              >
                {k}
              </button>
            ))}
          </div>
        </div>

        {/* Symbols List */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#1e293b]/50">
          {loading ? (
            <div className="p-8 text-center text-xs text-[#64748b]">Searching AST facts...</div>
          ) : symbols.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#64748b]">No symbols found matching query.</div>
          ) : (
            symbols.map((sym, idx) => {
              const isSelected = selectedSymbol?.name === sym.name;
              return (
                <div
                  key={`${sym.name}-${idx}`}
                  onClick={() => setSelectedSymbol(sym)}
                  className={`p-3 cursor-pointer transition flex items-start justify-between ${
                    isSelected ? 'bg-[#1e2536] border-l-2 border-cyan-400' : 'hover:bg-[#161b26]'
                  }`}
                >
                  <div className="space-y-1 min-w-0 pr-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-semibold text-white truncate">
                        {sym.name}
                      </span>
                      <span
                        className={`text-[9px] uppercase font-mono px-1 py-0.2 rounded border ${
                          sym.kind === 'function' || sym.kind === 'method'
                            ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20'
                            : sym.kind === 'class' || sym.kind === 'struct'
                            ? 'bg-purple-500/10 text-purple-300 border-purple-500/20'
                            : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                        }`}
                      >
                        {sym.kind}
                      </span>
                    </div>

                    <div className="text-[11px] font-mono text-[#64748b] truncate">
                      {sym.file_path}:{sym.line_start}-{sym.line_end}
                    </div>

                    {sym.signature && (
                      <div className="text-[11px] font-mono text-cyan-400/80 truncate">
                        {sym.signature}
                      </div>
                    )}
                  </div>

                  <span className="text-[10px] font-mono text-[#64748b] shrink-0 mt-0.5">
                    {sym.language || 'code'}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* RIGHT EVIDENCE & INSPECTOR */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {selectedSymbol ? (
          <div className="max-w-4xl space-y-6">
            {/* Symbol Header */}
            <div className="p-5 rounded-xl bg-[#11141d] border border-[#1e293b] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 font-bold uppercase border border-cyan-500/20">
                    {selectedSymbol.kind}
                  </span>
                  <span className="text-xs text-[#64748b] font-mono">
                    Lines {selectedSymbol.line_start}–{selectedSymbol.line_end}
                  </span>
                </div>

                <button
                  onClick={() => handleCopy(`fastast snippet ${selectedSymbol.name}`)}
                  className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-[#161b26] hover:bg-[#1e2536] border border-[#232b3e] text-xs text-[#cbd5e1] transition"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy CLI'}</span>
                </button>
              </div>

              <div>
                <h1 className="text-xl font-bold font-mono text-white break-all">
                  {selectedSymbol.name}
                </h1>
                <div className="text-xs font-mono text-[#64748b] mt-1">
                  {selectedSymbol.file_path}
                </div>
              </div>

              {/* Signature Block */}
              <div className="p-3 rounded-lg bg-[#0c0e14] border border-[#1e293b]">
                <div className="text-[10px] font-mono text-[#64748b] uppercase tracking-wider mb-1">
                  Signature
                </div>
                <code className="text-xs font-mono text-cyan-300 break-words block">
                  {selectedSymbol.signature || `pub fn ${selectedSymbol.name}()`}
                </code>
              </div>
            </div>

            {/* MCP Agent Context Integration */}
            <div className="p-5 rounded-xl bg-[#11141d] border border-[#1e293b] space-y-3">
              <div className="text-xs font-semibold text-white uppercase tracking-wider">
                Agent MCP Call Bridge
              </div>
              <p className="text-xs text-[#94a3b8] leading-relaxed">
                Feed this tool request directly to Claude Code, Cursor, or your agent harness for instant
                sub-5ms token-conscious symbol retrieval.
              </p>

              <div className="p-3 rounded-lg bg-[#0c0e14] border border-[#1e293b] font-mono text-xs text-slate-300 space-y-2">
                <div className="text-[#64748b] text-[10px]"># Model Context Protocol stdio call</div>
                <div className="text-purple-400">
                  {`{"method": "tools/call", "params": {"name": "get_symbol_evidence", "arguments": {"symbol": "${selectedSymbol.name}"}}}`}
                </div>
              </div>
            </div>

            {/* Blast Radius & Neighbors */}
            <div className="p-5 rounded-xl bg-[#11141d] border border-[#1e293b] space-y-3">
              <div className="text-xs font-semibold text-white uppercase tracking-wider">
                Graph Neighborhood & Blast Radius
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 rounded-lg bg-[#161b26] border border-[#232b3e]">
                  <div className="text-[10px] text-[#64748b] uppercase">Upstream Callers</div>
                  <div className="text-sm font-bold text-cyan-400 font-mono mt-0.5">3 Callers</div>
                </div>
                <div className="p-3 rounded-lg bg-[#161b26] border border-[#232b3e]">
                  <div className="text-[10px] text-[#64748b] uppercase">Downstream Callees</div>
                  <div className="text-sm font-bold text-indigo-400 font-mono mt-0.5">4 Callees</div>
                </div>
                <div className="p-3 rounded-lg bg-[#161b26] border border-[#232b3e]">
                  <div className="text-[10px] text-[#64748b] uppercase">Token Footprint</div>
                  <div className="text-sm font-bold text-emerald-400 font-mono mt-0.5">240 Tokens</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-xs text-[#64748b]">
            Select a symbol on the left to inspect its AST definitions and evidence window.
          </div>
        )}
      </div>
    </div>
  );
};
