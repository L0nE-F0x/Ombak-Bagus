// Light progressive enhancement for the landing page
(function () {
  const btn = document.getElementById("download-btn");
  if (btn) {
    btn.addEventListener("click", () => {
      console.info("Ombak Bagus Windows download started");
    });
  }

  // Prefer local APK if hosted under /downloads (falls back to GitHub Releases)
  const localApk = "downloads/Ombak-Bagus.apk";
  const androidBtns = [
    document.getElementById("download-android-btn"),
    document.getElementById("download-android-hero"),
  ].filter(Boolean);

  if (androidBtns.length) {
    fetch(localApk, { method: "HEAD" })
      .then((res) => {
        if (!res.ok) return;
        androidBtns.forEach((a) => {
          a.setAttribute("href", localApk);
          a.setAttribute("download", "Ombak-Bagus.apk");
        });
      })
      .catch(() => {
        /* keep GitHub Releases URL */
      });
  }

  // iOS PWA install helper
  const modal = document.getElementById("ios-install-modal");
  const iosBtns = [
    document.getElementById("download-ios-btn"),
    document.getElementById("download-ios-hero"),
  ].filter(Boolean);

  function isIos() {
    const ua = navigator.userAgent || "";
    const iOS = /iPad|iPhone|iPod/.test(ua);
    const iPadOs = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
    return iOS || iPadOs;
  }

  function openIosModal(e) {
    if (!modal) return;
    // On iOS, intercept and show install steps before/while opening the app
    if (isIos()) {
      e.preventDefault();
      modal.hidden = false;
      document.body.style.overflow = "hidden";
    }
    // Desktop browsers: let the link open /app/ normally
  }

  function closeIosModal() {
    if (!modal) return;
    modal.hidden = true;
    document.body.style.overflow = "";
  }

  iosBtns.forEach((a) => a.addEventListener("click", openIosModal));
  if (modal) {
    modal.querySelectorAll("[data-close-ios]").forEach((el) => {
      el.addEventListener("click", closeIosModal);
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !modal.hidden) closeIosModal();
    });
  }

  // Smooth active nav highlight
  const sections = ["features", "how", "download"]
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