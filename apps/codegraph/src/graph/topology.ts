import type { Org } from './scale';

/**
 * The topology diagram: boxes, arrows, four arrangements (CODEGRAPH_LLD.md section 4.8).
 * Geometry lives here as data; the component only draws it. A Box is a centre point and a size.
 */

export type Topology = 'local' | 'central' | 'hybrid' | 'sharded';
export const TOPOLOGIES: Topology[] = ['local', 'central', 'hybrid', 'sharded'];
export type Lane = 'product' | 'platform' | 'security' | 'developers';
export const LANES: Lane[] = ['product', 'platform', 'security', 'developers'];
export type TNodeKind = 'repo' | 'ci' | 'registry' | 'server' | 'policy' | 'machine';
export type Layout = 'wide' | 'narrow';

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}
export interface Point {
  x: number;
  y: number;
}
export interface TNode {
  id: string;
  kind: TNodeKind;
  lane: Lane;
  wide: Box;
  narrow: Box | null;
  /** Server boxes are smaller in the sharded arrangement, which draws up to three side by side. */
  sharded?: { wide: Box; narrow: Box };
}

export const VIEWBOX: Record<Layout, { w: number; h: number }> = {
  wide: { w: 1000, h: 560 },
  narrow: { w: 360, h: 850 },
};

export const LANE_BANDS: Record<Layout, Record<Lane, { y1: number; y2: number }>> = {
  wide: {
    product: { y1: 8, y2: 108 },
    platform: { y1: 116, y2: 296 },
    security: { y1: 304, y2: 404 },
    developers: { y1: 412, y2: 552 },
  },
  narrow: {
    product: { y1: 8, y2: 120 },
    platform: { y1: 128, y2: 388 },
    security: { y1: 396, y2: 486 },
    developers: { y1: 494, y2: 842 },
  },
};
/** x range of the lane bands. */
export const LANE_X: Record<Layout, { x1: number; x2: number }> = { wide: { x1: 8, x2: 992 }, narrow: { x1: 8, x2: 352 } };

const B = (x: number, y: number, w: number, h: number): Box => ({ x, y, w, h });

export const TNODES: TNode[] = [
  { id: 'repo-a', kind: 'repo', lane: 'product', wide: B(250, 58, 120, 60), narrow: B(96, 80, 150, 46) },
  { id: 'repo-b', kind: 'repo', lane: 'product', wide: B(390, 58, 120, 60), narrow: B(264, 80, 150, 46) },
  { id: 'repo-c', kind: 'repo', lane: 'product', wide: B(530, 58, 120, 60), narrow: null },
  { id: 'ci', kind: 'ci', lane: 'platform', wide: B(850, 156, 170, 64), narrow: B(180, 190, 300, 46) },
  {
    id: 'server-1', kind: 'server', lane: 'platform', wide: B(460, 254, 180, 64), narrow: B(180, 344, 300, 46),
    sharded: { wide: B(300, 254, 140, 64), narrow: B(66, 344, 104, 46) },
  },
  {
    id: 'server-2', kind: 'server', lane: 'platform', wide: B(460, 254, 140, 64), narrow: B(180, 344, 104, 46),
    sharded: { wide: B(460, 254, 140, 64), narrow: B(180, 344, 104, 46) },
  },
  {
    id: 'server-3', kind: 'server', lane: 'platform', wide: B(620, 254, 140, 64), narrow: B(294, 344, 104, 46),
    sharded: { wide: B(620, 254, 140, 64), narrow: B(294, 344, 104, 46) },
  },
  { id: 'registry', kind: 'registry', lane: 'platform', wide: B(850, 254, 170, 64), narrow: B(180, 262, 300, 46) },
  { id: 'policy', kind: 'policy', lane: 'security', wide: B(850, 354, 200, 56), narrow: B(270, 448, 150, 46) },
  { id: 'machine-1', kind: 'machine', lane: 'developers', wide: B(300, 484, 140, 132), narrow: B(96, 690, 150, 270) },
  { id: 'machine-2', kind: 'machine', lane: 'developers', wide: B(460, 484, 140, 132), narrow: B(264, 690, 150, 270) },
  { id: 'machine-3', kind: 'machine', lane: 'developers', wide: B(620, 484, 140, 132), narrow: null },
];

export function tnode(id: string): TNode {
  const n = TNODES.find((x) => x.id === id);
  if (!n) throw new Error(`Unknown topology node ${id}`);
  return n;
}

/** A node that exists in an arrangement (a server-2 or server-3 only exists when sharded). */
function existsIn(n: TNode, t: Topology): boolean {
  if (n.id === 'server-2' || n.id === 'server-3') return t === 'sharded';
  return true;
}

