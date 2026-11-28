import { describe, expect, it } from 'vitest';
import {
  LANE_BANDS, TNODES, TOPOLOGIES, VIEWBOX, boxOf, describeTopology, edgesFor, nodesFor, pathD, pathFor, route, stepsFor, topologyMetrics,
  type Box, type Layout, type Topology,
} from './topology';

const org = { repos: 500, developers: 20000 };
const p = { reposPerDeveloper: 3, shards: 4 };

describe('topology metrics', () => {
  it('matches the hand-checked table at 500 repos, 20,000 developers, 3 each, 4 shards', () => {
    const m = (t: Topology) => topologyMetrics(org, t, p);
    expect(TOPOLOGIES.map((t) => m(t).serverProcesses)).toEqual([20000, 1, 20001, 4]);
    expect(TOPOLOGIES.map((t) => m(t).indexBuilds)).toEqual([60000, 500, 60500, 500]);
    expect(TOPOLOGIES.map((t) => m(t).reposInReach)).toEqual([3, 500, 500, 500]);
    expect(TOPOLOGIES.map((t) => m(t).developersPerServer)).toEqual([1, 20000, 20000, 5000]);
    expect(TOPOLOGIES.map((t) => m(t).developersAffectedIfOneServerFails)).toEqual([1, 20000, 20000, 5000]);
    expect(TOPOLOGIES.map((t) => m(t).seesUncommittedWork)).toEqual([true, false, true, false]);
    expect(TOPOLOGIES.map((t) => m(t).ownWorkSurvivesCentralFailure)).toEqual([true, false, true, false]);
  });

  it('reach is capped by the number of repos', () => {
    expect(topologyMetrics({ repos: 2, developers: 10 }, 'local', { reposPerDeveloper: 3, shards: 2 }).reposInReach).toBe(2);
  });

  it('rounds a shard up when developers do not divide evenly', () => {
    expect(topologyMetrics({ repos: 500, developers: 10 }, 'sharded', { reposPerDeveloper: 3, shards: 3 }).developersPerServer).toBe(4);
  });
});

describe('lanes', () => {
  it('each node sits in the lane of the team that owns it (CI belongs to the platform team)', () => {
    const lane = Object.fromEntries(TNODES.map((n) => [n.id, n.lane]));
    expect(lane).toEqual({
      'repo-a': 'product', 'repo-b': 'product', 'repo-c': 'product',
      ci: 'platform', registry: 'platform', 'server-1': 'platform', 'server-2': 'platform', 'server-3': 'platform',
      policy: 'security', 'machine-1': 'developers', 'machine-2': 'developers', 'machine-3': 'developers',
    });
  });
  it('describeTopology lists CI under the platform team', () => {
    const tr = (k: string) => k.split('.').pop()!;
    expect(describeTopology('central', tr)[1]).toBe('platform: ci, server, registry');
  });
});

describe('steps', () => {
  it('lengths: question 5 / 5 / 5 / 4, publish 4 / 4 / 4 / 1', () => {
    expect((['central', 'sharded', 'hybrid', 'local'] as Topology[]).map((t) => stepsFor(t, 'question').length)).toEqual([5, 5, 5, 4]);
    expect((['central', 'sharded', 'hybrid', 'local'] as Topology[]).map((t) => stepsFor(t, 'publish').length)).toEqual([4, 4, 4, 1]);
  });

  it('every step names nodes and edges that exist in that arrangement', () => {
    for (const t of TOPOLOGIES) {
      const nodes = new Set(nodesFor(t).map((n) => n.id));
      const edges = new Set(edgesFor(t).map((e) => e.id));
      for (const tr of ['question', 'publish'] as const) {
        for (const s of stepsFor(t, tr)) {
          for (const n of s.nodes) expect(nodes.has(n), `${t} ${s.id} ${n}`).toBe(true);
          for (const e of s.edges) expect(edges.has(e), `${t} ${s.id} ${e}`).toBe(true);
        }
      }
    }
  });

  it('the sharded publish loads every drawn server', () => {
    const last = stepsFor('sharded', 'publish')[3]!;
    expect(last.nodes).toEqual(['registry', 'server-1', 'server-2', 'server-3']);
    expect(last.edges).toEqual(['load-1', 'load-2', 'load-3']);
  });
});

