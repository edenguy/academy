import { describe, expect, it } from 'vitest';
import { CURVES, averageRateOfChange } from '@/math/derivative';
import { FUNCTIONS, powerIntegral, riemannSum } from '@/math/integral';
import { ALL_PAYLOADS, EXTRA, LABELS, PAYLOADS, TAN_NOTATION_CONFIRMED, secantX2, slideX, tangentX } from './payloads';
import type { Pen } from './engine';

/** BACKGROUND_LLD.md §10.1 (M1-M11) and R7.3 (M12-M51), in order. */
const SPEC_IDS = Array.from({ length: 51 }, (_, i) => `M${i + 1}`);
/** The label column of §10.1 and R7.3, character for character (U+2032 prime, U+2033, U+2212 minus, U+00B7 middle dot, U+2026). A second source of truth on purpose. */
const SPEC_LABELS: Record<string, string> = {
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
};
/** Second lines, conditions and small labels of R7.3, in the order they are drawn. */
const SPEC_EXTRA: Record<string, string[]> = {
  M13: ['a', 'b'], M14: ['n ≠ −1'], M24: ['f′ > 0', 'f′ < 0', 'f′ > 0'], M28: ['ax^{2} + bx + c = 0', 'a ≠ 0'], M30: ['a', 'b'], M31: ['Δx', 'Δy'],
  M33: ['1', 'sin x', 'cos x'], M35: [], M39: ['(a^{m})^{n} = a^{mn}'], M40: ['log(a^{n}) = n·log a', 'a, b > 0'], M43: ['|x| = −x  (x < 0)'],
  M45: ['r'], M46: ['a', 'b'], M50: ['q ≠ 1'], M51: ['|q| < 1'],
};
/** The payloads with no drawing: a formula, and up to two more lines. */
const FORMULAS = ['M14', 'M17', 'M19', 'M20', 'M21', 'M28', 'M29', 'M39', 'M40', 'M41', 'M50'];
/** Tier A is the lessons' own formulas and numbers (14); the rest is textbook. */
const TIER_A = ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9', 'M10', 'M12', 'M18', 'M22', 'M24'];

