//! Java scope scoring with dual-rubric: semantic + structural

use std::collections::HashSet;
use super::parser::{JavaScope, JavaNodeKind};

#[derive(Debug, Clone)]
pub struct ScoreResult {
    pub decisions: HashSet<usize>,
    pub semantic_scores: Vec<f64>,
}

/// Evaluate scopes with dual-rubric scoring
pub fn evaluate_scopes(
    scopes: &[JavaScope],
    focus_query: &str,
    threshold: f64,
) -> ScoreResult {
    let query_tokens: Vec<String> = focus_query
        .split_whitespace()
        .map(|s| s.to_lowercase())
        .collect();
    
    // Phase 1: Semantic scoring
    let semantic_scores: Vec<f64> = scopes
        .iter()
        .map(|scope| calculate_semantic_score(&scope.tokens, &query_tokens))
        .collect();
    
    // Phase 2: Structural rules
    let mut decisions = HashSet::new();
    
    // Rule 1: Keep semantically matched scopes
    for (i, score) in semantic_scores.iter().enumerate() {
        if *score >= threshold {
            decisions.insert(scopes[i].id);
        }
    }
    
    // Rule 1b: If any code kept, also add packages and imports unconditionally
    let has_kept_code = scopes.iter().any(|s| {
        (s.kind != JavaNodeKind::Package && s.kind != JavaNodeKind::Import) 
            && decisions.contains(&s.id)
    });
    
    if has_kept_code {
        // Keep ALL packages and imports
        for scope in scopes {
            if scope.kind == JavaNodeKind::Package || scope.kind == JavaNodeKind::Import {
                decisions.insert(scope.id);
            }
        }
    }
    
    // Rule 2: Keep enclosing classes/interfaces of kept members
    let mut parent_ids_to_keep = HashSet::new();
    for scope in scopes {
        if decisions.contains(&scope.id) {
            if let Some(parent_id) = scope.parent_id {
                parent_ids_to_keep.insert(parent_id);
            }
        }
    }
    
    // Also keep semantically matched classes/interfaces themselves
    for (i, score) in semantic_scores.iter().enumerate() {
        if *score >= threshold {
            let scope = &scopes[i];
            if scope.kind == JavaNodeKind::Class 
                || scope.kind == JavaNodeKind::Interface 
                || scope.kind == JavaNodeKind::Enum {
                parent_ids_to_keep.insert(scope.id);
            }
        }
    }
    
    for &parent_id in &parent_ids_to_keep {
        decisions.insert(parent_id);
    }
    
    // Rule 3: Fallback - if nothing semantically matched, keep structure
    if decisions.is_empty() {
        // Keep at least packages, imports, and class structure
        for scope in scopes {
            if scope.kind == JavaNodeKind::Package || scope.kind == JavaNodeKind::Import {
                decisions.insert(scope.id);
            }
            if scope.kind == JavaNodeKind::Class 
                || scope.kind == JavaNodeKind::Interface 
                || scope.kind == JavaNodeKind::Enum {
                decisions.insert(scope.id);
            }
        }
    }
    
    ScoreResult {
        decisions,
        semantic_scores,
    }
}

fn calculate_semantic_score(scope_tokens: &[String], query_tokens: &[String]) -> f64 {
    if scope_tokens.is_empty() || query_tokens.is_empty() {
        return 0.0;
    }
    
    let mut matches = 0;
    for qt in query_tokens {
        if scope_tokens.iter().any(|t| t.contains(qt) || qt.contains(t)) {
            matches += 1;
        }
    }
    
    matches as f64 / query_tokens.len().max(1) as f64
}