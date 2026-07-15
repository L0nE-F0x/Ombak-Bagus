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

process.env.BUILD_PWA = "1";
process.env.VITE_BASE = "/app/";
run("npx", ["tsc", "--noEmit"]);
run("npx", ["vite", "build"]);