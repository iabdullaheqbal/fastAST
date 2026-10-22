"""Tests for CSS AST parsing and indexing in FastAST."""

from pathlib import Path
from fastast import index_code

FIXTURES_DIR = Path(__file__).parent / "fixtures"


def test_css_symbol_indexing():
    """Test indexing CSS selectors, media queries, and keyframes into ExtractedSymbol items."""
    if index_code is None:
        return
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
    assert any("header.site-header" in name for name in sym_names)
    assert any("#nav-bar" in name for name in sym_names)
    assert any("slideIn" in name for name in sym_names)
    assert len(index_res.imports) >= 1


if __name__ == "__main__":
    test_css_symbol_indexing()
    print("All CSS AST indexing tests passed successfully!")