describe('Math paper catalog (BACKGROUND_LLD.md §10.1 and R7.3)', () => {
  it('writes exactly the 51 payloads of the spec, and ships them all but M35 until its notation is confirmed', () => {
    expect(ALL_PAYLOADS.map((p) => p.id)).toEqual(SPEC_IDS);
    expect(PAYLOADS.map((p) => p.id)).toEqual(TAN_NOTATION_CONFIRMED ? SPEC_IDS : SPEC_IDS.filter((id) => id !== 'M35'));
    expect(PAYLOADS.length).toBeGreaterThanOrEqual(50);
  });

  it('check() passes for every payload, shipped or not', () => {
    for (const p of ALL_PAYLOADS) expect(p.check(), p.id).toBe(true);
  });

  it('every payload has a family; the families are the spec\'s nine and none holds more than a third', () => {
    const count = new Map<string, number>();
    for (const p of ALL_PAYLOADS) { expect(p.family, p.id).toBeTruthy(); count.set(p.family, (count.get(p.family) ?? 0) + 1); }
    expect(Object.fromEntries(count)).toEqual({ INT: 9, DER: 12, EXT: 4, ALG: 5, TRIG: 6, EXP: 5, ABS: 3, GEO: 3, SER: 4 });
    for (const [family, n] of count) expect(n, family).toBeLessThanOrEqual(ALL_PAYLOADS.length / 3);
    const shipped = new Map<string, number>();
    for (const p of PAYLOADS) shipped.set(p.family, (shipped.get(p.family) ?? 0) + 1);
    for (const [family, n] of shipped) expect(n, family).toBeLessThanOrEqual(PAYLOADS.length / 3);
  });

  it('tier A is exactly the 14 payloads whose facts are in the lessons', () => {
    expect(ALL_PAYLOADS.filter((p) => p.tier === 'A').map((p) => p.id)).toEqual(TIER_A);
  });

  it('label markup matches the spec character for character', () => {
    expect({ ...LABELS }).toEqual(SPEC_LABELS);
    expect(JSON.parse(JSON.stringify(EXTRA))).toEqual(SPEC_EXTRA);
  });

  it('a label is at most 36 characters once the markup is removed (R7.1 rule 7)', () => {
    const all = [...Object.values(LABELS), ...Object.values(EXTRA).flat()];
    for (const markup of all) expect(markup.replace(/[\^_~]\{|\}/g, '').length, markup).toBeLessThanOrEqual(36);
  });

  it('labels carry no Hebrew or English words (D9): only function names, dx and products of letters', () => {
    const allowed = ['dx', 'sin', 'cos', 'tan', 'lim', 'ln', 'log', 'ab', 'ac', 'bx', 'ax', 'mx'];
    for (const markup of [...Object.values(LABELS), ...Object.values(EXTRA).flat()]) {
      const stripped = markup.replace(/[\^_~]\{[^}]*\}/g, ' ');
      expect(/[֐-׿]/.test(markup)).toBe(false);
      for (const w of stripped.match(/[A-Za-z]{2,}/g) ?? []) expect(allowed, `${w} in ${markup}`).toContain(w);
    }
  });

  it('every number a label states follows from the lessons\' own functions, or from the maths itself', () => {
    expect(powerIntegral(2, 0, 3)).toBe(9); // M1 "= 9"
    expect(powerIntegral(1, 0, 6)).toBe(18); // M2 "= 18"
    expect(powerIntegral(2, 0, 4)).toBeCloseTo(64 / 3, 12); // M3 "= 64/3" (21.33 in the lesson)
    expect(riemannSum(FUNCTIONS.parabola.fn, 0, 4, 4, 'midpoint')).toBe(21); // the four bars of M3
    expect(powerIntegral(3, 0, 2)).toBe(4); // M4: b^{n+1}/(n+1) with n = 3, b = 2
    expect(averageRateOfChange(CURVES.quadratic, 2, 4)).toBe(3); // M5: Δy/Δx = (8 − 2) / 2
    for (const x of [1, 2.5, 4]) { // M6: (½x²)′ = x, against a central difference rather than against itself
      const h = 1e-6;
      expect((CURVES.quadratic.fn(x + h) - CURVES.quadratic.fn(x - h)) / (2 * h)).toBeCloseTo(CURVES.quadratic.derivative(x), 6);
    }
    for (const e of CURVES.cubicWave.extrema ?? []) expect(CURVES.cubicWave.derivative(e.x)).toBe(0); // M9
    expect(CURVES.cubicWave.extrema?.map((e) => e.x)).toEqual([-1, 1]);
    // M12: the left sum of x² on [0, 3] with 6 bars is 6.875, the right sum 11.375, the integral 9 between them
    expect(riemannSum(FUNCTIONS.parabola.fn, 0, 3, 6, 'left')).toBeCloseTo(6.875, 12);
    expect(riemannSum(FUNCTIONS.parabola.fn, 0, 3, 6, 'right')).toBeCloseTo(11.375, 12);
    expect(powerIntegral(2, 1, 3)).toBeCloseTo(26 / 3, 12); // M13: F(3) − F(1) with F = x³/3
    expect(powerIntegral(1, 0, 1) - powerIntegral(2, 0, 1)).toBeCloseTo(1 / 6, 12); // M15: ½ − ⅓
    expect(powerIntegral(3, -1, 1)).toBe(0); // M16: an odd function over a symmetric interval
    // M18: (3f)′ = 3 f′, at x = 1 for f = ½x²: slope 3 against slope 1
    expect(3 * CURVES.quadratic.derivative(1)).toBe(3);
    // M26 / M27: x² − 4x + 3 has its vertex at (2, −1) and roots 1 and 3, found here by the quadratic formula of M28
    const roots = [(4 + Math.sqrt(16 - 12)) / 2, (4 - Math.sqrt(16 - 12)) / 2];
    expect(roots).toEqual([3, 1]);
    for (const x of [-2, 0, 0.5, 5]) expect(x * x - 4 * x + 3).toBeCloseTo((x - 1) * (x - 3), 12);
    for (const [a, b] of [[7, 3], [2.5, 1.5]] as const) { // M29, M30
      expect(a * a - b * b).toBeCloseTo((a - b) * (a + b), 12);
      expect((a + b) ** 2).toBeCloseTo(a * a + 2 * a * b + b * b, 12);
    }
    expect(Math.atan(3)).toBeLessThan(Math.PI / 2); // M35: the clip at ±3 is inside the asymptotes
    expect(1 + 1 / 2 + 1 / 4 + 1 / 8 + 1 / 16).toBe(1.9375); // M51: the five bars' running total, below the limit 2
    for (let n = 1; n <= 10; n++) expect(((2 ** n - 1) / (2 - 1))).toBe(Array.from({ length: n }, (_, k) => 2 ** k).reduce((a, b) => a + b, 0)); // M50 with a₁ = 1, q = 2
  });
});

