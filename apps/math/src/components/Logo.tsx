/** A simple ∫-mark badge, standing in for a full illustrated logo. */
export function Logo({ size = 36 }: { size?: number }) {
  return (
    <div
      className="grid place-items-center rounded-2xl shrink-0"
      style={{
        width: size,
        height: size,
        background: 'linear-gradient(145deg, var(--accent), var(--accent-2))',
        color: 'white',
        fontFamily: 'var(--font-display)',
        fontWeight: 700,
        fontSize: size * 0.56,
        boxShadow: '0 6px 16px -6px var(--glow)',
      }}
      aria-hidden="true"
    >
      ∫
    </div>
  );
}
