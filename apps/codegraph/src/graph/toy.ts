/**
 * The toy codebase: the single source of truth for lessons 1, 2, 3 and 5
 * (CODEGRAPH_LLD.md section 4.1). Code lines are data, in English, and are never translated.
 * Every number a lesson or explorer shows about the toy shop is computed from this file.
 */

export type RepoId = 'orders-service' | 'web-shop';
export const REPOS: RepoId[] = ['orders-service', 'web-shop'];

export interface ToyFile {
  id: string;
  repo: RepoId;
  path: string;
  lang: 'python' | 'typescript';
  lines: string[];
}

export type NodeKind = 'function' | 'endpoint' | 'field';
export interface ToyNode {
  id: string;
  kind: NodeKind;
  name: string;
  repo: RepoId;
  file?: string;
  line?: number;
}

export type EdgeKind = 'calls' | 'requests' | 'handledBy' | 'reads' | 'partOf';
/** "from depends on to". */
export interface ToyEdge {
  from: string;
  kind: EdgeKind;
  to: string;
}
export interface Graph {
  nodes: ToyNode[];
  edges: ToyEdge[];
}

export type OccurrenceRole = 'definition' | 'call' | 'import' | 'comment' | 'fieldWrite' | 'fieldRead';
export interface Occurrence {
  file: string;
  line: number;
  name: string;
  role: OccurrenceRole;
  target: string | null;
}

export const TOY_FILES: ToyFile[] = [
  {
    id: 'money',
    repo: 'orders-service',
    path: 'orders/money.py',
    lang: 'python',
    lines: [
      'def format_price(amount):',
      '    return f"{round_cents(amount):.2f}"',
      '',
      'def round_cents(amount):',
      '    return round(amount, 2)',
    ],
  },
  {
    id: 'legacy',
    repo: 'orders-service',
    path: 'orders/legacy.py',
    lang: 'python',
    lines: [
      'def format_price(amount):',
      '    return str(amount)',
      '',
      'def export_csv(orders):',
      '    return [format_price(o.total) for o in orders]',
    ],
  },
  {
    id: 'api',
    repo: 'orders-service',
    path: 'orders/api.py',
    lang: 'python',
    lines: [
      'from orders.money import format_price',
      '',
      '# GET /orders/{id}',
      'def get_order(order_id):',
      '    order = load_order(order_id)',
      '    return {"id": order.id, "total_price": format_price(order.total)}',
      '',
      'def load_order(order_id):',
      '    return db.find(order_id)',
    ],
  },
  {
    id: 'orderCard',
    repo: 'web-shop',
    path: 'web/orderCard.ts',
    lang: 'typescript',
    lines: [
      '// shows the price; format_price is done by the server',
      'export async function renderOrderCard(id: string) {',
      '  const order = await fetchOrder(id);',
      '  return `<b>${order.total_price}</b>`;',
      '}',
      '',
      'async function fetchOrder(id: string) {',
      '  return (await fetch(`/orders/${id}`)).json();',
      '}',
    ],
  },
];

export const TOY_NODES: ToyNode[] = [
  { id: 'money.format_price', kind: 'function', name: 'format_price', repo: 'orders-service', file: 'money', line: 1 },
  { id: 'money.round_cents', kind: 'function', name: 'round_cents', repo: 'orders-service', file: 'money', line: 4 },
  { id: 'legacy.format_price', kind: 'function', name: 'format_price', repo: 'orders-service', file: 'legacy', line: 1 },
  { id: 'legacy.export_csv', kind: 'function', name: 'export_csv', repo: 'orders-service', file: 'legacy', line: 4 },
  { id: 'api.get_order', kind: 'function', name: 'get_order', repo: 'orders-service', file: 'api', line: 4 },
  { id: 'api.load_order', kind: 'function', name: 'load_order', repo: 'orders-service', file: 'api', line: 8 },
  { id: 'web.renderOrderCard', kind: 'function', name: 'renderOrderCard', repo: 'web-shop', file: 'orderCard', line: 2 },
  { id: 'web.fetchOrder', kind: 'function', name: 'fetchOrder', repo: 'web-shop', file: 'orderCard', line: 7 },
  { id: 'endpoint.getOrder', kind: 'endpoint', name: 'GET /orders/{id}', repo: 'orders-service' },
  { id: 'field.id', kind: 'field', name: 'id', repo: 'orders-service' },
  { id: 'field.total_price', kind: 'field', name: 'total_price', repo: 'orders-service' },
];

export const BASE_EDGES: ToyEdge[] = [
  { from: 'api.get_order', kind: 'calls', to: 'money.format_price' },
  { from: 'api.get_order', kind: 'calls', to: 'api.load_order' },
  { from: 'money.format_price', kind: 'calls', to: 'money.round_cents' },
  { from: 'legacy.export_csv', kind: 'calls', to: 'legacy.format_price' },
  { from: 'web.renderOrderCard', kind: 'calls', to: 'web.fetchOrder' },
  { from: 'web.fetchOrder', kind: 'requests', to: 'endpoint.getOrder' },
  { from: 'endpoint.getOrder', kind: 'handledBy', to: 'api.get_order' },
  { from: 'web.renderOrderCard', kind: 'reads', to: 'field.total_price' },
  { from: 'field.total_price', kind: 'partOf', to: 'endpoint.getOrder' },
  { from: 'field.id', kind: 'partOf', to: 'endpoint.getOrder' },
];

export const BASE_GRAPH: Graph = { nodes: TOY_NODES, edges: BASE_EDGES };

/** The ground truth for what each search hit really is. */
export const OCCURRENCES: Occurrence[] = [
  { file: 'money', line: 1, name: 'format_price', role: 'definition', target: 'money.format_price' },
  { file: 'legacy', line: 1, name: 'format_price', role: 'definition', target: 'legacy.format_price' },
  { file: 'legacy', line: 5, name: 'format_price', role: 'call', target: 'legacy.format_price' },
  { file: 'api', line: 1, name: 'format_price', role: 'import', target: 'money.format_price' },
  { file: 'api', line: 6, name: 'format_price', role: 'call', target: 'money.format_price' },
  { file: 'orderCard', line: 1, name: 'format_price', role: 'comment', target: null },
  { file: 'api', line: 4, name: 'get_order', role: 'definition', target: 'api.get_order' },
  { file: 'api', line: 6, name: 'total_price', role: 'fieldWrite', target: 'field.total_price' },
  { file: 'orderCard', line: 4, name: 'total_price', role: 'fieldRead', target: 'field.total_price' },
];

export const SEARCH_TERMS = ['format_price', 'get_order', 'total_price'] as const;
export type SearchTerm = (typeof SEARCH_TERMS)[number];

export function fileById(id: string): ToyFile | undefined {
  return TOY_FILES.find((f) => f.id === id);
}

export function nodeById(g: Graph, id: string): ToyNode | undefined {
  return g.nodes.find((n) => n.id === id);
}

/** Short file name of a node ("money.py"), used to tell two same-named nodes apart. */
export function nodeFileName(n: ToyNode): string | null {
  if (!n.file) return null;
  const f = fileById(n.file);
  return f ? f.path.split('/').pop() ?? null : null;
}
