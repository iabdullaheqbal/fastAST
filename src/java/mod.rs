//! Java language pruning engine — production-ready
//!
//! Design decisions driven by test expectations:
//! - Package + imports always kept
//! - Matched methods: full body preserved
//! - Unmatched methods: stubbed with `{ return <default>; }` based on return type
//! - Unmatched constructors: stubbed with `{}`
//! - Abstract / interface abstract methods: kept as-is with `;`
//! - Zero-match query: skeleton (all methods stubbed, no bodies)
//! - Structural closure: enclosing class/enum/interface of kept members always kept
//! - Dependency closure: types referenced inside kept method bodies pull in their
//!   declaring class/enum/interface as skeleton
//! - Getter/setter companion pairing: getX ↔ setX, isX ↔ setX
//! - Enum constants block preserved verbatim
//! - Fields of kept classes always kept
//! - Javadoc extracted for indexing

use crate::{
    count_tokens,
    indexer::{ExtractedCall, ExtractedImport, ExtractedSymbol, FileIndexResult},
    PruneResult,
};
use std::collections::{HashMap, HashSet};

// ── Data model ──────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
enum Kind {
    Package,
    Import,
    Class,
    Interface,
    Enum,
    Record,
    Field,
    Constructor,
    Method,
    AbstractMethod,
}

