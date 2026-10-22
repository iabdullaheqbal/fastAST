//! JavaScript / JSX language indexing engine
//!
//! Extracts symbols, imports, and function calls from JavaScript, JSX, MJS, and CJS files.

use crate::{
    count_tokens,
    indexer::{ExtractedCall, ExtractedImport, ExtractedSymbol, FileIndexResult},
};
use std::collections::{HashMap, HashSet};

// ── Data model ──────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
enum Kind {
    Import,
    Function,
    AsyncFunction,
    ArrowFunction,
    Class,
    Method,
    AsyncMethod,
    Getter,
    Setter,
    Constructor,
}

#[derive(Debug, Clone)]
struct Scope {
    id: usize,
    kind: Kind,
    name: String,
    signature: String,     // first line, trimmed
    start_line: usize,     // 0-indexed
    end_line: usize,       // 0-indexed, inclusive
    tokens: Vec<String>,   // camelCase-split lowercase
    parent_id: Option<usize>,
    docstring: Option<String>,
    body_refs: Vec<String>,
    ends_with_semi: bool,
}

// ── Public API ──────────────────────────────────────────────────────────────

pub fn index_code(code_text: &str) -> FileIndexResult {
    let lines: Vec<&str> = code_text.lines().collect();
    let scopes = extract_scopes(&lines);
    let scope_map: HashMap<usize, &Scope> = scopes.iter().map(|s| (s.id, s)).collect();

    let mut symbols = Vec::new();
    let mut imports = Vec::new();
    let mut calls = Vec::new();

    for s in &scopes {
        match s.kind {
            Kind::Import => {
                imports.push(ExtractedImport {
                    module: s.name.clone(),
                    name: None,
                    alias: None,
                    line_number: s.start_line + 1,
                });
            }
            Kind::Function | Kind::AsyncFunction | Kind::ArrowFunction
            | Kind::Class | Kind::Method | Kind::AsyncMethod
            | Kind::Getter | Kind::Setter | Kind::Constructor => {
                let kind_str = match s.kind {
                    Kind::Function => "function",
                    Kind::AsyncFunction => "async_function",
                    Kind::ArrowFunction => "arrow_function",
                    Kind::Class => "class",
                    Kind::Method => "method",
                    Kind::AsyncMethod => "async_method",
                    Kind::Getter => "getter",
                    Kind::Setter => "setter",
                    Kind::Constructor => "constructor",
                    _ => "function",
                };
                let parent_name = s.parent_id
                    .and_then(|pid| scope_map.get(&pid))
                    .map(|p| p.name.clone());
                symbols.push(ExtractedSymbol {
                    name: s.name.clone(),
                    kind: kind_str.to_string(),
                    signature: s.signature.clone(),
                    start_line: s.start_line + 1,
                    end_line: s.end_line + 1,
                    parent_name,
                    docstring: s.docstring.clone(),
                });
                // Extract calls
                for li in s.start_line..=s.end_line.min(lines.len().saturating_sub(1)) {
                    extract_calls(lines[li], &s.name, li + 1, &mut calls);
                }
            }
        }
    }

    FileIndexResult {
        symbols,
        imports,
        calls,
        total_lines: lines.len(),
        total_tokens: count_tokens(code_text),
        has_syntax_error: false,
    }
}

// ── Scope extraction ────────────────────────────────────────────────────────

