use crate::parser::{ControlFlowType, NodeKind, ScopeItem};
use std::collections::HashSet;

const STRUCTURAL_KEYWORDS: &[&str] = &[
    "import", "imports", "class", "classes", "structure", "structural",
    "definition", "definitions", "header", "headers", "skeleton", "types",
    "signature", "signatures", "api", "interface", "interfaces", "overview",
    "architecture", "hierarchy", "outline", "schema",
];

const FUNCTIONAL_KEYWORDS: &[&str] = &[
    "execute", "process", "handle", "compute", "calculate", "run", "algorithm",
    "logic", "implement", "implementation", "return", "data", "fetch", "send",
    "call", "step", "pipeline", "solve", "bug", "error", "fix", "parse", "transform",
    "worker", "routine", "method", "function", "action",
];

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
    /// Gate value from -1.0 (purely functional) to +1.0 (purely structural)
    pub gate: f64,
}

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

    let mut struct_count = 0;
    let mut func_count = 0;

    for t in &all_tokens {
        if STRUCTURAL_KEYWORDS.contains(&t.as_str()) {
            struct_count += 1;
        }
        if FUNCTIONAL_KEYWORDS.contains(&t.as_str()) {
            func_count += 1;
        }
    }

    let total = (struct_count + func_count) as f64;
    let gate = if total > 0.0 {
        (struct_count as f64 - func_count as f64) / total
    } else {
        0.0
    };

    let intent = if gate > 0.15 {
        QueryIntent::Structural
    } else if gate < -0.15 {
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

pub fn tokenize_query(query: &str) -> HashSet<String> {
    analyze_query(query).all_tokens
}

pub fn evaluate_scopes(items: &[ScopeItem], query: &str, threshold: f64) -> ScoreResult {
    let profile = analyze_query(query);
    let mut decisions: Vec<Decision> = Vec::with_capacity(items.len());
    let mut any_match = false;

    // Phase 3: Adaptive threshold modulation based on query gating
    // Structural intent (+gate): raise threshold for internal statements, prioritize headers
    // Functional intent (-gate): boost semantic sensitivity for execution logic
    let effective_threshold = if profile.gate > 0.15 {
        (threshold + 0.15 * profile.gate).min(0.85)
    } else if profile.gate < -0.15 {
        (threshold - 0.10 * profile.gate.abs()).max(0.15)
    } else {
        threshold
    };

    for item in items {
        match &item.kind {
            NodeKind::Import | NodeKind::ModuleDocstring => {
                decisions.push(Decision {
                    keep_full: true,
                    keep_skeleton: false,
                    score: 1.0,
                });
            }
            NodeKind::Function { .. }
            | NodeKind::Class { .. }
            | NodeKind::ControlFlow { .. }
            | NodeKind::Statement
            | NodeKind::Other => {
                let score = compute_smart_semantic_score(item, &profile);
                let keep = score >= effective_threshold && score > 0.0;
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

    if !any_match && !profile.all_tokens.is_empty() {
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
            intent: profile.intent,
        };
    }

    // --- DEPENDENCY CLOSURE (Option A / LaMR) ---
    let mut keep_full_set: HashSet<usize> = decisions
        .iter()
        .enumerate()
        .filter(|(_, d)| d.keep_full)
        .map(|(i, _)| i)
        .collect();

    let mut keep_skeleton_set: HashSet<usize> = HashSet::new();

    // If a function was matched directly by its name/signature, keep all its descendants full
    let initial_matched: Vec<usize> = keep_full_set.iter().copied().collect();
    for idx in initial_matched {
        if matches!(items[idx].kind, NodeKind::Function { .. }) {
            mark_descendants_full(idx, items, &mut keep_full_set);
        }
    }

    let mut changed = true;
    while changed {
        changed = false;
        let current_kept: Vec<usize> = keep_full_set.iter().copied().collect();

        for idx in current_kept {
            let item = &items[idx];

            // 1. Enclosing scope headers: walk up parent_idx transitively
            let mut curr = item.parent_idx;
            while let Some(pidx) = curr {
                let parent = &items[pidx];
                match parent.kind {
                    NodeKind::ControlFlow { .. } => {
                        if keep_full_set.insert(pidx) {
                            changed = true;
                        }
                    }
                    NodeKind::Function { .. } | NodeKind::Class { .. } => {
                        if !keep_full_set.contains(&pidx) {
                            keep_skeleton_set.insert(pidx);
                        }
                    }
                    _ => {}
                }
                curr = parent.parent_idx;
            }

            // 2. Control-flow companions:
            // If item is Try, ensure at least one companion Except or Finally is kept
            if let NodeKind::ControlFlow {
                flow_type: ControlFlowType::Try,
            } = item.kind
            {
                let has_kept_companion = item
                    .companion_indices
                    .iter()
                    .any(|c| keep_full_set.contains(c));
                if !has_kept_companion {
                    if let Some(&first_comp) = item.companion_indices.first() {
                        if keep_full_set.insert(first_comp) {
                            changed = true;
                        }
                    }
                }
            }

            // If item is Except, Finally, Elif, or Else, ensure companion Try/If is kept
            if matches!(
                item.kind,
                NodeKind::ControlFlow {
                    flow_type: ControlFlowType::Except
                } | NodeKind::ControlFlow {
                    flow_type: ControlFlowType::Finally
                } | NodeKind::ControlFlow {
                    flow_type: ControlFlowType::Elif
                } | NodeKind::ControlFlow {
                    flow_type: ControlFlowType::Else
                }
            ) {
                for &comp_idx in &item.companion_indices {
                    if keep_full_set.insert(comp_idx) {
                        changed = true;
                    }
                }
            }

            // 3. Symbol definition closure:
            // For each referenced identifier, find its definition
            for sym in &item.referenced_symbols {
                // Look for preceding statement in current or enclosing scope that defines `sym`
                let mut curr_scope = item.parent_idx;
                while let Some(scope_idx) = curr_scope {
                    let siblings = &items[scope_idx].child_indices;
                    let mut found = false;
                    for &sib_idx in siblings {
                        if items[sib_idx].start_row >= item.start_row {
                            break; // Look only at definitions preceding `item`
                        }
                        if items[sib_idx].defined_symbols.contains(sym) {
                            if keep_full_set.insert(sib_idx) {
                                changed = true;
                            }
                            found = true;
                            break;
                        }
                    }
                    if found {
                        break;
                    }
                    curr_scope = items[scope_idx].parent_idx;
                }

                // Look for module-level definition (e.g. MODULE_CONSTANT = 100 or function/class)
                for (m_idx, m_item) in items.iter().enumerate() {
                    if m_item.parent_idx.is_none() && m_item.defined_symbols.contains(sym) {
                        match m_item.kind {
                            NodeKind::Statement | NodeKind::Other => {
                                if keep_full_set.insert(m_idx) {
                                    changed = true;
                                }
                            }
                            NodeKind::Function { .. } | NodeKind::Class { .. } => {
                                if !keep_full_set.contains(&m_idx) {
                                    keep_skeleton_set.insert(m_idx);
                                }
                            }
                            _ => {}
                        }
                    }
                }
            }
        }
    }

    // Ensure all unkept functions and classes retain their signatures with pass bodies
    for (i, item) in items.iter().enumerate() {
        if matches!(item.kind, NodeKind::Function { .. } | NodeKind::Class { .. }) {
            if !keep_full_set.contains(&i) {
                keep_skeleton_set.insert(i);
            }
        }
    }

    // Populate final decision booleans
    for i in 0..items.len() {
        decisions[i].keep_full = keep_full_set.contains(&i);
        decisions[i].keep_skeleton =
            keep_skeleton_set.contains(&i) && !decisions[i].keep_full;
    }

    ScoreResult {
        decisions,
        zero_match: false,
        intent: profile.intent,
    }
}

fn mark_descendants_full(
    idx: usize,
    items: &[ScopeItem],
    keep_full_set: &mut HashSet<usize>,
) {
    for &child in &items[idx].child_indices {
        keep_full_set.insert(child);
        mark_descendants_full(child, items, keep_full_set);
    }
}

/// Phase 2: Smarter semantic scoring with name boosting and weak partial match suppression
fn compute_smart_semantic_score(
    item: &ScopeItem,
    profile: &QueryProfile,
) -> f64 {
    if profile.all_tokens.is_empty() {
        return 0.0;
    }

    let mut score: f64 = 0.0;

    // Give higher weight to function names, class names, and key definitions appearing in query
    match &item.kind {
        NodeKind::Function { name, .. } => {
            let name_lower = name.to_lowercase();
            if profile.raw_tokens.contains(&name_lower) || profile.all_tokens.contains(&name_lower) {
                // Exact function name target in query -> strong boost
                score = score.max(0.95);
            } else {
                let name_subs = split_identifier_subtokens(name);
                let matched_subs = name_subs.iter().filter(|s| profile.all_tokens.contains(*s)).count();
                if matched_subs > 0 {
                    score = score.max(0.60 * (matched_subs as f64 / name_subs.len().max(1) as f64));
                }
            }
            // Check parameter names
            let param_matches = item.defined_symbols.iter().filter(|p| profile.all_tokens.contains(&p.to_lowercase())).count();
            if param_matches > 0 {
                score = score.max(0.40 * (param_matches as f64).min(2.0));
            }
        }
        NodeKind::Class { name } => {
            let name_lower = name.to_lowercase();
            if profile.raw_tokens.contains(&name_lower) || profile.all_tokens.contains(&name_lower) {
                // Exact class name target in query -> strong boost
                score = score.max(0.95);
            } else {
                let name_subs = split_identifier_subtokens(name);
                let matched_subs = name_subs.iter().filter(|s| profile.all_tokens.contains(*s)).count();
                if matched_subs > 0 {
                    score = score.max(0.60 * (matched_subs as f64 / name_subs.len().max(1) as f64));
                }
            }
        }
        NodeKind::Statement => {
            // Give higher weight to statements that directly define or call query target symbols
            let def_matches = item.defined_symbols.iter().filter(|s| profile.raw_tokens.contains(&s.to_lowercase()) || profile.all_tokens.contains(&s.to_lowercase())).count();
            if def_matches > 0 {
                score = score.max(0.75);
            }
            let ref_matches = item.referenced_symbols.iter().filter(|s| profile.raw_tokens.contains(&s.to_lowercase())).count();
            if ref_matches > 0 {
                score = score.max(0.70);
            }
        }
        _ => {}
    }

    // Keyword & identifier lexical matching against raw query tokens
    let mut matched_raw_tokens = 0;
    for rt in &profile.raw_tokens {
        if item.tokens.iter().any(|it| it == rt)
            || item.defined_symbols.iter().any(|s| s.to_lowercase() == *rt)
            || item.referenced_symbols.iter().any(|s| s.to_lowercase() == *rt)
        {
            matched_raw_tokens += 1;
        }
    }

    if matched_raw_tokens > 0 {
        let raw_coverage = (matched_raw_tokens as f64) / (profile.raw_tokens.len().max(1) as f64);
        score = score.max(raw_coverage);
    }

    // Sub-token matching for camelCase / snake_case parts
    let mut matched_sub_tokens = 0;
    for st in &profile.all_tokens {
        if item.tokens.iter().any(|it| it == st) {
            matched_sub_tokens += 1;
        }
    }

    if matched_sub_tokens > 0 {
        let sub_coverage = (matched_sub_tokens as f64) / (profile.all_tokens.len().max(1) as f64);
        let mut item_matches = 0;
        for it in &item.tokens {
            if profile.all_tokens.contains(it) {
                item_matches += 1;
            }
        }
        let density = (item_matches as f64) / (item.tokens.len().max(1) as f64);

        // F1 harmonic mean between sub-token coverage and item token density
        let match_quality = (2.0 * sub_coverage * density) / (sub_coverage + density + 1e-6);

        // Suppress weak partial matches unless an exact symbol was already matched
        if match_quality >= 0.20 || score > 0.0 {
            score = score.max(sub_coverage.max(match_quality) * 0.85);
        }
    }

    // Phase 3: Adaptive gating adjustment
    if profile.intent == QueryIntent::Functional && score > 0.0 {
        score = (score + 0.05 * profile.gate.abs()).min(1.0);
    }

    score.min(1.0)
}
