"""Unit tests for Phase 2: Parser + Fact Extractor (Syntax-level pruning).

Tests extracting meaningful facts (declarations, imports, calls) into SymbolRecords
and EdgeRecords across languages, with fault-tolerance and confidence scoring.
"""

import tempfile
import unittest
from pathlib import Path

from fastast.discovery import discover_files
from fastast.extractor import (
    extract_file_facts,
    parse_file_record,
    parse_file_records,
)
from fastast.model import (
    EdgeRecord,
    EdgeRelation,
    ExtractedFileFacts,
    FileRecord,
    SymbolRecord,
)


class TestPythonFactExtractor(unittest.TestCase):
    def test_classes_and_methods(self):
        self.assertTrue(True)
        code = '''
class PaymentProcessor:
    """Processes customer payments."""

    def __init__(self, api_key: str):
        self.api_key = api_key

    def charge(self, amount: int) -> bool:
        """Charges a card."""
        return self.verify(amount)

    async def verify(self, amount: int) -> bool:
        return amount > 0

def create_processor() -> PaymentProcessor:
    return PaymentProcessor("key_123")
'''
        facts = extract_file_facts(code, "billing/processor.py", "python")
        self.assertEqual(facts.file_path, "billing/processor.py")
        self.assertFalse(facts.has_syntax_error)

        sym_map = {s.name: s for s in facts.symbols}
        self.assertIn("PaymentProcessor", sym_map)
        self.assertIn("__init__", sym_map)
        self.assertIn("charge", sym_map)
        self.assertIn("verify", sym_map)
        self.assertIn("create_processor", sym_map)

        # Check class
        cls_sym = sym_map["PaymentProcessor"]
        self.assertEqual(cls_sym.kind, "class")
        self.assertEqual(cls_sym.confidence, 1.0)
        self.assertIn("Processes customer payments", cls_sym.docstring or "")
        self.assertIsNone(cls_sym.parent_name)

        # Check methods
        init_sym = sym_map["__init__"]
        self.assertEqual(init_sym.kind, "method")
        self.assertEqual(init_sym.parent_name, "PaymentProcessor")

        verify_sym = sym_map["verify"]
        self.assertEqual(verify_sym.kind, "async_method")
        self.assertEqual(verify_sym.parent_name, "PaymentProcessor")

        func_sym = sym_map["create_processor"]
        self.assertEqual(func_sym.kind, "function")
        self.assertIsNone(func_sym.parent_name)

        # Check DEFINES edges
        defines = [e for e in facts.edges if e.relation == EdgeRelation.DEFINES.value]
        def_targets = [e.dst for e in defines]
        self.assertIn("__init__", def_targets)
        self.assertIn("charge", def_targets)
        self.assertIn("verify", def_targets)
        for e in defines:
            self.assertEqual(e.src, "PaymentProcessor")
            self.assertEqual(e.confidence, 1.0)

    def test_imports_and_calls(self):
        self.assertTrue(True)
        code = '''
import os
from sys import path as sys_path
from typing import List, Optional

def dispatch(event: str):
    log_event(event)
    return True

def log_event(event: str):
    pass
'''
        facts = extract_file_facts(code, "events.py", "python")

        # Imports
        imports = [e for e in facts.edges if e.relation == EdgeRelation.IMPORTS.value]
        targets = [e.dst for e in imports]
        self.assertIn("os", targets)
        self.assertIn("sys.path", targets)
        self.assertIn("typing.List", targets)

        # Calls
        calls = [e for e in facts.edges if e.relation == EdgeRelation.CALLS.value]
        self.assertTrue(any(e.src == "dispatch" and e.dst == "log_event" for e in calls))
        call_edge = next(e for e in calls if e.dst == "log_event")
        self.assertEqual(call_edge.confidence, 1.0)

    def test_fault_tolerant_syntax_error(self):
        self.assertTrue(True)
        code = '''
def valid_start():
    return 42

def broken_syntax(
    x =
'''
        facts = extract_file_facts(code, "broken.py", "python")
        self.assertTrue(facts.has_syntax_error)
        # Should still recover valid_start definition
        names = [s.name for s in facts.symbols]
        self.assertIn("valid_start", names)
        # Recovered symbol has confidence 0.85
        sym = next(s for s in facts.symbols if s.name == "valid_start")
        self.assertEqual(sym.confidence, 0.85)


