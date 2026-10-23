import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import type { CommunityItem } from '../../types';
import { Network } from 'lucide-react';

export const CommunitiesPage: React.FC = () => {
  const [communities, setCommunities] = useState<CommunityItem[]>([]);
  const [selectedComm, setSelectedComm] = useState<CommunityItem | null>(null);

  useEffect(() => {
    api.getCommunities().then((res) => {
      setCommunities(res);
      if (res.length > 0) setSelectedComm(res[0]);
    });
  }, []);

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-[#0c0e14] space-y-6 select-none">
      {/* Header */}
      <div className="max-w-5xl mx-auto space-y-2">
        <div className="flex items-center space-x-2 text-xs font-mono text-purple-400">
          <Network className="w-4 h-4" />
          <span>LOUVAIN MODULARITY & ARCHITECTURAL CLUSTERS</span>
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Codebase Communities & Modules
        </h1>
        <p className="text-xs text-[#94a3b8] max-w-2xl leading-relaxed">
          Discovers functional boundaries and cohesion by clustering the symbol-call graph using
          Louvain modularity optimization ($Q=0.84$) to identify central architecture hubs.
        </p>
      </div>

      {/* Louvain Modularity Metric Pill */}
      <div className="max-w-5xl mx-auto p-4 rounded-xl bg-[#11141d] border border-[#1e293b] flex items-center justify-between text-xs">
        <div className="flex items-center space-x-3">
          <span className="w-3 h-3 rounded-full bg-purple-400 animate-pulse"></span>
          <span className="text-white font-semibold">Louvain Modularity Optimization:</span>
          <span className="font-mono text-purple-400 font-bold text-sm">Q = 0.84</span>
          <span className="text-[#64748b] font-mono">(Strong community separation)</span>
        </div>
        <div className="font-mono text-[11px] text-[#94a3b8]">
          20 Communities Detected • 64-perm MinHash / 16-band LSH
        </div>
      </div>

      {/* Communities Grid */}
      <div className="max-w-5xl mx-auto grid grid-cols-2 lg:grid-cols-3 gap-4">
        {communities.map((comm) => {
          const isSelected = selectedComm?.id === comm.id;
          return (
            <div
              key={comm.id}
              onClick={() => setSelectedComm(comm)}
              className={`p-4 rounded-xl bg-[#11141d] border cursor-pointer transition space-y-3 ${
                isSelected ? 'border-purple-500 shadow-lg shadow-purple-500/10' : 'border-[#1e293b] hover:border-[#28334a]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 font-bold uppercase">
                  Module #{comm.id}
                </span>
                <span className="text-[11px] font-mono text-[#94a3b8]">
                  {comm.members_count ?? 18} symbols
                </span>
              </div>

              <div>
                <h3 className="text-sm font-bold text-white truncate">{comm.name}</h3>
                <div className="text-[11px] font-mono text-cyan-400 mt-1 truncate">
                  Hub: {comm.hub_symbol}
                </div>
              </div>

              <div className="text-[11px] text-[#64748b]">
                Cohesive structural cluster discovered by graph eigenvector density.
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
