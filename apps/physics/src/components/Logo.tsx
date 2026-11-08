/** A thrown-ball trajectory mark — a monoline arc with a dot riding it. */
export function Logo({ size = 36 }: { size?: number }) {
  return (
    <div
      className="grid place-items-center rounded-2xl shrink-0"
      style={{
        width: size,
        height: size,
        background: 'linear-gradient(145deg, var(--accent), var(--accent-2))',
        boxShadow: '0 6px 16px -6px var(--glow)',
      }}
      aria-hidden="true"
    >
      <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 24 24" fill="none">
        <path d="M3 18 Q 12 2 21 18" stroke="#ffffff" strokeWidth={2.2} strokeLinecap="round" />
        <circle cx="12" cy="9.5" r="2" fill="#ffffff" />
      </svg>
    </div>
  );
}
