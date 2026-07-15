import type { TidePoint } from "../types";
import { parseForecastTime } from "./time";

/**
 * Approximate astronomical tide model for Bali waters.
 * Semi-diurnal + diurnal constituents tuned for southern Bali.
 * Planning aid only - not a navigation chart.
 */

interface Constituent {
 speed: number;
 amp: number;
 phase: number;
}

const REGION_TUNE: Record<
 string,
 { scale: number; phaseHours: number; msl: number }
> = {
 Bukit: { scale: 1.0, phaseHours: 0, msl: 1.15 },
 Canggu: { scale: 0.95, phaseHours: 0.15, msl: 1.1 },
 "East Coast": { scale: 0.9, phaseHours: 0.4, msl: 1.05 },
 Sanur: { scale: 0.92, phaseHours: 0.35, msl: 1.05 },
 "Nusa Dua": { scale: 0.98, phaseHours: 0.1, msl: 1.12 },
 "West Coast": { scale: 0.85, phaseHours: -0.2, msl: 1.0 },
 "Uluwatu Area": { scale: 1.0, phaseHours: 0, msl: 1.15 },
};

const CONSTITUENTS: Constituent[] = [
 { speed: 28.984104, amp: 0.55, phase: 210 }, // M2
 { speed: 30.0, amp: 0.28, phase: 240 }, // S2
 { speed: 15.041069, amp: 0.22, phase: 320 }, // K1
 { speed: 13.943036, amp: 0.12, phase: 290 }, // O1
 { speed: 28.43973, amp: 0.08, phase: 180 }, // N2
];

const REF_MS = Date.UTC(2024, 0, 1, 0, 0, 0);

function heightAt(
 date: Date,
 scale: number,
 phaseHours: number,
 msl: number
): number {
 const hours = (date.getTime() - REF_MS) / 3_600_000 + phaseHours;
 let h = msl;
 for (const c of CONSTITUENTS) {
 const angle = ((c.speed * hours - c.phase) * Math.PI) / 180;
 h += c.amp * scale * Math.cos(angle);
 }
 return h;
}

export function predictTides(
 region: string,
 start: Date,
 hours: number,
 stepMinutes = 30
): TidePoint[] {
 const tune = REGION_TUNE[region] ?? REGION_TUNE.Bukit;
 const points: TidePoint[] = [];
 const steps = Math.ceil((hours * 60) / stepMinutes);

 for (let i = 0; i <= steps; i++) {
 const t = new Date(start.getTime() + i * stepMinutes * 60_000);
 points.push({
 time: t.toISOString(),
 height:
 Math.round(
 heightAt(t, tune.scale, tune.phaseHours, tune.msl) * 100
 ) / 100,
 });
 }

 return markExtremes(points);
}

function markExtremes(points: TidePoint[]): TidePoint[] {
 if (points.length < 3) return points;
 const out = points.map((p) => ({ ...p }));

 for (let i = 1; i < out.length - 1; i++) {
 const prev = out[i - 1].height;
 const cur = out[i].height;
 const next = out[i + 1].height;
 if (cur > prev && cur >= next) {
 out[i].type = "high";
 } else if (cur < prev && cur <= next) {
 out[i].type = "low";
 }
 }
 return out;
}

export function nextExtremes(
 tides: TidePoint[],
 from = new Date(),
 count = 4
): TidePoint[] {
 const fromMs = from.getTime() - 15 * 60_000; // include current extreme window
 return tides
 .filter((t) => t.type && parseForecastTime(t.time).getTime() >= fromMs)
 .slice(0, count);
}

export function tideHeightAt(
 tides: TidePoint[],
 when: Date | string
): number | null {
 if (!tides.length) return null;
 const ms =
 typeof when === "string"
 ? parseForecastTime(when).getTime()
 : when.getTime();
 if (!Number.isFinite(ms)) return tides[0].height;

 let best = tides[0];
 let bestDiff = Math.abs(parseForecastTime(tides[0].time).getTime() - ms);
 for (const t of tides) {
 const d = Math.abs(parseForecastTime(t.time).getTime() - ms);
 if (d < bestDiff) {
 best = t;
 bestDiff = d;
 }
 }
 return best.height;
}

export type TideStage = "low" | "rising" | "high" | "falling" | "mid";

/**
 * Stage at a specific moment (not "now") relative to the tide series.
 */
export function tideStageAt(
 tides: TidePoint[],
 when: Date | string
): TideStage {
 if (!tides.length) return "mid";

 const ms =
 typeof when === "string"
 ? parseForecastTime(when).getTime()
 : when.getTime();

 // Find surrounding points
 let i = 0;
 while (
 i < tides.length - 1 &&
 parseForecastTime(tides[i + 1].time).getTime() <= ms
 ) {
 i++;
 }
 const cur = tides[i];
 const next = tides[Math.min(i + 1, tides.length - 1)];
 const height = cur.height;
 const rising = next.height >= cur.height;

 const heights = tides.map((t) => t.height);
 const min = Math.min(...heights);
 const max = Math.max(...heights);
 const range = max - min || 1;
 const norm = (height - min) / range;

 if (norm < 0.22) return rising ? "rising" : "low";
 if (norm > 0.78) return rising ? "high" : "falling";
 return rising ? "rising" : "falling";
}

/** @deprecated use tideStageAt */
export function tideStage(_height: number, tides: TidePoint[]): TideStage {
 return tideStageAt(tides, new Date());
}
