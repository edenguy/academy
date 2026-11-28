import { describe, expect, it } from 'vitest';
import { BASE_GRAPH } from './toy';
import { countEdgesByKind, countNodesByKind, dependencies, dependents, describeGraph, edgesOf, hopOf } from './graph';

const len = (start: string, hops: number[]) => hops.map((h) => dependents(BASE_GRAPH, start, h).length);

describe('graph walks', () => {
  it('counts nodes and edges by kind', () => {
    expect(countNodesByKind(BASE_GRAPH)).toEqual({ function: 8, endpoint: 1, field: 2 });
    expect(countEdgesByKind(BASE_GRAPH)).toEqual({ calls: 5, requests: 1, handledBy: 1, reads: 1, partOf: 2 });
  });

  it('blast radius of money.format_price grows 0, 1, 2, 5, 6, 6', () => {
    expect(len('money.format_price', [0, 1, 2, 3, 4, 5])).toEqual([0, 1, 2, 5, 6, 6]);
    expect(dependents(BASE_GRAPH, 'money.format_price', 1)).toEqual(['api.get_order']);
    expect(dependents(BASE_GRAPH, 'money.format_price', 2)).toEqual(['api.get_order', 'endpoint.getOrder']);
    expect(dependents(BASE_GRAPH, 'money.format_price', 3)).toEqual([
      'api.get_order', 'endpoint.getOrder', 'field.id', 'field.total_price', 'web.fetchOrder',
    ]);
    expect(dependents(BASE_GRAPH, 'money.format_price', 4)).toContain('web.renderOrderCard');
  });

  it('other start nodes', () => {
    expect(len('field.total_price', [0, 1, 2, 3, 4])).toEqual([0, 1, 1, 1, 1]);
    expect(len('money.round_cents', [0, 1, 2, 3, 4])).toEqual([0, 1, 2, 3, 6]);
    expect(len('endpoint.getOrder', [0, 1, 2, 3, 4])).toEqual([0, 3, 4, 4, 4]);
  });

  it('the other format_price has its own, separate blast radius', () => {
    expect(dependents(BASE_GRAPH, 'legacy.format_price', 4)).toEqual(['legacy.export_csv']);
  });

  it('hopOf is the reverse distance', () => {
    expect(hopOf(BASE_GRAPH, 'money.format_price', 'web.renderOrderCard')).toBe(4);
    expect(hopOf(BASE_GRAPH, 'money.format_price', 'api.get_order')).toBe(1);
    expect(hopOf(BASE_GRAPH, 'money.format_price', 'legacy.export_csv')).toBeNull();
  });

  it('dependencies walk forward', () => {
    expect(dependencies(BASE_GRAPH, 'api.get_order', 1)).toEqual(['api.load_order', 'money.format_price']);
    expect(dependencies(BASE_GRAPH, 'api.get_order', 2)).toEqual(['api.load_order', 'money.format_price', 'money.round_cents']);
  });

  it('edgesOf splits out and in', () => {
    const e = edgesOf(BASE_GRAPH, 'api.get_order');
    expect(e.out.length).toBe(2);
    expect(e.in.length).toBe(1);
  });

  it('describeGraph returns 21 strings', () => {
    const out = describeGraph(BASE_GRAPH, (k) => k);
    expect(out.length).toBe(21);
  });
});
