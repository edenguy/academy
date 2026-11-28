import { describe, expect, it } from 'vitest';
import { BASE_EDGES, BASE_GRAPH, OCCURRENCES, SEARCH_TERMS, TOY_FILES, TOY_NODES, fileById } from './toy';
import { searchText } from './search';

describe('toy codebase', () => {
  it('has 4 files and 28 lines (5, 5, 9, 9)', () => {
    expect(TOY_FILES.length).toBe(4);
    expect(TOY_FILES.map((f) => f.lines.length)).toEqual([5, 5, 9, 9]);
    expect(TOY_FILES.reduce((n, f) => n + f.lines.length, 0)).toBe(28);
  });

  it('has 11 nodes and 10 edges, and every edge endpoint is a node', () => {
    expect(TOY_NODES.length).toBe(11);
    expect(BASE_EDGES.length).toBe(10);
    const ids = new Set(TOY_NODES.map((n) => n.id));
    expect(ids.size).toBe(11);
    for (const e of BASE_EDGES) {
      expect(ids.has(e.from)).toBe(true);
      expect(ids.has(e.to)).toBe(true);
    }
  });

  it("every function node's file:line contains its definition", () => {
    for (const n of TOY_NODES.filter((x) => x.kind === 'function')) {
      const f = fileById(n.file!);
      const text = f!.lines[n.line! - 1]!;
      expect(text.includes(`def ${n.name}`) || text.includes(`function ${n.name}`), `${n.id}: ${text}`).toBe(true);
      expect(f!.repo).toBe(n.repo);
    }
  });

  it('search hits equal OCCURRENCES for each searchable term', () => {
    for (const term of SEARCH_TERMS) {
      const found = searchText(TOY_FILES, term, ['orders-service', 'web-shop']).map((h) => `${h.file}:${h.line}`).sort();
      const truth = OCCURRENCES.filter((o) => o.name === term).map((o) => `${o.file}:${o.line}`).sort();
      expect(found).toEqual(truth);
    }
    expect(OCCURRENCES.length).toBe(9);
  });

  it('every occurrence target is a node', () => {
    const ids = new Set(BASE_GRAPH.nodes.map((n) => n.id));
    for (const o of OCCURRENCES) if (o.target) expect(ids.has(o.target)).toBe(true);
  });
});
