# Vino Map

A personal wine tasting tracker. Log what you drink, rate it, and watch a
Wine-Folly-style circular flavor wheel light up based on how often and how
highly you rate each variety, blend, and region. Includes a Spotify-Wrapped
style "Wrapped" tab that animates your tasting history month by month or
year by year.

All data is stored locally in the browser (`localStorage`) — nothing leaves
your device.

## Features

- Circular wine wheel with reds, whites, rosé, sparkling, fortified, and a
  dedicated blends ring (rendered as yin-yang symbols colored by grape family)
- Heat map that morphs based on tasting frequency × rating
- Multi-select logging (log a flight or a blend's components in one go)
- Tasting history with notes, vintage, and star ratings
- Wrapped tab: animated monthly/yearly playback of your tasting journey
- Installable as a PWA (works offline, add to home screen)

## Local development

```bash
npm install
npm run dev
```

Visit the printed local URL (typically `http://localhost:5173`).

## Build

```bash
npm run build
npm run preview   # sanity-check the production build locally
```

## Deploy to Vercel

1. Push this repo to GitHub.
2. Go to [vercel.com/new](https://vercel.com/new) and import the repo.
3. Vercel auto-detects Vite — no config changes needed (the included
   `vercel.json` handles SPA routing for client-side navigation).
4. Deploy. Your app will be live at `your-project.vercel.app`.

## Project structure

```
vino-map/
├── index.html          # HTML entry point
├── vite.config.js       # Vite + PWA plugin config
├── vercel.json           # SPA rewrite rules for Vercel
├── package.json
├── public/
│   ├── favicon.svg
│   ├── icon-192.png     # PWA icon (replace with your own art anytime)
│   └── icon-512.png
└── src/
    ├── main.jsx          # React root
    └── App.jsx           # The entire Vino Map app
```

## Customizing icons

The placeholder icons in `public/` are simple geometric stand-ins. Swap
`icon-192.png` and `icon-512.png` with your own artwork (same filenames,
square aspect ratio) and redeploy — no other changes needed.

## Notes on data persistence

Tastings are stored under the `wine-entries` key in `localStorage`. Clearing
browser data/site data will erase your log. There's no built-in export yet —
if you want a backup/export-to-JSON feature, that's a natural next step.
