import { useEffect, useMemo, useState, type ReactNode } from "react";
import { getSpotById } from "../data/spots";
import { currentHourly, useAppStore } from "../store/useAppStore";
import {
 ModelCompareChart,
 ModelCompareTable,
 RatingChart,
 SwellChart,
 TideChart,
 WindChart,
} from "../components/Charts";
import { RatingBadge, RatingPill } from "../components/RatingBadge";
import { WindArrow, SwellArrow } from "../components/WindArrow";
import { formatTemp, formatWave, formatWind } from "../services/units";
import { dirToCompass } from "../services/openMeteo";
import { nextExtremes } from "../services/tides";
import {
 dateKeyLocal,
 formatDateTime,
 formatDay,
 formatTime,
} from "../services/time";

export function SpotDetail() {
 const selectedSpotId = useAppStore((s) => s.selectedSpotId);
 const forecasts = useAppStore((s) => s.forecasts);
 const favorites = useAppStore((s) => s.favorites);
 const toggleFavorite = useAppStore((s) => s.toggleFavorite);
 const setPage = useAppStore((s) => s.setPage);
 const refreshSpot = useAppStore((s) => s.refreshSpot);
 const refreshingSpotId = useAppStore((s) => s.refreshingSpotId);
 const units = useAppStore((s) => s.units);
 const notes = useAppStore((s) => s.notes);
 const upsertNote = useAppStore((s) => s.upsertNote);
 const [noteDraft, setNoteDraft] = useState<string | null>(null);

 useEffect(() => {
 setNoteDraft(null);
 }, [selectedSpotId]);

 const spot = selectedSpotId ? getSpotById(selectedSpotId) : undefined;
 const fc = selectedSpotId ? forecasts[selectedSpotId] : undefined;
 const now = currentHourly(fc);
 const note = notes.find((n) => n.spotId === selectedSpotId);
 const refreshing = refreshingSpotId === selectedSpotId;

 const hourlyToday = useMemo(() => {
 if (!fc) return [];
 const today = dateKeyLocal();
 return fc.hourly.filter((h) => h.time.startsWith(today));
 }, [fc]);

 if (!spot) {
 return (
 <div className="glass rounded-2xl p-8 text-ocean-400 text-sm">
 No spot selected.{" "}
 <button
 type="button"
 className="text-ocean-300 underline font-medium"
 onClick={() => setPage("spots")}
 >
 Browse spots
 </button>
 </div>
 );
 }

 const isFav = favorites.includes(spot.id);
 const tideSource =
 fc && fc.modelTides.length > 0 ? fc.modelTides : fc?.tides ?? [];
 const extremes = tideSource.length
 ? nextExtremes(tideSource, new Date(), 4)
 : [];
 const noteValue = noteDraft ?? note?.text ?? "";

 return (
 <div className="space-y-6">
       <button
        type="button"
        onClick={() => setPage("spots")}
        className="text-sm text-ocean-400 hover:text-ocean-300 inline-flex items-center gap-1.5 font-medium"
      >
        {"\u2190"} All spots
      </button>

 <header className="flex flex-wrap items-start justify-between gap-4">
 <div className="min-w-0">
 <div className="flex flex-wrap items-center gap-3">
 <h1 className="page-title">
 {spot.name}
 </h1>
 <button
 type="button"
 onClick={() => toggleFavorite(spot.id)}
 className="text-2xl text-sand-400 hover:text-sand-300 hover:scale-110 transition-transform leading-none"
 title={isFav ? "Remove favorite" : "Add favorite"}
 aria-label={isFav ? "Remove favorite" : "Add favorite"}
 >
 {isFav ? "\u2605" : "\u2606"}
 </button>
 {now && <RatingBadge rating={now.rating} size="lg" />}
 </div>
 <p className="text-ocean-400 mt-1.5 text-sm">
 {spot.region}
 <span className="text-ocean-700 mx-1.5">|</span>
 <span className="capitalize">{spot.skill}</span>
 <span className="text-ocean-700 mx-1.5">|</span>
 {spot.bottom}
 <span className="text-ocean-700 mx-1.5">|</span>
 faces {dirToCompass(spot.faces)}
 </p>
 <p className="text-sm text-ocean-300 mt-2 max-w-2xl leading-relaxed">
 {spot.description}
 </p>
 <p className="text-xs text-ocean-500 mt-1.5">
 Best months: {spot.bestMonths}
 <span className="text-ocean-700 mx-1.5">|</span>
 Tide preference: {spot.tidePreference}
 {fc && (
 <>
 <span className="text-ocean-700 mx-1.5">|</span>
 Model: {fc.primaryModelLabel}
 </>
 )}
 </p>
 </div>
 <button
 type="button"
 onClick={() => refreshSpot(spot.id)}
 disabled={refreshing}
 className="btn btn-ghost"
 >
 {refreshing ? "Refreshing..." : "Refresh spot"}
 </button>
 </header>

 {now ? (
 <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
 <Metric
 label="Wave height"
 value={formatWave(now.waveHeight, units.wave)}
 sub={`${now.wavePeriod.toFixed(1)}s | ${dirToCompass(now.waveDirection)}`}
 />
 <Metric
 label="Primary swell"
 value={formatWave(now.swellHeight, units.wave)}
 sub={
 <span className="inline-flex items-center gap-1">
 <SwellArrow direction={now.swellDirection} size={16} />
 {now.swellPeriod.toFixed(0)}s{" "}
 {dirToCompass(now.swellDirection)}
 </span>
 }
 />
 <Metric
 label="Secondary swell"
 value={
 now.secondarySwellHeight != null && now.secondarySwellHeight > 0
 ? formatWave(now.secondarySwellHeight, units.wave)
 : " - "
 }
 sub={
 now.secondarySwellHeight != null &&
 now.secondarySwellHeight > 0 &&
 now.secondarySwellDirection != null ? (
 <span className="inline-flex items-center gap-1">
 <SwellArrow
 direction={now.secondarySwellDirection}
 size={16}
 />
 {(now.secondarySwellPeriod ?? 0).toFixed(0)}s{" "}
 {dirToCompass(now.secondarySwellDirection)}
 </span>
 ) : (
 "No 2nd train in model"
 )
 }
 />
 <Metric
 label="Wind"
 value={formatWind(now.windSpeed, units.wind)}
 sub={
 <span className="inline-flex items-center gap-1.5 capitalize flex-wrap">
 <WindArrow
 direction={now.windDirection}
 relation={now.windRelation}
 size={18}
 showLabel={false}
 />
 {dirToCompass(now.windDirection)} | {now.windRelation}
 <span className="text-ocean-500">
 gust {formatWind(now.windGusts, units.wind)}
 </span>
 </span>
 }
 />
 <Metric
 label="Air temp"
 value={formatTemp(now.temperature, units.temp)}
 sub={<RatingPill rating={now.rating} />}
 />
 </div>
 ) : (
 <div className="glass rounded-2xl p-6 text-ocean-400 text-sm flex flex-wrap items-center justify-between gap-3">
 <span>
 No forecast loaded for this spot yet.
 </span>
 <button
 type="button"
 className="btn btn-primary"
 onClick={() => refreshSpot(spot.id)}
 disabled={refreshing}
 >
 {refreshing ? "Loading..." : "Load forecast"}
 </button>
 </div>
 )}

 {extremes.length > 0 && (
 <div className="space-y-2">
 <p className="text-[11px] text-ocean-500">
 Upcoming tides (
 {fc && fc.modelTides.length > 0
 ? "model sea level"
 : "astronomical estimate"}
 )
 </p>
 <div className="flex flex-wrap gap-2">
 {extremes.map((t) => (
 <div key={t.time} className="glass rounded-xl px-3 py-2 text-sm">
 <span className="text-ocean-400 text-[10px] uppercase tracking-wider font-semibold">
 {t.type}
 </span>
 <span className="font-medium tabular-nums ml-2">
 {formatTime(t.time)}
 </span>
 <span className="text-ocean-400 ml-1.5 tabular-nums">
 {t.height.toFixed(2)} m
 </span>
 </div>
 ))}
 </div>
 </div>
 )}

 {fc && (
 <>
 <section className="space-y-3">
 <h2 className="section-title">Models</h2>
 <ModelCompareTable forecast={fc} />
 <ModelCompareChart forecast={fc} />
 </section>

 <div className="grid lg:grid-cols-2 gap-4">
 <SwellChart forecast={fc} />
 <WindChart forecast={fc} />
 <TideChart forecast={fc} />
 <RatingChart forecast={fc} />
 </div>

 <section className="glass rounded-2xl p-4 overflow-hidden">
 <h3 className="text-sm font-medium text-ocean-300 mb-3">
 Today hourly
 </h3>
 {hourlyToday.length === 0 ? (
 <p className="text-sm text-ocean-500 py-4 text-center">
 No hourly rows for today in this forecast window.
 </p>
 ) : (
 <div className="overflow-x-auto -mx-1 px-1 max-h-[420px] overflow-y-auto">
 <table className="w-full text-sm min-w-[640px] data-table">
 <thead>
 <tr className="text-left text-[10px] text-ocean-400 uppercase tracking-wider">
 <th className="pb-2 pr-3 font-semibold">Time</th>
 <th className="pb-2 pr-3 font-semibold">Wave</th>
 <th className="pb-2 pr-3 font-semibold">Period</th>
 <th className="pb-2 pr-3 font-semibold">Swell</th>
 <th className="pb-2 pr-3 font-semibold">2nd</th>
 <th className="pb-2 pr-3 font-semibold">Wind</th>
 <th className="pb-2 pr-3 font-semibold">Rel</th>
 <th className="pb-2 font-semibold">Score</th>
 </tr>
 </thead>
 <tbody>
 {hourlyToday.map((h) => {
 const isNow = now?.time === h.time;
 return (
 <tr
 key={h.time}
 className={`border-t border-ocean-800/80 ${
 isNow
 ? "bg-ocean-600/15"
 : "hover:bg-ocean-800/40"
 }`}
 >
 <td className="py-2 pr-3 font-medium tabular-nums">
 {formatTime(h.time)}
 {isNow && (
 <span className="ml-1.5 text-[10px] text-ocean-400 uppercase">
 now
 </span>
 )}
 </td>
 <td className="py-2 pr-3 tabular-nums">
 {formatWave(h.waveHeight, units.wave)}
 </td>
 <td className="py-2 pr-3 tabular-nums">
 {h.wavePeriod.toFixed(0)}s
 </td>
 <td className="py-2 pr-3">
 {dirToCompass(h.swellDirection)}
 </td>
 <td className="py-2 pr-3 tabular-nums text-ocean-400">
 {h.secondarySwellHeight != null &&
 h.secondarySwellHeight > 0
 ? formatWave(h.secondarySwellHeight, units.wave)
 : " - "}
 </td>
 <td className="py-2 pr-3 tabular-nums">
 {formatWind(h.windSpeed, units.wind)}{" "}
 {dirToCompass(h.windDirection)}
 </td>
 <td className="py-2 pr-3 capitalize text-ocean-300">
 {h.windRelation}
 </td>
 <td className="py-2">
 <RatingBadge rating={h.rating} size="sm" />
 </td>
 </tr>
 );
 })}
 </tbody>
 </table>
 </div>
 )}
 </section>

 <section className="glass rounded-2xl p-4">
 <h3 className="text-sm font-medium text-ocean-300 mb-3">
 7-day summary
 </h3>
 <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
 {fc.daily.map((d) => (
 <div
 key={d.date}
 className="rounded-xl bg-ocean-950/50 border border-ocean-800 p-3 text-center"
 >
 <div className="text-xs text-ocean-400 font-medium">
 {formatDay(d.date)}
 </div>
 <div className="mt-1.5 flex justify-center">
 <RatingBadge rating={d.ratingAvg} size="sm" />
 </div>
 <div className="text-xs text-ocean-300 mt-2 tabular-nums">
 {formatWave(d.swellHeightMax, units.wave)}
 </div>
 <div className="text-[10px] text-ocean-500 tabular-nums">
 {d.swellPeriodMax.toFixed(0)}s max
 </div>
 </div>
 ))}
 </div>
 </section>
 </>
 )}

 <section className="glass rounded-2xl p-4">
 <h3 className="text-sm font-medium text-ocean-300 mb-2">
 Your notes | {spot.name}
 </h3>
 <textarea
 className="textarea"
 placeholder="Local knowledge: entry, hazards, best tide, parking..."
 value={noteValue}
 onChange={(e) => setNoteDraft(e.target.value)}
 onBlur={() => {
 if (noteDraft === null) return;
 upsertNote(spot.id, noteDraft);
 setNoteDraft(null);
 }}
 />
 {note && (
 <p className="text-[10px] text-ocean-500 mt-1.5">
 Saved {formatDateTime(note.updatedAt, "d MMM yyyy HH:mm")}
 </p>
 )}
 </section>
 </div>
 );
}

function Metric({
 label,
 value,
 sub,
}: {
 label: string;
 value: string;
 sub?: ReactNode;
}) {
 return (
 <div className="glass rounded-2xl p-4 min-w-0">
 <div className="text-[10px] uppercase tracking-wider text-ocean-400 font-semibold">
 {label}
 </div>
 <div className="text-xl font-semibold text-foam mt-1 tabular-nums truncate">
 {value}
 </div>
 {sub && (
 <div className="text-xs text-ocean-400 mt-1.5 leading-snug">{sub}</div>
 )}
 </div>
 );
}
