import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { fastAstApi } from '../../services/api';
import type {
  CallGraphEntry,
  FileRecord,
  SimilarSymbol,
  SymbolRecord,
} from '../../types';
import './ExplorePage.css';

export const ExplorePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const navState = location.state as { symbolName?: string; filePath?: string } | null;

  const initialFile = searchParams.get('file') || navState?.filePath || '';
  const initialSymbol = searchParams.get('symbol') || navState?.symbolName || '';

  const [files, setFiles] = useState<FileRecord[]>([]);
  const [selectedFile, setSelectedFile] = useState<string>(initialFile);
  const [outlineSymbols, setOutlineSymbols] = useState<SymbolRecord[]>([]);
  const [selectedSymbolName, setSelectedSymbolName] = useState<string>(initialSymbol);

  const [fileFilter, setFileFilter] = useState<string>('');
  const [symbolFilter, setSymbolFilter] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'snippet' | 'outline' | 'calls'>('snippet');

  const [snippetData, setSnippetData] = useState<{
    content: string;
    file_path: string;
    start_line: number;
    end_line: number;
    tokens?: number;
  } | null>(null);

  const [callGraph, setCallGraph] = useState<{
    callers: CallGraphEntry[];
    callees: CallGraphEntry[];
  }>({ callers: [], callees: [] });
  const [similarSymbols, setSimilarSymbols] = useState<SimilarSymbol[]>([]);

  const [isLoadingFiles, setIsLoadingFiles] = useState<boolean>(true);
  const [isLoadingOutline, setIsLoadingOutline] = useState<boolean>(false);
  const [isLoadingSnippet, setIsLoadingSnippet] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // 1. Load repository file list
  const loadFiles = async () => {
    setIsLoadingFiles(true);
    setApiError(null);
    try {
      const list = await fastAstApi.getFiles();
      setFiles(list);

      // If a symbol was passed without a file, resolve its file first
      if (!selectedFile && initialSymbol) {
        const matches = await fastAstApi.searchSymbols(initialSymbol, undefined, undefined, 5);
        const exact = matches.find((m) => m.name === initialSymbol) || matches[0];
        if (exact?.file_path) {
          setSelectedFile(exact.file_path);
          return;
        }
      }

      if (!selectedFile && list.length > 0) {
        const defaultSource =
          list.find((f) => f.path === 'python/fastast/retrieval.py') ||
          list.find((f) => f.category === 'source' && (f.symbol_count ?? 0) > 0) ||
          list[0];
        setSelectedFile(defaultSource.path);
      }
    } catch (err: any) {
      setApiError(err?.message || 'Failed to load repository files from /api/files.');
    } finally {
      setIsLoadingFiles(false);
    }
  };

  useEffect(() => {
    loadFiles();
  }, []);

  // Sync URL search params when navigated to
  useEffect(() => {
    const fParam = searchParams.get('file');
    const sParam = searchParams.get('symbol');
    if (fParam && fParam !== selectedFile) {
      setSelectedFile(fParam);
    }
    if (sParam && sParam !== selectedSymbolName) {
      setSelectedSymbolName(sParam);
    }
  }, [searchParams]);

  // 2. When selectedFile changes, load its AST outline
  useEffect(() => {
    if (!selectedFile) return;
    let cancelled = false;
    setIsLoadingOutline(true);

    fastAstApi
      .getOutline(selectedFile)
      .then((outline) => {
        if (cancelled) return;
        setOutlineSymbols(outline);
        setIsLoadingOutline(false);

        if (outline.length > 0) {
          // Preserve selectedSymbolName if it exists in this file's outline
          const matchingSym = outline.find((s) => s.name === selectedSymbolName);
          if (!matchingSym) {
            setSelectedSymbolName(outline[0].name);
          }
        } else {
          setSelectedSymbolName('');
          // Load file snippet lines 1..60 when file has no AST symbols
          fastAstApi
            .getSnippet(undefined, selectedFile, 1, 60)
            .then((snip) => {
              if (!cancelled) setSnippetData(snip);
            })
            .catch(() => {});
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setApiError(err?.message || 'Failed to load file outline.');
          setIsLoadingOutline(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedFile]);

  // 3. When selectedSymbolName changes, load bounded snippet, call graph, and similar symbols
  useEffect(() => {
    if (!selectedSymbolName) return;
    let cancelled = false;
    setIsLoadingSnippet(true);

    Promise.all([
      fastAstApi.getSnippet(selectedSymbolName, selectedFile || undefined).catch(() => null),
      fastAstApi.getCallGraph(selectedSymbolName).catch(() => ({
        symbol: selectedSymbolName,
        callers: [],
        callees: [],
      })),
      fastAstApi.getSimilarSymbols(selectedSymbolName, 6).catch(() => []),
    ]).then(([snip, cg, sims]) => {
      if (cancelled) return;
      setSnippetData(snip);
      setCallGraph({ callers: cg.callers || [], callees: cg.callees || [] });
      setSimilarSymbols(sims || []);
      setIsLoadingSnippet(false);
    });

    return () => {
      cancelled = true;
    };
  }, [selectedSymbolName, selectedFile]);

  const activeSymbolObj: SymbolRecord | undefined = useMemo(
    () => outlineSymbols.find((s) => s.name === selectedSymbolName) || outlineSymbols[0],
    [outlineSymbols, selectedSymbolName]
  );

  const filteredFiles = useMemo(() => {
    const q = fileFilter.trim().toLowerCase();
    if (!q) return files;
    return files.filter(
      (f) => f.path.toLowerCase().includes(q) || f.language.toLowerCase().includes(q)
    );
  }, [files, fileFilter]);

  const filteredOutline = useMemo(() => {
    const q = symbolFilter.trim().toLowerCase();
    if (!q) return outlineSymbols;
    return outlineSymbols.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.kind.toLowerCase().includes(q) ||
        (s.signature || '').toLowerCase().includes(q)
    );
  }, [outlineSymbols, symbolFilter]);

  const snippetLines = useMemo(() => {
    if (!snippetData?.content) return [];
    return snippetData.content.split('\n');
  }, [snippetData]);

  const handleSelectFile = (path: string) => {
    setSelectedFile(path);
    setSearchParams({ file: path });
  };

  const handleSelectSymbol = (symName: string, filePath?: string) => {
    if (filePath && filePath !== selectedFile) {
      setSelectedFile(filePath);
      setSelectedSymbolName(symName);
      setSearchParams({ file: filePath, symbol: symName });
    } else {
      setSelectedSymbolName(symName);
      setSearchParams({ file: selectedFile, symbol: symName });
    }
  };

  return (
    <div className="explore-layout">
      {/* 1. LEFT PANEL: Repository File Tree & AST Outline */}
      <aside className="explore-left">
        {/* Files List Section */}
        <div className="subpanel files-subpanel">
          <div className="subpanel-header">
            <span className="material-symbols-outlined text-primary text-sm">folder_open</span>
            <span className="subpanel-title">Indexed Files ({filteredFiles.length})</span>
          </div>
          <div className="filter-box">
            <input
              type="text"
              value={fileFilter}
              onChange={(e) => setFileFilter(e.target.value)}
              placeholder="Filter files by path or language..."
              className="filter-input font-code"
            />
          </div>
          <div className="subpanel-list font-code">
            {isLoadingFiles ? (
              <div className="empty-msg">Loading files...</div>
            ) : filteredFiles.length > 0 ? (
              filteredFiles.map((f) => {
                const isSelected = f.path === selectedFile;
                return (
                  <div
                    key={f.path}
                    className={`tree-row ${isSelected ? 'tree-row-active' : ''}`}
                    onClick={() => handleSelectFile(f.path)}
                    title={`${f.path} (${f.language}, ${f.lines} lines)`}
                  >
                    <span className="tree-path truncate">{f.path}</span>
                    <span className="tree-meta">
                      {f.symbol_count !== undefined && f.symbol_count > 0
                        ? `${f.symbol_count} sym`
                        : `${f.lines}L`}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="empty-msg">No matching files</div>
            )}
          </div>
        </div>

        {/* File AST Symbols Section */}
        <div className="subpanel outline-subpanel">
          <div className="subpanel-header">
            <span className="material-symbols-outlined text-secondary text-sm">data_object</span>
            <span className="subpanel-title">
              File Symbols ({filteredOutline.length})
            </span>
          </div>
          <div className="filter-box">
            <input
              type="text"
              value={symbolFilter}
              onChange={(e) => setSymbolFilter(e.target.value)}
              placeholder="Filter symbols in file..."
              className="filter-input font-code"
            />
          </div>
          <div className="subpanel-list font-code">
            {isLoadingOutline ? (
              <div className="empty-msg">Loading AST outline...</div>
            ) : filteredOutline.length > 0 ? (
              filteredOutline.map((sym) => {
                const isSelected = sym.name === selectedSymbolName;
                return (
                  <div
                    key={`${sym.id}-${sym.start_line}`}
                    className={`tree-row ${isSelected ? 'tree-row-active' : ''}`}
                    onClick={() => handleSelectSymbol(sym.name)}
                  >
                    <div className="sym-row-left">
                      <span className={`sym-kind-tag kind-${sym.kind.toLowerCase()}`}>
                        {sym.kind.slice(0, 3).toUpperCase()}
                      </span>
                      <span className="tree-path truncate">{sym.name}</span>
                    </div>
                    <span className="tree-meta">
                      L{sym.start_line}–{sym.end_line}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="empty-msg">No AST symbols extracted in this file</div>
            )}
          </div>
        </div>
      </aside>

      {/* 2. CENTER WORKSPACE: Bounded Snippet / AST Outline / Call Neighborhood */}
      <main className="explore-center">
        {/* Top File & Mode Bar */}
        <div className="center-toolbar">
          <div className="breadcrumb font-code">
            <span className="material-symbols-outlined text-primary text-sm">description</span>
            <span className="text-on-surface font-semibold">{selectedFile || 'Select a file'}</span>
            {selectedSymbolName && (
              <>
                <span className="text-outline">/</span>
                <span className="text-primary font-bold">{selectedSymbolName}</span>
              </>
            )}
          </div>

          <div className="view-tabs">
            <button
              className={`tab-btn ${activeTab === 'snippet' ? 'tab-btn-active' : ''}`}
              onClick={() => setActiveTab('snippet')}
            >
              Bounded Snippet
            </button>
            <button
              className={`tab-btn ${activeTab === 'outline' ? 'tab-btn-active' : ''}`}
              onClick={() => setActiveTab('outline')}
            >
              AST Outline ({outlineSymbols.length})
            </button>
            <button
              className={`tab-btn ${activeTab === 'calls' ? 'tab-btn-active' : ''}`}
              onClick={() => setActiveTab('calls')}
            >
              Call Neighborhood ({callGraph.callers.length + callGraph.callees.length})
            </button>
          </div>

          <div className="toolbar-actions">
            {selectedSymbolName && (
              <>
                <button
                  className="act-btn act-btn-secondary"
                  onClick={() =>
                    navigate(`/evidence?q=${encodeURIComponent(selectedSymbolName)}`)
                  }
                >
                  <span className="material-symbols-outlined text-xs">manage_search</span>
                  <span>Evidence</span>
                </button>
                <button
                  className="act-btn act-btn-primary"
                  onClick={() =>
                    navigate(`/globe?symbol=${encodeURIComponent(selectedSymbolName)}`)
                  }
                >
                  <span className="material-symbols-outlined text-xs">public</span>
                  <span>Focus in Globe</span>
                </button>
              </>
            )}
          </div>
        </div>

        {apiError && (
          <div className="p-3">
            <div className="api-error-banner">
              <div>{apiError}</div>
              <button className="api-retry-btn" onClick={loadFiles}>
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Tab 1: Bounded Snippet View */}
        {activeTab === 'snippet' && (
          <div className="code-viewer-wrap">
            <div className="code-meta-bar font-code">
              <span>
                {snippetData?.file_path || selectedFile} • Lines{' '}
                {snippetData?.start_line ?? activeSymbolObj?.start_line ?? 1}–
                {snippetData?.end_line ?? activeSymbolObj?.end_line ?? 1}
              </span>
              <span className="text-tertiary">
                Bounded AST Window (~{snippetData?.tokens || Math.max(10, snippetLines.length * 7)}{' '}
                tokens)
              </span>
            </div>

            <div className="code-scroll font-code">
              {isLoadingSnippet ? (
                <div className="p-6 text-outline">Extracting bounded AST snippet...</div>
              ) : snippetLines.length > 0 ? (
                snippetLines.map((line, idx) => {
                  const lineNo = (snippetData?.start_line ?? 1) + idx;
                  return (
                    <div key={idx} className="code-line">
                      <span className="line-num">{lineNo}</span>
                      <span className="line-text">{line || ' '}</span>
                    </div>
                  );
                })
              ) : (
                <div className="p-6 text-outline">
                  Select a symbol or file to view its bounded source window.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Full File AST Outline Table */}
        {activeTab === 'outline' && (
          <div className="outline-table-wrap font-code">
            {outlineSymbols.length > 0 ? (
              <table className="ast-table">
                <thead>
                  <tr>
                    <th>Kind</th>
                    <th>Symbol</th>
                    <th>Signature</th>
                    <th>Lines</th>
                  </tr>
                </thead>
                <tbody>
                  {outlineSymbols.map((sym) => (
                    <tr
                      key={`${sym.id}-${sym.start_line}`}
                      className={sym.name === selectedSymbolName ? 'row-selected' : ''}
                      onClick={() => {
                        handleSelectSymbol(sym.name);
                        setActiveTab('snippet');
                      }}
                    >
                      <td>
                        <span className={`sym-kind-tag kind-${sym.kind.toLowerCase()}`}>
                          {sym.kind}
                        </span>
                      </td>
                      <td className="text-primary font-semibold">{sym.name}</td>
                      <td className="text-on-surface-variant truncate max-w-md">
                        {sym.signature}
                      </td>
                      <td className="text-outline">
                        L{sym.start_line}–{sym.end_line}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-6 text-outline">No AST symbols found in {selectedFile}.</div>
            )}
          </div>
        )}

        {/* Tab 3: Call Neighborhood View */}
        {activeTab === 'calls' && (
          <div className="calls-tab-wrap font-code">
            <div className="calls-col">
              <div className="calls-col-hdr">
                Inbound Callers ({callGraph.callers.length})
              </div>
              {callGraph.callers.length > 0 ? (
                callGraph.callers.map((c, i) => (
                  <div
                    key={i}
                    className="call-card"
                    onClick={() => c.caller && handleSelectSymbol(c.caller, c.file_path)}
                  >
                    <span className="text-primary font-semibold">{c.caller}</span>
                    <span className="text-outline text-xs">
                      {c.file_path}:L{c.line_number}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-outline text-xs">No inbound callers recorded</div>
              )}
            </div>

            <div className="calls-col">
              <div className="calls-col-hdr">
                Outbound Callees ({callGraph.callees.length})
              </div>
              {callGraph.callees.length > 0 ? (
                callGraph.callees.map((c, i) => (
                  <div
                    key={i}
                    className="call-card"
                    onClick={() => c.callee && handleSelectSymbol(c.callee, c.file_path)}
                  >
                    <span className="text-tertiary font-semibold">{c.callee}</span>
                    <span className="text-outline text-xs">
                      {c.file_path}:L{c.line_number}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-outline text-xs">No outbound callees recorded</div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* 3. RIGHT INSPECTOR: Symbol Details, Callers, Callees, Similar */}
      <aside className="explore-right">
        <div className="subpanel-header">
          <span className="material-symbols-outlined text-primary text-sm">info</span>
          <span className="subpanel-title">Symbol Details</span>
        </div>

        {activeSymbolObj ? (
          <div className="right-scroll">
            <div className="detail-box">
              <div className="flex justify-between items-center">
                <span className="sym-kind-tag">{activeSymbolObj.kind.toUpperCase()}</span>
                <span className="font-code text-xs text-outline">
                  L{activeSymbolObj.start_line}–{activeSymbolObj.end_line}
                </span>
              </div>
              <div className="detail-sym-name font-code">{activeSymbolObj.name}</div>
              <div className="font-code text-xs text-outline truncate">
                {activeSymbolObj.file_path || selectedFile}
              </div>
              {activeSymbolObj.signature && (
                <pre className="detail-sig font-code">{activeSymbolObj.signature}</pre>
              )}
              {activeSymbolObj.docstring && (
                <p className="detail-doc">{activeSymbolObj.docstring}</p>
              )}
            </div>

            {/* Callers */}
            <div className="detail-box">
              <div className="box-hdr font-code">
                Inbound Callers ({callGraph.callers.length})
              </div>
              {callGraph.callers.length > 0 ? (
                <div className="mini-list font-code">
                  {callGraph.callers.slice(0, 10).map((c, i) => (
                    <div
                      key={i}
                      className="mini-item"
                      onClick={() => c.caller && handleSelectSymbol(c.caller, c.file_path)}
                    >
                      <span className="text-primary truncate">{c.caller}</span>
                      <span className="text-outline text-xs">L{c.line_number}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-outline font-code">None</div>
              )}
            </div>

            {/* Callees */}
            <div className="detail-box">
              <div className="box-hdr font-code">
                Outbound Callees ({callGraph.callees.length})
              </div>
              {callGraph.callees.length > 0 ? (
                <div className="mini-list font-code">
                  {callGraph.callees.slice(0, 10).map((c, i) => (
                    <div
                      key={i}
                      className="mini-item"
                      onClick={() => c.callee && handleSelectSymbol(c.callee, c.file_path)}
                    >
                      <span className="text-tertiary truncate">{c.callee}</span>
                      <span className="text-outline text-xs">L{c.line_number}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-outline font-code">None</div>
              )}
            </div>

            {/* Similar Symbols */}
            <div className="detail-box">
              <div className="box-hdr font-code">
                Similar Symbols ({similarSymbols.length})
              </div>
              {similarSymbols.length > 0 ? (
                <div className="mini-list font-code">
                  {similarSymbols.map((s, i) => (
                    <div
                      key={i}
                      className="mini-item"
                      onClick={() => handleSelectSymbol(s.name, s.file_path)}
                    >
                      <span className="text-secondary truncate">{s.name}</span>
                      <span className="text-outline text-xs">
                        {Math.round(s.similarity * 100)}%
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-outline font-code">None detected</div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-4 text-xs text-outline font-code">
            Select a symbol to inspect metadata and relationships.
          </div>
        )}
      </aside>
    </div>
  );
};
