# Georgia Bite Score

A React + Vite single-page app that shows real-time, species-specific fishing
**Bite Scores (0–100)** for **Largemouth Bass, Crappie, and Catfish** across the
major Georgia reservoirs. Pick a lake from the header dropdown; every live feed
re-targets to that lake and the choice is remembered per device (localStorage).

> **This is a standalone project. Keep it entirely separate from the "Eufaula
> Bites" app — do not pull code, branding, or assets from that repo.** The
> scoring engine here was originally derived from that project but this repo is
> its own product with its own history, Vercel deployment, and branding.

## Stack & deployment

- **React 18 + Vite**, Tailwind CSS, Recharts.
- Deployed on **Vercel** — auto-deploys from `main`; every PR gets a preview URL.
  `vercel.json` and `netlify.toml` are both committed.
- All data sources are **free and keyless**; there is no backend.

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # outputs dist/
```

## Architecture — data-driven by a lake registry

Adding or changing a lake is a **one-line edit to `src/lakes.js`**; no other code
changes are needed. That is the core design.

- **`src/lakes.js`** — the registry. Each lake: `id`, `name`, `lat`, `lon`,
  `timezone`, `usgsSite` (below-dam USGS discharge gauge site number, or `null`),
  `dam`, `river`. `DEFAULT_LAKE_ID` is `lanier`. `getLake(id)` resolves an entry.
- **`src/components/LakeSelector.jsx`** — the header dropdown (native `<select>`
  for phone/boat-deck use); selection persisted in `localStorage`.
- **Parameterized hooks:**
  - `useWeather(lat, lon, timezone)` — Open-Meteo forecast (works at any coords).
  - `useGauge(usgsSite)` — USGS NWIS instantaneous values, discharge param `00060`.
    When `usgsSite` is `null` the hook fetches nothing and the engine assumes
    Normal inflow.
  - `useAstronomy(lat, lon)` — sun/moon/solunar, all computed client-side.
- **`src/utils/astronomy.js`, `src/utils/solunar.js`** — take `lat`/`lon` as
  arguments (no module-level coordinate constants).
- **`src/engine/*`** — `largemouthScore`, `crappieScore`, `catfishScore`, and
  `scoreEngine`. Catfish is an inverted model (warm water, night, dam current
  *raise* the score).
- **`src/services/anthropicService.js`** — the "Ask the guide" panel. Lake-aware
  (prompt + fallback reference the selected lake). Live streaming needs a
  server-side proxy for the Anthropic API on a static host (browser CORS is
  blocked); otherwise it renders a static fallback.

## The 12 seeded lakes

Lanier, Hartwell, Clarks Hill (J. Strom Thurmond), West Point, Allatoona,
Oconee, Sinclair, Walter F. George (Eufaula), Seminole, Blackshear, Jackson,
Carters.

- **Lake Oconee has no below-dam gauge** (`usgsSite: null`) — Wallace Dam
  discharges through a tailrace directly into Lake Sinclair, so there is no
  river gauge. This is expected and handled gracefully.
- **Gauge caveat:** USGS site numbers were verified against USGS
  monitoring-location pages and live third-party mirrors. Two are worth a
  one-time sanity check that they return live discharge on the deployed host:
  **Hartwell (`02187020`)** and **Blackshear (`02350330`)**.

## Theme — University of Georgia colors

Near-black background with **Bulldog red (`#ba0c2f`)** as the accent.

- Theme tokens live in **`tailwind.config.js`** (`bg`, `surface`, `edge`, `body`,
  `heading`, `accent`) and the body gradient/scrollbar in **`src/index.css`**.
- **Functional colors are intentionally NOT red/black** — keep them:
  - Species rings: bass = green, crappie = purple, catfish = orange.
  - Score gradient: tough = red, fair = amber, good = blue, excellent = green.
  These encode *which species* and *how good the bite is*; recoloring them would
  erase that signal.

## Known follow-ups / open items

- **Per-lake species tuning.** The engine's seasonal tuning still carries some
  assumptions derived from the original Eufaula model (see comments in
  `src/engine/*`). Scores are sensible everywhere, but lake-by-lake tuning
  (spawn timing, forage, water clarity) is an open improvement.
- Water temperature is *estimated* from a 72-hour rolling air-temp average
  (shallow-lake model, ±4°F) and shown with a `~` prefix — there is no live
  water-temp feed.

## Conventions

- Match the existing code style; components are function components with hooks.
- When adding a lake, verify the `usgsSite` returns discharge (`00060`) at
  waterdata.usgs.gov, or set it to `null`.
- Keep the Eufaula app out of this repo.
