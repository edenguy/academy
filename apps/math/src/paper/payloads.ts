/**
 * Math Academy's Paper-layer catalog: what each floating napkin carries.
 * Spec: BACKGROUND_LLD.md §10.1 — draw exactly what a row says, from the function it names, and
 * nothing else. To add a payload, add its row to §10.1 first, with its source.
 *
 * Every curve is sampled from the subject's own pure functions (src/math/*), never hand-shaped.
 * Napkins carry symbols only: no Hebrew or English words (D9), no tick labels, no units.
 */
import { FUNCTIONS, powerIntegral, rectangles, riemannSum } from '@/math/integral';
import { CURVES, averageRateOfChange, derivativeTerm, evalDerivativeTerm, evalTerm } from '@/math/derivative';
import type { Payload, Pen } from './engine';

/** Label markup, character for character as BACKGROUND_LLD.md §10.1 lists it. */
export const LABELS = {
  M1: '∫_{0}^{3} x^{2} dx = 9',
  M2: '∫_{0}^{6} x dx = 18',
  M3: '∫_{0}^{4} x^{2} dx = 64/3',
  M4: '∫_{0}^{b} x^{n} dx = b^{n+1}/(n+1)',
  M5: 'm = Δy/Δx',
  M6: '(½x^{2})′ = x',
  M7: '(x^{n})′ = n·x^{n−1}',
  M8: '(√x)′ = 1/(2√x)',
  M9: '(x^{3} − 3x)′ = 3x^{2} − 3',
  M10: '(f + g)′ = f′ + g′',
  M11: 'y = sin x',
} as const;

const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));

/** 0 until `from`, then rises to 1 at the end of the drawing phase: a curve that draws in after the bars. */
const sweep = (t: number, from: number) => clamp((t - from) / (1 - from), 0, 1);

/** The formula appears as the drawing completes (§6.2). */
const labelAlpha = (pen: Pen) => clamp((pen.t - 0.55) / 0.3, 0, 1);
const caption = (pen: Pen, markup: string) => pen.label(markup, 0, -0.72, 0.2, { alpha: labelAlpha(pen) });

/** §6.3: maps maths to napkin space (graph box u -0.78..0.82, w -0.42..0.74) and draws the two axes. */
function frame(pen: Pen, x0: number, x1: number, y0: number, y1: number) {
  const ux = (x: number) => -0.7 + ((x - x0) / (x1 - x0)) * 1.45;
  const wy = (y: number) => 0.66 - ((y - y0) / (y1 - y0)) * 1.02;
  pen.style(pen.ink(2), 1.3, 0.55);
  pen.arrow(-0.78, wy(0), 0.82, wy(0));
  pen.arrow(ux(0), 0.74, ux(0), -0.42);
  return { ux, wy, fn: (f: (x: number) => number) => (u: number) => wy(f(x0 + ((u + 0.7) / 1.45) * (x1 - x0))) };
}

/** M5: where the second point of the secant is. Slow loop between 4 and 2.3; 4 in a still frame (now = 9). */
export const secantX2 = (now: number) => 3.15 + 0.85 * Math.cos(0.35 * (now - 9));
/** M6: where the tangent touches. Slow loop between 1 and 4; 2.5 in a still frame (now = 9). */
export const tangentX = (now: number) => 2.5 + 1.5 * Math.sin(0.3 * (now - 9));

const parabola = FUNCTIONS.parabola.fn;
const M1_BARS = rectangles(parabola, 0, 3, 6, 'midpoint');
const M3_BARS = rectangles(parabola, 0, 4, 4, 'midpoint');
const power3 = derivativeTerm({ coeff: 1, power: 3 });   // 3x²
const sqrtTerm = { coeff: 1, power: 0.5 };
const half = CURVES.quadratic.fn;

