// Solunar periods built from moon transit and rise/set times.
//   Major periods: ~2 hours centered on upper transit and lower transit (underfoot)
//   Minor periods: ~1 hour centered on moonrise and moonset

import { moonTimes } from './astronomy.js';

const MAJOR_HALF_MS = 60 * 60 * 1000; // 1 hour each side → 2-hour window
const MINOR_HALF_MS = 30 * 60 * 1000; // 30 min each side → 1-hour window

export function solunarPeriods(date = new Date(), lat, lon) {
  const { rise, set, transit, underfoot } = moonTimes(date, lat, lon);
  const periods = [];

  if (transit) {
    periods.push({
      type: 'major',
      label: 'Major',
      start: new Date(transit.getTime() - MAJOR_HALF_MS),
      end: new Date(transit.getTime() + MAJOR_HALF_MS),
      anchor: transit,
    });
  }
  if (underfoot) {
    periods.push({
      type: 'major',
      label: 'Major',
      start: new Date(underfoot.getTime() - MAJOR_HALF_MS),
      end: new Date(underfoot.getTime() + MAJOR_HALF_MS),
      anchor: underfoot,
    });
  }
  if (rise) {
    periods.push({
      type: 'minor',
      label: 'Minor',
      start: new Date(rise.getTime() - MINOR_HALF_MS),
      end: new Date(rise.getTime() + MINOR_HALF_MS),
      anchor: rise,
    });
  }
  if (set) {
    periods.push({
      type: 'minor',
      label: 'Minor',
      start: new Date(set.getTime() - MINOR_HALF_MS),
      end: new Date(set.getTime() + MINOR_HALF_MS),
      anchor: set,
    });
  }

  return periods.sort((a, b) => a.start - b.start);
}

export function classifySolunar(date, periods) {
  for (const p of periods) {
    if (date >= p.start && date <= p.end) return p.type;
  }
  return 'none';
}
