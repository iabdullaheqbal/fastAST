use pyo3::prelude::*;
use tree_sitter::{Node, Tree};

#[pyclass]
#[derive(Clone, Debug)]
pub struct ExtractedSymbol {
    #[pyo3(get)]
    pub name: String,
    #[pyo3(get)]
    pub kind: String, // "function", "async_function", "class", "method"
    #[pyo3(get)]
    pub signature: String,
    #[pyo3(get)]
    pub start_line: usize,
    #[pyo3(get)]
    pub end_line: usize,
    #[pyo3(get)]
    pub parent_name: Option<String>,
    #[pyo3(get)]
    pub docstring: Option<String>,
}

#[pyclass]
#[derive(Clone, Debug)]
pub struct ExtractedImport {
    #[pyo3(get)]
    pub module: String,
    #[pyo3(get)]
    pub name: Option<String>,
    #[pyo3(get)]
    pub alias: Option<String>,
    #[pyo3(get)]
    pub line_number: usize,
}

#[pyclass]
#[derive(Clone, Debug)]
pub struct ExtractedCall {
    #[pyo3(get)]
    pub caller_name: Option<String>,
    #[pyo3(get)]
    pub callee_name: String,
    #[pyo3(get)]
    pub line_number: usize,
}

#[pyclass]
#[derive(Clone, Debug)]
pub struct FileIndexResult {
    #[pyo3(get)]
    pub symbols: Vec<ExtractedSymbol>,
    #[pyo3(get)]
    pub imports: Vec<ExtractedImport>,
    #[pyo3(get)]
    pub calls: Vec<ExtractedCall>,
    #[pyo3(get)]
    pub total_lines: usize,
    #[pyo3(get)]
    pub total_tokens: usize,
    #[pyo3(get)]
    pub has_syntax_error: bool,
}

pub fn extract_file_index(
    tree: &Tree,
    source_bytes: &[u8],
    lines: &[&str],
    total_tokens: usize,
) -> FileIndexResult {
    let mut symbols = Vec::new();
    let mut imports = Vec::new();
    let mut calls = Vec::new();

    let root = tree.root_node();
    let has_syntax_error = root.has_error();

    walk_node(
        root,
        source_bytes,
        lines,
        None, // parent_class
        None, // caller_symbol
        &mut symbols,
        &mut imports,
        &mut calls,
    );

    FileIndexResult {
        symbols,
        imports,
        calls,
        total_lines: lines.len(),
        total_tokens,
        has_syntax_error,
    }
}

fn walk_node(
    node: Node,
    source_bytes: &[u8],
    lines: &[&str],
    parent_class: Option<&str>,
    current_caller: Option<&str>,
    symbols: &mut Vec<ExtractedSymbol>,
    imports: &mut Vec<ExtractedImport>,
    calls: &mut Vec<ExtractedCall>,
) {
    match node.kind() {
        "import_statement" => {
            extract_import_statement(node, source_bytes, imports);
        }
        "import_from_statement" => {
            extract_import_from_statement(node, source_bytes, imports);
        }
        "class_definition" => {
            let class_name = node
                .child_by_field_name("name")
                .and_then(|n| n.utf8_text(source_bytes).ok())
                .unwrap_or("UnknownClass")
                .to_string();

            let start_line = node.start_position().row + 1;
            let end_line = node.end_position().row + 1;

            let body_node = node.child_by_field_name("body");
            let sig_end_row = if let Some(b) = body_node {
                if b.start_position().row > 0 {
                    b.start_position().row.saturating_sub(1).max(node.start_position().row)
                } else {
                    node.start_position().row
                }
            } else {
                node.start_position().row
            };

            let signature = extract_span_text(lines, node.start_position().row, sig_end_row);
            let docstring = extract_docstring(body_node, source_bytes);

            symbols.push(ExtractedSymbol {
                name: class_name.clone(),
                kind: "class".to_string(),
                signature,
                start_line,
                end_line,
                parent_name: parent_class.map(|s| s.to_string()),
                docstring,
            });

            // Recurse into class body
            if let Some(body) = body_node {
                let mut cursor = body.walk();
                for child in body.children(&mut cursor) {
                    walk_node(
                        child,
                        source_bytes,
                        lines,
                        Some(&class_name),
                        current_caller,
                        symbols,
                        imports,
                        calls,
                    );
                }
            }
            return;
        }
        "function_definition" | "async_function_definition" => {
            let func_name = node
                .child_by_field_name("name")
                .and_then(|n| n.utf8_text(source_bytes).ok())
                .unwrap_or("unknown_func")
                .to_string();

            let is_async = node.kind() == "async_function_definition";
            let kind = if parent_class.is_some() {
                "method".to_string()
            } else if is_async {
                "async_function".to_string()
            } else {
                "function".to_string()
            };

            let start_line = node.start_position().row + 1;
            let end_line = node.end_position().row + 1;

            let body_node = node.child_by_field_name("body");
            let sig_end_row = if let Some(b) = body_node {
                if b.start_position().row > 0 {
                    b.start_position().row.saturating_sub(1).max(node.start_position().row)
                } else {
                    node.start_position().row
                }
            } else {
                node.start_position().row
            };

            let signature = extract_span_text(lines, node.start_position().row, sig_end_row);
            let docstring = extract_docstring(body_node, source_bytes);

            let qualified_name = if let Some(p) = parent_class {
                format!("{}.{}", p, func_name)
            } else {
                func_name.clone()
            };

            symbols.push(ExtractedSymbol {
                name: func_name,
                kind,
                signature,
                start_line,
                end_line,
                parent_name: parent_class.map(|s| s.to_string()),
                docstring,
            });

            // Recurse into function body with current_caller set to qualified_name
            if let Some(body) = body_node {
                let mut cursor = body.walk();
                for child in body.children(&mut cursor) {
                    walk_node(
                        child,
                        source_bytes,
                        lines,
                        parent_class,
                        Some(&qualified_name),
                        symbols,
                        imports,
                        calls,
                    );
                }
            }
            return;
        }
        "call" => {
            if let Some(func_node) = node.child_by_field_name("function") {
                let callee_name = extract_callee_name(func_node, source_bytes);
                if !callee_name.is_empty() {
                    calls.push(ExtractedCall {
                        caller_name: current_caller.map(|s| s.to_string()),
                        callee_name,
                        line_number: node.start_position().row + 1,
                    });
                }
            }
        }
        _ => {}
    }

    // Default: recurse into children
    let mut cursor = node.walk();
    for child in node.children(&mut cursor) {
        walk_node(
            child,
            source_bytes,
            lines,
            parent_class,
            current_caller,
            symbols,
            imports,
            calls,
        );
    }
}