export function nodesFor(t: Topology): { id: string; used: boolean }[] {
  const unusedInLocal = new Set(['ci', 'registry', 'server-1', 'policy']);
  return TNODES.filter((n) => existsIn(n, t)).map((n) => ({ id: n.id, used: !(t === 'local' && unusedInLocal.has(n.id)) }));
}

/** The box of a node in an arrangement and a layout, or null when it is not drawn there. */
export function boxOf(id: string, t: Topology, layout: Layout): Box | null {
  const n = tnode(id);
  if (!existsIn(n, t)) return null;
  if (layout === 'narrow' && !n.narrow) return null;
  if (t === 'sharded' && n.sharded) return layout === 'wide' ? n.sharded.wide : n.sharded.narrow;
  return layout === 'wide' ? n.wide : (n.narrow as Box);
}

/** Narrow layout draws two repos and two machines; the third stands for "many". */
export function layoutNodeId(id: string, layout: Layout): string {
  if (layout === 'narrow') {
    if (id === 'repo-c') return 'repo-b';
    if (id === 'machine-3') return 'machine-2';
  }
  return id;
}

export type TEdgeKind = 'publish' | 'query' | 'policy' | 'clone';
export interface TEdge {
  id: string;
  from: string;
  to: string;
  kind: TEdgeKind;
  in: Topology[];
  /** Locale key suffix: explorer.topology.edge.<label> */
  label: 'merge' | 'snapshot' | 'load' | 'ask' | 'policy' | 'clone';
}

const NOT_LOCAL: Topology[] = ['central', 'hybrid', 'sharded'];
const SHARDED: Topology[] = ['sharded'];

export const TEDGES: TEdge[] = [
  { id: 'merge', from: 'repo-c', to: 'ci', kind: 'publish', in: NOT_LOCAL, label: 'merge' },
  { id: 'snapshot', from: 'ci', to: 'registry', kind: 'publish', in: NOT_LOCAL, label: 'snapshot' },
  { id: 'load-1', from: 'registry', to: 'server-1', kind: 'publish', in: NOT_LOCAL, label: 'load' },
  { id: 'load-2', from: 'registry', to: 'server-2', kind: 'publish', in: SHARDED, label: 'load' },
  { id: 'load-3', from: 'registry', to: 'server-3', kind: 'publish', in: SHARDED, label: 'load' },
  { id: 'ask-1', from: 'machine-1', to: 'server-1', kind: 'query', in: NOT_LOCAL, label: 'ask' },
  { id: 'ask-2', from: 'machine-2', to: 'server-1', kind: 'query', in: NOT_LOCAL, label: 'ask' },
  { id: 'ask-3', from: 'machine-3', to: 'server-1', kind: 'query', in: NOT_LOCAL, label: 'ask' },
  { id: 'policy-registry', from: 'policy', to: 'registry', kind: 'policy', in: NOT_LOCAL, label: 'policy' },
  { id: 'policy-server', from: 'policy', to: 'server-1', kind: 'policy', in: NOT_LOCAL, label: 'policy' },
  { id: 'policy-server-2', from: 'policy', to: 'server-2', kind: 'policy', in: SHARDED, label: 'policy' },
  { id: 'policy-server-3', from: 'policy', to: 'server-3', kind: 'policy', in: SHARDED, label: 'policy' },
  { id: 'clone', from: 'repo-a', to: 'machine-1', kind: 'clone', in: ['local', 'hybrid'], label: 'clone' },
];

/** The edge as it is drawn in an arrangement: in sharded, an ask goes to the machine's own server. */
export function edgesFor(t: Topology): TEdge[] {
  return TEDGES.filter((e) => e.in.includes(t)).map((e) => {
    if (t === 'sharded' && e.kind === 'query') return { ...e, to: `server-${e.id.slice(-1)}` };
    return e;
  });
}

/**
 * Default path: if |a.y - b.y| <= 4, one horizontal segment between the facing sides.
 * Otherwise leave `a` at the centre of the side facing `b` (top or bottom), go vertically to
 * the midpoint y between the two facing sides, horizontally to b.x, then vertically into `b`.
 */
export function route(a: Box, b: Box): Point[] {
  if (Math.abs(a.y - b.y) <= 4) {
    const rightward = b.x > a.x;
    return [
      { x: a.x + (rightward ? a.w / 2 : -a.w / 2), y: a.y },
      { x: b.x + (rightward ? -b.w / 2 : b.w / 2), y: b.y },
    ];
  }
  const down = b.y > a.y;
  const ay = a.y + (down ? a.h / 2 : -a.h / 2);
  const by = b.y + (down ? -b.h / 2 : b.h / 2);
  const mid = (ay + by) / 2;
  const pts: Point[] = [{ x: a.x, y: ay }, { x: a.x, y: mid }, { x: b.x, y: mid }, { x: b.x, y: by }];
  // collapse a duplicate when the two boxes share an x
  return pts.filter((p, i) => i === 0 || p.x !== pts[i - 1]!.x || p.y !== pts[i - 1]!.y);
}

