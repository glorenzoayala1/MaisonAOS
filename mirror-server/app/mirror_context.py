# app/mirror_context.py
from .services_stocks import fetch_stock_quotes
from .services_news import fetch_top_news
from .config_store import load_config

def get_mirror_context() -> dict:
    cfg = load_config()

    # what stocks the widget is watching
    stock_items = cfg.stocksItems if hasattr(cfg, "stocksItems") else []
    symbols = [item.symbol for item in stock_items] if stock_items else ["NVDA", "AAPL", "SPY"]

    quotes = fetch_stock_quotes(symbols)

    # top tech news for now
    news = fetch_top_news(category="technology", country="us")

    today = getattr(cfg, "todayItems", [])

    return {
        "stocks": quotes,
        "news": news[:5],
        "today": today,
    }