describe('sliding points (pen.now)', () => {
  it('the still frame (now = 9) shows x₂ = 4, the tangent at x = 2.5 and the tangent to x² at x = 1', () => {
    expect(secantX2(9)).toBeCloseTo(4, 12);
    expect(tangentX(9)).toBeCloseTo(2.5, 12);
    expect(slideX(9)).toBeCloseTo(1, 12);
  });
  it('they stay in their ranges and are slow', () => {
    let prevA = secantX2(0), prevB = tangentX(0), prevC = slideX(0);
    for (let s = 0.1; s <= 120; s += 0.1) {
      const a = secantX2(s), b = tangentX(s), c = slideX(s);
      expect(a).toBeGreaterThanOrEqual(2.3 - 1e-9); expect(a).toBeLessThanOrEqual(4 + 1e-9);
      expect(b).toBeGreaterThanOrEqual(1 - 1e-9); expect(b).toBeLessThanOrEqual(4 + 1e-9);
      expect(Math.abs(c)).toBeLessThanOrEqual(1.5 + 1e-9);
      expect(Math.abs(a - prevA) / 0.1).toBeLessThan(0.5); // under half a unit per second on a 5-unit axis
      expect(Math.abs(b - prevB) / 0.1).toBeLessThan(0.5);
      expect(Math.abs(c - prevC) / 0.1).toBeLessThan(0.5);
      prevA = a; prevB = b; prevC = c;
    }
  });
});

interface Recording { calls: string[]; points: number; labels: number; coords: number[]; quads: number[][]; paras: number[][]; labelsAt: { markup: string; u: number; w: number }[] }
/** A pen that records what a payload draws, so its geometry and budget can be checked without a canvas. */
function recorder(t: number, now: number, aspect = 1.4) {
  const rec: Recording = { calls: [], points: 0, labels: 0, coords: [], quads: [], paras: [], labelsAt: [] };
  const pts = (...c: number[]) => rec.coords.push(...c);
  const pen: Pen = {
    t, now, still: now === 9 && t === 1, text: '#000', aspect,
    ink: (i) => `ink${i}`,
    style: () => {},
    curve(fn, u0, u1, part = 1, steps = 56) {
      if (part <= 0) return;
      rec.calls.push('curve');
      const m = Math.max(2, Math.ceil(Math.min(steps, 56) * part));
      rec.points += m + 1;
      for (let j = 0; j <= m; j++) { const u = u0 + ((u1 - u0) * part * j) / m; pts(u, fn(u)); }
    },
    para(fu, fw, s0, s1, part = 1, steps = 56) {
      if (part <= 0) return;
      rec.calls.push('para');
      const m = Math.max(2, Math.ceil(Math.min(steps, 56) * part)), mine: number[] = [];
      rec.points += m + 1;
      for (let j = 0; j <= m; j++) { const s = s0 + ((s1 - s0) * part * j) / m; pts(fu(s), fw(s)); mine.push(fu(s), fw(s)); }
      rec.paras.push(mine);
    },
    seg(a, b, c, d) { rec.calls.push('seg'); rec.points += 9; pts(a, b, c, d); },
    dash(a, b, c, d) { rec.calls.push('dash'); rec.points += 9; pts(a, b, c, d); },
    arrow(a, b, c, d) { rec.calls.push('arrow'); rec.points += 9; pts(a, b, c, d); },
    quad(a, b, c, d) { rec.calls.push('quad'); rec.points += 8; pts(a, b, c, d); rec.quads.push([a, b, c, d]); },
    area(fn, u0, u1, base) {
      rec.calls.push('area');
      rec.points += typeof base === 'function' ? 58 : 34;
      pts(u0, u1);
      for (let j = 0; j <= 28; j++) { const u = u0 + ((u1 - u0) * j) / 28; pts(fn(u)); if (typeof base === 'function') pts(base(u)); }
      if (typeof base === 'number') pts(base);
    },
    dot(u, w) { rec.calls.push('dot'); rec.points += 1; pts(u, w); },
    disc(u, w) { rec.calls.push('disc'); rec.points += 1; pts(u, w); },
    arc(u, w) { rec.calls.push('arc'); rec.points += 13; pts(u, w); },
    label(markup, u, w, em) { rec.calls.push('label'); rec.labels++; rec.labelsAt.push({ markup, u, w }); expect(markup.length).toBeGreaterThan(0); pts(u, w); expect(em).toBeGreaterThan(0); },
  };
  return { pen, rec };
}

