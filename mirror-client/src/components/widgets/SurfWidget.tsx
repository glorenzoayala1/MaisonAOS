import React, { useEffect, useState } from "react";
import { API_BASE_URL } from "../../config";

type SurfConditions = {
  spot: string;
  waveHeightFt: number;
  conditions: string;
  wind: string;
  symbol: string;
};

export const SurfWidget: React.FC = () => {
  const [data, setData] = useState<SurfConditions | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API_BASE_URL}/surf`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json: SurfConditions = await res.json();
        setData(json);
      } catch (err) {
        console.error("Surf fetch failed", err);
        setError("Surf data unavailable");
      }
    }
    load();
  }, []);

  if (error) {
    return (
      <div
        style={{
          fontFamily: "var(--font-main)",
          fontSize: "0.9rem",
          lineHeight: 1.4,
        }}
      >
        {error}
      </div>
    );
  }

  if (!data) {
    return (
      <div
        style={{
          fontFamily: "var(--font-main)",
          fontSize: "0.9rem",
          lineHeight: 1.4,
        }}
      >
        Loading surf...
      </div>
    );
  }

  return (
    <div
      style={{
        fontFamily: "var(--font-main)",
        fontSize: "0.9rem",
        lineHeight: 1.4,
      }}
    >
      <div style={{ marginBottom: 4 }}>{data.spot}</div>
      <div
        style={{
          color: "var(--color-accent)", // <- accent on the core stat
        }}
      >
        {data.symbol} {data.waveHeightFt.toFixed(1)} ft
      </div>
      <div>{data.conditions}</div>
      <div>Wind: {data.wind}</div>
    </div>
  );
};
