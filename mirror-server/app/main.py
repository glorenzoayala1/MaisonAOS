# mirror-server/app/main.py

# Load environment variables from .env file
from dotenv import load_dotenv
import os

# Load .env from app/.env
env_path = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(env_path)

import traceback
from typing import List, Dict, Any, Literal

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from .actions import execute_action

from .models import MirrorConfig, Weather, SurfConditions
from .config_store import load_config, save_config
from .weather_service import get_weather_for_city
from .surf_service import get_surf_for_location
from .zo_state import get_state, set_state
from .widget_store import widget_state
from .services_news import fetch_multi_category_news
from .services_stocks import fetch_stock_quotes, fetch_stock_history
from .services_quotes import fetch_random_quote

from .maison_os.agent import MaisonAgent
from .maison_os.events import Event
from .maison_os.agent_state import get_mode, set_mode  # ✅ keep agent brain aligned
from .maison_os.mirror_snapshot import get_mirror_snapshot
from .actions import execute_action

from .os_modes import apply_mode
from .context_manager import build_context



OSMode = Literal["default", "focus", "market"]

# ----------------- FastAPI app -----------------

app = FastAPI(title="Maison Mirror Server")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # OK for local / internal use
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------- Agent setup -----------------

agent = MaisonAgent()

# Route ALL agent actions through one executor.
agent.register_action_handler("speak", lambda p: execute_action("speak", p))
agent.register_action_handler("update_widget", lambda p: execute_action("update_widget", p))
agent.register_action_handler("set_theme", lambda p: execute_action("set_theme", p))
agent.register_action_handler("set_mode", lambda p: execute_action("set_mode", p))
agent.register_action_handler("set_display", lambda p: execute_action("set_display", p))
agent.register_action_handler("set_font_style", lambda p: execute_action("set_font_style", p))
agent.register_action_handler("set_accent_color", lambda p: execute_action("set_accent_color", p))
agent.register_action_handler("set_widget_visibility", lambda p: execute_action("set_widget_visibility", p))
agent.register_action_handler("set_many_widgets", lambda p: execute_action("set_many_widgets", p))
agent.register_action_handler("set_quote_categories", lambda p: execute_action("set_quote_categories", p))
agent.register_action_handler("refresh_quote", lambda p: execute_action("refresh_quote", p))

# ----------------- Pydantic event models -----------------

class WakeEventIn(BaseModel):
    source: str | None = None

class UserSpokeIn(BaseModel):
    text: str
    source: str | None = None

# ----------------- Config endpoints -----------------

@app.get("/config", response_model=MirrorConfig)
def read_config() -> MirrorConfig:
    return load_config()

@app.post("/config", response_model=MirrorConfig)
def write_config(cfg: MirrorConfig) -> MirrorConfig:
    return save_config(cfg)

# ----------------- Weather + Surf -----------------

@app.get("/weather", response_model=Weather)
def read_weather(city: str = "San Diego") -> Weather:
    data = get_weather_for_city(city)
    return Weather(**data)

@app.get("/surf", response_model=SurfConditions)
def read_surf(location: str = "San Diego") -> SurfConditions:
    data = get_surf_for_location(location)
    return SurfConditions(**data)

# ----------------- Zo state + voice -----------------

@app.get("/zo/state")
def zo_state():
    return get_state()

@app.post("/zo/talk")
def zo_talk():
    """
    Trigger one Zo interaction:
      - record
      - transcribe
      - chat
      - TTS
      - play audio on the server machine.
    """
    try:
        from voice_zo import run_zo_once  # lazy import

        set_state("listening")
        turn = run_zo_once()
        set_state("idle", last_user=turn.user_text, last_zo=turn.zo_text)
        return get_state()

    except Exception as e:
        traceback.print_exc()
        set_state("idle")
        raise HTTPException(status_code=500, detail=str(e))

# ----------------- Agent events -----------------

@app.post("/agent/wake")
def agent_wake(event_in: WakeEventIn):
    event = Event.wake(source=event_in.source)
    agent.handle_event(event)
    return {"status": "ok"}

@app.post("/agent/user-spoke")
def agent_user_spoke(event_in: UserSpokeIn):
    event = Event.user_spoke(text=event_in.text, source=event_in.source)
    agent.handle_event(event)
    return {"status": "ok"}

# ----------------- Widget state -----------------

@app.get("/api/widgets/state")
def get_widget_state():
    return widget_state

# ----------------- News API -----------------

