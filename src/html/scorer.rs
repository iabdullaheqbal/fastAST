//! Dual-Rubric Scoring and Hierarchy Closure for HTML

use crate::html::parser::{HtmlNodeKind, HtmlScopeItem};
use std::collections::HashSet;

#[derive(Debug, Clone)]
pub struct HtmlDecision {
    /// True if kept with its full content and children
    pub keep_full: bool,
    /// True if kept as an open/close tag container with pruned/skeleton children
    pub keep_skeleton: bool,
    /// Relevance score
    pub score: f64,
}

pub struct HtmlScoreResult {
    pub decisions: Vec<HtmlDecision>,
    pub zero_match: bool,
}

pub fn evaluate_scopes(items: &[HtmlScopeItem], query: &str, threshold: f64) -> HtmlScoreResult {
    let mut raw_tokens = HashSet::new();
    for p in query.split(|c: char| !c.is_alphanumeric() && c != '_') {
        let trimmed = p.trim().to_lowercase();
        if trimmed.len() >= 2 {
            raw_tokens.insert(trimmed);
        }
    }

    let mut decisions: Vec<HtmlDecision> = Vec::with_capacity(items.len());
    let mut any_match = false;

    for item in items {
        match &item.kind {
            HtmlNodeKind::Doctype => {
                decisions.push(HtmlDecision {
                    keep_full: true,
                    keep_skeleton: false,
                    score: 1.0,
                });
            }
            HtmlNodeKind::Element { tag_name, is_void: _, .. } => {
                // Structural root tags default to skeleton unless directly matched
                if tag_name == "html" || tag_name == "body" {
                    decisions.push(HtmlDecision {
                        keep_full: false,
                        keep_skeleton: true,
                        score: 0.5,
                    });
                } else if tag_name == "head" || tag_name == "title" || tag_name == "meta" || tag_name == "link" {
                    // Head metadata kept by default for valid HTML rendering
                    decisions.push(HtmlDecision {
                        keep_full: true,
                        keep_skeleton: false,
                        score: 0.8,
                    });
                } else {
                    let score = compute_element_score(item, &raw_tokens);
                    let keep = score >= threshold && score > 0.0;
                    if keep {
                        any_match = true;
                    }
                    decisions.push(HtmlDecision {
                        keep_full: keep,
                        keep_skeleton: false,
                        score,
                    });
                }
            }
            HtmlNodeKind::Script | HtmlNodeKind::Style => {
                let score = compute_element_score(item, &raw_tokens);
                let keep = score >= threshold && score > 0.0;
                if keep {
                    any_match = true;
                }
                decisions.push(HtmlDecision {
                    keep_full: keep,
                    keep_skeleton: false,
                    score,
                });
            }
            HtmlNodeKind::Comment | HtmlNodeKind::Other => {
                decisions.push(HtmlDecision {
                    keep_full: false,
                    keep_skeleton: false,
                    score: 0.0,
                });
            }
        }
    }

    if !any_match && !raw_tokens.is_empty() {
        // Zero Semantic Match: Return structural skeleton of document
        for (i, item) in items.iter().enumerate() {
            match &item.kind {
                HtmlNodeKind::Doctype => {
                    decisions[i].keep_full = true;
                    decisions[i].keep_skeleton = false;
                }
                HtmlNodeKind::Element { tag_name, .. } => {
                    if tag_name == "html" || tag_name == "body" {
                        decisions[i].keep_full = false;
                        decisions[i].keep_skeleton = true;
                    } else if tag_name == "head" || tag_name == "title" || tag_name == "meta" || tag_name == "link" {
                        decisions[i].keep_full = true;
                        decisions[i].keep_skeleton = false;
                    } else if matches!(tag_name.as_str(), "header" | "main" | "footer" | "nav" | "section" | "article") {
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
        return HtmlScoreResult {
            decisions,
            zero_match: true,
        };
    }

    // --- ANCESTOR CLOSURE ---
    // If a descendant element is kept full, all its ancestors must be kept as skeleton containers
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

    HtmlScoreResult {
        decisions,
        zero_match: false,
    }
}

fn compute_element_score(item: &HtmlScopeItem, query_tokens: &HashSet<String>) -> f64 {
    if query_tokens.is_empty() {
        return 0.0;
    }

    let mut score: f64 = 0.0;

    // Check tag name, id, and class defined symbols
    for def in &item.defined_symbols {
        let def_lower = def.to_lowercase();
        if query_tokens.contains(&def_lower) {
            score = score.max(0.95);
        }
    }

    // Check tokens (tag name, attributes, words)
    let mut matched_tokens = 0;
    for qt in query_tokens {
        if item.tokens.iter().any(|t| t == qt) {
            matched_tokens += 1;
        }
    }

    if matched_tokens > 0 {
        let cov = matched_tokens as f64 / query_tokens.len().max(1) as f64;
        score = score.max(cov * 0.85);
    }

    score.min(1.0)
}
