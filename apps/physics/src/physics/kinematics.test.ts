import { describe, expect, it } from 'vitest';
import {
  SCENARIOS,
  averageVelocity,
  estimatedDisplacement,
  exactDisplacement,
  velocityAtConstantAccel,
  velocityRectangles,
} from './kinematics';

// Numerically differentiate position to sanity-check each scenario's closed-form velocity.
function numericVelocity(position: (t: number) => number, t: number, h = 1e-5): number {
  return (position(t + h) - position(t - h)) / (2 * h);
}

describe('SCENARIOS', () => {
  for (const spec of Object.values(SCENARIOS)) {
    it(`${spec.id}: velocity matches the numeric derivative of position across the domain`, () => {
      const [start, end] = spec.domain;
      for (let t = start; t <= end; t += (end - start) / 10) {
        expect(spec.velocity(t)).toBeCloseTo(numericVelocity(spec.position, t), 3);
      }
    });
  }

  it('constant: zero acceleration, so velocity never changes', () => {
    const { velocity } = SCENARIOS.constant;
    expect(velocity(0)).toBeCloseTo(1.5, 10);
    expect(velocity(8)).toBeCloseTo(1.5, 10);
  });

  it('easeInOut: starts and ends at rest (eases in, then back out)', () => {
    const { velocity, domain } = SCENARIOS.easeInOut;
    expect(velocity(domain[0])).toBeCloseTo(0, 6);
    expect(velocity(domain[1])).toBeCloseTo(0, 6);
  });

  it('oscillate: has two interior turning points (velocity = 0) where it reverses direction', () => {
    const { velocity } = SCENARIOS.oscillate;
    // πt/4 = π/2 → t = 2; πt/4 = 3π/2 → t = 6.
    expect(velocity(2)).toBeCloseTo(0, 6);
    expect(velocity(6)).toBeCloseTo(0, 6);
    expect(velocity(0)).toBeGreaterThan(0);
    expect(velocity(4)).toBeLessThan(0);
  });

  it('quadratic: v(t) = t, so average velocity between t1 and t2 is their mean', () => {
    const spec = SCENARIOS.quadratic;
    // Hand check: s(1) = 0.5, s(3) = 4.5 → (4.5 − 0.5) / (3 − 1) = 2 = (1 + 3) / 2.
    expect(averageVelocity(spec, 1, 3)).toBeCloseTo(2, 10);
    expect(averageVelocity(spec, 1, 3)).toBeCloseTo((1 + 3) / 2, 10);
  });
});

describe('averageVelocity', () => {
  it('collapses to the instantaneous (exact) velocity at t1 as t2 approaches t1', () => {
    // The secant through t1 and t2 approaches the tangent AT t1 as t2 → t1 — this is the
    // lesson's whole point, so anchor the comparison at t1 (not at the pair's midpoint).
    const spec = SCENARIOS.quadratic;
    const exact = spec.velocity(1); // v(1) = 1
    const coarse = Math.abs(averageVelocity(spec, 1, 3) - exact);
    const fine = Math.abs(averageVelocity(spec, 1, 1.002) - exact);
    expect(fine).toBeLessThan(coarse);
    expect(fine).toBeCloseTo(0, 2);
  });
});

describe('constant-acceleration helpers', () => {
  it('velocityAtConstantAccel is linear in t', () => {
    expect(velocityAtConstantAccel(2, 3)).toBe(6);
    expect(velocityAtConstantAccel(0.5, 10)).toBe(5);
  });

  // a = 2 m/s², t = 6s → v(6) = 12, exact area of the v(t) triangle = ½·6·12 = 36 = ½·2·6².
  it('exactDisplacement matches the triangle area under v(t) = a·t', () => {
    expect(exactDisplacement(2, 6)).toBeCloseTo(36, 10);
    expect(exactDisplacement(2, 6)).toBeCloseTo(0.5 * velocityAtConstantAccel(2, 6) * 6, 10);
  });

  it('velocityRectangles returns n rectangles of equal width spanning [0, duration]', () => {
    const rects = velocityRectangles(2, 6, 3, 'left');
    expect(rects).toHaveLength(3);
    expect(rects.map((r) => r.width)).toEqual([2, 2, 2]);
    expect(rects.map((r) => r.x)).toEqual([0, 2, 4]);
  });

  it('midpoint sum is exact at any n, since v(t) = a·t has no curvature to approximate', () => {
    const exact = exactDisplacement(2, 6);
    expect(estimatedDisplacement(2, 6, 4, 'midpoint')).toBeCloseTo(exact, 10);
    expect(estimatedDisplacement(2, 6, 4000, 'midpoint')).toBeCloseTo(exact, 10);
  });

  it('left/right sums converge to the exact value as n grows', () => {
    const exact = exactDisplacement(2, 6);
    const coarseLeft = Math.abs(estimatedDisplacement(2, 6, 4, 'left') - exact);
    const fineLeft = Math.abs(estimatedDisplacement(2, 6, 4000, 'left') - exact);
    expect(fineLeft).toBeLessThan(coarseLeft);
    expect(estimatedDisplacement(2, 6, 4000, 'left')).toBeCloseTo(exact, 1);
  });

  it('brackets the exact value with left/right sums (v(t) = a·t is strictly increasing)', () => {
    const exact = exactDisplacement(2, 6);
    const left = estimatedDisplacement(2, 6, 20, 'left');
    const right = estimatedDisplacement(2, 6, 20, 'right');
    expect(left).toBeLessThan(exact);
    expect(right).toBeGreaterThan(exact);
  });
});
