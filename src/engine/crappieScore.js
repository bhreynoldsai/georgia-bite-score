// Crappie scoring — season-driven with a spawn-window bonus.
// Eufaula's crappie run earlier than lakes further north: the spawn push
// starts in February and peaks March–April.

export function scoreCrappie(c) {
  const factors = [];
  let total = 0;

  // Water temp (22 pts)
  const wt = c.waterTemp;
  let waterPts;
  if (wt >= 58 && wt <= 70) waterPts = 22;
  else if (wt >= 50 && wt < 58) waterPts = 14;
  else if (wt > 70 && wt <= 76) waterPts = 12;
  else if (wt > 76) waterPts = 6;
  else waterPts = 4;
  factors.push({ name: 'Water Temp', pts: waterPts, max: 22, pill: pillFor(waterPts, 22) });
  total += waterPts;

  // Barometric pressure (15 pts)
  let baroPts;
  if (c.baroTrend === 'stable') baroPts = 15;
  else if (c.baroTrend === 'rising') baroPts = 12;
  else if (c.baroTrend === 'falling' && c.baroRate < -1) baroPts = 2;
  else baroPts = 6;
  factors.push({ name: 'Baro Trend', pts: baroPts, max: 15, pill: pillFor(baroPts, 15) });
  total += baroPts;

  // Season (18 pts) — month is 0-indexed. Spawn push runs Feb–Apr on Eufaula.
  const m = c.month;
  let seasonPts;
  if (m >= 1 && m <= 3) seasonPts = 18;             // Feb–Apr
  else if (m === 9 || m === 10) seasonPts = 14;      // Oct–Nov
  else if (m === 11 || m === 0) seasonPts = 10;      // Dec–Jan
  else seasonPts = 7;                                // May–Sep
  factors.push({ name: 'Season', pts: seasonPts, max: 18, pill: pillFor(seasonPts, 18) });
  total += seasonPts;

  // Time of day (15 pts)
  let todPts;
  if (c.isDawnWindow) todPts = 15;
  else if (c.isDuskWindow) todPts = 12;
  else if (c.isNight) todPts = 8;
  else todPts = 5;
  factors.push({ name: 'Time of Day', pts: todPts, max: 15, pill: pillFor(todPts, 15) });
  total += todPts;

  // Solunar (12 pts)
  let solPts;
  if (c.solunar === 'major') solPts = 12;
  else if (c.solunar === 'minor') solPts = 8;
  else solPts = 0;
  factors.push({ name: 'Solunar', pts: solPts, max: 12, pill: pillFor(solPts, 12) });
  total += solPts;

  // Moon phase (10 pts)
  let moonPts;
  if (c.moonPhase === 'Full Moon') moonPts = 10;
  else if (c.moonPhase === 'New Moon') moonPts = 8;
  else if (c.moonPhase === 'First Quarter' || c.moonPhase === 'Last Quarter') moonPts = 5;
  else moonPts = 3;
  factors.push({ name: 'Moon Phase', pts: moonPts, max: 10, pill: pillFor(moonPts, 10) });
  total += moonPts;

  // Cloud cover (8 pts)
  let cloudPts;
  if (c.clouds > 75) cloudPts = 8;
  else if (c.clouds >= 30) cloudPts = 6;
  else cloudPts = 3;
  factors.push({ name: 'Cloud Cover', pts: cloudPts, max: 8, pill: pillFor(cloudPts, 8) });
  total += cloudPts;

  // Spawn modifier: 58–64°F in Feb–Apr — fish flood the creek-arm shallows.
  let modifier = 0;
  if (wt >= 58 && wt <= 64 && m >= 1 && m <= 3) {
    modifier = 10;
    factors.push({ name: 'Spawn window', pts: 10, max: 10, pill: 'Favorable' });
  }

  const score = clamp(total + modifier);
  return finalize(score, factors, verdictCrappie(score, c));
}

function verdictCrappie(score, c) {
  if (score >= 76) return 'Crappie stacked and feeding — creek-arm brush and standing timber are loaded.';
  if (score >= 56) return 'Steady bite — jigs and minnows over brush piles at the right depth.';
  if (score >= 31) return 'Slow pick — downsize jigs and probe deeper timber with electronics.';
  return 'Tough — pick the deepest brush you know, use a slow lift, and expect light bites.';
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
