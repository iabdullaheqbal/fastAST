//! Syntax-Preserving JavaScript and JSX Code Reconstructor

use crate::javascript::parser::{JsNodeKind, JsScopeItem};
use crate::javascript::scorer::JsDecision;

pub fn reconstruct_code(
    source_code: &str,
    items: &[JsScopeItem],
    decisions: &[JsDecision],
) -> String {
    if items.is_empty() {
        return source_code.to_string();
    }

    let mut output = String::new();

    // Preserve any leading module comments / license header before the first item
    let first_item_start = items.iter().map(|it| it.start_byte).min().unwrap_or(0);
    if first_item_start > 0 {
        let prefix = source_code[..first_item_start].trim_end();
        if !prefix.is_empty() {
            output.push_str(prefix);
            output.push_str("\n\n");
        }
    }

    // Process top-level items
    let mut first = output.is_empty();
    for (i, item) in items.iter().enumerate() {
        if item.parent_id.is_some() {
            // Nested items (e.g. methods or inner helpers) are handled by their parent container
            continue;
        }

        let decision = &decisions[i];
        if !decision.keep_full && !decision.keep_skeleton {
            continue;
        }

        if !first {
            output.push_str("\n\n");
        }
        first = false;

        match &item.kind {
            JsNodeKind::Import => {
                let snippet = &source_code[item.start_byte..item.end_byte];
                output.push_str(snippet.trim_end());
            }
            JsNodeKind::Function { .. } => {
                if decision.keep_full {
                    let snippet = &source_code[item.start_byte..item.end_byte];
                    output.push_str(snippet.trim_end());
                } else if decision.keep_skeleton {
                    if let Some((sig_start, sig_end)) = item.signature_byte_range {
                        let sig = source_code[sig_start..sig_end].trim_end();
                        if sig.ends_with('}') {
                            output.push_str(sig);
                        } else {
                            output.push_str(sig);
                            output.push_str(" {}");
                        }
                    } else {
                        let snippet = &source_code[item.start_byte..item.end_byte];
                        output.push_str(snippet.trim_end());
                    }
                }
            }
            JsNodeKind::ArrowFunction { .. } => {
                if decision.keep_full {
                    let snippet = &source_code[item.start_byte..item.end_byte];
                    output.push_str(snippet.trim_end());
                } else if decision.keep_skeleton {
                    if let Some((sig_start, sig_end)) = item.signature_byte_range {
                        let sig = source_code[sig_start..sig_end].trim_end();
                        if sig.ends_with("};") || sig.ends_with('}') {
                            output.push_str(sig);
                        } else if sig.ends_with(';') {
                            output.push_str(sig.trim_end_matches(';').trim_end());
                            output.push_str(" {};");
                        } else {
                            output.push_str(sig);
                            output.push_str(" {};");
                        }
                    } else {
                        let snippet = &source_code[item.start_byte..item.end_byte];
                        output.push_str(snippet.trim_end());
                    }
                }
            }
            JsNodeKind::Class { .. } => {
                if decision.keep_full {
                    let snippet = &source_code[item.start_byte..item.end_byte];
                    output.push_str(snippet.trim_end());
                } else if decision.keep_skeleton {
                    let has_child_items = item
                        .children_ids
                        .iter()
                        .any(|&cid| decisions[cid].keep_full || decisions[cid].keep_skeleton);

                    let sig = if let Some((sig_start, sig_end)) = item.signature_byte_range {
                        &source_code[sig_start..sig_end]
                    } else {
                        "class"
                    };

                    if !has_child_items {
                        // Empty class skeleton
                        output.push_str(sig.trim_end());
                        output.push_str(" {}");
                    } else {
                        // Reconstruct class with kept methods/fields
                        output.push_str(sig.trim_end());
                        output.push_str(" {\n");

                        let mut first_member = true;
                        for &cid in &item.children_ids {
                            let member_item = &items[cid];
                            let member_decision = &decisions[cid];

                            if !member_decision.keep_full && !member_decision.keep_skeleton {
                                continue;
                            }

                            if !first_member {
                                output.push_str("\n\n");
                            }
                            first_member = false;

                            let indent = "    ";
                            match &member_item.kind {
                                JsNodeKind::Method { .. } => {
                                    if member_decision.keep_full {
                                        let m_snippet = &source_code[member_item.start_byte..member_item.end_byte];
                                        if !m_snippet.starts_with(char::is_whitespace) {
                                            output.push_str(indent);
                                        }
                                        output.push_str(m_snippet.trim_end());
                                    } else if member_decision.keep_skeleton {
                                        if let Some((ms_start, ms_end)) = member_item.signature_byte_range {
                                            let ms = &source_code[ms_start..ms_end];
                                            let trimmed = ms.trim();
                                            output.push_str(indent);
                                            output.push_str(trimmed);
                                            output.push_str(" {}");
                                        }
                                    }
                                }
                                JsNodeKind::Field { is_arrow, .. } => {
                                    if member_decision.keep_full {
                                        let f_snippet = &source_code[member_item.start_byte..member_item.end_byte];
                                        if !f_snippet.starts_with(char::is_whitespace) {
                                            output.push_str(indent);
                                        }
                                        output.push_str(f_snippet.trim_end());
                                    } else if member_decision.keep_skeleton && *is_arrow {
                                        if let Some((fs_start, fs_end)) = member_item.signature_byte_range {
                                            let fs = &source_code[fs_start..fs_end];
                                            let trimmed = fs.trim();
                                            output.push_str(indent);
                                            output.push_str(trimmed);
                                            output.push_str(" {};");
                                        }
                                    }
                                }
                                _ => {
                                    if member_decision.keep_full {
                                        let snippet = &source_code[member_item.start_byte..member_item.end_byte];
                                        if !snippet.starts_with(char::is_whitespace) {
                                            output.push_str(indent);
                                        }
                                        output.push_str(snippet.trim_end());
                                    }
                                }
                            }
                        }

                        output.push_str("\n}");
                    }
                }
            }
            JsNodeKind::Statement | JsNodeKind::Block | JsNodeKind::Other => {
                if decision.keep_full {
                    let snippet = &source_code[item.start_byte..item.end_byte];
                    output.push_str(snippet.trim_end());
                }
            }
            _ => {}
        }
    }

    if output.is_empty() {
        return "/* empty */".to_string();
    }

    output.push('\n');
    output
}
