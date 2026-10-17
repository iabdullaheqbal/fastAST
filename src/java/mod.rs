//! Java language pruning engine with dual-rubric scoring
//!
//! Extracts: packages, imports, classes, interfaces, fields, constructors, methods
//! Semantic: match query against identifiers
//! Structural: always keep package+imports; keep enclosing class when member kept; stub unkept methods

use crate::{count_tokens, PruneResult};
use std::collections::{HashMap, HashSet};

#[derive(Debug, Clone)]
struct JavaScope {
    id: usize,
    kind: ScopeKind,
    name: String,
    start_line: usize,
    end_line: usize,
    tokens: Vec<String>,
    parent_id: Option<usize>,
}

#[derive(Debug, Clone, PartialEq, Eq, Hash, Copy)]
enum ScopeKind {
    Package,
    Import,
    Class,
    Interface,
    Field,
    Constructor,
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

    // Extract scopes with hierarchy
    let scopes = extract_scopes_with_hierarchy(&lines);

    // Parse query
    let query_tokens: Vec<String> = focus_query
        .split_whitespace()
        .map(|s| s.to_lowercase())
        .collect();

    // Score and determine what to keep with dual-rubric
    let kept_ids = score_scopes_dual_rubric(&scopes, &query_tokens, threshold);

    // Reconstruct code with proper Java syntax
    let pruned_code = reconstruct_java_with_stubs(&lines, &scopes, &kept_ids);

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

/// Extract scopes with parent-child relationships
fn extract_scopes_with_hierarchy(lines: &[&str]) -> Vec<JavaScope> {
    let mut scopes = Vec::new();
    let mut id_counter = 0;
    let mut class_stack: Vec<usize> = Vec::new();

    for (line_idx, line) in lines.iter().enumerate() {
        let trimmed = line.trim();

        // Skip comments
        if trimmed.is_empty() || trimmed.starts_with("//") || trimmed.starts_with("/*") {
            continue;
        }

        // Package
        if trimmed.starts_with("package ") && trimmed.ends_with(";") {
            let name = extract_identifier(trimmed, "package ");
            scopes.push(JavaScope {
                id: id_counter,
                kind: ScopeKind::Package,
                name: name.clone(),
                start_line: line_idx,
                end_line: line_idx,
                tokens: tokenize_java_name(&name),
                parent_id: None,
            });
            id_counter += 1;
        }

        // Imports
        if trimmed.starts_with("import ") && trimmed.ends_with(";") {
            let name = extract_identifier(trimmed, "import ");
            scopes.push(JavaScope {
                id: id_counter,
                kind: ScopeKind::Import,
                name: name.clone(),
                start_line: line_idx,
                end_line: line_idx,
                tokens: tokenize_java_name(&name),
                parent_id: None,
            });
            id_counter += 1;
        }

        // Check for class start
        let is_class_start = trimmed.starts_with("public class ") 
            || trimmed.starts_with("private class ")
            || trimmed.starts_with("protected class ")
            || trimmed.starts_with("class ")
            || trimmed.contains(" class ") && trimmed.contains('{');

        // Check for interface start  
        let is_interface_start = trimmed.starts_with("public interface ")
            || trimmed.starts_with("interface ")
            || trimmed.contains(" interface ") && trimmed.contains('{');

        if is_class_start || is_interface_start {
            let keyword = if is_class_start { "class " } else { "interface " };
            let name = extract_identifier(trimmed, keyword);
            let kind = if is_class_start { ScopeKind::Class } else { ScopeKind::Interface };
            let end_line = find_matching_brace(lines, line_idx).unwrap_or(line_idx + 100);
            
            let scope_id = id_counter;
            scopes.push(JavaScope {
                id: scope_id,
                kind,
                name: name.clone(),
                start_line: line_idx,
                end_line,
                tokens: tokenize_java_name(&name),
                parent_id: None,
            });
            id_counter += 1;
            class_stack.push(scope_id);
        }

        // Fields (within a class)
        if !class_stack.is_empty() && is_field_line(trimmed) {
            if let Some(field_name) = extract_field_name(trimmed) {
                scopes.push(JavaScope {
                    id: id_counter,
                    kind: ScopeKind::Field,
                    name: field_name.clone(),
                    start_line: line_idx,
                    end_line: line_idx,
                    tokens: tokenize_java_name(&field_name),
                    parent_id: class_stack.last().copied(),
                });
                id_counter += 1;
            }
        }

        // Constructors (within a class)
        if !class_stack.is_empty() && is_constructor_line(trimmed) {
            if let Some(constructor_name) = extract_constructor_name(trimmed) {
                let end_line = find_matching_brace(lines, line_idx).unwrap_or(line_idx + 20);
                scopes.push(JavaScope {
                    id: id_counter,
                    kind: ScopeKind::Constructor,
                    name: constructor_name.clone(),
                    start_line: line_idx,
                    end_line,
                    tokens: tokenize_java_name(&constructor_name),
                    parent_id: class_stack.last().copied(),
                });
                id_counter += 1;
            }
        }

        // Methods (within a class or standalone)
        if is_method_line(trimmed) {
            if let Some(method_name) = extract_method_name(trimmed) {
                let end_line = find_matching_brace(lines, line_idx).unwrap_or(line_idx + 20);
                scopes.push(JavaScope {
                    id: id_counter,
                    kind: ScopeKind::Method,
                    name: method_name.clone(),
                    start_line: line_idx,
                    end_line,
                    tokens: tokenize_java_name(&method_name),
                    parent_id: class_stack.last().copied(),
                });
                id_counter += 1;
            }
        }

        // Check for class/interface closing brace
        if trimmed == "}" && !class_stack.is_empty() {
            class_stack.pop();
        }
    }

    scopes
}

fn is_field_line(line: &str) -> bool {
    let modifiers = ["public ", "private ", "protected ", "static ", "final "];
    modifiers.iter().any(|m| line.contains(m)) 
        && !line.contains('(') 
        && !line.contains(" class ")
        && !line.contains(" interface ")
        && line.ends_with(';')
}

fn extract_field_name(line: &str) -> Option<String> {
    // Remove modifiers and type, get last identifier before semicolon
    let without_semi = line.trim_end_matches(';');
    let parts: Vec<&str> = without_semi.split_whitespace().collect();
    
    // Last part should be the field name
    if let Some(last) = parts.last() {
        // Clean up array brackets and equals assignments
        let name = last
            .chars()
            .take_while(|c| c.is_alphanumeric() || *c == '_')
            .collect::<String>();
        if !name.is_empty() && !is_java_keyword(&name) {
            return Some(name);
        }
    }
    None
}

fn is_constructor_line(line: &str) -> bool {
    line.contains('(') && line.contains(')') && !line.contains(" class ")
}

fn extract_constructor_name(line: &str) -> Option<String> {
    // Constructor has same name as class
    if let Some(paren_pos) = line.find('(') {
        let before_paren = &line[..paren_pos];
        let name = before_paren
            .split_whitespace()
            .last()
            .unwrap_or("")
            .to_string();
        if !name.is_empty() && !is_java_keyword(&name) {
            return Some(name);
        }
    }
    None
}

fn is_method_line(line: &str) -> bool {
    line.contains('(') && line.contains(')') && !line.contains(" class ")
}

fn extract_method_name(line: &str) -> Option<String> {
    if let Some(paren_pos) = line.find('(') {
        let before_paren = &line[..paren_pos];
        if let Some(name) = before_paren.split_whitespace().last() {
            let method_name: String = name
                .chars()
                .take_while(|c| c.is_alphanumeric() || *c == '_')
                .collect();
            if !method_name.is_empty() && !is_java_keyword(&method_name) {
                return Some(method_name);
            }
        }
    }
    None
}

fn extract_identifier(line: &str, keyword: &str) -> String {
    if let Some(pos) = line.find(keyword) {
        let after = &line[pos + keyword.len()..];
        let end = after
            .find(|c: char| !c.is_alphanumeric() && c != '_' && c != '.')
            .unwrap_or(after.len());
        after[..end].trim().to_string()
    } else {
        String::new()
    }
}

fn find_matching_brace(lines: &[&str], start_line: usize) -> Option<usize> {
    let mut depth = 0;
    let mut found_open = false;

    for (idx, line) in lines.iter().enumerate().skip(start_line) {
        for ch in line.chars() {
            if ch == '{' {
                found_open = true;
                depth += 1;
            } else if ch == '}' {
                depth -= 1;
                if found_open && depth == 0 {
                    return Some(idx);
                }
            }
        }
        if idx > start_line + 500 {
            break; // Safety limit
        }
    }
    None
}

fn is_java_keyword(s: &str) -> bool {
    matches!(
        s,
        "public" | "private" | "protected" | "static" | "final" | "abstract" 
        | "synchronized" | "transient" | "volatile" | "native" | "strictfp"
        | "int" | "long" | "short" | "byte" | "char" | "boolean" | "float" 
        | "double" | "void" | "String" | "Object" | "class" | "interface" 
        | "enum" | "record" | "extends" | "implements" | "throws" | "new"
    )
}

fn tokenize_java_name(name: &str) -> Vec<String> {
    let mut tokens = Vec::new();
    let mut current = String::new();

    for ch in name.chars() {
        if ch.is_alphanumeric() {
            current.push(ch.to_lowercase().next().unwrap_or(ch));
        } else if ch == '_' || ch == '.' {
            if !current.is_empty() {
                tokens.push(current.clone());
                current.clear();
            }
        } else if ch.is_uppercase() {
            if !current.is_empty() {
                tokens.push(current.clone());
                current.clear();
            }
            current.push(ch.to_lowercase().next().unwrap_or(ch));
        }
    }

    if !current.is_empty() {
        tokens.push(current);
    }

    tokens
}

/// Dual-rubric scoring: semantic + structural
fn score_scopes_dual_rubric(
    scopes: &[JavaScope],
    query_tokens: &[String],
    threshold: f64,
) -> HashSet<usize> {
    let mut kept = HashSet::new();
    
    if query_tokens.is_empty() {
        // No query: keep structure only
        for scope in scopes {
            if scope.kind == ScopeKind::Package || scope.kind == ScopeKind::Import {
                kept.insert(scope.id);
            }
        }
        return kept;
    }

    // Phase 1: Semantic scoring
    let mut semantically_kept = HashSet::new();
    
    for scope in scopes {
        let score = calculate_semantic_score(&scope.tokens, query_tokens);
        if score >= threshold {
            semantically_kept.insert(scope.id);
        }
    }

    // Phase 2: Structural rules
    // Rule 1: Always keep packages and imports when ANY code is kept
    if !semantically_kept.is_empty() {
        for scope in scopes {
            if scope.kind == ScopeKind::Package || scope.kind == ScopeKind::Import {
                kept.insert(scope.id);
            }
        }
    }

    // Rule 2: Keep semantically matched scopes
    for &id in &semantically_kept {
        kept.insert(id);
    }

    // Rule 3: Keep enclosing classes/interfaces of kept members
    let mut classes_to_keep = HashSet::new();
    for scope in scopes {
        if kept.contains(&scope.id) {
            if let Some(parent_id) = scope.parent_id {
                classes_to_keep.insert(parent_id);
            }
        }
    }
    // Also keep the parents themselves if they're semantically matched
    for scope in scopes {
        if semantically_kept.contains(&scope.id) 
            && (scope.kind == ScopeKind::Class || scope.kind == ScopeKind::Interface) {
            classes_to_keep.insert(scope.id);
        }
    }
    for &class_id in &classes_to_keep {
        kept.insert(class_id);
    }

    // Rule 4: Fallback - if nothing semantically matched, keep at least the structure
    if semantically_kept.is_empty() {
        for scope in scopes {
            if scope.kind == ScopeKind::Package || scope.kind == ScopeKind::Import {
                kept.insert(scope.id);
            }
            if scope.kind == ScopeKind::Class || scope.kind == ScopeKind::Interface {
                kept.insert(scope.id);
            }
        }
    }

    kept
}

fn calculate_semantic_score(scope_tokens: &[String], query_tokens: &[String]) -> f64 {
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

/// Reconstruct Java code with proper syntax
fn reconstruct_java_with_stubs(
    lines: &[&str],
    scopes: &[JavaScope],
    kept_ids: &HashSet<usize>,
) -> String {
    let mut output = String::new();
    let mut line_included = vec![false; lines.len()];
    
    // Map parent IDs to their children
    let mut parent_to_children: HashMap<usize, Vec<usize>> = HashMap::new();
    for scope in scopes {
        if let Some(parent_id) = scope.parent_id {
            parent_to_children.entry(parent_id).or_default().push(scope.id);
        }
    }

    // First pass: packages and imports
    for scope in scopes {
        if kept_ids.contains(&scope.id) 
            && (scope.kind == ScopeKind::Package || scope.kind == ScopeKind::Import) {
            include_lines(&mut output, &mut line_included, lines, scope.start_line, scope.end_line);
        }
    }

    // Second pass: classes and interfaces with their members
    let mut processed_classes = HashSet::new();
    
    for class_scope in scopes {
        if (class_scope.kind == ScopeKind::Class || class_scope.kind == ScopeKind::Interface)
            && kept_ids.contains(&class_scope.id)
            && !processed_classes.contains(&class_scope.id) {
            
            // Include class/interface header
            include_lines(&mut output, &mut line_included, lines, class_scope.start_line, class_scope.start_line);
            
            // Process members
            if let Some(child_ids) = parent_to_children.get(&class_scope.id) {
                let mut class_members: Vec<&JavaScope> = child_ids
                    .iter()
                    .filter_map(|&id| scopes.iter().find(|s| s.id == id))
                    .collect();
                
                // Sort by line number
                class_members.sort_by_key(|s| s.start_line);
                
                for member in class_members {
                    if member.kind == ScopeKind::Field && kept_ids.contains(&member.id) {
                        // Keep full field
                        include_lines(&mut output, &mut line_included, lines, member.start_line, member.end_line);
                    } else if member.kind == ScopeKind::Constructor || member.kind == ScopeKind::Method {
                        if kept_ids.contains(&member.id) {
                            // Keep full method/constructor
                            include_lines(&mut output, &mut line_included, lines, member.start_line, member.end_line);
                        } else {
                            // Create stub
                            if let Some(stub) = create_stub(lines[member.start_line].trim(), member.kind) {
                                output.push_str(&stub);
                                output.push('\n');
                            }
                            // Mark the original lines as processed
                            for i in member.start_line..=member.end_line.min(lines.len().saturating_sub(1)) {
                                line_included[i] = true;
                            }
                        }
                    }
                }
            }
            
            // Include closing brace
            if class_scope.end_line < lines.len() {
                include_lines(&mut output, &mut line_included, lines, class_scope.end_line, class_scope.end_line);
            }
            
            processed_classes.insert(class_scope.id);
        }
    }

    // If nothing kept, return full code
    if output.trim().is_empty() {
        lines.join("\n")
    } else {
        output.trim_end().to_string()
    }
}

fn include_lines(
    output: &mut String,
    line_included: &mut [bool],
    lines: &[&str],
    start: usize,
    end: usize,
) {
    let end = end.min(lines.len().saturating_sub(1));
    for i in start..=end {
        if !line_included[i] {
            output.push_str(lines[i]);
            output.push('\n');
            line_included[i] = true;
        }
    }
}

fn create_stub(signature_line: &str, kind: ScopeKind) -> Option<String> {
    let trimmed = signature_line.trim();
    
    // Check if signature already has opening brace
    if trimmed.ends_with('{') {
        let without_brace = trimmed.trim_end_matches('{').trim_end();
        return Some(format!("{} {{}}", without_brace));
    }
    
    // For constructors and methods
    if kind == ScopeKind::Constructor || kind == ScopeKind::Method {
        // Find where the signature ends (before any throws or opening brace)
        let end_pos = trimmed
            .find('{')
            .or_else(|| trimmed.find("throws "))
            .or_else(|| Some(trimmed.len()));
        
        if let Some(pos) = end_pos {
            let signature = &trimmed[..pos].trim();
            return Some(format!("{} {{}}", signature));
        }
    }
    
    None
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
