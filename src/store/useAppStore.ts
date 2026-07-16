import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
 Page,
 SpotForecast,
 SpotNote,
 SurfSession,
 Units,
} from "../types";
import { BALI_SPOTS, visibleSpots } from "../data/spots";
import { fetchManyForecasts, fetchSpotForecast } from "../services/openMeteo";
import { parseForecastTime } from "../services/time";

interface AppState {
 page: Page;
 selectedSpotId: string | null;
 favorites: string[];
 units: Units;
 notes: SpotNote[];
 sessions: SurfSession[];
 forecasts: Record<string, SpotForecast>;
 loading: boolean;
 refreshingSpotId: string | null;
 loadProgress: { done: number; total: number } | null;
 lastRefresh: string | null;
 error: string | null;
 regionFilter: string | null;

 setPage: (page: Page) => void;
 selectSpot: (id: string) => void;
 toggleFavorite: (id: string) => void;
 setUnits: (units: Partial<Units>) => void;
 setRegionFilter: (region: string | null) => void;
 clearError: () => void;

 refreshAll: () => Promise<void>;
 refreshSpot: (id: string) => Promise<void>;

 upsertNote: (spotId: string, text: string) => void;
 deleteNote: (id: string) => void;

 addSession: (session: Omit<SurfSession, "id" | "createdAt">) => void;
 updateSession: (id: string, patch: Partial<SurfSession>) => void;
 deleteSession: (id: string) => void;
}

function uid(): string {
 return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export const useAppStore = create<AppState>()(
 persist(
 (set, get) => ({
 page: "dashboard",
 selectedSpotId: null,
 favorites: ["uluwatu", "batu-bolong", "keramas", "padang-padang"],
 units: { wave: "m", wind: "kn", temp: "c" },
 notes: [],
 sessions: [],
 forecasts: {},
 loading: false,
 refreshingSpotId: null,
 loadProgress: null,
 lastRefresh: null,
 error: null,
 regionFilter: null,

 setPage: (page) => set({ page }),
 selectSpot: (id) => set({ selectedSpotId: id, page: "spot" }),
 toggleFavorite: (id) =>
 set((s) => ({
 favorites: s.favorites.includes(id)
 ? s.favorites.filter((f) => f !== id)
 : [...s.favorites, id],
 })),
 setUnits: (units) => set((s) => ({ units: { ...s.units, ...units } })),
 setRegionFilter: (regionFilter) => set({ regionFilter }),
 clearError: () => set({ error: null }),

 refreshAll: async () => {
 if (get().loading) return;
 const spots = visibleSpots();
 // Favorites first so the dashboard fills quickly with a large catalog.
 const favs = new Set(get().favorites);
 const ordered = [
   ...spots.filter((s) => favs.has(s.id)),
   ...spots.filter((s) => !favs.has(s.id)),
 ];
 set({
 loading: true,
 error: null,
 loadProgress: { done: 0, total: ordered.length },
 });
 try {
 const map = await fetchManyForecasts(ordered, 6, (done, total) => {
 set({ loadProgress: { done, total } });
 });
 const forecasts: Record<string, SpotForecast> = {};
 map.forEach((v, k) => {
 forecasts[k] = v;
 });
 const loaded = Object.keys(forecasts).length;
 set({
 forecasts,
 loading: false,
 loadProgress: null,
 lastRefresh: loaded ? new Date().toISOString() : get().lastRefresh,
 error:
 loaded === 0
 ? "No forecasts loaded. Check your internet connection."
 : loaded < ordered.length
 ? `Loaded ${loaded}/${ordered.length} spots. Some requests failed.`
 : null,
 });
 } catch (e) {
 set({
 loading: false,
 loadProgress: null,
 error: e instanceof Error ? e.message : "Failed to load forecasts",
 });
 }
 },

 refreshSpot: async (id) => {
 const spot = BALI_SPOTS.find((s) => s.id === id);
 if (!spot || get().refreshingSpotId === id) return;
 set({ refreshingSpotId: id, error: null });
 try {
 const fc = await fetchSpotForecast(spot);
 set((s) => ({
 forecasts: { ...s.forecasts, [id]: fc },
 lastRefresh: new Date().toISOString(),
 refreshingSpotId: null,
 }));
 } catch (e) {
 set({
 refreshingSpotId: null,
 error: e instanceof Error ? e.message : "Failed to refresh spot",
 });
 }
 },

 upsertNote: (spotId, text) =>
 set((s) => {
 const existing = s.notes.find((n) => n.spotId === spotId);
 if (existing) {
 if (!text.trim()) {
 return { notes: s.notes.filter((n) => n.spotId !== spotId) };
 }
 return {
 notes: s.notes.map((n) =>
 n.spotId === spotId
 ? { ...n, text, updatedAt: new Date().toISOString() }
 : n
 ),
 };
 }
 if (!text.trim()) return s;
 return {
 notes: [
 ...s.notes,
 {
 id: uid(),
 spotId,
 text,
 updatedAt: new Date().toISOString(),
 },
 ],
 };
 }),

 deleteNote: (id) =>
 set((s) => ({ notes: s.notes.filter((n) => n.id !== id) })),

 addSession: (session) =>
 set((s) => ({
 sessions: [
 {
 ...session,
 id: uid(),
 createdAt: new Date().toISOString(),
 },
 ...s.sessions,
 ],
 })),

 updateSession: (id, patch) =>
 set((s) => ({
 sessions: s.sessions.map((x) =>
 x.id === id ? { ...x, ...patch } : x
 ),
 })),

 deleteSession: (id) =>
 set((s) => ({ sessions: s.sessions.filter((x) => x.id !== id) })),
 }),
 {
 name: "ombak-bagus-v1",
 partialize: (s) => ({
 favorites: s.favorites,
 units: s.units,
 notes: s.notes,
 sessions: s.sessions,
 }),
 }
 )
);

/** Current (or nearest) hourly forecast slice. */
export function currentHourly(fc: SpotForecast | undefined) {
 if (!fc?.hourly.length) return null;
 const now = Date.now();
 let best = fc.hourly[0];
 let bestScore = Infinity;

 for (const h of fc.hourly) {
 const t = parseForecastTime(h.time).getTime();
 if (!Number.isFinite(t)) continue;
 // Prefer hours in a Â±90 min window around now; else nearest
 const delta = t - now;
 const inWindow = delta >= -45 * 60_000 && delta <= 90 * 60_000;
 const score = inWindow ? Math.abs(delta) : Math.abs(delta) + 1e12;
 if (score < bestScore) {
 best = h;
 bestScore = score;
 }
 }
 return best;
}
