//! TOML Code Reconstruction and Repair Engine
//!
//! Reconstructs a valid pruned TOML document from evaluated AST scopes,
//! preserving kept tables, array of tables, and key-value pairs.

use toml::{Table, Value};
use crate::toml::parser::{TomlNodeKind, TomlScopeItem};
use crate::toml::scorer::TomlDecision;

pub fn reconstruct_code(
    _original_text: &str,
    items: &[TomlScopeItem],
    decisions: &[TomlDecision],
) -> String {
    if items.is_empty() {
        return String::new();
    }

    let pruned = reconstruct_table(0, items, decisions).unwrap_or_default();
    toml::to_string_pretty(&pruned).unwrap_or_default()
}

fn reconstruct_table(
    item_id: usize,
    items: &[TomlScopeItem],
    decisions: &[TomlDecision],
) -> Option<Table> {
    if item_id >= items.len() || item_id >= decisions.len() {
        return None;
    }

    let item = &items[item_id];
    let decision = &decisions[item_id];

    // If kept in full, return the entire original table
    if decision.keep_full {
        if let Value::Table(ref tbl) = item.value {
            return Some(tbl.clone());
        }
    }

    let is_skeleton = decision.keep_skeleton;
    let has_kept = has_kept_child(item_id, items, decisions);

    if !is_skeleton && !has_kept && item.parent_id.is_some() {
        return None;
    }

    let mut table = Table::new();

    for &child_id in &item.children_ids {
        let child = &items[child_id];
        let child_dec = &decisions[child_id];

        match &child.kind {
            TomlNodeKind::Table { .. } => {
                if child_dec.keep_full {
                    if let Some(ref k) = child.key {
                        table.insert(k.clone(), child.value.clone());
                    }
                } else if let Some(sub_tbl) = reconstruct_table(child_id, items, decisions) {
                    if let Some(ref k) = child.key {
                        table.insert(k.clone(), Value::Table(sub_tbl));
                    }
                }
            }
            TomlNodeKind::ArrayOfTables { .. } => {
                if child_dec.keep_full {
                    if let Some(ref k) = child.key {
                        table.insert(k.clone(), child.value.clone());
                    }
                } else {
                    let mut kept_elems = Vec::new();
                    for &elem_id in &child.children_ids {
                        if decisions[elem_id].keep_full || has_kept_child(elem_id, items, decisions) {
                            kept_elems.push(items[elem_id].value.clone());
                        }
                    }

                    if !kept_elems.is_empty() {
                        if let Some(ref k) = child.key {
                            table.insert(k.clone(), Value::Array(kept_elems));
                        }
                    } else if child_dec.keep_skeleton {
                        if let Some(ref k) = child.key {
                            table.insert(k.clone(), Value::Array(Vec::new()));
                        }
                    }
                }
            }
            TomlNodeKind::Pair { .. } => {
                if child_dec.keep_full || child_dec.keep_skeleton {
                    if let Some(ref k) = child.key {
                        table.insert(k.clone(), child.value.clone());
                    }
                }
            }
            _ => {}
        }
    }

    if !table.is_empty() || is_skeleton || item.parent_id.is_none() {
        Some(table)
    } else {
        None
    }
}

fn has_kept_child(item_id: usize, items: &[TomlScopeItem], decisions: &[TomlDecision]) -> bool {
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