fn extract_scopes(lines: &[&str]) -> Vec<Scope> {
    let mut scopes: Vec<Scope> = Vec::new();
    let mut next_id = 0usize;
    let mut class_stack: Vec<(usize, usize)> = Vec::new();
    let mut func_stack: Vec<(usize, usize)> = Vec::new();
    let mut pending_doc: Option<String> = None;

    let mut i = 0;
    while i < lines.len() {
        while class_stack.last().map(|&(_, end)| i > end).unwrap_or(false) { class_stack.pop(); }
        while func_stack.last().map(|&(_, end)| i > end).unwrap_or(false) { func_stack.pop(); }

        let trimmed = lines[i].trim();
        if trimmed.is_empty() { i += 1; continue; }
        if trimmed.starts_with("//") { i += 1; continue; }

        // JSDoc /** ... */
        if trimmed.starts_with("/**") {
            let mut doc_lines: Vec<String> = Vec::new();
            let start_i = i;
            loop {
                let l = lines[i].trim();
                if i > start_i {
                    let stripped = l.trim_start_matches('*').trim();
                    if !stripped.is_empty() && stripped != "/" && !stripped.starts_with('@') {
                        doc_lines.push(stripped.to_string());
                    }
                }
                if l.ends_with("*/") || l == "*/" { i += 1; break; }
                i += 1;
                if i >= lines.len() { break; }
            }
            pending_doc = doc_lines.first().cloned();
            continue;
        }

        // Non-JSDoc block comment
        if trimmed.starts_with("/*") {
            while i < lines.len() && !lines[i].trim().ends_with("*/") { i += 1; }
            i += 1; continue;
        }

        let trimmed = lines[i].trim();
        let class_parent = class_stack.last().map(|&(id, _)| id);
        let func_parent = func_stack.last().map(|&(id, _)| id);

        // ── Import ──
        if trimmed.starts_with("import ") && !trimmed.starts_with("import(") {
            let module = extract_import_module(trimmed);
            push_scope(&mut scopes, &mut next_id, Kind::Import, &module, trimmed, i, i, None, None, &[], false);
            i += 1; continue;
        }

        // ── Class ──
        if is_class_line(trimmed) {
            let name = extract_class_name(trimmed);
            let end = find_brace_end(lines, i).unwrap_or(i);
            let body_refs = collect_refs(lines, i + 1, end.saturating_sub(1));
            let parent = class_parent;
            let sid = push_scope(&mut scopes, &mut next_id, Kind::Class, &name, trimmed, i, end, parent, pending_doc.take(), &body_refs, false);
            class_stack.push((sid, end));
            i += 1; continue;
        }

        // Inside a class — check for class members
        if !class_stack.is_empty() {
            // ── Getter ──
            if is_getter_line(trimmed) {
                let name = extract_accessor_name(trimmed, "get");
                let end = find_brace_end(lines, i).unwrap_or(i);
                push_scope(&mut scopes, &mut next_id, Kind::Getter, &name, trimmed, i, end, class_parent, pending_doc.take(), &[], false);
                i += 1; continue;
            }
            // ── Setter ──
            if is_setter_line(trimmed) {
                let name = extract_accessor_name(trimmed, "set");
                let end = find_brace_end(lines, i).unwrap_or(i);
                push_scope(&mut scopes, &mut next_id, Kind::Setter, &name, trimmed, i, end, class_parent, pending_doc.take(), &[], false);
                i += 1; continue;
            }
            // ── Constructor ──
            if is_constructor_line(trimmed) {
                let end = find_brace_end(lines, i).unwrap_or(i);
                push_scope(&mut scopes, &mut next_id, Kind::Constructor, "constructor", trimmed, i, end, class_parent, pending_doc.take(), &[], false);
                i += 1; continue;
            }
            // ── Async method ──
            if trimmed.starts_with("async ") && trimmed.contains('(') && trimmed.contains('{') {
                let name = extract_method_name(trimmed);
                let end = find_brace_end(lines, i).unwrap_or(i);
                push_scope(&mut scopes, &mut next_id, Kind::AsyncMethod, &name, trimmed, i, end, class_parent, pending_doc.take(), &[], false);
                i += 1; continue;
            }
            // ── Regular method ──
            if is_class_method_line(trimmed) {
                let name = extract_method_name(trimmed);
                if !name.is_empty() {
                    let end = find_brace_end(lines, i).unwrap_or(i);
                    push_scope(&mut scopes, &mut next_id, Kind::Method, &name, trimmed, i, end, class_parent, pending_doc.take(), &[], false);
                    i += 1; continue;
                }
            }
        }

        // ── Arrow function (standalone or exported) ──
        if is_arrow_or_const(trimmed) {
            let name = extract_const_name(trimmed);
            if !name.is_empty() {
                let (end, ends_semi) = find_arrow_end(lines, i);
                let body_refs = collect_refs(lines, i + 1, end.saturating_sub(1));
                let parent = func_parent.or(class_parent);
                let sid = push_scope(&mut scopes, &mut next_id, Kind::ArrowFunction, &name, trimmed, i, end, parent, pending_doc.take(), &body_refs, ends_semi);
                func_stack.push((sid, end));
                i += 1; continue;
            }
        }

        // ── Async function declaration ──
        if is_async_func_line(trimmed) {
            let name = extract_func_name(trimmed);
            let end = find_brace_end(lines, i).unwrap_or(i);
            let body_refs = collect_refs(lines, i + 1, end.saturating_sub(1));
            let parent = func_parent;
            let sid = push_scope(&mut scopes, &mut next_id, Kind::AsyncFunction, &name, trimmed, i, end, parent, pending_doc.take(), &body_refs, false);
            func_stack.push((sid, end));
            i += 1; continue;
        }

        // ── Regular function declaration ──
        if is_func_decl_line(trimmed) {
            let name = extract_func_name(trimmed);
            let end = find_brace_end(lines, i).unwrap_or(i);
            let body_refs = collect_refs(lines, i + 1, end.saturating_sub(1));
            let parent = func_parent;
            let sid = push_scope(&mut scopes, &mut next_id, Kind::Function, &name, trimmed, i, end, parent, pending_doc.take(), &body_refs, false);
            func_stack.push((sid, end));
            i += 1; continue;
        }

        pending_doc = None;
        i += 1;
    }
    scopes
}

