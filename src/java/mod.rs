//! Java language pruning engine with Tree-sitter AST parsing
//!
//! Three-module architecture:
//! 1. parser.rs: Tree-sitter AST parsing and scope extraction
//! 2. scorer.rs: Dual-rubric (semantic + structural) scoring
//! 3. repair.rs: Valid Java reconstruction with method stubs

pub mod parser;
pub mod scorer;
pub mod repair;

use crate::{count_tokens, PruneResult};

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

    // Parse AST
    let tree = match parser::parse_ast(code_text) {
        Ok(t) => t,
        Err(_) => {
            let elapsed = prune_start.elapsed().as_secs_f64() * 1000.0;
            return PruneResult {
                pruned_code: code_text.to_string(),
                original_tokens,
                pruned_tokens: original_tokens,
                savings_pct: 0.0,
                total_lines,
                kept_lines: total_lines,
                latency_ms: elapsed,
                has_syntax_error: true,
            };
        }
    };

    if tree.root_node().has_error() {
        let elapsed = prune_start.elapsed().as_secs_f64() * 1000.0;
        return PruneResult {
            pruned_code: code_text.to_string(),
            original_tokens,
            pruned_tokens: original_tokens,
            savings_pct: 0.0,
            total_lines,
            kept_lines: total_lines,
            latency_ms: elapsed,
            has_syntax_error: true,
        };
    }

    let source_bytes = code_text.as_bytes();
    
    // Extract scopes
    let scopes = parser::collect_scopes(&tree, source_bytes, &lines);
    
    // Score scopes
    let score_res = scorer::evaluate_scopes(&scopes, focus_query, threshold);
    
    // Reconstruct code
    let pruned_code = repair::reconstruct_code(&lines, &scopes, &score_res.decisions);

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