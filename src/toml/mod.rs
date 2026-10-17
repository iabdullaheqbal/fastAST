//! TOML Language Engine for FastAST
//!
//! Provides AST parsing, dual-rubric semantic/structural pruning,
//! and symbol indexing for TOML configuration documents.

pub mod parser;
pub mod repair;
pub mod scorer;

use pyo3::prelude::*;
use crate::indexer::{ExtractedImport, ExtractedSymbol, FileIndexResult};
use crate::count_tokens;
use crate::PruneResult;

pub struct TomlPruneResult {
    pub pruned_code: String,
    pub original_tokens: usize,
    pub pruned_tokens: usize,
    pub savings_pct: f64,
    pub total_lines: usize,
    pub kept_lines: usize,
    pub latency_ms: f64,
    pub has_syntax_error: bool,
}

pub fn prune_toml(code_text: &str, focus_query: &str, threshold: f64) -> TomlPruneResult {
    let prune_start = std::time::Instant::now();
    let total_lines = code_text.lines().count();
    let original_tokens = count_tokens(code_text);

    if code_text.trim().is_empty() {
        let elapsed = prune_start.elapsed().as_secs_f64() * 1000.0;
        return TomlPruneResult {
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

    if focus_query.trim().is_empty() {
        let elapsed = prune_start.elapsed().as_secs_f64() * 1000.0;
        return TomlPruneResult {
            pruned_code: code_text.to_string(),
            original_tokens,
            pruned_tokens: original_tokens,
            savings_pct: 0.0,
            total_lines,
            kept_lines: total_lines,
            latency_ms: elapsed,
            has_syntax_error: false,
        };
    }

    let root_table = match parser::parse_toml(code_text) {
        Ok(t) => t,
        Err(_) => {
            let elapsed = prune_start.elapsed().as_secs_f64() * 1000.0;
            return TomlPruneResult {
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

    let scopes = parser::collect_scopes(&root_table);
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

    TomlPruneResult {
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
    let res = prune_toml(code_text, focus_query, threshold);
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

    let root_table = match parser::parse_toml(code_text) {
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

    let scopes = parser::collect_scopes(&root_table);
    let mut symbols = Vec::new();
    let mut imports = Vec::new();
    let calls = Vec::new();

    let mut last_found_line = 0;

    for item in &scopes {
        let parent_name = item.parent_id.and_then(|pid| scopes[pid].key.clone());

        match &item.kind {
            parser::TomlNodeKind::Table { header } => {
                let target = format!("[{}]", header);
                let mut line_no = last_found_line + 1;
                for (idx, line) in lines.iter().enumerate().skip(last_found_line) {
                    if line.trim().starts_with(&target) {
                        line_no = idx + 1;
                        last_found_line = idx;
                        break;
                    }
                }

                symbols.push(ExtractedSymbol {
                    name: header.clone(),
                    kind: "toml_table".to_string(),
                    signature: format!("[{}]", header),
                    start_line: line_no,
                    end_line: line_no,
                    parent_name: parent_name.clone(),
                    docstring: None,
                });

                if let Some(ref p) = parent_name {
                    if p.contains("dependencies") {
                        imports.push(ExtractedImport {
                            module: header.clone(),
                            name: None,
                            alias: None,
                            line_number: line_no,
                        });
                    }
                }
            }
            parser::TomlNodeKind::ArrayOfTables { header } => {
                let target = format!("[[{}]]", header);
                let mut line_no = last_found_line + 1;
                for (idx, line) in lines.iter().enumerate().skip(last_found_line) {
                    if line.trim().starts_with(&target) {
                        line_no = idx + 1;
                        last_found_line = idx;
                        break;
                    }
                }

                symbols.push(ExtractedSymbol {
                    name: header.clone(),
                    kind: "toml_array_of_tables".to_string(),
                    signature: format!("[[{}]]", header),
                    start_line: line_no,
                    end_line: line_no,
                    parent_name: parent_name.clone(),
                    docstring: None,
                });
            }
            parser::TomlNodeKind::Pair { key } => {
                let mut line_no = last_found_line + 1;
                for (idx, line) in lines.iter().enumerate().skip(last_found_line) {
                    let trimmed = line.trim();
                    if trimmed.starts_with(key) && (trimmed[key.len()..].trim_start().starts_with('=')) {
                        line_no = idx + 1;
                        last_found_line = idx;
                        break;
                    }
                }

                let mut val_preview = item.value.to_string();
                if val_preview.len() > 40 {
                    val_preview.truncate(37);
                    val_preview.push_str("...");
                }

                symbols.push(ExtractedSymbol {
                    name: key.clone(),
                    kind: "toml_key".to_string(),
                    signature: format!("{} = {}", key, val_preview),
                    start_line: line_no,
                    end_line: line_no,
                    parent_name: parent_name.clone(),
                    docstring: None,
                });

                if let Some(ref p) = parent_name {
                    if p.contains("dependencies") {
                        imports.push(ExtractedImport {
                            module: key.clone(),
                            name: None,
                            alias: None,
                            line_number: line_no,
                        });
                    }
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

    const SAMPLE_TOML: &str = r#"
[package]
name = "fastast"
version = "0.1.0"
edition = "2021"

[dependencies]
pyo3 = { version = "0.21" }
serde_json = "1.0"
toml = "1.1"

[dev-dependencies]
tempfile = "3.8"

[[bin]]
name = "fastast-cli"
path = "src/bin/cli.rs"

[[bin]]
name = "fastast-bench"
path = "src/bin/bench.rs"

[profile.release]
opt-level = 3
lto = "thin"
"#;

    #[test]
    fn test_toml_prune_dependencies_pyo3() {
        let res = prune_toml(SAMPLE_TOML, "dependencies pyo3", 0.3);
        assert!(!res.has_syntax_error);
        println!("PRUNED TOML (dependencies pyo3):\n{}", res.pruned_code);

        // Verify valid TOML
        let parsed: toml::Table = res.pruned_code.parse().expect("Must be valid TOML");
        assert!(parsed.get("dependencies").is_some());
        let deps = parsed["dependencies"].as_table().unwrap();
        assert!(deps.contains_key("pyo3"));
        assert!(!deps.contains_key("serde_json"));
        assert!(!deps.contains_key("toml"));
        assert!(parsed.get("profile").is_none());
        assert!(res.savings_pct > 0.0);
    }

    #[test]
    fn test_toml_prune_bin_array_of_tables() {
        let res = prune_toml(SAMPLE_TOML, "bin fastast-cli", 0.3);
        assert!(!res.has_syntax_error);
        println!("PRUNED TOML (bin cli):\n{}", res.pruned_code);

        let parsed: toml::Table = res.pruned_code.parse().expect("Must be valid TOML");
        assert!(parsed.get("bin").is_some());
        let bins = parsed["bin"].as_array().unwrap();
        assert_eq!(bins.len(), 1);
        assert_eq!(bins[0]["name"].as_str(), Some("fastast-cli"));
    }

    #[test]
    fn test_toml_zero_match_structural_skeleton() {
        let res = prune_toml(SAMPLE_TOML, "nonexistentXYZ", 0.5);
        assert!(!res.has_syntax_error);
        println!("ZERO MATCH TOML SKELETON:\n{}", res.pruned_code);

        let parsed: toml::Table = res.pruned_code.parse().expect("Must be valid TOML");
        assert!(parsed.contains_key("package"));
        assert!(parsed.contains_key("dependencies"));
        assert!(parsed.contains_key("dev-dependencies"));
        assert!(parsed.contains_key("bin"));
        assert!(parsed.contains_key("profile"));
    }

    #[test]
    fn test_toml_index_code() {
        let idx = index_code(SAMPLE_TOML).expect("indexing should succeed");
        assert!(!idx.has_syntax_error);
        assert!(idx.symbols.iter().any(|s| s.name == "package"));
        assert!(idx.symbols.iter().any(|s| s.name == "dependencies"));
        assert!(idx.symbols.iter().any(|s| s.name == "bin"));
        assert!(idx.symbols.iter().any(|s| s.name == "pyo3"));
        assert!(idx.imports.iter().any(|i| i.module == "pyo3"));
        assert!(idx.imports.iter().any(|i| i.module == "serde_json"));
    }
}