describe('every payload, drawn through a recording pen', () => {
  const frames: [number, number][] = [[0, 0], [0.2, 3], [0.45, 5], [0.7, 8], [1, 9], [1, 20], [1, 77.3]];
  for (const p of ALL_PAYLOADS) {
    it(`${p.id}: stays on its napkin (any shape), finite, inside the R7.2 budget of 220 points, 16 calls, 4 labels`, () => {
      for (const aspect of [1.22, 1.4, 1.61]) {
        for (const [t, now] of frames) {
          const { pen, rec } = recorder(t, now, aspect);
          p.draw(pen);
          for (const c of rec.coords) {
            expect(Number.isFinite(c), `${p.id} t=${t} now=${now}`).toBe(true);
            expect(Math.abs(c), `${p.id} t=${t} now=${now} aspect=${aspect}: ${c}`).toBeLessThanOrEqual(1);
          }
          expect(rec.points).toBeLessThanOrEqual(220);
          expect(rec.calls.filter((c) => c !== 'label').length).toBeLessThanOrEqual(16);
          expect(rec.labels).toBeLessThanOrEqual(4);
          for (const l of rec.labelsAt) { expect(Math.abs(l.u), `${p.id} ${l.markup}`).toBeLessThanOrEqual(0.8); expect(Math.abs(l.w), `${p.id} ${l.markup}`).toBeLessThanOrEqual(0.8); }
        }
      }
    });

    it(`${p.id}: draws the same picture for the same pen.t and pen.now (pure)`, () => {
      const a = recorder(1, 9), b = recorder(1, 9);
      p.draw(a.pen); p.draw(b.pen);
      expect(a.rec.coords).toEqual(b.rec.coords);
      expect(a.rec.calls).toEqual(b.rec.calls);
    });

    it(`${p.id}: a still frame is complete and draws every string the spec lists for it`, () => {
      const { pen, rec } = recorder(1, 9);
      p.draw(pen);
      const wanted = [...(LABELS[p.id as keyof typeof LABELS] ? [LABELS[p.id as keyof typeof LABELS]] : []), ...(EXTRA[p.id as keyof typeof EXTRA] ?? [])];
      expect(rec.labelsAt.map((l) => l.markup).sort()).toEqual([...wanted].sort());
      if (!FORMULAS.includes(p.id)) expect(rec.calls.some((c) => c !== 'label'), p.id).toBe(true);
    });
  }

  it('a formula napkin draws no graph: only labels', () => {
    for (const id of FORMULAS) {
      const { pen, rec } = recorder(1, 9);
      ALL_PAYLOADS.find((p) => p.id === id)!.draw(pen);
      expect(rec.calls.every((c) => c === 'label'), id).toBe(true);
    }
  });

  it('M1 draws its six bars in one at a time; M3 its four; M12 its twice six (the first left bar is flat)', () => {
    const count = (id: string, t: number) => { const { pen, rec } = recorder(t, 9); ALL_PAYLOADS.find((p) => p.id === id)!.draw(pen); return rec.calls.filter((c) => c === 'quad').length; };
    expect(count('M1', 0)).toBe(0);
    expect(count('M1', 0.5)).toBeGreaterThan(0);
    expect(count('M1', 0.5)).toBeLessThan(6);
    expect(count('M1', 1)).toBe(6);
    expect(count('M3', 1)).toBe(4);
    expect(count('M12', 1)).toBe(11);
    expect(count('M49', 1)).toBe(15);
    expect(count('M51', 1)).toBe(5);
  });

  it('M30 draws its squares square whatever the napkin: width in u equals height in w divided by the aspect', () => {
    for (const aspect of [1.22, 1.4, 1.61]) {
      const { pen, rec } = recorder(1, 9, aspect);
      ALL_PAYLOADS.find((p) => p.id === 'M30')!.draw(pen);
      const [a2, b2] = rec.quads;
      for (const [u0, w0, u1, w1] of [a2!, b2!]) expect((w1! - w0!) / aspect).toBeCloseTo(u1! - u0!, 12);
      // a : b = 3 : 2, so a² is 9/4 of b² in area
      expect(((a2![2]! - a2![0]!) * (a2![3]! - a2![1]!)) / ((b2![2]! - b2![0]!) * (b2![3]! - b2![1]!))).toBeCloseTo(9 / 4, 12);
    }
  });

  it('M49 draws unit squares: every cell is as wide as it is high on the paper', () => {
    for (const aspect of [1.22, 1.61]) {
      const { pen, rec } = recorder(1, 9, aspect);
      ALL_PAYLOADS.find((p) => p.id === 'M49')!.draw(pen);
      for (const [u0, w0, u1, w1] of rec.quads) expect(Math.abs(w0! - w1!) / aspect).toBeCloseTo(u1! - u0!, 12);
    }
  });

  it('M33 and M45 draw circles, M46 an ellipse 2 : 1, on the paper whatever its shape', () => {
    for (const aspect of [1.22, 1.61]) {
      for (const id of ['M33', 'M45']) {
        const { pen, rec } = recorder(1, 9, aspect);
        ALL_PAYLOADS.find((p) => p.id === id)!.draw(pen);
        const pts = rec.paras[0]!;
        const cu = (Math.max(...pts.filter((_, i) => i % 2 === 0)) + Math.min(...pts.filter((_, i) => i % 2 === 0))) / 2;
        const cw = (Math.max(...pts.filter((_, i) => i % 2 === 1)) + Math.min(...pts.filter((_, i) => i % 2 === 1))) / 2;
        const radii = [];
        for (let i = 0; i < pts.length; i += 2) radii.push(Math.hypot(pts[i]! - cu, (pts[i + 1]! - cw) / aspect));
        expect(Math.max(...radii) - Math.min(...radii), `${id} @${aspect}`).toBeLessThan(0.01);
      }
      const { pen, rec } = recorder(1, 9, aspect);
      ALL_PAYLOADS.find((p) => p.id === 'M46')!.draw(pen);
      const pts = rec.paras[0]!, us = pts.filter((_, i) => i % 2 === 0), ws = pts.filter((_, i) => i % 2 === 1);
      expect((Math.max(...us) - Math.min(...us)) / ((Math.max(...ws) - Math.min(...ws)) / aspect)).toBeCloseTo(2, 1);
    }
  });

  it('M15 fills between two curves: the baseline is the lower curve, not a line', () => {
    const { pen, rec } = recorder(1, 9);
    ALL_PAYLOADS.find((p) => p.id === 'M15')!.draw(pen);
    expect(rec.calls).toContain('area');
  });
});
