pub mod css;
pub mod discovery;
pub mod html;
pub mod indexer;
pub mod java;
pub mod javascript;
pub mod json;
pub mod language;
pub mod model;
pub mod parser;
pub mod rust;
pub mod toml;
pub mod typescript;

pub use discovery::{classify_path, compute_xxh3, is_binary_content};
pub use indexer::{ExtractedCall, ExtractedImport, ExtractedSymbol, FileIndexResult};
pub use language::Language;
pub use model::{Candidate, EdgeRecord, EvidenceWindow, ExtractedFileFacts, FileRecord, SymbolRecord};

use pyo3::prelude::*;
use std::sync::OnceLock;
use tiktoken_rs::{cl100k_base, CoreBPE};

static BPE: OnceLock<CoreBPE> = OnceLock::new();

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
#[pyo3(signature = (code_text, language=None))]
pub fn index_code(code_text: &str, language: Option<String>) -> PyResult<FileIndexResult> {
    // Detect or validate language
    let detected_lang = if let Some(lang_str) = language {
        if let Some(l) = Language::from_name_or_extension(&lang_str) {
            l
        } else {
            return Err(PyErr::new::<pyo3::exceptions::PyValueError, _>(
                format!("Unsupported language: {}. Supported: python, java, javascript, jsx, typescript, tsx, html, css, rust, json, toml", lang_str)
            ));
        }
    } else {
        Language::Python  // Default to Python for backward compatibility
    };

    match detected_lang {
        Language::Python => {
            let total_tokens = count_tokens(code_text);
            let lines: Vec<&str> = code_text.lines().collect();

            let Ok(tree) = parser::parse_ast(code_text) else {
                return Ok(FileIndexResult {
                    symbols: Vec::new(),
                    imports: Vec::new(),
                    calls: Vec::new(),
                    total_lines: lines.len(),
                    total_tokens,
                    has_syntax_error: true,
                });
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
    m.add_class::<ExtractedSymbol>()?;
    m.add_class::<ExtractedImport>()?;
    m.add_class::<ExtractedCall>()?;
    m.add_class::<FileIndexResult>()?;
    m.add_class::<FileRecord>()?;
    m.add_class::<SymbolRecord>()?;
    m.add_class::<EdgeRecord>()?;
    m.add_class::<EvidenceWindow>()?;
    m.add_class::<Candidate>()?;
    m.add_class::<ExtractedFileFacts>()?;
    m.add_function(wrap_pyfunction!(index_code, m)?)?;
    m.add_function(wrap_pyfunction!(compute_xxh3, m)?)?;
    m.add_function(wrap_pyfunction!(is_binary_content, m)?)?;
    m.add_function(wrap_pyfunction!(classify_path, m)?)?;
    Ok(())
}
