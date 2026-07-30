// Registry of the major Georgia reservoirs the app scores.
//
// Each lake drives three live feeds:
//   • Open-Meteo weather   — from lat/lon/timezone (works for any coordinates)
//   • Astronomy + solunar  — computed from lat/lon (no network)
//   • USGS below-dam gauge — from usgsSite; OPTIONAL. When usgsSite is null the
//     app runs fine and the scoring engine assumes Normal inflow.
//
// Coordinates are approximate lake-center points (good to ~0.05°, which is far
// finer than weather/solunar need). usgsSite is the NWIS site number for the
// below-dam DISCHARGE gauge (param 00060) that reflects generation/current.
// To add a lake, append an entry here — no other code changes required.
//
// Gauge-accuracy notes (verified via USGS monitoring-location pages + live
// third-party mirrors; NWIS API was unreachable at authoring time, so if a
// gauge stops returning discharge, re-verify the site at waterdata.usgs.gov):
//   • hartwell 02187020 and blackshear 02350330 — sanity-check they return live
//     00060 discharge once reachable; documented alternates existed.
//   • oconee (Wallace Dam) has NO below-dam river gauge — it discharges through a
//     tailrace directly into Lake Sinclair — so usgsSite is intentionally null.

export const LAKES = [
  { id: 'lanier',      name: 'Lake Lanier',                          lat: 34.22,  lon: -84.00,   timezone: 'America/New_York', usgsSite: '02334430', dam: 'Buford Dam',              river: 'Chattahoochee River' },
  { id: 'hartwell',    name: 'Lake Hartwell',                        lat: 34.48,  lon: -82.87,   timezone: 'America/New_York', usgsSite: '02187020', dam: 'Hartwell Dam',            river: 'Savannah River' },
  { id: 'clarks-hill', name: 'Clarks Hill Lake (J. Strom Thurmond)', lat: 33.83,  lon: -82.36,   timezone: 'America/New_York', usgsSite: '02194501', dam: 'J. Strom Thurmond Dam',   river: 'Savannah River' },
  { id: 'west-point',  name: 'West Point Lake',                      lat: 33.00,  lon: -85.16,   timezone: 'America/New_York', usgsSite: '02339402', dam: 'West Point Dam',          river: 'Chattahoochee River' },
  { id: 'allatoona',   name: 'Lake Allatoona',                       lat: 34.16,  lon: -84.68,   timezone: 'America/New_York', usgsSite: '02394000', dam: 'Allatoona Dam',           river: 'Etowah River' },
  { id: 'oconee',      name: 'Lake Oconee',                          lat: 33.45,  lon: -83.18,   timezone: 'America/New_York', usgsSite: null,       dam: 'Wallace Dam',             river: 'Oconee River' },
  { id: 'sinclair',    name: 'Lake Sinclair',                        lat: 33.17,  lon: -83.28,   timezone: 'America/New_York', usgsSite: '02222510', dam: 'Sinclair Dam',            river: 'Oconee River' },
  { id: 'eufaula',     name: 'Lake Walter F. George (Eufaula)',      lat: 31.8950, lon: -85.1200, timezone: 'America/New_York', usgsSite: '02343801', dam: 'Walter F. George Dam',    river: 'Chattahoochee River' },
  { id: 'seminole',    name: 'Lake Seminole',                        lat: 30.78,  lon: -84.88,   timezone: 'America/New_York', usgsSite: '02358000', dam: 'Jim Woodruff Dam',        river: 'Apalachicola River' },
  { id: 'blackshear',  name: 'Lake Blackshear',                      lat: 31.92,  lon: -83.96,   timezone: 'America/New_York', usgsSite: '02350330', dam: 'Crisp County (Warwick) Dam', river: 'Flint River' },
  { id: 'jackson',     name: 'Lake Jackson',                         lat: 33.32,  lon: -83.85,   timezone: 'America/New_York', usgsSite: '02210500', dam: 'Lloyd Shoals Dam',        river: 'Ocmulgee River' },
  { id: 'carters',     name: 'Carters Lake',                         lat: 34.61,  lon: -84.65,   timezone: 'America/New_York', usgsSite: '02382500', dam: 'Carters Dam',             river: 'Coosawattee River' },
];

export const DEFAULT_LAKE_ID = 'lanier';

export function getLake(id) {
  return LAKES.find((l) => l.id === id) || LAKES.find((l) => l.id === DEFAULT_LAKE_ID) || LAKES[0];
}
