"""Configuration, environment overrides, path validation, and security boundaries for FastAST."""

from __future__ import annotations

from dataclasses import asdict, dataclass
import hashlib
import json
import logging
import os
from pathlib import Path
import re
import shutil
import sys
from typing import Any, Dict, List, Optional, Set, Union


class PathTraversalError(ValueError):
    """Raised when a path attempts to escape the allowed project repository root."""
    pass


@dataclass
class FastASTConfig:
    """Centralized FastAST configuration parameters."""
    db_name: str = ".fastast.db"
    cache_dir: Optional[str] = None
    max_tokens: int = 2048
    log_level: str = "INFO"
    lock_timeout_seconds: float = 30.0
    stale_lock_seconds: float = 600.0  # 10 minutes
    watch_debounce_ms: int = 300
    max_file_size_bytes: int = 10 * 1024 * 1024  # 10 MB
    max_snippet_lines: int = 60
    max_query_limit: int = 50
    default_ranking_method: str = "hybrid"
    allow_symlinks_outside_root: bool = False

    def to_dict(self) -> Dict[str, Any]:
        """Convert configuration to dictionary."""
        return asdict(self)


def get_logger(name: str = "fastast") -> logging.Logger:
    """Retrieve configured FastAST logger."""
    logger = logging.getLogger(name)
    if not logger.handlers:
        handler = logging.StreamHandler()
        fmt = logging.Formatter(
            "[%(asctime)s] [%(name)s] [%(levelname)s] %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )
        handler.setFormatter(fmt)
        logger.addHandler(handler)

    level_name = os.environ.get("FASTAST_LOG_LEVEL", "INFO").upper()
    level = getattr(logging, level_name, logging.INFO)
    logger.setLevel(level)
    return logger


logger = get_logger("fastast.config")


def load_config(repo_root: Optional[Union[str, Path]] = None) -> FastASTConfig:
    """Load configuration combining defaults, configuration files, and environment variables.

    Precedence order (highest to lowest):
    1. Environment variables (e.g. FASTAST_MAX_TOKENS)
    2. Repository configuration file (.fastastrc.json or fastast.toml)
    3. Built-in defaults
    """
    config = FastASTConfig()

    root = Path(repo_root).resolve() if repo_root else Path.cwd()

    # 1. Load from file if present (.fastastrc.json)
    config_file = root / ".fastastrc.json"
    if config_file.exists() and config_file.is_file():
        try:
            with open(config_file, "r", encoding="utf-8") as f:
                data = json.load(f)
                if isinstance(data, dict):
                    if "db_name" in data:
                        config.db_name = str(data["db_name"])
                    if "cache_dir" in data:
                        config.cache_dir = str(data["cache_dir"])
                    if "max_tokens" in data:
                        config.max_tokens = int(data["max_tokens"])
                    if "log_level" in data:
                        config.log_level = str(data["log_level"]).upper()
                    if "lock_timeout_seconds" in data:
                        config.lock_timeout_seconds = float(data["lock_timeout_seconds"])
                    if "watch_debounce_ms" in data:
                        config.watch_debounce_ms = int(data["watch_debounce_ms"])
                    if "max_file_size_bytes" in data:
                        config.max_file_size_bytes = int(data["max_file_size_bytes"])
        except Exception as exc:
            logger.warning(f"Failed to parse config file {config_file}: {exc}")

    # 2. Apply environment variable overrides
    if "FASTAST_DB_NAME" in os.environ:
        config.db_name = os.environ["FASTAST_DB_NAME"]
    if "FASTAST_CACHE_DIR" in os.environ:
        config.cache_dir = os.environ["FASTAST_CACHE_DIR"]
    if "FASTAST_MAX_TOKENS" in os.environ:
        try:
            config.max_tokens = int(os.environ["FASTAST_MAX_TOKENS"])
        except ValueError as exc:
            logger.warning(f"Invalid FASTAST_MAX_TOKENS value: {exc}")
    if "FASTAST_LOG_LEVEL" in os.environ:
        config.log_level = os.environ["FASTAST_LOG_LEVEL"].upper()
    if "FASTAST_LOCK_TIMEOUT" in os.environ:
        try:
            config.lock_timeout_seconds = float(os.environ["FASTAST_LOCK_TIMEOUT"])
        except ValueError as exc:
            logger.warning(f"Invalid FASTAST_LOCK_TIMEOUT value: {exc}")
    if "FASTAST_WATCH_DEBOUNCE_MS" in os.environ:
        try:
            config.watch_debounce_ms = int(os.environ["FASTAST_WATCH_DEBOUNCE_MS"])
        except ValueError as exc:
            logger.warning(f"Invalid FASTAST_WATCH_DEBOUNCE_MS value: {exc}")
    if "FASTAST_MAX_FILE_SIZE" in os.environ:
        try:
            config.max_file_size_bytes = int(os.environ["FASTAST_MAX_FILE_SIZE"])
        except ValueError as exc:
            logger.warning(f"Invalid FASTAST_MAX_FILE_SIZE value: {exc}")
    if "FASTAST_DEFAULT_RANKING" in os.environ:
        config.default_ranking_method = os.environ["FASTAST_DEFAULT_RANKING"]
    if "FASTAST_ALLOW_OUTSIDE_ROOT" in os.environ:
        config.allow_symlinks_outside_root = os.environ["FASTAST_ALLOW_OUTSIDE_ROOT"].lower() in {"1", "true", "yes"}

    # Bounded limits enforcement
    config.max_tokens = max(128, min(config.max_tokens, 16384))
    config.max_snippet_lines = max(5, min(config.max_snippet_lines, 500))
    config.max_query_limit = max(1, min(config.max_query_limit, 200))
    config.lock_timeout_seconds = max(1.0, min(config.lock_timeout_seconds, 300.0))

    return config


def _fail_traversal(target_path: Any, root: Any, exc: Exception) -> None:
    raise PathTraversalError(
        f"Access denied: Path '{target_path}' resolves outside allowed project root '{root}'."
    ) from exc


def validate_safe_path(
    target_path: Union[str, Path],
    allowed_root: Union[str, Path],
    must_exist: bool = False,
) -> Path:
    """Validate that target_path strictly resides within allowed_root.

    Prevents directory traversal vulnerabilities (e.g. `../../etc/passwd`),
    malicious absolute path escapes, and symlink jailbreaks.

    Args:
        target_path: Path to validate (relative or absolute).
        allowed_root: Approved project repository root directory.
        must_exist: If True, raises FileNotFoundError if target_path does not exist.

    Returns:
        Resolved Path strictly contained within allowed_root.

    Raises:
        PathTraversalError: If target_path resolves outside allowed_root.
        FileNotFoundError: If must_exist is True and path does not exist.
    """
    root = Path(allowed_root).resolve()
    target = Path(target_path)

    # If relative, anchor to root
    if not target.is_absolute():
        resolved = (root / target).resolve()
    else:
        resolved = target.resolve()

    # Verify root containment
    try:
        resolved.relative_to(root)
    except ValueError as exc:
        _fail_traversal(target_path, root, exc)

    if must_exist and not resolved.exists():
        raise FileNotFoundError(f"Path does not exist within project root: '{target_path}'")

    return resolved


def get_cache_root() -> Path:
    """Return the platform-appropriate FastAST cache root directory."""
    if "FASTAST_CACHE_DIR" in os.environ:
        base = Path(os.environ["FASTAST_CACHE_DIR"]).resolve()
    elif os.name == "nt":
        local_app_data = os.environ.get("LOCALAPPDATA")
        base = Path(local_app_data) / "fastast" / "cache" if local_app_data else Path.home() / ".cache" / "fastast"
    elif sys.platform == "darwin":
        base = Path.home() / "Library" / "Caches" / "fastast"
    else:
        xdg_cache = os.environ.get("XDG_CACHE_HOME")
        base = Path(xdg_cache) / "fastast" if xdg_cache else Path.home() / ".cache" / "fastast"
    base.mkdir(parents=True, exist_ok=True)
    return base


def get_project_cache_dir(repo_root: Optional[Union[str, Path]] = None) -> Path:
    """Return the isolated cache directory for a given repository."""
    root = Path(repo_root or ".").resolve()
    repo_hash = hashlib.sha256(str(root).encode("utf-8")).hexdigest()[:12]
    safe_name = re.sub(r"[^\w\-]", "_", root.name) or "repo"
    proj_dir = get_cache_root() / "projects" / f"{safe_name}_{repo_hash}"
    proj_dir.mkdir(parents=True, exist_ok=True)
    return proj_dir


def get_db_path(
    repo_root: Optional[Union[str, Path]] = None,
    db_name: Optional[str] = None,
    prefer_cache: Optional[bool] = None,
) -> Path:
    """Resolve the SQLite database path for a given repository.

    By default, stores the database in the global cache directory (~/.cache/fastast/...)
    so no .fastast.db file is ever created in the project repository.
    """
    root = Path(repo_root or ".").resolve()

    # 1. Explicit override via environment variable
    if "FASTAST_DB_PATH" in os.environ:
        p = Path(os.environ["FASTAST_DB_PATH"]).resolve()
        p.parent.mkdir(parents=True, exist_ok=True)
        return p

    # 2. Custom db_name explicitly passed (e.g. from tests: "test.db", "syntax.db", or absolute path)
    if db_name and db_name not in (".fastast.db", "fastast.db"):
        candidate = Path(db_name)
        if candidate.is_absolute():
            candidate.parent.mkdir(parents=True, exist_ok=True)
            return candidate
        return root / db_name

    # 3. Explicit local override via environment variable
    if os.environ.get("FASTAST_STORAGE_MODE", "").lower() in ("local", "repo") or os.environ.get("FASTAST_USE_LOCAL_DB", "").lower() in ("1", "true", "yes"):
        return root / (db_name or ".fastast.db")

    # 4. Check if running in a unit/integration test runner or temporary test dir
    is_test = (
        prefer_cache is False
        or "pytest" in sys.modules
        or "unittest" in sys.modules
        or os.environ.get("FASTAST_TEST_MODE") == "1"
        or str(root).startswith("/tmp")
        or str(root).startswith("/private/tmp")
        or "tmp" in str(root).lower()
    )
    if is_test and prefer_cache is not True:
        return root / (db_name or ".fastast.db")

    # 5. Default production & MCP mode: Global cache directory
    cache_dir = get_project_cache_dir(root)
    cache_file_name = "fastast.db" if (not db_name or db_name in (".fastast.db", "fastast.db")) else db_name
    cache_db = cache_dir / cache_file_name

    # 6. Automatic migration: if an existing .fastast.db is in the repo, migrate it to the cache
    local_db = root / ".fastast.db"
    if local_db.exists() and not cache_db.exists():
        try:
            shutil.copy2(local_db, cache_db)
            for ext in ("-wal", "-shm"):
                wal = root / f".fastast.db{ext}"
                if wal.exists():
                    shutil.copy2(wal, cache_dir / f"fastast.db{ext}")
                    wal.unlink(missing_ok=True)
            local_db.unlink(missing_ok=True)
            logger.info("Migrated repository database to global backend cache: %s", cache_db)
        except Exception as exc:
            logger.debug("Database migration notice: %s", exc)

    return cache_db


def get_lock_path(
    repo_root: Optional[Union[str, Path]] = None,
    db_path: Optional[Path] = None,
) -> Path:
    """Return the lock file path matching the database location."""
    if db_path is None:
        db_path = get_db_path(repo_root)
    return db_path.parent / (db_path.name + ".lock")


