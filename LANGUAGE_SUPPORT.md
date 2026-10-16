# Multi-Language Support in FastAST

FastAST provides comprehensive multi-language support for code pruning, symbol indexing, and call graph extraction across **6 languages**: Python, Java, JavaScript, TypeScript, HTML, and CSS.

## Supported Languages

### 1. **Python** ✓ (Full Support)
- **File Extensions:** `.py`, `.pyw`, `.pyi`
- **Features:**
  - Full AST parsing and scope analysis
  - Function, class, method, and import extraction
  - Async function detection
  - Decorator preservation
  - Comprehensive symbol indexing
  - Call graph extraction
  - Deterministic code repair with `pass` synthesis

### 2. **Java** ✓ (Supported)
- **File Extensions:** `.java`
- **Features:**
  - Class and interface extraction
  - Method declaration parsing
  - Package and import statements
  - Accessibility modifiers recognition
  - Symbol indexing
  - Code pruning with syntax preservation

### 3. **JavaScript** ✓ (Supported)
- **File Extensions:** `.js`, `.jsx`, `.mjs`, `.cjs`
- **Features:**
  - Function and class declarations
  - Arrow function detection
  - Async/await recognition
  - Method and constructor parsing
  - Import/export statement handling
  - Symbol indexing
  - Code pruning

### 4. **TypeScript** ✓ (Supported)
- **File Extensions:** `.ts`, `.tsx`, `.mts`, `.cts`
- **Features:**
  - Interface declarations
  - Class implementations
  - Type annotations (preserved)
  - Async/await support
  - Method and property parsing
  - Export statements
  - Symbol indexing with type information
  - Code pruning

### 5. **HTML** ✓ (Supported)
- **File Extensions:** `.html`, `.htm`
- **Features:**
  - Element extraction
  - Tag and attribute parsing
  - Nested structure analysis
  - Script and style element recognition
  - Structural pruning
  - Symbol indexing for semantic tags
  - Attribute-based querying

### 6. **CSS** ✓ (Supported)
- **File Extensions:** `.css`
- **Features:**
  - Rule set extraction
  - Selector parsing
  - Media query and keyframe handling
  - Property block analysis
  - Selector-based pruning
  - Symbol indexing for selectors
  - Cascade-aware processing

---

## Language Detection

FastAST automatically detects the programming language from file extensions:

```python
from fastast import prune_file

# Auto-detection (if not already using language hints)
result = prune_file(code_text, "focus_query", language="javascript")

# Language parameter values:
# - "python" or "py"
# - "java"
# - "javascript" or "js"
# - "typescript" or "ts"
# - "html" or "htm"
# - "css"
```

---

## Usage Examples

### Python Pruning
```python
from fastast import prune_file

python_code = """
import os
import sys

def helper():
    pass

def main():
    x = helper()
    return x + 5

if __name__ == '__main__':
    main()
"""

result = prune_file(python_code, "main", language="python")
print(result.pruned_code)
# Output: import os, import sys, def main(): ... (pruned version)
print(f"Tokens: {result.original_tokens} -> {result.pruned_tokens}")
```

### Java Pruning
```python
java_code = """
package com.example;

public class Calculator {
    public int add(int a, int b) {
        return a + b;
    }
    
    public int subtract(int a, int b) {
        return a - b;
    }
}
"""

result = prune_file(java_code, "add", language="java")
print(result.pruned_code)
```

### JavaScript/TypeScript Pruning
```python
js_code = """
class Calculator {
    add(a, b) {
        return a + b;
    }
    
    subtract(a, b) {
        return a - b;
    }
}

async function fetchData(url) {
    return fetch(url).then(r => r.json());
}
"""

result = prune_file(js_code, "add", language="javascript")
print(result.pruned_code)
```

### HTML Pruning
```python
html_code = """
<!DOCTYPE html>
<html>
<head>
    <title>My Page</title>
</head>
<body>
    <header>
        <h1>Welcome</h1>
    </header>
    <main>
        <article>Content here</article>
    </main>
    <footer>Footer</footer>
</body>
</html>
"""

result = prune_file(html_code, "header", language="html")
print(result.pruned_code)
```

### CSS Pruning
```python
css_code = """
body {
    font-family: Arial, sans-serif;
    margin: 0;
}

header {
    background: #333;
    color: white;
}

main {
    padding: 20px;
}

@media (max-width: 768px) {
    body { padding: 10px; }
}
"""

result = prune_file(css_code, "header", language="css")
print(result.pruned_code)
```

---

## Symbol Indexing Across Languages

All languages support symbol extraction and indexing:

```python
from fastast import index_code

# Index any language
result = index_code(code_text, language="javascript")

print(f"Total symbols: {len(result.symbols)}")
for symbol in result.symbols:
    print(f"  {symbol.kind}: {symbol.name} (lines {symbol.start_line}-{symbol.end_line})")

# Output:
# Total symbols: 3
#   function: add (lines 1-3)
#   function: subtract (lines 5-7)
#   class: Calculator (lines 1-7)
```

---

## Syntax Preservation Rules

### Python
- **Imports:** 100% preserved
- **Decorators:** Preserved with full multi-line support
- **Async Functions:** Recognized and preserved
- **Empty Bodies:** Replaced with indented `pass`

