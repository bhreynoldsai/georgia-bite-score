import { useEffect, useRef, useState, useCallback } from 'react';

// Extended forecast for the trip planner, fetched only while that tab is open.
// Kept separate from useWeather so the Today tab's refresh cycle doesn't carry
// a week of hourly data it never uses.
function buildUrl(lat, lon, timezone) {
  return 'https://api.open-meteo.com/v1/forecast'
    + `?latitude=${lat}&longitude=${lon}`
    + '&hourly=temperature_2m,precipitation,windspeed_10m,winddirection_10m,cloudcover,surface_pressure'
    + '&temperature_unit=fahrenheit&windspeed_unit=mph'
    + `&timezone=${encodeURIComponent(timezone)}&forecast_days=7&past_days=1`;
}

const REFRESH_MS = 30 * 60 * 1000;

export function usePlannerForecast(lat, lon, timezone) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const inflight = useRef(null);

  const fetchForecast = useCallback(async () => {
    if (inflight.current) inflight.current.abort();
    const ctrl = new AbortController();
    inflight.current = ctrl;
    const timeout = setTimeout(() => ctrl.abort(), 10000);

    setLoading(true);
    try {
      const res = await fetch(buildUrl(lat, lon, timezone), { signal: ctrl.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData(await res.json());
      setError(null);
    } catch (e) {
      if (e.name !== 'AbortError') {
        console.error('[planner]', e.message);
        setError(e.message);
      }
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  }, [lat, lon, timezone]);

  useEffect(() => {
    fetchForecast();
    const id = setInterval(fetchForecast, REFRESH_MS);
    return () => { clearInterval(id); inflight.current?.abort(); };
  }, [fetchForecast]);

  return { data, loading, error, refresh: fetchForecast };
}
