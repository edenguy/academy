import { BASE_GRAPH, type Graph, type ToyEdge, type ToyNode } from './toy';

/** The photograph ages (CODEGRAPH_LLD.md section 4.6). */

export interface Commit {
  id: 'c0' | 'c1' | 'c2' | 'c3' | 'c4';
  summaryKey: string;
  apply: (g: Graph) => Graph;
}

const rename = (g: Graph): Graph => {
  const from = 'money.round_cents';
  const to = 'money.round_money';
  const nodes: ToyNode[] = g.nodes.map((n) => (n.id === from ? { ...n, id: to, name: 'round_money' } : n));
  const edges: ToyEdge[] = g.edges.map((e) => ({ ...e, from: e.from === from ? to : e.from, to: e.to === from ? to : e.to }));
  return { nodes, edges };
};

const deleteLegacy = (g: Graph): Graph => {
  const gone = (id: string) => id.startsWith('legacy.');
  return {
    nodes: g.nodes.filter((n) => !gone(n.id)),
    edges: g.edges.filter((e) => !gone(e.from) && !gone(e.to)),
  };
};

const addReceipt = (g: Graph): Graph => ({
  nodes: [...g.nodes, { id: 'web.renderReceipt', kind: 'function', name: 'renderReceipt', repo: 'web-shop', file: 'orderCard' }],
  edges: [
    ...g.edges,
    { from: 'web.renderReceipt', kind: 'calls', to: 'web.fetchOrder' },
    { from: 'web.renderReceipt', kind: 'reads', to: 'field.total_price' },
  ],
});

export const COMMITS: Commit[] = [
  { id: 'c0', summaryKey: '', apply: (g) => g },
  { id: 'c1', summaryKey: 'explorer.staleness.commit.c1', apply: rename },
  { id: 'c2', summaryKey: 'explorer.staleness.commit.c2', apply: deleteLegacy },
  { id: 'c3', summaryKey: 'explorer.staleness.commit.c3', apply: addReceipt },
  { id: 'c4', summaryKey: 'explorer.staleness.commit.c4', apply: (g) => g },
];

/** Fold COMMITS[1..index] over the base graph. */
export function graphAt(index: number): Graph {
  let g = BASE_GRAPH;
  for (let i = 1; i <= index && i < COMMITS.length; i++) g = COMMITS[i]!.apply(g);
  return g;
}

const key = (e: ToyEdge) => `${e.from}|${e.kind}|${e.to}`;

/** Edges compared by (from, kind, to). */
export function diffGraphs(snapshot: Graph, live: Graph): { stillTrue: ToyEdge[]; phantom: ToyEdge[]; missing: ToyEdge[] } {
  const s = new Set(snapshot.edges.map(key));
  const l = new Set(live.edges.map(key));
  return {
    stillTrue: snapshot.edges.filter((e) => l.has(key(e))),
    phantom: snapshot.edges.filter((e) => !l.has(key(e))),
    missing: live.edges.filter((e) => !s.has(key(e))),
  };
}

export type FreshnessDecision = 'trust' | 'verifyLive' | 'answerAsOf';

export function freshnessDecision(i: { behind: number; hasSource: boolean }): FreshnessDecision {
  if (i.behind === 0) return 'trust';
  return i.hasSource ? 'verifyLive' : 'answerAsOf';
}
