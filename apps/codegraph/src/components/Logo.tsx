/** Flask mark, the same glyph as the hub tile, on the subject's amber-to-teal gradient. */
export function Logo({ size = 40 }: { size?: number }) {
  const s = size * 0.62;
  return (
    <div
      className="grid place-items-center rounded-[12px] shrink-0 dark:shadow-[0_6px_14px_-6px_var(--glow)]"
      style={{
        width: size,
        height: size,
        background: 'linear-gradient(145deg, #e0922a, #14998a)',
      }}
      aria-hidden="true"
    >
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <path
          d="M9 3h6M10 3v6l-5.5 9.5A2 2 0 0 0 6.2 21h11.6a2 2 0 0 0 1.7-3L14 9V3M7.5 15h9"
          stroke="#ffffff"
          strokeWidth={1.7}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
