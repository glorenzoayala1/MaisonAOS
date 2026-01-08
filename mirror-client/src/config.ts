// Widget keys
export type WidgetKey = "clock" | "weather" | "today" | "surf" | "news" | "stocks" | "quotes" | "alarms";

// "Today" list item
export type TodayItem = {
  time?: string | null;
  label: string;
};

export type NewsItem = {
  title: string;
  source?: string;
  time?: string;
};

// NEW: stock list item
export type StockItem = {
  symbol: string;        // e.g. "NVDA"
  label?: string;        // e.g. "Nvidia"
  price?: string;        // just a display string for now, e.g. "$128.40"
  change?: string;       // e.g. "+1.3%"
};

export type QuoteItem = {
  quote: string;
  author?: string;
  category?: string;
};

export type AlarmItem = {
  id: string;
  time: string;  // Format: "HH:MM" (24-hour)
  enabled: boolean;
  days: string[];  // ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]
  label?: string;
  soundEnabled: boolean;
};


// Display style types
export type FontStyle = "serif" | "sans" | "futuristic";
export type AccentColor = "gold" | "silver" | "white";
export type CardStyle = "glass" | "outline" | "minimal";

// Background intensity / coverage
export type BackgroundMode = "off" | "edgesStatic" | "timeOfDay";
export type AtmosphereMode = "off" | "edgesStatic" | "timeOfDay"; // (unused right now)

// Hey Zo Preset Voices
export type VoicePreset = "verse" | "alloy" | "echo" | "sage";

// ---- Theme presets ----

export type ThemeName =
  | "maisonNoir"
  | "maisonAzure"
  | "maisonChrome"
  | "maisonEarth"
  | "custom";

type ThemePreset = {
  fontStyle: FontStyle;
  accentColor: AccentColor;
  cardStyle: CardStyle;
  showBorders: boolean;
  backgroundMode: BackgroundMode;
  voicePreset: VoicePreset;  // NEW

  // optional extra edge colors for themes that want custom glow
  __earthLeft?: string;
  __earthRight?: string;
};

export const THEME_PRESETS: Record<ThemeName, ThemePreset> = {
  maisonNoir: {
    // minimal black + gold
    fontStyle: "serif",
    accentColor: "gold",
    cardStyle: "glass",
    showBorders: true,
    backgroundMode: "edgesStatic",
    voicePreset: "verse",  // NEW
  },
  maisonAzure: {
    // blue, futuristic
    fontStyle: "futuristic",
    accentColor: "white",
    cardStyle: "glass",
    showBorders: false,
    backgroundMode: "timeOfDay",
    voicePreset: "verse",
  },
  maisonChrome: {
    // silver, slightly sharper
    fontStyle: "sans",
    accentColor: "silver",
    cardStyle: "outline",
    showBorders: true,
    backgroundMode: "edgesStatic",
    voicePreset: "verse",
  },
  maisonEarth: {
    // warm / earthy – we’ll lean on bg & cards rather than accent
    fontStyle: "serif",
    accentColor: "gold",
    cardStyle: "minimal",
    showBorders: false,
    backgroundMode: "timeOfDay",
    __earthLeft: "rgba(60, 120, 60, 0.45)", // deep forest green
    __earthRight: "rgba(180, 140, 60, 0.55)", // warm golden oak glow
    voicePreset: "verse",
  },
  custom: {
    // fallback when user tweaks stuff manually
    fontStyle: "sans",
    accentColor: "gold",
    cardStyle: "glass",
    showBorders: true,
    backgroundMode: "edgesStatic",
    voicePreset: "verse",
  },
};

// ---- Display settings ----

// layout presets you can expose in Admin
export type LayoutPresetName = "classic" | "minimal" | "infoDense";

export type DisplaySettings = {
  theme: ThemeName;
  fontStyle: FontStyle;
  accentColor: AccentColor;
  showBorders: boolean;
  cardStyle: CardStyle;
  backgroundMode: BackgroundMode;
  voicePreset: VoicePreset;   // NEW
  sleepMode?: boolean;

  // how strong the edge glow is (0–1). Admin slider will write this.
  ambientIntensity: number;

  // which layout preset is active (Admin dropdown)
  layoutPreset: LayoutPresetName;
};

// --- Layout preset types (for positions & sizes) ---

