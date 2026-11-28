import { describe, expect, it } from 'vitest';
import { splitIdentifiers } from './identifiers';

describe('splitIdentifiers', () => {
  it('wraps code names in both languages, longest match first', () => {
    expect(splitIdentifiers('הקובץ orders/legacy.py נמחק', true)).toEqual([
      { kind: 'text', text: 'הקובץ ' },
      { kind: 'code', text: 'orders/legacy.py' },
      { kind: 'text', text: ' נמחק' },
    ]);
    expect(splitIdentifiers('round_cents is renamed round_money', false).filter((s) => s.kind === 'code').map((s) => s.text)).toEqual(['round_cents', 'round_money']);
  });

  it('does not match inside a longer word', () => {
    expect(splitIdentifiers('commits behind', true).some((s) => s.kind === 'latin')).toBe(false);
    expect(splitIdentifiers('Commits behind', false)).toEqual([{ kind: 'text', text: 'Commits behind' }]);
  });

  it('isolates Latin terms and numbers in Hebrew only', () => {
    const he = splitIdentifiers('שרת MCP אחד ל-20,000 מפתחים (0.6%)', true);
    expect(he.filter((s) => s.kind === 'latin').map((s) => s.text)).toEqual(['MCP']);
    expect(he.filter((s) => s.kind === 'num').map((s) => s.text)).toEqual(['20,000', '0.6%']);
    expect(splitIdentifiers('An MCP server for 20,000', false)).toEqual([{ kind: 'text', text: 'An MCP server for 20,000' }]);
  });
});
