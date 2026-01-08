# mirror-server/app/actions.py
from __future__ import annotations

from typing import Dict, Any

from .config_store import load_config, save_config
from .models import MirrorConfig
from .widget_store import widget_state
from .os_modes import apply_mode


def _save_cfg_dict_patch(patch: Dict[str, Any]) -> None:
    """
    Safely patch config by dumping -> editing dict -> rehydrating MirrorConfig.
    """
    cfg = load_config()
    data = cfg.model_dump()

    for k, v in patch.items():
        if isinstance(v, dict) and isinstance(data.get(k), dict):
            data[k] = {**(data.get(k, {}) or {}), **v}
        else:
            data[k] = v

    save_config(MirrorConfig(**data))


def execute_action(action_type: str, payload: Dict[str, Any]) -> None:
    # ---------------- SPEAK ----------------
    if action_type == "speak":
        text = payload.get("text", "")
        print(f"[AGENT SPEAK] {text}")
        return

    # ---------------- UPDATE_WIDGET (ephemeral UI data) ----------------
    if action_type == "update_widget":
        widget = payload.get("widget")
        data = payload.get("data", {})
        if widget:
            widget_state[widget] = data
            print(f"[AGENT UPDATE_WIDGET] {widget} -> {data}")
        return

    # ---------------- SET_THEME (persist) ----------------
    if action_type == "set_theme":
        theme = payload.get("theme")
        if not theme:
            return
        _save_cfg_dict_patch({"display": {"theme": theme}})
        print(f"[AGENT THEME] Switched theme to {theme}")
        return

    # ---------------- SET_MODE (persist via apply_mode) ----------------
    if action_type == "set_mode":
        mode = (payload.get("mode") or "default").strip().lower()
        apply_mode(mode)  # persists widgets + os_mode
        print(f"[AGENT MODE] switched to {mode}")
        return

    # ---------------- WIDGET VISIBILITY (persist config.widgets) ----------------
    if action_type == "set_widget_visibility":
        widget = (payload.get("widget") or "").strip()
        enabled = payload.get("enabled")
        if not widget or not isinstance(enabled, bool):
            return

        cfg = load_config()
        data = cfg.model_dump()
        widgets = dict(data.get("widgets") or {})
        widgets[widget] = enabled
        data["widgets"] = widgets

        save_config(MirrorConfig(**data))
        print(f"[AGENT WIDGET] {widget} -> {'ON' if enabled else 'OFF'}")
        return

    # Bulk widgets (your agent uses "set_many_widgets")
    if action_type in ("set_many_widgets", "set_widgets"):
        widgets_patch = payload.get("widgets")
        if not isinstance(widgets_patch, dict):
            return

        cfg = load_config()
        data = cfg.model_dump()
        widgets = dict(data.get("widgets") or {})

        for k, v in widgets_patch.items():
            if isinstance(v, bool):
                widgets[str(k)] = v

        data["widgets"] = widgets
        save_config(MirrorConfig(**data))
        print(f"[AGENT WIDGETS] bulk -> {widgets_patch}")
        return

    # ---------------- DISPLAY PATCHES ----------------
    # Your server currently registers set_font_style + set_accent_color
    if action_type == "set_font_style":
        font = payload.get("fontStyle")
        if not isinstance(font, str) or not font:
            return
        _save_cfg_dict_patch({"display": {"fontStyle": font}})
        print(f"[AGENT DISPLAY] fontStyle -> {font}")
        return

    if action_type == "set_accent_color":
        color = payload.get("accentColor")
        if not isinstance(color, str) or not color:
            return
        _save_cfg_dict_patch({"display": {"accentColor": color}})
        print(f"[AGENT DISPLAY] accentColor -> {color}")
        return

    # Generic display patch if you ever want it
    if action_type == "set_display":
        display_patch = payload.get("display")
        if not isinstance(display_patch, dict):
            return

        allowed = {
            "fontStyle",
            "accentColor",
            "showBorders",
            "cardStyle",
            "backgroundMode",
            "ambientIntensity",
            "layoutPreset",
            "voicePreset",
            "theme",
            "sleepMode",
        }
        cleaned = {k: v for k, v in display_patch.items() if k in allowed}
        if not cleaned:
            return

        _save_cfg_dict_patch({"display": cleaned})
        print(f"[AGENT DISPLAY] patch -> {cleaned}")
        return

    # ---------------- QUOTE CATEGORIES ----------------
    if action_type == "set_quote_categories":
        categories = payload.get("categories")
        if not isinstance(categories, list):
            return

        cfg = load_config()
        data = cfg.model_dump()
        data["quotesCategories"] = categories

        save_config(MirrorConfig(**data))
        print(f"[AGENT QUOTES] categories -> {categories}")
        return

    # ---------------- REFRESH QUOTE ----------------
    if action_type == "refresh_quote":
        from .services_quotes import fetch_random_quote

        cfg = load_config()
        data = cfg.model_dump()

        categories = data.get("quotesCategories", ["inspirational", "wisdom"])
        new_quote = fetch_random_quote(categories)

        if new_quote:
            data["currentQuote"] = new_quote
            save_config(MirrorConfig(**data))
            print(f"[AGENT QUOTES] refreshed quote")
        return

    print(f"[AGENT] Unknown action: {action_type} payload={payload}")
