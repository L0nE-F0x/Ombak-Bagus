import type {
  HourlyForecast,
  HourlyWeather,
  MarineModelId,
  ModelSeries,
  Spot,
  SpotForecast,
  TidePoint,
} from "../types";
import { predictTides, tideStageAt } from "./tides";
import { rateConditions } from "./rating";
import { parseForecastTime } from "./time";
import {
  MARINE_MODELS,
  MODELS_QUERY,
  PRIMARY_MODEL_ID,
  modelDef,
} from "./models";

const MARINE_URL = "https://marine-api.open-meteo.com/v1/marine";
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";

type NumArr = (number | null)[];

interface MultiMarineResponse {
  hourly: Record<string, string[] | NumArr>;
}

interface WeatherResponse {
  hourly: {
    time: string[];
    wind_speed_10m: NumArr;
    wind_direction_10m: NumArr;
    wind_gusts_10m: NumArr;
    temperature_2m: NumArr;
    weather_code: NumArr;
  };
}

function n(v: number | null | undefined, fallback = 0): number {
  return v == null || Number.isNaN(v) ? fallback : v;
}

function nNull(v: number | null | undefined): number | null {
  if (v == null || Number.isNaN(v)) return null;
  return v;
}

async function fetchJson<T>(url: string, label: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${label} error ${res.status}`);
  return res.json() as Promise<T>;
}

function col(
  hourly: Record<string, string[] | NumArr>,
  base: string,
  suffix: string
): NumArr | undefined {
  const key = `${base}_${suffix}`;
  const arr = hourly[key];
  if (!arr || typeof arr[0] === "string") return undefined;
  return arr as NumArr;
}

async function fetchMarineMulti(
  lat: number,
  lon: number
): Promise<MultiMarineResponse> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    hourly: [
      "wave_height",
      "wave_direction",
      "wave_period",
      "swell_wave_height",
      "swell_wave_direction",
      "swell_wave_period",
      "secondary_swell_wave_height",
      "secondary_swell_wave_direction",
      "secondary_swell_wave_period",
      "wind_wave_height",
      "sea_level_height_msl",
    ].join(","),
    models: MODELS_QUERY,
    timezone: "Asia/Makassar",
    forecast_days: "7",
    cell_selection: "sea",
  });
  return fetchJson(`${MARINE_URL}?${params}`, "Marine API");
}

async function fetchWeather(lat: number, lon: number): Promise<WeatherResponse> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    hourly: [
      "wind_speed_10m",
      "wind_direction_10m",
      "wind_gusts_10m",
      "temperature_2m",
      "weather_code",
    ].join(","),
    timezone: "Asia/Makassar",
    forecast_days: "7",
    wind_speed_unit: "kn",
  });
  return fetchJson(`${FORECAST_URL}?${params}`, "Weather API");
}

function parseWeather(w: WeatherResponse): HourlyWeather[] {
  return w.hourly.time.map((time, i) => ({
    time,
    windSpeed: n(w.hourly.wind_speed_10m[i]),
    windDirection: n(w.hourly.wind_direction_10m[i]),
    windGusts: n(w.hourly.wind_gusts_10m[i]),
    temperature: n(w.hourly.temperature_2m[i]),
    weatherCode: n(w.hourly.weather_code[i]),
  }));
}

function seriesAvailable(wave: NumArr | undefined): boolean {
  if (!wave?.length) return false;
  return wave.some((v) => v != null && !Number.isNaN(v));
}

function nearestNowIndex(times: string[]): number {
  const now = Date.now();
  let best = 0;
  let bestScore = Infinity;
  for (let i = 0; i < times.length; i++) {
    const t = parseForecastTime(times[i]).getTime();
    if (!Number.isFinite(t)) continue;
    const delta = t - now;
    const inWindow = delta >= -45 * 60_000 && delta <= 90 * 60_000;
    const score = inWindow ? Math.abs(delta) : Math.abs(delta) + 1e12;
    if (score < bestScore) {
      best = i;
      bestScore = score;
    }
  }
  return best;
}

function buildModelSeries(
  hourly: Record<string, string[] | NumArr>,
  times: string[]
): ModelSeries[] {
  const idx = nearestNowIndex(times);

  return MARINE_MODELS.map((def) => {
    const wave = col(hourly, "wave_height", def.keySuffix);
    const swell = col(hourly, "swell_wave_height", def.keySuffix);
    const period = col(hourly, "swell_wave_period", def.keySuffix);
    const dir = col(hourly, "swell_wave_direction", def.keySuffix);
    const sec = col(hourly, "secondary_swell_wave_height", def.keySuffix);
    const available = seriesAvailable(wave);

    const seriesHourly = times.map((time, i) => ({
      time,
      waveHeight: nNull(wave?.[i]),
      swellHeight: nNull(swell?.[i]),
      swellPeriod: nNull(period?.[i]),
      swellDirection: nNull(dir?.[i]),
      secondarySwellHeight: nNull(sec?.[i]),
    }));

    const nowPoint = available
      ? {
          waveHeight: nNull(wave?.[idx]),
          swellHeight: nNull(swell?.[idx]),
          swellPeriod: nNull(period?.[idx]),
          swellDirection: nNull(dir?.[idx]),
          secondarySwellHeight: nNull(sec?.[idx]),
        }
      : null;

    return {
      id: def.id,
      label: def.label,
      shortLabel: def.shortLabel,
      color: def.color,
      available,
      hourly: seriesHourly,
      now: nowPoint,
    };
  });
}

/** Convert sea_level_height_msl hourly into tide points + extremes. */
function modelTidesFromSeaLevel(
  times: string[],
  sea: NumArr | undefined
): TidePoint[] {
  if (!sea?.length || !seriesAvailable(sea)) return [];

  const points: TidePoint[] = times.map((time, i) => ({
    time,
    height: Math.round(n(sea[i]) * 100) / 100,
  }));

  // Mark local extrema on 1h steps
  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1].height;
    const cur = points[i].height;
    const next = points[i + 1].height;
    if (cur > prev && cur >= next) points[i].type = "high";
    else if (cur < prev && cur <= next) points[i].type = "low";
  }
  return points;
}

export async function fetchSpotForecast(spot: Spot): Promise<SpotForecast> {
  const [marine, weather] = await Promise.all([
    fetchMarineMulti(spot.lat, spot.lon),
    fetchWeather(spot.lat, spot.lon),
  ]);

  const times = (marine.hourly.time as string[]) ?? [];
  if (!times.length) throw new Error("Marine API returned no times");

  const models = buildModelSeries(marine.hourly, times);
  const primaryDef = modelDef(PRIMARY_MODEL_ID);
  const suffix = primaryDef.keySuffix;

  // Fall back if best_match empty
  let primaryId: MarineModelId = PRIMARY_MODEL_ID;
  let primarySuffix = suffix;
  const primarySeries = models.find((m) => m.id === PRIMARY_MODEL_ID);
  if (!primarySeries?.available) {
    const fallback = models.find((m) => m.available);
    if (fallback) {
      primaryId = fallback.id;
      primarySuffix = modelDef(fallback.id).keySuffix;
    }
  }

  const waveH = col(marine.hourly, "wave_height", primarySuffix);
  const waveD = col(marine.hourly, "wave_direction", primarySuffix);
  const waveP = col(marine.hourly, "wave_period", primarySuffix);
  const swellH = col(marine.hourly, "swell_wave_height", primarySuffix);
  const swellD = col(marine.hourly, "swell_wave_direction", primarySuffix);
  const swellP = col(marine.hourly, "swell_wave_period", primarySuffix);
  const secH = col(marine.hourly, "secondary_swell_wave_height", primarySuffix);
  const secD = col(
    marine.hourly,
    "secondary_swell_wave_direction",
    primarySuffix
  );
  const secP = col(marine.hourly, "secondary_swell_wave_period", primarySuffix);
  const windWave = col(marine.hourly, "wind_wave_height", primarySuffix);
  const seaLevel = col(marine.hourly, "sea_level_height_msl", primarySuffix);

  const weatherH = parseWeather(weather);
  const weatherByTime = new Map(weatherH.map((h) => [h.time, h]));

  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const tides = predictTides(spot.region, startOfDay, 24 * 7 + 12, 30);
  const modelTides = modelTidesFromSeaLevel(times, seaLevel);

  const hourly: HourlyForecast[] = times.map((time, i) => {
    const w = weatherByTime.get(time) ?? {
      time,
      windSpeed: 0,
      windDirection: 0,
      windGusts: 0,
      temperature: 28,
      weatherCode: 0,
    };

    const stage = tideStageAt(
      modelTides.length ? modelTides : tides,
      time
    );

    const sH = n(swellH?.[i], n(waveH?.[i]));
    const sP = n(swellP?.[i], n(waveP?.[i]));
    const sD = n(swellD?.[i], n(waveD?.[i]));

    const { rating, windRelation } = rateConditions({
      spot,
      waveHeight: n(waveH?.[i]),
      wavePeriod: n(waveP?.[i]),
      swellHeight: sH,
      swellDirection: sD,
      swellPeriod: sP,
      windSpeed: w.windSpeed,
      windDirection: w.windDirection,
      tideStage: stage,
    });

    return {
      time,
      waveHeight: n(waveH?.[i]),
      waveDirection: n(waveD?.[i]),
      wavePeriod: n(waveP?.[i]),
      swellHeight: sH,
      swellDirection: sD,
      swellPeriod: sP,
      windWaveHeight: n(windWave?.[i]),
      secondarySwellHeight: nNull(secH?.[i]),
      secondarySwellDirection: nNull(secD?.[i]),
      secondarySwellPeriod: nNull(secP?.[i]),
      windSpeed: w.windSpeed,
      windDirection: w.windDirection,
      windGusts: w.windGusts,
      temperature: w.temperature,
      weatherCode: w.weatherCode,
      rating,
      windRelation,
      seaLevelMsl: nNull(seaLevel?.[i]),
    };
  });

  const byDay = new Map<string, HourlyForecast[]>();
  for (const h of hourly) {
    const day = h.time.slice(0, 10);
    if (!byDay.has(day)) byDay.set(day, []);
    byDay.get(day)!.push(h);
  }

  const daily = [...byDay.entries()].map(([date, hours]) => {
    const best = hours.reduce((a, b) => (b.rating > a.rating ? b : a), hours[0]);
    const dayHours = hours.filter((h) => {
      const hr = parseForecastTime(h.time).getHours();
      return hr >= 6 && hr <= 18;
    });
    const pool = dayHours.length ? dayHours : hours;
    return {
      date,
      waveHeightMax: Math.max(...hours.map((h) => h.waveHeight)),
      wavePeriodMax: Math.max(...hours.map((h) => h.wavePeriod)),
      swellHeightMax: Math.max(...hours.map((h) => h.swellHeight)),
      swellPeriodMax: Math.max(...hours.map((h) => h.swellPeriod)),
      windSpeedMax: Math.max(...hours.map((h) => h.windSpeed)),
      windDirectionDominant:
        hours[Math.floor(hours.length / 2)]?.windDirection ?? 0,
      ratingAvg:
        Math.round((pool.reduce((s, h) => s + h.rating, 0) / pool.length) * 10) /
        10,
      bestHour: best?.time ?? null,
    };
  });

  const primaryLabel = modelDef(primaryId).label;

  return {
    spotId: spot.id,
    fetchedAt: new Date().toISOString(),
    primaryModelId: primaryId,
    primaryModelLabel: primaryLabel,
    hourly,
    daily,
    tides,
    modelTides,
    models,
  };
}

export async function fetchManyForecasts(
  spots: Spot[],
  concurrency = 3,
  onProgress?: (done: number, total: number) => void
): Promise<Map<string, SpotForecast>> {
  const results = new Map<string, SpotForecast>();
  let done = 0;
  const queue = [...spots];

  async function worker() {
    while (queue.length) {
      const spot = queue.shift()!;
      try {
        const fc = await fetchSpotForecast(spot);
        results.set(spot.id, fc);
      } catch (e) {
        console.error(`Forecast failed for ${spot.name}`, e);
      }
      done++;
      onProgress?.(done, spots.length);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, spots.length) }, () => worker())
  );
  return results;
}

export function dirToCompass(deg: number): string {
  if (!Number.isFinite(deg)) return "—";
  const dirs = [
    "N",
    "NNE",
    "NE",
    "ENE",
    "E",
    "ESE",
    "SE",
    "SSE",
    "S",
    "SSW",
    "SW",
    "WSW",
    "W",
    "WNW",
    "NW",
    "NNW",
  ];
  const i = Math.round(((((deg % 360) + 360) % 360) / 22.5)) % 16;
  return dirs[i];
}
