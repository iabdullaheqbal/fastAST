//! HTML pruning and indexing engine
//!
//! Uses Tree-Sitter HTML grammar to parse, score, and reconstruct
//! valid HTML documents while preserving DOM hierarchy and attributes.

pub mod parser;
pub mod repair;
pub mod scorer;

use crate::{
    count_tokens, ExtractedImport, ExtractedSymbol, FileIndexResult, PruneResult,
};
use pyo3::PyResult;

#[derive(Debug, Clone)]
pub struct HtmlPruneResult {
    pub pruned_code: String,
    pub original_tokens: usize,
    pub pruned_tokens: usize,
    pub savings_pct: f64,
    pub total_lines: usize,
    pub kept_lines: usize,
    pub latency_ms: f64,
    pub has_syntax_error: bool,
}

pub fn prune_html(
    code_text: &str,
    focus_query: &str,
    threshold: f64,
) -> HtmlPruneResult {
    let start = std::time::Instant::now();

    if code_text.trim().is_empty() {
        let elapsed = start.elapsed().as_secs_f64() * 1000.0;
        return HtmlPruneResult {
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

    let total_lines = code_text.lines().count();
    let original_tokens = count_tokens(code_text);
    let prune_start = std::time::Instant::now();

    let tree = match parser::parse_ast(code_text) {
        Ok(t) => t,
        Err(_) => {
            let elapsed = prune_start.elapsed().as_secs_f64() * 1000.0;
            return HtmlPruneResult {
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

    if tree.root_node().has_error() {
        let elapsed = prune_start.elapsed().as_secs_f64() * 1000.0;
        return HtmlPruneResult {
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

    let source_bytes = code_text.as_bytes();
    let scopes = parser::collect_scopes(&tree, source_bytes);
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

    HtmlPruneResult {
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
    let res = prune_html(code_text, focus_query, threshold);
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
    fn test_html_pruning_article_preserves_hierarchy() {
        let code = r#"<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
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
            <p>Target content here.</p>
        </article>
        <aside>
            <p>Unrelated sidebar links.</p>
        </aside>
    </main>
    <footer>
        <p>&copy; 2024</p>
    </footer>
</body>
</html>
"#;

        let res = prune_html(code, "article-1", 0.5);
        assert!(!res.has_syntax_error);
        println!("PRUNED HTML:\n{}", res.pruned_code);

        // Doctype, html, head and body preserved
        assert!(res.pruned_code.contains("<!DOCTYPE html>"));
        assert!(res.pruned_code.contains("<html lang=\"en\">"));
        assert!(res.pruned_code.contains("<head>"));
        assert!(res.pruned_code.contains("<title>Sample HTML</title>"));
        assert!(res.pruned_code.contains("<body>"));

        // Enclosing <main> kept as container
        assert!(res.pruned_code.contains("<main>"));
        // Matched <article> kept in full
        assert!(res.pruned_code.contains("<article id=\"article-1\">"));
        assert!(res.pruned_code.contains("<h2>Important Article</h2>"));
        assert!(res.pruned_code.contains("<p>Target content here.</p>"));
        assert!(res.pruned_code.contains("</article>"));

        // Unmatched <aside> not kept full
        assert!(!res.pruned_code.contains("Unrelated sidebar links."));
        assert!(res.pruned_code.contains("</body>"));
        assert!(res.pruned_code.contains("</html>"));
        assert!(res.savings_pct > 0.0);
    }

    #[test]
    fn test_html_zero_match_structural_skeleton() {
        let code = r#"<!DOCTYPE html>
<html>
<head>
    <title>Zero Match Test</title>
</head>
<body>
    <header><h1>Header</h1></header>
    <main><p>Body text</p></main>
    <footer><p>Footer</p></footer>
</body>
</html>
"#;

        let res = prune_html(code, "nonExistentSearchXYZ999", 0.5);
        assert!(!res.has_syntax_error);
        println!("ZERO MATCH HTML SKELETON:\n{}", res.pruned_code);

        assert!(res.pruned_code.contains("<!DOCTYPE html>"));
        assert!(res.pruned_code.contains("<html>"));
        assert!(res.pruned_code.contains("<head>"));
        assert!(res.pruned_code.contains("<title>Zero Match Test</title>"));
        assert!(res.pruned_code.contains("<body>"));
        assert!(res.pruned_code.contains("<header>"));
        assert!(res.pruned_code.contains("<footer>"));
        assert!(!res.pruned_code.contains("Body text"));
    }
}
