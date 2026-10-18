//! Java code reconstruction with proper syntax

use std::collections::{HashMap, HashSet};
use super::parser::{JavaScope, JavaNodeKind};

/// Reconstruct Java code keeping only relevant scopes
pub fn reconstruct_code(
    lines: &[&str],
    scopes: &[JavaScope],
    decisions: &HashSet<usize>,
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
    
    // First pass: Find and include package and all imports from source
    // We do this unconditionally to ensure valid Java output
    
    // Include package (line 0 usually, or search for "package" keyword)
    for (idx, line) in lines.iter().enumerate() {
        if line.trim().starts_with("package ") && line.trim().ends_with(";") {
            if !line_included[idx] {
                output.push_str(line);
                output.push('\n');
                line_included[idx] = true;
            }
            break;
        }
    }
    
    // Include all imports
    for (idx, line) in lines.iter().enumerate() {
        if line.trim().starts_with("import ") && line.trim().ends_with(";") {
            if !line_included[idx] {
                output.push_str(line);
                output.push('\n');
                line_included[idx] = true;
            }
        }
    }
    
    // Add blank line after package/imports if we added any
    if output.contains("package ") || output.contains("import ") {
        if !output.ends_with("\n\n") {
            output.push('\n');
        }
    }
    
    // Second pass: classes, interfaces, enums with their members
    let mut processed_parents = HashSet::new();
    
    // Sort scopes by line number for deterministic output
    let mut parent_scopes: Vec<&JavaScope> = scopes
        .iter()
        .filter(|s| s.kind == JavaNodeKind::Class 
                 || s.kind == JavaNodeKind::Interface 
                 || s.kind == JavaNodeKind::Enum)
        .collect();
    parent_scopes.sort_by_key(|s| s.start_line);
    
    for parent_scope in parent_scopes {
        if decisions.contains(&parent_scope.id) && !processed_parents.contains(&parent_scope.id) {
            // Include class/interface/enum header
            include_lines(&mut output, &mut line_included, lines, parent_scope.start_line, parent_scope.start_line);
            
            // Process members
            if let Some(child_ids) = parent_to_children.get(&parent_scope.id) {
                let mut members: Vec<&JavaScope> = child_ids
                    .iter()
                    .filter_map(|&id| scopes.iter().find(|s| s.id == id))
                    .collect();
                
                // Sort by line number
                members.sort_by_key(|s| s.start_line);
                
                for member in members {
                    match &member.kind {
                        JavaNodeKind::Field => {
                            // Always keep fields
                            include_lines(&mut output, &mut line_included, lines, member.start_line, member.end_line);
                        }
                        JavaNodeKind::Constructor | JavaNodeKind::Method => {
                            if decisions.contains(&member.id) {
                                // Keep full method/constructor
                                include_lines(&mut output, &mut line_included, lines, member.start_line, member.end_line);
                            } else if parent_scope.kind == JavaNodeKind::Interface {
                                // For interfaces, handle different method types
                                if member.node_text.contains("default ") {
                                    // Default methods: keep full implementation
                                    include_lines(&mut output, &mut line_included, lines, member.start_line, member.end_line);
                                } else if member.node_text.contains("static ") {
                                    // Static methods: stub to single line
                                    if let Some(stub) = create_method_stub(&member.node_text, member.kind.clone()) {
                                        output.push_str(&stub);
                                        output.push('\n');
                                    }
                                    for i in member.start_line..=member.end_line.min(lines.len().saturating_sub(1)) {
                                        line_included[i] = true;
                                    }
                                } else {
                                    // Abstract interface methods: keep signature + ;
                                    include_lines(&mut output, &mut line_included, lines, member.start_line, member.end_line);
                                }
                            } else if member.node_text.contains("abstract ") {
                                // For abstract methods, keep them as-is (they end with ;)
                                include_lines(&mut output, &mut line_included, lines, member.start_line, member.end_line);
                            } else {
                                // For concrete classes, create stub with smart return type
                                if let Some(stub) = create_method_stub(&member.node_text, member.kind.clone()) {
                                    output.push_str(&stub);
                                    output.push('\n');
                                }
                                // Mark original lines as processed
                                for i in member.start_line..=member.end_line.min(lines.len().saturating_sub(1)) {
                                    line_included[i] = true;
                                }
                            }
                        }
                        _ => {
                            // For other types, include if kept
                            if decisions.contains(&member.id) {
                                include_lines(&mut output, &mut line_included, lines, member.start_line, member.end_line);
                            }
                        }
                    }
                }
            }
            
            // Include closing brace
            if parent_scope.end_line < lines.len() {
                include_lines(&mut output, &mut line_included, lines, parent_scope.end_line, parent_scope.end_line);
            }
            
            processed_parents.insert(parent_scope.id);
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

fn create_method_stub(node_text: &str, kind: JavaNodeKind) -> Option<String> {
    let text = node_text.trim();
    
    // Find opening brace
    let brace_pos = text.find('{');
    if brace_pos.is_none() {
        return None;
    }
    
    let brace_pos = brace_pos.unwrap();
    let signature = text[..brace_pos].trim();
    
    // Constructors always have empty body
    if kind == JavaNodeKind::Constructor {
        return Some(format!("{} {{}}", signature));
    }
    
    // Extract return type for methods
    let return_type = if signature.contains("void") {
        " {}"
    } else if signature.contains("int") {
        " { return 0; }"
    } else if signature.contains("long") {
        " { return 0L; }"
    } else if signature.contains("double") {
        " { return 0.0; }"
    } else if signature.contains("float") {
        " { return 0.0f; }"
    } else if signature.contains("boolean") {
        " { return false; }"
    } else if signature.contains("char") {
        " { return '\\0'; }"
    } else if signature.contains("byte") {
        " { return 0; }"
    } else if signature.contains("short") {
        " { return 0; }"
    } else if signature.contains("String") {
        " { return null; }"
    } else {
        " { return null; }"
    };
    
    Some(format!("{}{}", signature, return_type))
}