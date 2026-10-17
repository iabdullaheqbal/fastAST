"""Tests for HTML parsing, pruning, and indexing in FastAST."""

import json
import subprocess
import sys
from pathlib import Path

from fastast import index_code, prune_file

FIXTURES_DIR = Path(__file__).parent / "fixtures"


def test_html_pruning_basic():
    """Test pruning HTML document to keep target article while preserving hierarchy."""
    fixture_path = FIXTURES_DIR / "sample_simple.html"
    code = fixture_path.read_text(encoding="utf-8")

    res = prune_file(code, "article", threshold=0.3, language="html")
    assert not res.has_syntax_error

    # DOCTYPE and root structure preserved
    assert "<!DOCTYPE html>" in res.pruned_code
    assert "<html" in res.pruned_code
    assert "</html>" in res.pruned_code
    assert "<head>" in res.pruned_code
    assert "</head>" in res.pruned_code
    assert "<body>" in res.pruned_code
    assert "</body>" in res.pruned_code

    # Matched article kept with full content
    assert "<article>" in res.pruned_code
    assert "<h2>Article Title</h2>" in res.pruned_code
    assert "<p>This is a sample paragraph with some content.</p>" in res.pruned_code
    assert "</article>" in res.pruned_code

    # Unmatched elements stubbed or structural
    assert res.savings_pct > 0.0


def test_html_ancestor_closure():
    """Test that targeting a deep element preserves all ancestor tags as containers."""
    code = """<!DOCTYPE html>
<html>
<head><title>Form Page</title></head>
<body>
    <div id="wrapper">
        <header><p>Header info</p></header>
        <section id="content">
            <form id="login-form" action="/login" method="post">
                <label for="username">Username</label>
                <input type="text" id="username" name="username">
                <label for="password">Password</label>
                <input type="password" id="password" name="password">
                <button type="submit">Sign In</button>
            </form>
        </section>
        <footer><p>Footer info</p></footer>
    </div>
</body>
</html>
"""
    res = prune_file(code, "login-form password", threshold=0.3, language="html")
    assert not res.has_syntax_error

    # Ancestor container hierarchy closed and preserved
    assert '<div id="wrapper">' in res.pruned_code
    assert '<section id="content">' in res.pruned_code
    assert '<form id="login-form"' in res.pruned_code
    assert 'type="password"' in res.pruned_code
    assert "</form>" in res.pruned_code
    assert "</section>" in res.pruned_code
    assert "</div>" in res.pruned_code


def test_html_attribute_preservation():
    """Test that element attributes are preserved during pruning."""
    code = """<!DOCTYPE html>
<html>
<body>
    <div class="card card-featured" id="promo-banner" data-campaign="summer-2024">
        <h3>Special Offer</h3>
        <p>Get 50% discount today only!</p>
        <a href="/buy" class="btn btn-primary">Buy Now</a>
    </div>
    <div class="sidebar">
        <p>Unrelated sidebar content</p>
    </div>
</body>
</html>
"""
    res = prune_file(code, "promo-banner discount", threshold=0.3, language="html")
    assert not res.has_syntax_error

    # Attributes preserved
    assert 'class="card card-featured"' in res.pruned_code
    assert 'id="promo-banner"' in res.pruned_code
    assert 'data-campaign="summer-2024"' in res.pruned_code
    assert "Get 50% discount today only!" in res.pruned_code


def test_html_void_elements():
    """Test that HTML void elements (img, input, br, hr, meta, link) do not generate closing tags."""
    code = """<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="gallery">
        <img src="photo.jpg" alt="A photo" class="thumbnail">
        <br>
        <hr>
        <input type="text" name="search" placeholder="Search gallery">
    </div>
</body>
</html>
"""
    res = prune_file(code, "gallery photo", threshold=0.3, language="html")
    assert not res.has_syntax_error

    # Void elements should not have closing tags
    assert "</img>" not in res.pruned_code
    assert "</br>" not in res.pruned_code
    assert "</hr>" not in res.pruned_code
    assert "</input>" not in res.pruned_code
    assert "</meta>" not in res.pruned_code
    assert "</link>" not in res.pruned_code

    # Elements themselves are present
    assert '<img src="photo.jpg"' in res.pruned_code


