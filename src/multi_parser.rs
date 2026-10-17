/// Multi-language parser supporting Python, Java, JavaScript, TypeScript, HTML, and CSS
use crate::language::Language;
use std::cell::RefCell;
use tree_sitter::{Node, Parser, Tree};

/// Unified node kind across all languages
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum UnifiedNodeKind {
    Import,
    Function { name: String, is_async: bool },
    Class { name: String },
    Interface { name: String },
    Method { name: String, is_async: bool },
    HTMLElement { tag: String },
    CSSRule { selector: String },
    Statement,
    Other,
}

/// Unified scope item for multi-language AST
#[derive(Debug, Clone)]
pub struct UnifiedScope {
    pub kind: UnifiedNodeKind,
    pub start_row: usize,
    pub end_row: usize,
    pub text: String,
    pub tokens: Vec<String>,
    pub children: Vec<UnifiedScope>,
}

thread_local! {
    static PARSER: RefCell<Parser> = RefCell::new(Parser::new());
}

/// Parse code with specified language
pub fn parse_multi_language(code: &str, language: Language) -> Result<Tree, String> {
    PARSER.with(|parser_cell| {
        let mut parser = parser_cell.borrow_mut();
        let lang = language.tree_sitter_language();
        parser
            .set_language(&lang)
            .map_err(|e| format!("Failed to set language: {}", e))?;
        parser
            .parse(code, None)
            .ok_or_else(|| "Failed to parse code".to_string())
    })
}

/// Collect scopes for any supported language
pub fn collect_scopes_multi(
    tree: &Tree,
    source_bytes: &[u8],
    lines: &[&str],
    language: Language,
) -> Vec<UnifiedScope> {
    match language {
        Language::Python => collect_python_scopes(tree, source_bytes, lines),
        Language::Java => collect_java_scopes(tree, source_bytes, lines),
        Language::JavaScript | Language::TypeScript => collect_js_scopes(tree, source_bytes, lines),
        Language::HTML => collect_html_scopes(tree, source_bytes, lines),
        Language::CSS => collect_css_scopes(tree, source_bytes, lines),
        Language::Rust | Language::JSON | Language::TOML => Vec::new(),
    }
}

fn collect_python_scopes(tree: &Tree, source_bytes: &[u8], lines: &[&str]) -> Vec<UnifiedScope> {
    let mut scopes = Vec::new();
    let root = tree.root_node();
    walk_python_node(root, source_bytes, lines, &mut scopes);
    scopes
}

fn walk_python_node(
    node: Node,
    source_bytes: &[u8],
    lines: &[&str],
    scopes: &mut Vec<UnifiedScope>,
) {
    match node.kind() {
        "function_definition" | "async_function_definition" => {
            let name = node
                .child_by_field_name("name")
                .and_then(|n| n.utf8_text(source_bytes).ok())
                .unwrap_or("function")
                .to_string();
            let is_async = node.kind() == "async_function_definition";
            let text = get_node_text(node, lines);
            let tokens = extract_identifiers(node, source_bytes);
            
            scopes.push(UnifiedScope {
                kind: UnifiedNodeKind::Function { name, is_async },
                start_row: node.start_position().row,
                end_row: node.end_position().row,
                text,
                tokens,
                children: Vec::new(),
            });
        }
        "class_definition" => {
            let name = node
                .child_by_field_name("name")
                .and_then(|n| n.utf8_text(source_bytes).ok())
                .unwrap_or("Class")
                .to_string();
            let text = get_node_text(node, lines);
            let tokens = extract_identifiers(node, source_bytes);
            
            scopes.push(UnifiedScope {
                kind: UnifiedNodeKind::Class { name },
                start_row: node.start_position().row,
                end_row: node.end_position().row,
                text,
                tokens,
                children: Vec::new(),
            });
        }
        "import_statement" | "import_from_statement" => {
            let text = get_node_text(node, lines);
            let tokens = extract_identifiers(node, source_bytes);
            
            scopes.push(UnifiedScope {
                kind: UnifiedNodeKind::Import,
                start_row: node.start_position().row,
                end_row: node.end_position().row,
                text,
                tokens,
                children: Vec::new(),
            });
        }
        _ => {}
    }

    let mut cursor = node.walk();
    for child in node.children(&mut cursor) {
        walk_python_node(child, source_bytes, lines, scopes);
    }
}

