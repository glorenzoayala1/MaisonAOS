// mirror-client/src/AdminScreen.tsx
import React, { useEffect, useState } from "react";
import { API_BASE_URL, defaultLayouts, THEME_PRESETS } from "./config";
import type {
  MirrorConfig,
  TodayItem,
  WidgetKey,
  FontStyle,
  AccentColor,
  CardStyle,
  AtmosphereMode,
  ThemeName,
  VoicePreset,
  PositionPreset,
  SizePreset,
} from "./config";

// ----- static options -----

const FONT_OPTIONS: { value: FontStyle; label: string }[] = [
  { value: "sans", label: "Sans – clean" },
  { value: "serif", label: "Serif – elegant" },
  { value: "futuristic", label: "Futuristic" },
];

const ATMOSPHERE_OPTIONS: { value: AtmosphereMode; label: string }[] = [
  { value: "off", label: "Off (pure black)" },
  { value: "edgesStatic", label: "Static edge glow" },
  { value: "timeOfDay", label: "Time-of-day glow" },
];

const ACCENT_OPTIONS: { value: AccentColor; label: string }[] = [
  { value: "gold", label: "Gold" },
  { value: "silver", label: "Silver" },
  { value: "white", label: "White" },
];

const CARD_STYLE_OPTIONS: { value: CardStyle; label: string }[] = [
  { value: "glass", label: "Glass" },
  { value: "outline", label: "Outline" },
  { value: "minimal", label: "Minimal (no cards)" },
];

const THEME_OPTIONS: { value: ThemeName; label: string }[] = [
  { value: "maisonNoir", label: "Maison Noir" },
  { value: "maisonAzure", label: "Maison Azure" },
  { value: "maisonChrome", label: "Maison Chrome" },
  { value: "maisonEarth", label: "Maison Earth" },
  { value: "custom", label: "Custom" },
];

const VOICE_OPTIONS: { value: VoicePreset; label: string }[] = [
  { value: "verse", label: "Verse (warm, neutral)" },
  { value: "echo", label: "Echo (deeper)" },
  { value: "alloy", label: "Alloy (neutral)" },
  { value: "sage", label: "Sage (calm)" },
];

const QUOTE_CATEGORIES = [
  "wisdom", "philosophy", "life", "truth", "inspirational",
  "relationships", "love", "faith", "humor", "success",
  "courage", "happiness", "art", "writing", "fear",
  "nature", "time", "freedom", "death", "leadership"
];

const NEWS_CATEGORIES = [
  "technology",
  "business",
  "sports",
  "general",      // World/general news
  "health",
  "science",
  "entertainment",
];

const POSITION_OPTIONS: { value: PositionPreset; label: string }[] = [
  { value: "topLeft", label: "Top Left" },
  { value: "topCenter", label: "Top Center" },
  { value: "topRight", label: "Top Right" },
  { value: "middleLeft", label: "Middle Left" },
  { value: "middleCenter", label: "Middle Center" },
  { value: "middleRight", label: "Middle Right" },
  { value: "bottomLeft", label: "Bottom Left" },
  { value: "bottomCenter", label: "Bottom Center" },
  { value: "bottomRight", label: "Bottom Right" },
];

const SIZE_OPTIONS: { value: SizePreset; label: string }[] = [
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "large", label: "Large" },
];

const WIDGET_LABELS: Record<WidgetKey, string> = {
  clock: "Clock",
  weather: "Weather",
  today: "Today List",
  surf: "Surf",
  news: "News",
  stocks: "Stocks",
  quotes: "Quotes",
  alarms: "Alarms",
};

const WIDGET_DESCRIPTIONS: Record<WidgetKey, string> = {
  clock: "Time and date anchor for the mirror.",
  weather: "Local conditions and temperature snapshot.",
  today: "Your daily checklist / priorities.",
  surf: "Quick surf read for your home break.",
  news: "Headlines at a glance.",
  stocks: "Compact watchlist summary.",
  quotes: "Daily inspiration from curated quotes.",
  alarms: "Wake-up and reminder alarms with voice greetings.",
};

const WIDGET_BADGES: Partial<Record<WidgetKey, string>> = {
  news: "API setup pending",
  stocks: "API setup pending",
};

const ALL_WIDGET_KEYS: WidgetKey[] = [
  "clock",
  "weather",
  "today",
  "surf",
  "news",
  "stocks",
  "quotes",
  "alarms",
];

// ---------------------- COMPONENT ----------------------

