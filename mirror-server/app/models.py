# mirror-server/app/models.py

from typing import List, Optional, Dict, Literal
from pydantic import BaseModel

# ---- Shared literal types ----

BackgroundMode = Literal["off", "edgesStatic", "timeOfDay"]
VoicePreset = Literal["verse", "alloy", "echo", "sage"]


class TodayItem(BaseModel):
    time: Optional[str] = None
    label: str

class NewsItem(BaseModel):        # NEW
    title: str
    source: Optional[str] = None
    time: Optional[str] = None

class QuoteItem(BaseModel):
    quote: str
    author: Optional[str] = None
    category: Optional[str] = None

class AlarmItem(BaseModel):
    id: str
    time: str  # Format: "HH:MM" (24-hour)
    enabled: bool = True
    days: List[str] = []  # ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]
    label: Optional[str] = None
    soundEnabled: bool = True

class Widgets(BaseModel):
    clock: bool = True
    weather: bool = True
    today: bool = True
    surf: bool = True
    news: bool = True
    stocks: bool = True
    quotes: bool = True
    alarms: bool = True

class StockItem(BaseModel):
    symbol: str

class MirrorConfig(BaseModel):
    ...
    stocksItems: List[StockItem] = []


class DisplaySettings(BaseModel):
    """
    Mirrors src/config.ts DisplaySettings:

      theme: ThemeName;
      fontStyle: FontStyle;
      accentColor: AccentColor;
      showBorders: boolean;
      cardStyle: CardStyle;
      backgroundMode: BackgroundMode;
      voicePreset: VoicePreset;
      sleepMode?: boolean;
      ambientIntensity: number;
      layoutPreset: LayoutPresetName;
    """

    # theme name: "maisonNoir" | "maisonAzure" | "maisonChrome" | "maisonEarth" | "custom"
    theme: str = "maisonNoir"

    # font options: "serif", "sans", "futuristic"
    fontStyle: str = "sans"

    # accent options: "gold", "silver", "white"
    accentColor: str = "gold"

    # UI options we control from Admin
    showBorders: bool = True              # show / hide card borders
    cardStyle: str = "glass"              # "glass" | "outline" | "minimal"

    # background intensity / coverage
    backgroundMode: BackgroundMode = "timeOfDay"

    # which OpenAI TTS voice to use for Zo
    voicePreset: VoicePreset = "verse"

    # sleep mode - when true, display shows black screen
    sleepMode: bool = False

    # how strong the edge glow is (0–1). Admin slider writes this.
    ambientIntensity: float = 0.85

    # which layout preset is active ("classic" | "minimal" | "infoDense")
    layoutPreset: str = "classic"


class WidgetPlacement(BaseModel):
    # e.g. "topLeft", "middleCenter", "bottomRight", or shorthand "top"/"center"/"bottom"
    position: str
    # "small", "medium", "large" or None
    size: Literal["small", "medium", "large"]
    offsetX: int = 0
    offsetY: int = 0


class MirrorConfig(BaseModel):
    """
    Mirrors src/config.ts MirrorConfig:

      location: string;
      widgets: Record<WidgetKey, boolean>;
      todayItems: TodayItem[];
      temperatureF: number;
      weatherDescription: string;
      weatherSymbol: string;
      display: DisplaySettings;
      layouts?: LayoutSettings;
    """

    os_mode: str = "default"
    location: str = "San Diego"
    widgets: Widgets = Widgets()

    temperatureF: float = 72.0
    weatherDescription: str = "Clear skies"
    weatherSymbol: str = "☀️"

    todayItems: List[TodayItem] = []
    newsItems: List[NewsItem] = []

    display: DisplaySettings = DisplaySettings()

    # layouts: { "clock": { position, size }, "weather": {...}, ... }
    layouts: Optional[Dict[str, WidgetPlacement]] = None
    stocksItems: List[StockItem] = []

    # quotes configuration
    quotesCategories: List[str] = ["inspirational", "wisdom"]
    currentQuote: Optional[QuoteItem] = None

    # news configuration
    newsCategories: List[str] = ["technology", "business"]

    # alarms configuration
    alarmItems: List[AlarmItem] = []

    # API keys configuration (optional - falls back to .env if not set)
    apiKeys: Optional[Dict[str, str]] = None


# ---- keep these for existing endpoints in main.py ----

class Weather(BaseModel):
    temperatureF: float
    weatherDescription: str
    symbol: str = "☀️"


class SurfConditions(BaseModel):
    spot: str
    waveHeightFt: float
    conditions: str
    wind: str
    symbol: str = "🌊"


   