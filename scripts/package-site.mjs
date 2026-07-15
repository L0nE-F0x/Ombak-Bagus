import { cpSync, mkdirSync, rmSync, existsSync, readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import process from "node:process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "dist-site");

function run(cmd, args) {
  const r = spawnSync(cmd, args, {
    stdio: "inherit",
    shell: true,
    cwd: root,
    env: process.env,
  });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

if (existsSync(out)) rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

// 1) Marketing site
cpSync(join(root, "website"), out, { recursive: true });

// Keep version.json in sync with package.json (iOS/PWA update channel)
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const versionPayload = JSON.stringify(
  {
    name: "Ombak Bagus",
    version: pkg.version,
    updatedAt: new Date().toISOString(),
  },
  null,
  2
);
writeFileSync(join(out, "version.json"), versionPayload + "\n");
writeFileSync(join(root, "website", "version.json"), versionPayload + "\n");

// 2) Web PWA app under /app/
run("node", ["scripts/build-web.mjs"]);
const appOut = join(out, "app");
mkdirSync(appOut, { recursive: true });
cpSync(join(root, "dist"), appOut, { recursive: true });
// Same channel under /app/ so the PWA can fetch same-origin.
writeFileSync(join(appOut, "version.json"), versionPayload + "\n");

// SPA fallback for /app/* (Netlify _redirects also handles this)
const redirects = join(out, "_redirects");
let red = existsSync(redirects) ? readFileSync(redirects, "utf8") : "";
if (!red.includes("/app/*")) {
  red += "\n/app/*  /app/index.html  200\n";
  writeFileSync(redirects, red.trim() + "\n");
}

console.log(`packaged site -> dist-site/ (marketing + /app PWA) v${pkg.version}`);