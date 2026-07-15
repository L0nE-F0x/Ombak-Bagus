// Light progressive enhancement for the landing page
(function () {
  const btn = document.getElementById("download-btn");
  if (btn) {
    btn.addEventListener("click", () => {
      // Optional analytics hook later
      console.info("Ombak Bagus download started");
    });
  }

  // Smooth active nav highlight
  const sections = ["features", "models", "how", "download"]
    .map((id) => document.getElementById(id))
    .filter(Boolean);

  if ("IntersectionObserver" in window && sections.length) {
    const links = [...document.querySelectorAll(".nav-links a")];
    const map = new Map(
      links
        .map((a) => {
          const href = a.getAttribute("href") || "";
          return href.startsWith("#") ? [href.slice(1), a] : null;
        })
        .filter(Boolean)
    );

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const a = map.get(e.target.id);
          if (!a || a.classList.contains("nav-cta")) continue;
          links.forEach((l) => l.classList.remove("is-active"));
          a.classList.add("is-active");
        }
      },
      { rootMargin: "-40% 0px -50% 0px", threshold: 0.01 }
    );

    sections.forEach((s) => io.observe(s));
  }

  initWaveVideo();
})();

/** Real barreling-surf video background - play/pause carefully */
function initWaveVideo() {
  const video = document.getElementById("wave-video");
  if (!video) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  const tryPlay = () => {
    if (reduceMotion.matches || document.hidden) return;
    const p = video.play();
    if (p && typeof p.catch === "function") {
      p.catch(() => {
        // Autoplay blocked - poster still shows
      });
    }
  };

  const sync = () => {
    if (reduceMotion.matches || document.hidden) {
      video.pause();
    } else {
      tryPlay();
    }
  };

  video.muted = true;
  video.defaultMuted = true;
  video.setAttribute("playsinline", "");
  video.setAttribute("webkit-playsinline", "");

  video.addEventListener("loadeddata", tryPlay, { once: true });
  document.addEventListener("visibilitychange", sync);
  if (reduceMotion.addEventListener) {
    reduceMotion.addEventListener("change", sync);
  } else if (reduceMotion.addListener) {
    reduceMotion.addListener(sync);
  }

  // Nudge play after user interaction if needed
  const unlock = () => {
    tryPlay();
    window.removeEventListener("pointerdown", unlock);
    window.removeEventListener("keydown", unlock);
  };
  window.addEventListener("pointerdown", unlock, { passive: true });
  window.addEventListener("keydown", unlock);

  tryPlay();
}