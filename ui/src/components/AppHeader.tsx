import React, { useState } from 'react';
import type { HealthStatus, RepoStats } from '../types';

interface AppHeaderProps {
  stats: RepoStats | null;
  health: HealthStatus | null;
  apiError: string | null;
  onSearchSubmit: (query: string) => void;
  onReindex: () => void;
  onRetryConnection: () => void;
  isReindexing: boolean;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  stats,
  health,
  apiError,
  onSearchSubmit,
  onReindex,
  onRetryConnection,
  isReindexing,
}) => {
  const [searchValue, setSearchValue] = useState('');

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchValue.trim()) {
      onSearchSubmit(searchValue.trim());
    }
  };

  const isOnline = Boolean(health?.ok && !apiError);
  const repoName = stats?.repo_name || health?.repo_name || 'fastAST';
  const symbolCount = stats?.symbols ?? health?.symbol_count;
  const fileCount = stats?.files ?? health?.file_count;
  const edgeCount = stats?.edges ?? health?.edge_count;

  return (
    <header className="app-header">
      {/* Left: Brand & Active Repository */}
      <div className="header-left">
        <div className="brand-title">
          <span className="material-symbols-outlined brand-icon">hub</span>
          <span className="brand-name">FastAST</span>
          <span className="brand-tag">LENS</span>
        </div>

        <div className="repo-badge" title={stats?.repo_path || health?.repo_path || ''}>
          <span className="material-symbols-outlined text-xs text-outline">folder_code</span>
          <span className="repo-name">{repoName}</span>
          <span
            className={`status-pill ${isOnline ? 'status-pill-online' : 'status-pill-offline'}`}
            onClick={!isOnline ? onRetryConnection : undefined}
            title={
              isOnline
                ? `Connected to ${health?.db_path || '.fastast.db'}`
                : apiError || 'API server unreachable on port 4200'
            }
          >
            <span className={`status-dot ${isOnline ? 'dot-online' : 'dot-offline'}`} />
            {isOnline ? 'API :4200' : 'API Offline'}
          </span>
        </div>
      </div>

      {/* Center: Global Search Input */}
      <div className="header-search-wrap">
        <span className="material-symbols-outlined search-icon">search</span>
        <input
          type="text"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search symbols, files, or query evidence (Enter)..."
          className="header-search-input"
        />
        {searchValue && (
          <button
            className="search-clear-btn"
            onClick={() => setSearchValue('')}
            title="Clear search"
          >
            ×
          </button>
        )}
      </div>

      {/* Right: Live Index Telemetry & Actions */}
      <div className="header-right">
        {isOnline ? (
          <div className="telemetry-group">
            <div className="telemetry-pill" title="Indexed files in .fastast.db">
              <span className="telemetry-val">{fileCount !== undefined ? fileCount.toLocaleString() : '—'}</span>
              <span className="telemetry-lbl">files</span>
            </div>
            <div className="telemetry-pill" title="Extracted AST symbols">
              <span className="telemetry-val text-primary">
                {symbolCount !== undefined ? symbolCount.toLocaleString() : '—'}
              </span>
              <span className="telemetry-lbl">symbols</span>
            </div>
            <div className="telemetry-pill" title="Graph dependency edges">
              <span className="telemetry-val text-tertiary">
                {edgeCount !== undefined ? edgeCount.toLocaleString() : '—'}
              </span>
              <span className="telemetry-lbl">edges</span>
            </div>
          </div>
        ) : (
          <button className="header-btn header-btn-error" onClick={onRetryConnection}>
            <span className="material-symbols-outlined text-sm">sync_problem</span>
            <span>Reconnect API</span>
          </button>
        )}

        <button
          onClick={onReindex}
          disabled={isReindexing || !isOnline}
          className="header-btn header-btn-secondary"
          title="Re-run incremental AST indexing on repository"
        >
          <span className={`material-symbols-outlined text-sm ${isReindexing ? 'spin-icon' : ''}`}>
            refresh
          </span>
          <span>{isReindexing ? 'Indexing...' : 'Re-index'}</span>
        </button>

        <button
          onClick={() => {
            const q = searchValue.trim() || 'retrieve_context';
            onSearchSubmit(q);
          }}
          className="header-btn header-btn-primary"
          title="Retrieve token-bounded evidence bundle"
        >
          <span className="material-symbols-outlined text-sm">manage_search</span>
          <span>Evidence Query</span>
        </button>
      </div>

      <style>{`
        .app-header {
          height: 52px;
          width: 100%;
          background: var(--surface);
          border-bottom: 1px solid var(--hairline);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 16px;
          z-index: 40;
          flex-shrink: 0;
          gap: 16px;
        }
        .header-left {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .brand-title {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .brand-icon {
          color: var(--primary);
          font-size: 20px;
        }
        .brand-name {
          font-weight: 700;
          font-size: 14.5px;
          letter-spacing: -0.02em;
          color: var(--on-surface);
        }
        .brand-tag {
          font-family: var(--font-mono);
          font-size: 9.5px;
          font-weight: 700;
          color: var(--primary);
          background: var(--primary-container);
          padding: 2px 5px;
          border-radius: 3px;
          letter-spacing: 0.06em;
        }
        .repo-badge {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 4px 9px;
          background: var(--surface-low);
          border: 1px solid var(--hairline);
          border-radius: 5px;
        }
        .repo-name {
          font-family: var(--font-mono);
          font-size: 11.5px;
          font-weight: 600;
          color: var(--on-surface);
        }
        .status-pill {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 2px 6px;
          border-radius: 3px;
          font-family: var(--font-mono);
          font-size: 10px;
          font-weight: 600;
        }
        .status-pill-online {
          background: rgba(16, 185, 129, 0.14);
          color: var(--tertiary-light);
        }
        .status-pill-offline {
          background: rgba(244, 63, 94, 0.18);
          color: var(--error-light);
          cursor: pointer;
        }
        .status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
        }
        .dot-online {
          background: var(--tertiary);
        }
        .dot-offline {
          background: var(--error);
        }
        .header-search-wrap {
          flex: 1;
          max-width: 440px;
          position: relative;
          display: flex;
          align-items: center;
        }
        .header-search-wrap .search-icon {
          position: absolute;
          left: 10px;
          font-size: 16px;
          color: var(--outline);
          pointer-events: none;
        }
        .header-search-input {
          width: 100%;
          height: 32px;
          background: var(--surface-lowest);
          border: 1px solid var(--hairline);
          border-radius: 5px;
          padding: 0 28px 0 32px;
          color: var(--on-surface);
          font-family: var(--font-mono);
          font-size: 12px;
          outline: none;
          transition: border-color 0.15s;
        }
        .header-search-input:focus {
          border-color: var(--primary);
        }
        .header-search-input::placeholder {
          color: var(--outline);
        }
        .search-clear-btn {
          position: absolute;
          right: 6px;
          background: transparent;
          border: none;
          color: var(--outline);
          font-size: 15px;
          cursor: pointer;
          padding: 2px 5px;
        }
        .header-right {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .telemetry-group {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .telemetry-pill {
          display: flex;
          align-items: baseline;
          gap: 4px;
          padding: 4px 8px;
          background: var(--surface-low);
          border: 1px solid var(--hairline);
          border-radius: 4px;
          font-family: var(--font-mono);
          font-size: 11px;
        }
        .telemetry-val {
          font-weight: 700;
          color: var(--on-surface);
        }
        .telemetry-lbl {
          font-size: 10px;
          color: var(--outline);
        }
        .header-btn {
          height: 30px;
          padding: 0 11px;
          border-radius: 5px;
          font-size: 11.5px;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          transition: all 0.15s;
          border: 1px solid transparent;
        }
        .header-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .header-btn-secondary {
          background: var(--surface-container);
          border-color: var(--hairline);
          color: var(--on-surface);
        }
        .header-btn-secondary:hover:not(:disabled) {
          background: var(--surface-high);
          border-color: var(--outline-variant);
        }
        .header-btn-primary {
          background: var(--primary);
          color: var(--on-primary);
        }
        .header-btn-primary:hover {
          opacity: 0.92;
        }
        .header-btn-error {
          background: rgba(244, 63, 94, 0.2);
          border-color: var(--error);
          color: var(--error-light);
        }
      `}</style>
    </header>
  );
};
