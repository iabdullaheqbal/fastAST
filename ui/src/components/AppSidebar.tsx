import React from 'react';
import { NavLink } from 'react-router-dom';
import type { HealthStatus, RepoStats } from '../types';

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
      label: 'Code Graph',
      badge: '2D / 3D',
      sub: 'Interactive 2D & 3D Graph',
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
            <div>Endpoint: 127.0.0.1:4200</div>
            <div>
              DB: {health?.db_exists ? '.fastast.db (WAL)' : 'Not initialized'}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .app-sidebar {
          width: 220px;
          flex-shrink: 0;
          height: calc(100vh - 52px);
          background: var(--surface-low);
          border-right: 1px solid var(--hairline);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 12px 10px;
          z-index: 30;
          user-select: none;
        }
        .sidebar-section {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .sidebar-heading {
          font-family: var(--font-mono);
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--outline);
          padding: 2px 8px;
        }
        .sidebar-nav {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }
        .sidebar-link {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 10px;
          border-radius: 6px;
          text-decoration: none;
          color: var(--on-surface-variant);
          border: 1px solid transparent;
          transition: all 0.12s ease;
        }
        .sidebar-link:hover {
          background: var(--surface);
          color: var(--on-surface);
        }
        .sidebar-link-active {
          background: var(--surface-container);
          color: var(--on-surface);
          border-color: var(--hairline);
          box-shadow: inset 2px 0 0 0 var(--primary);
        }
        .sidebar-link-active .sidebar-icon {
          color: var(--primary);
        }
        .sidebar-icon {
          font-size: 18px;
          color: var(--outline);
          flex-shrink: 0;
        }
        .sidebar-link-text {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 1px;
        }
        .sidebar-link-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 4px;
        }
        .sidebar-label {
          font-size: 12.5px;
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .sidebar-badge {
          font-family: var(--font-mono);
          font-size: 9.5px;
          padding: 1px 5px;
          border-radius: 3px;
          background: var(--surface-high);
          color: var(--on-surface-variant);
          font-weight: 600;
        }
        .sidebar-badge-err {
          background: rgba(244, 63, 94, 0.2);
          color: var(--error-light);
        }
        .sidebar-sub {
          font-size: 10.5px;
          color: var(--outline);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .sidebar-footer {
          padding-top: 10px;
          border-top: 1px solid var(--hairline);
        }
        .conn-card {
          background: var(--surface);
          border: 1px solid var(--hairline);
          border-radius: 6px;
          padding: 9px 10px;
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        .conn-row {
          display: flex;
          align-items: center;
          gap: 7px;
        }
        .conn-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .conn-dot-ok {
          background: var(--tertiary);
        }
        .conn-dot-err {
          background: var(--error);
        }
        .conn-title {
          font-size: 11.5px;
          font-weight: 600;
          color: var(--on-surface);
        }
        .conn-meta {
          font-size: 10px;
          color: var(--outline);
          line-height: 1.4;
        }
      `}</style>
    </aside>
  );
};
