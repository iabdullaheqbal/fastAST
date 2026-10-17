pub mod css;
pub mod html;
pub mod indexer;
pub mod java;
pub mod javascript;
pub mod json;
pub mod language;
pub mod multi_parser;
pub mod parser;
pub mod repair;
pub mod rust;
pub mod scorer;
pub mod toml;
pub mod typescript;

pub use indexer::{ExtractedCall, ExtractedImport, ExtractedSymbol, FileIndexResult};
pub use language::Language;

use pyo3::prelude::*;
use std::sync::OnceLock;
use tiktoken_rs::{cl100k_base, CoreBPE};

static BPE: OnceLock<CoreBPE> = OnceLock::new();

#[pyclass]
#[derive(Clone, Debug)]
pub struct PruneResult {
    #[pyo3(get)]
    pub pruned_code: String,
    #[pyo3(get)]
    pub original_tokens: usize,
    #[pyo3(get)]
    pub pruned_tokens: usize,
    #[pyo3(get)]
    pub savings_pct: f64,
    #[pyo3(get)]
    pub total_lines: usize,
    #[pyo3(get)]
    pub kept_lines: usize,
    #[pyo3(get)]
    pub latency_ms: f64,
    #[pyo3(get)]
    pub has_syntax_error: bool,
}

pub fn count_tokens(text: &str) -> usize {
    if text.is_empty() {
        return 0;
    }
    if let Some(bpe) = BPE.get_or_init(|| cl100k_base().unwrap_or_else(|_| panic!("Failed to load BPE")))
        .into()
    {
        let bpe_ref: &CoreBPE = bpe;
        bpe_ref.encode_ordinary(text).len()
    } else {
        text.split_whitespace().count()
    }
}

#[pyfunction]
#[pyo3(signature = (code_text, focus_query, threshold=0.5, language=None))]
pub fn prune_file(
    code_text: &str,
    focus_query: &str,
    threshold: f64,
    language: Option<String>,
) -> PyResult<PruneResult> {
    let start = std::time::Instant::now();

    if code_text.trim().is_empty() {
        let elapsed = start.elapsed().as_secs_f64() * 1000.0;
        return Ok(PruneResult {
            pruned_code: String::new(),
            original_tokens: 0,
            pruned_tokens: 0,
            savings_pct: 0.0,
            total_lines: 0,
            kept_lines: 0,
            latency_ms: elapsed,
            has_syntax_error: false,
        });
    }

    let total_lines = code_text.lines().count();
    let original_tokens = count_tokens(code_text);

    let prune_start = std::time::Instant::now();

    // Determine language - default to Python
    let detected_lang = if let Some(lang_str) = language {
        match lang_str.to_lowercase().as_str() {
            "python" | "py" => Language::Python,
            "java" => Language::Java,
            "javascript" | "js" | "jsx" | "mjs" | "cjs" => Language::JavaScript,
            "typescript" | "ts" | "tsx" | "mts" | "cts" => Language::TypeScript,
            "html" | "htm" => Language::HTML,
            "css" => Language::CSS,
            "rust" | "rs" => Language::Rust,
            "json" => Language::JSON,
            "toml" => Language::TOML,
            _ => {
                return Err(PyErr::new::<pyo3::exceptions::PyValueError, _>(
                    format!("Unsupported language: {}. Supported: python, java, javascript, jsx, typescript, tsx, html, css, rust, json, toml", lang_str)
                ));
            }
        }
    } else {
        Language::Python  // Default to Python for backward compatibility
    };

    // Dispatch by language
    match detected_lang {
        Language::Python => {
            // Original Python pruning engine - fully tested and working
            let tree = match parser::parse_ast(code_text) {
                Ok(t) => t,
                Err(_) => {
                    let elapsed = prune_start.elapsed().as_secs_f64() * 1000.0;
                    return Ok(PruneResult {
                        pruned_code: code_text.to_string(),
                        original_tokens,
                        pruned_tokens: original_tokens,
                        savings_pct: 0.0,
                        total_lines,
                        kept_lines: total_lines,
                        latency_ms: elapsed,
                        has_syntax_error: true,
                    });
                }
            };

            if tree.root_node().has_error() {
                let elapsed = prune_start.elapsed().as_secs_f64() * 1000.0;
                return Ok(PruneResult {
                    pruned_code: code_text.to_string(),
                    original_tokens,
                    pruned_tokens: original_tokens,
                    savings_pct: 0.0,
                    total_lines,
                    kept_lines: total_lines,
                    latency_ms: elapsed,
                    has_syntax_error: true,
                });
            }

            let source_bytes = code_text.as_bytes();
            let lines: Vec<&str> = code_text.lines().collect();

            let scopes = parser::collect_scopes(&tree, source_bytes, &lines);
            let score_res = scorer::evaluate_scopes(&scopes, focus_query, threshold);
            let pruned_code = repair::reconstruct_code(&lines, &scopes, &score_res.decisions);
            let prune_elapsed = prune_start.elapsed().as_secs_f64() * 1000.0;

            let pruned_tokens = count_tokens(&pruned_code);
            let kept_lines = pruned_code.lines().count();
            let savings_pct = if original_tokens > 0 {
                ((original_tokens.saturating_sub(pruned_tokens)) as f64 / original_tokens as f64) * 100.0
            } else {
                0.0
            };

            Ok(PruneResult {
                pruned_code,
                original_tokens,
                pruned_tokens,
                savings_pct,
                total_lines,
                kept_lines,
                latency_ms: prune_elapsed,
                has_syntax_error: false,
            })
        }
        Language::Java => {
            // Java language engine
            Ok(java::prune_file(code_text, focus_query, threshold))
        }
        Language::JavaScript => {
            // Dedicated JavaScript + JSX pruning engine
            Ok(javascript::prune_file(code_text, focus_query, threshold))
        }
        Language::TypeScript => {
            // Dedicated TypeScript + TSX pruning engine
            typescript::prune_file(code_text, focus_query, threshold)
        }
        Language::HTML => {
            // Dedicated HTML pruning engine
            html::prune_file(code_text, focus_query, threshold)
        }
        Language::CSS => {
            // Dedicated CSS pruning engine
            css::prune_file(code_text, focus_query, threshold)
        }
        Language::Rust => {
            // Dedicated Rust pruning engine
            rust::prune_file(code_text, focus_query, threshold)
        }
        Language::JSON => {
            // Dedicated JSON pruning engine
            json::prune_file(code_text, focus_query, threshold)
        }
        Language::TOML => {
            // Dedicated TOML pruning engine
            toml::prune_file(code_text, focus_query, threshold)
        }
    }
}

