import type { ReactNode } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { SpotForecast } from "../types";
import { useAppStore } from "../store/useAppStore";
import {
  toDisplayWave,
  toDisplayWind,
  waveUnitLabel,
  windUnitLabel,
  formatWave,
} from "../services/units";
import { formatTime, formatDay, parseForecastTime } from "../services/time";
import { nextExtremes } from "../services/tides";
import { dirToCompass } from "../services/openMeteo";

const tooltipStyle = {
  background: "rgba(15, 48, 68, 0.96)",
  border: "1px solid #1a6b8a",
  borderRadius: 10,
  fontSize: 12,
  color: "#e8f7fa",
  boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
  padding: "8px 10px",
};

const axisTick = { fill: "#8adce8", fontSize: 10 };

function ChartShell({
  title,
  subtitle,
  heightClass = "h-64",
  children,
  empty,
  footer,
}: {
  title: string;
  subtitle?: string;
  heightClass?: string;
  children: ReactNode;
  empty?: boolean;
  footer?: ReactNode;
}) {
  return (
    <div className={`glass rounded-2xl p-4 ${heightClass} flex flex-col min-h-0`}>
      <div className="shrink-0 mb-2">
        <h3 className="text-sm font-medium text-ocean-300">{title}</h3>
        {subtitle && (
          <p className="text-[11px] text-ocean-500 mt-0.5 leading-snug">
            {subtitle}
          </p>
        )}
      </div>
      <div className="flex-1 min-h-0 w-full relative">
        {empty ? (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-ocean-500">
            No data yet
          </div>
        ) : (
          children
        )}
      </div>
      {footer}
    </div>
  );
}

function upcomingHourly(forecast: SpotForecast, hours: number) {
  const now = Date.now() - 45 * 60_000;
  return forecast.hourly
    .filter((h) => parseForecastTime(h.time).getTime() >= now)
    .slice(0, hours);
}

export function SwellChart({
  forecast,
  hours = 48,
}: {
  forecast: SpotForecast;
  hours?: number;
}) {
  const units = useAppStore((s) => s.units);
  const data = upcomingHourly(forecast, hours).map((h) => ({
    label: formatTime(h.time),
    primary:
      Math.round(
        toDisplayWave(h.swellHeight || h.waveHeight, units.wave) * 100
      ) / 100,
    secondary:
      h.secondarySwellHeight != null
        ? Math.round(toDisplayWave(h.secondarySwellHeight, units.wave) * 100) /
          100
        : null,
    period: Math.round(h.swellPeriod || h.wavePeriod),
  }));
  const unit = waveUnitLabel(units.wave);
  const hasSecondary = data.some((d) => d.secondary != null && d.secondary > 0);

  return (
    <ChartShell
      title={`Swell height & period (${unit} / s)`}
      subtitle={
        hasSecondary
          ? "Primary swell + secondary swell train"
          : "Primary swell (secondary not in this model grid)"
      }
      heightClass="h-72"
      empty={!data.length}
    >
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={data}
          margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
        >
          <CartesianGrid
            stroke="#164666"
            strokeDasharray="3 3"
            vertical={false}
          />
          <XAxis
            dataKey="label"
            tick={axisTick}
            interval="preserveStartEnd"
            minTickGap={36}
            axisLine={{ stroke: "#164666" }}
            tickLine={false}
          />
          <YAxis
            yAxisId="h"
            tick={axisTick}
            width={36}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            yAxisId="p"
            orientation="right"
            tick={{ fill: "#e8c47a", fontSize: 10 }}
            width={30}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 4 }} />
          <Area
            yAxisId="h"
            type="monotone"
            dataKey="primary"
            name={`Primary (${unit})`}
            stroke="#2a9bb8"
            fill="#2a9bb844"
            strokeWidth={2}
            isAnimationActive={false}
          />
          {hasSecondary && (
            <Area
              yAxisId="h"
              type="monotone"
              dataKey="secondary"
              name={`Secondary (${unit})`}
              stroke="#34d399"
              fill="#34d39922"
              strokeWidth={1.5}
              strokeDasharray="4 3"
              isAnimationActive={false}
              connectNulls
            />
          )}
          <Line
            yAxisId="p"
            type="monotone"
            dataKey="period"
            name="Period (s)"
            stroke="#e8c47a"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}