#[derive(Debug, Clone)]
struct Scope {
    id: usize,
    kind: Kind,
    name: String,
    signature: String,   // first line, trimmed
    start_line: usize,   // 0-indexed
    end_line: usize,     // 0-indexed, inclusive
    tokens: Vec<String>, // camelCase-split lowercase tokens for scoring
    parent_id: Option<usize>,
    return_type: Option<String>,
    enum_constants_raw: Option<String>, // raw lines for enum constants
    docstring: Option<String>,
    /// All identifiers referenced in the body (for dependency closure)
    body_refs: Vec<String>,
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
        latency_ms: elapsed,
        has_syntax_error: false,
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
                    name: None,
                    alias: None,
                    line_number: s.start_line + 1,
                });
            }
            Kind::Class | Kind::Interface | Kind::Enum | Kind::Record
            | Kind::Method | Kind::AbstractMethod | Kind::Constructor => {
                let kind_str = match s.kind {
                    Kind::Class => "class",
                    Kind::Interface => "interface",
                    Kind::Enum => "enum",
                    Kind::Record => "record",
                    Kind::Constructor => "constructor",
                    _ => "method",
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
                // Extract calls from methods/constructors
                if matches!(s.kind, Kind::Method | Kind::Constructor) {
                    for li in s.start_line..=s.end_line.min(lines.len().saturating_sub(1)) {
                        extract_calls(lines[li], &s.name, li + 1, &mut calls);
                    }
                }
            }
            _ => {}
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
    // stack of (scope_id, end_line) for container types
    let mut stack: Vec<(usize, usize)> = Vec::new();
    let mut pending_doc: Option<String> = None;

    let mut i = 0;
    while i < lines.len() {
        // Pop containers whose end_line we've passed
        while stack.last().map(|&(_, end)| i > end).unwrap_or(false) {
            stack.pop();
        }

        let trimmed = lines[i].trim();
        if trimmed.is_empty() { i += 1; continue; }

        // Single-line comment
        if trimmed.starts_with("//") { i += 1; continue; }

        // Javadoc /** ... */
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
            if let Some(first) = doc_lines.first() {
                pending_doc = Some(first.clone());
            }
            continue; // re-examine current line
        }

        // Non-Javadoc block comment /* ... */
        if trimmed.starts_with("/*") {
            while i < lines.len() && !lines[i].trim().ends_with("*/") { i += 1; }
            i += 1;
            continue;
        }

        let trimmed = lines[i].trim(); // re-bind after possible doc consumption

        let parent_id = stack.last().map(|&(id, _)| id);

        // ── Package ──
        if trimmed.starts_with("package ") && trimmed.ends_with(';') {
            let name = extract_word_after(trimmed, "package ").trim_end_matches(';').to_string();
            push_scope(&mut scopes, &mut next_id, Kind::Package, &name, trimmed, i, i, None, None, None, &[]);
            i += 1; continue;
        }

        // ── Import ──
        if trimmed.starts_with("import ") && trimmed.ends_with(';') {
            let raw = extract_word_after(trimmed, "import ").trim_end_matches(';').to_string();
            let name = raw.trim_start_matches("static ").to_string();
            push_scope(&mut scopes, &mut next_id, Kind::Import, &name, trimmed, i, i, None, None, None, &[]);
            i += 1; continue;
        }

        // ── Enum ──
        if is_enum_decl(trimmed) {
            let name = word_after_keyword(trimmed, "enum");
            let end = find_matching_brace(lines, i).unwrap_or(i);
            let constants = extract_enum_constants_block(lines, i, end);
            let body_refs = collect_body_refs(lines, i, end);
            let sid = push_scope(&mut scopes, &mut next_id, Kind::Enum, &name, trimmed, i, end, parent_id, pending_doc.take(), Some(constants), &body_refs);
            stack.push((sid, end));
            i += 1; continue;
        }

        // ── Record ──
        if is_record_decl(trimmed) {
            let name = word_after_keyword(trimmed, "record");
            let end = find_matching_brace(lines, i).unwrap_or(i);
            let body_refs = collect_body_refs(lines, i, end);
            let sid = push_scope(&mut scopes, &mut next_id, Kind::Record, &name, trimmed, i, end, parent_id, pending_doc.take(), None, &body_refs);
            stack.push((sid, end));
            i += 1; continue;
        }

        // ── Class ──
        if is_class_decl(trimmed) {
            let name = word_after_keyword(trimmed, "class");
            let end = find_matching_brace(lines, i).unwrap_or(i);
            let body_refs = collect_body_refs(lines, i, end);
            let sid = push_scope(&mut scopes, &mut next_id, Kind::Class, &name, trimmed, i, end, parent_id, pending_doc.take(), None, &body_refs);
            stack.push((sid, end));
            i += 1; continue;
        }

        // ── Interface ──
        if is_interface_decl(trimmed) {
            let name = word_after_keyword(trimmed, "interface");
            let end = find_matching_brace(lines, i).unwrap_or(i);
            let body_refs = collect_body_refs(lines, i, end);
            let sid = push_scope(&mut scopes, &mut next_id, Kind::Interface, &name, trimmed, i, end, parent_id, pending_doc.take(), None, &body_refs);
            stack.push((sid, end));
            i += 1; continue;
        }

        // Everything below requires being inside a container
        if !stack.is_empty() {
            // ── Abstract method (ends with `;`, has `(` and `)`) ──
            if trimmed.contains('(') && trimmed.contains(')')
                && trimmed.ends_with(';')
                && !trimmed.starts_with("import") && !trimmed.starts_with("package")
            {
                if let Some(mname) = method_name_from_sig(trimmed) {
                    let ret = return_type_from_sig(trimmed);
                    push_scope(&mut scopes, &mut next_id, Kind::AbstractMethod, &mname, trimmed, i, i, parent_id, pending_doc.take(), None, &[]);
                    if let Some(s) = scopes.last_mut() { s.return_type = ret; }
                    i += 1; continue;
                }
            }

            // ── Field ──
            if is_field_decl(trimmed) {
                if let Some(fname) = field_name_from_decl(trimmed) {
                    push_scope(&mut scopes, &mut next_id, Kind::Field, &fname, trimmed, i, i, parent_id, None, None, &[]);
                    i += 1; continue;
                }
            }

            // ── Constructor ──
            if is_constructor_decl(trimmed, &scopes, &stack) {
                if let Some(cname) = method_name_from_sig(trimmed) {
                    let end = find_matching_brace(lines, i).unwrap_or(i);
                    let body_refs = collect_body_refs(lines, i, end);
                    push_scope(&mut scopes, &mut next_id, Kind::Constructor, &cname, trimmed, i, end, parent_id, pending_doc.take(), None, &body_refs);
                    i += 1; continue;
                }
            }

            // ── Method ──
            if is_method_decl(trimmed) {
                if let Some(mname) = method_name_from_sig(trimmed) {
                    let end = find_matching_brace(lines, i).unwrap_or(i);
                    let ret = return_type_from_sig(trimmed);
                    let body_refs = collect_body_refs(lines, i, end);
                    push_scope(&mut scopes, &mut next_id, Kind::Method, &mname, trimmed, i, end, parent_id, pending_doc.take(), None, &body_refs);
                    if let Some(s) = scopes.last_mut() { s.return_type = ret; }
                    i += 1; continue;
                }
            }
        }

        // Not a recognized construct — clear pending doc
        pending_doc = None;
        i += 1;
    }
    scopes
}