class TestOtherLanguageFactExtractor(unittest.TestCase):
    def test_json_facts(self):
        json_code = '{"name": "fastast", "version": "0.1.0", "scripts": {"build": "cargo build"}}'
        facts = extract_file_facts(json_code, "package.json", "json")
        self.assertFalse(facts.has_syntax_error)
        sym_names = [s.name for s in facts.symbols]
        self.assertIn("name", sym_names)
        self.assertIn("version", sym_names)
        self.assertIn("scripts", sym_names)

    def test_rust_structural_facts(self):
        self.assertTrue(True)
        rs_code = '''
use std::collections::HashMap;

pub struct TaskQueue {
    tasks: HashMap<String, u32>,
}

impl TaskQueue {
    pub fn new() -> Self {
        Self { tasks: HashMap::new() }
    }
}
'''
        facts = extract_file_facts(rs_code, "src/queue.rs", "rust")
        self.assertFalse(facts.has_syntax_error)
        sym_names = [s.name for s in facts.symbols]
        self.assertIn("TaskQueue", sym_names)
        # Imports
        imports = [e.dst for e in facts.edges if e.relation == EdgeRelation.IMPORTS.value]
        self.assertTrue(any("HashMap" in imp or "collections" in imp for imp in imports))

    def test_typescript_structural_facts(self):
        self.assertTrue(True)
        ts_code = '''
import { Request, Response } from "express";

export interface UserSession {
    id: string;
    email: string;
}

export function handleLogin(req: Request, res: Response): void {
    validate(req.body);
}
'''
        facts = extract_file_facts(ts_code, "src/auth.ts", "typescript")
        self.assertFalse(facts.has_syntax_error)
        sym_names = [s.name for s in facts.symbols]
        self.assertIn("UserSession", sym_names)
        self.assertIn("handleLogin", sym_names)


class TestFileRecordParsingPipeline(unittest.TestCase):
    def test_parse_file_record_and_batch(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "src").mkdir()
            (root / "src" / "math.py").write_text("def add(a, b): return a + b\n")
            (root / "src" / "config.json").write_text('{"host": "localhost"}\n')

            rec_py = FileRecord(
                path="src/math.py",
                language="python",
                hash="hash1",
                mtime=1700000000.0,
            )
            rec_json = FileRecord(
                path="src/config.json",
                language="json",
                hash="hash2",
                mtime=1700000000.0,
            )

            # Single record parse
            py_facts = parse_file_record(rec_py, repo_root=root)
            self.assertEqual(py_facts.file_path, "src/math.py")
            self.assertEqual(len(py_facts.symbols), 1)
            self.assertEqual(py_facts.symbols[0].name, "add")

            # Batch parse
            batch_facts = parse_file_records([rec_py, rec_json], repo_root=root)
            self.assertEqual(len(batch_facts), 2)
            self.assertEqual(batch_facts[0].file_path, "src/math.py")
            self.assertEqual(batch_facts[1].file_path, "src/config.json")

    def test_missing_file_does_not_crash(self):
        ghost_rec = FileRecord(
            path="nonexistent/ghost.py",
            language="python",
            hash="ghost_hash",
            mtime=1700000000.0,
        )
        facts = parse_file_record(ghost_rec, repo_root="/tmp")
        self.assertTrue(facts.has_syntax_error)
        self.assertIn("not found on disk", facts.error_message or "")


if __name__ == "__main__":
    unittest.main()

