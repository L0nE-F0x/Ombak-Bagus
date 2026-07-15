import fs from "fs";

const path = "website/index.html";
let html = fs.readFileSync(path, "utf8");

html = html
  .replace(
    "Ombak Bagus - Bali Surf Desk for Windows &amp; Mac",
    "Ombak Bagus - Bali Surf Desk for Desktop and Mobile"
  )
  .replace(
    'content="Ombak Bagus is a free desktop app for Bali surf forecasts on Windows and Mac - multi-model swell, wind, tides, spot notes, and session logging in one place."',
    'content="Ombak Bagus is a free Bali surf desk for Windows, Mac, Android, and iOS (PWA) - multi-model swell, wind, tides, spot notes, and session logging."'
  )
  .replace(
    'content="Swell, wind, tides, and your logbook for Bali - one quiet desktop app. Free for personal use."',
    'content="Swell, wind, tides, and your logbook for Bali - desktop apps plus Android APK and iOS home-screen install. Free for personal use."'
  )
  .replace(
    "Windows &amp; Mac | Free | Built for Bali",
    "Desktop + mobile | Free | Built for Bali"
  )
  .replace("<li>Native desktop builds</li>", "<li>Native Windows and Mac builds</li>")
  .replace(
    "<li>Notes stay on your machine</li>",
    "<li>Android APK + iOS home screen</li>\n            <li>Notes stay on your machine</li>"
  )
  .replace("Take it to the desk", "Take it with you")
  .replace(
    "Free personal use | v0.1.2 | Windows &amp; Mac",
    "Free personal use | v0.1.2 | Desktop + mobile"
  )
  .replace(
    "Grab the Windows setup (~9 MB). No account. No store login needed.",
    "Grab Windows, Mac, Android APK, or install on iPhone from Safari. No account needed."
  );

const heroActions = `          <div class="hero-actions">
            <a
              class="btn btn-primary"
              href="downloads/Ombak-Bagus-Setup-0.1.2.exe"
              download
            >
              Download for Windows
              <span class="btn-meta">v0.1.2 | ~9 MB installer</span>
            </a>
            <a
              class="btn btn-ghost"
              href="https://github.com/L0nE-F0x/Ombak-Bagus/releases/latest"
              target="_blank"
              rel="noopener noreferrer"
            >
              Download for Mac
              <span class="btn-meta">GitHub Releases | Apple Silicon &amp; Intel</span>
            </a>
            <a
              class="btn btn-ghost"
              id="download-android-hero"
              href="https://github.com/L0nE-F0x/Ombak-Bagus/releases/latest/download/Ombak-Bagus.apk"
            >
              Download for Android
              <span class="btn-meta">APK sideload | no Play Store needed</span>
            </a>
            <a class="btn btn-ghost" id="download-ios-hero" href="/app/">
              Download for iOS
              <span class="btn-meta">Install as app (PWA) | Safari</span>
            </a>
          </div>`;

html = html.replace(
  /<div class="hero-actions">[\s\S]*?<\/div>\s*<ul class="trust-row">/,
  heroActions + "\n          <ul class=\"trust-row\">"
);

const downloadBtns = `          <div class="download-btns">
            <a
              class="btn btn-primary btn-lg"
              href="downloads/Ombak-Bagus-Setup-0.1.2.exe"
              download
              id="download-btn"
            >
              Windows installer
              <span class="btn-meta">.exe | Win 10/11 x64</span>
            </a>
            <a
              class="btn btn-ghost btn-lg"
              href="https://github.com/L0nE-F0x/Ombak-Bagus/releases/latest"
              target="_blank"
              rel="noopener noreferrer"
              id="download-mac-btn"
            >
              Mac downloads
              <span class="btn-meta">.dmg | Apple Silicon + Intel</span>
            </a>
            <a
              class="btn btn-ghost btn-lg"
              id="download-android-btn"
              href="https://github.com/L0nE-F0x/Ombak-Bagus/releases/latest/download/Ombak-Bagus.apk"
            >
              Android APK
              <span class="btn-meta">Sideload | no Play Store</span>
            </a>
            <a class="btn btn-ghost btn-lg" id="download-ios-btn" href="/app/">
              iOS / iPhone
              <span class="btn-meta">Add to Home Screen (PWA)</span>
            </a>
          </div>`;

html = html.replace(
  /<div class="download-btns">[\s\S]*?<\/div>\s*<p class="download-hint">/,
  downloadBtns + "\n          <p class=\"download-hint\">"
);

const hints = `          <p class="download-hint">
            <strong>Windows:</strong> if SmartScreen appears, choose
            <em>More info -> Run anyway</em> (unsigned personal build).<br />
            <strong>Mac:</strong> builds are produced by GitHub Actions (CI). If
            macOS blocks the app, right-click -> <em>Open</em> -> <em>Open</em>.
            Prefer the <code>aarch64</code> DMG on M1/M2/M3/M4 laptops.<br />
            <strong>Android:</strong> download the APK, open it, and allow install
            from this browser if prompted. No Play Store required.<br />
            <strong>iOS:</strong> open the web app in <em>Safari</em>, tap
            <em>Share</em> -> <em>Add to Home Screen</em>. Works without the App Store.
          </p>`;

html = html.replace(
  /<p class="download-hint">\s*<strong>Windows:<\/strong>[\s\S]*?<\/p>/,
  hints
);

const modal = `
    <div id="ios-install-modal" class="modal" hidden>
      <div class="modal-backdrop" data-close-ios></div>
      <div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="ios-install-title">
        <button type="button" class="modal-close" data-close-ios aria-label="Close">&times;</button>
        <p class="eyebrow">iPhone / iPad</p>
        <h3 id="ios-install-title">Install Ombak Bagus (no App Store)</h3>
        <ol class="modal-steps">
          <li>Open the app in <strong>Safari</strong> (required on iOS).</li>
          <li>Tap the <strong>Share</strong> button.</li>
          <li>Choose <strong>Add to Home Screen</strong>, then <strong>Add</strong>.</li>
        </ol>
        <p class="modal-note">
          This installs the progressive web app - same Bali forecasts and logbook,
          offline shell, no App Store account needed.
        </p>
        <div class="modal-actions">
          <a class="btn btn-primary" href="/app/" id="ios-open-app">Open web app</a>
          <button type="button" class="btn btn-ghost" data-close-ios>Close</button>
        </div>
      </div>
    </div>
`;

if (!html.includes("ios-install-modal")) {
  html = html.replace(
    '<script src="script.js"></script>',
    modal + '\n    <script src="script.js"></script>'
  );
}

// FAQ optional
if (!html.includes("Is there an iPhone app")) {
  html = html.replace(
    "</div>\n      </section>\n    </main>",
    `          <details>
            <summary>Is there an iPhone or Android app?</summary>
            <p>
              Yes - without the stores for now. Android: download the APK from this
              page (sideload). iPhone: open the web app in Safari and Add to Home
              Screen (PWA). Windows and Mac native installers stay first-class.
            </p>
          </details>
        </div>
      </section>
    </main>`
  );
}

fs.writeFileSync(path, html);
console.log("website/index.html patched");
console.log("android buttons", (html.match(/Android/g) || []).length);
console.log("ios buttons", (html.match(/iOS|iPhone/g) || []).length);