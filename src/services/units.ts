import type { Units } from "../types";

export function formatWave(m: number, units: Units["wave"]): string {
 if (!Number.isFinite(m)) return " - ";
 if (units === "ft") return `${(m * 3.28084).toFixed(1)} ft`;
 return `${m.toFixed(1)} m`;
}

export function formatWaveShort(m: number, units: Units["wave"]): string {
 if (!Number.isFinite(m)) return " - ";
 if (units === "ft") return (m * 3.28084).toFixed(1);
 return m.toFixed(1);
}

export function waveUnitLabel(units: Units["wave"]): string {
 return units === "ft" ? "ft" : "m";
}

export function toDisplayWave(m: number, units: Units["wave"]): number {
 if (!Number.isFinite(m)) return 0;
 return units === "ft" ? m * 3.28084 : m;
}

/** Convert knots -> display unit value. */
export function toDisplayWind(kn: number, units: Units["wind"]): number {
 if (!Number.isFinite(kn)) return 0;
 if (units === "kmh") return kn * 1.852;
 if (units === "mph") return kn * 1.15078;
 return kn;
}

export function windUnitLabel(units: Units["wind"]): string {
 if (units === "kmh") return "km/h";
 if (units === "mph") return "mph";
 return "kn";
}

export function formatWind(kn: number, units: Units["wind"]): string {
 if (!Number.isFinite(kn)) return " - ";
 const v = toDisplayWind(kn, units);
 if (units === "kmh") return `${v.toFixed(0)} km/h`;
 if (units === "mph") return `${v.toFixed(0)} mph`;
 return `${v.toFixed(0)} kn`;
}

export function formatTemp(c: number, units: Units["temp"]): string {
 if (!Number.isFinite(c)) return " - ";
 if (units === "f") return `${((c * 9) / 5 + 32).toFixed(0)}°F`;
 return `${c.toFixed(0)}°C`;
}
