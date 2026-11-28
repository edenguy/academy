import { describe, expect, it } from 'vitest';
import { BASE_GRAPH } from './toy';
import { graphAt } from './staleness';
import { PILL, VIEWBOX_TOY, edgeGeometry, groupsFor, pillRect, positionsFor, type GraphLayout, type GraphVariant, type Rect } from './toyLayout';

const overlap = (a: Rect, b: Rect) => a.x1 < b.x2 && b.x1 < a.x2 && a.y1 < b.y2 && b.y1 < a.y2;

for (const layout of ['wide', 'narrow'] as GraphLayout[]) {
  for (const variant of ['graph', 'staleness'] as GraphVariant[]) {
    describe(`toy layout ${layout} / ${variant}`, () => {
      const pos = positionsFor(layout, variant);
      const ids = Object.keys(pos).filter((id) => id !== 'money.round_money' && (variant === 'staleness' || id !== 'web.renderReceipt'));

      it('no two pills overlap and all are inside the viewBox', () => {
        const vb = VIEWBOX_TOY[layout];
        const rects = ids.map((id) => ({ id, r: pillRect(pos[id]!, layout) }));
        for (const { id, r } of rects) {
          expect(r.x1, id).toBeGreaterThanOrEqual(0);
          expect(r.y1, id).toBeGreaterThanOrEqual(0);
          expect(r.x2, id).toBeLessThanOrEqual(vb.w);
          expect(r.y2, id).toBeLessThanOrEqual(vb.h);
        }
        for (let i = 0; i < rects.length; i++)
          for (let j = i + 1; j < rects.length; j++) expect(overlap(rects[i]!.r, rects[j]!.r), `${rects[i]!.id} / ${rects[j]!.id}`).toBe(false);
      });

      it('every pill sits inside a group box of its own and none cross', () => {
        const groups = groupsFor(layout, variant).filter((g) => g.kind !== 'repo');
        for (const id of ids) {
          const r = pillRect(pos[id]!, layout);
          const inside = groups.filter((g) => r.x1 >= g.x1 && r.x2 <= g.x2 && r.y1 >= g.y1 && r.y2 <= g.y2);
          expect(inside.length, id).toBe(1);
        }
      });

      it('every edge of every commit has a path that ends on a pill border', () => {
        for (const g of [BASE_GRAPH, graphAt(1), graphAt(3)]) {
          const drawn = g.nodes.map((n) => n.id);
          for (const e of g.edges) {
            if (!pos[e.from] || !pos[e.to]) continue;
            const geo = edgeGeometry(layout, variant, e, drawn);
            const r = pillRect(pos[e.to]!, layout);
            expect(geo.end.x).toBeGreaterThanOrEqual(r.x1 - 0.5);
            expect(geo.end.x).toBeLessThanOrEqual(r.x2 + 0.5);
            expect(geo.end.y).toBeGreaterThanOrEqual(r.y1 - 0.5);
            expect(geo.end.y).toBeLessThanOrEqual(r.y2 + 0.5);
            expect(Number.isFinite(geo.mid.x)).toBe(true);
          }
        }
      });
    });
  }
}

describe('pill sizes', () => {
  it('match the spec', () => {
    expect(PILL.wide).toEqual({ w: 150, h: 36 });
    expect(PILL.narrow).toEqual({ w: 152, h: 34 });
  });
});

describe('edge curves', () => {
  it('endpoint to get_order bows around load_order in both layouts', () => {
    const drawn = BASE_GRAPH.nodes.map((n) => n.id);
    for (const layout of ['wide', 'narrow'] as GraphLayout[]) {
      const g = edgeGeometry(layout, 'graph', { from: 'endpoint.getOrder', to: 'api.get_order' }, drawn);
      expect(g.curved).toBe(true);
      const straight = edgeGeometry(layout, 'graph', { from: 'api.get_order', to: 'money.format_price' }, drawn);
      expect(straight.curved).toBe(false);
    }
  });
});
