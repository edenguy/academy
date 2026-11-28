import { type Graph } from './toy';
import { type QuestionId } from './search';

/** Four ways to answer one question (CODEGRAPH_LLD.md section 4.4). */

export type GraphKind = 'syntax' | 'index' | 'contract';
export type Verdict = 'right' | 'imprecise' | 'blind' | 'unavailable';
/** items: node ids, or bare names for syntax callees. */
export interface Answer {
  verdict: Verdict;
  items: string[];
}

const FORMAT_PRICE = 'money.format_price';
const GET_ORDER = 'api.get_order';
const TOTAL_PRICE = 'field.total_price';

export function definitionsNamed(g: Graph, name: string): string[] {
  return g.nodes.filter((n) => n.kind === 'function' && n.name === name).map((n) => n.id).sort();
}

export function truth(q: QuestionId, g: Graph): string[] {
  const sorted = (xs: string[]) => [...xs].sort();
  if (q === 'callers') return sorted(g.edges.filter((e) => e.kind === 'calls' && e.to === FORMAT_PRICE).map((e) => e.from));
  if (q === 'callees') return sorted(g.edges.filter((e) => e.kind === 'calls' && e.from === GET_ORDER).map((e) => e.to));
  return sorted(g.edges.filter((e) => e.kind === 'reads' && e.to === TOTAL_PRICE).map((e) => e.from));
}

export function answer(q: QuestionId, kind: GraphKind, g: Graph, opts: { buildBroken: boolean }): Answer {
  if (kind === 'syntax') {
    if (q === 'callers') {
      // sees only calls edges, and only the NAME of the target
      const names = new Set(g.nodes.filter((n) => n.name === 'format_price').map((n) => n.id));
      const items = [...new Set(g.edges.filter((e) => e.kind === 'calls' && names.has(e.to)).map((e) => e.from))].sort();
      return { verdict: definitionsNamed(g, 'format_price').length > 1 ? 'imprecise' : 'right', items };
    }
    if (q === 'callees') {
      const byId = new Map(g.nodes.map((n) => [n.id, n.name]));
      const items = g.edges
        .filter((e) => e.kind === 'calls' && e.from === GET_ORDER)
        .map((e) => byId.get(e.to) ?? e.to)
        .sort();
      return { verdict: 'right', items };
    }
    return { verdict: 'blind', items: [] };
  }
  if (kind === 'index') {
    if (opts.buildBroken) return { verdict: 'unavailable', items: [] };
    if (q === 'fieldReaders') return { verdict: 'blind', items: [] };
    return { verdict: 'right', items: truth(q, g) };
  }
  // contract
  if (q === 'fieldReaders') return { verdict: 'right', items: truth(q, g) };
  return { verdict: 'blind', items: [] };
}
