"""SQLite database schema and access layer for FastAST symbol graph."""

import re
import sqlite3
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union

from fastast.model import (
    Candidate,
    EdgeRecord,
    EdgeRelation,
    EvidenceWindow,
    FileRecord,
    FileStatus,
    SymbolRecord,
)


SCHEMA_SQL = """
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    path TEXT UNIQUE NOT NULL,
    language TEXT NOT NULL DEFAULT 'python',
    hash TEXT NOT NULL,
    mtime REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'unchanged',
    category TEXT NOT NULL DEFAULT 'source',
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
    confidence REAL NOT NULL DEFAULT 1.0,
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

CREATE TABLE IF NOT EXISTS edges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    file_id INTEGER NOT NULL,
    src TEXT NOT NULL,
    dst TEXT NOT NULL,
    relation TEXT NOT NULL DEFAULT 'calls',
    confidence REAL NOT NULL DEFAULT 1.0,
    line_number INTEGER,
    FOREIGN KEY(file_id) REFERENCES files(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_files_path ON files(path);
CREATE INDEX IF NOT EXISTS idx_files_category ON files(category);
CREATE INDEX IF NOT EXISTS idx_symbols_name ON symbols(name);
CREATE INDEX IF NOT EXISTS idx_symbols_kind ON symbols(kind);
CREATE INDEX IF NOT EXISTS idx_symbols_file ON symbols(file_id);
CREATE INDEX IF NOT EXISTS idx_imports_module ON imports(module);
CREATE INDEX IF NOT EXISTS idx_calls_callee ON calls(callee_name);
CREATE INDEX IF NOT EXISTS idx_calls_caller ON calls(caller_symbol_id);
CREATE INDEX IF NOT EXISTS idx_edges_src ON edges(src);
CREATE INDEX IF NOT EXISTS idx_edges_dst ON edges(dst);
CREATE INDEX IF NOT EXISTS idx_edges_relation ON edges(relation);

-- Phase 7: Full-Text Search (FTS5) for BM25 lexical retrieval
CREATE VIRTUAL TABLE IF NOT EXISTS symbols_fts USING fts5(
    name,
    signature,
    docstring,
    file_path,
    tokenize='unicode61 remove_diacritics 2'
);

CREATE TRIGGER IF NOT EXISTS symbols_ai AFTER INSERT ON symbols BEGIN
    INSERT INTO symbols_fts(rowid, name, signature, docstring, file_path)
    SELECT new.id, new.name, new.signature, coalesce(new.docstring, ''), (SELECT path FROM files WHERE id = new.file_id);
END;

CREATE TRIGGER IF NOT EXISTS symbols_ad AFTER DELETE ON symbols BEGIN
    DELETE FROM symbols_fts WHERE rowid = old.id;
END;

-- Phase 8: Dense Semantic Vector Embeddings for Concept-Aware Retrieval
CREATE TABLE IF NOT EXISTS symbol_embeddings (
    symbol_id INTEGER PRIMARY KEY,
    model TEXT NOT NULL,
    dimensions INTEGER NOT NULL,
    embedding BLOB NOT NULL,
    updated_at REAL NOT NULL,
    FOREIGN KEY (symbol_id) REFERENCES symbols(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_embeddings_model ON symbol_embeddings(model);
"""


def get_connection(db_path: Path) -> sqlite3.Connection:
    """Connect to SQLite database with foreign keys, recursive triggers, and WAL mode."""
    conn = sqlite3.connect(str(db_path))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    conn.execute("PRAGMA recursive_triggers = ON;")
    conn.execute("PRAGMA journal_mode = WAL;")
    return conn


