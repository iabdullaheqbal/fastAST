import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { fastAstApi } from '../../services/api';
import type { EvidenceBundle, EvidenceCandidate } from '../../types';
import './EvidencePage.css';

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
    </div>
  );
};
