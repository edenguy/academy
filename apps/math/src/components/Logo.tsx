/** The ∫ mark — a drawn stroke glyph with two ball terminals (not a typed character), on the
 * same 64-grid path as public/favicon.svg so the app tile and the favicon are one geometry. */
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
        <path d="M40 14 c-3 0-5 2-5 6 v24 c0 4-2 6-5 6" stroke="#ffffff" strokeWidth={5} strokeLinecap="round" />
        <circle cx="41" cy="14" r="3.2" fill="#ffffff" />
        <circle cx="29" cy="50" r="3.2" fill="#ffffff" />
      </svg>
    </div>
  );
}
