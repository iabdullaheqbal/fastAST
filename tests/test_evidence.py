"""Tests for Phase 6: Evidence Materializer (File-level pruning)."""

import io
import json
import sqlite3
import tempfile
import unittest
from contextlib import redirect_stdout
from pathlib import Path

from fastast.cli import run_evidence, run_outline, run_snippet
from fastast.evidence import (
    EvidenceMaterializer,
    build_evidence_bundle,
    get_file_outline,
    get_snippet,
    get_symbol_evidence,
)
from fastast.indexer import index_repository
from fastast.model import Candidate, EvidenceWindow


class TestEvidenceMaterializer(unittest.TestCase):
    """Test EvidenceMaterializer, snippets, outlines, and packaging rules."""

    def setUp(self):
        self.tmpdir = tempfile.TemporaryDirectory()
        self.root = Path(self.tmpdir.name)

        # Create multi-file project with classes, methods, and functions
        (self.root / "services").mkdir(parents=True)
        (self.root / "models").mkdir(parents=True)

        (self.root / "services" / "auth.py").write_text(
            '"""Authentication service handling tokens and credentials."""\n\n'
            "class BaseService:\n"
            '    """Base service class."""\n'
            "    def ping(self) -> bool:\n"
            "        return True\n\n"
            "class AuthService(BaseService):\n"
            '    """Handles user login and token generation."""\n'
            "    def __init__(self, secret: str):\n"
            "        self.secret = secret\n\n"
            "    def login(self, username: str, password: str) -> bool:\n"
            '        """Validate user password against stored hash."""\n'
            "        hashed = hash_password(password)\n"
            "        return len(username) > 0 and len(hashed) > 0\n\n"
            "    def verify_token(self, token: str) -> bool:\n"
            "        return token == self.secret\n\n"
            "def hash_password(pwd: str) -> str:\n"
            '    """Compute SHA-256 hash string."""\n'
            "    return 'hashed_' + pwd\n"
        )

        (self.root / "models" / "large_file.py").write_text(
            "# Large file to test snippet bounds and truncation\n"
            + "\n".join(f"def helper_{i}():\n    return {i}" for i in range(1, 100))
        )

        # Index the test repository
        self.index_res = index_repository(str(self.root), db_name=".fastast.db")
        self.db_path = self.root / ".fastast.db"
        self.materializer = EvidenceMaterializer(self.db_path, repo_root=self.root)

    def tearDown(self):
        self.materializer.close()
        self.tmpdir.cleanup()

    # ── 1. File Outline Tests ────────────────────────────────────────────────

    def test_file_outline_structural_metadata(self):
        """Verify that get_file_outline returns compact structural outline without raw code dump."""
        outline = self.materializer.get_file_outline("services/auth.py")
        self.assertIsNotNone(outline)
        self.assertEqual(outline["file_path"], "services/auth.py")
        self.assertEqual(outline["language"], "python")
        self.assertGreater(outline["total_lines"], 15)

        # Classes must be extracted with methods
        class_names = [c["name"] for c in outline["classes"]]
        self.assertIn("AuthService", class_names)
        self.assertIn("BaseService", class_names)

        auth_class = next(c for c in outline["classes"] if c["name"] == "AuthService")
        self.assertEqual(auth_class["start_line"], 8)
        self.assertIn("Handles user login", auth_class["docstring_summary"] or "")

        method_names = [m["name"] for m in auth_class["methods"]]
        self.assertIn("__init__", method_names)
        self.assertIn("login", method_names)
        self.assertIn("verify_token", method_names)

        # Top-level function
        func_names = [f["name"] for f in outline["functions"]]
        self.assertIn("hash_password", func_names)

        # Crucial acceptance criteria: Never dumps full file body
        self.assertNotIn("def login(self, username: str, password: str) -> bool:\n        hashed =", str(outline))
        self.assertNotIn("raw_content", outline)

    def test_file_outline_nonexistent(self):
        """Verify outline returns None for nonexistent files."""
        outline = self.materializer.get_file_outline("nonexistent/file.py")
        self.assertIsNone(outline)

    # ── 2. Snippet Bounds & Omission Tests ───────────────────────────────────

    def test_get_snippet_by_symbol(self):
        """Verify get_snippet by symbol name bounds definition and window lines."""
        window = self.materializer.get_snippet(symbol_id_or_name="hash_password", window_lines=1)
        self.assertIsNotNone(window)
        self.assertTrue(window.snippet)
        self.assertIn("def hash_password(pwd: str) -> str:", window.snippet)
        self.assertIn("return 'hashed_' + pwd", window.snippet)
        # Should not contain AuthService definition
        self.assertNotIn("class AuthService", window.snippet)

    def test_get_snippet_by_file_and_line_range(self):
        """Verify get_snippet by direct file path and line coordinates."""
        window = self.materializer.get_snippet(
            file_path="services/auth.py",
            start_line=13,
            end_line=17,
            window_lines=0,
        )
        self.assertIsNotNone(window)
        self.assertIn("def login", window.snippet)
        self.assertEqual(window.start_line, 13)

    def test_snippet_max_lines_omission(self):
        """Verify large functions/files cap line counts and insert omission indicators."""
        window = self.materializer.get_snippet(
            file_path="models/large_file.py",
            start_line=1,
            end_line=150,
            max_snippet_lines=25,
            window_lines=0,
        )
        self.assertIsNotNone(window)
        self.assertIn("omitted for brevity", window.snippet)
        snippet_lines = window.snippet.splitlines()
        self.assertLessEqual(len(snippet_lines), 26)

    def test_missing_file_degrades_gracefully(self):
        """Verify that when a source file is missing from disk, get_snippet returns None snippet without crashing."""
        # Intentionally delete the file from disk while it remains in SQLite
        (self.root / "services" / "auth.py").unlink()

        window = self.materializer.get_snippet(symbol_id_or_name="AuthService")
        self.assertIsNotNone(window)
        # Bounded line coordinates preserved
        self.assertGreater(window.start_line, 0)
        # Snippet code is None because file is missing
        self.assertIsNone(window.snippet)

    # ── 3. Symbol Evidence Packaging Tests ───────────────────────────────────

    def test_get_symbol_evidence_complete_bundle(self):
        """Verify get_symbol_evidence returns definition, snippet, and key neighbors."""
        evidence = self.materializer.get_symbol_evidence("login", window_lines=2)
        self.assertIsNotNone(evidence)

        # Definition metadata
        sym = evidence["symbol"]
        self.assertEqual(sym["name"], "login")
        self.assertEqual(sym["file_path"], "services/auth.py")
        self.assertEqual(sym["parent_name"], "AuthService")
        self.assertEqual(sym["confidence"], 1.0)

        # Bounded snippet
        snippet = evidence["snippet"]
        self.assertIn("def login", snippet["code"])
        self.assertGreater(snippet["lines_count"], 0)

        # Outgoing callees
        callees = evidence["relationships"]["callees"]
        callee_names = [c["callee"] for c in callees]
        self.assertIn("hash_password", callee_names)

        # Related files
        self.assertIn("related_files", evidence)

    def test_get_symbol_evidence_missing(self):
        """Verify get_symbol_evidence returns None for nonexistent symbol."""
        evidence = self.materializer.get_symbol_evidence("nonexistent_symbol_xyz")
        self.assertIsNone(evidence)

    # ── 4. Evidence Bundle & Token Budget Tests ──────────────────────────────

    def test_build_evidence_bundle_token_budget_enforcement(self):
        """Verify build_evidence_bundle sets truncated=True when budget is saturated."""
        # Query matching multiple helpers in large_file.py
        bundle = self.materializer.build_evidence_bundle(
            query="helper",
            limit=20,
            max_tokens=60,  # Very small token budget
        )
        self.assertIsNotNone(bundle)
        self.assertGreater(len(bundle.candidates), 0)
        self.assertIn("truncated", bundle.meta)
        self.assertTrue(bundle.meta["truncated"])
        self.assertLessEqual(bundle.total_tokens_estimate, 120)

    def test_build_evidence_bundle_shape(self):
        """Verify EvidenceBundle includes all structured output components."""
        bundle = self.materializer.build_evidence_bundle(query="AuthService")
        bundle_dict = bundle.to_dict()

        self.assertIn("query", bundle_dict)
        self.assertIn("candidates", bundle_dict)
        self.assertIn("symbols", bundle_dict)
        self.assertIn("files", bundle_dict)
        self.assertIn("relationships", bundle_dict)
        self.assertIn("snippets", bundle_dict)
        self.assertIn("meta", bundle_dict)

        self.assertGreater(len(bundle_dict["candidates"]), 0)
        self.assertGreater(len(bundle_dict["snippets"]), 0)
        self.assertIn("total_snippets", bundle_dict["meta"])

    # ── 5. Standalone Module API Functions ───────────────────────────────────

    def test_standalone_apis(self):
        """Verify module-level standalone functions work with repo_root."""
        outline = get_file_outline("services/auth.py", repo_root=self.root)
        self.assertIsNotNone(outline)
        self.assertEqual(outline["file_path"], "services/auth.py")

        evidence = get_symbol_evidence("hash_password", repo_root=self.root)
        self.assertIsNotNone(evidence)
        self.assertEqual(evidence["symbol"]["name"], "hash_password")

        window = get_snippet("hash_password", repo_root=self.root)
        self.assertIsNotNone(window)
        self.assertIn("def hash_password", window.snippet)

        bundle = build_evidence_bundle(query="login", repo_root=self.root)
        self.assertGreater(len(bundle.candidates), 0)

    # ── 6. CLI Command Runners ───────────────────────────────────────────────

    def test_cli_outline_runner(self):
        """Verify fastast outline CLI runner."""
        f = io.StringIO()
        with redirect_stdout(f):
            code = run_outline("services/auth.py", dir_path=str(self.root), json_output=True)
        self.assertEqual(code, 0)
        output = json.loads(f.getvalue())
        self.assertEqual(output["file_path"], "services/auth.py")
        self.assertIn("classes", output)

    def test_cli_snippet_runner(self):
        """Verify fastast snippet CLI runner."""
        f = io.StringIO()
        with redirect_stdout(f):
            code = run_snippet(symbol="hash_password", dir_path=str(self.root), json_output=True)
        self.assertEqual(code, 0)
        output = json.loads(f.getvalue())
        self.assertIn("snippet", output)
        self.assertIn("def hash_password", output["snippet"])

    def test_cli_evidence_runner(self):
        """Verify fastast evidence CLI runner."""
        f = io.StringIO()
        with redirect_stdout(f):
            code = run_evidence("AuthService", dir_path=str(self.root), json_output=True)
        self.assertEqual(code, 0)
        output = json.loads(f.getvalue())
        self.assertIn("candidates", output)
        self.assertIn("snippets", output)


if __name__ == "__main__":
    unittest.main()