@app.get("/api/news/top")
def api_top_news(
    categories: str = Query("", description="Comma-separated categories"),
    country: str = Query("us"),
):
    """
    Fetch top news from multiple categories.

    Query params:
      categories: comma-separated like "technology,business,sports"
      country: country code (default: "us")
    """
    # Parse categories (same pattern as quotes endpoint)
    cat_list = [c.strip() for c in categories.split(",") if c.strip()] if categories else []

    # Fetch from multiple categories
    articles = fetch_multi_category_news(cat_list, country=country)

    # Clean and format response
    cleaned = [
        {
            "title": a.get("title"),
            "source": (a.get("source") or {}).get("name"),
            "time": a.get("publishedAt"),
        }
        for a in (articles or [])
        if a.get("title")
    ]
    return {"articles": cleaned}

# ----------------- Stocks API -----------------

@app.get("/api/stocks/quotes")
async def api_get_stock_quotes(
    symbols: str = Query(..., description="Comma-separated symbols, e.g. AAPL,NVDA,SPY"),
):
    symbols_list: List[str] = [s.strip().upper() for s in symbols.split(",") if s.strip()]
    items = fetch_stock_quotes(symbols_list)
    return {"items": items}

@app.get("/api/stocks/history")
def api_get_stock_history(
    symbols: str = Query(..., description="Comma-separated symbols"),
    points: int = Query(40, ge=5, le=200),
):
    sym_list: List[str] = [s.strip().upper() for s in symbols.split(",") if s.strip()]
    items: Dict[str, List[Dict[str, Any]]] = {}
    for sym in sym_list:
        items[sym] = fetch_stock_history(sym, points=points)
    return {"items": items}

# ----------------- Quotes API -----------------

@app.get("/api/quotes/random")
def api_random_quote(
    categories: str = Query("", description="Comma-separated categories"),
):
    """
    Fetch a random quote from API Ninjas.

    Query params:
      categories: comma-separated list like "inspirational,wisdom,success"

    Returns:
      {"quote": {...}} or {"quote": None} on error
    """
    cat_list = [c.strip() for c in categories.split(",") if c.strip()] if categories else []

    quote_data = fetch_random_quote(cat_list)

    return {"quote": quote_data if quote_data else None}

# ----------------- OS mode API -----------------

@app.get("/os/mode")
def read_os_mode():
    """
    Return the current MaisonOS mode, e.g. {"mode": "focus"}.
    """
    # Prefer agent_state (real runtime), fallback to config if needed
    mode = get_mode() or getattr(load_config(), "os_mode", "default")
    return {"mode": mode}

@app.post("/os/mode")
def write_os_mode(mode: str = Query(...)):
    """
    Set MaisonOS mode and persist to config.json + sync agent_state.
    """
    try:
        mode_norm = (mode or "default").strip().lower()
        cfg = apply_mode(mode_norm)           # ✅ persist config + layout changes
        set_mode(mode_norm)                   # ✅ sync agent brain
        return cfg
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

# ----------------- Context API -----------------

@app.get("/api/context/full")
def api_full_context():
    return build_context()

# ----------------- Mirror Snapshot API -----------------

@app.get("/api/mirror/snapshot")
def api_mirror_snapshot():
    return get_mirror_snapshot()

# ----------------- Alarms API -----------------

@app.get("/api/alarms/check")
def api_check_alarms():
    """
    Check if any alarm should trigger right now.
    Returns the alarm object if one should trigger, or None.
    """
    from .services_alarms import check_alarms, get_alarm_greeting

    cfg = load_config()
    alarms = cfg.alarmItems or []

    triggered_alarm = check_alarms(alarms)

    if triggered_alarm:
        greeting = get_alarm_greeting(triggered_alarm, user_name="Lorenzo")
        return {
            "triggered": True,
            "alarm": triggered_alarm.model_dump(),
            "greeting": greeting,
        }

    return {"triggered": False, "alarm": None, "greeting": None}


# ----------------- System Control API -----------------

@app.post("/api/system/shutdown")
def api_system_shutdown():
    """
    Shutdown the Raspberry Pi system.

    This endpoint initiates a safe system shutdown. Use with caution!
    Only works on Linux systems with shutdown command available.
    """
    import subprocess
    import platform

    # Only allow on Linux (Raspberry Pi OS)
    if platform.system() != "Linux":
        return {
            "success": False,
            "message": "Shutdown only available on Linux systems"
        }

    try:
        # Schedule shutdown in 5 seconds to allow response to be sent
        subprocess.Popen(["sudo", "shutdown", "-h", "+0.1"])
        return {
            "success": True,
            "message": "Shutdown initiated. System will power off shortly."
        }
    except Exception as e:
        print(f"[SYSTEM] Shutdown failed: {e}")
        return {
            "success": False,
            "message": f"Shutdown failed: {str(e)}"
        }
