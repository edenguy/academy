import { SCENARIOS, averageVelocity, velocityAtConstantAccel, velocityRectangles } from './kinematics';
import type { Lesson } from '@/content/schema';
import type { SignatureDraw } from '@/components/LessonSignature';

/**
 * Per-subject mapping from a Physics lesson's first explorer to a `LessonSignature` drawing
 * (§5.3's table) — the shared renderer lives in `components/LessonSignature.tsx`; this file
 * is the part that differs between apps/math and apps/physics.
 */
const VB_W = 200;
const VB_H = 48;
const PAD_X = 4;
const PAD_Y = 6;
const SAMPLES = 32;
const FALLBACK_D = 'M0 40 C 60 40, 120 8, 200 8';

function buildScales(a: number, b: number, fn: (x: number) => number, includeZero: boolean) {
  let min = Infinity;
  let max = -Infinity;
  for (let i = 0; i <= SAMPLES; i++) {
    const y = fn(a + ((b - a) * i) / SAMPLES);
    min = Math.min(min, y);
    max = Math.max(max, y);
  }
  if (includeZero) {
    min = Math.min(min, 0);
    max = Math.max(max, 0);
  }
  const pad = (max - min) * 0.15 || 1;
  min -= pad;
  max += pad;
  const scaleX = (x: number) => PAD_X + ((x - a) / (b - a)) * (VB_W - PAD_X * 2);
  const scaleY = (y: number) => PAD_Y + (VB_H - PAD_Y * 2) - ((y - min) / (max - min)) * (VB_H - PAD_Y * 2);
  return { scaleX, scaleY };
}

function curvePath(a: number, b: number, fn: (x: number) => number, scaleX: (x: number) => number, scaleY: (y: number) => number) {
  const pts: string[] = [];
  for (let i = 0; i <= SAMPLES; i++) {
    const x = a + ((b - a) * i) / SAMPLES;
    pts.push(`${i === 0 ? 'M' : 'L'} ${scaleX(x).toFixed(1)} ${scaleY(fn(x)).toFixed(1)}`);
  }
  return pts.join(' ');
}

function pointAt(
  a: number,
  b: number,
  fn: (x: number) => number,
  scaleX: (x: number) => number,
  scaleY: (y: number) => number,
  frac: number,
) {
  const x = a + frac * (b - a);
  return { x: scaleX(x), y: scaleY(fn(x)) };
}

export function lessonSignature(lesson: Lesson): SignatureDraw {
  const explorer = lesson.explorers?.[0];
  if (!explorer) {
    return {
      viewBox: `0 0 ${VB_W} ${VB_H}`,
      curves: [{ d: FALLBACK_D, stroke: 'var(--accent)' }],
      handlePath: FALLBACK_D,
      handleFallback: { x: 70, y: 28 },
    };
  }

  switch (explorer.kind) {
    case 'scrubber': {
      const spec = SCENARIOS[explorer.initialScenario];
      const [a, b] = spec.domain;
      const { scaleX, scaleY } = buildScales(a, b, spec.position, false);
      const d = curvePath(a, b, spec.position, scaleX, scaleY);
      return {
        viewBox: `0 0 ${VB_W} ${VB_H}`,
        curves: [{ d, stroke: 'var(--series-a)' }],
        handlePath: d,
        handleFallback: pointAt(a, b, spec.position, scaleX, scaleY, 0.35),
      };
    }
    case 'secant': {
      const spec = SCENARIOS[explorer.scenario];
      const [a, b] = spec.domain;
      const { scaleX, scaleY } = buildScales(a, b, spec.position, false);
      const d = curvePath(a, b, spec.position, scaleX, scaleY);
      const { initialT1: t1, initialT2: t2 } = explorer;
      const avgV = averageVelocity(spec, t1, t2);
      const ext = (b - a) * 0.1;
      const p1x = Math.max(a, t1 - ext);
      const p2x = Math.min(b, t2 + ext);
      const secantD = `M ${scaleX(p1x).toFixed(1)} ${scaleY(spec.position(t1) + avgV * (p1x - t1)).toFixed(1)} L ${scaleX(p2x).toFixed(1)} ${scaleY(spec.position(t1) + avgV * (p2x - t1)).toFixed(1)}`;
      return {
        viewBox: `0 0 ${VB_W} ${VB_H}`,
        curves: [
          { d, stroke: 'var(--series-a)' },
          { d: secantD, stroke: 'var(--series-b)', dash: '4 3', strokeWidth: 1.5 },
        ],
        dots: [
          { cx: scaleX(t1), cy: scaleY(spec.position(t1)), r: 2.5, fill: 'var(--series-b)' },
          { cx: scaleX(t2), cy: scaleY(spec.position(t2)), r: 2.5, fill: 'var(--series-b)' },
        ],
        handlePath: d,
        handleFallback: pointAt(a, b, spec.position, scaleX, scaleY, 0.38),
      };
    }
    case 'accelArea': {
      const { initialA: a, duration } = explorer;
      const vFn = (t: number) => velocityAtConstantAccel(a, t);
      const { scaleX, scaleY } = buildScales(0, duration, vFn, true);
      const d = curvePath(0, duration, vFn, scaleX, scaleY);
      const zeroY = scaleY(0);
      const rects = velocityRectangles(a, duration, 6, 'midpoint');
      return {
        viewBox: `0 0 ${VB_W} ${VB_H}`,
        curves: [{ d, stroke: 'var(--series-a)' }],
        rects: rects.map((r) => ({
          x: scaleX(r.x),
          y: scaleY(Math.max(0, r.height)),
          width: Math.max(0, scaleX(r.x + r.width) - scaleX(r.x)),
          height: Math.max(0, zeroY - scaleY(Math.max(0, r.height))),
        })),
        handlePath: d,
        handleFallback: pointAt(0, duration, vFn, scaleX, scaleY, 0.38),
      };
    }
  }
}
