import { describe, expect, it } from 'vitest';
import {
  CURVES,
  averageRateOfChange,
  derivativeTerm,
  evalDerivativeTerm,
  evalTerm,
  slopeSign,
} from './derivative';

/** Central-difference numeric derivative, used only to cross-check the closed-form ones below. */
function numericDerivative(fn: (x: number) => number, x: number, h = 1e-5): number {
  return (fn(x + h) - fn(x - h)) / (2 * h);
}

describe('CURVES', () => {
  for (const curve of Object.values(CURVES)) {
    it(`${curve.id}'s closed-form derivative matches a numeric approximation across its domain`, () => {
      const [a, b] = curve.domain;
      for (let i = 1; i < 10; i++) {
        const x = a + ((b - a) * i) / 10;
        expect(curve.derivative(x)).toBeCloseTo(numericDerivative(curve.fn, x), 3);
      }
    });
  }

  // f(x) = 0.5x², f'(x) = x — hand check: f'(4) = 4.
  it('quadratic: f\'(4) = 4', () => {
    expect(CURVES.quadratic.derivative(4)).toBeCloseTo(4, 10);
  });

  // f(x) = x³ − 3x, f'(x) = 3x² − 3 — hand check: f'(2) = 12 − 3 = 9.
  it('cubicWave: f\'(2) = 9', () => {
    expect(CURVES.cubicWave.derivative(2)).toBeCloseTo(9, 10);
  });

  it('cubicWave: the declared extrema are genuinely where the derivative is zero', () => {
    for (const { x } of CURVES.cubicWave.extrema ?? []) {
      expect(CURVES.cubicWave.derivative(x)).toBeCloseTo(0, 10);
    }
  });

  it('cubicWave: local max value at x=-1 is 2, local min value at x=1 is -2', () => {
    expect(CURVES.cubicWave.fn(-1)).toBeCloseTo(2, 10);
    expect(CURVES.cubicWave.fn(1)).toBeCloseTo(-2, 10);
  });
});

describe('averageRateOfChange', () => {
  // f(x) = 0.5x²: avg rate from x=1 to x=3 is (4.5 - 0.5) / 2 = 2.
  it('matches Δy/Δx for the quadratic curve', () => {
    expect(averageRateOfChange(CURVES.quadratic, 1, 3)).toBeCloseTo(2, 10);
  });

  it('converges to the instantaneous derivative as the gap shrinks to zero', () => {
    const wide = averageRateOfChange(CURVES.quadratic, 1, 3);
    const narrow = averageRateOfChange(CURVES.quadratic, 1, 1.01);
    const exact = CURVES.quadratic.derivative(1);
    expect(Math.abs(narrow - exact)).toBeLessThan(Math.abs(wide - exact));
    expect(narrow).toBeCloseTo(exact, 1);
  });

  it('falls back to the exact derivative when x1 equals x2', () => {
    expect(averageRateOfChange(CURVES.quadratic, 2, 2)).toBeCloseTo(CURVES.quadratic.derivative(2), 10);
  });
});

describe('power rule (evalTerm / derivativeTerm / evalDerivativeTerm)', () => {
  // f(x) = 2x³ -> f'(x) = 6x², f'(2) = 24.
  it('differentiates a cubic term correctly', () => {
    const term = { coeff: 2, power: 3 };
    expect(derivativeTerm(term)).toEqual({ coeff: 6, power: 2 });
    expect(evalDerivativeTerm(term, 2)).toBeCloseTo(24, 10);
  });

  // f(x) = x^(1/2) (= √x) -> f'(x) = 0.5·x^(-1/2) = 1/(2√x), f'(4) = 1/4.
  it('differentiates a square-root term correctly', () => {
    const term = { coeff: 1, power: 0.5 };
    const d = derivativeTerm(term);
    expect(d.coeff).toBeCloseTo(0.5, 10);
    expect(d.power).toBeCloseTo(-0.5, 10);
    expect(evalDerivativeTerm(term, 4)).toBeCloseTo(0.25, 10);
  });

  // f(x) = 5 (power = 0) -> f'(x) = 0, the constant rule.
  it('differentiates a constant term to zero', () => {
    expect(evalDerivativeTerm({ coeff: 5, power: 0 }, 3)).toBeCloseTo(0, 10);
  });

  it('evalTerm matches direct computation', () => {
    expect(evalTerm({ coeff: 3, power: 2 }, 5)).toBeCloseTo(75, 10); // 3·25
  });
});

describe('slopeSign', () => {
  it('reports increasing where the derivative is clearly positive', () => {
    expect(slopeSign(CURVES.cubicWave, -2)).toBe('inc'); // f'(-2) = 12 - 3 = 9 > 0
  });

  it('reports decreasing where the derivative is clearly negative', () => {
    expect(slopeSign(CURVES.cubicWave, 0)).toBe('dec'); // f'(0) = -3 < 0
  });

  it('reports flat at the known extrema', () => {
    expect(slopeSign(CURVES.cubicWave, -1)).toBe('flat');
    expect(slopeSign(CURVES.cubicWave, 1)).toBe('flat');
  });
});
