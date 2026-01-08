import json
from pathlib import Path
from .models import MirrorConfig

CONFIG_PATH = Path(__file__).with_name("config.json")

def load_config() -> MirrorConfig:
    if not CONFIG_PATH.exists():
        raise FileNotFoundError(f"No config.json at {CONFIG_PATH}")

    raw = json.loads(CONFIG_PATH.read_text())

    # If old files don’t have os_mode, default to "default"
    if "os_mode" not in raw:
        raw["os_mode"] = "default"

    return MirrorConfig(**raw)

def save_config(cfg: MirrorConfig) -> MirrorConfig:
    # Pydantic → dict → json
    data = cfg.model_dump()
    CONFIG_PATH.write_text(json.dumps(data, indent=2))
    return cfg
