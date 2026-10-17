//! Syntax-Preserving HTML Code Reconstructor

use crate::html::parser::{HtmlNodeKind, HtmlScopeItem};
use crate::html::scorer::HtmlDecision;

pub fn reconstruct_code(
    source_code: &str,
    items: &[HtmlScopeItem],
    decisions: &[HtmlDecision],
) -> String {
    if items.is_empty() {
        return source_code.to_string();
    }

    let mut output = String::new();

    for (i, item) in items.iter().enumerate() {
        if item.parent_id.is_some() {
            // Nested items handled by their parent container
            continue;
        }

        let decision = &decisions[i];
        if !decision.keep_full && !decision.keep_skeleton {
            continue;
        }

        if !output.is_empty() {
            output.push('\n');
        }

        if decision.keep_full {
            let snippet = &source_code[item.start_byte..item.end_byte];
            output.push_str(snippet.trim_end());
        } else if decision.keep_skeleton {
            reconstruct_element(source_code, items, decisions, i, &mut output);
        }
    }

    if output.is_empty() {
        return "<!-- empty -->".to_string();
    }

    output.push('\n');
    output
}

fn reconstruct_element(
    source_code: &str,
    items: &[HtmlScopeItem],
    decisions: &[HtmlDecision],
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

    // Emit open tag
    if let Some((open_start, open_end)) = item.open_tag_byte_range {
        let open_tag = &source_code[open_start..open_end];
        output.push_str(open_tag);
    }

    let is_void = match &item.kind {
        HtmlNodeKind::Element { is_void, .. } => *is_void,
        HtmlNodeKind::Doctype | HtmlNodeKind::Comment => true,
        _ => false,
    };

    if is_void {
        return;
    }

    // Process children
    let mut has_kept_child = false;
    for &cid in &item.children_ids {
        let c_dec = &decisions[cid];
        if c_dec.keep_full || c_dec.keep_skeleton {
            has_kept_child = true;
            output.push('\n');
            reconstruct_element(source_code, items, decisions, cid, output);
        }
    }

    if !has_kept_child {
        output.push_str("<!-- empty -->");
    } else {
        output.push('\n');
    }

    // Emit close tag
    if let Some((close_start, close_end)) = item.close_tag_byte_range {
        let close_tag = &source_code[close_start..close_end];
        output.push_str(close_tag);
    }
}
