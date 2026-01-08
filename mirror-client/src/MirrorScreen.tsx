// mirror-client/src/MirrorScreen.tsx
import React, { useEffect, useRef, useState, type CSSProperties } from "react";

import { ClockWidget } from "./components/widgets/ClockWidget";
import { WeatherWidget } from "./components/widgets/WeatherWidget";
import { TodayWidget } from "./components/widgets/TodayWidget";
import { SurfWidget } from "./components/widgets/SurfWidget";
import { NewsWidget } from "./components/widgets/NewsWidget";
import { StocksWidget } from "./components/widgets/StocksWidget";
import { QuotesWidget } from "./components/widgets/QuotesWidget";
import { AlarmsWidget } from "./components/widgets/AlarmsWidget";

import { defaultConfig, API_BASE_URL } from "./config";
import type {
  MirrorConfig,
  FontStyle,
  AccentColor,
  PositionPreset,
  SizePreset,
  WidgetPlacement,
  LayoutSettings,
  BackgroundMode,
} from "./config";

// ---------- Zo state (frontend phases) ----------
type ZoState = "idle" | "listening" | "thinking" | "speaking";

type ZoServerStatus = {
  mode: ZoState;
  last_user?: string | null;
  last_zo?: string | null;
  updated_at: number;
};

type LiveWeather = {
  temperatureF: number;
  weatherDescription: string;
  symbol: string;
};

// ---------- Display style maps ----------
const FONT_MAP: Record<FontStyle, string> = {
  serif: "'Playfair Display', serif",
  sans:
    "system-ui, -apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
  futuristic: "'Space Grotesk', system-ui, sans-serif",
};

const COLOR_MAP: Record<AccentColor, string> = {
  gold: "#D4AF37",
  silver: "#C0C0C0",
  white: "#FFFFFF",
};

// ---------- Layout helpers (3×3 grid) ----------
type GridPositionKey =
  | "topLeft"
  | "topCenter"
  | "topRight"
  | "middleLeft"
  | "middleCenter"
  | "middleRight"
  | "bottomLeft"
  | "bottomCenter"
  | "bottomRight";

const POSITION_GRID: Record<GridPositionKey, { row: number; col: number }> = {
  topLeft: { row: 1, col: 1 },
  topCenter: { row: 1, col: 2 },
  topRight: { row: 1, col: 3 },
  middleLeft: { row: 2, col: 1 },
  middleCenter: { row: 2, col: 2 },
  middleRight: { row: 2, col: 3 },
  bottomLeft: { row: 3, col: 1 },
  bottomCenter: { row: 3, col: 2 },
  bottomRight: { row: 3, col: 3 },
};

const SIZE_SCALE: Record<SizePreset, number> = {
  small: 0.9,
  medium: 1.0,
  large: 1.15,
};

function normalizePosition(pos: PositionPreset): GridPositionKey {
  switch (pos) {
    case "top":
      return "topCenter";
    case "center":
      return "middleCenter";
    case "bottom":
      return "bottomCenter";
    default:
      if (pos in POSITION_GRID) return pos as GridPositionKey;
      return "middleCenter";
  }
}

// SAFE: handle missing layout objects + apply offsets
function place(placement?: WidgetPlacement): CSSProperties {
  const safe: WidgetPlacement = placement ?? {
    position: "topLeft",
    size: "medium",
  };

  const posKey: GridPositionKey = normalizePosition(safe.position); // 👈 add this type
  const { row, col } = POSITION_GRID[posKey];

  const sizeKey: SizePreset = safe.size ?? "medium";
  const scale = SIZE_SCALE[sizeKey] ?? 1;

  const offsetX = safe.offsetX ?? 0;
  const offsetY = safe.offsetY ?? 0;

  // Anchor inside the cell (fixes left column “pushed off-screen” feeling)
  const justifySelf: CSSProperties["justifySelf"] =
    col === 1 ? "start" : col === 3 ? "end" : "center";
  const alignSelf: CSSProperties["alignSelf"] =
    row === 1 ? "start" : row === 3 ? "end" : "center";

  // Translate first, then scale (offsets feel consistent)
  const transforms: string[] = [];
  if (offsetX !== 0 || offsetY !== 0)
    transforms.push(`translate(${offsetX}px, ${offsetY}px)`);
  if (scale !== 1) transforms.push(`scale(${scale})`);

  const originX = col === 1 ? "left" : col === 3 ? "right" : "center";
  const originY = row === 1 ? "top" : row === 3 ? "bottom" : "center";

  return {
    gridRow: row,
    gridColumn: col,
    justifySelf,
    alignSelf,
    transform: transforms.length ? transforms.join(" ") : undefined,
    transformOrigin: `${originX} ${originY}`,
    maxWidth: col === 1 ? "42vw" : col === 3 ? "42vw" : "60vw",
  };
}

