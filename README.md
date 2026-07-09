# Ombak Bagus

**Personal Windows desktop app for Bali surf forecasts** — multi-model swell, wind, tides, spot notes, and session logging in one place.

*Ombak bagus* = “good waves” in Indonesian.

## Website (Netlify)

Marketing site + Windows installer live in [`website/`](website/).

| Netlify setting | Value |
|-----------------|--------|
| Base directory | repo root |
| Publish directory | `website` |
| Build command | *(none)* |

Config: [`netlify.toml`](netlify.toml)  
Windows installer (Netlify): `website/downloads/Ombak-Bagus-Setup-0.1.0.exe`  
Mac + Windows release builds: [GitHub Releases](https://github.com/L0nE-F0x/Ombak-Bagus/releases) (via CI)

## CI builds (Windows + Mac)

You **do not need a Mac**. GitHub Actions builds installers on cloud runners.

Workflow: [`.github/workflows/release.yml`](.github/workflows/release.yml)

### How to ship a release

1. **One-time:** repo **Settings → Actions → General → Workflow permissions → Read and write permissions** (if release upload fails).
2. On GitHub: **Actions → Release → Run workflow**  
   **or** tag and push:
   ```bash
   git tag v0.1.0
   git push origin v0.1.0
   ```
3. Wait for the three jobs (Windows, Mac Apple Silicon, Mac Intel).
4. Open **Releases** — download `.exe` / `.dmg` and send links to friends.

Mac builds use **ad-hoc signing** (`signingIdentity: "-"`). Friends may need right-click → Open the first time. Full Apple notarization needs an Apple Developer account (optional later).

## Features

- **Dashboard** — best spots right now, favorites, upcoming tides, 7-day score
- **16 curated Bali breaks** — Bukit, Canggu, East Coast, Sanur, Nusa Dua, West Coast
- **Live marine data** — Open-Meteo wave/swell + wind/weather (free, no API key)
- **Tide charts** — astronomical estimate tuned for Bali regions
- **Spot scores** — blends swell size/period/direction, offshore wind vs. reef face, tide preference
- **Charts** — swell, wind, tides, weekly outlook
- **Notes & session log** — stored locally on your PC
- **Installable** — Tauri + NSIS Windows installer

## Requirements

- [Node.js](https://nodejs.org/) 18+
- [Rust](https://rustup.rs/) (stable)
- Windows 10/11 (for desktop build)
- Microsoft C++ Build Tools / Visual Studio build tools (for Tauri on Windows)

## Develop

```bash
npm install
npm run tauri:dev
```

Frontend-only (browser, still hits Open-Meteo):

```bash
npm run dev
```

## Build installer

```bash
npm run tauri:build
```

Installer output (typical path):

```
src-tauri/target/release/bundle/nsis/Ombak Bagus_0.1.0_x64-setup.exe
```

## Data sources

| Data | Source |
|------|--------|
| Waves / swell | [Open-Meteo Marine API](https://open-meteo.com/en/docs/marine-weather-api) |
| Wind / weather | [Open-Meteo Forecast API](https://open-meteo.com/en/docs) |
| Tides | Built-in astronomical model (planning only, not for navigation) |

Favorites, notes, and sessions stay in local app storage — nothing is uploaded.

## Project layout

```
src/                 React UI (pages, charts, store)
src/data/spots.ts    Bali spot catalog + orientations
src/services/        Open-Meteo, tides, rating, units
src-tauri/           Tauri shell (Windows window + installer)
```

## Disclaimer

Forecasts and scores are planning aids. Ocean conditions change quickly; always assess the lineup yourself. Tide heights are **estimated**, not official tide tables.
