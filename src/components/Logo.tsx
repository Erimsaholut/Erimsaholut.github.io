/** "EO" monogram: geometric E plus an amber ring. */
export default function Logo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <g fill="currentColor">
        <rect x="5" y="9" width="3" height="14" rx="1" />
        <rect x="5" y="9" width="9" height="3" rx="1" />
        <rect x="5" y="14.5" width="7" height="3" rx="1" />
        <rect x="5" y="20" width="9" height="3" rx="1" />
      </g>
      <circle cx="21.5" cy="16" r="5.5" fill="none" stroke="#FFB547" strokeWidth="3" />
    </svg>
  );
}
