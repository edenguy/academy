import { describe, expect, it } from 'vitest';
import { COMMITS, diffGraphs, freshnessDecision, graphAt } from './staleness';
import { truth } from './answers';

const D = (p: number, h: number) => {
  const d = diffGraphs(graphAt(p), graphAt(h));
  return `${d.stillTrue.length}/${d.phantom.length}/${d.missing.length}`;
};

describe('the photograph ages', () => {
  it('has five commits and c0 is the base graph', () => {
    expect(COMMITS.map((c) => c.id)).toEqual(['c0', 'c1', 'c2', 'c3', 'c4']);
    expect(graphAt(0).edges.length).toBe(10);
    expect(graphAt(0).nodes.length).toBe(11);
  });

  // published p (rows) by head h (columns): stillTrue / phantom / missing
  const table: Record<number, string[]> = {
    0: ['10/0/0', '9/1/1', '8/2/1', '8/2/3', '8/2/3'],
    1: ['', '10/0/0', '9/1/0', '9/1/2', '9/1/2'],
    2: ['', '', '9/0/0', '9/0/2', '9/0/2'],
    3: ['', '', '', '11/0/0', '11/0/0'],
    4: ['', '', '', '', '11/0/0'],
  };
  for (const p of [0, 1, 2, 3, 4]) {
    for (let h = p; h <= 4; h++) {
      it(`published ${p}, head ${h}`, () => {
        expect(D(p, h)).toBe(table[p]![h]);
      });
    }
  }

  it('c1 renames a node and its edge follows', () => {
    const g = graphAt(1);
    expect(g.nodes.some((n) => n.id === 'money.round_money')).toBe(true);
    expect(g.nodes.some((n) => n.id === 'money.round_cents')).toBe(false);
    expect(g.edges).toContainEqual({ from: 'money.format_price', kind: 'calls', to: 'money.round_money' });
  });

  it('c2 removes legacy.py, c3 adds renderReceipt', () => {
    expect(graphAt(2).nodes.length).toBe(9);
    expect(graphAt(3).nodes.length).toBe(10);
    expect(graphAt(3).edges.length).toBe(11);
  });

  it('who reads total_price: 1 in the snapshot, 2 in the live code', () => {
    expect(truth('fieldReaders', graphAt(0)).length).toBe(1);
    expect(truth('fieldReaders', graphAt(3)).length).toBe(2);
  });

  it('freshness decisions', () => {
    expect(freshnessDecision({ behind: 0, hasSource: false })).toBe('trust');
    expect(freshnessDecision({ behind: 0, hasSource: true })).toBe('trust');
    expect(freshnessDecision({ behind: 2, hasSource: true })).toBe('verifyLive');
    expect(freshnessDecision({ behind: 2, hasSource: false })).toBe('answerAsOf');
  });
});
