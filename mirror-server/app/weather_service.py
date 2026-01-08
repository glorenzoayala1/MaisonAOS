# mirror-server/app/weather_service.py

from typing import Dict, Any
import requests
from .config_store import get_api_key

OPENWEATHER_URL = "https://api.openweathermap.org/data/2.5/weather"


def _symbol_for_condition(main: str) -> str:
    main = (main or "").lower()
    if "thunder" in main:
        return "⛈️"
    if "drizzle" in main:
        return "🌦️"
    if "rain" in main:
        return "🌧️"
    if "snow" in main:
        return "❄️"
    if "clear" in main:
        return "☀️"
    if "cloud" in main:
        return "☁️"
    if "mist" in main or "fog" in main or "haze" in main:
        return "🌫️"
    return "🌤️"


def _fallback_weather(reason: str) -> Dict[str, Any]:
    print(f"[weather_service] Using fallback weather: {reason}")
    return {
        "temperatureF": 72.0,
        "weatherDescription": "Clear skies (fallback)",
        "symbol": "☀️",
    }


def get_weather_for_city(city: str) -> Dict[str, Any]:
    """
    Return weather dict for /weather endpoint AND Zo's weather context.

    Shape:
        {
          "temperatureF": float,
          "weatherDescription": str,
          "symbol": str,
        }
    """
    api_key = get_api_key("OPENWEATHER_API_KEY")
    if not api_key:
        # Fallback used when no API key configured
        return _fallback_weather("no OPENWEATHER_API_KEY set")

    try:
        params = {
            "q": city,
            "appid": api_key,
            "units": "imperial",  # ✅ get °F directly
        }
        resp = requests.get(OPENWEATHER_URL, params=params, timeout=5)
        resp.raise_for_status()
        data = resp.json()

        main = data.get("main", {})
        weather_list = data.get("weather", [])
        weather0 = weather_list[0] if weather_list else {}

        temp_f = float(main.get("temp"))
        description = weather0.get("description", "Unknown").capitalize()
        condition_main = weather0.get("main", "")
        symbol = _symbol_for_condition(condition_main)

        return {
            "temperatureF": round(temp_f, 1),
            "weatherDescription": description,
            "symbol": symbol,
        }
    except Exception as e:
        # Log + fallback
        return _fallback_weather(f"API error for {city}: {e}")
