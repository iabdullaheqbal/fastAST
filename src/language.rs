/// Language detection and configuration module
use std::path::Path;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum Language {
    Python,
    Java,
    JavaScript,
    TypeScript,
    HTML,
    CSS,
    Rust,
}

impl Language {
    /// Detect language from file extension
    pub fn from_extension(ext: &str) -> Option<Language> {
        match ext.to_lowercase().as_str() {
            "py" | "pyw" | "pyi" => Some(Language::Python),
            "java" => Some(Language::Java),
            "js" | "jsx" | "mjs" | "cjs" => Some(Language::JavaScript),
            "ts" | "tsx" | "mts" | "cts" => Some(Language::TypeScript),
            "html" | "htm" => Some(Language::HTML),
            "css" => Some(Language::CSS),
            "rs" => Some(Language::Rust),
            _ => None,
        }
    }

    /// Detect language from file path
    pub fn from_path(path: &str) -> Option<Language> {
        Path::new(path)
            .extension()
            .and_then(|e| e.to_str())
            .and_then(Self::from_extension)
    }

    /// Get the comment-style placeholder for empty blocks
    pub fn empty_block_placeholder(&self) -> &'static str {
        match self {
            Language::Python => "pass",
            Language::Java | Language::JavaScript | Language::TypeScript | Language::CSS | Language::Rust => "/* empty */",
            Language::HTML => "<!-- empty -->",
        }
    }

    /// Get typical block start character
    pub fn block_start(&self) -> Option<char> {
        match self {
            Language::Python => None, // Python uses indentation
            Language::Java | Language::JavaScript | Language::TypeScript | Language::CSS | Language::Rust => Some('{'),
            Language::HTML => Some('<'),
        }
    }

    /// Get typical block end character
    pub fn block_end(&self) -> Option<char> {
        match self {
            Language::Python => None,
            Language::Java | Language::JavaScript | Language::TypeScript | Language::CSS | Language::Rust => Some('}'),
            Language::HTML => Some('>'),
        }
    }

    /// Get the tree-sitter language instance
    pub fn tree_sitter_language(&self) -> tree_sitter::Language {
        match self {
            Language::Python => tree_sitter_python::language(),
            Language::Java => tree_sitter_java::language(),
            Language::JavaScript => tree_sitter_javascript::language(),
            Language::TypeScript => tree_sitter_typescript::language_typescript(),
            Language::HTML => tree_sitter_html::language(),
            Language::CSS => tree_sitter_css::language(),
            Language::Rust => tree_sitter_rust::language(),
        }
    }

    /// Check if this language uses braces for blocks
    pub fn uses_braces(&self) -> bool {
        matches!(
            self,
            Language::Java | Language::JavaScript | Language::TypeScript | Language::CSS | Language::Rust
        )
    }

    /// Check if this language uses indentation for blocks
    pub fn uses_indentation(&self) -> bool {
        matches!(self, Language::Python)
    }

    /// Check if this language uses tags (HTML/XML style)
    pub fn uses_tags(&self) -> bool {
        matches!(self, Language::HTML)
    }

    /// Get language name as string
    pub fn name(&self) -> &'static str {
        match self {
            Language::Python => "Python",
            Language::Java => "Java",
            Language::JavaScript => "JavaScript",
            Language::TypeScript => "TypeScript",
            Language::HTML => "HTML",
            Language::CSS => "CSS",
            Language::Rust => "Rust",
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_from_extension() {
        assert_eq!(Language::from_extension("py"), Some(Language::Python));
        assert_eq!(Language::from_extension("java"), Some(Language::Java));
        assert_eq!(Language::from_extension("js"), Some(Language::JavaScript));
        assert_eq!(Language::from_extension("ts"), Some(Language::TypeScript));
        assert_eq!(Language::from_extension("tsx"), Some(Language::TypeScript));
        assert_eq!(Language::from_extension("html"), Some(Language::HTML));
        assert_eq!(Language::from_extension("htm"), Some(Language::HTML));
        assert_eq!(Language::from_extension("css"), Some(Language::CSS));
        assert_eq!(Language::from_extension("rs"), Some(Language::Rust));
        assert_eq!(Language::from_extension("unknown"), None);
    }

    #[test]
    fn test_from_path() {
        assert_eq!(
            Language::from_path("test.py"),
            Some(Language::Python)
        );
        assert_eq!(
            Language::from_path("/path/to/Main.java"),
            Some(Language::Java)
        );
        assert_eq!(
            Language::from_path("app.tsx"),
            Some(Language::TypeScript)
        );
        assert_eq!(
            Language::from_path("index.html"),
            Some(Language::HTML)
        );
        assert_eq!(
            Language::from_path("style.css"),
            Some(Language::CSS)
        );
        assert_eq!(
            Language::from_path("lib.rs"),
            Some(Language::Rust)
        );
    }
}
