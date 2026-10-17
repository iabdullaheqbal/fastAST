//! HTML AST Parser using Tree-Sitter
//!
//! Extracts doctype, elements, tags, attributes (id, class, etc.), and DOM hierarchy.

use std::cell::RefCell;
use std::collections::HashSet;
use tree_sitter::{Node, Parser, Tree};

thread_local! {
    static HTML_PARSER: RefCell<Parser> = RefCell::new({
        let mut p = Parser::new();
        p.set_language(&tree_sitter_html::language()).expect("Failed to load HTML grammar");
        p
    });
}

const VOID_TAGS: &[&str] = &[
    "area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta",
    "param", "source", "track", "wbr",
];

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum HtmlNodeKind {
    Doctype,
    Element {
        tag_name: String,
        id: Option<String>,
        classes: Vec<String>,
        is_void: bool,
    },
    Script,
    Style,
    Comment,
    Other,
}

#[derive(Debug, Clone)]
pub struct HtmlScopeItem {
    pub id: usize,
    pub parent_id: Option<usize>,
    pub kind: HtmlNodeKind,
    pub start_byte: usize,
    pub end_byte: usize,
    pub start_row: usize,
    pub end_row: usize,
    /// Byte range of open tag `<tag ...>`
    pub open_tag_byte_range: Option<(usize, usize)>,
    /// Byte range of close tag `</tag>`
    pub close_tag_byte_range: Option<(usize, usize)>,
    /// Tokens for matching (tag name, id, classes, text)
    pub tokens: Vec<String>,
    pub defined_symbols: Vec<String>,
    pub children_ids: Vec<usize>,
}

pub fn parse_ast(code: &str) -> Result<Tree, String> {
    HTML_PARSER.with(|p| {
        p.borrow_mut()
            .parse(code, None)
            .ok_or_else(|| "Failed to parse HTML code".to_string())
    })
}

pub fn collect_scopes(tree: &Tree, source_bytes: &[u8]) -> Vec<HtmlScopeItem> {
    let mut items = Vec::new();
    let root = tree.root_node();
    walk_node(root, source_bytes, None, &mut items);
    items
}

