//! Rust Language Engine for FastAST
//!
//! Provides AST parsing, dual-rubric semantic/dependency pruning,
//! and symbol indexing for Rust source code.

pub mod parser;
pub mod repair;
pub mod scorer;

use pyo3::prelude::*;
use crate::indexer::{ExtractedCall, ExtractedImport, ExtractedSymbol, FileIndexResult};
use crate::count_tokens;
use crate::PruneResult;

pub struct RustPruneResult {
    pub pruned_code: String,
    pub original_tokens: usize,
    pub pruned_tokens: usize,
    pub savings_pct: f64,
    pub total_lines: usize,
    pub kept_lines: usize,
    pub latency_ms: f64,
    pub has_syntax_error: bool,
}

pub fn prune_rust(code_text: &str, focus_query: &str, threshold: f64) -> RustPruneResult {
    let prune_start = std::time::Instant::now();
    let total_lines = code_text.lines().count();
    let original_tokens = count_tokens(code_text);

    let tree = match parser::parse_ast(code_text) {
        Ok(t) => t,
        Err(_) => {
            let elapsed = prune_start.elapsed().as_secs_f64() * 1000.0;
            return RustPruneResult {
                pruned_code: code_text.to_string(),
                original_tokens,
                pruned_tokens: original_tokens,
                savings_pct: 0.0,
                total_lines,
                kept_lines: total_lines,
                latency_ms: elapsed,
                has_syntax_error: true,
            };
        }
    };

    if tree.root_node().has_error() {
        let elapsed = prune_start.elapsed().as_secs_f64() * 1000.0;
        return RustPruneResult {
            pruned_code: code_text.to_string(),
            original_tokens,
            pruned_tokens: original_tokens,
            savings_pct: 0.0,
            total_lines,
            kept_lines: total_lines,
            latency_ms: elapsed,
            has_syntax_error: true,
        };
    }

    let source_bytes = code_text.as_bytes();
    let lines: Vec<&str> = code_text.lines().collect();

    let scopes = parser::collect_scopes(&tree, source_bytes, &lines);
    let score_res = scorer::evaluate_scopes(&scopes, focus_query, threshold);
    let pruned_code = repair::reconstruct_code(code_text, &scopes, &score_res.decisions);
    let prune_elapsed = prune_start.elapsed().as_secs_f64() * 1000.0;

    let pruned_tokens = count_tokens(&pruned_code);
    let kept_lines = pruned_code.lines().count();
    let savings_pct = if original_tokens > 0 {
        ((original_tokens.saturating_sub(pruned_tokens)) as f64 / original_tokens as f64) * 100.0
    } else {
        0.0
    };

    RustPruneResult {
        pruned_code,
        original_tokens,
        pruned_tokens,
        savings_pct,
        total_lines,
        kept_lines,
        latency_ms: prune_elapsed,
        has_syntax_error: false,
    }
}

pub fn prune_file(
    code_text: &str,
    focus_query: &str,
    threshold: f64,
) -> PyResult<PruneResult> {
    let res = prune_rust(code_text, focus_query, threshold);
    Ok(PruneResult {
        pruned_code: res.pruned_code,
        original_tokens: res.original_tokens,
        pruned_tokens: res.pruned_tokens,
        savings_pct: res.savings_pct,
        total_lines: res.total_lines,
        kept_lines: res.kept_lines,
        latency_ms: res.latency_ms,
        has_syntax_error: res.has_syntax_error,
    })
}

