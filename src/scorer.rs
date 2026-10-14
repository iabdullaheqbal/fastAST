use crate::parser::{NodeKind, ScopeItem};
use std::collections::HashSet;

#[derive(Debug, Clone)]
pub struct Decision {
    /// True if the item is kept completely with its full body
    pub keep_full: bool,
    /// True if the item is kept as a skeleton (header + pass)
    pub keep_skeleton: bool,
    /// Score from Rubric A
    pub score: f64,
}

pub struct ScoreResult {
    pub decisions: Vec<Decision>,
    pub zero_match: bool,
}

pub fn tokenize_query(query: &str) -> HashSet<String> {
    query
        .split(|c: char| !c.is_alphanumeric() && c != '_')
        .map(|s| s.trim().to_lowercase())
        .filter(|s| s.len() >= 2)
        .collect()
}

pub fn evaluate_scopes(items: &[ScopeItem], query: &str, threshold: f64) -> ScoreResult {
    let query_tokens = tokenize_query(query);
    let mut decisions: Vec<Decision> = Vec::with_capacity(items.len());
    let mut any_match = false;

    for item in items {
        match &item.kind {
            NodeKind::Import | NodeKind::ModuleDocstring => {
                decisions.push(Decision {
                    keep_full: true,
                    keep_skeleton: false,
                    score: 1.0,
                });
            }
            NodeKind::Function { .. } | NodeKind::Class { .. } | NodeKind::Other => {
                let score = compute_overlap(&item.tokens, &query_tokens);
                let keep = score >= threshold && score > 0.0;
                if keep {
                    any_match = true;
                }
                decisions.push(Decision {
                    keep_full: keep,
                    keep_skeleton: false,
                    score,
                });
            }
        }
    }

    if !any_match && !query_tokens.is_empty() {
        // Zero Semantic Match: Fallback to pure structural skeleton
        // All imports/module docstrings kept full; functions and classes kept as skeletons
        for (i, item) in items.iter().enumerate() {
            if matches!(item.kind, NodeKind::Function { .. } | NodeKind::Class { .. }) {
                decisions[i].keep_skeleton = true;
            }
        }
        return ScoreResult {
            decisions,
            zero_match: true,
        };
    }

    // Propagate Rubric B structural dependencies upward
    // If a child is kept full, its parent class/function must at least have its header kept
    for i in (0..items.len()).rev() {
        if decisions[i].keep_full {
            if let Some(pidx) = items[i].parent_idx {
                if !decisions[pidx].keep_full {
                    decisions[pidx].keep_skeleton = true;
                }
            }
        }
    }

    // All other unkept functions and classes retain their signatures with pass bodies
    for (i, item) in items.iter().enumerate() {
        if matches!(item.kind, NodeKind::Function { .. } | NodeKind::Class { .. }) {
            if !decisions[i].keep_full && !decisions[i].keep_skeleton {
                decisions[i].keep_skeleton = true;
            }
        }
    }

    ScoreResult {
        decisions,
        zero_match: false,
    }
}

fn compute_overlap(item_tokens: &[String], query_tokens: &HashSet<String>) -> f64 {
    if query_tokens.is_empty() || item_tokens.is_empty() {
        return 0.0;
    }
    let mut matches = 0;
    for t in item_tokens {
        if query_tokens.contains(t) {
            matches += 1;
        }
    }
    (matches as f64) / (query_tokens.len() as f64).max(1.0)
}

