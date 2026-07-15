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

// 2) Web PWA app under /app/
run("node", ["scripts/build-web.mjs"]);
const appOut = join(out, "app");
mkdirSync(appOut, { recursive: true });
cpSync(join(root, "dist"), appOut, { recursive: true });

// SPA fallback for /app/* (Netlify _redirects also handles this)
const redirects = join(out, "_redirects");
let red = existsSync(redirects) ? readFileSync(redirects, "utf8") : "";
if (!red.includes("/app/*")) {
  red += "\n/app/*  /app/index.html  200\n";
  writeFileSync(redirects, red.trim() + "\n");
}

console.log("packaged site -> dist-site/ (marketing + /app PWA)");