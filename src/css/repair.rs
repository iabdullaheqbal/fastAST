//! Syntax-Preserving CSS Code Reconstructor

use crate::css::parser::{CssNodeKind, CssScopeItem};
use crate::css::scorer::CssDecision;

pub fn reconstruct_code(
    source_code: &str,
    items: &[CssScopeItem],
    decisions: &[CssDecision],
) -> String {
    if items.is_empty() {
        return source_code.to_string();
    }

    let mut output = String::new();

    // Preserve any leading comments before the first item
    let first_item_start = items.iter().map(|it| it.start_byte).min().unwrap_or(0);
    if first_item_start > 0 {
        let prefix = source_code[..first_item_start].trim_end();
        if !prefix.is_empty() {
            output.push_str(prefix);
            output.push_str("\n\n");
        }
    }

    let mut first = output.is_empty();
    for (i, item) in items.iter().enumerate() {
        if item.parent_id.is_some() {
            // Nested rulesets handled inside @media
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
            CssNodeKind::Import | CssNodeKind::Charset => {
                let snippet = &source_code[item.start_byte..item.end_byte];
                output.push_str(snippet.trim_end());
            }
            CssNodeKind::RuleSet { selectors } => {
                if decision.keep_full {
                    let snippet = &source_code[item.start_byte..item.end_byte];
                    output.push_str(snippet.trim_end());
                } else if decision.keep_skeleton {
                    output.push_str(selectors);
                    output.push_str(" {}");
                }
            }
            CssNodeKind::Media { query } => {
                if decision.keep_full {
                    let snippet = &source_code[item.start_byte..item.end_byte];
                    output.push_str(snippet.trim_end());
                } else if decision.keep_skeleton {
                    output.push_str(query);
                    output.push_str(" {\n");

                    let mut first_child = true;
                    for &cid in &item.children_ids {
                        let child = &items[cid];
                        let c_dec = &decisions[cid];

                        if !c_dec.keep_full && !c_dec.keep_skeleton {
                            continue;
                        }

                        if !first_child {
                            output.push_str("\n\n");
                        }
                        first_child = false;

                        if c_dec.keep_full {
                            let snippet = &source_code[child.start_byte..child.end_byte];
                            for line in snippet.lines() {
                                output.push_str("    ");
                                output.push_str(line);
                                output.push('\n');
                            }
                            // Strip trailing newline added by loop
                            if output.ends_with('\n') {
                                output.pop();
                            }
                        } else if c_dec.keep_skeleton {
                            if let CssNodeKind::RuleSet { ref selectors } = child.kind {
                                output.push_str("    ");
                                output.push_str(selectors);
                                output.push_str(" {}");
                            }
                        }
                    }

                    output.push_str("\n}");
                }
            }
            CssNodeKind::Keyframes { .. } | CssNodeKind::Supports { .. } => {
                if decision.keep_full {
                    let snippet = &source_code[item.start_byte..item.end_byte];
                    output.push_str(snippet.trim_end());
                }
            }
            _ => {
                if decision.keep_full {
                    let snippet = &source_code[item.start_byte..item.end_byte];
                    output.push_str(snippet.trim_end());
                }
            }
        }
    }

    if output.is_empty() {
        return "/* empty */".to_string();
    }

    output.push('\n');
    output
}
