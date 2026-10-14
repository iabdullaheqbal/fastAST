use std::cell::RefCell;
use tree_sitter::{Node, Parser, Tree};

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum NodeKind {
    Import,
    ModuleDocstring,
    Function {
        name: String,
        is_async: bool,
    },
    Class {
        name: String,
    },
    Other,
}

#[derive(Debug, Clone)]
pub struct ScopeItem {
    pub kind: NodeKind,
    pub start_row: usize,
    pub end_row: usize,
    pub start_byte: usize,
    pub end_byte: usize,
    /// Last row of the signature/header (inclusive)
    pub sig_end_row: usize,
    /// Indentation string of the body for pass insertion (e.g., "    " or "        ")
    pub body_indent: String,
    /// Docstring row range if inside function/class (start_row, end_row)
    pub docstring_rows: Option<(usize, usize)>,
    /// Range of preceding decorators (start_row, end_row)
    pub decorator_rows: Option<(usize, usize)>,
    /// Parent index in the items list, if nested inside a class/function
    pub parent_idx: Option<usize>,
    /// Child indices
    pub child_indices: Vec<usize>,
    /// Relevant identifier/keyword tokens extracted from this scope
    pub tokens: Vec<String>,
}

pub fn end_row_inclusive(node: &Node) -> usize {
    let start = node.start_position();
    let end = node.end_position();
    if end.column == 0 && end.row > start.row {
        end.row - 1
    } else {
        end.row
    }
}

thread_local! {
    static PARSER: RefCell<Parser> = RefCell::new({
        let mut p = Parser::new();
        let lang = tree_sitter_python::language();
        p.set_language(&lang).expect("Error loading Python grammar");
        p
    });
}

pub fn parse_ast(code: &str) -> Result<Tree, String> {
    PARSER.with(|parser_cell| {
        let mut parser = parser_cell.borrow_mut();
        parser.parse(code, None).ok_or_else(|| "Failed to parse code into AST".to_string())
    })
}

/// Recursively traverses the AST and builds a flattened list of Scopes with hierarchy
pub fn collect_scopes(tree: &Tree, source_bytes: &[u8], lines: &[&str]) -> Vec<ScopeItem> {
    let mut items = Vec::new();
    let root = tree.root_node();

    // Check for module-level docstring
    let mut cursor = root.walk();
    for child in root.children(&mut cursor) {
        if child.kind() == "expression_statement" {
            if let Some(str_child) = child.child(0) {
                if str_child.kind() == "string" {
                    let s_row = child.start_position().row;
                    let e_row = end_row_inclusive(&child);
                    items.push(ScopeItem {
                        kind: NodeKind::ModuleDocstring,
                        start_row: s_row,
                        end_row: e_row,
                        start_byte: child.start_byte(),
                        end_byte: child.end_byte(),
                        sig_end_row: e_row,
                        body_indent: String::new(),
                        docstring_rows: Some((s_row, e_row)),
                        decorator_rows: None,
                        parent_idx: None,
                        child_indices: Vec::new(),
                        tokens: extract_tokens(&child, source_bytes),
                    });
                    break;
                }
            }
        } else if child.kind() == "comment" {
            continue;
        } else {
            break;
        }
    }

    walk_children(root, None, source_bytes, lines, &mut items);
    items
}

