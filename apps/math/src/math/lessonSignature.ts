import { FUNCTIONS, rectangles } from './integral';
import { CURVES, derivativeTerm, evalTerm } from './derivative';
import type { Lesson } from '@/content/schema';
import type { SignatureDraw } from '@/components/LessonSignature';

/**
 * Per-subject mapping from a Math lesson's first explorer to a `LessonSignature` drawing
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
    case 'integral': {
      const spec = FUNCTIONS[explorer.fn];
      const { a, b } = explorer;
      const { scaleX, scaleY } = buildScales(a, b, spec.fn, true);
      const d = curvePath(a, b, spec.fn, scaleX, scaleY);
      const zeroY = scaleY(0);
      const rects = rectangles(spec.fn, a, b, 6, 'midpoint');
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
        handleFallback: pointAt(a, b, spec.fn, scaleX, scaleY, 0.38),
      };
    }
    case 'secant': {
      const spec = CURVES[explorer.curve];
      const [a, b] = spec.domain;
      const { scaleX, scaleY } = buildScales(a, b, spec.fn, false);
      const d = curvePath(a, b, spec.fn, scaleX, scaleY);
      const { initialX1: x1, initialX2: x2 } = explorer;
      const rate = x1 === x2 ? spec.derivative(x1) : (spec.fn(x2) - spec.fn(x1)) / (x2 - x1);
      const ext = (b - a) * 0.1;
      const p1x = Math.max(a, x1 - ext);
      const p2x = Math.min(b, x2 + ext);
      const secantD = `M ${scaleX(p1x).toFixed(1)} ${scaleY(spec.fn(x1) + rate * (p1x - x1)).toFixed(1)} L ${scaleX(p2x).toFixed(1)} ${scaleY(spec.fn(x1) + rate * (p2x - x1)).toFixed(1)}`;
      return {
        viewBox: `0 0 ${VB_W} ${VB_H}`,
        curves: [
          { d, stroke: 'var(--series-a)' },
          { d: secantD, stroke: 'var(--series-b)', dash: '4 3', strokeWidth: 1.5 },
        ],
        dots: [
          { cx: scaleX(x1), cy: scaleY(spec.fn(x1)), r: 2.5, fill: 'var(--series-b)' },
          { cx: scaleX(x2), cy: scaleY(spec.fn(x2)), r: 2.5, fill: 'var(--series-b)' },
        ],
        handlePath: d,
        handleFallback: pointAt(a, b, spec.fn, scaleX, scaleY, 0.38),
      };
    }
    case 'powerRule': {
      const term = { coeff: explorer.initialCoeff, power: explorer.initialPower };
      const dTerm = derivativeTerm(term);
      const a = 0.2;
      const b = 4;
      const fn = (x: number) => evalTerm(term, x);
      const dfn = (x: number) => evalTerm(dTerm, x);
      let min = Infinity;
      let max = -Infinity;
      for (let i = 0; i <= SAMPLES; i++) {
        const x = a + ((b - a) * i) / SAMPLES;
        min = Math.min(min, fn(x), dfn(x));
        max = Math.max(max, fn(x), dfn(x));
      }
      const pad = (max - min) * 0.15 || 1;
      min -= pad;
      max += pad;
      const scaleX = (x: number) => PAD_X + ((x - a) / (b - a)) * (VB_W - PAD_X * 2);
      const scaleY = (y: number) => PAD_Y + (VB_H - PAD_Y * 2) - ((y - min) / (max - min)) * (VB_H - PAD_Y * 2);
      const d = curvePath(a, b, fn, scaleX, scaleY);
      const dD = curvePath(a, b, dfn, scaleX, scaleY);
      return {
        viewBox: `0 0 ${VB_W} ${VB_H}`,
        curves: [
          { d, stroke: 'var(--series-a)' },
          { d: dD, stroke: 'var(--series-b)', dash: '4 3' },
        ],
        handlePath: d,
        handleFallback: pointAt(a, b, fn, scaleX, scaleY, 0.38),
      };
    }
    case 'extremum': {
      const spec = CURVES[explorer.curve];
      const [a, b] = spec.domain;
      const { scaleX, scaleY } = buildScales(a, b, spec.fn, false);
      const d = curvePath(a, b, spec.fn, scaleX, scaleY);
      const dots = (spec.extrema ?? []).map((e) => ({
        cx: scaleX(e.x),
        cy: scaleY(spec.fn(e.x)),
        r: 4,
        fill: 'var(--accent)',
      }));
      return {
        viewBox: `0 0 ${VB_W} ${VB_H}`,
        curves: [{ d, stroke: 'var(--series-a)' }],
        dots,
        handlePath: d,
        handleFallback: pointAt(a, b, spec.fn, scaleX, scaleY, 0.38),
      };
    }
  }
}
