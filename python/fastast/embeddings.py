"""Semantic Embeddings and Vector Search layer for FastAST.

Provides a pluggable embedding architecture:
1. BaseEmbeddingProvider: Abstract base class for all embedding providers.
2. SemanticProjectionProvider (default): Zero-dependency, offline-first, high-speed
   semantic projection vectorizer using concept taxonomy mapping, subword n-gram hashing,
   and L2 normalization.
3. FastembedProvider: Pluggable wrapper for fastembed (if installed).
4. SentenceTransformersProvider: Pluggable wrapper for sentence-transformers (if installed).
5. CustomEmbeddingProvider: Allows user-defined embedding functions.
"""

from abc import ABC, abstractmethod
import hashlib
import math
import os
import re
import struct
from typing import Any, Callable, Dict, List, Optional, Sequence, Set, Type, Union

# ── Concept Taxonomy for Software Engineering Domains ────────────────────────
# Maps domain concepts to clusters so semantically related terms share coordinates
CONCEPT_TAXONOMY: Dict[str, Set[str]] = {
    "auth_security": {
        "auth", "authenticate", "authentication", "login", "signin", "signup",
        "logout", "credential", "credentials", "session", "jwt", "token", "tokens",
        "password", "secret", "security", "permission", "permissions", "role", "roles",
        "oauth", "access", "authorize", "authorization", "crypto", "encryption",
        "decrypt", "verification", "verify", "identity", "principal", "bearer",
    },
    "db_storage": {
        "db", "database", "store", "storage", "persist", "persistence", "save",
        "load", "query", "queries", "record", "records", "table", "tables", "schema",
        "sql", "sqlite", "postgres", "postgresql", "mysql", "mongodb", "redis",
        "repository", "crud", "insert", "update", "delete", "upsert", "entity",
        "entities", "model", "dao", "transaction", "commit", "rollback", "migration",
    },
    "network_api": {
        "http", "https", "request", "requests", "response", "responses", "client",
        "server", "endpoint", "endpoints", "api", "route", "router", "routes",
        "fetch", "url", "uri", "rest", "graphql", "socket", "websocket", "packet",
        "port", "connect", "connection", "webhook", "controller", "handler", "proxy",
        "gateway", "dispatch", "rpc", "grpc", "service",
    },
    "billing_finance": {
        "billing", "bill", "invoice", "invoices", "payment", "payments", "pay",
        "charge", "charges", "tax", "taxes", "vat", "levy", "levies", "receipt",
        "duty", "duties", "checkout", "price", "pricing", "cost", "costs", "money",
        "fee", "fees", "currency", "dollar", "eur", "subscription", "financial",
        "fiscal", "amount", "refund", "credit", "balance",
    },
    "parsing_ast": {
        "ast", "syntax", "grammar", "token", "tokens", "lexer", "tokenizer",
        "tree", "node", "nodes", "parse", "parser", "parsing", "compile", "compiler",
        "codegen", "bytecode", "interpreter", "eval", "statement", "expression",
        "declaration", "identifier", "literal", "scope", "symbol", "symbols",
        "visitor", "traverse", "cst",
    },
    "math_algorithms": {
        "math", "calculate", "calculation", "compute", "computation", "algorithm",
        "algorithms", "memoize", "memoization", "dynamic", "fibonacci", "number",
        "numbers", "sum", "matrix", "vector", "sort", "search", "filter", "reduce",
        "map", "graph", "bfs", "dfs", "heuristic", "optimization", "formula",
        "prime", "factorial", "statistic", "statistics",
    },
    "concurrency_async": {
        "thread", "threads", "async", "await", "coroutine", "parallel", "lock",
        "mutex", "worker", "workers", "queue", "pool", "task", "tasks", "job",
        "jobs", "future", "promise", "channel", "semaphore", "spawn", "background",
        "concurrent", "concurrency", "schedule", "scheduler",
    },
    "io_filesystem": {
        "read", "reader", "write", "writer", "file", "files", "disk", "stream",
        "buffer", "path", "paths", "directory", "folder", "dump", "open", "close",
        "blob", "byte", "bytes", "io", "fs", "flush", "seek", "pipe",
    },
    "testing_qa": {
        "test", "tests", "assert", "assertion", "mock", "stub", "fixture", "spec",
        "verify", "benchmark", "suite", "unit", "integration", "coverage", "expect",
        "should", "runner", "harness",
    },
    "config_env": {
        "config", "configuration", "configure", "setting", "settings", "env",
        "environment", "property", "properties", "option", "options", "param",
        "parameter", "parameters", "flag", "flags", "args", "cli", "variable",
        "preference", "default",
    },
    "error_logging": {
        "error", "errors", "exception", "exceptions", "fail", "failure", "catch",
        "throw", "raise", "traceback", "panic", "fault", "warn", "warning",
        "recover", "rescue", "log", "logging", "logger", "debug", "info", "fatal",
    },
    "search_retrieval": {
        "search", "query", "find", "lookup", "match", "bm25", "tfidf", "fts",
        "vector", "embedding", "embeddings", "index", "indexer", "indexing",
        "rank", "ranking", "retrieve", "retrieval", "semantic", "lexical",
        "similarity", "cosine", "distance",
    },
    "ui_frontend": {
        "ui", "view", "render", "rendering", "component", "components", "template",
        "style", "css", "html", "dom", "event", "button", "form", "widget",
        "screen", "page", "display", "layout", "theme",
    },
    "data_structures": {
        "list", "array", "map", "dict", "dictionary", "hash", "set", "stack",
        "queue", "tree", "trie", "heap", "linked", "graph", "pair", "tuple",
        "collection", "iterable",
    },
}


