//! Syntax-Preserving TypeScript and TSX Code Reconstructor

use crate::typescript::parser::{TsNodeKind, TsScopeItem};
use crate::typescript::scorer::TsDecision;

pub fn reconstruct_code(
    source_code: &str,
    items: &[TsScopeItem],
    decisions: &[TsDecision],
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
            // Nested items (e.g. methods) are handled by their parent container
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
            TsNodeKind::Import => {
                let snippet = &source_code[item.start_byte..item.end_byte];
                output.push_str(snippet.trim_end());
            }
            TsNodeKind::Interface { .. } => {
                if decision.keep_full {
                    let snippet = &source_code[item.start_byte..item.end_byte];
                    output.push_str(snippet.trim_end());
                } else if decision.keep_skeleton {
                    if let Some((sig_start, sig_end)) = item.signature_byte_range {
                        let sig = &source_code[sig_start..sig_end];
                        output.push_str(sig.trim_end());
                        output.push_str(" {}");
                    } else {
                        let snippet = &source_code[item.start_byte..item.end_byte];
                        output.push_str(snippet.trim_end());
                    }
                }
            }
            TsNodeKind::TypeAlias { .. } => {
                // Type aliases are single declarations without blocks; emit full snippet
                let snippet = &source_code[item.start_byte..item.end_byte];
                output.push_str(snippet.trim_end());
            }
            TsNodeKind::Enum { .. } => {
                if decision.keep_full {
                    let snippet = &source_code[item.start_byte..item.end_byte];
                    output.push_str(snippet.trim_end());
                } else if decision.keep_skeleton {
                    if let Some((sig_start, sig_end)) = item.signature_byte_range {
                        let sig = &source_code[sig_start..sig_end];
                        output.push_str(sig.trim_end());
                        output.push_str(" {}");
                    } else {
                        let snippet = &source_code[item.start_byte..item.end_byte];
                        output.push_str(snippet.trim_end());
                    }
                }
            }
            TsNodeKind::Function { .. } => {
                if decision.keep_full {
                    let snippet = &source_code[item.start_byte..item.end_byte];
                    output.push_str(snippet.trim_end());
                } else if decision.keep_skeleton {
                    // Emit signature + {}
                    if let Some((sig_start, sig_end)) = item.signature_byte_range {
                        let sig = &source_code[sig_start..sig_end];
                        output.push_str(sig.trim_end());
                        output.push_str(" {}");
                    } else {
                        let snippet = &source_code[item.start_byte..item.end_byte];
                        output.push_str(snippet.trim_end());
                    }
                }
            }
            TsNodeKind::ArrowFunction { .. } => {
                if decision.keep_full {
                    let snippet = &source_code[item.start_byte..item.end_byte];
                    output.push_str(snippet.trim_end());
                } else if decision.keep_skeleton {
                    if let Some((sig_start, sig_end)) = item.signature_byte_range {
                        let sig = &source_code[sig_start..sig_end];
                        output.push_str(sig.trim_end());
                        output.push_str(" {};");
                    } else {
                        let snippet = &source_code[item.start_byte..item.end_byte];
                        output.push_str(snippet.trim_end());
                    }
                }
            }
            TsNodeKind::Class { .. } => {
                if decision.keep_full {
                    let snippet = &source_code[item.start_byte..item.end_byte];
                    output.push_str(snippet.trim_end());
                } else if decision.keep_skeleton {
                    // Check if any child methods are kept
                    let has_child_methods = item
                        .children_ids
                        .iter()
                        .any(|&cid| decisions[cid].keep_full || decisions[cid].keep_skeleton);

                    let sig = if let Some((sig_start, sig_end)) = item.signature_byte_range {
                        &source_code[sig_start..sig_end]
                    } else {
                        "class"
                    };

                    if !has_child_methods {
                        // Empty class skeleton
                        output.push_str(sig.trim_end());
                        output.push_str(" {}");
                    } else {
                        // Reconstruct class with kept methods
                        output.push_str(sig.trim_end());
                        output.push_str(" {\n");

                        let mut first_method = true;
                        for &cid in &item.children_ids {
                            let method_item = &items[cid];
                            let method_decision = &decisions[cid];

                            if !method_decision.keep_full && !method_decision.keep_skeleton {
                                continue;
                            }

                            if !first_method {
                                output.push_str("\n\n");
                            }
                            first_method = false;

                            let indent = "    ";
                            if method_decision.keep_full {
                                let m_snippet = &source_code[method_item.start_byte..method_item.end_byte];
                                if !m_snippet.starts_with(char::is_whitespace) {
                                    output.push_str(indent);
                                }
                                output.push_str(m_snippet.trim_end());
                            } else if method_decision.keep_skeleton {
                                if let Some((ms_start, ms_end)) = method_item.signature_byte_range {
                                    let ms = &source_code[ms_start..ms_end];
                                    let trimmed = ms.trim();
                                    output.push_str(indent);
                                    output.push_str(trimmed);
                                    output.push_str(" {}");
                                }
                            }
                        }

                        output.push_str("\n}");
                    }
                }
            }
            TsNodeKind::Statement | TsNodeKind::Block | TsNodeKind::Other => {
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
