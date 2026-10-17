//! JavaScript / JSX language pruning engine — production-ready
//!
//! Design decisions driven by test expectations:
//! - Imports always kept
//! - Matched functions/arrows: full body preserved
//! - Unmatched functions: stubbed as `function name() {}`
//! - Unmatched arrows: stubbed as `export const name = (...) => {};`
//! - Unmatched class methods: stubbed as `name() {}`
//! - Constructor: stubbed when class kept but constructor unmatched
//! - Zero-match: skeleton (all stubbed, class body = `class X {}`)
//! - Multi-hop dependency closure via body reference scanning
//! - Getter/setter companion pairing
//! - JSDoc extraction for indexing
//! - Nested function indexing with parent_name
//! - Call graph extraction

use crate::{
    count_tokens,
    indexer::{ExtractedCall, ExtractedImport, ExtractedSymbol, FileIndexResult},
    PruneResult,
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
    /// Identifiers referenced in body (for dependency closure)
    body_refs: Vec<String>,
    /// Whether the original code ends with ; (for arrow stubs)
    ends_with_semi: bool,
}

// ── Public API ──────────────────────────────────────────────────────────────

pub fn prune_file(code_text: &str, focus_query: &str, threshold: f64) -> PruneResult {
    let start = std::time::Instant::now();
    if code_text.trim().is_empty() {
        return empty_result(start);
    }
    let total_lines = code_text.lines().count();
    let original_tokens = count_tokens(code_text);
    let lines: Vec<&str> = code_text.lines().collect();
    let scopes = extract_scopes(&lines);

    let query_tokens: Vec<String> = focus_query
        .split_whitespace()
        .flat_map(|s| split_camel(s))
        .map(|s| s.to_lowercase())
        .collect();

    let kept_ids = score_and_expand(&scopes, &query_tokens, threshold);
    let pruned_code = reconstruct(&lines, &scopes, &kept_ids, &query_tokens);

    let elapsed = start.elapsed().as_secs_f64() * 1000.0;
    let pruned_tokens = count_tokens(&pruned_code);
    let kept_lines = pruned_code.lines().count();
    let savings_pct = if original_tokens > 0 {
        ((original_tokens.saturating_sub(pruned_tokens)) as f64 / original_tokens as f64) * 100.0
    } else { 0.0 };

    PruneResult {
        pruned_code, original_tokens, pruned_tokens, savings_pct,
        total_lines, kept_lines, latency_ms: elapsed, has_syntax_error: false,
    }
}

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
                    name: None, alias: None,
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
        symbols, imports, calls,
        total_lines: lines.len(),
        total_tokens: count_tokens(code_text),
        has_syntax_error: false,
    }
}

// ── Scope extraction ────────────────────────────────────────────────────────