fn walk_node(
    node: Node,
    source_bytes: &[u8],
    parent_id: Option<usize>,
    items: &mut Vec<HtmlScopeItem>,
) {
    let current_id = items.len();

    match node.kind() {
        "doctype" => {
            let start_byte = node.start_byte();
            let end_byte = node.end_byte();
            let start_row = node.start_position().row;
            let end_row = node.end_position().row;
            let tokens = vec!["doctype".to_string(), "html".to_string()];

            items.push(HtmlScopeItem {
                id: current_id,
                parent_id,
                kind: HtmlNodeKind::Doctype,
                start_byte,
                end_byte,
                start_row,
                end_row,
                open_tag_byte_range: Some((start_byte, end_byte)),
                close_tag_byte_range: None,
                tokens: tokens.clone(),
                defined_symbols: tokens,
                children_ids: Vec::new(),
            });

            if let Some(pid) = parent_id {
                items[pid].children_ids.push(current_id);
            }
            return;
        }
        "element" => {
            process_element(node, source_bytes, parent_id, items);
            return;
        }
        "script_element" => {
            process_script_or_style(node, source_bytes, parent_id, items, true);
            return;
        }
        "style_element" => {
            process_script_or_style(node, source_bytes, parent_id, items, false);
            return;
        }
        "comment" => {
            let start_byte = node.start_byte();
            let end_byte = node.end_byte();
            let start_row = node.start_position().row;
            let end_row = node.end_position().row;

            items.push(HtmlScopeItem {
                id: current_id,
                parent_id,
                kind: HtmlNodeKind::Comment,
                start_byte,
                end_byte,
                start_row,
                end_row,
                open_tag_byte_range: Some((start_byte, end_byte)),
                close_tag_byte_range: None,
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

fn process_element(
    node: Node,
    source_bytes: &[u8],
    parent_id: Option<usize>,
    items: &mut Vec<HtmlScopeItem>,
) {
    let start_byte = node.start_byte();
    let end_byte = node.end_byte();
    let start_row = node.start_position().row;
    let end_row = node.end_position().row;

    let mut tag_name = String::new();
    let mut id_val = None;
    let mut classes = Vec::new();
    let mut open_tag_range = None;
    let mut close_tag_range = None;

    let mut cursor = node.walk();
    for child in node.children(&mut cursor) {
        match child.kind() {
            "start_tag" | "self_closing_tag" => {
                open_tag_range = Some((child.start_byte(), child.end_byte()));
                let mut tag_cursor = child.walk();
                for tag_child in child.children(&mut tag_cursor) {
                    if tag_child.kind() == "tag_name" {
                        if let Ok(t) = tag_child.utf8_text(source_bytes) {
                            tag_name = t.to_lowercase();
                        }
                    } else if tag_child.kind() == "attribute" {
                        let (name, val) = extract_attribute(tag_child, source_bytes);
                        if name == "id" {
                            id_val = Some(val);
                        } else if name == "class" {
                            for cls in val.split_whitespace() {
                                classes.push(cls.to_string());
                            }
                        }
                    }
                }
            }
            "end_tag" => {
                close_tag_range = Some((child.start_byte(), child.end_byte()));
            }
            _ => {}
        }
    }

    let is_void = VOID_TAGS.contains(&tag_name.as_str()) || close_tag_range.is_none();

    let mut tokens = Vec::new();
    if !tag_name.is_empty() {
        tokens.push(tag_name.clone());
    }
    if let Some(ref id) = id_val {
        tokens.push(id.to_lowercase());
        for part in id.split(|c: char| !c.is_alphanumeric() && c != '_') {
            let p = part.trim().to_lowercase();
            if p.len() >= 2 {
                tokens.push(p);
            }
        }
    }
    for cls in &classes {
        tokens.push(cls.to_lowercase());
        for part in cls.split(|c: char| !c.is_alphanumeric() && c != '_') {
            let p = part.trim().to_lowercase();
            if p.len() >= 2 {
                tokens.push(p);
            }
        }
    }

    // Collect text content tokens directly inside this element
    let all_node_tokens = extract_all_text_tokens(node, source_bytes);
    for t in all_node_tokens {
        if !tokens.contains(&t) {
            tokens.push(t);
        }
    }

    let mut defined = Vec::new();
    if let Some(ref id) = id_val {
        defined.push(id.clone());
    }
    for cls in &classes {
        defined.push(cls.clone());
    }

    let current_id = items.len();
    items.push(HtmlScopeItem {
        id: current_id,
        parent_id,
        kind: HtmlNodeKind::Element {
            tag_name,
            id: id_val,
            classes,
            is_void,
        },
        start_byte,
        end_byte,
        start_row,
        end_row,
        open_tag_byte_range: open_tag_range,
        close_tag_byte_range: close_tag_range,
        tokens,
        defined_symbols: defined,
        children_ids: Vec::new(),
    });

    if let Some(pid) = parent_id {
        items[pid].children_ids.push(current_id);
    }

    // Process nested elements
    let mut child_cursor = node.walk();
    for child in node.children(&mut child_cursor) {
        if child.is_named() && child.kind() != "start_tag" && child.kind() != "end_tag" {
            walk_node(child, source_bytes, Some(current_id), items);
        }
    }
}

fn process_script_or_style(
    node: Node,
    source_bytes: &[u8],
    parent_id: Option<usize>,
    items: &mut Vec<HtmlScopeItem>,
    is_script: bool,
) {
    let start_byte = node.start_byte();
    let end_byte = node.end_byte();
    let start_row = node.start_position().row;
    let end_row = node.end_position().row;

    let mut open_tag_range = None;
    let mut close_tag_range = None;
    let mut tag_tokens = Vec::new();
    tag_tokens.push(if is_script { "script".to_string() } else { "style".to_string() });

    let mut cursor = node.walk();
    for child in node.children(&mut cursor) {
        match child.kind() {
            "start_tag" => {
                open_tag_range = Some((child.start_byte(), child.end_byte()));
                let mut tag_cursor = child.walk();
                for tag_child in child.children(&mut tag_cursor) {
                    if tag_child.kind() == "attribute" {
                        let (_, val) = extract_attribute(tag_child, source_bytes);
                        for word in val.split(|c: char| !c.is_alphanumeric() && c != '_') {
                            let w = word.trim().to_lowercase();
                            if w.len() >= 2 {
                                tag_tokens.push(w);
                            }
                        }
                    }
                }
            }
            "end_tag" => {
                close_tag_range = Some((child.start_byte(), child.end_byte()));
            }
            _ => {}
        }
    }

    // Collect text/code content tokens directly inside this script or style element
    let all_node_tokens = extract_all_text_tokens(node, source_bytes);
    for t in all_node_tokens {
        if !tag_tokens.contains(&t) {
            tag_tokens.push(t);
        }
    }

    let kind = if is_script { HtmlNodeKind::Script } else { HtmlNodeKind::Style };

    let current_id = items.len();
    items.push(HtmlScopeItem {
        id: current_id,
        parent_id,
        kind,
        start_byte,
        end_byte,
        start_row,
        end_row,
        open_tag_byte_range: open_tag_range,
        close_tag_byte_range: close_tag_range,
        tokens: tag_tokens.clone(),
        defined_symbols: tag_tokens,
        children_ids: Vec::new(),
    });

    if let Some(pid) = parent_id {
        items[pid].children_ids.push(current_id);
    }
}

fn extract_attribute(node: Node, source_bytes: &[u8]) -> (String, String) {
    let mut attr_name = String::new();
    let mut attr_value = String::new();

    let mut cursor = node.walk();
    for child in node.children(&mut cursor) {
        match child.kind() {
            "attribute_name" => {
                if let Ok(t) = child.utf8_text(source_bytes) {
                    attr_name = t.to_lowercase();
                }
            }
            "quoted_attribute_value" | "attribute_value" => {
                if let Ok(t) = child.utf8_text(source_bytes) {
                    let cleaned = t.trim_matches('"').trim_matches('\'');
                    attr_value = cleaned.to_string();
                }
            }
            _ => {}
        }
    }

    (attr_name, attr_value)
}

fn extract_all_text_tokens(node: Node, source_bytes: &[u8]) -> Vec<String> {
    let mut tokens = Vec::new();
    let mut seen = HashSet::new();
    collect_text_tokens_recursive(node, source_bytes, &mut tokens, &mut seen);
    tokens
}

fn collect_text_tokens_recursive(
    node: Node,
    source_bytes: &[u8],
    tokens: &mut Vec<String>,
    seen: &mut HashSet<String>,
) {
    if node.kind() == "text" || node.kind() == "raw_text" {
        if let Ok(text) = node.utf8_text(source_bytes) {
            for word in text.split(|c: char| !c.is_alphanumeric() && c != '_') {
                let w = word.trim().to_lowercase();
                if w.len() >= 2 && seen.insert(w.clone()) {
                    tokens.push(w);
                }
            }
        }
    }

    let mut cursor = node.walk();
    for child in node.children(&mut cursor) {
        if child.kind() != "element" && child.kind() != "script_element" && child.kind() != "style_element" {
            collect_text_tokens_recursive(child, source_bytes, tokens, seen);
        }
    }
}
