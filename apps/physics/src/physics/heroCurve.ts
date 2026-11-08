import { SCENARIOS } from './kinematics';
import type { HeroCurveConfig } from '@/components/HeroSignature';

/**
 * The hub-page hero's signature for Physics Academy — the real `easeInOut` scenario's
 * position curve (the same scenario `MotionScrubber` offers on lesson 1), not an invented
 * shape (CLAUDE.md rule 6: never invent a number for a live demo).
 */
const SCENARIO = SCENARIOS.easeInOut;

export const HERO_CURVE: HeroCurveConfig = {
  domain: SCENARIO.domain,
  fn: SCENARIO.position,
  tagText: (x) => `s = ${SCENARIO.position(x).toFixed(1)}`,
};