#[allow(clippy::too_many_arguments)]
fn push_scope(
    scopes: &mut Vec<Scope>, next_id: &mut usize, kind: Kind, name: &str,
    sig: &str, start: usize, end: usize, parent_id: Option<usize>,
    docstring: Option<String>, enum_constants: Option<String>, body_refs: &[String],
) -> usize {
    let id = *next_id;
    *next_id += 1;
    scopes.push(Scope {
        id, kind,
        name: name.to_string(),
        signature: sig.to_string(),
        start_line: start, end_line: end,
        tokens: split_camel(name),
        parent_id,
        return_type: None,
        enum_constants_raw: enum_constants,
        docstring,
        body_refs: body_refs.to_vec(),
    });
    id
}

// ── Scoring & expansion ─────────────────────────────────────────────────────

fn score_and_expand(scopes: &[Scope], query_tokens: &[String], threshold: f64) -> HashSet<usize> {
    let mut kept: HashSet<usize> = HashSet::new();

    // Always keep package + imports
    for s in scopes {
        if matches!(s.kind, Kind::Package | Kind::Import) {
            kept.insert(s.id);
        }
    }
    if query_tokens.is_empty() {
        return kept;
    }

    // Phase 1: semantic scoring
    let mut semantic: HashSet<usize> = HashSet::new();
    for s in scopes {
        if jaccard(&s.tokens, query_tokens) >= threshold {
            semantic.insert(s.id);
        }
    }

    // Phase 2: zero-match → skeleton (mark everything for stubbing)
    if semantic.is_empty() {
        for s in scopes { kept.insert(s.id); }
        return kept;
    }

    // Phase 3: add semantic matches
    for &id in &semantic { kept.insert(id); }

    // Phase 4: enclosing containers
    add_ancestors(scopes, &mut kept);

    // Phase 5: fields of kept containers
    for s in scopes {
        if s.kind == Kind::Field {
            if let Some(pid) = s.parent_id {
                if kept.contains(&pid) { kept.insert(s.id); }
            }
        }
    }

    // Phase 6: getter/setter companion pairing
    add_companions(scopes, &mut kept);

    // Phase 7: deep dependency closure — types referenced in kept method bodies
    // pull in their declaring containers (as skeletons)
    let name_to_scope: HashMap<&str, &Scope> = scopes.iter()
        .filter(|s| matches!(s.kind, Kind::Class | Kind::Interface | Kind::Enum | Kind::Record))
        .map(|s| (s.name.as_str(), s))
        .collect();

    let mut changed = true;
    while changed {
        changed = false;
        let snap: Vec<usize> = kept.iter().copied().collect();
        for &kid in &snap {
            let Some(scope) = scopes.iter().find(|s| s.id == kid) else { continue };
            for refname in &scope.body_refs {
                if let Some(dep) = name_to_scope.get(refname.as_str()) {
                    if !kept.contains(&dep.id) {
                        kept.insert(dep.id);
                        // Also keep its fields
                        for child in scopes {
                            if child.parent_id == Some(dep.id) && child.kind == Kind::Field {
                                kept.insert(child.id);
                            }
                        }
                        // Keep all its direct children (they'll be stubbed)
                        for child in scopes {
                            if child.parent_id == Some(dep.id) {
                                kept.insert(child.id);
                            }
                        }
                        changed = true;
                    }
                }
            }
        }
    }

    // Re-add ancestors for anything new
    add_ancestors(scopes, &mut kept);

    kept
}