fn collect_java_scopes(tree: &Tree, source_bytes: &[u8], lines: &[&str]) -> Vec<UnifiedScope> {
    let mut scopes = Vec::new();
    let root = tree.root_node();
    walk_java_node(root, source_bytes, lines, &mut scopes);
    scopes
}

fn walk_java_node(
    node: Node,
    source_bytes: &[u8],
    lines: &[&str],
    scopes: &mut Vec<UnifiedScope>,
) {
    match node.kind() {
        "method_declaration" => {
            let name = node
                .child_by_field_name("name")
                .and_then(|n| n.utf8_text(source_bytes).ok())
                .unwrap_or("method")
                .to_string();
            let text = get_node_text(node, lines);
            let tokens = extract_identifiers(node, source_bytes);
            
            scopes.push(UnifiedScope {
                kind: UnifiedNodeKind::Method { name, is_async: false },
                start_row: node.start_position().row,
                end_row: node.end_position().row,
                text,
                tokens,
                children: Vec::new(),
            });
        }
        "class_declaration" => {
            let name = node
                .child_by_field_name("name")
                .and_then(|n| n.utf8_text(source_bytes).ok())
                .unwrap_or("Class")
                .to_string();
            let text = get_node_text(node, lines);
            let tokens = extract_identifiers(node, source_bytes);
            
            scopes.push(UnifiedScope {
                kind: UnifiedNodeKind::Class { name },
                start_row: node.start_position().row,
                end_row: node.end_position().row,
                text,
                tokens,
                children: Vec::new(),
            });
        }
        "interface_declaration" => {
            let name = node
                .child_by_field_name("name")
                .and_then(|n| n.utf8_text(source_bytes).ok())
                .unwrap_or("Interface")
                .to_string();
            let text = get_node_text(node, lines);
            let tokens = extract_identifiers(node, source_bytes);
            
            scopes.push(UnifiedScope {
                kind: UnifiedNodeKind::Interface { name },
                start_row: node.start_position().row,
                end_row: node.end_position().row,
                text,
                tokens,
                children: Vec::new(),
            });
        }
        "import_declaration" | "package_declaration" => {
            let text = get_node_text(node, lines);
            let tokens = extract_identifiers(node, source_bytes);
            
            scopes.push(UnifiedScope {
                kind: UnifiedNodeKind::Import,
                start_row: node.start_position().row,
                end_row: node.end_position().row,
                text,
                tokens,
                children: Vec::new(),
            });
        }
        _ => {}
    }

    let mut cursor = node.walk();
    for child in node.children(&mut cursor) {
        walk_java_node(child, source_bytes, lines, scopes);
    }
}

fn collect_js_scopes(tree: &Tree, source_bytes: &[u8], lines: &[&str]) -> Vec<UnifiedScope> {
    let mut scopes = Vec::new();
    let root = tree.root_node();
    walk_js_node(root, source_bytes, lines, &mut scopes);
    scopes
}

