# mirror-server/app/services_news.py
from typing import List, Dict, Any
import requests
from .config_store import get_api_key

NEWS_API_URL = "https://newsapi.org/v2/top-headlines"

def fetch_top_news(category: str = "technology", country: str = "us") -> List[Dict[str, Any]]:
    api_key = get_api_key("NEWS_API_KEY")
    if not api_key:
        print("[NEWS] No NEWS_API_KEY set, returning empty list")
        return []

    try:
        resp = requests.get(
            NEWS_API_URL,
            params={
                "apiKey": api_key,
                "category": category,
                "country": country,
                "pageSize": 10,
            },
            timeout=10,
        )
        resp.raise_for_status()
        data = resp.json()
        return data.get("articles", []) or []
    except Exception as e:
        print(f"[NEWS] Error fetching top news: {e}")
        return []


def fetch_multi_category_news(categories: List[str], country: str = "us") -> List[Dict[str, Any]]:
    """
    Fetch news from multiple categories and combine results.

    Args:
        categories: List of NewsAPI category strings (e.g., ["technology", "business"])
        country: Country code (default: "us")

    Returns:
        Combined list of articles, deduplicated and sorted by publishedAt
    """
    if not categories or len(categories) == 0:
        categories = ["technology", "business"]

    all_articles = []
    seen_titles = set()

    # Fetch from each category sequentially
    for category in categories:
        try:
            articles = fetch_top_news(category=category, country=country)

            # Take up to 5 articles per category
            for article in articles[:5]:
                title = article.get("title", "").lower().strip()
                if title and title not in seen_titles:
                    seen_titles.add(title)
                    all_articles.append(article)

        except Exception as e:
            print(f"[NEWS] Failed to fetch category {category}: {e}")
            # Continue with other categories

    # Sort by publishedAt (most recent first)
    all_articles.sort(
        key=lambda a: a.get("publishedAt", ""),
        reverse=True
    )

    # Return top 15 most recent
    return all_articles[:15]
