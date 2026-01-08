# mirror-server/app/maison_os/agent.py

from __future__ import annotations

from typing import Dict, Any, List, Callable, Optional, Tuple

from .events import Event, EventType
from .home_graph import HomeGraphManager
from .agent_state import (
    mark_wake,
    update_user_utterance,
    update_response,
    get_mode,
    set_mode,
)

from .mirror_snapshot import get_mirror_snapshot


# ----------------------------
# UI command planner (deterministic)
# ----------------------------

_WIDGET_ALIASES: Dict[str, str] = {
    "clock": "clock",
    "time": "clock",

    "weather": "weather",
    "temp": "weather",
    "temperature": "weather",

    "today": "today",
    "tasks": "today",
    "to do": "today",
    "todo": "today",

    "surf": "surf",
    "waves": "surf",

    "news": "news",
    "headlines": "news",

    "stocks": "stocks",
    "stock": "stocks",
    "market": "stocks",
    "portfolio": "stocks",
    "watchlist": "stocks",

    "quotes": "quotes",
    "quote": "quotes",
    "inspiration": "quotes",
    "wisdom": "quotes",
}

_ALLOWED_WIDGETS = {"clock", "weather", "today", "surf", "news", "stocks", "quotes"}

# These must match what your client expects (config.ts maps these)
_ALLOWED_FONTS = {"serif", "sans", "futuristic"}
_ALLOWED_ACCENTS = {"white", "gold", "silver"}


def _match_widget(lower: str) -> Optional[str]:
    # prefer exact widget names
    for w in _ALLOWED_WIDGETS:
        if w in lower:
            return w

    # then aliases
    for k, v in _WIDGET_ALIASES.items():
        if k in lower:
            return v

    return None


def plan_ui_actions(text: str) -> Tuple[Optional[str], List[Dict[str, Any]]]:
    lower = (text or "").strip().lower()
    actions: List[Dict[str, Any]] = []

    # --------- Sleep / Wake ---------
    if any(k in lower for k in ["go to sleep", "sleep mode", "sleep now", "turn off the display", "screen off"]):
        actions.append({
            "type": "set_display",
            "payload": {"display": {"sleepMode": True}},
        })
        return ("Going to sleep.", actions)

    if any(k in lower for k in ["wake up", "wake", "come back on", "screen on", "turn on the display"]):
        actions.append({
            "type": "set_display",
            "payload": {"display": {"sleepMode": False}},
        })
        return ("I’m awake.", actions)


    # --------- OS modes ---------
    if "focus mode" in lower or "deep work" in lower:
        actions.append({"type": "set_mode", "payload": {"mode": "focus"}})
        return ("Entering focus mode.", actions)

    if "market mode" in lower or "show the markets" in lower:
        actions.append({"type": "set_mode", "payload": {"mode": "market"}})
        return ("Switching to market mode.", actions)

    if any(k in lower for k in ["default mode", "normal mode", "back to normal"]):
        actions.append({"type": "set_mode", "payload": {"mode": "default"}})
        return ("Back to your default layout.", actions)

    # --------- Replace widget A with widget B ---------
    if "replace" in lower and " with " in lower:
        # naive parse but works great for your fixed widget set
        left = lower.split("replace", 1)[1].strip()
        a_txt, b_txt = left.split(" with ", 1)
        a = _match_widget(a_txt)
        b = _match_widget(b_txt)
        if a and b and a != b:
            actions.append({"type": "set_widget_visibility", "payload": {"widget": a, "enabled": False}})
            actions.append({"type": "set_widget_visibility", "payload": {"widget": b, "enabled": True}})
            return (f"Replacing {a} with {b}.", actions)

    # --------- Swap widgets (optional) ---------
    if "swap" in lower and " and " in lower:
        left = lower.split("swap", 1)[1].strip()
        a_txt, b_txt = left.split(" and ", 1)
        a = _match_widget(a_txt)
        b = _match_widget(b_txt)
        if a and b and a != b:
            # swap = just toggle both on, and later we’ll add position swapping in Pathway B
            actions.append({"type": "set_widget_visibility", "payload": {"widget": a, "enabled": True}})
            actions.append({"type": "set_widget_visibility", "payload": {"widget": b, "enabled": True}})
            return (f"Swapping {a} and {b}.", actions)

    # --------- Remove widget ---------
    if any(k in lower for k in ["remove ", "delete ", "get rid of "]):
        if "all" in lower or "everything" in lower:
            actions.append({"type": "set_widgets", "payload": {"widgets": {k: False for k in _ALLOWED_WIDGETS}}})
            return ("Okay. Removing everything.", actions)

        w = _match_widget(lower)
        if w:
            actions.append({"type": "set_widget_visibility", "payload": {"widget": w, "enabled": False}})
            return (f"Removed {w}.", actions)

    # --------- Add widget ---------
    if any(k in lower for k in ["add ", "bring back ", "restore "]):
        w = _match_widget(lower)
        if w:
            actions.append({"type": "set_widget_visibility", "payload": {"widget": w, "enabled": True}})
            return (f"Added {w}.", actions)

    # --------- Hide / Show widgets ---------
    if any(k in lower for k in ["hide ", "turn off", "disable "]):
        if "all" in lower or "everything" in lower:
            actions.append({"type": "set_widgets", "payload": {"widgets": {k: False for k in _ALLOWED_WIDGETS}}})
            return ("Okay. Hiding everything.", actions)

        w = _match_widget(lower)
        if w:
            actions.append({"type": "set_widget_visibility", "payload": {"widget": w, "enabled": False}})
            return (f"Okay. Hiding {w}.", actions)

    if any(k in lower for k in ["show ", "turn on", "enable "]):
        if "all" in lower or "everything" in lower:
            actions.append({"type": "set_widgets", "payload": {"widgets": {k: True for k in _ALLOWED_WIDGETS}}})
            return ("Okay. Showing everything.", actions)

        w = _match_widget(lower)
        if w:
            actions.append({"type": "set_widget_visibility", "payload": {"widget": w, "enabled": True}})
            return (f"Got it. Showing {w}.", actions)

    # --------- Font ---------
    if "font" in lower or "typeface" in lower:
        for f in _ALLOWED_FONTS:
            if f in lower:
                actions.append({"type": "set_display", "payload": {"display": {"fontStyle": f}}})
                return (f"Font set to {f}.", actions)

    # --------- Accent ---------
    if "accent" in lower:
        for c in _ALLOWED_ACCENTS:
            if c in lower:
                actions.append({"type": "set_display", "payload": {"display": {"accentColor": c}}})
                return (f"Accent set to {c}.", actions)

    # --------- Quote Category Changes ---------
    if any(k in lower for k in ["show me", "add", "change to"]) and any(k in lower for k in ["quote", "quotes"]):
        categories_map = {
            "inspirational": "inspirational",
            "wisdom": "wisdom",
            "philosophy": "philosophy",
            "life": "life",
            "success": "success",
            "courage": "courage",
            "happiness": "happiness",
            "love": "love",
            "leadership": "leadership",
            "motivational": "inspirational",
        }

        detected_cats = []
        for keyword, cat in categories_map.items():
            if keyword in lower:
                detected_cats.append(cat)

        if detected_cats:
            actions.append({
                "type": "set_quote_categories",
                "payload": {"categories": detected_cats},
            })
            return (f"Switching to {', '.join(detected_cats)} quotes.", actions)

    # --------- Refresh Quote ---------
    if any(k in lower for k in ["new quote", "another quote", "different quote", "refresh quote", "give me a new quote"]):
        actions.append({
            "type": "refresh_quote",
            "payload": {},
        })
        return ("Getting a fresh quote for you.", actions)

    return (None, [])






