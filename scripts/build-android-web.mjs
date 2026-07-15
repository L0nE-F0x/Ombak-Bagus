import { spawnSync } from "node:child_process";
import process from "node:process";

function run(cmd, args) {
  const r = spawnSync(cmd, args, {
    stdio: "inherit",
    shell: true,
    env: process.env,
  });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

// Relative asset paths for WebViewAssetLoader + https appassets origin.
// Do NOT enable PWA/service worker in the Android shell (causes blank screens).
process.env.BUILD_PWA = "0";
process.env.VITE_BASE = "./";
run("npx", ["tsc", "--noEmit"]);
run("npx", ["vite", "build", "--outDir", "dist-android"]);