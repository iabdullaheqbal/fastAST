//! Syntax-Preserving Java Code Reconstructor

use crate::java::parser::{JavaNodeKind, JavaScopeItem};
use crate::java::scorer::JavaDecision;

pub fn reconstruct_code(
    source_code: &str,
    items: &[JavaScopeItem],
    decisions: &[JavaDecision],
) -> String {
    if items.is_empty() {
        return source_code.to_string();
    }

    let mut output = String::new();

    // Preserve any leading package comments / license header before the first item
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
            // Inner members/classes are handled by their parent container
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
            JavaNodeKind::Package | JavaNodeKind::Import => {
                let snippet = &source_code[item.start_byte..item.end_byte];
                output.push_str(snippet.trim_end());
            }
            JavaNodeKind::Class { .. }
            | JavaNodeKind::Interface { .. }
            | JavaNodeKind::Enum { .. }
            | JavaNodeKind::Record { .. } => {
                reconstruct_type(source_code, items, decisions, i, 0, &mut output);
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

fn reconstruct_type(
    source_code: &str,
    items: &[JavaScopeItem],
    decisions: &[JavaDecision],
    idx: usize,
    indent_level: usize,
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

    let has_kept_children = item
        .children_ids
        .iter()
        .any(|&cid| decisions[cid].keep_full || decisions[cid].keep_skeleton);

    let sig = if let Some((sig_start, sig_end)) = item.signature_byte_range {
        &source_code[sig_start..sig_end]
    } else {
        match &item.kind {
            JavaNodeKind::Class { .. } => "class",
            JavaNodeKind::Interface { .. } => "interface",
            JavaNodeKind::Enum { .. } => "enum",
            JavaNodeKind::Record { .. } => "record",
            _ => "",
        }
    };

    if !has_kept_children {
        output.push_str(sig.trim_end());
        output.push_str(" {}");
        return;
    }

    output.push_str(sig.trim_end());
    output.push_str(" {\n");

    let indent = "    ".repeat(indent_level + 1);
    let mut first_member = true;

    for &cid in &item.children_ids {
        let child = &items[cid];
        let c_dec = &decisions[cid];

        if !c_dec.keep_full && !c_dec.keep_skeleton {
            continue;
        }

        if !first_member {
            output.push_str("\n\n");
        }
        first_member = false;

        match &child.kind {
            JavaNodeKind::Field { .. } => {
                let snippet = &source_code[child.start_byte..child.end_byte];
                output.push_str(&indent);
                output.push_str(snippet.trim());
            }
            JavaNodeKind::Constructor { .. } => {
                if c_dec.keep_full {
                    let snippet = &source_code[child.start_byte..child.end_byte];
                    output.push_str(&indent);
                    output.push_str(snippet.trim());
                } else {
                    if let Some((sig_start, sig_end)) = child.signature_byte_range {
                        let ms = &source_code[sig_start..sig_end];
                        output.push_str(&indent);
                        output.push_str(ms.trim());
                        output.push_str(" {}");
                    }
                }
            }
            JavaNodeKind::Method { return_type, .. } => {
                if c_dec.keep_full {
                    let snippet = &source_code[child.start_byte..child.end_byte];
                    output.push_str(&indent);
                    output.push_str(snippet.trim());
                } else {
                    if child.body_byte_range.is_none() {
                        // Semicolon-terminated signature (interface / abstract method)
                        let snippet = &source_code[child.start_byte..child.end_byte];
                        output.push_str(&indent);
                        output.push_str(snippet.trim());
                    } else if let Some((sig_start, sig_end)) = child.signature_byte_range {
                        let ms = &source_code[sig_start..sig_end];
                        let stub = stub_for_return_type(return_type);
                        output.push_str(&indent);
                        output.push_str(ms.trim());
                        output.push(' ');
                        output.push_str(stub);
                    }
                }
            }
            JavaNodeKind::Class { .. }
            | JavaNodeKind::Interface { .. }
            | JavaNodeKind::Enum { .. }
            | JavaNodeKind::Record { .. } => {
                output.push_str(&indent);
                reconstruct_type(source_code, items, decisions, cid, indent_level + 1, output);
            }
            _ => {
                if c_dec.keep_full {
                    let snippet = &source_code[child.start_byte..child.end_byte];
                    output.push_str(&indent);
                    output.push_str(snippet.trim());
                }
            }
        }
    }

    let closing_indent = "    ".repeat(indent_level);
    output.push('\n');
    output.push_str(&closing_indent);
    output.push('}');
}

fn stub_for_return_type(return_type: &str) -> &'static str {
    let trimmed = return_type.trim();
    match trimmed {
        "void" => "{}",
        "boolean" => "{ return false; }",
        "int" | "long" | "short" | "byte" | "char" => "{ return 0; }",
        "float" | "double" => "{ return 0.0; }",
        _ => "{ return null; }",
    }
}
