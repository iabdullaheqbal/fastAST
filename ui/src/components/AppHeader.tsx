import React, { useState } from 'react';
import type { RepoStats } from '../types';

interface AppHeaderProps {
  stats: RepoStats | null;
  onReindex: () => void;
  isReindexing: boolean;
  onSearch: (q: string) => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  stats,
  onReindex,
  isReindexing,
  onSearch,
}) => {
  const [searchVal, setSearchVal] = useState('');

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSearch(searchVal);
    }
  };

  const totalSymbols = stats?.symbols ?? 1330;

  return (
    <header className="app-header">
      {/* Left: Repo identifier and Status */}
      <div className="header-left">
        <div className="repo-pill">
          <span className="material-symbols-outlined icon-cyan">folder_open</span>
          <span className="repo-path">fastAST</span>
          <span className="repo-branch">main (v0.2.0)</span>
        </div>

        <div className="status-pill">
          <span className={`status-dot ${isReindexing ? 'status-dot-reindexing' : 'status-dot-ready'}`} />
          <span className="status-text">
            {isReindexing ? 'Indexing AST...' : `Ready (${totalSymbols.toLocaleString()} symbols)`}
          </span>
        </div>
      </div>

      {/* Center: Command Palette search input */}
      <div className="header-center">
        <div className="search-bar">
          <span className="material-symbols-outlined search-icon">search</span>
          <input
            type="text"
            className="search-input"
            placeholder="Search AST nodes, symbols, files (Press Enter)..."
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <span className="kbd-shortcut">⌘K</span>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="header-right">
        <button
          className={`btn-header ${isReindexing ? 'btn-loading' : ''}`}
          onClick={onReindex}
          disabled={isReindexing}
          title="Re-index repository into SQLite symbol graph"
        >
          <span className={`material-symbols-outlined ${isReindexing ? 'spin-icon' : ''}`}>sync</span>
          <span>{isReindexing ? 'Indexing...' : 'Re-index'}</span>
        </button>

        <button
          className="btn-header btn-primary-accent"
          onClick={() => onSearch('traverseEdges')}
          title="Ask or inspect Agent Memory"
        >
          <span className="material-symbols-outlined">smart_toy</span>
          <span>Query Agent</span>
        </button>

        <div className="user-avatar" title="Local Engineer Session">
          <span className="material-symbols-outlined">terminal</span>
        </div>
      </div>

      <style>{`
        .app-header {
          position: fixed;
          top: 0;
          left: 256px;
          right: 0;
          height: 56px;
          background: rgba(17, 19, 25, 0.92);
          backdrop-filter: blur(16px);
          border-bottom: 1px solid var(--hairline);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 20px;
          z-index: 40;
        }
        .header-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .repo-pill {
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--surface-container);
          padding: 5px 10px;
          border-radius: 4px;
          border: 1px solid var(--hairline);
          font-family: var(--font-mono);
          font-size: 11px;
        }
        .icon-cyan {
          color: var(--primary);
          font-size: 16px;
        }
        .repo-path {
          color: var(--on-surface);
          font-weight: 500;
        }
        .repo-branch {
          color: var(--outline);
        }
        .status-pill {
          display: flex;
          align-items: center;
          gap: 6px;
          background: var(--surface-low);
          padding: 5px 10px;
          border-radius: 4px;
          font-family: var(--font-mono);
          font-size: 11px;
          color: var(--on-surface);
          border: 1px solid var(--hairline);
        }
        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }
        .status-dot-ready {
          background: var(--tertiary-light);
          box-shadow: 0 0 8px rgba(86, 229, 169, 0.6);
        }
        .status-dot-reindexing {
          background: var(--primary);
          animation: pulseGlow 1.2s infinite;
        }
        .header-center {
          flex: 1;
          max-width: 440px;
          margin: 0 24px;
        }
        .search-bar {
          display: flex;
          align-items: center;
          background: var(--surface-lowest);
          border: 1px solid var(--hairline);
          border-radius: 4px;
          padding: 4px 10px;
          transition: border-color 0.2s;
        }
        .search-bar:focus-within {
          border-color: var(--primary);
          box-shadow: 0 0 10px rgba(56, 189, 248, 0.2);
        }
        .search-icon {
          color: var(--outline);
          font-size: 18px;
          margin-right: 8px;
        }
        .search-input {
          background: transparent;
          border: none;
          color: var(--on-surface);
          font-family: var(--font-mono);
          font-size: 12px;
          width: 100%;
          outline: none;
        }
        .search-input::placeholder {
          color: var(--outline);
        }
        .kbd-shortcut {
          font-family: var(--font-mono);
          font-size: 10px;
          background: var(--surface-container);
          color: var(--outline);
          padding: 2px 6px;
          border-radius: 3px;
        }
        .header-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .btn-header {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 4px;
          background: var(--surface-container);
          border: 1px solid var(--hairline);
          color: var(--on-surface);
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-header:hover {
          background: var(--surface-high);
          color: #fff;
        }
        .btn-primary-accent {
          background: var(--primary);
          color: var(--surface-lowest);
          border: 1px solid transparent;
          font-weight: 600;
        }
        .btn-primary-accent:hover {
          background: var(--primary-light);
          color: var(--surface-lowest);
          box-shadow: 0 0 12px rgba(56, 189, 248, 0.4);
        }
        .spin-icon {
          animation: spinSlow 1.5s linear infinite;
        }
        .user-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--surface-container-high);
          border: 1px solid var(--hairline);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--primary);
        }
      `}</style>
    </header>
  );
};
