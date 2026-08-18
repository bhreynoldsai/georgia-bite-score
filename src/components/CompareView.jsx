import { useMemo, useState } from 'react';
import { useAllLakesConditions } from '../hooks/useAllLakesConditions.js';

const SPECIES = [
  { key: 'largemouth', name: 'Largemouth Bass', icon: '🎣' },
  { key: 'crappie',    name: 'Crappie',         icon: '🐠' },
  { key: 'catfish',    name: 'Catfish',         icon: '🐟' },
];

// Ranks all 12 lakes by current bite score for a chosen species — the app's
// statewide differentiator, versus one lake at a time on the Today tab.
export default function CompareView({ zone, currentLakeId, onPickLake }) {
  const [species, setSpecies] = useState('largemouth');
  const { rows, loading, error, refresh } = useAllLakesConditions(zone);

  const sorted = useMemo(() => {
    if (!rows) return [];
    return rows
      .filter((r) => r.scores)
      .sort((a, b) => b.scores[species].score - a.scores[species].score);
  }, [rows, species]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex flex-wrap gap-2">
          {SPECIES.map((s) => {
            const selected = species === s.key;
            return (
              <button
                key={s.key}
                onClick={() => setSpecies(s.key)}
                aria-pressed={selected}
                className={[
                  'px-3 py-1.5 rounded-md text-sm font-medium border transition',
                  selected
                    ? 'bg-accent text-bg border-accent shadow-[0_0_18px_rgba(186,12,47,0.35)]'
                    : 'bg-surface text-body border-edge hover:border-accent/60',
                ].join(' ')}
              >
                {s.icon} {s.name}
              </button>
            );
          })}
        </div>
        <button onClick={refresh} className="text-xs text-body/60 hover:text-accent underline">
          Refresh
        </button>
      </div>

      {loading && !rows && <p className="text-body/60 text-sm">Scoring all 12 lakes…</p>}
      {error && rows && (
        <p className="text-amber-300 text-sm">Some lake data didn't load — showing what's available.</p>
      )}
      {error && !rows && (
        <p className="text-amber-300 text-sm">Couldn't reach the forecast service. Try refresh.</p>
      )}

      <ol className="flex flex-col gap-2">
        {sorted.map((row, i) => {
          const s = row.scores[species];
          return (
            <li key={row.lake.id}>
              <button
                onClick={() => onPickLake(row.lake.id)}
                className={[
                  'w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition',
                  row.lake.id === currentLakeId
                    ? 'border-accent/60 bg-accent/5'
                    : 'border-edge bg-surface hover:border-accent/40',
                ].join(' ')}
              >
                <span className="text-body/50 font-mono text-sm w-5 text-right shrink-0">{i + 1}</span>
                <span className="flex-1 min-w-0">
                  <span className="block text-heading font-semibold truncate">{row.lake.name}</span>
                  <span className="block text-xs text-body/60 truncate">{row.lake.dam}</span>
                </span>
                <span className="hidden sm:flex gap-1.5 shrink-0">
                  {SPECIES.filter((sp) => sp.key !== species).map((sp) => {
                    const sc = row.scores[sp.key];
                    return (
                      <span
                        key={sp.key}
                        title={`${sp.name}: ${sc.score}`}
                        className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                        style={{ background: `${sc.color}26`, color: sc.color, border: `1px solid ${sc.color}66` }}
                      >
                        {sp.icon} {sc.score}
                      </span>
                    );
                  })}
                </span>
                <span className="text-2xl font-display font-bold w-14 text-right shrink-0" style={{ color: s.color }}>
                  {s.score}
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      {rows && sorted.length === 0 && (
        <p className="text-body/60 text-sm">No lake data loaded — try refresh.</p>
      )}
    </div>
  );
}
