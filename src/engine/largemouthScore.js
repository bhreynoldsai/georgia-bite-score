// Largemouth Bass scoring — weights total 100 with spawn and zone modifiers.
// Eufaula is a shallow, grassy, ledge-driven reservoir; largemouth tolerate
// warmer water than Lanier's spots but shut down in extreme heat.

export function scoreLargemouth(c) {
  const factors = [];
  let total = 0;

  // Water temp (20 pts)
  const wt = c.waterTemp;
  let waterPts;
  if (wt >= 62 && wt <= 75) waterPts = 20;
  else if (wt >= 55 && wt < 62) waterPts = 14;
  else if (wt > 75 && wt <= 82) waterPts = 10;
  else if (wt > 82) waterPts = 4;
  else waterPts = 5; // < 55
  factors.push({ name: 'Water Temp', pts: waterPts, max: 20, pill: pillFor(waterPts, 20) });
  total += waterPts;

  // Barometric pressure (18 pts)
  let baroPts;
  if (c.baroTrend === 'stable') baroPts = 18;
  else if (c.baroTrend === 'rising') baroPts = 14;
  else if (c.baroTrend === 'falling' && c.baroRate < -1) baroPts = 4;
  else baroPts = 10; // falling normal — pre-front can be good on Eufaula
  factors.push({ name: 'Baro Trend', pts: baroPts, max: 18, pill: pillFor(baroPts, 18) });
  total += baroPts;

  // Time of day (18 pts)
  let todPts;
  if (c.isDawnWindow) todPts = 18;
  else if (c.isDuskWindow) todPts = 16;
  else if (c.isNight) todPts = 8;
  else todPts = 6;
  factors.push({ name: 'Time of Day', pts: todPts, max: 18, pill: pillFor(todPts, 18) });
  total += todPts;

  // Solunar (12 pts)
  let solPts;
  if (c.solunar === 'major') solPts = 12;
  else if (c.solunar === 'minor') solPts = 7;
  else solPts = 0;
  factors.push({ name: 'Solunar', pts: solPts, max: 12, pill: pillFor(solPts, 12) });
  total += solPts;

  // Cloud cover (12 pts)
  let cloudPts;
  if (c.clouds > 75) cloudPts = 12;
  else if (c.clouds >= 30) cloudPts = 9;
  else cloudPts = 5;
  factors.push({ name: 'Cloud Cover', pts: cloudPts, max: 12, pill: pillFor(cloudPts, 12) });
  total += cloudPts;

  // Wind (10 pts)
  const w = c.wind;
  let windPts;
  if (w >= 5 && w <= 12) windPts = 10;
  else if (w > 12 && w <= 18) windPts = 7;
  else if (w < 5) windPts = 6;
  else windPts = 3; // > 18 — big open flats get rough fast
  factors.push({ name: 'Wind', pts: windPts, max: 10, pill: pillFor(windPts, 10) });
  total += windPts;

  // Moon phase (10 pts)
  let moonPts;
  if (c.moonPhase === 'Full Moon' || c.moonPhase === 'New Moon') moonPts = 10;
  else if (c.moonPhase === 'First Quarter' || c.moonPhase === 'Last Quarter') moonPts = 6;
  else moonPts = 4;
  factors.push({ name: 'Moon Phase', pts: moonPts, max: 10, pill: pillFor(moonPts, 10) });
  total += moonPts;

  // Spawn modifier: Eufaula largemouth spawn earlier than lakes further north —
  // 62–68°F in March or April puts fish on beds in the pockets.
  let modifier = 0;
  if (wt >= 62 && wt <= 68 && (c.month === 2 || c.month === 3)) {
    modifier += 8;
    factors.push({ name: 'Spawn window', pts: 8, max: 8, pill: 'Favorable' });
  }

  // Zone modifier: a flood-stage river blows out the upper riverine end first.
  if (c.zone === 'upper' && c.inflowClass === 'Flood/Turbid') {
    modifier -= 10;
    factors.push({ name: 'Upper-river blowout', pts: -10, max: 0, pill: 'Unfavorable' });
  }

  const score = clamp(total + modifier);
  return finalize(score, factors, verdictLargemouth(score, c));
}

function verdictLargemouth(score, c) {
  if (score >= 76) return 'Largemouth are eating — grass lines, ledges, and creek mouths all in play.';
  if (score >= 56) return 'Solid bite — work the ledge drops and shoreline grass edges methodically.';
  if (score >= 31) return 'Selective bite — slow down on offshore structure or flip the thickest cover.';
  return 'Tough day — soak a jig on deep ledges and expect a grind between bites.';
}

function pillFor(pts, max) {
  if (max === 0) return 'Unfavorable';
  const r = pts / max;
  if (r >= 0.66) return 'Favorable';
  if (r >= 0.34) return 'Neutral';
  return 'Unfavorable';
}

function clamp(n) { return Math.max(0, Math.min(100, Math.round(n))); }

function finalize(score, factors, verdict) {
  let label, color;
  if (score >= 76) { label = 'Excellent'; color = '#22c55e'; }
  else if (score >= 56) { label = 'Good'; color = '#3b82f6'; }
  else if (score >= 31) { label = 'Fair'; color = '#f59e0b'; }
  else { label = 'Tough'; color = '#ef4444'; }
  return { score, label, color, verdict, factors };
}
