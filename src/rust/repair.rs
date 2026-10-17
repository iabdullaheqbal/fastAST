//! Syntax-Preserving Rust Code Reconstructor

use crate::rust::parser::{RustNodeKind, RustScopeItem};
use crate::rust::scorer::RustDecision;

pub fn reconstruct_code(
    source_code: &str,
    items: &[RustScopeItem],
    decisions: &[RustDecision],
) -> String {
    if items.is_empty() {
        return source_code.to_string();
    }

    let mut output = String::new();

    // Preserve any leading doc comment or license header before the first item
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
            // Nested items inside impl, trait, or inline mod are handled by parent
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
            RustNodeKind::Use
            | RustNodeKind::Const { .. }
            | RustNodeKind::Static { .. }
            | RustNodeKind::TypeAlias { .. }
            | RustNodeKind::MacroDef { .. } => {
                let snippet = &source_code[item.start_byte..item.end_byte];
                output.push_str(snippet.trim_end());
            }
            RustNodeKind::Struct { .. } | RustNodeKind::Enum { .. } => {
                let snippet = &source_code[item.start_byte..item.end_byte];
                output.push_str(snippet.trim_end());
            }
            RustNodeKind::Function { has_body, .. } => {
                if decision.keep_full {
                    let snippet = &source_code[item.start_byte..item.end_byte];
                    output.push_str(snippet.trim_end());
                } else if decision.keep_skeleton {
                    if let Some((sig_start, sig_end)) = item.signature_byte_range {
                        let sig = &source_code[sig_start..sig_end].trim_end();
                        if *has_body {
                            output.push_str(sig);
                            output.push_str(" { todo!() }");
                        } else {
                            output.push_str(sig);
                            if !sig.ends_with(';') {
                                output.push(';');
                            }
                        }
                    }
                }
            }
            RustNodeKind::Trait { .. } => {
                reconstruct_trait(source_code, items, decisions, i, &mut output);
            }
            RustNodeKind::Impl { .. } => {
                reconstruct_impl(source_code, items, decisions, i, &mut output);
            }
            RustNodeKind::Mod { is_inline, .. } => {
                if !*is_inline {
                    let snippet = &source_code[item.start_byte..item.end_byte];
                    output.push_str(snippet.trim_end());
                } else {
                    reconstruct_mod(source_code, items, decisions, i, &mut output);
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

pub fn append_reindented_node(
    output: &mut String,
    source_code: &str,
    start_byte: usize,
    end_byte: usize,
    indent: &str,
) {
    if start_byte >= end_byte || end_byte > source_code.len() {
        return;
    }
    let snippet = &source_code[start_byte..end_byte];
    let lines: Vec<&str> = snippet.lines().collect();
    if lines.is_empty() {
        return;
    }

    let line_start = source_code[..start_byte].rfind('\n').map(|p| p + 1).unwrap_or(0);
    let base_indent_len = source_code[line_start..start_byte]
        .chars()
        .take_while(|c| c.is_whitespace())
        .count();

    for (i, line) in lines.iter().enumerate() {
        if !output.ends_with('\n') {
            output.push('\n');
        }
        if line.trim().is_empty() {
            continue;
        }
        output.push_str(indent);
        let line_indent_len = line.chars().take_while(|c| c.is_whitespace()).count();
        if i == 0 {
            output.push_str(line.trim_start());
        } else if line_indent_len >= base_indent_len {
            output.push_str(&line[base_indent_len..]);
        } else {
            output.push_str(line.trim_start());
        }
    }
}

pub fn append_reindented_lines(output: &mut String, text: &str, indent: &str) {
    for line in text.lines() {
        if !output.ends_with('\n') {
            output.push('\n');
        }
        if line.trim().is_empty() {
            continue;
        }
        output.push_str(indent);
        output.push_str(line);
    }
}

fn reconstruct_impl(
    source_code: &str,
    items: &[RustScopeItem],
    decisions: &[RustDecision],
    idx: usize,
    output: &mut String,
) {
    let item = &items[idx];
    let decision = &decisions[idx];

    if decision.keep_full {
        let snippet = &source_code[item.start_byte..item.end_byte];
        output.push_str(snippet.trim_end());
        return;
    }

    if !decision.keep_skeleton {
        return;
    }

    let sig = if let Some((sig_start, sig_end)) = item.signature_byte_range {
        source_code[sig_start..sig_end].trim_end()
    } else {
        "impl"
    };

    output.push_str(sig);
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
            append_reindented_node(output, source_code, child.start_byte, child.end_byte, "    ");
        } else if c_dec.keep_skeleton {
            match &child.kind {
                RustNodeKind::Function { has_body, .. } => {
                    if let Some((csig_start, csig_end)) = child.signature_byte_range {
                        let csig = source_code[csig_start..csig_end].trim();
                        if !output.ends_with('\n') {
                            output.push('\n');
                        }
                        output.push_str("    ");
                        output.push_str(csig);
                        if *has_body {
                            output.push_str(" { todo!() }");
                        } else if !csig.ends_with(';') {
                            output.push(';');
                        }
                    }
                }
                _ => {
                    append_reindented_node(output, source_code, child.start_byte, child.end_byte, "    ");
                }
            }
        }
    }

    if !output.ends_with('\n') {
        output.push('\n');
    }
    output.push('}');
}

fn reconstruct_trait(
    source_code: &str,
    items: &[RustScopeItem],
    decisions: &[RustDecision],
    idx: usize,
    output: &mut String,
) {
    let item = &items[idx];
    let decision = &decisions[idx];

    if decision.keep_full {
        let snippet = &source_code[item.start_byte..item.end_byte];
        output.push_str(snippet.trim_end());
        return;
    }

    if !decision.keep_skeleton {
        return;
    }

    let sig = if let Some((sig_start, sig_end)) = item.signature_byte_range {
        source_code[sig_start..sig_end].trim_end()
    } else {
        "trait"
    };

    output.push_str(sig);
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
            append_reindented_node(output, source_code, child.start_byte, child.end_byte, "    ");
        } else if c_dec.keep_skeleton {
            if let Some((csig_start, csig_end)) = child.signature_byte_range {
                let csig = source_code[csig_start..csig_end].trim();
                if !output.ends_with('\n') {
                    output.push('\n');
                }
                output.push_str("    ");
                output.push_str(csig);
                if let RustNodeKind::Function { has_body, .. } = &child.kind {
                    if *has_body {
                        output.push_str(" { todo!() }");
                    } else if !csig.ends_with(';') {
                        output.push(';');
                    }
                } else if !csig.ends_with(';') {
                    output.push(';');
                }
            }
        }
    }

    if !output.ends_with('\n') {
        output.push('\n');
    }
    output.push('}');
}

