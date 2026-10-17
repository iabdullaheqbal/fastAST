//! Dual-Rubric Scoring and Transitive Dependency Closure Engine for JavaScript + JSX

use crate::javascript::parser::{JsNodeKind, JsScopeItem};
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
pub struct JsDecision {
    /// True if kept with its full implementation body
    pub keep_full: bool,
    /// True if kept as a stub (signature + `{}`)
    pub keep_skeleton: bool,
    /// Relevance score
    pub score: f64,
}

pub struct JsScoreResult {
    pub decisions: Vec<JsDecision>,
    pub zero_match: bool,
    pub intent: QueryIntent,
}

pub fn split_identifier_subtokens(s: &str) -> Vec<String> {
    let mut subtokens = Vec::new();
    let lower = s.to_lowercase();
    subtokens.push(lower.clone());

    // Split snake_case
    if s.contains('_') {
        for part in s.split('_') {
            let p = part.trim().to_lowercase();
            if p.len() >= 2 && p != lower {
                subtokens.push(p);
            }
        }
    }

    // Split camelCase / PascalCase
    let mut current = String::new();
    for ch in s.chars() {
        if ch.is_uppercase() && !current.is_empty() {
            let part = current.to_lowercase();
            if part.len() >= 2 && part != lower {
                subtokens.push(part);
            }
            current.clear();
        }
        if ch != '_' {
            current.push(ch);
        }
    }
    if !current.is_empty() {
        let part = current.to_lowercase();
        if part.len() >= 2 && part != lower {
            subtokens.push(part);
        }
    }

    subtokens
}

const STRUCTURAL_KEYWORDS: &[&str] = &[
    "import", "imports", "class", "classes", "structure", "structural",
    "definition", "definitions", "header", "headers", "skeleton", "types",
    "signature", "signatures", "api", "interface", "interfaces", "overview",
    "architecture", "component", "components", "jsx", "props",
];

const FUNCTIONAL_KEYWORDS: &[&str] = &[
    "execute", "process", "handle", "compute", "calculate", "run", "algorithm",
    "logic", "implement", "implementation", "return", "data", "fetch", "send",
    "call", "render", "hook", "state", "effect", "click", "event", "handler",
    "toggle", "delete", "submit", "change",
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

    let mut struct_matches = 0;
    let mut func_matches = 0;

    for t in &raw_tokens {
        if STRUCTURAL_KEYWORDS.contains(&t.as_str()) {
            struct_matches += 1;
        }
        if FUNCTIONAL_KEYWORDS.contains(&t.as_str()) {
            func_matches += 1;
        }
    }

    let total = struct_matches + func_matches;
    let gate = if total > 0 {
        (struct_matches as f64 - func_matches as f64) / (total as f64)
    } else {
        0.0
    };

    let intent = if gate > 0.25 {
        QueryIntent::Structural
    } else if gate < -0.25 {
        QueryIntent::Functional
    } else {
        QueryIntent::Balanced
    };

    QueryProfile {
        raw_tokens,
        all_tokens,
        intent,
        gate,
    }
}

