// Master scoring orchestrator. Builds a shared `conditions` object and dispatches
// to the three species scorers. Also produces the 24-hour hourly projection.

import { scoreLargemouth } from './largemouthScore.js';
import { scoreCrappie } from './crappieScore.js';
import { scoreCatfish } from './catfishScore.js';
import { classifySolunar } from '../utils/solunar.js';

// Discharge classes for the Chattahoochee below Walter F. George Dam
// (USGS 02343801). Baseline flows here run far higher than a headwater gauge —
// generation releases swing between ~1,000 and ~30,000+ cfs.
export function classifyInflow(cfs) {
  if (cfs == null || Number.isNaN(cfs)) return 'Normal';
  if (cfs < 3000) return 'Very Low';
  if (cfs < 15000) return 'Normal';
  if (cfs < 30000) return 'High';
  return 'Flood/Turbid';
}

export function estimateWaterTemp(hourlyAirF, currentIndex) {
  // Rolling 72-hour average air temp minus a lag offset. Eufaula is shallow
  // and tracks air temp more closely than a deep highland reservoir.
  if (!hourlyAirF || hourlyAirF.length === 0) return 68; // neutral fallback
  const window = 72;
  const start = Math.max(0, currentIndex - window);
  const slice = hourlyAirF.slice(start, currentIndex + 1).filter(v => v != null);
  if (!slice.length) return 68;
  const avg = slice.reduce((a, b) => a + b, 0) / slice.length;
  const wt = avg - 3;
  return Math.max(42, Math.min(92, Math.round(wt)));
}

export function classifyBaro(currentMb, threeHoursAgoMb) {
  if (currentMb == null || threeHoursAgoMb == null) {
    return { trend: 'stable', rate: 0 };
  }
  const rate = (currentMb - threeHoursAgoMb) / 3; // mb/hr
  if (rate > 0.5) return { trend: 'rising', rate };
  if (rate < -0.5) return { trend: 'falling', rate };
  return { trend: 'stable', rate };
}

export function buildConditions({
  at,                  // Date the conditions are valid at
  zone,                // 'upper' | 'mid' | 'deep'
  waterTemp,
  airTemp,
  pressure,
  pressure3hAgo,
  wind,
  windDir,
  clouds,
  precip,
  sunrise,
  sunset,
  moonPhase,
  moonIllumination,
  solunarPeriods,
  inflowClass,
}) {
  const baro = classifyBaro(pressure, pressure3hAgo);
  const hoursFromSunrise = sunrise ? (at - sunrise) / 3600000 : 0;
  const hoursFromSunset = sunset ? (sunset - at) / 3600000 : 0;
  const isDawnWindow = hoursFromSunrise >= -1 && hoursFromSunrise <= 2;
  const isDuskWindow = hoursFromSunset >= -1 && hoursFromSunset <= 2;
  const isNight = sunrise && sunset
    ? at < new Date(sunrise.getTime() - 3600000) || at > new Date(sunset.getTime() + 3600000)
    : false;
  const solunar = classifySolunar(at, solunarPeriods || []);
  return {
    at,
    zone,
    waterTemp,
    airTemp,
    pressure,
    baroTrend: baro.trend,
    baroRate: baro.rate,
    wind,
    windDir,
    clouds,
    precip,
    moonPhase,
    moonIllumination,
    solunar,
    inflowClass,
    isDawnWindow,
    isDuskWindow,
    isNight,
    month: at.getMonth(),
  };
}

export function scoreAll(conditions) {
  return {
    largemouth: scoreLargemouth(conditions),
    crappie: scoreCrappie(conditions),
    catfish: scoreCatfish(conditions),
  };
}

export function projectHourly({
  weather,
  zone,
  sunrise,
  sunset,
  moonPhase,
  moonIllumination,
  solunarPeriods,
  inflowClass,
}) {
  if (!weather || !weather.hourly) {
    return { largemouth: [], crappie: [], catfish: [] };
  }

  const out = { largemouth: [], crappie: [], catfish: [] };
  const times = weather.hourly.time;
  const today = new Date();
  const midnightStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}T00:00`;
  // Find midnight of today in the hourly array. With past_days=3 this is index 72.
  const base = times.indexOf(midnightStr);
  if (base < 0) return { largemouth: [], crappie: [], catfish: [] };

  for (let h = 0; h < 24; h++) {
    const i = base + h;
    const t = times[i];
    if (!t) {
      out.largemouth.push(null); out.crappie.push(null); out.catfish.push(null);
      continue;
    }
    const at = parseLocal(t);

    const airTemp = weather.hourly.temperature_2m[i];
    const pressure = weather.hourly.surface_pressure[i];
    const pressure3hAgo = i >= 3 ? weather.hourly.surface_pressure[i - 3] : pressure;
    const wind = weather.hourly.windspeed_10m[i];
    const clouds = weather.hourly.cloudcover[i];
    const precip = weather.hourly.precipitation[i] || 0;
    const waterTemp = estimateWaterTemp(weather.hourly.temperature_2m, i);

    const c = buildConditions({
      at,
      zone,
      waterTemp,
      airTemp,
      pressure,
      pressure3hAgo,
      wind,
      windDir: '',
      clouds,
      precip,
      sunrise,
      sunset,
      moonPhase,
      moonIllumination,
      solunarPeriods,
      inflowClass,
    });
    const s = scoreAll(c);
    out.largemouth.push(s.largemouth.score);
    out.crappie.push(s.crappie.score);
    out.catfish.push(s.catfish.score);
  }
  return out;
}

function pad(n) { return String(n).padStart(2, '0'); }

function parseLocal(s) {
  // Open-Meteo returns local times in ISO 8601 without an offset (per timezone param).
  // Parse as local time.
  const [datePart, timePart] = s.split('T');
  const [y, m, d] = datePart.split('-').map(Number);
  const [hh, mm] = timePart.split(':').map(Number);
  return new Date(y, m - 1, d, hh, mm);
}
