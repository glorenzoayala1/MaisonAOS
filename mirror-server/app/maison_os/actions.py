# mirror-server/app/actions.py
from __future__ import annotations

from typing import Dict, Any

from ..config_store import load_config, save_config
from ..models import MirrorConfig
from ..widget_store import widget_state
from ..os_modes import apply_mode

ALLOWED_WIDGETS = {"clock", "weather", "today", "surf", "news", "stocks"}
ALLOWED_FONTS = {"serif", "sans"}          # must match client config.ts
ALLOWED_ACCENTS = {"white", "gold", "silver"}  # must match client config.ts

def _save_cfg_dict_patch(patch: Dict[str, Any]) -> None:
    cfg = load_config()
    data = cfg.model_dump()

    for k, v in patch.items():
        if isinstance(v, dict) and isinstance(data.get(k), dict):
            data[k] = {**data.get(k, {}), **v}
        else:
            data[k] = v

    save_config(MirrorConfig(**data))

def _set_widget_enabled(widget: str, enabled: bool) -> None:
    if widget not in ALLOWED_WIDGETS:
        return
    cfg = load_config()
    data = cfg.model_dump()
    widgets = dict(data.get("widgets") or {})
    widgets[widget] = bool(enabled)
    data["widgets"] = widgets
    save_config(MirrorConfig(**data))

def _bulk_widgets(patch: Dict[str, Any]) -> None:
    cfg = load_config()
    data = cfg.model_dump()
    widgets = dict(data.get("widgets") or {})
    for k, v in patch.items():
        if k in ALLOWED_WIDGETS and isinstance(v, bool):
            widgets[k] = v
    data["widgets"] = widgets
    save_config(MirrorConfig(**data))

def _patch_display(patch: Dict[str, Any]) -> None:
    allowed_keys = {
        "fontStyle",
        "accentColor",
        "showBorders",
        "cardStyle",
        "backgroundMode",
        "ambientIntensity",
        "layoutPreset",
        "voicePreset",
        "theme",
    }
    cleaned = {k: v for k, v in patch.items() if k in allowed_keys}
    if not cleaned:
        return

    # validate common fields
    if "fontStyle" in cleaned and cleaned["fontStyle"] not in ALLOWED_FONTS:
        cleaned.pop("fontStyle", None)
    if "accentColor" in cleaned and cleaned["accentColor"] not in ALLOWED_ACCENTS:
        cleaned.pop("accentColor", None)

    if cleaned:
        _save_cfg_dict_patch({"display": cleaned})

def _patch_layout(widget: str, layout_patch: Dict[str, Any]) -> None:
    if widget not in ALLOWED_WIDGETS:
        return

    allowed_layout_keys = {"position", "size", "offsetX", "offsetY"}
    cleaned = {k: v for k, v in layout_patch.items() if k in allowed_layout_keys}
    if not cleaned:
        return

    cfg = load_config()
    data = cfg.model_dump()
    layouts = dict(data.get("layouts") or {})
    current = dict(layouts.get(widget) or {})
    layouts[widget] = {**current, **cleaned}
    data["layouts"] = layouts
    save_config(MirrorConfig(**data))

def execute_action(action_type: str, payload: Dict[str, Any]) -> None:
    # ---------------- SPEAK ----------------
    if action_type == "speak":
        print(f"[AGENT SPEAK] {payload.get('text','')}")
        return

    # ---------------- UPDATE_WIDGET (ephemeral) ----------------
    if action_type == "update_widget":
        widget = payload.get("widget")
        data = payload.get("data", {})
        if widget:
            widget_state[widget] = data
            print(f"[AGENT UPDATE_WIDGET] {widget} -> {data}")
        return

    # ---------------- THEME ----------------
    if action_type == "set_theme":
        theme = payload.get("theme")
        if theme:
            _patch_display({"theme": theme})
            print(f"[AGENT THEME] {theme}")
        return

    # ---------------- MODE ----------------
    if action_type == "set_mode":
        mode = (payload.get("mode") or "default").strip().lower()
        apply_mode(mode)
        print(f"[AGENT MODE] {mode}")
        return

    # ---------------- WIDGET VISIBILITY ----------------
    if action_type == "set_widget_visibility":
        widget = (payload.get("widget") or "").strip()
        enabled = payload.get("enabled")
        if isinstance(enabled, bool):
            _set_widget_enabled(widget, enabled)
            print(f"[AGENT WIDGET] {widget} -> {enabled}")
        return

    # Accept BOTH names (your agent uses set_many_widgets)
    if action_type in ("set_many_widgets", "set_widgets"):
        widgets_patch = payload.get("widgets")
        if isinstance(widgets_patch, dict):
            _bulk_widgets(widgets_patch)
            print(f"[AGENT WIDGETS] bulk -> {widgets_patch}")
        return

    # ---------------- FONT / ACCENT (your agent emits these) ----------------
    if action_type == "set_font_style":
        font = (payload.get("fontStyle") or "").strip()
        if font in ALLOWED_FONTS:
            _patch_display({"fontStyle": font})
            print(f"[AGENT FONT] {font}")
        return

    if action_type == "set_accent_color":
        color = (payload.get("accentColor") or "").strip()
        if color in ALLOWED_ACCENTS:
            _patch_display({"accentColor": color})
            print(f"[AGENT ACCENT] {color}")
        return

    # ---------------- LAYOUT (move/resize a widget) ----------------
    if action_type == "set_layout":
        widget = (payload.get("widget") or "").strip()
        layout = payload.get("layout")
        if isinstance(layout, dict):
            _patch_layout(widget, layout)
            print(f"[AGENT LAYOUT] {widget} -> {layout}")
        return

    # ---------------- REPLACE (swap content cleanly) ----------------
    if action_type == "replace_widget":
        frm = (payload.get("from") or "").strip()
        to = (payload.get("to") or "").strip()
        if frm in ALLOWED_WIDGETS and to in ALLOWED_WIDGETS and frm != to:
            cfg = load_config()
            data = cfg.model_dump()

            widgets = dict(data.get("widgets") or {})
            widgets[frm] = False
            widgets[to] = True
            data["widgets"] = widgets

            # optional: swap layouts so the new widget takes the old spot
            layouts = dict(data.get("layouts") or {})
            if frm in layouts:
                old = dict(layouts.get(frm) or {})
                new = dict(layouts.get(to) or {})
                layouts[to] = old or new
                data["layouts"] = layouts

            save_config(MirrorConfig(**data))
            print(f"[AGENT REPLACE] {frm} -> {to}")
        return

    print(f"[AGENT] Unknown action: {action_type} payload={payload}")
