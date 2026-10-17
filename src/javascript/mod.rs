//! JavaScript + JSX pruning and indexing module
//!
//! Uses Tree-Sitter JavaScript grammar to parse, score, and reconstruct
//! syntactically valid JavaScript and JSX code.

pub mod parser;
pub mod repair;
pub mod scorer;

use crate::{
    count_tokens, ExtractedCall, ExtractedImport, ExtractedSymbol, FileIndexResult, PruneResult,
};
use pyo3::PyResult;

#[derive(Debug, Clone)]
pub struct JsPruneResult {
    pub pruned_code: String,
    pub original_tokens: usize,
    pub pruned_tokens: usize,
    pub savings_pct: f64,
    pub total_lines: usize,
    pub kept_lines: usize,
    pub latency_ms: f64,
    pub has_syntax_error: bool,
}

pub fn prune_js(
    code_text: &str,
    focus_query: &str,
    threshold: f64,
) -> JsPruneResult {
    let start = std::time::Instant::now();

    if code_text.trim().is_empty() {
        let elapsed = start.elapsed().as_secs_f64() * 1000.0;
        return JsPruneResult {
            pruned_code: String::new(),
            original_tokens: 0,
            pruned_tokens: 0,
            savings_pct: 0.0,
            total_lines: 0,
            kept_lines: 0,
            latency_ms: elapsed,
            has_syntax_error: false,
        };
    }

    let total_lines = code_text.lines().count();
    let original_tokens = count_tokens(code_text);
    let prune_start = std::time::Instant::now();

    let tree = match parser::parse_ast(code_text) {
        Ok(t) => t,
        Err(_) => {
            let elapsed = prune_start.elapsed().as_secs_f64() * 1000.0;
            return JsPruneResult {
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
        return JsPruneResult {
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

    JsPruneResult {
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
    let res = prune_js(code_text, focus_query, threshold);
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

    if tree.root_node().has_error() {
        return Ok(FileIndexResult {
            symbols: Vec::new(),
            imports: Vec::new(),
            calls: Vec::new(),
            total_lines: lines.len(),
            total_tokens,
            has_syntax_error: true,
        });
    }

    let source_bytes = code_text.as_bytes();
    let scopes = parser::collect_scopes(&tree, source_bytes, &lines);
    let raw_calls = parser::collect_all_calls(&tree, source_bytes, &scopes);

    let calls = raw_calls
        .into_iter()
        .map(|c| ExtractedCall {
            caller_name: c.caller_name,
            callee_name: c.callee_name,
            line_number: c.line_number,
        })
        .collect();

    let mut symbols = Vec::new();
    let mut imports = Vec::new();

    for (_idx, scope) in scopes.iter().enumerate() {
        let parent_name = scope.parent_id.and_then(|pid| {
            if pid < scopes.len() {
                match &scopes[pid].kind {
                    parser::JsNodeKind::Class { name, .. } => {
                        if !name.is_empty() && name != "default" {
                            Some(name.clone())
                        } else {
                            None
                        }
                    }
                    parser::JsNodeKind::Function { name, .. } => {
                        if !name.is_empty() && name != "default" {
                            Some(name.clone())
                        } else {
                            None
                        }
                    }
                    parser::JsNodeKind::ArrowFunction { name, .. } => {
                        if !name.is_empty() && name != "default" {
                            Some(name.clone())
                        } else {
                            None
                        }
                    }
                    _ => None,
                }
            } else {
                None
            }
        });

        match &scope.kind {
            parser::JsNodeKind::Function { name, is_async, is_generator, .. } => {
                let kind = if *is_generator {
                    "generator_function"
                } else if *is_async {
                    "async_function"
                } else {
                    "function"
                };
                let signature = if let Some((s_start, s_end)) = scope.signature_byte_range {
                    code_text[s_start..s_end].trim().to_string()
                } else {
                    format!("function {}()", name)
                };
                symbols.push(ExtractedSymbol {
                    name: name.clone(),
                    kind: kind.to_string(),
                    start_line: scope.start_row + 1,
                    end_line: scope.end_row + 1,
                    signature,
                    parent_name,
                    docstring: scope.docstring.clone(),
                });
            }
            parser::JsNodeKind::ArrowFunction { name, is_async, .. } => {
                let kind = if *is_async { "async_arrow_function" } else { "arrow_function" };
                let signature = if let Some((s_start, s_end)) = scope.signature_byte_range {
                    code_text[s_start..s_end].trim().to_string()
                } else {
                    format!("const {} = () =>", name)
                };
                symbols.push(ExtractedSymbol {
                    name: name.clone(),
                    kind: kind.to_string(),
                    start_line: scope.start_row + 1,
                    end_line: scope.end_row + 1,
                    signature,
                    parent_name,
                    docstring: scope.docstring.clone(),
                });
            }
            parser::JsNodeKind::Class { name, .. } => {
                let signature = if let Some((s_start, s_end)) = scope.signature_byte_range {
                    code_text[s_start..s_end].trim().to_string()
                } else {
                    format!("class {}", name)
                };
                symbols.push(ExtractedSymbol {
                    name: name.clone(),
                    kind: "class".to_string(),
                    start_line: scope.start_row + 1,
                    end_line: scope.end_row + 1,
                    signature,
                    parent_name,
                    docstring: scope.docstring.clone(),
                });
            }
            parser::JsNodeKind::Method {
                name,
                is_async,
                is_constructor,
                is_getter,
                is_setter,
                is_static,
                ..
            } => {
                let kind = if *is_constructor {
                    "constructor"
                } else if *is_getter {
                    "getter"
                } else if *is_setter {
                    "setter"
                } else if *is_static {
                    "static_method"
                } else if *is_async {
                    "async_method"
                } else {
                    "method"
                };
                let signature = if let Some((s_start, s_end)) = scope.signature_byte_range {
                    code_text[s_start..s_end].trim().to_string()
                } else {
                    format!("{}()", name)
                };
                symbols.push(ExtractedSymbol {
                    name: name.clone(),
                    kind: kind.to_string(),
                    start_line: scope.start_row + 1,
                    end_line: scope.end_row + 1,
                    signature,
                    parent_name,
                    docstring: scope.docstring.clone(),
                });
            }
            parser::JsNodeKind::Field { name, is_arrow, .. } => {
                if *is_arrow {
                    let signature = if let Some((s_start, s_end)) = scope.signature_byte_range {
                        code_text[s_start..s_end].trim().to_string()
                    } else {
                        format!("{} = () =>", name)
                    };
                    symbols.push(ExtractedSymbol {
                        name: name.clone(),
                        kind: "method".to_string(),
                        start_line: scope.start_row + 1,
                        end_line: scope.end_row + 1,
                        signature,
                        parent_name,
                        docstring: scope.docstring.clone(),
                    });
                }
            }
            parser::JsNodeKind::Import => {
                for defined_sym in &scope.defined_symbols {
                    imports.push(ExtractedImport {
                        module: scope.tokens.get(0).cloned().unwrap_or_default(),
                        name: Some(defined_sym.clone()),
                        alias: None,
                        line_number: scope.start_row + 1,
                    });
                }
            }
            _ => {}
        }
    }

    Ok(FileIndexResult {
        symbols,
        imports,
        calls,
        total_lines: lines.len(),
        total_tokens,
        has_syntax_error: false,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_js_pruning_functions() {
        let code = r#"
import { helper } from './utils';

export function calculateTotal(items) {
    let sum = 0;
    for (const item of items) {
        sum += item.price;
    }
    return sum;
}

export function unusedReportGenerator() {
    console.log("Generating report...");
    return { status: "done" };
}
"#;
        let res = prune_js(code, "calculateTotal", 0.5);
        assert!(!res.has_syntax_error);
        assert!(res.pruned_code.contains("calculateTotal(items) {"));
        assert!(res.pruned_code.contains("sum += item.price;"));
        assert!(res.pruned_code.contains("unusedReportGenerator() {}"));
        assert!(res.savings_pct > 0.0);
    }

    #[test]
    fn test_jsx_pruning_component() {
        let code = r#"
import React, { useState } from 'react';

export const UserCard = ({ user }) => {
    const [expanded, setExpanded] = useState(false);
    return (
        <div className="user-card" onClick={() => setExpanded(!expanded)}>
            <h3>{user.name}</h3>
            {expanded && <p>{user.bio}</p>}
        </div>
    );
};

export const IgnoredWidget = () => {
    return <div>Ignore me</div>;
};
"#;
        let res = prune_js(code, "UserCard", 0.5);
        assert!(!res.has_syntax_error);
        assert!(res.pruned_code.contains("export const UserCard = ({ user }) => {"));
        assert!(res.pruned_code.contains("className=\"user-card\""));
        assert!(res.pruned_code.contains("export const IgnoredWidget = () => {};"));
        assert!(res.savings_pct > 0.0);
    }

    #[test]
    fn test_class_method_pruning() {
        let code = r#"
class PaymentProcessor extends BaseProcessor {
    constructor(config) {
        super();
        this.config = config;
    }

    processPayment(amount) {
        this.validate(amount);
        return this.charge(amount);
    }

    unusedCleanup() {
        this.resetBuffers();
    }
}
"#;
        let res = prune_js(code, "processPayment", 0.5);
        println!("CLASS PRUNED CODE:\n{}", res.pruned_code);
        assert!(!res.has_syntax_error);
        assert!(res.pruned_code.contains("class PaymentProcessor extends BaseProcessor {"));
        assert!(res.pruned_code.contains("processPayment(amount) {"));
        assert!(res.pruned_code.contains("this.validate(amount);"));
        assert!(res.pruned_code.contains("unusedCleanup() {}"));
    }
}