fn extract_scopes(lines: &[&str]) -> Vec<Scope> {
    let mut scopes: Vec<Scope> = Vec::new();
    let mut next_id = 0usize;
    // Stack of (scope_id, end_line) for container types (classes, outer functions)
    let mut class_stack: Vec<(usize, usize)> = Vec::new();
    // Stack for tracking nested function parents
    let mut func_stack: Vec<(usize, usize)> = Vec::new();
    let mut pending_doc: Option<String> = None;

    let mut i = 0;
    while i < lines.len() {
        // Pop stacks
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
            let parent = class_parent; // nested class support
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
                let end = find_brace_end(lines, i).unwrap_or(i);
                push_scope(&mut scopes, &mut next_id, Kind::Method, &name, trimmed, i, end, class_parent, pending_doc.take(), &[], false);
                i += 1; continue;
            }
        }

        // ── Top-level or nested functions (not in class) ──
        // Arrow / const function
        if is_arrow_or_const(trimmed) && class_stack.is_empty() {
            let name = extract_const_name(trimmed);
            let (end, ends_semi) = find_arrow_end(lines, i);
            let body_refs = collect_refs(lines, i, end);
            let parent = func_parent;
            let sid = push_scope(&mut scopes, &mut next_id, Kind::ArrowFunction, &name, trimmed, i, end, parent, pending_doc.take(), &body_refs, ends_semi);
            // Don't push to func_stack since arrow functions don't typically contain named functions
            let _ = sid;
            i += 1; continue;
        }

        // export default arrow: `export default (x, y) => {`
        if (trimmed.starts_with("export default (") || trimmed.starts_with("export default async ("))
            && trimmed.contains("=>")
        {
            let name = "default".to_string();
            let (end, ends_semi) = find_arrow_end(lines, i);
            let body_refs = collect_refs(lines, i, end);
            let sid = push_scope(&mut scopes, &mut next_id, Kind::ArrowFunction, &name, trimmed, i, end, None, pending_doc.take(), &body_refs, ends_semi);
            let _ = sid;
            i += 1; continue;
        }

        // Async function
        if is_async_func_line(trimmed) && class_stack.is_empty() {
            let name = extract_func_name(trimmed);
            let end = find_brace_end(lines, i).unwrap_or(i);
            let body_refs = collect_refs(lines, i + 1, end.saturating_sub(1));
            let parent = func_parent;
            let sid = push_scope(&mut scopes, &mut next_id, Kind::AsyncFunction, &name, trimmed, i, end, parent, pending_doc.take(), &body_refs, false);
            func_stack.push((sid, end));
            i += 1; continue;
        }

        // Regular function
        if is_func_decl_line(trimmed) && class_stack.is_empty() {
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

// ── Scoring & expansion ─────────────────────────────────────────────────────

fn score_and_expand(scopes: &[Scope], query_tokens: &[String], threshold: f64) -> HashSet<usize> {
    let mut kept: HashSet<usize> = HashSet::new();

    // Always keep imports
    for s in scopes {
        if s.kind == Kind::Import { kept.insert(s.id); }
    }
    if query_tokens.is_empty() { return kept; }

    // Phase 1: semantic scoring
    let mut semantic: HashSet<usize> = HashSet::new();
    for s in scopes {
        if jaccard(&s.tokens, query_tokens) >= threshold {
            semantic.insert(s.id);
        }
    }

    // Phase 2: zero-match → skeleton
    if semantic.is_empty() {
        for s in scopes { kept.insert(s.id); }
        return kept;
    }

    // Phase 3: add semantic matches
    for &id in &semantic { kept.insert(id); }

    // Phase 4: enclosing classes
    add_ancestors(scopes, &mut kept);

    // Phase 5: multi-hop dependency closure
    let name_to_ids: HashMap<&str, Vec<usize>> = {
        let mut m: HashMap<&str, Vec<usize>> = HashMap::new();
        for s in scopes {
            if !matches!(s.kind, Kind::Import) {
                m.entry(s.name.as_str()).or_default().push(s.id);
            }
        }
        m
    };

    let mut changed = true;
    while changed {
        changed = false;
        let snap: Vec<usize> = kept.iter().copied().collect();
        for &kid in &snap {
            let Some(scope) = scopes.iter().find(|s| s.id == kid) else { continue };
            for refname in &scope.body_refs {
                if let Some(ids) = name_to_ids.get(refname.as_str()) {
                    for &rid in ids {
                        if !kept.contains(&rid) {
                            kept.insert(rid);
                            changed = true;
                        }
                    }
                }
            }
        }
    }

    // Phase 6: getter/setter companion pairing
    let mut companions: Vec<usize> = Vec::new();
    for s in scopes {
        if !kept.contains(&s.id) { continue; }
        if !matches!(s.kind, Kind::Getter | Kind::Setter | Kind::Method) { continue; }
        let prop = accessor_property(&s.name, s.kind);
        let Some(prop) = prop else { continue };
        for other in scopes {
            if other.id == s.id || other.parent_id != s.parent_id { continue; }
            if !matches!(other.kind, Kind::Getter | Kind::Setter | Kind::Method) { continue; }
            if accessor_property(&other.name, other.kind).as_deref() == Some(&prop) {
                companions.push(other.id);
            }
        }
    }
    for id in companions { kept.insert(id); }

    // Re-add ancestors
    add_ancestors(scopes, &mut kept);

    kept
}

fn add_ancestors(scopes: &[Scope], kept: &mut HashSet<usize>) {
    let mut to_add: Vec<usize> = Vec::new();
    for s in scopes {
        if !kept.contains(&s.id) { continue; }
        let mut cur = s.parent_id;
        while let Some(pid) = cur {
            to_add.push(pid);
            cur = scopes.iter().find(|x| x.id == pid).and_then(|x| x.parent_id);
        }
    }
    for id in to_add { kept.insert(id); }
}

fn accessor_property(name: &str, kind: Kind) -> Option<String> {
    if kind == Kind::Getter || kind == Kind::Setter {
        return Some(name.to_lowercase());
    }
    let lc = name.to_lowercase();
    if lc.starts_with("get") && lc.len() > 3 { return Some(lc[3..].to_string()); }
    if lc.starts_with("set") && lc.len() > 3 { return Some(lc[3..].to_string()); }
    if lc.starts_with("is") && lc.len() > 2 { return Some(lc[2..].to_string()); }
    None
}

fn jaccard(scope_tokens: &[String], query_tokens: &[String]) -> f64 {
    if scope_tokens.is_empty() || query_tokens.is_empty() { return 0.0; }
    let hits = query_tokens.iter()
        .filter(|qt| scope_tokens.iter().any(|t| t == *qt || t.contains(qt.as_str()) || qt.contains(t.as_str())))
        .count();
    hits as f64 / query_tokens.len().max(1) as f64
}

// ── Reconstruction ──────────────────────────────────────────────────────────

fn reconstruct(lines: &[&str], scopes: &[Scope], kept: &HashSet<usize>, query_tokens: &[String]) -> String {
    let mut out = String::new();
    let mut used = vec![false; lines.len()];
    let scope_map: HashMap<usize, &Scope> = scopes.iter().map(|s| (s.id, s)).collect();

    let mut children: HashMap<usize, Vec<usize>> = HashMap::new();
    for s in scopes {
        if let Some(pid) = s.parent_id {
            children.entry(pid).or_default().push(s.id);
        }
    }

    // Skeleton mode: all callable scopes in kept = zero-match
    let callable_count = scopes.iter()
        .filter(|s| matches!(s.kind, Kind::Function | Kind::AsyncFunction | Kind::ArrowFunction
            | Kind::Method | Kind::AsyncMethod | Kind::Getter | Kind::Setter | Kind::Constructor))
        .count();
    let is_skeleton = !query_tokens.is_empty()
        && callable_count > 0
        && scopes.iter()
            .filter(|s| matches!(s.kind, Kind::Function | Kind::AsyncFunction | Kind::ArrowFunction
                | Kind::Method | Kind::AsyncMethod | Kind::Getter | Kind::Setter | Kind::Constructor))
            .all(|s| kept.contains(&s.id));

    // 1. Imports
    for s in scopes {
        if s.kind == Kind::Import && kept.contains(&s.id) {
            emit_lines(&mut out, &mut used, lines, s.start_line, s.end_line);
        }
    }

    // 2. Top-level scopes (parent_id == None, not Import)
    let top_level: Vec<&Scope> = scopes.iter()
        .filter(|s| s.parent_id.is_none() && s.kind != Kind::Import)
        .collect();

    for scope in &top_level {
        match scope.kind {
            Kind::Class => {
                if !kept.contains(&scope.id) { continue; }
                if is_skeleton {
                    // Zero-match: class stub with no body
                    let sig = scope.signature.trim();
                    let base = if let Some(p) = sig.find('{') { sig[..p].trim_end() } else { sig };
                    out.push_str(&format!("{} {{}}\n", base));
                    mark_used(&mut used, scope.start_line, scope.end_line);
                } else {
                    emit_class(&mut out, &mut used, lines, scope, &children, &scope_map, kept, is_skeleton);
                }
            }
            Kind::Function | Kind::AsyncFunction => {
                if kept.contains(&scope.id) && !is_skeleton {
                    emit_lines(&mut out, &mut used, lines, scope.start_line, scope.end_line);
                } else {
                    // Stub
                    let stub = stub_function(scope);
                    out.push_str(&stub);
                    out.push('\n');
                    mark_used(&mut used, scope.start_line, scope.end_line);
                }
            }
            Kind::ArrowFunction => {
                if kept.contains(&scope.id) && !is_skeleton {
                    emit_lines(&mut out, &mut used, lines, scope.start_line, scope.end_line);
                } else {
                    let stub = stub_arrow(scope);
                    out.push_str(&stub);
                    out.push('\n');
                    mark_used(&mut used, scope.start_line, scope.end_line);
                }
            }
            _ => {}
        }
    }

    let result = out.trim_end().to_string();
    if result.is_empty() { lines.join("\n") } else { result }
}

fn emit_class(
    out: &mut String, used: &mut [bool], lines: &[&str],
    cls: &Scope, children: &HashMap<usize, Vec<usize>>,
    scope_map: &HashMap<usize, &Scope>, kept: &HashSet<usize>, is_skeleton: bool,
) {
    // Class header
    emit_lines(out, used, lines, cls.start_line, cls.start_line);

    if let Some(child_ids) = children.get(&cls.id) {
        let mut sorted: Vec<&Scope> = child_ids.iter()
            .filter_map(|id| scope_map.get(id).copied())
            .collect();
        sorted.sort_by_key(|s| s.start_line);

        for member in &sorted {
            if kept.contains(&member.id) && !is_skeleton {
                // Check if this member should be kept full or stubbed
                // Constructor is always stubbed unless semantically matched
                emit_lines(out, used, lines, member.start_line, member.end_line);
            } else {
                // Stub
                let stub = stub_method(member);
                out.push_str("    ");
                out.push_str(&stub);
                out.push('\n');
                mark_used(used, member.start_line, member.end_line);
            }
        }
    }

    // Closing brace
    if cls.end_line < lines.len() {
        emit_lines(out, used, lines, cls.end_line, cls.end_line);
    }
}

fn stub_function(s: &Scope) -> String {
    let sig = s.signature.trim();
    let base = if let Some(p) = sig.find('{') { sig[..p].trim_end() } else { sig };
    format!("{} {{}}", base)
}

fn stub_arrow(s: &Scope) -> String {
    let sig = s.signature.trim();
    if let Some(arrow_pos) = sig.find("=>") {
        let before_arrow = &sig[..arrow_pos + 2];
        let has_semi = sig.ends_with(';') || s.ends_with_semi;
        if has_semi {
            format!("{} {{}};", before_arrow.trim_end())
        } else {
            format!("{} {{}}", before_arrow.trim_end())
        }
    } else if let Some(p) = sig.find('{') {
        let base = sig[..p].trim_end();
        format!("{} {{}}", base)
    } else {
        format!("{} {{}}", sig)
    }
}

fn stub_method(s: &Scope) -> String {
    let sig = s.signature.trim();
    let base = if let Some(p) = sig.find('{') {
        sig[..p].trim_end()
    } else if let Some(p) = sig.find("=>") {
        &sig[..p + 2]
    } else {
        sig
    };
    format!("{} {{}}", base)
}

fn emit_lines(out: &mut String, used: &mut [bool], lines: &[&str], start: usize, end: usize) {
    let end = end.min(lines.len().saturating_sub(1));
    for i in start..=end {
        if !used[i] {
            out.push_str(lines[i]);
            out.push('\n');
            used[i] = true;
        }
    }
}

fn mark_used(used: &mut [bool], start: usize, end: usize) {
    for i in start..=end.min(used.len().saturating_sub(1)) { used[i] = true; }
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
    // Block body: contains => {
    if line.contains("=> {") || (line.contains("=>") && line.trim_end().ends_with('{')) {
        let end = find_brace_end(lines, start).unwrap_or(start);
        // Check if line after closing brace has ;
        let ends_semi = if end < lines.len() {
            let end_line = lines[end].trim();
            end_line.ends_with("};") || end_line == "};"
        } else {
            false
        };
        // Also check if the actual end_line (the }) is followed by ; on same line
        let same_line_semi = lines[end].trim().ends_with("};");
        return (end, ends_semi || same_line_semi);
    }
    // Concise body on one line
    let ends_semi = line.trim_end().ends_with(';');
    (start, ends_semi)
}

/// Collect identifiers in body for dependency closure
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

fn empty_result(start: std::time::Instant) -> PruneResult {
    PruneResult {
        pruned_code: String::new(),
        original_tokens: 0, pruned_tokens: 0,
        savings_pct: 0.0, total_lines: 0, kept_lines: 0,
        latency_ms: start.elapsed().as_secs_f64() * 1000.0,
        has_syntax_error: false,
    }
}
