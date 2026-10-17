//! CSS pruning and indexing engine
//!
//! Uses Tree-Sitter CSS grammar to parse, score, and reconstruct
//! valid CSS stylesheets while supporting media queries and selectors.

pub mod parser;
pub mod repair;
pub mod scorer;

use crate::{
    count_tokens, ExtractedImport, ExtractedSymbol, FileIndexResult, PruneResult,
};
use pyo3::PyResult;

#[derive(Debug, Clone)]
pub struct CssPruneResult {
    pub pruned_code: String,
    pub original_tokens: usize,
    pub pruned_tokens: usize,
    pub savings_pct: f64,
    pub total_lines: usize,
    pub kept_lines: usize,
    pub latency_ms: f64,
    pub has_syntax_error: bool,
}

pub fn prune_css(
    code_text: &str,
    focus_query: &str,
    threshold: f64,
) -> CssPruneResult {
    let start = std::time::Instant::now();

    if code_text.trim().is_empty() {
        let elapsed = start.elapsed().as_secs_f64() * 1000.0;
        return CssPruneResult {
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
            return CssPruneResult {
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
        return CssPruneResult {
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
    let scopes = parser::collect_scopes(&tree, source_bytes);
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

    CssPruneResult {
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
    let res = prune_css(code_text, focus_query, threshold);
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
    let scopes = parser::collect_scopes(&tree, source_bytes);

    let mut symbols = Vec::new();
    let mut imports = Vec::new();
    let calls = Vec::new();

    for scope in scopes {
        match scope.kind {
            parser::CssNodeKind::RuleSet { selectors } => {
                symbols.push(ExtractedSymbol {
                    name: selectors.clone(),
                    kind: "css_rule".to_string(),
                    start_line: scope.start_row + 1,
                    end_line: scope.end_row + 1,
                    signature: format!("{} {{ ... }}", selectors),
                    parent_name: None,
                    docstring: None,
                });
            }
            parser::CssNodeKind::Media { query } => {
                symbols.push(ExtractedSymbol {
                    name: query.clone(),
                    kind: "media_query".to_string(),
                    start_line: scope.start_row + 1,
                    end_line: scope.end_row + 1,
                    signature: query,
                    parent_name: None,
                    docstring: None,
                });
            }
            parser::CssNodeKind::Keyframes { name } => {
                symbols.push(ExtractedSymbol {
                    name: name.clone(),
                    kind: "keyframes".to_string(),
                    start_line: scope.start_row + 1,
                    end_line: scope.end_row + 1,
                    signature: format!("@keyframes {}", name),
                    parent_name: None,
                    docstring: None,
                });
            }
            parser::CssNodeKind::Import => {
                imports.push(ExtractedImport {
                    module: "css_import".to_string(),
                    name: scope.tokens.get(1).cloned(),
                    alias: None,
                    line_number: scope.start_row + 1,
                });
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
    fn test_css_pruning_selectors() {
        let code = r#"
@import url("base.css");

body {
    margin: 0;
    font-family: sans-serif;
}

header.main-header {
    background-color: #333;
    color: white;
}

.footer-bar {
    text-align: center;
}
"#;

        let res = prune_css(code, "main-header", 0.5);
        assert!(!res.has_syntax_error);
        println!("PRUNED CSS:\n{}", res.pruned_code);

        assert!(res.pruned_code.contains("@import url(\"base.css\");"));
        assert!(res.pruned_code.contains("header.main-header {"));
        assert!(res.pruned_code.contains("background-color: #333;"));
        assert!(!res.pruned_code.contains("font-family: sans-serif;"));
        assert!(res.savings_pct > 0.0);
    }

    #[test]
    fn test_css_media_query_nested_closure() {
        let code = r#"
.card {
    padding: 20px;
}

@media (max-width: 768px) {
    .card {
        padding: 10px;
    }
    .hide-mobile {
        display: none;
    }
}
"#;

        let res = prune_css(code, "hide-mobile", 0.5);
        assert!(!res.has_syntax_error);
        println!("PRUNED CSS MEDIA:\n{}", res.pruned_code);

        assert!(res.pruned_code.contains("@media (max-width: 768px) {"));
        assert!(res.pruned_code.contains(".hide-mobile {"));
        assert!(res.pruned_code.contains("display: none;"));
        assert!(res.savings_pct > 0.0);
    }

    #[test]
    fn test_css_zero_match_structural_skeleton() {
        let code = r#"
@import url("theme.css");

body {
    color: black;
}

#sidebar {
    width: 250px;
}
"#;

        let res = prune_css(code, "unrelatedXYZ999", 0.5);
        assert!(!res.has_syntax_error);
        println!("ZERO MATCH CSS SKELETON:\n{}", res.pruned_code);

        assert!(res.pruned_code.contains("@import url(\"theme.css\");"));
        assert!(res.pruned_code.contains("body {}"));
        assert!(res.pruned_code.contains("#sidebar {}"));
        assert!(!res.pruned_code.contains("width: 250px;"));
    }
}
