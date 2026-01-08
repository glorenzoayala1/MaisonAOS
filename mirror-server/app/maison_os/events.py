from dataclasses import dataclass
from enum import Enum
from typing import Any, Dict
import time


class EventType(str, Enum):
    WAKE_WORD = "wake_word"
    USER_SPOKE = "user_spoke"
    SYSTEM_TICK = "system_tick"
    WIDGET_UPDATED = "widget_updated"
    HOME_STATE_CHANGED = "home_state_changed"


@dataclass
class Event:
    type: EventType
    payload: Dict[str, Any]
    timestamp: float = time.time()

    @classmethod
    def wake(cls, source: str = "mirror"):
        return cls(
            type=EventType.WAKE_WORD,
            payload={"source": source},
        )

    @classmethod
    def user_spoke(cls, text: str, source: str = "mirror"):
        return cls(
            type=EventType.USER_SPOKE,
            payload={"text": text, "source": source},
        )

    @classmethod
    def tick(cls):
        return cls(
            type=EventType.SYSTEM_TICK,
            payload={},
        )
