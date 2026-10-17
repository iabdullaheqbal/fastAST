//! JSON Language Engine for FastAST
//!
//! Provides AST parsing, dual-rubric semantic/structural pruning,
//! and symbol indexing for JSON documents.

pub mod parser;
pub mod repair;
pub mod scorer;

use pyo3::prelude::*;
use crate::indexer::{ExtractedImport, ExtractedSymbol, FileIndexResult};
use crate::count_tokens;
use crate::PruneResult;

pub struct JsonPruneResult {
    pub pruned_code: String,
    pub original_tokens: usize,
    pub pruned_tokens: usize,
    pub savings_pct: f64,
    pub total_lines: usize,
    pub kept_lines: usize,
    pub latency_ms: f64,
    pub has_syntax_error: bool,
}

pub fn prune_json(code_text: &str, focus_query: &str, threshold: f64) -> JsonPruneResult {
    let prune_start = std::time::Instant::now();
    let total_lines = code_text.lines().count();
    let original_tokens = count_tokens(code_text);

    if code_text.trim().is_empty() {
        let elapsed = prune_start.elapsed().as_secs_f64() * 1000.0;
        return JsonPruneResult {
            pruned_code: "{}".to_string(),
            original_tokens: 0,
            pruned_tokens: 0,
            savings_pct: 0.0,
            total_lines: 0,
            kept_lines: 1,
            latency_ms: elapsed,
            has_syntax_error: false,
        };
    }

    if focus_query.trim().is_empty() {
        let elapsed = prune_start.elapsed().as_secs_f64() * 1000.0;
        return JsonPruneResult {
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

    let root_val = match parser::parse_json(code_text) {
        Ok(v) => v,
        Err(_) => {
            let elapsed = prune_start.elapsed().as_secs_f64() * 1000.0;
            return JsonPruneResult {
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

    let scopes = parser::collect_scopes(&root_val);
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

    JsonPruneResult {
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
    let res = prune_json(code_text, focus_query, threshold);
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

    let root_val = match parser::parse_json(code_text) {
        Ok(v) => v,
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

    let scopes = parser::collect_scopes(&root_val);
    let mut symbols = Vec::new();
    let mut imports = Vec::new();
    let calls = Vec::new();

    let mut last_found_line = 0;

    for item in &scopes {
        if let Some(ref key) = item.key {
            let quoted = format!("\"{}\"", key);
            let mut line_no = last_found_line + 1;
            for (idx, line) in lines.iter().enumerate().skip(last_found_line) {
                if line.contains(&quoted) {
                    line_no = idx + 1;
                    last_found_line = idx;
                    break;
                }
            }

            let parent_name = item.parent_id.and_then(|pid| scopes[pid].key.clone());

            let (kind, signature) = match &item.kind {
                parser::JsonNodeKind::Object { .. } => (
                    "json_object".to_string(),
                    format!("\"{}\": {{...}}", key),
                ),
                parser::JsonNodeKind::Array { .. } => (
                    "json_array".to_string(),
                    format!("\"{}\": [...]", key),
                ),
                parser::JsonNodeKind::Pair { .. } => {
                    let mut val_preview = item.value.to_string();
                    if val_preview.len() > 40 {
                        val_preview.truncate(37);
                        val_preview.push_str("...");
                    }
                    (
                        "json_key".to_string(),
                        format!("\"{}\": {}", key, val_preview),
                    )
                }
                _ => continue,
            };

            symbols.push(ExtractedSymbol {
                name: key.clone(),
                kind,
                signature,
                start_line: line_no,
                end_line: line_no,
                parent_name: parent_name.clone(),
                docstring: None,
            });

            // If under dependencies / devDependencies, extract as import
            if let Some(ref p) = parent_name {
                if p == "dependencies" || p == "devDependencies" {
                    imports.push(ExtractedImport {
                        module: key.clone(),
                        name: Some(item.value.as_str().unwrap_or("").to_string()),
                        alias: None,
                        line_number: line_no,
                    });
                }
            }
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

    const SAMPLE_JSON: &str = r#"{
  "name": "fastast-app",
  "version": "1.0.0",
  "scripts": {
    "build": "tsc --build",
    "test": "jest --coverage",
    "lint": "eslint"
  },
  "dependencies": {
    "express": "^4.19.2",
    "zod": "^3.23.8"
  },
  "keywords": [
    "ast",
    "pruning",
    "tree-sitter"
  ]
}"#;

    #[test]
    fn test_json_prune_scripts_test() {
        let res = prune_json(SAMPLE_JSON, "scripts test", 0.3);
        assert!(!res.has_syntax_error);
        println!("PRUNED JSON (scripts test):\n{}", res.pruned_code);

        // Verify valid JSON
        let parsed: serde_json::Value = serde_json::from_str(&res.pruned_code).expect("Must be valid JSON");
        assert!(parsed.get("scripts").is_some());
        assert_eq!(
            parsed["scripts"]["test"].as_str(),
            Some("jest --coverage")
        );
        // build and lint not kept
        assert!(parsed["scripts"].get("build").is_none());
        assert!(parsed["scripts"].get("lint").is_none());
        // dependencies not kept
        assert!(parsed.get("dependencies").is_none());
        assert!(res.savings_pct > 0.0);
    }

    #[test]
    fn test_json_prune_dependencies_entire_object() {
        let res = prune_json(SAMPLE_JSON, "dependencies", 0.3);
        assert!(!res.has_syntax_error);
        println!("PRUNED JSON (dependencies):\n{}", res.pruned_code);

        let parsed: serde_json::Value = serde_json::from_str(&res.pruned_code).expect("Must be valid JSON");
        assert!(parsed.get("dependencies").is_some());
        assert_eq!(parsed["dependencies"]["express"].as_str(), Some("^4.19.2"));
        assert_eq!(parsed["dependencies"]["zod"].as_str(), Some("^3.23.8"));
        assert!(parsed.get("scripts").is_none());
    }

    #[test]
    fn test_json_zero_match_structural_skeleton() {
        let res = prune_json(SAMPLE_JSON, "unrelatedQueryXYZ", 0.5);
        assert!(!res.has_syntax_error);
        println!("ZERO MATCH SKELETON:\n{}", res.pruned_code);

        let parsed: serde_json::Value = serde_json::from_str(&res.pruned_code).expect("Must be valid JSON");
        assert_eq!(parsed["name"].as_str(), Some("fastast-app"));
        assert_eq!(parsed["version"].as_str(), Some("1.0.0"));
        // scripts and dependencies are kept as empty skeletons
        assert!(parsed["scripts"].is_object());
        assert!(parsed["scripts"].as_object().unwrap().is_empty());
        assert!(parsed["dependencies"].is_object());
        assert!(parsed["dependencies"].as_object().unwrap().is_empty());
        assert!(parsed["keywords"].is_array());
        assert!(parsed["keywords"].as_array().unwrap().is_empty());
    }

    #[test]
    fn test_json_index_code() {
        let idx = index_code(SAMPLE_JSON).expect("indexing should succeed");
        assert!(!idx.has_syntax_error);
        assert!(idx.symbols.iter().any(|s| s.name == "scripts"));
        assert!(idx.symbols.iter().any(|s| s.name == "dependencies"));
        assert!(idx.symbols.iter().any(|s| s.name == "build"));
        assert!(idx.imports.iter().any(|i| i.module == "express"));
    }
}
