import json
import os
from pathlib import Path
from .models import MirrorConfig

CONFIG_PATH = Path(__file__).with_name("config.json")
_config_cache = None

def load_config() -> MirrorConfig:
    if not CONFIG_PATH.exists():
        raise FileNotFoundError(f"No config.json at {CONFIG_PATH}")

    raw = json.loads(CONFIG_PATH.read_text())

    # If old files don’t have os_mode, default to "default"
    if "os_mode" not in raw:
        raw["os_mode"] = "default"

    return MirrorConfig(**raw)

def save_config(cfg: MirrorConfig) -> MirrorConfig:
    global _config_cache
    # Pydantic → dict → json
    data = cfg.model_dump()
    CONFIG_PATH.write_text(json.dumps(data, indent=2))
    _config_cache = cfg  # Update cache
    return cfg

def get_api_key(key_name: str) -> str:
    """
    Get API key from config first, then fall back to environment variable.

    Args:
        key_name: The name of the API key (e.g., "OPENAI_API_KEY")

    Returns:
        The API key value or empty string if not found
    """
    global _config_cache

    # Try to get from config first
    if _config_cache is None:
        try:
            _config_cache = load_config()
        except:
            pass

    if _config_cache and _config_cache.apiKeys and key_name in _config_cache.apiKeys:
        key = _config_cache.apiKeys[key_name]
        if key:  # Not empty string
            return key

    # Fall back to environment variable
    return os.getenv(key_name, "")