fn reconstruct_mod(
    source_code: &str,
    items: &[RustScopeItem],
    decisions: &[RustDecision],
    idx: usize,
    output: &mut String,
) {
    let item = &items[idx];
    let decision = &decisions[idx];

    if decision.keep_full {
        let snippet = &source_code[item.start_byte..item.end_byte];
        output.push_str(snippet.trim_end());
        return;
    }

    if !decision.keep_skeleton {
        return;
    }

    let sig = if let Some((sig_start, sig_end)) = item.signature_byte_range {
        source_code[sig_start..sig_end].trim_end()
    } else {
        "mod"
    };

    output.push_str(sig);
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

        match &child.kind {
            RustNodeKind::Impl { .. } => {
                let mut buf = String::new();
                reconstruct_impl(source_code, items, decisions, cid, &mut buf);
                append_reindented_lines(output, &buf, "    ");
            }
            RustNodeKind::Trait { .. } => {
                let mut buf = String::new();
                reconstruct_trait(source_code, items, decisions, cid, &mut buf);
                append_reindented_lines(output, &buf, "    ");
            }
            RustNodeKind::Mod { is_inline: true, .. } => {
                let mut buf = String::new();
                reconstruct_mod(source_code, items, decisions, cid, &mut buf);
                append_reindented_lines(output, &buf, "    ");
            }
            RustNodeKind::Function { has_body, .. } => {
                if c_dec.keep_full {
                    append_reindented_node(output, source_code, child.start_byte, child.end_byte, "    ");
                } else if c_dec.keep_skeleton {
                    if let Some((csig_start, csig_end)) = child.signature_byte_range {
                        let csig = source_code[csig_start..csig_end].trim();
                        if !output.ends_with('\n') {
                            output.push('\n');
                        }
                        output.push_str("    ");
                        output.push_str(csig);
                        if *has_body {
                            output.push_str(" { todo!() }");
                        } else if !csig.ends_with(';') {
                            output.push(';');
                        }
                    }
                }
            }
            _ => {
                append_reindented_node(output, source_code, child.start_byte, child.end_byte, "    ");
            }
        }
    }

    if !output.ends_with('\n') {
        output.push('\n');
    }
    output.push('}');
}
