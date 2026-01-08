// mirror-client/src/components/widgets/QuotesWidget.tsx
import React, { useEffect, useState } from "react";
import { API_BASE_URL } from "../../config";
import type { QuoteItem } from "../../config";

type Props = {
  categories?: string[];
  fallbackQuote?: QuoteItem;
};

export const QuotesWidget: React.FC<Props> = ({
  categories = ["inspirational", "wisdom"],
  fallbackQuote,
}) => {
  const [quote, setQuote] = useState<QuoteItem | null>(fallbackQuote || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadQuote = async () => {
    try {
      setLoading(true);
      setError(null);

      const categoriesParam = categories.join(",");
      const res = await fetch(
        `${API_BASE_URL}/api/quotes/random?categories=${encodeURIComponent(categoriesParam)}`
      );

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();

      if (data.quote && data.quote.quote) {
        setQuote(data.quote);
      } else if (fallbackQuote) {
        setQuote(fallbackQuote);
      }
    } catch (err) {
      console.error("[QuotesWidget] failed to load quote", err);
      setError("Failed to load quote");
      if (fallbackQuote) {
        setQuote(fallbackQuote);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    if (!cancelled) {
      loadQuote();
    }

    // Refresh quote every 30 minutes
    const id = window.setInterval(() => {
      if (!cancelled) {
        loadQuote();
      }
    }, 30 * 60 * 1000);

    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [categories.join(",")]);

  // Expose refresh function via window global for voice commands
  React.useEffect(() => {
    (window as any).__refreshQuote = loadQuote;
  }, []);

  return (
    <div style={{
      fontSize: "0.9rem",
      lineHeight: 1.5,
      padding: "4px 0",
    }}>
      <div
        style={{
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          opacity: 0.7,
          fontSize: "0.8rem",
          marginBottom: "10px",
        }}
      >
        
      </div>

      {loading && !quote && (
        <div style={{ opacity: 0.7, fontStyle: "italic" }}>
          Loading...
        </div>
      )}

      {error && !quote && (
        <div style={{ opacity: 0.6, fontSize: "0.85rem" }}>
          {error}
        </div>
      )}

      {quote && (
        <div>
          <div style={{
            fontSize: "1.05rem",
            fontStyle: "italic",
            marginBottom: "8px",
            lineHeight: 1.6,
          }}>
            "{quote.quote}"
          </div>

          {quote.author && (
            <div style={{
              fontSize: "0.85rem",
              opacity: 0.75,
              marginTop: "6px",
            }}>
              — {quote.author}
            </div>
          )}

          {quote.category && (
            <div style={{
              fontSize: "0.7rem",
              opacity: 0.5,
              marginTop: "4px",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
            }}>
              {quote.category}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default QuotesWidget;
