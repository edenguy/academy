import { describe, expect, it } from 'vitest';
import { CURVES, averageRateOfChange } from '@/math/derivative';
import { FUNCTIONS, powerIntegral, riemannSum } from '@/math/integral';
import { LABELS, PAYLOADS, secantX2, tangentX } from './payloads';
import type { Pen } from './engine';

/** BACKGROUND_LLD.md §10.1, in order. */
const SPEC_IDS = ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9', 'M10', 'M11'];
/** §10.1's label column, character for character (U+2032 prime, U+2212 minus, U+00B7 middle dot). */
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
};

describe('Math paper catalog (BACKGROUND_LLD.md §10.1)', () => {
  it('has exactly the payloads of §10.1, in order', () => {
    expect(PAYLOADS.map((p) => p.id)).toEqual(SPEC_IDS);
  });

  it('check() passes for every payload', () => {
    for (const p of PAYLOADS) expect(p.check(), p.id).toBe(true);
  });

  it('only M11 is tier B', () => {
    expect(PAYLOADS.filter((p) => p.tier === 'B').map((p) => p.id)).toEqual(['M11']);
  });

  it('label markup matches the spec character for character', () => {
    expect({ ...LABELS }).toEqual(SPEC_LABELS);
  });

  it('labels carry no Hebrew or English words (D9)', () => {
    for (const markup of Object.values(LABELS)) {
      const stripped = markup.replace(/[\^_~]\{[^}]*\}/g, ' ');
      expect(/[֐-׿]/.test(stripped)).toBe(false);
      // single-letter variables and the function name "sin" are the only Latin words
      const words = stripped.match(/[A-Za-z]{2,}/g) ?? [];
      for (const w of words) expect(['dx', 'sin']).toContain(w);
    }
  });

  it('every number a label states follows from the lessons\' own functions', () => {
    expect(powerIntegral(2, 0, 3)).toBe(9); // M1 "= 9"
    expect(powerIntegral(1, 0, 6)).toBe(18); // M2 "= 18"
    expect(powerIntegral(2, 0, 4)).toBeCloseTo(64 / 3, 12); // M3 "= 64/3" (21.33 in the lesson)
    expect(riemannSum(FUNCTIONS.parabola.fn, 0, 4, 4, 'midpoint')).toBe(21); // the four bars of M3
    expect(powerIntegral(3, 0, 2)).toBe(4); // M4: b^{n+1}/(n+1) with n = 3, b = 2
    expect(averageRateOfChange(CURVES.quadratic, 2, 4)).toBe(3); // M5: Δy/Δx = (8 − 2) / 2
    // M6: (½x²)′ = x, cross-checked against a central difference rather than against itself
    for (const x of [1, 2.5, 4]) {
      const h = 1e-6;
      expect((CURVES.quadratic.fn(x + h) - CURVES.quadratic.fn(x - h)) / (2 * h)).toBeCloseTo(CURVES.quadratic.derivative(x), 6);
    }
    // M9: the derivative of x³ − 3x is 3x² − 3, zero at the two marked extrema
    for (const e of CURVES.cubicWave.extrema ?? []) expect(CURVES.cubicWave.derivative(e.x)).toBe(0);
    expect(CURVES.cubicWave.extrema?.map((e) => e.x)).toEqual([-1, 1]);
  });
});

describe('sliding points (pen.now)', () => {
  it('the still frame (now = 9) shows x₂ = 4 and the tangent at x = 2.5', () => {
    expect(secantX2(9)).toBeCloseTo(4, 12);
    expect(tangentX(9)).toBeCloseTo(2.5, 12);
  });
  it('x₂ stays within [2.3, 4] and the tangent within [1, 4], and both are slow', () => {
    let prevA = secantX2(0), prevB = tangentX(0);
    for (let s = 0.1; s <= 120; s += 0.1) {
      const a = secantX2(s), b = tangentX(s);
      expect(a).toBeGreaterThanOrEqual(2.3 - 1e-9); expect(a).toBeLessThanOrEqual(4 + 1e-9);
      expect(b).toBeGreaterThanOrEqual(1 - 1e-9); expect(b).toBeLessThanOrEqual(4 + 1e-9);
      expect(Math.abs(a - prevA) / 0.1).toBeLessThan(0.5); // under half a unit per second on a 5-unit axis
      expect(Math.abs(b - prevB) / 0.1).toBeLessThan(0.5);
      prevA = a; prevB = b;
    }
  });
});

