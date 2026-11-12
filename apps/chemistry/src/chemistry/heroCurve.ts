import { netDipole } from './dipole';
import type { HeroCurveConfig } from '@/components/HeroSignature';

/**
 * Hero signature for Chemistry Academy. The curve is `netDipole` — the same vector sum
 * the polarity lesson draws. Scrubbing the angle from 0° to 180° is the input; the tag
 * is that function's result. Nothing else is plotted.
 */
export const HERO_CURVE: HeroCurveConfig = {
  domain: [0, 180],
  fn: (angle) => netDipole(angle),
  tagText: (angle) => `net = ${netDipole(angle).toFixed(2)}`,
};
