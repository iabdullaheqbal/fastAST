"""File Admission Layer (Repo-level pruning) for FastAST.

Handles repository file discovery, multi-layer ignore rules (.gitignore, .fastastignore,
hardcoded), content hashing (xxHash3 / BLAKE2b), language detection, and file classification.
"""

import hashlib
import os
import re
from pathlib import Path
from typing import Any, Dict, List, Optional, Set, Tuple, Union

from fastast.model import FileCategory, FileRecord, FileStatus

# Try loading xxHash3 from xxhash package or native _core extension
try:
    import xxhash  # type: ignore

    def _hash_bytes(data: bytes) -> str:
        return xxhash.xxh3_64_hexdigest(data)

except ImportError:
    try:
        from fastast._core import compute_xxh3  # type: ignore

        def _hash_bytes(data: bytes) -> str:
            return compute_xxh3(data)

    except ImportError:

        def _hash_bytes(data: bytes) -> str:
            return hashlib.blake2b(data, digest_size=16).hexdigest()


def compute_content_hash(content: Union[str, bytes]) -> str:
    """Compute fast xxHash3 or BLAKE2b hexadecimal hash of file content."""
    if isinstance(content, str):
        data = content.encode("utf-8", errors="replace")
    else:
        data = content
    return _hash_bytes(data)


def is_binary_file(path: Path, sample_bytes: Optional[bytes] = None) -> bool:
    """Determine whether a file is binary by sniffing for null bytes in the first 1024 bytes."""
    if sample_bytes is not None:
        check = sample_bytes[:1024]
        return b"\x00" in check
    try:
        with open(path, "rb") as f:
            chunk = f.read(1024)
            return b"\x00" in chunk
    except Exception:
        return True


# Supported extensions mapped to canonical language identifiers
SUPPORTED_EXTENSIONS: Dict[str, str] = {
    # Python
    "py": "python",
    "pyi": "python",
    "pyw": "python",
    # JavaScript
    "js": "javascript",
    "jsx": "javascript",
    "mjs": "javascript",
    "cjs": "javascript",
    # TypeScript
    "ts": "typescript",
    "tsx": "typescript",
    "mts": "typescript",
    "cts": "typescript",
    # Java
    "java": "java",
    # Rust
    "rs": "rust",
    # HTML
    "html": "html",
    "htm": "html",
    "xhtml": "html",
    # CSS
    "css": "css",
    "scss": "css",
    "sass": "css",
    "less": "css",
    # JSON
    "json": "json",
    "jsonc": "json",
    "json5": "json",
    # TOML
    "toml": "toml",
    # Markdown & Docs
    "md": "markdown",
    "markdown": "markdown",
    "rst": "rst",
    # Shell
    "sh": "shell",
    "bash": "shell",
    "zsh": "shell",
    # YAML
    "yaml": "yaml",
    "yml": "yaml",
    # SQL
    "sql": "sql",
    # C / C++
    "c": "c",
    "h": "c",
    "cpp": "cpp",
    "hpp": "cpp",
    "cc": "cpp",
    "cxx": "cpp",
    # Go
    "go": "go",
}

# Hardcoded directory names that are always ignored for safety and performance
DEFAULT_HARDCODED_IGNORES: Set[str] = {
    ".git",
    ".venv",
    "venv",
    "env",
    ".env",
    "__pycache__",
    "target",
    "node_modules",
    "build",
    "dist",
    "wheels",
    "vendor",
    ".cache",
    ".pytest_cache",
    ".mypy_cache",
    ".ruff_cache",
    ".idea",
    ".vscode",
    ".gemini",
    ".gradle",
    ".cargo",
    ".next",
    ".nuxt",
    ".turbo",
    "bin",
    "obj",
    "out",
    "coverage",
    ".svn",
    ".hg",
}

# Binary and non-code file extensions to ignore by default
IGNORED_EXTENSIONS: Set[str] = {
    "png", "jpg", "jpeg", "gif", "webp", "ico", "svg",
    "mp3", "mp4", "wav", "avi", "mov", "mkv",
    "zip", "tar", "gz", "bz2", "7z", "rar", "xz",
    "exe", "dll", "so", "dylib", "bin", "o", "a", "obj",
    "pyc", "pyo", "pyd", "class",
    "woff", "woff2", "ttf", "eot", "otf",
    "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx",
}


