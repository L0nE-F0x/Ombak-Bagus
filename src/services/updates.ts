/**
 * In-app updates for every shell:
 * - Windows / macOS (Tauri): signed updater when available, else open the
 *   correct installer from GitHub Releases
 * - Android APK: compare tag → open latest APK
 * - iOS / browser PWA: service worker + remote version.json → reload
 */

export type AppPlatform = "windows" | "macos" | "android" | "ios" | "web";

export type UpdateCheckResult =
  | { status: "up-to-date"; version: string; platform: AppPlatform }
  | {
      status: "available";
      version: string;
      currentVersion: string;
      platform: AppPlatform;
      notes?: string;
      date?: string;
      /** Download / install / reload depending on platform */
      install: () => Promise<void>;
      /** Primary button label for Settings UI */
      installLabel: string;
      /** How the update will be applied (for UI copy) */
      method: "signed" | "installer" | "apk" | "reload";
    }
  | {
      status: "unavailable";
      version: string;
      platform: AppPlatform;
      message: string;
    };

const REPO = "L0nE-F0x/Ombak-Bagus";

/** Build-time version (Vite injects package.json). */
declare const __APP_VERSION__: string | undefined;

/** Bundled shell version when nothing else is available. */
const FALLBACK_VERSION =
  (typeof __APP_VERSION__ !== "undefined" && __APP_VERSION__) || "0.1.7";

export const RELEASES_URL = `https://github.com/${REPO}/releases/latest`;
export const APK_DOWNLOAD_URL = `https://github.com/${REPO}/releases/latest/download/Ombak-Bagus.apk`;

/** Optional Netlify version channel (updated on each site package). */
const SITE_VERSION_URLS = [
  // Absolute marketing site (works from Android WebView / Tauri too)
  "https://bagus.netlify.app/version.json",
  // Same-origin when running as PWA under /app/
  typeof location !== "undefined"
    ? `${location.origin}/version.json`
    : "",
  typeof location !== "undefined"
    ? `${location.origin}/app/version.json`
    : "",
].filter(Boolean);

type OmbakBridge = {
  platform?: string;
  version?: string;
};

function bridge(): OmbakBridge {
  if (typeof window === "undefined") return {};
  return ((window as unknown as { __OMBAK__?: OmbakBridge }).__OMBAK__ ??
    {}) as OmbakBridge;
}

function isTauriRuntime(): boolean {
  return (
    typeof window !== "undefined" &&
    // Tauri 2 injects this; plain WebView / PWA will not.
    "__TAURI_INTERNALS__" in window
  );
}

function isIosDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  const iOS = /iPad|iPhone|iPod/i.test(ua);
  const iPadOs =
    navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  return iOS || iPadOs;
}

function isAndroidDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  const host = typeof location !== "undefined" ? location.hostname : "";
  if (host === "appassets.androidplatform.net") return true;
  if (bridge().platform === "android") return true;
  return /Android/i.test(navigator.userAgent || "");
}

export function detectPlatform(): AppPlatform {
  if (isTauriRuntime()) {
    const ua = navigator.userAgent || "";
    const platform = navigator.platform || "";
    if (/Win/i.test(platform) || /Windows/i.test(ua)) return "windows";
    if (/Mac/i.test(platform) || /Mac OS|Macintosh/i.test(ua)) return "macos";
    // Default desktop shell to Windows installer if UA is odd
    return "windows";
  }
  if (isAndroidDevice()) return "android";
  if (isIosDevice()) return "ios";
  return "web";
}

export function platformLabel(platform: AppPlatform): string {
  switch (platform) {
    case "windows":
      return "Windows";
    case "macos":
      return "macOS";
    case "android":
      return "Android";
    case "ios":
      return "iPhone / iPad";
    case "web":
      return "Web browser";
  }
}

/** Human-readable blurb for Settings → App updates. */
export function updateHelpText(platform: AppPlatform): string {
  switch (platform) {
    case "windows":
      return "Checks GitHub for a newer build. Signed updates install in one tap when available; otherwise the Windows installer downloads so you can run it.";
    case "macos":
      return "Checks GitHub for a newer build. Signed updates install in one tap when available; otherwise the Mac .dmg downloads so you can open it.";
    case "android":
      return "Checks GitHub for a newer APK. Tap download, open the file, and allow install when prompted — no marketing site needed.";
    case "ios":
      return "The home-screen app updates over the network. Check for updates pulls the latest web build and reloads.";
    case "web":
      return "When online, this page can reload a fresher build. Install to your home screen on iPhone for the full app experience.";
  }
}

/** Current app version from Tauri, Android bridge, or build-time constant. */
export async function appVersion(): Promise<string> {
  const fromBridge = bridge().version?.trim();
  if (fromBridge) return normalizeVersion(fromBridge);

  if (isTauriRuntime()) {
    try {
      const { getVersion } = await import("@tauri-apps/api/app");
      return normalizeVersion(await getVersion());
    } catch {
      /* fall through */
    }
  }
  return normalizeVersion(FALLBACK_VERSION);
}

function normalizeVersion(raw: string): string {
  return raw.trim().replace(/^v/i, "");
}

