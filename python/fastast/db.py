"""SQLite database schema and access layer for FastAST symbol graph."""

import sqlite3
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple


SCHEMA_SQL = """
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    path TEXT UNIQUE NOT NULL,
    language TEXT NOT NULL DEFAULT 'python',
    hash TEXT NOT NULL,
    mtime REAL NOT NULL,
    total_lines INTEGER NOT NULL,
    total_tokens INTEGER NOT NULL,
    has_syntax_error INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS symbols (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    file_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    kind TEXT NOT NULL,
    signature TEXT NOT NULL,
    start_line INTEGER NOT NULL,
    end_line INTEGER NOT NULL,
    parent_symbol_id INTEGER,
    docstring TEXT,
    FOREIGN KEY(file_id) REFERENCES files(id) ON DELETE CASCADE,
    FOREIGN KEY(parent_symbol_id) REFERENCES symbols(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS imports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    file_id INTEGER NOT NULL,
    module TEXT NOT NULL,
    name TEXT,
    alias TEXT,
    line_number INTEGER NOT NULL,
    FOREIGN KEY(file_id) REFERENCES files(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS calls (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    file_id INTEGER NOT NULL,
    caller_symbol_id INTEGER,
    callee_name TEXT NOT NULL,
    line_number INTEGER NOT NULL,
    FOREIGN KEY(file_id) REFERENCES files(id) ON DELETE CASCADE,
    FOREIGN KEY(caller_symbol_id) REFERENCES symbols(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_files_path ON files(path);
CREATE INDEX IF NOT EXISTS idx_symbols_name ON symbols(name);
CREATE INDEX IF NOT EXISTS idx_symbols_kind ON symbols(kind);
CREATE INDEX IF NOT EXISTS idx_symbols_file ON symbols(file_id);
CREATE INDEX IF NOT EXISTS idx_imports_module ON imports(module);
CREATE INDEX IF NOT EXISTS idx_calls_callee ON calls(callee_name);
CREATE INDEX IF NOT EXISTS idx_calls_caller ON calls(caller_symbol_id);
"""


def get_connection(db_path: Path) -> sqlite3.Connection:
    """Connect to SQLite database with foreign keys and WAL mode."""
    conn = sqlite3.connect(str(db_path))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    conn.execute("PRAGMA journal_mode = WAL;")
    return conn


def init_db(conn: sqlite3.Connection) -> None:
    """Initialize SQLite database tables, indices, and run schema migrations."""
    # Check if 'files' table already exists and whether 'language' column is missing
    cur = conn.cursor()
    cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='files';")
    if cur.fetchone():
        cur.execute("PRAGMA table_info(files);")
        columns = [col[1] for col in cur.fetchall()]
        if "language" not in columns:
            cur.execute("ALTER TABLE files ADD COLUMN language TEXT NOT NULL DEFAULT 'python';")
            conn.commit()

    conn.executescript(SCHEMA_SQL)
    conn.execute("CREATE INDEX IF NOT EXISTS idx_files_language ON files(language);")
    conn.commit()


def get_file_record(conn: sqlite3.Connection, path: str) -> Optional[sqlite3.Row]:
    """Retrieve indexed file metadata by path."""
    cur = conn.cursor()
    cur.execute("SELECT * FROM files WHERE path = ?", (path,))
    return cur.fetchone()


def store_file_data(
    conn: sqlite3.Connection,
    file_path: str,
    file_hash: str,
    mtime: float,
    file_index_result: Any,
    language: Optional[str] = None,
) -> int:
    """Insert or update extracted AST symbols, imports, and calls for a file."""
    # Resolve language: use provided language, infer from extension, or default to python
    if not language:
        from fastast.indexer import detect_file_language
        language = detect_file_language(Path(file_path)) or "python"

    with conn:
        cur = conn.cursor()

        # Delete existing file entry if updating (cascades to symbols, imports, calls)
        cur.execute("DELETE FROM files WHERE path = ?", (file_path,))

        cur.execute(
            """
            INSERT INTO files (path, language, hash, mtime, total_lines, total_tokens, has_syntax_error)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                file_path,
                language,
                file_hash,
                mtime,
                file_index_result.total_lines,
                file_index_result.total_tokens,
                1 if file_index_result.has_syntax_error else 0,
            ),
        )
        file_id = cur.lastrowid

        # Insert symbols and map names to their database IDs for parent/caller resolution
        symbol_id_map: Dict[str, int] = {}

        # Pass 1: Insert root symbols (parent_name is None or empty)
        for sym in file_index_result.symbols:
            if not sym.parent_name:
                cur.execute(
                    """
                    INSERT INTO symbols (file_id, name, kind, signature, start_line, end_line, parent_symbol_id, docstring)
                    VALUES (?, ?, ?, ?, ?, ?, NULL, ?)
                    """,
                    (
                        file_id,
                        sym.name,
                        sym.kind,
                        sym.signature,
                        sym.start_line,
                        sym.end_line,
                        sym.docstring,
                    ),
                )
                sym_id = cur.lastrowid
                symbol_id_map[sym.name] = sym_id

        # Pass 2: Insert child symbols (methods, members with parent_name)
        for sym in file_index_result.symbols:
            if sym.parent_name:
                parent_id = symbol_id_map.get(sym.parent_name)
                cur.execute(
                    """
                    INSERT INTO symbols (file_id, name, kind, signature, start_line, end_line, parent_symbol_id, docstring)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        file_id,
                        sym.name,
                        sym.kind,
                        sym.signature,
                        sym.start_line,
                        sym.end_line,
                        parent_id,
                        sym.docstring,
                    ),
                )
                sym_id = cur.lastrowid
                symbol_id_map[sym.name] = sym_id
                symbol_id_map[f"{sym.parent_name}.{sym.name}"] = sym_id

        # Insert imports
        import_rows = [
            (file_id, imp.module, imp.name, imp.alias, imp.line_number)
            for imp in file_index_result.imports
        ]
        if import_rows:
            cur.executemany(
                """
                INSERT INTO imports (file_id, module, name, alias, line_number)
                VALUES (?, ?, ?, ?, ?)
                """,
                import_rows,
            )

        # Insert calls
        call_rows = []
        for call in file_index_result.calls:
            caller_id = None
            if call.caller_name:
                caller_id = symbol_id_map.get(call.caller_name)
            call_rows.append((file_id, caller_id, call.callee_name, call.line_number))

        if call_rows:
            cur.executemany(
                """
                INSERT INTO calls (file_id, caller_symbol_id, callee_name, line_number)
                VALUES (?, ?, ?, ?)
                """,
                call_rows,
            )

    return file_id