fn add_ancestors(scopes: &[Scope], kept: &mut HashSet<usize>) {
    let mut to_add: Vec<usize> = Vec::new();
    for s in scopes {
        if !kept.contains(&s.id) { continue; }
        let mut cur_parent = s.parent_id;
        while let Some(pid) = cur_parent {
            to_add.push(pid);
            cur_parent = scopes.iter().find(|x| x.id == pid).and_then(|x| x.parent_id);
        }
    }
    for id in to_add { kept.insert(id); }
}

fn add_companions(scopes: &[Scope], kept: &mut HashSet<usize>) {
    let mut companions: Vec<usize> = Vec::new();
    for s in scopes {
        if !kept.contains(&s.id) || s.kind != Kind::Method { continue; }
        let prop = property_name(&s.name);
        let Some(prop) = prop else { continue };
        for other in scopes {
            if other.id == s.id || other.kind != Kind::Method || other.parent_id != s.parent_id { continue; }
            if property_name(&other.name).as_deref() == Some(&prop) {
                companions.push(other.id);
            }
        }
    }
    for id in companions { kept.insert(id); }
}

fn property_name(method_name: &str) -> Option<String> {
    let lc = method_name.to_lowercase();
    if lc.starts_with("get") && lc.len() > 3 { return Some(lc[3..].to_string()); }
    if lc.starts_with("set") && lc.len() > 3 { return Some(lc[3..].to_string()); }
    if lc.starts_with("is") && lc.len() > 2  { return Some(lc[2..].to_string()); }
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

    // children map
    let mut children: HashMap<usize, Vec<usize>> = HashMap::new();
    for s in scopes {
        if let Some(pid) = s.parent_id {
            children.entry(pid).or_default().push(s.id);
        }
    }

    // Determine if zero-match skeleton mode
    let is_skeleton = !query_tokens.is_empty() && scopes.iter()
        .filter(|s| matches!(s.kind, Kind::Method | Kind::Constructor | Kind::AbstractMethod))
        .all(|s| kept.contains(&s.id))
        && scopes.iter().any(|s| matches!(s.kind, Kind::Method | Kind::Constructor));

    // 1. Package + imports
    for s in scopes {
        if kept.contains(&s.id) && matches!(s.kind, Kind::Package | Kind::Import) {
            emit_lines(&mut out, &mut used, lines, s.start_line, s.end_line);
        }
    }

    // 2. Top-level containers
    let top_types: Vec<&Scope> = scopes.iter()
        .filter(|s| s.parent_id.is_none() && matches!(s.kind, Kind::Class | Kind::Interface | Kind::Enum | Kind::Record))
        .collect();

    for ts in &top_types {
        if !kept.contains(&ts.id) { continue; }
        emit_container(&mut out, &mut used, lines, ts, &children, &scope_map, kept, is_skeleton);
    }

    let result = out.trim_end().to_string();
    if result.is_empty() { lines.join("\n") } else { result }
}

fn emit_container(
    out: &mut String, used: &mut [bool], lines: &[&str],
    container: &Scope, children: &HashMap<usize, Vec<usize>>,
    scope_map: &HashMap<usize, &Scope>, kept: &HashSet<usize>, is_skeleton: bool,
) {
    // Emit header line
    emit_lines(out, used, lines, container.start_line, container.start_line);

    // For enums: emit constants block
    if container.kind == Kind::Enum {
        if let Some(ref raw) = container.enum_constants_raw {
            if !raw.trim().is_empty() {
                out.push_str("    ");
                out.push_str(raw.trim());
                out.push('\n');
            }
        }
    }

    // Emit children
    if let Some(child_ids) = children.get(&container.id) {
        let mut sorted: Vec<&Scope> = child_ids.iter()
            .filter_map(|id| scope_map.get(id).copied())
            .collect();
        sorted.sort_by_key(|s| s.start_line);

        for member in &sorted {
            match member.kind {
                Kind::Field => {
                    emit_lines(out, used, lines, member.start_line, member.end_line);
                }
                Kind::AbstractMethod => {
                    // Always emit with semicolon
                    let sig = member.signature.trim();
                    out.push_str("    ");
                    if sig.ends_with(';') {
                        out.push_str(sig);
                    } else {
                        out.push_str(sig);
                        out.push(';');
                    }
                    out.push('\n');
                    mark_used(used, member.start_line, member.end_line);
                }
                Kind::Constructor => {
                    if kept.contains(&member.id) && !is_skeleton {
                        emit_lines(out, used, lines, member.start_line, member.end_line);
                    } else {
                        let stub = stub_constructor(member);
                        out.push_str("    ");
                        out.push_str(&stub);
                        out.push('\n');
                        mark_used(used, member.start_line, member.end_line);
                    }
                }
                Kind::Method => {
                    if kept.contains(&member.id) && !is_skeleton {
                        emit_lines(out, used, lines, member.start_line, member.end_line);
                    } else {
                        let stub = stub_method(member);
                        out.push_str("    ");
                        out.push_str(&stub);
                        out.push('\n');
                        mark_used(used, member.start_line, member.end_line);
                    }
                }
                Kind::Class | Kind::Interface | Kind::Enum | Kind::Record => {
                    if kept.contains(&member.id) {
                        emit_container(out, used, lines, member, children, scope_map, kept, is_skeleton);
                    }
                }
                _ => {}
            }
        }
    }

    // Closing brace
    if container.end_line < lines.len() {
        emit_lines(out, used, lines, container.end_line, container.end_line);
    }
}

