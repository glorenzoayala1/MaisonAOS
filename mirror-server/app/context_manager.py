# mirror-server/app/context_manager.py

from typing import Dict, Any, List

from .config_store import load_config
from .widget_store import widget_state
from .maison_os.agent_state import get_mode
from .weather_service import get_weather_for_city
from .services_stocks import fetch_stock_quotes
from .services_news import fetch_top_news


def _safe_today_items(cfg) -> List[Dict[str, Any]]:
    items = getattr(cfg, "todayItems", []) or []
    out: List[Dict[str, Any]] = []
    for it in items:
        # Pydantic / dataclass / dict support
        if hasattr(it, "dict"):
            out.append(it.dict())
        elif isinstance(it, dict):
            out.append(it)
        else:
            out.append({"label": str(it), "time": None})
    return out


def _safe_stocks_watchlist(cfg) -> List[str]:
    stocks_items = getattr(cfg, "stocksItems", []) or []
    symbols: List[str] = []
    for entry in stocks_items:
        sym = None
        if isinstance(entry, dict):
            sym = entry.get("symbol")
        else:
            sym = getattr(entry, "symbol", None)
        if sym:
            symbols.append(str(sym).upper())
    # de-dupe
    return sorted(set(symbols))


def build_context() -> Dict[str, Any]:
    """
    Build a snapshot of the current Maison Mirror state for Zo to use.

    This is meant to be lightweight, human-readable JSON that we can
    stuff into the GPT system context.
    """
    cfg = load_config()

    location = getattr(cfg, "location", "Unknown")
    widgets = getattr(cfg, "widgets", {}) or {}
    display = getattr(cfg, "display", None)

    # ---- OS mode (from agent_state) ----
    os_mode = get_mode()

    # ---- weather ----
    try:
        weather = get_weather_for_city(location)
    except Exception as e:
        print(f"[Context] weather error: {e}")
        weather = {}

    # ---- today ----
    today_items = _safe_today_items(cfg)

    # ---- stocks ----
    watchlist = _safe_stocks_watchlist(cfg)
    stocks_quotes: List[Dict[str, Any]] = []
    if watchlist:
        try:
            stocks_quotes = fetch_stock_quotes(watchlist)
        except Exception as e:
            print(f"[Context] stocks error: {e}")

    # ---- news ----
    # let widget_state override category if present
    news_state = widget_state.get("news", {}) or {}
    category = news_state.get("category", "technology")
    try:
        articles_raw = fetch_top_news(category=category, country="us") or []
        # trim & slim for GPT
        articles = []
        for a in articles_raw[:5]:
            articles.append(
                {
                    "title": a.get("title"),
                    "source": (a.get("source") or {}).get("name"),
                    "description": a.get("description"),
                }
            )
    except Exception as e:
        print(f"[Context] news error: {e}")
        articles = []

    # ---- ambient display info ----
    display_info: Dict[str, Any] = {}
    if display is not None:
        # Pydantic or simple object
        if hasattr(display, "dict"):
            display_info = display.dict()
        elif isinstance(display, dict):
            display_info = display
        else:
            display_info = {
                "fontStyle": getattr(display, "fontStyle", None),
                "accentColor": getattr(display, "accentColor", None),
                "theme": getattr(display, "theme", None),
            }

    # ---- assemble ----
    ctx: Dict[str, Any] = {
        "os_mode": os_mode,
        "location": location,
        "widgets_enabled": widgets,
        "weather": weather,
        "today": today_items,
        "stocks": {
            "watchlist": watchlist,
            "quotes": stocks_quotes,
        },
        "news": {
            "category": category,
            "articles": articles,
        },
        "display": display_info,
        "widget_state": widget_state,  # raw backend widget state
    }

    return ctx

