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
        is_default: bool,
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
        is_generator: bool,
        is_static: bool,
        is_getter: bool,
        is_setter: bool,
        is_constructor: bool,
    },
    Field {
        name: String,
        is_static: bool,
        is_arrow: bool,
    },
    Statement,
    Block,
    Other,
}

#[derive(Debug, Clone)]
pub struct JsCall {
    pub caller_name: Option<String>,
    pub callee_name: String,
    pub line_number: usize,
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
    pub docstring: Option<String>,
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

pub fn collect_all_calls(tree: &Tree, source_bytes: &[u8], scopes: &[JsScopeItem]) -> Vec<JsCall> {
    let mut calls = Vec::new();
    let root = tree.root_node();
    walk_calls_recursive(root, source_bytes, None, scopes, &mut calls);
    calls
}

fn walk_calls_recursive(
    node: Node,
    source_bytes: &[u8],
    current_caller: Option<&str>,
    scopes: &[JsScopeItem],
    calls: &mut Vec<JsCall>,
) {
    let mut active_caller = current_caller;

    // Determine if this node introduces a new caller
    let node_start = node.start_byte();
    let node_end = node.end_byte();
    for scope in scopes {
        if scope.start_byte == node_start && scope.end_byte == node_end {
            match &scope.kind {
                JsNodeKind::Function { name, .. }
                | JsNodeKind::ArrowFunction { name, .. }
                | JsNodeKind::Method { name, .. } => {
                    if !name.is_empty() && name != "default" {
                        active_caller = Some(name.as_str());
                    }
                }
                _ => {}
            }
            break;
        }
    }

    if node.kind() == "call_expression" {
        if let Some(func_node) = node.child_by_field_name("function") {
            let callee_name = match func_node.kind() {
                "identifier" => func_node.utf8_text(source_bytes).ok().map(|s| s.to_string()),
                "member_expression" => {
                    if let Some(prop) = func_node.child_by_field_name("property") {
                        prop.utf8_text(source_bytes).ok().map(|s| s.to_string())
                    } else {
                        func_node.utf8_text(source_bytes).ok().map(|s| s.to_string())
                    }
                }
                _ => None,
            };

            if let Some(name) = callee_name {
                if !name.is_empty() {
                    calls.push(JsCall {
                        caller_name: active_caller.map(|s| s.to_string()),
                        callee_name: name,
                        line_number: node.start_position().row + 1,
                    });
                }
            }
        }
    }

    let mut cursor = node.walk();
    for child in node.children(&mut cursor) {
        walk_calls_recursive(child, source_bytes, active_caller, scopes, calls);
    }
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
                docstring: None,
            });

            if let Some(pid) = parent_id {
                items[pid].children_ids.push(current_id);
            }
            return;
        }
        "export_statement" => {
            let mut is_default = false;
            let mut decl_node = None;
            let mut id_export = None;
            let mut named_clause = None;

            let mut cursor = node.walk();
            for child in node.children(&mut cursor) {
                if child.kind() == "default" {
                    is_default = true;
                } else if is_declaration_node(child.kind()) {
                    decl_node = Some(child);
                } else if child.kind() == "identifier" {
                    id_export = Some(child);
                } else if child.kind() == "export_clause" || child.kind() == "named_exports" {
                    named_clause = Some(child);
                }
            }

            if let Some(decl) = decl_node {
                process_declaration(decl, Some(node), is_default, source_bytes, lines, parent_id, items);
                return;
            } else if is_default && id_export.is_some() {
                // e.g. export default TodoApp;
                let id_node = id_export.unwrap();
                let sym_name = id_node.utf8_text(source_bytes).unwrap_or("").to_string();
                let start_byte = node.start_byte();
                let end_byte = node.end_byte();
                let start_row = node.start_position().row;
                let end_row = node.end_position().row;
                let tokens = vec![sym_name.to_lowercase()];

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
                    referenced_symbols: vec![sym_name],
                    children_ids: Vec::new(),
                    docstring: None,
                });

                if let Some(pid) = parent_id {
                    items[pid].children_ids.push(current_id);
                }
                return;
            } else {
                // Named export like `export { a, b as c };` or `export * from './module'`
                let start_byte = node.start_byte();
                let end_byte = node.end_byte();
                let start_row = node.start_position().row;
                let end_row = node.end_position().row;
                let tokens = extract_all_identifiers(node, source_bytes);
                let mut refs = Vec::new();
                let mut defs = Vec::new();

                if let Some(clause) = named_clause {
                    let mut c_cursor = clause.walk();
                    for spec in clause.children(&mut c_cursor) {
                        if spec.kind() == "export_specifier" {
                            let mut s_cursor = spec.walk();
                            let mut s_name = None;
                            let mut s_alias = None;
                            for s_child in spec.children(&mut s_cursor) {
                                if s_child.kind() == "identifier" {
                                    if s_name.is_none() {
                                        s_name = s_child.utf8_text(source_bytes).ok().map(|s| s.to_string());
                                    } else {
                                        s_alias = s_child.utf8_text(source_bytes).ok().map(|s| s.to_string());
                                    }
                                }
                            }
                            if let Some(n) = s_name {
                                refs.push(n.clone());
                                if let Some(a) = s_alias {
                                    defs.push(a);
                                } else {
                                    defs.push(n);
                                }
                            }
                        }
                    }
                } else {
                    refs = tokens.clone();
                }

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
                    defined_symbols: defs,
                    referenced_symbols: refs,
                    children_ids: Vec::new(),
                    docstring: None,
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
            | "function_expression"
            | "function"
            | "class_declaration"
            | "class"
            | "lexical_declaration"
            | "variable_declaration"
            | "arrow_function"
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
    let doc_target = export_parent.unwrap_or(decl_node);
    let docstring = extract_jsdoc(doc_target, source_bytes);

    match decl_node.kind() {
        "function_declaration"
        | "generator_function_declaration"
        | "function_expression"
        | "function" => {
            let is_generator = decl_node.kind() == "generator_function_declaration"
                || decl_node.children(&mut decl_node.walk()).any(|c| c.kind() == "*");
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

            let all_tokens = extract_all_identifiers(export_parent.unwrap_or(decl_node), source_bytes);
            let mut defined = Vec::new();
            if !name.is_empty() {
                defined.push(name.clone());
            }
            if let Some(params) = params_node {
                collect_pattern_identifiers(params, source_bytes, &mut defined);
            }

            let referenced_symbols = if let Some(body) = body_node {
                collect_referenced_symbols(body, source_bytes, &defined)
            } else {
                Vec::new()
            };

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
                referenced_symbols,
                children_ids: Vec::new(),
                docstring,
            });

            if let Some(pid) = parent_id {
                items[pid].children_ids.push(current_id);
            }

            // Descend into body to discover nested helper functions and nested components
            if let Some(body) = body_node {
                let mut b_cursor = body.walk();
                for child in body.children(&mut b_cursor) {
                    if child.is_named() {
                        let k = child.kind();
                        if is_declaration_node(k) {
                            walk_node(child, source_bytes, lines, Some(current_id), items);
                        }
                    }
                }
            }
        }
        "arrow_function" => {
            // Direct export default arrow function: export default () => { ... }
            let mut is_async = false;
            let mut body_node = None;
            let mut params_node = None;
            let mut is_concise = true;

            let mut f_cursor = decl_node.walk();
            for f_child in decl_node.children(&mut f_cursor) {
                match f_child.kind() {
                    "async" => is_async = true,
                    "formal_parameters" | "identifier" => {
                        if params_node.is_none() {
                            params_node = Some(f_child);
                        }
                    }
                    "statement_block" => {
                        body_node = Some(f_child);
                        is_concise = false;
                    }
                    _ => {
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

            let name = if is_default { "default".to_string() } else { String::new() };
            let mut signature_tokens = Vec::new();
            if !name.is_empty() {
                signature_tokens.push(name.to_lowercase());
            }
            if let Some(params) = params_node {
                signature_tokens.extend(extract_all_identifiers(params, source_bytes));
            }

            let all_tokens = extract_all_identifiers(export_parent.unwrap_or(decl_node), source_bytes);
            let mut defined = Vec::new();
            if !name.is_empty() {
                defined.push(name.clone());
            }
            if let Some(params) = params_node {
                collect_pattern_identifiers(params, source_bytes, &mut defined);
            }

            let referenced_symbols = if let Some(body) = body_node {
                collect_referenced_symbols(body, source_bytes, &defined)
            } else {
                Vec::new()
            };

            let current_id = items.len();
            items.push(JsScopeItem {
                id: current_id,
                parent_id,
                kind: JsNodeKind::ArrowFunction {
                    name,
                    is_async,
                    is_export,
                    is_default,
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
                referenced_symbols,
                children_ids: Vec::new(),
                docstring,
            });

            if let Some(pid) = parent_id {
                items[pid].children_ids.push(current_id);
            }
        }
        "class_declaration" | "class" => {
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

            let mut referenced = Vec::new();
            if let Some(ref h) = heritage {
                for w in tokenize_words(h) {
                    if !defined.contains(&w) {
                        referenced.push(w);
                    }
                }
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
                referenced_symbols: referenced,
                children_ids: Vec::new(),
                docstring,
            });

            if let Some(pid) = parent_id {
                items[pid].children_ids.push(current_id);
            }

            // Walk class body to extract methods and class fields
            if let Some(body) = body_node {
                let mut b_cursor = body.walk();
                for member in body.children(&mut b_cursor) {
                    match member.kind() {
                        "method_definition" => {
                            process_method_definition(member, source_bytes, current_id, items);
                        }
                        "field_definition" | "public_field_definition" => {
                            process_field_definition(member, source_bytes, current_id, items);
                        }
                        _ => {}
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
    let docstring = extract_jsdoc(method_node, source_bytes);

    let mut name = String::new();
    let mut is_async = false;
    let mut is_generator = false;
    let mut is_static = false;
    let mut is_getter = false;
    let mut is_setter = false;
    let mut body_node = None;
    let mut params_node = None;

    let mut cursor = method_node.walk();
    for child in method_node.children(&mut cursor) {
        match child.kind() {
            "async" => is_async = true,
            "*" => is_generator = true,
            "static" => is_static = true,
            "get" => is_getter = true,
            "set" => is_setter = true,
            "property_identifier" | "private_property_identifier" | "identifier" => {
                if name.is_empty() {
                    name = child.utf8_text(source_bytes).unwrap_or("").to_string();
                }
            }
            "formal_parameters" => params_node = Some(child),
            "statement_block" => body_node = Some(child),
            _ => {}
        }
    }

    let is_constructor = name == "constructor";

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
    if let Some(params) = params_node {
        collect_pattern_identifiers(params, source_bytes, &mut defined);
    }

    let referenced_symbols = if let Some(body) = body_node {
        collect_referenced_symbols(body, source_bytes, &defined)
    } else {
        Vec::new()
    };

    let current_id = items.len();
    items.push(JsScopeItem {
        id: current_id,
        parent_id: Some(parent_class_id),
        kind: JsNodeKind::Method {
            name,
            is_async,
            is_generator,
            is_static,
            is_getter,
            is_setter,
            is_constructor,
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
        referenced_symbols,
        children_ids: Vec::new(),
        docstring,
    });

    items[parent_class_id].children_ids.push(current_id);
}

fn process_field_definition(
    field_node: Node,
    source_bytes: &[u8],
    parent_class_id: usize,
    items: &mut Vec<JsScopeItem>,
) {
    let start_byte = field_node.start_byte();
    let end_byte = field_node.end_byte();
    let start_row = field_node.start_position().row;
    let end_row = field_node.end_position().row;
    let docstring = extract_jsdoc(field_node, source_bytes);

    let mut name = String::new();
    let mut is_static = false;
    let mut arrow_val = None;

    let mut cursor = field_node.walk();
    for child in field_node.children(&mut cursor) {
        match child.kind() {
            "static" => is_static = true,
            "property_identifier" | "private_property_identifier" | "identifier" => {
                if name.is_empty() {
                    name = child.utf8_text(source_bytes).unwrap_or("").to_string();
                }
            }
            "arrow_function" | "function_expression" => {
                arrow_val = Some(child);
            }
            _ => {}
        }
    }

    if let Some(arrow) = arrow_val {
        let mut params_node = None;
        let mut body_node = None;
        let mut a_cursor = arrow.walk();
        for a_child in arrow.children(&mut a_cursor) {
            match a_child.kind() {
                "formal_parameters" | "identifier" => {
                    if params_node.is_none() {
                        params_node = Some(a_child);
                    }
                }
                "statement_block" => {
                    body_node = Some(a_child);
                }
                _ => {
                    if a_child.is_named() && body_node.is_none() && a_child.kind() != "formal_parameters" && a_child.kind() != "identifier" {
                        body_node = Some(a_child);
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

        let mut sig_tokens = Vec::new();
        if !name.is_empty() {
            sig_tokens.push(name.to_lowercase());
        }
        if let Some(params) = params_node {
            sig_tokens.extend(extract_all_identifiers(params, source_bytes));
        }

        let mut defined = Vec::new();
        if !name.is_empty() {
            defined.push(name.clone());
        }
        if let Some(params) = params_node {
            collect_pattern_identifiers(params, source_bytes, &mut defined);
        }

        let refs = if let Some(body) = body_node {
            collect_referenced_symbols(body, source_bytes, &defined)
        } else {
            Vec::new()
        };

        let current_id = items.len();
        items.push(JsScopeItem {
            id: current_id,
            parent_id: Some(parent_class_id),
            kind: JsNodeKind::Field {
                name,
                is_static,
                is_arrow: true,
            },
            start_byte,
            end_byte,
            start_row,
            end_row,
            body_byte_range,
            signature_byte_range,
            signature_tokens: sig_tokens.clone(),
            tokens: extract_all_identifiers(field_node, source_bytes),
            defined_symbols: defined,
            referenced_symbols: refs,
            children_ids: Vec::new(),
            docstring,
        });

        items[parent_class_id].children_ids.push(current_id);
    } else {
        let tokens = extract_all_identifiers(field_node, source_bytes);
        let mut defined = Vec::new();
        if !name.is_empty() {
            defined.push(name.clone());
        }

        let current_id = items.len();
        items.push(JsScopeItem {
            id: current_id,
            parent_id: Some(parent_class_id),
            kind: JsNodeKind::Field {
                name,
                is_static,
                is_arrow: false,
            },
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
            docstring,
        });

        items[parent_class_id].children_ids.push(current_id);
    }
}

fn process_variable_declaration(
    var_decl_node: Node,
    export_parent: Option<Node>,
    is_default: bool,
    source_bytes: &[u8],
    lines: &[&str],
    parent_id: Option<usize>,
    items: &mut Vec<JsScopeItem>,
) {
    let start_byte = export_parent.map(|p| p.start_byte()).unwrap_or_else(|| var_decl_node.start_byte());
    let end_byte = export_parent.map(|p| p.end_byte()).unwrap_or_else(|| var_decl_node.end_byte());
    let start_row = export_parent.map(|p| p.start_position().row).unwrap_or_else(|| var_decl_node.start_position().row);
    let end_row = export_parent.map(|p| p.end_position().row).unwrap_or_else(|| var_decl_node.end_position().row);
    let is_export = export_parent.is_some();
    let doc_target = export_parent.unwrap_or(var_decl_node);
    let docstring = extract_jsdoc(doc_target, source_bytes);

    let mut cursor = var_decl_node.walk();
    for child in var_decl_node.children(&mut cursor) {
        if child.kind() == "variable_declarator" {
            let mut var_name = String::new();
            let mut val_node = None;

            let mut v_cursor = child.walk();
            for v_child in child.children(&mut v_cursor) {
                match v_child.kind() {
                    "identifier" => {
                        if var_name.is_empty() {
                            var_name = v_child.utf8_text(source_bytes).unwrap_or("").to_string();
                        }
                    }
                    "arrow_function" | "function_expression" => {
                        val_node = Some(v_child);
                    }
                    "call_expression" => {
                        // Check for React.memo(...) or forwardRef(...) wrapping an arrow/function
                        if let Some(args) = v_child.child_by_field_name("arguments") {
                            let mut a_cursor = args.walk();
                            for a_child in args.children(&mut a_cursor) {
                                if a_child.kind() == "arrow_function" || a_child.kind() == "function_expression" {
                                    val_node = Some(a_child);
                                    break;
                                }
                            }
                        }
                    }
                    _ => {}
                }
            }

            if let Some(val) = val_node {
                if val.kind() == "arrow_function" || val.kind() == "function_expression" {
                    let mut is_async = false;
                    let mut body_node = None;
                    let mut params_node = None;
                    let mut is_concise = true;

                    let mut f_cursor = val.walk();
                    for f_child in val.children(&mut f_cursor) {
                        match f_child.kind() {
                            "async" => is_async = true,
                            "formal_parameters" | "identifier" => {
                                if params_node.is_none() {
                                    params_node = Some(f_child);
                                }
                            }
                            "statement_block" => {
                                body_node = Some(f_child);
                                is_concise = false;
                            }
                            _ => {
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
                    if let Some(params) = params_node {
                        collect_pattern_identifiers(params, source_bytes, &mut defined);
                    }

                    let referenced_symbols = if let Some(body) = body_node {
                        collect_referenced_symbols(body, source_bytes, &defined)
                    } else {
                        Vec::new()
                    };

                    let current_id = items.len();
                    items.push(JsScopeItem {
                        id: current_id,
                        parent_id,
                        kind: JsNodeKind::ArrowFunction {
                            name: var_name,
                            is_async,
                            is_export,
                            is_default,
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
                        referenced_symbols,
                        children_ids: Vec::new(),
                        docstring,
                    });

                    if let Some(pid) = parent_id {
                        items[pid].children_ids.push(current_id);
                    }

                    // If body is a block, descend into body to discover nested helper declarations
                    if let Some(body) = body_node {
                        if !is_concise {
                            let mut b_cursor = body.walk();
                            for b_child in body.children(&mut b_cursor) {
                                if b_child.is_named() && is_declaration_node(b_child.kind()) {
                                    walk_node(b_child, source_bytes, lines, Some(current_id), items);
                                }
                            }
                        }
                    }
                    return;
                }
            }
        }
    }

    // Regular statement (constants, variables, destructuring, etc.)
    let tokens = extract_all_identifiers(export_parent.unwrap_or(var_decl_node), source_bytes);
    let mut defined = Vec::new();
    collect_pattern_identifiers(var_decl_node, source_bytes, &mut defined);

    let referenced_symbols = collect_referenced_symbols(export_parent.unwrap_or(var_decl_node), source_bytes, &defined);

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
        referenced_symbols,
        children_ids: Vec::new(),
        docstring,
    });

    if let Some(pid) = parent_id {
        items[pid].children_ids.push(current_id);
    }
}

fn extract_jsdoc(node: Node, source_bytes: &[u8]) -> Option<String> {
    let mut prev = node.prev_named_sibling();
    if prev.is_none() {
        prev = node.prev_sibling();
    }
    if let Some(comment_node) = prev {
        if comment_node.kind() == "comment" {
            if let Ok(text) = comment_node.utf8_text(source_bytes) {
                let trimmed = text.trim();
                if trimmed.starts_with("/**") {
                    let inner = trimmed
                        .strip_prefix("/**")
                        .unwrap_or(trimmed)
                        .strip_suffix("*/")
                        .unwrap_or(trimmed);
                    let cleaned_lines: Vec<String> = inner
                        .lines()
                        .map(|l| {
                            let t = l.trim();
                            if t.starts_with('*') {
                                t[1..].trim().to_string()
                            } else {
                                t.to_string()
                            }
                        })
                        .filter(|l| !l.is_empty())
                        .collect();
                    if !cleaned_lines.is_empty() {
                        return Some(cleaned_lines.join("\n"));
                    }
                }
            }
        }
    }
    None
}

fn collect_import_identifiers(node: Node, source_bytes: &[u8], defined: &mut Vec<String>) {
    let mut cursor = node.walk();
    for child in node.children(&mut cursor) {
        match child.kind() {
            "import_clause" | "named_imports" | "namespace_import" => {
                collect_import_identifiers(child, source_bytes, defined);
            }
            "import_specifier" => {
                // If there is an alias (e.g. `import { foo as bar }`), alias is the bound symbol!
                let mut s_cursor = child.walk();
                let mut orig_name = None;
                let mut alias_name = None;
                for s_child in child.children(&mut s_cursor) {
                    if s_child.kind() == "identifier" {
                        if orig_name.is_none() {
                            orig_name = s_child.utf8_text(source_bytes).ok().map(|s| s.to_string());
                        } else {
                            alias_name = s_child.utf8_text(source_bytes).ok().map(|s| s.to_string());
                        }
                    }
                }
                if let Some(alias) = alias_name {
                    if !defined.contains(&alias) {
                        defined.push(alias);
                    }
                } else if let Some(orig) = orig_name {
                    if !defined.contains(&orig) {
                        defined.push(orig);
                    }
                }
            }
            "identifier" => {
                if let Ok(name) = child.utf8_text(source_bytes) {
                    let s = name.trim().to_string();
                    if !s.is_empty() && !defined.contains(&s) {
                        defined.push(s);
                    }
                }
            }
            _ => {}
        }
    }
}

pub fn collect_pattern_identifiers(node: Node, source_bytes: &[u8], defined: &mut Vec<String>) {
    match node.kind() {
        "identifier" | "shorthand_property_identifier_pattern" => {
            if let Ok(name) = node.utf8_text(source_bytes) {
                let s = name.trim().to_string();
                if !s.is_empty() && !defined.contains(&s) {
                    defined.push(s);
                }
            }
        }
        "pair_pattern" => {
            if let Some(val_node) = node.child_by_field_name("value") {
                collect_pattern_identifiers(val_node, source_bytes, defined);
            }
        }
        "assignment_pattern" => {
            if let Some(left) = node.child_by_field_name("left") {
                collect_pattern_identifiers(left, source_bytes, defined);
            }
        }
        "rest_pattern" => {
            let mut cursor = node.walk();
            for child in node.children(&mut cursor) {
                collect_pattern_identifiers(child, source_bytes, defined);
            }
        }
        "object_pattern" | "array_pattern" => {
            let mut cursor = node.walk();
            for child in node.children(&mut cursor) {
                let k = child.kind();
                if k != ":" && k != "=" && k != "{" && k != "}" && k != "[" && k != "]" && k != "," {
                    collect_pattern_identifiers(child, source_bytes, defined);
                }
            }
        }
        "formal_parameters" => {
            let mut cursor = node.walk();
            for child in node.children(&mut cursor) {
                let k = child.kind();
                if k != "(" && k != ")" && k != "," {
                    collect_pattern_identifiers(child, source_bytes, defined);
                }
            }
        }
        "variable_declarator" => {
            if let Some(name_node) = node.child_by_field_name("name") {
                collect_pattern_identifiers(name_node, source_bytes, defined);
            }
        }
        "lexical_declaration" | "variable_declaration" => {
            let mut cursor = node.walk();
            for child in node.children(&mut cursor) {
                if child.kind() == "variable_declarator" {
                    collect_pattern_identifiers(child, source_bytes, defined);
                }
            }
        }
        _ => {}
    }
}

pub fn collect_referenced_symbols(
    node: Node,
    source_bytes: &[u8],
    defined_in_scope: &[String],
) -> Vec<String> {
    let mut refs = Vec::new();
    let mut seen = HashSet::new();
    let defined_set: HashSet<String> = defined_in_scope.iter().map(|s| s.to_lowercase()).collect();

    collect_refs_recursive(node, source_bytes, &defined_set, &mut seen, &mut refs);
    refs
}

fn collect_refs_recursive(
    node: Node,
    source_bytes: &[u8],
    defined_set: &HashSet<String>,
    seen: &mut HashSet<String>,
    refs: &mut Vec<String>,
) {
    match node.kind() {
        "identifier" | "property_identifier" | "shorthand_property_identifier_pattern" => {
            if let Ok(text) = node.utf8_text(source_bytes) {
                let trimmed = text.trim();
                let lower = trimmed.to_lowercase();
                if trimmed.len() >= 2 && !defined_set.contains(&lower) && seen.insert(trimmed.to_string()) {
                    refs.push(trimmed.to_string());
                }
            }
        }
        "jsx_identifier" => {
            if let Ok(text) = node.utf8_text(source_bytes) {
                let trimmed = text.trim();
                let lower = trimmed.to_lowercase();
                if trimmed.len() >= 2 && !defined_set.contains(&lower) && seen.insert(trimmed.to_string()) {
                    refs.push(trimmed.to_string());
                }
            }
        }
        _ => {}
    }

    let mut cursor = node.walk();
    for child in node.children(&mut cursor) {
        collect_refs_recursive(child, source_bytes, defined_set, seen, refs);
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
        "identifier"
        | "property_identifier"
        | "private_property_identifier"
        | "shorthand_property_identifier_pattern"
        | "type_identifier"
        | "jsx_identifier" => {
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
