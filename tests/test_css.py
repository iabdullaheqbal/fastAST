"""Tests for CSS parsing, pruning, and indexing in FastAST."""

import json
import subprocess
import sys
from pathlib import Path

from fastast import index_code, prune_file

FIXTURES_DIR = Path(__file__).parent / "fixtures"


def test_css_ruleset_pruning_basic():
    """Test pruning CSS rulesets to keep target while removing unkept selectors."""
    fixture_path = FIXTURES_DIR / "sample_simple.css"
    code = fixture_path.read_text(encoding="utf-8")

    res = prune_file(code, "main", threshold=0.3, language="css")
    assert not res.has_syntax_error

    # Matched main ruleset kept with its property declarations
    assert "main {" in res.pruned_code
    assert "grid-template-columns: 2fr 1fr;" in res.pruned_code
    assert "gap: 20px;" in res.pruned_code

    # Unmatched top-level rulesets pruned away
    assert "background-color: #333;" not in res.pruned_code
    assert "article {" not in res.pruned_code
    assert "aside {" not in res.pruned_code
    assert "footer {" not in res.pruned_code

    # Nested main inside @media preserved via container closure
    assert "@media (max-width: 768px)" in res.pruned_code
    assert "grid-template-columns: 1fr;" in res.pruned_code

    assert res.savings_pct > 0.0


def test_css_media_query_nested_closure():
    """Test that targeting a ruleset inside @media keeps the enclosing @media block."""
    fixture_path = FIXTURES_DIR / "sample_simple.css"
    code = fixture_path.read_text(encoding="utf-8")

    res = prune_file(code, "nav ul gap", threshold=0.3, language="css")
    assert not res.has_syntax_error

    # Enclosing @media block must be preserved
    assert "@media (max-width: 768px)" in res.pruned_code

    # Matched nested ruleset kept in full inside media query
    assert "flex-direction: column;" in res.pruned_code
    assert "gap: 10px;" in res.pruned_code

    # Top-level nav matches kept
    assert "nav ul {" in res.pruned_code
    assert "display: flex;" in res.pruned_code


def test_css_imports_and_charset():
    """Test that @import and @charset statements are preserved unconditionally."""
    code = """@charset "UTF-8";
@import url("normalize.css");
@import "theme.css" screen;

.hero {
    font-size: 2rem;
    color: #111;
}

.card {
    background: white;
    padding: 16px;
}
"""
    res = prune_file(code, "hero", threshold=0.3, language="css")
    assert not res.has_syntax_error

    # @charset and @import preserved
    assert '@charset "UTF-8";' in res.pruned_code
    assert '@import url("normalize.css");' in res.pruned_code
    assert '@import "theme.css" screen;' in res.pruned_code

    # .hero kept with properties
    assert ".hero {" in res.pruned_code
    assert "font-size: 2rem;" in res.pruned_code

    # .card pruned away
    assert ".card {" not in res.pruned_code


def test_css_hyphenated_class_and_id_matching():
    """Test that hyphenated tokens (e.g., .btn-primary, #user-profile-header) match sub-tokens."""
    code = """/* Component Buttons */
.btn-primary {
    background-color: #007bff;
    color: white;
}

.btn-secondary {
    background-color: #6c757d;
    color: white;
}

#user-profile-header {
    border-bottom: 1px solid #ddd;
    margin-bottom: 20px;
}
"""
    # Query for sub-token "primary"
    res1 = prune_file(code, "primary", threshold=0.3, language="css")
    assert not res1.has_syntax_error
    assert ".btn-primary {" in res1.pruned_code
    assert "background-color: #007bff;" in res1.pruned_code
    assert ".btn-secondary {" not in res1.pruned_code

    # Query for sub-token "header"
    res2 = prune_file(code, "header", threshold=0.3, language="css")
    assert not res2.has_syntax_error
    assert "#user-profile-header {" in res2.pruned_code
    assert "border-bottom: 1px solid #ddd;" in res2.pruned_code
    assert ".btn-primary {" not in res2.pruned_code