def test_html_zero_semantic_match_skeleton():
    """Test that zero semantic matches produce a structural skeleton without content."""
    code = """<!DOCTYPE html>
<html>
<head>
    <title>Original Document</title>
</head>
<body>
    <header><h1>Big Header</h1></header>
    <main>
        <p>Some heavy paragraphs with lots of tokens that should all be omitted.</p>
        <p>More text that should be completely pruned away when nothing matches.</p>
    </main>
    <footer><p>Footer content</p></footer>
</body>
</html>
"""
    res = prune_file(code, "nonexistent_term_xyz", threshold=0.5, language="html")
    assert not res.has_syntax_error

    # Skeleton tags preserved
    assert "<!DOCTYPE html>" in res.pruned_code
    assert "<html" in res.pruned_code
    assert "</html>" in res.pruned_code
    assert "<body>" in res.pruned_code
    assert "</body>" in res.pruned_code

    # Content paragraphs should not be in the skeleton
    assert "Some heavy paragraphs" not in res.pruned_code
    assert "More text that should be completely pruned" not in res.pruned_code
    assert res.savings_pct > 0.0


def test_html_script_and_style_elements():
    """Test embedded script and style elements."""
    code = """<!DOCTYPE html>
<html>
<head>
    <style>
        .custom-widget { color: blue; }
    </style>
</head>
<body>
    <div id="widget-app">
        <p>Widget App Content</p>
    </div>
    <script>
        console.log("Widget initialized");
    </script>
</body>
</html>
"""
    res = prune_file(code, "widget-app initialized", threshold=0.3, language="html")
    assert not res.has_syntax_error
    assert '<div id="widget-app">' in res.pruned_code
    assert "Widget initialized" in res.pruned_code


def test_html_symbol_indexing():
    """Test indexing HTML tags, IDs, and classes into ExtractedSymbol structures."""
    code = """<!DOCTYPE html>
<html>
<head><title>Test</title></head>
<body>
    <header id="main-header" class="site-header">Header</header>
    <div id="content" class="container fluid">Content</div>
    <footer id="footer">Footer</footer>
</body>
</html>
"""
    index_res = index_code(code, language="html")
    assert not index_res.has_syntax_error
    assert len(index_res.symbols) > 0

    sym_names = [s.name for s in index_res.symbols]
    # Should index elements with tag, id, and class representations
    assert any("header" in name for name in sym_names)
    assert any("main-header" in name for name in sym_names)
    assert any("content" in name for name in sym_names)


def test_cli_prune_html():
    """Test CLI fastast prune on an HTML file with --json output."""
    fixture_path = FIXTURES_DIR / "sample_simple.html"
    result = subprocess.run(
        [
            sys.executable,
            "-m",
            "fastast.cli",
            "prune",
            str(fixture_path),
            "-q",
            "article",
            "--json",
        ],
        capture_output=True,
        text=True,
    )
    assert result.returncode == 0, f"CLI failed: {result.stderr}"
    data = json.loads(result.stdout)
    assert data["syntax_valid"] is True
    assert "<article>" in data["pruned_code"]
    assert data["savings_pct"] > 0
    assert data["latency_ms"] < 25.0


if __name__ == "__main__":
    test_html_pruning_basic()
    test_html_ancestor_closure()
    test_html_attribute_preservation()
    test_html_void_elements()
    test_html_zero_semantic_match_skeleton()
    test_html_script_and_style_elements()
    test_html_symbol_indexing()
    test_cli_prune_html()
    print("All 8 HTML tests passed successfully!")
