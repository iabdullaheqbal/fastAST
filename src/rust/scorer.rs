//! Dual-Rubric Scoring and Dependency Closure Engine for Rust

use crate::rust::parser::{split_identifier_subtokens, strip_type_generics, RustNodeKind, RustScopeItem};
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

fn is_constructor_name(name: &str) -> bool {
    matches!(
        name,
        "new"
            | "default"
            | "with_capacity"
            | "build"
            | "builder"
            | "create"
            | "from"
            | "try_from"
            | "init"
    )
}

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
        let sem_score = compute_semantic_score(item, &profile);
        let dep_score = compute_structural_score(item, &profile);
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
                RustNodeKind::Trait { .. }
                | RustNodeKind::Impl { .. }
                | RustNodeKind::Mod { is_inline: true, .. } => {
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

    // Fixed-Point Transitive Closure Loop
    let mut changed = true;
    while changed {
        changed = false;

        // Rule 1: Ancestor Closure: If any item is kept, enclosing impl, trait, or mod is kept as skeleton
        for i in 0..items.len() {
            if decisions[i].keep_full || decisions[i].keep_skeleton {
                let mut curr = items[i].parent_id;
                while let Some(pid) = curr {
                    if !decisions[pid].keep_full && !decisions[pid].keep_skeleton {
                        decisions[pid].keep_skeleton = true;
                        changed = true;
                    }
                    curr = items[pid].parent_id;
                }
            }
        }

        // Rule 2: Impl <-> Struct / Trait linking
        for i in 0..items.len() {
            if decisions[i].keep_full || decisions[i].keep_skeleton {
                if let RustNodeKind::Impl { target_type, trait_name } = &items[i].kind {
                    let base_type = strip_type_generics(target_type);
                    for (j, other) in items.iter().enumerate() {
                        if !decisions[j].keep_full {
                            match &other.kind {
                                RustNodeKind::Struct { name } | RustNodeKind::Enum { name, .. } => {
                                    if name == base_type {
                                        decisions[j].keep_full = true;
                                        changed = true;
                                    }
                                }
                                _ => {}
                            }
                        }
                    }

                    if let Some(tr) = trait_name {
                        let base_tr = strip_type_generics(tr);
                        for (j, other) in items.iter().enumerate() {
                            if !decisions[j].keep_full {
                                if let RustNodeKind::Trait { name } = &other.kind {
                                    if name == base_tr {
                                        decisions[j].keep_full = true;
                                        changed = true;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        // Rule 3: Trait implementation completeness & Impl skeleton companions
        for i in 0..items.len() {
            match &items[i].kind {
                RustNodeKind::Impl { .. } | RustNodeKind::Trait { .. } => {
                    if decisions[i].keep_full || decisions[i].keep_skeleton {
                        for &cid in &items[i].children_ids {
                            if !decisions[cid].keep_full && !decisions[cid].keep_skeleton {
                                decisions[cid].keep_skeleton = true;
                                changed = true;
                            }
                        }
                    }
                }
                _ => {}
            }
        }

        // Rule 4: If a struct/enum is kept full, find inherent impl blocks and keep
        // constructor methods as skeleton so consumers know how to instantiate it
        for i in 0..items.len() {
            if decisions[i].keep_full {
                let struct_name = match &items[i].kind {
                    RustNodeKind::Struct { name } | RustNodeKind::Enum { name, .. } => name.clone(),
                    _ => continue,
                };

                for j in 0..items.len() {
                    if let RustNodeKind::Impl { target_type, trait_name: None } = &items[j].kind {
                        if strip_type_generics(target_type) == struct_name {
                            if !decisions[j].keep_full && !decisions[j].keep_skeleton {
                                decisions[j].keep_skeleton = true;
                                changed = true;
                            }
                            for &cid in &items[j].children_ids {
                                if let RustNodeKind::Function { name, .. } = &items[cid].kind {
                                    if is_constructor_name(name) && !decisions[cid].keep_full && !decisions[cid].keep_skeleton {
                                        decisions[cid].keep_skeleton = true;
                                        changed = true;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        // Rule 5: Companion Getter/Setter Pairing
        for i in 0..items.len() {
            if decisions[i].keep_full {
                if let RustNodeKind::Function { name: fn_name, is_method: true, .. } = &items[i].kind {
                    if let Some(pid) = items[i].parent_id {
                        let companion_name = if fn_name.starts_with("set_") {
                            Some(fn_name.strip_prefix("set_").unwrap().to_string())
                        } else if fn_name.starts_with("get_") {
                            Some(format!("set_{}", fn_name.strip_prefix("get_").unwrap()))
                        } else {
                            Some(format!("set_{}", fn_name))
                        };

                        if let Some(ref comp) = companion_name {
                            for &cid in &items[pid].children_ids {
                                if cid != i && !decisions[cid].keep_full && !decisions[cid].keep_skeleton {
                                    if let RustNodeKind::Function { name: c_name, .. } = &items[cid].kind {
                                        if c_name == comp || (comp.starts_with("set_") && c_name == comp.strip_prefix("set_").unwrap()) {
                                            decisions[cid].keep_skeleton = true;
                                            changed = true;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        // Rule 6: Transitive Symbol Dependency Tracing
        let mut referenced_names = HashSet::new();
        for (i, item) in items.iter().enumerate() {
            if decisions[i].keep_full || decisions[i].keep_skeleton {
                for ref_sym in &item.referenced_symbols {
                    referenced_names.insert(ref_sym.clone());
                    referenced_names.insert(strip_type_generics(ref_sym).to_string());
                }
                if let RustNodeKind::Impl { target_type, trait_name } = &item.kind {
                    referenced_names.insert(target_type.clone());
                    referenced_names.insert(strip_type_generics(target_type).to_string());
                    if let Some(tr) = trait_name {
                        referenced_names.insert(tr.clone());
                        referenced_names.insert(strip_type_generics(tr).to_string());
                    }
                }
            }
        }

        for (i, item) in items.iter().enumerate() {
            if !decisions[i].keep_full {
                let matches_dep = item.defined_symbols.iter().any(|d| {
                    referenced_names.contains(d) || referenced_names.contains(strip_type_generics(d))
                });
                if matches_dep {
                    match &item.kind {
                        RustNodeKind::Struct { .. }
                        | RustNodeKind::Enum { .. }
                        | RustNodeKind::Trait { .. }
                        | RustNodeKind::Const { .. }
                        | RustNodeKind::Static { .. }
                        | RustNodeKind::TypeAlias { .. }
                        | RustNodeKind::Use => {
                            decisions[i].keep_full = true;
                            changed = true;
                        }
                        RustNodeKind::Function { is_method: false, .. } => {
                            decisions[i].keep_full = true;
                            changed = true;
                        }
                        _ => {}
                    }
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

fn compute_semantic_score(item: &RustScopeItem, profile: &QueryProfile) -> f64 {
    if profile.raw_tokens.is_empty() {
        return 0.0;
    }

    let mut best_score: f64 = 0.0;

    // 1. Direct name match against defined symbols
    for d in &item.defined_symbols {
        let d_low = d.to_lowercase();
        for q in &profile.raw_tokens {
            if d_low == *q {
                best_score = best_score.max(0.95);
            }
        }

        let d_subtokens = split_identifier_subtokens(d);
        let mut sub_hits = 0;
        for sub in &d_subtokens {
            if profile.all_tokens.contains(sub) {
                sub_hits += 1;
            }
        }
        if !d_subtokens.is_empty() && sub_hits > 0 {
            let coverage = sub_hits as f64 / profile.raw_tokens.len().max(1) as f64;
            let sub_score = 0.70 + 0.20 * coverage.min(1.0);
            best_score = best_score.max(sub_score);
        }
    }

    // 2. Signature match
    let mut sig_hits = 0;
    for st in &item.signature_tokens {
        if profile.all_tokens.contains(st) {
            sig_hits += 1;
        }
    }
    if sig_hits > 0 {
        let sig_ratio = (sig_hits as f64 / profile.all_tokens.len().max(1) as f64).min(1.0);
        best_score = best_score.max(0.55 + 0.25 * sig_ratio);
    }

    // 3. Body token match (intent-gated)
    let mut body_hits = 0;
    for bt in &item.tokens {
        if profile.all_tokens.contains(bt) {
            body_hits += 1;
        }
    }
    if body_hits > 0 {
        let body_ratio = (body_hits as f64 / profile.all_tokens.len().max(1) as f64).min(1.0);
        let max_body_score = match profile.intent {
            QueryIntent::Functional => 0.40,
            QueryIntent::Structural => 0.60,
            QueryIntent::Balanced => 0.50,
        };
        best_score = best_score.max(0.20 + (max_body_score - 0.20) * body_ratio);
    }

    best_score.min(1.0)
}

fn compute_structural_score(item: &RustScopeItem, profile: &QueryProfile) -> f64 {
    match &item.kind {
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
    }
}
