from dataclasses import dataclass, field
from typing import Optional, Dict, Any
import time


@dataclass
class AgentState:
    last_wake_time: Optional[float] = None
    last_user_utterance: Optional[str] = None
    last_response: Optional[str] = None
    context: Dict[str, Any] = field(default_factory=dict)
    os_mode: str = "default"  # "default" | "focus" | "market" | ...


# Single shared instance
state = AgentState()


# ---- OS mode helpers ----

def set_mode(mode: str) -> None:
    """Set the current MaisonOS mode."""
    state.os_mode = mode


def get_mode() -> str:
    """Get the current MaisonOS mode."""
    return state.os_mode


# ---- Interaction helpers ----

def mark_wake() -> None:
    """Record the last time Zo was woken up."""
    state.last_wake_time = time.time()


def update_user_utterance(text: str) -> None:
    """Store the last thing the user said."""
    state.last_user_utterance = text


def update_response(text: str) -> None:
    """Store the last response Zo generated."""
    state.last_response = text
