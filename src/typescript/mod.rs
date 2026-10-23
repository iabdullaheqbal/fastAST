//! TypeScript + TSX indexing engine using Tree-Sitter grammars.
pub mod parser;

use crate::{
    count_tokens, ExtractedCall, ExtractedImport, ExtractedSymbol, FileIndexResult,
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

    let has_syntax_error = tree.root_node().has_error();
    let source_bytes = code_text.as_bytes();
    let scopes = parser::collect_scopes(&tree, source_bytes, &lines);
    let raw_calls = parser::collect_all_calls(&tree, source_bytes, &scopes);

    let calls = raw_calls
        .into_iter()
        .map(|c| ExtractedCall {
            caller_name: c.caller_name,
            callee_name: c.callee_name,
            line_number: c.line_number,
        })
        .collect();

    let mut symbols = Vec::new();
    let mut imports = Vec::new();

    for (_idx, scope) in scopes.iter().enumerate() {
        let parent_name = scope.parent_id.and_then(|pid| {
            if pid < scopes.len() {
                match &scopes[pid].kind {
                    parser::TsNodeKind::Class { name, .. } => {
                        if !name.is_empty() && name != "default" {
                            Some(name.clone())
                        } else {
                            None
                        }
                    }
                    parser::TsNodeKind::Interface { name, .. } => {
                        if !name.is_empty() && name != "default" {
                            Some(name.clone())
                        } else {
                            None
                        }
                    }
                    parser::TsNodeKind::Function { name, .. } => {
                        if !name.is_empty() && name != "default" {
                            Some(name.clone())
                        } else {
                            None
                        }
                    }
                    parser::TsNodeKind::ArrowFunction { name, .. } => {
                        if !name.is_empty() && name != "default" {
                            Some(name.clone())
                        } else {
                            None
                        }
                    }
                    _ => None,
                }
            } else {
                None
            }
        });

        match &scope.kind {
            parser::TsNodeKind::Interface { name, .. } => {
                let signature = if let Some((s_start, s_end)) = scope.signature_byte_range {
                    code_text[s_start..s_end].trim().to_string()
                } else {
                    format!("interface {}", name)
                };
                symbols.push(ExtractedSymbol {
                    name: name.clone(),
                    kind: "interface".to_string(),
                    start_line: scope.start_row + 1,
                    end_line: scope.end_row + 1,
                    signature,
                    parent_name,
                    docstring: scope.docstring.clone(),
                });
            }
            parser::TsNodeKind::TypeAlias { name, .. } => {
                let signature = if let Some((s_start, s_end)) = scope.signature_byte_range {
                    code_text[s_start..s_end].trim().to_string()
                } else {
                    format!("type {}", name)
                };
                symbols.push(ExtractedSymbol {
                    name: name.clone(),
                    kind: "type_alias".to_string(),
                    start_line: scope.start_row + 1,
                    end_line: scope.end_row + 1,
                    signature,
                    parent_name,
                    docstring: scope.docstring.clone(),
                });
            }
            parser::TsNodeKind::Enum { name, .. } => {
                let signature = if let Some((s_start, s_end)) = scope.signature_byte_range {
                    code_text[s_start..s_end].trim().to_string()
                } else {
                    format!("enum {}", name)
                };
                symbols.push(ExtractedSymbol {
                    name: name.clone(),
                    kind: "enum".to_string(),
                    start_line: scope.start_row + 1,
                    end_line: scope.end_row + 1,
                    signature,
                    parent_name,
                    docstring: scope.docstring.clone(),
                });
            }
            parser::TsNodeKind::Function {
                name,
                is_async,
                is_generator,
                ..
            } => {
                let kind = if *is_generator {
                    "generator_function"
                } else if *is_async {
                    "async_function"
                } else {
                    "function"
                };
                let signature = if let Some((s_start, s_end)) = scope.signature_byte_range {
                    code_text[s_start..s_end].trim().to_string()
                } else {
                    format!("function {}()", name)
                };
                symbols.push(ExtractedSymbol {
                    name: name.clone(),
                    kind: kind.to_string(),
                    start_line: scope.start_row + 1,
                    end_line: scope.end_row + 1,
                    signature,
                    parent_name,
                    docstring: scope.docstring.clone(),
                });
            }
            parser::TsNodeKind::ArrowFunction { name, is_async, .. } => {
                let kind = if *is_async { "async_arrow_function" } else { "arrow_function" };
                let signature = if let Some((s_start, s_end)) = scope.signature_byte_range {
                    code_text[s_start..s_end].trim().to_string()
                } else {
                    format!("const {} = () =>", name)
                };
                symbols.push(ExtractedSymbol {
                    name: name.clone(),
                    kind: kind.to_string(),
                    start_line: scope.start_row + 1,
                    end_line: scope.end_row + 1,
                    signature,
                    parent_name,
                    docstring: scope.docstring.clone(),
                });
            }
            parser::TsNodeKind::Class { name, .. } => {
                let signature = if let Some((s_start, s_end)) = scope.signature_byte_range {
                    code_text[s_start..s_end].trim().to_string()
                } else {
                    format!("class {}", name)
                };
                symbols.push(ExtractedSymbol {
                    name: name.clone(),
                    kind: "class".to_string(),
                    start_line: scope.start_row + 1,
                    end_line: scope.end_row + 1,
                    signature,
                    parent_name,
                    docstring: scope.docstring.clone(),
                });
            }
            parser::TsNodeKind::Method {
                name,
                is_async,
                is_constructor,
                is_getter,
                is_setter,
                is_static,
                is_abstract,
                ..
            } => {
                let kind = if *is_abstract {
                    "abstract_method"
                } else if *is_constructor {
                    "constructor"
                } else if *is_getter {
                    "getter"
                } else if *is_setter {
                    "setter"
                } else if *is_static {
                    "static_method"
                } else if *is_async {
                    "async_method"
                } else {
                    "method"
                };
                let signature = if let Some((s_start, s_end)) = scope.signature_byte_range {
                    code_text[s_start..s_end].trim().to_string()
                } else {
                    format!("{}()", name)
                };
                symbols.push(ExtractedSymbol {
                    name: name.clone(),
                    kind: kind.to_string(),
                    start_line: scope.start_row + 1,
                    end_line: scope.end_row + 1,
                    signature,
                    parent_name,
                    docstring: scope.docstring.clone(),
                });
            }
            parser::TsNodeKind::Field { name, is_arrow, .. } => {
                if *is_arrow {
                    let signature = if let Some((s_start, s_end)) = scope.signature_byte_range {
                        code_text[s_start..s_end].trim().to_string()
                    } else {
                        format!("{} = () =>", name)
                    };
                    symbols.push(ExtractedSymbol {
                        name: name.clone(),
                        kind: "method".to_string(),
                        start_line: scope.start_row + 1,
                        end_line: scope.end_row + 1,
                        signature,
                        parent_name,
                        docstring: scope.docstring.clone(),
                    });
                }
            }
            parser::TsNodeKind::Import => {
                for defined_sym in &scope.defined_symbols {
                    imports.push(ExtractedImport {
                        module: scope.tokens.get(0).cloned().unwrap_or_default(),
                        name: Some(defined_sym.clone()),
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
        has_syntax_error,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_ts_indexing_interface_and_function() {
        let code = r#"
export interface User<T> {
    id: string;
    data: T;
}

export function processUser<T>(user: User<T>): boolean {
    return user.id.length > 0;
}

export function helper(): void {
    console.log("helper");
}
"#;
        let res = index_code(code).unwrap();
        assert!(!res.has_syntax_error);
        let sym_names: Vec<&str> = res.symbols.iter().map(|s| s.name.as_str()).collect();
        assert!(sym_names.contains(&"User"));
        assert!(sym_names.contains(&"processUser"));
        assert!(sym_names.contains(&"helper"));
    }
}
