import React, { useEffect, useState } from 'react';
import { fastAstApi } from '../../services/api';
import type { FileItem, FileOutline } from '../../types';

interface ExplorePageProps {
  initialSymbol?: string;
  initialFilePath?: string;
}

export const ExplorePage: React.FC<ExplorePageProps> = ({
  initialSymbol = 'ASTVisitorEngine.traverseEdges',
  initialFilePath = 'src/parser/ast_visitor.ts',
}) => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<string>(initialFilePath);
  const [selectedSymbol, setSelectedSymbol] = useState<string>(initialSymbol);
  const [fileFilter, setFileFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'source' | 'test' | 'config' | 'docs'>('all');
  const [outline, setOutline] = useState<FileOutline | null>(null);
  const [snippetData, setSnippetData] = useState<any>(null);
  const [copiedEvidence, setCopiedEvidence] = useState(false);

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
    });
  }, [selectedFile]);

  // When selected symbol changes, fetch snippet
  useEffect(() => {
    if (!selectedSymbol) return;
    fastAstApi
      .getSnippet({ symbol: selectedSymbol.split('.').pop() || selectedSymbol })
      .then((data) => {
        setSnippetData(data);
      });
  }, [selectedSymbol]);

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
        snippet: snippetData?.snippet || 'public async traverseEdges(...)',
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
            <span className="meta-tag">{outline?.total_lines || 284} LOC</span>
            <span className="meta-tag text-tertiary">Indexed via SQLite WAL</span>
          </div>

          <div className="canvas-view-mode">
            <button className="view-mode-btn view-mode-btn-active">Outline</button>
            <button className="view-mode-btn">Bounded Source</button>
            <button className="view-mode-btn">Symbol Index</button>
          </div>
        </div>

        {/* Content Area */}
        <div className="canvas-content-scroll">
          {/* Quick Action Bar */}
          <div className="action-bar-strip">
            <div className="scope-info">
              <span className="scope-title">Target Scope:</span>
              <span className="scope-val font-code">
                {selectedFile} [Lines 1-{outline?.total_lines || 150}]
              </span>
            </div>
            <div className="action-bar-btns">
              <button className="btn-canvas-action" onClick={handleCopyEvidence}>
                <span className="material-symbols-outlined text-tertiary text-sm">content_copy</span>
                <span>{copiedEvidence ? 'Copied Evidence!' : 'Extract Evidence'}</span>
              </button>
              <button
                className="btn-canvas-action btn-purple"
                onClick={() => setSelectedSymbol('ASTVisitorEngine.traverseEdges')}
              >
                <span className="material-symbols-outlined text-sm">bubble_chart</span>
                <span>Galaxy Graph</span>
              </button>
              <button className="btn-canvas-action">
                <span className="material-symbols-outlined text-primary text-sm">call_split</span>
                <span>Find Callers</span>
              </button>
            </div>
          </div>

          {/* Scope Card 1: Classes & Methods */}
          <section className="scope-card">
            <div className="scope-card-header">
              <div className="card-header-left">
                <span className="badge-class">Class</span>
                <span className="font-code font-semibold text-on-surface">ASTVisitorEngine&lt;T&gt;</span>
                <span className="text-outline font-code text-xs">lines 24-118 (8 methods)</span>
              </div>
              <div className="card-header-right font-code text-xs">
                <span className="text-tertiary">export</span>
                <span className="text-outline">cyclomatic: 4</span>
              </div>
            </div>

            <div className="methods-quick-row">
              <span className="method-pill">
                <span className="dot dot-emerald" /> visitNode()
              </span>
              <span
                className="method-pill method-pill-active"
                onClick={() => setSelectedSymbol('ASTVisitorEngine.traverseEdges')}
              >
                <span className="dot dot-cyan animate-pulse" /> traverseEdges() [Active]
              </span>
              <span className="method-pill">
                <span className="dot dot-emerald" /> computeDegreeCentrality()
              </span>
              <span className="method-pill text-outline">+ 5 more internal methods</span>
            </div>

            {/* Bounded Code Snippet with Syntax & Context */}
            <div className="code-snippet-box">
              <div className="omission-line">
                <span className="line-num">...</span>
                <span className="omission-text">··· [17 lines: constructor & node validators omitted] ···</span>
              </div>

              <div className="code-line">
                <span className="line-num">42</span>
                <div className="code-text">
                  <span className="kw">public async</span> <span className="fn-name">traverseEdges</span>(
                </div>
              </div>

              <div className="code-line">
                <span className="line-num">43</span>
                <div className="code-text pl-4">
                  node: <span className="type-name">ASTNode</span>,
                </div>
              </div>

              <div className="code-line">
                <span className="line-num">44</span>
                <div className="code-text pl-4">
                  depth: <span className="type-name">number</span> = <span className="num">2</span>
                </div>
              </div>

              <div className="code-line">
                <span className="line-num">45</span>
                <div className="code-text">
                  ): <span className="kw">Promise</span>&lt;<span className="type-name">GraphEdge</span>[]&gt; {'{'}
                </div>
              </div>

              <div className="code-line">
                <span className="line-num">46</span>
                <div className="code-text pl-4">
                  <span className="kw">const</span> neighbors = <span className="kw">await this</span>.resolveSymbolDependencies(node);
                </div>
              </div>

              <div className="code-line code-line-highlight">
                <span className="line-num text-primary font-bold">47</span>
                <div className="code-text pl-4 text-on-surface">
                  <span className="kw">const</span> outboundEdges = neighbors.map(dep =&gt; <span className="fn-name">dep.asEdgeRecord</span>(depth));
                </div>
              </div>

              <div className="code-line">
                <span className="line-num">48</span>
                <div className="code-text pl-4">
                  <span className="kw">return</span> this.applySpectralRank(outboundEdges);
                </div>
              </div>

              <div className="code-line">
                <span className="line-num">49</span>
                <div className="code-text">{'}'}</div>
              </div>

              <div className="omission-line">
                <span className="line-num">...</span>
                <span className="omission-text">··· [69 lines: spectral heuristics & caching omitted] ···</span>
              </div>
            </div>
          </section>

          {/* Scope Card 2: Exported Function Definition */}
          <section className="scope-card">
            <div className="scope-card-header">
              <div className="card-header-left">
                <span className="badge-func">Function</span>
                <span className="font-code font-semibold text-on-surface">
                  resolveSymbolDependencies(sym: SymbolNode): EdgeRecord[]
                </span>
              </div>
              <div className="card-header-right font-code text-xs">
                <span className="text-outline">lines 122-184</span>
                <span className="community-tag">Community #0: Parser Core</span>
              </div>
            </div>

            <div className="func-details-row">
              <div className="func-desc">
                <span>Returns resolved semantic references in deterministic topological order.</span>
                <div className="func-metrics">
                  <span className="mini-badge">ASTNode Resolution: O(1)</span>
                  <span className="mini-badge text-tertiary">Pure Function</span>
                  <span className="mini-badge text-outline">3 inbound calls</span>
                </div>
              </div>
              <button
                className="btn-snippet-expand"
                onClick={() => setSelectedSymbol('resolveSymbolDependencies')}
              >
                Focus Symbol
              </button>
            </div>
          </section>

          {/* Scope Card 3: Interface Definition */}
          <section className="scope-card">
            <div className="scope-card-header">
              <div className="card-header-left">
                <span className="badge-interface">Interface</span>
                <span className="font-code font-semibold text-on-surface">VisitorConfig</span>
                <span className="text-outline font-code text-xs">lines 8-22 (4 fields)</span>
              </div>
              <span className="text-outline font-code text-xs">AST Traversal Options</span>
            </div>

            <div className="interface-fields-grid">
              <div className="field-card">
                <span className="field-name font-code">maxDepth: number</span>
                <span className="field-default">default: 3</span>
              </div>
              <div className="field-card">
                <span className="field-name font-code">ignoreComments: boolean</span>
                <span className="field-default">default: true</span>
              </div>
              <div className="field-card">
                <span className="field-name font-code">collectTelemetry: boolean</span>
                <span className="field-default">default: false</span>
              </div>
              <div className="field-card">
                <span className="field-name font-code">clusterSeed?: string</span>
                <span className="field-default">optional</span>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* 3. RIGHT INSPECTOR PANEL: Symbol Context & Call Graph Metadata */}
      <aside className="explore-right-panel">
        <div className="panel-header">
          <span className="panel-title font-semibold">Symbol Context & Metadata</span>
          <span className="kind-badge">METHOD</span>
        </div>

        <div className="panel-scrollable">
          {/* Active Focus Symbol */}
          <div className="focus-symbol-box">
            <span className="box-label">Active Focus Symbol</span>
            <div className="focus-name-card">
              <span className="focus-sym-title font-semibold">{selectedSymbol}</span>
              <span className="focus-sym-sig font-code text-xs text-outline">
                (node: ASTNode, depth: number = 2): Promise&lt;GraphEdge[]&gt;
              </span>
            </div>
          </div>

          {/* Semantic Intent */}
          <div className="section-card">
            <span className="box-label">Semantic Intent</span>
            <p className="intent-text">
              Traverses outgoing AST edge references up to depth hops and computes neighborhood degree
              weights for semantic ranking in downstream evidence retrieval.
            </p>
          </div>

          {/* Louvain Community Card */}
          <div className="community-box">
            <div className="flex-between">
              <span className="box-label">Louvain Community</span>
              <span className="text-secondary font-code text-xs font-semibold">Q = 0.82</span>
            </div>
            <div className="comm-inner-card">
              <div className="comm-title-wrap">
                <span className="dot dot-cyan" />
                <span className="comm-inner-title font-semibold">#0 Parser Core & AST</span>
              </div>
              <div className="flex-between font-code text-xs text-outline pt-1">
                <span>Cohesion: 48 symbols</span>
                <span>Centrality: High (0.92)</span>
              </div>
            </div>
          </div>

          {/* Inbound Callers */}
          <div className="callers-section">
            <div className="flex-between">
              <span className="box-label">Callers (Inbound 4)</span>
              <span className="font-code text-xs text-outline">Ranked</span>
            </div>
            <div className="caller-rows">
              <div
                className="caller-row"
                onClick={() => setSelectedSymbol('executeGraphQuery')}
              >
                <div className="caller-main">
                  <span className="material-symbols-outlined text-xs text-primary">call_received</span>
                  <span className="font-code text-xs font-semibold text-primary truncate">
                    executeGraphQuery
                  </span>
                </div>
                <span className="caller-loc font-code">graph.py:89</span>
              </div>

              <div
                className="caller-row"
                onClick={() => setSelectedSymbol('retrieveContextSlice')}
              >
                <div className="caller-main">
                  <span className="material-symbols-outlined text-xs text-primary">call_received</span>
                  <span className="font-code text-xs font-semibold text-primary truncate">
                    retrieveContextSlice
                  </span>
                </div>
                <span className="caller-loc font-code">retrieval.py:142</span>
              </div>
            </div>
          </div>

          {/* Outbound Callees */}
          <div className="callers-section">
            <div className="flex-between">
              <span className="box-label">Callees (Outbound 3)</span>
              <span className="font-code text-xs text-outline">Ranked</span>
            </div>
            <div className="caller-rows">
              <div className="caller-row">
                <div className="caller-main">
                  <span className="material-symbols-outlined text-xs text-secondary">call_made</span>
                  <span className="font-code text-xs font-semibold text-secondary truncate">
                    resolveSymbolDependencies
                  </span>
                </div>
                <span className="caller-loc font-code">ast_visitor.ts:122</span>
              </div>
              <div className="caller-row">
                <div className="caller-main">
                  <span className="material-symbols-outlined text-xs text-secondary">call_made</span>
                  <span className="font-code text-xs font-semibold text-secondary truncate">
                    applySpectralRank
                  </span>
                </div>
                <span className="caller-loc font-code">ast_visitor.ts:210</span>
              </div>
            </div>
          </div>

          {/* Action Trigger */}
          <div className="pt-2">
            <button className="btn-action btn-action-copy w-full" onClick={handleCopyEvidence}>
              <span className="material-symbols-outlined text-sm">content_copy</span>
              <span>{copiedEvidence ? 'Copied Bundle!' : 'Copy Evidence Window (185 tok)'}</span>
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
