//! Dual-Rubric Scoring and Dependency Closure Engine for CSS

use crate::css::parser::{CssNodeKind, CssScopeItem};
use std::collections::HashSet;

#[derive(Debug, Clone)]
pub struct CssDecision {
    /// True if kept with its full rule block
    pub keep_full: bool,
    /// True if kept as an empty/stub container (e.g. empty ruleset or media container)
    pub keep_skeleton: bool,
    /// Relevance score
    pub score: f64,
}

pub struct CssScoreResult {
    pub decisions: Vec<CssDecision>,
    pub zero_match: bool,
}

pub fn evaluate_scopes(items: &[CssScopeItem], query: &str, threshold: f64) -> CssScoreResult {
    let mut raw_tokens = HashSet::new();
    for p in query.split(|c: char| c == ',' || c == ' ' || c == '>' || c == '+' || c == '~') {
        let trimmed = p.trim().trim_start_matches('.').trim_start_matches('#').to_lowercase();
        if trimmed.len() >= 2 {
            raw_tokens.insert(trimmed.clone());
            if trimmed.contains('-') || trimmed.contains('_') {
                for sub in trimmed.split(|c: char| c == '-' || c == '_') {
                    let s = sub.trim().to_lowercase();
                    if s.len() >= 2 {
                        raw_tokens.insert(s);
                    }
                }
            }
        }
    }

    let mut decisions: Vec<CssDecision> = Vec::with_capacity(items.len());
    let mut any_match = false;

    for item in items {
        match &item.kind {
            CssNodeKind::Import | CssNodeKind::Charset => {
                decisions.push(CssDecision {
                    keep_full: true,
                    keep_skeleton: false,
                    score: 1.0,
                });
            }
            CssNodeKind::RuleSet { .. } | CssNodeKind::Keyframes { .. } | CssNodeKind::Supports { .. } => {
                let score = compute_css_score(item, &raw_tokens);
                let keep = score >= threshold && score > 0.0;
                if keep {
                    any_match = true;
                }
                decisions.push(CssDecision {
                    keep_full: keep,
                    keep_skeleton: false,
                    score,
                });
            }
            CssNodeKind::Media { .. } => {
                let score = compute_css_score(item, &raw_tokens);
                let keep_full = score >= threshold && score > 0.0;
                if keep_full {
                    any_match = true;
                }
                decisions.push(CssDecision {
                    keep_full,
                    keep_skeleton: false,
                    score,
                });
            }
            CssNodeKind::Comment | CssNodeKind::Other => {
                decisions.push(CssDecision {
                    keep_full: false,
                    keep_skeleton: false,
                    score: 0.0,
                });
            }
        }
    }

    if !any_match && !raw_tokens.is_empty() {
        // Zero Semantic Match: Return structural skeleton with imports and empty selector stubs
        for (i, item) in items.iter().enumerate() {
            match &item.kind {
                CssNodeKind::Import | CssNodeKind::Charset => {
                    decisions[i].keep_full = true;
                    decisions[i].keep_skeleton = false;
                }
                CssNodeKind::RuleSet { .. } => {
                    if item.parent_id.is_none() {
                        decisions[i].keep_full = false;
                        decisions[i].keep_skeleton = true;
                    } else {
                        decisions[i].keep_full = false;
                        decisions[i].keep_skeleton = false;
                    }
                }
                _ => {
                    decisions[i].keep_full = false;
                    decisions[i].keep_skeleton = false;
                }
            }
        }
        return CssScoreResult {
            decisions,
            zero_match: true,
        };
    }

    // --- ANCESTOR CLOSURE ---
    // If a nested ruleset inside @media is kept full, enclosing @media must be kept as container
    let keep_full_indices: Vec<usize> = decisions
        .iter()
        .enumerate()
        .filter(|(_, d)| d.keep_full)
        .map(|(i, _)| i)
        .collect();

    for idx in keep_full_indices {
        let mut curr = items[idx].parent_id;
        while let Some(pid) = curr {
            if !decisions[pid].keep_full && !decisions[pid].keep_skeleton {
                decisions[pid].keep_skeleton = true;
            }
            curr = items[pid].parent_id;
        }
    }

    CssScoreResult {
        decisions,
        zero_match: false,
    }
}

fn compute_css_score(item: &CssScopeItem, query_tokens: &HashSet<String>) -> f64 {
    if query_tokens.is_empty() {
        return 0.0;
    }

    let mut score: f64 = 0.0;

    // Direct selector / name match
    for def in &item.defined_symbols {
        let def_lower = def.to_lowercase();
        if query_tokens.contains(&def_lower) {
            score = score.max(0.95);
        }
    }

    // Property / value tokens match
    let mut matched_tokens = 0;
    for qt in query_tokens {
        if item.tokens.iter().any(|t| t == qt) {
            matched_tokens += 1;
        }
    }

    if matched_tokens > 0 {
        let cov = matched_tokens as f64 / query_tokens.len().max(1) as f64;
        score = score.max(cov * 0.80);
    }

    score.min(1.0)
}