export type PositionPreset =
  | "topLeft"
  | "topCenter"
  | "topRight"
  | "middleLeft"
  | "middleCenter"
  | "middleRight"
  | "bottomLeft"
  | "bottomCenter"
  | "bottomRight"
  // shorthand / legacy values
  | "top"
  | "center"
  | "bottom";

export type SizePreset = "small" | "medium" | "large";

export type WidgetPlacement = {
  position: PositionPreset;
  size?: SizePreset;
  // Optional pixel offsets inside the grid cell
  offsetX?: number; // horizontal shift, in px (right positive)
  offsetY?: number; // vertical shift, in px (down positive)
};


export type LayoutSettings = Record<WidgetKey, WidgetPlacement>;

// Main mirror config shape
export type MirrorConfig = {
  location: string;
  widgets: Record<WidgetKey, boolean>;
  todayItems: TodayItem[];
  newsItems: NewsItem[];
  stocksItems?: StockItem[];
  quotesCategories?: string[];
  newsCategories?: string[];
  currentQuote?: QuoteItem;
  alarmItems?: AlarmItem[];
  temperatureF: number;
  weatherDescription: string;
  weatherSymbol: string;
  display: DisplaySettings;
  // layouts is optional so old configs still parse
  layouts?: LayoutSettings;
  // API keys (optional - falls back to .env if not set)
  apiKeys?: {
    OPENAI_API_KEY?: string;
    OPENWEATHER_API_KEY?: string;
    NEWS_API_KEY?: string;
    API_NINJAS_KEY?: string;
    FINNHUB_API_KEY?: string;
    PORCUPINE_API_KEY?: string;
  };
};

// Backend API base URL
export const API_BASE_URL = "http://127.0.0.1:8000";

// Default config used before backend loads
export const defaultConfig: MirrorConfig = {
  location: "San Diego",
  widgets: {
    clock: true,
    weather: true,
    today: true,
    surf: true,
    news: true,
    stocks: true,
    quotes: true,
    alarms: true,
  },
  temperatureF: 72,
  weatherDescription: "Clear skies",
  weatherSymbol: "☀️",
  todayItems: [
    { label: "Finish mirror UI v1" },
    { label: "Review quiz material" },
    { label: "Plan tomorrow's tasks" },
  ],

  newsItems: [          // NEW – just sample fake headlines for now
    {
      title: "Markets drift sideways ahead of Fed meeting",
      source: "Global Desk",
      time: "Just now",
    },
    {
      title: "AI tools quietly reshape how small teams work",
      source: "Maison Wire",
      time: "5 min ago",
    },
  ],

  stocksItems: [
    { symbol: "NVDA", label: "Nvidia", price: "$128.40", change: "+1.3%" },
    { symbol: "AAPL", label: "Apple", price: "$210.02", change: "-0.4%" },
    { symbol: "SPY", label: "S&P 500", price: "≈ $555", change: "+0.2%" },
  ],

  quotesCategories: ["inspirational", "wisdom"],
  newsCategories: ["technology", "business"],
  currentQuote: {
    quote: "The only way to do great work is to love what you do.",
    author: "Steve Jobs",
    category: "inspirational",
  },

  display: {
    theme: "maisonNoir", // default theme
    fontStyle: THEME_PRESETS.maisonNoir.fontStyle,
    accentColor: THEME_PRESETS.maisonNoir.accentColor,
    showBorders: THEME_PRESETS.maisonNoir.showBorders,
    cardStyle: THEME_PRESETS.maisonNoir.cardStyle,
    backgroundMode: THEME_PRESETS.maisonNoir.backgroundMode,
    voicePreset: THEME_PRESETS.maisonNoir.voicePreset,

    // new: glow strength (0–1)
    ambientIntensity: 0.85,

    // new: layout preset name
    layoutPreset: "classic",
  },
  // default layout if backend / config.json has nothing yet
  layouts: {
    clock: { position: "topLeft", size: "large" },
    weather: { position: "topRight", size: "medium" },
    today: { position: "middleCenter", size: "medium" },
    surf: { position: "bottomCenter", size: "small" },
    news: { position: "bottomRight", size: "small" },
    stocks: { position: "middleRight", size: "small" },
    quotes: { position: "bottomLeft", size: "medium" },
    alarms: { position: "middleLeft", size: "small" },
  },
};

// handy export for AdminScreen / MirrorScreen
export const defaultLayouts: LayoutSettings = defaultConfig.layouts!;
