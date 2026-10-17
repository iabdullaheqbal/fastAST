//! Dual-Rubric Scoring and Dependency Closure Engine for Rust

use crate::rust::parser::{split_identifier_subtokens, RustNodeKind, RustScopeItem};
use std::collections::HashSet;

#[derive(Debug, Clone, Copy, PartialEq)]
pub enum QueryIntent {
    Structural,
    Functional,
    Balanced,
}

#[derive(Debug, Clone)]
pub struct QueryProfile {
    pub raw_tokens: HashSet<String>,
    pub all_tokens: HashSet<String>,
    pub intent: QueryIntent,
    pub gate: f64,
}

#[derive(Debug, Clone)]
pub struct RustDecision {
    /// True if kept with its full implementation body
    pub keep_full: bool,
    /// True if kept as a stub (signature + todo!() body)
    pub keep_skeleton: bool,
    /// Relevance score
    pub score: f64,
}

pub struct RustScoreResult {
    pub decisions: Vec<RustDecision>,
    pub zero_match: bool,
    pub intent: QueryIntent,
}

const STRUCTURAL_KEYWORDS: &[&str] = &[
    "struct", "structs", "enum", "enums", "trait", "traits", "impl", "impls",
    "mod", "module", "modules", "use", "import", "imports", "type", "types",
    "const", "static", "macro", "macros", "definition", "definitions", "header",
    "headers", "skeleton", "overview", "api", "architecture", "signature",
    "signatures",
];

const FUNCTIONAL_KEYWORDS: &[&str] = &[
    "calculate", "compute", "execute", "process", "handle", "run", "logic",
    "algorithm", "save", "load", "find", "get", "set", "update", "delete",
    "remove", "add", "subtract", "multiply", "divide", "new", "reset", "clamp",
    "call", "send", "receive", "write", "read",
];

pub fn analyze_query(query: &str) -> QueryProfile {
    let mut raw_tokens = HashSet::new();
    let mut all_tokens = HashSet::new();

    let parts = query.split(|c: char| !c.is_alphanumeric() && c != '_');
    for p in parts {
        let trimmed = p.trim();
        if trimmed.len() >= 2 {
            raw_tokens.insert(trimmed.to_lowercase());
            for sub in split_identifier_subtokens(trimmed) {
                all_tokens.insert(sub);
            }
        }
    }

    let mut structural_matches = 0;
    let mut functional_matches = 0;

    for t in &raw_tokens {
        if STRUCTURAL_KEYWORDS.contains(&t.as_str()) {
            structural_matches += 1;
        }
        if FUNCTIONAL_KEYWORDS.contains(&t.as_str()) {
            functional_matches += 1;
        }
    }

    let (intent, gate) = if structural_matches > functional_matches {
        (QueryIntent::Structural, 0.70)
    } else if functional_matches > structural_matches {
        (QueryIntent::Functional, 0.30)
    } else {
        (QueryIntent::Balanced, 0.50)
    };

    QueryProfile {
        raw_tokens,
        all_tokens,
        intent,
        gate,
    }
}

