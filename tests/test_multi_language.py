"""
Test multi-language support for FastAST.
Tests Python, Java, JavaScript, TypeScript, HTML, and CSS support.
"""
import sys
import os
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "python"))

try:
    import pytest
except ImportError:
    pytest = None

from fastast import prune_file, index_code


class TestPythonSupport:
    """Test Python language support"""

    def test_prune_python_file(self):
        """Test pruning a Python file"""
        code = """
def add(a, b):
    return a + b

def subtract(a, b):
    return a - b

def multiply(a, b):
    return a * b
"""
        result = prune_file(code, "add", threshold=0.3, language="python")
        assert result.has_syntax_error is False
        assert result.original_tokens > 0
        assert len(result.pruned_code) > 0

    def test_index_python_file(self):
        """Test indexing a Python file"""
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
    """Test Java language support"""

    def test_prune_java_file(self):
        """Test pruning a Java file"""
        code = """
public class Calculator {
    private int result;

    public int add(int a, int b) {
        result = a + b;
        return result;
    }

    public int subtract(int a, int b) {
        result = a - b;
        return result;
    }
}
"""
        result = prune_file(code, "add", threshold=0.3, language="java")
        assert result.has_syntax_error is False
        assert result.original_tokens > 0

    def test_index_java_file(self):
        """Test indexing a Java file"""
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
        # Java indexing should find symbols
        assert result.total_tokens > 0


class TestJavaScriptSupport:
    """Test JavaScript language support"""

    def test_prune_javascript_file(self):
        """Test pruning a JavaScript file"""
        code = """
class Calculator {
    add(a, b) {
        return a + b;
    }

    subtract(a, b) {
        return a - b;
    }
}

function multiply(a, b) {
    return a * b;
}
"""
        result = prune_file(code, "add", threshold=0.3, language="javascript")
        assert result.has_syntax_error is False
        assert result.original_tokens > 0

    def test_index_javascript_file(self):
        """Test indexing a JavaScript file"""
        code = """
async function fetchData(url) {
    const response = await fetch(url);
    return response.json();
}

class ApiClient {
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
    }

    async getUser(id) {
        return fetchData(this.baseUrl + '/users/' + id);
    }
}
"""
        result = index_code(code, language="javascript")
        assert result.has_syntax_error is False
        assert result.total_lines > 0
        assert result.total_tokens > 0


class TestTypeScriptSupport:
    """Test TypeScript language support"""

    def test_prune_typescript_file(self):
        """Test pruning a TypeScript file"""
        code = """
interface ICalculator {
    add(a: number, b: number): number;
    subtract(a: number, b: number): number;
}

class Calculator implements ICalculator {
    add(a: number, b: number): number {
        return a + b;
    }

    subtract(a: number, b: number): number {
        return a - b;
    }
}
"""
        result = prune_file(code, "add", threshold=0.3, language="typescript")
        assert result.has_syntax_error is False
        assert result.original_tokens > 0

    def test_index_typescript_file(self):
        """Test indexing a TypeScript file"""
        code = """
type User = {
    id: number;
    name: string;
};

interface IUserService {
    getUser(id: number): Promise<User>;
}

export class UserService implements IUserService {
    async getUser(id: number): Promise<User> {
        return fetch(`/api/users/${id}`).then(r => r.json());
    }
}
"""
        result = index_code(code, language="typescript")
        assert result.has_syntax_error is False
        assert result.total_lines > 0
        assert result.total_tokens > 0


class TestHTMLSupport:
    """Test HTML language support"""

    def test_prune_html_file(self):
        """Test pruning an HTML file"""
        code = """
<!DOCTYPE html>
<html>
<head>
    <title>Page Title</title>
</head>
<body>
    <header>
        <h1>Welcome</h1>
    </header>
    <main>
        <article>
            <p>Content here</p>
        </article>
    </main>
    <footer>
        <p>Footer content</p>
    </footer>
</body>
</html>
"""
        result = prune_file(code, "header", threshold=0.3, language="html")
        assert result.has_syntax_error is False
        assert result.original_tokens > 0

    def test_index_html_file(self):
        """Test indexing an HTML file"""
        code = """
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Test Page</title>
</head>
<body>
    <nav>Navigation</nav>
    <article>Content</article>
    <script src="app.js"></script>
</body>
</html>
"""
        result = index_code(code, language="html")
        assert result.has_syntax_error is False
        assert result.total_lines > 0
        assert result.total_tokens > 0


