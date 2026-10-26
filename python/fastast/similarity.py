"""MinHash and Locality-Sensitive Hashing (LSH) for near-duplicate symbol detection.

Provides:
1. extract_symbol_shingles: Token and subword shingle extraction from symbol AST data.
2. MinHash: Deterministic 64-permutation min-wise independent hashing.
3. LSHIndex: 16-band x 4-row locality-sensitive hash index for sub-quadratic candidate generation.
4. compute_similarity_pairs: Emits pairs with Jaccard similarity >= threshold.
5. index_similarity: Runs MinHash + LSH over indexed symbols in SQLite and persists results.
"""

from __future__ import annotations

import hashlib
import re
import sqlite3
import time
from typing import Any, Dict, List, Optional, Set, Tuple


# Prime modulus for Carter-Wegman universal hashing (2^31 - 1, Mersenne prime 8)
_MERSENNE_PRIME = 2147483647


def _tokenize_code_text(text: str) -> List[str]:
    """Tokenize code text, splitting camelCase, snake_case, and punctuation."""
    if not text:
        return []
    s0 = text.replace("_", " ")
    s1 = re.sub(r"([a-z0-9])([A-Z])", r"\1 \2", s0)
    s2 = re.sub(r"([A-Z]+)([A-Z][a-z])", r"\1 \2", s1)
    tokens = [t.lower() for t in re.findall(r"[a-zA-Z0-9]+", s2) if len(t) > 1]
    return tokens


def extract_symbol_shingles(
    name: str,
    kind: str,
    signature: Optional[str] = None,
    docstring: Optional[str] = None,
) -> Set[str]:
    """Extract token and subword shingles from symbol properties."""
    shingles: Set[str] = set()

    # Base tokens
    name_tokens = _tokenize_code_text(name)
    shingles.update(name_tokens)
    shingles.add(f"kind:{kind.lower()}")

    # Signature tokens
    if signature:
        sig_tokens = _tokenize_code_text(signature)
        shingles.update(sig_tokens)

    # Docstring tokens
    if docstring:
        doc_tokens = _tokenize_code_text(docstring)
        shingles.update(doc_tokens[:30])  # Cap docstring tokens for balance

    # Character 3-grams for identifier morphological variations
    for t in name_tokens:
        if len(t) >= 3:
            for i in range(len(t) - 2):
                shingles.add(t[i : i + 3])

    return shingles


def compute_jaccard_similarity(set_a: Set[str], set_b: Set[str]) -> float:
    """Compute exact Jaccard similarity between two shingle sets."""
    if not set_a and not set_b:
        return 1.0
    if not set_a or not set_b:
        return 0.0
    intersection = len(set_a & set_b)
    union = len(set_a | set_b)
    return round(intersection / union, 4) if union > 0 else 0.0


class MinHash:
    """Min-wise independent hashing signature generator.

    Generates m = 64 deterministic hash permutations.
    """

    def __init__(self, num_hashes: int = 64) -> None:
        self.num_hashes = num_hashes
        # Generate deterministic, reproducible linear congruential hash parameters
        self._a: List[int] = []
        self._b: List[int] = []
        for i in range(num_hashes):
            # Pick distinct coefficients coprime to Mersenne prime
            a = (i * 10007 + 3) % _MERSENNE_PRIME
            b = (i * 20011 + 7) % _MERSENNE_PRIME
            self._a.append(max(1, a))
            self._b.append(b)

    def compute_signature(self, shingles: Set[str]) -> List[int]:
        """Compute the m-dimensional MinHash signature for a set of shingles."""
        if not shingles:
            return [0] * self.num_hashes

        # Pre-hash shingles into 32-bit integers
        shingle_hashes = [
            int(hashlib.sha256(s.encode("utf-8")).hexdigest()[:8], 16)
            for s in shingles
        ]

        sig: List[int] = []
        for a, b in zip(self._a, self._b):
            min_val = _MERSENNE_PRIME
            for h in shingle_hashes:
                val = (a * h + b) % _MERSENNE_PRIME
                if val < min_val:
                    min_val = val
            sig.append(min_val)
        return sig

    @staticmethod
    def estimate_jaccard(sig1: List[int], sig2: List[int]) -> float:
        """Estimate Jaccard similarity from two MinHash signatures."""
        if len(sig1) != len(sig2) or not sig1:
            return 0.0
        matches = sum(1 for a, b in zip(sig1, sig2) if a == b)
        return round(matches / len(sig1), 4)