// ---------- Time-of-day / theme background helpers ----------
type EdgeColors = { left: string; right: string };

function getTimeOfDayEdgeColors(now: Date): EdgeColors {
  const hour = now.getHours();

  if (hour >= 5 && hour < 10) {
    return {
      left: "rgba(255, 211, 150, 0.55)",
      right: "rgba(255, 244, 214, 0.45)",
    };
  }

  if (hour >= 10 && hour < 17) {
    return {
      left: "rgba(255, 255, 255, 0.35)",
      right: "rgba(150, 210, 255, 0.45)",
    };
  }

  if (hour >= 17 && hour < 22) {
    return {
      left: "rgba(255, 160, 122, 0.60)",
      right: "rgba(221, 160, 221, 0.50)",
    };
  }

  return {
    left: "rgba(10, 35, 85, 0.85)",
    right: "rgba(40, 90, 170, 0.80)",
  };
}

function setEdgeColors(left: string, right: string) {
  const root = document.documentElement;
  root.style.setProperty("--mirror-edge-left", left);
  root.style.setProperty("--mirror-edge-right", right);
}

function applyBackgroundEdgeColors(mode: BackgroundMode, theme?: string | null) {
  if (theme === "maisonAzure") {
    setEdgeColors("rgba(2, 6, 23, 0.95)", "rgba(12, 63, 140, 0.90)");
    return;
  }

  if (theme === "maisonEarth") {
    setEdgeColors("rgba(10, 35, 22, 0.95)", "rgba(134, 96, 40, 0.90)");
    return;
  }

  if (theme === "maisonChrome") {
    setEdgeColors("rgba(32, 36, 46, 0.95)", "rgba(185, 195, 210, 0.35)");
    return;
  }

  if (mode === "timeOfDay") {
    const { left, right } = getTimeOfDayEdgeColors(new Date());
    setEdgeColors(left, right);
    return;
  }

  if (mode === "edgesStatic") {
    setEdgeColors("rgba(212, 175, 55, 0.30)", "rgba(120, 200, 255, 0.28)");
    return;
  }

  setEdgeColors("rgba(0, 0, 0, 0)", "rgba(0, 0, 0, 0)");
}

function FadePresence({
  show,
  children,
  style,
  durationMs = 260,
  delayMs = 0,
  useTransform = true, // IMPORTANT: set false for sleep overlay
}: {
  show: boolean;
  children?: React.ReactNode;
  style?: CSSProperties;
  durationMs?: number;
  delayMs?: number;
  useTransform?: boolean;
}) {
  const [mounted, setMounted] = useState(show);
  const [visible, setVisible] = useState(show);
  const hideTimer = useRef<number | null>(null);

  useEffect(() => {
    if (hideTimer.current) {
      window.clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }

    if (show) {
      setMounted(true);
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
      hideTimer.current = window.setTimeout(
        () => setMounted(false),
        durationMs + delayMs
      );
    }

    return () => {
      if (hideTimer.current) window.clearTimeout(hideTimer.current);
    };
  }, [show, durationMs, delayMs]);

  if (!mounted) return null;

  const fadeStyle: CSSProperties = {
    ...style,
    opacity: visible ? 1 : 0,
    transitionProperty: useTransform ? "opacity, transform" : "opacity",
    transitionDuration: `${durationMs}ms`,
    transitionTimingFunction: "ease",
    transitionDelay: `${delayMs}ms`,
    pointerEvents: visible ? "auto" : "none",
    ...(useTransform
      ? { transform: visible ? "translateY(0px)" : "translateY(6px)" }
      : {}),
  };

  return <div style={fadeStyle}>{children}</div>;
}

