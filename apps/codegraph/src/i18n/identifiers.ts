/**
 * Identifiers that must stay left-to-right inside Hebrew text (CODEGRAPH_LLD.md section 5.4).
 * The component does not rely on the bidi algorithm for these: it splits the string on this
 * fixed list and renders each match inside an LTR island.
 */

/** Code names. A monospace chip in both languages. Longest first is enforced when the pattern is built. */
export const CODE_IDENTIFIERS = [
  'orders/legacy.py', 'orders/money.py', 'GET /orders/{id}',
  'format_price', 'round_cents', 'round_money', 'get_order', 'load_order', 'total_price', 'export_csv',
  'renderReceipt', 'renderOrderCard', 'fetchOrder',
  'money.py', 'legacy.py', 'api.py', 'web-shop', 'orders-service',
  'ownedBy', 'consumesApi', 'providesApi',
];

/** Latin terms and acronyms. An LTR island (no chip) in Hebrew only. */
export const LATIN_TERMS = [
  'commit', 'CI', 'MCP', 'HTTP', 'SCIP', 'LSIF', 'LSP', 'protobuf', 'tree-sitter',
  'Sourcegraph', 'Google', 'Meta', 'Kythe', 'Glean', 'CodeQL', 'Backstage', 'OpenAPI', 'AsyncAPI', 'GraphQL', 'ECMA-424',
];

export type SegmentKind = 'text' | 'code' | 'latin' | 'num';
export interface Segment {
  kind: SegmentKind;
  text: string;
}

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
const alt = (list: string[]) => [...list].sort((a, b) => b.length - a.length).map(esc).join('|');
const B = '(?<![A-Za-z0-9_])';
const A = '(?![A-Za-z0-9_])';

const RE_HE = new RegExp(`(${B}(?:${alt(CODE_IDENTIFIERS)})${A})|(${B}(?:${alt(LATIN_TERMS)})${A})|(\\d[\\d,]*(?:\\.\\d+)?%?)`, 'g');
const RE_EN = new RegExp(`(${B}(?:${alt(CODE_IDENTIFIERS)})${A})`, 'g');

export function splitIdentifiers(text: string, hebrew: boolean): Segment[] {
  const re = hebrew ? RE_HE : RE_EN;
  const out: Segment[] = [];
  let last = 0;
  for (const m of text.matchAll(re)) {
    const i = m.index ?? 0;
    if (i > last) out.push({ kind: 'text', text: text.slice(last, i) });
    out.push({ kind: m[1] ? 'code' : m[2] ? 'latin' : 'num', text: m[0] });
    last = i + m[0].length;
  }
  if (last < text.length) out.push({ kind: 'text', text: text.slice(last) });
  return out;
}
