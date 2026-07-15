/// <reference types="vite/client" />

/** Injected at build time from package.json (see vite.config.ts). */
declare const __APP_VERSION__: string;

interface Window {
  /** Optional bridge from Android WebView (MainActivity). */
  __OMBAK__?: {
    platform?: string;
    version?: string;
  };
}