pub fn evaluate_scopes(items: &[JsScopeItem], query: &str, threshold: f64) -> JsScoreResult {
    let profile = analyze_query(query);
    let mut decisions: Vec<JsDecision> = Vec::with_capacity(items.len());
    let mut any_match = false;

    let effective_threshold = if profile.gate > 0.15 {
        (threshold + 0.15 * profile.gate).min(0.85)
    } else if profile.gate < -0.15 {
        (threshold - 0.10 * profile.gate.abs()).max(0.15)
    } else {
        threshold
    };

    for item in items {
        match &item.kind {
            JsNodeKind::Import => {
                // Imports kept full by default
                decisions.push(JsDecision {
                    keep_full: true,
                    keep_skeleton: false,
                    score: 1.0,
                });
            }
            JsNodeKind::Function { .. }
            | JsNodeKind::ArrowFunction { .. }
            | JsNodeKind::Class { .. }
            | JsNodeKind::Method { .. }
            | JsNodeKind::Field { .. } => {
                let score = compute_semantic_score(item, &profile);
                let keep_full = score >= effective_threshold && score > 0.0;
                if keep_full {
                    any_match = true;
                }
                let keep_skeleton = !keep_full;
                decisions.push(JsDecision {
                    keep_full,
                    keep_skeleton,
                    score,
                });
            }
            JsNodeKind::Statement
            | JsNodeKind::Block
            | JsNodeKind::Other => {
                let score = compute_semantic_score(item, &profile);
                let keep = score >= effective_threshold && score > 0.0;
                if keep {
                    any_match = true;
                }
                decisions.push(JsDecision {
                    keep_full: keep,
                    keep_skeleton: false,
                    score,
                });
            }
        }
    }

    if !any_match && !profile.all_tokens.is_empty() {
        // Zero Semantic Match: Fallback to pure structural skeleton
        for (i, item) in items.iter().enumerate() {
            match item.kind {
                JsNodeKind::Import => {
                    decisions[i].keep_full = true;
                    decisions[i].keep_skeleton = false;
                }
                JsNodeKind::Function { .. }
                | JsNodeKind::ArrowFunction { .. }
                | JsNodeKind::Class { .. } => {
                    decisions[i].keep_full = false;
                    decisions[i].keep_skeleton = true;
                }
                _ => {
                    decisions[i].keep_full = false;
                    decisions[i].keep_skeleton = false;
                }
            }
        }
        return JsScoreResult {
            decisions,
            zero_match: true,
            intent: profile.intent,
        };
    }

    // --- TRANSITIVE DEPENDENCY CLOSURE ---
    let mut keep_full_set: HashSet<usize> = decisions
        .iter()
        .enumerate()
        .filter(|(_, d)| d.keep_full)
        .map(|(i, _)| i)
        .collect();

    let mut changed = true;
    while changed {
        changed = false;
        let current_kept: Vec<usize> = keep_full_set.iter().copied().collect();

        for idx in current_kept {
            let item = &items[idx];

            // 1. Enclosing scope closure:
            // If a nested function is kept full, its parent function must be kept full so closure is intact!
            // If a method is kept full, its parent class must be kept as skeleton container!
            let mut curr = item.parent_id;
            while let Some(pid) = curr {
                match &items[pid].kind {
                    JsNodeKind::Function { .. } | JsNodeKind::ArrowFunction { .. } => {
                        if keep_full_set.insert(pid) {
                            decisions[pid].keep_full = true;
                            decisions[pid].keep_skeleton = false;
                            changed = true;
                        }
                    }
                    JsNodeKind::Class { .. } => {
                        if !decisions[pid].keep_full && !decisions[pid].keep_skeleton {
                            decisions[pid].keep_skeleton = true;
                            changed = true;
                        }
                    }
                    _ => {}
                }
                curr = items[pid].parent_id;
            }

            // 2. Class companion closure:
            if let Some(pid) = item.parent_id {
                if let JsNodeKind::Class { .. } = items[pid].kind {
                    // Ensure parent class is marked skeleton container
                    if !decisions[pid].keep_full && !decisions[pid].keep_skeleton {
                        decisions[pid].keep_skeleton = true;
                        changed = true;
                    }

                    // For methods:
                    for &sibling_id in &items[pid].children_ids {
                        // Keep constructor as skeleton if any method is kept
                        if let JsNodeKind::Method { is_constructor: true, .. } = items[sibling_id].kind {
                            if !decisions[sibling_id].keep_full && !decisions[sibling_id].keep_skeleton {
                                decisions[sibling_id].keep_skeleton = true;
                                changed = true;
                            }
                        }

                        // Getter / setter pairing
                        if let JsNodeKind::Method { name: ref m_name, is_getter, is_setter, .. } = items[idx].kind {
                            if is_getter || is_setter {
                                if let JsNodeKind::Method { name: ref sib_name, is_getter: sib_g, is_setter: sib_s, .. } = items[sibling_id].kind {
                                    if m_name == sib_name && (sib_g != is_getter || sib_s != is_setter) {
                                        if keep_full_set.insert(sibling_id) {
                                            decisions[sibling_id].keep_full = true;
                                            decisions[sibling_id].keep_skeleton = false;
                                            changed = true;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // 3. Symbol definition closure:
            // For every referenced symbol, find any item that defines it
            for sym in &item.referenced_symbols {
                let sym_lower = sym.to_lowercase();
                for (other_idx, other_item) in items.iter().enumerate() {
                    if other_idx == idx || keep_full_set.contains(&other_idx) {
                        continue;
                    }
                    if other_item.defined_symbols.iter().any(|d| d.to_lowercase() == sym_lower) {
                        decisions[other_idx].keep_full = true;
                        decisions[other_idx].keep_skeleton = false;
                        keep_full_set.insert(other_idx);
                        changed = true;
                    }
                }
            }
        }
    }

    // 4. Export statement closure:
    // If a symbol is kept full or skeleton, ensure any statement exporting it (e.g. `export default App;`) is kept
    for (i, item) in items.iter().enumerate() {
        if let JsNodeKind::Statement = item.kind {
            if !decisions[i].keep_full {
                for ref_sym in &item.referenced_symbols {
                    let ref_lower = ref_sym.to_lowercase();
                    for (kept_idx, kept_item) in items.iter().enumerate() {
                        if (decisions[kept_idx].keep_full || decisions[kept_idx].keep_skeleton)
                            && kept_item.defined_symbols.iter().any(|d| d.to_lowercase() == ref_lower)
                        {
                            decisions[i].keep_full = true;
                            break;
                        }
                    }
                }
            }
        }
    }

    // 5. For any class kept as a skeleton container, unkept methods are marked as keep_skeleton
    // so they are emitted as empty stubs `methodName() {}`
    for (i, item) in items.iter().enumerate() {
        if let JsNodeKind::Class { .. } = item.kind {
            if decisions[i].keep_skeleton {
                for &child_id in &item.children_ids {
                    if let JsNodeKind::Method { .. } = items[child_id].kind {
                        if !decisions[child_id].keep_full {
                            decisions[child_id].keep_skeleton = true;
                        }
                    }
                }
            }
        }
    }

    JsScoreResult {
        decisions,
        zero_match: false,
        intent: profile.intent,
    }
}

fn compute_semantic_score(item: &JsScopeItem, profile: &QueryProfile) -> f64 {
    if profile.all_tokens.is_empty() {
        return 0.0;
    }

    let mut score: f64 = 0.0;

    // Check direct name match for functions, classes, methods, arrow functions
    let name_opt = match &item.kind {
        JsNodeKind::Function { name, .. } => Some(name),
        JsNodeKind::ArrowFunction { name, .. } => Some(name),
        JsNodeKind::Class { name, .. } => Some(name),
        JsNodeKind::Method { name, .. } => Some(name),
        JsNodeKind::Field { name, .. } => Some(name),
        _ => None,
    };

    if let Some(name) = name_opt {
        if !name.is_empty() && name != "default" {
            let name_lower = name.to_lowercase();
            if profile.raw_tokens.contains(&name_lower) || profile.all_tokens.contains(&name_lower) {
                score = score.max(0.95);
            } else {
                let name_subs = split_identifier_subtokens(name);
                let matched_subs = name_subs
                    .iter()
                    .filter(|s| profile.all_tokens.contains(*s))
                    .count();
                if matched_subs > 0 {
                    let ratio = matched_subs as f64 / name_subs.len().max(1) as f64;
                    if ratio >= 0.5 {
                        score = score.max(0.70 + 0.25 * ratio);
                    } else {
                        score = score.max(0.50 * ratio);
                    }
                }
            }
        }
    }

    // Check React Event Handler patterns: handleClick, onSubmit, onToggle, etc.
    if let Some(name) = name_opt {
        if name.starts_with("handle") || name.starts_with("on") {
            let name_subs = split_identifier_subtokens(name);
            for sub in &name_subs {
                if sub != "handle" && sub != "on" && profile.all_tokens.contains(sub) {
                    score = score.max(0.90);
                }
            }
        }
    }

    // Check React Hook patterns: useState, useEffect, custom hooks like useAuth
    let is_hook_query = profile.all_tokens.contains("hook")
        || profile.all_tokens.contains("state")
        || profile.all_tokens.contains("effect");

    if is_hook_query {
        let has_hook_ref = item.referenced_symbols.iter().any(|s| s.starts_with("use"))
            || item.defined_symbols.iter().any(|s| s.starts_with("use"));
        if has_hook_ref {
            score = (score + 0.20).min(0.95);
        }
    }

    // Check parameter / defined symbols
    let param_matches = item
        .defined_symbols
        .iter()
        .filter(|p| profile.all_tokens.contains(&p.to_lowercase()))
        .count();
    if param_matches > 0 {
        score = score.max(0.40 * (param_matches as f64).min(2.0));
    }

    // Check signature tokens
    let mut matched_sig = 0;
    for st in &item.signature_tokens {
        if profile.all_tokens.contains(st) {
            matched_sig += 1;
        }
    }
    if matched_sig > 0 {
        let sig_cov = matched_sig as f64 / profile.all_tokens.len().max(1) as f64;
        score = score.max(sig_cov * 0.70);
    }

    // Check body tokens with F1 weighting (coverage * density)
    let mut matched_raw = 0;
    for rt in &profile.raw_tokens {
        if item.tokens.iter().any(|t| t == rt) {
            matched_raw += 1;
        }
    }
    if matched_raw > 0 {
        let raw_cov = matched_raw as f64 / profile.raw_tokens.len().max(1) as f64;
        let density = matched_raw as f64 / item.tokens.len().max(1) as f64;
        let f1 = (2.0 * raw_cov * density) / (raw_cov + density + 1e-6);
        score = score.max(f1 * 0.80);
    }

    // Sub-token F1 matching
    let mut matched_sub = 0;
    for st in &profile.all_tokens {
        if item.tokens.iter().any(|t| t == st) {
            matched_sub += 1;
        }
    }
    if matched_sub > 0 {
        let sub_cov = matched_sub as f64 / profile.all_tokens.len().max(1) as f64;
        let density = matched_sub as f64 / item.tokens.len().max(1) as f64;
        let f1 = (2.0 * sub_cov * density) / (sub_cov + density + 1e-6);
        if f1 >= 0.20 {
            score = score.max(f1 * 0.85);
        }
    }

    // Query intent modulation
    if profile.intent == QueryIntent::Functional && score > 0.0 {
        score = (score + 0.05 * profile.gate.abs()).min(1.0);
    }

    score.min(1.0)
}
