//! TOML AST Parser and Scope Collector
//!
//! Parses TOML documents using the `toml` crate and collects structured scopes
//! for tables, arrays of tables, and key-value pairs.

use toml::{Table, Value};

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum TomlNodeKind {
    Root,
    Table { header: String },
    ArrayOfTables { header: String },
    TableElement { header: String, index: usize },
    Pair { key: String },
}

#[derive(Debug, Clone)]
pub struct TomlScopeItem {
    pub id: usize,
    pub parent_id: Option<usize>,
    pub path: Vec<String>,
    pub kind: TomlNodeKind,
    pub key: Option<String>,
    pub tokens: Vec<String>,
    pub defined_symbols: Vec<String>,
    pub value: Value,
    pub children_ids: Vec<usize>,
}

pub fn parse_toml(code: &str) -> Result<Table, String> {
    code.parse::<Table>()
        .map_err(|e| format!("Failed to parse TOML: {}", e))
}

pub fn collect_scopes(root_table: &Table) -> Vec<TomlScopeItem> {
    let mut items = Vec::new();
    let root_val = Value::Table(root_table.clone());

    items.push(TomlScopeItem {
        id: 0,
        parent_id: None,
        path: Vec::new(),
        kind: TomlNodeKind::Root,
        key: None,
        tokens: Vec::new(),
        defined_symbols: Vec::new(),
        value: root_val,
        children_ids: Vec::new(),
    });

    walk_table(root_table, 0, Vec::new(), &mut items);
    items
}

fn walk_table(
    table: &Table,
    parent_id: usize,
    current_path: Vec<String>,
    items: &mut Vec<TomlScopeItem>,
) {
    for (k, v) in table {
        let mut path = current_path.clone();
        path.push(k.clone());

        match v {
            Value::Table(sub_table) => {
                let current_id = items.len();
                let mut tokens = vec![k.to_lowercase()];
                for sub in split_identifier_subtokens(k) {
                    if !tokens.contains(&sub) {
                        tokens.push(sub);
                    }
                }

                items.push(TomlScopeItem {
                    id: current_id,
                    parent_id: Some(parent_id),
                    path: path.clone(),
                    kind: TomlNodeKind::Table { header: k.clone() },
                    key: Some(k.clone()),
                    tokens: tokens.clone(),
                    defined_symbols: vec![k.clone()],
                    value: v.clone(),
                    children_ids: Vec::new(),
                });
                items[parent_id].children_ids.push(current_id);

                walk_table(sub_table, current_id, path, items);
            }
            Value::Array(arr) if is_array_of_tables(arr) => {
                let current_id = items.len();
                let mut tokens = vec![k.to_lowercase()];
                for sub in split_identifier_subtokens(k) {
                    if !tokens.contains(&sub) {
                        tokens.push(sub);
                    }
                }

                items.push(TomlScopeItem {
                    id: current_id,
                    parent_id: Some(parent_id),
                    path: path.clone(),
                    kind: TomlNodeKind::ArrayOfTables { header: k.clone() },
                    key: Some(k.clone()),
                    tokens: tokens.clone(),
                    defined_symbols: vec![k.clone()],
                    value: v.clone(),
                    children_ids: Vec::new(),
                });
                items[parent_id].children_ids.push(current_id);

                for (idx, elem) in arr.iter().enumerate() {
                    if let Value::Table(elem_table) = elem {
                        let elem_id = items.len();
                        let mut elem_path = path.clone();
                        elem_path.push(idx.to_string());

                        let mut elem_defined = Vec::new();
                        let mut elem_tokens = Vec::new();

                        for id_field in &["name", "id", "package"] {
                            if let Some(Value::String(id_val)) = elem_table.get(*id_field) {
                                elem_defined.push(id_val.clone());
                                for sub in split_identifier_subtokens(id_val) {
                                    if !elem_tokens.contains(&sub) {
                                        elem_tokens.push(sub);
                                    }
                                }
                            }
                        }

                        items.push(TomlScopeItem {
                            id: elem_id,
                            parent_id: Some(current_id),
                            path: elem_path.clone(),
                            kind: TomlNodeKind::TableElement {
                                header: k.clone(),
                                index: idx,
                            },
                            key: Some(format!("{}[{}]", k, idx)),
                            tokens: elem_tokens,
                            defined_symbols: elem_defined,
                            value: elem.clone(),
                            children_ids: Vec::new(),
                        });
                        items[current_id].children_ids.push(elem_id);

                        walk_table(elem_table, elem_id, elem_path, items);
                    }
                }
            }
            _ => {
                // Primitive or inline array/table pair
                let current_id = items.len();
                let mut pair_tokens = vec![k.to_lowercase()];
                for sub in split_identifier_subtokens(k) {
                    if !pair_tokens.contains(&sub) {
                        pair_tokens.push(sub);
                    }
                }

                if let Value::String(s) = v {
                    pair_tokens.push(s.to_lowercase());
                    for sub in split_identifier_subtokens(s) {
                        if !pair_tokens.contains(&sub) {
                            pair_tokens.push(sub);
                        }
                    }
                }

                items.push(TomlScopeItem {
                    id: current_id,
                    parent_id: Some(parent_id),
                    path,
                    kind: TomlNodeKind::Pair { key: k.clone() },
                    key: Some(k.clone()),
                    tokens: pair_tokens,
                    defined_symbols: vec![k.clone()],
                    value: v.clone(),
                    children_ids: Vec::new(),
                });
                items[parent_id].children_ids.push(current_id);
            }
        }
    }
}

fn is_array_of_tables(arr: &[Value]) -> bool {
    !arr.is_empty() && arr.iter().all(|item| item.is_table())
}

pub fn split_identifier_subtokens(s: &str) -> Vec<String> {
    let mut subtokens = Vec::new();
    let lower = s.to_lowercase();
    subtokens.push(lower.clone());

    let parts = s.split(|c: char| !c.is_alphanumeric());
    for part in parts {
        let p = part.trim().to_lowercase();
        if p.len() >= 2 && p != lower && !subtokens.contains(&p) {
            subtokens.push(p);
        }
    }

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