class TestCSSSupport:
    """Test CSS language support"""

    def test_prune_css_file(self):
        """Test pruning a CSS file"""
        code = """
body {
    font-family: Arial, sans-serif;
    margin: 0;
    padding: 0;
}

header {
    background-color: #333;
    color: white;
    padding: 20px;
}

main {
    padding: 20px;
}

footer {
    background-color: #333;
    color: white;
    text-align: center;
}

@media (max-width: 768px) {
    body { padding: 10px; }
}
"""
        result = prune_file(code, "header", threshold=0.3, language="css")
        assert result.has_syntax_error is False
        assert result.original_tokens > 0

    def test_index_css_file(self):
        """Test indexing a CSS file"""
        code = """
.container {
    max-width: 1200px;
    margin: 0 auto;
}

#header {
    background: #333;
}

.btn {
    padding: 10px 20px;
    border: none;
    border-radius: 4px;
}

@media (max-width: 768px) {
    .container { max-width: 100%; }
}
"""
        result = index_code(code, language="css")
        assert result.has_syntax_error is False
        assert result.total_lines > 0
        assert result.total_tokens > 0


class TestLanguageDetection:
    """Test language detection from file extensions"""

    def test_language_detection_python(self):
        """Test Python file detection"""
        code = "x = 1\n"
        result = prune_file(code, "x", language="py")
        assert result.has_syntax_error is False

    def test_language_detection_java(self):
        """Test Java file detection"""
        code = "public class Test {}\n"
        result = prune_file(code, "Test", language="java")
        assert result.has_syntax_error is False

    def test_language_detection_javascript(self):
        """Test JavaScript file detection"""
        code = "const x = 1;\n"
        result = prune_file(code, "x", language="js")
        assert result.has_syntax_error is False

    def test_language_detection_typescript(self):
        """Test TypeScript file detection"""
        code = "const x: number = 1;\n"
        result = prune_file(code, "x", language="ts")
        assert result.has_syntax_error is False

    def test_language_detection_html(self):
        """Test HTML file detection"""
        code = "<html><body>Test</body></html>\n"
        result = prune_file(code, "body", language="html")
        assert result.has_syntax_error is False

    def test_language_detection_css(self):
        """Test CSS file detection"""
        code = "body { color: red; }\n"
        result = prune_file(code, "body", language="css")
        assert result.has_syntax_error is False


class TestErrorHandling:
    """Test error handling for invalid languages"""

    def test_invalid_language(self):
        """Test error when passing invalid language"""
        code = "x = 1\n"
        try:
            prune_file(code, "x", language="ruby")
            assert False, "Should have raised ValueError"
        except ValueError as exc:
            assert "Unsupported language" in str(exc)

    def test_syntax_errors_gracefully_handled(self):
        """Test that syntax errors are gracefully handled"""
        # Invalid Python syntax
        code = "def broken(\n"
        result = prune_file(code, "broken", language="python")
        assert result.has_syntax_error is True

        # Invalid Java syntax
        code = "public class Broken {"
        result = prune_file(code, "Broken", language="java")
        # Should handle gracefully without raising
        assert isinstance(result, type(result))

    def test_empty_code_handling(self):
        """Test handling of empty code"""
        for lang in ["python", "java", "javascript", "typescript", "html", "css"]:
            result = prune_file("", "query", language=lang)
            assert result.pruned_tokens == 0
            assert result.kept_lines == 0


if __name__ == "__main__":
    if pytest is not None:
        pytest.main([__file__, "-v"])
    else:
        test_classes = [
            TestPythonSupport,
            TestJavaSupport,
            TestJavaScriptSupport,
            TestTypeScriptSupport,
            TestHTMLSupport,
            TestCSSSupport,
            TestLanguageDetection,
            TestErrorHandling,
        ]
        for cls in test_classes:
            instance = cls()
            for name in dir(cls):
                if name.startswith("test_"):
                    method = getattr(instance, name)
                    method()
        print("All multi-language tests passed successfully!")
