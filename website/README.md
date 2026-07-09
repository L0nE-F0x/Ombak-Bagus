# Ombak Bagus website

Static marketing site for Netlify.

- **Publish directory:** `website` (see root `netlify.toml`)
- **Installer:** `downloads/Ombak-Bagus-Setup-0.1.0.exe`

## Local preview

Open `index.html` in a browser, or:

```bash
npx serve website
```

## Update the installer

After `npm run tauri:build`:

```powershell
Copy-Item "src-tauri\target\release\bundle\nsis\Ombak Bagus_0.1.0_x64-setup.exe" `
  "website\downloads\Ombak-Bagus-Setup-0.1.0.exe" -Force
```

Bump the version in the filename and in `index.html` download links when you ship a new release.