class LSHIndex:
    """Locality-Sensitive Hashing (LSH) index using band partitioning.

    Partitions m = 64 hash signature into b = 16 bands of r = 4 rows each.
    Candidate pairs share at least one identical band bucket.
    """

    def __init__(self, num_hashes: int = 64, num_bands: int = 16) -> None:
        self.num_hashes = num_hashes
        self.num_bands = num_bands
        self.rows_per_band = num_hashes // num_bands
        # band_idx -> bucket_hash -> list of symbol_ids
        self._buckets: Dict[int, Dict[Tuple[int, ...], List[int]]] = {
            b: {} for b in range(num_bands)
        }

    def add(self, symbol_id: int, signature: List[int]) -> None:
        """Index a symbol signature across all LSH bands."""
        for b in range(self.num_bands):
            start = b * self.rows_per_band
            end = start + self.rows_per_band
            band_key = tuple(signature[start:end])
            bucket = self._buckets[b].setdefault(band_key, [])
            bucket.append(symbol_id)

    def find_candidate_pairs(self) -> Set[Tuple[int, int]]:
        """Find all candidate symbol pairs that collided in at least one band."""
        candidates: Set[Tuple[int, int]] = set()
        for b in range(self.num_bands):
            for bucket in self._buckets[b].values():
                if len(bucket) > 1:
                    for i in range(len(bucket)):
                        for j in range(i + 1, len(bucket)):
                            u = bucket[i]
                            v = bucket[j]
                            if u != v:
                                candidates.add((min(u, v), max(u, v)))
        return candidates


def compute_similarity_pairs(
    symbols: List[Dict[str, Any]],
    min_similarity: float = 0.5,
) -> List[Tuple[int, int, float]]:
    """Detect similar / near-duplicate symbol pairs using MinHash + LSH."""
    if len(symbols) < 2:
        return []

    minhasher = MinHash(num_hashes=64)
    lsh = LSHIndex(num_hashes=64, num_bands=16)

    # 1. Compute shingles and signatures
    shingle_map: Dict[int, Set[str]] = {}
    for s in symbols:
        sym_id = s["id"]
        shingles = extract_symbol_shingles(
            name=s["name"],
            kind=s["kind"],
            signature=s.get("signature"),
            docstring=s.get("docstring"),
        )
        shingle_map[sym_id] = shingles
        sig = minhasher.compute_signature(shingles)
        lsh.add(sym_id, sig)

    # 2. Extract candidate pairs from LSH collisions
    candidate_pairs = lsh.find_candidate_pairs()

    # 3. Compute exact Jaccard similarity for candidate pairs
    results: List[Tuple[int, int, float]] = []
    for u, v in candidate_pairs:
        sim = compute_jaccard_similarity(shingle_map[u], shingle_map[v])
        if sim >= min_similarity:
            results.append((u, v, sim))

    results.sort(key=lambda x: x[2], reverse=True)
    return results


def index_similarity(
    conn: sqlite3.Connection,
    min_similarity: float = 0.5,
) -> int:
    """Index near-duplicate symbols into SQLite symbol_similarity and edges tables."""
    cur = conn.cursor()
    cur.execute("SELECT id, name, kind, signature, docstring FROM symbols")
    rows = cur.fetchall()
    if len(rows) < 2:
        return 0

    symbols_list = [
        {
            "id": r["id"],
            "name": r["name"],
            "kind": r["kind"],
            "signature": r["signature"],
            "docstring": r["docstring"],
        }
        for r in rows
    ]

    pairs = compute_similarity_pairs(symbols_list, min_similarity=min_similarity)
    if not pairs:
        return 0

    now = time.time()
    db_rows = []
    for u, v, sim in pairs:
        db_rows.append((u, v, sim, now))
        db_rows.append((v, u, sim, now))  # Symmetric lookup

    with conn:
        conn.executemany(
            """
            INSERT OR REPLACE INTO symbol_similarity (src_symbol_id, dst_symbol_id, similarity, created_at)
            VALUES (?, ?, ?, ?)
            """,
            db_rows,
        )

    return len(pairs)
