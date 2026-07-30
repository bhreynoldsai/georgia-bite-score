import { useEffect, useRef, useState } from 'react';

const SPECIES_META = {
  largemouth: { name: 'Largemouth Bass', icon: '🎣', primary: '#16a34a', dark: '#14532d' },
  crappie:    { name: 'Crappie',         icon: '🐠', primary: '#9333ea', dark: '#581c87' },
  catfish:    { name: 'Catfish',         icon: '🐟', primary: '#d97706', dark: '#78350f' },
};

export default function SpeciesCard({ species, scoreData, onExplain, delay = 0 }) {
  const meta = SPECIES_META[species];
  const score = scoreData?.score ?? 0;
  const color = scoreData?.color || '#3b82f6';
  const label = scoreData?.label || 'Loading';
  const verdict = scoreData?.verdict || 'Conditions loading…';
  const factors = scoreData?.factors || [];

  // Animate ring stroke-dashoffset.
  const [displayedScore, setDisplayedScore] = useState(0);
  const rafRef = useRef(null);

  useEffect(() => {
    const startVal = displayedScore;
    const startTime = performance.now();
    const duration = 1200;
    cancelAnimationFrame(rafRef.current);
    const tick = (now) => {
      const t = Math.min(1, (now - startTime) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const v = Math.round(startVal + (score - startVal) * eased);
      setDisplayedScore(v);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [score]);

  const RADIUS = 64;
  const CIRC = 2 * Math.PI * RADIUS;
  const dashOffset = CIRC * (1 - displayedScore / 100);

  const pulse = label === 'Excellent' ? 'animate-glowPulse' : '';

  return (
    <article
      className={`relative bg-surface border border-edge rounded-2xl p-5 opacity-0 animate-fadeIn ${pulse}`}
      // Both animate-* utilities set the `animation` shorthand, so whichever
      // wins in the cascade cancels the other — compose them inline instead.
      style={{ animation: `fadeIn 400ms ease-out ${delay}ms both${pulse ? ', glowPulse 2s ease-in-out infinite' : ''}` }}
      aria-label={`Bite score: ${score} out of 100, ${label}`}
    >
      <header className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span aria-hidden className="text-2xl">{meta.icon}</span>
          <h3 className="font-display text-xl font-semibold text-heading tracking-wide uppercase">
            {meta.name}
          </h3>
        </div>
        <span
          className="text-xs px-2 py-0.5 rounded-full font-semibold"
          style={{ background: `${color}26`, color, border: `1px solid ${color}66` }}
        >
          {label}
        </span>
      </header>

      <div className="flex items-center gap-5">
        <svg width="160" height="160" viewBox="0 0 160 160" role="img" aria-hidden>
          <circle cx="80" cy="80" r={RADIUS} stroke={meta.dark} strokeWidth="12" fill="none" />
          <circle
            cx="80" cy="80" r={RADIUS}
            stroke={color} strokeWidth="12" fill="none" strokeLinecap="round"
            strokeDasharray={CIRC}
            strokeDashoffset={dashOffset}
            transform="rotate(-90 80 80)"
            style={{ transition: 'stroke 300ms ease' }}
          />
          <text
            x="80" y="86" textAnchor="middle"
            className="font-display"
            style={{ fontFamily: 'Oswald, sans-serif', fontSize: '44px', fontWeight: 700, fill: '#e2eaf7' }}
          >
            {displayedScore}
          </text>
          <text
            x="80" y="108" textAnchor="middle"
            style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', fill: '#94afd4', letterSpacing: '0.18em' }}
          >
            BITE SCORE
          </text>
        </svg>

        <div className="flex-1 min-w-0">
          <p className="italic text-body text-sm leading-snug">{verdict}</p>
          <button
            onClick={onExplain}
            className="mt-3 text-sm font-semibold text-accent border border-accent/50 hover:bg-accent/10 px-3 py-1.5 rounded-md transition"
          >
            Ask the guide →
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-1.5">
        {factors.map((f, i) => (
          <FactorBar key={i} factor={f} color={meta.primary} />
        ))}
      </div>
    </article>
  );
}

function FactorBar({ factor, color }) {
  const max = Math.max(1, factor.max);
  const pct = Math.max(0, Math.min(100, (factor.pts / max) * 100));
  const negative = factor.pts < 0;
  const barColor = negative ? '#ef4444' : color;
  return (
    <div className="text-xs">
      <div className="flex justify-between text-body/80">
        <span className="truncate pr-1">{factor.name}</span>
        <span className="font-mono text-heading">
          {factor.pts}{factor.max > 0 ? `/${factor.max}` : ''}
        </span>
      </div>
      <div className="h-1.5 bg-edge/60 rounded-full overflow-hidden mt-0.5">
        <div
          className="h-full rounded-full transition-[width] duration-700"
          style={{ width: `${negative ? 100 : pct}%`, background: barColor }}
        />
      </div>
    </div>
  );
}
