# Georgia Bites

A single-page React app that aggregates real-time environmental and astronomical
data, runs it through species-specific fishing behavior models, and outputs a
color-coded **Bite Score (0–100)** for three species across the **major Georgia
reservoirs**. Pick a lake from the header dropdown and every feed re-targets to
that lake.

- **Largemouth Bass**
- **Crappie** — early spawner; the late-winter/spring creek-arm run drives the model
- **Catfish** — inverted model: warm water, night hours, and dam-generation
  current all *raise* the score

## Lakes covered

Lanier, Hartwell, Clarks Hill (J. Strom Thurmond), West Point, Allatoona,
Oconee, Sinclair, Walter F. George (Eufaula), Seminole, Blackshear, Jackson,
and Carters. Add more by appending an entry to `src/lakes.js` — no other code
changes required.

## Data sources (all free, no keys)

| Source | Use | Refresh |
|---|---|---|
| [Open-Meteo](https://open-meteo.com) | temp, wind, clouds, pressure, precip (per lake lat/lon) | 30 min |
| USGS NWIS below-dam gauge | discharge (current/turbidity proxy) where a site exists | 15 min |
| Client-side astronomy | sunrise/sunset, moon phase, solunar periods (per lake lat/lon) | computed |

Water temperature is estimated from a 72-hour rolling air-temp average
(shallow-lake model, ±4°F) — displayed with a `~` prefix.

Not every lake has a below-dam discharge gauge (e.g. Wallace Dam on Lake Oconee
discharges through a tailrace into Lake Sinclair, so there is no river gauge).
When a lake has no `usgsSite`, the app runs normally and the scoring engine
assumes Normal inflow.

The "Ask the guide" panel streams an explanation from the Anthropic API when
reachable and falls back to static guide-style text otherwise (the Anthropic
API blocks browser-origin CORS, so on a plain static host the fallback is
what renders — a small server-side proxy is needed for live streaming).

## Adding a lake

Append one entry to the `LAKES` array in `src/lakes.js`:

```js
{ id: 'walter-f-george', name: 'Lake Name', lat: 00.0000, lon: -00.0000,
  timezone: 'America/New_York', usgsSite: '0000000' /* or null */,
  dam: 'Dam Name', river: 'River Name' }
```

`lat`/`lon` drive weather + astronomy (only need to be roughly lake-center).
`usgsSite` is the NWIS site number for the below-dam **discharge** gauge
(parameter 00060); set it to `null` if none exists.

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # outputs dist/
```

## Deploy

- **Vercel / Netlify**: import the repo — `vercel.json` / `netlify.toml` are
  already configured.
- Any static host: upload `dist/` with an SPA fallback to `index.html`.
