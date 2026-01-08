from typing import Dict

# ... your existing code ...

def get_surf_for_location(location: str) -> Dict[str, float | str]:
    # existing implementation
    """
    Fetch current surf conditions for a location.
    """
    spot_name = f"{location} Beach"

    return {
        "spot": spot_name,
        "waveHeightFt": 3.5,
        "conditions": "Clean, light offshore",
        "wind": "4 mph NW",
        "symbol": "🌊",
    }


# ---- add this wrapper so main.py's import works ----
def get_surf(location: str) -> Dict[str, float | str]:
    """Backward-compatible wrapper used by main.py."""
    return get_surf_for_location(location)