pub fn evaluate_scopes(
    items: &[RustScopeItem],
    query: &str,
    threshold: f64,
) -> RustScoreResult {
    let profile = analyze_query(query);
    let mut decisions: Vec<RustDecision> = Vec::with_capacity(items.len());
    let mut any_semantic_match = false;

    for item in items {
        let (sem_score, dep_score) = compute_item_scores(item, &profile);
        let final_score = (1.0 - profile.gate) * sem_score + profile.gate * dep_score;

        let keep_full = final_score >= threshold && (sem_score > 0.0 || dep_score > 0.0);
        if keep_full {
            any_semantic_match = true;
        }

        decisions.push(RustDecision {
            keep_full,
            keep_skeleton: false,
            score: final_score,
        });
    }

    // Zero Semantic Match fallback
    if !any_semantic_match && !profile.raw_tokens.is_empty() {
        for (i, item) in items.iter().enumerate() {
            match &item.kind {
                RustNodeKind::Use => {
                    decisions[i].keep_full = true;
                    decisions[i].keep_skeleton = false;
                }
                RustNodeKind::Struct { .. } | RustNodeKind::Enum { .. } => {
                    decisions[i].keep_full = true;
                    decisions[i].keep_skeleton = false;
                }
                RustNodeKind::Trait { .. } | RustNodeKind::Impl { .. } | RustNodeKind::Mod { is_inline: true, .. } => {
                    decisions[i].keep_full = false;
                    decisions[i].keep_skeleton = true;
                }
                RustNodeKind::Function { .. } => {
                    decisions[i].keep_full = false;
                    decisions[i].keep_skeleton = true;
                }
                _ => {}
            }
        }

        return RustScoreResult {
            decisions,
            zero_match: true,
            intent: profile.intent,
        };
    }

    // Ancestor Closure: If any item is kept, enclosing impl, trait, or mod is kept as skeleton
    for i in 0..items.len() {
        if decisions[i].keep_full {
            let mut curr = items[i].parent_id;
            while let Some(pid) = curr {
                if !decisions[pid].keep_full {
                    decisions[pid].keep_skeleton = true;
                }
                curr = items[pid].parent_id;
            }
        }
    }

    // Companion Closure for Impl and Trait blocks:
    // If an impl or trait block is kept as a skeleton container, any unkept
    // methods inside it are stubbed with { todo!() } to preserve the API surface.
    for i in 0..items.len() {
        match &items[i].kind {
            RustNodeKind::Impl { .. } | RustNodeKind::Trait { .. } => {
                if decisions[i].keep_full || decisions[i].keep_skeleton {
                    for &cid in &items[i].children_ids {
                        if !decisions[cid].keep_full {
                            decisions[cid].keep_skeleton = true;
                        }
                    }
                }
            }
            _ => {}
        }
    }

    // Dependency Tracing: If a kept item references a type or function defined in the file
    let mut referenced_names = HashSet::new();
    for (i, item) in items.iter().enumerate() {
        if decisions[i].keep_full || decisions[i].keep_skeleton {
            for ref_sym in &item.referenced_symbols {
                referenced_names.insert(ref_sym.clone());
            }
            if let RustNodeKind::Impl { target_type, trait_name } = &item.kind {
                referenced_names.insert(target_type.clone());
                if let Some(tr) = trait_name {
                    referenced_names.insert(tr.clone());
                }
            }
        }
    }

    for (i, item) in items.iter().enumerate() {
        if !decisions[i].keep_full {
            let matches_dep = item.defined_symbols.iter().any(|d| referenced_names.contains(d));
            if matches_dep {
                match &item.kind {
                    RustNodeKind::Struct { .. } | RustNodeKind::Enum { .. } | RustNodeKind::Trait { .. } | RustNodeKind::Const { .. } | RustNodeKind::Static { .. } => {
                        decisions[i].keep_full = true;
                    }
                    RustNodeKind::Use => {
                        decisions[i].keep_full = true;
                    }
                    _ => {}
                }
            }
        }
    }

    RustScoreResult {
        decisions,
        zero_match: false,
        intent: profile.intent,
    }
}

fn compute_item_scores(item: &RustScopeItem, profile: &QueryProfile) -> (f64, f64) {
    if profile.raw_tokens.is_empty() {
        return (0.0, 0.0);
    }

    let mut defined_hits = 0;
    let mut sig_hits = 0;
    let mut body_hits = 0;

    for qt in &profile.all_tokens {
        if item.defined_symbols.iter().any(|d| d.to_lowercase() == *qt) {
            defined_hits += 1;
        } else if item.signature_tokens.iter().any(|s| s.to_lowercase() == *qt) {
            sig_hits += 1;
        } else if item.tokens.iter().any(|t| t.to_lowercase() == *qt) {
            body_hits += 1;
        }
    }

    let total_q = profile.raw_tokens.len().max(1) as f64;
    let sem_score = ((defined_hits as f64 * 1.5 + sig_hits as f64 * 1.0 + body_hits as f64 * 0.4) / total_q).min(1.0);

    let dep_score = match &item.kind {
        RustNodeKind::Use => {
            if profile.intent == QueryIntent::Structural {
                0.85
            } else {
                0.35
            }
        }
        RustNodeKind::Struct { .. } | RustNodeKind::Enum { .. } | RustNodeKind::Trait { .. } => {
            if profile.intent == QueryIntent::Structural {
                0.80
            } else {
                0.40
            }
        }
        RustNodeKind::Impl { .. } => {
            if profile.intent == QueryIntent::Structural {
                0.75
            } else {
                0.30
            }
        }
        RustNodeKind::Const { .. } | RustNodeKind::Static { .. } => 0.30,
        RustNodeKind::Function { .. } => 0.20,
        _ => 0.0,
    };

    (sem_score, dep_score)
}