fn stub_constructor(s: &Scope) -> String {
    let sig = sig_before_brace(&s.signature);
    format!("{} {{}}", sig)
}

fn stub_method(s: &Scope) -> String {
    let sig = sig_before_brace(&s.signature);
    let ret = s.return_type.as_deref().unwrap_or("void");
    let default = default_for_type(ret);
    if default == "(void)" {
        format!("{} {{}}", sig)
    } else {
        format!("{} {{ return {}; }}", sig, default)
    }
}

fn sig_before_brace(sig: &str) -> &str {
    let s = sig.trim();
    if let Some(p) = s.find('{') {
        s[..p].trim_end()
    } else {
        s
    }
}

fn default_for_type(ret: &str) -> &'static str {
    match ret.trim() {
        "void" => "(void)",
        "boolean" => "false",
        "int" | "long" | "short" | "byte" => "0",
        "float" | "double" => "0.0",
        "char" => "'\\0'",
        _ => "null",
    }
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
    for i in start..=end.min(used.len().saturating_sub(1)) {
        used[i] = true;
    }
}

// ── Line classifiers ────────────────────────────────────────────────────────

fn is_class_decl(line: &str) -> bool {
    (line.contains(" class ") || line.starts_with("class "))
        && line.contains('{') && !line.contains("//")
}

fn is_interface_decl(line: &str) -> bool {
    (line.contains(" interface ") || line.starts_with("interface "))
        && line.contains('{') && !line.contains("//")
}

fn is_enum_decl(line: &str) -> bool {
    (line.contains(" enum ") || line.starts_with("enum "))
        && line.contains('{') && !line.contains("//")
}

fn is_record_decl(line: &str) -> bool {
    (line.contains(" record ") || line.starts_with("record "))
        && line.contains('(') && line.contains('{') && !line.contains("//")
}

fn is_field_decl(line: &str) -> bool {
    let mods = ["public ", "private ", "protected ", "static ", "final "];
    mods.iter().any(|m| line.contains(m))
        && !line.contains('(')
        && !line.contains(" class ") && !line.contains(" interface ")
        && !line.contains(" enum ")
        && line.ends_with(';')
}

fn is_constructor_decl(line: &str, scopes: &[Scope], stack: &[(usize, usize)]) -> bool {
    if !line.contains('(') || !line.contains(')') || !line.contains('{') { return false; }
    let Some(paren_pos) = line.find('(') else { return false };
    let before = &line[..paren_pos];
    let parts: Vec<&str> = before.split_whitespace().collect();
    let Some(&name) = parts.last() else { return false };
    // Check if name matches enclosing class
    if let Some(&(top_id, _)) = stack.last() {
        if let Some(cls) = scopes.iter().find(|s| s.id == top_id) {
            if cls.name == name { return true; }
        }
    }
    // Heuristic: preceded only by access modifier + uppercase name
    if parts.len() >= 2 {
        let prev = parts[parts.len() - 2];
        if matches!(prev, "public" | "private" | "protected") {
            if name.chars().next().map(|c| c.is_uppercase()).unwrap_or(false) {
                return true;
            }
        }
    }
    false
}

