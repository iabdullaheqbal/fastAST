use crate::parser::{NodeKind, ScopeItem};
use crate::scorer::Decision;

pub fn reconstruct_code(
    lines: &[&str],
    items: &[ScopeItem],
    decisions: &[Decision],
) -> String {
    let mut output_lines: Vec<String> = Vec::new();
    let mut last_emitted_row: Option<usize> = None;

    // Filter top-level items (parent_idx is None)
    let top_level_indices: Vec<usize> = items
        .iter()
        .enumerate()
        .filter(|(_, it)| it.parent_idx.is_none())
        .map(|(i, _)| i)
        .collect();

    for &idx in &top_level_indices {
        let item = &items[idx];
        let dec = &decisions[idx];

        if !dec.keep_full && !dec.keep_skeleton {
            continue;
        }

        // Add a blank line separator between top-level definitions if needed
        if !output_lines.is_empty() {
            if let Some(last) = last_emitted_row {
                if item.start_row > last + 1 {
                    output_lines.push(String::new());
                }
            }
        }

        emit_item(
            idx,
            lines,
            items,
            decisions,
            &mut output_lines,
            &mut last_emitted_row,
        );
    }

    let mut result = output_lines.join("\n");
    if !result.is_empty() && !result.ends_with('\n') {
        result.push('\n');
    }
    result
}

fn emit_item(
    idx: usize,
    lines: &[&str],
    items: &[ScopeItem],
    decisions: &[Decision],
    out: &mut Vec<String>,
    last_emitted_row: &mut Option<usize>,
) -> bool {
    let item = &items[idx];
    let dec = &decisions[idx];

    if !dec.keep_full && !dec.keep_skeleton {
        return false;
    }

    match &item.kind {
        NodeKind::Import | NodeKind::ModuleDocstring => {
            if dec.keep_full {
                emit_span(lines, item.start_row, item.end_row, out);
                *last_emitted_row = Some(item.end_row);
                return true;
            }
        }
        NodeKind::Statement | NodeKind::Other => {
            if dec.keep_full {
                emit_span(lines, item.start_row, item.end_row, out);
                *last_emitted_row = Some(item.end_row);
                return true;
            }
        }
        NodeKind::Function { .. } => {
            let has_full = dec.keep_full || has_any_full_descendant(idx, items, decisions);

            if has_full {
                let all_descendants_full = are_all_descendants_full(idx, items, decisions);
                if all_descendants_full && dec.keep_full {
                    emit_span(lines, item.start_row, item.end_row, out);
                    *last_emitted_row = Some(item.end_row);
                    return true;
                } else {
                    emit_span(lines, item.start_row, item.sig_end_row, out);
                    if let Some((ds_start, ds_end)) = item.docstring_rows {
                        emit_span(lines, ds_start, ds_end, out);
                    }
                    let mut emitted_any = false;
                    for &cidx in &item.child_indices {
                        if emit_item(cidx, lines, items, decisions, out, last_emitted_row) {
                            emitted_any = true;
                        }
                    }
                    if !emitted_any {
                        out.push(format!("{}pass", item.body_indent));
                    }
                    *last_emitted_row = Some(item.end_row);
                    return true;
                }
            } else if dec.keep_skeleton {
                emit_span(lines, item.start_row, item.sig_end_row, out);
                out.push(format!("{}pass", item.body_indent));
                *last_emitted_row = Some(item.end_row);
                return true;
            }
        }
        NodeKind::Class { .. } => {
            let has_full_descendant = has_any_full_descendant(idx, items, decisions);

            if has_full_descendant {
                emit_span(lines, item.start_row, item.sig_end_row, out);
                if let Some((ds_start, ds_end)) = item.docstring_rows {
                    emit_span(lines, ds_start, ds_end, out);
                }
                let mut emitted_any = false;
                for &cidx in &item.child_indices {
                    if emit_item(cidx, lines, items, decisions, out, last_emitted_row) {
                        emitted_any = true;
                    }
                }
                if !emitted_any {
                    out.push(format!("{}pass", item.body_indent));
                }
                *last_emitted_row = Some(item.end_row);
                return true;
            } else if dec.keep_skeleton || dec.keep_full {
                emit_span(lines, item.start_row, item.sig_end_row, out);
                out.push(format!("{}pass", item.body_indent));
                *last_emitted_row = Some(item.end_row);
                return true;
            }
        }
        NodeKind::ControlFlow { .. } => {
            if dec.keep_full {
                emit_span(lines, item.start_row, item.sig_end_row, out);
                let mut emitted_any = false;
                for &cidx in &item.child_indices {
                    if emit_item(cidx, lines, items, decisions, out, last_emitted_row) {
                        emitted_any = true;
                    }
                }
                if !emitted_any {
                    out.push(format!("{}pass", item.body_indent));
                }
                *last_emitted_row = Some(item.end_row);
                return true;
            }
        }
    }
    false
}

fn has_any_full_descendant(
    idx: usize,
    items: &[ScopeItem],
    decisions: &[Decision],
) -> bool {
    for &cidx in &items[idx].child_indices {
        if decisions[cidx].keep_full {
            return true;
        }
        if has_any_full_descendant(cidx, items, decisions) {
            return true;
        }
    }
    false
}

fn are_all_descendants_full(
    idx: usize,
    items: &[ScopeItem],
    decisions: &[Decision],
) -> bool {
    for &cidx in &items[idx].child_indices {
        if !decisions[cidx].keep_full {
            return false;
        }
        if !are_all_descendants_full(cidx, items, decisions) {
            return false;
        }
    }
    true
}

fn emit_span(lines: &[&str], start: usize, end: usize, out: &mut Vec<String>) {
    let actual_start = start.min(lines.len());
    let actual_end = end.min(lines.len().saturating_sub(1));
    for i in actual_start..=actual_end {
        if let Some(line) = lines.get(i) {
            out.push(line.to_string());
        }
    }
}
