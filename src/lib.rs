pub mod indexer;
pub mod parser;
pub mod repair;
pub mod scorer;

pub use indexer::{ExtractedCall, ExtractedImport, ExtractedSymbol, FileIndexResult};

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
#[pyo3(signature = (code_text, focus_query, threshold=0.5))]
pub fn prune_file(code_text: &str, focus_query: &str, threshold: f64) -> PyResult<PruneResult> {
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

    // Parse the code using tree-sitter
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

    // If source already has syntax errors, gracefully flag it
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

#[pyfunction]
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

    let source_bytes = code_text.as_bytes();
    let res = indexer::extract_file_index(&tree, source_bytes, &lines, total_tokens);
    Ok(res)
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

