import React from 'react';
import { NavLink } from 'react-router-dom';
import { getApiEndpointDisplay } from '../services/api';
import type { HealthStatus, RepoStats } from '../types';
import './AppSidebar.css';

interface AppSidebarProps {
  stats: RepoStats | null;
  health: HealthStatus | null;
  apiError: string | null;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({ stats, health, apiError }) => {
  const isOnline = Boolean(health?.ok && !apiError);
  const symbolCount = stats?.symbols ?? health?.symbol_count;
  const fileCount = stats?.files ?? health?.file_count;
  const langCount = stats?.languages ? Object.keys(stats.languages).length : undefined;
  const commCount = stats?.communities_count;

  const navItems = [
    {
      to: '/globe',
      icon: 'hub',
      label: '2D Code Graph',
      badge: symbolCount !== undefined ? String(symbolCount) : undefined,
      sub: 'Call Graph & Dependencies',
    },
    {
      to: '/explore',
      icon: 'account_tree',
      label: 'Code Explorer',
      badge: fileCount !== undefined ? String(fileCount) : undefined,
      sub: 'Files, Outlines & Snippets',
    },
    {
      to: '/evidence',
      icon: 'manage_search',
      label: 'Evidence Bundle',
      badge: 'RRF',
      sub: 'Token-Bounded Retrieval',
    },
    {
      to: '/communities',
      icon: 'bubble_chart',
      label: 'Communities',
      badge: commCount !== undefined && commCount > 0 ? String(commCount) : undefined,
      sub: 'Louvain Modularity Clusters',
    },
    {
      to: '/coverage',
      icon: 'fact_check',
      label: 'Index Coverage',
      badge: langCount !== undefined ? `${langCount} langs` : undefined,
      sub: 'Language & File Breakdown',
    },
    {
      to: '/architecture',
      icon: 'layers',
      label: 'Architecture',
      sub: 'Subsystems & Hotspots',
    },
    {
      to: '/system',
      icon: 'dns',
      label: 'System & Health',
      badge: isOnline ? 'OK' : 'ERR',
      sub: 'API, SQLite WAL & Doctor',
    },
  ];

  return (
    <aside className="app-sidebar">
      <div className="sidebar-section">
        <div className="sidebar-heading">Navigation</div>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`
              }
            >
              <span className="material-symbols-outlined sidebar-icon">{item.icon}</span>
              <div className="sidebar-link-text">
                <div className="sidebar-link-row">
                  <span className="sidebar-label">{item.label}</span>
                  {item.badge && (
                    <span
                      className={`sidebar-badge ${
                        item.badge === 'ERR' ? 'sidebar-badge-err' : ''
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="sidebar-sub">{item.sub}</span>
              </div>
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Bottom Connection Status Card */}
      <div className="sidebar-footer">
        <div className="conn-card">
          <div className="conn-row">
            <span className={`conn-dot ${isOnline ? 'conn-dot-ok' : 'conn-dot-err'}`} />
            <span className="conn-title">
              {isOnline ? 'FastAST API Connected' : 'API Unreachable'}
            </span>
          </div>
          <div className="conn-meta font-code">
            <div style={{ wordBreak: 'break-all' }}>Endpoint: {getApiEndpointDisplay()}</div>
            <div>
              DB: {health?.db_exists ? '.fastast.db (WAL)' : 'Not initialized'}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
