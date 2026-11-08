import { describe, expect, it } from 'vitest';
import { FUNCTIONS, powerIntegral, rectangles, riemannSum } from './integral';

describe('powerIntegral', () => {
  // ∫₀⁶ x dx = [x²/2]₀⁶ = 36/2 = 18 (the triangle under y = x, base 6, height 6: ½·6·6 = 18 — matches).
  it('matches the triangle area for f(x) = x on [0, 6]', () => {
    expect(powerIntegral(1, 0, 6)).toBeCloseTo(18, 10);
  });

  // ∫₀⁴ x² dx = [x³/3]₀⁴ = 64/3 ≈ 21.333...
  it('matches the known value for f(x) = x² on [0, 4]', () => {
    expect(powerIntegral(2, 0, 4)).toBeCloseTo(64 / 3, 10);
  });

  // ∫₀² x³ dx = [x⁴/4]₀² = 16/4 = 4
  it('matches the known value for f(x) = x³ on [0, 2]', () => {
    expect(powerIntegral(3, 0, 2)).toBeCloseTo(4, 10);
  });
});

describe('rectangles', () => {
  it('returns n rectangles of equal width spanning [a, b]', () => {
    const rects = rectangles(FUNCTIONS.line.fn, 0, 6, 3, 'left');
    expect(rects).toHaveLength(3);
    expect(rects.map((r) => r.width)).toEqual([2, 2, 2]);
    expect(rects.map((r) => r.x)).toEqual([0, 2, 4]);
  });

  it('samples the left, right, or midpoint of each slice depending on mode', () => {
    const [left] = rectangles(FUNCTIONS.parabola.fn, 0, 4, 1, 'left');
    const [right] = rectangles(FUNCTIONS.parabola.fn, 0, 4, 1, 'right');
    const [mid] = rectangles(FUNCTIONS.parabola.fn, 0, 4, 1, 'midpoint');
    expect(left!.height).toBeCloseTo(0, 10); // f(0) = 0
    expect(right!.height).toBeCloseTo(16, 10); // f(4) = 16
    expect(mid!.height).toBeCloseTo(4, 10); // f(2) = 4
  });
});

describe('riemannSum', () => {
  it('converges to the exact power-rule value as n grows, for an increasing function', () => {
    const exact = powerIntegral(2, 0, 4);
    const coarse = riemannSum(FUNCTIONS.parabola.fn, 0, 4, 4, 'midpoint');
    const fine = riemannSum(FUNCTIONS.parabola.fn, 0, 4, 4000, 'midpoint');
    expect(Math.abs(fine - exact)).toBeLessThan(Math.abs(coarse - exact));
    expect(fine).toBeCloseTo(exact, 3);
  });

  it('is exact for a straight line regardless of n (no curvature to approximate)', () => {
    const exact = powerIntegral(1, 0, 6);
    expect(riemannSum(FUNCTIONS.line.fn, 0, 6, 1, 'midpoint')).toBeCloseTo(exact, 10);
    expect(riemannSum(FUNCTIONS.line.fn, 0, 6, 50, 'midpoint')).toBeCloseTo(exact, 10);
  });

  it('brackets the exact value with left/right sums on a strictly increasing function', () => {
    const exact = powerIntegral(2, 0, 4);
    const left = riemannSum(FUNCTIONS.parabola.fn, 0, 4, 20, 'left');
    const right = riemannSum(FUNCTIONS.parabola.fn, 0, 4, 20, 'right');
    expect(left).toBeLessThan(exact);
    expect(right).toBeGreaterThan(exact);
  });
});
