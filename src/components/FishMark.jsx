// Bass silhouette lifted straight from public/icon.svg (same geometry) so the
// header wordmark and the app icon read as the same fish. Fills with
// currentColor — set the color with a text-* class on the caller. Sized by
// height class (h-6, h-7, …); the width follows the aspect ratio.
export default function FishMark({ className = '' }) {
  return (
    <svg
      viewBox="104 176 276 154"
      fill="currentColor"
      className={`w-auto shrink-0 ${className}`}
      aria-hidden="true"
      focusable="false"
    >
      {/* body */}
      <ellipse cx="266" cy="266" rx="106" ry="56" />
      {/* forked tail */}
      <path d="M172 266 L112 222 L134 266 L112 310 Z" />
      {/* dorsal fin */}
      <path d="M240 214 q30 -34 74 -30 q-14 22 -22 38 z" />
      {/* eye, punched out in the page background */}
      <circle cx="330" cy="252" r="9" fill="#0b0b0d" />
    </svg>
  );
}
