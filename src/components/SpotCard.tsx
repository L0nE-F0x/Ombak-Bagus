import type { Spot, SpotForecast } from "../types";
import { currentHourly, useAppStore } from "../store/useAppStore";
import { RatingBadge, RatingPill } from "./RatingBadge";
import { WindArrow } from "./WindArrow";
import { formatWave, formatWind } from "../services/units";
import { dirToCompass } from "../services/openMeteo";

export function SpotCard({
  spot,
  forecast,
  compact = false,
}: {
  spot: Spot;
  forecast?: SpotForecast;
  compact?: boolean;
}) {
  const selectSpot = useAppStore((s) => s.selectSpot);
  const toggleFavorite = useAppStore((s) => s.toggleFavorite);
  const favorites = useAppStore((s) => s.favorites);
  const units = useAppStore((s) => s.units);
  const now = currentHourly(forecast);
  const isFav = favorites.includes(spot.id);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => selectSpot(spot.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          selectSpot(spot.id);
        }
      }}
      className="glass glass-hover rounded-2xl p-4 text-left w-full cursor-pointer group outline-none focus-visible:ring-2 focus-visible:ring-ocean-400"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 min-w-0">
            <h3 className="font-semibold text-foam truncate group-hover:text-ocean-300 transition-colors">
              {spot.name}
            </h3>
            <button
              type="button"
              className="text-sand-400 hover:text-sand-300 hover:scale-110 transition-transform shrink-0 p-0.5 rounded-md"
              onClick={(e) => {
                e.stopPropagation();
                toggleFavorite(spot.id);
              }}
              title={isFav ? "Remove favorite" : "Add favorite"}
              aria-label={isFav ? "Remove favorite" : "Add favorite"}
            >
              {isFav ? "★" : "☆"}
            </button>
          </div>
          <p className="text-xs text-ocean-400 mt-0.5 truncate">
            {spot.region}
            <span className="text-ocean-700 mx-1">·</span>
            <span className="capitalize">{spot.skill}</span>
            <span className="text-ocean-700 mx-1">·</span>
            {spot.bottom}
          </p>
        </div>
        {now ? (
          <RatingBadge rating={now.rating} />
        ) : (
          <div className="w-10 h-10 rounded-full skeleton shrink-0" />
        )}
      </div>

      {now && !compact && (
        <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-wider text-ocean-400 font-semibold">
              Swell
            </div>
            <div className="font-medium text-ocean-200 tabular-nums">
              {formatWave(now.swellHeight || now.waveHeight, units.wave)}
            </div>
            <div className="text-xs text-ocean-400 truncate">
              {now.swellPeriod.toFixed(0)}s {dirToCompass(now.swellDirection)}
            </div>
          </div>
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-wider text-ocean-400 font-semibold">
              Wind
            </div>
            <WindArrow
              direction={now.windDirection}
              relation={now.windRelation}
              size={18}
            />
            <div className="text-xs text-ocean-400 truncate capitalize">
              {formatWind(now.windSpeed, units.wind)} · {now.windRelation}
            </div>
          </div>
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-wider text-ocean-400 font-semibold">
              Score
            </div>
            <div className="mt-0.5">
              <RatingPill rating={now.rating} />
            </div>
          </div>
        </div>
      )}

      {now && compact && (
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ocean-300 tabular-nums">
          <span>{formatWave(now.waveHeight, units.wave)}</span>
          <span>{now.wavePeriod.toFixed(0)}s</span>
          <span>{formatWind(now.windSpeed, units.wind)}</span>
          <span className="capitalize">{now.windRelation}</span>
        </div>
      )}

      {!now && (
        <p className="mt-3 text-xs text-ocean-500">Waiting for forecast…</p>
      )}
    </div>
  );
}
