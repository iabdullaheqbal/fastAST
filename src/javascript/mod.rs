//! JavaScript language pruning engine
//!
//! Pattern-based scope extraction and semantic scoring.
//! Extracts: imports, exports, functions, classes, methods.
//! Keeps: imports + exports always, functions and classes matching query.

use crate::{count_tokens, PruneResult};
use std::collections::HashSet;

#[derive(Debug, Clone)]
struct JSScope {
    id: usize,
    kind: ScopeKind,
    name: String,
    start_line: usize,
    end_line: usize,
    tokens: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Hash, Copy)]
enum ScopeKind {
    Import,
    Export,
    Function,
    ArrowFunction,
    Class,
    Method,
}

pub fn prune_file(
    code_text: &str,
    focus_query: &str,
    threshold: f64,
) -> PruneResult {
    let start = std::time::Instant::now();

    if code_text.trim().is_empty() {
        let elapsed = start.elapsed().as_secs_f64() * 1000.0;
        return PruneResult {
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

    let lines: Vec<&str> = code_text.lines().collect();

    // Extract scopes from code
    let scopes = extract_scopes(&lines);

    // Parse query
    let query_tokens: Vec<String> = focus_query
        .split_whitespace()
        .map(|s| s.to_lowercase())
        .collect();

    // Score and determine what to keep
    let kept_ids = score_scopes(&scopes, &query_tokens, threshold);

    // Reconstruct code with kept scopes
    let pruned_code = reconstruct_js(&lines, &scopes, &kept_ids);

    let prune_elapsed = prune_start.elapsed().as_secs_f64() * 1000.0;
    let pruned_tokens = count_tokens(&pruned_code);
    let kept_lines = pruned_code.lines().count();
    let savings_pct = if original_tokens > 0 {
        ((original_tokens.saturating_sub(pruned_tokens)) as f64 / original_tokens as f64) * 100.0
    } else {
        0.0
    };

    PruneResult {
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

/// Extract scopes from JavaScript code using line-by-line pattern matching
fn extract_scopes(lines: &[&str]) -> Vec<JSScope> {
    let mut scopes = Vec::new();
    let mut id_counter = 0;

    for (line_idx, line) in lines.iter().enumerate() {
        let trimmed = line.trim();

        // Skip comments and empty lines
        if trimmed.is_empty() || trimmed.starts_with("//") || trimmed.starts_with("/*") {
            continue;
        }

        // Imports
        if trimmed.starts_with("import ") {
            let name = extract_import_name(trimmed);
            scopes.push(JSScope {
                id: id_counter,
                kind: ScopeKind::Import,
                name: name.clone(),
                start_line: line_idx,
                end_line: line_idx,
                tokens: tokenize(&name),
            });
            id_counter += 1;
        }

        // Exports
        if trimmed.starts_with("export ") {
            let name = extract_export_name(trimmed);
            scopes.push(JSScope {
                id: id_counter,
                kind: ScopeKind::Export,
                name: name.clone(),
                start_line: line_idx,
                end_line: line_idx,
                tokens: tokenize(&name),
            });
            id_counter += 1;
        }

        // Functions (function name() and const name = function)
        if is_function_line(trimmed) {
            if let Some(func_name) = extract_function_name(trimmed) {
                let end_line = find_scope_end(lines, line_idx);
                scopes.push(JSScope {
                    id: id_counter,
                    kind: ScopeKind::Function,
                    name: func_name.clone(),
                    start_line: line_idx,
                    end_line,
                    tokens: tokenize(&func_name),
                });
                id_counter += 1;
            }
        }

        // Arrow functions (const name = () =>)
        if is_arrow_function_line(trimmed) {
            if let Some(func_name) = extract_arrow_function_name(trimmed) {
                let end_line = find_scope_end(lines, line_idx);
                scopes.push(JSScope {
                    id: id_counter,
                    kind: ScopeKind::ArrowFunction,
                    name: func_name.clone(),
                    start_line: line_idx,
                    end_line,
                    tokens: tokenize(&func_name),
                });
                id_counter += 1;
            }
        }

        // Classes
        if is_class_line(trimmed) {
            if let Some(class_name) = extract_class_name(trimmed) {
                let end_line = find_scope_end(lines, line_idx);
                scopes.push(JSScope {
                    id: id_counter,
                    kind: ScopeKind::Class,
                    name: class_name.clone(),
                    start_line: line_idx,
                    end_line,
                    tokens: tokenize(&class_name),
                });
                id_counter += 1;
            }
        }

        // Methods (inside classes)
        if is_method_line(trimmed) {
            if let Some(method_name) = extract_method_name(trimmed) {
                let end_line = find_scope_end(lines, line_idx);
                scopes.push(JSScope {
                    id: id_counter,
                    kind: ScopeKind::Method,
                    name: method_name.clone(),
                    start_line: line_idx,
                    end_line,
                    tokens: tokenize(&method_name),
                });
                id_counter += 1;
            }
        }
    }

    scopes
}

fn extract_import_name(line: &str) -> String {
    // Extract the identifier after 'import'
    if let Some(from_pos) = line.find("from ") {
        return line[7..from_pos].trim().to_string();
    }
    line[7..].trim().to_string()
}

fn extract_export_name(line: &str) -> String {
    // Extract identifier after 'export'
    let after_export = &line[7..];
    if after_export.starts_with("function ") {
        return extract_function_name(after_export).unwrap_or_default();
    } else if after_export.starts_with("const ") {
        return extract_arrow_function_name(after_export).unwrap_or_default();
    } else if after_export.starts_with("class ") {
        return extract_class_name(after_export).unwrap_or_default();
    }
    "export".to_string()
}

fn is_function_line(line: &str) -> bool {
    (line.starts_with("function ") && line.contains('('))
        || (line.contains("function") && line.contains('(') && line.contains(')'))
}

fn extract_function_name(line: &str) -> Option<String> {
    // function name()
    if line.starts_with("function ") {
        let after_fn = &line[9..];
        if let Some(paren_pos) = after_fn.find('(') {
            return Some(after_fn[..paren_pos].trim().to_string());
        }
    }
    // const name = function()
    else if line.contains("= function") {
        if let Some(eq_pos) = line.find('=') {
            let before_eq = &line[..eq_pos];
            if let Some(name) = before_eq.split_whitespace().last() {
                return Some(name.to_string());
            }
        }
    }
    None
}

fn is_arrow_function_line(line: &str) -> bool {
    line.contains("=>") || (line.contains('=') && line.contains("=>"))
}

fn extract_arrow_function_name(line: &str) -> Option<String> {
    // const name = () => 
    if let Some(eq_pos) = line.find('=') {
        let before_eq = &line[..eq_pos];
        if let Some(name) = before_eq.split_whitespace().last() {
            if name != "const" && name != "let" && name != "var" {
                return Some(name.to_string());
            }
        }
    }
    None
}

fn is_class_line(line: &str) -> bool {
    line.contains("class ") && !line.contains("class=")
}

fn extract_class_name(line: &str) -> Option<String> {
    if let Some(pos) = line.find("class ") {
        let after_class = &line[pos + 6..];
        let name_end = after_class
            .find(|c: char| !c.is_alphanumeric() && c != '_' && c != '$')
            .unwrap_or(after_class.len());
        let name = after_class[..name_end].trim();
        if !name.is_empty() {
            return Some(name.to_string());
        }
    }
    None
}

fn is_method_line(line: &str) -> bool {
    line.contains('(') && line.contains(')') && (line.contains('{') || line.contains("=>"))
}

fn extract_method_name(line: &str) -> Option<String> {
    // methodName() {
    if let Some(paren_pos) = line.find('(') {
        let before_paren = &line[..paren_pos];
        let trimmed = before_paren.trim();
        if let Some(name) = trimmed.split_whitespace().last() {
            let method_name: String = name.chars().take_while(|c| c.is_alphanumeric() || *c == '_' || *c == '$').collect();
            if !method_name.is_empty() {
                return Some(method_name);
            }
        }
    }
    None
}

fn find_scope_end(lines: &[&str], start: usize) -> usize {
    let mut depth = 0;
    let mut found_open = false;

    for (idx, line) in lines.iter().enumerate().skip(start) {
        for ch in line.chars() {
            if ch == '{' {
                found_open = true;
                depth += 1;
            } else if ch == '}' {
                depth -= 1;
                if found_open && depth == 0 {
                    return idx;
                }
            }
        }
        if idx > start + 100 {
            break; // Safety limit
        }
    }

    (start + 20).min(lines.len() - 1)
}

fn tokenize(name: &str) -> Vec<String> {
    let mut tokens = Vec::new();
    let mut current = String::new();

    for ch in name.chars() {
        if ch.is_alphanumeric() {
            current.push(ch.to_lowercase().next().unwrap_or(ch));
        } else {
            if !current.is_empty() {
                tokens.push(current.clone());
                current.clear();
            }
        }
    }

    if !current.is_empty() {
        tokens.push(current);
    }

    tokens
}

/// Score scopes and determine which to keep
fn score_scopes(
    scopes: &[JSScope],
    query_tokens: &[String],
    threshold: f64,
) -> HashSet<usize> {
    let mut kept = HashSet::new();

    // Always keep imports and exports
    for scope in scopes {
        if scope.kind == ScopeKind::Import || scope.kind == ScopeKind::Export {
            kept.insert(scope.id);
        }
    }

    // Score and keep matching functions and arrow functions
    for scope in scopes {
        if scope.kind == ScopeKind::Function || scope.kind == ScopeKind::ArrowFunction {
            let score = calculate_score(&scope.tokens, query_tokens);
            if score >= threshold {
                kept.insert(scope.id);
            }
        }
    }

    // Score and keep matching classes
    for scope in scopes {
        if scope.kind == ScopeKind::Class {
            let score = calculate_score(&scope.tokens, query_tokens);
            if score >= threshold {
                kept.insert(scope.id);
            }
        }
    }

    // Score and keep matching methods
    for scope in scopes {
        if scope.kind == ScopeKind::Method {
            let score = calculate_score(&scope.tokens, query_tokens);
            if score >= threshold {
                kept.insert(scope.id);
            }
        }
    }

    // If nothing matched, keep all functions/classes (fallback)
    let has_kept = scopes.iter().any(|s| {
        (s.kind == ScopeKind::Function
            || s.kind == ScopeKind::ArrowFunction
            || s.kind == ScopeKind::Class
            || s.kind == ScopeKind::Method)
            && kept.contains(&s.id)
    });
    if !has_kept {
        for scope in scopes {
            if scope.kind == ScopeKind::Function
                || scope.kind == ScopeKind::ArrowFunction
                || scope.kind == ScopeKind::Class
            {
                kept.insert(scope.id);
            }
        }
    }

    kept
}

/// Calculate match score between scope tokens and query tokens
fn calculate_score(scope_tokens: &[String], query_tokens: &[String]) -> f64 {
    if scope_tokens.is_empty() || query_tokens.is_empty() {
        return 0.0;
    }

    let mut matches = 0;
    for qt in query_tokens {
        if scope_tokens.iter().any(|t| t.contains(qt) || qt.contains(t)) {
            matches += 1;
        }
    }

    matches as f64 / query_tokens.len().max(1) as f64
}

/// Reconstruct JavaScript code keeping only relevant scopes
fn reconstruct_js(
    lines: &[&str],
    scopes: &[JSScope],
    kept_ids: &HashSet<usize>,
) -> String {
    let mut output = String::new();
    let mut included = vec![false; lines.len()];

    // First: add all import and export statements
    for scope in scopes {
        if kept_ids.contains(&scope.id)
            && (scope.kind == ScopeKind::Import || scope.kind == ScopeKind::Export)
        {
            for i in scope.start_line..=scope.end_line.min(lines.len().saturating_sub(1)) {
                if !included[i] {
                    output.push_str(lines[i]);
                    output.push('\n');
                    included[i] = true;
                }
            }
        }
    }

    // Second: process classes and functions
    for class_scope in scopes {
        if class_scope.kind == ScopeKind::Class && kept_ids.contains(&class_scope.id) {
            // Add class header
            if !included[class_scope.start_line] {
                output.push_str(lines[class_scope.start_line]);
                output.push('\n');
                included[class_scope.start_line] = true;
            }

            // Add kept methods
            for method_scope in scopes {
                if method_scope.kind == ScopeKind::Method {
                    if kept_ids.contains(&method_scope.id) {
                        // Add entire method
                        for i in method_scope.start_line..=method_scope.end_line.min(lines.len().saturating_sub(1)) {
                            if !included[i] {
                                output.push_str(lines[i]);
                                output.push('\n');
                                included[i] = true;
                            }
                        }
                    }
                }
            }

            // Add class closing brace
            if class_scope.end_line < lines.len() && !included[class_scope.end_line] {
                output.push_str(lines[class_scope.end_line]);
                output.push('\n');
                included[class_scope.end_line] = true;
            }
        }
    }

    // Third: add standalone functions and arrow functions
    for func_scope in scopes {
        if (func_scope.kind == ScopeKind::Function || func_scope.kind == ScopeKind::ArrowFunction)
            && kept_ids.contains(&func_scope.id)
        {
            // Add entire function
            for i in func_scope.start_line..=func_scope.end_line.min(lines.len().saturating_sub(1)) {
                if !included[i] {
                    output.push_str(lines[i]);
                    output.push('\n');
                    included[i] = true;
                }
            }
        }
    }

    // If nothing was kept, return the full code to maintain validity
    if output.trim().is_empty() {
        lines.join("\n")
    } else {
        output.trim_end().to_string()
    }
}

pub fn index_code(code_text: &str) -> crate::FileIndexResult {
    crate::FileIndexResult {
        symbols: vec![],
        imports: vec![],
        calls: vec![],
        total_lines: code_text.lines().count(),
        total_tokens: crate::count_tokens(code_text),
        has_syntax_error: false,
    }
}
