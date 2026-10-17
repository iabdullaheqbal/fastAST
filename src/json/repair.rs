//! JSON Code Reconstruction and Repair Engine
//!
//! Reconstructs a valid pruned JSON document from evaluated AST scopes,
//! preserving kept objects/arrays/keys and generating clean formatting.

use serde_json::{Map, Value};
use crate::json::parser::{JsonNodeKind, JsonScopeItem};
use crate::json::scorer::JsonDecision;

pub fn reconstruct_code(
    _original_text: &str,
    items: &[JsonScopeItem],
    decisions: &[JsonDecision],
) -> String {
    if items.is_empty() {
        return "{}".to_string();
    }

    let pruned = reconstruct_item(0, items, decisions);
    match pruned {
        Some(val) => serde_json::to_string_pretty(&val).unwrap_or_else(|_| "{}".to_string()),
        None => "{}".to_string(),
    }
}

fn reconstruct_item(
    item_id: usize,
    items: &[JsonScopeItem],
    decisions: &[JsonDecision],
) -> Option<Value> {
    if item_id >= items.len() || item_id >= decisions.len() {
        return None;
    }

    let item = &items[item_id];
    let decision = &decisions[item_id];

    // If kept in full, return the entire original value subtree
    if decision.keep_full {
        return Some(item.value.clone());
    }

    // Check if this item is skeleton or has any kept descendants
    let is_skeleton = decision.keep_skeleton;
    let has_kept_descendants = has_kept_child(item_id, items, decisions);

    if !is_skeleton && !has_kept_descendants && item.parent_id.is_some() {
        return None;
    }

    match &item.kind {
        JsonNodeKind::Root | JsonNodeKind::Object { .. } => {
            let mut map = Map::new();
            for &child_id in &item.children_ids {
                if let Some(child_val) = reconstruct_item(child_id, items, decisions) {
                    if let Some(ref k) = items[child_id].key {
                        map.insert(k.clone(), child_val);
                    }
                }
            }

            if !map.is_empty() || is_skeleton || item.parent_id.is_none() {
                Some(Value::Object(map))
            } else {
                None
            }
        }
        JsonNodeKind::Array { .. } => {
            let mut arr = Vec::new();
            for &child_id in &item.children_ids {
                if let Some(child_val) = reconstruct_item(child_id, items, decisions) {
                    arr.push(child_val);
                }
            }

            if !arr.is_empty() || is_skeleton || item.parent_id.is_none() {
                Some(Value::Array(arr))
            } else {
                None
            }
        }
        JsonNodeKind::Pair { .. } => {
            if decision.keep_full || decision.keep_skeleton {
                Some(item.value.clone())
            } else {
                None
            }
        }
        JsonNodeKind::Primitive { .. } => {
            if decision.keep_full || decision.keep_skeleton {
                Some(item.value.clone())
            } else {
                None
            }
        }
    }
}

fn has_kept_child(item_id: usize, items: &[JsonScopeItem], decisions: &[JsonDecision]) -> bool {
    for &child_id in &items[item_id].children_ids {
        if decisions[child_id].keep_full || decisions[child_id].keep_skeleton {
            return true;
        }
        if has_kept_child(child_id, items, decisions) {
            return true;
        }
    }
    false
}