def detect_file_language(path: Path, sample_content: Optional[str] = None) -> Optional[str]:
    """Detect canonical programming language from extension or content heuristics."""
    ext = path.suffix.lower().lstrip(".")
    if ext in SUPPORTED_EXTENSIONS:
        return SUPPORTED_EXTENSIONS[ext]

    # Content heuristics (shebang or doctype)
    name = path.name.lower()
    if name == "dockerfile" or name.startswith("dockerfile."):
        return "dockerfile"
    if name == "makefile":
        return "makefile"

    if sample_content:
        first_line = sample_content.split("\n", 1)[0].strip()
        if first_line.startswith("#!"):
            if "python" in first_line:
                return "python"
            if "node" in first_line or "deno" in first_line:
                return "javascript"
            if "bash" in first_line or "sh" in first_line or "zsh" in first_line:
                return "shell"
            if "perl" in first_line:
                return "perl"
            if "ruby" in first_line:
                return "ruby"
        if "<!doctype html" in first_line.lower() or "<html" in first_line.lower():
            return "html"
        if "<?xml" in first_line.lower():
            return "xml"

    return None


def classify_file(path: Path, sample_content: Optional[str] = None) -> str:
    """Classify a file into one of the 7 standard categories:
    source, test, config, docs, infra, generated, other.
    """
    path_str = str(path).replace("\\", "/")
    name = path.name.lower()
    ext = path.suffix.lower().lstrip(".")
    parts = [p.lower() for p in path.parts]
    dir_parts = set(parts[:-1])

    # 1. Generated checks
    if (
        bool(dir_parts & {"generated", "gen", "dist", "build", "out"})
        or name.endswith(".min.js")
        or name.endswith(".min.css")
        or name.endswith("_pb2.py")
        or name.endswith(".pb.go")
        or name.endswith(".bundle.js")
        or name.endswith(".lock")
        or name in {"cargo.lock", "package-lock.json", "uv.lock", "yarn.lock", "pnpm-lock.yaml"}
    ):
        return FileCategory.GENERATED.value

    if sample_content:
        first_lines = "\n".join(sample_content.splitlines()[:5]).lower()
        if (
            "@generated" in first_lines
            or "do not edit" in first_lines
            or "autogenerated" in first_lines
            or "generated by" in first_lines
        ):
            return FileCategory.GENERATED.value

    # 2. Test checks
    if (
        name.startswith("test_")
        or name.endswith("_test.py")
        or name.endswith("_test.rs")
        or name.endswith(".test.ts")
        or name.endswith(".test.js")
        or name.endswith(".spec.ts")
        or name.endswith(".spec.js")
        or (name.endswith("test.java") and len(name) > 9)
        or name.startswith("test")
        or bool(dir_parts & {"test", "tests", "__tests__", "spec", "specs", "testing"})
    ):
        return FileCategory.TEST.value

    # 3. Infra checks
    if (
        name.startswith("dockerfile")
        or name.startswith("docker-compose")
        or name in {"makefile", "procfile", "vagrantfile", "containerfile"}
        or ext in {"tf", "hcl"}
        or bool(dir_parts & {".github", ".gitlab", "k8s", "kubernetes", "terraform", "ci", "deploy", "helm"})
    ):
        return FileCategory.INFRA.value

    # 4. Docs checks
    if (
        ext in {"md", "markdown", "rst", "adoc", "txt"}
        or name.startswith("readme")
        or name.startswith("license")
        or name.startswith("changelog")
        or name.startswith("contributing")
        or name.startswith("architecture")
        or name.startswith("spec")
        or bool(dir_parts & {"docs", "doc", "documentation"})
    ):
        return FileCategory.DOCS.value

    # 5. Config checks
    if (
        ext in {"json", "toml", "yaml", "yml", "ini", "cfg", "conf"}
        or "config" in name
        or name.startswith(".env")
        or name in {
            "cargo.toml",
            "pyproject.toml",
            "package.json",
            "tsconfig.json",
            ".editorconfig",
            ".gitignore",
            ".fastastignore",
        }
    ):
        return FileCategory.CONFIG.value

    # 6. Source default for recognized languages
    lang = detect_file_language(path, sample_content)
    if lang is not None and lang not in {"markdown", "rst"}:
        return FileCategory.SOURCE.value

    return FileCategory.OTHER.value


