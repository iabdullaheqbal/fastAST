import React from 'react';
import { NavLink } from 'react-router-dom';
import type { RepoStats } from '../types';

interface AppSidebarProps {
  stats: RepoStats | null;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({ stats }) => {
  const fileCount = stats?.files ?? 142;

  const navItems = [
    {
      to: '/globe',
      label: 'Globe Graph',
      icon: 'public',
      badge: '3D Planet',
      badgeColor: 'badge-purple',
    },
    {
      to: '/explore',
      label: 'Explore',
      icon: 'account_tree',
      badge: `${fileCount} files`,
      badgeColor: 'badge-gray',
    },
    {
      to: '/architecture',
      label: 'Architecture',
      icon: 'layers',
    },
    {
      to: '/evidence',
      label: 'Evidence Retrieval',
      icon: 'find_in_page',
    },
    {
      to: '/coverage',
      label: 'Index Coverage',
      icon: 'verified',
      badge: '98.2%',
      badgeColor: 'badge-emerald',
    },
    {
      to: '/communities',
      label: 'Louvain Clusters',
      icon: 'bubble_chart',
    },
    {
      to: '/system',
      label: 'System & Engine',
      icon: 'settings_input_component',
    },
  ];

  return (
    <aside className="app-sidebar">
      <div className="sidebar-top">
        {/* Brand Banner */}
        <div className="sidebar-brand">
          <div className="brand-logo-wrap">
            <span className="material-symbols-outlined brand-icon">hub</span>
            <div className="brand-titles">
              <span className="brand-title">FastAST Lens</span>
              <span className="brand-subtitle">Codebase Memory</span>
            </div>
          </div>
          <span className="version-chip">v0.2.0</span>
        </div>

        {/* Navigation list */}
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
            >
              <div className="nav-link-content">
                <span className="material-symbols-outlined nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </div>
              {item.badge && <span className={`nav-badge ${item.badgeColor || ''}`}>{item.badge}</span>}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Bottom Telemetry Card */}
      <div className="sidebar-bottom">
        <div className="telemetry-box">
          <div className="telemetry-row">
            <div className="status-live">
              <span className="pulse-dot" />
              <span className="live-label">FastAST API</span>
            </div>
            <span className="port-tag">port 4200</span>
          </div>

          <div className="telemetry-stats">
            <span>RAM: ~180MB</span>
            <span>SQLite: WAL Mode</span>
          </div>

          <div className="workspace-badge">
            <div className="workspace-info">
              <span className="material-symbols-outlined ws-icon">terminal</span>
              <div className="ws-text">
                <span className="ws-name">fastast-engine</span>
                <span className="ws-sub">Local AST Graph</span>
              </div>
            </div>
            <span className="material-symbols-outlined check-icon">check_circle</span>
          </div>
        </div>
      </div>

      <style>{`
        .app-sidebar {
          position: fixed;
          left: 0;
          top: 0;
          bottom: 0;
          width: 256px;
          background: var(--surface-lowest);
          border-right: 1px solid var(--hairline);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          z-index: 50;
          box-shadow: 2px 0 16px rgba(0, 0, 0, 0.4);
        }
        .sidebar-top {
          display: flex;
          flex-direction: column;
        }
        .sidebar-brand {
          height: 56px;
          padding: 0 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: var(--surface-low);
          border-bottom: 1px solid var(--hairline);
        }
        .brand-logo-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .brand-icon {
          color: var(--primary);
          font-size: 26px;
          filter: drop-shadow(0 0 8px rgba(56, 189, 248, 0.5));
        }
        .brand-titles {
          display: flex;
          flex-direction: column;
        }
        .brand-title {
          font-weight: 600;
          font-size: 14px;
          color: var(--on-surface);
          letter-spacing: -0.01em;
        }
        .brand-subtitle {
          font-family: var(--font-mono);
          font-size: 10px;
          color: var(--outline);
        }
        .version-chip {
          font-family: var(--font-mono);
          font-size: 10px;
          padding: 2px 6px;
          background: var(--surface-container);
          color: var(--primary);
          border-radius: 4px;
          border: 1px solid rgba(56, 189, 248, 0.2);
        }
        .sidebar-nav {
          display: flex;
          flex-direction: column;
          gap: 3px;
          padding: 12px 10px;
        }
        .nav-link {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 7px 10px;
          border-radius: 4px;
          color: var(--on-surface-variant);
          text-decoration: none;
          font-size: 12.5px;
          font-weight: 500;
          transition: all 0.15s ease;
        }
        .nav-link:hover {
          background: var(--surface-container);
          color: var(--on-surface);
        }
        .nav-link-active {
          background: var(--surface-high);
          color: var(--primary);
          font-weight: 600;
          box-shadow: inset 2px 0 0 0 var(--primary);
        }
        .nav-link-content {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .nav-icon {
          font-size: 18px;
          opacity: 0.85;
        }
        .nav-badge {
          font-family: var(--font-mono);
          font-size: 10px;
          padding: 1px 5px;
          border-radius: 3px;
        }
        .badge-purple {
          background: var(--secondary-container);
          color: var(--secondary-light);
        }
        .badge-gray {
          background: var(--surface-container);
          color: var(--outline);
        }
        .badge-emerald {
          background: var(--tertiary-container);
          color: var(--tertiary-light);
        }
        .sidebar-bottom {
          padding: 12px;
          background: var(--surface-low);
          border-top: 1px solid var(--hairline);
        }
        .telemetry-box {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .telemetry-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: var(--surface-lowest);
          padding: 5px 8px;
          border-radius: 4px;
          border: 1px solid var(--hairline);
        }
        .status-live {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .pulse-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: var(--tertiary-light);
          box-shadow: 0 0 6px var(--tertiary-light);
          animation: pulseGlow 2s infinite;
        }
        .live-label {
          font-family: var(--font-mono);
          font-size: 11px;
          color: var(--tertiary-light);
          font-weight: 500;
        }
        .port-tag {
          font-family: var(--font-mono);
          font-size: 10px;
          color: var(--outline);
        }
        .telemetry-stats {
          display: flex;
          justify-content: space-between;
          font-family: var(--font-mono);
          font-size: 10px;
          color: var(--outline);
          padding: 0 4px;
        }
        .workspace-badge {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: var(--surface-container);
          padding: 6px 8px;
          border-radius: 4px;
          border: 1px solid var(--hairline);
        }
        .workspace-info {
          display: flex;
          align-items: center;
          gap: 8px;
          overflow: hidden;
        }
        .ws-icon {
          font-size: 16px;
          color: var(--outline);
        }
        .ws-text {
          display: flex;
          flex-direction: column;
          truncate: true;
        }
        .ws-name {
          font-size: 11px;
          color: var(--on-surface);
          font-weight: 500;
        }
        .ws-sub {
          font-family: var(--font-mono);
          font-size: 9px;
          color: var(--outline);
        }
        .check-icon {
          color: var(--tertiary-light);
          font-size: 15px;
        }
      `}</style>
    </aside>
  );
};
