import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  FolderTree,
  Globe2,
  Layers,
  Search,
  CheckCircle,
  Network,
  Sliders,
} from 'lucide-react';

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
  badgeColor?: string;
}

export const Sidebar: React.FC = () => {
  const navItems: NavItem[] = [
    {
      to: '/',
      label: 'Explore',
      icon: <FolderTree className="w-4 h-4 text-cyan-400" />,
      badge: '126 files',
    },
    {
      to: '/globe',
      label: 'Galaxy Graph',
      icon: <Globe2 className="w-4 h-4 text-indigo-400" />,
      badge: '3D Globe',
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    },
    {
      to: '/architecture',
      label: 'Architecture',
      icon: <Layers className="w-4 h-4 text-purple-400" />,
    },
    {
      to: '/evidence',
      label: 'Evidence Retrieval',
      icon: <Search className="w-4 h-4 text-amber-400" />,
      badge: 'Token-Save',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    },
    {
      to: '/coverage',
      label: 'Index Coverage',
      icon: <CheckCircle className="w-4 h-4 text-emerald-400" />,
      badge: '98.2%',
    },
    {
      to: '/communities',
      label: 'Louvain Clusters',
      icon: <Network className="w-4 h-4 text-rose-400" />,
      badge: 'Q=0.84',
    },
    {
      to: '/system',
      label: 'System & Engine',
      icon: <Sliders className="w-4 h-4 text-slate-400" />,
    },
  ];

  return (
    <aside className="w-60 bg-[#0c0e14] border-r border-[#1e293b] flex flex-col justify-between py-3 shrink-0 select-none z-20">
      <div className="flex flex-col space-y-1 px-2">
        <div className="px-3 py-1.5 text-[10px] uppercase font-mono tracking-wider text-[#64748b]">
          Navigation
        </div>

        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-[#1e2536] text-white shadow-sm border border-[#28334a]'
                  : 'text-[#94a3b8] hover:text-white hover:bg-[#141a24]'
              }`
            }
          >
            <div className="flex items-center space-x-2.5">
              {item.icon}
              <span>{item.label}</span>
            </div>
            {item.badge && (
              <span
                className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                  item.badgeColor || 'bg-[#1e2536] text-[#94a3b8] border-[#28334a]'
                }`}
              >
                {item.badge}
              </span>
            )}
          </NavLink>
        ))}
      </div>

      {/* Bottom Engine Telemetry Pill */}
      <div className="px-3 py-2">
        <div className="p-3 rounded-lg bg-[#11141d] border border-[#1e293b] text-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[#64748b] text-[11px] font-mono uppercase">Local DB</span>
            <span className="text-emerald-400 font-mono text-[10px] font-bold">WAL ACTIVE</span>
          </div>
          <div className="text-[11px] font-mono text-[#cbd5e1] truncate">.fastast.db (4.6 MB)</div>
          <div className="text-[10px] text-[#64748b]">AST → SQLite → Embeddings</div>
        </div>
      </div>
    </aside>
  );
};