fn walk_children(
    parent_node: Node,
    parent_idx: Option<usize>,
    source_bytes: &[u8],
    lines: &[&str],
    items: &mut Vec<ScopeItem>,
) {
    let mut cursor = parent_node.walk();
    for child in parent_node.children(&mut cursor) {
        match child.kind() {
            "import_statement" | "import_from_statement" => {
                let s_row = child.start_position().row;
                let e_row = end_row_inclusive(&child);
                let idx = items.len();
                items.push(ScopeItem {
                    kind: NodeKind::Import,
                    start_row: s_row,
                    end_row: e_row,
                    start_byte: child.start_byte(),
                    end_byte: child.end_byte(),
                    sig_end_row: e_row,
                    body_indent: String::new(),
                    docstring_rows: None,
                    decorator_rows: None,
                    parent_idx,
                    child_indices: Vec::new(),
                    tokens: extract_tokens(&child, source_bytes),
                });
                if let Some(pidx) = parent_idx {
                    items[pidx].child_indices.push(idx);
                }
            }
            "function_definition" | "async_function_definition" => {
                handle_function(child, None, parent_idx, source_bytes, lines, items);
            }
            "class_definition" => {
                handle_class(child, None, parent_idx, source_bytes, lines, items);
            }
            "decorated_definition" => {
                let dec_start = child.start_position().row;
                let mut dec_end = dec_start;
                let mut def_node = None;

                let mut dec_cursor = child.walk();
                for dec_child in child.children(&mut dec_cursor) {
                    if dec_child.kind() == "decorator" {
                        dec_end = end_row_inclusive(&dec_child);
                    } else if dec_child.kind() == "function_definition"
                        || dec_child.kind() == "async_function_definition"
                        || dec_child.kind() == "class_definition"
                    {
                        def_node = Some(dec_child);
                    }
                }

                if let Some(target) = def_node {
                    let dec_range = Some((dec_start, dec_end));
                    if target.kind() == "class_definition" {
                        handle_class(target, dec_range, parent_idx, source_bytes, lines, items);
                    } else {
                        handle_function(target, dec_range, parent_idx, source_bytes, lines, items);
                    }
                }
            }
            _ => {
                // Statements inside functions or blocks
                if parent_idx.is_some() {
                    let s_row = child.start_position().row;
                    let e_row = end_row_inclusive(&child);
                    if child.kind() != "comment" && child.kind() != ":" {
                        let idx = items.len();
                        items.push(ScopeItem {
                            kind: NodeKind::Other,
                            start_row: s_row,
                            end_row: e_row,
                            start_byte: child.start_byte(),
                            end_byte: child.end_byte(),
                            sig_end_row: e_row,
                            body_indent: get_line_indent(lines.get(s_row).unwrap_or(&"")),
                            docstring_rows: None,
                            decorator_rows: None,
                            parent_idx,
                            child_indices: Vec::new(),
                            tokens: extract_tokens(&child, source_bytes),
                        });
                        if let Some(pidx) = parent_idx {
                            items[pidx].child_indices.push(idx);
                        }
                    }
                }
            }
        }
    }
}

fn handle_function(
    func_node: Node,
    decorator_rows: Option<(usize, usize)>,
    parent_idx: Option<usize>,
    source_bytes: &[u8],
    lines: &[&str],
    items: &mut Vec<ScopeItem>,
) {
    let is_async = func_node.kind() == "async_function_definition";
    let name = func_node
        .child_by_field_name("name")
        .and_then(|n| n.utf8_text(source_bytes).ok())
        .unwrap_or("function")
        .to_string();

    let full_start_row = decorator_rows.map(|(s, _)| s).unwrap_or_else(|| func_node.start_position().row);
    let full_end_row = end_row_inclusive(&func_node);

    // Signature end row is right before body block
    let body_node = func_node.child_by_field_name("body");
    let sig_end_row = if let Some(b) = body_node {
        if b.start_position().row > 0 {
            // Header extends up to the line containing ':' before body
            b.start_position().row.saturating_sub(1).max(func_node.start_position().row)
        } else {
            func_node.start_position().row
        }
    } else {
        func_node.start_position().row
    };

    // Determine body indentation from body block or header indentation + 4 spaces
    let header_indent = get_line_indent(lines.get(func_node.start_position().row).unwrap_or(&""));
    let body_indent = if let Some(b) = body_node {
        let mut b_cursor = b.walk();
        let first_stmt = b.children(&mut b_cursor).find(|c| c.kind() != "comment" && c.kind() != ":");
        if let Some(stmt) = first_stmt {
            get_line_indent(lines.get(stmt.start_position().row).unwrap_or(&""))
        } else {
            format!("{}    ", header_indent)
        }
    } else {
        format!("{}    ", header_indent)
    };

    // Check for docstring inside body
    let docstring_rows = body_node.and_then(|b| {
        let mut b_cursor = b.walk();
        let first_child = b.children(&mut b_cursor).find(|c| c.kind() != "comment");
        if let Some(fc) = first_child {
            if fc.kind() == "expression_statement" {
                if let Some(sc) = fc.child(0) {
                    if sc.kind() == "string" {
                        return Some((fc.start_position().row, end_row_inclusive(&fc)));
                    }
                }
            }
        }
        None
    });

    let current_idx = items.len();
    items.push(ScopeItem {
        kind: NodeKind::Function { name, is_async },
        start_row: full_start_row,
        end_row: full_end_row,
        start_byte: func_node.start_byte(),
        end_byte: func_node.end_byte(),
        sig_end_row,
        body_indent,
        docstring_rows,
        decorator_rows,
        parent_idx,
        child_indices: Vec::new(),
        tokens: extract_tokens(&func_node, source_bytes),
    });

    if let Some(pidx) = parent_idx {
        items[pidx].child_indices.push(current_idx);
    }

    if let Some(b) = body_node {
        walk_children(b, Some(current_idx), source_bytes, lines, items);
    }
}

