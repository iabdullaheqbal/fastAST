//! Java AST parser using Tree-sitter
//!
//! Extracts packages, imports, classes, interfaces, enums, fields, constructors, methods.

use std::cell::RefCell;
use std::collections::VecDeque;
use tree_sitter::{Node, Parser, Tree};

thread_local! {
    static JAVA_PARSER: RefCell<Parser> = RefCell::new({
        let mut p = Parser::new();
        p.set_language(&tree_sitter_java::language()).expect("Failed to load Java grammar");
        p
    });
}

#[derive(Debug, Clone)]
pub struct JavaScope {
    pub id: usize,
    pub kind: JavaNodeKind,
    pub name: String,
    pub start_line: usize,
    pub end_line: usize,
    pub tokens: Vec<String>,
    pub parent_id: Option<usize>,
    pub node_text: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub enum JavaNodeKind {
    Package,
    Import,
    Class,
    Interface,
    Enum,
    Field,
    Constructor,
    Method,
    Other,
}

pub fn parse_ast(code: &str) -> Result<Tree, String> {
    JAVA_PARSER.with(|parser_cell| {
        let mut parser = parser_cell.borrow_mut();
        parser
            .parse(code, None)
            .ok_or_else(|| "Failed to parse Java code".to_string())
    })
}

pub fn collect_scopes(tree: &Tree, source_bytes: &[u8], _lines: &[&str]) -> Vec<JavaScope> {
    let mut scopes = Vec::new();
    let mut id_counter = 0;
    let root = tree.root_node();
    
    // Process all nodes using a stack
    let mut stack: VecDeque<(Node, Option<usize>)> = VecDeque::new();
    stack.push_back((root, None));
    
    while let Some((node, parent_id)) = stack.pop_back() {
        let kind = classify_node(&node);
        let mut should_process_children = true;
        
        match kind {
            JavaNodeKind::Package => {
                if let Some(name) = extract_node_text(&node, source_bytes, &kind) {
                    let tokens = tokenize_java_name(&name);
                    scopes.push(JavaScope {
                        id: id_counter,
                        kind: JavaNodeKind::Package,
                        name,
                        start_line: node.start_position().row,
                        end_line: node.end_position().row,
                        tokens,
                        parent_id,
                        node_text: extract_full_text(&node, source_bytes),
                    });
                    id_counter += 1;
                }
                should_process_children = false;
            }
            JavaNodeKind::Import => {
                if let Some(name) = extract_node_text(&node, source_bytes, &kind) {
                    let tokens = tokenize_java_name(&name);
                    scopes.push(JavaScope {
                        id: id_counter,
                        kind: JavaNodeKind::Import,
                        name,
                        start_line: node.start_position().row,
                        end_line: node.end_position().row,
                        tokens,
                        parent_id,
                        node_text: extract_full_text(&node, source_bytes),
                    });
                    id_counter += 1;
                }
                should_process_children = false;
            }
            JavaNodeKind::Class | JavaNodeKind::Interface | JavaNodeKind::Enum => {
                if let Some(name) = extract_class_name(&node, source_bytes) {
                    let tokens = tokenize_java_name(&name);
                    let scope_id = id_counter;
                    scopes.push(JavaScope {
                        id: scope_id,
                        kind: kind.clone(),
                        name,
                        start_line: node.start_position().row,
                        end_line: node.end_position().row,
                        tokens,
                        parent_id,
                        node_text: extract_full_text(&node, source_bytes),
                    });
                    id_counter += 1;
                    
                    // Process children with this as parent
                    let mut child_nodes = Vec::new();
                    let mut child = node.child(0);
                    while let Some(c) = child {
                        child_nodes.push((c, Some(scope_id)));
                        child = c.next_sibling();
                    }
                    for child_pair in child_nodes.into_iter().rev() {
                        stack.push_back(child_pair);
                    }
                    should_process_children = false;
                }
            }
            JavaNodeKind::Field => {
                if let Some(name) = extract_field_name(&node, source_bytes) {
                    let tokens = tokenize_java_name(&name);
                    scopes.push(JavaScope {
                        id: id_counter,
                        kind: JavaNodeKind::Field,
                        name,
                        start_line: node.start_position().row,
                        end_line: node.end_position().row,
                        tokens,
                        parent_id,
                        node_text: extract_full_text(&node, source_bytes),
                    });
                    id_counter += 1;
                }
                should_process_children = false;
            }
            JavaNodeKind::Constructor | JavaNodeKind::Method => {
                if let Some(name) = extract_method_name(&node, source_bytes, &kind) {
                    let tokens = tokenize_java_name(&name);
                    scopes.push(JavaScope {
                        id: id_counter,
                        kind,
                        name,
                        start_line: node.start_position().row,
                        end_line: node.end_position().row,
                        tokens,
                        parent_id,
                        node_text: extract_full_text(&node, source_bytes),
                    });
                    id_counter += 1;
                }
                should_process_children = false;
            }
            JavaNodeKind::Other => {}
        }
        
        if should_process_children {
            let mut child_nodes = Vec::new();
            let mut child = node.child(0);
            while let Some(c) = child {
                child_nodes.push((c, parent_id));
                child = c.next_sibling();
            }
            for child_pair in child_nodes.into_iter().rev() {
                stack.push_back(child_pair);
            }
        }
    }
    
    scopes
}

fn classify_node(node: &Node) -> JavaNodeKind {
    match node.kind() {
        "package_declaration" => JavaNodeKind::Package,
        "import_declaration" => JavaNodeKind::Import,
        "class_declaration" => JavaNodeKind::Class,
        "interface_declaration" => JavaNodeKind::Interface,
        "enum_declaration" => JavaNodeKind::Enum,
        "field_declaration" => JavaNodeKind::Field,
        "constructor_declaration" => JavaNodeKind::Constructor,
        "method_declaration" => JavaNodeKind::Method,
        _ => JavaNodeKind::Other,
    }
}

fn extract_node_text(node: &Node, source_bytes: &[u8], kind: &JavaNodeKind) -> Option<String> {
    match kind {
        JavaNodeKind::Package => {
            node.child_by_field_name("name")
                .and_then(|n| n.utf8_text(source_bytes).ok().map(|s| s.to_string()))
        }
        JavaNodeKind::Import => {
            node.utf8_text(source_bytes).ok().map(|s| s.to_string())
        }
        _ => None,
    }
}

fn extract_class_name(node: &Node, source_bytes: &[u8]) -> Option<String> {
    node.child_by_field_name("name")
        .and_then(|n| n.utf8_text(source_bytes).ok().map(|s| s.to_string()))
}

fn extract_field_name(node: &Node, source_bytes: &[u8]) -> Option<String> {
    node.child_by_field_name("declarator")
        .and_then(|decl| decl.child_by_field_name("name"))
        .and_then(|name| name.utf8_text(source_bytes).ok().map(|s| s.to_string()))
        .or_else(|| {
            let mut cursor = node.walk();
            for child in node.children(&mut cursor) {
                if child.kind() == "variable_declarator" {
                    if let Some(name_node) = child.child_by_field_name("name") {
                        return name_node.utf8_text(source_bytes).ok().map(|s| s.to_string());
                    }
                }
            }
            None
        })
}

fn extract_method_name(node: &Node, source_bytes: &[u8], kind: &JavaNodeKind) -> Option<String> {
    match kind {
        JavaNodeKind::Constructor | JavaNodeKind::Method => {
            node.child_by_field_name("name")
                .and_then(|n| n.utf8_text(source_bytes).ok().map(|s| s.to_string()))
        }
        _ => None,
    }
}

fn extract_full_text(node: &Node, source_bytes: &[u8]) -> String {
    node.utf8_text(source_bytes)
        .map(|s| s.to_string())
        .unwrap_or_default()
}

fn tokenize_java_name(name: &str) -> Vec<String> {
    let mut tokens = Vec::new();
    let mut current = String::new();
    
    for ch in name.chars() {
        if ch.is_alphanumeric() {
            current.push(ch.to_lowercase().next().unwrap_or(ch));
        } else if ch == '_' || ch == '.' {
            if !current.is_empty() {
                tokens.push(current.clone());
                current.clear();
            }
        } else if ch.is_uppercase() && !current.is_empty() {
            tokens.push(current.clone());
            current.clear();
            current.push(ch.to_lowercase().next().unwrap_or(ch));
        }
    }
    
    if !current.is_empty() {
        tokens.push(current);
    }
    
    tokens
}