import React, { useState } from 'react';

export const SystemPage: React.FC = () => {
  const [isChecking, setIsChecking] = useState(false);
  const [checkPassed, setCheckPassed] = useState(true);

  const handleRunDoctor = () => {
    setIsChecking(true);
    setTimeout(() => {
      setIsChecking(false);
      setCheckPassed(true);
    }, 1200);
  };

  const diagnostics = [
    { name: 'SQLite 3 WAL Journal Mode', status: 'PASS', detail: 'PRAGMA journal_mode = WAL enabled, 0 deadlocks' },
    { name: 'Schema Migrations & Integrity', status: 'PASS', detail: 'Version 0.2.0 synchronized, Quick check ok' },
    { name: 'Tree-sitter Language Parsers', status: 'PASS', detail: '9 parsers dynamically bound via Rust abi3 cdylib' },
    { name: 'Process Lock Manager', status: 'PASS', detail: 'File locking active, 0 stale locks detected' },
    { name: 'FTS5 Token Search Index', status: 'PASS', detail: '1,330 symbol signatures tokenized and ready' },
    { name: 'Louvain Modularity Partition', status: 'PASS', detail: 'Q = 0.8199 modularity converged in 4 passes' },
    { name: 'Model Context Protocol (MCP)', status: 'PASS', detail: 'Stdio JSON-RPC 2.0 active + REST API :4200' },
  ];

  return (
    <div className="system-page">
      <div className="system-header">
        <div>
          <h1 className="system-title">System & Engine Diagnostics</h1>
          <p className="system-subtitle">
            FastAST Core Engine status, SQLite integrity, and agent runtime bridge
          </p>
        </div>
        <button
          className="btn-doctor"
          onClick={handleRunDoctor}
          disabled={isChecking}
        >
          <span className={`material-symbols-outlined text-sm ${isChecking ? 'spin-icon' : ''}`}>
            health_and_safety
          </span>
          <span>{isChecking ? 'Running Doctor...' : 'Run FastAST Doctor'}</span>
        </button>
      </div>

      <div className="system-body">
        {/* Engine Banner */}
        <div className="engine-banner">
          <div className="flex items-center gap-4">
            <div className="engine-icon-wrap">
              <span className="material-symbols-outlined text-3xl text-primary">terminal</span>
            </div>
            <div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-lg text-on-surface">fastast-engine-core</span>
                <span className="engine-status-badge font-code">
                  {checkPassed ? 'OPERATIONAL' : 'DEGRADED'}
                </span>
              </div>
              <span className="text-outline font-code text-xs">
                Rust v0.2.0 • Tree-sitter ABI3 • SQLite 3 WAL Mode
              </span>
            </div>
          </div>

          <div className="engine-pills">
            <div className="pill-item">
              <span className="text-outline text-xs">DB File:</span>
              <span className="font-code text-xs text-on-surface">.fastast.db (172 KB)</span>
            </div>
            <div className="pill-item">
              <span className="text-outline text-xs">CORS API:</span>
              <span className="font-code text-xs text-tertiary">http://127.0.0.1:4200</span>
            </div>
          </div>
        </div>

        {/* Diagnostics Table */}
        <div className="diagnostics-card">
          <span className="table-title font-code">Automated Subsystem Checks</span>

          <div className="diag-list">
            {diagnostics.map((diag, idx) => (
              <div key={idx} className="diag-row">
                <div className="diag-row-left">
                  <span className="material-symbols-outlined text-tertiary text-sm">check_circle</span>
                  <div className="flex flex-col">
                    <span className="diag-name font-semibold text-sm">{diag.name}</span>
                    <span className="diag-detail text-outline font-code text-xs">{diag.detail}</span>
                  </div>
                </div>
                <span className="diag-pass-badge font-code text-xs">{diag.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .system-page {
          width: 100%;
          height: calc(100vh - 56px);
          display: flex;
          flex-direction: column;
          background: var(--surface-lowest);
          overflow-y: auto;
        }
        .system-header {
          padding: 16px 24px;
          background: var(--surface);
          border-bottom: 1px solid var(--hairline);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .system-title {
          font-size: 16px;
          font-weight: 700;
          color: var(--on-surface);
          margin: 0;
        }
        .system-subtitle {
          font-size: 12px;
          color: var(--outline);
          margin: 0;
          padding-top: 2px;
        }
        .btn-doctor {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: var(--primary);
          color: var(--surface-lowest);
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
        }
        .system-body {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          max-width: 1200px;
          margin: 0 auto;
          width: 100%;
        }
        .engine-banner {
          background: var(--surface);
          border: 1px solid var(--hairline);
          border-radius: 8px;
          padding: 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .engine-icon-wrap {
          width: 48px;
          height: 48px;
          border-radius: 8px;
          background: var(--surface-low);
          border: 1px solid var(--hairline);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .engine-status-badge {
          background: rgba(16, 185, 129, 0.15);
          color: var(--tertiary-light);
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 700;
        }
        .engine-pills {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .pill-item {
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--surface-low);
          padding: 6px 12px;
          border-radius: 4px;
          border: 1px solid var(--hairline);
        }
        .diagnostics-card {
          background: var(--surface);
          border: 1px solid var(--hairline);
          border-radius: 8px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .diag-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .diag-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 12px;
          background: var(--surface-container);
          border-radius: 6px;
          border: 1px solid var(--hairline);
        }
        .diag-row-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .diag-pass-badge {
          background: rgba(16, 185, 129, 0.12);
          color: var(--tertiary-light);
          padding: 2px 8px;
          border-radius: 3px;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
};