pub fn index_code(code_text: &str) -> PyResult<FileIndexResult> {
    let total_tokens = count_tokens(code_text);
    let lines: Vec<&str> = code_text.lines().collect();

    let tree = match parser::parse_ast(code_text) {
        Ok(t) => t,
        Err(_) => {
            return Ok(FileIndexResult {
                symbols: Vec::new(),
                imports: Vec::new(),
                calls: Vec::new(),
                total_lines: lines.len(),
                total_tokens,
                has_syntax_error: true,
            });
        }
    };

    let has_syntax_error = tree.root_node().has_error();
    let source_bytes = code_text.as_bytes();
    let scopes = parser::collect_scopes(&tree, source_bytes, &lines);

    let mut symbols = Vec::new();
    let mut imports = Vec::new();
    let mut calls = Vec::new();

    for item in &scopes {
        match &item.kind {
            parser::RustNodeKind::Use => {
                let sig = &source_code_snippet(code_text, item.start_byte, item.end_byte);
                let cleaned = sig.trim().trim_start_matches("pub ").trim_start_matches("use ").trim_end_matches(';').trim();
                imports.push(ExtractedImport {
                    module: cleaned.to_string(),
                    name: item.defined_symbols.last().cloned(),
                    alias: None,
                    line_number: item.start_row + 1,
                });
            }
            parser::RustNodeKind::Function {
                name,
                is_async,
                is_method,
                ..
            } => {
                let kind = if *is_async {
                    if *is_method { "async_method" } else { "async_function" }
                } else if *is_method {
                    "method"
                } else {
                    "function"
                };

                let parent_name = if let Some(pid) = item.parent_id {
                    match &scopes[pid].kind {
                        parser::RustNodeKind::Impl { target_type, .. } => Some(target_type.clone()),
                        parser::RustNodeKind::Trait { name: tname } => Some(tname.clone()),
                        parser::RustNodeKind::Mod { name: mname, .. } => Some(mname.clone()),
                        _ => None,
                    }
                } else {
                    None
                };

                let sig = first_line_of(code_text, item.start_byte, item.end_byte);
                symbols.push(ExtractedSymbol {
                    name: name.clone(),
                    kind: kind.to_string(),
                    signature: sig,
                    start_line: item.start_row + 1,
                    end_line: item.end_row + 1,
                    parent_name,
                    docstring: None,
                });
            }
            parser::RustNodeKind::Struct { name } => {
                let sig = first_line_of(code_text, item.start_byte, item.end_byte);
                symbols.push(ExtractedSymbol {
                    name: name.clone(),
                    kind: "struct".to_string(),
                    signature: sig,
                    start_line: item.start_row + 1,
                    end_line: item.end_row + 1,
                    parent_name: None,
                    docstring: None,
                });
            }
            parser::RustNodeKind::Enum { name, .. } => {
                let sig = first_line_of(code_text, item.start_byte, item.end_byte);
                symbols.push(ExtractedSymbol {
                    name: name.clone(),
                    kind: "enum".to_string(),
                    signature: sig,
                    start_line: item.start_row + 1,
                    end_line: item.end_row + 1,
                    parent_name: None,
                    docstring: None,
                });
            }
            parser::RustNodeKind::Trait { name } => {
                let sig = first_line_of(code_text, item.start_byte, item.end_byte);
                symbols.push(ExtractedSymbol {
                    name: name.clone(),
                    kind: "trait".to_string(),
                    signature: sig,
                    start_line: item.start_row + 1,
                    end_line: item.end_row + 1,
                    parent_name: None,
                    docstring: None,
                });
            }
            parser::RustNodeKind::Impl {
                target_type,
                trait_name,
            } => {
                let name = if let Some(ref tr) = trait_name {
                    format!("impl {} for {}", tr, target_type)
                } else {
                    format!("impl {}", target_type)
                };
                let sig = first_line_of(code_text, item.start_byte, item.end_byte);
                symbols.push(ExtractedSymbol {
                    name,
                    kind: "impl".to_string(),
                    signature: sig,
                    start_line: item.start_row + 1,
                    end_line: item.end_row + 1,
                    parent_name: None,
                    docstring: None,
                });
            }
            parser::RustNodeKind::Mod { name, .. } => {
                let sig = first_line_of(code_text, item.start_byte, item.end_byte);
                symbols.push(ExtractedSymbol {
                    name: name.clone(),
                    kind: "module".to_string(),
                    signature: sig,
                    start_line: item.start_row + 1,
                    end_line: item.end_row + 1,
                    parent_name: None,
                    docstring: None,
                });
            }
            parser::RustNodeKind::Const { name } => {
                let sig = first_line_of(code_text, item.start_byte, item.end_byte);
                symbols.push(ExtractedSymbol {
                    name: name.clone(),
                    kind: "const".to_string(),
                    signature: sig,
                    start_line: item.start_row + 1,
                    end_line: item.end_row + 1,
                    parent_name: None,
                    docstring: None,
                });
            }
            parser::RustNodeKind::Static { name } => {
                let sig = first_line_of(code_text, item.start_byte, item.end_byte);
                symbols.push(ExtractedSymbol {
                    name: name.clone(),
                    kind: "static".to_string(),
                    signature: sig,
                    start_line: item.start_row + 1,
                    end_line: item.end_row + 1,
                    parent_name: None,
                    docstring: None,
                });
            }
            parser::RustNodeKind::TypeAlias { name } => {
                let sig = first_line_of(code_text, item.start_byte, item.end_byte);
                symbols.push(ExtractedSymbol {
                    name: name.clone(),
                    kind: "type_alias".to_string(),
                    signature: sig,
                    start_line: item.start_row + 1,
                    end_line: item.end_row + 1,
                    parent_name: None,
                    docstring: None,
                });
            }
            _ => {}
        }
    }

    // Extract call expressions across AST
    collect_calls(tree.root_node(), source_bytes, &mut calls, None);

    Ok(FileIndexResult {
        symbols,
        imports,
        calls,
        total_lines: lines.len(),
        total_tokens,
        has_syntax_error,
    })
}

