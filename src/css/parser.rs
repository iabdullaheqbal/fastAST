//! CSS AST Parser using Tree-Sitter
//!
//! Extracts imports, rulesets, selectors, media queries, and keyframes.

use std::cell::RefCell;
use std::collections::HashSet;
use tree_sitter::{Node, Parser, Tree};

thread_local! {
    static CSS_PARSER: RefCell<Parser> = RefCell::new({
        let mut p = Parser::new();
        p.set_language(&tree_sitter_css::language()).expect("Failed to load CSS grammar");
        p
    });
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum CssNodeKind {
    Import,
    Charset,
    RuleSet {
        selectors: String,
    },
    Media {
        query: String,
    },
    Keyframes {
        name: String,
    },
    Supports {
        condition: String,
    },
    Comment,
    Other,
}

#[derive(Debug, Clone)]
pub struct CssScopeItem {
    pub id: usize,
    pub parent_id: Option<usize>,
    pub kind: CssNodeKind,
    pub start_byte: usize,
    pub end_byte: usize,
    pub start_row: usize,
    pub end_row: usize,
    /// Byte range of selector / header e.g. "header h1" or "@media (...)"
    pub header_byte_range: Option<(usize, usize)>,
    /// Byte range of declaration block "{ ... }"
    pub block_byte_range: Option<(usize, usize)>,
    /// Tokens for matching (selectors, properties, values)
    pub tokens: Vec<String>,
    pub defined_symbols: Vec<String>,
    pub children_ids: Vec<usize>,
}

pub fn parse_ast(code: &str) -> Result<Tree, String> {
    CSS_PARSER.with(|p| {
        p.borrow_mut()
            .parse(code, None)
            .ok_or_else(|| "Failed to parse CSS code".to_string())
    })
}

pub fn collect_scopes(tree: &Tree, source_bytes: &[u8]) -> Vec<CssScopeItem> {
    let mut items = Vec::new();
    let root = tree.root_node();
    walk_node(root, source_bytes, None, &mut items);
    items
}

fn walk_node(
    node: Node,
    source_bytes: &[u8],
    parent_id: Option<usize>,
    items: &mut Vec<CssScopeItem>,
) {
    let current_id = items.len();

    match node.kind() {
        "import_statement" => {
            let start_byte = node.start_byte();
            let end_byte = node.end_byte();
            let start_row = node.start_position().row;
            let end_row = node.end_position().row;
            let tokens = extract_all_identifiers(node, source_bytes);

            items.push(CssScopeItem {
                id: current_id,
                parent_id,
                kind: CssNodeKind::Import,
                start_byte,
                end_byte,
                start_row,
                end_row,
                header_byte_range: Some((start_byte, end_byte)),
                block_byte_range: None,
                tokens: tokens.clone(),
                defined_symbols: tokens,
                children_ids: Vec::new(),
            });

            if let Some(pid) = parent_id {
                items[pid].children_ids.push(current_id);
            }
            return;
        }
        "charset_statement" => {
            let start_byte = node.start_byte();
            let end_byte = node.end_byte();
            let start_row = node.start_position().row;
            let end_row = node.end_position().row;

            items.push(CssScopeItem {
                id: current_id,
                parent_id,
                kind: CssNodeKind::Charset,
                start_byte,
                end_byte,
                start_row,
                end_row,
                header_byte_range: Some((start_byte, end_byte)),
                block_byte_range: None,
                tokens: vec!["charset".to_string()],
                defined_symbols: vec!["charset".to_string()],
                children_ids: Vec::new(),
            });

            if let Some(pid) = parent_id {
                items[pid].children_ids.push(current_id);
            }
            return;
        }
        "rule_set" => {
            process_ruleset(node, source_bytes, parent_id, items);
            return;
        }
        "media_statement" => {
            process_media(node, source_bytes, parent_id, items);
            return;
        }
        "keyframes_statement" => {
            process_keyframes(node, source_bytes, parent_id, items);
            return;
        }
        "supports_statement" => {
            process_supports(node, source_bytes, parent_id, items);
            return;
        }
        "comment" => {
            let start_byte = node.start_byte();
            let end_byte = node.end_byte();
            let start_row = node.start_position().row;
            let end_row = node.end_position().row;

            items.push(CssScopeItem {
                id: current_id,
                parent_id,
                kind: CssNodeKind::Comment,
                start_byte,
                end_byte,
                start_row,
                end_row,
                header_byte_range: Some((start_byte, end_byte)),
                block_byte_range: None,
                tokens: Vec::new(),
                defined_symbols: Vec::new(),
                children_ids: Vec::new(),
            });

            if let Some(pid) = parent_id {
                items[pid].children_ids.push(current_id);
            }
            return;
        }
        _ => {}
    }

    let mut cursor = node.walk();
    for child in node.children(&mut cursor) {
        if child.is_named() {
            walk_node(child, source_bytes, parent_id, items);
        }
    }
}

fn process_ruleset(
    node: Node,
    source_bytes: &[u8],
    parent_id: Option<usize>,
    items: &mut Vec<CssScopeItem>,
) {
    let start_byte = node.start_byte();
    let end_byte = node.end_byte();
    let start_row = node.start_position().row;
    let end_row = node.end_position().row;

    let mut selectors = String::new();
    let mut block_range = None;
    let mut header_range = None;

    let mut cursor = node.walk();
    for child in node.children(&mut cursor) {
        match child.kind() {
            "selectors" => {
                if let Ok(text) = child.utf8_text(source_bytes) {
                    selectors = text.trim().to_string();
                }
                header_range = Some((child.start_byte(), child.end_byte()));
            }
            "block" => {
                block_range = Some((child.start_byte(), child.end_byte()));
                if header_range.is_none() {
                    header_range = Some((start_byte, child.start_byte()));
                }
            }
            _ => {}
        }
    }

    let mut tokens = extract_all_identifiers(node, source_bytes);
    let mut defined = Vec::new();
    for sel_part in selectors.split(|c: char| c == ',' || c == ' ' || c == '>' || c == '+' || c == '~') {
        let trimmed = sel_part.trim().trim_start_matches('.').trim_start_matches('#');
        if !trimmed.is_empty() {
            let lower = trimmed.to_lowercase();
            if !defined.contains(&lower) {
                defined.push(lower.clone());
            }
            if lower.contains('-') || lower.contains('_') {
                for p in lower.split(|c: char| c == '-' || c == '_') {
                    let part = p.trim().to_string();
                    if part.len() >= 2 && !defined.contains(&part) {
                        defined.push(part);
                    }
                }
            }
        }
    }

    for d in &defined {
        if !tokens.contains(d) {
            tokens.push(d.clone());
        }
    }

    let current_id = items.len();
    items.push(CssScopeItem {
        id: current_id,
        parent_id,
        kind: CssNodeKind::RuleSet { selectors },
        start_byte,
        end_byte,
        start_row,
        end_row,
        header_byte_range: header_range,
        block_byte_range: block_range,
        tokens,
        defined_symbols: defined,
        children_ids: Vec::new(),
    });

    if let Some(pid) = parent_id {
        items[pid].children_ids.push(current_id);
    }
}

fn process_media(
    node: Node,
    source_bytes: &[u8],
    parent_id: Option<usize>,
    items: &mut Vec<CssScopeItem>,
) {
    let start_byte = node.start_byte();
    let end_byte = node.end_byte();
    let start_row = node.start_position().row;
    let end_row = node.end_position().row;

    let mut query = String::from("@media");
    let mut block_node = None;

    let mut cursor = node.walk();
    for child in node.children(&mut cursor) {
        match child.kind() {
            "feature_query" | "binary_query" | "unary_query" | "parenthesized_query" => {
                if let Ok(text) = child.utf8_text(source_bytes) {
                    query = format!("@media {}", text.trim());
                }
            }
            "block" => {
                block_node = Some(child);
            }
            _ => {}
        }
    }

    let (header_range, block_range) = if let Some(b) = block_node {
        (
            Some((start_byte, b.start_byte())),
            Some((b.start_byte(), b.end_byte())),
        )
    } else {
        (Some((start_byte, end_byte)), None)
    };

    let mut tokens = vec!["media".to_string()];
    for word in query.split(|c: char| !c.is_alphanumeric() && c != '_') {
        let w = word.trim().to_lowercase();
        if w.len() >= 2 && !tokens.contains(&w) {
            tokens.push(w);
        }
    }
    let defined = tokens.clone();

    let current_id = items.len();
    items.push(CssScopeItem {
        id: current_id,
        parent_id,
        kind: CssNodeKind::Media { query },
        start_byte,
        end_byte,
        start_row,
        end_row,
        header_byte_range: header_range,
        block_byte_range: block_range,
        tokens,
        defined_symbols: defined,
        children_ids: Vec::new(),
    });

    if let Some(pid) = parent_id {
        items[pid].children_ids.push(current_id);
    }

    // Process nested rulesets inside media block
    if let Some(block) = block_node {
        let mut b_cursor = block.walk();
        for child in block.children(&mut b_cursor) {
            if child.is_named() {
                walk_node(child, source_bytes, Some(current_id), items);
            }
        }
    }
}

fn process_keyframes(
    node: Node,
    source_bytes: &[u8],
    parent_id: Option<usize>,
    items: &mut Vec<CssScopeItem>,
) {
    let start_byte = node.start_byte();
    let end_byte = node.end_byte();
    let start_row = node.start_position().row;
    let end_row = node.end_position().row;

    let mut name = String::new();
    let mut block_range = None;

    let mut cursor = node.walk();
    for child in node.children(&mut cursor) {
        match child.kind() {
            "keyframes_name" => {
                if let Ok(t) = child.utf8_text(source_bytes) {
                    name = t.trim().to_string();
                }
            }
            "keyframe_block_list" | "block" => {
                block_range = Some((child.start_byte(), child.end_byte()));
            }
            _ => {}
        }
    }

    let header_range = if let Some(b) = block_range {
        Some((start_byte, b.0))
    } else {
        Some((start_byte, end_byte))
    };

    let tokens = extract_all_identifiers(node, source_bytes);
    let mut defined = vec!["keyframes".to_string()];
    if !name.is_empty() {
        defined.push(name.to_lowercase());
    }

    let current_id = items.len();
    items.push(CssScopeItem {
        id: current_id,
        parent_id,
        kind: CssNodeKind::Keyframes { name },
        start_byte,
        end_byte,
        start_row,
        end_row,
        header_byte_range: header_range,
        block_byte_range: block_range,
        tokens,
        defined_symbols: defined,
        children_ids: Vec::new(),
    });

    if let Some(pid) = parent_id {
        items[pid].children_ids.push(current_id);
    }
}

fn process_supports(
    node: Node,
    source_bytes: &[u8],
    parent_id: Option<usize>,
    items: &mut Vec<CssScopeItem>,
) {
    let start_byte = node.start_byte();
    let end_byte = node.end_byte();
    let start_row = node.start_position().row;
    let end_row = node.end_position().row;

    let condition = node.utf8_text(source_bytes).unwrap_or("@supports").lines().next().unwrap_or("@supports").to_string();
    let tokens = extract_all_identifiers(node, source_bytes);

    let current_id = items.len();
    items.push(CssScopeItem {
        id: current_id,
        parent_id,
        kind: CssNodeKind::Supports { condition },
        start_byte,
        end_byte,
        start_row,
        end_row,
        header_byte_range: Some((start_byte, end_byte)),
        block_byte_range: None,
        tokens,
        defined_symbols: vec!["supports".to_string()],
        children_ids: Vec::new(),
    });

    if let Some(pid) = parent_id {
        items[pid].children_ids.push(current_id);
    }
}

fn extract_all_identifiers(node: Node, source_bytes: &[u8]) -> Vec<String> {
    let mut tokens = Vec::new();
    let mut seen = HashSet::new();
    collect_tokens_recursive(node, source_bytes, &mut tokens, &mut seen);
    tokens
}

fn collect_tokens_recursive(
    node: Node,
    source_bytes: &[u8],
    tokens: &mut Vec<String>,
    seen: &mut HashSet<String>,
) {
    match node.kind() {
        "tag_name" | "class_name" | "id_name" | "property_name" | "keyframes_name" | "feature_name" => {
            if let Ok(text) = node.utf8_text(source_bytes) {
                let lower = text.to_lowercase();
                if lower.len() >= 2 && seen.insert(lower.clone()) {
                    tokens.push(lower.clone());
                }
                if lower.contains('-') || lower.contains('_') {
                    for part in lower.split(|c: char| c == '-' || c == '_') {
                        let p = part.trim().to_lowercase();
                        if p.len() >= 2 && seen.insert(p.clone()) {
                            tokens.push(p);
                        }
                    }
                }
            }
        }
        "plain_value" | "string_value" => {
            if let Ok(text) = node.utf8_text(source_bytes) {
                for word in text.split(|c: char| !c.is_alphanumeric() && c != '_') {
                    let w = word.trim().to_lowercase();
                    if w.len() >= 2 && seen.insert(w.clone()) {
                        tokens.push(w);
                    }
                }
            }
        }
        _ => {}
    }

    let mut cursor = node.walk();
    for child in node.children(&mut cursor) {
        collect_tokens_recursive(child, source_bytes, tokens, seen);
    }
}
