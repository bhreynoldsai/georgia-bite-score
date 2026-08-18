import { useMemo, useState } from 'react';
import { LAKES, getLake } from '../lakes.js';
import { loadCatches, addCatch, deleteCatch } from '../utils/catchLog.js';

const SPECIES = [
  { key: 'largemouth', name: 'Largemouth Bass', icon: '🎣', color: '#16a34a' },
  { key: 'crappie',    name: 'Crappie',         icon: '🐠', color: '#9333ea' },
  { key: 'catfish',    name: 'Catfish',         icon: '🐟', color: '#d97706' },
];

function nowLocalInput() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Personal catch history, stored on-device. Adding real user-generated data
// (and stats built from it) is what makes the app a tool, not just a viewer.
export default function CatchLogView({ currentLakeId, currentZone, currentScores, currentWaterTemp }) {
  const [catches, setCatches] = useState(loadCatches);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    species: 'largemouth',
    lakeId: currentLakeId,
    caughtAt: nowLocalInput(),
    lengthIn: '',
    weightLb: '',
    lure: '',
    notes: '',
  });

  const stats = useMemo(() => {
    const bySpecies = {};
    for (const c of catches) {
      const best = bySpecies[c.species];
      const weight = parseFloat(c.weightLb);
      const length = parseFloat(c.lengthIn);
      const size = !Number.isNaN(weight) ? weight : (!Number.isNaN(length) ? length : 0);
      if (!best || size > best.size) bySpecies[c.species] = { size, weight: c.weightLb, length: c.lengthIn };
    }
    return { total: catches.length, bySpecies };
  }, [catches]);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function submit(e) {
    e.preventDefault();
    const snapshot = form.lakeId === currentLakeId && currentScores?.[form.species]
      ? {
          score: currentScores[form.species].score,
          label: currentScores[form.species].label,
          zone: currentZone,
          waterTemp: currentWaterTemp,
        }
      : null;

    const next = addCatch({
      species: form.species,
      lakeId: form.lakeId,
      caughtAt: new Date(form.caughtAt).toISOString(),
      lengthIn: form.lengthIn || null,
      weightLb: form.weightLb || null,
      lure: form.lure.trim() || null,
      notes: form.notes.trim() || null,
      snapshot,
    });
    setCatches(next);
    setForm((f) => ({ ...f, lengthIn: '', weightLb: '', lure: '', notes: '', caughtAt: nowLocalInput() }));
    setOpen(false);
  }

  function remove(id) {
    if (!window.confirm('Delete this catch?')) return;
    setCatches(deleteCatch(id));
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex flex-wrap gap-3 text-sm text-body/80">
          <span><strong className="text-heading">{stats.total}</strong> catches logged</span>
          {SPECIES.filter((s) => stats.bySpecies[s.key]).map((s) => {
            const b = stats.bySpecies[s.key];
            return (
              <span key={s.key}>
                {s.icon} PB: {b.weight ? `${b.weight} lb` : b.length ? `${b.length} in` : '—'}
              </span>
            );
          })}
        </div>
        <button
          onClick={() => setOpen((o) => !o)}
          className="text-sm font-semibold text-accent border border-accent/50 hover:bg-accent/10 px-3 py-1.5 rounded-md transition"
        >
          {open ? 'Cancel' : '+ Log a catch'}
        </button>
      </div>

      {open && (
        <form onSubmit={submit} className="bg-surface border border-edge rounded-xl p-4 flex flex-col gap-3">
          <div className="flex gap-2 flex-wrap">
            {SPECIES.map((s) => {
              const selected = form.species === s.key;
              return (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => update('species', s.key)}
                  aria-pressed={selected}
                  className={[
                    'px-3 py-1.5 rounded-md text-sm font-medium border transition',
                    selected ? 'text-bg border-transparent' : 'bg-bg/40 text-body border-edge hover:border-accent/60',
                  ].join(' ')}
                  style={selected ? { background: s.color } : undefined}
                >
                  {s.icon} {s.name}
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <label className="flex flex-col gap-1 text-xs text-body/70 col-span-2 sm:col-span-1">
              Lake
              <select
                value={form.lakeId}
                onChange={(e) => update('lakeId', e.target.value)}
                className="rounded-md bg-bg/40 text-heading border border-edge px-2 py-1.5 text-sm"
              >
                {LAKES.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs text-body/70 col-span-2 sm:col-span-1">
              Date &amp; time
              <input
                type="datetime-local"
                value={form.caughtAt}
                onChange={(e) => update('caughtAt', e.target.value)}
                className="rounded-md bg-bg/40 text-heading border border-edge px-2 py-1.5 text-sm"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-body/70">
              Length (in)
              <input
                type="number" step="0.1" min="0" inputMode="decimal"
                value={form.lengthIn}
                onChange={(e) => update('lengthIn', e.target.value)}
                className="rounded-md bg-bg/40 text-heading border border-edge px-2 py-1.5 text-sm"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-body/70">
              Weight (lb)
              <input
                type="number" step="0.1" min="0" inputMode="decimal"
                value={form.weightLb}
                onChange={(e) => update('weightLb', e.target.value)}
                className="rounded-md bg-bg/40 text-heading border border-edge px-2 py-1.5 text-sm"
              />
            </label>
          </div>

          <label className="flex flex-col gap-1 text-xs text-body/70">
            Lure / bait
            <input
              type="text"
              value={form.lure}
              onChange={(e) => update('lure', e.target.value)}
              placeholder="e.g. chartreuse jig"
              className="rounded-md bg-bg/40 text-heading border border-edge px-2 py-1.5 text-sm"
            />
          </label>

          <label className="flex flex-col gap-1 text-xs text-body/70">
            Notes
            <textarea
              value={form.notes}
              onChange={(e) => update('notes', e.target.value)}
              rows={2}
              className="rounded-md bg-bg/40 text-heading border border-edge px-2 py-1.5 text-sm resize-none"
            />
          </label>

          {form.lakeId === currentLakeId && currentScores?.[form.species] && (
            <p className="text-xs text-body/60">
              Will snapshot today's {currentScores[form.species].label.toLowerCase()} bite score ({currentScores[form.species].score}) with this catch.
            </p>
          )}

          <button
            type="submit"
            className="self-start bg-accent text-bg font-semibold px-4 py-2 rounded-md text-sm hover:brightness-110 transition"
          >
            Save catch
          </button>
        </form>
      )}

      {catches.length === 0 && !open && (
        <p className="text-body/60 text-sm">No catches logged yet — tap "Log a catch" after your next trip.</p>
      )}

      <ul className="flex flex-col gap-2">
        {catches.map((c) => {
          const meta = SPECIES.find((s) => s.key === c.species);
          const lake = getLake(c.lakeId);
          const date = new Date(c.caughtAt);
          return (
            <li key={c.id} className="bg-surface border border-edge rounded-xl p-3 flex items-start gap-3">
              <span className="text-2xl" aria-hidden>{meta?.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-heading font-semibold">{meta?.name}</span>
                  {c.snapshot && (
                    <span
                      className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                      style={{ background: `${scoreColor(c.snapshot.score)}26`, color: scoreColor(c.snapshot.score), border: `1px solid ${scoreColor(c.snapshot.score)}66` }}
                      title="Bite score at time of logging"
                    >
                      score {c.snapshot.score}
                    </span>
                  )}
                </div>
                <div className="text-xs text-body/70">
                  {lake.name} · {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at {date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                </div>
                <div className="text-xs text-body/70 mt-0.5">
                  {[
                    c.lengthIn ? `${c.lengthIn} in` : null,
                    c.weightLb ? `${c.weightLb} lb` : null,
                    c.lure,
                  ].filter(Boolean).join(' · ') || <span className="text-body/40">No size or lure recorded</span>}
                </div>
                {c.notes && <div className="text-xs text-body/60 italic mt-1">{c.notes}</div>}
              </div>
              <button
                onClick={() => remove(c.id)}
                aria-label="Delete catch"
                className="text-body/40 hover:text-accent text-sm shrink-0"
              >
                ✕
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function scoreColor(score) {
  if (score >= 76) return '#22c55e';
  if (score >= 56) return '#3b82f6';
  if (score >= 31) return '#f59e0b';
  return '#ef4444';
}
