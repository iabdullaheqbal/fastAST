//! Python AST parser using Tree-sitter

use std::cell::RefCell;
use tree_sitter::{Parser, Tree};

thread_local! {
    static PARSER: RefCell<Parser> = RefCell::new({
        let mut p = Parser::new();
        let lang = tree_sitter_python::language();
        p.set_language(&lang).expect("Error loading Python grammar");
        p
    });
}

/// Parse Python source code into a Tree-sitter AST Tree
pub fn parse_ast(code: &str) -> Result<Tree, String> {
    PARSER.with(|parser_cell| {
        let mut parser = parser_cell.borrow_mut();
        parser.parse(code, None).ok_or_else(|| "Failed to parse code into AST".to_string())
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_valid_python() {
        let tree = parse_ast("def foo():\n    return 42\n").unwrap();
        assert!(!tree.root_node().has_error());
    }

    #[test]
    fn test_parse_invalid_python() {
        let tree = parse_ast("def foo(:\n").unwrap();
        assert!(tree.root_node().has_error());
    }
}
