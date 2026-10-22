"""Tests for FastAST Phase 0 Core Data Model (FileRecord, SymbolRecord, EdgeRecord, Candidate, EvidenceWindow)."""

import sqlite3
import tempfile
import unittest
from pathlib import Path

from fastast.db import (
    get_candidate_evidence,
    get_connection,
    get_edges,
    init_db,
    store_file_data,
)
from fastast.model import (
    Candidate,
    EdgeRecord,
    EdgeRelation,
    EvidenceWindow,
    FileRecord,
    FileStatus,
    SymbolRecord,
)


class DummySymbol:
    def __init__(self, name, kind, signature="", start_line=1, end_line=5, parent_name=None, docstring=None):
        self.name = name
        self.kind = kind
        self.signature = signature
        self.start_line = start_line
        self.end_line = end_line
        self.parent_name = parent_name
        self.docstring = docstring


class DummyImport:
    def __init__(self, module, name=None, alias=None, line_number=1):
        self.module = module
        self.name = name
        self.alias = alias
        self.line_number = line_number


class DummyCall:
    def __init__(self, callee_name, caller_name=None, line_number=3):
        self.callee_name = callee_name
        self.caller_name = caller_name
        self.line_number = line_number


class DummyResult:
    def __init__(self, symbols, imports, calls, total_lines=10, total_tokens=25, has_syntax_error=False):
        self.symbols = symbols
        self.imports = imports
        self.calls = calls
        self.total_lines = total_lines
        self.total_tokens = total_tokens
        self.has_syntax_error = has_syntax_error


class TestCoreDataModel(unittest.TestCase):
    def test_file_record(self):
        f = FileRecord(
            path="src/main.rs",
            language="rust",
            hash="abc123hash",
            mtime=1700000000.0,
            status=FileStatus.ADDED.value,
            total_lines=100,
            total_tokens=450,
            has_syntax_error=False,
        )
        self.assertEqual(f.path, "src/main.rs")
        self.assertEqual(f.status, "added")
        d = f.to_dict()
        self.assertEqual(d["language"], "rust")
        f_restored = FileRecord.from_dict(d)
        self.assertEqual(f_restored.hash, "abc123hash")

    def test_symbol_record(self):
        s = SymbolRecord(
            name="process_request",
            kind="function",
            file="app/server.py",
            start_line=10,
            end_line=25,
            confidence=0.95,
            signature="def process_request(req: Request) -> Response:",
            docstring="Handles incoming request.",
        )
        self.assertEqual(s.confidence, 0.95)
        d = s.to_dict()
        s_restored = SymbolRecord.from_dict(d)
        self.assertEqual(s_restored.name, "process_request")
        self.assertEqual(s_restored.end_line, 25)

    def test_edge_record(self):
        e = EdgeRecord(
            src="login_handler",
            dst="authenticate_user",
            relation=EdgeRelation.CALLS.value,
            confidence=1.0,
            line_number=42,
        )
        self.assertEqual(e.relation, "calls")
        d = e.to_dict()
        e_restored = EdgeRecord.from_dict(d)
        self.assertEqual(e_restored.dst, "authenticate_user")

    def test_candidate_and_evidence_window(self):
        ew = EvidenceWindow(start_line=10, end_line=30, snippet="def foo():\n    return 42\n")
        c = Candidate(
            symbol_id="sym_123",
            score=0.88,
            reasons=["BM25 exact match", "1-hop call neighbor"],
            neighbors=["bar", "baz"],
            evidence_window=ew,
        )
        self.assertEqual(c.score, 0.88)
        self.assertEqual(len(c.reasons), 2)
        d = c.to_dict()
        c_restored = Candidate.from_dict(d)
        self.assertEqual(c_restored.evidence_window.start_line, 10)
        self.assertEqual(c_restored.neighbors, ["bar", "baz"])

    def test_db_edge_and_candidate_integration(self):
        with tempfile.NamedTemporaryFile(suffix=".db") as tmp:
            conn = get_connection(Path(tmp.name))
            init_db(conn)

            # Store a dummy file with symbols, calls, imports
            sym_func = DummySymbol("handle_payment", "function", "def handle_payment():", 5, 15)
            sym_helper = DummySymbol("validate_card", "function", "def validate_card():", 20, 30)
            imp = DummyImport("stripe", "Charge", line_number=1)
            call = DummyCall("validate_card", caller_name="handle_payment", line_number=8)

            result = DummyResult([sym_func, sym_helper], [imp], [call])
            file_id = store_file_data(
                conn,
                file_path="src/billing.py",
                file_hash="hash999",
                mtime=1700000000.0,
                file_index_result=result,
                language="python",
            )
            self.assertGreater(file_id, 0)

            # Query edges
            edges = get_edges(conn, "handle_payment")
            self.assertTrue(any(e.dst == "validate_card" and e.relation == "calls" for e in edges))

            # Query candidate evidence
            cur = conn.cursor()
            cur.execute("SELECT id FROM symbols WHERE name = 'handle_payment'")
            sym_id = cur.fetchone()[0]

            cand = get_candidate_evidence(conn, sym_id)
            self.assertIsNotNone(cand)
            self.assertEqual(cand.symbol_id, str(sym_id))
            self.assertIn("validate_card", cand.neighbors)
            conn.close()


if __name__ == "__main__":
    unittest.main()