const P = (x: number, y: number): Point => ({ x, y });
const serverNo = (id: string) => Number(id.slice(-1));

/** Explicit waypoints override `route`. Starting values from the spec; moved ones are recorded in the spec's Deviations. */
export function pathFor(e: TEdge, t: Topology, layout: Layout): Point[] {
  const from = boxOf(layoutNodeId(e.from, layout), t, layout);
  const to = boxOf(e.to, t, layout);
  if (!from || !to) return [];
  const wide = layout === 'wide';
  const sharded = t === 'sharded';

  if (e.id === 'merge') {
    // out to the right of repo-c on its own row, then down into the top of CI (the platform lane)
    return wide ? [P(590, 58), P(850, 58), P(850, 124)] : [P(264, 103), P(264, 167)];
  }
  if (e.id === 'clone') {
    return wide ? [P(190, 58), P(166, 58), P(166, 484), P(230, 484)] : [P(21, 80), P(14, 80), P(14, 690), P(21, 690)];
  }
  if (e.kind === 'query') {
    // the narrow layout draws two machines; the third ask would lie on top of the second
    if (!wide && e.id === 'ask-3') return [];
    const top = P(from.x, from.y - from.h / 2);
    if (wide) {
      if (sharded) return [top, P(to.x, to.y + to.h / 2)];
      return [top, P(from.x, 330), P(460, 330), P(460, 286)];
    }
    if (sharded) return [top, P(from.x, 520), P(to.x, 520), P(to.x, to.y + to.h / 2)];
    return [top, P(from.x, 520), P(150, 520), P(150, 367)];
  }
  if (e.id.startsWith('load-') && sharded) {
    return wide
      ? [P(765, 254), P(745, 254), P(745, 198), P(to.x, 198), P(to.x, 222)]
      : [P(180, 285), P(180, 304), P(to.x, 304), P(to.x, 321)];
  }
  if (e.id === 'policy-registry' && !wide) return [P(345, 448), P(350, 448), P(350, 262), P(330, 262)];
  if (e.id.startsWith('policy-server')) {
    if (wide) return [P(750, 354), P(to.x + 40, 354), P(to.x + 40, 286)];
    if (!sharded) return [P(270, 425), P(270, 367)];
    const n = serverNo(e.to);
    if (n === 3) return [P(270, 425), P(270, 367)];
    return [P(270, 425), P(270, 396), P(n === 2 ? 200 : 86, 396), P(n === 2 ? 200 : 86, 367)];
  }
  return route(from, to);
}