fn push_scope(
    scopes: &mut Vec<Scope>, next_id: &mut usize, kind: Kind, name: &str,
    sig: &str, start: usize, end: usize, parent_id: Option<usize>,
    docstring: Option<String>, body_refs: &[String], ends_with_semi: bool,
) -> usize {
    let id = *next_id;
    *next_id += 1;
    scopes.push(Scope {
        id, kind,
        name: name.to_string(),
        signature: sig.to_string(),
        start_line: start, end_line: end,
        tokens: split_camel(name),
        parent_id, docstring,
        body_refs: body_refs.to_vec(),
        ends_with_semi,
    });
    id
}

// ── Line classifiers ────────────────────────────────────────────────────────

fn is_class_line(line: &str) -> bool {
    (line.contains("class ") && !line.starts_with("//"))
        && line.contains('{')
        && !line.contains("=>")
}

fn is_getter_line(line: &str) -> bool {
    let t = line.trim();
    (t.starts_with("get ") || t.starts_with("static get "))
        && t.contains('(') && t.contains(')') && t.contains('{')
}

fn is_setter_line(line: &str) -> bool {
    let t = line.trim();
    (t.starts_with("set ") || t.starts_with("static set "))
        && t.contains('(') && t.contains(')') && t.contains('{')
}

fn is_constructor_line(line: &str) -> bool {
    let t = line.trim();
    t.starts_with("constructor(") && t.contains(')') && t.contains('{')
}

fn is_async_func_line(line: &str) -> bool {
    (line.contains("async function ") || line.starts_with("export async function "))
        && line.contains('{')
}

fn is_func_decl_line(line: &str) -> bool {
    let stripped = line.trim();
    (stripped.starts_with("function ")
        || stripped.starts_with("export function ")
        || stripped.starts_with("export default function"))
        && stripped.contains('{')
}

fn is_arrow_or_const(line: &str) -> bool {
    let t = line.trim();
    (t.starts_with("const ") || t.starts_with("let ") || t.starts_with("var ")
        || t.starts_with("export const ") || t.starts_with("export let "))
        && (t.contains("=>") || t.contains("= function"))
}

fn is_class_method_line(line: &str) -> bool {
    let t = line.trim();
    t.contains('(') && t.contains(')') && t.contains('{')
        && !t.starts_with("//") && !t.starts_with("/*")
        && !t.contains("class ") && !t.contains("=>")
        && !t.starts_with("if") && !t.starts_with("for") && !t.starts_with("while")
        && !t.starts_with("switch") && !t.starts_with("catch")
}

// ── Name extractors ─────────────────────────────────────────────────────────

fn extract_import_module(line: &str) -> String {
    if let Some(pos) = line.find(" from ") {
        let after = &line[pos + 6..];
        return after.trim().trim_matches(';').trim_matches('\'').trim_matches('"').to_string();
    }
    line.trim_start_matches("import ").trim().trim_matches(';').trim_matches('\'').trim_matches('"').to_string()
}

fn extract_class_name(line: &str) -> String {
    if let Some(pos) = line.find("class ") {
        let after = &line[pos + 6..];
        let end = after.find(|c: char| c == ' ' || c == '{' || c == '<').unwrap_or(after.len());
        after[..end].trim().to_string()
    } else {
        String::new()
    }
}

fn extract_accessor_name(line: &str, prefix: &str) -> String {
    let t = line.trim().trim_start_matches("static ");
    let pat = format!("{} ", prefix);
    if let Some(pos) = t.find(&pat) {
        let after = &t[pos + pat.len()..];
        let end = after.find(|c: char| c == '(' || c == ' ').unwrap_or(after.len());
        after[..end].trim().to_string()
    } else {
        String::new()
    }
}

fn extract_method_name(line: &str) -> String {
    let t = line.trim()
        .trim_start_matches("async ")
        .trim_start_matches("static ")
        .trim_start_matches('#');
    let end = t.find(|c: char| c == '(' || c == ' ').unwrap_or(t.len());
    let name = t[..end].trim().to_string();
    if is_js_keyword(&name) { String::new() } else { name }
}

fn extract_func_name(line: &str) -> String {
    let t = line.trim()
        .trim_start_matches("export default ")
        .trim_start_matches("export ")
        .trim_start_matches("async ")
        .trim_start_matches("function ");
    let end = t.find(|c: char| c == '(' || c == ' ').unwrap_or(t.len());
    t[..end].trim().to_string()
}