fn walk_js_node(
    node: Node,
    source_bytes: &[u8],
    lines: &[&str],
    scopes: &mut Vec<UnifiedScope>,
) {
    match node.kind() {
        "function_declaration" | "function" | "arrow_function" | "method_definition" => {
            let name = node
                .child_by_field_name("name")
                .and_then(|n| n.utf8_text(source_bytes).ok())
                .unwrap_or_else(|| {
                    if node.kind() == "arrow_function" {
                        "arrow_function"
                    } else {
                        "function"
                    }
                })
                .to_string();
            
            // Check if async
            let is_async = node.utf8_text(source_bytes)
                .ok()
                .map(|t| t.starts_with("async"))
                .unwrap_or(false);
            
            let text = get_node_text(node, lines);
            let tokens = extract_identifiers(node, source_bytes);
            
            scopes.push(UnifiedScope {
                kind: UnifiedNodeKind::Function { name, is_async },
                start_row: node.start_position().row,
                end_row: node.end_position().row,
                text,
                tokens,
                children: Vec::new(),
            });
        }
        "class_declaration" => {
            let name = node
                .child_by_field_name("name")
                .and_then(|n| n.utf8_text(source_bytes).ok())
                .unwrap_or("Class")
                .to_string();
            let text = get_node_text(node, lines);
            let tokens = extract_identifiers(node, source_bytes);
            
            scopes.push(UnifiedScope {
                kind: UnifiedNodeKind::Class { name },
                start_row: node.start_position().row,
                end_row: node.end_position().row,
                text,
                tokens,
                children: Vec::new(),
            });
        }
        "interface_declaration" => {
            let name = node
                .child_by_field_name("name")
                .and_then(|n| n.utf8_text(source_bytes).ok())
                .unwrap_or("Interface")
                .to_string();
            let text = get_node_text(node, lines);
            let tokens = extract_identifiers(node, source_bytes);
            
            scopes.push(UnifiedScope {
                kind: UnifiedNodeKind::Interface { name },
                start_row: node.start_position().row,
                end_row: node.end_position().row,
                text,
                tokens,
                children: Vec::new(),
            });
        }
        "import_statement" | "export_statement" => {
            let text = get_node_text(node, lines);
            let tokens = extract_identifiers(node, source_bytes);
            
            scopes.push(UnifiedScope {
                kind: UnifiedNodeKind::Import,
                start_row: node.start_position().row,
                end_row: node.end_position().row,
                text,
                tokens,
                children: Vec::new(),
            });
        }
        _ => {}
    }

    let mut cursor = node.walk();
    for child in node.children(&mut cursor) {
        walk_js_node(child, source_bytes, lines, scopes);
    }
}

fn collect_html_scopes(tree: &Tree, source_bytes: &[u8], lines: &[&str]) -> Vec<UnifiedScope> {
    let mut scopes = Vec::new();
    let root = tree.root_node();
    walk_html_node(root, source_bytes, lines, &mut scopes);
    scopes
}

fn walk_html_node(
    node: Node,
    source_bytes: &[u8],
    lines: &[&str],
    scopes: &mut Vec<UnifiedScope>,
) {
    match node.kind() {
        "element" => {
            // Get tag name from start_tag
            let tag_name = node
                .child_by_field_name("start_tag")
                .and_then(|start_tag| {
                    start_tag.child_by_field_name("name")
                        .and_then(|n| n.utf8_text(source_bytes).ok())
                })
                .unwrap_or("div")
                .to_string();
            
            let text = get_node_text(node, lines);
            let tokens = extract_html_tokens(node, source_bytes);
            
            scopes.push(UnifiedScope {
                kind: UnifiedNodeKind::HTMLElement { tag: tag_name },
                start_row: node.start_position().row,
                end_row: node.end_position().row,
                text,
                tokens,
                children: Vec::new(),
            });
        }
        "script_element" | "style_element" => {
            let text = get_node_text(node, lines);
            let tokens = extract_identifiers(node, source_bytes);
            
            scopes.push(UnifiedScope {
                kind: UnifiedNodeKind::HTMLElement { tag: node.kind().to_string() },
                start_row: node.start_position().row,
                end_row: node.end_position().row,
                text,
                tokens,
                children: Vec::new(),
            });
        }
        _ => {}
    }

    let mut cursor = node.walk();
    for child in node.children(&mut cursor) {
        walk_html_node(child, source_bytes, lines, scopes);
    }
}

fn collect_css_scopes(tree: &Tree, source_bytes: &[u8], lines: &[&str]) -> Vec<UnifiedScope> {
    let mut scopes = Vec::new();
    let root = tree.root_node();
    walk_css_node(root, source_bytes, lines, &mut scopes);
    scopes
}