export const AdminScreen: React.FC = () => {
  const [config, setConfig] = useState<MirrorConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // MaisonOS mode (frontend)
  const [osMode, setOsMode] = useState<"default" | "focus" | "market">(
    "default",
  );

  // ---- Load config from backend ----
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API_BASE_URL}/config`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: MirrorConfig = await res.json();

        const displayFromServer: any = data.display ?? {};

        setConfig({
          ...data,
          display: {
            theme: displayFromServer.theme ?? "maisonNoir",
            fontStyle: displayFromServer.fontStyle ?? "sans",
            accentColor: displayFromServer.accentColor ?? "gold",
            showBorders:
              displayFromServer.showBorders !== undefined
                ? displayFromServer.showBorders
                : true,
            cardStyle: displayFromServer.cardStyle ?? "glass",
            backgroundMode: displayFromServer.backgroundMode ?? "timeOfDay",
            voicePreset: displayFromServer.voicePreset ?? "verse",
            sleepMode: displayFromServer.sleepMode ?? false,
            ambientIntensity:
              displayFromServer.ambientIntensity !== undefined
                ? displayFromServer.ambientIntensity
                : 0.85,
            layoutPreset: displayFromServer.layoutPreset ?? "classic",
          },
          layouts: data.layouts ?? defaultLayouts,
        });
      } catch (err) {
        console.error("Failed to load config", err);
        setError("Could not load config from server.");
      }
    }
    load();
  }, []);

  // ---- Load current OS mode from backend ----
  useEffect(() => {
    async function loadMode() {
      try {
        const res = await fetch(`${API_BASE_URL}/os/mode`);
        if (!res.ok) return;
        const data = await res.json();
        setOsMode((data.mode as "default" | "focus" | "market") ?? "default");
      } catch (e) {
        console.error("[Admin] failed to load os mode", e);
      }
    }
    loadMode();
  }, []);

  async function handleModeChange(next: "default" | "focus" | "market") {
    try {
      const res = await fetch(`${API_BASE_URL}/os/mode?mode=${next}`, {
        method: "POST",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const cfg: MirrorConfig = await res.json();
      setConfig(cfg);
      setOsMode(next);
    } catch (e) {
      console.error("[Admin] failed to set os mode", e);
    }
  }

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

  const updateWidget = (key: WidgetKey, value: boolean) => {
    setConfig({
      ...config,
      widgets: { ...config.widgets, [key]: value },
    });
  };

  const updateTodayItem = (
    index: number,
    field: keyof TodayItem,
    value: string,
  ) => {
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

  const updateDisplay = (patch: Partial<MirrorConfig["display"]>) => {
    const touchedThemeDirectly = patch.theme !== undefined;
    const nextDisplay = { ...config.display, ...patch };

    setConfig({
      ...config,
      display: {
        ...nextDisplay,
        theme: touchedThemeDirectly ? nextDisplay.theme : "custom",
      },
    });
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
    } catch (err) {
      console.error("Failed to save config", err);
      setError("Error saving config.");
    } finally {
      setSaving(false);
    }
  };

  const isSleeping = !!(config.display as any).sleepMode;

  // ---- UI ----

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#020510",
        color: "white",
        padding: "32px",
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
      }}
    >
      <h1 style={{ fontSize: "1.8rem", marginBottom: "8px" }}>
        Maison Mirror – Admin
      </h1>
      <div style={{ opacity: 0.7, marginBottom: "24px" }}>
        Mirror: <code>/</code> · Admin: <code>/admin</code>
      </div>

      {/* Sleep Mode Control */}
      <section style={{ marginBottom: "28px" }}>
        <h2 style={{ fontSize: "1.2rem", marginBottom: "8px" }}>
          Display Power
        </h2>
        <p style={{ fontSize: "0.9rem", opacity: 0.7, marginBottom: "10px" }}>
          Put the mirror to sleep or wake it up. Sleep mode shows a black screen
          while keeping all background processes running.
        </p>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => updateDisplay({ sleepMode: false })}
            style={{
              padding: "8px 16px",
              borderRadius: 999,
              border: !isSleeping
                ? "1px solid rgba(255,255,255,0.9)"
                : "1px solid rgba(255,255,255,0.3)",
              background: !isSleeping
                ? "linear-gradient(135deg, rgba(120,220,140,0.35), rgba(80,180,100,0.25))"
                : "rgba(0,0,0,0.55)",
              color: "#fff",
              fontSize: "0.85rem",
              fontWeight: 500,
              cursor: "pointer",
              opacity: !isSleeping ? 1 : 0.85,
              boxShadow: !isSleeping
                ? "0 0 16px rgba(100,220,120,0.4)"
                : "none",
              transition: "all 160ms ease",
            }}
          >
            ✓ Awake
          </button>

          <button
            onClick={() => updateDisplay({ sleepMode: true })}
            style={{
              padding: "8px 16px",
              borderRadius: 999,
              border: isSleeping
                ? "1px solid rgba(255,255,255,0.9)"
                : "1px solid rgba(255,255,255,0.3)",
              background: isSleeping
                ? "linear-gradient(135deg, rgba(100,100,140,0.35), rgba(60,60,100,0.25))"
                : "rgba(0,0,0,0.55)",
              color: "#fff",
              fontSize: "0.85rem",
              fontWeight: 500,
              cursor: "pointer",
              opacity: isSleeping ? 1 : 0.85,
              boxShadow: isSleeping
                ? "0 0 16px rgba(80,80,140,0.4)"
                : "none",
              transition: "all 160ms ease",
            }}
          >
            ☾ Sleep Mode
          </button>
        </div>

        {/* Power Off Button */}
        <div style={{ marginTop: "16px" }}>
          <button
            onClick={async () => {
              if (window.confirm("Are you sure you want to power off the mirror? This will shut down the Raspberry Pi.")) {
                try {
                  await fetch(`${API_BASE_URL}/api/system/shutdown`, {
                    method: "POST",
                  });
                  alert("Shutdown initiated. The mirror will power off in a few seconds.");
                } catch (err) {
                  console.error("Shutdown failed:", err);
                  alert("Failed to initiate shutdown. Check console for details.");
                }
              }
            }}
            style={{
              padding: "10px 18px",
              borderRadius: "8px",
              border: "1px solid rgba(255,100,100,0.5)",
              background: "rgba(180,50,50,0.2)",
              color: "rgba(255,150,150,1)",
              fontSize: "0.85rem",
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 160ms ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(200,60,60,0.3)";
              e.currentTarget.style.borderColor = "rgba(255,120,120,0.7)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(180,50,50,0.2)";
              e.currentTarget.style.borderColor = "rgba(255,100,100,0.5)";
            }}
          >
            ⏻ Power Off Mirror
          </button>
        </div>
      </section>

      {/* API Keys */}
      <section style={{ marginBottom: "32px" }}>
        <h2 style={{ fontSize: "1.2rem", marginBottom: "8px" }}>
          API Keys
        </h2>
        <div style={{ fontSize: "0.85rem", opacity: 0.7, marginBottom: "12px" }}>
          Configure API keys for mirror services. Keys are stored in config and require server restart to apply.
        </div>

        {/* Warning banner */}
        <div
          style={{
            padding: "10px 14px",
            borderRadius: "8px",
            border: "1px solid rgba(255,180,50,0.5)",
            background: "rgba(255,150,50,0.15)",
            color: "rgba(255,200,100,1)",
            fontSize: "0.85rem",
            marginBottom: "16px",
            lineHeight: 1.5,
          }}
        >
          ⚠️ After updating API keys, you must restart the mirror server for changes to take effect.
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {/* OpenAI API Key */}
          <div>
            <label
              htmlFor="openai-key"
              style={{ fontSize: "0.9rem", display: "block", marginBottom: "6px", opacity: 0.9 }}
            >
              OpenAI API Key (Voice/Zo)
            </label>
            <input
              id="openai-key"
              type="password"
              placeholder="sk-proj-..."
              value={config.apiKeys?.OPENAI_API_KEY || ""}
              onChange={(e) =>
                setConfig({
                  ...config,
                  apiKeys: { ...config.apiKeys, OPENAI_API_KEY: e.target.value },
                })
              }
              style={{
                width: "100%",
                maxWidth: "500px",
                padding: "10px 14px",
                borderRadius: "8px",
                border: "1px solid rgba(100,100,100,0.4)",
                background: "rgba(20,20,30,0.6)",
                color: "#fff",
                fontSize: "0.85rem",
                fontFamily: "monospace",
              }}
            />
          </div>

          {/* Weather API Key */}
          <div>
            <label
              htmlFor="weather-key"
              style={{ fontSize: "0.9rem", display: "block", marginBottom: "6px", opacity: 0.9 }}
            >
              OpenWeather API Key (Weather)
            </label>
            <input
              id="weather-key"
              type="password"
              placeholder="Your OpenWeather API key"
              value={config.apiKeys?.OPENWEATHER_API_KEY || ""}
              onChange={(e) =>
                setConfig({
                  ...config,
                  apiKeys: { ...config.apiKeys, OPENWEATHER_API_KEY: e.target.value },
                })
              }
              style={{
                width: "100%",
                maxWidth: "500px",
                padding: "10px 14px",
                borderRadius: "8px",
                border: "1px solid rgba(100,100,100,0.4)",
                background: "rgba(20,20,30,0.6)",
                color: "#fff",
                fontSize: "0.85rem",
                fontFamily: "monospace",
              }}
            />
          </div>

          {/* News API Key */}
          <div>
            <label
              htmlFor="news-key"
              style={{ fontSize: "0.9rem", display: "block", marginBottom: "6px", opacity: 0.9 }}
            >
              News API Key (News)
            </label>
            <input
              id="news-key"
              type="password"
              placeholder="Your NewsAPI.org key"
              value={config.apiKeys?.NEWS_API_KEY || ""}
              onChange={(e) =>
                setConfig({
                  ...config,
                  apiKeys: { ...config.apiKeys, NEWS_API_KEY: e.target.value },
                })
              }
              style={{
                width: "100%",
                maxWidth: "500px",
                padding: "10px 14px",
                borderRadius: "8px",
                border: "1px solid rgba(100,100,100,0.4)",
                background: "rgba(20,20,30,0.6)",
                color: "#fff",
                fontSize: "0.85rem",
                fontFamily: "monospace",
              }}
            />
          </div>

          {/* Quotes API Key */}
          <div>
            <label
              htmlFor="quotes-key"
              style={{ fontSize: "0.9rem", display: "block", marginBottom: "6px", opacity: 0.9 }}
            >
              API Ninjas Key (Quotes)
            </label>
            <input
              id="quotes-key"
              type="password"
              placeholder="Your API Ninjas key"
              value={config.apiKeys?.API_NINJAS_KEY || ""}
              onChange={(e) =>
                setConfig({
                  ...config,
                  apiKeys: { ...config.apiKeys, API_NINJAS_KEY: e.target.value },
                })
              }
              style={{
                width: "100%",
                maxWidth: "500px",
                padding: "10px 14px",
                borderRadius: "8px",
                border: "1px solid rgba(100,100,100,0.4)",
                background: "rgba(20,20,30,0.6)",
                color: "#fff",
                fontSize: "0.85rem",
                fontFamily: "monospace",
              }}
            />
          </div>

          {/* Stocks API Key */}
          <div>
            <label
              htmlFor="stocks-key"
              style={{ fontSize: "0.9rem", display: "block", marginBottom: "6px", opacity: 0.9 }}
            >
              Finnhub API Key (Stocks)
            </label>
            <input
              id="stocks-key"
              type="password"
              placeholder="Your Finnhub API key"
              value={config.apiKeys?.FINNHUB_API_KEY || ""}
              onChange={(e) =>
                setConfig({
                  ...config,
                  apiKeys: { ...config.apiKeys, FINNHUB_API_KEY: e.target.value },
                })
              }
              style={{
                width: "100%",
                maxWidth: "500px",
                padding: "10px 14px",
                borderRadius: "8px",
                border: "1px solid rgba(100,100,100,0.4)",
                background: "rgba(20,20,30,0.6)",
                color: "#fff",
                fontSize: "0.85rem",
                fontFamily: "monospace",
              }}
            />
          </div>

          {/* Porcupine API Key */}
          <div>
            <label
              htmlFor="porcupine-key"
              style={{ fontSize: "0.9rem", display: "block", marginBottom: "6px", opacity: 0.9 }}
            >
              Porcupine API Key (Wake Word)
            </label>
            <input
              id="porcupine-key"
              type="password"
              placeholder="Your Picovoice Porcupine key"
              value={config.apiKeys?.PORCUPINE_API_KEY || ""}
              onChange={(e) =>
                setConfig({
                  ...config,
                  apiKeys: { ...config.apiKeys, PORCUPINE_API_KEY: e.target.value },
                })
              }
              style={{
                width: "100%",
                maxWidth: "500px",
                padding: "10px 14px",
                borderRadius: "8px",
                border: "1px solid rgba(100,100,100,0.4)",
                background: "rgba(20,20,30,0.6)",
                color: "#fff",
                fontSize: "0.85rem",
                fontFamily: "monospace",
              }}
            />
          </div>
        </div>
      </section>

      {/* MaisonOS mode pills */}
      <section style={{ marginBottom: "24px" }}>
        <h2 style={{ fontSize: "1.2rem", marginBottom: "6px" }}>
          MaisonOS Mode
        </h2>
        <p style={{ fontSize: "0.9rem", opacity: 0.7, marginBottom: "10px" }}>
          Choose how Zo shapes the mirror: calm focus, market intel, or
          baseline.
        </p>

        <div style={{ display: "flex", gap: 8 }}>
          {(["default", "focus", "market"] as const).map((m) => (
            <button
              key={m}
              onClick={() => handleModeChange(m)}
              style={{
                padding: "6px 12px",
                borderRadius: 999,
                border:
                  osMode === m
                    ? "1px solid rgba(255,255,255,0.9)"
                    : "1px solid rgba(255,255,255,0.3)",
                background:
                  osMode === m
                    ? "rgba(255,255,255,0.16)"
                    : "rgba(0,0,0,0.55)",
                color: "#fff",
                fontSize: "0.8rem",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                cursor: "pointer",
                opacity: osMode === m ? 1 : 0.85,
              }}
            >
              {m === "default" && "Default"}
              {m === "focus" && "Focus"}
              {m === "market" && "Market"}
            </button>
          ))}
        </div>
      </section>

      {/* Location */}
      <section style={{ marginBottom: "24px" }}>
        <h2 style={{ fontSize: "1.2rem", marginBottom: "8px" }}>Location</h2>
        <input
          type="text"
          value={config.location}
          onChange={(e) =>
            setConfig({ ...config, location: e.target.value })
          }
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

      {/* Display style */}
      <section style={{ marginBottom: "28px" }}>
        <h2 style={{ fontSize: "1.2rem", marginBottom: "8px" }}>
          Display Style
        </h2>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "16px",
            alignItems: "center",
          }}
        >
          {/* Theme */}
          <label style={{ fontSize: "0.9rem" }}>
            <div style={{ marginBottom: "4px" }}>Theme</div>
            <select
              value={config.display.theme}
              onChange={(e) => {
                const nextTheme = e.target.value as ThemeName;
                const preset = THEME_PRESETS[nextTheme];

                setConfig({
                  ...config,
                  display: {
                    ...config.display,
                    theme: nextTheme,
                    ...preset,
                  },
                });
              }}
              style={{
                padding: "8px 10px",
                borderRadius: "10px",
                border: "1px solid #333",
                backgroundColor: "#111",
                color: "white",
                minWidth: "180px",
              }}
            >
              {THEME_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          {/* Font */}
          <label style={{ fontSize: "0.9rem" }}>
            <div style={{ marginBottom: "4px" }}>Font</div>
            <select
              value={config.display.fontStyle}
              onChange={(e) =>
                updateDisplay({ fontStyle: e.target.value as FontStyle })
              }
              style={{
                padding: "8px 10px",
                borderRadius: "10px",
                border: "1px solid #333",
                backgroundColor: "#111",
                color: "white",
                minWidth: "180px",
              }}
            >
              {FONT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          {/* Accent color */}
          <label style={{ fontSize: "0.9rem" }}>
            <div style={{ marginBottom: "4px" }}>Accent color</div>
            <select
              value={config.display.accentColor}
              onChange={(e) =>
                updateDisplay({ accentColor: e.target.value as AccentColor })
              }
              style={{
                padding: "8px 10px",
                borderRadius: "10px",
                border: "1px solid #333",
                backgroundColor: "#111",
                color: "white",
                minWidth: "140px",
              }}
            >
              {ACCENT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          {/* Voice preset */}
          <label style={{ fontSize: "0.9rem" }}>
            <div style={{ marginBottom: "4px" }}>Zo's voice</div>
            <select
              value={config.display.voicePreset}
              onChange={(e) =>
                updateDisplay({ voicePreset: e.target.value as VoicePreset })
              }
              style={{
                padding: "8px 10px",
                borderRadius: "10px",
                border: "1px solid #333",
                backgroundColor: "#111",
                color: "white",
                minWidth: "200px",
              }}
            >
              {VOICE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          {/* Atmosphere / Background mode */}
          <label style={{ fontSize: "0.9rem" }}>
            <div style={{ marginBottom: "4px" }}>Atmosphere</div>
            <select
              value={config.display.backgroundMode}
              onChange={(e) =>
                updateDisplay({
                  backgroundMode: e.target.value as AtmosphereMode,
                })
              }
              style={{
                padding: "8px 10px",
                borderRadius: "10px",
                border: "1px solid #333",
                backgroundColor: "#111",
                color: "white",
                minWidth: "180px",
              }}
            >
              {ATMOSPHERE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          {/* Show borders toggle */}
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "0.9rem",
              marginLeft: "8px",
            }}
          >
            <input
              type="checkbox"
              checked={config.display.showBorders}
              onChange={(e) =>
                updateDisplay({ showBorders: e.target.checked })
              }
            />
            Show card borders
          </label>

          {/* Card style */}
          <label style={{ fontSize: "0.9rem" }}>
            <div style={{ marginBottom: "4px" }}>Card style</div>
            <select
              value={config.display.cardStyle}
              onChange={(e) =>
                updateDisplay({ cardStyle: e.target.value as CardStyle })
              }
              style={{
                padding: "8px 10px",
                borderRadius: "10px",
                border: "1px solid #333",
                backgroundColor: "#111",
                color: "white",
                minWidth: "160px",
              }}
            >
              {CARD_STYLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {/* Widgets */}
      <section style={{ marginBottom: "32px" }}>
        <h2 style={{ fontSize: "1.2rem", marginBottom: "6px" }}>Widgets</h2>
        <div
          style={{
            fontSize: "0.85rem",
            opacity: 0.7,
            marginBottom: "14px",
          }}
        >
          Choose which modules appear on the mirror. Think of this as the
          control panel for your morning briefing.
        </div>

        <div
          style={{
            borderRadius: 18,
            border: "1px solid rgba(110,130,210,0.5)",
            background:
              "radial-gradient(circle at top left, rgba(34,47,107,0.55), rgba(5,8,20,0.98))",
            overflow: "hidden",
          }}
        >
          {ALL_WIDGET_KEYS.map((key, idx) => {
            const enabled = !!config.widgets[key];
            const desc = WIDGET_DESCRIPTIONS[key];
            const badge = WIDGET_BADGES[key];

            const isLast = idx === ALL_WIDGET_KEYS.length - 1;

            return (
              <div
                key={key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 16,
                  padding: "10px 16px",
                  borderBottom: isLast
                    ? "none"
                    : "1px solid rgba(80,96,160,0.55)",
                  backdropFilter: "blur(10px)",
                }}
              >
                {/* Left: name + description */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 3,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.95rem",
                        fontWeight: 500,
                      }}
                    >
                      {WIDGET_LABELS[key]}
                    </span>
                    {badge && (
                      <span
                        style={{
                          fontSize: "0.7rem",
                          textTransform: "uppercase",
                          letterSpacing: "0.12em",
                          padding: "3px 8px",
                          borderRadius: 999,
                          border: "1px solid rgba(200,200,255,0.3)",
                          backgroundColor: "rgba(16,20,50,0.9)",
                          opacity: 0.85,
                        }}
                      >
                        {badge}
                      </span>
                    )}
                  </div>
                  <span
                    style={{
                      fontSize: "0.8rem",
                      opacity: 0.7,
                    }}
                  >
                    {desc}
                  </span>
                </div>

                {/* Right: pill toggle */}
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => updateWidget(key, e.target.checked)}
                    style={{
                      position: "absolute",
                      opacity: 0,
                      pointerEvents: "none",
                    }}
                  />

                  <button
                    type="button"
                    onClick={() => updateWidget(key, !enabled)}
                    style={{
                      padding: "4px 5px",
                      borderRadius: 999,
                      border: "1px solid rgba(130,150,230,0.6)",
                      cursor: "pointer",
                      minWidth: 70,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: enabled ? "flex-end" : "flex-start",
                      background: enabled
                        ? "linear-gradient(135deg, rgba(255,255,255,0.95), rgba(190,210,255,0.9))"
                        : "rgba(10,14,35,0.95)",
                      boxShadow: enabled
                        ? "0 0 12px rgba(180,200,255,0.45)"
                        : "none",
                      transition:
                        "background 160ms ease, box-shadow 160ms ease, justify-content 160ms ease",
                    }}
                  >
                    <span
                      style={{
                        height: 18,
                        width: 18,
                        borderRadius: "50%",
                        backgroundColor: enabled
                          ? "#020510"
                          : "rgba(180,195,255,0.8)",
                      }}
                    />
                  </button>

                  <span
                    style={{
                      fontSize: "0.78rem",
                      opacity: 0.75,
                      minWidth: 36,
                      textAlign: "right",
                    }}
                  >
                    {enabled ? "On" : "Off"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Today items */}
      <section style={{ marginBottom: "32px" }}>
        <h2 style={{ fontSize: "1.2rem", marginBottom: "8px" }}>Today Items</h2>
        <div style={{ fontSize: "0.85rem", opacity: 0.7, marginBottom: "8px" }}>
          These show in the "Today" widget.
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
              onChange={(e) =>
                updateTodayItem(idx, "label", e.target.value)
              }
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
              ×
            </button>
          </div>
        ))}

        <button
          onClick={addTodayItem}
          style={{
            marginTop: "8px",
            padding: "6px 14px",
            borderRadius: "999px",
            border: "1px solid #333",
            backgroundColor: "#111",
            color: "white",
            cursor: "pointer",
          }}
        >
          + Add item
        </button>
      </section>

      {/* Quote Categories */}
      <section style={{ marginBottom: "32px" }}>
        <h2 style={{ fontSize: "1.2rem", marginBottom: "8px" }}>
          Quote Categories
        </h2>
        <div style={{ fontSize: "0.85rem", opacity: 0.7, marginBottom: "12px" }}>
          Select which categories to include in your daily quotes rotation.
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
            gap: "8px",
          }}
        >
          {QUOTE_CATEGORIES.map((cat) => {
            const selected = (config.quotesCategories || []).includes(cat);

            return (
              <label
                key={cat}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: selected
                    ? "1px solid rgba(180,200,255,0.6)"
                    : "1px solid rgba(100,100,100,0.4)",
                  background: selected
                    ? "rgba(120,150,255,0.2)"
                    : "rgba(20,20,30,0.6)",
                  cursor: "pointer",
                  transition: "all 160ms ease",
                }}
                onClick={() => {
                  const current = config.quotesCategories || [];
                  const updated = selected
                    ? current.filter((c) => c !== cat)
                    : [...current, cat];
                  setConfig({ ...config, quotesCategories: updated });
                }}
              >
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={() => {}}
                  style={{ margin: 0 }}
                />
                <span style={{ fontSize: "0.85rem", textTransform: "capitalize" }}>
                  {cat}
                </span>
              </label>
            );
          })}
        </div>
      </section>

      {/* News Categories */}
      <section style={{ marginBottom: "32px" }}>
        <h2 style={{ fontSize: "1.2rem", marginBottom: "8px" }}>
          News Categories
        </h2>
        <div style={{ fontSize: "0.85rem", opacity: 0.7, marginBottom: "12px" }}>
          Select which news categories to display. Articles from all selected categories will be combined.
        </div>

        {/* Rate limit warning */}
        {(config.newsCategories || []).length > 3 && (
          <div
            style={{
              padding: "10px 14px",
              borderRadius: "8px",
              border: "1px solid rgba(255,180,50,0.5)",
              background: "rgba(255,150,50,0.15)",
              color: "rgba(255,200,100,1)",
              fontSize: "0.85rem",
              marginBottom: "12px",
              lineHeight: 1.5,
            }}
          >
            ⚠️ Warning: Selecting more than 3 categories may exceed NewsAPI rate limits (100 requests/day).
            Consider reducing categories if you experience issues.
          </div>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
            gap: "8px",
          }}
        >
          {NEWS_CATEGORIES.map((cat) => {
            const selected = (config.newsCategories || []).includes(cat);

            return (
              <label
                key={cat}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: selected
                    ? "1px solid rgba(180,200,255,0.6)"
                    : "1px solid rgba(100,100,100,0.4)",
                  background: selected
                    ? "rgba(120,150,255,0.2)"
                    : "rgba(20,20,30,0.6)",
                  cursor: "pointer",
                  transition: "all 160ms ease",
                }}
                onClick={() => {
                  const current = config.newsCategories || [];
                  const updated = selected
                    ? current.filter((c) => c !== cat)
                    : [...current, cat];
                  setConfig({ ...config, newsCategories: updated });
                }}
              >
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={() => {}}
                  style={{ margin: 0 }}
                />
                <span style={{ fontSize: "0.85rem", textTransform: "capitalize" }}>
                  {cat}
                </span>
              </label>
            );
          })}
        </div>
      </section>

      {/* Alarms */}
      <section style={{ marginBottom: "32px" }}>
        <h2 style={{ fontSize: "1.2rem", marginBottom: "8px" }}>
          Alarms
        </h2>
        <div style={{ fontSize: "0.85rem", opacity: 0.7, marginBottom: "12px" }}>
          Set wake-up alarms and reminders.
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {(config.alarmItems || []).map((alarm, idx) => (
            <div
              key={alarm.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid rgba(100,100,100,0.4)",
                background: "rgba(20,20,30,0.6)",
              }}
            >
              <input
                type="checkbox"
                checked={alarm.enabled}
                onChange={(e) => {
                  const updated = [...(config.alarmItems || [])];
                  updated[idx] = { ...updated[idx], enabled: e.target.checked };
                  setConfig({ ...config, alarmItems: updated });
                }}
                style={{ width: "18px", height: "18px" }}
              />

              <input
                type="time"
                value={alarm.time}
                onChange={(e) => {
                  const updated = [...(config.alarmItems || [])];
                  updated[idx] = { ...updated[idx], time: e.target.value };
                  setConfig({ ...config, alarmItems: updated });
                }}
                style={{
                  width: "120px",
                  padding: "6px 10px",
                  borderRadius: "6px",
                  border: "1px solid rgba(100,100,100,0.4)",
                  background: "rgba(10,10,15,0.8)",
                  color: "white",
                  fontSize: "0.9rem",
                }}
              />

              <input
                type="text"
                placeholder="Label (optional)"
                value={alarm.label || ""}
                onChange={(e) => {
                  const updated = [...(config.alarmItems || [])];
                  updated[idx] = { ...updated[idx], label: e.target.value };
                  setConfig({ ...config, alarmItems: updated });
                }}
                style={{
                  flex: 1,
                  padding: "6px 10px",
                  borderRadius: "6px",
                  border: "1px solid rgba(100,100,100,0.4)",
                  background: "rgba(10,10,15,0.8)",
                  color: "white",
                  fontSize: "0.9rem",
                }}
              />

              <button
                onClick={() => {
                  const updated = (config.alarmItems || []).filter((_, i) => i !== idx);
                  setConfig({ ...config, alarmItems: updated });
                }}
                style={{
                  padding: "6px 12px",
                  borderRadius: "6px",
                  border: "1px solid rgba(255,50,50,0.4)",
                  backgroundColor: "rgba(255,50,50,0.1)",
                  color: "rgba(255,100,100,0.9)",
                  cursor: "pointer",
                  fontSize: "0.85rem",
                }}
              >
                Delete
              </button>
            </div>
          ))}

          <button
            onClick={() => {
              const newAlarm = {
                id: `alarm-${Date.now()}`,
                time: "07:00",
                enabled: true,
                days: [],
                label: "",
                soundEnabled: true,
              };
              setConfig({
                ...config,
                alarmItems: [...(config.alarmItems || []), newAlarm],
              });
            }}
            style={{
              padding: "8px 14px",
              borderRadius: "8px",
              border: "1px solid rgba(100,150,255,0.4)",
              backgroundColor: "rgba(100,150,255,0.1)",
              color: "rgba(150,180,255,0.9)",
              cursor: "pointer",
              fontSize: "0.9rem",
            }}
          >
            + Add Alarm
          </button>
        </div>
      </section>

      {/* Widget Positions */}
      <section style={{ marginBottom: "32px" }}>
        <h2 style={{ fontSize: "1.2rem", marginBottom: "8px" }}>
          Widget Positions
        </h2>
        <div style={{ fontSize: "0.85rem", opacity: 0.7, marginBottom: "12px" }}>
          Configure where each widget appears on the mirror grid.
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "8px",
        }}>
          {ALL_WIDGET_KEYS.map((widgetKey) => {
            const layout = config.layouts?.[widgetKey] || defaultLayouts[widgetKey];
            const currentPosition = layout?.position || "topLeft";
            const currentSize = layout?.size || "medium";

            return (
              <div
                key={widgetKey}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  border: "1px solid rgba(100,100,100,0.3)",
                  background: "rgba(20,20,30,0.5)",
                }}
              >
                <div style={{
                  fontSize: "0.85rem",
                  fontWeight: 500,
                  minWidth: "70px",
                  opacity: 0.9,
                }}>
                  {WIDGET_LABELS[widgetKey]}
                </div>

                <select
                  value={currentPosition}
                  onChange={(e) => {
                    const newPosition = e.target.value as PositionPreset;
                    const currentLayout = config.layouts?.[widgetKey] || defaultLayouts[widgetKey];
                    setConfig({
                      ...config,
                      layouts: {
                        ...defaultLayouts,
                        ...config.layouts,
                        [widgetKey]: {
                          ...currentLayout,
                          position: newPosition,
                        },
                      },
                    });
                  }}
                  style={{
                    flex: 1,
                    padding: "4px 8px",
                    borderRadius: "4px",
                    border: "1px solid rgba(100,100,100,0.4)",
                    background: "rgba(10,10,15,0.8)",
                    color: "white",
                    fontSize: "0.8rem",
                  }}
                >
                  {POSITION_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>

                <select
                  value={currentSize}
                  onChange={(e) => {
                    const newSize = e.target.value as SizePreset;
                    const currentLayout = config.layouts?.[widgetKey] || defaultLayouts[widgetKey];
                    setConfig({
                      ...config,
                      layouts: {
                        ...defaultLayouts,
                        ...config.layouts,
                        [widgetKey]: {
                          ...currentLayout,
                          size: newSize,
                        },
                      },
                    });
                  }}
                  style={{
                    width: "85px",
                    padding: "4px 8px",
                    borderRadius: "4px",
                    border: "1px solid rgba(100,100,100,0.4)",
                    background: "rgba(10,10,15,0.8)",
                    color: "white",
                    fontSize: "0.8rem",
                  }}
                >
                  {SIZE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            );
          })}
        </div>
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

export default AdminScreen;
