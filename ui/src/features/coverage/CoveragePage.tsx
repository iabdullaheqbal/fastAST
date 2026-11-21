import React, { useEffect, useState } from 'react';
import { fastAstApi } from '../../services/api';
import type { FileRecord, RepoStats } from '../../types';

export const CoveragePage: React.FC = () => {
  const [stats, setStats] = useState<RepoStats | null>(null);
  const [diag, setDiag] = useState<any>(null);
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [apiError, setApiError] = useState<string | null>(null);

  const loadCoverage = async () => {
    setIsLoading(true);
    setApiError(null);
    try {
      const [s, d, f] = await Promise.all([
        fastAstApi.getStats(),
        fastAstApi.getDiagnostics(),
        fastAstApi.getFiles(),
      ]);
      setStats(s);
      setDiag(d);
      setFiles(f);
    } catch (err: any) {
      setApiError(err?.message || 'Failed to load index coverage data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCoverage();
  }, []);

  const colors: Record<string, string> = {
    python: '#38bdf8',
    rust: '#f97316',
    typescript: '#3b82f6',
    javascript: '#eab308',
    markdown: '#94a3b8',
    json: '#fbbf24',
    html: '#f43f5e',
    css: '#06b6d4',
    toml: '#a855f7',
    java: '#ef4444',
  };

  const totalFiles = stats?.files ?? 0;
  const diskFiles = diag?.coverage?.disk_files_count ?? totalFiles;
  const syntaxErrorFiles = files.filter((f) => f.has_syntax_error).length;
  const unindexedFiles = Math.max(0, diskFiles - totalFiles);

  const languagesList = React.useMemo(() => {
    if (!stats?.languages) return [];
    return Object.entries(stats.languages)
      .sort((a, b) => b[1] - a[1])
      .map(([lang, count]) => ({
        name: lang.charAt(0).toUpperCase() + lang.slice(1),
        key: lang,
        count,
        color: colors[lang.toLowerCase()] || '#a855f7',
      }));
  }, [stats]);

  const categoriesList = React.useMemo(() => {
    if (!stats?.categories) return [];
    return Object.entries(stats.categories).sort((a, b) => b[1] - a[1]);
  }, [stats]);

  const symbolKindsList = React.useMemo(() => {
    if (!stats?.symbol_kinds) return [];
    return Object.entries(stats.symbol_kinds).sort((a, b) => b[1] - a[1]);
  }, [stats]);

  return (
    <div className="coverage-page">
      <div className="coverage-header">
        <div>
          <h1 className="coverage-title">Repository Index Coverage</h1>
          <p className="coverage-subtitle">
            Live file admission, language distribution, symbol kinds, and parse health from .fastast.db
          </p>
        </div>
        <button className="refresh-btn font-code" onClick={loadCoverage} disabled={isLoading}>
          <span className={`material-symbols-outlined text-xs ${isLoading ? 'spin-icon' : ''}`}>
            refresh
          </span>
          <span>Refresh</span>
        </button>
      </div>

      <div className="coverage-body">
        {apiError && (
          <div className="api-error-banner">
            <div>{apiError}</div>
            <button className="api-retry-btn" onClick={loadCoverage}>
              Retry
            </button>
          </div>
        )}

        {/* Top Real Telemetry Cards */}
        <div className="summary-cards-row">
          <div className="summary-card">
            <span className="card-label">Admitted & Indexed Files</span>
            <span className="card-val font-code text-primary">
              {totalFiles.toLocaleString()}
            </span>
            <span className="card-sub font-code">
              {diskFiles} on disk • {unindexedFiles} pending • {syntaxErrorFiles} syntax errors
            </span>
          </div>

          <div className="summary-card">
            <span className="card-label">Extracted AST Symbols</span>
            <span className="card-val font-code text-secondary">
              {(stats?.symbols ?? 0).toLocaleString()}
            </span>
            <span className="card-sub font-code">
              {symbolKindsList
                .slice(0, 3)
                .map(([k, v]) => `${v} ${k}s`)
                .join(', ') || 'No symbols'}
            </span>
          </div>

          <div className="summary-card">
            <span className="card-label">Graph Relationships</span>
            <span className="card-val font-code text-tertiary">
              {(stats?.edges ?? 0).toLocaleString()}
            </span>
            <span className="card-sub font-code">
              {(stats?.calls ?? 0).toLocaleString()} calls • {(stats?.imports ?? 0).toLocaleString()}{' '}
              imports
            </span>
          </div>

          <div className="summary-card">
            <span className="card-label">File Categories</span>
            <div className="cat-chips font-code">
              {categoriesList.map(([cat, cnt]) => (
                <span key={cat} className="cat-chip">
                  <strong>{cnt}</strong> {cat}
                </span>
              ))}
            </div>
            <span className="card-sub font-code">
              {languagesList.length} active languages
            </span>
          </div>
        </div>

        {/* Language Distribution */}
        <div className="section-card">
          <span className="table-title font-code">
            Indexed Language Distribution ({languagesList.length} Languages)
          </span>

          {languagesList.length > 0 ? (
            <div className="languages-grid">
              {languagesList.map((lang) => {
                const pct =
                  totalFiles > 0 ? Math.round((lang.count / totalFiles) * 1000) / 10 : 0;
                return (
                  <div key={lang.key} className="lang-box">
                    <div className="lang-box-top">
                      <div className="flex items-center gap-2">
                        <span
                          className="lang-dot"
                          style={{ backgroundColor: lang.color }}
                        />
                        <span className="font-semibold">{lang.name}</span>
                      </div>
                      <span className="font-code text-xs text-outline">
                        {lang.count} files
                      </span>
                    </div>

                    <div className="lang-meter">
                      <div
                        className="lang-meter-bar"
                        style={{
                          width: `${Math.max(2, pct)}%`,
                          backgroundColor: lang.color,
                        }}
                      />
                    </div>

                    <div className="lang-box-bottom font-code text-xs">
                      <span className="text-on-surface-variant">{pct}% of indexed files</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-6 text-outline font-code text-center">
              {isLoading ? 'Loading language metrics...' : 'No indexed files found.'}
            </div>
          )}
        </div>

        {/* Symbol Kinds Breakdown */}
        {symbolKindsList.length > 0 && (
          <div className="section-card">
            <span className="table-title font-code">AST Symbol Kinds Breakdown</span>
            <div className="kinds-grid font-code">
              {symbolKindsList.map(([kind, count]) => (
                <div key={kind} className="kind-stat-box">
                  <span className="text-outline uppercase text-xs">{kind}</span>
                  <strong className="text-lg text-on-surface">
                    {count.toLocaleString()}
                  </strong>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`
        .coverage-page {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          background: var(--surface-lowest);
          overflow-y: auto;
        }
        .coverage-header {
          padding: 14px 20px;
          background: var(--surface);
          border-bottom: 1px solid var(--hairline);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .coverage-title {
          font-size: 15px;
          font-weight: 700;
          color: var(--on-surface);
          margin: 0;
        }
        .coverage-subtitle {
          font-size: 12px;
          color: var(--outline);
          margin: 2px 0 0 0;
        }
        .refresh-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: var(--surface-container);
          border: 1px solid var(--hairline);
          border-radius: 5px;
          color: var(--on-surface);
          font-size: 11.5px;
          cursor: pointer;
        }
        .coverage-body {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          max-width: 1320px;
          width: 100%;
          margin: 0 auto;
        }
        .summary-cards-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 12px;
        }
        .summary-card {
          background: var(--surface);
          border: 1px solid var(--hairline);
          border-radius: 6px;
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .card-label {
          font-family: var(--font-mono);
          font-size: 10px;
          color: var(--outline);
          text-transform: uppercase;
        }
        .card-val {
          font-size: 22px;
          font-weight: 700;
        }
        .card-sub {
          font-size: 11px;
          color: var(--outline);
        }
        .cat-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin: 2px 0;
        }
        .cat-chip {
          background: var(--surface-low);
          border: 1px solid var(--hairline);
          padding: 2px 7px;
          border-radius: 4px;
          font-size: 11.5px;
          color: var(--on-surface-variant);
        }
        .section-card {
          background: var(--surface);
          border: 1px solid var(--hairline);
          border-radius: 6px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .table-title {
          font-size: 11px;
          color: var(--outline);
          text-transform: uppercase;
          font-weight: 600;
        }
        .languages-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 12px;
        }
        .lang-box {
          background: var(--surface-low);
          border: 1px solid var(--hairline);
          border-radius: 5px;
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .lang-box-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .lang-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }
        .lang-meter {
          width: 100%;
          height: 5px;
          background: var(--surface-lowest);
          border-radius: 3px;
          overflow: hidden;
        }
        .lang-meter-bar {
          height: 100%;
          border-radius: 3px;
        }
        .lang-box-bottom {
          display: flex;
          justify-content: space-between;
        }
        .kinds-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 10px;
        }
        .kind-stat-box {
          background: var(--surface-low);
          border: 1px solid var(--hairline);
          border-radius: 5px;
          padding: 10px 12px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
      `}</style>
    </div>
  );
};