fn handle_class(
    class_node: Node,
    decorator_rows: Option<(usize, usize)>,
    parent_idx: Option<usize>,
    source_bytes: &[u8],
    lines: &[&str],
    items: &mut Vec<ScopeItem>,
) {
    let name = class_node
        .child_by_field_name("name")
        .and_then(|n| n.utf8_text(source_bytes).ok())
        .unwrap_or("Class")
        .to_string();

    let full_start_row = decorator_rows.map(|(s, _)| s).unwrap_or_else(|| class_node.start_position().row);
    let full_end_row = end_row_inclusive(&class_node);

    let body_node = class_node.child_by_field_name("body");
    let sig_end_row = if let Some(b) = body_node {
        if b.start_position().row > 0 {
            b.start_position().row.saturating_sub(1).max(class_node.start_position().row)
        } else {
            class_node.start_position().row
        }
    } else {
        class_node.start_position().row
    };

    let header_indent = get_line_indent(lines.get(class_node.start_position().row).unwrap_or(&""));
    let body_indent = if let Some(b) = body_node {
        let mut b_cursor = b.walk();
        let first_stmt = b.children(&mut b_cursor).find(|c| c.kind() != "comment" && c.kind() != ":");
        if let Some(stmt) = first_stmt {
            get_line_indent(lines.get(stmt.start_position().row).unwrap_or(&""))
        } else {
            format!("{}    ", header_indent)
        }
    } else {
        format!("{}    ", header_indent)
    };

    let docstring_rows = body_node.and_then(|b| {
        let mut b_cursor = b.walk();
        let first_child = b.children(&mut b_cursor).find(|c| c.kind() != "comment");
        if let Some(fc) = first_child {
            if fc.kind() == "expression_statement" {
                if let Some(sc) = fc.child(0) {
                    if sc.kind() == "string" {
                        return Some((fc.start_position().row, end_row_inclusive(&fc)));
                    }
                }
            }
        }
        None
    });

    let current_idx = items.len();
    items.push(ScopeItem {
        kind: NodeKind::Class { name },
        start_row: full_start_row,
        end_row: full_end_row,
        start_byte: class_node.start_byte(),
        end_byte: class_node.end_byte(),
        sig_end_row,
        body_indent,
        docstring_rows,
        decorator_rows,
        parent_idx,
        child_indices: Vec::new(),
        tokens: extract_tokens(&class_node, source_bytes),
    });

    if let Some(pidx) = parent_idx {
        items[pidx].child_indices.push(current_idx);
    }

    if let Some(b) = body_node {
        walk_children(b, Some(current_idx), source_bytes, lines, items);
    }
}

pub fn get_line_indent(line: &str) -> String {
    let mut indent = String::new();
    for ch in line.chars() {
        if ch == ' ' || ch == '\t' {
            indent.push(ch);
        } else {
            break;
        }
    }
    indent
}

pub fn extract_tokens(node: &Node, source_bytes: &[u8]) -> Vec<String> {
    let mut tokens = Vec::new();
    collect_identifiers(*node, source_bytes, &mut tokens);
    tokens
}

fn collect_identifiers(node: Node, source_bytes: &[u8], tokens: &mut Vec<String>) {
    if node.kind() == "identifier" || node.kind() == "string" {
        if let Ok(text) = node.utf8_text(source_bytes) {
            let cleaned = text.trim_matches('"').trim_matches('\'').to_lowercase();
            if !cleaned.is_empty() {
                tokens.push(cleaned);
            }
        }
    }
    let mut cursor = node.walk();
    for child in node.children(&mut cursor) {
        collect_identifiers(child, source_bytes, tokens);
    }
}

