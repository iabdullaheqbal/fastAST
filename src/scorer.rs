use crate::parser::{ControlFlowType, NodeKind, ScopeItem};
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
            NodeKind::Function { .. }
            | NodeKind::Class { .. }
            | NodeKind::ControlFlow { .. }
            | NodeKind::Statement
            | NodeKind::Other => {
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

    // --- DEPENDENCY CLOSURE (LaMR Phase 1) ---
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
