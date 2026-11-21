/**
 * Math Academy's Paper-layer catalog: what each floating napkin carries.
 * Spec: BACKGROUND_LLD.md §10.1 (M1-M11) and R7.3 (M12-M51) — draw exactly what a row says, from
 * the function it names, and nothing else. To add a payload, add its row to the spec first, with
 * its source.
 *
 * Every curve is sampled from the subject's own pure functions (src/math/*) or from `Math.*`,
 * never hand-shaped. Napkins carry symbols only: no Hebrew or English words (D9), no tick labels,
 * no units. Everything on a napkin is left to right.
 */
import { FUNCTIONS, powerIntegral, rectangles, riemannSum } from '@/math/integral';
import { CURVES, averageRateOfChange, derivativeTerm, evalDerivativeTerm, evalTerm, slopeSign } from '@/math/derivative';
import type { Family, Payload, Pen } from './engine';

/**
 * R7.1 rule 9: whether the Israeli 5-unit formula sheet prints `tan` or `tg` was not checked, and M35 is
 * "left out if there is doubt". There is doubt, so M35 is built but not in the catalog until the content
 * reviewer confirms the notation (then flip this to true and the test's id list follows).
 */
export const TAN_NOTATION_CONFIRMED = false;

/** The main label of each payload, character for character as the spec lists it (U+2032 prime, U+2212 minus, U+00B7 middle dot). */
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
  M12: 'L_{6} < ∫ < R_{6}',
  M13: '∫_{a}^{b} f(x) dx = F(b) − F(a)',
  M14: '∫ x^{n} dx = x^{n+1}/(n+1) + C',
  M15: '∫_{0}^{1} (x − x^{2}) dx = 1/6',
  M16: '∫_{−1}^{1} x^{3} dx = 0',
  M17: 'f′(x) = lim_{h→0} (f(x+h) − f(x))/h',
  M18: '(c·f)′ = c·f′',
  M19: '(f·g)′ = f′·g + f·g′',
  M20: '(f/g)′ = (f′·g − f·g′)/g^{2}',
  M21: '(f(g(x)))′ = f′(g(x))·g′(x)',
  M22: '(x^{2})′ = 2x',
  M23: '(1/x)′ = −1/x^{2}',
  M24: '',
  M25: 'f″(0) = 0',
  M26: 'x = −b/(2a)',
  M27: 'x^{2} − 4x + 3 = (x − 1)(x − 3)',
  M28: 'x = (−b ± √(b^{2} − 4ac))/(2a)',
  M29: 'a^{2} − b^{2} = (a − b)(a + b)',
  M30: '(a + b)^{2} = a^{2} + 2ab + b^{2}',
  M31: 'y = mx + b',
  M32: 'y = cos x',
  M33: 'sin^{2}x + cos^{2}x = 1',
  M34: 'sin 2x = 2 sin x cos x',
  M35: 'tan x = sin x / cos x',
  M36: '(sin x)′ = cos x',
  M37: '(e^{x})′ = e^{x}',
  M38: '(ln x)′ = 1/x',
  M39: 'a^{m}·a^{n} = a^{m+n}',
  M40: 'log(ab) = log a + log b',
  M41: 'e = lim_{n→∞} (1 + 1/n)^{n}',
  M42: 'y = 1/x',
  M43: '|x| = x  (x ≥ 0)',
  M44: 'y = |x^{2} − 1|',
  M45: 'x^{2} + y^{2} = r^{2}',
  M46: 'x^{2}/a^{2} + y^{2}/b^{2} = 1',
  M47: 'd = √((x_{2} − x_{1})^{2} + (y_{2} − y_{1})^{2})',
  M48: 'lim_{x→0} sin x / x = 1',
  M49: '1 + 2 + … + n = n(n+1)/2',
  M50: 'S_{n} = a_{1}(q^{n} − 1)/(q − 1)',
  M51: 'S = a_{1}/(1 − q)',
} as const;

/** Every other string a napkin draws: a second line, a condition, or a small label on the drawing. In the order drawn. */
export const EXTRA = {
  M13: ['a', 'b'],
  M14: ['n ≠ −1'],
  M24: ['f′ > 0', 'f′ < 0', 'f′ > 0'],
  M28: ['ax^{2} + bx + c = 0', 'a ≠ 0'],
  M30: ['a', 'b'],
  M31: ['Δx', 'Δy'],
  M33: ['1', 'sin x', 'cos x'],
  M35: [],
  M39: ['(a^{m})^{n} = a^{mn}'],
  M40: ['log(a^{n}) = n·log a', 'a, b > 0'],
  M43: ['|x| = −x  (x < 0)'],
  M45: ['r'],
  M46: ['a', 'b'],
  M50: ['q ≠ 1'],
  M51: ['|q| < 1'],
} as const satisfies Record<string, readonly string[]>;

const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));

/** 0 until `from`, then rises to 1 at the end of the drawing phase: a curve that draws in after the bars. */
const sweep = (t: number, from: number) => clamp((t - from) / (1 - from), 0, 1);

/** The formula appears as the drawing completes (§6.2). */
const labelAlpha = (pen: Pen) => clamp((pen.t - 0.55) / 0.3, 0, 1);
const caption = (pen: Pen, markup: string) => pen.label(markup, 0, -0.72, 0.2, { alpha: labelAlpha(pen) });
/** A small label (em 0.15) on a drawing. */
const small = (pen: Pen, markup: string, u: number, w: number, opts?: { ax?: number; ay?: number }) => pen.label(markup, u, w, 0.15, { alpha: labelAlpha(pen), ...opts });
/** The part of the drawing phase after the main curve, in which a tangent or a marker comes in. */
const comesIn = (pen: Pen) => clamp((pen.t - 0.5) / 0.3, 0, 1);

/** R7.1 rule 6, "formula" layout: no graph; a main line at (0, −0.12), an optional second line at (0, 0.30) and a small condition at (0, 0.62). */
function formula(pen: Pen, main: string, second?: string, cond?: string) {
  const alpha = clamp((pen.t - 0.1) / 0.35, 0, 1);   // nothing is drawn in, so the formula comes in early
  pen.label(main, 0, -0.12, 0.26, { alpha });
  if (second) pen.label(second, 0, 0.3, 0.2, { alpha });
  if (cond) pen.label(cond, 0, 0.62, 0.15, { alpha });
}

