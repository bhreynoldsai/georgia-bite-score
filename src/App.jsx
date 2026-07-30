import { useEffect, useMemo, useState } from 'react';
import { useWeather, currentHourIndex } from './hooks/useWeather.js';
import { useGauge } from './hooks/useGauge.js';
import { useAstronomy } from './hooks/useAstronomy.js';
import {
  buildConditions, scoreAll, projectHourly,
  estimateWaterTemp, classifyInflow, classifyBaro,
} from './engine/scoreEngine.js';

import ConditionsBar from './components/ConditionsBar.jsx';
import ZoneSelector, { DEFAULT_ZONES } from './components/ZoneSelector.jsx';
import LakeSelector from './components/LakeSelector.jsx';
import LiveDataFeeds from './components/LiveDataFeeds.jsx';
import BiteScoreDashboard from './components/BiteScoreDashboard.jsx';
import SolunarTimeline from './components/SolunarTimeline.jsx';
import BiteExplanation from './components/BiteExplanation.jsx';
import GuideAvatar from './components/GuideAvatar.jsx';
import { getLake, DEFAULT_LAKE_ID } from './lakes.js';

const SPECIES_NAMES = { largemouth: 'Largemouth Bass', crappie: 'Crappie', catfish: 'Catfish' };
const ZONE_NAMES = Object.fromEntries(DEFAULT_ZONES.map((z) => [z.id, z.label]));
const LAKE_STORAGE_KEY = 'georgia-bites-lake';

function loadInitialLake() {
  try {
    const saved = localStorage.getItem(LAKE_STORAGE_KEY);
    if (saved && getLake(saved).id === saved) return saved;
  } catch {
    /* storage unavailable — fall through to default */
  }
  return DEFAULT_LAKE_ID;
}

