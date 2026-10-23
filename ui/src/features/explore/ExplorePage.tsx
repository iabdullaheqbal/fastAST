import React, { useEffect, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { fastAstApi } from '../../services/api';
import type { CallGraphData, FileItem, FileOutline } from '../../types';

interface ExplorePageProps {
  initialSymbol?: string;
  initialFilePath?: string;
}

export const ExplorePage: React.FC<ExplorePageProps> = ({
  initialSymbol = 'get_repository_stats',
  initialFilePath = 'python/fastast/db.py',
}) => {
  const [searchParams] = useSearchParams();
  const location = useLocation();

  const initFile =
    (location.state as any)?.filePath ||
    searchParams.get('file') ||
    initialFilePath;
  const initSym =
    (location.state as any)?.symbolName ||
    searchParams.get('symbol') ||
    initialSymbol;

  const [files, setFiles] = useState<FileItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<string>(initFile);
  const [selectedSymbol, setSelectedSymbol] = useState<string>(initSym);
  const [fileFilter, setFileFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'source' | 'test' | 'config' | 'docs'>('all');
  const [outline, setOutline] = useState<FileOutline | null>(null);
  const [snippetData, setSnippetData] = useState<any>(null);
  const [callGraph, setCallGraph] = useState<CallGraphData | null>(null);
  const [isLoadingSnippet, setIsLoadingSnippet] = useState(false);
  const [copiedEvidence, setCopiedEvidence] = useState(false);

  // Sync with location or query params
  useEffect(() => {
    const sFile = (location.state as any)?.filePath || searchParams.get('file');
    const sSym = (location.state as any)?.symbolName || searchParams.get('symbol');
    if (sFile && sFile !== selectedFile) {
      setSelectedFile(sFile);
    }
    if (sSym && sSym !== selectedSymbol) {
      setSelectedSymbol(sSym);
    }
  }, [location.state, searchParams]);

  // Load files
  useEffect(() => {
    fastAstApi.getFiles().then((fileList) => {
      setFiles(fileList);
      if (fileList.length > 0 && !selectedFile) {
        setSelectedFile(fileList[0].path);
      }
    });
  }, []);

  // When selected file changes, fetch outline
  useEffect(() => {
    if (!selectedFile) return;
    fastAstApi.getFileOutline(selectedFile).then((data) => {
      setOutline(data);
      if (data) {
        const firstClass = data.classes?.[0];
        const firstMethod = firstClass?.methods?.[0];
        const firstFunc = data.functions?.[0];
        const firstOther = data.other_symbols?.[0];
        const defaultCandidate = firstMethod?.name
          ? `${firstClass.name}.${firstMethod.name}`
          : firstClass?.name || firstFunc?.name || firstOther?.name;

        if (defaultCandidate && (!selectedSymbol || !selectedFile.includes(selectedSymbol))) {
          setSelectedSymbol(defaultCandidate);
        }
      }
    });
  }, [selectedFile]);

  // When selected symbol changes, fetch snippet and call graph
  useEffect(() => {
    if (!selectedSymbol) return;
    const cleanSym = selectedSymbol.split('.').pop() || selectedSymbol;
    setIsLoadingSnippet(true);
    fastAstApi
      .getSnippet({ symbol: cleanSym, filePath: selectedFile })
      .then((data) => {
        setSnippetData(data);
        setIsLoadingSnippet(false);
      })
      .catch(() => setIsLoadingSnippet(false));

    fastAstApi.getCallGraph(cleanSym).then((cg) => {
      setCallGraph(cg);
    });
  }, [selectedSymbol, selectedFile]);

  const filteredFiles = files.filter((f) => {
    const matchesQuery = f.path.toLowerCase().includes(fileFilter.toLowerCase());
    const matchesCat =
      categoryFilter === 'all' || f.category.toLowerCase() === categoryFilter;
    return matchesQuery && matchesCat;
  });

  const handleCopyEvidence = () => {
    const evidenceText = JSON.stringify(
      {
        target_file: selectedFile,
        target_symbol: selectedSymbol,
        outline: outline?.classes || outline?.functions || [],
        snippet: snippetData?.snippet || '',
        callers: callGraph?.callers || [],
        callees: callGraph?.callees || [],
      },
      null,
      2
    );
    navigator.clipboard.writeText(evidenceText);
    setCopiedEvidence(true);
    setTimeout(() => setCopiedEvidence(false), 2000);
  };

  return (
    <div className="explore-page-layout">
      {/* 1. LEFT PANEL: File & Symbol Hierarchy (280px) */}
      <aside className="explore-left-panel">
        <div className="explore-panel-header">
          <div className="flex-between">
            <span className="panel-sub-title">File Navigator</span>
            <span className="count-chip">{files.length || 142} files</span>
          </div>
          <div className="search-box">
            <span className="material-symbols-outlined text-sm text-outline">filter_alt</span>
            <input
              type="text"
              placeholder="Filter files (*visitor, parser)..."
              value={fileFilter}
              onChange={(e) => setFileFilter(e.target.value)}
              className="filter-input"
            />
          </div>
          <div className="category-pills">
            {(['all', 'source', 'test', 'config', 'docs'] as const).map((cat) => (
              <button
                key={cat}
                className={`cat-pill ${categoryFilter === cat ? 'cat-pill-active' : ''}`}
                onClick={() => setCategoryFilter(cat)}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* File List */}
        <div className="file-tree-scroll">
          <div className="folder-label">
            <span className="material-symbols-outlined text-sm text-primary">folder_open</span>
            <span className="font-semibold text-xs">fastAST/</span>
          </div>

          <div className="file-items-list">
            {filteredFiles.map((f) => {
              const isSelected = f.path === selectedFile;
              return (
                <div
                  key={f.id}
                  className={`file-row ${isSelected ? 'file-row-selected' : ''}`}
                  onClick={() => setSelectedFile(f.path)}
                >
                  <div className="file-row-left">
                    <span className="material-symbols-outlined text-sm file-icon">
                      {f.language === 'python'
                        ? 'code'
                        : f.language === 'rust'
                        ? 'settings_ethernet'
                        : 'description'}
                    </span>
                    <span className="file-name truncate">{f.path}</span>
                  </div>
                  <div className="file-row-right">
                    <span className="line-count">{f.total_lines}L</span>
                    <span className="lang-tag">{f.language}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="explore-panel-footer">
          <div className="status-indicator">
            <span className="status-pip" />
            <span>{files.length || 142} files indexed</span>
          </div>
          <span className="stale-count">0 stale</span>
        </div>
      </aside>

      {/* 2. CENTER WORKSPACE: Bounded Code & Symbol Inspector Canvas */}
      <main className="explore-center-canvas">
        {/* Breadcrumb Header */}
        <div className="canvas-header">
          <div className="breadcrumb-wrap">
            <span className="text-outline">fastAST</span>
            <span className="text-outline">/</span>
            <span className="text-primary font-semibold flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">feed</span>
              {selectedFile}
            </span>
            <span className="meta-tag">{outline?.language || 'source'}</span>
            <span className="meta-tag">{outline?.total_lines || files.find(f => f.path === selectedFile)?.total_lines || 120} LOC</span>
            <span className="meta-tag text-tertiary">SQLite WAL Indexed</span>
          </div>

          <div className="canvas-view-mode">
            <button className="view-mode-btn view-mode-btn-active">AST Outline</button>
            <button className="view-mode-btn">Bounded Snippet</button>
            <button className="view-mode-btn">Call Neighborhood</button>
          </div>
        </div>

        {/* Content Area */}
        <div className="canvas-content-scroll">
          {/* Quick Action Bar */}
          <div className="action-bar-strip">
            <div className="scope-info">
              <span className="scope-title">Target Scope:</span>
              <span className="scope-val font-code">
                {selectedFile} [Lines 1-{outline?.total_lines || files.find(f => f.path === selectedFile)?.total_lines || 100}]
              </span>
            </div>
            <div className="action-bar-btns">
              <button className="btn-canvas-action" onClick={handleCopyEvidence}>
                <span className="material-symbols-outlined text-tertiary text-sm">content_copy</span>
                <span>{copiedEvidence ? 'Copied Evidence!' : 'Extract Evidence'}</span>
              </button>
              <button
                className="btn-canvas-action btn-purple"
                onClick={() => {
                  window.location.hash = '#/globe';
                }}
              >
                <span className="material-symbols-outlined text-sm">bubble_chart</span>
                <span>Galaxy Graph</span>
              </button>
            </div>
          </div>

          {/* Active Bounded Snippet Box */}
          <div className="mb-4">
            <div className="flex-between pb-2 font-code text-xs text-outline">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-sm text-primary">data_object</span>
                Active Bounded Window: <strong className="text-on-surface">{selectedSymbol}</strong>
              </span>
              <span>{snippetData?.snippet ? `${snippetData.snippet.split('\n').length} lines bounded` : 'Select symbol'}</span>
            </div>

            {isLoadingSnippet ? (
              <div className="code-snippet-box p-6 text-center text-outline font-code text-xs">
                Fetching bounded snippet from SQLite...
              </div>
            ) : snippetData && snippetData.snippet ? (
              <div className="code-snippet-box">
                <div className="omission-line">
                  <span className="line-num">...</span>
                  <span className="omission-text">
                    ··· [{snippetData.file_path || selectedFile}:{snippetData.start_line ?? 1}-{snippetData.end_line ?? 'end'} • Bounded AST definition for {selectedSymbol}] ···
                  </span>
                </div>
                {snippetData.snippet.split('\n').map((line: string, idx: number) => {
                  const lineNum = (snippetData.start_line ?? 1) + idx;
                  const isHighlighted = idx < 2;
                  return (
                    <div key={idx} className={`code-line ${isHighlighted ? 'code-line-highlight' : ''}`}>
                      <span className={`line-num ${isHighlighted ? 'text-primary font-bold' : ''}`}>{lineNum}</span>
                      <div className="code-text font-code text-xs whitespace-pre">{line || ' '}</div>
                    </div>
                  );
                })}
                {snippetData.is_truncated && (
                  <div className="omission-line">
                    <span className="line-num">...</span>
                    <span className="omission-text">··· [Remaining lines omitted to enforce strict token budget] ···</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="code-snippet-box p-6 text-center text-outline font-code text-xs">
                Select a class, method, or function below to inspect its bounded context window.
              </div>
            )}
          </div>

          {/* Classes & Methods Section */}
          {outline?.classes && outline.classes.length > 0 && (
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-outline mb-2">
                Classes & Methods ({outline.classes.length})
              </div>
              {outline.classes.map((cls, cIdx) => (
                <section key={cIdx} className="scope-card mb-3">
                  <div className="scope-card-header">
                    <div className="card-header-left">
                      <span className="badge-class">Class</span>
                      <span
                        className="font-code font-semibold text-on-surface cursor-pointer hover:text-primary transition-colors"
                        onClick={() => setSelectedSymbol(cls.name)}
                      >
                        {cls.name}
                      </span>
                      <span className="text-outline font-code text-xs">
                        lines {cls.start_line}-{cls.end_line} ({cls.methods?.length || 0} methods)
                      </span>
                    </div>
                    <div className="card-header-right font-code text-xs">
                      <span className="text-tertiary">AST Node</span>
                    </div>
                  </div>

                  {cls.methods && cls.methods.length > 0 && (
                    <div className="methods-quick-row">
                      {cls.methods.map((m, mIdx) => {
                        const isMethodActive =
                          selectedSymbol === m.name ||
                          selectedSymbol === `${cls.name}.${m.name}`;
                        return (
                          <span
                            key={mIdx}
                            className={`method-pill ${isMethodActive ? 'method-pill-active' : ''}`}
                            onClick={() => setSelectedSymbol(`${cls.name}.${m.name}`)}
                          >
                            <span
                              className={`dot ${isMethodActive ? 'dot-cyan animate-pulse' : 'dot-emerald'}`}
                            />
                            {m.name}() {isMethodActive ? '[Active]' : ''}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </section>
              ))}
            </div>
          )}

          {/* Functions Section */}
          {outline?.functions && outline.functions.length > 0 && (
            <div className="mt-3">
              <div className="text-xs font-semibold uppercase tracking-wider text-outline mb-2">
                Module Functions ({outline.functions.length})
              </div>
              {outline.functions.map((fn, fIdx) => {
                const isFnActive = selectedSymbol === fn.name;
                return (
                  <section
                    key={fIdx}
                    className={`scope-card mb-3 ${isFnActive ? 'border-primary/50' : ''}`}
                  >
                    <div className="scope-card-header">
                      <div className="card-header-left">
                        <span className="badge-func">{fn.kind || 'Function'}</span>
                        <span className="font-code font-semibold text-on-surface">{fn.name}</span>
                      </div>
                      <div className="card-header-right font-code text-xs">
                        <span className="text-outline">lines {fn.start_line}-{fn.end_line}</span>
                      </div>
                    </div>

                    <div className="func-details-row">
                      <div className="func-desc">
                        <span className="font-code text-xs text-outline truncate block max-w-lg">
                          {fn.signature || `def ${fn.name}(...)`}
                        </span>
                      </div>
                      <button
                        className={`btn-snippet-expand ${isFnActive ? 'bg-primary/20 text-primary' : ''}`}
                        onClick={() => setSelectedSymbol(fn.name)}
                      >
                        {isFnActive ? 'Focused' : 'Focus Symbol'}
                      </button>
                    </div>
                  </section>
                );
              })}
            </div>
          )}

          {/* Other Symbols Section */}
          {outline?.other_symbols && outline.other_symbols.length > 0 && (
            <div className="mt-3">
              <div className="text-xs font-semibold uppercase tracking-wider text-outline mb-2">
                Type & Interface Definitions ({outline.other_symbols.length})
              </div>
              <section className="scope-card">
                <div className="interface-fields-grid">
                  {outline.other_symbols.map((sym, sIdx) => (
                    <div
                      key={sIdx}
                      className="field-card cursor-pointer hover:border-primary/50 transition-colors"
                      onClick={() => setSelectedSymbol(sym.name)}
                    >
                      <span className="field-name font-code text-primary">{sym.name}</span>
                      <span className="field-default">{sym.kind} • Lines {sym.start_line}-{sym.end_line}</span>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {!outline?.classes?.length && !outline?.functions?.length && !outline?.other_symbols?.length && (
            <div className="scope-card p-6 text-center text-outline font-code text-xs">
              No top-level AST symbols parsed in this file. File total lines: {outline?.total_lines || 0}.
            </div>
          )}
        </div>
      </main>

      {/* 3. RIGHT INSPECTOR PANEL: Symbol Context & Call Graph Metadata */}
      <aside className="explore-right-panel">
        <div className="panel-header">
          <span className="panel-title font-semibold">Symbol Context & Metadata</span>
          <span className="kind-badge">
            {callGraph ? 'AST GRAPH' : 'METHOD'}
          </span>
        </div>

        <div className="panel-scrollable">
          {/* Active Focus Symbol */}
          <div className="focus-symbol-box">
            <span className="box-label">Active Focus Symbol</span>
            <div className="focus-name-card">
              <span className="focus-sym-title font-semibold truncate block">{selectedSymbol}</span>
              <span className="focus-sym-sig font-code text-xs text-outline truncate block">
                {selectedFile}
              </span>
            </div>
          </div>

          {/* Callers (Inbound) */}
          <div className="callers-section">
            <div className="flex-between">
              <span className="box-label">
                Inbound Callers ({callGraph?.caller_count ?? 0})
              </span>
              <span className="font-code text-xs text-outline">SQLite Edges</span>
            </div>
            <div className="caller-rows">
              {callGraph && callGraph.callers && callGraph.callers.length > 0 ? (
                callGraph.callers.map((c, idx) => (
                  <div
                    key={idx}
                    className="caller-row cursor-pointer hover:bg-surface-high transition-colors"
                    onClick={() => {
                      setSelectedSymbol(c.caller);
                      if (c.file_path) setSelectedFile(c.file_path);
                    }}
                    title={`Focus caller ${c.caller}`}
                  >
                    <div className="caller-main">
                      <span className="material-symbols-outlined text-xs text-primary">call_received</span>
                      <span className="font-code text-xs font-semibold text-primary truncate">
                        {c.caller}
                      </span>
                    </div>
                    <span className="caller-loc font-code">
                      {c.file_path?.split('/').pop() || 'file'}:{c.line_number || 1}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-2 text-xs text-outline font-code">
                  No inbound callers detected in graph.
                </div>
              )}
            </div>
          </div>

          {/* Callees (Outbound) */}
          <div className="callers-section">
            <div className="flex-between">
              <span className="box-label">
                Outbound Callees ({callGraph?.callee_count ?? 0})
              </span>
              <span className="font-code text-xs text-outline">SQLite Edges</span>
            </div>
            <div className="caller-rows">
              {callGraph && callGraph.callees && callGraph.callees.length > 0 ? (
                callGraph.callees.map((c, idx) => (
                  <div
                    key={idx}
                    className="caller-row cursor-pointer hover:bg-surface-high transition-colors"
                    onClick={() => {
                      setSelectedSymbol(c.callee);
                      if (c.file_path) setSelectedFile(c.file_path);
                    }}
                    title={`Focus callee ${c.callee}`}
                  >
                    <div className="caller-main">
                      <span className="material-symbols-outlined text-xs text-secondary">call_made</span>
                      <span className="font-code text-xs font-semibold text-secondary truncate">
                        {c.callee}
                      </span>
                    </div>
                    <span className="caller-loc font-code">
                      {c.file_path?.split('/').pop() || 'file'}:{c.line_number || 1}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-2 text-xs text-outline font-code">
                  No outbound invocations recorded.
                </div>
              )}
            </div>
          </div>

          {/* Action Trigger */}
          <div className="pt-2">
            <button className="btn-action btn-action-copy w-full" onClick={handleCopyEvidence}>
              <span className="material-symbols-outlined text-sm">content_copy</span>
              <span>{copiedEvidence ? 'Copied Bundle!' : 'Copy Evidence Window'}</span>
            </button>
          </div>
        </div>
      </aside>

      <style>{`
        .explore-page-layout {
          position: relative;
          width: 100%;
          height: calc(100vh - 56px);
          display: flex;
          background: var(--surface-lowest);
          overflow: hidden;
        }

        /* 1. Left Panel */
        .explore-left-panel {
          width: 280px;
          flex-shrink: 0;
          height: 100%;
          background: var(--surface);
          border-right: 1px solid var(--hairline);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        .explore-panel-header {
          padding: 12px;
          background: var(--surface-low);
          border-bottom: 1px solid var(--hairline);
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .flex-between {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .panel-sub-title {
          font-family: var(--font-mono);
          font-size: 11px;
          text-transform: uppercase;
          color: var(--outline);
          letter-spacing: 0.05em;
        }
        .count-chip {
          font-family: var(--font-mono);
          font-size: 10px;
          padding: 1px 6px;
          background: rgba(56, 189, 248, 0.15);
          color: var(--primary);
          border-radius: 4px;
        }
        .search-box {
          display: flex;
          align-items: center;
          gap: 6px;
          background: var(--surface-lowest);
          padding: 4px 8px;
          border-radius: 4px;
          border: 1px solid var(--hairline);
        }
        .filter-input {
          background: transparent;
          border: none;
          color: var(--on-surface);
          font-family: var(--font-mono);
          font-size: 11px;
          width: 100%;
          outline: none;
        }
        .category-pills {
          display: flex;
          gap: 4px;
          overflow-x: auto;
          padding-top: 2px;
        }
        .cat-pill {
          background: var(--surface-container);
          border: none;
          color: var(--outline);
          font-family: var(--font-mono);
          font-size: 10px;
          padding: 2px 7px;
          border-radius: 3px;
          cursor: pointer;
          transition: all 0.15s;
        }
        .cat-pill-active {
          background: var(--primary);
          color: var(--surface-lowest);
          font-weight: 600;
        }
        .file-tree-scroll {
          flex: 1;
          overflow-y: auto;
          padding: 8px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .folder-label {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 4px 6px;
          color: var(--on-surface);
        }
        .file-items-list {
          display: flex;
          flex-direction: column;
          gap: 2px;
          padding-left: 8px;
        }
        .file-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 5px 8px;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.15s;
        }
        .file-row:hover {
          background: var(--surface-container);
        }
        .file-row-selected {
          background: var(--surface-high);
          box-shadow: inset 2px 0 0 0 var(--primary);
        }
        .file-row-left {
          display: flex;
          align-items: center;
          gap: 6px;
          overflow: hidden;
        }
        .file-icon {
          color: var(--outline);
        }
        .file-row-selected .file-icon {
          color: var(--primary);
        }
        .file-name {
          font-family: var(--font-mono);
          font-size: 11px;
          color: var(--on-surface-variant);
        }
        .file-row-selected .file-name {
          color: var(--primary);
          font-weight: 600;
        }
        .file-row-right {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .line-count {
          font-family: var(--font-mono);
          font-size: 10px;
          color: var(--outline);
        }
        .lang-tag {
          font-family: var(--font-mono);
          font-size: 9px;
          padding: 1px 4px;
          border-radius: 3px;
          background: var(--surface-lowest);
          color: var(--outline);
        }
        .explore-panel-footer {
          padding: 8px 12px;
          background: var(--surface-low);
          border-top: 1px solid var(--hairline);
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-family: var(--font-mono);
          font-size: 11px;
        }
        .status-indicator {
          display: flex;
          align-items: center;
          gap: 6px;
          color: var(--on-surface);
        }
        .status-pip {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--tertiary-light);
        }
        .stale-count {
          color: var(--outline);
        }

        /* 2. Center Canvas */
        .explore-center-canvas {
          flex: 1;
          display: flex;
          flex-direction: column;
          background: var(--surface-lowest);
          overflow: hidden;
          border-right: 1px solid var(--hairline);
        }
        .canvas-header {
          height: 48px;
          padding: 0 16px;
          background: var(--surface);
          border-bottom: 1px solid var(--hairline);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .breadcrumb-wrap {
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: var(--font-mono);
          font-size: 12px;
        }
        .meta-tag {
          font-family: var(--font-mono);
          font-size: 10px;
          padding: 2px 6px;
          background: var(--surface-container);
          border-radius: 3px;
          color: var(--on-surface-variant);
        }
        .canvas-view-mode {
          display: flex;
          gap: 2px;
          background: var(--surface-lowest);
          padding: 2px;
          border-radius: 4px;
        }
        .view-mode-btn {
          background: transparent;
          border: none;
          padding: 4px 10px;
          border-radius: 3px;
          font-size: 11px;
          color: var(--outline);
          cursor: pointer;
        }
        .view-mode-btn-active {
          background: var(--surface-high);
          color: var(--primary);
          font-weight: 600;
        }
        .canvas-content-scroll {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .action-bar-strip {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 12px;
          background: var(--surface-low);
          border-radius: 6px;
          border: 1px solid var(--hairline);
        }
        .scope-info {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .scope-title {
          font-family: var(--font-mono);
          font-size: 11px;
          color: var(--outline);
          text-transform: uppercase;
        }
        .scope-val {
          font-size: 12px;
          color: var(--on-surface);
          background: var(--surface-container);
          padding: 2px 8px;
          border-radius: 4px;
        }
        .action-bar-btns {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .btn-canvas-action {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 5px 10px;
          border-radius: 4px;
          background: var(--surface-container);
          border: 1px solid var(--hairline);
          color: var(--on-surface);
          font-size: 11.5px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.15s;
        }
        .btn-canvas-action:hover {
          background: var(--surface-high);
        }
        .btn-purple {
          background: var(--secondary-container);
          color: var(--secondary-light);
          border-color: rgba(168, 85, 247, 0.3);
        }

        .scope-card {
          background: var(--surface);
          border-radius: 6px;
          border: 1px solid var(--hairline);
          overflow: hidden;
        }
        .scope-card-header {
          height: 36px;
          padding: 0 12px;
          background: var(--surface-low);
          border-bottom: 1px solid var(--hairline);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .card-header-left {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .badge-class {
          font-family: var(--font-mono);
          font-size: 10px;
          padding: 2px 6px;
          background: rgba(245, 158, 11, 0.15);
          color: var(--amber);
          border-radius: 3px;
          text-transform: uppercase;
          font-weight: 600;
        }
        .badge-func {
          font-family: var(--font-mono);
          font-size: 10px;
          padding: 2px 6px;
          background: rgba(16, 185, 129, 0.15);
          color: var(--tertiary-light);
          border-radius: 3px;
          text-transform: uppercase;
          font-weight: 600;
        }
        .badge-interface {
          font-family: var(--font-mono);
          font-size: 10px;
          padding: 2px 6px;
          background: rgba(129, 140, 248, 0.15);
          color: #818cf8;
          border-radius: 3px;
          text-transform: uppercase;
          font-weight: 600;
        }
        .card-header-right {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .community-tag {
          padding: 2px 6px;
          background: var(--secondary-container);
          color: var(--secondary-light);
          border-radius: 3px;
        }
        .methods-quick-row {
          padding: 8px 12px;
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          background: var(--surface);
          border-bottom: 1px solid var(--hairline);
        }
        .method-pill {
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: var(--font-mono);
          font-size: 11px;
          padding: 3px 8px;
          background: var(--surface-container);
          color: var(--on-surface-variant);
          border-radius: 4px;
          cursor: pointer;
        }
        .method-pill-active {
          background: rgba(56, 189, 248, 0.18);
          color: var(--primary);
          box-shadow: 0 0 8px rgba(56, 189, 248, 0.25);
        }
        .code-snippet-box {
          background: var(--surface-lowest);
          padding: 12px;
          font-family: var(--font-mono);
          font-size: 12px;
          line-height: 1.6;
          overflow-x: auto;
        }
        .omission-line {
          display: flex;
          align-items: center;
          gap: 12px;
          color: rgba(135, 146, 154, 0.6);
          padding: 2px 0;
          font-style: italic;
          font-size: 11px;
        }
        .code-line {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 2px 4px;
          border-radius: 3px;
        }
        .code-line:hover {
          background: rgba(30, 31, 38, 0.6);
        }
        .code-line-highlight {
          background: rgba(56, 189, 248, 0.12);
        }
        .line-num {
          width: 28px;
          text-align: right;
          color: var(--outline);
          user-select: none;
          font-size: 11px;
          flex-shrink: 0;
        }
        .code-text {
          flex: 1;
        }
        .kw { color: var(--secondary-light); font-weight: 600; }
        .fn-name { color: var(--primary); font-weight: 700; }
        .type-name { color: var(--amber); }
        .num { color: var(--tertiary-light); }

        .func-details-row {
          padding: 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .func-desc {
          display: flex;
          flex-direction: column;
          gap: 6px;
          font-size: 12px;
          color: var(--on-surface-variant);
        }
        .func-metrics {
          display: flex;
          gap: 6px;
        }
        .mini-badge {
          font-family: var(--font-mono);
          font-size: 10px;
          padding: 2px 6px;
          background: var(--surface-container);
          border-radius: 3px;
          color: var(--outline);
        }
        .btn-snippet-expand {
          background: var(--surface-container);
          border: 1px solid var(--hairline);
          color: var(--primary);
          padding: 6px 12px;
          border-radius: 4px;
          font-size: 11px;
          cursor: pointer;
        }

        .interface-fields-grid {
          padding: 12px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }
        .field-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: var(--surface-container);
          padding: 8px 10px;
          border-radius: 4px;
        }
        .field-name {
          color: var(--primary);
          font-size: 11px;
        }
        .field-default {
          color: var(--outline);
          font-size: 10px;
        }

        /* 3. Right Inspector Panel */
        .explore-right-panel {
          width: 320px;
          flex-shrink: 0;
          height: 100%;
          background: var(--surface);
          display: flex;
          flex-direction: column;
        }
        .box-label {
          font-family: var(--font-mono);
          font-size: 10px;
          color: var(--outline);
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .focus-symbol-box {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .focus-name-card {
          background: var(--surface-low);
          padding: 10px;
          border-radius: 4px;
          border: 1px solid var(--hairline);
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .focus-sym-title {
          font-size: 13px;
          color: var(--on-surface);
          word-break: break-all;
        }
        .community-box {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .comm-inner-card {
          background: var(--surface-high);
          padding: 10px;
          border-radius: 4px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .comm-title-wrap {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .comm-inner-title {
          font-size: 12px;
          color: var(--on-surface);
        }
        .caller-rows {
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding-top: 4px;
        }
        .caller-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 6px 8px;
          background: var(--surface-container);
          border-radius: 4px;
          cursor: pointer;
        }
        .caller-row:hover {
          background: var(--surface-high);
        }
        .caller-main {
          display: flex;
          align-items: center;
          gap: 6px;
          overflow: hidden;
        }
        .caller-loc {
          font-size: 10px;
          color: var(--outline);
          flex-shrink: 0;
        }
      `}</style>
    </div>
  );
};