/** SVG path data with corners rounded by `r` px. */
export function pathD(pts: Point[], r = 8): string {
  if (pts.length < 2) return '';
  let d = `M${pts[0]!.x} ${pts[0]!.y}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const p0 = pts[i - 1]!;
    const p1 = pts[i]!;
    const p2 = pts[i + 1]!;
    const l1 = Math.hypot(p1.x - p0.x, p1.y - p0.y);
    const l2 = Math.hypot(p2.x - p1.x, p2.y - p1.y);
    const rr = Math.min(r, l1 / 2, l2 / 2);
    if (rr <= 0) {
      d += ` L${p1.x} ${p1.y}`;
      continue;
    }
    const a = { x: p1.x - ((p1.x - p0.x) / l1) * rr, y: p1.y - ((p1.y - p0.y) / l1) * rr };
    const b = { x: p1.x + ((p2.x - p1.x) / l2) * rr, y: p1.y + ((p2.y - p1.y) / l2) * rr };
    d += ` L${a.x} ${a.y} Q${p1.x} ${p1.y} ${b.x} ${b.y}`;
  }
  const last = pts[pts.length - 1]!;
  return `${d} L${last.x} ${last.y}`;
}

export type Track = 'question' | 'publish';
export interface Step {
  id: string;
  nodes: string[];
  edges: string[];
  textKey: string;
  /** Highlight the "Local graph + local MCP server" chip on machine-1. */
  chip?: 'local';
  /** Draw these nodes as out of reach (local arrangement, other repos). */
  outOfReach?: boolean;
}

const S = (id: string, nodes: string[], edges: string[], extra: Partial<Step> = {}): Step => ({
  id, nodes, edges, textKey: `explorer.topology.step.${id}`, ...extra,
});

export function stepsFor(t: Topology, track: Track): Step[] {
  if (track === 'publish') {
    if (t === 'local') return [S('n1', ['machine-1'], [])];
    const servers = t === 'sharded' ? ['server-1', 'server-2', 'server-3'] : ['server-1'];
    const loads = t === 'sharded' ? ['load-1', 'load-2', 'load-3'] : ['load-1'];
    return [
      S('p1', ['repo-c'], []),
      S('p2', ['repo-c', 'ci'], ['merge']),
      S('p3', ['ci', 'registry'], ['snapshot']),
      S('p4', ['registry', ...servers], loads),
    ];
  }
  if (t === 'hybrid') {
    return [
      S('h1', ['machine-1'], []),
      S('h2', ['machine-1'], [], { chip: 'local' }),
      S('h3', ['machine-1', 'server-1'], ['ask-1']),
      S('h4', ['server-1', 'policy', 'registry'], ['policy-server', 'load-1']),
      S('h5', ['server-1', 'machine-1'], ['ask-1']),
    ];
  }
  if (t === 'local') {
    return [
      S('l1', ['machine-1'], []),
      S('l2', ['machine-1'], [], { chip: 'local' }),
      S('l3', ['machine-1', 'repo-a'], ['clone']),
      S('l4', ['repo-b', 'repo-c'], [], { outOfReach: true }),
    ];
  }
  return [
    S('q1', ['machine-1'], []),
    S('q2', ['machine-1', 'server-1'], ['ask-1']),
    S('q3', ['server-1', 'policy'], ['policy-server']),
    S('q4', ['server-1', 'registry'], ['load-1']),
    S('q5', ['server-1', 'machine-1'], ['ask-1']),
  ];
}

export interface TopologyMetrics {
  serverProcesses: number;
  indexBuilds: number;
  reposInReach: number;
  developersPerServer: number;
  developersAffectedIfOneServerFails: number;
  seesUncommittedWork: boolean;
  ownWorkSurvivesCentralFailure: boolean;
}

/** k = min(reposPerDeveloper, repos). Shard sizes are rounded up: the largest shard is the worst case. */
export function topologyMetrics(org: Org, t: Topology, p: { reposPerDeveloper: number; shards: number }): TopologyMetrics {
  const D = org.developers;
  const R = org.repos;
  const k = Math.min(p.reposPerDeveloper, R);
  const S = p.shards;
  const perShard = Math.ceil(D / S);
  switch (t) {
    case 'local':
      return { serverProcesses: D, indexBuilds: D * k, reposInReach: k, developersPerServer: 1, developersAffectedIfOneServerFails: 1, seesUncommittedWork: true, ownWorkSurvivesCentralFailure: true };
    case 'central':
      return { serverProcesses: 1, indexBuilds: R, reposInReach: R, developersPerServer: D, developersAffectedIfOneServerFails: D, seesUncommittedWork: false, ownWorkSurvivesCentralFailure: false };
    case 'hybrid':
      return { serverProcesses: D + 1, indexBuilds: R + D * k, reposInReach: R, developersPerServer: D, developersAffectedIfOneServerFails: D, seesUncommittedWork: true, ownWorkSurvivesCentralFailure: true };
    case 'sharded':
      return { serverProcesses: S, indexBuilds: R, reposInReach: R, developersPerServer: perShard, developersAffectedIfOneServerFails: perShard, seesUncommittedWork: false, ownWorkSurvivesCentralFailure: false };
  }
}

/**
 * Text alternative: one item per lane, one per used edge, one per unused node.
 * Keys used: explorer.topology.lane.*, node.*, edge.*, notUsed.
 */
export function describeTopology(t: Topology, tr: (key: string) => string): string[] {
  const nodes = nodesFor(t);
  const used = new Set(nodes.filter((n) => n.used).map((n) => n.id));
  const kindName = (k: TNodeKind) => tr(`explorer.topology.node.${k}`);
  const out: string[] = [];
  for (const lane of LANES) {
    const names = nodes.filter((n) => n.used && tnode(n.id).lane === lane).map((n) => kindName(tnode(n.id).kind));
    const unique = [...new Set(names)];
    out.push(`${tr(`explorer.topology.lane.${lane}`)}: ${unique.length ? unique.join(', ') : tr('explorer.topology.notUsed')}`);
  }
  for (const e of edgesFor(t)) {
    if (used.has(e.from) && used.has(e.to)) {
      out.push(`${kindName(tnode(e.from).kind)} → ${kindName(tnode(e.to).kind)}: ${tr(`explorer.topology.edge.${e.label}`)}`);
    }
  }
  for (const n of nodes.filter((x) => !x.used)) {
    out.push(`${kindName(tnode(n.id).kind)}: ${tr('explorer.topology.notUsed')}`);
  }
  return out;
}
