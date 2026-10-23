//! Java language indexing engine with Tree-sitter AST parsing

pub mod parser;

use crate::{
    count_tokens,
    indexer::{ExtractedImport, ExtractedSymbol, FileIndexResult},
};

pub fn index_code(code_text: &str) -> FileIndexResult {
    let total_tokens = count_tokens(code_text);
    let lines: Vec<&str> = code_text.lines().collect();

    let tree = match parser::parse_ast(code_text) {
        Ok(t) => t,
        Err(_) => {
            return FileIndexResult {
                symbols: Vec::new(),
                imports: Vec::new(),
                calls: Vec::new(),
                total_lines: lines.len(),
                total_tokens,
                has_syntax_error: true,
            };
        }
    };

    let has_syntax_error = tree.root_node().has_error();
    let source_bytes = code_text.as_bytes();
    let scopes = parser::collect_scopes(&tree, source_bytes, &lines);

    let mut symbols = Vec::new();
    let mut imports = Vec::new();
    let calls = Vec::new();

    // Map scopes to symbols and imports
    let scope_map: std::collections::HashMap<usize, &parser::JavaScope> =
        scopes.iter().map(|s| (s.id, s)).collect();

    for scope in &scopes {
        match scope.kind {
            parser::JavaNodeKind::Package => {
                imports.push(ExtractedImport {
                    module: scope.name.clone(),
                    name: None,
                    alias: None,
                    line_number: scope.start_line + 1,
                });
            }
            parser::JavaNodeKind::Import => {
                let cleaned = scope.name.trim().trim_start_matches("import ").trim_end_matches(';').trim();
                imports.push(ExtractedImport {
                    module: cleaned.to_string(),
                    name: None,
                    alias: None,
                    line_number: scope.start_line + 1,
                });
            }
            parser::JavaNodeKind::Class
            | parser::JavaNodeKind::Interface
            | parser::JavaNodeKind::Enum => {
                let kind_str = match scope.kind {
                    parser::JavaNodeKind::Class => "class",
                    parser::JavaNodeKind::Interface => "interface",
                    parser::JavaNodeKind::Enum => "enum",
                    _ => "class",
                };
                let parent_name = scope
                    .parent_id
                    .and_then(|pid| scope_map.get(&pid))
                    .map(|p| p.name.clone());

                let first_line = lines.get(scope.start_line).unwrap_or(&"").trim().to_string();

                symbols.push(ExtractedSymbol {
                    name: scope.name.clone(),
                    kind: kind_str.to_string(),
                    signature: first_line,
                    start_line: scope.start_line + 1,
                    end_line: scope.end_line + 1,
                    parent_name,
                    docstring: None,
                });
            }
            parser::JavaNodeKind::Constructor | parser::JavaNodeKind::Method => {
                let kind_str = match scope.kind {
                    parser::JavaNodeKind::Constructor => "constructor",
                    _ => "method",
                };
                let parent_name = scope
                    .parent_id
                    .and_then(|pid| scope_map.get(&pid))
                    .map(|p| p.name.clone());

                let first_line = lines.get(scope.start_line).unwrap_or(&"").trim().to_string();

                symbols.push(ExtractedSymbol {
                    name: scope.name.clone(),
                    kind: kind_str.to_string(),
                    signature: first_line,
                    start_line: scope.start_line + 1,
                    end_line: scope.end_line + 1,
                    parent_name,
                    docstring: None,
                });
            }
            parser::JavaNodeKind::Field => {
                let parent_name = scope
                    .parent_id
                    .and_then(|pid| scope_map.get(&pid))
                    .map(|p| p.name.clone());

                let first_line = lines.get(scope.start_line).unwrap_or(&"").trim().to_string();

                symbols.push(ExtractedSymbol {
                    name: scope.name.clone(),
                    kind: "field".to_string(),
                    signature: first_line,
                    start_line: scope.start_line + 1,
                    end_line: scope.end_line + 1,
                    parent_name,
                    docstring: None,
                });
            }
            _ => {}
        }
    }

    FileIndexResult {
        symbols,
        imports,
        calls,
        total_lines: lines.len(),
        total_tokens,
        has_syntax_error,
    }
}
