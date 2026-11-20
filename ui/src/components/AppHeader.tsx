import React, { useState } from 'react';
import type { HealthStatus, RepoStats } from '../types';
import './AppHeader.css';

interface AppHeaderProps {
  stats: RepoStats | null;
  health: HealthStatus | null;
  apiError: string | null;
  onSearchSubmit: (query: string) => void;
  onReindex: () => void;
  onRetryConnection: () => void;
  isReindexing: boolean;
  isRetrying?: boolean;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  stats,
  health,
  apiError,
  onSearchSubmit,
  onReindex,
  onRetryConnection,
  isReindexing,
  isRetrying = false,
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
            className={`status-pill ${isOnline ? 'status-pill-online' : 'status-pill-offline'} ${isRetrying ? 'opacity-70 pointer-events-none' : ''}`}
            onClick={!isOnline && !isRetrying ? onRetryConnection : undefined}
            title={
              isOnline
                ? `Connected to ${health?.db_path || '.fastast.db'}`
                : apiError || 'API server unreachable on port 4200'
            }
          >
            <span className={`status-dot ${isOnline ? 'dot-online' : 'dot-offline'}`} />
            {isOnline ? 'API :4200' : isRetrying ? 'Connecting...' : 'API Offline • Retry'}
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
          <button
            className="header-btn header-btn-error"
            onClick={onRetryConnection}
            disabled={isRetrying}
            title="Attempt to reconnect to FastAST API server"
          >
            <span className={`material-symbols-outlined text-sm ${isRetrying ? 'animate-spin' : ''}`}>
              {isRetrying ? 'sync' : 'sync_problem'}
            </span>
            <span>{isRetrying ? 'Connecting...' : 'Retry Connection'}</span>
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
    </header>
  );
};
