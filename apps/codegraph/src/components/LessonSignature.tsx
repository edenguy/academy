import type { CSSProperties } from 'react';
import { motion, useReducedMotion } from 'motion/react';

/**
 * The lesson card's "doorway" signature (§5.3) and the quiz's finished-state trophy
 * replacement (§5.7 #7): a tiny SVG drawn from the lesson's own first explorer — the real
 * function, the real rectangles — never an invented decoration. Identical renderer in
 * apps/math and apps/physics; only the per-subject *mapping* from explorer kind to this shape
 * differs — see `src/<subject>/lessonSignature.ts`.
 */
export interface SignatureCurve {
  d: string;
  stroke: string;
  strokeWidth?: number;
  dash?: string;
}
export interface SignatureRect {
  x: number;
  y: number;
  width: number;
  height: number;
}
export interface SignatureDot {
  cx: number;
  cy: number;
  r: number;
  fill: string;
}
export interface SignatureDraw {
  viewBox?: string;
  curves: SignatureCurve[];
  rects?: SignatureRect[];
  dots?: SignatureDot[];
  /** The path the handle dot rides via `offset-path`. */
  handlePath: string;
  /** Static fallback point (≈38% along handlePath) for browsers without SVG offset-path. */
  handleFallback: { x: number; y: number };
}

export function LessonSignature({
  draw,
  className,
  drawIn = false,
}: {
  draw: SignatureDraw;
  className?: string;
  /** Finished-quiz trophy replacement (§5.7 #7): the curve draws itself in over 900ms. */
  drawIn?: boolean;
}) {
  const vb = draw.viewBox ?? '0 0 200 48';
  const prefersReducedMotion = useReducedMotion();
  return (
    <svg viewBox={vb} width="100%" height={48} preserveAspectRatio="none" className={className} aria-hidden="true">
      {draw.rects?.map((r, i) => (
        <rect
          key={i}
          x={r.x}
          y={r.y}
          width={r.width}
          height={r.height}
          fill="var(--series-b-soft)"
          stroke="var(--series-b)"
          strokeWidth={1}
          vectorEffect="non-scaling-stroke"
        />
      ))}
      {draw.curves.map((c, i) =>
        drawIn ? (
          <motion.path
            key={i}
            d={c.d}
            fill="none"
            stroke={c.stroke}
            strokeWidth={c.strokeWidth ?? 2}
            strokeDasharray={c.dash}
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            initial={{ pathLength: prefersReducedMotion ? 1 : 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.9, ease: [0.2, 0.8, 0.2, 1] }}
          />
        ) : (
          <path
            key={i}
            d={c.d}
            fill="none"
            stroke={c.stroke}
            strokeWidth={c.strokeWidth ?? 2}
            strokeDasharray={c.dash}
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        ),
      )}
      {draw.dots?.map((d, i) => (
        <circle key={i} cx={d.cx} cy={d.cy} r={d.r} fill={d.fill} />
      ))}
      {!drawIn && (
        <circle
          className="signature-handle"
          r={4.5}
          fill="var(--accent)"
          stroke="var(--surface)"
          strokeWidth={1.5}
          cx={draw.handleFallback.x}
          cy={draw.handleFallback.y}
          style={{ offsetPath: `path('${draw.handlePath}')`, offsetDistance: '38%', offsetRotate: '0deg' } as CSSProperties}
        />
      )}
    </svg>
  );
}