#[pyfunction]
#[pyo3(signature = (code_text, language=None))]
pub fn index_code(code_text: &str, language: Option<String>) -> PyResult<FileIndexResult> {
    // Detect or validate language
    let detected_lang = if let Some(lang_str) = language {
        match lang_str.to_lowercase().as_str() {
            "python" | "py" => Language::Python,
            "java" => Language::Java,
            "javascript" | "js" | "jsx" | "mjs" | "cjs" => Language::JavaScript,
            "typescript" | "ts" | "tsx" | "mts" | "cts" => Language::TypeScript,
            "html" | "htm" => Language::HTML,
            "css" => Language::CSS,
            "rust" | "rs" => Language::Rust,
            "json" => Language::JSON,
            "toml" => Language::TOML,
            _ => {
                return Err(PyErr::new::<pyo3::exceptions::PyValueError, _>(
                    format!("Unsupported language: {}", lang_str)
                ));
            }
        }
    } else {
        Language::Python  // Default to Python for backward compatibility
    };

    match detected_lang {
        Language::Python => {
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

            let source_bytes = code_text.as_bytes();
            let res = indexer::extract_file_index(&tree, source_bytes, &lines, total_tokens);
            Ok(res)
        }
        Language::Java => Ok(java::index_code(code_text)),
        Language::JavaScript => Ok(javascript::index_code(code_text)),
        Language::TypeScript => typescript::index_code(code_text),
        Language::HTML => html::index_code(code_text),
        Language::CSS => css::index_code(code_text),
        Language::Rust => rust::index_code(code_text),
        Language::JSON => json::index_code(code_text),
        Language::TOML => toml::index_code(code_text),
    }
}

#[pymodule]
fn _core(m: &Bound<'_, PyModule>) -> PyResult<()> {
    m.add_class::<PruneResult>()?;
    m.add_class::<ExtractedSymbol>()?;
    m.add_class::<ExtractedImport>()?;
    m.add_class::<ExtractedCall>()?;
    m.add_class::<FileIndexResult>()?;
    m.add_function(wrap_pyfunction!(prune_file, m)?)?;
    m.add_function(wrap_pyfunction!(index_code, m)?)?;
    Ok(())
}