/** §6.3: maps maths to napkin space (graph box u -0.78..0.82, w -0.42..0.74) and draws the two axes (unless `axes` is false). */
function frame(pen: Pen, x0: number, x1: number, y0: number, y1: number, axes = true) {
  const ux = (x: number) => -0.7 + ((x - x0) / (x1 - x0)) * 1.45;
  const wy = (y: number) => 0.66 - ((y - y0) / (y1 - y0)) * 1.02;
  if (axes) {
    pen.style(pen.ink(2), 1.3, 0.55);
    pen.arrow(-0.78, wy(0), 0.82, wy(0));
    pen.arrow(ux(0), 0.74, ux(0), -0.42);
  }
  return { ux, wy, fn: (f: (x: number) => number) => (u: number) => wy(f(x0 + ((u + 0.7) / 1.45) * (x1 - x0))) };
}
type Frame = ReturnType<typeof frame>;

/** A graph y = g(x) from xa to xb, drawn up to `part`. */
const graph = (pen: Pen, f: Frame, g: (x: number) => number, xa: number, xb: number, part: number, steps = 40, dashed?: boolean) =>
  pen.curve(f.fn(g), f.ux(xa), f.ux(xb), part, steps, dashed);

/** A tangent segment to g at x0 (slope m), from xa to xb, with a dot at the point of contact. */
function tangent(pen: Pen, f: Frame, y0: number, m: number, x0: number, xa: number, xb: number, alpha: number, ink: 0 | 1 | 2 = 1) {
  pen.style(pen.ink(ink), 1.8, alpha);
  pen.seg(f.ux(xa), f.wy(y0 + m * (xa - x0)), f.ux(xb), f.wy(y0 + m * (xb - x0)));
  pen.dot(f.ux(x0), f.wy(y0), 3.2);
}

/** M5: where the second point of the secant is. Slow loop between 4 and 2.3; 4 in a still frame (now = 9). */
export const secantX2 = (now: number) => 3.15 + 0.85 * Math.cos(0.35 * (now - 9));
/** M6: where the tangent touches. Slow loop between 1 and 4; 2.5 in a still frame (now = 9). */
export const tangentX = (now: number) => 2.5 + 1.5 * Math.sin(0.3 * (now - 9));
/** M22: where the tangent to x² touches. Slow loop between -1.5 and 1.5; 1 in a still frame (now = 9). */
export const slideX = (now: number) => 1.5 * Math.sin(0.3 * (now - 9) + Math.asin(2 / 3));

/** A central difference, h = 1e-5, for the checks of R7.1 rule 10. */
const nd = (f: (x: number) => number, x: number, h = 1e-5) => (f(x + h) - f(x - h)) / (2 * h);
const within = (a: number, b: number, tol: number) => Math.abs(a - b) <= tol;

const parabola = FUNCTIONS.parabola.fn;
const cubic = FUNCTIONS.cubic.fn;
const M1_BARS = rectangles(parabola, 0, 3, 6, 'midpoint');
const M3_BARS = rectangles(parabola, 0, 4, 4, 'midpoint');
const M12_LEFT = rectangles(parabola, 0, 3, 6, 'left');
const M12_RIGHT = rectangles(parabola, 0, 3, 6, 'right');
const power3 = derivativeTerm({ coeff: 1, power: 3 });   // 3x²
const sqrtTerm = { coeff: 1, power: 0.5 };
const half = CURVES.quadratic.fn;
const wave = CURVES.cubicWave;
const inverse = { coeff: 1, power: -1 };
const square2 = derivativeTerm({ coeff: 1, power: 2 });   // 2x
const vertexParabola = (x: number) => x * x - 4 * x + 3;
const TWO_PI = 2 * Math.PI;

