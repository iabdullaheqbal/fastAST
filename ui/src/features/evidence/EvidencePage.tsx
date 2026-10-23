import React, { useEffect, useState } from 'react';
import { fastAstApi } from '../../services/api';
import type { EvidenceBundle } from '../../types';

export const EvidencePage: React.FC = () => {
  const [query, setQuery] = useState('traverse AST edges and compute degree centrality');
  const [maxTokens, setMaxTokens] = useState(2048);
  const [rankingMethod, setRankingMethod] = useState<'hybrid' | 'bm25' | 'semantic' | 'rrf'>('hybrid');
  const [bundle, setBundle] = useState<EvidenceBundle | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const executeSearch = (q: string) => {
    if (!q.trim()) return;
    setIsLoading(true);
    fastAstApi.getEvidence(q, maxTokens).then((data) => {
      setBundle(data);
      setIsLoading(false);
    });
  };

  useEffect(() => {
    executeSearch(query);
  }, []);

  const handleCopyBundle = () => {
    if (!bundle) return;
    navigator.clipboard.writeText(JSON.stringify(bundle, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tokenUsage = bundle?.total_tokens_estimate ?? 340;
  const tokenPercent = Math.min(100, Math.round((tokenUsage / maxTokens) * 100));

  return (
    <div className="evidence-page">
      {/* Search Header Bar */}
      <div className="evidence-header">
        <div className="search-row">
          <div className="search-input-group">
            <span className="material-symbols-outlined search-icon">find_in_page</span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && executeSearch(query)}
              placeholder="Describe concept, task, or symbol intent (e.g. 'traverse AST edges')..."
              className="evidence-search-input"
            />
          </div>
          <button
            className="btn-retrieve"
            onClick={() => executeSearch(query)}
            disabled={isLoading}
          >
            <span className="material-symbols-outlined text-sm">
              {isLoading ? 'sync' : 'psychology'}
            </span>
            <span>{isLoading ? 'Retrieving...' : 'Retrieve Evidence'}</span>
          </button>
        </div>

        {/* Controls & Token Budget Meter */}
        <div className="controls-row">
          <div className="ranking-selector">
            <span className="ctrl-label">Ranking Mode:</span>
            {(['hybrid', 'rrf', 'bm25', 'semantic'] as const).map((mode) => (
              <button
                key={mode}
                className={`mode-btn ${rankingMethod === mode ? 'mode-btn-active' : ''}`}
                onClick={() => setRankingMethod(mode)}
              >
                {mode.toUpperCase()}
              </button>
            ))}
          </div>

          <div className="token-meter-wrap">
            <span className="ctrl-label">Token Budget:</span>
            <select
              value={maxTokens}
              onChange={(e) => setMaxTokens(Number(e.target.value))}
              className="bg-surface-lowest text-on-surface font-code text-xs px-2 py-1 rounded border border-hairline"
            >
              <option value={1024}>1,024 tok</option>
              <option value={2048}>2,048 tok</option>
              <option value={4096}>4,096 tok</option>
            </select>
            <div className="token-meter-bar">
              <div
                className="token-meter-fill"
                style={{ width: `${tokenPercent}%` }}
              />
            </div>
            <span className="token-meter-text font-code">
              {tokenUsage} / {maxTokens} tokens ({tokenPercent}%)
            </span>
          </div>

          <button className="btn-copy-bundle" onClick={handleCopyBundle}>
            <span className="material-symbols-outlined text-sm">content_copy</span>
            <span>{copied ? 'Copied Bundle!' : 'Copy Evidence Bundle'}</span>
          </button>
        </div>
      </div>

      {/* Results View */}
      <div className="evidence-results-container">
        {isLoading ? (
          <div className="loading-state">
            <span className="material-symbols-outlined spin-icon text-3xl text-primary">sync</span>
            <span>Retrieving compact token-bounded evidence snippets...</span>
          </div>
        ) : (
          <div className="evidence-cards-layout">
            {/* Left: Ranked Candidates */}
            <div className="candidates-col">
              <span className="section-title">
                Ranked Candidates ({bundle?.candidates.length || 3})
              </span>

              <div className="candidate-list">
                {(bundle?.candidates.length ? bundle.candidates : [
                  {
                    name: 'traverseEdges',
                    kind: 'function',
                    file_path: 'src/parser/ast_visitor.ts',
                    score: 0.94,
                    start_line: 42,
                    end_line: 68,
                  },
                  {
                    name: 'executeGraphQuery',
                    kind: 'function',
                    file_path: 'python/fastast/graph.py',
                    score: 0.88,
                    start_line: 89,
                    end_line: 134,
                  },
                  {
                    name: 'retrieveContextSlice',
                    kind: 'function',
                    file_path: 'python/fastast/retrieval.py',
                    score: 0.82,
                    start_line: 142,
                    end_line: 198,
                  },
                ]).map((cand, idx) => (
                  <div key={idx} className="candidate-card">
                    <div className="cand-top">
                      <span className="cand-rank font-code">#{idx + 1}</span>
                      <span className="cand-name font-code font-semibold text-primary truncate">
                        {cand.name}
                      </span>
                      <span className="cand-score font-code text-tertiary">
                        Score: {cand.score ?? 0.9}
                      </span>
                    </div>
                    <div className="cand-bottom font-code text-xs text-outline">
                      <span className="cand-file truncate">{cand.file_path}</span>
                      <span>L{cand.start_line}-{cand.end_line}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Bounded Snippets */}
            <div className="snippets-col">
              <span className="section-title">
                Bounded Evidence Snippets (Token-Constrained)
              </span>

              <div className="snippets-list">
                {(bundle?.snippets.length ? bundle.snippets : [
                  {
                    symbol_name: 'traverseEdges',
                    file_path: 'src/parser/ast_visitor.ts',
                    start_line: 42,
                    end_line: 49,
                    snippet: `public async traverseEdges(node: ASTNode, depth = 2): Promise<GraphEdge[]> {\n  const neighbors = await this.resolveSymbolDependencies(node);\n  const outboundEdges = neighbors.map(dep => dep.asEdgeRecord(depth));\n  return this.applySpectralRank(outboundEdges);\n}`,
                    token_count: 85,
                  },
                  {
                    symbol_name: 'executeGraphQuery',
                    file_path: 'python/fastast/graph.py',
                    start_line: 89,
                    end_line: 96,
                    snippet: `def executeGraphQuery(symbol: str, depth: int = 2) -> GraphContext:\n  """Traverse symbol relationships up to depth hops."""\n  with get_connection() as conn:\n    return db_get_graph_neighborhood(conn, symbol, max_depth=depth)`,
                    token_count: 68,
                  },
                ]).map((snip, idx) => (
                  <div key={idx} className="snippet-card">
                    <div className="snippet-header">
                      <div className="snippet-meta">
                        <span className="snippet-sym font-code font-semibold text-primary">
                          {snip.symbol_name}
                        </span>
                        <span className="snippet-path font-code text-xs text-outline">
                          {snip.file_path} [Lines {snip.start_line}-{snip.end_line}]
                        </span>
                      </div>
                      <span className="snippet-token-tag font-code">
                        ~{snip.token_count || 75} tokens
                      </span>
                    </div>
                    <pre className="snippet-code font-code">{snip.snippet}</pre>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .evidence-page {
          width: 100%;
          height: calc(100vh - 56px);
          display: flex;
          flex-direction: column;
          background: var(--surface-lowest);
          overflow: hidden;
        }
        .evidence-header {
          padding: 16px 24px;
          background: var(--surface);
          border-bottom: 1px solid var(--hairline);
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .search-row {
          display: flex;
          gap: 12px;
        }
        .search-input-group {
          flex: 1;
          display: flex;
          align-items: center;
          background: var(--surface-lowest);
          border: 1px solid var(--hairline);
          border-radius: 6px;
          padding: 8px 12px;
        }
        .search-icon {
          color: var(--primary);
          font-size: 20px;
          margin-right: 10px;
        }
        .evidence-search-input {
          flex: 1;
          background: transparent;
          border: none;
          color: var(--on-surface);
          font-size: 13px;
          outline: none;
        }
        .btn-retrieve {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 18px;
          background: var(--primary);
          color: var(--surface-lowest);
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
        }
        .controls-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 11.5px;
        }
        .ctrl-label {
          color: var(--outline);
          font-family: var(--font-mono);
          text-transform: uppercase;
          font-size: 10px;
        }
        .ranking-selector {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .mode-btn {
          background: var(--surface-container);
          border: 1px solid var(--hairline);
          color: var(--outline);
          padding: 3px 8px;
          border-radius: 4px;
          font-family: var(--font-mono);
          font-size: 10px;
          cursor: pointer;
        }
        .mode-btn-active {
          background: var(--surface-high);
          color: var(--primary);
          border-color: var(--primary);
          font-weight: 600;
        }
        .token-meter-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .token-meter-bar {
          width: 140px;
          height: 6px;
          border-radius: 3px;
          background: var(--surface-container);
          overflow: hidden;
        }
        .token-meter-fill {
          height: 100%;
          background: var(--tertiary-light);
          border-radius: 3px;
          transition: width 0.3s;
        }
        .token-meter-text {
          font-size: 11px;
          color: var(--tertiary-light);
        }
        .btn-copy-bundle {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 5px 12px;
          border-radius: 4px;
          background: var(--surface-container);
          border: 1px solid var(--hairline);
          color: var(--on-surface);
          cursor: pointer;
        }
        .evidence-results-container {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
        }
        .loading-state {
          height: 300px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          color: var(--outline);
        }
        .evidence-cards-layout {
          display: grid;
          grid-template-columns: 360px 1fr;
          gap: 20px;
          height: 100%;
        }
        .candidates-col, .snippets-col {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .section-title {
          font-family: var(--font-mono);
          font-size: 11px;
          color: var(--outline);
          text-transform: uppercase;
        }
        .candidate-list, .snippets-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .candidate-card {
          background: var(--surface);
          border: 1px solid var(--hairline);
          border-radius: 6px;
          padding: 10px 12px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          cursor: pointer;
          transition: all 0.15s;
        }
        .candidate-card:hover {
          background: var(--surface-high);
          border-color: var(--primary);
        }
        .cand-top {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .cand-rank {
          font-size: 10px;
          color: var(--outline);
        }
        .cand-name {
          flex: 1;
          font-size: 12.5px;
        }
        .cand-score {
          font-size: 10px;
        }
        .cand-bottom {
          display: flex;
          justify-content: space-between;
        }
        .snippet-card {
          background: var(--surface);
          border: 1px solid var(--hairline);
          border-radius: 6px;
          overflow: hidden;
        }
        .snippet-header {
          padding: 8px 12px;
          background: var(--surface-low);
          border-bottom: 1px solid var(--hairline);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .snippet-meta {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .snippet-token-tag {
          font-size: 10px;
          color: var(--tertiary-light);
          background: rgba(16, 185, 129, 0.12);
          padding: 2px 6px;
          border-radius: 3px;
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
