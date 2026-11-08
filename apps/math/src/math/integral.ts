/**
 * Pure math for the integral explorer. No React, no i18n — just the numbers.
 */

export type SumMode = 'left' | 'right' | 'midpoint';

export interface FunctionSpec {
  id: 'line' | 'parabola' | 'cubic';
  /** f(x) */
  fn: (x: number) => number;
  /** Power of x, used for the closed-form antiderivative (f(x) = x^power). */
  power: number;
}

export const FUNCTIONS: Record<FunctionSpec['id'], FunctionSpec> = {
  line: { id: 'line', fn: (x) => x, power: 1 },
  parabola: { id: 'parabola', fn: (x) => x * x, power: 2 },
  cubic: { id: 'cubic', fn: (x) => x * x * x, power: 3 },
};

/** Exact value of ∫ₐᵇ xⁿ dx via the power rule: [xⁿ⁺¹/(n+1)] from a to b. */
export function powerIntegral(power: number, a: number, b: number): number {
  const n1 = power + 1;
  return (b ** n1 - a ** n1) / n1;
}

export interface Rectangle {
  /** Left edge of the rectangle. */
  x: number;
  width: number;
  /** Signed height — negative where f dips below the x-axis. */
  height: number;
}

/** The n sampling points and rectangle heights a Riemann sum is built from. */
export function rectangles(fn: (x: number) => number, a: number, b: number, n: number, mode: SumMode): Rectangle[] {
  const width = (b - a) / n;
  const out: Rectangle[] = [];
  for (let i = 0; i < n; i++) {
    const left = a + i * width;
    const sampleX = mode === 'left' ? left : mode === 'right' ? left + width : left + width / 2;
    out.push({ x: left, width, height: fn(sampleX) });
  }
  return out;
}

/** The Riemann sum itself: Σ f(xᵢ)·Δx. */
export function riemannSum(fn: (x: number) => number, a: number, b: number, n: number, mode: SumMode): number {
  return rectangles(fn, a, b, n, mode).reduce((sum, r) => sum + r.height * r.width, 0);
}
