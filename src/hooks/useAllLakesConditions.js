import { useEffect, useRef, useState, useCallback } from 'react';
import { LAKES } from '../lakes.js';
import { currentHourIndex } from './useWeather.js';
import { sunTimes, moonPhase } from '../utils/astronomy.js';
import { solunarPeriods } from '../utils/solunar.js';
import { buildConditions, scoreAll, estimateWaterTemp, classifyInflow } from '../engine/scoreEngine.js';

// Every seeded lake shares this timezone (see lakes.js) — Open-Meteo's
// multi-location call takes a single timezone param, so this is safe.
const TIMEZONE = 'America/New_York';
const REFRESH_MS = 30 * 60 * 1000;
const GAUGE_SITES = [...new Set(LAKES.map((l) => l.usgsSite).filter(Boolean))];

// One batched Open-Meteo call (comma-separated lat/lon returns one forecast
// object per location, same order) plus one batched USGS call, instead of
// firing off 12 separate per-lake fetches.
function buildWeatherUrl() {
  const lats = LAKES.map((l) => l.lat).join(',');
  const lons = LAKES.map((l) => l.lon).join(',');
  return 'https://api.open-meteo.com/v1/forecast'
    + `?latitude=${lats}&longitude=${lons}`
    + '&hourly=temperature_2m,precipitation,windspeed_10m,winddirection_10m,cloudcover,surface_pressure'
    + '&temperature_unit=fahrenheit&windspeed_unit=mph'
    + `&timezone=${encodeURIComponent(TIMEZONE)}&forecast_days=1&past_days=1`;
}

function buildGaugeUrl() {
  return 'https://waterservices.usgs.gov/nwis/iv/'
    + `?format=json&sites=${GAUGE_SITES.join(',')}&parameterCd=00060,00065&siteStatus=active`;
}

export function useAllLakesConditions(zone) {
  const [rows, setRows] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const inflight = useRef(null);

  const fetchAll = useCallback(async () => {
    const ctrl = new AbortController();
    inflight.current?.abort();
    inflight.current = ctrl;
    const timeout = setTimeout(() => ctrl.abort(), 15000);

    setLoading(true);
    try {
      const [weatherRes, gaugeRes] = await Promise.all([
        fetch(buildWeatherUrl(), { signal: ctrl.signal }),
        GAUGE_SITES.length ? fetch(buildGaugeUrl(), { signal: ctrl.signal }) : Promise.resolve(null),
      ]);
      if (!weatherRes.ok) throw new Error(`weather HTTP ${weatherRes.status}`);
      const weatherJson = await weatherRes.json();
      const weatherList = Array.isArray(weatherJson) ? weatherJson : [weatherJson];

      const dischargeBySite = {};
      if (gaugeRes) {
        if (!gaugeRes.ok) throw new Error(`gauge HTTP ${gaugeRes.status}`);
        const gaugeJson = await gaugeRes.json();
        for (const s of gaugeJson?.value?.timeSeries || []) {
          const site = s.sourceInfo?.siteCode?.[0]?.value;
          const code = s.variable?.variableCode?.[0]?.value;
          const value = parseFloat(s.values?.[0]?.value?.[0]?.value);
          if (!site || code !== '00060' || Number.isNaN(value) || value < 0) continue;
          dischargeBySite[site] = value;
        }
      }

      const now = new Date();
      const out = LAKES.map((lake, i) => {
        const data = weatherList[i];
        const idx = data ? currentHourIndex(data) : -1;
        if (idx < 0 || !data?.hourly) return { lake, scores: null };

        const h = data.hourly;
        const airTemp = h.temperature_2m[idx];
        const pressure = h.surface_pressure[idx];
        const pressure3hAgo = h.surface_pressure[Math.max(0, idx - 3)];
        const wind = h.windspeed_10m[idx];
        const clouds = h.cloudcover[idx];
        const precip = h.precipitation[idx] ?? 0;
        const waterTemp = estimateWaterTemp(h.temperature_2m, idx);
        const inflowClass = classifyInflow(lake.usgsSite ? dischargeBySite[lake.usgsSite] : null);

        const sun = sunTimes(now, lake.lat, lake.lon);
        const moon = moonPhase(now);
        const periods = solunarPeriods(now, lake.lat, lake.lon);

        const conditions = buildConditions({
          at: now, zone, waterTemp, airTemp, pressure, pressure3hAgo, wind, windDir: '',
          clouds, precip, sunrise: sun.sunrise, sunset: sun.sunset,
          moonPhase: moon.name, moonIllumination: moon.illumination,
          solunarPeriods: periods, inflowClass,
        });

        return { lake, scores: scoreAll(conditions), waterTemp };
      });

      setRows(out);
      setError(null);
    } catch (e) {
      if (e.name !== 'AbortError') {
        console.error('[compare]', e.message);
        setError(e.message);
      }
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  }, [zone]);

  useEffect(() => {
    fetchAll();
    const id = setInterval(fetchAll, REFRESH_MS);
    return () => { clearInterval(id); inflight.current?.abort(); };
  }, [fetchAll]);

  return { rows, loading, error, refresh: fetchAll };
}