export const PAYLOADS: Payload[] = [
  {
    id: 'M1', tier: 'A',
    draw(pen) {
      const f = frame(pen, 0, 3, 0, 9.5);
      const shown = Math.ceil(M1_BARS.length * Math.min(1, pen.t * 1.4));
      pen.style(pen.ink(1), 1.2, 0.9);
      for (let i = 0; i < shown; i++) { const r = M1_BARS[i]!; pen.quad(f.ux(r.x), f.wy(0), f.ux(r.x + r.width), f.wy(r.height), 0.22); }
      pen.style(pen.ink(0), 2.6);
      pen.curve(f.fn(parabola), f.ux(0), f.ux(3), sweep(pen.t, 0.3), 40);
      caption(pen, LABELS.M1);
    },
    check: () => powerIntegral(2, 0, 3) === 9,
  },
  {
    id: 'M2', tier: 'A',
    draw(pen) {
      const f = frame(pen, 0, 6, 0, 6.3), line = f.fn(FUNCTIONS.line.fn), u0 = f.ux(0), u1 = f.ux(6);
      pen.style(pen.ink(1), 1.2, 0.9);
      pen.area(line, u0, u0 + (u1 - u0) * pen.t, f.wy(0), 0.25);
      pen.style(pen.ink(0), 2.6);
      pen.curve(line, u0, u1, pen.t, 20);
      caption(pen, LABELS.M2);
    },
    check: () => powerIntegral(1, 0, 6) === 18,
  },
  {
    id: 'M3', tier: 'A',
    draw(pen) {
      const f = frame(pen, 0, 4, 0, 16.5);
      const shown = Math.ceil(M3_BARS.length * Math.min(1, pen.t * 1.4));
      pen.style(pen.ink(1), 1.2, 0.9);
      for (let i = 0; i < shown; i++) { const r = M3_BARS[i]!; pen.quad(f.ux(r.x), f.wy(0), f.ux(r.x + r.width), f.wy(r.height), 0.22); }
      pen.style(pen.ink(0), 2.6);
      pen.curve(f.fn(parabola), f.ux(0), f.ux(4), sweep(pen.t, 0.3), 40);
      caption(pen, LABELS.M3);
    },
    check: () => Math.abs(powerIntegral(2, 0, 4) - 64 / 3) < 1e-12 && riemannSum(parabola, 0, 4, 4, 'midpoint') === 21,
  },
  {
    id: 'M4', tier: 'A',
    draw(pen) {
      const f = frame(pen, 0, 1.6, 0, 4.3), cubic = f.fn(FUNCTIONS.cubic.fn), u0 = f.ux(0), u1 = f.ux(1.6);
      pen.style(pen.ink(1), 1.2, 0.9);
      pen.area(cubic, u0, u0 + (u1 - u0) * pen.t, f.wy(0), 0.25);
      pen.style(pen.ink(0), 2.6);
      pen.curve(cubic, u0, u1, pen.t, 40);
      caption(pen, LABELS.M4);
    },
    check: () => powerIntegral(3, 0, 2) === 2 ** 4 / 4,
  },
  {
    id: 'M5', tier: 'A',
    draw(pen) {
      const f = frame(pen, 0, 5, 0, 13), x1 = 2, x2 = secantX2(pen.now);
      pen.style(pen.ink(0), 2.6);
      pen.curve(f.fn(half), f.ux(0), f.ux(5), pen.t, 40);
      const a = clamp((pen.t - 0.5) / 0.3, 0, 1);
      if (a > 0) {
        const m = averageRateOfChange(CURVES.quadratic, x1, x2), xa = 1.2, xb = x2 + 0.8;
        pen.style(pen.ink(1), 1.8, a);
        pen.seg(f.ux(xa), f.wy(half(x1) + m * (xa - x1)), f.ux(xb), f.wy(half(x1) + m * (xb - x1)));
        pen.dot(f.ux(x1), f.wy(half(x1)), 3.2);
        pen.dot(f.ux(x2), f.wy(half(x2)), 3.2);
      }
      caption(pen, LABELS.M5);
    },
    check: () => averageRateOfChange(CURVES.quadratic, 2, 4) === 3,
  },
  {
    id: 'M6', tier: 'A',
    draw(pen) {
      const f = frame(pen, 0, 5, 0, 13), x0 = tangentX(pen.now);
      pen.style(pen.ink(0), 2.6);
      pen.curve(f.fn(half), f.ux(0), f.ux(5), pen.t, 40);
      const a = clamp((pen.t - 0.5) / 0.3, 0, 1);
      if (a > 0) {
        const m = CURVES.quadratic.derivative(x0), y0 = half(x0), xa = Math.max(0, x0 - 1.2), xb = Math.min(5, x0 + 1.2);
        pen.style(pen.ink(1), 1.8, a);
        pen.seg(f.ux(xa), f.wy(y0 + m * (xa - x0)), f.ux(xb), f.wy(y0 + m * (xb - x0)));
        pen.dot(f.ux(x0), f.wy(y0), 3.2);
      }
      caption(pen, LABELS.M6);
    },
    check: () => CURVES.quadratic.derivative(5) === 5,
  },
  {
    id: 'M7', tier: 'A',
    draw(pen) {
      const f = frame(pen, -1.3, 1.3, -2.5, 5.4), u0 = f.ux(-1.3), u1 = f.ux(1.3);
      pen.style(pen.ink(0), 2.6);
      pen.curve(f.fn(FUNCTIONS.cubic.fn), u0, u1, pen.t, 40);
      pen.style(pen.ink(1), 2.2);
      pen.curve(f.fn((x) => evalTerm(power3, x)), u0, u1, pen.t, 40, true);
      caption(pen, LABELS.M7);
    },
    check: () => evalDerivativeTerm({ coeff: 1, power: 4 }, 2) === 32,
  },
  {
    id: 'M8', tier: 'A',
    draw(pen) {
      const f = frame(pen, 0, 4, 0, 2.2), root = (x: number) => evalTerm(sqrtTerm, x), m = evalDerivativeTerm(sqrtTerm, 1);
      pen.style(pen.ink(0), 2.6);
      pen.curve(f.fn(root), f.ux(0), f.ux(4), pen.t, 40);
      const a = clamp((pen.t - 0.5) / 0.3, 0, 1);
      if (a > 0) {
        pen.style(pen.ink(1), 1.8, a);
        pen.seg(f.ux(0), f.wy(1 + m * (0 - 1)), f.ux(3.2), f.wy(1 + m * (3.2 - 1)));
        pen.dot(f.ux(1), f.wy(1), 3.2);
      }
      caption(pen, LABELS.M8);
    },
    check: () => evalDerivativeTerm({ coeff: 1, power: 0.5 }, 1) === 0.5,
  },
  {
    id: 'M9', tier: 'A',
    draw(pen) {
      const spec = CURVES.cubicWave, f = frame(pen, -2.2, 2.2, -4.4, 4.4);
      pen.style(pen.ink(0), 2.6);
      pen.curve(f.fn(spec.fn), f.ux(-2.2), f.ux(2.2), pen.t, 44);
      const a = clamp((pen.t - 0.5) / 0.3, 0, 1);
      if (a > 0 && spec.extrema) {
        pen.style(pen.ink(1), 1.8, a);
        for (const e of spec.extrema) {
          const y = spec.fn(e.x), m = spec.derivative(e.x);   // 0: the tangent at an extremum is flat
          pen.seg(f.ux(e.x - 0.6), f.wy(y - m * 0.6), f.ux(e.x + 0.6), f.wy(y + m * 0.6));
          pen.dot(f.ux(e.x), f.wy(y), 3.2);
        }
      }
      caption(pen, LABELS.M9);
    },
    check: () => CURVES.cubicWave.derivative(1) === 0 && CURVES.cubicWave.derivative(-1) === 0,
  },
  {
    id: 'M10', tier: 'A',
    draw(pen) {
      const f = frame(pen, 0, 3, 0, 8), u0 = f.ux(0), u1 = f.ux(3);
      pen.style(pen.ink(1), 2.2);
      pen.curve(f.fn(FUNCTIONS.line.fn), u0, u1, pen.t, 20);
      pen.style(pen.ink(2), 2.2);
      pen.curve(f.fn(half), u0, u1, pen.t, 32);
      pen.style(pen.ink(0), 2.8);
      pen.curve(f.fn((x) => x + half(x)), u0, u1, sweep(pen.t, 0.2), 40);
      caption(pen, LABELS.M10);
    },
    check: () => true,   // an identity: nothing numeric is stated
  },
  {
    id: 'M11', tier: 'B',
    draw(pen) {
      const f = frame(pen, 0, 2 * Math.PI, -1.15, 1.15);
      pen.style(pen.ink(0), 2.6);
      pen.curve(f.fn(Math.sin), f.ux(0), f.ux(2 * Math.PI), pen.t, 48);
      caption(pen, LABELS.M11);
    },
    check: () => Math.sin(Math.PI / 2) === 1,
  },
];
