import { LAKES } from '../lakes.js';

// Dropdown for choosing which Georgia reservoir to score. Kept as a native
// <select> so it works well on phones (a boat-deck primary use case).
export default function LakeSelector({ value, onChange }) {
  return (
    <label className="flex items-center gap-2">
      <span className="sr-only">Choose a lake</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Choose a lake"
        className="rounded-md bg-surface text-heading border border-edge px-3 py-1.5 text-sm font-medium
                   hover:border-accent/60 focus:outline-none focus:border-accent cursor-pointer"
      >
        {LAKES.map((lake) => (
          <option key={lake.id} value={lake.id}>
            {lake.name}
          </option>
        ))}
      </select>
    </label>
  );
}
