import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { getVersion } from "@tauri-apps/api/app";

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

/** Current app version from the Tauri package (falls back in browser). */
export async function appVersion(): Promise<string> {
  try {
    return await getVersion();
  } catch {
    return "0.1.2";
  }
}

/**
 * Check GitHub Releases for a signed update.
 * When no update endpoint / signing is ready yet, returns a helpful error
 * so Settings can still open the releases page.
 */
export async function checkForAppUpdate(): Promise<UpdateCheckResult> {
  const version = await appVersion();

  try {
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