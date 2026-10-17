pub mod indexer;
pub mod java;
pub mod javascript;
pub mod language;
pub mod multi_parser;
pub mod parser;
pub mod repair;
pub mod scorer;
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
            _ => {
                return Err(PyErr::new::<pyo3::exceptions::PyValueError, _>(
                    format!("Unsupported language: {}. Supported: python, java, javascript, jsx, typescript, tsx, html, css", lang_str)
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
            java::prune_file(code_text, focus_query, threshold)
        }
        Language::JavaScript => {
            // Dedicated JavaScript + JSX pruning engine
            javascript::prune_file(code_text, focus_query, threshold)
        }
        Language::TypeScript => {
            // Dedicated TypeScript + TSX pruning engine
            typescript::prune_file(code_text, focus_query, threshold)
        }
        _ => {
            // For other languages (JS, TS, HTML, CSS), use simplified multi-language parser
            let tree = match multi_parser::parse_multi_language(code_text, detected_lang) {
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

            let unified_scopes = multi_parser::collect_scopes_multi(&tree, source_bytes, &lines, detected_lang);
            let pruned_code = prune_unified_scopes(code_text, &unified_scopes, focus_query, threshold, detected_lang);
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
    }
}

fn prune_unified_scopes(
    original_code: &str,
    scopes: &[multi_parser::UnifiedScope],
    query: &str,
    threshold: f64,
    language: Language,
) -> String {
    if scopes.is_empty() {
        return original_code.to_string();
    }
    
    let query_tokens: Vec<String> = query
        .split_whitespace()
        .map(|s| s.to_lowercase())
        .collect();
    
    // Score each scope
    let mut kept_scopes = Vec::new();
    for scope in scopes {
        let score = calculate_match_score(&scope.tokens, &query_tokens);
        if score >= threshold {
            kept_scopes.push(scope);
        }
    }
    
    // If nothing matches, return skeleton
    if kept_scopes.is_empty() {
        return create_skeleton(scopes, language);
    }
    
    // Build pruned output from kept scopes
    let mut output = String::new();
    for scope in &kept_scopes {
        if !output.is_empty() {
            output.push('\n');
        }
        output.push_str(&scope.text);
    }
    
    output
}

fn calculate_match_score(tokens: &[String], query_tokens: &[String]) -> f64 {
    if tokens.is_empty() || query_tokens.is_empty() {
        return 0.0;
    }
    
    let mut matches = 0;
    for qt in query_tokens {
        if tokens.iter().any(|t| t.contains(qt) || qt.contains(t)) {
            matches += 1;
        }
    }
    
    matches as f64 / query_tokens.len() as f64
}

fn create_skeleton(scopes: &[multi_parser::UnifiedScope], language: Language) -> String {
    let mut output = String::new();
    
    for scope in scopes {
        use multi_parser::UnifiedNodeKind;
        match &scope.kind {
            UnifiedNodeKind::Import => {
                if !output.is_empty() {
                    output.push('\n');
                }
                output.push_str(&scope.text);
            }
            UnifiedNodeKind::Function { name, is_async } => {
                if !output.is_empty() {
                    output.push('\n');
                }
                let async_kw = if *is_async { "async " } else { "" };
                match language {
                    Language::Python => {
                        output.push_str(&format!("{}def {}():\n    pass", async_kw, name));
                    }
                    Language::Java => {
                        output.push_str(&format!("public void {}() {{}}", name));
                    }
                    Language::JavaScript | Language::TypeScript => {
                        output.push_str(&format!("{}function {}() {{}}", async_kw, name));
                    }
                    _ => {}
                }
            }
            UnifiedNodeKind::Class { name } => {
                if !output.is_empty() {
                    output.push('\n');
                }
                match language {
                    Language::Python => {
                        output.push_str(&format!("class {}:\n    pass", name));
                    }
                    Language::Java | Language::JavaScript | Language::TypeScript => {
                        output.push_str(&format!("class {} {{}}", name));
                    }
                    _ => {}
                }
            }
            _ => {}
        }
    }
    
    if output.is_empty() {
        output = language.empty_block_placeholder().to_string();
    }
    
    output
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
            _ => {
                return Err(PyErr::new::<pyo3::exceptions::PyValueError, _>(
                    format!("Unsupported language: {}", lang_str)
                ));
            }
        }
    } else {
        Language::Python  // Default to Python for backward compatibility
    };

    // For Python, use the full indexer
    if detected_lang == Language::Python {
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
        return Ok(res);
    }

    // For Java, use dedicated indexer
    if detected_lang == Language::Java {
        return java::index_code(code_text);
    }

    // For JavaScript + JSX, use dedicated indexer
    if detected_lang == Language::JavaScript {
        return javascript::index_code(code_text);
    }

    // For TypeScript + TSX, use dedicated indexer
    if detected_lang == Language::TypeScript {
        return typescript::index_code(code_text);
    }

    // For other languages, use simplified multi-language parser
    let total_tokens = count_tokens(code_text);
    let lines: Vec<&str> = code_text.lines().collect();
    
    let tree = match multi_parser::parse_multi_language(code_text, detected_lang) {
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
    let unified_scopes = multi_parser::collect_scopes_multi(&tree, source_bytes, &lines, detected_lang);
    
    // Convert unified scopes to symbols
    let mut symbols = Vec::new();
    for scope in unified_scopes {
        use multi_parser::UnifiedNodeKind;
        match scope.kind {
            UnifiedNodeKind::Function { name, is_async } => {
                let kind = if is_async { "async_function" } else { "function" };
                symbols.push(ExtractedSymbol {
                    name,
                    kind: kind.to_string(),
                    start_line: scope.start_row,
                    end_line: scope.end_row,
                    signature: scope.text.lines().next().unwrap_or("").to_string(),
                    docstring: None,
                    parent_name: None,
                });
            }
            UnifiedNodeKind::Class { name } => {
                symbols.push(ExtractedSymbol {
                    name,
                    kind: "class".to_string(),
                    start_line: scope.start_row,
                    end_line: scope.end_row,
                    signature: scope.text.lines().next().unwrap_or("").to_string(),
                    docstring: None,
                    parent_name: None,
                });
            }
            UnifiedNodeKind::Method { name, is_async } => {
                let kind = if is_async { "async_method" } else { "method" };
                symbols.push(ExtractedSymbol {
                    name,
                    kind: kind.to_string(),
                    start_line: scope.start_row,
                    end_line: scope.end_row,
                    signature: scope.text.lines().next().unwrap_or("").to_string(),
                    docstring: None,
                    parent_name: None,
                });
            }
            UnifiedNodeKind::Interface { name } => {
                symbols.push(ExtractedSymbol {
                    name,
                    kind: "interface".to_string(),
                    start_line: scope.start_row,
                    end_line: scope.end_row,
                    signature: scope.text.lines().next().unwrap_or("").to_string(),
                    docstring: None,
                    parent_name: None,
                });
            }
            _ => {}
        }
    }
    
    Ok(FileIndexResult {
        symbols,
        imports: Vec::new(),
        calls: Vec::new(),
        total_lines: lines.len(),
        total_tokens,
        has_syntax_error: false,
    })
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
