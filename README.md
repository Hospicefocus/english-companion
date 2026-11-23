# English Companion

A free, responsive personal English-learning dashboard. No account, backend, paid API, or subscription required.

## Features

- Daily 2-hour routine: Listening (30 min), Speaking (25), Reading (25), Writing (25), Vocabulary & Grammar (15).
- Accurate focus timer based on wall-clock timestamps, with pause, resume, reset, and next activity.
- Daily activity completion and simple learning statistics.
- Progress and activity data stored locally in the browser.
- Installable PWA with an offline app shell after the first successful visit.

## Run locally

Open `index.html` in a browser. For service-worker/offline testing, serve the folder over localhost (for example, `python -m http.server 8000`) and visit `http://localhost:8000`.

## Publish for free with GitHub Pages

1. Open the repository **Settings → Pages**.
2. Under **Build and deployment**, choose **Deploy from a branch**.
3. Select branch **main** and folder **/(root)**, then save.
4. Wait for GitHub Pages to publish. Your app will be available at `https://hospicefocus.github.io/english-companion/`.

No paid plan is required for this public static site.

## Important limitations

- Progress is stored on this device/browser only. It does not synchronize between devices.
- Browser notifications are optional and depend on permission and browser support. A closed browser or operating-system restrictions can prevent alerts.
- The Google Fonts import is an optional visual enhancement; the app itself remains usable with system fonts if the font service is unavailable.

## Privacy

No analytics or external application backend is included. Activity data stays in this browser's local storage.