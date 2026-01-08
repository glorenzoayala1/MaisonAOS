# mirror-server/app/os_modes.py

from typing import Literal
from .config_store import load_config, save_config
from .models import MirrorConfig

OSMode = Literal["default", "focus", "market"]


def apply_mode(mode: OSMode) -> MirrorConfig:
    """
    Change the mirror config to match a MaisonOS mode and persist it.

    - default: leave widgets as they are (just update os_mode)
    - focus:   only Clock + Today
    - market:  Clock + Today + Stocks + News
    """
    if mode not in ("default", "focus", "market"):
        raise ValueError(f"Unsupported os_mode: {mode}")

    cfg = load_config()
    data = cfg.model_dump()

    widgets = data.get("widgets", {}).copy()

    if mode == "focus":
        widgets.update(
            {
                "clock": True,
                "today": True,
                "weather": False,
                "surf": False,
                "news": False,
                "stocks": False,
            }
        )
    elif mode == "market":
        widgets.update(
            {
                "clock": True,
                "today": True,
                "weather": True,
                "surf": False,
                "news": True,
                "stocks": True,
            }
        )
    else:  # default
        # leave widgets as they are – just tag the mode
        pass

    data["widgets"] = widgets
    data["os_mode"] = mode

    new_cfg = MirrorConfig(**data)
    return save_config(new_cfg)


def get_mode() -> OSMode:
    cfg = load_config()
    return (cfg.os_mode or "default")  # type: ignore[return-value]
