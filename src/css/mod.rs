//! CSS indexing engine
//!
//! Uses Tree-Sitter CSS grammar to parse and extract
//! rulesets, media queries, and at-rules from CSS stylesheets.

pub mod parser;

use crate::{
    count_tokens, ExtractedImport, ExtractedSymbol, FileIndexResult,
};
use pyo3::PyResult;

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
    fn test_css_indexing() {
        let code = r#"
@import url("base.css");

body {
    margin: 0;
}

header.main-header {
    background-color: #333;
}
"#;
        let res = index_code(code).unwrap();
        assert!(!res.has_syntax_error);
        let sym_names: Vec<&str> = res.symbols.iter().map(|s| s.name.as_str()).collect();
        assert!(sym_names.contains(&"body"));
        assert!(sym_names.contains(&"header.main-header"));
        assert!(!res.imports.is_empty());
    }
}