class MaisonAgent:
    """Event-driven agent with access to HomeGraph + UI actions."""

    def __init__(self) -> None:
        self.home = HomeGraphManager()
        self.action_handlers: Dict[str, Callable[[Dict[str, Any]], None]] = {}

    def register_action_handler(
        self,
        action_type: str,
        handler: Callable[[Dict[str, Any]], None],
    ) -> None:
        self.action_handlers[action_type] = handler

    def emit_action(self, action_type: str, payload: Dict[str, Any]) -> None:
        handler = self.action_handlers.get(action_type)
        if handler:
            handler(payload)
        else:
            print(f"[MaisonAgent] Action: {action_type} -> {payload}")

    def handle_event(self, event: Event) -> None:
        if event.type == EventType.WAKE_WORD:
            self._on_wake(event)
        elif event.type == EventType.USER_SPOKE:
            self._on_user_spoke(event)
        elif event.type == EventType.SYSTEM_TICK:
            self._on_tick(event)
        elif event.type == EventType.WIDGET_UPDATED:
            self._on_widget_updated(event)
        else:
            print(f"[MaisonAgent] Unknown event type: {event.type}")

    def _on_wake(self, event: Event) -> None:
        mark_wake()
        source = event.payload.get("source", "unknown")
        print(f"[MaisonAgent] Wake word detected from {source}")

        self.emit_action("update_widget", {"widget": "system", "data": {"status": "listening"}})

    def _on_user_spoke(self, event: Event) -> None:
        text = event.payload.get("text", "")
        update_user_utterance(text)
        print(f"[MaisonAgent] User said: {text}")

        response, actions = self.think(text)
        update_response(response)

        self.emit_action("speak", {"text": response})

        for action in actions:
            self.emit_action(action["type"], action.get("payload", {}))

    def _on_tick(self, event: Event) -> None:
        pass

    def _on_widget_updated(self, event: Event) -> None:
        widget_name = event.payload.get("widget")
        data = event.payload.get("data", {})
        print(f"[MaisonAgent] Widget '{widget_name}' updated with {data}")

    # ---------- core ----------
    def think(self, text: str) -> tuple[str, List[Dict[str, Any]]]:
        lower = (text or "").lower()

        # 1) UI commands first
        ui_response, ui_actions = plan_ui_actions(text)
        if ui_response is not None and ui_actions:
            return ui_response, ui_actions

        # 2) Snapshot-based answers (keeps Zo grounded in what’s on-screen)
        data_intent = self._detect_data_intent(lower)
        if data_intent != "none":
            return self._answer_with_snapshot(text, data_intent), []

        return "I’m here. What would you like to change?", []

    def _detect_data_intent(self, lower: str) -> str:
        if any(k in lower for k in ["tesla", "tsla", "nvidia", "nvda", "stock", "stocks", "portfolio", "watchlist"]):
            return "stocks_summary"
        if any(k in lower for k in ["headline", "headlines", "news"]):
            return "news_summary"
        if any(k in lower for k in ["weather", "temperature", "forecast", "rain", "raining", "hot", "cold"]):
            return "weather_summary"
        if any(k in lower for k in ["what's going on", "whats going on", "overview of today", "mirror overview"]):
            return "mirror_overview"
        if any(k in lower for k in ["read the quote", "what's the quote", "quote of the day", "today's quote"]):
            return "quote_reading"
        return "none"

    def _answer_with_snapshot(self, user_text: str, intent: str) -> str:
        snapshot = get_mirror_snapshot()
        widgets = snapshot.get("widgets", {})

        if intent == "weather_summary":
            w = widgets.get("weather") or {}
            if not w.get("enabled", True):
                return "Weather is turned off on the mirror."
            temp = w.get("temperatureF")
            summary = w.get("description")
            if temp is None and summary is None:
                return "I don’t see live weather data on the mirror right now."
            if temp is not None and summary:
                return f"{summary}, about {temp:.0f} degrees."
            if summary:
                return str(summary)
            return f"Around {temp:.0f} degrees."

        if intent == "news_summary":
            n = widgets.get("news") or {}
            if not n.get("enabled", True):
                return "News is hidden on the mirror."
            headlines = n.get("headlines") or []
            if not headlines:
                return "No headlines are showing right now."
            top = headlines[:2]
            lines = [h.get("title", "") for h in top if h.get("title")]
            return "Top headlines: " + " — ".join(lines)

        if intent == "stocks_summary":
            s = widgets.get("stocks") or {}
            if not s.get("enabled", True):
                return "Stocks are hidden on the mirror."
            quotes = s.get("quotes") or []
            if not quotes:
                return "I don’t see stock quotes on the mirror right now."
            top = quotes[:3]
            parts: List[str] = []
            for q in top:
                sym = (q.get("symbol") or "").upper()
                price = q.get("price")
                cp = q.get("changePercent")
                if price is None:
                    continue
                if cp is None:
                    parts.append(f"{sym} at ${price:.2f}.")
                else:
                    direction = "up" if cp > 0 else "down" if cp < 0 else "flat"
                    parts.append(f"{sym} {direction} {abs(cp):.1f}% at ${price:.2f}.")
            return " ".join(parts) if parts else "Stocks are loading, but I don’t have clean moves yet."

        if intent == "mirror_overview":
            pieces: List[str] = []
            w = widgets.get("weather") or {}
            if w.get("enabled", True) and w.get("temperatureF") is not None:
                pieces.append(f"{w.get('description','Weather')} {w.get('temperatureF'):.0f}°.")
            t = widgets.get("today") or {}
            items = t.get("items") or []
            if items:
                pieces.append(f"{len(items)} item(s) on Today.")
            return " ".join(pieces) if pieces else "Nothing major on the mirror right now."

        if intent == "quote_reading":
            q = widgets.get("quotes") or {}
            if not q.get("enabled", True):
                return "Quotes are turned off on the mirror."

            quote_data = q.get("current_quote")
            if not quote_data or not quote_data.get("quote"):
                return "I don't see a quote on the mirror right now."

            quote_text = quote_data.get("quote", "")
            author = quote_data.get("author")

            if author:
                return f"{quote_text} That's from {author}."
            else:
                return quote_text

        return "I tried to look at mirror data, but the snapshot looks off."


# Keep for voice_zo GPT grounding template (if you use it there)
def build_data_grounded_system_prompt(intent: str) -> str:
    return """
You are Zo, the voice of Maison Mirror.
You are ALWAYS grounded in live data from the mirror_snapshot JSON.
Rules:
- Only make factual claims using values inside mirror_snapshot.
- If data is missing, say you don't have it.
- Speak concisely for voice output.
"""
