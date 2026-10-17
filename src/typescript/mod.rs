//! TypeScript + TSX pruning and indexing engine
//!
//! Uses Tree-Sitter TypeScript and TSX grammars to parse, score, and reconstruct
//! syntactically valid TypeScript and TSX code.

pub mod parser;
pub mod repair;
pub mod scorer;

use crate::{
    count_tokens, ExtractedImport, ExtractedSymbol, FileIndexResult, PruneResult,
};
use pyo3::PyResult;

#[derive(Debug, Clone)]
pub struct TsPruneResult {
    pub pruned_code: String,
    pub original_tokens: usize,
    pub pruned_tokens: usize,
    pub savings_pct: f64,
    pub total_lines: usize,
    pub kept_lines: usize,
    pub latency_ms: f64,
    pub has_syntax_error: bool,
}

pub fn prune_ts(
    code_text: &str,
    focus_query: &str,
    threshold: f64,
) -> TsPruneResult {
    let start = std::time::Instant::now();

    if code_text.trim().is_empty() {
        let elapsed = start.elapsed().as_secs_f64() * 1000.0;
        return TsPruneResult {
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
            return TsPruneResult {
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
        return TsPruneResult {
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
    let lines: Vec<&str> = code_text.lines().collect();

    let scopes = parser::collect_scopes(&tree, source_bytes, &lines);
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

    TsPruneResult {
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
    let res = prune_ts(code_text, focus_query, threshold);
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
    let scopes = parser::collect_scopes(&tree, source_bytes, &lines);

    let mut symbols = Vec::new();
    let mut imports = Vec::new();
    let calls = Vec::new();

    for scope in scopes {
        match scope.kind {
            parser::TsNodeKind::Interface { name, .. } => {
                let signature = if let Some((s_start, s_end)) = scope.signature_byte_range {
                    code_text[s_start..s_end].trim().to_string()
                } else {
                    format!("interface {}", name)
                };
                symbols.push(ExtractedSymbol {
                    name,
                    kind: "interface".to_string(),
                    start_line: scope.start_row + 1,
                    end_line: scope.end_row + 1,
                    signature,
                    parent_name: None,
                    docstring: None,
                });
            }
            parser::TsNodeKind::TypeAlias { name, .. } => {
                let signature = if let Some((s_start, s_end)) = scope.signature_byte_range {
                    code_text[s_start..s_end].trim().to_string()
                } else {
                    format!("type {}", name)
                };
                symbols.push(ExtractedSymbol {
                    name,
                    kind: "type_alias".to_string(),
                    start_line: scope.start_row + 1,
                    end_line: scope.end_row + 1,
                    signature,
                    parent_name: None,
                    docstring: None,
                });
            }
            parser::TsNodeKind::Enum { name, .. } => {
                let signature = if let Some((s_start, s_end)) = scope.signature_byte_range {
                    code_text[s_start..s_end].trim().to_string()
                } else {
                    format!("enum {}", name)
                };
                symbols.push(ExtractedSymbol {
                    name,
                    kind: "enum".to_string(),
                    start_line: scope.start_row + 1,
                    end_line: scope.end_row + 1,
                    signature,
                    parent_name: None,
                    docstring: None,
                });
            }
            parser::TsNodeKind::Function { name, is_async, .. } => {
                let kind = if is_async { "async_function" } else { "function" };
                let signature = if let Some((s_start, s_end)) = scope.signature_byte_range {
                    code_text[s_start..s_end].trim().to_string()
                } else {
                    format!("function {}()", name)
                };
                symbols.push(ExtractedSymbol {
                    name,
                    kind: kind.to_string(),
                    start_line: scope.start_row + 1,
                    end_line: scope.end_row + 1,
                    signature,
                    parent_name: None,
                    docstring: None,
                });
            }
            parser::TsNodeKind::ArrowFunction { name, is_async, .. } => {
                let kind = if is_async { "async_arrow_function" } else { "arrow_function" };
                let signature = if let Some((s_start, s_end)) = scope.signature_byte_range {
                    code_text[s_start..s_end].trim().to_string()
                } else {
                    format!("const {} = () =>", name)
                };
                symbols.push(ExtractedSymbol {
                    name,
                    kind: kind.to_string(),
                    start_line: scope.start_row + 1,
                    end_line: scope.end_row + 1,
                    signature,
                    parent_name: None,
                    docstring: None,
                });
            }
            parser::TsNodeKind::Class { name, .. } => {
                let signature = if let Some((s_start, s_end)) = scope.signature_byte_range {
                    code_text[s_start..s_end].trim().to_string()
                } else {
                    format!("class {}", name)
                };
                symbols.push(ExtractedSymbol {
                    name,
                    kind: "class".to_string(),
                    start_line: scope.start_row + 1,
                    end_line: scope.end_row + 1,
                    signature,
                    parent_name: None,
                    docstring: None,
                });
            }
            parser::TsNodeKind::Method { name, is_async, .. } => {
                let kind = if is_async { "async_method" } else { "method" };
                let signature = if let Some((s_start, s_end)) = scope.signature_byte_range {
                    code_text[s_start..s_end].trim().to_string()
                } else {
                    format!("{}()", name)
                };
                symbols.push(ExtractedSymbol {
                    name,
                    kind: kind.to_string(),
                    start_line: scope.start_row + 1,
                    end_line: scope.end_row + 1,
                    signature,
                    parent_name: None,
                    docstring: None,
                });
            }
            parser::TsNodeKind::Import => {
                imports.push(ExtractedImport {
                    module: scope.tokens.get(0).cloned().unwrap_or_default(),
                    name: scope.defined_symbols.get(0).cloned(),
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
    fn test_ts_interface_and_class_pruning() {
        let ts_code = r#"
import type { User, UserID } from './types';
import { BaseService } from './base';

export interface IUserService<T> {
    getUser(id: UserID): Promise<T>;
    deleteUser(id: UserID): Promise<void>;
}

export type Status = 'active' | 'inactive' | 'pending';

export enum Role {
    Admin = 'ADMIN',
    User = 'USER',
    Guest = 'GUEST'
}

export class UserService<T extends User> extends BaseService implements IUserService<T> {
    private readonly timeout: number = 5000;

    constructor(private db: any, options?: Record<string, any>) {
        super();
    }

    public async getUser(id: UserID): Promise<T> {
        const user = await this.db.find(id);
        return user as T;
    }

    public async deleteUser(id: UserID): Promise<void> {
        await this.db.remove(id);
    }
}
"#;

        let res = prune_ts(ts_code, "getUser", 0.5);
        assert!(!res.has_syntax_error);
        println!("PRUNED TS CODE:\n{}", res.pruned_code);

        // Should keep imports
        assert!(res.pruned_code.contains("import type { User, UserID } from './types';"));
        assert!(res.pruned_code.contains("import { BaseService } from './base';"));

        // By dependency closure, UserID and IUserService and UserService are kept
        assert!(res.pruned_code.contains("export class UserService<T extends User> extends BaseService implements IUserService<T> {"));
        assert!(res.pruned_code.contains("public async getUser(id: UserID): Promise<T> {"));
        assert!(res.pruned_code.contains("const user = await this.db.find(id);"));

        // Unmatched deleteUser should be stubbed
        assert!(res.pruned_code.contains("public async deleteUser(id: UserID): Promise<void> {}"));
        assert!(res.savings_pct > 0.0);
    }

    #[test]
    fn test_tsx_component_pruning() {
        let tsx_code = r#"
import React, { useState } from 'react';

export interface Props<T> {
    items: T[];
    renderItem: (item: T) => React.ReactNode;
}

export const ListViewer = <T,>({ items, renderItem }: Props<T>): JSX.Element => {
    const [selected, setSelected] = useState<number | null>(null);
    return (
        <ul className="list-viewer">
            {items.map((item, idx) => (
                <li key={idx} onClick={() => setSelected(idx)}>
                    {renderItem(item)}
                </li>
            ))}
        </ul>
    );
};

export const IgnoredWidget = (): JSX.Element => {
    return <div>Unused</div>;
};
"#;

        let res = prune_ts(tsx_code, "ListViewer", 0.5);
        assert!(!res.has_syntax_error);
        println!("PRUNED TSX CODE:\n{}", res.pruned_code);

        assert!(res.pruned_code.contains("export const ListViewer = <T,>({ items, renderItem }: Props<T>): JSX.Element => {"));
        assert!(res.pruned_code.contains("className=\"list-viewer\""));
        assert!(res.pruned_code.contains("export const IgnoredWidget = (): JSX.Element => {};"));
        assert!(res.savings_pct > 0.0);
    }

    #[test]
    fn test_ts_zero_match_structural_skeleton() {
        let ts_code = r#"
import { A } from './a';

export interface Alpha {
    x: number;
}

export enum Beta {
    First,
    Second
}

export function computeSomething(val: number): number {
    return val * 42;
}
"#;

        let res = prune_ts(ts_code, "completelyUnrelatedQueryXYZ", 0.5);
        assert!(!res.has_syntax_error);
        println!("ZERO MATCH SKELETON:\n{}", res.pruned_code);

        assert!(res.pruned_code.contains("import { A } from './a';"));
        assert!(res.pruned_code.contains("export interface Alpha {}"));
        assert!(res.pruned_code.contains("export enum Beta {}"));
        assert!(res.pruned_code.contains("export function computeSomething(val: number): number {}"));
        assert!(!res.pruned_code.contains("val * 42"));
    }
}

