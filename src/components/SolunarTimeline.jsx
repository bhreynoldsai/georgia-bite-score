import { useEffect, useRef, useState } from 'react';

const HOUR_WIDTH = 56;       // pixels per hour
const TOTAL_WIDTH = HOUR_WIDTH * 24;
const HEIGHT = 64;

function pctOfDay(date, dayStart) {
  return ((date - dayStart) / 86400000) * 100;
}

function xOf(date, dayStart) {
  return (pctOfDay(date, dayStart) / 100) * TOTAL_WIDTH;
}

export default function SolunarTimeline({ astronomy }) {
  const {
    sunrise, sunset, civilDawn, civilDusk,
    moonRise, moonSet, solunarPeriods,
  } = astronomy;

  const containerRef = useRef(null);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60 * 1000);
    return () => clearInterval(id);
  }, []);

  // Auto-scroll to center the NOW cursor on mount.
  useEffect(() => {
    if (!containerRef.current) return;
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const cursorX = xOf(now, dayStart);
    const container = containerRef.current;
    const scrollTo = Math.max(0, cursorX - container.clientWidth / 2);
    container.scrollTo({ left: scrollTo, behavior: 'auto' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const sunriseX = sunrise ? xOf(sunrise, dayStart) : null;
  const sunsetX = sunset ? xOf(sunset, dayStart) : null;
  const dawnX = civilDawn ? xOf(civilDawn, dayStart) : null;
  const duskX = civilDusk ? xOf(civilDusk, dayStart) : null;
  const moonRiseX = moonRise && sameDay(moonRise, dayStart) ? xOf(moonRise, dayStart) : null;
  const moonSetX = moonSet && sameDay(moonSet, dayStart) ? xOf(moonSet, dayStart) : null;
  const cursorX = xOf(now, dayStart);

  return (
    <section className="bg-surface border border-edge rounded-xl p-4">
      <header className="flex items-center justify-between mb-2">
        <h4 className="text-heading font-semibold text-sm tracking-wide uppercase">Solunar Timeline</h4>
        <div className="text-xs text-body/70 flex flex-wrap gap-x-3">
          <Legend swatch="#facc15" label="Daylight" />
          <Legend swatch="#cbd5e1" label="Moon up" />
          <Legend swatch="#16a34a" label="Major" />
          <Legend swatch="#86efac" label="Minor" />
        </div>
      </header>

      <div ref={containerRef} className="timeline-scroll overflow-x-auto">
        <div className="relative" style={{ width: TOTAL_WIDTH, height: HEIGHT + 22 }}>
          {/* Base bar */}
          <div
            className="absolute left-0 right-0 rounded-md bg-bg border border-edge"
            style={{ top: 0, height: HEIGHT }}
          />

          {/* Civil twilight bands (lighter gold) */}
          {dawnX !== null && sunriseX !== null && (
            <Band x={dawnX} w={sunriseX - dawnX} color="rgba(250,204,21,0.18)" top={4} h={HEIGHT - 8} />
          )}
          {sunsetX !== null && duskX !== null && (
            <Band x={sunsetX} w={duskX - sunsetX} color="rgba(250,204,21,0.18)" top={4} h={HEIGHT - 8} />
          )}

          {/* Daylight (brighter gold) */}
          {sunriseX !== null && sunsetX !== null && (
            <Band x={sunriseX} w={sunsetX - sunriseX} color="rgba(250,204,21,0.32)" top={4} h={HEIGHT - 8} />
          )}

          {/* Moon-up band (silver) */}
          {moonRiseX !== null && moonSetX !== null && moonSetX > moonRiseX && (
            <Band x={moonRiseX} w={moonSetX - moonRiseX} color="rgba(203,213,225,0.22)" top={26} h={20} />
          )}
          {moonRiseX !== null && moonSetX !== null && moonSetX < moonRiseX && (
            <>
              <Band x={0} w={moonSetX} color="rgba(203,213,225,0.22)" top={26} h={20} />
              <Band x={moonRiseX} w={TOTAL_WIDTH - moonRiseX} color="rgba(203,213,225,0.22)" top={26} h={20} />
            </>
          )}

          {/* Solunar periods */}
          {solunarPeriods.map((p, i) => {
            const x = Math.max(0, xOf(p.start, dayStart));
            const xEnd = Math.min(TOTAL_WIDTH, xOf(p.end, dayStart));
            const w = Math.max(2, xEnd - x);
            const color = p.type === 'major' ? 'rgba(22,163,74,0.85)' : 'rgba(134,239,172,0.65)';
            return (
              <div
                key={i}
                className="absolute rounded-md flex items-center justify-center text-[10px] font-semibold text-bg"
                style={{ left: x, top: 8, width: w, height: 18, background: color }}
              >
                {p.label}
              </div>
            );
          })}

          {/* Hour ticks */}
          {Array.from({ length: 25 }).map((_, h) => (
            <div
              key={h}
              className="absolute text-[10px] text-body/70 font-mono"
              style={{ left: h * HOUR_WIDTH - 6, top: HEIGHT + 4 }}
            >
              {h === 0 ? '12A' : h === 12 ? '12P' : h === 24 ? '12A' : h < 12 ? `${h}A` : `${h - 12}P`}
            </div>
          ))}

          {/* NOW cursor */}
          <div
            className="absolute pointer-events-none"
            style={{ left: cursorX - 1, top: -4, width: 2, height: HEIGHT + 10, background: '#ef4444', boxShadow: '0 0 10px rgba(239,68,68,0.6)' }}
          />
          <div
            className="absolute text-[10px] font-semibold text-rose-300"
            style={{ left: cursorX - 14, top: -16 }}
          >
            NOW
          </div>
        </div>
      </div>
    </section>
  );
}

function Band({ x, w, color, top, h }) {
  if (w <= 0) return null;
  return (
    <div
      className="absolute"
      style={{ left: x, width: w, top, height: h, background: color, borderRadius: 4 }}
    />
  );
}

function Legend({ swatch, label }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: swatch }} />
      {label}
    </span>
  );
}

function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
