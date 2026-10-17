//! JavaScript + JSX AST Parser
//!
//! Uses Tree-Sitter JavaScript grammar to extract functions, classes, methods,
//! arrow functions, imports, JSX components, and statement blocks.

use std::cell::RefCell;
use std::collections::HashSet;
use tree_sitter::{Node, Parser, Tree};

thread_local! {
    static JS_PARSER: RefCell<Parser> = RefCell::new({
        let mut p = Parser::new();
        p.set_language(&tree_sitter_javascript::language()).expect("Failed to load JavaScript grammar");
        p
    });
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum JsNodeKind {
    Import,
    Function {
        name: String,
        is_async: bool,
        is_generator: bool,
        is_export: bool,
        is_default: bool,
    },
    ArrowFunction {
        name: String,
        is_async: bool,
        is_export: bool,
        is_concise: bool,
    },
    Class {
        name: String,
        heritage: Option<String>,
        is_export: bool,
        is_default: bool,
    },
    Method {
        name: String,
        is_async: bool,
        is_static: bool,
        is_getter: bool,
        is_setter: bool,
    },
    Statement,
    Block,
    Other,
}

#[derive(Debug, Clone)]
pub struct JsScopeItem {
    pub id: usize,
    pub parent_id: Option<usize>,
    pub kind: JsNodeKind,
    pub start_byte: usize,
    pub end_byte: usize,
    pub start_row: usize,
    pub end_row: usize,
    /// Byte range of the body block if this item has a stubbable body
    pub body_byte_range: Option<(usize, usize)>,
    /// Byte range of the signature (from start up to body start)
    pub signature_byte_range: Option<(usize, usize)>,
    /// Tokens extracted from the signature and definition
    pub signature_tokens: Vec<String>,
    /// All tokens in this scope
    pub tokens: Vec<String>,
    /// Defined symbols (function name, class name, parameters, variables)
    pub defined_symbols: Vec<String>,
    /// Referenced identifiers in this scope
    pub referenced_symbols: Vec<String>,
    pub children_ids: Vec<usize>,
}

pub fn parse_ast(code: &str) -> Result<Tree, String> {
    JS_PARSER.with(|parser_cell| {
        let mut parser = parser_cell.borrow_mut();
        parser.parse(code, None).ok_or_else(|| "Failed to parse JavaScript/JSX code".to_string())
    })
}

pub fn collect_scopes(tree: &Tree, source_bytes: &[u8], lines: &[&str]) -> Vec<JsScopeItem> {
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
    items: &mut Vec<JsScopeItem>,
) {
    let current_id = items.len();

    match node.kind() {
        "import_statement" => {
            let start_byte = node.start_byte();
            let end_byte = node.end_byte();
            let start_row = node.start_position().row;
            let end_row = node.end_position().row;

            let mut defined = Vec::new();
            collect_import_identifiers(node, source_bytes, &mut defined);

            let tokens = extract_all_identifiers(node, source_bytes);

            items.push(JsScopeItem {
                id: current_id,
                parent_id,
                kind: JsNodeKind::Import,
                start_byte,
                end_byte,
                start_row,
                end_row,
                body_byte_range: None,
                signature_byte_range: Some((start_byte, end_byte)),
                signature_tokens: tokens.clone(),
                tokens,
                defined_symbols: defined,
                referenced_symbols: Vec::new(),
                children_ids: Vec::new(),
            });

            if let Some(pid) = parent_id {
                items[pid].children_ids.push(current_id);
            }
            return;
        }
        "export_statement" => {
            // Check what is being exported
            let mut is_default = false;
            let mut decl_node = None;
            let mut cursor = node.walk();
            for child in node.children(&mut cursor) {
                if child.kind() == "default" {
                    is_default = true;
                } else if is_declaration_node(child.kind()) {
                    decl_node = Some(child);
                }
            }

            if let Some(decl) = decl_node {
                // Process the declaration as an exported item starting at export_statement.start_byte()
                process_declaration(decl, Some(node), is_default, source_bytes, lines, parent_id, items);
                return;
            } else {
                // Named export like `export { a, b };`
                let start_byte = node.start_byte();
                let end_byte = node.end_byte();
                let start_row = node.start_position().row;
                let end_row = node.end_position().row;
                let tokens = extract_all_identifiers(node, source_bytes);

                items.push(JsScopeItem {
                    id: current_id,
                    parent_id,
                    kind: JsNodeKind::Statement,
                    start_byte,
                    end_byte,
                    start_row,
                    end_row,
                    body_byte_range: None,
                    signature_byte_range: Some((start_byte, end_byte)),
                    signature_tokens: tokens.clone(),
                    tokens: tokens.clone(),
                    defined_symbols: Vec::new(),
                    referenced_symbols: tokens,
                    children_ids: Vec::new(),
                });

                if let Some(pid) = parent_id {
                    items[pid].children_ids.push(current_id);
                }
                return;
            }
        }
        "function_declaration" | "generator_function_declaration" => {
            process_declaration(node, None, false, source_bytes, lines, parent_id, items);
            return;
        }
        "class_declaration" => {
            process_declaration(node, None, false, source_bytes, lines, parent_id, items);
            return;
        }
        "lexical_declaration" | "variable_declaration" => {
            process_variable_declaration(node, None, false, source_bytes, lines, parent_id, items);
            return;
        }
        _ => {}
    }

    // Default traversal for unhandled containers (e.g. program, statement blocks)
    let mut cursor = node.walk();
    for child in node.children(&mut cursor) {
        if child.is_named() {
            walk_node(child, source_bytes, lines, parent_id, items);
        }
    }
}

fn is_declaration_node(kind: &str) -> bool {
    matches!(
        kind,
        "function_declaration"
            | "generator_function_declaration"
            | "class_declaration"
            | "lexical_declaration"
            | "variable_declaration"
    )
}

fn process_declaration(
    decl_node: Node,
    export_parent: Option<Node>,
    is_default: bool,
    source_bytes: &[u8],
    lines: &[&str],
    parent_id: Option<usize>,
    items: &mut Vec<JsScopeItem>,
) {
    let start_byte = export_parent.map(|p| p.start_byte()).unwrap_or_else(|| decl_node.start_byte());
    let end_byte = export_parent.map(|p| p.end_byte()).unwrap_or_else(|| decl_node.end_byte());
    let start_row = export_parent.map(|p| p.start_position().row).unwrap_or_else(|| decl_node.start_position().row);
    let end_row = export_parent.map(|p| p.end_position().row).unwrap_or_else(|| decl_node.end_position().row);
    let is_export = export_parent.is_some();

    match decl_node.kind() {
        "function_declaration" | "generator_function_declaration" => {
            let is_generator = decl_node.kind() == "generator_function_declaration";
            let mut name = String::new();
            let mut is_async = false;
            let mut body_node = None;
            let mut params_node = None;

            let mut cursor = decl_node.walk();
            for child in decl_node.children(&mut cursor) {
                match child.kind() {
                    "async" => is_async = true,
                    "identifier" => {
                        if name.is_empty() {
                            name = child.utf8_text(source_bytes).unwrap_or("").to_string();
                        }
                    }
                    "formal_parameters" => params_node = Some(child),
                    "statement_block" => body_node = Some(child),
                    _ => {}
                }
            }

            if name.is_empty() && is_default {
                name = "default".to_string();
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

            let all_tokens = extract_all_identifiers(decl_node, source_bytes);
            let mut defined = Vec::new();
            if !name.is_empty() {
                defined.push(name.clone());
            }
            if let Some(params) = params_node {
                defined.extend(extract_all_identifiers(params, source_bytes));
            }

            let current_id = items.len();
            items.push(JsScopeItem {
                id: current_id,
                parent_id,
                kind: JsNodeKind::Function {
                    name,
                    is_async,
                    is_generator,
                    is_export,
                    is_default,
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

            if let Some(pid) = parent_id {
                items[pid].children_ids.push(current_id);
            }
        }
        "class_declaration" => {
            let mut name = String::new();
            let mut heritage = None;
            let mut body_node = None;

            let mut cursor = decl_node.walk();
            for child in decl_node.children(&mut cursor) {
                match child.kind() {
                    "identifier" => {
                        if name.is_empty() {
                            name = child.utf8_text(source_bytes).unwrap_or("").to_string();
                        }
                    }
                    "class_heritage" => {
                        heritage = child.utf8_text(source_bytes).ok().map(|s| s.to_string());
                    }
                    "class_body" => body_node = Some(child),
                    _ => {}
                }
            }

            if name.is_empty() && is_default {
                name = "default".to_string();
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
            if let Some(ref h) = heritage {
                signature_tokens.extend(tokenize_words(h));
            }

            let mut defined = Vec::new();
            if !name.is_empty() {
                defined.push(name.clone());
            }

            let current_id = items.len();
            items.push(JsScopeItem {
                id: current_id,
                parent_id,
                kind: JsNodeKind::Class {
                    name,
                    heritage,
                    is_export,
                    is_default,
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

            // Walk class body to extract methods
            if let Some(body) = body_node {
                let mut b_cursor = body.walk();
                for member in body.children(&mut b_cursor) {
                    if member.kind() == "method_definition" {
                        process_method_definition(member, source_bytes, current_id, items);
                    }
                }
            }
        }
        "lexical_declaration" | "variable_declaration" => {
            process_variable_declaration(decl_node, export_parent, is_default, source_bytes, lines, parent_id, items);
        }
        _ => {}
    }
}

fn process_method_definition(
    method_node: Node,
    source_bytes: &[u8],
    parent_class_id: usize,
    items: &mut Vec<JsScopeItem>,
) {
    let start_byte = method_node.start_byte();
    let end_byte = method_node.end_byte();
    let start_row = method_node.start_position().row;
    let end_row = method_node.end_position().row;

    let mut name = String::new();
    let mut is_async = false;
    let mut is_static = false;
    let mut is_getter = false;
    let mut is_setter = false;
    let mut body_node = None;
    let mut params_node = None;

    let mut cursor = method_node.walk();
    for child in method_node.children(&mut cursor) {
        match child.kind() {
            "async" => is_async = true,
            "static" => is_static = true,
            "get" => is_getter = true,
            "set" => is_setter = true,
            "property_identifier" | "identifier" => {
                if name.is_empty() {
                    name = child.utf8_text(source_bytes).unwrap_or("").to_string();
                }
            }
            "formal_parameters" => params_node = Some(child),
            "statement_block" => body_node = Some(child),
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

    let all_tokens = extract_all_identifiers(method_node, source_bytes);
    let mut defined = Vec::new();
    if !name.is_empty() {
        defined.push(name.clone());
    }

    let current_id = items.len();
    items.push(JsScopeItem {
        id: current_id,
        parent_id: Some(parent_class_id),
        kind: JsNodeKind::Method {
            name,
            is_async,
            is_static,
            is_getter,
            is_setter,
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

fn process_variable_declaration(
    var_decl_node: Node,
    export_parent: Option<Node>,
    _is_default: bool,
    source_bytes: &[u8],
    _lines: &[&str],
    parent_id: Option<usize>,
    items: &mut Vec<JsScopeItem>,
) {
    let start_byte = export_parent.map(|p| p.start_byte()).unwrap_or_else(|| var_decl_node.start_byte());
    let end_byte = export_parent.map(|p| p.end_byte()).unwrap_or_else(|| var_decl_node.end_byte());
    let start_row = export_parent.map(|p| p.start_position().row).unwrap_or_else(|| var_decl_node.start_position().row);
    let end_row = export_parent.map(|p| p.end_position().row).unwrap_or_else(|| var_decl_node.end_position().row);
    let is_export = export_parent.is_some();

    // Check if this declaration contains an arrow function or function expression
    let mut cursor = var_decl_node.walk();
    for child in var_decl_node.children(&mut cursor) {
        if child.kind() == "variable_declarator" {
            let mut var_name = String::new();
            let mut value_node = None;

            let mut v_cursor = child.walk();
            for v_child in child.children(&mut v_cursor) {
                match v_child.kind() {
                    "identifier" => {
                        if var_name.is_empty() {
                            var_name = v_child.utf8_text(source_bytes).unwrap_or("").to_string();
                        }
                    }
                    "arrow_function" | "function_expression" => {
                        value_node = Some(v_child);
                    }
                    _ => {}
                }
            }

            if let Some(val) = value_node {
                if val.kind() == "arrow_function" || val.kind() == "function_expression" {
                    let mut is_async = false;
                    let mut body_node = None;
                    let mut params_node = None;
                    let mut is_concise = true;

                    let mut f_cursor = val.walk();
                    for f_child in val.children(&mut f_cursor) {
                        match f_child.kind() {
                            "async" => is_async = true,
                            "formal_parameters" => params_node = Some(f_child),
                            "statement_block" => {
                                body_node = Some(f_child);
                                is_concise = false;
                            }
                            _ => {
                                // For concise arrow function: () => expr
                                if f_child.is_named() && f_child.kind() != "formal_parameters" && f_child.kind() != "identifier" && body_node.is_none() {
                                    body_node = Some(f_child);
                                }
                            }
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
                    if !var_name.is_empty() {
                        signature_tokens.push(var_name.to_lowercase());
                    }
                    if let Some(params) = params_node {
                        signature_tokens.extend(extract_all_identifiers(params, source_bytes));
                    }

                    let all_tokens = extract_all_identifiers(export_parent.unwrap_or(var_decl_node), source_bytes);
                    let mut defined = Vec::new();
                    if !var_name.is_empty() {
                        defined.push(var_name.clone());
                    }

                    let current_id = items.len();
                    items.push(JsScopeItem {
                        id: current_id,
                        parent_id,
                        kind: JsNodeKind::ArrowFunction {
                            name: var_name,
                            is_async,
                            is_export,
                            is_concise,
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

                    if let Some(pid) = parent_id {
                        items[pid].children_ids.push(current_id);
                    }
                    return;
                }
            }
        }
    }

    // Regular statement (constants, variables, etc.)
    let tokens = extract_all_identifiers(export_parent.unwrap_or(var_decl_node), source_bytes);
    let mut defined = Vec::new();
    collect_declaration_identifiers(var_decl_node, source_bytes, &mut defined);

    let current_id = items.len();
    items.push(JsScopeItem {
        id: current_id,
        parent_id,
        kind: JsNodeKind::Statement,
        start_byte,
        end_byte,
        start_row,
        end_row,
        body_byte_range: None,
        signature_byte_range: Some((start_byte, end_byte)),
        signature_tokens: tokens.clone(),
        tokens: tokens.clone(),
        defined_symbols: defined,
        referenced_symbols: tokens,
        children_ids: Vec::new(),
    });

    if let Some(pid) = parent_id {
        items[pid].children_ids.push(current_id);
    }
}

fn collect_import_identifiers(node: Node, source_bytes: &[u8], defined: &mut Vec<String>) {
    let mut cursor = node.walk();
    for child in node.children(&mut cursor) {
        if child.kind() == "import_clause" || child.kind() == "named_imports" || child.kind() == "import_specifier" {
            collect_import_identifiers(child, source_bytes, defined);
        } else if child.kind() == "identifier" {
            if let Ok(name) = child.utf8_text(source_bytes) {
                defined.push(name.to_string());
            }
        }
    }
}

fn collect_declaration_identifiers(node: Node, source_bytes: &[u8], defined: &mut Vec<String>) {
    let mut cursor = node.walk();
    for child in node.children(&mut cursor) {
        if child.kind() == "variable_declarator" {
            if let Some(name_node) = child.child_by_field_name("name") {
                if let Ok(name) = name_node.utf8_text(source_bytes) {
                    defined.push(name.to_string());
                }
            }
        }
    }
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
        "identifier" | "property_identifier" | "shorthand_property_identifier_pattern" | "type_identifier" => {
            if let Ok(text) = node.utf8_text(source_bytes) {
                let lower = text.to_lowercase();
                if lower.len() >= 2 && seen.insert(lower.clone()) {
                    tokens.push(lower);
                }
            }
        }
        "string_fragment" => {
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
