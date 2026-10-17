//! Rust AST Parser using Tree-Sitter
//!
//! Extracts uses, modules, structs, enums, traits, impl blocks, functions,
//! methods, constants, statics, type aliases, and macros.

use std::cell::RefCell;
use std::collections::HashSet;
use tree_sitter::{Node, Parser, Tree};

thread_local! {
    static RUST_PARSER: RefCell<Parser> = RefCell::new({
        let mut p = Parser::new();
        p.set_language(&tree_sitter_rust::language()).expect("Failed to load Rust grammar");
        p
    });
}

pub fn parse_ast(code: &str) -> Result<Tree, String> {
    RUST_PARSER.with(|parser_cell| {
        let mut parser = parser_cell.borrow_mut();
        parser
            .parse(code, None)
            .ok_or_else(|| "Failed to parse Rust source code".to_string())
    })
}

#[derive(Debug, Clone)]
pub struct RustCall {
    pub caller_name: Option<String>,
    pub callee_name: String,
    pub line_number: usize,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum RustNodeKind {
    Use,
    Mod {
        name: String,
        is_inline: bool,
    },
    Struct {
        name: String,
    },
    Enum {
        name: String,
        variants: Vec<String>,
    },
    Trait {
        name: String,
    },
    Impl {
        target_type: String,
        trait_name: Option<String>,
    },
    Function {
        name: String,
        is_async: bool,
        is_const: bool,
        is_unsafe: bool,
        has_body: bool,
        is_method: bool,
        is_getter: bool,
        is_setter: bool,
    },
    Const {
        name: String,
    },
    Static {
        name: String,
    },
    TypeAlias {
        name: String,
    },
    MacroDef {
        name: String,
    },
    Comment,
    Other,
}

#[derive(Debug, Clone)]
pub struct RustScopeItem {
    pub id: usize,
    pub parent_id: Option<usize>,
    pub kind: RustNodeKind,
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
    pub docstring: Option<String>,
}

pub fn collect_scopes(tree: &Tree, source_bytes: &[u8], _lines: &[&str]) -> Vec<RustScopeItem> {
    let mut items = Vec::new();
    let root = tree.root_node();
    let mut cursor = root.walk();

    for child in root.children(&mut cursor) {
        if child.is_named() {
            walk_item(child, source_bytes, None, &mut items);
        }
    }

    items
}

const RUST_PRIMITIVES: &[&str] = &[
    "i8", "i16", "i32", "i64", "i128", "isize",
    "u8", "u16", "u32", "u64", "u128", "usize",
    "f32", "f64", "bool", "char", "str", "String",
    "self", "Self", "true", "false", "Option", "Some", "None",
    "Result", "Ok", "Err", "Vec", "Box", "Rc", "Arc", "Cell", "RefCell",
    "println", "format", "eprintln", "print", "write", "panic", "todo", "unimplemented",
];

pub fn strip_type_generics(t: &str) -> &str {
    let s = t.trim().trim_start_matches('&').trim_start_matches("mut ").trim();
    if let Some(idx) = s.find('<') {
        s[..idx].trim()
    } else {
        s
    }
}

pub fn find_item_start_with_attributes(node: Node, source_bytes: &[u8]) -> (usize, usize) {
    let mut current_start_byte = node.start_byte();
    let mut current_start_row = node.start_position().row;
    let mut prev = node.prev_named_sibling();

    while let Some(p) = prev {
        let p_kind = p.kind();
        if p_kind == "attribute_item" {
            if let Ok(text) = p.utf8_text(source_bytes) {
                let trimmed = text.trim();
                if trimmed.starts_with("#[") {
                    current_start_byte = p.start_byte();
                    current_start_row = p.start_position().row;
                    prev = p.prev_named_sibling();
                    continue;
                }
            }
            break;
        } else if p_kind == "line_comment" || p_kind == "block_comment" {
            if let Ok(text) = p.utf8_text(source_bytes) {
                let trimmed = text.trim();
                let is_outer_doc = trimmed.starts_with("///") || trimmed.starts_with("/**");
                let p_end_row = p.end_position().row;
                if is_outer_doc || p_end_row + 1 >= current_start_row {
                    current_start_byte = p.start_byte();
                    current_start_row = p.start_position().row;
                    prev = p.prev_named_sibling();
                    continue;
                }
            }
            break;
        } else {
            break;
        }
    }

    (current_start_byte, current_start_row)
}

pub fn extract_rust_doc(node: Node, source_bytes: &[u8]) -> Option<String> {
    let mut doc_lines = Vec::new();
    let mut prev = node.prev_named_sibling();

    while let Some(p) = prev {
        let p_kind = p.kind();
        if p_kind == "line_comment" || p_kind == "block_comment" {
            if let Ok(text) = p.utf8_text(source_bytes) {
                let trimmed = text.trim();
                if trimmed.starts_with("///") {
                    let content = trimmed.trim_start_matches("///").trim();
                    doc_lines.push(content.to_string());
                    prev = p.prev_named_sibling();
                    continue;
                } else if trimmed.starts_with("/**") && trimmed.ends_with("*/") {
                    let inner = &trimmed[3..trimmed.len() - 2];
                    for line in inner.lines() {
                        let cleaned = line.trim().trim_start_matches('*').trim();
                        if !cleaned.is_empty() {
                            doc_lines.push(cleaned.to_string());
                        }
                    }
                    prev = p.prev_named_sibling();
                    continue;
                }
            }
        } else if p_kind == "attribute_item" {
            prev = p.prev_named_sibling();
            continue;
        }
        break;
    }

    if doc_lines.is_empty() {
        None
    } else {
        doc_lines.reverse();
        Some(doc_lines.join("\n"))
    }
}

fn is_attached_doc_comment(node: Node, source_bytes: &[u8]) -> bool {
    if let Ok(text) = node.utf8_text(source_bytes) {
        let trimmed = text.trim();
        let is_outer_doc = trimmed.starts_with("///") || trimmed.starts_with("/**");
        let mut next = node.next_named_sibling();
        while let Some(n) = next {
            let n_kind = n.kind();
            if n_kind == "attribute_item" {
                next = n.next_named_sibling();
                continue;
            }
            if is_decoratable_item(n_kind) {
                if is_outer_doc || node.end_position().row + 1 >= n.start_position().row {
                    return true;
                }
            }
            break;
        }
    }
    false
}

fn is_decoratable_item(kind: &str) -> bool {
    matches!(
        kind,
        "struct_item"
            | "enum_item"
            | "trait_item"
            | "impl_item"
            | "function_item"
            | "const_item"
            | "static_item"
            | "type_item"
            | "mod_item"
    )
}

pub fn collect_referenced_symbols(
    node: Node,
    source_bytes: &[u8],
    defined_names: &[String],
) -> Vec<String> {
    let mut referenced = Vec::new();
    let mut seen = HashSet::new();
    for d in defined_names {
        seen.insert(d.clone());
        seen.insert(strip_type_generics(d).to_string());
    }
    for prim in RUST_PRIMITIVES {
        seen.insert(prim.to_string());
    }

    let all_idents = extract_all_identifiers(node, source_bytes);
    for id in all_idents {
        let base = strip_type_generics(&id).to_string();
        if !seen.contains(&id) && !seen.contains(&base) {
            seen.insert(id.clone());
            referenced.push(id);
        }
    }

    referenced
}

pub fn collect_all_calls(root: Node, source_bytes: &[u8]) -> Vec<RustCall> {
    let mut calls = Vec::new();
    walk_calls_recursive(root, source_bytes, &mut calls, None);
    calls
}

fn walk_calls_recursive(
    node: Node,
    source_bytes: &[u8],
    calls: &mut Vec<RustCall>,
    current_caller: Option<String>,
) {
    let kind = node.kind();
    let mut new_caller = current_caller.clone();

    if kind == "function_item" {
        let mut cursor = node.walk();
        for child in node.children(&mut cursor) {
            if child.kind() == "identifier" {
                if let Ok(t) = child.utf8_text(source_bytes) {
                    new_caller = Some(t.to_string());
                    break;
                }
            }
        }
    } else if kind == "call_expression" {
        let mut callee = String::new();
        let mut cursor = node.walk();
        for child in node.children(&mut cursor) {
            let c_kind = child.kind();
            if c_kind == "identifier" {
                if let Ok(t) = child.utf8_text(source_bytes) {
                    callee = t.trim().to_string();
                    break;
                }
            } else if c_kind == "field_expression" {
                let mut f_cursor = child.walk();
                for f_child in child.children(&mut f_cursor) {
                    if f_child.kind() == "field_identifier" {
                        if let Ok(t) = f_child.utf8_text(source_bytes) {
                            callee = t.trim().to_string();
                        }
                    }
                }
                if callee.is_empty() {
                    if let Ok(t) = child.utf8_text(source_bytes) {
                        callee = t.split('.').last().unwrap_or(t).trim().to_string();
                    }
                }
                break;
            } else if c_kind == "scoped_identifier" {
                let mut s_cursor = child.walk();
                for s_child in child.children(&mut s_cursor) {
                    if s_child.kind() == "identifier" {
                        if let Ok(t) = s_child.utf8_text(source_bytes) {
                            callee = t.trim().to_string();
                        }
                    }
                }
                if callee.is_empty() {
                    if let Ok(t) = child.utf8_text(source_bytes) {
                        callee = t.split("::").last().unwrap_or(t).trim().to_string();
                    }
                }
                break;
            }
        }

        if !callee.is_empty() {
            calls.push(RustCall {
                caller_name: current_caller.clone(),
                callee_name: callee,
                line_number: node.start_position().row + 1,
            });
        }
    } else if kind == "macro_invocation" {
        let mut cursor = node.walk();
        for child in node.children(&mut cursor) {
            if child.kind() == "identifier" {
                if let Ok(t) = child.utf8_text(source_bytes) {
                    let callee = t.trim().to_string();
                    if !callee.is_empty() {
                        calls.push(RustCall {
                            caller_name: current_caller.clone(),
                            callee_name: callee,
                            line_number: node.start_position().row + 1,
                        });
                        break;
                    }
                }
            }
        }
    }

    let mut cursor = node.walk();
    for child in node.children(&mut cursor) {
        walk_calls_recursive(child, source_bytes, calls, new_caller.clone());
    }
}

fn walk_item(
    node: Node,
    source_bytes: &[u8],
    parent_id: Option<usize>,
    items: &mut Vec<RustScopeItem>,
) {
    let kind_str = node.kind();
    match kind_str {
        "attribute_item" => {
            // Handled as part of the item it decorates
        }
        "use_declaration" => {
            process_use(node, source_bytes, parent_id, items);
        }
        "mod_item" => {
            process_mod(node, source_bytes, parent_id, items);
        }
        "struct_item" => {
            process_struct(node, source_bytes, parent_id, items);
        }
        "enum_item" => {
            process_enum(node, source_bytes, parent_id, items);
        }
        "trait_item" => {
            process_trait(node, source_bytes, parent_id, items);
        }
        "impl_item" => {
            process_impl(node, source_bytes, parent_id, items);
        }
        "function_item" => {
            process_function(node, source_bytes, parent_id, items, false);
        }
        "const_item" => {
            process_const(node, source_bytes, parent_id, items);
        }
        "static_item" => {
            process_static(node, source_bytes, parent_id, items);
        }
        "type_item" => {
            process_type_alias(node, source_bytes, parent_id, items);
        }
        "macro_definition" => {
            process_macro_def(node, source_bytes, parent_id, items);
        }
        "line_comment" | "block_comment" => {
            if is_attached_doc_comment(node, source_bytes) {
                return;
            }
            process_comment(node, source_bytes, parent_id, items);
        }
        _ => {
            // Unhandled top-level node
        }
    }
}

fn process_use(
    node: Node,
    source_bytes: &[u8],
    parent_id: Option<usize>,
    items: &mut Vec<RustScopeItem>,
) {
    let start_byte = node.start_byte();
    let end_byte = node.end_byte();
    let start_row = node.start_position().row;
    let end_row = node.end_position().row;

    let mut tokens = vec!["use".to_string()];
    let mut defined = Vec::new();

    let all_idents = extract_all_identifiers(node, source_bytes);
    for id in &all_idents {
        tokens.push(id.to_lowercase());
        for sub in split_identifier_subtokens(id) {
            if !tokens.contains(&sub) {
                tokens.push(sub);
            }
        }
    }

    if let Some(last) = all_idents.last() {
        defined.push(last.clone());
    }

    let current_id = items.len();
    items.push(RustScopeItem {
        id: current_id,
        parent_id,
        kind: RustNodeKind::Use,
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
}

fn process_mod(
    node: Node,
    source_bytes: &[u8],
    parent_id: Option<usize>,
    items: &mut Vec<RustScopeItem>,
) {
    let (start_byte, start_row) = find_item_start_with_attributes(node, source_bytes);
    let docstring = extract_rust_doc(node, source_bytes);
    let end_byte = node.end_byte();
    let end_row = node.end_position().row;

    let mut mod_name = String::new();
    let mut decl_list_node = None;

    let mut cursor = node.walk();
    for child in node.children(&mut cursor) {
        match child.kind() {
            "identifier" => {
                if mod_name.is_empty() {
                    if let Ok(t) = child.utf8_text(source_bytes) {
                        mod_name = t.to_string();
                    }
                }
            }
            "declaration_list" => {
                decl_list_node = Some(child);
            }
            _ => {}
        }
    }

    let is_inline = decl_list_node.is_some();
    let (sig_range, body_range) = if let Some(dl) = decl_list_node {
        (
            Some((start_byte, dl.start_byte())),
            Some((dl.start_byte(), dl.end_byte())),
        )
    } else {
        (Some((start_byte, end_byte)), None)
    };

    let mut sig_tokens = vec!["mod".to_string()];
    let mut defined = Vec::new();
    if !mod_name.is_empty() {
        sig_tokens.push(mod_name.to_lowercase());
        defined.push(mod_name.clone());
        for sub in split_identifier_subtokens(&mod_name) {
            if !sig_tokens.contains(&sub) {
                sig_tokens.push(sub);
            }
        }
    }

    let tokens = sig_tokens.clone();
    let current_id = items.len();

    items.push(RustScopeItem {
        id: current_id,
        parent_id,
        kind: RustNodeKind::Mod {
            name: mod_name,
            is_inline,
        },
        start_byte,
        end_byte,
        start_row,
        end_row,
        body_byte_range: body_range,
        signature_byte_range: sig_range,
        signature_tokens: sig_tokens,
        tokens,
        defined_symbols: defined,
        referenced_symbols: Vec::new(),
        children_ids: Vec::new(),
        docstring,
    });

    if let Some(pid) = parent_id {
        items[pid].children_ids.push(current_id);
    }

    // Process nested items inside declaration_list
    if let Some(dl) = decl_list_node {
        let mut dl_cursor = dl.walk();
        for child in dl.children(&mut dl_cursor) {
            if child.is_named() {
                walk_item(child, source_bytes, Some(current_id), items);
            }
        }
    }
}

fn process_struct(
    node: Node,
    source_bytes: &[u8],
    parent_id: Option<usize>,
    items: &mut Vec<RustScopeItem>,
) {
    let (start_byte, start_row) = find_item_start_with_attributes(node, source_bytes);
    let docstring = extract_rust_doc(node, source_bytes);
    let end_byte = node.end_byte();
    let end_row = node.end_position().row;

    let mut struct_name = String::new();
    let mut field_list_node = None;

    let mut cursor = node.walk();
    for child in node.children(&mut cursor) {
        match child.kind() {
            "type_identifier" => {
                if struct_name.is_empty() {
                    if let Ok(t) = child.utf8_text(source_bytes) {
                        struct_name = t.to_string();
                    }
                }
            }
            "field_declaration_list" | "ordered_field_declaration_list" => {
                field_list_node = Some(child);
            }
            _ => {}
        }
    }

    let (sig_range, body_range) = if let Some(fl) = field_list_node {
        (
            Some((start_byte, fl.start_byte())),
            Some((fl.start_byte(), fl.end_byte())),
        )
    } else {
        (Some((start_byte, end_byte)), None)
    };

    let mut sig_tokens = vec!["struct".to_string()];
    let mut defined = Vec::new();
    if !struct_name.is_empty() {
        sig_tokens.push(struct_name.to_lowercase());
        defined.push(struct_name.clone());
        for sub in split_identifier_subtokens(&struct_name) {
            if !sig_tokens.contains(&sub) {
                sig_tokens.push(sub);
            }
        }
    }

    let all_tokens = extract_all_identifiers(node, source_bytes);
    let mut tokens = sig_tokens.clone();
    for t in all_tokens {
        let low = t.to_lowercase();
        if !tokens.contains(&low) {
            tokens.push(low);
        }
    }

    let referenced = collect_referenced_symbols(node, source_bytes, &defined);
    let current_id = items.len();
    items.push(RustScopeItem {
        id: current_id,
        parent_id,
        kind: RustNodeKind::Struct { name: struct_name },
        start_byte,
        end_byte,
        start_row,
        end_row,
        body_byte_range: body_range,
        signature_byte_range: sig_range,
        signature_tokens: sig_tokens,
        tokens,
        defined_symbols: defined,
        referenced_symbols: referenced,
        children_ids: Vec::new(),
        docstring,
    });

    if let Some(pid) = parent_id {
        items[pid].children_ids.push(current_id);
    }
}

fn process_enum(
    node: Node,
    source_bytes: &[u8],
    parent_id: Option<usize>,
    items: &mut Vec<RustScopeItem>,
) {
    let (start_byte, start_row) = find_item_start_with_attributes(node, source_bytes);
    let docstring = extract_rust_doc(node, source_bytes);
    let end_byte = node.end_byte();
    let end_row = node.end_position().row;

    let mut enum_name = String::new();
    let mut variants = Vec::new();
    let mut variant_list_node = None;

    let mut cursor = node.walk();
    for child in node.children(&mut cursor) {
        match child.kind() {
            "type_identifier" => {
                if enum_name.is_empty() {
                    if let Ok(t) = child.utf8_text(source_bytes) {
                        enum_name = t.to_string();
                    }
                }
            }
            "enum_variant_list" => {
                variant_list_node = Some(child);
                let mut v_cursor = child.walk();
                for v_child in child.children(&mut v_cursor) {
                    if v_child.kind() == "enum_variant" {
                        let mut name_cursor = v_child.walk();
                        for v_node in v_child.children(&mut name_cursor) {
                            if v_node.kind() == "identifier" {
                                if let Ok(t) = v_node.utf8_text(source_bytes) {
                                    variants.push(t.to_string());
                                }
                            }
                        }
                    }
                }
            }
            _ => {}
        }
    }

    let (sig_range, body_range) = if let Some(vl) = variant_list_node {
        (
            Some((start_byte, vl.start_byte())),
            Some((vl.start_byte(), vl.end_byte())),
        )
    } else {
        (Some((start_byte, end_byte)), None)
    };

    let mut sig_tokens = vec!["enum".to_string()];
    let mut defined = Vec::new();
    if !enum_name.is_empty() {
        sig_tokens.push(enum_name.to_lowercase());
        defined.push(enum_name.clone());
        for sub in split_identifier_subtokens(&enum_name) {
            if !sig_tokens.contains(&sub) {
                sig_tokens.push(sub);
            }
        }
    }

    for v in &variants {
        defined.push(v.clone());
        sig_tokens.push(v.to_lowercase());
        for sub in split_identifier_subtokens(v) {
            if !sig_tokens.contains(&sub) {
                sig_tokens.push(sub);
            }
        }
    }

    let tokens = sig_tokens.clone();
    let referenced = collect_referenced_symbols(node, source_bytes, &defined);
    let current_id = items.len();

    items.push(RustScopeItem {
        id: current_id,
        parent_id,
        kind: RustNodeKind::Enum {
            name: enum_name,
            variants,
        },
        start_byte,
        end_byte,
        start_row,
        end_row,
        body_byte_range: body_range,
        signature_byte_range: sig_range,
        signature_tokens: sig_tokens,
        tokens,
        defined_symbols: defined,
        referenced_symbols: referenced,
        children_ids: Vec::new(),
        docstring,
    });

    if let Some(pid) = parent_id {
        items[pid].children_ids.push(current_id);
    }
}

fn process_trait(
    node: Node,
    source_bytes: &[u8],
    parent_id: Option<usize>,
    items: &mut Vec<RustScopeItem>,
) {
    let (start_byte, start_row) = find_item_start_with_attributes(node, source_bytes);
    let docstring = extract_rust_doc(node, source_bytes);
    let end_byte = node.end_byte();
    let end_row = node.end_position().row;

    let mut trait_name = String::new();
    let mut decl_list_node = None;

    let mut cursor = node.walk();
    for child in node.children(&mut cursor) {
        match child.kind() {
            "type_identifier" => {
                if trait_name.is_empty() {
                    if let Ok(t) = child.utf8_text(source_bytes) {
                        trait_name = t.to_string();
                    }
                }
            }
            "declaration_list" => {
                decl_list_node = Some(child);
            }
            _ => {}
        }
    }

    let (sig_range, body_range) = if let Some(dl) = decl_list_node {
        (
            Some((start_byte, dl.start_byte())),
            Some((dl.start_byte(), dl.end_byte())),
        )
    } else {
        (Some((start_byte, end_byte)), None)
    };

    let mut sig_tokens = vec!["trait".to_string()];
    let mut defined = Vec::new();
    if !trait_name.is_empty() {
        sig_tokens.push(trait_name.to_lowercase());
        defined.push(trait_name.clone());
        for sub in split_identifier_subtokens(&trait_name) {
            if !sig_tokens.contains(&sub) {
                sig_tokens.push(sub);
            }
        }
    }

    let tokens = sig_tokens.clone();
    let referenced = collect_referenced_symbols(node, source_bytes, &defined);
    let current_id = items.len();

    items.push(RustScopeItem {
        id: current_id,
        parent_id,
        kind: RustNodeKind::Trait { name: trait_name },
        start_byte,
        end_byte,
        start_row,
        end_row,
        body_byte_range: body_range,
        signature_byte_range: sig_range,
        signature_tokens: sig_tokens,
        tokens,
        defined_symbols: defined,
        referenced_symbols: referenced,
        children_ids: Vec::new(),
        docstring,
    });

    if let Some(pid) = parent_id {
        items[pid].children_ids.push(current_id);
    }

    // Walk items in declaration_list (methods, associated types, constants)
    if let Some(dl) = decl_list_node {
        let mut dl_cursor = dl.walk();
        for child in dl.children(&mut dl_cursor) {
            if child.is_named() {
                if child.kind() == "function_item" {
                    process_function(child, source_bytes, Some(current_id), items, true);
                } else if child.kind() == "const_item" {
                    process_const(child, source_bytes, Some(current_id), items);
                } else if child.kind() == "type_item" {
                    process_type_alias(child, source_bytes, Some(current_id), items);
                }
            }
        }
    }
}

fn process_impl(
    node: Node,
    source_bytes: &[u8],
    parent_id: Option<usize>,
    items: &mut Vec<RustScopeItem>,
) {
    let (start_byte, start_row) = find_item_start_with_attributes(node, source_bytes);
    let docstring = extract_rust_doc(node, source_bytes);
    let end_byte = node.end_byte();
    let end_row = node.end_position().row;

    let mut target_type = String::new();
    let mut trait_name = None;
    let mut decl_list_node = None;

    let mut cursor = node.walk();
    let children: Vec<Node> = node.children(&mut cursor).collect();

    let mut has_for = false;
    let mut type_nodes = Vec::new();

    for child in &children {
        if child.kind() == "for" {
            has_for = true;
        } else if child.kind() == "type_identifier" || child.kind() == "generic_type" {
            type_nodes.push(*child);
        } else if child.kind() == "declaration_list" {
            decl_list_node = Some(*child);
        }
    }

    if has_for && type_nodes.len() >= 2 {
        if let Ok(t) = type_nodes[0].utf8_text(source_bytes) {
            trait_name = Some(t.trim().to_string());
        }
        if let Ok(t) = type_nodes[1].utf8_text(source_bytes) {
            target_type = t.trim().to_string();
        }
    } else if let Some(first_type) = type_nodes.first() {
        if let Ok(t) = first_type.utf8_text(source_bytes) {
            target_type = t.trim().to_string();
        }
    }

    let (sig_range, body_range) = if let Some(dl) = decl_list_node {
        (
            Some((start_byte, dl.start_byte())),
            Some((dl.start_byte(), dl.end_byte())),
        )
    } else {
        (Some((start_byte, end_byte)), None)
    };

    let mut sig_tokens = vec!["impl".to_string()];
    let mut defined = Vec::new();

    if !target_type.is_empty() {
        sig_tokens.push(target_type.to_lowercase());
        let base_target = strip_type_generics(&target_type).to_string();
        if base_target != target_type {
            defined.push(base_target.clone());
            sig_tokens.push(base_target.to_lowercase());
        }
        defined.push(target_type.clone());
        for sub in split_identifier_subtokens(&target_type) {
            if !sig_tokens.contains(&sub) {
                sig_tokens.push(sub);
            }
        }
    }

    if let Some(ref tr) = trait_name {
        sig_tokens.push("for".to_string());
        sig_tokens.push(tr.to_lowercase());
        let base_tr = strip_type_generics(tr).to_string();
        if base_tr != *tr {
            defined.push(base_tr.clone());
            sig_tokens.push(base_tr.to_lowercase());
        }
        defined.push(tr.clone());
        for sub in split_identifier_subtokens(tr) {
            if !sig_tokens.contains(&sub) {
                sig_tokens.push(sub);
            }
        }
    }

    let tokens = sig_tokens.clone();
    let mut referenced = collect_referenced_symbols(node, source_bytes, &defined);
    if !target_type.is_empty() {
        let base = strip_type_generics(&target_type).to_string();
        if !referenced.contains(&base) {
            referenced.push(base);
        }
    }
    if let Some(ref tr) = trait_name {
        let base = strip_type_generics(tr).to_string();
        if !referenced.contains(&base) {
            referenced.push(base);
        }
    }

    let current_id = items.len();

    items.push(RustScopeItem {
        id: current_id,
        parent_id,
        kind: RustNodeKind::Impl {
            target_type,
            trait_name,
        },
        start_byte,
        end_byte,
        start_row,
        end_row,
        body_byte_range: body_range,
        signature_byte_range: sig_range,
        signature_tokens: sig_tokens,
        tokens,
        defined_symbols: defined,
        referenced_symbols: referenced,
        children_ids: Vec::new(),
        docstring,
    });

    if let Some(pid) = parent_id {
        items[pid].children_ids.push(current_id);
    }

    // Walk methods and items inside declaration_list
    if let Some(dl) = decl_list_node {
        let mut dl_cursor = dl.walk();
        for child in dl.children(&mut dl_cursor) {
            if child.is_named() {
                if child.kind() == "function_item" {
                    process_function(child, source_bytes, Some(current_id), items, true);
                } else if child.kind() == "const_item" {
                    process_const(child, source_bytes, Some(current_id), items);
                } else if child.kind() == "type_item" {
                    process_type_alias(child, source_bytes, Some(current_id), items);
                }
            }
        }
    }
}

fn process_function(
    node: Node,
    source_bytes: &[u8],
    parent_id: Option<usize>,
    items: &mut Vec<RustScopeItem>,
    is_method: bool,
) {
    let (start_byte, start_row) = find_item_start_with_attributes(node, source_bytes);
    let docstring = extract_rust_doc(node, source_bytes);
    let end_byte = node.end_byte();
    let end_row = node.end_position().row;

    let mut fn_name = String::new();
    let mut is_async = false;
    let mut is_const = false;
    let mut is_unsafe = false;
    let mut body_node = None;

    let mut cursor = node.walk();
    for child in node.children(&mut cursor) {
        match child.kind() {
            "identifier" => {
                if fn_name.is_empty() {
                    if let Ok(t) = child.utf8_text(source_bytes) {
                        fn_name = t.to_string();
                    }
                }
            }
            "async" => is_async = true,
            "const" => is_const = true,
            "unsafe" => is_unsafe = true,
            "block" => body_node = Some(child),
            _ => {}
        }
    }

    let has_body = body_node.is_some();
    let (sig_range, body_range) = if let Some(b) = body_node {
        (
            Some((start_byte, b.start_byte())),
            Some((b.start_byte(), end_byte)),
        )
    } else {
        (Some((start_byte, end_byte)), None)
    };

    let mut sig_tokens = vec!["fn".to_string()];
    if is_async {
        sig_tokens.push("async".to_string());
    }
    if is_const {
        sig_tokens.push("const".to_string());
    }
    if is_unsafe {
        sig_tokens.push("unsafe".to_string());
    }

    let mut defined = Vec::new();
    if !fn_name.is_empty() {
        sig_tokens.push(fn_name.to_lowercase());
        defined.push(fn_name.clone());
        for sub in split_identifier_subtokens(&fn_name) {
            if !sig_tokens.contains(&sub) {
                sig_tokens.push(sub);
            }
        }
    }

    // Extract signature tokens from parameters and return type
    let mut sig_cursor = node.walk();
    for child in node.children(&mut sig_cursor) {
        if child.kind() == "parameters" || child.kind() == "return_type" {
            let idents = extract_all_identifiers(child, source_bytes);
            for id in idents {
                let low = id.to_lowercase();
                if !sig_tokens.contains(&low) {
                    sig_tokens.push(low.clone());
                }
                for sub in split_identifier_subtokens(&id) {
                    if !sig_tokens.contains(&sub) {
                        sig_tokens.push(sub);
                    }
                }
            }
        }
    }

    // All tokens inside function (signature + body)
    let all_idents = extract_all_identifiers(node, source_bytes);
    let mut tokens = sig_tokens.clone();
    for id in all_idents {
        let low = id.to_lowercase();
        if !tokens.contains(&low) {
            tokens.push(low);
        }
    }

    let referenced = collect_referenced_symbols(node, source_bytes, &defined);
    let is_getter = is_method
        && (fn_name.starts_with("get_")
            || (!fn_name.starts_with("set_") && !fn_name.starts_with("is_") && fn_name != "new"));
    let is_setter = is_method && fn_name.starts_with("set_");

    let current_id = items.len();
    items.push(RustScopeItem {
        id: current_id,
        parent_id,
        kind: RustNodeKind::Function {
            name: fn_name,
            is_async,
            is_const,
            is_unsafe,
            has_body,
            is_method,
            is_getter,
            is_setter,
        },
        start_byte,
        end_byte,
        start_row,
        end_row,
        body_byte_range: body_range,
        signature_byte_range: sig_range,
        signature_tokens: sig_tokens,
        tokens,
        defined_symbols: defined,
        referenced_symbols: referenced,
        children_ids: Vec::new(),
        docstring,
    });

    if let Some(pid) = parent_id {
        items[pid].children_ids.push(current_id);
    }
}

fn process_const(
    node: Node,
    source_bytes: &[u8],
    parent_id: Option<usize>,
    items: &mut Vec<RustScopeItem>,
) {
    let (start_byte, start_row) = find_item_start_with_attributes(node, source_bytes);
    let docstring = extract_rust_doc(node, source_bytes);
    let end_byte = node.end_byte();
    let end_row = node.end_position().row;

    let mut name = String::new();
    let mut cursor = node.walk();
    for child in node.children(&mut cursor) {
        if child.kind() == "identifier" {
            if let Ok(t) = child.utf8_text(source_bytes) {
                name = t.to_string();
                break;
            }
        }
    }

    let mut tokens = vec!["const".to_string()];
    let mut defined = Vec::new();
    if !name.is_empty() {
        tokens.push(name.to_lowercase());
        defined.push(name.clone());
        for sub in split_identifier_subtokens(&name) {
            if !tokens.contains(&sub) {
                tokens.push(sub);
            }
        }
    }

    let referenced = collect_referenced_symbols(node, source_bytes, &defined);
    let current_id = items.len();
    items.push(RustScopeItem {
        id: current_id,
        parent_id,
        kind: RustNodeKind::Const { name },
        start_byte,
        end_byte,
        start_row,
        end_row,
        body_byte_range: None,
        signature_byte_range: Some((start_byte, end_byte)),
        signature_tokens: tokens.clone(),
        tokens,
        defined_symbols: defined,
        referenced_symbols: referenced,
        children_ids: Vec::new(),
        docstring,
    });

    if let Some(pid) = parent_id {
        items[pid].children_ids.push(current_id);
    }
}

fn process_static(
    node: Node,
    source_bytes: &[u8],
    parent_id: Option<usize>,
    items: &mut Vec<RustScopeItem>,
) {
    let (start_byte, start_row) = find_item_start_with_attributes(node, source_bytes);
    let docstring = extract_rust_doc(node, source_bytes);
    let end_byte = node.end_byte();
    let end_row = node.end_position().row;

    let mut name = String::new();
    let mut cursor = node.walk();
    for child in node.children(&mut cursor) {
        if child.kind() == "identifier" {
            if let Ok(t) = child.utf8_text(source_bytes) {
                name = t.to_string();
                break;
            }
        }
    }

    let mut tokens = vec!["static".to_string()];
    let mut defined = Vec::new();
    if !name.is_empty() {
        tokens.push(name.to_lowercase());
        defined.push(name.clone());
        for sub in split_identifier_subtokens(&name) {
            if !tokens.contains(&sub) {
                tokens.push(sub);
            }
        }
    }

    let referenced = collect_referenced_symbols(node, source_bytes, &defined);
    let current_id = items.len();
    items.push(RustScopeItem {
        id: current_id,
        parent_id,
        kind: RustNodeKind::Static { name },
        start_byte,
        end_byte,
        start_row,
        end_row,
        body_byte_range: None,
        signature_byte_range: Some((start_byte, end_byte)),
        signature_tokens: tokens.clone(),
        tokens,
        defined_symbols: defined,
        referenced_symbols: referenced,
        children_ids: Vec::new(),
        docstring,
    });

    if let Some(pid) = parent_id {
        items[pid].children_ids.push(current_id);
    }
}

fn process_type_alias(
    node: Node,
    source_bytes: &[u8],
    parent_id: Option<usize>,
    items: &mut Vec<RustScopeItem>,
) {
    let (start_byte, start_row) = find_item_start_with_attributes(node, source_bytes);
    let docstring = extract_rust_doc(node, source_bytes);
    let end_byte = node.end_byte();
    let end_row = node.end_position().row;

    let mut name = String::new();
    let mut cursor = node.walk();
    for child in node.children(&mut cursor) {
        if child.kind() == "type_identifier" {
            if let Ok(t) = child.utf8_text(source_bytes) {
                name = t.to_string();
                break;
            }
        }
    }

    let mut tokens = vec!["type".to_string()];
    let mut defined = Vec::new();
    if !name.is_empty() {
        tokens.push(name.to_lowercase());
        defined.push(name.clone());
        for sub in split_identifier_subtokens(&name) {
            if !tokens.contains(&sub) {
                tokens.push(sub);
            }
        }
    }

    let referenced = collect_referenced_symbols(node, source_bytes, &defined);
    let current_id = items.len();
    items.push(RustScopeItem {
        id: current_id,
        parent_id,
        kind: RustNodeKind::TypeAlias { name },
        start_byte,
        end_byte,
        start_row,
        end_row,
        body_byte_range: None,
        signature_byte_range: Some((start_byte, end_byte)),
        signature_tokens: tokens.clone(),
        tokens,
        defined_symbols: defined,
        referenced_symbols: referenced,
        children_ids: Vec::new(),
        docstring,
    });

    if let Some(pid) = parent_id {
        items[pid].children_ids.push(current_id);
    }
}

fn process_macro_def(
    node: Node,
    source_bytes: &[u8],
    parent_id: Option<usize>,
    items: &mut Vec<RustScopeItem>,
) {
    let (start_byte, start_row) = find_item_start_with_attributes(node, source_bytes);
    let docstring = extract_rust_doc(node, source_bytes);
    let end_byte = node.end_byte();
    let end_row = node.end_position().row;

    let mut name = String::new();
    let mut cursor = node.walk();
    for child in node.children(&mut cursor) {
        if child.kind() == "identifier" {
            if let Ok(t) = child.utf8_text(source_bytes) {
                name = t.to_string();
                break;
            }
        }
    }

    let mut tokens = vec!["macro".to_string(), "macro_rules".to_string()];
    let mut defined = Vec::new();
    if !name.is_empty() {
        tokens.push(name.to_lowercase());
        defined.push(name.clone());
    }

    let current_id = items.len();
    items.push(RustScopeItem {
        id: current_id,
        parent_id,
        kind: RustNodeKind::MacroDef { name },
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
        docstring,
    });

    if let Some(pid) = parent_id {
        items[pid].children_ids.push(current_id);
    }
}

fn process_comment(
    node: Node,
    _source_bytes: &[u8],
    parent_id: Option<usize>,
    items: &mut Vec<RustScopeItem>,
) {
    let start_byte = node.start_byte();
    let end_byte = node.end_byte();
    let start_row = node.start_position().row;
    let end_row = node.end_position().row;

    let current_id = items.len();
    items.push(RustScopeItem {
        id: current_id,
        parent_id,
        kind: RustNodeKind::Comment,
        start_byte,
        end_byte,
        start_row,
        end_row,
        body_byte_range: None,
        signature_byte_range: None,
        signature_tokens: Vec::new(),
        tokens: Vec::new(),
        defined_symbols: Vec::new(),
        referenced_symbols: Vec::new(),
        children_ids: Vec::new(),
        docstring: None,
    });

    if let Some(pid) = parent_id {
        items[pid].children_ids.push(current_id);
    }
}

fn extract_all_identifiers(node: Node, source_bytes: &[u8]) -> Vec<String> {
    let mut idents = Vec::new();
    let mut seen = HashSet::new();
    collect_identifiers_recursive(node, source_bytes, &mut idents, &mut seen);
    idents
}

fn collect_identifiers_recursive(
    node: Node,
    source_bytes: &[u8],
    idents: &mut Vec<String>,
    seen: &mut HashSet<String>,
) {
    let kind = node.kind();
    if kind == "identifier" || kind == "type_identifier" || kind == "field_identifier" {
        if let Ok(text) = node.utf8_text(source_bytes) {
            let s = text.trim();
            if !s.is_empty() && seen.insert(s.to_string()) {
                idents.push(s.to_string());
            }
        }
    }

    let mut cursor = node.walk();
    for child in node.children(&mut cursor) {
        collect_identifiers_recursive(child, source_bytes, idents, seen);
    }
}

pub fn split_identifier_subtokens(s: &str) -> Vec<String> {
    let mut subtokens = Vec::new();
    let lower = s.to_lowercase();
    subtokens.push(lower.clone());

    // Split snake_case
    if s.contains('_') {
        for part in s.split('_') {
            let p = part.trim().to_lowercase();
            if p.len() >= 2 && p != lower && !subtokens.contains(&p) {
                subtokens.push(p);
            }
        }
    }

    // Split camelCase / PascalCase
    let mut current = String::new();
    for ch in s.chars() {
        if ch.is_uppercase() && !current.is_empty() {
            let part = current.to_lowercase();
            if part.len() >= 2 && part != lower && !subtokens.contains(&part) {
                subtokens.push(part);
            }
            current.clear();
        }
        if ch != '_' {
            current.push(ch);
        }
    }
    if !current.is_empty() {
        let part = current.to_lowercase();
        if part.len() >= 2 && part != lower && !subtokens.contains(&part) {
            subtokens.push(part);
        }
    }

    subtokens
}
