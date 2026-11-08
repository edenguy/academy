/**
 * Pure math for the derivative explorers. No React, no i18n — just the numbers.
 *
 * Every curve's `derivative` is the hand-verified derivative of its `fn`; see
 * `derivative.test.ts` for the numeric checks (each one cross-checked against a numeric
 * approximation of the derivative, not just against itself).
 */

export type CurveId = 'quadratic' | 'cubicWave';

export interface CurveSpec {
  id: CurveId;
  /** [a, b] — the x-window the secant/extremum explorers show. */
  domain: [number, number];
  /** f(x). */
  fn: (x: number) => number;
  /** Exact derivative f'(x), given in closed form (not numerically differentiated). */
  derivative: (x: number) => number;
  /** Known local extrema in the domain, for the extremum explorer to mark. */
  extrema?: { x: number; kind: 'max' | 'min' }[];
}

export const CURVES: Record<CurveId, CurveSpec> = {
  // f(x) = 0.5x², f'(x) = x — deliberately the same curve as Physics Academy's kinematics
  // "quadratic" scenario (s(t) = 0.5t², v(t) = t): the same rate-of-change idea, taught twice
  // on purpose (see CLAUDE.md's "grab a handle" principle).
  quadratic: {
    id: 'quadratic',
    domain: [0, 6],
    fn: (x) => 0.5 * x * x,
    derivative: (x) => x,
  },
  // f(x) = x³ − 3x, f'(x) = 3x² − 3, zero at x = ±1: a clean cubic with one local max and one
  // local min, small enough to check by hand. f(-1) = 2 (local max), f(1) = -2 (local min).
  cubicWave: {
    id: 'cubicWave',
    domain: [-2.5, 2.5],
    fn: (x) => x * x * x - 3 * x,
    derivative: (x) => 3 * x * x - 3,
    extrema: [
      { x: -1, kind: 'max' },
      { x: 1, kind: 'min' },
    ],
  },
};

/** Average rate of change between two points: the secant slope, Δy/Δx. */
export function averageRateOfChange(spec: CurveSpec, x1: number, x2: number): number {
  if (x1 === x2) return spec.derivative(x1);
  return (spec.fn(x2) - spec.fn(x1)) / (x2 - x1);
}

/** A single power term, coeff·x^power (power may be fractional, e.g. 0.5 for √x). */
export interface PowerTerm {
  coeff: number;
  power: number;
}

/** f(x) = coeff·x^power. For power = 0 the term is a flat constant; x must be > 0 for power < 1 (roots). */
export function evalTerm(term: PowerTerm, x: number): number {
  return term.coeff * Math.pow(x, term.power);
}

/** The power rule: d/dx[coeff·x^power] = coeff·power·x^(power-1). */
export function derivativeTerm(term: PowerTerm): PowerTerm {
  return { coeff: term.coeff * term.power, power: term.power - 1 };
}

/** f'(x) for a single power term, evaluated at x (x must be > 0 when power - 1 < 0). */
export function evalDerivativeTerm(term: PowerTerm, x: number): number {
  return evalTerm(derivativeTerm(term), x);
}

/** Sign of f'(x): 'inc' (rising), 'dec' (falling), or 'flat' (an extremum point, within epsilon). */
export function slopeSign(spec: CurveSpec, x: number, epsilon = 0.08): 'inc' | 'dec' | 'flat' {
  const d = spec.derivative(x);
  if (Math.abs(d) < epsilon) return 'flat';
  return d > 0 ? 'inc' : 'dec';
}
