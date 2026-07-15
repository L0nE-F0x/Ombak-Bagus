/** Studio homepage — discreet “Built by” credit across marketing + apps. */
export const STUDIO_NAME = "ApexForge";
export const STUDIO_URL = "https://ame-apexforge.org/";

export async function openExternalUrl(url: string): Promise<void> {
  try {
    if (typeof window !== "undefined" && "__TAURI_INTERNALS__" in window) {
      const { openUrl } = await import("@tauri-apps/plugin-opener");
      await openUrl(url);
      return;
    }
  } catch {
    /* fall through */
  }
  window.open(url, "_blank", "noopener,noreferrer");
}
