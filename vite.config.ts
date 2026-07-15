import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

// @ts-expect-error process is a nodejs global
const host = process.env.TAURI_DEV_HOST;
// @ts-expect-error process is a nodejs global
const isTauri = Boolean(process.env.TAURI_ENV_PLATFORM || process.env.TAURI_PLATFORM);
// @ts-expect-error process is a nodejs global
const buildPwa = process.env.BUILD_PWA === "1";
// @ts-expect-error process is a nodejs global
const base = process.env.VITE_BASE || "/";

export default defineConfig(async () => ({
  base,
  plugins: [
    react(),
    tailwindcss(),
    ...(buildPwa && !isTauri
      ? [
          VitePWA({
            registerType: "autoUpdate",
            includeAssets: [
              "favicon.png",
              "app-icon.png",
              "hero-wave-poster.jpg",
            ],
            manifest: {
              name: "Ombak Bagus",
              short_name: "Ombak Bagus",
              description:
                "Bali surf forecasts - swell, wind, tides, and your logbook.",
              theme_color: "#0c1a1f",
              background_color: "#0c1a1f",
              display: "standalone",
              orientation: "any",
              start_url: "./",
              scope: "./",
              icons: [
                {
                  src: "app-icon.png",
                  sizes: "512x512",
                  type: "image/png",
                  purpose: "any maskable",
                },
                {
                  src: "icon-128.png",
                  sizes: "128x128",
                  type: "image/png",
                },
              ],
            },
            workbox: {
              // Keep the shell offline-friendly; forecasts still need network.
              globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
              // Wave video is large - cache on demand, not precache
              runtimeCaching: [
                {
                  urlPattern: /hero-wave\.mp4$/i,
                  handler: "CacheFirst",
                  options: {
                    cacheName: "wave-video",
                    expiration: { maxEntries: 1, maxAgeSeconds: 60 * 60 * 24 * 30 },
                  },
                },
              ],
            },
          }),
        ]
      : []),
  ],

  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },
}));