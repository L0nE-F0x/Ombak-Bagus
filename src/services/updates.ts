export type AppPlatform = "desktop" | "android" | "web";

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
    }
  | {
      status: "unavailable";
      version: string;
      platform: AppPlatform;
      message: string;
    };

const REPO = "L0nE-F0x/Ombak-Bagus";

/** Bundled shell version for Android WebView / PWA when Tauri is not present. */
const FALLBACK_VERSION = "0.1.7";

export const RELEASES_URL = `https://github.com/${REPO}/releases/latest`;
export const APK_DOWNLOAD_URL = `https://github.com/${REPO}/releases/latest/download/Ombak-Bagus.apk`;

function isTauriRuntime(): boolean {
  return (
    typeof window !== "undefined" &&
    // Tauri 2 injects this; plain WebView / PWA will not.
    "__TAURI_INTERNALS__" in window
  );
}

export function detectPlatform(): AppPlatform {
  if (isTauriRuntime()) return "desktop";
  if (typeof navigator === "undefined") return "web";
  const host = typeof location !== "undefined" ? location.hostname : "";
  if (
    host === "appassets.androidplatform.net" ||
    /Android/i.test(navigator.userAgent)
  ) {
    return "android";
  }
  return "web";
}

/** Human-readable blurb for Settings → App updates. */
export function updateHelpText(platform: AppPlatform): string {
  switch (platform) {
    case "desktop":
      return "Windows and Mac can install signed updates from GitHub Releases in one tap, then restart. Same path for paid channels later.";
    case "android":
      return "Android checks GitHub for a newer APK. Tap download, then open the file and allow install when prompted — no marketing site detour.";
    case "web":
      return "The iPhone / browser app updates itself when you are online. Check for updates reloads a fresh build if one is waiting.";
  }
}

/** Current app version from the Tauri package (falls back in browser/WebView). */
export async function appVersion(): Promise<string> {
  if (!isTauriRuntime()) {
    return FALLBACK_VERSION;
  }
  try {
    const { getVersion } = await import("@tauri-apps/api/app");
    return await getVersion();
  } catch {
    return FALLBACK_VERSION;
  }
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

function apkUrlFromRelease(release: GithubRelease): string {
  const assets = release.assets ?? [];
  const apk =
    assets.find((a) => /ombak.*\.apk$/i.test(a.name)) ??
    assets.find((a) => a.name.toLowerCase().endsWith(".apk"));
  return apk?.browser_download_url ?? APK_DOWNLOAD_URL;
}

async function openDownload(url: string): Promise<void> {
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
  window.open(url, "_blank", "noopener,noreferrer");
}

async function checkDesktopUpdate(
  version: string
): Promise<UpdateCheckResult> {
  try {
    const { check } = await import("@tauri-apps/plugin-updater");
    const { relaunch } = await import("@tauri-apps/plugin-process");
    const update = await check();
    if (!update) {
      return { status: "up-to-date", version, platform: "desktop" };
    }

    return {
      status: "available",
      version: update.version,
      currentVersion: version,
      platform: "desktop",
      notes: update.body ?? undefined,
      date: update.date ?? undefined,
      installLabel: "Download and install",
      install: async () => {
        await update.downloadAndInstall();
        await relaunch();
      },
    };
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : typeof err === "string"
          ? err
          : "Could not check for updates";
    return {
      status: "unavailable",
      version,
      platform: "desktop",
      message,
    };
  }
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
        "A newer Android build is on GitHub. Download the APK and open it to install over your current app.",
      date: release.published_at ?? undefined,
      installLabel: "Download APK",
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

async function checkWebUpdate(version: string): Promise<UpdateCheckResult> {
  // Prefer service worker when the installable PWA is registered.
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
            platform: "web",
            notes: "A newer web app build is ready. Reload to apply it.",
            installLabel: "Reload to update",
            install: async () => {
              reg.waiting?.postMessage({ type: "SKIP_WAITING" });
              window.location.reload();
            },
          };
        }
      }
    } catch {
      /* fall through to release check */
    }
  }

  // Informational: newer GitHub tag than the bundled FALLBACK_VERSION
  // (mainly useful for Android-shaped builds mis-detected as web).
  try {
    const release = await fetchLatestGithubRelease();
    const latest = normalizeVersion(release.tag_name);
    if (compareVersions(latest, version) > 0) {
      return {
        status: "available",
        version: latest,
        currentVersion: version,
        platform: "web",
        notes:
          "A newer release is out. Reload this page. On iPhone, force-close and reopen the home-screen app if it still looks old.",
        installLabel: "Reload page",
        install: async () => {
          window.location.reload();
        },
      };
    }
  } catch {
    /* network offline — treat as up to date enough */
  }

  return { status: "up-to-date", version, platform: "web" };
}

/**
 * Check for updates on the current shell:
 * - Desktop (Tauri): signed GitHub updater + relaunch
 * - Android APK: compare version to latest GitHub release, open APK URL
 * - Web / iOS PWA: service worker + reload
 */
export async function checkForAppUpdate(): Promise<UpdateCheckResult> {
  const version = await appVersion();
  const platform = detectPlatform();

  if (platform === "desktop") {
    return checkDesktopUpdate(version);
  }
  if (platform === "android") {
    return checkAndroidUpdate(version);
  }
  return checkWebUpdate(version);
}
