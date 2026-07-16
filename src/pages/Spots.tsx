import { useMemo, useState } from "react";
import {
  BALI_SPOTS,
  EXPANDED_SPOT_COUNT,
  REGIONS,
  TOTAL_SPOT_COUNT,
} from "../data/spots";
import { currentHourly, useAppStore } from "../store/useAppStore";
import { SpotCard } from "../components/SpotCard";
import type { SkillLevel, SpotCatalog } from "../types";

export function Spots() {
  const forecasts = useAppStore((s) => s.forecasts);
  const favorites = useAppStore((s) => s.favorites);
  const regionFilter = useAppStore((s) => s.regionFilter);
  const setRegionFilter = useAppStore((s) => s.setRegionFilter);
  const [skillFilter, setSkillFilter] = useState<SkillLevel | "all">("all");
  const [catalogFilter, setCatalogFilter] = useState<SpotCatalog | "all">(
    "all"
  );
  const [favOnly, setFavOnly] = useState(false);
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<"rating" | "name" | "region">("rating");

  const list = useMemo(() => {
    const filtered = BALI_SPOTS.filter((s) => {
      if (regionFilter && s.region !== regionFilter) return false;
      if (skillFilter !== "all" && s.skill !== skillFilter) return false;
      if (catalogFilter !== "all" && s.catalog !== catalogFilter) return false;
      if (favOnly && !favorites.includes(s.id)) return false;
      if (query) {
        const q = query.toLowerCase();
        if (
          !s.name.toLowerCase().includes(q) &&
          !s.region.toLowerCase().includes(q) &&
          !s.bottom.toLowerCase().includes(q) &&
          !s.description.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "region") {
        const r = a.region.localeCompare(b.region);
        return r !== 0 ? r : a.name.localeCompare(b.name);
      }
      const ra = currentHourly(forecasts[a.id])?.rating ?? -1;
      const rb = currentHourly(forecasts[b.id])?.rating ?? -1;
      if (rb !== ra) return rb - ra;
      return a.name.localeCompare(b.name);
    });
  }, [
    regionFilter,
    skillFilter,
    catalogFilter,
    favOnly,
    favorites,
    query,
    sortBy,
    forecasts,
  ]);

  return (
    <div className="space-y-4 md:space-y-5">
      <header>
        <h1 className="page-title">Bali spots</h1>
        <p className="page-sub">
          {list.length} of {TOTAL_SPOT_COUNT} breaks
          <span className="text-ocean-600 mx-1">|</span>
          {EXPANDED_SPOT_COUNT} expanded catalog
          <span className="text-ocean-600 mx-1">|</span>
          swell windows &amp; offshore winds
        </p>
      </header>

      <div className="filter-bar">
        <input
          type="search"
          placeholder="Search name, region..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="input"
          enterKeyHint="search"
        />
        <select
          value={regionFilter ?? ""}
          onChange={(e) =>
            setRegionFilter(e.target.value === "" ? null : e.target.value)
          }
          className="select"
          aria-label="Region"
        >
          <option value="">All regions</option>
          {REGIONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <select
          value={skillFilter}
          onChange={(e) =>
            setSkillFilter(e.target.value as SkillLevel | "all")
          }
          className="select"
          aria-label="Skill level"
        >
          <option value="all">All levels</option>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
          <option value="expert">Expert</option>
        </select>
        <select
          value={catalogFilter}
          onChange={(e) =>
            setCatalogFilter(e.target.value as SpotCatalog | "all")
          }
          className="select"
          aria-label="Catalog"
        >
          <option value="all">All catalog</option>
          <option value="core">Core spots</option>
          <option value="expanded">Expanded</option>
        </select>
        <select
          value={sortBy}
          onChange={(e) =>
            setSortBy(e.target.value as "rating" | "name" | "region")
          }
          className="select"
          aria-label="Sort by"
        >
          <option value="rating">Sort: score</option>
          <option value="name">Sort: name</option>
          <option value="region">Sort: region</option>
        </select>
        <button
          type="button"
          onClick={() => setFavOnly((v) => !v)}
          className={`btn ${favOnly ? "chip-active" : "btn-ghost"}`}
          aria-pressed={favOnly}
        >
          {"\u2605"} Favorites
        </button>
      </div>

      {list.length === 0 ? (
        <div className="glass rounded-2xl p-6 md:p-8 text-center text-ocean-400 text-sm">
          No spots match those filters.
          <button
            type="button"
            className="block mx-auto mt-3 text-ocean-300 underline"
            onClick={() => {
              setQuery("");
              setSkillFilter("all");
              setCatalogFilter("all");
              setFavOnly(false);
              setRegionFilter(null);
            }}
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {list.map((spot) => (
            <SpotCard
              key={spot.id}
              spot={spot}
              forecast={forecasts[spot.id]}
            />
          ))}
        </div>
      )}
    </div>
  );
}