/** A pen that records what a payload draws, so its geometry and budget can be checked without a canvas. */
function recorder(t: number, now: number) {
  const rec = { calls: [] as string[], points: 0, labels: 0, coords: [] as number[], lastWidth: 0 };
  const pts = (...c: number[]) => rec.coords.push(...c);
  const pen: Pen = {
    t, now, still: now === 9 && t === 1, text: '#000',
    ink: (i) => `ink${i}`,
    style: (_c, w) => { rec.lastWidth = w; },
    curve(fn, u0, u1, part = 1, steps = 56) {
      rec.calls.push('curve');
      const m = Math.max(2, Math.ceil(Math.min(steps, 56) * part));
      if (part <= 0) { rec.calls.pop(); return; }
      rec.points += m + 1;
      for (let j = 0; j <= m; j++) { const u = u0 + ((u1 - u0) * part * j) / m; pts(u, fn(u)); }
    },
    seg(a, b, c, d) { rec.calls.push('seg'); rec.points += 6; pts(a, b, c, d); },
    dash(a, b, c, d) { rec.calls.push('dash'); rec.points += 6; pts(a, b, c, d); },
    arrow(a, b, c, d) { rec.calls.push('arrow'); rec.points += 6; pts(a, b, c, d); },
    quad(a, b, c, d) { rec.calls.push('quad'); rec.points += 8; pts(a, b, c, d); },
    area(fn, u0, u1, wBase) { rec.calls.push('area'); rec.points += 34; pts(u0, u1, wBase); for (let j = 0; j <= 28; j++) pts(fn(u0 + ((u1 - u0) * j) / 28)); },
    dot(u, w) { rec.calls.push('dot'); rec.points += 1; pts(u, w); },
    disc(u, w) { rec.calls.push('disc'); rec.points += 1; pts(u, w); },
    arc(u, w) { rec.calls.push('arc'); rec.points += 13; pts(u, w); },
    label(markup, u, w, em) { rec.calls.push('label'); rec.labels++; expect(markup.length).toBeGreaterThan(0); pts(u, w); expect(em).toBeGreaterThan(0); },
  };
  return { pen, rec };
}

describe('every payload, drawn through a recording pen', () => {
  const frames: [number, number][] = [[0, 0], [0.2, 3], [0.45, 5], [0.7, 8], [1, 9], [1, 20], [1, 77.3]];
  for (const p of PAYLOADS) {
    it(`${p.id}: stays on its napkin, finite, inside the §6.5 budget`, () => {
      for (const [t, now] of frames) {
        const { pen, rec } = recorder(t, now);
        p.draw(pen);
        for (const c of rec.coords) {
          expect(Number.isFinite(c), `${p.id} t=${t} now=${now}`).toBe(true);
          expect(Math.abs(c), `${p.id} t=${t} now=${now}: ${c}`).toBeLessThanOrEqual(1);
        }
        expect(rec.points).toBeLessThanOrEqual(160);
        expect(rec.calls.length).toBeLessThanOrEqual(14);
        expect(rec.labels).toBeLessThanOrEqual(4);
      }
    });

    it(`${p.id}: draws the same picture for the same pen.t and pen.now (pure)`, () => {
      const a = recorder(1, 9), b = recorder(1, 9);
      p.draw(a.pen); p.draw(b.pen);
      expect(a.rec.coords).toEqual(b.rec.coords);
      expect(a.rec.calls).toEqual(b.rec.calls);
    });

    it(`${p.id}: a still frame is complete (a label, and a curve or area)`, () => {
      const { pen, rec } = recorder(1, 9);
      p.draw(pen);
      expect(rec.calls).toContain('label');
      expect(rec.calls.some((c) => c === 'curve' || c === 'area')).toBe(true);
    });
  }

  it('M1 draws its six bars in one at a time; M3 its four', () => {
    const count = (id: string, t: number) => { const { pen, rec } = recorder(t, 9); PAYLOADS.find((p) => p.id === id)!.draw(pen); return rec.calls.filter((c) => c === 'quad').length; };
    expect(count('M1', 0)).toBe(0);
    expect(count('M1', 0.5)).toBeGreaterThan(0);
    expect(count('M1', 0.5)).toBeLessThan(6);
    expect(count('M1', 1)).toBe(6);
    expect(count('M3', 1)).toBe(4);
  });
});
