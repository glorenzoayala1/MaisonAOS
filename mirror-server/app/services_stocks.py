# mirror-server/app/services_stocks.py
from __future__ import annotations

from typing import Any, Dict, List, Optional
from datetime import datetime, timedelta, timezone

import requests
from .config_store import get_api_key

BASE = "https://finnhub.io/api/v1"


class StocksError(Exception):
    pass


def _get_api_key() -> str:
    """Get Finnhub API key from config or env"""
    api_key = get_api_key("FINNHUB_API_KEY")
    if not api_key:
        raise StocksError("FINNHUB_API_KEY is not set")
    return api_key


def _get(path: str, params: dict | None = None) -> dict:
    api_key = _get_api_key()
    params = dict(params or {})
    params["token"] = api_key
    url = f"{BASE}{path}"
    resp = requests.get(url, params=params, timeout=10)
    resp.raise_for_status()
    data = resp.json()
    if not isinstance(data, dict):
        raise StocksError(f"Unexpected Finnhub response: {data}")
    return data


def fetch_stock_quotes(symbols: List[str]) -> List[Dict[str, Any]]:
    """
    Returns:
      [{"symbol":"AAPL","price":123.45,"changePercent":1.23}, ...]
    Uses Finnhub /quote:
      c=current, pc=prev close, dp=percent change
    """
    clean = [str(s).strip().upper() for s in (symbols or []) if str(s).strip()]
    out: List[Dict[str, Any]] = []

    for sym in clean:
        try:
            q = _get("/quote", params={"symbol": sym})
            price = q.get("c")  # current
            dp = q.get("dp")    # percent change
            pc = q.get("pc")    # prev close (fallback calc)

            if price is None:
                out.append({"symbol": sym, "price": None, "changePercent": None})
                continue

            # Prefer Finnhub's dp; compute if missing
            change_pct: Optional[float]
            if dp is not None:
                change_pct = float(dp)
            elif pc is not None and float(pc) != 0.0:
                change_pct = (float(price) - float(pc)) / float(pc) * 100.0
            else:
                change_pct = None

            out.append(
                {
                    "symbol": sym,
                    "price": float(price),
                    "changePercent": change_pct,
                }
            )

        except Exception as e:
            print(f"[STOCKS] Quote fetch failed for {sym}: {e}")
            out.append({"symbol": sym, "price": None, "changePercent": None})

    return out


def fetch_stock_history(symbol: str, points: int = 40) -> Optional[List[Dict[str, Any]]]:
    """
    Returns simple daily close history for sparklines:

      [{"t": 1717000000, "price": 193.42}, ...]

    Finnhub candles:
      /stock/candle?symbol=AAPL&resolution=D&from=...&to=...
      returns { "c": [..], "t": [..], "s": "ok" }
    """
    
    sym = str(symbol).strip().upper()
    if not sym:
        return None

    # Add a few buffer days for weekends/holidays so we still get `points` bars.
    now = datetime.now(timezone.utc)
    to_ts = int(now.timestamp())
    from_ts = int((now - timedelta(days=points + 14)).timestamp())

    try:
        data = _get(
            "/stock/candle",
            params={
                "symbol": sym,
                "resolution": "D",
                "from": from_ts,
                "to": to_ts,
            },
        )
    except Exception as e:
        print(f"[STOCKS] History fetch failed for {sym}: {e}")
        return None

    status = (data.get("s") or "").lower()
    if status != "ok":
        # Common Finnhub statuses: "no_data"
        print(f"[STOCKS] No history data for {sym}: status={data.get('s')}")
        return None

    closes = data.get("c") or []
    times = data.get("t") or []

    if not closes or not times or len(closes) != len(times):
        print(f"[STOCKS] Invalid history payload for {sym}")
        return None

    # Take last `points`
    start = max(0, len(closes) - points)
    out: List[Dict[str, Any]] = []
    for t, c in zip(times[start:], closes[start:]):
        if t is None or c is None:
            continue
        out.append({"t": int(t), "price": float(c)})

    return out if out else None
