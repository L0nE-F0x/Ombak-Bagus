import { format, isValid, parseISO } from "date-fns";

/** Parse Open-Meteo local times (no offset) and ISO timestamps safely. */
export function parseForecastTime(value: string): Date {
  if (!value) return new Date(NaN);
  // "2026-07-09T14:00" or with seconds / offset
  const d = parseISO(value.length === 16 ? `${value}:00` : value);
  if (isValid(d)) return d;
  const fallback = new Date(value);
  return fallback;
}

export function formatTime(value: string, pattern = "HH:mm"): string {
  const d = parseForecastTime(value);
  if (!isValid(d)) return value.slice(11, 16) || value;
  return format(d, pattern);
}

export function formatDay(value: string, pattern = "EEE d"): string {
  const raw = value.slice(0, 10);
  const d = parseISO(raw);
  if (!isValid(d)) return raw.slice(5);
  return format(d, pattern);
}

export function formatDateTime(value: string, pattern = "EEE d MMM · HH:mm"): string {
  const d = parseForecastTime(value);
  if (!isValid(d)) return value;
  return format(d, pattern);
}

export function dateKeyLocal(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function isStale(iso: string | null | undefined, maxMinutes = 90): boolean {
  if (!iso) return true;
  const t = parseForecastTime(iso).getTime();
  if (!Number.isFinite(t)) return true;
  return Date.now() - t > maxMinutes * 60_000;
}
