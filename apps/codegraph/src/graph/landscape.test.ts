import { describe, expect, it } from 'vitest';
import { LAYERS, PIECES, countByStatus, piecesIn } from './landscape';

describe('the landscape', () => {
  it('has 21 pieces in five layers', () => {
    expect(PIECES.length).toBe(21);
    expect(LAYERS).toEqual(['format', 'indexer', 'storage', 'serving', 'org']);
    expect(LAYERS.reduce((n, l) => n + piecesIn(l).length, 0)).toBe(21);
  });

  it('counts per layer (spec / project / pattern)', () => {
    const c = (l: (typeof LAYERS)[number]) => {
      const r = countByStatus(l);
      return [r.spec, r.project, r.pattern];
    };
    expect(c('format')).toEqual([3, 0, 0]);
    expect(c('indexer')).toEqual([0, 4, 0]);
    expect(c('storage')).toEqual([0, 1, 2]);
    expect(c('serving')).toEqual([2, 0, 1]);
    expect(c('org')).toEqual([6, 1, 1]);
  });

  it('every non-pattern piece has an https source; patterns have none except the central index', () => {
    for (const p of PIECES) {
      if (p.status === 'pattern') {
        if (p.id === 'central-index') expect(p.source).toMatch(/^https:\/\/abseil\.io\/resources\/swe-book\/html\/ch17\.html$/);
        else expect(p.source).toBeNull();
      } else {
        expect(p.source, p.id).toMatch(/^https:\/\//);
      }
    }
  });

  it('piece ids are unique', () => {
    expect(new Set(PIECES.map((p) => p.id)).size).toBe(21);
  });
});