# ── Serialization & Similarity Utilities ─────────────────────────────────────

def encode_embedding(vec: Sequence[float]) -> bytes:
    """Pack float vector into binary bytes for compact SQLite BLOB storage."""
    return struct.pack(f"{len(vec)}f", *vec)


def decode_embedding(data: bytes) -> List[float]:
    """Unpack binary BLOB bytes into a float vector."""
    count = len(data) // 4
    if count == 0:
        return []
    return list(struct.unpack(f"{count}f", data))


def cosine_similarity(v1: Sequence[float], v2: Sequence[float]) -> float:
    """Compute cosine similarity between two float vectors.

    If vectors are already L2-normalized, this is strictly the dot product.
    """
    if len(v1) != len(v2) or not v1:
        return 0.0

    dot = 0.0
    norm1 = 0.0
    norm2 = 0.0
    for a, b in zip(v1, v2):
        dot += a * b
        norm1 += a * a
        norm2 += b * b

    denom = math.sqrt(norm1 * norm2)
    if denom <= 0.0:
        return 0.0

    cos = dot / denom
    return max(-1.0, min(1.0, cos))


def prepare_symbol_text(
    name: str,
    kind: str,
    signature: Optional[str] = None,
    docstring: Optional[str] = None,
    file_path: Optional[str] = None,
    code_context: Optional[str] = None,
) -> str:
    """Format symbol metadata into structured text for dense embedding."""
    lines: List[str] = [f"name: {name}", f"kind: {kind}"]
    if signature:
        lines.append(f"signature: {signature}")
    if docstring:
        lines.append(f"docstring: {docstring.strip()}")
    if file_path:
        lines.append(f"file: {file_path}")
    if code_context:
        lines.append(f"code: {code_context.strip()[:300]}")
    return "\n".join(lines)


# ── Base Embedding Provider ──────────────────────────────────────────────────

class BaseEmbeddingProvider(ABC):
    """Abstract base class for FastAST embedding backends."""

    @property
    @abstractmethod
    def model_name(self) -> str:
        """Identifier name of the embedding model."""
        pass

    @property
    def model_version(self) -> str:
        """Version string of the embedding model."""
        return "1.0"

    @property
    @abstractmethod
    def dimension(self) -> int:
        """Output embedding vector dimension."""
        pass

    @abstractmethod
    def embed_text(self, text: str) -> List[float]:
        """Generate a dense embedding vector for a single text."""
        pass

    def embed_batch(self, texts: List[str]) -> List[List[float]]:
        """Generate dense embedding vectors for a batch of texts."""
        return [self.embed_text(t) for t in texts]


