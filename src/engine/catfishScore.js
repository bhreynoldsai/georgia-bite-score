// Catfish (channel/blue) scoring — inverted from the bass models in key ways:
// warm water, night hours, current, and turbidity all HELP the catfish bite.

export function scoreCatfish(c) {
  const factors = [];
  let total = 0;

  // Water temp (20 pts) — cats feed hardest in warm water
  const wt = c.waterTemp;
  let waterPts;
  if (wt > 75) waterPts = 20;
  else if (wt >= 68) waterPts = 16;
  else if (wt >= 60) waterPts = 10;
  else if (wt >= 50) waterPts = 6;
  else waterPts = 3;
  factors.push({ name: 'Water Temp', pts: waterPts, max: 20, pill: pillFor(waterPts, 20) });
  total += waterPts;

  // Time of day (18 pts) — strong night bias
  let todPts;
  if (c.isNight) todPts = 18;
  else if (c.isDuskWindow) todPts = 15;
  else if (c.isDawnWindow) todPts = 12;
  else todPts = 6;
  factors.push({ name: 'Time of Day', pts: todPts, max: 18, pill: pillFor(todPts, 18) });
  total += todPts;

  // Inflow / current (15 pts) — dam generation and muddy inflow turn cats on
  let inflowPts;
  switch (c.inflowClass) {
    case 'High': inflowPts = 15; break;
    case 'Flood/Turbid': inflowPts = 12; break;
    case 'Normal': inflowPts = 9; break;
    case 'Very Low': inflowPts = 4; break;
    default: inflowPts = 9;
  }
  factors.push({ name: 'Inflow/Current', pts: inflowPts, max: 15, pill: pillFor(inflowPts, 15) });
  total += inflowPts;

  // Season (12 pts) — month is 0-indexed
  const m = c.month;
  let seasonPts;
  if (m >= 5 && m <= 8) seasonPts = 12;              // Jun–Sep
  else if (m === 4 || m === 9) seasonPts = 9;        // May, Oct
  else if (m === 2 || m === 3 || m === 10) seasonPts = 6; // Mar–Apr, Nov
  else seasonPts = 3;                                // Dec–Feb
  factors.push({ name: 'Season', pts: seasonPts, max: 12, pill: pillFor(seasonPts, 12) });
  total += seasonPts;

  // Barometric pressure (12 pts) — pre-front falling pressure is prime
  let baroPts;
  if (c.baroTrend === 'falling' && c.baroRate >= -1) baroPts = 12;
  else if (c.baroTrend === 'stable') baroPts = 9;
  else if (c.baroTrend === 'falling') baroPts = 8; // falling fast
  else baroPts = 5; // rising / post-front
  factors.push({ name: 'Baro Trend', pts: baroPts, max: 12, pill: pillFor(baroPts, 12) });
  total += baroPts;

  // Solunar (12 pts)
  let solPts;
  if (c.solunar === 'major') solPts = 12;
  else if (c.solunar === 'minor') solPts = 7;
  else solPts = 0;
  factors.push({ name: 'Solunar', pts: solPts, max: 12, pill: pillFor(solPts, 12) });
  total += solPts;

  // Moon phase (6 pts)
  let moonPts;
  if (c.moonPhase === 'Full Moon') moonPts = 6;
  else if (c.moonPhase === 'New Moon') moonPts = 5;
  else if (c.moonPhase === 'First Quarter' || c.moonPhase === 'Last Quarter') moonPts = 3;
  else moonPts = 2;
  factors.push({ name: 'Moon Phase', pts: moonPts, max: 6, pill: pillFor(moonPts, 6) });
  total += moonPts;

  // Wind (5 pts) — matters less for anchored bait fishing
  let windPts = c.wind <= 15 ? 5 : 2;
  factors.push({ name: 'Wind', pts: windPts, max: 5, pill: pillFor(windPts, 5) });
  total += windPts;

  // Summer night modifier: hot-month nights are the classic Eufaula cat bite.
  let modifier = 0;
  if (c.isNight && m >= 5 && m <= 7) {
    modifier = 5;
    factors.push({ name: 'Summer night bonus', pts: 5, max: 5, pill: 'Favorable' });
  }

  const score = clamp(total + modifier);
  return finalize(score, factors, verdictCatfish(score, c));
}

function verdictCatfish(score, c) {
  if (score >= 76) return 'Cats are prowling — fresh cut bait on channel edges and flats will get run over.';
  if (score >= 56) return 'Good bite — anchor on a channel swing or creek mouth and let the scent work.';
  if (score >= 31) return 'Fair — fish deeper holes with fresh bait and give each spot longer soaks.';
  return 'Slow going — tight-line the deepest river-channel bends and be patient.';
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