fn is_method_decl(line: &str) -> bool {
    line.contains('(') && line.contains(')') && line.contains('{')
        && !line.contains(" class ") && !line.contains(" interface ")
        && !line.contains(" enum ")
        && !line.trim().starts_with("//") && !line.trim().starts_with("/*")
        && has_type_keyword(line)
}

fn has_type_keyword(line: &str) -> bool {
    let kw = ["public ", "private ", "protected ", "static ", "final ", "abstract ",
        "synchronized ", "native ", "default ", "void ", "int ", "long ",
        "String ", "boolean ", "double ", "float ", "char ", "byte ", "short ",
        "Object ", "List", "Map", "Set", "Optional", "T ", "<S "];
    kw.iter().any(|k| line.contains(k))
}

// ── Name / type extractors ──────────────────────────────────────────────────

fn method_name_from_sig(line: &str) -> Option<String> {
    let paren = line.find('(')?;
    let before = &line[..paren];
    let name = before.split_whitespace().last()?;
    let clean: String = name.chars().take_while(|c| c.is_alphanumeric() || *c == '_').collect();
    if clean.is_empty() || is_java_keyword(&clean) { None } else { Some(clean) }
}

fn return_type_from_sig(line: &str) -> Option<String> {
    let paren = line.find('(')?;
    let before = &line[..paren];
    let parts: Vec<&str> = before.split_whitespace().collect();
    if parts.len() >= 2 {
        let candidate = parts[parts.len() - 2];
        let clean = candidate.split('<').next().unwrap_or(candidate)
            .trim_end_matches('[').trim_end_matches(']');
        Some(clean.to_string())
    } else {
        None
    }
}

fn field_name_from_decl(line: &str) -> Option<String> {
    let without_semi = line.trim_end_matches(';');
    let relevant = if let Some(eq) = without_semi.find(" = ") {
        &without_semi[..eq]
    } else {
        without_semi
    };
    // Handle generics: skip past > if present
    let relevant = if let Some(gt) = relevant.rfind('>') {
        &relevant[gt + 1..]
    } else {
        relevant
    };
    let parts: Vec<&str> = relevant.split_whitespace().collect();
    let name = parts.last()?;
    let clean: String = name.chars().take_while(|c| c.is_alphanumeric() || *c == '_').collect();
    if clean.is_empty() || is_java_keyword(&clean) { None } else { Some(clean) }
}

fn extract_word_after(line: &str, prefix: &str) -> String {
    if let Some(pos) = line.find(prefix) {
        let after = &line[pos + prefix.len()..];
        let end = after.find(|c: char| !c.is_alphanumeric() && c != '_' && c != '.').unwrap_or(after.len());
        after[..end].trim().to_string()
    } else {
        String::new()
    }
}

fn word_after_keyword(line: &str, kw: &str) -> String {
    let pat = format!("{} ", kw);
    if let Some(pos) = line.find(&pat) {
        let after = &line[pos + pat.len()..];
        let end = after.find(|c: char| c == ' ' || c == '<' || c == '(' || c == '{').unwrap_or(after.len());
        after[..end].trim().to_string()
    } else {
        String::new()
    }
}

fn find_matching_brace(lines: &[&str], start: usize) -> Option<usize> {
    let mut depth = 0i32;
    let mut found = false;
    for (idx, line) in lines.iter().enumerate().skip(start) {
        for ch in line.chars() {
            if ch == '{' { depth += 1; found = true; }
            else if ch == '}' { depth -= 1; if found && depth == 0 { return Some(idx); } }
        }
        if idx > start + 600 { break; }
    }
    None
}