class GitIgnoreRule:
    """Represents a compiled glob rule from .gitignore or .fastastignore."""

    def __init__(self, raw_pattern: str, base_dir: Path):
        self.raw_pattern = raw_pattern.strip()
        self.base_dir = base_dir
        self.is_negation = self.raw_pattern.startswith("!")

        clean = self.raw_pattern[1:] if self.is_negation else self.raw_pattern
        self.dir_only = clean.endswith("/")
        if self.dir_only:
            clean = clean[:-1]

        self.anchored = clean.startswith("/")
        if self.anchored:
            clean = clean[1:]
        elif "/" in clean:
            self.anchored = True

        self.pattern = clean
        self.regex = self._compile_regex(clean, self.anchored)

    @staticmethod
    def _compile_regex(pattern: str, anchored: bool) -> re.Pattern:
        i, n = 0, len(pattern)
        res: List[str] = []
        while i < n:
            c = pattern[i]
            i += 1
            if c == "*":
                if i < n and pattern[i] == "*":
                    i += 1
                    if i < n and pattern[i] == "/":
                        i += 1
                        res.append("(?:.+/)?")
                    else:
                        res.append(".*")
                else:
                    res.append("[^/]*")
            elif c == "?":
                res.append("[^/]")
            elif c in r"\[]{}().+^$|":
                res.append(re.escape(c))
            else:
                res.append(c)

        pattern_regex = "".join(res)
        if anchored:
            full = f"^{pattern_regex}(?:/.*)?$"
        else:
            full = f"(?:^|.*/){pattern_regex}(?:/.*)?$"

        return re.compile(full)

    def matches(self, rel_path_str: str, is_dir: bool = False) -> bool:
        """Check whether this rule matches the relative path string."""
        if self.dir_only and not is_dir:
            return False
        return bool(self.regex.search(rel_path_str))


class MultiLayerIgnore:
    """Evaluates ignore rules across 4 prioritized layers:
    1. Hardcoded default system/build/cache directories
    2. .gitignore rules
    3. .fastastignore custom rules
    4. Optional extra ignore patterns passed at runtime
    """

    def __init__(
        self,
        root_dir: Path,
        extra_ignores: Optional[List[str]] = None,
        respect_gitignore: bool = True,
        respect_fastastignore: bool = True,
    ):
        self.root_dir = root_dir.resolve()
        self.hardcoded_dirs = DEFAULT_HARDCODED_IGNORES
        self.ignored_extensions = IGNORED_EXTENSIONS

        self.gitignore_rules: List[GitIgnoreRule] = []
        self.fastastignore_rules: List[GitIgnoreRule] = []
        self.extra_rules: List[GitIgnoreRule] = []

        if respect_gitignore:
            self.gitignore_rules = self._load_ignore_file(self.root_dir / ".gitignore")

        if respect_fastastignore:
            self.fastastignore_rules = self._load_ignore_file(self.root_dir / ".fastastignore")

        if extra_ignores:
            for pat in extra_ignores:
                if pat.strip() and not pat.strip().startswith("#"):
                    self.extra_rules.append(GitIgnoreRule(pat, self.root_dir))

    def _load_ignore_file(self, file_path: Path) -> List[GitIgnoreRule]:
        rules: List[GitIgnoreRule] = []
        if not file_path.exists() or not file_path.is_file():
            return rules

        try:
            with open(file_path, "r", encoding="utf-8", errors="replace") as f:
                for line in f:
                    stripped = line.strip()
                    if stripped and not stripped.startswith("#"):
                        rules.append(GitIgnoreRule(stripped, self.root_dir))
        except Exception:
            pass

        return rules

    def is_ignored(self, path: Path, is_dir: bool = False) -> bool:
        """Evaluate if path should be ignored according to priority rules."""
        # Fast path: Check directory components against hardcoded ignores
        try:
            rel = path.resolve().relative_to(self.root_dir)
            rel_str = str(rel).replace("\\", "/")
        except ValueError:
            rel_str = path.name

        parts = rel_str.split("/")
        for part in parts[:-1] if not is_dir else parts:
            if part in self.hardcoded_dirs or part.endswith(".egg-info"):
                return True

        if not is_dir:
            ext = path.suffix.lower().lstrip(".")
            if ext in self.ignored_extensions:
                return True

        ignored = False

        # Layer 2: .gitignore rules in order
        for rule in self.gitignore_rules:
            if rule.matches(rel_str, is_dir=is_dir):
                ignored = not rule.is_negation

        # Layer 3: .fastastignore rules in order
        for rule in self.fastastignore_rules:
            if rule.matches(rel_str, is_dir=is_dir):
                ignored = not rule.is_negation

        # Layer 4: Extra user-provided rules
        for rule in self.extra_rules:
            if rule.matches(rel_str, is_dir=is_dir):
                ignored = not rule.is_negation

        return ignored


