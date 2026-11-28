/**
 * Three-node mark ("nodes and edges"), the same glyph as favicon.svg, on the subject's
 * plum-to-lime gradient. It is not a handle on a curve; that stays the hub's mark.
 */
export function Logo({ size = 40 }: { size?: number }) {
  const s = size * 0.7;
  return (
    <div
      className="grid place-items-center rounded-[12px] shrink-0 dark:shadow-[0_6px_14px_-6px_var(--glow)]"
      style={{
        width: size,
        height: size,
        background: 'linear-gradient(145deg, #a3279a, #7fae1c)',
      }}
      aria-hidden="true"
    >
      <svg width={s} height={s} viewBox="10 10 44 44" fill="none">
        <path d="M20 44 L32 20 M32 20 L46 40 M20 44 L46 40" stroke="#ffffff" strokeWidth={3.2} strokeLinecap="round" />
        <g fill="#ffffff">
          <circle cx={20} cy={44} r={6} />
          <circle cx={32} cy={20} r={6} />
          <circle cx={46} cy={40} r={6} />
        </g>
      </svg>
    </div>
  );
}
