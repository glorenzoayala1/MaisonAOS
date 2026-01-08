// mirror-client/src/components/widgets/StocksWidget.tsx
import React, { useEffect, useState } from "react";
import { API_BASE_URL, defaultConfig, type StockItem } from "../../config";


type Props = {
  items?: StockItem[]; // from config
};

type Quote = {
  symbol: string;
  price: number | null;
  change: number | null;
  changePercent: number | null;
  label?: string;
};

type HistoryPoint = {
  t: number;
  price: number;
};

type HistoryMap = Record<string, HistoryPoint[]>;

export const StocksWidget: React.FC<Props> = ({ items }) => {
  const baseItems: StockItem[] =
    items && items.length ? items : defaultConfig.stocksItems ?? [];

  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [history, setHistory] = useState<HistoryMap>({});
  const [loading, setLoading] = useState(false);

  // single string key so the effect re-runs when symbols change
  const symbolKey = baseItems.map((b) => b.symbol.toUpperCase()).join(",");

  useEffect(() => {
    if (!baseItems.length) {
      setQuotes([]);
      setHistory({});
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        const symbols = baseItems.map((s) => s.symbol).join(",");

        // 1) quotes
        const resQuotes = await fetch(
          `${API_BASE_URL}/api/stocks/quotes?symbols=${encodeURIComponent(
            symbols,
          )}`,
        );
        if (!resQuotes.ok) throw new Error(`quotes HTTP ${resQuotes.status}`);
        const dataQuotes = await resQuotes.json();

        const map: Record<string, Quote> = {};
        for (const q of dataQuotes.items ?? []) {
          const sym = (q.symbol || "").toUpperCase();
          map[sym] = {
            symbol: sym,
            price: q.price ?? null,
            change: q.change ?? null,
            changePercent: q.changePercent ?? null,
          };
        }

        const mergedQuotes: Quote[] = baseItems.map((entry) => {
          const sym = entry.symbol.toUpperCase();
          const fromApi = map[sym];
          return {
            symbol: sym,
            label: entry.label ?? sym,
            price: fromApi?.price ?? null,
            change: fromApi?.change ?? null,
            changePercent: fromApi?.changePercent ?? null,
          };
        });

        // 2) history (for sparklines)
        const resHist = await fetch(
          `${API_BASE_URL}/api/stocks/history?symbols=${encodeURIComponent(
            symbols,
          )}&points=40`,
        );
        if (!resHist.ok) throw new Error(`history HTTP ${resHist.status}`);
        const dataHist = await resHist.json();

        const histItems: HistoryMap = dataHist.items ?? {};

        if (!cancelled) {
          setQuotes(mergedQuotes);
          setHistory(histItems);
        }
      } catch (err) {
        console.error("[StocksWidget] failed to load quotes/history", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    const id = window.setInterval(load, 60_000); // refresh every minute

    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [symbolKey]);

  if (!baseItems.length) {
    return (
      <div style={{ opacity: 0.7, fontSize: "0.9rem" }}>
        No stocks configured yet.
      </div>
    );
  }

  // --- tiny sparkline renderer ---
  function renderSparkline(symbol: string) {
    const series = history[symbol] ?? [];
    if (series.length < 2) {
      return (
        <div
          style={{
            opacity: 0.4,
            fontSize: "0.7rem",
            textAlign: "right",
            minWidth: 70,
          }}
        >
          ···
        </div>
      );
    }

    const width = 80;
    const height = 28;
    const padX = 2;
    const padY = 2;

    const prices = series.map((p) => p.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const span = max - min || 1; // avoid div/0

    const points = series.map((p, idx) => {
      const x =
        padX +
        (idx / (series.length - 1)) * (width - padX * 2);
      const norm = (p.price - min) / span; // 0–1
      const y =
        padY +
        (1 - norm) * (height - padY * 2);
      return { x, y };
    });

    const path = points
      .map((pt, i) => `${i === 0 ? "M" : "L"} ${pt.x} ${pt.y}`)
      .join(" ");

    return (
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ display: "block" }}
      >
        <path
          d={path}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          opacity={0.9}
        />
      </svg>
    );
  }

  return (
    <div
      style={{
        padding: "14px 18px",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <div
        style={{
          fontSize: "0.9rem",
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          opacity: 0.8,
        }}
      >
        Stocks {loading && <span style={{ opacity: 0.6 }}>· updating…</span>}
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 6,
          fontSize: "0.9rem",
        }}
      >
        {quotes.map((q) => {
          const changeColor =
            q.changePercent == null
              ? "rgba(255,255,255,0.8)"
              : q.changePercent > 0
              ? "#38d996"
              : q.changePercent < 0
              ? "#ff7c7c"
              : "rgba(255,255,255,0.8)";

          const changeText =
            q.changePercent == null
              ? "—"
              : `${q.changePercent.toFixed(2)}%`;

          return (
            <div
              key={q.symbol}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              {/* left: label */}
              <div style={{ flex: 1, opacity: 0.9 }}>
                {q.label ?? q.symbol}
              </div>

              {/* middle: price + change */}
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 10,
                  fontVariantNumeric: "tabular-nums",
                  minWidth: 140,
                  justifyContent: "flex-end",
                }}
              >
                <span style={{ opacity: 0.9 }}>
                  {q.price != null ? `$${q.price.toFixed(2)}` : "—"}
                </span>
                <span
                  style={{
                    color: changeColor,
                    minWidth: 70,
                    textAlign: "right",
                  }}
                >
                  {changeText}
                </span>
              </div>

              {/* right: sparkline */}
              <div
                style={{
                  minWidth: 80,
                  display: "flex",
                  justifyContent: "flex-end",
                }}
              >
                {renderSparkline(q.symbol)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
