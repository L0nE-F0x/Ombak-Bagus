export type Region =
  | "Bukit"
  | "Canggu"
  | "East Coast"
  | "Sanur"
  | "Nusa Dua"
  | "West Coast"
  | "Uluwatu Area";

export type TidePreference = "low" | "mid" | "high" | "all";
export type SkillLevel = "beginner" | "intermediate" | "advanced" | "expert";
export type WindRelation = "offshore" | "onshore" | "cross" | "glassy";

/** Open-Meteo marine model ids used in API requests. */
export type MarineModelId =
  | "best_match"
  | "ncep_gfswave025"
  | "ncep_gfswave016"
  | "ecmwf_wam025"
  | "meteofrance_wave";

export interface Spot {
  id: string;
  name: string;
  region: Region;
  lat: number;
  lon: number;
  /** Degrees the reef/beach faces (swell direction that hits best) */
  faces: number;
  /** Preferred swell direction range [min, max] degrees */
  swellWindow: [number, number];
  /** Wind directions that are offshore [min, max] degrees */
  offshoreWindow: [number, number];
  tidePreference: TidePreference;
  skill: SkillLevel;
  bottom: string;
  description: string;
  bestMonths: string;
}

export interface HourlyMarine {
  time: string;
  waveHeight: number;
  waveDirection: number;
  wavePeriod: number;
  swellHeight: number;
  swellDirection: number;
  swellPeriod: number;
  windWaveHeight: number;
  secondarySwellHeight: number | null;
  secondarySwellDirection: number | null;
  secondarySwellPeriod: number | null;
}

export interface HourlyWeather {
  time: string;
  windSpeed: number; // knots
  windDirection: number;
  windGusts: number;
  temperature: number;
  weatherCode: number;
}

export interface TidePoint {
  time: string;
  height: number;
  type?: "high" | "low";
}

/** One model's wave/swell series for multi-model comparison. */
export interface ModelSeries {
  id: MarineModelId;
  label: string;
  shortLabel: string;
  color: string;
  /** Whether this model returned usable wave data for the spot */
  available: boolean;
  hourly: Array<{
    time: string;
    waveHeight: number | null;
    swellHeight: number | null;
    swellPeriod: number | null;
    swellDirection: number | null;
    secondarySwellHeight: number | null;
  }>;
  /** Current / nearest hour summary */
  now: {
    waveHeight: number | null;
    swellHeight: number | null;
    swellPeriod: number | null;
    swellDirection: number | null;
    secondarySwellHeight: number | null;
  } | null;
}

export interface HourlyForecast {
  time: string;
  waveHeight: number;
  waveDirection: number;
  wavePeriod: number;
  swellHeight: number;
  swellDirection: number;
  swellPeriod: number;
  windWaveHeight: number;
  secondarySwellHeight: number | null;
  secondarySwellDirection: number | null;
  secondarySwellPeriod: number | null;
  windSpeed: number;
  windDirection: number;
  windGusts: number;
  temperature: number;
  weatherCode: number;
  rating: number;
  windRelation: WindRelation;
  /** Model sea level (m above global MSL) when available */
  seaLevelMsl: number | null;
}

export interface SpotForecast {
  spotId: string;
  fetchedAt: string;
  /** Model used for primary hourly/rating series */
  primaryModelId: MarineModelId;
  primaryModelLabel: string;
  hourly: HourlyForecast[];
  daily: Array<{
    date: string;
    waveHeightMax: number;
    wavePeriodMax: number;
    swellHeightMax: number;
    swellPeriodMax: number;
    windSpeedMax: number;
    windDirectionDominant: number;
    ratingAvg: number;
    bestHour: string | null;
  }>;
  /** Astronomical estimate (local harmonic model) */
  tides: TidePoint[];
  /** Open-Meteo sea_level_height_msl from primary model (when available) */
  modelTides: TidePoint[];
  /** Multi-model comparison series */
  models: ModelSeries[];
}

export interface SpotNote {
  id: string;
  spotId: string;
  text: string;
  updatedAt: string;
}

export interface SurfSession {
  id: string;
  spotId: string;
  date: string;
  startTime?: string;
  durationMinutes?: number;
  waveHeightEstimate?: number;
  rating: number;
  crowd?: "empty" | "light" | "moderate" | "packed";
  board?: string;
  notes: string;
  createdAt: string;
}

export type Units = {
  wave: "m" | "ft";
  wind: "kn" | "kmh" | "mph";
  temp: "c" | "f";
};

export type Page =
  | "dashboard"
  | "spots"
  | "spot"
  | "sessions"
  | "notes"
  | "settings";