def init_db(conn: sqlite3.Connection) -> None:
    """Initialize SQLite database tables, indices, FTS5 virtual table, and run schema migrations."""
    cur = conn.cursor()
    cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='files';")
    if cur.fetchone():
        cur.execute("PRAGMA table_info(files);")
        columns = [col[1] for col in cur.fetchall()]
        if "language" not in columns:
            cur.execute("ALTER TABLE files ADD COLUMN language TEXT NOT NULL DEFAULT 'python';")
        if "status" not in columns:
            cur.execute("ALTER TABLE files ADD COLUMN status TEXT NOT NULL DEFAULT 'unchanged';")
        if "category" not in columns:
            cur.execute("ALTER TABLE files ADD COLUMN category TEXT NOT NULL DEFAULT 'source';")
        conn.commit()

    cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='symbols';")
    if cur.fetchone():
        cur.execute("PRAGMA table_info(symbols);")
        columns = [col[1] for col in cur.fetchall()]
        if "confidence" not in columns:
            cur.execute("ALTER TABLE symbols ADD COLUMN confidence REAL NOT NULL DEFAULT 1.0;")
        conn.commit()

    conn.executescript(SCHEMA_SQL)
    conn.execute("CREATE INDEX IF NOT EXISTS idx_files_language ON files(language);")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_files_category ON files(category);")
    conn.commit()

    # Backfill FTS5 index if table exists but is empty while symbols exist
    try:
        cur.execute("SELECT COUNT(*) FROM symbols_fts")
        fts_count = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM symbols")
        sym_count = cur.fetchone()[0]
        if fts_count == 0 and sym_count > 0:
            cur.execute(
                """
                INSERT INTO symbols_fts (rowid, name, signature, docstring, file_path)
                SELECT s.id, s.name, s.signature, coalesce(s.docstring, ''), f.path
                FROM symbols s
                JOIN files f ON s.file_id = f.id
                """
            )
            conn.commit()
    except Exception:
        pass

    # Backfill symbol embeddings if table exists but is empty while symbols exist
    try:
        cur.execute("SELECT COUNT(*) FROM symbol_embeddings")
        emb_count = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM symbols")
        sym_count = cur.fetchone()[0]
        if emb_count == 0 and sym_count > 0:
            backfill_symbol_embeddings(conn)
    except Exception:
        pass


def get_file_record(conn: sqlite3.Connection, path: str) -> Optional[sqlite3.Row]:
    """Retrieve indexed file metadata by path."""
    cur = conn.cursor()
    cur.execute("SELECT * FROM files WHERE path = ?", (path,))
    return cur.fetchone()


def delete_file_record(conn: sqlite3.Connection, path: str) -> None:
    """Delete an indexed file record and cascade remove symbols, edges, and FTS entries."""
    with conn:
        conn.execute("DELETE FROM files WHERE path = ?", (path,))