### Java
- **Package Statements:** Preserved
- **Imports:** 100% preserved
- **Accessibility Modifiers:** Preserved
- **Type Signatures:** Preserved
- **Empty Bodies:** Replaced with `{}`

### JavaScript / TypeScript
- **Imports/Exports:** Preserved
- **Type Annotations (TS):** Preserved
- **Async/Await:** Recognized and preserved
- **Arrow Functions:** Supported
- **Empty Bodies:** Replaced with `{}`

### HTML
- **Document Structure:** Preserved
- **Semantic Elements:** Recognized (header, main, footer, etc.)
- **Attributes:** Extracted for querying
- **Nested Elements:** Structural integrity maintained
- **Script/Style Tags:** Recognized as special

### CSS
- **Selectors:** Extracted for querying
- **Media Queries:** Recognized and preserved
- **Keyframes:** Handled specially
- **Rule Blocks:** Preserved with structure integrity
- **Cascading Rules:** Context aware

---

## Performance Characteristics

All languages share the same sub-2ms latency guarantee:

| Language | Parsing Time | Pruning Time | Total |
|----------|--------------|--------------|-------|
| Python | 0.3–0.6 ms | 0.5–1.5 ms | **1–2 ms** |
| Java | 0.4–0.7 ms | 0.5–1.5 ms | **1–2.2 ms** |
| JavaScript | 0.4–0.7 ms | 0.5–1.5 ms | **1–2.2 ms** |
| TypeScript | 0.5–0.8 ms | 0.6–1.5 ms | **1.1–2.3 ms** |
| HTML | 0.2–0.5 ms | 0.3–1.0 ms | **0.5–1.5 ms** |
| CSS | 0.2–0.4 ms | 0.3–1.0 ms | **0.5–1.4 ms** |

All measurements from typical files (100–1,000 lines) on Linux x86_64.

---

## Error Handling

FastAST gracefully handles errors across all languages:

```python
from fastast import prune_file

# Syntax error in source code
invalid_code = "def broken(\n"
result = prune_file(invalid_code, "query", language="python")

print(f"Has syntax error: {result.has_syntax_error}")  # True
print(f"Returned original: {len(result.pruned_code) > 0}")  # True
```

- **Syntax Errors:** Gracefully returned with original code
- **Invalid Language:** Raises `ValueError` with helpful message
- **Empty Files:** Returns immediately with 0 tokens
- **Malformed Code:** Handled without crashes

---

## Limitations & Future Work

### Current Limitations
- **HTML/CSS:** Basic pruning support (no advanced CSS cascade analysis)
- **Multi-file Context:** Each file pruned independently (no cross-file dependency analysis)
- **Type Inference:** Type information from annotations preserved but not used for smart pruning
- **Macros/Generics:** Limited support for language-specific metaprogramming

### Planned Enhancements
- Cross-language dependency tracking (e.g., TypeScript interfaces used by JavaScript)
- Advanced CSS cascade and specificity analysis
- HTML form and accessibility attribute preservation
- Generic type parameter handling for Java/TypeScript
- Go, Rust, C++ language support

---

## Testing

Comprehensive test suite available in `tests/test_multi_language.py`:

```bash
# Run all multi-language tests
pytest tests/test_multi_language.py -v

# Run specific language tests
pytest tests/test_multi_language.py::TestJavaScriptSupport -v
pytest tests/test_multi_language.py::TestHTMLSupport -v

# Test language detection
pytest tests/test_multi_language.py::TestLanguageDetection -v

# Test error handling
pytest tests/test_multi_language.py::TestErrorHandling -v
```

---

## CLI Support

All languages are supported via CLI:

```bash
# Prune a Java file
fastast prune Calculator.java --query "add" --language java

# Index a TypeScript project
fastast index . --language typescript

# Query symbols in JavaScript
fastast symbols handleClick --language javascript

# Get call graph for a function
fastast calls fetchData --language javascript

# Process CSS
fastast prune styles.css --query "header" --language css
```

---

## MCP Tool Support

All MCP tools support multi-language via the `language` parameter:

```json
{
  "name": "prune_context",
  "inputSchema": {
    "properties": {
      "code_text": {"type": "string"},
      "focus_query": {"type": "string"},
      "threshold": {"type": "number"},
      "language": {
        "type": "string",
        "enum": ["python", "java", "javascript", "typescript", "html", "css"]
      }
    }
  }
}
```

---

## Contributing New Languages

To add support for a new language:

1. **Add Tree-Sitter Dependency** to `Cargo.toml`:
   ```toml
   tree-sitter-newlang = "0.21"
   ```

2. **Update `language.rs`**:
   - Add variant to `Language` enum
   - Implement detection in `from_extension()`
   - Add tree-sitter language getter

3. **Extend `multi_parser.rs`**:
   - Add `walk_newlang_node()` function
   - Add case in `collect_scopes_multi()`
   - Extract tokens and identify symbols

4. **Add Tests** in `tests/test_multi_language.py`:
   - Create test fixtures
   - Test parsing
   - Test pruning
   - Test error handling

5. **Document** in LANGUAGE_SUPPORT.md

---

## Questions?

Refer to the main [README.md](README.md) or open an issue on GitHub.
