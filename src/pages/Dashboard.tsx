import { useMemo } from "react";
import { BALI_SPOTS } from "../data/spots";
import { currentHourly, useAppStore } from "../store/useAppStore";
import { SpotCard } from "../components/SpotCard";
import { DashboardTideStrip, RatingChart } from "../components/Charts";
import { RatingBadge } from "../components/RatingBadge";
import { formatWave, formatWind } from "../services/units";
import { dirToCompass } from "../services/openMeteo";
import { formatDateTime, isStale } from "../services/time";

export function Dashboard() {
  const forecasts = useAppStore((s) => s.forecasts);
  const favorites = useAppStore((s) => s.favorites);
  const loading = useAppStore((s) => s.loading);
  const loadProgress = useAppStore((s) => s.loadProgress);
  const lastRefresh = useAppStore((s) => s.lastRefresh);
  const refreshAll = useAppStore((s) => s.refreshAll);
  const selectSpot = useAppStore((s) => s.selectSpot);
  const units = useAppStore((s) => s.units);

  const ranked = useMemo(() => {
    return BALI_SPOTS.map((spot) => {
      const fc = forecasts[spot.id];
      const now = currentHourly(fc);
      return { spot, fc, now, rating: now?.rating ?? -1 };
    })
      .filter((x) => x.rating >= 0)
      .sort((a, b) => b.rating - a.rating);
  }, [forecasts]);

  const bestToday = ranked.slice(0, 6);
  const favSpots = BALI_SPOTS.filter((s) => favorites.includes(s.id));
  const tideSource =
    forecasts[favorites[0]] ?? forecasts.uluwatu ?? ranked[0]?.fc;
  const top = bestToday[0];
  const hasData = Object.keys(forecasts).length > 0;
  const stale = isStale(lastRefresh, 90);

  return (
    <div className="space-y-7">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-ocean-400 text-xs uppercase tracking-[0.2em] font-semibold">
            Bali · Asia/Makassar
          </p>
          <h1 className="text-2xl md:text-3xl font-bold text-foam mt-1 tracking-tight">
            Where should you paddle out?
          </h1>
          <p className="text-ocean-300 mt-1.5 text-sm">
            {lastRefresh
              ? `Updated ${formatDateTime(lastRefresh)}${stale ? " · stale" : ""}`
              : "Load forecasts to get started"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => refreshAll()}
          disabled={loading}
          className="btn btn-primary"
        >
          {loading
            ? loadProgress
              ? `Loading ${loadProgress.done}/${loadProgress.total}…`
              : "Loading…"
            : "Refresh all spots"}
        </button>
      </header>

      {loading && !hasData && (
        <div className="glass rounded-2xl p-10 text-center">
          <div className="text-4xl animate-pulse-wave mb-3" aria-hidden>
            🌊
          </div>
          <p className="text-ocean-300">Fetching swell, wind & tides for Bali…</p>
          {loadProgress && (
            <div className="mt-4 max-w-xs mx-auto h-2 rounded-full bg-ocean-800 overflow-hidden">
              <div
                className="h-full bg-ocean-500 transition-all duration-300"
                style={{
                  width: `${Math.min(
                    100,
                    (loadProgress.done / Math.max(1, loadProgress.total)) * 100
                  )}%`,
                }}
              />
            </div>
          )}
        </div>
      )}

      {top && (
        <section
          className="relative overflow-hidden rounded-3xl p-6 border border-ocean-500/25"
          style={{
            background:
              "linear-gradient(135deg, #0f3044 0%, #0a1f2e 48%, #123a52 100%)",
          }}
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 85% 20%, #4ec4d9 0%, transparent 45%)",
            }}
          />
          <p className="text-sand-400 text-xs uppercase tracking-widest font-semibold relative">
            Best right now
          </p>
          <div className="flex flex-wrap items-center gap-3 mt-2 relative">
            <button
              type="button"
              onClick={() => selectSpot(top.spot.id)}
              className="text-2xl md:text-3xl font-bold text-foam hover:text-ocean-300 transition-colors text-left tracking-tight"
            >
              {top.spot.name}
            </button>
            <RatingBadge rating={top.rating} size="lg" />
          </div>
          {top.now && (
            <div className="mt-5 flex flex-wrap gap-x-8 gap-y-4 text-sm relative">
              <Stat
                label="Wave"
                value={formatWave(top.now.waveHeight, units.wave)}
                sub={`${top.now.wavePeriod.toFixed(0)}s · ${dirToCompass(top.now.waveDirection)}`}
              />
              <Stat
                label="Swell"
                value={formatWave(top.now.swellHeight, units.wave)}
                sub={`${top.now.swellPeriod.toFixed(0)}s · ${dirToCompass(top.now.swellDirection)}`}
              />
              <Stat
                label="Wind"
                value={formatWind(top.now.windSpeed, units.wind)}
                sub={`${dirToCompass(top.now.windDirection)} · ${top.now.windRelation}`}
              />
              <Stat
                label="Region"
                value={top.spot.region}
                sub={top.spot.skill}
              />
            </div>
          )}
        </section>
      )}

      {tideSource && (
        <section>
          <h2 className="section-title mb-1">Upcoming tides</h2>
          <p className="text-xs text-ocean-400 mb-3">
            Estimated for{" "}
            {BALI_SPOTS.find((s) => s.id === tideSource.spotId)?.region ??
              "Bali"}{" "}
            — planning only, not for navigation
          </p>
          <DashboardTideStrip forecast={tideSource} />
        </section>
      )}

      <section>
        <h2 className="section-title mb-3">Top spots today</h2>
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {bestToday.map(({ spot, fc }) => (
            <SpotCard key={spot.id} spot={spot} forecast={fc} />
          ))}
          {!bestToday.length && !loading && (
            <p className="text-ocean-400 text-sm col-span-full glass rounded-2xl p-6">
              Hit refresh to load live marine forecasts from Open-Meteo.
            </p>
          )}
        </div>
      </section>

      <section>
        <h2 className="section-title mb-3">Your favorites</h2>
        {favSpots.length === 0 ? (
          <p className="text-sm text-ocean-400 glass rounded-2xl p-5">
            Star spots from the Spots page — they&apos;ll show up here for a
            quick glance.
          </p>
        ) : (
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {favSpots.map((spot) => (
              <SpotCard
                key={spot.id}
                spot={spot}
                forecast={forecasts[spot.id]}
                compact
              />
            ))}
          </div>
        )}
      </section>

      {top?.fc && (
        <section>
          <h2 className="section-title mb-3">
            7-day score · {top.spot.name}
          </h2>
          <RatingChart forecast={top.fc} />
        </section>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-ocean-400 font-semibold">
        {label}
      </div>
      <div className="text-lg font-semibold text-foam tabular-nums mt-0.5">
        {value}
      </div>
      {sub && (
        <div className="text-xs text-ocean-400 capitalize mt-0.5">{sub}</div>
      )}
    </div>
  );
}
