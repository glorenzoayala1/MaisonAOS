// mirror-client/src/components/widgets/NewsWidget.tsx
import React, { useEffect, useState } from "react";
import { API_BASE_URL } from "../../config";
import type { NewsItem } from "../../config";

type Props = {
  categories?: string[];
  fallbackItems?: NewsItem[];
};

export const NewsWidget: React.FC<Props> = ({
  categories = ["technology", "business"],
  fallbackItems = []
}) => {
  const [items, setItems] = useState<NewsItem[]>(fallbackItems);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);

        // Build categories query param
        const categoriesParam = categories.join(",");
        const url = `${API_BASE_URL}/api/news/top${categoriesParam ? `?categories=${encodeURIComponent(categoriesParam)}` : ''}`;

        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        const articles = Array.isArray(data.articles)
          ? (data.articles as NewsItem[])
          : [];

        if (!cancelled) {
          if (articles.length) {
            setItems(articles.slice(0, 6)); // Show 6 articles max
          } else if (fallbackItems.length) {
            setItems(fallbackItems);
          }
        }
      } catch (err) {
        console.error("[NewsWidget] failed to load news", err);
        if (!cancelled && fallbackItems.length) {
          setItems(fallbackItems);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    // IMPORTANT: Change interval from 10 min to 60 min (1 hour) to stay under API rate limits
    const id = window.setInterval(load, 60 * 60 * 1000);

    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [categories.join(",")]);

  return (
    <div style={{ fontSize: "0.8rem", lineHeight: 1.4 }}>
      <div
        style={{
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          opacity: 0.7,
        }}
      >
        News
      </div>

      {loading && !items.length && (
        <div style={{ marginTop: 6, opacity: 0.7 }}>Loading headlines…</div>
      )}

      {!loading && !items.length && (
        <div style={{ marginTop: 6, opacity: 0.7 }}>
          No headlines available.
        </div>
      )}

      <ul
        style={{
          margin: "8px 0 0 0",
          padding: 0,
          listStyle: "none",
        }}
      >
        {items.map((item, idx) => (
          <li key={idx} style={{ marginBottom: 6 }}>
            <div>{item.title}</div>
            {(item.source || item.time) && (
              <div style={{ opacity: 0.6, fontSize: "0.75rem" }}>
                {item.source ?? "·"}
                {item.time ? ` · ${item.time}` : ""}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default NewsWidget;