def search_symbols(
    conn: sqlite3.Connection,
    query: str,
    kind: Optional[str] = None,
    language: Optional[str] = None,
    limit: int = 50,
) -> List[Dict[str, Any]]:
    """Search for symbols across the indexed codebase with optional kind and language filters."""
    cur = conn.cursor()
    like_query = f"%{query}%"

    conditions = ["s.name LIKE ?"]
    params: List[Any] = [like_query]

    if kind:
        conditions.append("s.kind = ?")
        params.append(kind)

    if language:
        conditions.append("f.language = ?")
        params.append(language.strip().lower())

    where_clause = " AND ".join(conditions)
    params.append(limit)

    cur.execute(
        f"""
        SELECT s.id, s.name, s.kind, s.signature, s.start_line, s.end_line, s.docstring,
               f.path as file_path, f.language as language, p.name as parent_name
        FROM symbols s
        JOIN files f ON s.file_id = f.id
        LEFT JOIN symbols p ON s.parent_symbol_id = p.id
        WHERE {where_clause}
        ORDER BY LENGTH(s.name) ASC, s.name ASC
        LIMIT ?
        """,
        params,
    )

    results = []
    for row in cur.fetchall():
        results.append(
            {
                "id": row["id"],
                "name": row["name"],
                "kind": row["kind"],
                "signature": row["signature"],
                "start_line": row["start_line"],
                "end_line": row["end_line"],
                "file_path": row["file_path"],
                "language": row["language"],
                "parent_name": row["parent_name"],
                "docstring": row["docstring"],
            }
        )
    return results


def get_call_graph(conn: sqlite3.Connection, symbol_name: str) -> Dict[str, Any]:
    """Retrieve callers (who invokes this symbol) and callees (what this symbol invokes)."""
    cur = conn.cursor()

    # Callers: Where callee_name matches symbol_name
    cur.execute(
        """
        SELECT c.line_number, f.path as file_path, f.language as language,
               s.name as caller_name, s.kind as caller_kind, s.signature as caller_sig
        FROM calls c
        JOIN files f ON c.file_id = f.id
        LEFT JOIN symbols s ON c.caller_symbol_id = s.id
        WHERE c.callee_name = ?
        ORDER BY f.path, c.line_number
        """,
        (symbol_name,),
    )
    callers = [
        {
            "caller": row["caller_name"] or "<module>",
            "caller_kind": row["caller_kind"] or "module",
            "file_path": row["file_path"],
            "language": row["language"],
            "line_number": row["line_number"],
        }
        for row in cur.fetchall()
    ]

    # Callees: Where caller_symbol matches symbol_name
    cur.execute(
        """
        SELECT c.callee_name, c.line_number, f.path as file_path, f.language as language
        FROM calls c
        JOIN symbols s ON c.caller_symbol_id = s.id
        JOIN files f ON c.file_id = f.id
        WHERE s.name = ?
        ORDER BY c.line_number
        """,
        (symbol_name,),
    )
    callees = [
        {
            "callee": row["callee_name"],
            "file_path": row["file_path"],
            "language": row["language"],
            "line_number": row["line_number"],
        }
        for row in cur.fetchall()
    ]

    return {
        "symbol": symbol_name,
        "caller_count": len(callers),
        "callers": callers,
        "callee_count": len(callees),
        "callees": callees,
    }


def get_repository_stats(conn: sqlite3.Connection) -> Dict[str, Any]:
    """Return summary counts of indexed repository artifacts."""
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM files")
    files_count = cur.fetchone()[0]

    cur.execute("SELECT COUNT(*) FROM symbols")
    symbols_count = cur.fetchone()[0]

    cur.execute("SELECT COUNT(*) FROM imports")
    imports_count = cur.fetchone()[0]

    cur.execute("SELECT COUNT(*) FROM calls")
    calls_count = cur.fetchone()[0]

    cur.execute("SELECT language, COUNT(*) FROM files GROUP BY language ORDER BY COUNT(*) DESC")
    languages = {row[0]: row[1] for row in cur.fetchall()}

    return {
        "files": files_count,
        "symbols": symbols_count,
        "imports": imports_count,
        "calls": calls_count,
        "languages": languages,
    }
