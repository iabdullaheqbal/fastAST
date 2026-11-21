import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { fastAstApi } from '../../services/api';
import type { EvidenceBundle, EvidenceCandidate } from '../../types';

export const EvidencePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const qParam = searchParams.get('q') || '';

  const [query, setQuery] = useState<string>(qParam || 'retrieve_context');
  const [maxTokens, setMaxTokens] = useState<number>(2048);
  const [rankingMethod, setRankingMethod] = useState<
    'hybrid' | 'rrf' | 'bm25' | 'semantic' | 'heuristic'
  >('hybrid');

  const [bundle, setBundle] = useState<EvidenceBundle | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<EvidenceCandidate | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const executeSearch = useCallback(
    async (q: string, tok = maxTokens, rank = rankingMethod) => {
      if (!q.trim()) {
        setBundle({
          query: '',
          ranking_method: rank,
          total_tokens_estimate: 0,
          max_tokens: tok,
          candidates: [],
          snippets: [],
        });
        setSelectedCandidate(null);
        return;
      }

      setIsLoading(true);
      setApiError(null);
      try {
        const data = await fastAstApi.getEvidence(q.trim(), tok, rank);
        setBundle(data);
        if (data.candidates && data.candidates.length > 0) {
          setSelectedCandidate(data.candidates[0]);
        } else {
          setSelectedCandidate(null);
        }
      } catch (err: any) {
        setApiError(err?.message || 'Failed to retrieve evidence bundle.');
        setBundle(null);
      } finally {
        setIsLoading(false);
      }
    },
    [maxTokens, rankingMethod]
  );

  useEffect(() => {
    const initialQ = qParam || query;
    if (qParam && qParam !== query) {
      setQuery(qParam);
    }
    executeSearch(initialQ, maxTokens, rankingMethod);
  }, [qParam, maxTokens, rankingMethod]);

  const handleSearchSubmit = () => {
    setSearchParams(query.trim() ? { q: query.trim() } : {});
    executeSearch(query, maxTokens, rankingMethod);
  };

  const handleCopyBundle = () => {
    if (!bundle) return;
    navigator.clipboard.writeText(JSON.stringify(bundle, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tokenUsage = bundle?.total_tokens_estimate ?? 0;
  const tokenPercent = Math.min(100, Math.round((tokenUsage / maxTokens) * 100));

  // Snippets to display: if a candidate is selected and has a matching snippet, put it first
  const orderedSnippets = React.useMemo(() => {
    if (!bundle?.snippets) return [];
    if (!selectedCandidate) return bundle.snippets;
    const match = bundle.snippets.filter((s) => s.symbol_name === selectedCandidate.name);
    const rest = bundle.snippets.filter((s) => s.symbol_name !== selectedCandidate.name);
    return [...match, ...rest];
  }, [bundle, selectedCandidate]);

  return (
    <div className="evidence-page">
      {/* Top Query & Controls Bar */}
      <div className="evidence-header">
        <div className="search-row">
          <div className="search-input-group">
            <span className="material-symbols-outlined search-icon">manage_search</span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit()}
              placeholder="Query symbol name or concept (e.g. 'index_repository', 'Louvain community detection')..."
              className="evidence-search-input font-code"
            />
            {query && (
              <button
                className="clear-btn"
                onClick={() => {
                  setQuery('');
                  executeSearch('', maxTokens, rankingMethod);
                }}
              >
                ×
              </button>
            )}
          </div>
          <button
            className="btn-retrieve"
            onClick={handleSearchSubmit}
            disabled={isLoading}
          >
            <span className={`material-symbols-outlined text-sm ${isLoading ? 'spin-icon' : ''}`}>
              {isLoading ? 'sync' : 'bolt'}
            </span>
            <span>{isLoading ? 'Retrieving...' : 'Retrieve Evidence'}</span>
          </button>
        </div>

        {/* Ranking Mode & Token Budget Controls */}
        <div className="controls-row">
          <div className="ranking-selector">
            <span className="ctrl-label">Ranking:</span>
            {(['hybrid', 'rrf', 'bm25', 'semantic', 'heuristic'] as const).map((m) => (
              <button
                key={m}
                className={`mode-btn ${rankingMethod === m ? 'mode-btn-active' : ''}`}
                onClick={() => setRankingMethod(m)}
              >
                {m.toUpperCase()}
              </button>
            ))}
          </div>

          <div className="token-meter-wrap">
            <span className="ctrl-label">Token Budget:</span>
            <select
              value={maxTokens}
              onChange={(e) => setMaxTokens(Number(e.target.value))}
              className="budget-select font-code"
            >
              <option value={1024}>1,024 tokens</option>
              <option value={2048}>2,048 tokens</option>
              <option value={4096}>4,096 tokens</option>
            </select>
            <div className="token-meter-bar">
              <div
                className="token-meter-fill"
                style={{ width: `${tokenPercent}%` }}
              />
            </div>
            <span className="token-meter-text font-code">
              {tokenUsage.toLocaleString()} / {maxTokens.toLocaleString()} tok ({tokenPercent}%)
            </span>
          </div>

          <button
            className="btn-copy-bundle font-code"
            onClick={handleCopyBundle}
            disabled={!bundle || bundle.candidates.length === 0}
          >
            <span className="material-symbols-outlined text-sm">content_copy</span>
            <span>{copied ? 'Copied JSON!' : 'Copy JSON Bundle'}</span>
          </button>
        </div>
      </div>

      {/* Results Workspace */}
      <div className="evidence-body">
        {apiError && (
          <div className="mb-3">
            <div className="api-error-banner">
              <div>
                <strong>Evidence Query Error:</strong> {apiError}
              </div>
              <button className="api-retry-btn" onClick={handleSearchSubmit}>
                Retry
              </button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="state-box font-code">
            <span className="material-symbols-outlined spin-icon text-2xl text-primary">
              sync
            </span>
            <span>Ranking symbols and extracting token-bounded AST snippets...</span>
          </div>
        ) : !query.trim() ? (
          <div className="state-box font-code">
            <span className="material-symbols-outlined text-2xl text-outline">search</span>
            <span>Enter a symbol or natural-language query above to retrieve bounded evidence.</span>
          </div>
        ) : bundle && bundle.candidates.length === 0 ? (
          <div className="state-box font-code">
            <span className="material-symbols-outlined text-2xl text-outline">search_off</span>
            <span>No matching symbols or evidence found for "{bundle.query}".</span>
          </div>
        ) : bundle ? (
          <div className="evidence-grid">
            {/* Left Column: Ranked Candidates */}
            <div className="candidates-col">
              <div className="col-header font-code">
                <span>Ranked Candidates ({bundle.candidates.length})</span>
                <span className="text-primary">{bundle.ranking_method.toUpperCase()}</span>
              </div>

              <div className="candidates-scroll">
                {bundle.candidates.map((cand, idx) => {
                  const isSelected =
                    selectedCandidate?.name === cand.name &&
                    selectedCandidate?.file_path === cand.file_path;
                  return (
                    <div
                      key={`${cand.name}-${cand.file_path}-${idx}`}
                      className={`cand-card ${isSelected ? 'cand-card-selected' : ''}`}
                      onClick={() => setSelectedCandidate(cand)}
                    >
                      <div className="cand-row-top font-code">
                        <span className="cand-rank">#{idx + 1}</span>
                        <span className="cand-kind">{cand.kind}</span>
                        <span className="cand-name truncate">{cand.name}</span>
                        <span className="cand-score">{cand.score.toFixed(3)}</span>
                      </div>

                      <div className="cand-row-file font-code">
                        <span className="truncate">{cand.file_path}</span>
                        <span>
                          L{cand.start_line}–{cand.end_line}
                        </span>
                      </div>

                      {/* Ranking Reasons */}
                      {cand.reasons && cand.reasons.length > 0 && (
                        <div className="reasons-row font-code">
                          {cand.reasons.slice(0, 4).map((r, ri) => (
                            <span key={ri} className="reason-tag">
                              {r}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Quick Actions on Selected Candidate */}
                      {isSelected && (
                        <div className="cand-actions">
                          <button
                            className="mini-act-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(
                                `/explore?file=${encodeURIComponent(
                                  cand.file_path
                                )}&symbol=${encodeURIComponent(cand.name)}`
                              );
                            }}
                          >
                            Explore
                          </button>
                          <button
                            className="mini-act-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/globe?symbol=${encodeURIComponent(cand.name)}`);
                            }}
                          >
                            Focus in Globe
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Selected Candidate Details + Bounded Snippets */}
            <div className="snippets-col">
              {/* Selected Candidate Inspector Banner */}
              {selectedCandidate && (
                <div className="selected-cand-banner font-code">
                  <div className="sel-banner-top">
                    <div>
                      <span className="text-primary font-bold text-sm">
                        {selectedCandidate.name}
                      </span>{' '}
                      <span className="text-outline text-xs">
                        ({selectedCandidate.file_path}:L{selectedCandidate.start_line}–
                        {selectedCandidate.end_line})
                      </span>
                    </div>
                    <span className="text-tertiary text-xs">
                      Score: {selectedCandidate.score.toFixed(3)}
                    </span>
                  </div>

                  {selectedCandidate.reasons && selectedCandidate.reasons.length > 0 && (
                    <div className="sel-banner-sub">
                      <span className="text-outline">Ranking Signals: </span>
                      {selectedCandidate.reasons.join(' • ')}
                    </div>
                  )}

                  {selectedCandidate.neighbors && selectedCandidate.neighbors.length > 0 && (
                    <div className="sel-banner-sub">
                      <span className="text-outline">Graph Neighbors: </span>
                      {selectedCandidate.neighbors
                        .slice(0, 6)
                        .map((n) => `${n.name || n.symbol} (${n.relation || 'calls'})`)
                        .join(', ')}
                    </div>
                  )}
                </div>
              )}

              <div className="col-header font-code">
                <span>Bounded Evidence Windows ({orderedSnippets.length})</span>
                <span className="text-tertiary">
                  Total ~{tokenUsage.toLocaleString()} tokens
                </span>
              </div>

              <div className="snippets-scroll">
                {orderedSnippets.map((snip, idx) => {
                  const isHighlighted = selectedCandidate?.name === snip.symbol_name;
                  return (
                    <div
                      key={`${snip.symbol_name}-${idx}`}
                      className={`snippet-card ${
                        isHighlighted ? 'snippet-card-highlighted' : ''
                      }`}
                    >
                      <div className="snippet-header font-code">
                        <div className="snippet-meta">
                          <span className="text-primary font-bold">{snip.symbol_name}</span>
                          <span className="text-outline text-xs">
                            {snip.file_path} [L{snip.start_line}–{snip.end_line}]
                          </span>
                        </div>
                        <div className="snippet-right">
                          <span className="token-badge">~{snip.token_count} tok</span>
                          <button
                            className="mini-act-btn"
                            onClick={() =>
                              navigate(
                                `/explore?file=${encodeURIComponent(
                                  snip.file_path
                                )}&symbol=${encodeURIComponent(snip.symbol_name)}`
                              )
                            }
                          >
                            Open File
                          </button>
                        </div>
                      </div>

                      {snip.reasons && snip.reasons.length > 0 && (
                        <div className="snippet-reasons font-code">
                          Signals: {snip.reasons.join(' · ')}
                        </div>
                      )}

                      <pre className="snippet-code font-code">{snip.snippet}</pre>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <style>{`
        .evidence-page {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          background: var(--surface-lowest);
          overflow: hidden;
        }
        .evidence-header {
          padding: 12px 18px;
          background: var(--surface);
          border-bottom: 1px solid var(--hairline);
          display: flex;
          flex-direction: column;
          gap: 10px;
          flex-shrink: 0;
        }
        .search-row {
          display: flex;
          gap: 10px;
        }
        .search-input-group {
          flex: 1;
          display: flex;
          align-items: center;
          background: var(--surface-lowest);
          border: 1px solid var(--hairline);
          border-radius: 5px;
          padding: 0 10px;
          height: 36px;
        }
        .search-input-group:focus-within {
          border-color: var(--primary);
        }
        .search-icon {
          color: var(--primary);
          margin-right: 8px;
        }
        .evidence-search-input {
          flex: 1;
          background: transparent;
          border: none;
          color: var(--on-surface);
          font-size: 12.5px;
          outline: none;
        }
        .clear-btn {
          background: transparent;
          border: none;
          color: var(--outline);
          font-size: 16px;
          cursor: pointer;
        }
        .btn-retrieve {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 0 16px;
          height: 36px;
          background: var(--primary);
          color: var(--on-primary);
          border: none;
          border-radius: 5px;
          font-weight: 700;
          font-size: 12px;
          cursor: pointer;
        }
        .btn-retrieve:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .controls-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }
        .ctrl-label {
          font-family: var(--font-mono);
          font-size: 10px;
          text-transform: uppercase;
          color: var(--outline);
        }
        .ranking-selector {
          display: flex;
          align-items: center;
          gap: 5px;
        }
        .mode-btn {
          background: var(--surface-low);
          border: 1px solid var(--hairline);
          color: var(--on-surface-variant);
          font-family: var(--font-mono);
          font-size: 10.5px;
          padding: 3px 8px;
          border-radius: 4px;
          cursor: pointer;
        }
        .mode-btn-active {
          background: var(--primary-container);
          border-color: var(--primary);
          color: var(--primary);
          font-weight: 700;
        }
        .token-meter-wrap {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .budget-select {
          background: var(--surface-lowest);
          color: var(--on-surface);
          border: 1px solid var(--hairline);
          border-radius: 4px;
          padding: 3px 8px;
          font-size: 11px;
        }
        .token-meter-bar {
          width: 110px;
          height: 6px;
          background: var(--surface-low);
          border-radius: 3px;
          overflow: hidden;
        }
        .token-meter-fill {
          height: 100%;
          background: var(--tertiary);
          transition: width 0.25s;
        }
        .token-meter-text {
          font-size: 11px;
          color: var(--tertiary-light);
        }
        .btn-copy-bundle {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          background: var(--surface-container);
          border: 1px solid var(--hairline);
          border-radius: 4px;
          color: var(--on-surface);
          font-size: 11px;
          cursor: pointer;
        }
        .btn-copy-bundle:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .evidence-body {
          flex: 1;
          overflow: hidden;
          padding: 14px 18px;
          display: flex;
          flex-direction: column;
        }
        .state-box {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
          color: var(--outline);
          font-size: 12.5px;
        }
        .evidence-grid {
          flex: 1;
          display: grid;
          grid-template-columns: 370px 1fr;
          gap: 16px;
          min-height: 0;
        }
        .candidates-col, .snippets-col {
          display: flex;
          flex-direction: column;
          gap: 8px;
          min-height: 0;
        }
        .col-header {
          display: flex;
          justify-content: space-between;
          font-size: 10.5px;
          text-transform: uppercase;
          color: var(--outline);
          font-weight: 700;
        }
        .candidates-scroll, .snippets-scroll {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding-right: 4px;
        }
        .cand-card {
          background: var(--surface);
          border: 1px solid var(--hairline);
          border-radius: 6px;
          padding: 10px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          cursor: pointer;
        }
        .cand-card:hover {
          background: var(--surface-container);
        }
        .cand-card-selected {
          border-color: var(--primary);
          background: var(--surface-container);
          box-shadow: inset 2px 0 0 0 var(--primary);
        }
        .cand-row-top {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
        }
        .cand-rank {
          color: var(--outline);
          font-size: 10.5px;
        }
        .cand-kind {
          background: var(--surface-high);
          color: var(--on-surface-variant);
          font-size: 9.5px;
          padding: 1px 5px;
          border-radius: 3px;
          text-transform: uppercase;
        }
        .cand-name {
          flex: 1;
          font-weight: 700;
          color: var(--primary);
        }
        .cand-score {
          color: var(--tertiary-light);
          font-size: 11px;
        }
        .cand-row-file {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          color: var(--outline);
        }
        .reasons-row {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
        }
        .reason-tag {
          font-size: 9.5px;
          background: var(--surface-low);
          border: 1px solid var(--hairline);
          color: var(--on-surface-variant);
          padding: 1px 5px;
          border-radius: 3px;
        }
        .cand-actions {
          display: flex;
          gap: 6px;
          padding-top: 4px;
        }
        .mini-act-btn {
          background: var(--surface-high);
          border: 1px solid var(--hairline);
          color: var(--on-surface);
          font-family: var(--font-mono);
          font-size: 10px;
          padding: 2px 7px;
          border-radius: 3px;
          cursor: pointer;
        }
        .mini-act-btn:hover {
          border-color: var(--primary);
          color: var(--primary);
        }

        .selected-cand-banner {
          background: var(--surface);
          border: 1px solid var(--hairline);
          border-radius: 6px;
          padding: 10px 12px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          flex-shrink: 0;
        }
        .sel-banner-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .sel-banner-sub {
          font-size: 11px;
          color: var(--on-surface-variant);
        }

        .snippet-card {
          background: var(--surface);
          border: 1px solid var(--hairline);
          border-radius: 6px;
          overflow: hidden;
          flex-shrink: 0;
        }
        .snippet-card-highlighted {
          border-color: var(--primary);
        }
        .snippet-header {
          padding: 8px 12px;
          background: var(--surface-low);
          border-bottom: 1px solid var(--hairline);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }
        .snippet-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
        }
        .snippet-right {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .token-badge {
          font-size: 10px;
          color: var(--tertiary-light);
          background: rgba(16, 185, 129, 0.14);
          padding: 2px 6px;
          border-radius: 3px;
        }
        .snippet-reasons {
          padding: 4px 12px;
          background: var(--surface-container);
          border-bottom: 1px solid var(--hairline);
          font-size: 10.5px;
          color: var(--outline);
        }
        .snippet-code {
          margin: 0;
          padding: 12px;
          background: var(--surface-lowest);
          font-size: 12px;
          line-height: 1.5;
          color: var(--on-surface);
          overflow-x: auto;
        }
      `}</style>
    </div>
  );
};
