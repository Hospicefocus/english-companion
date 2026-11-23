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

## Cross-device synchronization (optional free setup)

The app keeps working locally if cloud sync is not configured. To sync progress between your computer and phone, configure Supabase Free:

1. Create a Supabase project on the Free plan at https://supabase.com/dashboard. Supabase Free currently includes 500 MB database and 50,000 monthly active users; free projects can pause after one week of inactivity. See https://supabase.com/pricing.
2. In Supabase, open **SQL Editor**, paste and run the contents of `supabase-schema.sql`.
3. In **Project Settings → API**, copy the Project URL and the publishable (or legacy anon) key.
4. Open `config.js` in this repository and set `supabaseUrl` and `supabaseAnonKey`. These are public browser values; never use the `service_role` or secret key.
5. Deploy the updated commit. Open the app on each device and sign in with the same email and password.

The database uses Row Level Security. Each account can read, insert, and delete only its own progress rows. Completed activities are stored as individual records, so a new device merges its progress with cloud progress instead of replacing the other device's history. The old local statistics are migrated on first sign-in.

Email confirmation may be required before the first sign-in, depending on the Supabase Auth settings.

### Privacy and limitations

- Do not share your account password. Use the same account only on your own devices.
- The publishable/anon key is intended to be public; the Supabase secret/service-role key must never be placed in browser code.
- If the Supabase Free project pauses due to inactivity, cloud sync will resume after the project is restored. Local progress remains available in each browser.
- Sync runs after a completed activity, on sign-in, when the user presses **Synchroniser**, and when returning to the app. It is not a live keystroke/realtime sync.
