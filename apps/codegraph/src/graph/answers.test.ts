import { describe, expect, it } from 'vitest';
import { BASE_GRAPH } from './toy';
import { answer, definitionsNamed, truth, type GraphKind } from './answers';
import { graphAt } from './staleness';
import type { QuestionId } from './search';

const ok = { buildBroken: false };

describe('four ways to answer', () => {
  it('truth on the base graph', () => {
    expect(truth('callers', BASE_GRAPH)).toEqual(['api.get_order']);
    expect(truth('callees', BASE_GRAPH)).toEqual(['api.load_order', 'money.format_price']);
    expect(truth('fieldReaders', BASE_GRAPH)).toEqual(['web.renderOrderCard']);
  });

  const table: [QuestionId, GraphKind, string, string[]][] = [
    ['callers', 'syntax', 'imprecise', ['api.get_order', 'legacy.export_csv']],
    ['callers', 'index', 'right', ['api.get_order']],
    ['callers', 'contract', 'blind', []],
    ['callees', 'syntax', 'right', ['format_price', 'load_order']],
    ['callees', 'index', 'right', ['api.load_order', 'money.format_price']],
    ['callees', 'contract', 'blind', []],
    ['fieldReaders', 'syntax', 'blind', []],
    ['fieldReaders', 'index', 'blind', []],
    ['fieldReaders', 'contract', 'right', ['web.renderOrderCard']],
  ];
  for (const [q, k, verdict, items] of table) {
    it(`${q} / ${k} is ${verdict}`, () => {
      expect(answer(q, k, BASE_GRAPH, ok)).toEqual({ verdict, items });
    });
  }

  it('a broken build makes the compiler index unavailable and changes nothing else', () => {
    for (const q of ['callers', 'callees', 'fieldReaders'] as QuestionId[]) {
      expect(answer(q, 'index', BASE_GRAPH, { buildBroken: true })).toEqual({ verdict: 'unavailable', items: [] });
      expect(answer(q, 'syntax', BASE_GRAPH, { buildBroken: true })).toEqual(answer(q, 'syntax', BASE_GRAPH, ok));
      expect(answer(q, 'contract', BASE_GRAPH, { buildBroken: true })).toEqual(answer(q, 'contract', BASE_GRAPH, ok));
    }
  });

  it('after legacy.py is deleted the syntax graph is no longer ambiguous', () => {
    expect(answer('callers', 'syntax', graphAt(2), ok)).toEqual({ verdict: 'right', items: ['api.get_order'] });
  });

  it('definitionsNamed finds both format_price definitions', () => {
    expect(definitionsNamed(BASE_GRAPH, 'format_price')).toEqual(['legacy.format_price', 'money.format_price']);
  });
});
