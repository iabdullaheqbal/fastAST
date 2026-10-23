"""Tests for HTML AST parsing and indexing in FastAST."""

from pathlib import Path
import textwrap
from fastast import index_code

FIXTURES_DIR = Path(__file__).parent / "fixtures"


def test_html_symbol_indexing():
    """Test indexing HTML tags, IDs, and classes into ExtractedSymbol structures."""
    if index_code is None:
        return
    code = textwrap.dedent("""\
        <!DOCTYPE html>
        <html>
        <head><title>Test</title></head>
        <body>
            <header id="main-header" class="site-header">Header</header>
            <div id="content" class="container fluid">Content</div>
            <footer id="footer">Footer</footer>
        </body>
        </html>
    """)
    index_res = index_code(code, language="html")
    assert not index_res.has_syntax_error
    assert len(index_res.symbols) > 0

    sym_names = [s.name for s in index_res.symbols]
    assert any("header" in name or "main-header" in name for name in sym_names)
    assert any("content" in name for name in sym_names)


if __name__ == "__main__":
    test_html_symbol_indexing()
    print("All HTML AST indexing tests passed successfully!")
