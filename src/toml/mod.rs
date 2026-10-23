//! TOML Language Engine for FastAST
//!
//! Provides AST parsing and symbol/import indexing for TOML configuration documents.

pub mod parser;

use pyo3::prelude::*;
use crate::indexer::{ExtractedImport, ExtractedSymbol, FileIndexResult};
use crate::count_tokens;

pub fn index_code(code_text: &str) -> PyResult<FileIndexResult> {
    let total_tokens = count_tokens(code_text);
    let lines: Vec<&str> = code_text.lines().collect();

    let Ok(root_table) = parser::parse_toml(code_text) else {
        return Ok(FileIndexResult {
            symbols: Vec::new(),
            imports: Vec::new(),
            calls: Vec::new(),
            total_lines: lines.len(),
            total_tokens,
            has_syntax_error: true,
        });
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

[[bin]]
name = "fastast-cli"
path = "src/bin/cli.rs"
"#;

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
