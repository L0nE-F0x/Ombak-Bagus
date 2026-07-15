import type { MarineModelId } from "../types";

export interface MarineModelDef {
 id: MarineModelId;
 /** Suffix Open-Meteo appends to hourly keys when multi-model is requested */
 keySuffix: string;
 label: string;
 shortLabel: string;
 color: string;
 blurb: string;
}

/**
 * Models we request for Bali multi-model comparison.
 * Key suffixes verified against Open-Meteo multi-model marine responses.
 */
export const MARINE_MODELS: MarineModelDef[] = [
 {
 id: "best_match",
 keySuffix: "marine_best_match",
 label: "Best match",
 shortLabel: "Best",
 color: "#2a9bb8",
 blurb: "Open-Meteo auto-pick for this location (primary forecast).",
 },
 {
 id: "ncep_gfswave025",
 keySuffix: "ncep_gfswave025",
 label: "GFS Wave 0.25°",
 shortLabel: "GFS 25",
 color: "#fbbf24",
 blurb: "NOAA global wave model - common on Windguru-style tables.",
 },
 {
 id: "ncep_gfswave016",
 keySuffix: "ncep_gfswave016",
 label: "GFS Wave 0.16°",
 shortLabel: "GFS 16",
 color: "#e8c47a",
 blurb: "Higher-res NOAA GFS wave grid where available.",
 },
 {
 id: "ecmwf_wam025",
 keySuffix: "ecmwf_wam025",
 label: "ECMWF WAM 0.25°",
 shortLabel: "ECMWF",
 color: "#a78bfa",
 blurb: "European centre wave model - strong on open-ocean swell.",
 },
 {
 id: "meteofrance_wave",
 keySuffix: "meteofrance_wave",
 label: "Meteo-France Wave",
 shortLabel: "MF",
 color: "#34d399",
 blurb: "Meteo-France global wave product (MFWAM family).",
 },
];

export const PRIMARY_MODEL_ID: MarineModelId = "best_match";

export function modelDef(id: MarineModelId): MarineModelDef {
 return MARINE_MODELS.find((m) => m.id === id) ?? MARINE_MODELS[0];
}

export const MODELS_QUERY = MARINE_MODELS.map((m) => m.id).join(",");
