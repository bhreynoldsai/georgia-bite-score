import { useState } from 'react';

function pillClasses(status) {
  switch (status) {
    case 'Favorable':   return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40';
    case 'Unfavorable': return 'bg-rose-500/15 text-rose-300 border-rose-500/40';
    default:            return 'bg-slate-500/15 text-slate-300 border-slate-500/40';
  }
}

const TOOLTIPS = {
  'Air Temp':     'Drives our water-temp estimate via a 72-hour rolling average.',
  'Water Temp':   'Estimated from air temp model — actual may vary ±4°F.',
  'Wind':         '5–15 mph wind oxygenates water and breaks the surface to disguise lures.',
  'Cloud Cover':  'Overcast skies push fish shallower and extend the feeding window.',
  'Pressure':     'Stable or rising barometric pressure suits bass; a slow fall turns catfish on.',
  'Precipitation':'A light rain often triggers shallow feeding activity.',
  'Inflow':       'Dam generation flow as a proxy for current and turbidity. Current helps cats, hurts a muddy upper river.',
  'Moon Phase':   'Full and new moons strengthen solunar feeding periods.',
  'Solunar':      'Solunar majors and minors are based on moon transits, rise, and set.',
};

export default function LiveDataFeeds({ rows, lastWeather, lastGauge }) {
  const [open, setOpen] = useState(false);
  return (
    <section className="bg-surface border border-edge rounded-xl">
      <button
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <div>
          <h2 className="font-semibold text-heading">Live Data Feeds</h2>
          <p className="text-xs text-body/80">Tap to {open ? 'collapse' : 'expand'} raw inputs</p>
        </div>
        <span className="text-accent text-sm">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="px-4 pb-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-body/70 border-b border-edge">
                  <th className="py-2 font-medium">Data Point</th>
                  <th className="py-2 font-medium">Value</th>
                  <th className="py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.name} className="border-b border-edge/50 last:border-0">
                    <td className="py-2 text-heading flex items-center gap-2">
                      {r.name}
                      <span title={TOOLTIPS[r.name] || ''} className="cursor-help text-body/50">ⓘ</span>
                    </td>
                    <td className="py-2 text-body">{r.value}</td>
                    <td className="py-2">
                      <span className={`inline-block px-2 py-0.5 rounded-full border text-xs ${pillClasses(r.status)}`}>
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 text-xs text-body/60 flex flex-wrap gap-x-4 gap-y-1">
            <span>Weather updated: {fmtTime(lastWeather)}</span>
            <span>Gauge updated: {fmtTime(lastGauge)}</span>
          </div>
        </div>
      )}
    </section>
  );
}

function fmtTime(d) {
  if (!d) return '—';
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}