fn walk_css_node(
    node: Node,
    source_bytes: &[u8],
    lines: &[&str],
    scopes: &mut Vec<UnifiedScope>,
) {
    match node.kind() {
        "rule_set" => {
            // Get selectors
            let selector = node
                .child_by_field_name("selectors")
                .and_then(|n| n.utf8_text(source_bytes).ok())
                .unwrap_or("selector")
                .to_string();
            
            let text = get_node_text(node, lines);
            let tokens = extract_css_tokens(node, source_bytes);
            
            scopes.push(UnifiedScope {
                kind: UnifiedNodeKind::CSSRule { selector },
                start_row: node.start_position().row,
                end_row: node.end_position().row,
                text,
                tokens,
                children: Vec::new(),
            });
        }
        "media_statement" | "keyframes_statement" => {
            let text = get_node_text(node, lines);
            let tokens = extract_css_tokens(node, source_bytes);
            
            scopes.push(UnifiedScope {
                kind: UnifiedNodeKind::Statement,
                start_row: node.start_position().row,
                end_row: node.end_position().row,
                text,
                tokens,
                children: Vec::new(),
            });
        }
        _ => {}
    }

    let mut cursor = node.walk();
    for child in node.children(&mut cursor) {
        walk_css_node(child, source_bytes, lines, scopes);
    }
}

fn get_node_text(node: Node, lines: &[&str]) -> String {
    let start_row = node.start_position().row;
    let end_row = node.end_position().row;
    
    if start_row == end_row {
        lines.get(start_row).unwrap_or(&"").to_string()
    } else {
        let mut text = String::new();
        for row in start_row..=end_row.min(lines.len().saturating_sub(1)) {
            if let Some(line) = lines.get(row) {
                text.push_str(line);
                if row < end_row {
                    text.push('\n');
                }
            }
        }
        text
    }
}

fn extract_identifiers(node: Node, source_bytes: &[u8]) -> Vec<String> {
    let mut tokens = Vec::new();
    collect_identifier_tokens(node, source_bytes, &mut tokens);
    tokens
}

fn collect_identifier_tokens(node: Node, source_bytes: &[u8], tokens: &mut Vec<String>) {
    if node.kind() == "identifier" {
        if let Ok(text) = node.utf8_text(source_bytes) {
            tokens.push(text.to_lowercase());
        }
    }
    
    let mut cursor = node.walk();
    for child in node.children(&mut cursor) {
        collect_identifier_tokens(child, source_bytes, tokens);
    }
}

fn extract_html_tokens(node: Node, source_bytes: &[u8]) -> Vec<String> {
    let mut tokens = Vec::new();
    
    // Extract tag names, attribute names, and text content
    let mut cursor = node.walk();
    for child in node.children(&mut cursor) {
        match child.kind() {
            "start_tag" | "end_tag" | "self_closing_tag" => {
                if let Some(name) = child.child_by_field_name("name") {
                    if let Ok(text) = name.utf8_text(source_bytes) {
                        tokens.push(text.to_lowercase());
                    }
                }
                // Extract attribute names
                let mut attr_cursor = child.walk();
                for attr_child in child.children(&mut attr_cursor) {
                    if attr_child.kind() == "attribute" {
                        if let Some(attr_name) = attr_child.child_by_field_name("name") {
                            if let Ok(text) = attr_name.utf8_text(source_bytes) {
                                tokens.push(text.to_lowercase());
                            }
                        }
                    }
                }
            }
            "text" => {
                if let Ok(text) = child.utf8_text(source_bytes) {
                    let words: Vec<String> = text
                        .split_whitespace()
                        .map(|w| w.to_lowercase())
                        .collect();
                    tokens.extend(words);
                }
            }
            _ => {}
        }
    }
    
    tokens
}

fn extract_css_tokens(node: Node, source_bytes: &[u8]) -> Vec<String> {
    let mut tokens = Vec::new();
    
    let mut cursor = node.walk();
    for child in node.children(&mut cursor) {
        match child.kind() {
            "class_selector" | "id_selector" | "tag_name" | "property_name" => {
                if let Ok(text) = child.utf8_text(source_bytes) {
                    tokens.push(text.trim_start_matches('.').trim_start_matches('#').to_lowercase());
                }
            }
            _ => {}
        }
    }
    
    tokens
}
