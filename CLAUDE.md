# Georgia Bites

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
- Weather/gauge/astronomy data are **free and keyless**. The one server-side
  piece is `api/guide.js` (Vercel Edge Function) which proxies "Ask the guide"
  to the Anthropic API — set `ANTHROPIC_API_KEY` in the Vercel env; without it
  the panel gracefully falls back to canned summaries.
- **iOS app**: a Capacitor (SPM, no CocoaPods) wrapper in `ios/`. See
  `APP_STORE.md` for the build/submit workflow. After changing web code:
  `npm run build && npx cap sync ios`.

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # outputs dist/ (vendor/charts split via manualChunks)
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
  (prompt + fallback reference the selected lake). Streams via the `/api/guide`
  Edge Function proxy (`api/guide.js`, model `claude-sonnet-5`); when the proxy
  is absent (plain `vite dev`) or unconfigured, it renders a static fallback.

## The 12 seeded lakes

Lanier, Hartwell, Clarks Hill (J. Strom Thurmond), West Point, Allatoona,
Oconee, Sinclair, Walter F. George (Eufaula), Seminole, Blackshear, Jackson,
Carters.

- **Two lakes have no below-dam gauge** (`usgsSite: null`), which is expected
  and handled gracefully (engine assumes Normal inflow):
  - **Oconee** — Wallace Dam discharges through a tailrace directly into Lake
    Sinclair; no river gauge exists.
  - **Hartwell** — its tailwater is Lake Russell's pool; NWIS has no active
    below-dam discharge gauge (02187010 is a lake-level station).
- All other site numbers were **verified live against the NWIS IV API**
  (2026-07-30): each returns current `00060` discharge. Notable choices:
  Clarks Hill uses `02197000` (Savannah at Augusta, ~20 mi below Thurmond),
  West Point uses `02339500` (the `02339402` below-dam station is stage-only),
  Sinclair `02223000`, Blackshear `02350512`.
- **Do NOT use gauge water temperature (param 00010) as lake water temp.**
  Below-dam gauges measure the tailrace, which on deep reservoirs is
  hypolimnetic release water — Lanier's gauge reads ~50°F in July while the
  lake surface is ~80°F. Keep the air-temp-derived estimate.

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

## Icons & branding assets

- Master icon artwork is `public/icon.svg`. Rasterize web PNGs with
  `node scripts/generate-icons.mjs`; iOS icons/splash come from `assets/` via
  `npx @capacitor/assets generate --ios` (see `APP_STORE.md`).

## Conventions

- Match the existing code style; components are function components with hooks.
- When adding a lake, verify the `usgsSite` returns discharge (`00060`) at
  waterdata.usgs.gov (or via the NWIS IV API), or set it to `null`.
- The sticky header pads with `env(safe-area-inset-top)` for the iPhone
  Dynamic Island — keep that when restyling the header.
- Keep the Eufaula app out of this repo.