// ---------- Component ----------
export const MirrorScreen: React.FC = () => {
  const [config, setConfig] = useState<MirrorConfig>(defaultConfig);
  const [zoState, setZoState] = useState<ZoState>("idle");
  const [zoServerStatus, setZoServerStatus] =
    useState<ZoServerStatus | null>(null);
  const [liveWeather, setLiveWeather] = useState<LiveWeather | null>(null);

  // Poll /config every 5 seconds
  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const res = await fetch(`${API_BASE_URL}/config`);
        if (!res.ok) throw new Error(`Config fetch failed: ${res.status}`);
        const data: MirrorConfig = await res.json();
        if (isMounted) setConfig(data);
      } catch (err) {
        console.error("[mirror] failed to load config from backend", err);
      }
    }

    load();
    const id = window.setInterval(load, 5000);

    return () => {
      isMounted = false;
      window.clearInterval(id);
    };
  }, []);

  // Poll Zo server state
  useEffect(() => {
    const id = window.setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/zo/state`);
        if (!res.ok) return;
        const data: ZoServerStatus = await res.json();
        setZoServerStatus(data);
      } catch {
        // ignore
      }
    }, 1500);

    return () => window.clearInterval(id);
  }, []);

  const display = config.display ?? defaultConfig.display;
  const isSleeping = !!(display as any).sleepMode;

  // Merge defaults with backend so new widgets always exist
  const widgets = {
    ...defaultConfig.widgets,
    ...config.widgets,
  };

  const layouts: LayoutSettings = {
    ...(defaultConfig.layouts as LayoutSettings),
    ...((config.layouts as LayoutSettings | undefined) ?? {}),
  };

  // CSS vars
  useEffect(() => {
    const font = FONT_MAP[display.fontStyle];
    const color = COLOR_MAP[display.accentColor];
    document.documentElement.style.setProperty("--font-main", font);
    document.documentElement.style.setProperty("--color-accent", color);
  }, [display.fontStyle, display.accentColor]);

  const themeName: string | null = (display as any).theme ?? null;
  const backgroundMode: BackgroundMode =
    (display as any).backgroundMode ?? "timeOfDay";

  useEffect(() => {
    applyBackgroundEdgeColors(backgroundMode, themeName);
  }, [backgroundMode, themeName]);

  // Pull live weather (pause during sleep)
  useEffect(() => {
    if (isSleeping) return;

    let cancelled = false;

    async function loadWeather() {
      try {
        const res = await fetch(
          `${API_BASE_URL}/weather?city=${encodeURIComponent(config.location)}`
        );
        if (!res.ok) throw new Error(`Weather HTTP ${res.status}`);
        const data: LiveWeather = await res.json();
        if (!cancelled) setLiveWeather(data);
      } catch (err) {
        console.error("[mirror] failed to load weather", err);
      }
    }

    loadWeather();
    const id = window.setInterval(loadWeather, 10 * 60 * 1000);

    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [config.location, isSleeping]);

  const todayItems =
    config.todayItems == null ? defaultConfig.todayItems : config.todayItems;

  const osMode: string = (config as any).os_mode ?? "default";

  let bgClass = "mirror-bg--medium";
  if (backgroundMode === "off") bgClass = "mirror-bg--off";

  const cardBaseClass = "mirror-card";
  const cardStyleClass =
    display.cardStyle === "glass"
      ? "mirror-card--glass"
      : display.cardStyle === "outline"
      ? "mirror-card--outline"
      : "mirror-card--minimal";

  const borderClass = display.showBorders
    ? "mirror-card--border"
    : "mirror-card--no-border";

  const handleTalkToZo = async () => {
    try {
      setZoState("listening");
      const res = await fetch(`${API_BASE_URL}/zo/talk`, { method: "POST" });
      setZoState("thinking");

      if (!res.ok) {
        console.error("Zo API error:", res.status);
        return;
      }

      await res.json();
      setZoState("speaking");
    } catch (err) {
      console.error("Failed to talk to Zo", err);
    } finally {
      setZoState("idle");
    }
  };

  return (
    <div className={`mirror-bg-shell ${bgClass}`}>
      {/* Sleep overlay: IMPORTANT useTransform={false} so fixed covers viewport */}
      <FadePresence
        show={isSleeping}
        durationMs={320}
        useTransform={false}
        style={{
          position: "fixed",
          inset: 0,
          background: "black",
          zIndex: 100,
        }}
      />

      <div
        className={`mirror-grid ${zoServerStatus?.mode && zoServerStatus.mode !== "idle" ? "mirror-grid--wake-active" : ""}`}
        style={{
          width: "100vw",
          height: "100vh",
          backgroundColor: "transparent",
          color: "white",
          display: "grid",
          gridTemplateRows: "repeat(3, 1fr)",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "16px",
          padding: "24px",
          boxSizing: "border-box",
          fontFamily: "var(--font-main)",
          overflow: "hidden",
          // When sleeping: keep everything "running" but visually suppressed behind overlay
          // (optional, but prevents weird flashes)
          opacity: isSleeping ? 0 : 1,
          transition: "opacity 240ms ease",
        }}
      >
        {/* Clock */}
        <FadePresence show={!!widgets.clock} style={place(layouts.clock)}>
          <div className={`${cardBaseClass} ${cardStyleClass} ${borderClass}`}>
            <ClockWidget />
          </div>
        </FadePresence>

        {/* Weather */}
        <FadePresence
          show={!!widgets.weather}
          style={place(layouts.weather)}
          delayMs={40}
        >
          <div className={`${cardBaseClass} ${cardStyleClass} ${borderClass}`}>
            <WeatherWidget
              temperatureF={liveWeather?.temperatureF ?? config.temperatureF}
              description={
                liveWeather?.weatherDescription ?? config.weatherDescription
              }
              symbol={liveWeather?.symbol ?? config.weatherSymbol}
            />
          </div>
        </FadePresence>

        {/* Today */}
        <FadePresence
          show={!!widgets.today}
          style={place(layouts.today)}
          delayMs={60}
        >
          <div className={`${cardBaseClass} ${cardStyleClass} ${borderClass}`}>
            <TodayWidget items={todayItems} />
          </div>
        </FadePresence>

        {/* Surf */}
        <FadePresence
          show={!!widgets.surf}
          style={place(layouts.surf)}
          delayMs={80}
        >
          <div className={`${cardBaseClass} ${cardStyleClass} ${borderClass}`}>
            <SurfWidget />
          </div>
        </FadePresence>

        {/* News */}
        <FadePresence
          show={!!widgets.news}
          style={place(layouts.news)}
          delayMs={100}
        >
          <div className={`${cardBaseClass} ${cardStyleClass} ${borderClass}`}>
            <NewsWidget
              categories={config.newsCategories || ["technology", "business"]}
              fallbackItems={config.newsItems}
            />
          </div>
        </FadePresence>

        {/* Stocks */}
        <FadePresence
          show={!!widgets.stocks}
          style={place(layouts.stocks)}
          delayMs={120}
        >
          <div className={`${cardBaseClass} ${cardStyleClass} ${borderClass}`}>
            <StocksWidget items={config.stocksItems} />
          </div>
        </FadePresence>

        {/* Quotes */}
        <FadePresence
          show={!!widgets.quotes}
          style={place(layouts.quotes)}
          delayMs={140}
        >
          <div className={`${cardBaseClass} ${cardStyleClass} ${borderClass}`}>
            <QuotesWidget
              categories={config.quotesCategories || ["inspirational", "wisdom"]}
              fallbackQuote={config.currentQuote}
            />
          </div>
        </FadePresence>

        {/* Alarms */}
        <FadePresence
          show={!!widgets.alarms}
          style={place(layouts.alarms)}
          delayMs={160}
        >
          <div className={`${cardBaseClass} ${cardStyleClass} ${borderClass}`}>
            <AlarmsWidget alarms={config.alarmItems || []} />
          </div>
        </FadePresence>

        {/* OS mode badge */}
        <div
          style={{
            position: "absolute",
            top: 24,
            left: 32,
            padding: "4px 10px",
            borderRadius: 999,
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(0,0,0,0.45)",
            fontSize: "0.7rem",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            opacity: 0.8,
          }}
        >
          MaisonOS · {osMode}
        </div>
      </div>

      {/* Zo voice control + status (dev UI) - STAYS ABOVE sleep overlay and outside mirror-grid */}
      <div
        style={{
          position: "fixed",
          bottom: 90,
          left: "50%",
          transform: "translateX(-50%)",
          fontSize: "0.85rem",
          opacity: 0.9,
          zIndex: 200,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 6,
        }}
      >
        <button
          onClick={handleTalkToZo}
          style={{
            padding: "6px 14px",
            borderRadius: 999,
            border: "1px solid rgba(255,255,255,0.25)",
            background: "rgba(0,0,0,0.6)",
            color: "#ffffff",
            cursor: "pointer",
            backdropFilter: "blur(10px)",
            fontFamily: "var(--font-main)",
          }}
        >
          {zoState === "idle"
            ? "Talk to Zo"
            : `Zo: ${zoState === "listening" ? "listening..." : zoState}`}
        </button>

        {zoServerStatus && (
          <div
            style={{
              padding: "6px 10px",
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,0.18)",
              background: "rgba(0,0,0,0.5)",
              color: "rgba(255,255,255,0.8)",
              maxWidth: 420,
              textAlign: "center",
              backdropFilter: "blur(10px)",
            }}
          >
            <div>
              Zo status:{" "}
              <span style={{ fontWeight: 500 }}>{zoServerStatus.mode}</span>
            </div>
            {zoServerStatus.last_zo && (
              <div
                style={{
                  marginTop: 2,
                  fontSize: "0.78rem",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                "{zoServerStatus.last_zo}"
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MirrorScreen;