def store_file_data(
    conn: sqlite3.Connection,
    file_path: Union[str, Any],
    file_hash: Optional[str] = None,
    mtime: Optional[float] = None,
    file_index_result: Optional[Any] = None,
    language: Optional[str] = None,
    category: Optional[str] = None,
    status: str = "unchanged",
    embed_symbols: bool = True,
) -> int:
    """Insert or update extracted AST symbols, imports, calls, and edges for a file."""
    if hasattr(file_path, "file_path") and hasattr(file_path, "symbols"):
        facts = file_path
        file_path_str = facts.file_path
        file_index_result = facts
        file_hash = file_hash or getattr(facts, "hash", "mockhash")
        mtime = mtime if mtime is not None else getattr(facts, "mtime", 0.0)
        language = language or facts.language
        category = category or getattr(facts, "category", None)
    else:
        file_path_str = str(file_path)
        if file_hash is None:
            file_hash = "mockhash"
        if mtime is None:
            mtime = 0.0

    # Resolve language and category
    if not language:
        from fastast.discovery import detect_file_language
        language = detect_file_language(Path(file_path_str)) or "python"

    if not category:
        from fastast.discovery import classify_file
        category = classify_file(Path(file_path_str))

    with conn:
        cur = conn.cursor()

        # Delete existing file entry if updating (cascades to symbols, imports, calls, edges)
        cur.execute("DELETE FROM files WHERE path = ?", (file_path_str,))

        cur.execute(
            """
            INSERT INTO files (path, language, hash, mtime, status, category, total_lines, total_tokens, has_syntax_error)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                file_path_str,
                language,
                file_hash,
                mtime,
                status,
                category,
                file_index_result.total_lines,
                file_index_result.total_tokens,
                1 if file_index_result.has_syntax_error else 0,
            ),
        )
        file_id = cur.lastrowid

        # Insert symbols and map names to their database IDs for parent/caller resolution
        symbol_id_map: Dict[str, int] = {}
        inserted_symbols_for_emb: List[Tuple[int, str, str, str, Optional[str]]] = []

        # Pass 1: Insert root symbols (parent_name is None or empty)
        for sym in file_index_result.symbols:
            sig = sym.signature if sym.signature else f"{sym.kind} {sym.name}"
            conf = getattr(sym, "confidence", 1.0)
            if not sym.parent_name:
                cur.execute(
                    """
                    INSERT INTO symbols (file_id, name, kind, signature, start_line, end_line, confidence, parent_symbol_id, docstring)
                    VALUES (?, ?, ?, ?, ?, ?, ?, NULL, ?)
                    """,
                    (
                        file_id,
                        sym.name,
                        sym.kind,
                        sig,
                        sym.start_line,
                        sym.end_line,
                        conf,
                        sym.docstring,
                    ),
                )
                sym_id = cur.lastrowid
                symbol_id_map[sym.name] = sym_id
                inserted_symbols_for_emb.append((sym_id, sym.name, sym.kind, sig, sym.docstring))

        # Pass 2: Insert child symbols (methods, members with parent_name)
        for sym in file_index_result.symbols:
            if sym.parent_name:
                sig = sym.signature if sym.signature else f"{sym.kind} {sym.name}"
                conf = getattr(sym, "confidence", 1.0)
                parent_id = symbol_id_map.get(sym.parent_name)
                cur.execute(
                    """
                    INSERT INTO symbols (file_id, name, kind, signature, start_line, end_line, confidence, parent_symbol_id, docstring)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        file_id,
                        sym.name,
                        sym.kind,
                        sig,
                        sym.start_line,
                        sym.end_line,
                        conf,
                        parent_id,
                        sym.docstring,
                    ),
                )
                sym_id = cur.lastrowid
                symbol_id_map[sym.name] = sym_id
                symbol_id_map[f"{sym.parent_name}.{sym.name}"] = sym_id
                inserted_symbols_for_emb.append((sym_id, sym.name, sym.kind, sig, sym.docstring))

        # Insert imports (if present on result)
        if hasattr(file_index_result, "imports") and file_index_result.imports:
            import_rows = [
                (file_id, imp.module, imp.name, imp.alias, imp.line_number)
                for imp in file_index_result.imports
            ]
            cur.executemany(
                """
                INSERT INTO imports (file_id, module, name, alias, line_number)
                VALUES (?, ?, ?, ?, ?)
                """,
                import_rows,
            )

        # Insert calls (if present on result)
        if hasattr(file_index_result, "calls") and file_index_result.calls:
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

        # Insert graph edges
        if hasattr(file_index_result, "edges") and file_index_result.edges:
            edge_rows = [
                (file_id, e.src, e.dst, e.relation, e.confidence, e.line_number)
                for e in file_index_result.edges
            ]
            cur.executemany(
                """
                INSERT INTO edges (file_id, src, dst, relation, confidence, line_number)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                edge_rows,
            )
            # If calls was not explicitly populated, populate from call edges
            if not getattr(file_index_result, "calls", None):
                c_rows = []
                for e in file_index_result.edges:
                    if e.relation == "calls":
                        caller_id = symbol_id_map.get(e.src)
                        c_rows.append((file_id, caller_id, e.dst, e.line_number or 0))
                if c_rows:
                    cur.executemany(
                        """
                        INSERT INTO calls (file_id, caller_symbol_id, callee_name, line_number)
                        VALUES (?, ?, ?, ?)
                        """,
                        c_rows,
                    )

            # If imports was not explicitly populated, populate from import edges
            if not getattr(file_index_result, "imports", None):
                imp_rows = []
                for e in file_index_result.edges:
                    if e.relation == "imports":
                        target = e.dst
                        if "." in target:
                            mod, name = target.rsplit(".", 1)
                        else:
                            mod, name = target, None
                        imp_rows.append((file_id, mod, name, None, e.line_number or 0))
                if imp_rows:
                    cur.executemany(
                        """
                        INSERT INTO imports (file_id, module, name, alias, line_number)
                        VALUES (?, ?, ?, ?, ?)
                        """,
                        imp_rows,
                    )
        else:
            # Fallback edge generation from calls, imports, symbols
            edge_rows = []
            for call in getattr(file_index_result, "calls", []):
                src = call.caller_name or f"<module:{Path(file_path).stem}>"
                dst = call.callee_name
                conf = 1.0 if call.caller_name else 0.7
                edge_rows.append((file_id, src, dst, EdgeRelation.CALLS.value, conf, call.line_number))

            for imp in getattr(file_index_result, "imports", []):
                src = file_path
                dst = f"{imp.module}.{imp.name}" if imp.name else imp.module
                edge_rows.append((file_id, src, dst, EdgeRelation.IMPORTS.value, 1.0, imp.line_number))

            for sym in getattr(file_index_result, "symbols", []):
                if sym.parent_name:
                    edge_rows.append((file_id, sym.parent_name, sym.name, EdgeRelation.DEFINES.value, 1.0, sym.start_line))

            if edge_rows:
                cur.executemany(
                    """
                    INSERT INTO edges (file_id, src, dst, relation, confidence, line_number)
                    VALUES (?, ?, ?, ?, ?, ?)
                    """,
                    edge_rows,
                )

        # Phase 8: Generate and store dense semantic embeddings
        if embed_symbols and inserted_symbols_for_emb:
            try:
                import time
                from fastast.embeddings import (
                    encode_embedding,
                    get_embedding_provider,
                    prepare_symbol_text,
                )
                provider = get_embedding_provider()
                now = time.time()
                emb_rows = []
                for s_id, s_name, s_kind, s_sig, s_doc in inserted_symbols_for_emb:
                    text = prepare_symbol_text(s_name, s_kind, s_sig, s_doc, file_path_str)
                    vec = provider.embed_text(text)
                    blob = encode_embedding(vec)
                    emb_rows.append((s_id, provider.model_name, provider.dimension, blob, now))

                cur.executemany(
                    """
                    INSERT OR REPLACE INTO symbol_embeddings (symbol_id, model, dimensions, embedding, updated_at)
                    VALUES (?, ?, ?, ?, ?)
                    """,
                    emb_rows,
                )
            except Exception:
                pass

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


def sanitize_fts5_query(raw_query: str) -> str:
    """Sanitize and structure a raw search string into a valid SQLite FTS5 query."""
    tokens = [t.lower() for t in re.findall(r"\w+", raw_query) if t]
    if not tokens:
        return ""
    if len(tokens) == 1:
        return f'"{tokens[0]}"*'
    and_part = " ".join(f'"{t}"*' for t in tokens)
    or_part = " OR ".join(f'"{t}"*' for t in tokens)
    return f"({and_part}) OR {or_part}"


def search_symbols_bm25(
    conn: sqlite3.Connection,
    query: str,
    limit: int = 100,
) -> Dict[int, float]:
    """Retrieve symbols matching query via SQLite FTS5 BM25 scoring.

    Returns mapping of symbol_id -> normalized BM25 score in [0.0, 1.0].
    """
    cur = conn.cursor()
    try:
        cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='symbols_fts'")
        if not cur.fetchone():
            return {}

        fts_query = sanitize_fts5_query(query)
        if not fts_query:
            return {}

        cur.execute(
            """
            SELECT rowid, -bm25(symbols_fts, 3.0, 2.0, 1.0, 1.0) as score
            FROM symbols_fts
            WHERE symbols_fts MATCH ?
            ORDER BY score DESC
            LIMIT ?
            """,
            (fts_query, limit),
        )
        rows = cur.fetchall()
        if not rows:
            return {}
        max_score = max(r[1] for r in rows)
        if max_score <= 0:
            return {}
        return {r[0]: round(r[1] / max_score, 4) for r in rows}
    except Exception:
        return {}


def store_symbol_embedding(
    conn: sqlite3.Connection,
    symbol_id: int,
    model: str,
    embedding: Sequence[float],
    updated_at: Optional[float] = None,
) -> None:
    """Store or update a dense embedding vector for a symbol."""
    import time
    from fastast.embeddings import encode_embedding

    blob = encode_embedding(embedding)
    ts = updated_at if updated_at is not None else time.time()
    with conn:
        conn.execute(
            """
            INSERT OR REPLACE INTO symbol_embeddings (symbol_id, model, dimensions, embedding, updated_at)
            VALUES (?, ?, ?, ?, ?)
            """,
            (symbol_id, model, len(embedding), blob, ts),
        )


def get_symbol_embedding(
    conn: sqlite3.Connection,
    symbol_id: int,
) -> Optional[List[float]]:
    """Retrieve the stored dense embedding vector for a symbol."""
    from fastast.embeddings import decode_embedding

    cur = conn.cursor()
    try:
        cur.execute(
            "SELECT embedding FROM symbol_embeddings WHERE symbol_id = ?",
            (symbol_id,),
        )
        row = cur.fetchone()
        if not row:
            return None
        return decode_embedding(row[0])
    except Exception:
        return None


def delete_symbol_embedding(
    conn: sqlite3.Connection,
    symbol_id: int,
) -> None:
    """Delete a stored embedding for a symbol."""
    with conn:
        conn.execute("DELETE FROM symbol_embeddings WHERE symbol_id = ?", (symbol_id,))


def search_symbols_semantic(
    conn: sqlite3.Connection,
    query_vector: Sequence[float],
    limit: int = 100,
    model: Optional[str] = None,
) -> Dict[int, float]:
    """Retrieve symbols ordered by cosine similarity with query_vector.

    Returns mapping of symbol_id -> normalized similarity score in [0.0, 1.0].
    """
    if not query_vector:
        return {}

    cur = conn.cursor()
    try:
        cur.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='symbol_embeddings'"
        )
        if not cur.fetchone():
            return {}

        if model:
            cur.execute(
                "SELECT symbol_id, embedding FROM symbol_embeddings WHERE model = ?",
                (model,),
            )
        else:
            cur.execute("SELECT symbol_id, embedding FROM symbol_embeddings")

        rows = cur.fetchall()
        if not rows:
            return {}

        from fastast.embeddings import cosine_similarity, decode_embedding

        scored: List[Tuple[int, float]] = []
        for sym_id, blob in rows:
            emb = decode_embedding(blob)
            if not emb:
                continue
            sim = cosine_similarity(query_vector, emb)
            if sim >= 0.25:
                scored.append((sym_id, sim))

        if not scored:
            return {}

        scored.sort(key=lambda x: x[1], reverse=True)
        top = scored[:limit]
        max_sim = top[0][1] if top else 1.0

        return {
            sym_id: round(sim / max_sim if max_sim > 0 else sim, 4)
            for sym_id, sim in top
        }
    except Exception:
        return {}


def backfill_symbol_embeddings(
    conn: sqlite3.Connection,
    provider: Optional[Any] = None,
    batch_size: int = 200,
) -> int:
    """Generate and store embeddings for any indexed symbols currently lacking embeddings."""
    import time
    from fastast.embeddings import (
        encode_embedding,
        get_embedding_provider,
        prepare_symbol_text,
    )

    if provider is None:
        provider = get_embedding_provider()

    cur = conn.cursor()
    try:
        cur.execute(
            """
            SELECT s.id, s.name, s.kind, s.signature, s.docstring, f.path as file_path
            FROM symbols s
            JOIN files f ON s.file_id = f.id
            WHERE s.id NOT IN (SELECT symbol_id FROM symbol_embeddings WHERE model = ?)
            """,
            (provider.model_name,),
        )
        missing = cur.fetchall()
        if not missing:
            return 0

        now = time.time()
        count = 0
        for i in range(0, len(missing), batch_size):
            batch = missing[i : i + batch_size]
            emb_rows = []
            for r in batch:
                text = prepare_symbol_text(
                    name=r["name"],
                    kind=r["kind"],
                    signature=r["signature"],
                    docstring=r["docstring"],
                    file_path=r["file_path"],
                )
                vec = provider.embed_text(text)
                blob = encode_embedding(vec)
                emb_rows.append(
                    (r["id"], provider.model_name, provider.dimension, blob, now)
                )

            with conn:
                cur.executemany(
                    """
                    INSERT OR REPLACE INTO symbol_embeddings (symbol_id, model, dimensions, embedding, updated_at)
                    VALUES (?, ?, ?, ?, ?)
                    """,
                    emb_rows,
                )
            count += len(batch)
        return count
    except Exception:
        return 0


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

    cur.execute("SELECT COUNT(*) FROM edges")
    edges_count = cur.fetchone()[0]

    cur.execute("SELECT language, COUNT(*) FROM files GROUP BY language ORDER BY COUNT(*) DESC")
    languages = {row[0]: row[1] for row in cur.fetchall()}

    cur.execute("SELECT category, COUNT(*) FROM files GROUP BY category ORDER BY COUNT(*) DESC")
    categories = {row[0]: row[1] for row in cur.fetchall()}

    return {
        "files": files_count,
        "symbols": symbols_count,
        "imports": imports_count,
        "calls": calls_count,
        "edges": edges_count,
        "languages": languages,
        "categories": categories,
    }


def get_edges(
    conn: sqlite3.Connection,
    symbol_name: str,
    relation: Optional[str] = None,
) -> List[EdgeRecord]:
    """Retrieve graph edges connected to a symbol as source or destination."""
    cur = conn.cursor()
    if relation:
        cur.execute(
            """
            SELECT src, dst, relation, confidence, line_number
            FROM edges
            WHERE (src = ? OR dst = ?) AND relation = ?
            ORDER BY confidence DESC, id ASC
            """,
            (symbol_name, symbol_name, relation),
        )
    else:
        cur.execute(
            """
            SELECT src, dst, relation, confidence, line_number
            FROM edges
            WHERE src = ? OR dst = ?
            ORDER BY confidence DESC, id ASC
            """,
            (symbol_name, symbol_name),
        )

    return [
        EdgeRecord(
            src=row["src"],
            dst=row["dst"],
            relation=row["relation"],
            confidence=row["confidence"],
            line_number=row["line_number"],
        )
        for row in cur.fetchall()
    ]


def get_candidate_evidence(
    conn: sqlite3.Connection,
    symbol_id: int,
    padding_lines: int = 5,
) -> Optional[Candidate]:
    """Construct a candidate with bounded evidence window and 1-hop graph neighbors."""
    cur = conn.cursor()
    cur.execute(
        """
        SELECT s.id, s.name, s.kind, s.signature, s.start_line, s.end_line, s.docstring,
               f.path as file_path
        FROM symbols s
        JOIN files f ON s.file_id = f.id
        WHERE s.id = ?
        """,
        (symbol_id,),
    )
    row = cur.fetchone()
    if not row:
        return None

    name = row["name"]
    start_line = max(1, row["start_line"] - padding_lines)
    end_line = row["end_line"] + padding_lines

    # Read snippet from disk if file exists
    snippet = None
    file_path = Path(row["file_path"])
    if file_path.exists():
        try:
            with open(file_path, "r", encoding="utf-8", errors="replace") as f:
                lines = f.readlines()
                snippet = "".join(lines[start_line - 1 : min(len(lines), end_line)])
        except Exception:
            snippet = None

    # Fetch 1-hop graph neighbors
    cur.execute(
        """
        SELECT DISTINCT CASE WHEN src = ? THEN dst ELSE src END as neighbor
        FROM edges
        WHERE src = ? OR dst = ?
        LIMIT 20
        """,
        (name, name, name),
    )
    neighbors = [r["neighbor"] for r in cur.fetchall() if r["neighbor"]]

    evidence = EvidenceWindow(
        start_line=start_line,
        end_line=end_line,
        snippet=snippet,
    )

    reasons = [
        f"Symbol '{name}' matches target query",
        f"Kind: {row['kind']}",
        f"Graph degrees: {len(neighbors)} neighbors",
    ]

    return Candidate(
        symbol_id=str(row["id"]),
        score=1.0,
        reasons=reasons,
        neighbors=neighbors,
        evidence_window=evidence,
    )


def get_graph_neighborhood(
    conn: sqlite3.Connection,
    symbol_name: str,
    max_depth: int = 2,
    max_nodes: int = 30,
    min_confidence: float = 0.5,
    direction: str = "both",
) -> Dict[str, Any]:
    """Execute bounded multi-hop neighborhood expansion from SQLite data."""
    from fastast.graph import CodeGraph

    # In-memory graph loading from open connection
    graph = CodeGraph(min_confidence=min_confidence, prune_builtins=True)

    # 1. Load symbols
    cur = conn.cursor()
    cur.execute(
        """
        SELECT s.id, s.name, s.kind, s.signature, s.start_line, s.end_line,
               s.confidence, s.docstring, f.path as file_path, p.name as parent_name
        FROM symbols s
        JOIN files f ON s.file_id = f.id
        LEFT JOIN symbols p ON s.parent_symbol_id = p.id
        """
    )
    from fastast.graph import Node
    for row in cur.fetchall():
        sym_rec = SymbolRecord(
            id=row["id"],
            name=row["name"],
            kind=row["kind"],
            file=row["file_path"],
            start_line=row["start_line"],
            end_line=row["end_line"],
            confidence=row["confidence"],
            signature=row["signature"],
            parent_name=row["parent_name"],
            docstring=row["docstring"],
        )
        graph.add_node(Node.from_symbol_record(sym_rec))

    # 2. Load edges
    cur.execute("SELECT src, dst, relation, confidence, line_number FROM edges")
    for row in cur.fetchall():
        edge = EdgeRecord(
            src=row["src"],
            dst=row["dst"],
            relation=row["relation"],
            confidence=row["confidence"],
            line_number=row["line_number"],
        )
        graph.add_edge(edge)

    return graph.bounded_traversal(
        symbol_name,
        max_depth=max_depth,
        max_nodes=max_nodes,
        min_confidence=min_confidence,
        direction=direction,
    )
