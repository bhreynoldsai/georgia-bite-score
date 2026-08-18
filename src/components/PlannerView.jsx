import { useMemo } from 'react';
import { usePlannerForecast } from '../hooks/usePlannerForecast.js';
import { projectDailyOutlook } from '../engine/scoreEngine.js';

const SPECIES = [
  { key: 'largemouth', name: 'Largemouth', icon: '🎣' },
  { key: 'crappie',    name: 'Crappie',    icon: '🐠' },
  { key: 'catfish',    name: 'Catfish',    icon: '🐟' },
];

// 7-day outlook for the selected lake — helps plan a trip in advance rather
// than only reporting conditions right now.
export default function PlannerView({ lake, zone, inflowClass }) {
  const { data, loading, error } = usePlannerForecast(lake.lat, lake.lon, lake.timezone);

  const days = useMemo(() => {
    if (!data) return [];
    return projectDailyOutlook({ weather: data, zone, lat: lake.lat, lon: lake.lon, inflowClass, days: 7 });
  }, [data, zone, lake, inflowClass]);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-body/70">
        7-day outlook for <span className="text-heading font-medium">{lake.name}</span> — best species and hour, each day.
      </p>

      {loading && !data && <p className="text-body/60 text-sm">Loading the week's forecast…</p>}
      {error && <p className="text-amber-300 text-sm">Forecast unavailable right now.</p>}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {days.map((day, i) => {
          const ranked = SPECIES
            .map((sp) => ({ ...sp, ...day.peaks[sp.key] }))
            .filter((sp) => sp.score != null)
            .sort((a, b) => b.score - a.score);
          const best = ranked[0];
          if (!best) return null;

          return (
            <div key={i} className="bg-surface border border-edge rounded-xl p-4 flex flex-col gap-1.5">
              <div className="text-xs uppercase tracking-wide text-body/60">
                {i === 0 ? 'Today' : day.date.toLocaleDateString('en-US', { weekday: 'short' })}
              </div>
              <div className="text-xs text-body/50">
                {day.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-2xl" aria-hidden>{best.icon}</span>
                <span className="text-3xl font-display font-bold" style={{ color: best.color }}>
                  {best.score}
                </span>
              </div>
              <div className="text-sm text-heading font-medium">{best.name} · {best.label}</div>
              <div className="text-xs text-body/60">Peak ~{fmtHour(best.hour)}</div>
              <div className="flex gap-1.5 mt-1 flex-wrap">
                {ranked.slice(1).map((sp) => (
                  <span
                    key={sp.key}
                    className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                    style={{ background: `${sp.color}26`, color: sp.color, border: `1px solid ${sp.color}66` }}
                  >
                    {sp.icon} {sp.score}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function fmtHour(h) {
  const period = h >= 12 ? 'PM' : 'AM';
  let hour12 = h % 12;
  if (hour12 === 0) hour12 = 12;
  return `${hour12}:00 ${period}`;
}
