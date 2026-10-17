//! Dual-Rubric Scoring and Ancestor Closure Engine for TOML

use crate::toml::parser::{split_identifier_subtokens, TomlScopeItem};
use std::collections::HashSet;

#[derive(Debug, Clone)]
pub struct TomlDecision {
    pub keep_full: bool,
    pub keep_skeleton: bool,
    pub score: f64,
}

pub struct TomlScoreResult {
    pub decisions: Vec<TomlDecision>,
    pub zero_match: bool,
}

pub fn evaluate_scopes(
    items: &[TomlScopeItem],
    query: &str,
    threshold: f64,
) -> TomlScoreResult {
    let mut query_tokens = HashSet::new();
    for p in query.split(|c: char| !c.is_alphanumeric() && c != '_' && c != '-') {
        let trimmed = p.trim().to_lowercase();
        if trimmed.len() >= 2 {
            query_tokens.insert(trimmed.clone());
            for sub in split_identifier_subtokens(&trimmed) {
                query_tokens.insert(sub);
            }
        }
    }

    let mut decisions = Vec::with_capacity(items.len());
    let mut any_match = false;

    for item in items {
        let score = compute_toml_score(item, &query_tokens);
        let keep_full = score >= threshold && score > 0.0;
        if keep_full {
            any_match = true;
        }

        decisions.push(TomlDecision {
            keep_full,
            keep_skeleton: false,
            score,
        });
    }

    // Zero Semantic Match: Return structural skeleton of top-level tables and pairs
    if !any_match && !query_tokens.is_empty() {
        for (i, item) in items.iter().enumerate() {
            if item.parent_id.is_none() {
                decisions[i].keep_skeleton = true;
            } else if item.parent_id == Some(0) {
                // Top-level children of root
                decisions[i].keep_skeleton = true;
            }
        }

        return TomlScoreResult {
            decisions,
            zero_match: true,
        };
    }

    // Containers with kept descendants become skeleton containers rather than keeping all unkept siblings
    for i in 0..items.len() {
        if !items[i].children_ids.is_empty() && has_descendant_kept_full(i, items, &decisions) {
            decisions[i].keep_full = false;
            decisions[i].keep_skeleton = true;
        }
    }

    if !items.is_empty() {
        decisions[0].keep_full = false;
    }

    // Ancestor Closure: If any item is kept in full, all its ancestor tables are marked skeleton
    for i in 0..items.len() {
        if decisions[i].keep_full {
            let mut curr = items[i].parent_id;
            while let Some(pid) = curr {
                decisions[pid].keep_skeleton = true;
                curr = items[pid].parent_id;
            }
        }
    }

    TomlScoreResult {
        decisions,
        zero_match: false,
    }
}

fn has_descendant_kept_full(id: usize, items: &[TomlScopeItem], decisions: &[TomlDecision]) -> bool {
    for &cid in &items[id].children_ids {
        if decisions[cid].keep_full || has_descendant_kept_full(cid, items, decisions) {
            return true;
        }
    }
    false
}

fn compute_toml_score(item: &TomlScopeItem, query_tokens: &HashSet<String>) -> f64 {
    if query_tokens.is_empty() {
        return 0.0;
    }

    let mut key_hits = 0;
    let mut token_hits = 0;

    for qt in query_tokens {
        if item.defined_symbols.iter().any(|d| d.to_lowercase() == *qt) {
            key_hits += 1;
        } else if item.tokens.iter().any(|t| t.to_lowercase() == *qt) {
            token_hits += 1;
        }
    }

    let total = query_tokens.len().max(1) as f64;
    ((key_hits as f64 * 1.5 + token_hits as f64 * 0.4) / total).min(1.0)
}
