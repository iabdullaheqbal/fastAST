//! JSON Language Engine for FastAST
//!
//! Provides AST parsing and symbol/import indexing for JSON documents.

pub mod parser;

use pyo3::prelude::*;
use crate::indexer::{ExtractedImport, ExtractedSymbol, FileIndexResult};
use crate::count_tokens;

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
    "test": "jest --coverage"
  },
  "dependencies": {
    "express": "^4.19.2",
    "zod": "^3.23.8"
  }
}"#;

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
