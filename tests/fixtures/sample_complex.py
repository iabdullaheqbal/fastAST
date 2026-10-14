"""Complex sample module for verifying FastAST syntax preservation and repair rules."""

import asyncio
from functools import lru_cache, wraps
from typing import Any, Callable, Dict, List, Optional, Union

MODULE_CONSTANT: int = 100

def retry(attempts: int = 3, backoff: float = 0.5):
    """Decorator factory for retrying async operations."""
    def decorator(fn: Callable) -> Callable:
        @wraps(fn)
        async def wrapper(*args: Any, **kwargs: Any) -> Any:
            for i in range(attempts):
                try:
                    return await fn(*args, **kwargs)
                except Exception:
                    if i == attempts - 1:
                        raise
                    await asyncio.sleep(backoff)
        return wrapper
    return decorator

@retry(
    attempts=5,
    backoff=1.0,
)
@lru_cache(maxsize=128)
async def fetch_remote_resource(
    endpoint_url: str,
    auth_headers: Dict[str, str],
    timeout_seconds: float = 30.0,
    retry_on_status: Optional[List[int]] = None,
) -> Dict[str, Any]:
    """Fetch data from a remote endpoint with retry logic and caching."""
    if retry_on_status is None:
        retry_on_status = [500, 502, 503, 504]
    await asyncio.sleep(0.01)
    return {"status": 200, "url": endpoint_url, "data": [1, 2, 3]}

class ConnectionManager:
    """Manages active network connections with nested helper classes."""

    class InternalState:
        """Tracks low-level socket state."""
        def __init__(self, socket_id: int):
            self.socket_id = socket_id
            self.active = True

        def terminate(self) -> None:
            self.active = False

    def __init__(self, host: str, port: int):
        self.host = host
        self.port = port
        self.state = self.InternalState(socket_id=1)

    @property
    def is_connected(self) -> bool:
        """Returns True if the connection is currently open."""
        return self.state.active

    async def open_connection(self) -> bool:
        """Opens a simulated socket connection."""
        try:
            await asyncio.sleep(0.05)
            self.state.active = True
            return True
        except ConnectionError:
            self.state.active = False
            return False

    def close_connection(self) -> None:
        """Closes the current socket connection."""
        self.state.terminate()

