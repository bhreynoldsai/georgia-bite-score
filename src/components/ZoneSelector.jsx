// Generic three-zone model used when a lake doesn't define its own zones.
// Every Georgia reservoir has a riverine upper end, a main-lake middle, and a
// deeper lower/dam section, so these defaults are meaningful everywhere.
export const DEFAULT_ZONES = [
  { id: 'upper', label: 'Upper Lake', hint: 'Riverine upper end — current seams, stump flats, and backwater sloughs.' },
  { id: 'mid',   label: 'Mid-Lake',   hint: 'Main-lake creek arms — ledges, grass lines, points, and creek mouths.' },
  { id: 'deep',  label: 'Lower / Dam', hint: 'The dam pool — the deepest, clearest water with rocky banks and bluffs.' },
];

export default function ZoneSelector({ value, onChange, zones = DEFAULT_ZONES }) {
  return (
    <div className="flex flex-wrap gap-2">
      {zones.map(z => {
        const selected = value === z.id;
        return (
          <button
            key={z.id}
            onClick={() => onChange(z.id)}
            title={z.hint}
            aria-pressed={selected}
            className={[
              'px-3 py-1.5 rounded-md text-sm font-medium border transition',
              selected
                ? 'bg-accent text-bg border-accent shadow-[0_0_18px_rgba(186,12,47,0.35)]'
                : 'bg-surface text-body border-edge hover:border-accent/60',
            ].join(' ')}
          >
            {z.label}
          </button>
        );
      })}
    </div>
  );
}