def test_css_keyframes_and_supports():
    """Test @keyframes animations and @supports queries."""
    code = """@keyframes fadeIn {
    from {
        opacity: 0;
    }
    to {
        opacity: 1;
    }
}

@supports (display: grid) {
    .grid-layout {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
    }
}

.unrelated-box {
    width: 100px;
    height: 100px;
}
"""
    res = prune_file(code, "fadeIn grid-layout", threshold=0.3, language="css")
    assert not res.has_syntax_error

    # @keyframes fadeIn preserved
    assert "@keyframes fadeIn" in res.pruned_code
    assert "opacity: 0;" in res.pruned_code
    assert "opacity: 1;" in res.pruned_code

    # @supports grid preserved
    assert "@supports (display: grid)" in res.pruned_code
    assert ".grid-layout {" in res.pruned_code

    # Unrelated stripped
    assert ".unrelated-box" not in res.pruned_code


def test_css_zero_semantic_match_skeleton():
    """Test that zero semantic matches stub all rulesets to empty selectors."""
    code = """body {
    margin: 0;
    padding: 0;
    background: #000;
}

.container {
    width: 1200px;
    margin: 0 auto;
}

.card {
    padding: 24px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
"""
    res = prune_file(code, "nonexistent_term_xyz", threshold=0.5, language="css")
    assert not res.has_syntax_error

    # All selectors stubbed to {}
    assert "body {}" in res.pruned_code
    assert ".container {}" in res.pruned_code
    assert ".card {}" in res.pruned_code

    # Declarations stripped
    assert "margin: 0 auto;" not in res.pruned_code
    assert "box-shadow:" not in res.pruned_code
    assert res.savings_pct > 0.0


def test_css_symbol_indexing():
    """Test indexing CSS selectors, media queries, and keyframes into ExtractedSymbol items."""
    code = """@import "base.css";

header.site-header {
    color: red;
}

#nav-bar {
    display: flex;
}

@media (min-width: 1024px) {
    .desktop-only {
        display: block;
    }
}

@keyframes slideIn {
    from { transform: translateX(-100%); }
    to { transform: translateX(0); }
}
"""
    index_res = index_code(code, language="css")
    assert not index_res.has_syntax_error
    assert len(index_res.symbols) > 0

    sym_names = [s.name for s in index_res.symbols]
    # Check selector symbols
    assert any("header.site-header" in name for name in sym_names)
    assert any("#nav-bar" in name for name in sym_names)
    assert any("media" in name for name in sym_names)
    assert any("slideIn" in name for name in sym_names)


def test_cli_prune_css():
    """Test CLI fastast prune on a CSS file with --json output."""
    fixture_path = FIXTURES_DIR / "sample_simple.css"
    result = subprocess.run(
        [
            sys.executable,
            "-m",
            "fastast.cli",
            "prune",
            str(fixture_path),
            "-q",
            "main",
            "--json",
        ],
        capture_output=True,
        text=True,
    )
    assert result.returncode == 0, f"CLI failed: {result.stderr}"
    data = json.loads(result.stdout)
    assert data["syntax_valid"] is True
    assert "main {" in data["pruned_code"]
    assert "grid-template-columns: 2fr 1fr;" in data["pruned_code"]
    assert data["savings_pct"] > 0
    assert data["latency_ms"] < 25.0


if __name__ == "__main__":
    test_css_ruleset_pruning_basic()
    test_css_media_query_nested_closure()
    test_css_imports_and_charset()
    test_css_hyphenated_class_and_id_matching()
    test_css_keyframes_and_supports()
    test_css_zero_semantic_match_skeleton()
    test_css_symbol_indexing()
    test_cli_prune_css()
    print("All 8 CSS tests passed successfully!")
