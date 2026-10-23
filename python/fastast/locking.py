"""Inter-process repository locking and concurrency protection for FastAST."""

import json
import os
import socket
import time
from pathlib import Path
from typing import Any, Dict, Optional, Union

from fastast.config import get_logger

logger = get_logger("fastast.locking")


class RepositoryLockedError(RuntimeError):
    """Raised when repository lock cannot be acquired within timeout."""
    def __init__(self, message: str, pid: Optional[int] = None, lock_path: Optional[Path] = None):
        super().__init__(message)
        self.pid = pid
        self.lock_path = lock_path


class RepositoryLock:
    """Inter-process mutual exclusion lock using atomic file semantics and PID checking.

    Prevents simultaneous index writes, corrupted database states, and racing
    background workers across CLI, MCP, and daemon sessions.
    """

    def __init__(
        self,
        repo_root: Union[str, Path],
        lock_name: str = ".fastast.lock",
        timeout: float = 30.0,
        stale_timeout: float = 600.0,  # 10 minutes
        poll_interval: float = 0.1,
    ):
        self.repo_root = Path(repo_root).resolve()
        self.lock_path = self.repo_root / lock_name
        self.timeout = max(0.1, timeout)
        self.stale_timeout = max(1.0, stale_timeout)
        self.poll_interval = poll_interval
        self._is_locked = False
        self._lock_token: Optional[str] = None

    @property
    def is_locked(self) -> bool:
        """Check whether lock is currently held by this instance."""
        return self._is_locked

    def _is_pid_alive(self, pid: int) -> bool:
        """Check if process with given PID is currently active."""
        if pid <= 0:
            return False
        try:
            os.kill(pid, 0)
            return True
        except ProcessLookupError:
            return False
        except PermissionError:
            # Process exists but belongs to another user
            return True
        except Exception:
            return False

    def _read_lock_info(self) -> Optional[Dict[str, Any]]:
        """Read and parse lock file metadata."""
        if not self.lock_path.exists():
            return None
        try:
            with open(self.lock_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as exc:
            logger.debug(f"Unable to read lock file {self.lock_path}: {exc}")

    def _try_break_stale_lock(self, info: Optional[Dict[str, Any]]) -> bool:
        """Attempt to remove lock if the owner process is confirmed dead or expired."""
        if not self.lock_path.exists():
            return True

        now = time.time()
        is_stale = False
        reason = ""

        if info is None:
            # Corrupted lock file
            is_stale = True
            reason = "corrupted lock metadata"
        else:
            lock_pid = info.get("pid")
            created_at = info.get("created_at", 0.0)
            age = now - created_at

            if lock_pid and not self._is_pid_alive(lock_pid):
                is_stale = True
                reason = f"owner process PID {lock_pid} is no longer running"
            elif age > self.stale_timeout:
                is_stale = True
                reason = f"lock expired (age: {age:.1f}s > {self.stale_timeout:.1f}s)"

        if is_stale:
            try:
                logger.warning(
                    f"Reclaiming stale repository lock at {self.lock_path}: {reason}"
                )
                self.lock_path.unlink(missing_ok=True)
                return True
            except Exception as exc:
                logger.error(f"Failed to remove stale lock {self.lock_path}: {exc}")
                return False

        return False

    def acquire(self, blocking: bool = True) -> bool:
        """Acquire repository lock atomically.

        Args:
            blocking: If True, waits up to timeout seconds. If False, returns immediately.

        Returns:
            True if lock was acquired, False if non-blocking and lock was unavailable.

        Raises:
            RepositoryLockedError: If blocking is True and timeout expires.
        """
        start_time = time.perf_counter()
        my_pid = os.getpid()
        hostname = socket.gethostname()

        max_attempts = max(100, int(self.timeout / max(self.poll_interval, 0.01)) + 50)
        attempts = 0

        while attempts < max_attempts:
            attempts += 1
            try:
                # Ensure directory exists
                self.repo_root.mkdir(parents=True, exist_ok=True)

                # Open exclusively
                token = f"{my_pid}_{time.time()}"
                payload = {
                    "pid": my_pid,
                    "hostname": hostname,
                    "created_at": time.time(),
                    "token": token,
                }
                with open(self.lock_path, "x", encoding="utf-8") as f:
                    json.dump(payload, f)

                self._is_locked = True
                self._lock_token = token
                return True

            except FileExistsError as exc:
                logger.debug(f"Lock contention encountered at {self.lock_path}: {exc}")

            # Lock exists: inspect status
            info = self._read_lock_info()
            if self._try_break_stale_lock(info):
                # Stale lock was removed, retry immediately
                continue

            if not blocking:
                return False

            elapsed = time.perf_counter() - start_time
            if elapsed >= self.timeout:
                owner_pid = info.get("pid") if info else "unknown"
                raise RepositoryLockedError(
                    f"Repository '{self.repo_root}' is currently locked by PID {owner_pid} "
                    f"(active for {elapsed:.1f}s). Could not acquire lock within {self.timeout}s.",
                    pid=info.get("pid") if info else None,
                    lock_path=self.lock_path,
                )

            time.sleep(self.poll_interval)

        # Exceeded max attempts
        info = self._read_lock_info()
        owner_pid = info.get("pid") if info else "unknown"
        raise RepositoryLockedError(
            f"Repository '{self.repo_root}' is currently locked by PID {owner_pid}. "
            f"Exceeded maximum acquisition attempts ({max_attempts}).",
            pid=info.get("pid") if info else None,
            lock_path=self.lock_path,
        )

    def release(self) -> None:
        """Release repository lock safely."""
        if not self._is_locked:
            return

        try:
            info = self._read_lock_info()
            # Only remove if the lock still belongs to our token/PID
            if info and info.get("pid") == os.getpid():
                if not self._lock_token or info.get("token") == self._lock_token:
                    self.lock_path.unlink(missing_ok=True)
            elif not info and self.lock_path.exists():
                self.lock_path.unlink(missing_ok=True)
        except Exception as exc:
            logger.warning(f"Error releasing lock {self.lock_path}: {exc}")
        finally:
            self._is_locked = False
            self._lock_token = None

    def __enter__(self) -> "RepositoryLock":
        self.acquire(blocking=True)
        return self

    def __exit__(self, exc_type, exc_val, exc_tb) -> None:
        self.release()

