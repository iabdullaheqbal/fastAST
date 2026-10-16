use std::cell::RefCell;
use std::collections::HashSet;
use tree_sitter::{Node, Parser, Tree};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ControlFlowType {
    Try,
    Except,
    Finally,
    If,
    Elif,
    Else,
    For,
    While,
    With,
}

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
    ControlFlow {
        flow_type: ControlFlowType,
    },
    Statement,
    Other,
}

#[derive(Debug, Clone)]
pub struct ScopeItem {
    pub id: usize,
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
    /// Parent index in the items list, if nested inside a class/function/block
    pub parent_idx: Option<usize>,
    /// Child indices
    pub child_indices: Vec<usize>,
    /// Companion indices (e.g. Try <-> Except / Finally; If <-> Elif / Else)
    pub companion_indices: Vec<usize>,
    /// Symbols defined by this item (e.g. assignments, function name, loop variable)
    pub defined_symbols: HashSet<String>,
    /// Symbols referenced/used by this item (e.g. identifiers in expressions)
    pub referenced_symbols: HashSet<String>,
    /// Relevant identifier/keyword tokens extracted from this scope for lexical scoring
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
                    let idx = items.len();
                    items.push(ScopeItem {
                        id: idx,
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
                        companion_indices: Vec::new(),
                        defined_symbols: HashSet::new(),
                        referenced_symbols: HashSet::new(),
                        tokens: Vec::new(),
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
                let mut defs = HashSet::new();
                collect_target_identifiers(child, source_bytes, &mut defs);

                items.push(ScopeItem {
                    id: idx,
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
                    companion_indices: Vec::new(),
                    defined_symbols: defs,
                    referenced_symbols: HashSet::new(),
                    tokens: Vec::new(),
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
            "if_statement" => {
                handle_if(child, parent_idx, source_bytes, lines, items);
            }
            "try_statement" => {
                handle_try(child, parent_idx, source_bytes, lines, items);
            }
            "for_statement" | "async_for_statement" => {
                handle_for(child, parent_idx, source_bytes, lines, items);
            }
            "while_statement" => {
                handle_while(child, parent_idx, source_bytes, lines, items);
            }
            "with_statement" | "async_with_statement" => {
                handle_with(child, parent_idx, source_bytes, lines, items);
            }
            _ => {
                if child.kind() != "comment" && child.kind() != ":" {
                    let s_row = child.start_position().row;
                    let e_row = end_row_inclusive(&child);
                    let mut defs = HashSet::new();
                    let mut refs = HashSet::new();
                    collect_defs(child, source_bytes, &mut defs);
                    collect_refs(child, source_bytes, &mut refs);

                    let idx = items.len();
                    items.push(ScopeItem {
                        id: idx,
                        kind: NodeKind::Statement,
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
                        companion_indices: Vec::new(),
                        defined_symbols: defs,
                        referenced_symbols: refs,
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

    let body_node = func_node.child_by_field_name("body");
    let sig_end_row = if let Some(b) = body_node {
        if b.start_position().row > 0 {
            b.start_position().row.saturating_sub(1).max(func_node.start_position().row)
        } else {
            func_node.start_position().row
        }
    } else {
        func_node.start_position().row
    };

    let header_indent = get_line_indent(lines.get(func_node.start_position().row).unwrap_or(&""));
    let body_indent = if let Some(b) = body_node {
        get_block_indent(b, lines, &header_indent)
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

    let mut defs = HashSet::new();
    defs.insert(name.clone());
    // Extract parameter names as defined symbols within the function
    if let Some(params) = func_node.child_by_field_name("parameters") {
        let mut p_cursor = params.walk();
        for p in params.children(&mut p_cursor) {
            collect_target_identifiers(p, source_bytes, &mut defs);
        }
    }

    let mut refs = HashSet::new();
    // Collect references in return type annotation or decorators
    if let Some(ret) = func_node.child_by_field_name("return_type") {
        collect_refs(ret, source_bytes, &mut refs);
    }

    let sig_tokens = extract_func_signature_tokens(&func_node, source_bytes);

    let current_idx = items.len();
    items.push(ScopeItem {
        id: current_idx,
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
        companion_indices: Vec::new(),
        defined_symbols: defs,
        referenced_symbols: refs,
        tokens: sig_tokens,
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
        get_block_indent(b, lines, &header_indent)
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

    let mut defs = HashSet::new();
    defs.insert(name.clone());

    let mut refs = HashSet::new();
    if let Some(superclasses) = class_node.child_by_field_name("superclasses") {
        collect_refs(superclasses, source_bytes, &mut refs);
    }

    let current_idx = items.len();
    items.push(ScopeItem {
        id: current_idx,
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
        companion_indices: Vec::new(),
        defined_symbols: defs,
        referenced_symbols: refs,
        tokens: extract_class_signature_tokens(&class_node, source_bytes),
    });

    if let Some(pidx) = parent_idx {
        items[pidx].child_indices.push(current_idx);
    }

    if let Some(b) = body_node {
        walk_children(b, Some(current_idx), source_bytes, lines, items);
    }
}

fn handle_if(
    if_node: Node,
    parent_idx: Option<usize>,
    source_bytes: &[u8],
    lines: &[&str],
    items: &mut Vec<ScopeItem>,
) {
    let s_row = if_node.start_position().row;
    let consequence_node = if_node.child_by_field_name("consequence");
    let sig_end_row = if let Some(c) = consequence_node {
        if c.start_position().row > 0 {
            c.start_position().row.saturating_sub(1).max(s_row)
        } else {
            s_row
        }
    } else {
        s_row
    };

    let header_indent = get_line_indent(lines.get(s_row).unwrap_or(&""));
    let body_indent = if let Some(c) = consequence_node {
        get_block_indent(c, lines, &header_indent)
    } else {
        format!("{}    ", header_indent)
    };

    let condition_node = if_node.child_by_field_name("condition");
    let mut tokens = Vec::new();
    let mut referenced = HashSet::new();
    if let Some(cond) = condition_node {
        collect_identifiers(cond, source_bytes, &mut tokens);
        collect_refs(cond, source_bytes, &mut referenced);
    }

    let if_idx = items.len();
    items.push(ScopeItem {
        id: if_idx,
        kind: NodeKind::ControlFlow { flow_type: ControlFlowType::If },
        start_row: s_row,
        end_row: consequence_node.map(|c| end_row_inclusive(&c)).unwrap_or(s_row),
        start_byte: if_node.start_byte(),
        end_byte: consequence_node.map(|c| c.end_byte()).unwrap_or_else(|| if_node.end_byte()),
        sig_end_row,
        body_indent,
        docstring_rows: None,
        decorator_rows: None,
        parent_idx,
        child_indices: Vec::new(),
        companion_indices: Vec::new(),
        defined_symbols: HashSet::new(),
        referenced_symbols: referenced,
        tokens,
    });

    if let Some(pidx) = parent_idx {
        items[pidx].child_indices.push(if_idx);
    }

    if let Some(c) = consequence_node {
        walk_children(c, Some(if_idx), source_bytes, lines, items);
    }

    // Now check for alternative: elif or else
    let mut alt = if_node.child_by_field_name("alternative");
    while let Some(alt_node) = alt {
        match alt_node.kind() {
            "elif_clause" => {
                let e_s_row = alt_node.start_position().row;
                let e_consequence = alt_node.child_by_field_name("consequence");
                let e_sig_end = if let Some(c) = e_consequence {
                    if c.start_position().row > 0 {
                        c.start_position().row.saturating_sub(1).max(e_s_row)
                    } else {
                        e_s_row
                    }
                } else {
                    e_s_row
                };
                let e_header_indent = get_line_indent(lines.get(e_s_row).unwrap_or(&""));
                let e_body_indent = if let Some(c) = e_consequence {
                    get_block_indent(c, lines, &e_header_indent)
                } else {
                    format!("{}    ", e_header_indent)
                };

                let e_cond = alt_node.child_by_field_name("condition");
                let mut e_tokens = Vec::new();
                let mut e_refs = HashSet::new();
                if let Some(cond) = e_cond {
                    collect_identifiers(cond, source_bytes, &mut e_tokens);
                    collect_refs(cond, source_bytes, &mut e_refs);
                }

                let elif_idx = items.len();
                items.push(ScopeItem {
                    id: elif_idx,
                    kind: NodeKind::ControlFlow { flow_type: ControlFlowType::Elif },
                    start_row: e_s_row,
                    end_row: e_consequence.map(|c| end_row_inclusive(&c)).unwrap_or(e_s_row),
                    start_byte: alt_node.start_byte(),
                    end_byte: e_consequence.map(|c| c.end_byte()).unwrap_or_else(|| alt_node.end_byte()),
                    sig_end_row: e_sig_end,
                    body_indent: e_body_indent,
                    docstring_rows: None,
                    decorator_rows: None,
                    parent_idx,
                    child_indices: Vec::new(),
                    companion_indices: vec![if_idx],
                    defined_symbols: HashSet::new(),
                    referenced_symbols: e_refs,
                    tokens: e_tokens,
                });

                if let Some(pidx) = parent_idx {
                    items[pidx].child_indices.push(elif_idx);
                }
                items[if_idx].companion_indices.push(elif_idx);

                if let Some(c) = e_consequence {
                    walk_children(c, Some(elif_idx), source_bytes, lines, items);
                }

                alt = alt_node.child_by_field_name("alternative");
            }
            "else_clause" => {
                let e_s_row = alt_node.start_position().row;
                let e_body = alt_node.child_by_field_name("body");
                let e_sig_end = if let Some(b) = e_body {
                    if b.start_position().row > 0 {
                        b.start_position().row.saturating_sub(1).max(e_s_row)
                    } else {
                        e_s_row
                    }
                } else {
                    e_s_row
                };
                let e_header_indent = get_line_indent(lines.get(e_s_row).unwrap_or(&""));
                let e_body_indent = if let Some(b) = e_body {
                    get_block_indent(b, lines, &e_header_indent)
                } else {
                    format!("{}    ", e_header_indent)
                };

                let else_idx = items.len();
                items.push(ScopeItem {
                    id: else_idx,
                    kind: NodeKind::ControlFlow { flow_type: ControlFlowType::Else },
                    start_row: e_s_row,
                    end_row: end_row_inclusive(&alt_node),
                    start_byte: alt_node.start_byte(),
                    end_byte: alt_node.end_byte(),
                    sig_end_row: e_sig_end,
                    body_indent: e_body_indent,
                    docstring_rows: None,
                    decorator_rows: None,
                    parent_idx,
                    child_indices: Vec::new(),
                    companion_indices: vec![if_idx],
                    defined_symbols: HashSet::new(),
                    referenced_symbols: HashSet::new(),
                    tokens: Vec::new(),
                });

                if let Some(pidx) = parent_idx {
                    items[pidx].child_indices.push(else_idx);
                }
                items[if_idx].companion_indices.push(else_idx);

                if let Some(b) = e_body {
                    walk_children(b, Some(else_idx), source_bytes, lines, items);
                }

                break;
            }
            _ => break,
        }
    }
}

fn handle_try(
    try_node: Node,
    parent_idx: Option<usize>,
    source_bytes: &[u8],
    lines: &[&str],
    items: &mut Vec<ScopeItem>,
) {
    let s_row = try_node.start_position().row;
    let body_node = try_node.child_by_field_name("body");
    let sig_end_row = if let Some(b) = body_node {
        if b.start_position().row > 0 {
            b.start_position().row.saturating_sub(1).max(s_row)
        } else {
            s_row
        }
    } else {
        s_row
    };

    let header_indent = get_line_indent(lines.get(s_row).unwrap_or(&""));
    let body_indent = if let Some(b) = body_node {
        get_block_indent(b, lines, &header_indent)
    } else {
        format!("{}    ", header_indent)
    };

    let try_idx = items.len();
    items.push(ScopeItem {
        id: try_idx,
        kind: NodeKind::ControlFlow { flow_type: ControlFlowType::Try },
        start_row: s_row,
        end_row: body_node.map(|b| end_row_inclusive(&b)).unwrap_or(s_row),
        start_byte: try_node.start_byte(),
        end_byte: body_node.map(|b| b.end_byte()).unwrap_or_else(|| try_node.end_byte()),
        sig_end_row,
        body_indent,
        docstring_rows: None,
        decorator_rows: None,
        parent_idx,
        child_indices: Vec::new(),
        companion_indices: Vec::new(),
        defined_symbols: HashSet::new(),
        referenced_symbols: HashSet::new(),
        tokens: Vec::new(),
    });

    if let Some(pidx) = parent_idx {
        items[pidx].child_indices.push(try_idx);
    }

    if let Some(b) = body_node {
        walk_children(b, Some(try_idx), source_bytes, lines, items);
    }

    // Inspect clauses of try_statement (except, else, finally)
    let mut cursor = try_node.walk();
    for child in try_node.children(&mut cursor) {
        match child.kind() {
            "except_clause" => {
                let e_s_row = child.start_position().row;
                let mut e_body = None;
                let mut e_cursor = child.walk();
                for ec in child.children(&mut e_cursor) {
                    if ec.kind() == "block" {
                        e_body = Some(ec);
                        break;
                    }
                }

                let e_sig_end = if let Some(b) = e_body {
                    if b.start_position().row > 0 {
                        b.start_position().row.saturating_sub(1).max(e_s_row)
                    } else {
                        e_s_row
                    }
                } else {
                    e_s_row
                };
                let e_header_indent = get_line_indent(lines.get(e_s_row).unwrap_or(&""));
                let e_body_indent = if let Some(b) = e_body {
                    get_block_indent(b, lines, &e_header_indent)
                } else {
                    format!("{}    ", e_header_indent)
                };

                let mut e_tokens = Vec::new();
                let mut e_refs = HashSet::new();
                let mut e_defs = HashSet::new();
                collect_identifiers(child, source_bytes, &mut e_tokens);
                collect_defs(child, source_bytes, &mut e_defs);
                collect_refs(child, source_bytes, &mut e_refs);

                let except_idx = items.len();
                items.push(ScopeItem {
                    id: except_idx,
                    kind: NodeKind::ControlFlow { flow_type: ControlFlowType::Except },
                    start_row: e_s_row,
                    end_row: end_row_inclusive(&child),
                    start_byte: child.start_byte(),
                    end_byte: child.end_byte(),
                    sig_end_row: e_sig_end,
                    body_indent: e_body_indent,
                    docstring_rows: None,
                    decorator_rows: None,
                    parent_idx,
                    child_indices: Vec::new(),
                    companion_indices: vec![try_idx],
                    defined_symbols: e_defs,
                    referenced_symbols: e_refs,
                    tokens: e_tokens,
                });

                if let Some(pidx) = parent_idx {
                    items[pidx].child_indices.push(except_idx);
                }
                items[try_idx].companion_indices.push(except_idx);

                if let Some(b) = e_body {
                    walk_children(b, Some(except_idx), source_bytes, lines, items);
                }
            }
            "finally_clause" => {
                let f_s_row = child.start_position().row;
                let mut f_body = None;
                let mut f_cursor = child.walk();
                for fc in child.children(&mut f_cursor) {
                    if fc.kind() == "block" {
                        f_body = Some(fc);
                        break;
                    }
                }

                let f_sig_end = if let Some(b) = f_body {
                    if b.start_position().row > 0 {
                        b.start_position().row.saturating_sub(1).max(f_s_row)
                    } else {
                        f_s_row
                    }
                } else {
                    f_s_row
                };
                let f_header_indent = get_line_indent(lines.get(f_s_row).unwrap_or(&""));
                let f_body_indent = if let Some(b) = f_body {
                    get_block_indent(b, lines, &f_header_indent)
                } else {
                    format!("{}    ", f_header_indent)
                };

                let finally_idx = items.len();
                items.push(ScopeItem {
                    id: finally_idx,
                    kind: NodeKind::ControlFlow { flow_type: ControlFlowType::Finally },
                    start_row: f_s_row,
                    end_row: end_row_inclusive(&child),
                    start_byte: child.start_byte(),
                    end_byte: child.end_byte(),
                    sig_end_row: f_sig_end,
                    body_indent: f_body_indent,
                    docstring_rows: None,
                    decorator_rows: None,
                    parent_idx,
                    child_indices: Vec::new(),
                    companion_indices: vec![try_idx],
                    defined_symbols: HashSet::new(),
                    referenced_symbols: HashSet::new(),
                    tokens: Vec::new(),
                });

                if let Some(pidx) = parent_idx {
                    items[pidx].child_indices.push(finally_idx);
                }
                items[try_idx].companion_indices.push(finally_idx);

                if let Some(b) = f_body {
                    walk_children(b, Some(finally_idx), source_bytes, lines, items);
                }
            }
            _ => {}
        }
    }
}

fn handle_for(
    for_node: Node,
    parent_idx: Option<usize>,
    source_bytes: &[u8],
    lines: &[&str],
    items: &mut Vec<ScopeItem>,
) {
    let s_row = for_node.start_position().row;
    let body_node = for_node.child_by_field_name("body");
    let sig_end_row = if let Some(b) = body_node {
        if b.start_position().row > 0 {
            b.start_position().row.saturating_sub(1).max(s_row)
        } else {
            s_row
        }
    } else {
        s_row
    };

    let header_indent = get_line_indent(lines.get(s_row).unwrap_or(&""));
    let body_indent = if let Some(b) = body_node {
        get_block_indent(b, lines, &header_indent)
    } else {
        format!("{}    ", header_indent)
    };

    let mut defs = HashSet::new();
    let mut refs = HashSet::new();
    let mut tokens = Vec::new();
    if let Some(left) = for_node.child_by_field_name("left") {
        collect_target_identifiers(left, source_bytes, &mut defs);
        collect_identifiers(left, source_bytes, &mut tokens);
    }
    if let Some(right) = for_node.child_by_field_name("right") {
        collect_refs(right, source_bytes, &mut refs);
        collect_identifiers(right, source_bytes, &mut tokens);
    }

    let for_idx = items.len();
    items.push(ScopeItem {
        id: for_idx,
        kind: NodeKind::ControlFlow { flow_type: ControlFlowType::For },
        start_row: s_row,
        end_row: end_row_inclusive(&for_node),
        start_byte: for_node.start_byte(),
        end_byte: for_node.end_byte(),
        sig_end_row,
        body_indent,
        docstring_rows: None,
        decorator_rows: None,
        parent_idx,
        child_indices: Vec::new(),
        companion_indices: Vec::new(),
        defined_symbols: defs,
        referenced_symbols: refs,
        tokens,
    });

    if let Some(pidx) = parent_idx {
        items[pidx].child_indices.push(for_idx);
    }

    if let Some(b) = body_node {
        walk_children(b, Some(for_idx), source_bytes, lines, items);
    }
}

fn handle_while(
    while_node: Node,
    parent_idx: Option<usize>,
    source_bytes: &[u8],
    lines: &[&str],
    items: &mut Vec<ScopeItem>,
) {
    let s_row = while_node.start_position().row;
    let body_node = while_node.child_by_field_name("body");
    let sig_end_row = if let Some(b) = body_node {
        if b.start_position().row > 0 {
            b.start_position().row.saturating_sub(1).max(s_row)
        } else {
            s_row
        }
    } else {
        s_row
    };

    let header_indent = get_line_indent(lines.get(s_row).unwrap_or(&""));
    let body_indent = if let Some(b) = body_node {
        get_block_indent(b, lines, &header_indent)
    } else {
        format!("{}    ", header_indent)
    };

    let mut refs = HashSet::new();
    let mut tokens = Vec::new();
    if let Some(cond) = while_node.child_by_field_name("condition") {
        collect_refs(cond, source_bytes, &mut refs);
        collect_identifiers(cond, source_bytes, &mut tokens);
    }

    let while_idx = items.len();
    items.push(ScopeItem {
        id: while_idx,
        kind: NodeKind::ControlFlow { flow_type: ControlFlowType::While },
        start_row: s_row,
        end_row: end_row_inclusive(&while_node),
        start_byte: while_node.start_byte(),
        end_byte: while_node.end_byte(),
        sig_end_row,
        body_indent,
        docstring_rows: None,
        decorator_rows: None,
        parent_idx,
        child_indices: Vec::new(),
        companion_indices: Vec::new(),
        defined_symbols: HashSet::new(),
        referenced_symbols: refs,
        tokens,
    });

    if let Some(pidx) = parent_idx {
        items[pidx].child_indices.push(while_idx);
    }

    if let Some(b) = body_node {
        walk_children(b, Some(while_idx), source_bytes, lines, items);
    }
}

fn handle_with(
    with_node: Node,
    parent_idx: Option<usize>,
    source_bytes: &[u8],
    lines: &[&str],
    items: &mut Vec<ScopeItem>,
) {
    let s_row = with_node.start_position().row;
    let body_node = with_node.child_by_field_name("body");
    let sig_end_row = if let Some(b) = body_node {
        if b.start_position().row > 0 {
            b.start_position().row.saturating_sub(1).max(s_row)
        } else {
            s_row
        }
    } else {
        s_row
    };

    let header_indent = get_line_indent(lines.get(s_row).unwrap_or(&""));
    let body_indent = if let Some(b) = body_node {
        get_block_indent(b, lines, &header_indent)
    } else {
        format!("{}    ", header_indent)
    };

    let mut defs = HashSet::new();
    let mut refs = HashSet::new();
    let mut tokens = Vec::new();
    collect_defs(with_node, source_bytes, &mut defs);
    collect_refs(with_node, source_bytes, &mut refs);
    collect_identifiers(with_node, source_bytes, &mut tokens);

    let with_idx = items.len();
    items.push(ScopeItem {
        id: with_idx,
        kind: NodeKind::ControlFlow { flow_type: ControlFlowType::With },
        start_row: s_row,
        end_row: end_row_inclusive(&with_node),
        start_byte: with_node.start_byte(),
        end_byte: with_node.end_byte(),
        sig_end_row,
        body_indent,
        docstring_rows: None,
        decorator_rows: None,
        parent_idx,
        child_indices: Vec::new(),
        companion_indices: Vec::new(),
        defined_symbols: defs,
        referenced_symbols: refs,
        tokens,
    });

    if let Some(pidx) = parent_idx {
        items[pidx].child_indices.push(with_idx);
    }

    if let Some(b) = body_node {
        walk_children(b, Some(with_idx), source_bytes, lines, items);
    }
}

fn get_block_indent(block_node: Node, lines: &[&str], default_parent_indent: &str) -> String {
    let mut b_cursor = block_node.walk();
    let first_stmt = block_node.children(&mut b_cursor).find(|c| c.kind() != "comment" && c.kind() != ":");
    if let Some(stmt) = first_stmt {
        get_line_indent(lines.get(stmt.start_position().row).unwrap_or(&""))
    } else {
        format!("{}    ", default_parent_indent)
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

fn collect_defs(node: Node, source_bytes: &[u8], defs: &mut HashSet<String>) {
    match node.kind() {
        "assignment" => {
            if let Some(left) = node.child_by_field_name("left") {
                collect_target_identifiers(left, source_bytes, defs);
            }
        }
        "augmented_assignment" => {
            if let Some(left) = node.child_by_field_name("left") {
                collect_target_identifiers(left, source_bytes, defs);
            }
        }
        "named_expression" => {
            if let Some(name) = node.child_by_field_name("name") {
                collect_target_identifiers(name, source_bytes, defs);
            }
        }
        "for_statement" | "async_for_statement" => {
            if let Some(left) = node.child_by_field_name("left") {
                collect_target_identifiers(left, source_bytes, defs);
            }
        }
        "with_item" => {
            if let Some(alias) = node.child_by_field_name("alias") {
                collect_target_identifiers(alias, source_bytes, defs);
            }
        }
        "function_definition" | "async_function_definition" => {
            if let Some(name) = node.child_by_field_name("name") {
                if let Ok(text) = name.utf8_text(source_bytes) {
                    defs.insert(text.to_string());
                }
            }
        }
        "class_definition" => {
            if let Some(name) = node.child_by_field_name("name") {
                if let Ok(text) = name.utf8_text(source_bytes) {
                    defs.insert(text.to_string());
                }
            }
        }
        _ => {
            let mut cursor = node.walk();
            for child in node.children(&mut cursor) {
                if child.kind() == "assignment" || child.kind() == "augmented_assignment" || child.kind() == "named_expression" {
                    collect_defs(child, source_bytes, defs);
                }
            }
        }
    }
}

fn collect_target_identifiers(node: Node, source_bytes: &[u8], defs: &mut HashSet<String>) {
    match node.kind() {
        "identifier" => {
            if let Ok(text) = node.utf8_text(source_bytes) {
                defs.insert(text.to_string());
            }
        }
        "pattern_list" | "tuple_pattern" | "list_pattern" | "tuple" | "list" => {
            let mut cursor = node.walk();
            for child in node.children(&mut cursor) {
                collect_target_identifiers(child, source_bytes, defs);
            }
        }
        "as_pattern" => {
            if let Some(alias) = node.child_by_field_name("alias") {
                collect_target_identifiers(alias, source_bytes, defs);
            }
        }
        "dotted_name" => {
            if let Ok(text) = node.utf8_text(source_bytes) {
                defs.insert(text.to_string());
            }
        }
        _ => {
            let mut cursor = node.walk();
            for child in node.children(&mut cursor) {
                collect_target_identifiers(child, source_bytes, defs);
            }
        }
    }
}

fn collect_refs(node: Node, source_bytes: &[u8], refs: &mut HashSet<String>) {
    if node.kind() == "identifier" {
        if let Ok(text) = node.utf8_text(source_bytes) {
            refs.insert(text.to_string());
        }
    }
    let mut cursor = node.walk();
    for child in node.children(&mut cursor) {
        collect_refs(child, source_bytes, refs);
    }
}

pub fn extract_func_signature_tokens(
    func_node: &Node,
    source_bytes: &[u8],
) -> Vec<String> {
    let mut tokens = Vec::new();
    if let Some(name) = func_node.child_by_field_name("name") {
        collect_identifiers(name, source_bytes, &mut tokens);
    }
    if let Some(params) = func_node.child_by_field_name("parameters") {
        collect_identifiers(params, source_bytes, &mut tokens);
    }
    if let Some(ret) = func_node.child_by_field_name("return_type") {
        collect_identifiers(ret, source_bytes, &mut tokens);
    }
    // Also include decorators if parent is decorated_definition
    if let Some(p) = func_node.parent() {
        if p.kind() == "decorated_definition" {
            let mut cursor = p.walk();
            for child in p.children(&mut cursor) {
                if child.kind() == "decorator" {
                    collect_identifiers(child, source_bytes, &mut tokens);
                }
            }
        }
    }
    tokens
}

pub fn extract_class_signature_tokens(
    class_node: &Node,
    source_bytes: &[u8],
) -> Vec<String> {
    let mut tokens = Vec::new();
    if let Some(name) = class_node.child_by_field_name("name") {
        collect_identifiers(name, source_bytes, &mut tokens);
    }
    if let Some(superclasses) = class_node.child_by_field_name("superclasses") {
        collect_identifiers(superclasses, source_bytes, &mut tokens);
    }
    if let Some(p) = class_node.parent() {
        if p.kind() == "decorated_definition" {
            let mut cursor = p.walk();
            for child in p.children(&mut cursor) {
                if child.kind() == "decorator" {
                    collect_identifiers(child, source_bytes, &mut tokens);
                }
            }
        }
    }
    tokens
}
