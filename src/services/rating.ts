import type { Spot, TidePreference, WindRelation } from "../types";

/** Hex colors (safe for inline styles + alpha suffixes). */
export const RATING_HEX = {
 epic: "#6bbf8a",
 good: "#6ee7b7",
 fair: "#d4a574",
 poor: "#e07a6a",
} as const;

function angleInWindow(angle: number, min: number, max: number): boolean {
 const a = ((angle % 360) + 360) % 360;
 const lo = ((min % 360) + 360) % 360;
 const hi = ((max % 360) + 360) % 360;
 if (lo <= hi) return a >= lo && a <= hi;
 return a >= lo || a <= hi;
}

function angularDistance(a: number, b: number): number {
 const d = Math.abs((((a - b) % 360) + 360) % 360);
 return Math.min(d, 360 - d);
}

export function windRelation(
 windDir: number,
 windSpeedKn: number,
 spot: Spot
): WindRelation {
 if (windSpeedKn < 4) return "glassy";
 if (angleInWindow(windDir, spot.offshoreWindow[0], spot.offshoreWindow[1])) {
 return "offshore";
 }
 const onshore = (spot.faces + 180) % 360;
 if (angularDistance(windDir, onshore) < 50) return "onshore";
 return "cross";
}

function heightScore(heightM: number, skill: Spot["skill"]): number {
 const bands: Record<Spot["skill"], [number, number, number]> = {
 beginner: [0.4, 0.9, 1.4],
 intermediate: [0.7, 1.4, 2.2],
 advanced: [1.0, 2.0, 3.5],
 expert: [1.2, 2.5, 5.0],
 };
 const [low, ideal, high] = bands[skill];
 if (heightM < low * 0.5) return 1;
 if (heightM < low) return 4;
 if (heightM <= ideal) return 9;
 if (heightM <= high) return 7;
 if (heightM <= high * 1.3) return 4;
 return 2;
}

function periodScore(periodS: number): number {
 if (periodS >= 14) return 10;
 if (periodS >= 12) return 9;
 if (periodS >= 10) return 7;
 if (periodS >= 8) return 5;
 if (periodS >= 6) return 3;
 return 1;
}

function windScore(relation: WindRelation, speedKn: number): number {
 if (relation === "glassy") return 10;
 if (relation === "offshore") {
 if (speedKn <= 12) return 10;
 if (speedKn <= 18) return 8;
 if (speedKn <= 25) return 5;
 return 2;
 }
 if (relation === "cross") {
 if (speedKn <= 8) return 6;
 if (speedKn <= 15) return 4;
 return 2;
 }
 if (speedKn <= 6) return 4;
 if (speedKn <= 12) return 2;
 return 0;
}

function swellDirectionScore(swellDir: number, spot: Spot): number {
 if (angleInWindow(swellDir, spot.swellWindow[0], spot.swellWindow[1])) {
 return 10;
 }
 const mid = (spot.swellWindow[0] + spot.swellWindow[1]) / 2;
 const dist = angularDistance(swellDir, mid);
 if (dist < 40) return 7;
 if (dist < 70) return 4;
 return 2;
}

function tideScore(
 stage: "low" | "rising" | "high" | "falling" | "mid",
 pref: TidePreference
): number {
 if (pref === "all") return 7;
 if (pref === "low" && (stage === "low" || stage === "rising")) return 9;
 if (pref === "high" && (stage === "high" || stage === "falling")) return 9;
 if (
 pref === "mid" &&
 (stage === "rising" || stage === "falling" || stage === "mid")
 )
 return 9;
 if (pref === "mid" && (stage === "low" || stage === "high")) return 5;
 return 4;
}

export interface RatingInput {
 spot: Spot;
 waveHeight: number;
 wavePeriod: number;
 swellHeight: number;
 swellDirection: number;
 swellPeriod: number;
 windSpeed: number;
 windDirection: number;
 tideStage: "low" | "rising" | "high" | "falling" | "mid";
}

/** Composite 0-10 score for a spot/hour. */
export function rateConditions(input: RatingInput): {
 rating: number;
 windRelation: WindRelation;
} {
 const relation = windRelation(
 input.windDirection,
 input.windSpeed,
 input.spot
 );
 const h = Math.max(input.swellHeight, input.waveHeight * 0.85);
 const p = Math.max(input.swellPeriod, input.wavePeriod);

 const scores = {
 height: heightScore(h, input.spot.skill),
 period: periodScore(p),
 wind: windScore(relation, input.windSpeed),
 swellDir: swellDirectionScore(
 input.swellDirection || input.windDirection,
 input.spot
 ),
 tide: tideScore(input.tideStage, input.spot.tidePreference),
 };

 const rating =
 scores.height * 0.28 +
 scores.period * 0.22 +
 scores.wind * 0.28 +
 scores.swellDir * 0.14 +
 scores.tide * 0.08;

 return {
 rating: Math.round(Math.min(10, Math.max(0, rating)) * 10) / 10,
 windRelation: relation,
 };
}

export function ratingLabel(
 rating: number
): "epic" | "good" | "fair" | "poor" {
 if (rating >= 7.5) return "epic";
 if (rating >= 5.5) return "good";
 if (rating >= 3.5) return "fair";
 return "poor";
}

export function ratingColor(rating: number): string {
 return RATING_HEX[ratingLabel(rating)];
}

export function withAlpha(hex: string, alphaHex: string): string {
 // alphaHex e.g. "22", "18"
 if (hex.startsWith("#") && hex.length === 7) return `${hex}${alphaHex}`;
 return hex;
}
