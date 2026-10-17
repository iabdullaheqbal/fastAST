//! Java pruning and indexing engine
//!
//! Uses Tree-Sitter Java grammar to parse, score, and reconstruct
//! syntactically valid Java code.

pub mod parser;
pub mod repair;
pub mod scorer;

use crate::{
    count_tokens, ExtractedImport, ExtractedSymbol, FileIndexResult, PruneResult,
};
use pyo3::PyResult;

#[derive(Debug, Clone)]
pub struct JavaPruneResult {
    pub pruned_code: String,
    pub original_tokens: usize,
    pub pruned_tokens: usize,
    pub savings_pct: f64,
    pub total_lines: usize,
    pub kept_lines: usize,
    pub latency_ms: f64,
    pub has_syntax_error: bool,
}

pub fn prune_java(
    code_text: &str,
    focus_query: &str,
    threshold: f64,
) -> JavaPruneResult {
    let start = std::time::Instant::now();

    if code_text.trim().is_empty() {
        let elapsed = start.elapsed().as_secs_f64() * 1000.0;
        return JavaPruneResult {
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
            return JavaPruneResult {
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
        return JavaPruneResult {
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

    JavaPruneResult {
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
    let res = prune_java(code_text, focus_query, threshold);
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

    let mut symbols = Vec::new();
    let mut imports = Vec::new();
    let calls = Vec::new();

    for scope in scopes {
        match scope.kind {
            parser::JavaNodeKind::Class { name, is_abstract, .. } => {
                let kind = if is_abstract { "abstract_class" } else { "class" };
                let signature = if let Some((s_start, s_end)) = scope.signature_byte_range {
                    code_text[s_start..s_end].trim().to_string()
                } else {
                    format!("class {}", name)
                };
                symbols.push(ExtractedSymbol {
                    name,
                    kind: kind.to_string(),
                    start_line: scope.start_row + 1,
                    end_line: scope.end_row + 1,
                    signature,
                    parent_name: None,
                    docstring: None,
                });
            }
            parser::JavaNodeKind::Interface { name, .. } => {
                let signature = if let Some((s_start, s_end)) = scope.signature_byte_range {
                    code_text[s_start..s_end].trim().to_string()
                } else {
                    format!("interface {}", name)
                };
                symbols.push(ExtractedSymbol {
                    name,
                    kind: "interface".to_string(),
                    start_line: scope.start_row + 1,
                    end_line: scope.end_row + 1,
                    signature,
                    parent_name: None,
                    docstring: None,
                });
            }
            parser::JavaNodeKind::Enum { name } => {
                let signature = if let Some((s_start, s_end)) = scope.signature_byte_range {
                    code_text[s_start..s_end].trim().to_string()
                } else {
                    format!("enum {}", name)
                };
                symbols.push(ExtractedSymbol {
                    name,
                    kind: "enum".to_string(),
                    start_line: scope.start_row + 1,
                    end_line: scope.end_row + 1,
                    signature,
                    parent_name: None,
                    docstring: None,
                });
            }
            parser::JavaNodeKind::Record { name } => {
                let signature = if let Some((s_start, s_end)) = scope.signature_byte_range {
                    code_text[s_start..s_end].trim().to_string()
                } else {
                    format!("record {}", name)
                };
                symbols.push(ExtractedSymbol {
                    name,
                    kind: "record".to_string(),
                    start_line: scope.start_row + 1,
                    end_line: scope.end_row + 1,
                    signature,
                    parent_name: None,
                    docstring: None,
                });
            }
            parser::JavaNodeKind::Constructor { name } => {
                let signature = if let Some((s_start, s_end)) = scope.signature_byte_range {
                    code_text[s_start..s_end].trim().to_string()
                } else {
                    format!("{}()", name)
                };
                symbols.push(ExtractedSymbol {
                    name,
                    kind: "constructor".to_string(),
                    start_line: scope.start_row + 1,
                    end_line: scope.end_row + 1,
                    signature,
                    parent_name: None,
                    docstring: None,
                });
            }
            parser::JavaNodeKind::Method { name, is_static, .. } => {
                let kind = if is_static { "static_method" } else { "method" };
                let signature = if let Some((s_start, s_end)) = scope.signature_byte_range {
                    code_text[s_start..s_end].trim().to_string()
                } else {
                    format!("{}()", name)
                };
                symbols.push(ExtractedSymbol {
                    name,
                    kind: kind.to_string(),
                    start_line: scope.start_row + 1,
                    end_line: scope.end_row + 1,
                    signature,
                    parent_name: None,
                    docstring: None,
                });
            }
            parser::JavaNodeKind::Field { name, .. } => {
                let signature = code_text[scope.start_byte..scope.end_byte].trim().to_string();
                symbols.push(ExtractedSymbol {
                    name,
                    kind: "field".to_string(),
                    start_line: scope.start_row + 1,
                    end_line: scope.end_row + 1,
                    signature,
                    parent_name: None,
                    docstring: None,
                });
            }
            parser::JavaNodeKind::Import => {
                imports.push(ExtractedImport {
                    module: scope.tokens.get(0).cloned().unwrap_or_default(),
                    name: scope.defined_symbols.get(0).cloned(),
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
    fn test_java_calculator_pruning() {
        let code = r#"
package com.example;

import java.util.ArrayList;
import java.util.List;

public class Calculator {
    private int result;

    public Calculator() {
        this.result = 0;
    }

    public int add(int a, int b) {
        result = a + b;
        return result;
    }

    public int subtract(int a, int b) {
        result = a - b;
        return result;
    }

    public int getResult() {
        return result;
    }

    public static void main(String[] args) {
        Calculator calc = new Calculator();
        System.out.println(calc.add(5, 3));
    }
}
"#;

        let res = prune_java(code, "add", 0.5);
        assert!(!res.has_syntax_error);
        println!("PRUNED JAVA:\n{}", res.pruned_code);

        assert!(res.pruned_code.contains("package com.example;"));
        assert!(res.pruned_code.contains("import java.util.ArrayList;"));
        assert!(res.pruned_code.contains("public class Calculator {"));
        assert!(res.pruned_code.contains("public int add(int a, int b) {"));
        assert!(res.pruned_code.contains("result = a + b;"));
        assert!(res.pruned_code.contains("public int subtract(int a, int b) { return 0; }"));
        assert!(res.pruned_code.contains("public int getResult() { return 0; }"));
        assert!(res.savings_pct > 0.0);
    }

    #[test]
    fn test_java_interface_and_generics() {
        let code = r#"
package com.example.service;

import java.util.Optional;
import com.example.model.User;

public interface UserService<T extends User> {
    Optional<T> findById(String id);
    void save(T user);
}
"#;

        let res = prune_java(code, "findById", 0.5);
        assert!(!res.has_syntax_error);
        println!("PRUNED INTERFACE:\n{}", res.pruned_code);

        assert!(res.pruned_code.contains("public interface UserService<T extends User> {"));
        assert!(res.pruned_code.contains("Optional<T> findById(String id);"));
        assert!(res.pruned_code.contains("void save(T user);"));
    }

    #[test]
    fn test_java_zero_match_structural_skeleton() {
        let code = r#"
package com.example;

import java.util.Map;

public class ConfigManager {
    private Map<String, String> settings;

    public ConfigManager() {
        this.settings = Map.of();
    }

    public String getSetting(String key) {
        return this.settings.get(key);
    }
}
"#;

        let res = prune_java(code, "unrelatedQueryXYZ", 0.5);
        assert!(!res.has_syntax_error);
        println!("ZERO MATCH SKELETON:\n{}", res.pruned_code);

        assert!(res.pruned_code.contains("package com.example;"));
        assert!(res.pruned_code.contains("import java.util.Map;"));
        assert!(res.pruned_code.contains("public class ConfigManager {"));
        assert!(res.pruned_code.contains("private Map<String, String> settings;"));
        assert!(res.pruned_code.contains("public ConfigManager() {}"));
        assert!(res.pruned_code.contains("public String getSetting(String key) { return null; }"));
    }
}
