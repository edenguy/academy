/** A thrown-ball trajectory mark — same arc-with-dot geometry as public/favicon.svg, on the
 * same 64-grid, so the app tile and the favicon never drift apart. */
export function Logo({ size = 40 }: { size?: number }) {
  const s = size * 0.62;
  return (
    <div
      className="grid place-items-center rounded-[12px] shrink-0 dark:shadow-[0_6px_14px_-6px_var(--glow)]"
      style={{
        width: size,
        height: size,
        background: 'linear-gradient(145deg, var(--accent), var(--accent-2))',
      }}
      aria-hidden="true"
    >
      <svg width={s} height={s} viewBox="0 0 64 64" fill="none">
        <path d="M14 50 Q 32 10 50 50" stroke="#ffffff" strokeWidth={4.5} strokeLinecap="round" />
        <circle cx="32" cy="30" r="4.5" fill="#ffffff" />
      </svg>
    </div>
  );
}