describe('describeTopology', () => {
  const tr = (k: string) => k;
  it('4 lanes + used edges + unused nodes', () => {
    expect(describeTopology('central', tr).length).toBe(4 + 8 + 0);
    expect(describeTopology('local', tr).length).toBe(4 + 1 + 4);
    expect(describeTopology('hybrid', tr).length).toBe(4 + 9 + 0);
    expect(describeTopology('sharded', tr).length).toBe(4 + 12 + 0);
  });
});

const overlap = (a: Box, b: Box) =>
  Math.abs(a.x - b.x) < (a.w + b.w) / 2 && Math.abs(a.y - b.y) < (a.h + b.h) / 2;

describe('geometry', () => {
  for (const layout of ['wide', 'narrow'] as Layout[]) {
    for (const t of TOPOLOGIES) {
      it(`${layout} / ${t}: no two boxes overlap, all inside the viewBox and inside their lane`, () => {
        const vb = VIEWBOX[layout];
        const boxes = TNODES.map((n) => ({ n, b: boxOf(n.id, t, layout) })).filter((x): x is { n: (typeof TNODES)[number]; b: Box } => !!x.b);
        expect(boxes.length).toBeGreaterThanOrEqual(8);
        for (const { n, b } of boxes) {
          expect(b.x - b.w / 2, n.id).toBeGreaterThanOrEqual(0);
          expect(b.x + b.w / 2, n.id).toBeLessThanOrEqual(vb.w);
          expect(b.y - b.h / 2, n.id).toBeGreaterThanOrEqual(0);
          expect(b.y + b.h / 2, n.id).toBeLessThanOrEqual(vb.h);
          const band = LANE_BANDS[layout][n.lane];
          expect(b.y - b.h / 2, `${n.id} lane`).toBeGreaterThanOrEqual(band.y1);
          expect(b.y + b.h / 2, `${n.id} lane`).toBeLessThanOrEqual(band.y2);
        }
        for (let i = 0; i < boxes.length; i++)
          for (let j = i + 1; j < boxes.length; j++)
            expect(overlap(boxes[i]!.b, boxes[j]!.b), `${boxes[i]!.n.id} / ${boxes[j]!.n.id}`).toBe(false);
      });

      it(`${layout} / ${t}: every waypoint is inside the viewBox and every edge ends on its boxes`, () => {
        const vb = VIEWBOX[layout];
        for (const e of edgesFor(t)) {
          const pts = pathFor(e, t, layout);
          if (layout === 'narrow' && e.id === 'ask-3') {
            expect(pts).toEqual([]);
            continue;
          }
          expect(pts.length, e.id).toBeGreaterThanOrEqual(2);
          for (const q of pts) {
            expect(q.x, e.id).toBeGreaterThanOrEqual(0);
            expect(q.x, e.id).toBeLessThanOrEqual(vb.w);
            expect(q.y, e.id).toBeGreaterThanOrEqual(0);
            expect(q.y, e.id).toBeLessThanOrEqual(vb.h);
          }
          // every segment is horizontal or vertical
          for (let i = 1; i < pts.length; i++) expect(pts[i]!.x === pts[i - 1]!.x || pts[i]!.y === pts[i - 1]!.y, `${e.id} segment ${i}`).toBe(true);
        }
      });
    }
  }
});

describe('route', () => {
  it('goes straight when the boxes share a row', () => {
    const a = { x: 100, y: 50, w: 40, h: 20 };
    const b = { x: 300, y: 52, w: 40, h: 20 };
    expect(route(a, b)).toEqual([{ x: 120, y: 50 }, { x: 280, y: 52 }]);
  });
  it('goes down, across and down otherwise', () => {
    const a = { x: 100, y: 50, w: 40, h: 20 };
    const b = { x: 200, y: 150, w: 40, h: 20 };
    expect(route(a, b)).toEqual([{ x: 100, y: 60 }, { x: 100, y: 100 }, { x: 200, y: 100 }, { x: 200, y: 140 }]);
  });
  it('builds rounded path data', () => {
    expect(pathD([{ x: 0, y: 0 }, { x: 0, y: 20 }, { x: 20, y: 20 }])).toBe('M0 0 L0 12 Q0 20 8 20 L20 20');
  });
});
