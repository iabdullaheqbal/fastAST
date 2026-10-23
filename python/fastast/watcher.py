"""Background filesystem watcher and debounced re-indexer for FastAST."""

import logging
import os
import threading
import time
from pathlib import Path
from typing import Any, Callable, Dict, List, Optional, Set, Tuple, Union

from fastast.config import get_logger, load_config
from fastast.discovery import discover_files
from fastast.indexer import RepositoryIndexer
from fastast.locking import RepositoryLock, RepositoryLockedError

logger = get_logger("fastast.watcher")


class RepositoryWatcher:
    """Production-grade filesystem watcher with debouncing and safe inter-process locking.

    Monitors admitted repository files for changes, creations, and deletions.
    Debounces rapid bursts (e.g. IDE multi-file saves, git branch checkouts)
    before triggering incremental AST indexing.
    """

    def __init__(
        self,
        repo_path: Union[str, Path] = ".",
        db_name: str = ".fastast.db",
        poll_interval: float = 0.5,
        debounce_ms: Optional[int] = None,
        languages: Optional[Set[str]] = None,
        extra_ignores: Optional[List[str]] = None,
        categories: Optional[Set[str]] = None,
        on_index_complete: Optional[Callable[[Dict[str, Any]], None]] = None,
        on_change_detected: Optional[Callable[[Set[str], Set[str], Set[str]], None]] = None,
        on_error: Optional[Callable[[Exception], None]] = None,
    ):
        self.repo_path = Path(repo_path).resolve()
        self.config = load_config(self.repo_path)
        self.db_path = (self.repo_path / db_name).resolve()
        self.poll_interval = max(0.1, poll_interval)

        d_ms = debounce_ms if debounce_ms is not None else self.config.watch_debounce_ms
        self.debounce_seconds = max(0.05, d_ms / 1000.0)

        self.languages = languages
        self.extra_ignores = extra_ignores
        self.categories = categories

        self.on_index_complete = on_index_complete
        self.on_change_detected = on_change_detected
        self.on_error = on_error

        self.indexer = RepositoryIndexer(
            repo_path=self.repo_path,
            db_name=db_name,
            languages=self.languages,
            extra_ignores=self.extra_ignores,
            categories=self.categories,
            lock=True,
            lock_timeout=self.config.lock_timeout_seconds,
        )

        self._file_state: Dict[str, Tuple[float, int]] = {}
        self._stop_event = threading.Event()
        self._thread: Optional[threading.Thread] = None
        self._lock = threading.Lock()
        self._last_index_time: float = 0.0

    @property
    def is_running(self) -> bool:
        """Check whether background watcher thread is actively running."""
        return self._thread is not None and self._thread.is_alive()

    def scan_file_state(self) -> Dict[str, Tuple[float, int]]:
        """Scan current admitted repository files and return map of rel_path -> (mtime, size)."""
        extra = list(self.extra_ignores or [])
        db_name = self.db_path.name
        extra.extend([db_name, f"{db_name}*", "*.db", "*.db-wal", "*.db-shm"])

        records = discover_files(
            self.repo_path,
            extra_ignores=extra,
            languages=self.languages,
            categories=self.categories,
        )

        state: Dict[str, Tuple[float, int]] = {}
        for r in records:
            p = self.repo_path / r.path
            try:
                st = p.stat()
                state[r.path] = (st.st_mtime, st.st_size)
            except (OSError, FileNotFoundError):
                continue
        return state

    def compute_changes(
        self, current_state: Dict[str, Tuple[float, int]]
    ) -> Tuple[Set[str], Set[str], Set[str]]:
        """Compare current file state with cached state.

        Returns:
            Tuple of (added_paths, modified_paths, deleted_paths)
        """
        old_paths = set(self._file_state.keys())
        new_paths = set(current_state.keys())

        added = new_paths - old_paths
        deleted = old_paths - new_paths
        modified: Set[str] = set()

        for path in new_paths & old_paths:
            old_mtime, old_size = self._file_state[path]
            new_mtime, new_size = current_state[path]
            if abs(new_mtime - old_mtime) > 0.001 or new_size != old_size:
                modified.add(path)

        return added, modified, deleted

    def run_once(self, force: bool = False) -> Optional[Dict[str, Any]]:
        """Perform a single scan-and-index pass.

        If force is True, indexes regardless of changes. Otherwise only indexes
        if file additions, modifications, or deletions are detected.
        """
        with self._lock:
            current_state = self.scan_file_state()
            added, modified, deleted = self.compute_changes(current_state)
            has_changes = bool(added or modified or deleted)

            if not has_changes and not force and self._file_state:
                return None

            if has_changes and self.on_change_detected:
                try:
                    self.on_change_detected(added, modified, deleted)
                except Exception as exc:
                    logger.warning(f"Error in on_change_detected callback: {exc}")

            try:
                stats = self.indexer.run(force_reindex=force)
                self._file_state = current_state
                self._last_index_time = time.time()

                if self.on_index_complete:
                    try:
                        self.on_index_complete(stats)
                    except Exception as cb_err:
                        logger.warning(f"Error in on_index_complete callback: {cb_err}")

                return stats
            except RepositoryLockedError as lock_err:
                logger.debug(f"Repository lock busy during watcher cycle: {lock_err}")
                if self.on_error:
                    self.on_error(lock_err)
            except Exception as exc:
                logger.error(f"Error during watcher index cycle: {exc}")
                if self.on_error:
                    self.on_error(exc)

    def start(self) -> None:
        """Start background monitoring thread."""
        with self._lock:
            if self.is_running:
                return
            self._stop_event.clear()
            # Prime initial state
            self._file_state = self.scan_file_state()
            self._thread = threading.Thread(
                target=self._watch_loop,
                daemon=True,
                name="fastast-watcher",
            )
            self._thread.start()
            logger.info(f"FastAST watcher started for {self.repo_path} (debounce: {self.debounce_seconds*1000:.0f}ms)")

    def stop(self, timeout: float = 5.0) -> bool:
        """Signal watcher to stop and wait for thread termination."""
        self._stop_event.set()
        if self._thread and self._thread.is_alive():
            self._thread.join(timeout=timeout)
            is_dead = not self._thread.is_alive()
            logger.info("FastAST watcher stopped.")
            return is_dead
        return True

    def _watch_loop(self) -> None:
        """Main background loop with debouncing."""
        while not self._stop_event.is_set():
            self._stop_event.wait(self.poll_interval)
            if self._stop_event.is_set():
                break

            try:
                current_state = self.scan_file_state()
                added, modified, deleted = self.compute_changes(current_state)

                if added or modified or deleted:
                    # Debouncing quiet period: wait until changes settle
                    change_time = time.time()
                    while not self._stop_event.is_set():
                        remaining = self.debounce_seconds - (time.time() - change_time)
                        if remaining <= 0:
                            break
                        self._stop_event.wait(min(0.05, remaining))
                        if self._stop_event.is_set():
                            return

                        # Check for subsequent rapid changes during debounce window
                        check_state = self.scan_file_state()
                        a2, m2, d2 = self.compute_changes(check_state)
                        if a2 != added or m2 != modified or d2 != deleted:
                            added, modified, deleted = a2, m2, d2
                            change_time = time.time()

                    # Trigger debounced re-index
                    self.run_once()

            except Exception as loop_err:
                logger.warning(f"Unexpected error in watch loop: {loop_err}")
                if self.on_error:
                    try:
                        self.on_error(loop_err)
                    except Exception as exc:
                        logger.warning(f"Error in on_error callback: {exc}")

    def run_forever(self) -> None:
        """Run blocking foreground watch loop with graceful keyboard interrupt handling."""
        self.start()
        try:
            while not self._stop_event.is_set():
                time.sleep(0.5)
        except KeyboardInterrupt:
            logger.info("Received interrupt signal. Stopping watcher...")
        finally:
            self.stop()

