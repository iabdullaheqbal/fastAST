"""Unit tests for Phase 1: File Admission Layer (Repo-level pruning).

Tests directory walker, multi-layer ignore rules (.gitignore, .fastastignore, hardcoded),
content hashing (xxHash3 / BLAKE2b), language detection, and file classification.
"""

import json
import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

from fastast.discovery import (
    DirectoryScanner,
    FileCategory,
    GitIgnoreRule,
    MultiLayerIgnore,
    classify_file,
    compute_content_hash,
    detect_file_language,
    discover_files,
    is_binary_file,
)
from fastast.model import FileRecord


class TestContentHashing(unittest.TestCase):
    def test_hash_deterministic(self):
        h1 = compute_content_hash("def foo(): return 42\n")
        h2 = compute_content_hash("def foo(): return 42\n")
        self.assertEqual(h1, h2)
        self.assertGreater(len(h1), 0)

    def test_hash_different_inputs(self):
        h1 = compute_content_hash("content A")
        h2 = compute_content_hash("content B")
        self.assertNotEqual(h1, h2)

    def test_hash_bytes_and_string(self):
        h_str = compute_content_hash("hello world")
        h_bytes = compute_content_hash(b"hello world")
        self.assertEqual(h_str, h_bytes)


class TestBinaryDetection(unittest.TestCase):
    def test_text_not_binary(self):
        self.assertFalse(is_binary_file(Path("dummy"), b"def main():\n    print('hello')\n"))

    def test_null_bytes_is_binary(self):
        self.assertTrue(is_binary_file(Path("dummy"), b"GIF89a\x00\x01\x00\x02"))


class TestLanguageDetection(unittest.TestCase):
    def test_extension_detection(self):
        cases = [
            ("main.py", "python"),
            ("types.pyi", "python"),
            ("app.js", "javascript"),
            ("app.jsx", "javascript"),
            ("index.ts", "typescript"),
            ("component.tsx", "typescript"),
            ("Server.java", "java"),
            ("lib.rs", "rust"),
            ("index.html", "html"),
            ("style.css", "css"),
            ("data.json", "json"),
            ("Cargo.toml", "toml"),
            ("deploy.sh", "shell"),
            ("config.yaml", "yaml"),
            ("schema.sql", "sql"),
            ("main.go", "go"),
            ("util.cpp", "cpp"),
            ("header.h", "c"),
        ]
        for filename, expected_lang in cases:
            with self.subTest(filename=filename):
                self.assertEqual(detect_file_language(Path(filename)), expected_lang)

    def test_shebang_detection(self):
        self.assertEqual(
            detect_file_language(Path("my_script"), "#!/usr/bin/env python3\nimport sys"),
            "python",
        )
        self.assertEqual(
            detect_file_language(Path("runner"), "#!/bin/bash\necho 1"),
            "shell",
        )
        self.assertEqual(
            detect_file_language(Path("service"), "#!/usr/bin/env node\nconsole.log(1)"),
            "javascript",
        )

    def test_html_doctype_detection(self):
        self.assertEqual(
            detect_file_language(Path("template"), "<!DOCTYPE html>\n<html></html>"),
            "html",
        )


class TestFileClassification(unittest.TestCase):
    def test_test_classification(self):
        self.assertEqual(classify_file(Path("test_math.py")), "test")
        self.assertEqual(classify_file(Path("math_test.py")), "test")
        self.assertEqual(classify_file(Path("parser_test.rs")), "test")
        self.assertEqual(classify_file(Path("ui.spec.ts")), "test")
        self.assertEqual(classify_file(Path("ui.test.js")), "test")
        self.assertEqual(classify_file(Path("CalculatorTest.java")), "test")
        self.assertEqual(classify_file(Path("tests/fixtures/sample.py")), "test")
        self.assertEqual(classify_file(Path("src/__tests__/unit.py")), "test")

    def test_config_classification(self):
        self.assertEqual(classify_file(Path("Cargo.toml")), "config")
        self.assertEqual(classify_file(Path("pyproject.toml")), "config")
        self.assertEqual(classify_file(Path("package.json")), "config")
        self.assertEqual(classify_file(Path("tsconfig.json")), "config")
        self.assertEqual(classify_file(Path(".env.production")), "config")
        self.assertEqual(classify_file(Path("webpack.config.js")), "config")

    def test_docs_classification(self):
        self.assertEqual(classify_file(Path("README.md")), "docs")
        self.assertEqual(classify_file(Path("docs/ARCHITECTURE.md")), "docs")
        self.assertEqual(classify_file(Path("LICENSE")), "docs")
        self.assertEqual(classify_file(Path("docs/spec.rst")), "docs")

    def test_infra_classification(self):
        self.assertEqual(classify_file(Path("Dockerfile")), "infra")
        self.assertEqual(classify_file(Path("docker-compose.yml")), "infra")
        self.assertEqual(classify_file(Path("Makefile")), "infra")
        self.assertEqual(classify_file(Path(".github/workflows/ci.yml")), "infra")
        self.assertEqual(classify_file(Path("k8s/deployment.yaml")), "infra")
        self.assertEqual(classify_file(Path("main.tf")), "infra")

    def test_generated_classification(self):
        self.assertEqual(classify_file(Path("bundle.min.js")), "generated")
        self.assertEqual(classify_file(Path("app.min.css")), "generated")
        self.assertEqual(classify_file(Path("service_pb2.py")), "generated")
        self.assertEqual(classify_file(Path("uv.lock")), "generated")
        self.assertEqual(classify_file(Path("package-lock.json")), "generated")
        self.assertEqual(classify_file(Path("build/bundle.js")), "generated")
        self.assertEqual(classify_file(Path("gen/client.ts")), "generated")
        self.assertEqual(
            classify_file(Path("code.py"), "# @generated by tool\nx = 1"),
            "generated",
        )

    def test_source_classification(self):
        self.assertEqual(classify_file(Path("src/main.rs")), "source")
        self.assertEqual(classify_file(Path("fastast/server.py")), "source")
        self.assertEqual(classify_file(Path("components/Button.tsx")), "source")
        self.assertEqual(classify_file(Path("com/app/Service.java")), "source")


