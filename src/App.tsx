import { useEffect, useRef, type ReactNode, type RefObject } from "react";
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
import { StudioCredit } from "./components/StudioCredit";

const NAV: {
  id: Page;
  label: string;
  short: string;
  icon: (p: { className?: string }) => ReactNode;
}[] = [
  { id: "dashboard", label: "Dashboard", short: "Home", icon: IconDashboard },
  { id: "spots", label: "Spots", short: "Spots", icon: IconSpots },
  { id: "sessions", label: "Sessions", short: "Log", icon: IconSessions },
  { id: "notes", label: "Notes", short: "Notes", icon: IconNotes },
  { id: "settings", label: "Settings", short: "More", icon: IconSettings },
];

function useWaveBackground(videoRef: RefObject<HTMLVideoElement | null>) {
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    const tryPlay = () => {
      if (reduceMotion.matches || document.hidden) {
        video.pause();
        return;
      }
      video.muted = true;
      const p = video.play();
      if (p && typeof p.catch === "function") {
        p.catch(() => {
          /* autoplay blocked - poster still shows */
        });
      }
    };

    const onVis = () => tryPlay();
    const onMotion = () => tryPlay();

    video.addEventListener("loadeddata", tryPlay, { once: true });
    document.addEventListener("visibilitychange", onVis);
    if (reduceMotion.addEventListener) {
      reduceMotion.addEventListener("change", onMotion);
    } else {
      reduceMotion.addListener(onMotion);
    }

    tryPlay();

    return () => {
      document.removeEventListener("visibilitychange", onVis);
      if (reduceMotion.removeEventListener) {
        reduceMotion.removeEventListener("change", onMotion);
      } else {
        reduceMotion.removeListener(onMotion);
      }
    };
  }, [videoRef]);
}

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
  const waveRef = useRef<HTMLVideoElement>(null);

  useWaveBackground(waveRef);

  useEffect(() => {
    if (!Object.keys(forecasts).length && !loading) {
      void refreshAll();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    <div className="app-shell h-full flex flex-col md:flex-row overflow-hidden">
      <div className="wave-bg" aria-hidden="true">
        <video
          ref={waveRef}
          className="wave-bg-video"
          poster={`${import.meta.env.BASE_URL}hero-wave-poster.jpg`}
          muted
          loop
          playsInline
          autoPlay
          preload="auto"
        >
          <source
            src={`${import.meta.env.BASE_URL}hero-wave.mp4`}
            type="video/mp4"
          />
        </video>
        <div className="wave-bg-scrim" />
        <div className="wave-bg-vignette" />
        <div className="wave-bg-grain" />
      </div>

      {/* Mobile top bar — visibility controlled in CSS (max-width 767px) */}
      <header className="mobile-topbar relative z-20 shrink-0">
        <img
          src={`${import.meta.env.BASE_URL}app-icon.png`}
          alt=""
          width={32}
          height={32}
          className="w-8 h-8 rounded-[10px] shadow-md shadow-black/30 ring-1 ring-ocean-400/25"
          draggable={false}
        />
        <div className="min-w-0 flex-1">
          <div className="brand-title text-[1rem] leading-tight">
            Ombak Bagus
          </div>
          <div className="brand-sub">Bali surf desk</div>
        </div>
        {loading && (
          <span className="text-[10px] uppercase tracking-wider text-ocean-400 shrink-0">
            Loading…
          </span>
        )}
      </header>

      {/* Desktop sidebar — visibility controlled in CSS (min-width 768px) */}
      <aside className="sidebar w-56 shrink-0 flex-col relative z-10">
        <div className="px-4 py-5 border-b border-ocean-800/70">
          <div className="flex items-center gap-2.5">
            <img
              src={`${import.meta.env.BASE_URL}app-icon.png`}
              alt=""
              width={36}
              height={36}
              className="w-9 h-9 rounded-[11px] shadow-lg shadow-black/35 shrink-0 ring-1 ring-ocean-400/25"
              draggable={false}
            />
            <div className="min-w-0">
              <div className="brand-title text-[1.05rem]">Ombak Bagus</div>
              <div className="brand-sub">Bali surf desk</div>
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
                className={`nav-item ${active ? "nav-item-active" : ""}`}
              >
                <span
                  className={`nav-icon w-6 flex justify-center shrink-0 ${
                    active ? "text-ocean-300" : "text-ocean-400"
                  }`}
                >
                  <Icon className="w-[18px] h-[18px]" />
                </span>
                <span className="font-medium nav-label">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-3 text-[10px] text-ocean-500 border-t border-ocean-800/70 leading-relaxed space-y-1.5">
          <div>Open-Meteo · free data</div>
          {isStale(lastRefresh, 90) && !loading && (
            <div className="text-sand-400/90">Data may be stale</div>
          )}
          <StudioCredit compact className="text-[10px] text-ocean-500/80" />
        </div>
      </aside>

      <main
        ref={mainRef}
        className="flex-1 overflow-y-auto overflow-x-hidden relative z-10 main-scroll"
      >
        <div className="page-frame max-w-6xl mx-auto animate-fade-up">
          {error && (
            <div
              role="alert"
              className="mb-4 rounded-xl border border-coral-500/35 bg-coral-500/10 px-3.5 py-3 text-sm text-coral-400 flex items-start justify-between gap-3"
            >
              <span className="min-w-0 break-words">{error}</span>
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

      {/* Mobile bottom tab bar — visibility controlled in CSS (max-width 767px) */}
      <nav className="mobile-tabbar relative z-20" aria-label="Main">
        {NAV.map((item) => {
          const active =
            page === item.id || (item.id === "spots" && page === "spot");
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setPage(item.id)}
              className={`mobile-tab ${active ? "mobile-tab-active" : ""}`}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="w-5 h-5" />
              <span>{item.short}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

export default App;