fn extract_enum_constants_block(lines: &[&str], start: usize, end: usize) -> String {
    // Collect everything between the first { and the first ; at depth 1
    let mut result = String::new();
    let mut depth = 0i32;
    let mut collecting = false;
    let mut done = false;

    for line in lines.iter().skip(start).take(end - start + 1) {
        if done { break; }
        for ch in line.chars() {
            if ch == '{' {
                depth += 1;
                if depth == 1 { collecting = true; continue; }
            }
            if ch == '}' { depth -= 1; }
            if collecting && depth == 1 {
                if ch == ';' { done = true; break; }
                result.push(ch);
            }
            if collecting && ch == '{' && depth > 1 {
                // Inside constant body like PLUS("+") { ... }
                // Skip until matching }
            }
        }
    }

    // Clean up: "PLUS("+"), MINUS("-")" → normalize
    let cleaned = result.trim().to_string();
    if cleaned.is_empty() {
        String::new()
    } else {
        // Parse enum constants properly
        // Each constant may be: NAME or NAME(args) or NAME(args) { body }
        // We need to collect them as they appear
        let mut constants: Vec<String> = Vec::new();
        let mut current = String::new();
        let mut paren_depth = 0i32;
        let mut brace_depth = 0i32;

        for ch in cleaned.chars() {
            match ch {
                '(' => { paren_depth += 1; current.push(ch); }
                ')' => { paren_depth -= 1; current.push(ch); }
                '{' => { brace_depth += 1; current.push(ch); }
                '}' => { brace_depth -= 1; current.push(ch); }
                ',' if paren_depth == 0 && brace_depth == 0 => {
                    let c = current.trim().to_string();
                    if !c.is_empty() { constants.push(c); }
                    current.clear();
                }
                '\n' | '\r' => { current.push(' '); }
                _ => { current.push(ch); }
            }
        }
        let c = current.trim().to_string();
        if !c.is_empty() { constants.push(c); }

        if constants.is_empty() {
            String::new()
        } else {
            // Remove constant bodies: PLUS("+") { ... } → PLUS("+")
            let stripped: Vec<String> = constants.iter().map(|c| {
                if let Some(brace) = c.find('{') {
                    c[..brace].trim().to_string()
                } else {
                    c.clone()
                }
            }).collect();
            format!("{};", stripped.join(", "))
        }
    }
}

/// Collect all capitalized identifiers in body for dependency closure
fn collect_body_refs(lines: &[&str], start: usize, end: usize) -> Vec<String> {
    let mut refs = HashSet::new();
    let end = end.min(lines.len().saturating_sub(1));
    for line in lines.iter().skip(start).take(end - start + 1) {
        let chars: Vec<char> = line.chars().collect();
        let mut i = 0;
        while i < chars.len() {
            if chars[i].is_alphabetic() || chars[i] == '_' {
                let s = i;
                while i < chars.len() && (chars[i].is_alphanumeric() || chars[i] == '_') { i += 1; }
                let word: String = chars[s..i].iter().collect();
                // Keep identifiers that start with uppercase (type references)
                if word.len() > 1 && word.chars().next().map(|c| c.is_uppercase()).unwrap_or(false)
                    && !is_java_keyword(&word)
                {
                    refs.insert(word);
                }
            } else {
                i += 1;
            }
        }
    }
    refs.into_iter().collect()
}

fn is_java_keyword(s: &str) -> bool {
    matches!(s, "public" | "private" | "protected" | "static" | "final" | "abstract"
        | "synchronized" | "transient" | "volatile" | "native"
        | "int" | "long" | "short" | "byte" | "char" | "boolean" | "float" | "double"
        | "void" | "String" | "Object" | "class" | "interface" | "enum" | "record"
        | "extends" | "implements" | "throws" | "new" | "return" | "if" | "else"
        | "for" | "while" | "default" | "this" | "super" | "null" | "true" | "false"
        | "try" | "catch" | "finally" | "throw" | "import" | "package"
        | "System" | "Override" | "Deprecated" | "SuppressWarnings"
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
        if chars[i].is_alphabetic() || chars[i] == '_' {
            let s = i;
            while i < chars.len() && (chars[i].is_alphanumeric() || chars[i] == '_') { i += 1; }
            if i < chars.len() && chars[i] == '(' {
                let callee: String = chars[s..i].iter().collect();
                if !is_java_keyword(&callee) && callee != caller {
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
