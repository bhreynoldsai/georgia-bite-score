import { useState } from 'react';

// Circular photo of the guide, loaded from public/guide.jpg. Drop your photo
// at public/guide.jpg (square crop looks best) and it appears in the header
// and the explanation panel. Until then a rod-and-reel placeholder shows —
// or nothing at all when hideIfMissing is set.
const SRC = `${import.meta.env.BASE_URL}guide.jpg`;

export default function GuideAvatar({ size = 40, hideIfMissing = false, className = '' }) {
  const [missing, setMissing] = useState(false);

  if (missing && hideIfMissing) return null;

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full overflow-hidden border-2 border-accent/70 bg-surface shrink-0 shadow-[0_0_12px_rgba(186,12,47,0.25)] ${className}`}
      style={{ width: size, height: size }}
    >
      {missing ? (
        <span aria-hidden style={{ fontSize: size * 0.55 }}>🎣</span>
      ) : (
        <img
          src={SRC}
          alt="Your fishing guide"
          width={size}
          height={size}
          className="w-full h-full object-cover"
          onError={() => setMissing(true)}
        />
      )}
    </span>
  );
}