/** Compare semver-ish strings. Returns 1 if a > b, -1 if a < b, 0 if equal. */
export function compareVersions(a: string, b: string): number {
  const pa = normalizeVersion(a)
    .split(/[.+-]/)
    .map((p) => parseInt(p, 10));
  const pb = normalizeVersion(b)
    .split(/[.+-]/)
    .map((p) => parseInt(p, 10));
  const len = Math.max(pa.length, pb.length, 3);
  for (let i = 0; i < len; i++) {
    const da = Number.isFinite(pa[i]) ? pa[i]! : 0;
    const db = Number.isFinite(pb[i]) ? pb[i]! : 0;
    if (da > db) return 1;
    if (da < db) return -1;
  }
  return 0;
}

type GithubRelease = {
  tag_name: string;
  body?: string | null;
  published_at?: string | null;
  html_url?: string;
  assets?: { name: string; browser_download_url: string }[];
};

async function fetchLatestGithubRelease(): Promise<GithubRelease> {
  const res = await fetch(
    `https://api.github.com/repos/${REPO}/releases/latest`,
    {
      headers: {
        Accept: "application/vnd.github+json",
      },
      cache: "no-store",
    }
  );
  if (!res.ok) {
    throw new Error(
      res.status === 404
        ? "No public release found yet."
        : `Could not reach GitHub Releases (${res.status}).`
    );
  }
  return (await res.json()) as GithubRelease;
}

/** Remote version from marketing site version.json (best-effort). */
async function fetchSiteVersion(): Promise<string | null> {
  for (const url of SITE_VERSION_URLS) {
    try {
      const res = await fetch(`${url}${url.includes("?") ? "&" : "?"}t=${Date.now()}`, {
        cache: "no-store",
      });
      if (!res.ok) continue;
      const data = (await res.json()) as { version?: string };
      if (data.version) return normalizeVersion(data.version);
    } catch {
      /* try next */
    }
  }
  return null;
}

function apkUrlFromRelease(release: GithubRelease): string {
  const assets = release.assets ?? [];
  const apk =
    assets.find((a) => /ombak.*\.apk$/i.test(a.name)) ??
    assets.find((a) => a.name.toLowerCase().endsWith(".apk"));
  return apk?.browser_download_url ?? APK_DOWNLOAD_URL;
}

/** Pick the best desktop installer asset for this OS. */
function pickDesktopInstallerUrl(
  release: GithubRelease,
  platform: "windows" | "macos"
): string | null {
  const assets = release.assets ?? [];
  if (!assets.length) return null;

  if (platform === "windows") {
    const setup =
      assets.find((a) => /setup\.exe$/i.test(a.name)) ??
      assets.find((a) => /x64.*\.exe$/i.test(a.name)) ??
      assets.find((a) => /\.exe$/i.test(a.name));
    return setup?.browser_download_url ?? null;
  }

  // macOS — prefer Apple Silicon, then Intel, then any dmg
  const dmg =
    assets.find((a) => /aarch64.*\.dmg$/i.test(a.name)) ??
    assets.find((a) => /arm64.*\.dmg$/i.test(a.name)) ??
    assets.find((a) => /x64.*\.dmg$/i.test(a.name)) ??
    assets.find((a) => /\.dmg$/i.test(a.name));
  return dmg?.browser_download_url ?? null;
}

