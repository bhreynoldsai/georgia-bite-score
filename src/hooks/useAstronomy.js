import { useMemo, useState, useEffect } from 'react';
import { sunTimes, moonPhase, moonTimes } from '../utils/astronomy.js';
import { solunarPeriods } from '../utils/solunar.js';

export function useAstronomy(lat, lon) {
  // Re-compute when the calendar date rolls over.
  const [today, setToday] = useState(() => startOfDay(new Date()));

  useEffect(() => {
    const tick = () => {
      const d = startOfDay(new Date());
      if (d.getTime() !== today.getTime()) setToday(d);
    };
    // Check every 5 minutes.
    const id = setInterval(tick, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [today]);

  return useMemo(() => {
    const { sunrise, sunset, civilDawn, civilDusk } = sunTimes(today, lat, lon);
    const moon = moonPhase(today);
    const mtimes = moonTimes(today, lat, lon);
    const periods = solunarPeriods(today, lat, lon);
    return {
      date: today,
      sunrise,
      sunset,
      civilDawn,
      civilDusk,
      moonPhase: moon.name,
      moonIllumination: moon.illumination,
      moonRise: mtimes.rise,
      moonSet: mtimes.set,
      moonTransit: mtimes.transit,
      moonUnderfoot: mtimes.underfoot,
      solunarPeriods: periods,
    };
  }, [today, lat, lon]);
}

function startOfDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
