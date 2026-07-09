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
})();
