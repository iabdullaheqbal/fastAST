"""
Test multi-language AST indexing support for FastAST.
Tests Python, Java, JavaScript, TypeScript, HTML, CSS, Rust, JSON, and TOML indexing.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "python"))

try:
    import pytest
except ImportError:
    pytest = None

from fastast import index_code


class TestPythonSupport:
    """Test Python language indexing support"""

    def test_index_python_file(self):
        if index_code is None:
            return
        code = """
class Calculator:
    def add(self, a, b):
        return a + b

def helper_function():
    pass

import os
"""
        result = index_code(code, language="python")
        assert result.has_syntax_error is False
        assert result.total_lines > 0
        assert len(result.symbols) > 0


class TestJavaSupport:
    """Test Java language indexing support"""

    def test_index_java_file(self):
        if index_code is None:
            return
        code = """
package com.example;

import java.util.ArrayList;

public class Calculator {
    public int add(int a, int b) {
        return a + b;
    }

    public static void main(String[] args) {
        Calculator c = new Calculator();
        System.out.println(c.add(5, 3));
    }
}
"""
        result = index_code(code, language="java")
        assert result.has_syntax_error is False
        assert result.total_lines > 0
        assert len(result.symbols) > 0


class TestJavaScriptSupport:
    """Test JavaScript language indexing support"""

    def test_index_javascript_file(self):
        if index_code is None:
            return
        code = """
import { useState } from 'react';

export function Counter() {
    const [count, setCount] = useState(0);
    return count;
}

export class Service {
    execute() {
        return true;
    }
}
"""
        result = index_code(code, language="javascript")
        assert result.has_syntax_error is False
        assert len(result.symbols) >= 2
        assert len(result.imports) >= 1


class TestTypeScriptSupport:
    """Test TypeScript language indexing support"""

    def test_index_typescript_file(self):
        if index_code is None:
            return
        code = """
export interface Config {
    host: string;
    port: number;
}

export function startServer(cfg: Config): boolean {
    return true;
}
"""
        result = index_code(code, language="typescript")
        assert result.has_syntax_error is False
        assert len(result.symbols) >= 2


class TestHTMLSupport:
    """Test HTML language indexing support"""

    def test_index_html_file(self):
        if index_code is None:
            return
        code = """
<!DOCTYPE html>
<html>
<head>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <header class="header"><h1>Title</h1></header>
    <main id="main-content"><p>Content</p></main>
</body>
</html>
"""
        result = index_code(code, language="html")
        assert result.has_syntax_error is False
        assert len(result.symbols) >= 1
        assert len(result.imports) >= 1


class TestCSSSupport:
    """Test CSS language indexing support"""

    def test_index_css_file(self):
        if index_code is None:
            return
        code = """
@import url("base.css");

body {
    margin: 0;
}

.header {
    background: #fff;
}
"""
        result = index_code(code, language="css")
        assert result.has_syntax_error is False
        assert len(result.symbols) >= 2
        assert len(result.imports) >= 1


class TestRustSupport:
    """Test Rust language indexing support"""

    def test_index_rust_file(self):
        if index_code is None:
            return
        code = """
use std::collections::HashMap;

pub struct Service {
    data: HashMap<String, String>,
}

impl Service {
    pub fn new() -> Self {
        Self { data: HashMap::new() }
    }
}
"""
        result = index_code(code, language="rust")
        assert result.has_syntax_error is False
        assert len(result.symbols) >= 2
        assert len(result.imports) >= 1


class TestJSONSupport:
    """Test JSON language indexing support"""

    def test_index_json_file(self):
        if index_code is None:
            return
        code = '{"name": "fastast", "dependencies": {"express": "^4.19"}}'
        result = index_code(code, language="json")
        assert result.has_syntax_error is False
        assert len(result.symbols) > 0
        assert len(result.imports) > 0


class TestTOMLSupport:
    """Test TOML language indexing support"""

    def test_index_toml_file(self):
        if index_code is None:
            return
        code = '[package]\nname = "fastast"\n[dependencies]\npyo3 = "0.21"'
        result = index_code(code, language="toml")
        assert result.has_syntax_error is False
        assert len(result.symbols) > 0
        assert len(result.imports) > 0


class TestErrorHandling:
    """Test error handling for invalid languages and syntax errors"""

    def test_invalid_language(self):
        if index_code is None:
            return
        code = "x = 1\n"
        try:
            index_code(code, language="ruby")
            assert False, "Should have raised ValueError"
        except ValueError as exc:
            assert "Unsupported language" in str(exc)

    def test_syntax_errors_gracefully_handled(self):
        if index_code is None:
            return
        code = "def broken(\n"
        result = index_code(code, language="python")
        assert result.has_syntax_error is True


if __name__ == "__main__":
    test_classes = [
        TestPythonSupport,
        TestJavaSupport,
        TestJavaScriptSupport,
        TestTypeScriptSupport,
        TestHTMLSupport,
        TestCSSSupport,
        TestRustSupport,
        TestJSONSupport,
        TestTOMLSupport,
        TestErrorHandling,
    ]
    for cls in test_classes:
        instance = cls()
        for name in dir(cls):
            if name.startswith("test_"):
                method = getattr(instance, name)
                method()
    print("All multi-language AST indexing tests passed successfully!")
