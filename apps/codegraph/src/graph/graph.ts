import { fileById, nodeFileName, type EdgeKind, type Graph, type NodeKind, type ToyEdge, type ToyNode } from './toy';

/** Graph walks (CODEGRAPH_LLD.md section 4.3). */

function walk(g: Graph, start: string, hops: number, dir: 'reverse' | 'forward'): Map<string, number> {
  const dist = new Map<string, number>([[start, 0]]);
  let frontier = [start];
  for (let h = 1; h <= hops; h++) {
    const next: string[] = [];
    for (const id of frontier) {
      for (const e of g.edges) {
        // reverse: X is a dependent of Y when an edge X -> Y exists
        const [a, b] = dir === 'reverse' ? [e.to, e.from] : [e.from, e.to];
        if (a === id && !dist.has(b)) {
          dist.set(b, h);
          next.push(b);
        }
      }
    }
    frontier = next;
  }
  dist.delete(start);
  return dist;
}

/** Reverse breadth-first over edges, up to `hops` steps, excluding `start`, sorted by id. */
export function dependents(g: Graph, start: string, hops: number): string[] {
  return [...walk(g, start, hops, 'reverse').keys()].sort();
}

/** Forward breadth-first: what `start` depends on. */
export function dependencies(g: Graph, start: string, hops: number): string[] {
  return [...walk(g, start, hops, 'forward').keys()].sort();
}

/** Reverse distance from `start` to `target`, or null if `target` is not a dependent. */
export function hopOf(g: Graph, start: string, target: string): number | null {
  const d = walk(g, start, g.nodes.length, 'reverse');
  return d.get(target) ?? null;
}

export function dependentHops(g: Graph, start: string, hops: number): Map<string, number> {
  return walk(g, start, hops, 'reverse');
}

export function countNodesByKind(g: Graph): Record<NodeKind, number> {
  const r: Record<NodeKind, number> = { function: 0, endpoint: 0, field: 0 };
  for (const n of g.nodes) r[n.kind] += 1;
  return r;
}

export function countEdgesByKind(g: Graph): Record<EdgeKind, number> {
  const r: Record<EdgeKind, number> = { calls: 0, requests: 0, handledBy: 0, reads: 0, partOf: 0 };
  for (const e of g.edges) r[e.kind] += 1;
  return r;
}

export function edgesOf(g: Graph, id: string): { out: ToyEdge[]; in: ToyEdge[] } {
  return { out: g.edges.filter((e) => e.from === id), in: g.edges.filter((e) => e.to === id) };
}

/** The contract edges (everything except `calls`) are drawn dashed. */
export function isContractEdge(k: EdgeKind): boolean {
  return k !== 'calls';
}

/** Label of a node: `name`, plus the file name for functions, so same-named nodes differ. */
export function nodeLabel(n: ToyNode): string {
  const f = nodeFileName(n);
  return f ? `${n.name} (${f})` : n.name;
}

/** One string per node and per edge, for the visually hidden text alternative. */
export function describeGraph(g: Graph, t: (key: string, o?: object) => string): string[] {
  const byId = new Map(g.nodes.map((n) => [n.id, n]));
  const label = (id: string) => {
    const n = byId.get(id);
    return n ? nodeLabel(n) : id;
  };
  const out: string[] = [];
  for (const n of g.nodes) {
    const f = n.file ? fileById(n.file)?.path : null;
    out.push(`${t(`explorer.kind.${n.kind}`)}: ${n.name}, ${n.repo}${f ? `, ${f}` : ''}`);
  }
  for (const e of g.edges) out.push(`${label(e.from)} ${t(`explorer.edge.${e.kind}`)} ${label(e.to)}`);
  return out;
}