# ── Semantic Projection Provider (Default Built-In) ──────────────────────────

class SemanticProjectionProvider(BaseEmbeddingProvider):
    """Zero-dependency, offline-first semantic vectorizer.

    Combines:
    1. Concept Domain Taxonomy (first 32 dimensions): energizes coordinates when terms
       belong to semantically mapped software concepts (e.g. auth, billing, db).
    2. Subword & n-gram Feature Hashing (remaining 96 dimensions): maps word tokens and
       character 3-grams with signed hashing for morphological and lexical robustness.
    3. L2 Normalization: ensures all vectors lie on the unit hypersphere so dot product
       equals cosine similarity directly.
    """

    def __init__(self, dimension: int = 128) -> None:
        if dimension < 64:
            dimension = 64
        self._dim = dimension
        self._concept_dims = min(32, dimension // 2)
        self._hash_dims = self._dim - self._concept_dims

        # Pre-build lookup map for fast concept matching: token -> list of (dim_index, weight)
        self._concept_map: Dict[str, List[int]] = {}
        cluster_names = sorted(CONCEPT_TAXONOMY.keys())
        for i, cname in enumerate(cluster_names):
            base_idx = i % self._concept_dims
            for token in CONCEPT_TAXONOMY[cname]:
                if token not in self._concept_map:
                    self._concept_map[token] = []
                self._concept_map[token].append(base_idx)

    @property
    def model_name(self) -> str:
        return f"fastast-projection-{self._dim}"

    @property
    def dimension(self) -> int:
        return self._dim

    def _tokenize(self, text: str) -> List[str]:
        """Split text into lowercase tokens, handling snake_case and camelCase."""
        if not text:
            return []
        # Split camelCase / PascalCase
        s1 = re.sub(r"([a-z0-9])([A-Z])", r"\1 \2", text)
        s2 = re.sub(r"([A-Z]+)([A-Z][a-z])", r"\1 \2", s1)
        tokens = [t.lower() for t in re.findall(r"[a-zA-Z0-9]+", s2) if len(t) > 1]
        return tokens

    def embed_text(self, text: str) -> List[float]:
        vec = [0.0] * self._dim
        tokens = self._tokenize(text)
        if not tokens:
            return vec

        # 1. Concept Domain Projections (first _concept_dims)
        for t in tokens:
            if t in self._concept_map:
                for idx in self._concept_map[t]:
                    vec[idx] += 2.0

        # 2. Token & Subword 3-gram Feature Hashing (_concept_dims .. _dim)
        for t in tokens:
            h = int(hashlib.sha256(t.encode("utf-8")).hexdigest()[:8], 16)
            idx = self._concept_dims + (h % self._hash_dims)
            sign = 1.0 if (h >> 5) & 1 else -1.0
            vec[idx] += sign * 1.0

            # Character 3-grams for morphological variations
            if len(t) >= 3:
                for j in range(len(t) - 2):
                    ng = t[j : j + 3]
                    h_ng = int(hashlib.sha256(ng.encode("utf-8")).hexdigest()[:8], 16)
                    idx_ng = self._concept_dims + (h_ng % self._hash_dims)
                    sign_ng = 1.0 if (h_ng >> 5) & 1 else -1.0
                    vec[idx_ng] += sign_ng * 0.35

        # 3. L2 Hypersphere Normalization
        norm = math.sqrt(sum(x * x for x in vec))
        if norm > 0.0:
            inv = 1.0 / norm
            return [round(x * inv, 6) for x in vec]
        return vec


# ── Pluggable External Providers ─────────────────────────────────────────────

def _raise_missing_dependency(package_name: str, cause: Exception) -> None:
    raise ImportError(
        f"{package_name} is not installed. Install via `pip install {package_name}` "
        "or use the default SemanticProjectionProvider."
    ) from cause


class FastembedProvider(BaseEmbeddingProvider):
    """Wrapper for fastembed (https://github.com/qdrant/fastembed) if installed."""

    def __init__(self, model_name: str = "BAAI/bge-small-en-v1.5") -> None:
        try:
            from fastembed import TextEmbedding  # type: ignore
            self._model = TextEmbedding(model_name=model_name)
            self._model_name = model_name
            self._dimension = 384
        except ImportError as exc:
            _raise_missing_dependency("fastembed", exc)

    @property
    def model_name(self) -> str:
        return f"fastembed-{self._model_name}"

    @property
    def dimension(self) -> int:
        return self._dimension

    def embed_text(self, text: str) -> List[float]:
        embeddings = list(self._model.embed([text]))
        return [float(x) for x in embeddings[0]]

    def embed_batch(self, texts: List[str]) -> List[List[float]]:
        embeddings = list(self._model.embed(texts))
        return [[float(x) for x in emb] for emb in embeddings]


class SentenceTransformersProvider(BaseEmbeddingProvider):
    """Wrapper for sentence-transformers (https://sbert.net) if installed."""

    def __init__(self, model_name: str = "all-MiniLM-L6-v2") -> None:
        try:
            from sentence_transformers import SentenceTransformer  # type: ignore
            self._model = SentenceTransformer(model_name)
            self._model_name = model_name
            self._dimension = self._model.get_sentence_embedding_dimension()
        except ImportError as exc:
            _raise_missing_dependency("sentence-transformers", exc)

    @property
    def model_name(self) -> str:
        return f"sentence-transformers-{self._model_name}"

    @property
    def dimension(self) -> int:
        return self._dimension

    def embed_text(self, text: str) -> List[float]:
        emb = self._model.encode(text, normalize_embeddings=True)
        return [float(x) for x in emb]

    def embed_batch(self, texts: List[str]) -> List[List[float]]:
        embs = self._model.encode(texts, normalize_embeddings=True)
        return [[float(x) for x in row] for row in embs]


class CustomEmbeddingProvider(BaseEmbeddingProvider):
    """User-supplied embedding function adapter."""

    def __init__(
        self,
        embed_fn: Callable[[str], List[float]],
        model_name: str = "custom",
        dimension: int = 128,
        model_version: str = "1.0",
    ) -> None:
        self._embed_fn = embed_fn
        self._model_name = model_name
        self._dimension = dimension
        self._model_version = model_version

    @property
    def model_name(self) -> str:
        return self._model_name

    @property
    def model_version(self) -> str:
        return self._model_version

    @property
    def dimension(self) -> int:
        return self._dimension

    def embed_text(self, text: str) -> List[float]:
        vec = self._embed_fn(text)
        norm = math.sqrt(sum(x * x for x in vec))
        if norm > 0.0:
            return [x / norm for x in vec]
        return vec


# ── Provider Factory & Registry ──────────────────────────────────────────────

_PROVIDER_CACHE: Dict[str, BaseEmbeddingProvider] = {}
_PROVIDER_REGISTRY: Dict[str, Type[BaseEmbeddingProvider]] = {
    "projection": SemanticProjectionProvider,
    "fastembed": FastembedProvider,
    "sentence-transformers": SentenceTransformersProvider,
}


def register_embedding_provider(
    name: str, provider_cls: Type[BaseEmbeddingProvider]
) -> None:
    """Register a custom embedding provider class."""
    _PROVIDER_REGISTRY[name.lower()] = provider_cls


def get_embedding_provider(
    name: Optional[str] = None, **kwargs: Any
) -> BaseEmbeddingProvider:
    """Retrieve an embedding provider instance by name.

    If name is None, reads FASTAST_EMBEDDING_PROVIDER environment variable,
    falling back to the built-in 'projection' provider.
    """
    target = (name or os.environ.get("FASTAST_EMBEDDING_PROVIDER", "projection")).lower()
    cache_key = f"{target}_{sorted(kwargs.items())}"

    if cache_key in _PROVIDER_CACHE:
        return _PROVIDER_CACHE[cache_key]

    if target in _PROVIDER_REGISTRY:
        cls = _PROVIDER_REGISTRY[target]
        instance = cls(**kwargs)
        _PROVIDER_CACHE[cache_key] = instance
        return instance

    # Fallback to projection if requested target is not found
    instance = SemanticProjectionProvider()
    _PROVIDER_CACHE[cache_key] = instance
    return instance

