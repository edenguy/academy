import { describe, expect, it } from 'vitest';
import { TOY_FILES, type RepoId } from './toy';
import { agentSteps, classifyHit, relevantHits, searchCost, searchText, type QuestionId } from './search';

const BOTH: RepoId[] = ['orders-service', 'web-shop'];
const ORDERS: RepoId[] = ['orders-service'];

const rows: { term: string; q: QuestionId; visible: RepoId[]; hits: number; files: number; lines: number; relevant: number; steps: number }[] = [
  { term: 'format_price', q: 'callers', visible: BOTH, hits: 6, files: 4, lines: 28, relevant: 1, steps: 6 },
  { term: 'format_price', q: 'callers', visible: ORDERS, hits: 5, files: 3, lines: 19, relevant: 1, steps: 5 },
  { term: 'get_order', q: 'callees', visible: BOTH, hits: 1, files: 1, lines: 9, relevant: 0, steps: 3 },
  { term: 'total_price', q: 'fieldReaders', visible: BOTH, hits: 2, files: 2, lines: 18, relevant: 1, steps: 4 },
  { term: 'total_price', q: 'fieldReaders', visible: ORDERS, hits: 1, files: 1, lines: 9, relevant: 0, steps: 3 },
];

describe('search over the toy shop', () => {
  for (const r of rows) {
    it(`${r.term} with ${r.visible.length} repo(s)`, () => {
      const hits = searchText(TOY_FILES, r.term, r.visible);
      expect(searchCost(TOY_FILES, r.term, r.visible)).toEqual({ hits: r.hits, files: r.files, linesToRead: r.lines });
      expect(relevantHits(r.q, hits, r.term).length).toBe(r.relevant);
      expect(agentSteps(TOY_FILES, r.term, r.visible).length).toBe(r.steps);
    });
  }

  it('the relevant format_price hit is api:6', () => {
    const hits = searchText(TOY_FILES, 'format_price', BOTH);
    const rel = relevantHits('callers', hits);
    expect(rel.map((h) => `${h.file}:${h.line}`)).toEqual(['api:6']);
    expect(classifyHit(hits[0]!, 'format_price').role).toBe('definition');
  });

  it('the agent reads 5, 10, 19, 28 lines as it opens four files', () => {
    const steps = agentSteps(TOY_FILES, 'format_price', BOTH);
    expect(steps.map((s) => s.kind)).toEqual(['ask', 'search', 'open', 'open', 'open', 'open']);
    expect(steps.slice(2).map((s) => s.linesRead)).toEqual([5, 10, 19, 28]);
    expect(steps[1]!.hitsSoFar).toBe(6);
    expect(steps[5]!.filesOpened).toBe(4);
  });

  it('the file-order search puts hits ascending within a file', () => {
    const hits = searchText(TOY_FILES, 'format_price', BOTH).map((h) => `${h.file}:${h.line}`);
    expect(hits).toEqual(['money:1', 'legacy:1', 'legacy:5', 'api:1', 'api:6', 'orderCard:1']);
  });

  it('is case-sensitive and empty for an unknown word', () => {
    expect(searchText(TOY_FILES, 'Format_Price', BOTH)).toEqual([]);
  });
});
