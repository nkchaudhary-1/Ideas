/** The Collage Studio mark: one tall photo beside two stacked ones, the middle tile in the accent colour. Takes its colour from the text colour. */
export default function Logo({ size = 20, className = "" }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} aria-hidden="true" focusable="false">
      <rect x="2" y="2" width="9.5" height="20" rx="3" fill="currentColor" />
      <rect x="13.5" y="2" width="8.5" height="9" rx="3" fill="rgb(var(--accent))" />
      <rect x="13.5" y="13" width="8.5" height="9" rx="3" fill="currentColor" opacity="0.55" />
    </svg>
  );
}