export function WindChart({
  forecast,
  hours = 48,
}: {
  forecast: SpotForecast;
  hours?: number;
}) {
  const units = useAppStore((s) => s.units);
  const unit = windUnitLabel(units.wind);
  const data = upcomingHourly(forecast, hours).map((h) => ({
    label: formatTime(h.time),
    wind: Math.round(toDisplayWind(h.windSpeed, units.wind)),
    gust: Math.round(toDisplayWind(h.windGusts, units.wind)),
  }));

  return (
    <ChartShell title={`Wind (${unit})`} empty={!data.length}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
        >
          <CartesianGrid
            stroke="#164666"
            strokeDasharray="3 3"
            vertical={false}
          />
          <XAxis
            dataKey="label"
            tick={axisTick}
            interval="preserveStartEnd"
            minTickGap={36}
            axisLine={{ stroke: "#164666" }}
            tickLine={false}
          />
          <YAxis
            tick={axisTick}
            width={32}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip contentStyle={tooltipStyle} />
          <Area
            type="monotone"
            dataKey="gust"
            name={`Gusts (${unit})`}
            stroke="#ff8f75"
            fill="#ff8f7522"
            isAnimationActive={false}
          />
          <Area
            type="monotone"
            dataKey="wind"
            name={`Wind (${unit})`}
            stroke="#4ec4d9"
            fill="#4ec4d944"
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}

export function TideChart({ forecast }: { forecast: SpotForecast }) {
  const now = Date.now() - 45 * 60_000;
  const end = now + 48 * 3600_000;
  const hasModel = forecast.modelTides.length > 0;

  // Merge astro + model by nearest hour labels for chart
  const astroMap = new Map(
    forecast.tides
      .filter((t) => {
        const ms = parseForecastTime(t.time).getTime();
        return ms >= now && ms <= end;
      })
      .map((t) => [formatTime(t.time), t.height])
  );

  const modelSeries = hasModel
    ? forecast.modelTides.filter((t) => {
        const ms = parseForecastTime(t.time).getTime();
        return ms >= now && ms <= end;
      })
    : [];

  // Prefer model timestamps as backbone when available (hourly)
  const backbone = hasModel
    ? modelSeries.map((t) => ({
        time: t.time,
        label: formatTime(t.time),
        model: t.height,
        astro: nearestAstro(forecast.tides, t.time),
      }))
    : forecast.tides
        .filter((t) => {
          const ms = parseForecastTime(t.time).getTime();
          return ms >= now && ms <= end;
        })
        .map((t) => ({
          time: t.time,
          label: formatTime(t.time),
          model: null as number | null,
          astro: t.height,
        }));

  // downsample for chart readability if too many points
  const data =
    backbone.length > 96
      ? backbone.filter((_, i) => i % 2 === 0)
      : backbone;

  void astroMap;

  return (
    <ChartShell
      title="Tide chart"
      subtitle={
        hasModel
          ? "Model sea level (Open-Meteo) + astronomical estimate"
          : "Astronomical estimate only (model sea level unavailable)"
      }
      empty={!data.length}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="tideFillGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2a9bb8" stopOpacity={0.45} />
              <stop offset="100%" stopColor="#0a1f2e" stopOpacity={0.08} />
            </linearGradient>
          </defs>
          <CartesianGrid
            stroke="#164666"
            strokeDasharray="3 3"
            vertical={false}
          />
          <XAxis
            dataKey="label"
            tick={axisTick}
            interval="preserveStartEnd"
            minTickGap={40}
            axisLine={{ stroke: "#164666" }}
            tickLine={false}
          />
          <YAxis
            tick={axisTick}
            width={36}
            domain={["auto", "auto"]}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          {hasModel && (
            <Area
              type="monotone"
              dataKey="model"
              name="Model (m)"
              stroke="#4ec4d9"
              fill="url(#tideFillGrad)"
              strokeWidth={2}
              isAnimationActive={false}
              connectNulls
            />
          )}
          <Line
            type="monotone"
            dataKey="astro"
            name="Astro (m)"
            stroke="#e8c47a"
            strokeWidth={hasModel ? 1.5 : 2}
            strokeDasharray={hasModel ? "5 4" : undefined}
            dot={false}
            isAnimationActive={false}
            connectNulls
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}

function nearestAstro(
  tides: SpotForecast["tides"],
  time: string
): number | null {
  if (!tides.length) return null;
  const ms = parseForecastTime(time).getTime();
  let best = tides[0].height;
  let bestD = Infinity;
  for (const t of tides) {
    const d = Math.abs(parseForecastTime(t.time).getTime() - ms);
    if (d < bestD) {
      bestD = d;
      best = t.height;
    }
  }
  return best;
}

export function RatingChart({ forecast }: { forecast: SpotForecast }) {
  const data = forecast.daily.map((d) => ({
    label: formatDay(d.date),
    rating: d.ratingAvg,
  }));

  return (
    <ChartShell
      title="7-day outlook score"
      heightClass="h-56"
      empty={!data.length}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
        >
          <CartesianGrid
            stroke="#164666"
            strokeDasharray="3 3"
            vertical={false}
          />
          <XAxis
            dataKey="label"
            tick={axisTick}
            axisLine={{ stroke: "#164666" }}
            tickLine={false}
          />
          <YAxis
            domain={[0, 10]}
            tick={axisTick}
            width={28}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip contentStyle={tooltipStyle} />
          <Bar
            dataKey="rating"
            name="Avg score"
            fill="#2a9bb8"
            radius={[6, 6, 0, 0]}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}

/** Multi-model wave height comparison (Windguru-style transparency). */
export function ModelCompareChart({
  forecast,
  hours = 48,
}: {
  forecast: SpotForecast;
  hours?: number;
}) {
  const units = useAppStore((s) => s.units);
  const unit = waveUnitLabel(units.wave);
  const available = forecast.models.filter((m) => m.available);

  const now = Date.now() - 45 * 60_000;
  // Use first available model's time grid
  const times =
    available[0]?.hourly
      .filter((h) => parseForecastTime(h.time).getTime() >= now)
      .slice(0, hours)
      .map((h) => h.time) ?? [];

  const data = times.map((time) => {
    const row: Record<string, string | number | null> = {
      label: formatTime(time),
      time,
    };
    for (const m of available) {
      const pt = m.hourly.find((h) => h.time === time);
      const h = pt?.swellHeight ?? pt?.waveHeight ?? null;
      row[m.id] =
        h != null
          ? Math.round(toDisplayWave(h, units.wave) * 100) / 100
          : null;
    }
    return row;
  });

  return (
    <ChartShell
      title={`Model comparison · swell / wave (${unit})`}
      subtitle="Same spot, independent wave models via Open-Meteo — like reading Windguru’s multi-model table"
      heightClass="h-80"
      empty={!data.length || !available.length}
      footer={
        available.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {available.map((m) => (
              <span
                key={m.id}
                className="inline-flex items-center gap-1.5 text-[11px] text-ocean-300"
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ background: m.color }}
                />
                {m.label}
              </span>
            ))}
          </div>
        ) : null
      }
    >
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={data}
          margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
        >
          <CartesianGrid
            stroke="#164666"
            strokeDasharray="3 3"
            vertical={false}
          />
          <XAxis
            dataKey="label"
            tick={axisTick}
            interval="preserveStartEnd"
            minTickGap={36}
            axisLine={{ stroke: "#164666" }}
            tickLine={false}
          />
          <YAxis
            tick={axisTick}
            width={36}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip contentStyle={tooltipStyle} />
          {available.map((m) => (
            <Line
              key={m.id}
              type="monotone"
              dataKey={m.id}
              name={m.shortLabel}
              stroke={m.color}
              strokeWidth={m.id === forecast.primaryModelId ? 2.5 : 1.6}
              dot={false}
              isAnimationActive={false}
              connectNulls
            />
          ))}
        </ComposedChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}

export function ModelCompareTable({ forecast }: { forecast: SpotForecast }) {
  const units = useAppStore((s) => s.units);

  return (
    <div className="glass rounded-2xl p-4 overflow-x-auto">
      <h3 className="text-sm font-medium text-ocean-300 mb-1">
        Models · now
      </h3>
      <p className="text-[11px] text-ocean-500 mb-3">
        Primary forecast uses{" "}
        <span className="text-ocean-300">{forecast.primaryModelLabel}</span>.
        Compare others before you commit to a session plan.
      </p>
      <table className="w-full text-sm min-w-[520px]">
        <thead>
          <tr className="text-left text-[10px] text-ocean-400 uppercase tracking-wider">
            <th className="pb-2 pr-3 font-semibold">Model</th>
            <th className="pb-2 pr-3 font-semibold">Wave</th>
            <th className="pb-2 pr-3 font-semibold">Swell</th>
            <th className="pb-2 pr-3 font-semibold">Period</th>
            <th className="pb-2 pr-3 font-semibold">Dir</th>
            <th className="pb-2 font-semibold">2nd swell</th>
          </tr>
        </thead>
        <tbody>
          {forecast.models.map((m) => {
            const isPrimary = m.id === forecast.primaryModelId;
            if (!m.available || !m.now) {
              return (
                <tr
                  key={m.id}
                  className="border-t border-ocean-800/80 text-ocean-600"
                >
                  <td className="py-2 pr-3" colSpan={6}>
                    <span
                      className="inline-block w-2 h-2 rounded-full mr-2"
                      style={{ background: m.color }}
                    />
                    {m.label} — no data
                  </td>
                </tr>
              );
            }
            return (
              <tr
                key={m.id}
                className={`border-t border-ocean-800/80 ${
                  isPrimary ? "bg-ocean-600/10" : "hover:bg-ocean-800/30"
                }`}
              >
                <td className="py-2 pr-3 font-medium">
                  <span
                    className="inline-block w-2 h-2 rounded-full mr-2"
                    style={{ background: m.color }}
                  />
                  {m.shortLabel}
                  {isPrimary && (
                    <span className="ml-1.5 text-[10px] uppercase text-ocean-400">
                      primary
                    </span>
                  )}
                </td>
                <td className="py-2 pr-3 tabular-nums">
                  {m.now.waveHeight != null
                    ? formatWave(m.now.waveHeight, units.wave)
                    : "—"}
                </td>
                <td className="py-2 pr-3 tabular-nums">
                  {m.now.swellHeight != null
                    ? formatWave(m.now.swellHeight, units.wave)
                    : "—"}
                </td>
                <td className="py-2 pr-3 tabular-nums">
                  {m.now.swellPeriod != null
                    ? `${m.now.swellPeriod.toFixed(0)}s`
                    : "—"}
                </td>
                <td className="py-2 pr-3">
                  {m.now.swellDirection != null
                    ? dirToCompass(m.now.swellDirection)
                    : "—"}
                </td>
                <td className="py-2 tabular-nums">
                  {m.now.secondarySwellHeight != null &&
                  m.now.secondarySwellHeight > 0
                    ? formatWave(m.now.secondarySwellHeight, units.wave)
                    : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function DashboardTideStrip({ forecast }: { forecast: SpotForecast }) {
  // Prefer model extremes when available, else astro
  const source =
    forecast.modelTides.length > 0 ? forecast.modelTides : forecast.tides;
  const extremes = nextExtremes(source, new Date(), 6);
  const kind = forecast.modelTides.length > 0 ? "model" : "astro";

  if (!extremes.length) {
    return (
      <p className="text-sm text-ocean-500">
        No upcoming tide extremes calculated.
      </p>
    );
  }
  return (
    <div className="space-y-2">
      <p className="text-[11px] text-ocean-500">
        Showing {kind === "model" ? "model sea-level" : "astronomical"}{" "}
        extremes
      </p>
      <div className="flex flex-wrap gap-2.5">
        {extremes.map((t) => (
          <div
            key={t.time}
            className="glass rounded-xl px-3.5 py-2.5 text-sm min-w-[104px]"
          >
            <div className="text-[10px] uppercase tracking-wider text-ocean-400 font-semibold">
              {t.type === "high" ? "High tide" : "Low tide"}
            </div>
            <div className="font-semibold text-ocean-200 tabular-nums mt-0.5">
              {formatTime(t.time)}
            </div>
            <div className="text-xs text-ocean-400 tabular-nums">
              {t.height.toFixed(2)} m
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
