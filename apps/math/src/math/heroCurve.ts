import { createElement } from 'react';
import { FUNCTIONS, rectangles } from './integral';
import type { HeroCurveConfig } from '@/components/HeroSignature';

/**
 * The hub-page hero's signature for Math Academy — real midpoint rectangles under the real
 * parabola `FUNCTIONS.parabola`, exactly as `IntegralExplorer` draws them (CLAUDE.md rule 6:
 * never invent a number for a live demo). As the visitor scrubs, the rectangle count n climbs
 * from 2 to 16.
 */
const A = 0;
const B = 4;

export const HERO_CURVE: HeroCurveConfig = {
  domain: [A, B],
  fn: FUNCTIONS.parabola.fn,
  tagText: (_x, t) => `n = ${2 + Math.round(t * 14)}`,
  renderExtra: ({ t, scaleX, scaleY }) => {
    const n = 2 + Math.round(t * 14);
    const rects = rectangles(FUNCTIONS.parabola.fn, A, B, n, 'midpoint');
    return rects.map((r, i) =>
      createElement('rect', {
        key: i,
        x: scaleX(r.x),
        y: scaleY(Math.max(0, r.height)),
        width: Math.max(0, scaleX(r.x + r.width) - scaleX(r.x)),
        height: Math.max(0, scaleY(0) - scaleY(Math.max(0, r.height))),
        fill: 'var(--series-b-soft)',
        stroke: 'var(--series-b)',
        strokeWidth: 1.25,
      }),
    );
  },
};
