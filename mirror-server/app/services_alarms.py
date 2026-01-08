# mirror-server/app/services_alarms.py

from datetime import datetime
from typing import List, Optional
from .models import AlarmItem

# Track which alarms have already triggered today
_triggered_alarms = set()


def check_alarms(alarms: List[AlarmItem]) -> Optional[AlarmItem]:
    """
    Check if any alarm should trigger right now.
    Returns the first matching alarm, or None.

    An alarm triggers if:
    - It's enabled
    - Current time matches alarm time (within same minute)
    - Current day matches alarm's day filter (if specified)
    - It hasn't already triggered this minute
    """
    now = datetime.now()
    current_time = now.strftime("%H:%M")
    current_day = now.strftime("%a").lower()  # "mon", "tue", etc.
    current_minute_key = now.strftime("%Y-%m-%d %H:%M")

    for alarm in alarms:
        if not alarm.enabled:
            continue

        # Check if alarm time matches
        if alarm.time != current_time:
            continue

        # Check day filter (if specified)
        if alarm.days and len(alarm.days) > 0:
            if current_day not in alarm.days:
                continue

        # Check if already triggered this minute
        alarm_key = f"{alarm.id}_{current_minute_key}"
        if alarm_key in _triggered_alarms:
            continue

        # Mark as triggered
        _triggered_alarms.add(alarm_key)

        # Clean up old entries (keep last 100)
        if len(_triggered_alarms) > 100:
            _triggered_alarms.clear()

        return alarm

    return None


def get_alarm_greeting(alarm: AlarmItem, user_name: str = "there") -> str:
    """
    Generate a personalized alarm greeting.
    """
    now = datetime.now()
    hour = now.hour

    # Time-based greeting
    if hour < 12:
        time_greeting = "Good morning"
    elif hour < 18:
        time_greeting = "Good afternoon"
    else:
        time_greeting = "Good evening"

    # Include label if provided
    if alarm.label:
        return f"{time_greeting}, {user_name}. It's time for {alarm.label}."
    else:
        return f"{time_greeting}, {user_name}."
