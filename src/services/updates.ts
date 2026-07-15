export type UpdateCheckResult =
  | { status: "up-to-date"; version: string }
  | {
      status: "available";
      version: string;
      currentVersion: string;
      notes?: string;
      date?: string;
      /** Download, install, then relaunch */
      install: () => Promise<void>;
    }
  | { status: "unavailable"; version: string; message: string };

const FALLBACK_VERSION = "0.1.4";

function isTauriRuntime(): boolean {
  return (
    typeof window !== "undefined" &&
    // Tauri 2 injects this; plain WebView / PWA will not.
    "__TAURI_INTERNALS__" in window
  );
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

/**
 * Check GitHub Releases for a signed update.
 * No-ops outside the native Tauri desktop shell (Android WebView / PWA).
 */
export async function checkForAppUpdate(): Promise<UpdateCheckResult> {
  const version = await appVersion();

  if (!isTauriRuntime()) {
    return {
      status: "unavailable",
      version,
      message:
        "In-app updates run on the Windows/Mac desktop app. On Android, download a new APK from the website.",
    };
  }

  try {
    const { check } = await import("@tauri-apps/plugin-updater");
    const { relaunch } = await import("@tauri-apps/plugin-process");
    const update = await check();
    if (!update) {
      return { status: "up-to-date", version };
    }

    return {
      status: "available",
      version: update.version,
      currentVersion: version,
      notes: update.body ?? undefined,
      date: update.date ?? undefined,
      install: async () => {
        let downloaded = 0;
        let contentLength = 0;
        await update.downloadAndInstall((event) => {
          switch (event.event) {
            case "Started":
              contentLength = event.data.contentLength ?? 0;
              break;
            case "Progress":
              downloaded += event.data.chunkLength;
              break;
            case "Finished":
              break;
          }
          void downloaded;
          void contentLength;
        });
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
    return { status: "unavailable", version, message };
  }
}

export const RELEASES_URL =
  "https://github.com/L0nE-F0x/Ombak-Bagus/releases/latest";