export default function App() {
  const [lakeId, setLakeId] = useState(loadInitialLake);
  const lake = getLake(lakeId);

  const weather = useWeather(lake.lat, lake.lon, lake.timezone);
  const gauge = useGauge(lake.usgsSite);
  const astro = useAstronomy(lake.lat, lake.lon);
  const [zone, setZone] = useState('mid');

  // Persist the chosen lake so it reopens where the angler left off.
  useEffect(() => {
    try { localStorage.setItem(LAKE_STORAGE_KEY, lakeId); } catch { /* ignore */ }
  }, [lakeId]);

  // Tick every 5 minutes so scores reflect time-of-day changes even when no
  // upstream data has refreshed.
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 5 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  // Derive current-hour inputs
  const derived = useMemo(() => {
    const data = weather.data;
    const idx = currentHourIndex(data);
    if (idx < 0 || !data) return null;

    const h = data.hourly;
    const airTemp = h.temperature_2m[idx];
    const pressure = h.surface_pressure[idx];
    const pressure3hAgo = h.surface_pressure[Math.max(0, idx - 3)];
    const wind = h.windspeed_10m[idx];
    const windDir = degToCompass(h.winddirection_10m?.[idx]);
    const clouds = h.cloudcover[idx];
    const precip = h.precipitation[idx] ?? 0;
    const waterTemp = estimateWaterTemp(h.temperature_2m, idx);
    const inflowClass = classifyInflow(gauge.data?.discharge);
    const baro = classifyBaro(pressure, pressure3hAgo);

    return { idx, airTemp, pressure, pressure3hAgo, wind, windDir, clouds, precip, waterTemp, inflowClass, baro };
  }, [weather.data, gauge.data, tick]);

  // Build conditions and score
  const scores = useMemo(() => {
    if (!derived) return null;
    const now = new Date();
    const conditions = buildConditions({
      at: now,
      zone,
      waterTemp: derived.waterTemp,
      airTemp: derived.airTemp,
      pressure: derived.pressure,
      pressure3hAgo: derived.pressure3hAgo,
      wind: derived.wind,
      windDir: derived.windDir,
      clouds: derived.clouds,
      precip: derived.precip,
      sunrise: astro.sunrise,
      sunset: astro.sunset,
      moonPhase: astro.moonPhase,
      moonIllumination: astro.moonIllumination,
      solunarPeriods: astro.solunarPeriods,
      inflowClass: derived.inflowClass,
    });
    return scoreAll(conditions);
  }, [derived, zone, astro, tick]);

  const hourly = useMemo(() => {
    if (!weather.data) return null;
    return projectHourly({
      weather: weather.data,
      zone,
      sunrise: astro.sunrise,
      sunset: astro.sunset,
      moonPhase: astro.moonPhase,
      moonIllumination: astro.moonIllumination,
      solunarPeriods: astro.solunarPeriods,
      inflowClass: derived?.inflowClass || 'Normal',
    });
  }, [weather.data, zone, astro, derived]);

  // Modal for AI explanation
  const [explainSpecies, setExplainSpecies] = useState(null);
  const explainArgs = useMemo(() => {
    if (!explainSpecies || !scores || !derived) return null;
    const s = scores[explainSpecies];
    const top = [...s.factors].sort((a, b) => (b.pts / (b.max || 1)) - (a.pts / (a.max || 1))).slice(0, 3);
    const low = [...s.factors].sort((a, b) => (a.pts / (a.max || 1)) - (b.pts / (b.max || 1))).slice(0, 2);
    const now = new Date();
    return {
      lake: lake.name,
      lakeDam: lake.dam,
      species: SPECIES_NAMES[explainSpecies],
      score: s.score,
      label: s.label,
      zone: ZONE_NAMES[zone],
      waterTemp: derived.waterTemp,
      airTemp: Math.round(derived.airTemp),
      pressure: Math.round(derived.pressure),
      pressureTrend: `${derived.baro.trend} (${derived.baro.rate.toFixed(2)} mb/hr)`,
      wind: Math.round(derived.wind),
      windDir: derived.windDir,
      clouds: Math.round(derived.clouds),
      precip: (derived.precip ?? 0).toFixed(2),
      time: now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      sunRelation: sunRelation(now, astro),
      moonPhase: astro.moonPhase,
      moonIllum: astro.moonIllumination,
      solunarStatus: solunarStatus(astro.solunarPeriods, now),
      inflowStatus: derived.inflowClass,
      topFactors: top.map(f => `${f.name} ${f.pts}/${f.max}`).join(', '),
      lowFactors: low.map(f => `${f.name} ${f.pts}/${f.max}`).join(', '),
    };
  }, [explainSpecies, scores, derived, zone, astro, lake]);

  const summary = useMemo(() => ({
    airTemp: derived?.airTemp,
    wind: derived?.wind,
    windDir: derived?.windDir,
    clouds: derived?.clouds,
    waterTemp: derived?.waterTemp,
    baroRate: derived?.baro?.rate,
    moonPhase: astro.moonPhase,
    moonIllum: astro.moonIllumination,
  }), [derived, astro]);

  const liveRows = useMemo(() => {
    if (!derived) return [];
    return [
      { name: 'Air Temp',      value: fmt(derived.airTemp, '°F'),         status: derived.airTemp >= 50 && derived.airTemp <= 85 ? 'Favorable' : 'Neutral' },
      { name: 'Water Temp',    value: `~${fmt(derived.waterTemp, '°F')}`, status: derived.waterTemp >= 58 && derived.waterTemp <= 76 ? 'Favorable' : derived.waterTemp > 85 ? 'Unfavorable' : 'Neutral' },
      { name: 'Wind',          value: `${fmt(derived.wind, ' mph')}${derived.windDir ? ' ' + derived.windDir : ''}`, status: derived.wind >= 5 && derived.wind <= 15 ? 'Favorable' : derived.wind > 20 ? 'Unfavorable' : 'Neutral' },
      { name: 'Cloud Cover',   value: fmt(derived.clouds, '%'),           status: derived.clouds > 75 ? 'Favorable' : 'Neutral' },
      { name: 'Pressure',      value: `${fmt(derived.pressure, ' mb')} (${derived.baro.trend})`, status: derived.baro.trend === 'stable' || derived.baro.trend === 'rising' ? 'Favorable' : 'Unfavorable' },
      { name: 'Precipitation', value: `${derived.precip?.toFixed(2) ?? '0.00'} in/hr`, status: derived.precip >= 0.05 && derived.precip <= 0.20 ? 'Favorable' : derived.precip > 0.5 ? 'Unfavorable' : 'Neutral' },
      { name: 'Inflow',        value: gauge.data?.discharge != null ? `${Math.round(gauge.data.discharge)} cfs (${derived.inflowClass})` : '--', status: derived.inflowClass === 'Normal' || derived.inflowClass === 'High' ? 'Favorable' : derived.inflowClass === 'Flood/Turbid' ? 'Unfavorable' : 'Neutral' },
      { name: 'Moon Phase',    value: `${astro.moonPhase} · ${astro.moonIllumination}%`, status: astro.moonPhase === 'Full Moon' || astro.moonPhase === 'New Moon' ? 'Favorable' : 'Neutral' },
      { name: 'Solunar',       value: solunarStatus(astro.solunarPeriods, new Date()), status: solunarStatus(astro.solunarPeriods, new Date()) === 'Major' ? 'Favorable' : 'Neutral' },
    ];
  }, [derived, gauge.data, astro]);

  const currentHour = new Date().getHours();

  return (
    <div className="min-h-screen text-body">
      {/* Header */}
      <header className="px-4 sm:px-6 pt-5 pb-3 border-b border-edge bg-bg/80 backdrop-blur sticky top-0 z-20">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-baseline justify-between flex-wrap gap-2 mb-3">
            <div className="flex items-center gap-3 flex-wrap">
              <GuideAvatar size={72} hideIfMissing />
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-heading uppercase tracking-wider">
                Georgia <span className="text-accent">Bite Score</span>
              </h1>
              <LakeSelector value={lakeId} onChange={setLakeId} />
            </div>
            <div className="text-xs text-body/70">
              {astro.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              {' · '}
              Sunrise {fmtTime(astro.sunrise)} · Sunset {fmtTime(astro.sunset)}
            </div>
          </div>
          <ConditionsBar summary={summary} />
        </div>
      </header>

      {(weather.error || gauge.error) && (
        <div className="bg-amber-500/15 border-b border-amber-500/40 text-amber-200 text-sm px-4 py-2 text-center">
          {weather.error && <>Weather data unavailable — scores estimated from available data. </>}
          {gauge.error && <>River gauge unavailable — inflow assumed Normal.</>}
        </div>
      )}

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-5 flex flex-col gap-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <ZoneSelector value={zone} onChange={setZone} />
          <div className="text-xs text-body/60">
            Auto-refresh: weather 30m · gauge 15m · scores 5m
          </div>
        </div>

        <BiteScoreDashboard
          scores={scores}
          hourly={hourly}
          currentHour={currentHour}
          onExplain={setExplainSpecies}
        />

        <SolunarTimeline astronomy={astro} />

        <LiveDataFeeds
          rows={liveRows}
          lastWeather={weather.lastUpdated}
          lastGauge={gauge.lastUpdated}
        />

        <footer className="text-center text-xs text-body/50 py-4">
          {lake.name} · {lake.dam} ({lake.river})
          {' · '}
          Data: Open-Meteo{lake.usgsSite ? ` · USGS gauge ${lake.usgsSite}` : ' · no below-dam gauge'}
          {' · '}
          {Math.abs(lake.lat).toFixed(4)}°N, {Math.abs(lake.lon).toFixed(4)}°W
        </footer>
      </main>

      <BiteExplanation
        open={!!explainSpecies}
        onClose={() => setExplainSpecies(null)}
        args={explainArgs}
      />
    </div>
  );
}

function fmt(v, suffix = '') {
  if (v == null || Number.isNaN(v)) return '--';
  return `${Math.round(v)}${suffix}`;
}

function fmtTime(d) {
  if (!d) return '--';
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function degToCompass(deg) {
  if (deg == null) return '';
  const dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
  return dirs[Math.round(deg / 22.5) % 16];
}

function sunRelation(now, astro) {
  if (!astro.sunrise || !astro.sunset) return 'unknown';
  if (now < astro.sunrise) return 'before sunrise';
  if (Math.abs(now - astro.sunrise) < 2 * 3600 * 1000) return 'dawn window';
  if (Math.abs(now - astro.sunset) < 2 * 3600 * 1000) return 'dusk window';
  if (now > astro.sunset) return 'after sunset';
  return 'midday';
}

function solunarStatus(periods, now) {
  if (!periods) return 'None';
  for (const p of periods) {
    if (now >= p.start && now <= p.end) return p.label;
  }
  return 'None';
}
