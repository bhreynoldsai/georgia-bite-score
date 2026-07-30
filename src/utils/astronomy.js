// Astronomy calculations parameterized by latitude/longitude so the same code
// serves any Georgia lake.
// Sunrise/sunset implements the NOAA solar algorithm; moon phase uses days since
// the New Moon on 2000-01-06 18:14 UTC.

const DEG = Math.PI / 180;

function toJulian(date) {
  return date.getTime() / 86400000 + 2440587.5;
}

function fromJulian(j) {
  return new Date((j - 2440587.5) * 86400000);
}

function toDays(date) {
  return toJulian(date) - 2451545.0;
}

// --- Sun ---
// Simplified NOAA algorithm. Returns Date for sunrise and sunset for the given
// local date and lat/lon. Accurate to within ~1 minute for our latitude.

function calcSolar(date, isSunrise, lat, lon) {
  // Day of year
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date - start;
  const N = Math.floor(diff / 86400000);

  const lngHour = lon / 15;
  const t = isSunrise
    ? N + (6 - lngHour) / 24
    : N + (18 - lngHour) / 24;

  const M = 0.9856 * t - 3.289;
  let L = M + 1.916 * Math.sin(M * DEG) + 0.020 * Math.sin(2 * M * DEG) + 282.634;
  L = ((L % 360) + 360) % 360;

  let RA = Math.atan(0.91764 * Math.tan(L * DEG)) / DEG;
  RA = ((RA % 360) + 360) % 360;

  const Lquadrant = Math.floor(L / 90) * 90;
  const RAquadrant = Math.floor(RA / 90) * 90;
  RA = RA + (Lquadrant - RAquadrant);
  RA = RA / 15;

  const sinDec = 0.39782 * Math.sin(L * DEG);
  const cosDec = Math.cos(Math.asin(sinDec));

  const zenith = 90.833; // official sunrise/sunset
  const cosH = (Math.cos(zenith * DEG) - sinDec * Math.sin(lat * DEG)) / (cosDec * Math.cos(lat * DEG));
  if (cosH > 1 || cosH < -1) return null;

  let H = isSunrise
    ? 360 - Math.acos(cosH) / DEG
    : Math.acos(cosH) / DEG;
  H = H / 15;

  const T = H + RA - 0.06571 * t - 6.622;
  let UT = T - lngHour;
  UT = ((UT % 24) + 24) % 24;

  const result = new Date(Date.UTC(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    Math.floor(UT),
    Math.floor((UT - Math.floor(UT)) * 60),
    Math.floor((((UT - Math.floor(UT)) * 60) % 1) * 60)
  ));
  return result;
}

export function sunTimes(date = new Date(), lat, lon) {
  const sunrise = calcSolar(date, true, lat, lon);
  const sunset = calcSolar(date, false, lat, lon);
  const civilDawn = sunrise ? new Date(sunrise.getTime() - 30 * 60000) : null;
  const civilDusk = sunset ? new Date(sunset.getTime() + 30 * 60000) : null;
  return { sunrise, sunset, civilDawn, civilDusk };
}

// --- Moon ---
// Synodic month length and reference new moon.
const SYNODIC = 29.530588853;
const REF_NEW_MOON = Date.UTC(2000, 0, 6, 18, 14, 0); // 2000-01-06 18:14 UTC

export function moonPhase(date = new Date()) {
  const daysSince = (date.getTime() - REF_NEW_MOON) / 86400000;
  const cycles = daysSince / SYNODIC;
  const fraction = cycles - Math.floor(cycles);
  const age = fraction * SYNODIC; // days into current cycle
  const illum = Math.round((1 - Math.cos(fraction * 2 * Math.PI)) * 50);

  let name;
  if (age < 1.84566) name = 'New Moon';
  else if (age < 5.53699) name = 'Waxing Crescent';
  else if (age < 9.22831) name = 'First Quarter';
  else if (age < 12.91963) name = 'Waxing Gibbous';
  else if (age < 16.61096) name = 'Full Moon';
  else if (age < 20.30228) name = 'Waning Gibbous';
  else if (age < 23.99361) name = 'Last Quarter';
  else if (age < 27.68493) name = 'Waning Crescent';
  else name = 'New Moon';

  return { name, age, illumination: illum, fraction };
}

