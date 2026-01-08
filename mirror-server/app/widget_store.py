# mirror-server/app/widget_store.py

from typing import Dict, Any

# simple in-memory dict the backend + UI can share
widget_state: Dict[str, Any] = {}

