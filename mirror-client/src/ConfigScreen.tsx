// src/ConfigScreen.tsx
import React, { useEffect, useState } from "react";
import { API_BASE_URL, type MirrorConfig, type TodayItem } from "./config";


export const ConfigScreen: React.FC = () => {
  const [config, setConfig] = useState<MirrorConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API_BASE_URL}/config`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: MirrorConfig = await res.json();
        setConfig(data);
      } catch (err) {
        console.error("Failed to load config", err);
        setError("Could not load config from server.");
      }
    }
    load();
  }, []);

  if (!config) {
    return (
      <div
        style={{
          backgroundColor: "black",
          color: "white",
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily:
            "system-ui, -apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
        }}
      >
        {error ?? "Loading config..."}
      </div>
    );
  }

  const updateWidget = (key: keyof typeof config.widgets, value: boolean) => {
    setConfig({
      ...config,
      widgets: { ...config.widgets, [key]: value },
    });
  };

  const updateTodayItem = (index: number, field: keyof TodayItem, value: string) => {
    const items = [...config.todayItems];
    items[index] = { ...items[index], [field]: value };
    setConfig({ ...config, todayItems: items });
  };

  const addTodayItem = () => {
    setConfig({
      ...config,
      todayItems: [...config.todayItems, { label: "", time: null }],
    });
  };

  const deleteTodayItem = (index: number) => {
    const items = config.todayItems.filter((_, i) => i !== index);
    setConfig({ ...config, todayItems: items });
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      // const saved = await res.json(); // if you ever want to use it
      // setConfig(saved);
    } catch (err) {
      console.error("Failed to save config", err);
      setError("Error saving config.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#050505",
        color: "white",
        padding: "32px",
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
      }}
    >
      <h1 style={{ fontSize: "1.8rem", marginBottom: "8px" }}>Maison Mirror Admin</h1>
      <div style={{ opacity: 0.7, marginBottom: "24px" }}>
        Mirror: <code>localhost:5173</code> · Admin:{" "}
        <code>localhost:5173/?admin</code>
      </div>

      {/* Location */}
      <section style={{ marginBottom: "24px" }}>
        <h2 style={{ fontSize: "1.2rem", marginBottom: "8px" }}>Location</h2>
        <input
          type="text"
          value={config.location}
          onChange={(e) => setConfig({ ...config, location: e.target.value })}
          style={{
            padding: "8px 12px",
            borderRadius: "8px",
            border: "1px solid #333",
            backgroundColor: "#111",
            color: "white",
            minWidth: "260px",
          }}
          placeholder="e.g. San Diego"
        />
        <div style={{ fontSize: "0.8rem", opacity: 0.7, marginTop: "4px" }}>
          Used by weather + surf widgets.
        </div>
      </section>

      {/* Widget toggles */}
      <section style={{ marginBottom: "24px" }}>
        <h2 style={{ fontSize: "1.2rem", marginBottom: "8px" }}>Widgets</h2>
        <label style={{ display: "block", marginBottom: "4px" }}>
          <input
            type="checkbox"
            checked={config.widgets.clock}
            onChange={(e) => updateWidget("clock", e.target.checked)}
            style={{ marginRight: "6px" }}
          />
          Clock
        </label>
        <label style={{ display: "block", marginBottom: "4px" }}>
          <input
            type="checkbox"
            checked={config.widgets.weather}
            onChange={(e) => updateWidget("weather", e.target.checked)}
            style={{ marginRight: "6px" }}
          />
          Weather
        </label>
        <label style={{ display: "block", marginBottom: "4px" }}>
          <input
            type="checkbox"
            checked={config.widgets.today}
            onChange={(e) => updateWidget("today", e.target.checked)}
            style={{ marginRight: "6px" }}
          />
          Today list
        </label>
        {/* later: surf, Strava, etc */}
      </section>

      {/* Today items */}
      <section style={{ marginBottom: "32px" }}>
        <h2 style={{ fontSize: "1.2rem", marginBottom: "8px" }}>Today Items</h2>
        <div style={{ fontSize: "0.85rem", opacity: 0.7, marginBottom: "8px" }}>
          These show in the bottom “Today” card.
        </div>
        {config.todayItems.map((item, idx) => (
          <div
            key={idx}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "6px",
            }}
          >
            <input
              type="text"
              value={item.label}
              onChange={(e) => updateTodayItem(idx, "label", e.target.value)}
              style={{
                flex: 1,
                padding: "6px 10px",
                borderRadius: "8px",
                border: "1px solid #333",
                backgroundColor: "#111",
                color: "white",
              }}
              placeholder={`Item ${idx + 1}`}
            />
            <button
              onClick={() => deleteTodayItem(idx)}
              style={{
                padding: "4px 10px",
                borderRadius: "8px",
                border: "1px solid #333",
                backgroundColor: "#220000",
                color: "#ffaaaa",
                cursor: "pointer",
              }}
            >
              ✕
            </button>
          </div>
        ))}

        <button
          onClick={addTodayItem}
          style={{
            marginTop: "8px",
            padding: "6px 12px",
            borderRadius: "999px",
            border: "1px solid #444",
            backgroundColor: "#111",
            color: "white",
            cursor: "pointer",
          }}
        >
          + Add item
        </button>
      </section>

      {/* Save button */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: "8px 18px",
            borderRadius: "999px",
            border: "none",
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.9), rgba(200,200,200,0.7))",
            color: "black",
            fontWeight: 600,
            cursor: "pointer",
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? "Saving..." : "Save changes"}
        </button>
        {error && (
          <span style={{ color: "#ff7777", fontSize: "0.9rem" }}>{error}</span>
        )}
      </div>
    </div>
  );
};

