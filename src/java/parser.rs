//! Java AST Parser using Tree-Sitter
//!
//! Extracts packages, imports, classes, interfaces, enums, records,
//! methods, constructors, fields, and inner classes.

use std::cell::RefCell;
use std::collections::HashSet;
use tree_sitter::{Node, Parser, Tree};

thread_local! {
    static JAVA_PARSER: RefCell<Parser> = RefCell::new({
        let mut p = Parser::new();
        p.set_language(&tree_sitter_java::language()).expect("Failed to load Java grammar");
        p
    });
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum JavaNodeKind {
    Package,
    Import,
    Class {
        name: String,
        is_abstract: bool,
        superclass: Option<String>,
        interfaces: Vec<String>,
    },
    Interface {
        name: String,
        interfaces: Vec<String>,
    },
    Enum {
        name: String,
    },
    Record {
        name: String,
    },
    Constructor {
        name: String,
    },
    Method {
        name: String,
        return_type: String,
        is_static: bool,
        is_abstract: bool,
    },
    Field {
        name: String,
        field_type: String,
    },
    Other,
}

#[derive(Debug, Clone)]
pub struct JavaScopeItem {
    pub id: usize,
    pub parent_id: Option<usize>,
    pub kind: JavaNodeKind,
    pub start_byte: usize,
    pub end_byte: usize,
    pub start_row: usize,
    pub end_row: usize,
    /// Byte range of the body block if this item has a stubbable body
    pub body_byte_range: Option<(usize, usize)>,
    /// Byte range of the signature (from start up to body start)
    pub signature_byte_range: Option<(usize, usize)>,
    /// Tokens extracted from signature and definition
    pub signature_tokens: Vec<String>,
    /// All tokens in this scope
    pub tokens: Vec<String>,
    /// Defined symbols (name, parameters, type names)
    pub defined_symbols: Vec<String>,
    /// Referenced identifiers in this scope
    pub referenced_symbols: Vec<String>,
    pub children_ids: Vec<usize>,
}

pub fn parse_ast(code: &str) -> Result<Tree, String> {
    JAVA_PARSER.with(|p| {
        p.borrow_mut()
            .parse(code, None)
            .ok_or_else(|| "Failed to parse Java code".to_string())
    })
}

pub fn collect_scopes(tree: &Tree, source_bytes: &[u8], lines: &[&str]) -> Vec<JavaScopeItem> {
    let mut items = Vec::new();
    let root = tree.root_node();
    walk_node(root, source_bytes, lines, None, &mut items);
    items
}

fn walk_node(
    node: Node,
    source_bytes: &[u8],
    lines: &[&str],
    parent_id: Option<usize>,
    items: &mut Vec<JavaScopeItem>,
) {
    let current_id = items.len();

    match node.kind() {
        "package_declaration" => {
            let start_byte = node.start_byte();
            let end_byte = node.end_byte();
            let start_row = node.start_position().row;
            let end_row = node.end_position().row;
            let tokens = extract_all_identifiers(node, source_bytes);

            items.push(JavaScopeItem {
                id: current_id,
                parent_id,
                kind: JavaNodeKind::Package,
                start_byte,
                end_byte,
                start_row,
                end_row,
                body_byte_range: None,
                signature_byte_range: Some((start_byte, end_byte)),
                signature_tokens: tokens.clone(),
                tokens: tokens.clone(),
                defined_symbols: tokens,
                referenced_symbols: Vec::new(),
                children_ids: Vec::new(),
            });

            if let Some(pid) = parent_id {
                items[pid].children_ids.push(current_id);
            }
            return;
        }
        "import_declaration" => {
            let start_byte = node.start_byte();
            let end_byte = node.end_byte();
            let start_row = node.start_position().row;
            let end_row = node.end_position().row;
            let tokens = extract_all_identifiers(node, source_bytes);

            let mut defined = Vec::new();
            if let Some(last) = tokens.last() {
                defined.push(last.clone());
            }

            items.push(JavaScopeItem {
                id: current_id,
                parent_id,
                kind: JavaNodeKind::Import,
                start_byte,
                end_byte,
                start_row,
                end_row,
                body_byte_range: None,
                signature_byte_range: Some((start_byte, end_byte)),
                signature_tokens: tokens.clone(),
                tokens: tokens.clone(),
                defined_symbols: defined,
                referenced_symbols: Vec::new(),
                children_ids: Vec::new(),
            });

            if let Some(pid) = parent_id {
                items[pid].children_ids.push(current_id);
            }
            return;
        }
        "class_declaration" => {
            process_class_declaration(node, source_bytes, lines, parent_id, items);
            return;
        }
        "interface_declaration" => {
            process_interface_declaration(node, source_bytes, lines, parent_id, items);
            return;
        }
        "enum_declaration" => {
            process_enum_declaration(node, source_bytes, lines, parent_id, items);
            return;
        }
        "record_declaration" => {
            process_record_declaration(node, source_bytes, lines, parent_id, items);
            return;
        }
        _ => {}
    }

    let mut cursor = node.walk();
    for child in node.children(&mut cursor) {
        if child.is_named() {
            walk_node(child, source_bytes, lines, parent_id, items);
        }
    }
}

fn process_class_declaration(
    node: Node,
    source_bytes: &[u8],
    lines: &[&str],
    parent_id: Option<usize>,
    items: &mut Vec<JavaScopeItem>,
) {
    let start_byte = node.start_byte();
    let end_byte = node.end_byte();
    let start_row = node.start_position().row;
    let end_row = node.end_position().row;

    let mut name = String::new();
    let mut is_abstract = false;
    let mut superclass = None;
    let mut interfaces = Vec::new();
    let mut body_node = None;
    let mut type_params_node = None;

    let mut cursor = node.walk();
    for child in node.children(&mut cursor) {
        match child.kind() {
            "modifiers" => {
                if let Ok(text) = child.utf8_text(source_bytes) {
                    if text.contains("abstract") {
                        is_abstract = true;
                    }
                }
            }
            "identifier" => {
                if name.is_empty() {
                    name = child.utf8_text(source_bytes).unwrap_or("").to_string();
                }
            }
            "type_parameters" => type_params_node = Some(child),
            "superclass" => {
                superclass = child.utf8_text(source_bytes).ok().map(|s| s.to_string());
            }
            "super_interfaces" => {
                if let Ok(text) = child.utf8_text(source_bytes) {
                    for part in text.trim_start_matches("implements").split(',') {
                        let trimmed = part.trim();
                        if !trimmed.is_empty() {
                            interfaces.push(trimmed.to_string());
                        }
                    }
                }
            }
            "class_body" => body_node = Some(child),
            _ => {}
        }
    }

    let (body_byte_range, signature_byte_range) = if let Some(body) = body_node {
        (
            Some((body.start_byte(), body.end_byte())),
            Some((start_byte, body.start_byte())),
        )
    } else {
        (None, Some((start_byte, end_byte)))
    };

    let mut signature_tokens = Vec::new();
    if !name.is_empty() {
        signature_tokens.push(name.to_lowercase());
    }
    if let Some(tp) = type_params_node {
        signature_tokens.extend(extract_all_identifiers(tp, source_bytes));
    }
    if let Some(ref sc) = superclass {
        signature_tokens.extend(tokenize_words(sc));
    }
    for iface in &interfaces {
        signature_tokens.extend(tokenize_words(iface));
    }

    let mut defined = Vec::new();
    if !name.is_empty() {
        defined.push(name.clone());
    }

    let current_id = items.len();
    items.push(JavaScopeItem {
        id: current_id,
        parent_id,
        kind: JavaNodeKind::Class {
            name,
            is_abstract,
            superclass,
            interfaces,
        },
        start_byte,
        end_byte,
        start_row,
        end_row,
        body_byte_range,
        signature_byte_range,
        signature_tokens: signature_tokens.clone(),
        tokens: signature_tokens,
        defined_symbols: defined,
        referenced_symbols: Vec::new(),
        children_ids: Vec::new(),
    });

    if let Some(pid) = parent_id {
        items[pid].children_ids.push(current_id);
    }

    // Process members inside class body
    if let Some(body) = body_node {
        let mut b_cursor = body.walk();
        for member in body.children(&mut b_cursor) {
            match member.kind() {
                "field_declaration" => {
                    process_field_declaration(member, source_bytes, current_id, items);
                }
                "constructor_declaration" => {
                    process_constructor_declaration(member, source_bytes, current_id, items);
                }
                "method_declaration" => {
                    process_method_declaration(member, source_bytes, current_id, items);
                }
                "class_declaration" => {
                    process_class_declaration(member, source_bytes, lines, Some(current_id), items);
                }
                "interface_declaration" => {
                    process_interface_declaration(member, source_bytes, lines, Some(current_id), items);
                }
                "enum_declaration" => {
                    process_enum_declaration(member, source_bytes, lines, Some(current_id), items);
                }
                "record_declaration" => {
                    process_record_declaration(member, source_bytes, lines, Some(current_id), items);
                }
                _ => {}
            }
        }
    }
}

fn process_interface_declaration(
    node: Node,
    source_bytes: &[u8],
    lines: &[&str],
    parent_id: Option<usize>,
    items: &mut Vec<JavaScopeItem>,
) {
    let start_byte = node.start_byte();
    let end_byte = node.end_byte();
    let start_row = node.start_position().row;
    let end_row = node.end_position().row;

    let mut name = String::new();
    let mut interfaces = Vec::new();
    let mut body_node = None;
    let mut type_params_node = None;

    let mut cursor = node.walk();
    for child in node.children(&mut cursor) {
        match child.kind() {
            "identifier" => {
                if name.is_empty() {
                    name = child.utf8_text(source_bytes).unwrap_or("").to_string();
                }
            }
            "type_parameters" => type_params_node = Some(child),
            "extends_interfaces" => {
                if let Ok(text) = child.utf8_text(source_bytes) {
                    for part in text.trim_start_matches("extends").split(',') {
                        let trimmed = part.trim();
                        if !trimmed.is_empty() {
                            interfaces.push(trimmed.to_string());
                        }
                    }
                }
            }
            "interface_body" => body_node = Some(child),
            _ => {}
        }
    }

    let (body_byte_range, signature_byte_range) = if let Some(body) = body_node {
        (
            Some((body.start_byte(), body.end_byte())),
            Some((start_byte, body.start_byte())),
        )
    } else {
        (None, Some((start_byte, end_byte)))
    };

    let mut signature_tokens = Vec::new();
    if !name.is_empty() {
        signature_tokens.push(name.to_lowercase());
    }
    if let Some(tp) = type_params_node {
        signature_tokens.extend(extract_all_identifiers(tp, source_bytes));
    }
    for iface in &interfaces {
        signature_tokens.extend(tokenize_words(iface));
    }

    let mut defined = Vec::new();
    if !name.is_empty() {
        defined.push(name.clone());
    }

    let current_id = items.len();
    items.push(JavaScopeItem {
        id: current_id,
        parent_id,
        kind: JavaNodeKind::Interface { name, interfaces },
        start_byte,
        end_byte,
        start_row,
        end_row,
        body_byte_range,
        signature_byte_range,
        signature_tokens: signature_tokens.clone(),
        tokens: signature_tokens,
        defined_symbols: defined,
        referenced_symbols: Vec::new(),
        children_ids: Vec::new(),
    });

    if let Some(pid) = parent_id {
        items[pid].children_ids.push(current_id);
    }

    if let Some(body) = body_node {
        let mut b_cursor = body.walk();
        for member in body.children(&mut b_cursor) {
            match member.kind() {
                "field_declaration" => {
                    process_field_declaration(member, source_bytes, current_id, items);
                }
                "method_declaration" => {
                    process_method_declaration(member, source_bytes, current_id, items);
                }
                "class_declaration" => {
                    process_class_declaration(member, source_bytes, lines, Some(current_id), items);
                }
                "interface_declaration" => {
                    process_interface_declaration(member, source_bytes, lines, Some(current_id), items);
                }
                _ => {}
            }
        }
    }
}

fn process_enum_declaration(
    node: Node,
    source_bytes: &[u8],
    _lines: &[&str],
    parent_id: Option<usize>,
    items: &mut Vec<JavaScopeItem>,
) {
    let start_byte = node.start_byte();
    let end_byte = node.end_byte();
    let start_row = node.start_position().row;
    let end_row = node.end_position().row;

    let mut name = String::new();
    let mut body_node = None;

    let mut cursor = node.walk();
    for child in node.children(&mut cursor) {
        match child.kind() {
            "identifier" => {
                if name.is_empty() {
                    name = child.utf8_text(source_bytes).unwrap_or("").to_string();
                }
            }
            "enum_body" => body_node = Some(child),
            _ => {}
        }
    }

    let (body_byte_range, signature_byte_range) = if let Some(body) = body_node {
        (
            Some((body.start_byte(), body.end_byte())),
            Some((start_byte, body.start_byte())),
        )
    } else {
        (None, Some((start_byte, end_byte)))
    };

    let mut signature_tokens = Vec::new();
    if !name.is_empty() {
        signature_tokens.push(name.to_lowercase());
    }

    let all_tokens = extract_all_identifiers(node, source_bytes);
    let mut defined = Vec::new();
    if !name.is_empty() {
        defined.push(name.clone());
    }

    let current_id = items.len();
    items.push(JavaScopeItem {
        id: current_id,
        parent_id,
        kind: JavaNodeKind::Enum { name },
        start_byte,
        end_byte,
        start_row,
        end_row,
        body_byte_range,
        signature_byte_range,
        signature_tokens,
        tokens: all_tokens,
        defined_symbols: defined,
        referenced_symbols: Vec::new(),
        children_ids: Vec::new(),
    });

    if let Some(pid) = parent_id {
        items[pid].children_ids.push(current_id);
    }
}

fn process_record_declaration(
    node: Node,
    source_bytes: &[u8],
    _lines: &[&str],
    parent_id: Option<usize>,
    items: &mut Vec<JavaScopeItem>,
) {
    let start_byte = node.start_byte();
    let end_byte = node.end_byte();
    let start_row = node.start_position().row;
    let end_row = node.end_position().row;

    let mut name = String::new();
    let mut body_node = None;

    let mut cursor = node.walk();
    for child in node.children(&mut cursor) {
        match child.kind() {
            "identifier" => {
                if name.is_empty() {
                    name = child.utf8_text(source_bytes).unwrap_or("").to_string();
                }
            }
            "record_body" => body_node = Some(child),
            _ => {}
        }
    }

    let (body_byte_range, signature_byte_range) = if let Some(body) = body_node {
        (
            Some((body.start_byte(), body.end_byte())),
            Some((start_byte, body.start_byte())),
        )
    } else {
        (None, Some((start_byte, end_byte)))
    };

    let mut signature_tokens = Vec::new();
    if !name.is_empty() {
        signature_tokens.push(name.to_lowercase());
    }

    let all_tokens = extract_all_identifiers(node, source_bytes);
    let mut defined = Vec::new();
    if !name.is_empty() {
        defined.push(name.clone());
    }

    let current_id = items.len();
    items.push(JavaScopeItem {
        id: current_id,
        parent_id,
        kind: JavaNodeKind::Record { name },
        start_byte,
        end_byte,
        start_row,
        end_row,
        body_byte_range,
        signature_byte_range,
        signature_tokens,
        tokens: all_tokens,
        defined_symbols: defined,
        referenced_symbols: Vec::new(),
        children_ids: Vec::new(),
    });

    if let Some(pid) = parent_id {
        items[pid].children_ids.push(current_id);
    }
}

fn process_method_declaration(
    node: Node,
    source_bytes: &[u8],
    parent_class_id: usize,
    items: &mut Vec<JavaScopeItem>,
) {
    let start_byte = node.start_byte();
    let end_byte = node.end_byte();
    let start_row = node.start_position().row;
    let end_row = node.end_position().row;

    let mut name = String::new();
    let mut return_type = String::from("void");
    let mut is_static = false;
    let mut is_abstract = false;
    let mut body_node = None;
    let mut params_node = None;

    let mut cursor = node.walk();
    for child in node.children(&mut cursor) {
        match child.kind() {
            "modifiers" => {
                if let Ok(text) = child.utf8_text(source_bytes) {
                    if text.contains("static") {
                        is_static = true;
                    }
                    if text.contains("abstract") {
                        is_abstract = true;
                    }
                }
            }
            "identifier" => {
                if name.is_empty() {
                    name = child.utf8_text(source_bytes).unwrap_or("").to_string();
                }
            }
            "type_identifier"
            | "integral_type"
            | "floating_point_type"
            | "boolean_type"
            | "void_type"
            | "generic_type"
            | "array_type" => {
                if let Ok(t) = child.utf8_text(source_bytes) {
                    return_type = t.to_string();
                }
            }
            "formal_parameters" => params_node = Some(child),
            "block" => body_node = Some(child),
            _ => {}
        }
    }

    let (body_byte_range, signature_byte_range) = if let Some(body) = body_node {
        (
            Some((body.start_byte(), body.end_byte())),
            Some((start_byte, body.start_byte())),
        )
    } else {
        (None, Some((start_byte, end_byte)))
    };

    let mut signature_tokens = Vec::new();
    if !name.is_empty() {
        signature_tokens.push(name.to_lowercase());
    }
    signature_tokens.extend(tokenize_words(&return_type));
    if let Some(params) = params_node {
        signature_tokens.extend(extract_all_identifiers(params, source_bytes));
    }

    let all_tokens = extract_all_identifiers(node, source_bytes);
    let mut defined = Vec::new();
    if !name.is_empty() {
        defined.push(name.clone());
    }

    let current_id = items.len();
    items.push(JavaScopeItem {
        id: current_id,
        parent_id: Some(parent_class_id),
        kind: JavaNodeKind::Method {
            name,
            return_type,
            is_static,
            is_abstract,
        },
        start_byte,
        end_byte,
        start_row,
        end_row,
        body_byte_range,
        signature_byte_range,
        signature_tokens,
        tokens: all_tokens,
        defined_symbols: defined,
        referenced_symbols: Vec::new(),
        children_ids: Vec::new(),
    });

    items[parent_class_id].children_ids.push(current_id);
}

fn process_constructor_declaration(
    node: Node,
    source_bytes: &[u8],
    parent_class_id: usize,
    items: &mut Vec<JavaScopeItem>,
) {
    let start_byte = node.start_byte();
    let end_byte = node.end_byte();
    let start_row = node.start_position().row;
    let end_row = node.end_position().row;

    let mut name = String::new();
    let mut body_node = None;
    let mut params_node = None;

    let mut cursor = node.walk();
    for child in node.children(&mut cursor) {
        match child.kind() {
            "identifier" => {
                if name.is_empty() {
                    name = child.utf8_text(source_bytes).unwrap_or("").to_string();
                }
            }
            "formal_parameters" => params_node = Some(child),
            "constructor_body" | "block" => body_node = Some(child),
            _ => {}
        }
    }

    let (body_byte_range, signature_byte_range) = if let Some(body) = body_node {
        (
            Some((body.start_byte(), body.end_byte())),
            Some((start_byte, body.start_byte())),
        )
    } else {
        (None, Some((start_byte, end_byte)))
    };

    let mut signature_tokens = Vec::new();
    if !name.is_empty() {
        signature_tokens.push(name.to_lowercase());
    }
    if let Some(params) = params_node {
        signature_tokens.extend(extract_all_identifiers(params, source_bytes));
    }

    let all_tokens = extract_all_identifiers(node, source_bytes);
    let mut defined = Vec::new();
    if !name.is_empty() {
        defined.push(name.clone());
    }

    let current_id = items.len();
    items.push(JavaScopeItem {
        id: current_id,
        parent_id: Some(parent_class_id),
        kind: JavaNodeKind::Constructor { name },
        start_byte,
        end_byte,
        start_row,
        end_row,
        body_byte_range,
        signature_byte_range,
        signature_tokens,
        tokens: all_tokens,
        defined_symbols: defined,
        referenced_symbols: Vec::new(),
        children_ids: Vec::new(),
    });

    items[parent_class_id].children_ids.push(current_id);
}

fn process_field_declaration(
    node: Node,
    source_bytes: &[u8],
    parent_class_id: usize,
    items: &mut Vec<JavaScopeItem>,
) {
    let start_byte = node.start_byte();
    let end_byte = node.end_byte();
    let start_row = node.start_position().row;
    let end_row = node.end_position().row;

    let mut field_type = String::new();
    let mut names = Vec::new();

    let mut cursor = node.walk();
    for child in node.children(&mut cursor) {
        match child.kind() {
            "type_identifier"
            | "integral_type"
            | "floating_point_type"
            | "boolean_type"
            | "generic_type"
            | "array_type" => {
                if field_type.is_empty() {
                    if let Ok(t) = child.utf8_text(source_bytes) {
                        field_type = t.to_string();
                    }
                }
            }
            "variable_declarator" => {
                if let Some(name_node) = child.child_by_field_name("name") {
                    if let Ok(n) = name_node.utf8_text(source_bytes) {
                        names.push(n.to_string());
                    }
                }
            }
            _ => {}
        }
    }

    let name = names.join(", ");
    let tokens = extract_all_identifiers(node, source_bytes);

    let current_id = items.len();
    items.push(JavaScopeItem {
        id: current_id,
        parent_id: Some(parent_class_id),
        kind: JavaNodeKind::Field { name, field_type },
        start_byte,
        end_byte,
        start_row,
        end_row,
        body_byte_range: None,
        signature_byte_range: Some((start_byte, end_byte)),
        signature_tokens: tokens.clone(),
        tokens: tokens.clone(),
        defined_symbols: names,
        referenced_symbols: Vec::new(),
        children_ids: Vec::new(),
    });

    items[parent_class_id].children_ids.push(current_id);
}

pub fn extract_all_identifiers(node: Node, source_bytes: &[u8]) -> Vec<String> {
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
        "identifier" | "type_identifier" => {
            if let Ok(text) = node.utf8_text(source_bytes) {
                let lower = text.to_lowercase();
                if lower.len() >= 2 && seen.insert(lower.clone()) {
                    tokens.push(lower);
                }
            }
        }
        "string_fragment" | "string_literal" => {
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

fn tokenize_words(s: &str) -> Vec<String> {
    s.split(|c: char| !c.is_alphanumeric() && c != '_')
        .map(|w| w.trim().to_lowercase())
        .filter(|w| w.len() >= 2)
        .collect()
}