type Row = Omit<Payload, 'family'> & { family?: Family };
const rows: Row[] = [
  // ---------------------------------------------------------------- INT: M1-M4, M12-M16
  {
    id: 'M1', tier: 'A', family: 'INT',
    draw(pen) {
      const f = frame(pen, 0, 3, 0, 9.5);
      const shown = Math.ceil(M1_BARS.length * Math.min(1, pen.t * 1.4));
      pen.style(pen.ink(1), 1.2, 0.9);
      for (let i = 0; i < shown; i++) { const r = M1_BARS[i]!; pen.quad(f.ux(r.x), f.wy(0), f.ux(r.x + r.width), f.wy(r.height), 0.22); }
      pen.style(pen.ink(0), 2.6);
      graph(pen, f, parabola, 0, 3, sweep(pen.t, 0.3));
      caption(pen, LABELS.M1);
    },
    check: () => powerIntegral(2, 0, 3) === 9,
  },
  {
    id: 'M2', tier: 'A', family: 'INT',
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
    id: 'M3', tier: 'A', family: 'INT',
    draw(pen) {
      const f = frame(pen, 0, 4, 0, 16.5);
      const shown = Math.ceil(M3_BARS.length * Math.min(1, pen.t * 1.4));
      pen.style(pen.ink(1), 1.2, 0.9);
      for (let i = 0; i < shown; i++) { const r = M3_BARS[i]!; pen.quad(f.ux(r.x), f.wy(0), f.ux(r.x + r.width), f.wy(r.height), 0.22); }
      pen.style(pen.ink(0), 2.6);
      graph(pen, f, parabola, 0, 4, sweep(pen.t, 0.3));
      caption(pen, LABELS.M3);
    },
    check: () => Math.abs(powerIntegral(2, 0, 4) - 64 / 3) < 1e-12 && riemannSum(parabola, 0, 4, 4, 'midpoint') === 21,
  },
  {
    id: 'M4', tier: 'A', family: 'INT',
    draw(pen) {
      const f = frame(pen, 0, 1.6, 0, 4.3), curve = f.fn(cubic), u0 = f.ux(0), u1 = f.ux(1.6);
      pen.style(pen.ink(1), 1.2, 0.9);
      pen.area(curve, u0, u0 + (u1 - u0) * pen.t, f.wy(0), 0.25);
      pen.style(pen.ink(0), 2.6);
      pen.curve(curve, u0, u1, pen.t, 40);
      caption(pen, LABELS.M4);
    },
    check: () => powerIntegral(3, 0, 2) === 2 ** 4 / 4,
  },
  {
    id: 'M12', tier: 'A', family: 'INT',
    draw(pen) {
      const f = frame(pen, 0, 3, 0, 9.5);
      const shown = Math.ceil(M12_LEFT.length * Math.min(1, pen.t * 1.4));
      pen.style(pen.ink(2), 1.1, 0.9);   // right-endpoint bars stand over the curve
      for (let i = 0; i < shown; i++) { const r = M12_RIGHT[i]!; pen.quad(f.ux(r.x), f.wy(0), f.ux(r.x + r.width), f.wy(r.height), 0.14); }
      pen.style(pen.ink(1), 1.1, 0.9);   // left-endpoint bars stand under it (the first has height 0 and is not drawn)
      for (let i = 0; i < shown; i++) { const r = M12_LEFT[i]!; if (r.height > 0) pen.quad(f.ux(r.x), f.wy(0), f.ux(r.x + r.width), f.wy(r.height), 0.3); }
      pen.style(pen.ink(0), 2.6);
      graph(pen, f, parabola, 0, 3, sweep(pen.t, 0.3));
      caption(pen, LABELS.M12);
    },
    check: () => riemannSum(parabola, 0, 3, 6, 'left') < powerIntegral(2, 0, 3) && powerIntegral(2, 0, 3) < riemannSum(parabola, 0, 3, 6, 'right'),
  },
  {
    id: 'M13', tier: 'B', family: 'INT',
    draw(pen) {
      const f = frame(pen, 0, 3.2, 0, 10.5), curve = f.fn(parabola), ua = f.ux(1), ub = f.ux(3);
      pen.style(pen.ink(1), 1.2, 0.9);
      pen.area(curve, ua, ua + (ub - ua) * pen.t, f.wy(0), 0.28);
      pen.style(pen.ink(0), 2.6);
      pen.curve(curve, f.ux(0), f.ux(3.2), pen.t, 40);
      small(pen, EXTRA.M13[0], ua, f.wy(0) + 0.11);
      small(pen, EXTRA.M13[1], ub, f.wy(0) + 0.11);
      caption(pen, LABELS.M13);
    },
    check: () => Math.abs(powerIntegral(2, 1, 3) - (27 / 3 - 1 / 3)) < 1e-12,
  },
  {
    id: 'M14', tier: 'B', family: 'INT',
    draw: (pen) => formula(pen, LABELS.M14, undefined, EXTRA.M14[0]),
    check: () => within(nd((x) => x ** 4 / 4, 1.7), 1.7 ** 3, 1e-6),
  },
  {
    id: 'M15', tier: 'B', family: 'INT',
    draw(pen) {
      const f = frame(pen, 0, 1.15, 0, 1.2), top = f.fn(FUNCTIONS.line.fn), bottom = f.fn(parabola), u0 = f.ux(0), u1 = f.ux(1);
      pen.style(pen.ink(1), 1.2, 0.9);
      pen.area(top, u0, u0 + (u1 - u0) * pen.t, bottom, 0.28);   // the region between the two curves
      pen.style(pen.ink(1), 2.2);
      pen.curve(top, u0, f.ux(1.15), pen.t, 24);
      pen.style(pen.ink(0), 2.6);
      pen.curve(bottom, u0, f.ux(1.15), pen.t, 40);
      caption(pen, LABELS.M15);
    },
    check: () => Math.abs(powerIntegral(1, 0, 1) - powerIntegral(2, 0, 1) - 1 / 6) < 1e-12,
  },
  {
    id: 'M16', tier: 'B', family: 'INT',
    draw(pen) {
      const f = frame(pen, -1.2, 1.2, -1.9, 1.9), curve = f.fn(cubic), z = f.ux(0), r = f.ux(1), l = f.ux(-1);
      pen.style(pen.ink(1), 1.2, 0.9);
      pen.area(curve, z, z + (r - z) * pen.t, f.wy(0), 0.28);
      pen.style(pen.ink(2), 1.2, 0.9);
      pen.area(curve, z, z + (l - z) * pen.t, f.wy(0), 0.28);
      pen.style(pen.ink(0), 2.6);
      pen.curve(curve, f.ux(-1.2), f.ux(1.2), pen.t, 44);
      caption(pen, LABELS.M16);
    },
    check: () => Math.abs(powerIntegral(3, -1, 1)) < 1e-12,
  },

  // ---------------------------------------------------------------- DER: M5-M8, M10, M17-M23
  {
    id: 'M5', tier: 'A', family: 'DER',
    draw(pen) {
      const f = frame(pen, 0, 5, 0, 13), x1 = 2, x2 = secantX2(pen.now);
      pen.style(pen.ink(0), 2.6);
      graph(pen, f, half, 0, 5, pen.t);
      const a = comesIn(pen);
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
    id: 'M6', tier: 'A', family: 'DER',
    draw(pen) {
      const f = frame(pen, 0, 5, 0, 13), x0 = tangentX(pen.now);
      pen.style(pen.ink(0), 2.6);
      graph(pen, f, half, 0, 5, pen.t);
      const a = comesIn(pen);
      if (a > 0) tangent(pen, f, half(x0), CURVES.quadratic.derivative(x0), x0, Math.max(0, x0 - 1.2), Math.min(5, x0 + 1.2), a);
      caption(pen, LABELS.M6);
    },
    check: () => CURVES.quadratic.derivative(5) === 5,
  },
  {
    id: 'M7', tier: 'A', family: 'DER',
    draw(pen) {
      const f = frame(pen, -1.3, 1.3, -2.5, 5.4);
      pen.style(pen.ink(0), 2.6);
      graph(pen, f, cubic, -1.3, 1.3, pen.t);
      pen.style(pen.ink(1), 2.2);
      graph(pen, f, (x) => evalTerm(power3, x), -1.3, 1.3, pen.t, 40, true);
      caption(pen, LABELS.M7);
    },
    check: () => evalDerivativeTerm({ coeff: 1, power: 4 }, 2) === 32,
  },
  {
    id: 'M8', tier: 'A', family: 'DER',
    draw(pen) {
      const f = frame(pen, 0, 4, 0, 2.2), root = (x: number) => evalTerm(sqrtTerm, x);
      pen.style(pen.ink(0), 2.6);
      graph(pen, f, root, 0, 4, pen.t);
      const a = comesIn(pen);
      if (a > 0) tangent(pen, f, 1, evalDerivativeTerm(sqrtTerm, 1), 1, 0, 3.2, a);
      caption(pen, LABELS.M8);
    },
    check: () => evalDerivativeTerm({ coeff: 1, power: 0.5 }, 1) === 0.5,
  },
  {
    id: 'M10', tier: 'A', family: 'DER',
    draw(pen) {
      const f = frame(pen, 0, 3, 0, 8);
      pen.style(pen.ink(1), 2.2);
      graph(pen, f, FUNCTIONS.line.fn, 0, 3, pen.t, 20);
      pen.style(pen.ink(2), 2.2);
      graph(pen, f, half, 0, 3, pen.t, 32);
      pen.style(pen.ink(0), 2.8);
      graph(pen, f, (x) => x + half(x), 0, 3, sweep(pen.t, 0.2));
      caption(pen, LABELS.M10);
    },
    check: () => true,   // an identity: nothing numeric is stated
  },
  {
    id: 'M17', tier: 'B', family: 'DER',
    draw: (pen) => formula(pen, LABELS.M17),
    check: () => { const h = 1e-6; return within((half(2 + h) - half(2)) / h, 2, 1e-5); },
  },
  {
    id: 'M18', tier: 'A', family: 'DER',
    draw(pen) {
      const f = frame(pen, 0, 2.4, 0, 8.9), three = (x: number) => 3 * half(x);
      pen.style(pen.ink(1), 2.2);
      graph(pen, f, half, 0, 2.4, pen.t);
      pen.style(pen.ink(0), 2.6);
      graph(pen, f, three, 0, 2.4, pen.t);
      const a = comesIn(pen);
      if (a > 0) {
        tangent(pen, f, half(1), CURVES.quadratic.derivative(1), 1, 0.45, 1.65, a, 1);
        tangent(pen, f, three(1), 3 * CURVES.quadratic.derivative(1), 1, 0.45, 1.65, a, 0);
      }
      caption(pen, LABELS.M18);
    },
    check: () => evalDerivativeTerm({ coeff: 3, power: 2 }, 1) === 6,
  },
  {
    id: 'M19', tier: 'B', family: 'DER',
    draw: (pen) => formula(pen, LABELS.M19),
    check: () => within(nd((x) => x * x * Math.sin(x), 0.8), 2 * 0.8 * Math.sin(0.8) + 0.8 * 0.8 * Math.cos(0.8), 1e-6),
  },
  {
    id: 'M20', tier: 'B', family: 'DER',
    draw: (pen) => formula(pen, LABELS.M20),
    check: () => within(nd((x) => Math.sin(x) / (x * x), 0.8), (Math.cos(0.8) * 0.8 * 0.8 - Math.sin(0.8) * 2 * 0.8) / (0.8 * 0.8) ** 2, 1e-6),
  },
  {
    id: 'M21', tier: 'B', family: 'DER',
    draw: (pen) => formula(pen, LABELS.M21),
    check: () => within(nd((x) => Math.sin(x * x), 0.8), Math.cos(0.8 * 0.8) * (2 * 0.8), 1e-6),
  },
  {
    id: 'M22', tier: 'A', family: 'DER',
    draw(pen) {
      const f = frame(pen, -2.2, 2.2, -1.2, 5.2), x0 = slideX(pen.now);
      pen.style(pen.ink(0), 2.6);
      graph(pen, f, parabola, -2.2, 2.2, pen.t, 44);
      const a = comesIn(pen);
      if (a > 0) tangent(pen, f, parabola(x0), evalTerm(square2, x0), x0, Math.max(-2.2, x0 - 0.9), Math.min(2.2, x0 + 0.9), a);
      caption(pen, LABELS.M22);
    },
    check: () => evalDerivativeTerm({ coeff: 1, power: 2 }, 3) === 6,
  },
  {
    id: 'M23', tier: 'B', family: 'DER',
    draw(pen) {
      const f = frame(pen, 0, 4, 0, 3.6), recip = (x: number) => evalTerm(inverse, x);
      pen.style(pen.ink(0), 2.6);
      graph(pen, f, recip, 0.3, 4, pen.t, 44);
      const a = comesIn(pen);
      if (a > 0) tangent(pen, f, 1, evalDerivativeTerm(inverse, 1), 1, 0.4, 2.2, a);
      caption(pen, LABELS.M23);
    },
    check: () => evalDerivativeTerm(inverse, 1) === -1,
  },

  // ---------------------------------------------------------------- EXT: M9, M24-M26
  {
    id: 'M9', tier: 'A', family: 'EXT',
    draw(pen) {
      const f = frame(pen, -2.2, 2.2, -4.4, 4.4);
      pen.style(pen.ink(0), 2.6);
      graph(pen, f, wave.fn, -2.2, 2.2, pen.t, 44);
      const a = comesIn(pen);
      if (a > 0 && wave.extrema) {
        pen.style(pen.ink(1), 1.8, a);
        for (const e of wave.extrema) {
          const y = wave.fn(e.x), m = wave.derivative(e.x);   // 0: the tangent at an extremum is flat
          pen.seg(f.ux(e.x - 0.6), f.wy(y - m * 0.6), f.ux(e.x + 0.6), f.wy(y + m * 0.6));
          pen.dot(f.ux(e.x), f.wy(y), 3.2);
        }
      }
      caption(pen, LABELS.M9);
    },
    check: () => wave.derivative(1) === 0 && wave.derivative(-1) === 0,
  },
  {
    id: 'M24', tier: 'A', family: 'EXT',
    draw(pen) {
      const f = frame(pen, -2.2, 2.2, -4.4, 4.4), s = pen.t;
      // the curve is drawn left to right in three pieces: rising (ink 0), falling (ink 1), rising (ink 0)
      pen.style(pen.ink(0), 2.6);
      graph(pen, f, wave.fn, -2.2, -1, clamp(s / 0.34, 0, 1), 24);
      pen.style(pen.ink(1), 2.6);
      graph(pen, f, wave.fn, -1, 1, clamp((s - 0.34) / 0.33, 0, 1), 32);
      pen.style(pen.ink(0), 2.6);
      graph(pen, f, wave.fn, 1, 2.2, clamp((s - 0.67) / 0.33, 0, 1), 24);
      small(pen, EXTRA.M24[0], f.ux(-1.95), f.wy(3.3));
      small(pen, EXTRA.M24[1], f.ux(0.9), f.wy(2.7));
      small(pen, EXTRA.M24[2], f.ux(1.6), f.wy(-3.3));
    },
    check: () => slopeSign(wave, -2) === 'inc' && slopeSign(wave, 0) === 'dec' && slopeSign(wave, 2) === 'inc',
  },
  {
    id: 'M25', tier: 'B', family: 'EXT',
    draw(pen) {
      const f = frame(pen, -2.2, 2.2, -4.4, 4.4);
      pen.style(pen.ink(0), 2.6);
      graph(pen, f, wave.fn, -2.2, 0, clamp(pen.t / 0.5, 0, 1), 32);
      pen.style(pen.ink(1), 2.6);
      graph(pen, f, wave.fn, 0, 2.2, clamp((pen.t - 0.5) / 0.5, 0, 1), 32);
      if (comesIn(pen) > 0) { pen.style(pen.ink(2), 1.8, comesIn(pen)); pen.dot(f.ux(0), f.wy(0), 3.6, false); }
      caption(pen, LABELS.M25);
    },
    // f″ is the slope of f′ = 3x² − 3: it is smallest at 0 and changes sign there (6x), so 0 is an inflection point
    check: () => wave.derivative(0.01) > wave.derivative(0) && wave.derivative(-0.01) > wave.derivative(0),
  },
  {
    id: 'M26', tier: 'B', family: 'EXT',
    draw(pen) {
      const f = frame(pen, -0.3, 4.3, -1.3, 4.6);
      pen.style(pen.ink(2), 1.3, 0.7);
      pen.dash(f.ux(2), f.wy(-1.25), f.ux(2), f.wy(4.4));
      pen.style(pen.ink(0), 2.6);
      graph(pen, f, vertexParabola, -0.3, 4.3, pen.t, 44);
      if (comesIn(pen) > 0) { pen.style(pen.ink(1), 1.8, comesIn(pen)); pen.dot(f.ux(2), f.wy(-1), 3.6); }
      caption(pen, LABELS.M26);
    },
    check: () => -(-4) / 2 === 2 && vertexParabola(2) === -1 && vertexParabola(1.9) > vertexParabola(2) && vertexParabola(2.1) > vertexParabola(2),
  },

  // ---------------------------------------------------------------- ALG: M27-M31
  {
    id: 'M27', tier: 'B', family: 'ALG',
    draw(pen) {
      const f = frame(pen, -0.3, 4.3, -1.3, 4.6);
      pen.style(pen.ink(0), 2.6);
      graph(pen, f, vertexParabola, -0.3, 4.3, pen.t, 44);
      if (comesIn(pen) > 0) { pen.style(pen.ink(1), 1.8, comesIn(pen)); pen.dot(f.ux(1), f.wy(0), 3.6); pen.dot(f.ux(3), f.wy(0), 3.6); }
      caption(pen, LABELS.M27);
    },
    check: () => vertexParabola(1) === 0 && vertexParabola(3) === 0 && vertexParabola(5) === (5 - 1) * (5 - 3),
  },
  {
    id: 'M28', tier: 'B', family: 'ALG',
    draw: (pen) => formula(pen, LABELS.M28, EXTRA.M28[0], EXTRA.M28[1]),
    check: () => {
      const [a, b, c] = [1, -4, 3], d = Math.sqrt(b * b - 4 * a * c);
      return (-b + d) / (2 * a) === 3 && (-b - d) / (2 * a) === 1;
    },
  },
  {
    id: 'M29', tier: 'B', family: 'ALG',
    draw: (pen) => formula(pen, LABELS.M29),
    check: () => 7 ** 2 - 3 ** 2 === (7 - 3) * (7 + 3),
  },
  {
    id: 'M30', tier: 'B', family: 'ALG',
    draw(pen) {
      // a : b = 3 : 2; the square is drawn square on the napkin whatever its shape (pen.aspect = hw / hh)
      const ext = Math.min(1.0, 0.7 * pen.aspect), side = ext / pen.aspect, k = pen.aspect;
      const u0 = -side / 2, a = (3 / 5) * side, b = (2 / 5) * side, top = 0.2 - ext / 2, base = top + ext;
      const mid = top + a * k;
      const s = clamp(pen.t / 0.7, 0, 1);
      pen.style(pen.ink(1), 1.4, 0.9);
      if (s > 0.0) pen.quad(u0, top, u0 + a, mid, 0.3);                   // a²
      pen.style(pen.ink(2), 1.4, 0.9);
      if (s > 0.35) pen.quad(u0 + a, mid, u0 + a + b, base, 0.3);          // b²
      pen.style(pen.ink(2), 1.4, 0.7);
      if (s > 0.6) { pen.quad(u0 + a, top, u0 + a + b, mid, 0.08); pen.quad(u0, mid, u0 + a, base, 0.08); }   // the two ab
      pen.label(LABELS.M30, 0, -0.62, 0.22, { alpha: labelAlpha(pen) });
      small(pen, EXTRA.M30[0], u0 + a / 2, base + 0.1);
      small(pen, EXTRA.M30[1], u0 + a + b / 2, base + 0.1);
    },
    check: () => (7 + 3) ** 2 === 49 + 2 * 21 + 9,
  },
  {
    id: 'M31', tier: 'B', family: 'ALG',
    draw(pen) {
      const f = frame(pen, -1, 5, -0.6, 4.2), line = (x: number) => 0.5 * x + 1;
      pen.style(pen.ink(0), 2.6);
      graph(pen, f, line, -1, 5, pen.t, 20);
      const a = comesIn(pen);
      if (a > 0) {
        pen.style(pen.ink(1), 1.6, a);
        pen.dash(f.ux(2), f.wy(line(2)), f.ux(4), f.wy(line(2)));
        pen.dash(f.ux(4), f.wy(line(2)), f.ux(4), f.wy(line(4)));
        small(pen, EXTRA.M31[0], f.ux(3), f.wy(line(2)) + 0.1);
        small(pen, EXTRA.M31[1], f.ux(4) + 0.14, f.wy((line(2) + line(4)) / 2) + 0.03);
      }
      caption(pen, LABELS.M31);
    },
    check: () => 0.5 * 4 + 1 - (0.5 * 2 + 1) === 0.5 * 2,
  },

  // ---------------------------------------------------------------- TRIG: M11, M32-M36
  {
    id: 'M11', tier: 'B', family: 'TRIG',
    draw(pen) {
      const f = frame(pen, 0, TWO_PI, -1.15, 1.15);
      pen.style(pen.ink(0), 2.6);
      graph(pen, f, Math.sin, 0, TWO_PI, pen.t, 48);
      caption(pen, LABELS.M11);
    },
    check: () => Math.sin(Math.PI / 2) === 1,
  },
  {
    id: 'M32', tier: 'B', family: 'TRIG',
    draw(pen) {
      const f = frame(pen, 0, TWO_PI, -1.15, 1.15);
      pen.style(pen.ink(0), 2.6);
      graph(pen, f, Math.cos, 0, TWO_PI, pen.t, 48);
      caption(pen, LABELS.M32);
    },
    check: () => Math.cos(0) === 1,
  },
  {
    id: 'M33', tier: 'B', family: 'TRIG',
    draw(pen) {
      const k = pen.aspect, r = Math.min(0.3, 0.5 / k), cx = -0.2, cy = 0.12, ang = (50 * Math.PI) / 180;
      const px = cx + r * Math.cos(ang), py = cy - r * k * Math.sin(ang), em = 0.12, alpha = labelAlpha(pen);
      pen.style(pen.ink(2), 1.3, 0.55);
      pen.arrow(cx - r * 1.3, cy, cx + r * 1.3, cy);
      pen.arrow(cx, cy + r * k * 1.3, cx, cy - r * k * 1.3);
      pen.style(pen.ink(0), 2.6);
      pen.para((s) => cx + r * Math.cos(s), (s) => cy - r * k * Math.sin(s), 0, TWO_PI, pen.t, 48);
      const a = comesIn(pen);
      if (a > 0) {
        pen.style(pen.ink(1), 2, a);
        pen.seg(cx, cy, px, py);
        pen.style(pen.ink(1), 1.5, a);
        pen.dash(cx, cy, px, cy);
        pen.dash(px, cy, px, py);
        pen.arc(cx, cy, r * 0.32, 0, ang);
        pen.dot(px, py, 3.2);
      }
      pen.label(EXTRA.M33[0], cx + (px - cx) * 0.5 - 0.08, cy + (py - cy) * 0.5 - 0.02 * k, em, { alpha });   // the radius is 1
      pen.label(EXTRA.M33[1], cx + r + 0.04, (cy + py) / 2, em, { alpha, ax: 0 });                          // beside the vertical leg, outside the circle
      pen.label(EXTRA.M33[2], (cx + px) / 2, cy + 0.1 * k, em, { alpha });                                  // under the horizontal leg
      caption(pen, LABELS.M33);
    },
    check: () => within(Math.sin(0.7) ** 2 + Math.cos(0.7) ** 2, 1, 1e-12),
  },
  {
    id: 'M34', tier: 'B', family: 'TRIG',
    draw(pen) {
      const f = frame(pen, 0, TWO_PI, -1.15, 1.15);
      pen.style(pen.ink(1), 1.6);
      graph(pen, f, Math.sin, 0, TWO_PI, pen.t, 48);
      pen.style(pen.ink(0), 2.6);
      graph(pen, f, (x) => Math.sin(2 * x), 0, TWO_PI, pen.t, 56);
      caption(pen, LABELS.M34);
    },
    check: () => within(Math.sin(2 * 0.7), 2 * Math.sin(0.7) * Math.cos(0.7), 1e-12),
  },
  {
    id: 'M35', tier: 'B', family: 'TRIG',
    draw(pen) {
      const f = frame(pen, -1.8, 1.8, -3.4, 3.4), edge = Math.atan(3);
      pen.style(pen.ink(2), 1.3, 0.5);
      pen.dash(f.ux(-Math.PI / 2), f.wy(-3.3), f.ux(-Math.PI / 2), f.wy(3.3));
      pen.dash(f.ux(Math.PI / 2), f.wy(-3.3), f.ux(Math.PI / 2), f.wy(3.3));
      pen.style(pen.ink(0), 2.6);
      graph(pen, f, Math.tan, -edge, edge, pen.t, 44);   // one branch, clipped to ±3 where it climbs
      caption(pen, LABELS.M35);
    },
    check: () => within(Math.tan(0.5), Math.sin(0.5) / Math.cos(0.5), 1e-12),
  },
  {
    id: 'M36', tier: 'B', family: 'TRIG',
    draw(pen) {
      const f = frame(pen, 0, TWO_PI, -1.15, 1.15);
      pen.style(pen.ink(0), 2.6);
      graph(pen, f, Math.sin, 0, TWO_PI, pen.t, 48);
      pen.style(pen.ink(1), 2.2);
      graph(pen, f, Math.cos, 0, TWO_PI, pen.t, 48, true);
      caption(pen, LABELS.M36);
    },
    check: () => within(nd(Math.sin, 0.9), Math.cos(0.9), 1e-6),
  },

  // ---------------------------------------------------------------- EXP: M37-M41
  {
    id: 'M37', tier: 'B', family: 'EXP',
    draw(pen) {
      const f = frame(pen, -2, 1.6, -0.5, 5.3);
      pen.style(pen.ink(0), 2.6);
      graph(pen, f, Math.exp, -2, 1.6, pen.t, 44);
      const a = comesIn(pen);
      if (a > 0) tangent(pen, f, Math.exp(0), Math.exp(0), 0, -1.2, 1.2, a);
      caption(pen, LABELS.M37);
    },
    check: () => within(nd(Math.exp, 0.4), Math.exp(0.4), 1e-6) && Math.exp(0) === 1,
  },
  {
    id: 'M38', tier: 'B', family: 'EXP',
    draw(pen) {
      const f = frame(pen, 0, 5, -2.1, 1.9);
      pen.style(pen.ink(0), 2.6);
      graph(pen, f, Math.log, 0.15, 5, pen.t, 44);
      const a = comesIn(pen);
      if (a > 0) tangent(pen, f, Math.log(1), 1 / 1, 1, 0.3, 2.4, a);
      caption(pen, LABELS.M38);
    },
    check: () => within(nd(Math.log, 2), 0.5, 1e-6) && Math.log(1) === 0,
  },
  {
    id: 'M39', tier: 'B', family: 'EXP',
    draw: (pen) => formula(pen, LABELS.M39, EXTRA.M39[0]),
    check: () => 2 ** 3 * 2 ** 4 === 2 ** 7 && (2 ** 3) ** 4 === 2 ** 12,
  },
  {
    id: 'M40', tier: 'B', family: 'EXP',
    draw: (pen) => formula(pen, LABELS.M40, EXTRA.M40[0], EXTRA.M40[1]),
    check: () => within(Math.log(2 * 3), Math.log(2) + Math.log(3), 1e-12) && within(Math.log(2 ** 5), 5 * Math.log(2), 1e-12),
  },
  {
    id: 'M41', tier: 'B', family: 'EXP',
    draw: (pen) => formula(pen, LABELS.M41),
    check: () => within((1 + 1e-6) ** 1e6, Math.E, 1e-5),
  },

  // ---------------------------------------------------------------- ABS: M42-M44
  {
    id: 'M42', tier: 'B', family: 'ABS',
    draw(pen) {
      const f = frame(pen, -4.2, 4.2, -4, 4), recip = (x: number) => evalTerm(inverse, x);
      pen.style(pen.ink(0), 2.6);
      graph(pen, f, recip, -4, -0.28, pen.t, 36);   // one call per branch, never joined across the pole
      graph(pen, f, recip, 0.28, 4, pen.t, 36);
      caption(pen, LABELS.M42);
    },
    check: () => 1 / 2 === 0.5 && 1 / -2 === -0.5,
  },
  {
    id: 'M43', tier: 'B', family: 'ABS',
    draw(pen) {
      const f = frame(pen, -3.2, 3.2, -0.4, 3.4);
      pen.style(pen.ink(1), 2.6);
      graph(pen, f, (x) => -x, -3, 0, clamp(pen.t / 0.5, 0, 1), 12);
      pen.style(pen.ink(0), 2.6);
      graph(pen, f, (x) => x, 0, 3, clamp((pen.t - 0.5) / 0.5, 0, 1), 12);
      if (comesIn(pen) > 0) { pen.style(pen.ink(2), 1.8, comesIn(pen)); pen.dot(f.ux(0), f.wy(0), 3.6); }
      pen.label(LABELS.M43, 0, -0.8, 0.12, { alpha: labelAlpha(pen) });   // two lines in the label band: smaller, and apart enough not to touch
      pen.label(EXTRA.M43[0], 0, -0.52, 0.12, { alpha: labelAlpha(pen) });
    },
    check: () => Math.abs(-3) === 3 && Math.abs(3) === 3,
  },
  {
    id: 'M44', tier: 'B', family: 'ABS',
    draw(pen) {
      const f = frame(pen, -1.8, 1.8, -1.3, 2.4);
      pen.style(pen.ink(2), 1.8);
      graph(pen, f, (x) => x * x - 1, -1.8, 1.8, pen.t, 44, true);
      pen.style(pen.ink(0), 2.6);
      graph(pen, f, (x) => Math.abs(x * x - 1), -1.8, 1.8, pen.t, 56);
      caption(pen, LABELS.M44);
    },
    check: () => Math.abs(0 - 1) === 1 && Math.abs(4 - 1) === 3 && Math.abs(1 - 1) === 0,
  },

  // ---------------------------------------------------------------- GEO: M45-M47
  {
    id: 'M45', tier: 'B', family: 'GEO',
    draw(pen) {
      const k = pen.aspect, r = Math.min(0.46, 0.62 / k), cy = 0.18, ang = (35 * Math.PI) / 180;
      pen.style(pen.ink(0), 2.6);
      pen.para((s) => r * Math.cos(s), (s) => cy - r * k * Math.sin(s), 0, TWO_PI, pen.t, 48);
      const a = comesIn(pen);
      if (a > 0) { pen.style(pen.ink(1), 2, a); pen.seg(0, cy, r * Math.cos(ang), cy - r * k * Math.sin(ang)); }
      small(pen, EXTRA.M45[0], r * 0.5 * Math.cos(ang) - 0.02, cy - r * 0.5 * k * Math.sin(ang) - 0.1 * k);
      caption(pen, LABELS.M45);
    },
    // the parametrisation (r cos s, r sin s) satisfies x² + y² = r² (r = 3 here)
    check: () => within((3 * Math.cos(0.9)) ** 2 + (3 * Math.sin(0.9)) ** 2, 3 ** 2, 1e-12),
  },
  {
    id: 'M46', tier: 'B', family: 'GEO',
    draw(pen) {
      const k = pen.aspect, a = 0.62, b = a / 2, cy = 0.14;
      pen.style(pen.ink(0), 2.6);
      pen.para((s) => a * Math.cos(s), (s) => cy - b * k * Math.sin(s), 0, TWO_PI, pen.t, 48);
      const t = comesIn(pen);
      if (t > 0) {
        pen.style(pen.ink(1), 1.8, t);
        pen.seg(0, cy, a, cy);
        pen.seg(0, cy, 0, cy - b * k);
      }
      small(pen, EXTRA.M46[0], a / 2, cy + 0.1 * k);
      small(pen, EXTRA.M46[1], 0.08, cy - (b * k) / 2, { ax: 0 });
      caption(pen, LABELS.M46);
    },
    check: () => { const x = 2 * Math.cos(1.1), y = Math.sin(1.1); return within(x * x / 4 + y * y, 1, 1e-12); },
  },
  {
    id: 'M47', tier: 'B', family: 'GEO',
    draw(pen) {
      const f = frame(pen, -0.3, 5.2, -0.4, 6, false);
      const t = pen.t, p1 = { x: 1, y: 1 }, p2 = { x: 4, y: 5 };
      pen.style(pen.ink(1), 1.6, 0.9);
      if (t > 0.3) { pen.dash(f.ux(p1.x), f.wy(p1.y), f.ux(p2.x), f.wy(p1.y)); pen.dash(f.ux(p2.x), f.wy(p1.y), f.ux(p2.x), f.wy(p2.y)); }
      pen.style(pen.ink(0), 2.6);
      pen.seg(f.ux(p1.x), f.wy(p1.y), f.ux(p1.x + (p2.x - p1.x) * clamp(t / 0.5, 0, 1)), f.wy(p1.y + (p2.y - p1.y) * clamp(t / 0.5, 0, 1)));
      pen.dot(f.ux(p1.x), f.wy(p1.y), 3.6);
      if (t > 0.5) pen.dot(f.ux(p2.x), f.wy(p2.y), 3.6);
      caption(pen, LABELS.M47);
    },
    check: () => Math.sqrt((4 - 1) ** 2 + (5 - 1) ** 2) === 5,
  },

  // ---------------------------------------------------------------- SER: M48-M51
  {
    id: 'M48', tier: 'B', family: 'SER',
    draw(pen) {
      const f = frame(pen, -9.5, 9.5, -0.4, 1.25), sinc = (x: number) => Math.sin(x) / x;
      pen.style(pen.ink(0), 2.6);
      graph(pen, f, sinc, -9, -0.05, clamp(pen.t / 0.5, 0, 1), 40);   // not defined at 0: two branches up to ±0.05
      graph(pen, f, sinc, 0.05, 9, clamp((pen.t - 0.5) / 0.5, 0, 1), 40);
      if (comesIn(pen) > 0) { pen.style(pen.ink(1), 1.8, comesIn(pen)); pen.dot(f.ux(0), f.wy(1), 3.8, false); }
      caption(pen, LABELS.M48);
    },
    check: () => Math.abs(Math.sin(1e-6) / 1e-6 - 1) < 1e-9,
  },
  {
    id: 'M49', tier: 'B', family: 'SER',
    draw(pen) {
      const k = pen.aspect, s = Math.min(0.24, 1.0 / (5 * k)), u0 = -2.5 * s, base = 0.74;
      const shown = Math.ceil(5 * Math.min(1, pen.t * 1.4));
      pen.style(pen.ink(1), 1.4, 0.9);
      for (let col = 0; col < shown; col++) for (let row = 0; row <= col; row++) pen.quad(u0 + col * s, base - (row + 1) * s * k, u0 + (col + 1) * s, base - row * s * k, 0.2);
      caption(pen, LABELS.M49);
    },
    check: () => 1 + 2 + 3 + 4 + 5 === (5 * 6) / 2 && 5050 === (100 * 101) / 2,
  },
  {
    id: 'M50', tier: 'B', family: 'SER',
    draw: (pen) => formula(pen, LABELS.M50, undefined, EXTRA.M50[0]),
    check: () => { const a1 = 1, q = 2, n = 10; let sum = 0; for (let i = 0; i < n; i++) sum += a1 * q ** i; return (a1 * (q ** n - 1)) / (q - 1) === 1023 && sum === 1023; },
  },
  {
    id: 'M51', tier: 'B', family: 'SER',
    draw(pen) {
      const f = frame(pen, 0, 5.6, 0, 2.3);
      const running = (x: number) => 2 - 2 * 0.5 ** Math.min(5, Math.floor(x) + 1);   // S_1 .. S_5 as a staircase: 1, 3/2, 7/4, ...
      const shown = Math.ceil(5 * Math.min(1, pen.t * 1.4));
      pen.style(pen.ink(1), 1.2, 0.9);
      for (let i = 0; i < shown; i++) pen.quad(f.ux(i), f.wy(0), f.ux(i + 1), f.wy(0.5 ** i), 0.22);
      pen.style(pen.ink(2), 1.5, 0.8);
      pen.dash(f.ux(0), f.wy(2), f.ux(5.4), f.wy(2));
      pen.style(pen.ink(0), 1.6);
      graph(pen, f, running, 0, 4.999, sweep(pen.t, 0.3), 56);
      small(pen, EXTRA.M51[0], f.ux(3.7), f.wy(1.1));
      caption(pen, LABELS.M51);
    },
    check: () => { let s = 0; for (let k = 0; k < 60; k++) s += 0.5 ** k; return within(s, 2, 1e-9); },
  },
];

const catalog: Payload[] = rows.map((r) => ({ ...r, family: r.family! }));
const order = (id: string) => Number(id.slice(1));
/** The shipped catalog, in spec order (M35 is held back: see TAN_NOTATION_CONFIRMED). */
export const PAYLOADS: Payload[] = catalog
  .filter((p) => p.id !== 'M35' || TAN_NOTATION_CONFIRMED)
  .sort((a, b) => order(a.id) - order(b.id));
/** Every payload that is written, shipped or not. */
export const ALL_PAYLOADS: Payload[] = [...catalog].sort((a, b) => order(a.id) - order(b.id));
