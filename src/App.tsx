import { useEffect, useRef, type ReactNode } from "react";
import { useAppStore } from "./store/useAppStore";
import { Dashboard } from "./pages/Dashboard";
import { Spots } from "./pages/Spots";
import { SpotDetail } from "./pages/SpotDetail";
import { Sessions } from "./pages/Sessions";
import { Notes } from "./pages/Notes";
import { Settings } from "./pages/Settings";
import type { Page } from "./types";
import {
  IconDashboard,
  IconNotes,
  IconSessions,
  IconSettings,
  IconSpots,
} from "./components/NavIcons";
import { isStale } from "./services/time";

const NAV: {
  id: Page;
  label: string;
  icon: (p: { className?: string }) => ReactNode;
}[] = [
  { id: "dashboard", label: "Dashboard", icon: IconDashboard },
  { id: "spots", label: "Spots", icon: IconSpots },
  { id: "sessions", label: "Sessions", icon: IconSessions },
  { id: "notes", label: "Notes", icon: IconNotes },
  { id: "settings", label: "Settings", icon: IconSettings },
];

function App() {
  const page = useAppStore((s) => s.page);
  const setPage = useAppStore((s) => s.setPage);
  const refreshAll = useAppStore((s) => s.refreshAll);
  const forecasts = useAppStore((s) => s.forecasts);
  const loading = useAppStore((s) => s.loading);
  const lastRefresh = useAppStore((s) => s.lastRefresh);
  const error = useAppStore((s) => s.error);
  const clearError = useAppStore((s) => s.clearError);
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!Object.keys(forecasts).length && !loading) {
      void refreshAll();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Soft auto-refresh when data is stale and window gains focus
  useEffect(() => {
    const onFocus = () => {
      if (!loading && isStale(lastRefresh, 90)) {
        void refreshAll();
      }
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [lastRefresh, loading, refreshAll]);

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 });
  }, [page]);

  return (
    <div className="h-full flex bg-ocean-950 overflow-hidden">
      <aside className="w-[68px] md:w-52 shrink-0 border-r border-ocean-800/80 flex flex-col bg-ocean-900/60">
        <div className="p-3 md:px-4 md:py-4 border-b border-ocean-800/80">
          <div className="flex items-center gap-2.5">
            <img
              src="/app-icon.png"
              alt=""
              width={36}
              height={36}
              className="w-9 h-9 rounded-[10px] shadow-md shadow-black/30 shrink-0 ring-1 ring-ocean-500/20"
              draggable={false}
            />
            <div className="hidden md:block min-w-0">
              <div className="font-bold text-foam leading-tight tracking-tight">
                Ombak Bagus
              </div>
              <div className="text-[10px] text-ocean-400 uppercase tracking-[0.14em] mt-0.5">
                Bali surf desk
              </div>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-2 space-y-1" aria-label="Main">
          {NAV.map((item) => {
            const active =
              page === item.id || (item.id === "spots" && page === "spot");
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setPage(item.id)}
                title={item.label}
                className={`w-full flex items-center gap-3 px-2.5 md:px-3 py-2.5 rounded-xl text-sm transition-colors ${
                  active
                    ? "bg-ocean-700/70 text-foam border border-ocean-500/35 shadow-sm shadow-black/20"
                    : "text-ocean-300 hover:bg-ocean-800/70 hover:text-foam border border-transparent"
                }`}
              >
                <span
                  className={`w-6 flex justify-center shrink-0 ${
                    active ? "text-ocean-300" : "text-ocean-400"
                  }`}
                >
                  <Icon className="w-[18px] h-[18px]" />
                </span>
                <span className="hidden md:inline font-medium nav-label">
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>

        <div className="p-3 hidden md:block text-[10px] text-ocean-600 border-t border-ocean-800/80 leading-relaxed">
          Open-Meteo · free data
          {isStale(lastRefresh, 90) && !loading && (
            <div className="text-sand-400/90 mt-1">Data may be stale</div>
          )}
        </div>
      </aside>

      <main ref={mainRef} className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="max-w-6xl mx-auto p-4 md:p-6 lg:p-8 pb-10">
          {error && (
            <div
              role="alert"
              className="mb-4 rounded-xl border border-coral-500/35 bg-coral-500/10 px-4 py-3 text-sm text-coral-400 flex items-start justify-between gap-3"
            >
              <span>{error}</span>
              <button
                type="button"
                className="text-coral-400/80 hover:text-coral-400 shrink-0 text-xs font-semibold uppercase tracking-wide"
                onClick={clearError}
              >
                Dismiss
              </button>
            </div>
          )}

          {page === "dashboard" && <Dashboard />}
          {page === "spots" && <Spots />}
          {page === "spot" && <SpotDetail />}
          {page === "sessions" && <Sessions />}
          {page === "notes" && <Notes />}
          {page === "settings" && <Settings />}
        </div>
      </main>
    </div>
  );
}

export default App;
