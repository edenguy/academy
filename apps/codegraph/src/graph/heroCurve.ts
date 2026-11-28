import type { HeroCurveConfig } from '@/components/HeroSignature';
import { dependents } from './graph';
import { BASE_GRAPH } from './toy';

/**
 * Hero signature: blast radius against steps, the same walk lesson 2 draws. The curve is a
 * staircase (0, 1, 2, 5, 6), a function result at every sample. Nothing else is plotted.
 */
const affected = (x: number) => dependents(BASE_GRAPH, 'money.format_price', Math.round(x)).length;

export const HERO_CURVE: HeroCurveConfig = {
  domain: [0, 4],
  fn: (x) => affected(x),
  tagText: (x) => `steps = ${Math.round(x)} · affected = ${affected(x)}`,
};
