# mirror-server/app/services_quotes.py

from typing import List, Dict, Any
import requests
from .config_store import get_api_key

QUOTES_API_URL = "https://api.api-ninjas.com/v2/randomquotes"


def fetch_random_quote(categories: List[str] = None) -> Dict[str, Any]:
    """
    Fetch a random quote from API Ninjas.

    Args:
        categories: List of category strings (e.g., ["inspirational", "wisdom"])

    Returns:
        Dict with keys: quote, author, category
        Returns empty dict on error
    """
    api_key = get_api_key("API_NINJAS_KEY")
    if not api_key:
        print("[QUOTES] No API_NINJAS_KEY set, returning empty dict")
        return {}

    try:
        headers = {"X-Api-Key": api_key}
        params = {}

        # API Ninjas accepts comma-separated categories
        if categories and len(categories) > 0:
            params["category"] = ",".join(categories)

        resp = requests.get(
            QUOTES_API_URL,
            headers=headers,
            params=params,
            timeout=10,
        )
        resp.raise_for_status()
        data = resp.json()

        # API returns array, take first quote
        if isinstance(data, list) and len(data) > 0:
            quote_data = data[0]
            # Extract categories array and join if present
            categories_raw = quote_data.get("categories", [])
            category_str = categories_raw[0] if isinstance(categories_raw, list) and len(categories_raw) > 0 else ""

            return {
                "quote": quote_data.get("quote", ""),
                "author": quote_data.get("author", ""),
            
            }

        return {}

    except Exception as e:
        print(f"[QUOTES] Error fetching quote: {e}")
        return {}
