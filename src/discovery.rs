//! File admission and discovery layer for FastAST (Repo-level pruning).

use pyo3::prelude::*;
use std::path::Path;
use xxhash_rust::xxh3::xxh3_64;

/// Computes the xxHash3 64-bit hexadecimal string for the given byte slice.
#[pyfunction]
pub fn compute_xxh3(data: &[u8]) -> String {
    let hash = xxh3_64(data);
    format!("{:016x}", hash)
}

/// Checks whether a byte slice appears to be binary by checking for null bytes.
#[pyfunction]
pub fn is_binary_content(data: &[u8]) -> bool {
    let check_len = data.len().min(1024);
    data[..check_len].contains(&0)
}

/// Fast file classification heuristic.
#[pyfunction]
pub fn classify_path(path_str: &str) -> String {
    let path = Path::new(path_str);
    let file_name = path
        .file_name()
        .and_then(|s| s.to_str())
        .unwrap_or("")
        .to_lowercase();
    let lower_path = path_str.to_lowercase().replace('\\', "/");

    // 1. Generated checks
    if lower_path.contains("/generated/")
        || lower_path.contains("/gen/")
        || lower_path.contains("/dist/")
        || lower_path.contains("/build/")
        || lower_path.contains("/out/")
        || file_name.ends_with(".min.js")
        || file_name.ends_with(".min.css")
        || file_name.ends_with("_pb2.py")
        || file_name.ends_with(".bundle.js")
        || file_name.ends_with(".lock")
        || file_name == "cargo.lock"
        || file_name == "package-lock.json"
        || file_name == "uv.lock"
    {
        return "generated".to_string();
    }

    // 2. Test checks
    if file_name.starts_with("test_")
        || file_name.ends_with("_test.py")
        || file_name.ends_with("_test.rs")
        || file_name.ends_with(".test.ts")
        || file_name.ends_with(".test.js")
        || file_name.ends_with(".spec.ts")
        || file_name.ends_with(".spec.js")
        || file_name.ends_with("test.java")
        || lower_path.contains("/tests/")
        || lower_path.contains("/test/")
        || lower_path.contains("/__tests__/")
        || lower_path.contains("/spec/")
    {
        return "test".to_string();
    }

    // 3. Infra checks
    if file_name.starts_with("dockerfile")
        || file_name.starts_with("docker-compose")
        || file_name == "makefile"
        || file_name.ends_with(".tf")
        || file_name.ends_with(".hcl")
        || file_name == "procfile"
        || lower_path.contains("/.github/")
        || lower_path.contains("/.gitlab/")
        || lower_path.contains("/k8s/")
        || lower_path.contains("/kubernetes/")
        || lower_path.contains("/terraform/")
        || lower_path.contains("/ci/")
        || lower_path.contains("/deploy/")
    {
        return "infra".to_string();
    }

    // 4. Docs checks
    if file_name.ends_with(".md")
        || file_name.ends_with(".markdown")
        || file_name.ends_with(".rst")
        || file_name.ends_with(".txt")
        || file_name.starts_with("readme")
        || file_name.starts_with("license")
        || file_name.starts_with("changelog")
        || file_name.starts_with("architecture")
        || lower_path.contains("/docs/")
        || lower_path.contains("/doc/")
    {
        return "docs".to_string();
    }

    // 5. Config checks
    if file_name.ends_with(".json")
        || file_name.ends_with(".toml")
        || file_name.ends_with(".yaml")
        || file_name.ends_with(".yml")
        || file_name.ends_with(".ini")
        || file_name.ends_with(".cfg")
        || file_name.starts_with(".env")
        || file_name.contains("config")
        || file_name == "cargo.toml"
        || file_name == "pyproject.toml"
        || file_name == "package.json"
    {
        return "config".to_string();
    }

    // 6. Source default
    if let Some(ext) = path.extension().and_then(|s| s.to_str()) {
        match ext.to_lowercase().as_str() {
            "py" | "pyi" | "js" | "jsx" | "ts" | "tsx" | "java" | "rs" | "html" | "htm"
            | "css" | "c" | "cpp" | "h" | "hpp" | "go" | "sh" => "source".to_string(),
            _ => "other".to_string(),
        }
    } else {
        "other".to_string()
    }
}

