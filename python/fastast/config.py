"""Configuration, environment overrides, path validation, and security boundaries for FastAST."""

from dataclasses import asdict, dataclass
import json
import logging
import os
from pathlib import Path
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
        except ValueError:
            pass
    if "FASTAST_LOG_LEVEL" in os.environ:
        config.log_level = os.environ["FASTAST_LOG_LEVEL"].upper()
    if "FASTAST_LOCK_TIMEOUT" in os.environ:
        try:
            config.lock_timeout_seconds = float(os.environ["FASTAST_LOCK_TIMEOUT"])
        except ValueError:
            pass
    if "FASTAST_WATCH_DEBOUNCE_MS" in os.environ:
        try:
            config.watch_debounce_ms = int(os.environ["FASTAST_WATCH_DEBOUNCE_MS"])
        except ValueError:
            pass
    if "FASTAST_MAX_FILE_SIZE" in os.environ:
        try:
            config.max_file_size_bytes = int(os.environ["FASTAST_MAX_FILE_SIZE"])
        except ValueError:
            pass
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
    except ValueError:
        raise PathTraversalError(
            f"Access denied: Path '{target_path}' resolves outside allowed project root '{root}'."
        )

    if must_exist and not resolved.exists():
        raise FileNotFoundError(f"Path does not exist within project root: '{target_path}'")

    return resolved

