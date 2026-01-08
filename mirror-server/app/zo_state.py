# mirror-server/zo_state.py

from dataclasses import dataclass, asdict
from threading import Lock
from typing import Optional, Literal
import time


ZoMode = Literal["idle", "listening", "thinking", "speaking"]


@dataclass
class ZoState:
  mode: ZoMode = "idle"
  last_user: Optional[str] = None
  last_zo: Optional[str] = None
  updated_at: float = 0.0  # unix timestamp


_state = ZoState()
_lock = Lock()


def set_state(mode: ZoMode,
              last_user: Optional[str] = None,
              last_zo: Optional[str] = None) -> None:
  """Update Zo's state (thread-safe)."""
  global _state
  with _lock:
    if last_user is not None:
      _state.last_user = last_user
    if last_zo is not None:
      _state.last_zo = last_zo
    _state.mode = mode
    _state.updated_at = time.time()


def get_state() -> dict:
  """Return a dict suitable for JSON response."""
  with _lock:
    return asdict(_state)

