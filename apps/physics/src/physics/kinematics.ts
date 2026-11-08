/**
 * Pure math for the kinematics explorers. No React, no i18n — just the numbers.
 *
 * Every scenario's `velocity` is the hand-verified derivative of its `position`; every
 * acceleration helper is likewise the hand-verified derivative of its velocity. See
 * `kinematics.test.ts` for the numeric checks.
 */

export type ScenarioId = 'constant' | 'easeInOut' | 'oscillate' | 'quadratic';

export interface ScenarioSpec {
  id: ScenarioId;
  /** [0, T] — the time window the scrubber/secant explorers show. */
  domain: [number, number];
  /** Position s(t). */
  position: (t: number) => number;
  /** Instantaneous velocity v(t) = s'(t), given in closed form (not numerically differentiated). */
  velocity: (t: number) => number;
}

export const SCENARIOS: Record<ScenarioId, ScenarioSpec> = {
  // Straight line: constant velocity, zero acceleration. s(t) = -2 + 1.5t.
  constant: {
    id: 'constant',
    domain: [0, 8],
    position: (t) => -2 + 1.5 * t,
    velocity: () => 1.5,
  },
  // Eases from rest up to a cruising speed and back down to rest — like a car pulling away
  // and then braking to a stop. v(t) = 2.5·sin(πt/6), s(t) = (15/π)·(1 − cos(πt/6)).
  easeInOut: {
    id: 'easeInOut',
    domain: [0, 6],
    position: (t) => (15 / Math.PI) * (1 - Math.cos((Math.PI * t) / 6)),
    velocity: (t) => 2.5 * Math.sin((Math.PI * t) / 6),
  },
  // Oscillates back and forth about the origin, reversing direction twice in the window.
  // s(t) = 3·sin(πt/4), v(t) = (3π/4)·cos(πt/4).
  oscillate: {
    id: 'oscillate',
    domain: [0, 8],
    position: (t) => 3 * Math.sin((Math.PI * t) / 4),
    velocity: (t) => (3 * Math.PI * Math.cos((Math.PI * t) / 4)) / 4,
  },
  // Clean parabola, used by the secant/tangent explorer so the by-hand arithmetic is simple.
  // s(t) = 0.5t², v(t) = t.
  quadratic: {
    id: 'quadratic',
    domain: [0, 6],
    position: (t) => 0.5 * t * t,
    velocity: (t) => t,
  },
};

/** Average velocity between two times: the secant slope, Δs/Δt. */
export function averageVelocity(spec: ScenarioSpec, t1: number, t2: number): number {
  if (t1 === t2) return spec.velocity(t1);
  return (spec.position(t2) - spec.position(t1)) / (t2 - t1);
}

export type SumMode = 'left' | 'right' | 'midpoint';

/** v(t) = a·t for an object starting from rest (v0 = 0) under constant acceleration a. */
export function velocityAtConstantAccel(a: number, t: number): number {
  return a * t;
}

/** Exact displacement via the power rule: ∫₀ᵗ a·s ds = ½at². */
export function exactDisplacement(a: number, t: number): number {
  return 0.5 * a * t * t;
}

export interface VelocityRectangle {
  x: number;
  width: number;
  height: number;
}

/** The n sampling rectangles under v(t) = a·t on [0, duration], a Riemann sum is built from. */
export function velocityRectangles(a: number, duration: number, n: number, mode: SumMode): VelocityRectangle[] {
  const width = duration / n;
  const out: VelocityRectangle[] = [];
  for (let i = 0; i < n; i++) {
    const left = i * width;
    const sampleT = mode === 'left' ? left : mode === 'right' ? left + width : left + width / 2;
    out.push({ x: left, width, height: velocityAtConstantAccel(a, sampleT) });
  }
  return out;
}

/** The rectangle-sum estimate of displacement: Σ v(tᵢ)·Δt. */
export function estimatedDisplacement(a: number, duration: number, n: number, mode: SumMode): number {
  return velocityRectangles(a, duration, n, mode).reduce((sum, r) => sum + r.height * r.width, 0);
}
