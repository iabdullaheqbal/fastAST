//! JSON AST Parser and Scope Collector
//!
//! Parses JSON documents and collects structured scopes for objects,
//! arrays, key-value pairs, and primitives.

use serde_json::Value;

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum JsonNodeKind {
    Root,
    Object { key: Option<String> },
    Array { key: Option<String> },
    Pair { key: String, is_complex: bool },
    Primitive { preview: String },
}

#[derive(Debug, Clone)]
pub struct JsonScopeItem {
    pub id: usize,
    pub parent_id: Option<usize>,
    pub path: Vec<String>,
    pub kind: JsonNodeKind,
    pub key: Option<String>,
    pub tokens: Vec<String>,
    pub defined_symbols: Vec<String>,
    pub value: Value,
    pub children_ids: Vec<usize>,
}

pub fn parse_json(code: &str) -> Result<Value, String> {
    serde_json::from_str(code).map_err(|e| format!("Failed to parse JSON: {}", e))
}

pub fn collect_scopes(root_val: &Value) -> Vec<JsonScopeItem> {
    let mut items = Vec::new();
    walk_value(root_val, None, Vec::new(), None, &mut items);
    items
}

fn walk_value(
    val: &Value,
    key: Option<String>,
    path: Vec<String>,
    parent_id: Option<usize>,
    items: &mut Vec<JsonScopeItem>,
) -> usize {
    let current_id = items.len();

    let mut tokens = Vec::new();
    let mut defined = Vec::new();

    if let Some(ref k) = key {
        tokens.push(k.to_lowercase());
        defined.push(k.clone());
        for sub in split_identifier_subtokens(k) {
            if !tokens.contains(&sub) {
                tokens.push(sub);
            }
        }
    }

    match val {
        Value::Object(map) => {
            let kind = if parent_id.is_none() {
                JsonNodeKind::Root
            } else {
                JsonNodeKind::Object { key: key.clone() }
            };

            items.push(JsonScopeItem {
                id: current_id,
                parent_id,
                path: path.clone(),
                kind,
                key: key.clone(),
                tokens,
                defined_symbols: defined,
                value: val.clone(),
                children_ids: Vec::new(),
            });

            if let Some(pid) = parent_id {
                items[pid].children_ids.push(current_id);
            }

            for (child_k, child_v) in map {
                let mut child_path = path.clone();
                child_path.push(child_k.clone());

                let pair_id = items.len();
                let is_complex = child_v.is_object() || child_v.is_array();

                let mut pair_tokens = vec![child_k.to_lowercase()];
                for sub in split_identifier_subtokens(child_k) {
                    if !pair_tokens.contains(&sub) {
                        pair_tokens.push(sub);
                    }
                }

                // If primitive value, add value tokens
                if let Value::String(s) = child_v {
                    pair_tokens.push(s.to_lowercase());
                    for sub in split_identifier_subtokens(s) {
                        if !pair_tokens.contains(&sub) {
                            pair_tokens.push(sub);
                        }
                    }
                }

                if is_complex {
                    // Walk nested object or array
                    let _ = walk_value(child_v, Some(child_k.clone()), child_path, Some(current_id), items);
                } else {
                    items.push(JsonScopeItem {
                        id: pair_id,
                        parent_id: Some(current_id),
                        path: child_path,
                        kind: JsonNodeKind::Pair {
                            key: child_k.clone(),
                            is_complex: false,
                        },
                        key: Some(child_k.clone()),
                        tokens: pair_tokens,
                        defined_symbols: vec![child_k.clone()],
                        value: child_v.clone(),
                        children_ids: Vec::new(),
                    });
                    items[current_id].children_ids.push(pair_id);
                }
            }
        }
        Value::Array(arr) => {
            let kind = JsonNodeKind::Array { key: key.clone() };

            items.push(JsonScopeItem {
                id: current_id,
                parent_id,
                path: path.clone(),
                kind,
                key: key.clone(),
                tokens,
                defined_symbols: defined,
                value: val.clone(),
                children_ids: Vec::new(),
            });

            if let Some(pid) = parent_id {
                items[pid].children_ids.push(current_id);
            }

            for (idx, elem) in arr.iter().enumerate() {
                let mut elem_path = path.clone();
                elem_path.push(idx.to_string());

                let _ = walk_value(elem, None, elem_path, Some(current_id), items);
            }
        }
        _ => {
            // Primitive (String, Number, Bool, Null)
            if let Value::String(s) = val {
                tokens.push(s.to_lowercase());
                for sub in split_identifier_subtokens(s) {
                    if !tokens.contains(&sub) {
                        tokens.push(sub);
                    }
                }
            }

            let preview = val.to_string();
            items.push(JsonScopeItem {
                id: current_id,
                parent_id,
                path,
                kind: JsonNodeKind::Primitive { preview },
                key,
                tokens,
                defined_symbols: defined,
                value: val.clone(),
                children_ids: Vec::new(),
            });

            if let Some(pid) = parent_id {
                items[pid].children_ids.push(current_id);
            }
        }
    }

    current_id
}

pub fn split_identifier_subtokens(s: &str) -> Vec<String> {
    let mut subtokens = Vec::new();
    let lower = s.to_lowercase();
    subtokens.push(lower.clone());

    // Split on hyphens, dots, slashes, underscores, at-signs
    let parts = s.split(|c: char| !c.is_alphanumeric());
    for part in parts {
        let p = part.trim().to_lowercase();
        if p.len() >= 2 && p != lower && !subtokens.contains(&p) {
            subtokens.push(p);
        }
    }

    // Split camelCase / PascalCase
    let mut current = String::new();
    for ch in s.chars() {
        if ch.is_uppercase() && !current.is_empty() {
            let part = current.to_lowercase();
            if part.len() >= 2 && part != lower && !subtokens.contains(&part) {
                subtokens.push(part);
            }
            current.clear();
        }
        if ch.is_alphanumeric() {
            current.push(ch);
        }
    }
    if !current.is_empty() {
        let part = current.to_lowercase();
        if part.len() >= 2 && part != lower && !subtokens.contains(&part) {
            subtokens.push(part);
        }
    }

    subtokens
}