fn source_code_snippet(code: &str, start_byte: usize, end_byte: usize) -> &str {
    if start_byte <= end_byte && end_byte <= code.len() {
        &code[start_byte..end_byte]
    } else {
        ""
    }
}

fn first_line_of(code: &str, start_byte: usize, end_byte: usize) -> String {
    let snippet = source_code_snippet(code, start_byte, end_byte);
    snippet.lines().next().unwrap_or("").trim().to_string()
}

fn collect_calls(
    node: tree_sitter::Node,
    source_bytes: &[u8],
    calls: &mut Vec<ExtractedCall>,
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
        let mut cursor = node.walk();
        for child in node.children(&mut cursor) {
            if child.kind() == "identifier" || child.kind() == "field_expression" {
                if let Ok(text) = child.utf8_text(source_bytes) {
                    let callee = text.split('.').last().unwrap_or(text).trim().to_string();
                    if !callee.is_empty() {
                        calls.push(ExtractedCall {
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
        collect_calls(child, source_bytes, calls, new_caller.clone());
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    const SAMPLE_CODE: &str = r#"
use std::collections::HashMap;

pub struct Calculator {
    result: i32,
}

impl Calculator {
    pub fn new() -> Self {
        Self { result: 0 }
    }

    pub fn add(&mut self, a: i32, b: i32) -> i32 {
        self.result = a + b;
        self.result
    }

    pub fn subtract(&mut self, a: i32, b: i32) -> i32 {
        self.result = a - b;
        self.result
    }
}
"#;

    #[test]
    fn test_rust_prune_add_method() {
        let res = prune_rust(SAMPLE_CODE, "add", 0.3);
        assert!(!res.has_syntax_error);
        assert!(res.pruned_code.contains("pub fn add(&mut self, a: i32, b: i32) -> i32 {"));
        assert!(res.pruned_code.contains("self.result = a + b;"));
        assert!(res.pruned_code.contains("pub fn subtract(&mut self, a: i32, b: i32) -> i32 { todo!() }"));
        assert!(res.pruned_code.contains("pub fn new() -> Self { todo!() }"));
        assert!(res.savings_pct > 0.0);
    }

    #[test]
    fn test_rust_zero_match_structural_skeleton() {
        let res = prune_rust(SAMPLE_CODE, "nonexistent_xyz", 0.5);
        assert!(!res.has_syntax_error);
        assert!(res.pruned_code.contains("use std::collections::HashMap;"));
        assert!(res.pruned_code.contains("pub struct Calculator"));
        assert!(res.pruned_code.contains("impl Calculator"));
        assert!(res.pruned_code.contains("pub fn add(&mut self, a: i32, b: i32) -> i32 { todo!() }"));
        assert!(!res.pruned_code.contains("self.result = a + b;"));
    }
}
