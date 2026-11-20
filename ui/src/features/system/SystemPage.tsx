import React, { useEffect, useState } from 'react';
import { fastAstApi, getApiEndpointDisplay } from '../../services/api';
import type { HealthStatus } from '../../types';
import './SystemPage.css';

interface SystemPageProps {
  health?: HealthStatus | null;
  apiError?: string | null;
  onRefreshGlobal?: () => Promise<void> | void;
}

export const SystemPage: React.FC<SystemPageProps> = ({
  health: propHealth,
  apiError: propError,
  onRefreshGlobal,
}) => {
  const [health, setHealth] = useState<HealthStatus | null>(propHealth || null);
  const [diagData, setDiagData] = useState<any>(null);
  const [error, setError] = useState<string | null>(propError || null);
  const [isChecking, setIsChecking] = useState(false);
  const [isIndexing, setIsIndexing] = useState(false);
  const [indexSummary, setIndexSummary] = useState<any>(null);

  const loadSystemStatus = async () => {
    setIsChecking(true);
    setError(null);
    try {
      const [h, d] = await Promise.all([
        fastAstApi.getHealth(),
        fastAstApi.getDiagnostics(),
      ]);
      setHealth(h);
      setDiagData(d);
      onRefreshGlobal?.();
    } catch (err: any) {
      setError(err?.message || `Failed to reach FastAST API server at ${getApiEndpointDisplay()}.`);
      setHealth(null);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    loadSystemStatus();
  }, []);

  const handleReindex = async (force: boolean) => {
    setIsIndexing(true);
    setError(null);
    try {
      const res = await fastAstApi.triggerReindex(force);
      setIndexSummary(res.summary);
      setHealth(res.health);
      const d = await fastAstApi.getDiagnostics();
      setDiagData(d);
      onRefreshGlobal?.();
    } catch (err: any) {
      setError(err?.message || 'Indexing failed.');
    } finally {
      setIsIndexing(false);
    }
  };

  const isReachable = Boolean(health?.ok && !error);
  const dbSizeKb = diagData?.database?.size_bytes
    ? (diagData.database.size_bytes / 1024).toFixed(1)
    : '—';

  const lastIndexedDisplay = health?.last_index_time
    ? new Date(health.last_index_time).toLocaleString()
    : 'Not indexed yet';

  const checks = diagData
    ? [
        {
          name: 'Backend HTTP API Bridge (:4200)',
          status: isReachable ? 'PASS' : 'FAIL',
          detail: isReachable
            ? `Reachable at ${getApiEndpointDisplay()} • Repo: ${health?.repo_path}`
            : error || 'API unreachable',
        },
        {
          name: 'SQLite 3 WAL Journal & Integrity',
          status: diagData.database?.integrity_ok ? 'PASS' : 'WARN',
          detail: `Journal: ${diagData.database?.journal_mode || 'wal'} • Integrity: ${
            diagData.database?.integrity_message || 'ok'
          } • Size: ${dbSizeKb} KB`,
        },
        {
          name: 'Schema Version & Migrations',
          status:
            diagData.database?.schema_version === diagData.database?.expected_schema_version
              ? 'PASS'
              : 'WARN',
          detail: `Schema v${diagData.database?.schema_version ?? '—'} (expected v${
            diagData.database?.expected_schema_version ?? 10
          })`,
        },
        {
          name: 'Process Lock State',
          status: diagData.lock?.is_stale ? 'WARN' : 'PASS',
          detail: `Locked: ${diagData.lock?.is_locked ? 'Yes' : 'No (Idle)'} • Stale Lock: ${
            diagData.lock?.is_stale ? 'Yes' : 'No'
          }`,
        },
        {
          name: 'FTS5 BM25 Lexical Index',
          status: (diagData.coverage?.fts_entries_count ?? 0) > 0 ? 'PASS' : 'WARN',
          detail: `${(diagData.coverage?.fts_entries_count ?? 0).toLocaleString()} FTS5 rows indexed for BM25 retrieval`,
        },
        {
          name: 'Dense Semantic Embeddings',
          status: (diagData.coverage?.embeddings_count ?? 0) > 0 ? 'PASS' : 'WARN',
          detail: `${(diagData.coverage?.embeddings_count ?? 0).toLocaleString()} symbol vector embeddings stored`,
        },
        {
          name: 'Louvain Community Partitioning',
          status: (diagData.coverage?.communities_count ?? 0) > 0 ? 'PASS' : 'WARN',
          detail: `${(diagData.coverage?.communities_count ?? 0).toLocaleString()} distinct communities detected`,
        },
      ]
    : [];

  return (
    <div className="system-page">
      <div className="system-header">
        <div>
          <h1 className="system-title">System Health & Index Control</h1>
          <p className="system-subtitle">
            Live API connectivity, SQLite WAL database status, entity counts, and re-index controls
          </p>
        </div>
        <div className="header-actions">
          <button
            className="btn-secondary"
            onClick={loadSystemStatus}
            disabled={isChecking}
          >
            <span className={`material-symbols-outlined text-sm ${isChecking ? 'spin-icon' : ''}`}>
              sync
            </span>
            <span>{isChecking ? 'Checking...' : 'Run Doctor Check'}</span>
          </button>
          <button
            className="btn-secondary"
            onClick={() => handleReindex(false)}
            disabled={isIndexing || !isReachable}
          >
            <span className={`material-symbols-outlined text-sm ${isIndexing ? 'spin-icon' : ''}`}>
              refresh
            </span>
            <span>{isIndexing ? 'Indexing...' : 'Incremental Re-index'}</span>
          </button>
          <button
            className="btn-primary"
            onClick={() => handleReindex(true)}
            disabled={isIndexing || !isReachable}
          >
            <span className="material-symbols-outlined text-sm">bolt</span>
            <span>Force Full Re-index</span>
          </button>
        </div>
      </div>

      <div className="system-body">
        {error && (
          <div className="api-error-banner">
            <div>
              <strong>API Connection Error:</strong> {error}
            </div>
            <button className="api-retry-btn" onClick={loadSystemStatus}>
              Retry
            </button>
          </div>
        )}

        {/* Core Status Grid */}
        <div className="status-cards-grid">
          <div className="status-card">
            <span className="card-label">API Reachable</span>
            <div className="card-value-row">
              <span
                className={`status-indicator ${
                  isReachable ? 'indicator-yes' : 'indicator-no'
                }`}
              >
                {isReachable ? 'YES (ONLINE)' : 'NO (OFFLINE)'}
              </span>
            </div>
            <span className="card-sub font-code">{getApiEndpointDisplay() + '/health'}</span>
          </div>

          <div className="status-card">
            <span className="card-label">SQLite Database Path</span>
            <span className="card-val-mono font-code truncate" title={health?.db_path || ''}>
              {health?.db_path || 'Not connected'}
            </span>
            <span className="card-sub font-code">
              Exists: {health?.db_exists ? `Yes (${dbSizeKb} KB)` : 'No'}
            </span>
          </div>

          <div className="status-card">
            <span className="card-label">Last Index Timestamp</span>
            <span className="card-val-mono font-code">{lastIndexedDisplay}</span>
            <span className="card-sub">
              Status: <strong className="text-tertiary">{health?.status?.toUpperCase() || '—'}</strong>
            </span>
          </div>

          <div className="status-card">
            <span className="card-label">Live Indexed Counts</span>
            <div className="counts-inline font-code">
              <span>
                <strong className="text-on-surface">{health?.file_count ?? '—'}</strong> files
              </span>
              <span>•</span>
              <span>
                <strong className="text-primary">{health?.symbol_count ?? '—'}</strong> symbols
              </span>
              <span>•</span>
              <span>
                <strong className="text-tertiary">{health?.edge_count ?? '—'}</strong> edges
              </span>
            </div>
            <span className="card-sub font-code">
              {health?.call_count ?? '—'} calls • {health?.import_count ?? '—'} imports
            </span>
          </div>
        </div>

        {/* Last Re-index Run Summary (if triggered) */}
        {indexSummary && (
          <div className="reindex-banner font-code">
            <div className="flex items-center gap-2 text-tertiary font-semibold">
              <span className="material-symbols-outlined text-sm">check_circle</span>
              <span>
                Re-index completed in {indexSummary.elapsed_ms} ms — {indexSummary.indexed_files} indexed,{' '}
                {indexSummary.skipped_files} unchanged, {indexSummary.total_symbols} symbols,{' '}
                {indexSummary.total_edges} edges.
              </span>
            </div>
          </div>
        )}

        {/* Automated Doctor Checks */}
        <div className="diagnostics-card">
          <div className="card-header-row">
            <span className="table-title font-code">FastAST Doctor Subsystem Checks</span>
            <span className="font-code text-xs text-outline">
              Overall: {diagData?.status?.toUpperCase() || (isReachable ? 'HEALTHY' : 'OFFLINE')}
            </span>
          </div>

          {checks.length > 0 ? (
            <div className="diag-list">
              {checks.map((chk, idx) => (
                <div key={idx} className="diag-row">
                  <div className="diag-row-left">
                    <span
                      className={`material-symbols-outlined text-sm ${
                        chk.status === 'PASS'
                          ? 'text-tertiary'
                          : chk.status === 'WARN'
                          ? 'text-amber'
                          : 'text-error'
                      }`}
                    >
                      {chk.status === 'PASS'
                        ? 'check_circle'
                        : chk.status === 'WARN'
                        ? 'warning'
                        : 'error'}
                    </span>
                    <div className="diag-text-col">
                      <span className="diag-name">{chk.name}</span>
                      <span className="diag-detail font-code">{chk.detail}</span>
                    </div>
                  </div>
                  <span
                    className={`diag-badge font-code ${
                      chk.status === 'PASS'
                        ? 'badge-pass'
                        : chk.status === 'WARN'
                        ? 'badge-warn'
                        : 'badge-fail'
                    }`}
                  >
                    {chk.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-diag font-code">
              {isChecking
                ? 'Running repository diagnostics...'
                : 'No diagnostic report available (API offline).'}
            </div>
          )}
        </div>

        {/* Recommendations */}
        {diagData?.recommendations && diagData.recommendations.length > 0 && (
          <div className="recommendations-card font-code">
            <div className="rec-title">Doctor Recommendations:</div>
            {diagData.recommendations.map((rec: string, idx: number) => (
              <div key={idx} className="rec-item">
                • {rec}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
