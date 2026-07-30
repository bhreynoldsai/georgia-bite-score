function trendArrow(rate) {
  if (rate == null) return '—';
  if (rate > 1) return '↑';
  if (rate > 0.5) return '↗';
  if (rate < -1) return '↓';
  if (rate < -0.5) return '↘';
  return '→';
}

function trendLabel(rate) {
  if (rate == null) return 'Unknown';
  if (rate > 0.5) return 'Rising';
  if (rate < -0.5) return 'Falling';
  return 'Stable';
}

export default function ConditionsBar({ summary }) {
  const {
    airTemp, wind, windDir, clouds, waterTemp, baroRate, moonPhase, moonIllum,
  } = summary;

  const pill = (text, key) => (
    <span
      key={key}
      className="inline-flex items-center gap-1.5 bg-surface/80 border border-edge px-3 py-1.5 rounded-full text-sm text-heading whitespace-nowrap"
    >
      {text}
    </span>
  );

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {pill(<>🌡 <strong className="font-semibold">{fmt(airTemp, '°F')}</strong></>, 'air')}
      {pill(<>💨 <strong className="font-semibold">{fmt(wind, ' mph')}</strong>{windDir ? ` ${windDir}` : ''}</>, 'wind')}
      {pill(<>☁ <strong className="font-semibold">{fmt(clouds, '%')}</strong></>, 'cloud')}
      {pill(<>💧 <strong className="font-semibold">~{fmt(waterTemp, '°F')}</strong></>, 'water')}
      {pill(<><span aria-hidden>{trendArrow(baroRate)}</span> {trendLabel(baroRate)}</>, 'baro')}
      {pill(<>🌖 {moonPhase} {moonIllum != null ? `${moonIllum}%` : ''}</>, 'moon')}
    </div>
  );
}

function fmt(v, suffix = '') {
  if (v == null || Number.isNaN(v)) return '--';
  return `${Math.round(v)}${suffix}`;
}