export async function openDownload(url: string): Promise<void> {
  try {
    if (isTauriRuntime()) {
      const { openUrl } = await import("@tauri-apps/plugin-opener");
      await openUrl(url);
      return;
    }
  } catch {
    /* fall through */
  }
  // Android WebView MainActivity opens http(s) in the system browser.
  // iOS Safari / PWA: navigate or open.
  const a = document.createElement("a");
  a.href = url;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

async function checkSignedDesktopUpdate(
  version: string,
  platform: "windows" | "macos"
): Promise<UpdateCheckResult | null> {
  try {
    const { check } = await import("@tauri-apps/plugin-updater");
    const { relaunch } = await import("@tauri-apps/plugin-process");
    const update = await check();
    if (!update) {
      // Plugin says nothing newer — still confirm against GitHub below.
      return null;
    }

    return {
      status: "available",
      version: update.version,
      currentVersion: version,
      platform,
      notes: update.body ?? undefined,
      date: update.date ?? undefined,
      installLabel: "Download and install",
      method: "signed",
      install: async () => {
        await update.downloadAndInstall();
        await relaunch();
      },
    };
  } catch {
    // Unsigned local builds, missing latest.json, or no signing key in CI.
    return null;
  }
}

async function checkGithubDesktopUpdate(
  version: string,
  platform: "windows" | "macos"
): Promise<UpdateCheckResult> {
  try {
    const release = await fetchLatestGithubRelease();
    const latest = normalizeVersion(release.tag_name);
    if (compareVersions(latest, version) <= 0) {
      return { status: "up-to-date", version, platform };
    }

    const installerUrl = pickDesktopInstallerUrl(release, platform);
    const isMac = platform === "macos";
    return {
      status: "available",
      version: latest,
      currentVersion: version,
      platform,
      notes:
        release.body?.trim() ||
        (isMac
          ? "A newer Mac build is ready. Download the .dmg, open it, and drag Ombak Bagus to Applications."
          : "A newer Windows build is ready. Download the installer and run it over your current install."),
      date: release.published_at ?? undefined,
      installLabel: isMac ? "Download Mac installer" : "Download Windows installer",
      method: "installer",
      install: async () => {
        await openDownload(installerUrl ?? RELEASES_URL);
      },
    };
  } catch (err) {
    return {
      status: "unavailable",
      version,
      platform,
      message:
        err instanceof Error
          ? err.message
          : "Could not check GitHub for a desktop update.",
    };
  }
}

async function checkDesktopUpdate(
  version: string,
  platform: "windows" | "macos"
): Promise<UpdateCheckResult> {
  const signed = await checkSignedDesktopUpdate(version, platform);
  if (signed?.status === "available") return signed;

  const fromGithub = await checkGithubDesktopUpdate(version, platform);
  if (fromGithub.status !== "unavailable") return fromGithub;

  // GitHub failed but signed path said up-to-date (null) — treat as up-to-date
  if (signed === null && fromGithub.status === "unavailable") {
    // Prefer showing the network error if we couldn't verify either way
    return fromGithub;
  }
  return { status: "up-to-date", version, platform };
}

async function checkAndroidUpdate(
  version: string
): Promise<UpdateCheckResult> {
  try {
    const release = await fetchLatestGithubRelease();
    const latest = normalizeVersion(release.tag_name);
    if (compareVersions(latest, version) <= 0) {
      return { status: "up-to-date", version, platform: "android" };
    }
    const apkUrl = apkUrlFromRelease(release);
    return {
      status: "available",
      version: latest,
      currentVersion: version,
      platform: "android",
      notes:
        release.body?.trim() ||
        "A newer Android build is ready. Download the APK and open it to install over your current app.",
      date: release.published_at ?? undefined,
      installLabel: "Download APK",
      method: "apk",
      install: async () => {
        await openDownload(apkUrl);
      },
    };
  } catch (err) {
    return {
      status: "unavailable",
      version,
      platform: "android",
      message:
        err instanceof Error
          ? err.message
          : "Could not check GitHub for a new APK.",
    };
  }
}

async function hardReload(): Promise<void> {
  // Bust caches as much as browsers allow, then reload.
  try {
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
  } catch {
    /* ignore */
  }
  try {
    const regs = await navigator.serviceWorker?.getRegistrations?.();
    if (regs) {
      await Promise.all(regs.map((r) => r.unregister()));
    }
  } catch {
    /* ignore */
  }
  const url = new URL(window.location.href);
  url.searchParams.set("_v", String(Date.now()));
  window.location.replace(url.toString());
}

async function checkWebOrIosUpdate(
  version: string,
  platform: "ios" | "web"
): Promise<UpdateCheckResult> {
  // 1) Service worker waiting worker
  if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) {
        await reg.update();
        if (reg.waiting) {
          return {
            status: "available",
            version: "latest",
            currentVersion: version,
            platform,
            notes: "A newer web app build is ready. Reload to apply it.",
            installLabel: "Reload to update",
            method: "reload",
            install: async () => {
              reg.waiting?.postMessage({ type: "SKIP_WAITING" });
              // Give the new SW a moment, then hard reload
              await new Promise((r) => setTimeout(r, 150));
              await hardReload();
            },
          };
        }
      }
    } catch {
      /* fall through */
    }
  }

  // 2) Site version.json and/or GitHub release tag
  let remote: string | null = null;
  let notes =
    platform === "ios"
      ? "A newer build is available. Reload to pull it into the home-screen app."
      : "A newer build is available. Reload this page to get it.";

  try {
    remote = await fetchSiteVersion();
  } catch {
    /* ignore */
  }

  try {
    const release = await fetchLatestGithubRelease();
    const tag = normalizeVersion(release.tag_name);
    if (!remote || compareVersions(tag, remote) > 0) {
      remote = tag;
      if (release.body?.trim()) notes = release.body.trim();
    }
  } catch {
    /* ignore if site version worked */
  }

  if (remote && compareVersions(remote, version) > 0) {
    return {
      status: "available",
      version: remote,
      currentVersion: version,
      platform,
      notes,
      installLabel: "Reload to update",
      method: "reload",
      install: async () => {
        await hardReload();
      },
    };
  }

  if (remote === null && !(typeof navigator !== "undefined" && "serviceWorker" in navigator)) {
    return {
      status: "unavailable",
      version,
      platform,
      message: "Could not reach the update channel. Check your connection and try again.",
    };
  }

  return { status: "up-to-date", version, platform };
}

/**
 * Check for updates on the current shell.
 */
export async function checkForAppUpdate(): Promise<UpdateCheckResult> {
  const version = await appVersion();
  const platform = detectPlatform();

  if (platform === "windows" || platform === "macos") {
    return checkDesktopUpdate(version, platform);
  }
  if (platform === "android") {
    return checkAndroidUpdate(version);
  }
  return checkWebOrIosUpdate(version, platform === "ios" ? "ios" : "web");
}