class DirectoryScanner:
    """High-throughput recursive repository walker for file admission."""

    def __init__(
        self,
        root_dir: Union[Path, str],
        extra_ignores: Optional[List[str]] = None,
        languages: Optional[Set[str]] = None,
        categories: Optional[Set[str]] = None,
        skip_symlinks: bool = True,
        include_generated: bool = False,
    ):
        self.root_dir = Path(root_dir).resolve()
        self.skip_symlinks = skip_symlinks
        self.languages = {l.lower() for l in languages} if languages else None
        self.categories = {c.lower() for c in categories} if categories else None
        self.include_generated = include_generated
        self.ignore_layer = MultiLayerIgnore(self.root_dir, extra_ignores=extra_ignores)

    def scan(self) -> List[FileRecord]:
        """Execute recursive scan of repository and return admitted FileRecord objects."""
        if not self.root_dir.exists():
            return []

        admitted_records: List[FileRecord] = []

        for root, dirs, files in os.walk(self.root_dir, followlinks=False):
            root_path = Path(root)

            # In-place directory pruning to avoid traversing ignored directory trees
            pruned_dirs: List[str] = []
            for d in dirs:
                dir_path = root_path / d
                if self.skip_symlinks and dir_path.is_symlink():
                    continue
                if self.ignore_layer.is_ignored(dir_path, is_dir=True):
                    continue
                pruned_dirs.append(d)

            dirs[:] = pruned_dirs

            for f in files:
                file_path = root_path / f
                if self.skip_symlinks and file_path.is_symlink():
                    continue

                if self.ignore_layer.is_ignored(file_path, is_dir=False):
                    continue

                # Read sample content for language detection and binary check
                try:
                    with open(file_path, "rb") as fp:
                        sample_bytes = fp.read(4096)
                except Exception:
                    continue

                if is_binary_file(file_path, sample_bytes):
                    continue

                sample_text = sample_bytes.decode("utf-8", errors="replace")
                language = detect_file_language(file_path, sample_text) or "other"
                category = classify_file(file_path, sample_text)

                if not self.include_generated and category == FileCategory.GENERATED.value:
                    continue

                if self.languages and language not in self.languages:
                    continue

                if self.categories and category not in self.categories:
                    continue

                # Full content read for hash and line count
                try:
                    full_text = file_path.read_text(encoding="utf-8", errors="replace")
                except Exception:
                    continue

                stat = file_path.stat()
                mtime = stat.st_mtime
                content_hash = compute_content_hash(full_text)
                total_lines = len(full_text.splitlines())
                # Lightweight whitespace token count approximation
                total_tokens = len(full_text.split())

                try:
                    rel_path = str(file_path.relative_to(self.root_dir)).replace("\\", "/")
                except ValueError:
                    rel_path = str(file_path).replace("\\", "/")

                record = FileRecord(
                    path=rel_path,
                    language=language,
                    hash=content_hash,
                    mtime=mtime,
                    status=FileStatus.UNCHANGED.value,
                    category=category,
                    total_lines=total_lines,
                    total_tokens=total_tokens,
                    has_syntax_error=False,
                )
                admitted_records.append(record)

        admitted_records.sort(key=lambda r: r.path)
        return admitted_records


def discover_files(
    root_dir: Union[Path, str] = ".",
    extra_ignores: Optional[List[str]] = None,
    languages: Optional[Set[str]] = None,
    categories: Optional[Set[str]] = None,
    include_generated: bool = False,
) -> List[FileRecord]:
    """Convenience function to discover and admit repository files."""
    scanner = DirectoryScanner(
        root_dir=root_dir,
        extra_ignores=extra_ignores,
        languages=languages,
        categories=categories,
        include_generated=include_generated,
    )
    return scanner.scan()
