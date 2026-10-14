use crate::parser::{NodeKind, ScopeItem};
use crate::scorer::Decision;

pub fn reconstruct_code(
    lines: &[&str],
    items: &[ScopeItem],
    decisions: &[Decision],
) -> String {
    let mut output_lines: Vec<String> = Vec::new();
    let mut last_emitted_row: Option<usize> = None;

    // Filter top-level items
    let top_level_indices: Vec<usize> = items
        .iter()
        .enumerate()
        .filter(|(_, it)| it.parent_idx.is_none())
        .map(|(i, _)| i)
        .collect();

    for &idx in &top_level_indices {
        let item = &items[idx];
        let dec = &decisions[idx];

        // Add a blank line separator between top-level definitions if needed
        if !output_lines.is_empty() {
            if let Some(last) = last_emitted_row {
                if item.start_row > last + 1 {
                    output_lines.push(String::new());
                }
            }
        }

        match &item.kind {
            NodeKind::Import | NodeKind::ModuleDocstring => {
                if dec.keep_full {
                    emit_span(lines, item.start_row, item.end_row, &mut output_lines);
                    last_emitted_row = Some(item.end_row);
                }
            }
            NodeKind::Function { .. } => {
                if dec.keep_full {
                    emit_span(lines, item.start_row, item.end_row, &mut output_lines);
                    last_emitted_row = Some(item.end_row);
                } else if dec.keep_skeleton {
                    // Emit signature (including any decorators)
                    emit_span(lines, item.start_row, item.sig_end_row, &mut output_lines);
                    // Insert pass body
                    output_lines.push(format!("{}pass", item.body_indent));
                    last_emitted_row = Some(item.end_row);
                }
            }
            NodeKind::Class { .. } => {
                // Check if any children are kept full
                let has_full_child = item.child_indices.iter().any(|&cidx| decisions[cidx].keep_full);

                if has_full_child {
                    // Emit class header
                    emit_span(lines, item.start_row, item.sig_end_row, &mut output_lines);
                    let mut class_last_row = item.sig_end_row;

                    // Emit class docstring if present
                    if let Some((ds_start, ds_end)) = item.docstring_rows {
                        emit_span(lines, ds_start, ds_end, &mut output_lines);
                        class_last_row = ds_end;
                    }

                    // Process child methods and statements
                    let mut emitted_any_child = false;
                    for &cidx in &item.child_indices {
                        let child = &items[cidx];
                        let cdec = &decisions[cidx];

                        if cdec.keep_full {
                            emit_span(lines, child.start_row, child.end_row, &mut output_lines);
                            class_last_row = child.end_row;
                            emitted_any_child = true;
                        } else if cdec.keep_skeleton {
                            emit_span(lines, child.start_row, child.sig_end_row, &mut output_lines);
                            output_lines.push(format!("{}pass", child.body_indent));
                            class_last_row = child.end_row;
                            emitted_any_child = true;
                        }
                    }

                    if !emitted_any_child {
                        output_lines.push(format!("{}pass", item.body_indent));
                    }
                    last_emitted_row = Some(item.end_row.max(class_last_row));
                } else if dec.keep_skeleton || dec.keep_full {
                    // Class header + pass
                    emit_span(lines, item.start_row, item.sig_end_row, &mut output_lines);
                    output_lines.push(format!("{}pass", item.body_indent));
                    last_emitted_row = Some(item.end_row);
                }
            }
            NodeKind::Other => {
                if dec.keep_full {
                    emit_span(lines, item.start_row, item.end_row, &mut output_lines);
                    last_emitted_row = Some(item.end_row);
                }
            }
        }
    }

    let mut result = output_lines.join("\n");
    if !result.is_empty() && !result.ends_with('\n') {
        result.push('\n');
    }
    result
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