fn extract_const_name(line: &str) -> String {
    let t = line.trim()
        .trim_start_matches("export default ")
        .trim_start_matches("export ")
        .trim_start_matches("const ")
        .trim_start_matches("let ")
        .trim_start_matches("var ");
    let end = t.find(|c: char| c == ' ' || c == '=').unwrap_or(t.len());
    t[..end].trim().to_string()
}

// ── Brace matching ──────────────────────────────────────────────────────────

fn find_brace_end(lines: &[&str], start: usize) -> Option<usize> {
    let mut depth = 0i32;
    let mut found = false;
    for (idx, line) in lines.iter().enumerate().skip(start) {
        for ch in line.chars() {
            if ch == '{' { depth += 1; found = true; }
            else if ch == '}' {
                depth -= 1;
                if found && depth == 0 { return Some(idx); }
            }
        }
        if idx > start + 300 { break; }
    }
    None
}

/// Find the end of an arrow function. Returns (end_line, ends_with_semicolon)
fn find_arrow_end(lines: &[&str], start: usize) -> (usize, bool) {
    let line = lines[start];
    if line.contains("=> {") || (line.contains("=>") && line.trim_end().ends_with('{')) {
        let end = find_brace_end(lines, start).unwrap_or(start);
        let ends_semi = if end < lines.len() {
            let end_line = lines[end].trim();
            end_line.ends_with("};") || end_line == "};"
        } else {
            false
        };
        let same_line_semi = lines[end].trim().ends_with("};");
        return (end, ends_semi || same_line_semi);
    }
    let ends_semi = line.trim_end().ends_with(';');
    (start, ends_semi)
}

fn collect_refs(lines: &[&str], start: usize, end: usize) -> Vec<String> {
    let mut refs = HashSet::new();
    if start >= lines.len() { return Vec::new(); }
    let end = end.min(lines.len().saturating_sub(1));
    if end < start { return Vec::new(); }
    for line in lines.iter().skip(start).take(end - start + 1) {
        let chars: Vec<char> = line.chars().collect();
        let mut i = 0;
        while i < chars.len() {
            if chars[i].is_alphabetic() || chars[i] == '_' || chars[i] == '$' {
                let s = i;
                while i < chars.len() && (chars[i].is_alphanumeric() || chars[i] == '_' || chars[i] == '$') { i += 1; }
                let word: String = chars[s..i].iter().collect();
                if word.len() > 1 && !is_js_keyword(&word) {
                    refs.insert(word);
                }
            } else {
                i += 1;
            }
        }
    }
    refs.into_iter().collect()
}

fn is_js_keyword(s: &str) -> bool {
    matches!(s, "const" | "let" | "var" | "function" | "class" | "return" | "if" | "else"
        | "for" | "while" | "do" | "switch" | "case" | "break" | "continue"
        | "new" | "this" | "super" | "import" | "export" | "default" | "from"
        | "async" | "await" | "try" | "catch" | "finally" | "throw" | "typeof"
        | "instanceof" | "in" | "of" | "null" | "undefined" | "true" | "false"
        | "static" | "get" | "set" | "extends" | "constructor" | "void"
        | "delete" | "yield" | "debugger" | "with"
    )
}

fn split_camel(name: &str) -> Vec<String> {
    let mut tokens = Vec::new();
    let mut cur = String::new();
    for ch in name.chars() {
        if ch.is_uppercase() && !cur.is_empty() {
            tokens.push(cur.to_lowercase());
            cur = ch.to_lowercase().to_string();
        } else if ch.is_alphanumeric() {
            cur.push(ch.to_lowercase().next().unwrap_or(ch));
        } else {
            if !cur.is_empty() { tokens.push(cur.to_lowercase()); cur.clear(); }
        }
    }
    if !cur.is_empty() { tokens.push(cur.to_lowercase()); }
    tokens
}

fn extract_calls(line: &str, caller: &str, line_number: usize, calls: &mut Vec<ExtractedCall>) {
    let chars: Vec<char> = line.chars().collect();
    let mut i = 0;
    while i < chars.len() {
        if chars[i].is_alphabetic() || chars[i] == '_' || chars[i] == '$' {
            let s = i;
            while i < chars.len() && (chars[i].is_alphanumeric() || chars[i] == '_' || chars[i] == '$') { i += 1; }
            if i < chars.len() && chars[i] == '(' {
                let callee: String = chars[s..i].iter().collect();
                if !is_js_keyword(&callee) && callee != caller && callee.len() > 1 {
                    calls.push(ExtractedCall {
                        caller_name: Some(caller.to_string()),
                        callee_name: callee,
                        line_number,
                    });
                }
            }
        } else {
            i += 1;
        }
    }
}
