import { useEffect, useRef, useState, useCallback } from 'react';

// USGS NWIS instantaneous-values feed for a below-dam discharge gauge. The site
// number is per-lake (see src/lakes.js). Discharge (param 00060) doubles as a
// generation/current/turbidity proxy for the lake; gauge height is 00065. Not
// every lake has a below-dam gauge — when usgsSite is null this hook simply
// reports no data and the scoring engine assumes Normal inflow.
function buildUrl(site) {
  return 'https://waterservices.usgs.gov/nwis/iv/'
    + `?format=json&sites=${site}&parameterCd=00060,00065&siteStatus=active`;
}

const REFRESH_MS = 15 * 60 * 1000;

export function useGauge(usgsSite) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(!!usgsSite);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const inflight = useRef(null);

  const fetchGauge = useCallback(async () => {
    if (!usgsSite) {
      // No below-dam gauge configured for this lake — nothing to fetch.
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }
    if (inflight.current) inflight.current.abort();
    const ctrl = new AbortController();
    inflight.current = ctrl;
    const timeout = setTimeout(() => ctrl.abort(), 10000);
    const URL = buildUrl(usgsSite);

    setLoading(true);
    try {
      const res = await fetch(URL, { signal: ctrl.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const series = json?.value?.timeSeries || [];
      const out = { discharge: null, height: null };
      for (const s of series) {
        const code = s.variable.variableCode?.[0]?.value;
        const value = parseFloat(s.values?.[0]?.value?.[0]?.value);
        if (Number.isNaN(value) || value < 0) continue;
        if (code === '00060') out.discharge = value;
        else if (code === '00065') out.height = value;
      }
      setData(out);
      setError(null);
      setLastUpdated(new Date());
    } catch (e) {
      if (e.name !== 'AbortError') {
        console.error('[gauge]', URL, e.message);
        setError(e.message);
      }
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  }, [usgsSite]);

  useEffect(() => {
    fetchGauge();
    const id = setInterval(fetchGauge, REFRESH_MS);
    return () => clearInterval(id);
  }, [fetchGauge]);

  return { data, loading, error, lastUpdated, refresh: fetchGauge };
}