class TestGitIgnoreRules(unittest.TestCase):
    def test_unanchored_glob(self):
        rule = GitIgnoreRule("*.pyc", Path("/repo"))
        self.assertTrue(rule.matches("app.pyc"))
        self.assertTrue(rule.matches("src/app.pyc"))
        self.assertFalse(rule.matches("src/app.py"))

    def test_anchored_glob(self):
        rule = GitIgnoreRule("/build", Path("/repo"))
        self.assertTrue(rule.matches("build"))
        self.assertTrue(rule.matches("build/out.js"))
        self.assertFalse(rule.matches("src/build"))

    def test_dir_only_glob(self):
        rule = GitIgnoreRule("target/", Path("/repo"))
        self.assertTrue(rule.matches("target", is_dir=True))
        self.assertFalse(rule.matches("target", is_dir=False))


class TestMultiLayerIgnoreAndWalker(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name)

        # Create realistic repo structure
        (self.root / "src").mkdir()
        (self.root / "src" / "app.py").write_text("def app(): pass\n")
        (self.root / "src" / "util.rs").write_text("pub fn util() {}\n")

        # Tests
        (self.root / "tests").mkdir()
        (self.root / "tests" / "test_app.py").write_text("def test_app(): assert True\n")

        # Hardcoded ignores (.git, node_modules, target)
        (self.root / ".git").mkdir()
        (self.root / ".git" / "HEAD").write_text("ref: refs/heads/main\n")
        (self.root / "node_modules").mkdir()
        (self.root / "node_modules" / "express.js").write_text("module.exports = {}\n")
        (self.root / "target").mkdir()
        (self.root / "target" / "binary.o").write_text("binary\n")

        # .gitignore ignore target
        (self.root / "tmp_git.py").write_text("# ignored by gitignore\n")
        (self.root / ".gitignore").write_text("tmp_git.py\n*.tmp\n!important.tmp\n")

        # .fastastignore ignore target
        (self.root / "fastast_skip.py").write_text("# ignored by fastastignore\n")
        (self.root / ".fastastignore").write_text("fastast_skip.py\n")

        # Files matching temp patterns
        (self.root / "file.tmp").write_text("temp\n")
        (self.root / "important.tmp").write_text("important\n")

        # Symlinks (if OS supports)
        try:
            os.symlink(self.root / "src" / "app.py", self.root / "symlink_app.py")
        except OSError:
            pass

    def tearDown(self):
        self.tmp.cleanup()

    def test_hardcoded_and_multi_layer_ignores(self):
        records = discover_files(self.root)
        paths = [r.path for r in records]

        # Admitted
        self.assertIn("src/app.py", paths)
        self.assertIn("src/util.rs", paths)
        self.assertIn("tests/test_app.py", paths)
        self.assertIn("important.tmp", paths)  # Negation preserved

        # Ignored by hardcoded default
        self.assertNotIn(".git/HEAD", paths)
        self.assertNotIn("node_modules/express.js", paths)
        self.assertNotIn("target/binary.o", paths)

        # Ignored by .gitignore
        self.assertNotIn("tmp_git.py", paths)
        self.assertNotIn("file.tmp", paths)

        # Ignored by .fastastignore
        self.assertNotIn("fastast_skip.py", paths)

        # Symlinks skipped
        self.assertNotIn("symlink_app.py", paths)

    def test_file_records_metadata(self):
        records = discover_files(self.root)
        app_rec = next(r for r in records if r.path == "src/app.py")
        self.assertEqual(app_rec.language, "python")
        self.assertEqual(app_rec.category, "source")
        self.assertGreater(len(app_rec.hash), 0)
        self.assertEqual(app_rec.total_lines, 1)

        test_rec = next(r for r in records if r.path == "tests/test_app.py")
        self.assertEqual(test_rec.category, "test")

    def test_filter_by_language(self):
        records = discover_files(self.root, languages={"rust"})
        paths = [r.path for r in records]
        self.assertEqual(paths, ["src/util.rs"])

    def test_filter_by_category(self):
        records = discover_files(self.root, categories={"test"})
        paths = [r.path for r in records]
        self.assertEqual(paths, ["tests/test_app.py"])

    def test_extra_ignores(self):
        records = discover_files(self.root, extra_ignores=["src/util.rs"])
        paths = [r.path for r in records]
        self.assertNotIn("src/util.rs", paths)
        self.assertIn("src/app.py", paths)


class TestCLIScanCommand(unittest.TestCase):
    def test_cli_scan_json(self):
        res = subprocess.run(
            [sys.executable, "-m", "fastast.cli", "scan", ".", "--json"],
            capture_output=True,
            text=True,
            env={"PYTHONPATH": "python"},
        )
        self.assertEqual(res.returncode, 0, res.stderr)
        data = json.loads(res.stdout)
        self.assertIn("total_files", data)
        self.assertIn("categories", data)
        self.assertIn("languages", data)
        self.assertIn("files", data)
        self.assertGreater(data["total_files"], 0)


if __name__ == "__main__":
    unittest.main()

