import { useEffect, useState } from "react";
import { useAppStore } from "../store/useAppStore";
import { formatDateTime } from "../services/time";
import {
  appVersion,
  checkForAppUpdate,
  RELEASES_URL,
  type UpdateCheckResult,
} from "../services/updates";
import { openUrl } from "@tauri-apps/plugin-opener";

export function Settings() {
  const units = useAppStore((s) => s.units);
  const setUnits = useAppStore((s) => s.setUnits);
  const lastRefresh = useAppStore((s) => s.lastRefresh);
  const favorites = useAppStore((s) => s.favorites);
  const sessions = useAppStore((s) => s.sessions);
  const notes = useAppStore((s) => s.notes);
  const refreshAll = useAppStore((s) => s.refreshAll);
  const loading = useAppStore((s) => s.loading);

  const [version, setVersion] = useState("...");
  const [updateState, setUpdateState] = useState<
    "idle" | "checking" | "installing" | UpdateCheckResult["status"]
  >("idle");
  const [updateInfo, setUpdateInfo] = useState<UpdateCheckResult | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [installProgress, setInstallProgress] = useState<string | null>(null);

  useEffect(() => {
    void appVersion().then(setVersion);
  }, []);

  const onCheckUpdates = async () => {
    setUpdateState("checking");
    setUpdateError(null);
    setInstallProgress(null);
    const result = await checkForAppUpdate();
    setUpdateInfo(result);
    setUpdateState(result.status);
    if (result.status === "unavailable") {
      setUpdateError(result.message);
    }
  };

  const onInstallUpdate = async () => {
    if (!updateInfo || updateInfo.status !== "available") return;
    setUpdateState("installing");
    setInstallProgress("Downloading update...");
    setUpdateError(null);
    try {
      setInstallProgress("Installing and restarting...");
      await updateInfo.install();
    } catch (err) {
      setUpdateState("available");
      setInstallProgress(null);
      setUpdateError(
        err instanceof Error ? err.message : "Update install failed"
      );
    }
  };

  const openReleases = async () => {
    try {
      await openUrl(RELEASES_URL);
    } catch {
      window.open(RELEASES_URL, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="space-y-6 max-w-xl">
      <header>
        <h1 className="page-title">Settings</h1>
        <p className="page-sub">Ombak Bagus | personal Bali surf desk</p>
      </header>

      <section className="glass rounded-2xl p-5 space-y-4">
        <h2 className="text-xs font-semibold text-ocean-300 uppercase tracking-wider">
          App updates
        </h2>
        <div className="flex items-center justify-between gap-4 text-sm">
          <span className="text-ocean-400">Installed version</span>
          <span className="text-foam font-medium tabular-nums">v{version}</span>
        </div>
        <p className="text-xs text-ocean-500 leading-relaxed">
          Updates install in the background from GitHub Releases, then restart
          the app. Ready for paid release channels later - same pipeline, signed
          packages.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => void onCheckUpdates()}
            disabled={
              updateState === "checking" || updateState === "installing"
            }
          >
            {updateState === "checking"
              ? "Checking..."
              : updateState === "installing"
                ? "Updating..."
                : "Check for updates"}
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => void openReleases()}>
            Open releases
          </button>
        </div>

        {updateState === "up-to-date" && (
          <p className="text-sm text-good">You are on the latest version.</p>
        )}
        {updateInfo?.status === "available" && (
          <div className="rounded-xl border border-ocean-500/30 bg-ocean-600/15 px-3.5 py-3 space-y-2">
            <p className="text-sm text-foam font-medium">
              Update available: v{updateInfo.version}
            </p>
            {updateInfo.notes && (
              <p className="text-xs text-ocean-300 whitespace-pre-wrap">
                {updateInfo.notes}
              </p>
            )}
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => void onInstallUpdate()}
              disabled={updateState === "installing"}
            >
              {updateState === "installing"
                ? installProgress ?? "Installing..."
                : "Download and install"}
            </button>
          </div>
        )}
        {updateError && (
          <p className="text-xs text-coral-400 leading-relaxed">
            {updateError}
            {" "}
            Use <strong className="font-medium">Open releases</strong> to
            download a manual installer if needed.
          </p>
        )}
      </section>

      <section className="glass rounded-2xl p-5 space-y-4">
        <h2 className="text-xs font-semibold text-ocean-300 uppercase tracking-wider">
          Units
        </h2>
        <UnitRow
          label="Wave height"
          value={units.wave}
          options={[
            { v: "m", l: "Meters" },
            { v: "ft", l: "Feet" },
          ]}
          onChange={(v) => setUnits({ wave: v as "m" | "ft" })}
        />
        <UnitRow
          label="Wind"
          value={units.wind}
          options={[
            { v: "kn", l: "Knots" },
            { v: "kmh", l: "km/h" },
            { v: "mph", l: "mph" },
          ]}
          onChange={(v) => setUnits({ wind: v as "kn" | "kmh" | "mph" })}
        />
        <UnitRow
          label="Temperature"
          value={units.temp}
          options={[
            { v: "c", l: "Celsius" },
            { v: "f", l: "Fahrenheit" },
          ]}
          onChange={(v) => setUnits({ temp: v as "c" | "f" })}
        />
      </section>

      <section className="glass rounded-2xl p-5 space-y-3 text-sm">
        <h2 className="text-xs font-semibold text-ocean-300 uppercase tracking-wider">
          Data sources
        </h2>
        <p className="text-ocean-200 leading-relaxed">
          <strong className="text-foam">Primary swell</strong> - Open-Meteo
          Marine <em>best match</em> (auto model for the spot)
        </p>
        <p className="text-ocean-200 leading-relaxed">
          <strong className="text-foam">Multi-model compare</strong> - GFS Wave
          0.25 deg / 0.16 deg, ECMWF WAM 0.25 deg, Meteo-France Wave (same API,
          independent models - Windguru-style cross-check)
        </p>
        <p className="text-ocean-200 leading-relaxed">
          <strong className="text-foam">Secondary swell</strong> - when the model
          grid provides a second swell train
        </p>
        <p className="text-ocean-200 leading-relaxed">
          <strong className="text-foam">Wind and weather</strong> - Open-Meteo
          Forecast API
        </p>
        <p className="text-ocean-200 leading-relaxed">
          <strong className="text-foam">Tides</strong> - model{" "}
          <code className="text-ocean-300 text-xs">sea_level_height_msl</code>{" "}
          when available, plus a local astronomical estimate (planning only -
          not for navigation)
        </p>
        <p className="text-ocean-400 text-xs leading-relaxed">
          Spot scores blend swell height/period/direction, wind vs. reef
          orientation, and tide preference. Daytime hours weight the 7-day
          outlook. Open-Meteo is free for non-commercial use.
        </p>
        <button
          type="button"
          className="btn btn-ghost mt-1"
          onClick={() => refreshAll()}
          disabled={loading}
        >
          {loading ? "Refreshing..." : "Refresh all forecasts now"}
        </button>
      </section>

      <section className="glass rounded-2xl p-5 space-y-2 text-sm text-ocean-300">
        <h2 className="text-xs font-semibold text-ocean-300 uppercase tracking-wider mb-2">
          Local data
        </h2>
        <Row k="Favorites" v={String(favorites.length)} />
        <Row k="Sessions logged" v={String(sessions.length)} />
        <Row
          k="Spot notes"
          v={String(notes.filter((n) => n.text.trim()).length)}
        />
        <Row
          k="Last refresh"
          v={lastRefresh ? formatDateTime(lastRefresh) : "Never"}
        />
        <p className="text-xs text-ocean-500 mt-2 leading-relaxed">
          Notes, sessions, and favorites stay on this PC (local storage inside
          the app). Forecasts are fetched live and not uploaded.
        </p>
      </section>

      <section className="glass rounded-2xl p-5 space-y-2 text-sm">
        <h2 className="text-xs font-semibold text-ocean-300 uppercase tracking-wider mb-2">
          System tray
        </h2>
        <p className="text-ocean-200 leading-relaxed">
          Minimize or close the window to keep Ombak Bagus running in the
          Windows system tray.
        </p>
        <ul className="text-ocean-300 text-xs space-y-1.5 list-disc list-inside leading-relaxed">
          <li>Left-click the tray icon to open the window</li>
          <li>Right-click for Open / Quit</li>
          <li>Use Quit in the tray menu to fully exit</li>
        </ul>
      </section>

      <section className="glass rounded-2xl p-5 text-sm text-ocean-400">
        <p className="text-foam font-medium">Ombak Bagus v{version}</p>
        <p className="mt-1.5 leading-relaxed">
          Built for checking Bali from a Windows desk - swell, wind, tides, and
          your logbook in one place.
        </p>
      </section>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-ocean-400">{k}</span>
      <span className="text-ocean-200 tabular-nums text-right">{v}</span>
    </div>
  );
}

function UnitRow({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { v: string; l: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-ocean-300">{label}</span>
      <div
        className="flex gap-0.5 bg-ocean-950 rounded-xl p-1 border border-ocean-800"
        role="group"
        aria-label={label}
      >
        {options.map((o) => (
          <button
            key={o.v}
            type="button"
            onClick={() => onChange(o.v)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              value === o.v
                ? "bg-ocean-600 text-foam shadow-sm"
                : "text-ocean-400 hover:text-foam"
            }`}
          >
            {o.l}
          </button>
        ))}
      </div>
    </div>
  );
}