// --- Moon rise / set / transit ---
// Approximate moon position via Schlyter's formulas, then search for rise/set
// by sampling altitude across the day. Sufficient accuracy for solunar windows.

function moonAltitude(date, lat, lon) {
  const d = toDays(date);

  // Orbital elements
  const N = (125.1228 - 0.0529538083 * d) * DEG;
  const i = 5.1454 * DEG;
  const w = ((318.0634 + 0.1643573223 * d) % 360) * DEG;
  const a = 60.2666;
  const e = 0.054900;
  const M = (((115.3654 + 13.0649929509 * d) % 360 + 360) % 360) * DEG;

  // Solve Kepler's equation
  let E = M + e * Math.sin(M) * (1 + e * Math.cos(M));
  for (let k = 0; k < 5; k++) {
    E = E - (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
  }

  const xv = a * (Math.cos(E) - e);
  const yv = a * (Math.sqrt(1 - e * e) * Math.sin(E));
  const v = Math.atan2(yv, xv);
  const r = Math.sqrt(xv * xv + yv * yv);

  // Geocentric position
  const xh = r * (Math.cos(N) * Math.cos(v + w) - Math.sin(N) * Math.sin(v + w) * Math.cos(i));
  const yh = r * (Math.sin(N) * Math.cos(v + w) + Math.cos(N) * Math.sin(v + w) * Math.cos(i));
  const zh = r * (Math.sin(v + w) * Math.sin(i));

  const lonEcl = Math.atan2(yh, xh);
  const latEcl = Math.atan2(zh, Math.sqrt(xh * xh + yh * yh));

  // Obliquity of the ecliptic
  const ecl = (23.4393 - 3.563e-7 * d) * DEG;

  // Equatorial coordinates
  const xeq = Math.cos(lonEcl) * Math.cos(latEcl);
  const yeq = Math.sin(lonEcl) * Math.cos(latEcl) * Math.cos(ecl) - Math.sin(latEcl) * Math.sin(ecl);
  const zeq = Math.sin(lonEcl) * Math.cos(latEcl) * Math.sin(ecl) + Math.sin(latEcl) * Math.cos(ecl);

  const ra = Math.atan2(yeq, xeq);
  const dec = Math.atan2(zeq, Math.sqrt(xeq * xeq + yeq * yeq));

  // Local sidereal time
  const utHours = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;
  const gmst = (18.697374558 + 24.06570982441908 * d) % 24;
  const lst = ((gmst * 15 + lon) % 360 + 360) % 360;

  const ha = (lst * DEG) - ra;

  const sinAlt = Math.sin(lat * DEG) * Math.sin(dec) + Math.cos(lat * DEG) * Math.cos(dec) * Math.cos(ha);
  return Math.asin(sinAlt) / DEG;
}

export function moonTimes(date = new Date(), lat, lon) {
  // Sample altitude every 10 minutes across the local day.
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
  const step = 10 * 60 * 1000;
  let prevAlt = moonAltitude(start, lat, lon);
  let rise = null;
  let set = null;
  let transit = null;
  let transitAlt = -Infinity;

  for (let m = 1; m <= 144; m++) {
    const t = new Date(start.getTime() + m * step);
    const alt = moonAltitude(t, lat, lon);

    if (prevAlt < 0 && alt >= 0 && !rise) {
      // Linear interpolation for zero crossing
      const frac = -prevAlt / (alt - prevAlt);
      rise = new Date(start.getTime() + (m - 1 + frac) * step);
    }
    if (prevAlt > 0 && alt <= 0 && !set) {
      const frac = prevAlt / (prevAlt - alt);
      set = new Date(start.getTime() + (m - 1 + frac) * step);
    }
    if (alt > transitAlt) {
      transitAlt = alt;
      transit = t;
    }
    prevAlt = alt;
  }

  // Lower transit (underfoot) = 12h offset from upper transit
  const underfoot = transit ? new Date(transit.getTime() + 12 * 3600 * 1000) : null;
  const wrappedUnderfoot = underfoot && underfoot.getDate() !== start.getDate()
    ? new Date(transit.getTime() - 12 * 3600 * 1000)
    : underfoot;

  return { rise, set, transit, underfoot: wrappedUnderfoot };
}
