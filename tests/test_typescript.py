"""Tests for TypeScript and TSX AST parsing and indexing in FastAST."""

import textwrap
from pathlib import Path
from fastast import index_code

FIXTURES_DIR = Path(__file__).parent / "fixtures"


def test_ts_symbol_indexing():
    """Test AST symbol extraction for TypeScript and TSX."""
    if index_code is None:
        return
    fixture_path = FIXTURES_DIR / "sample_simple.tsx"
    code = fixture_path.read_text(encoding="utf-8")

    res = index_code(code, language="tsx")
    assert not res.has_syntax_error
    assert res.total_lines > 30

    symbol_names = [s.name for s in res.symbols]
    assert "UserProfile" in symbol_names
    assert "UserCardProps" in symbol_names
    assert "userCard" in symbol_names
    assert "adminDashboard" in symbol_names
    assert "renderApp" in symbol_names

    # Check symbol kinds
    interface_syms = [s for s in res.symbols if s.kind == "interface"]
    assert any(s.name == "UserProfile" for s in interface_syms)
    assert any(s.name == "UserCardProps" for s in interface_syms)

    arrow_syms = [s for s in res.symbols if "arrow" in s.kind]
    assert any(s.name == "userCard" for s in arrow_syms)
    assert any(s.name == "adminDashboard" for s in arrow_syms)

    func_syms = [s for s in res.symbols if s.kind == "function"]
    assert any(s.name == "renderApp" for s in func_syms)


def test_ts_call_graph_and_docstring_indexing():
    """Test docstring and call graph extraction for TypeScript."""
    if index_code is None:
        return
    code = textwrap.dedent("""\
        /**
         * Service managing user authentication.
         */
        export class AuthService {
            /**
             * Authenticates user with credentials.
             */
            public async login(user: string, pass: string): Promise<boolean> {
                const hash = this.hashPassword(pass);
                return this.verifyUser(user, hash);
            }

            private hashPassword(p: string): string {
                return `hash_${p}`;
            }

            private verifyUser(u: string, h: string): boolean {
                return u.length > 0 && h.length > 0;
            }
        }
    """)
    idx = index_code(code, language="typescript")
    assert not idx.has_syntax_error

    # Check docstring extraction
    auth_service = next(s for s in idx.symbols if s.name == "AuthService")
    assert auth_service.docstring is not None
    assert "Service managing user authentication" in auth_service.docstring

    login_method = next(s for s in idx.symbols if s.name == "login")
    assert login_method.docstring is not None
    assert "Authenticates user with credentials" in login_method.docstring
    assert login_method.parent_name == "AuthService"

    # Check calls
    call_callees = [c.callee_name for c in idx.calls if c.caller_name == "login"]
    assert "hashPassword" in call_callees or "this.hashPassword" in call_callees
    assert "verifyUser" in call_callees or "this.verifyUser" in call_callees


if __name__ == "__main__":
    test_ts_symbol_indexing()
    test_ts_call_graph_and_docstring_indexing()
    print("All TypeScript AST indexing tests passed successfully!")
