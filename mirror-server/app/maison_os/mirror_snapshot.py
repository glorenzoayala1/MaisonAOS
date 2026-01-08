# mirror-server/app/maison_os/mirror_snapshot.py

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List

from ..config_store import load_config
from ..weather_service import get_weather_for_city
from ..services_news import fetch_top_news
from ..services_stocks import fetch_stock_quotes, fetch_stock_history
from .agent_state import get_mode


def _iso_now_utc() -> str:
    return datetime.now(timezone.utc).isoformat()


def _as_dict(cfg: Any) -> Dict[str, Any]:
    """
    Normalize MirrorConfig (or dict) into a plain dict so we can use .get() safely.
    """
    if isinstance(cfg, dict):
        return cfg
    if hasattr(cfg, "model_dump"):
        return cfg.model_dump()
    if hasattr(cfg, "dict"):
        return cfg.dict()  # type: ignore[call-arg]
    return dict(cfg)


def get_mirror_snapshot() -> Dict[str, Any]:
    raw_cfg = load_config()
    config = _as_dict(raw_cfg)

    # In your config/models, widgets are booleans, not {enabled: true}
    widgets_cfg: Dict[str, Any] = config.get("widgets", {}) or {}

    snapshot: Dict[str, Any] = {
        "timestamp": _iso_now_utc(),
        "os_mode": get_mode() or config.get("os_mode", "default"),
        "widgets": {},
    }

    # ---------------- Weather ----------------
    weather_enabled = bool(widgets_cfg.get("weather", True))
    if weather_enabled:
        try:
            city = config.get("location") or "San Diego"
            weather = get_weather_for_city(city)
            snapshot["widgets"]["weather"] = {
                "enabled": True,
                "city": city,
                "temperatureF": weather.get("temperatureF"),
                "description": weather.get("weatherDescription"),
                "symbol": weather.get("symbol"),
                "raw": weather,
            }
        except Exception as e:
            snapshot["widgets"]["weather"] = {"enabled": False, "error": str(e)}
    else:
        snapshot["widgets"]["weather"] = {"enabled": False}

    # ---------------- Stocks ----------------
    stocks_enabled = bool(widgets_cfg.get("stocks", True))
    if stocks_enabled:
        stocks_items = config.get("stocksItems", []) or []
        symbols: List[str] = []

        for item in stocks_items:
            # items should be dicts like {"symbol":"NVDA"} (from your config.json)
            if isinstance(item, dict):
                sym = (item.get("symbol") or "").strip().upper()
            else:
                # allow raw strings too, just in case
                sym = str(item).strip().upper()

            if sym:
                symbols.append(sym)

        quotes = fetch_stock_quotes(symbols) if symbols else []

        history_data: Dict[str, List[Dict[str, Any]]] = {}
        for sym in symbols:
            hist = fetch_stock_history(sym, points=40)
            if hist:
                history_data[sym] = hist

        snapshot["widgets"]["stocks"] = {
            "enabled": True,
            "symbols": symbols,
            # canonical field for Zo (agent expects this)
            "watchlist": quotes,
            # keep for backwards compatibility
            "quotes": quotes,
            "history": history_data if history_data else None,
        }
    else:
        snapshot["widgets"]["stocks"] = {"enabled": False}

    # ---------------- News ----------------
    news_enabled = bool(widgets_cfg.get("news", True))
    if news_enabled:
        try:
            headlines = fetch_top_news(category="technology", country="us")
            snapshot["widgets"]["news"] = {
                "enabled": True,
                "headlines": headlines if isinstance(headlines, list) else [],
            }
        except Exception as e:
            snapshot["widgets"]["news"] = {"enabled": False, "error": str(e)}
    else:
        snapshot["widgets"]["news"] = {"enabled": False}

    # ---------------- Today ----------------
    today_enabled = bool(widgets_cfg.get("today", True))
    if today_enabled:
        today_items = config.get("todayItems", []) or []
        snapshot["widgets"]["today"] = {
            "enabled": True,
            "items": today_items if isinstance(today_items, list) else [],
        }
    else:
        snapshot["widgets"]["today"] = {"enabled": False}

    # ---------------- Quotes ----------------
    quotes_enabled = bool(widgets_cfg.get("quotes", True))
    if quotes_enabled:
        current_quote = config.get("currentQuote")
        categories = config.get("quotesCategories", ["inspirational", "wisdom"])
        snapshot["widgets"]["quotes"] = {
            "enabled": True,
            "current_quote": current_quote,
            "categories": categories if isinstance(categories, list) else [],
        }
    else:
        snapshot["widgets"]["quotes"] = {"enabled": False}

    return snapshot
