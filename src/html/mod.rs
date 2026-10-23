//! HTML indexing engine
//!
//! Uses Tree-Sitter HTML grammar to parse and extract
//! semantic elements and resource links from HTML documents.

pub mod parser;

use crate::{
    count_tokens, ExtractedImport, ExtractedSymbol, FileIndexResult,
};
use pyo3::PyResult;

pub fn index_code(code_text: &str) -> PyResult<FileIndexResult> {
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
            parser::HtmlNodeKind::Element { tag_name, id, classes, .. } => {
                let is_significant = id.is_some()
                    || !classes.is_empty()
                    || matches!(
                        tag_name.as_str(),
                        "header" | "nav" | "main" | "article" | "section" | "aside" | "footer" | "form"
                    );

                if is_significant {
                    let name = if let Some(ref id_str) = id {
                        format!("#{}", id_str)
                    } else if let Some(cls) = classes.first() {
                        format!(".{}", cls)
                    } else {
                        tag_name.clone()
                    };

                    let sig = if let Some((o_start, o_end)) = scope.open_tag_byte_range {
                        code_text[o_start..o_end].trim().to_string()
                    } else {
                        format!("<{}>", tag_name)
                    };

                    symbols.push(ExtractedSymbol {
                        name,
                        kind: format!("html_{}", tag_name),
                        start_line: scope.start_row + 1,
                        end_line: scope.end_row + 1,
                        signature: sig,
                        parent_name: None,
                        docstring: None,
                    });
                }

                if tag_name == "link" || tag_name == "script" {
                    imports.push(ExtractedImport {
                        module: tag_name,
                        name: scope.tokens.get(1).cloned(),
                        alias: None,
                        line_number: scope.start_row + 1,
                    });
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

    #[test]
    fn test_html_indexing() {
        let code = r#"<!DOCTYPE html>
<html>
<head>
    <title>Sample HTML</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <header class="site-header">
        <h1>Welcome</h1>
    </header>
    <main>
        <article id="article-1">
            <h2>Important Article</h2>
        </article>
    </main>
</body>
</html>
"#;
        let res = index_code(code).unwrap();
        assert!(!res.has_syntax_error);
        let sym_names: Vec<&str> = res.symbols.iter().map(|s| s.name.as_str()).collect();
        assert!(sym_names.contains(&".site-header") || sym_names.contains(&"header"));
        assert!(sym_names.contains(&"#article-1"));
        assert!(!res.imports.is_empty());
    }
}