fn extract_import_statement(
    node: Node,
    source_bytes: &[u8],
    imports: &mut Vec<ExtractedImport>,
) {
    let line = node.start_position().row + 1;
    let mut cursor = node.walk();
    for child in node.children(&mut cursor) {
        match child.kind() {
            "dotted_name" => {
                if let Ok(name) = child.utf8_text(source_bytes) {
                    imports.push(ExtractedImport {
                        module: name.to_string(),
                        name: None,
                        alias: None,
                        line_number: line,
                    });
                }
            }
            "aliased_import" => {
                let name = child
                    .child_by_field_name("name")
                    .and_then(|n| n.utf8_text(source_bytes).ok())
                    .unwrap_or("");
                let alias = child
                    .child_by_field_name("alias")
                    .and_then(|n| n.utf8_text(source_bytes).ok())
                    .map(|s| s.to_string());
                if !name.is_empty() {
                    imports.push(ExtractedImport {
                        module: name.to_string(),
                        name: None,
                        alias,
                        line_number: line,
                    });
                }
            }
            _ => {}
        }
    }
}

fn extract_import_from_statement(
    node: Node,
    source_bytes: &[u8],
    imports: &mut Vec<ExtractedImport>,
) {
    let line = node.start_position().row + 1;
    let module_node = node.child_by_field_name("module_name");
    let module = module_node
        .and_then(|n| n.utf8_text(source_bytes).ok())
        .unwrap_or("")
        .to_string();

    let mut cursor = node.walk();
    for child in node.children(&mut cursor) {
        if Some(child) == module_node {
            continue;
        }
        match child.kind() {
            "dotted_name" => {
                if let Ok(name) = child.utf8_text(source_bytes) {
                    imports.push(ExtractedImport {
                        module: module.clone(),
                        name: Some(name.to_string()),
                        alias: None,
                        line_number: line,
                    });
                }
            }
            "aliased_import" => {
                let name = child
                    .child_by_field_name("name")
                    .and_then(|n| n.utf8_text(source_bytes).ok())
                    .map(|s| s.to_string());
                let alias = child
                    .child_by_field_name("alias")
                    .and_then(|n| n.utf8_text(source_bytes).ok())
                    .map(|s| s.to_string());
                imports.push(ExtractedImport {
                    module: module.clone(),
                    name,
                    alias,
                    line_number: line,
                });
            }
            _ => {}
        }
    }
}

fn extract_callee_name(func_node: Node, source_bytes: &[u8]) -> String {
    match func_node.kind() {
        "identifier" => func_node
            .utf8_text(source_bytes)
            .unwrap_or("")
            .to_string(),
        "attribute" => {
            // e.g. self.process_request or engine.dispatch
            if let Some(attr) = func_node.child_by_field_name("attribute") {
                attr.utf8_text(source_bytes).unwrap_or("").to_string()
            } else {
                func_node.utf8_text(source_bytes).unwrap_or("").to_string()
            }
        }
        _ => func_node
            .utf8_text(source_bytes)
            .unwrap_or("")
            .split('(')
            .next()
            .unwrap_or("")
            .trim()
            .to_string(),
    }
}

fn extract_docstring(body_node: Option<Node>, source_bytes: &[u8]) -> Option<String> {
    let body = body_node?;
    let mut cursor = body.walk();
    for child in body.children(&mut cursor) {
        if child.kind() == "expression_statement" {
            if let Some(first_child) = child.child(0) {
                if first_child.kind() == "string" {
                    if let Ok(text) = first_child.utf8_text(source_bytes) {
                        let trimmed = text
                            .trim_matches('"')
                            .trim_matches('\'')
                            .trim();
                        if !trimmed.is_empty() {
                            return Some(trimmed.to_string());
                        }
                    }
                }
            }
            break;
        } else if child.kind() != "comment" {
            break;
        }
    }
    None
}

fn extract_span_text(lines: &[&str], start_row: usize, end_row: usize) -> String {
    let s = start_row.min(lines.len());
    let e = end_row.min(lines.len().saturating_sub(1));
    lines[s..=e].join("\n").trim().to_string()
}
