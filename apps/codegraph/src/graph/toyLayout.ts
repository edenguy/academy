import type { ToyEdge } from './toy';

/**
 * Geometry of the toy graph drawing (CODEGRAPH_LLD.md section 4.3, plus the staleness
 * additions of section 4.6). Pure data and pure functions; the component only draws it.
 */

export type GraphLayout = 'wide' | 'narrow';
export type GraphVariant = 'graph' | 'staleness';
export interface XY {
  x: number;
  y: number;
}
export interface Rect {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}
export interface GroupBox extends Rect {
  id: string;
  kind: 'repo' | 'file' | 'contract';
  /** Which repo the box belongs to (drawn tinted and dashed for web-shop). */
  repo: 'orders-service' | 'web-shop';
  /** orders/money.py, a repo name, or the contract group. */
  label: string;
}

export const VIEWBOX_TOY: Record<GraphLayout, { w: number; h: number }> = { wide: { w: 720, h: 420 }, narrow: { w: 360, h: 440 } };
export const PILL: Record<GraphLayout, { w: number; h: number }> = { wide: { w: 150, h: 36 }, narrow: { w: 152, h: 34 } };

const WIDE: Record<string, XY> = {
  'money.format_price': { x: 110, y: 68 },
  'money.round_cents': { x: 110, y: 118 },
  'legacy.format_price': { x: 110, y: 308 },
  'legacy.export_csv': { x: 110, y: 360 },
  'api.get_order': { x: 360, y: 68 },
  'api.load_order': { x: 360, y: 118 },
  'endpoint.getOrder': { x: 360, y: 236 },
  'field.id': { x: 360, y: 304 },
  'field.total_price': { x: 360, y: 356 },
  'web.fetchOrder': { x: 600, y: 236 },
  'web.renderOrderCard': { x: 600, y: 356 },
  'web.renderReceipt': { x: 600, y: 296 },
};
const NARROW: Record<string, XY> = {
  'money.format_price': { x: 92, y: 52 },
  'money.round_cents': { x: 92, y: 94 },
  'api.get_order': { x: 268, y: 52 },
  'api.load_order': { x: 268, y: 94 },
  'legacy.format_price': { x: 92, y: 174 },
  'legacy.export_csv': { x: 92, y: 216 },
  'endpoint.getOrder': { x: 268, y: 174 },
  'field.id': { x: 268, y: 216 },
  'field.total_price': { x: 268, y: 258 },
  'web.fetchOrder': { x: 180, y: 354 },
  'web.renderOrderCard': { x: 180, y: 398 },
};
/** In the staleness drawing the web box widens so renderOrderCard and renderReceipt sit side by side. */
const NARROW_STALENESS: Record<string, XY> = {
  ...NARROW,
  'web.renderOrderCard': { x: 88, y: 398 },
  'web.renderReceipt': { x: 272, y: 398 },
};

/** A node that was renamed keeps its place. */
const ALIAS: Record<string, string> = { 'money.round_money': 'money.round_cents' };

export function positionsFor(layout: GraphLayout, variant: GraphVariant): Record<string, XY> {
  const base = layout === 'wide' ? WIDE : variant === 'staleness' ? NARROW_STALENESS : NARROW;
  const out: Record<string, XY> = { ...base };
  for (const [a, b] of Object.entries(ALIAS)) out[a] = base[b]!;
  return out;
}

export function groupsFor(layout: GraphLayout, variant: GraphVariant): GroupBox[] {
  const o = 'orders-service' as const;
  const w = 'web-shop' as const;
  if (layout === 'wide') {
    return [
      { id: 'repo-orders', kind: 'repo', repo: o, label: 'orders-service', x1: 10, y1: 8, x2: 470, y2: 412 },
      { id: 'file-money', kind: 'file', repo: o, label: 'orders/money.py', x1: 24, y1: 30, x2: 196, y2: 150 },
      { id: 'file-legacy', kind: 'file', repo: o, label: 'orders/legacy.py', x1: 24, y1: 262, x2: 196, y2: 400 },
      { id: 'file-api', kind: 'file', repo: o, label: 'orders/api.py', x1: 264, y1: 30, x2: 456, y2: 150 },
      { id: 'contract', kind: 'contract', repo: o, label: 'contract', x1: 264, y1: 190, x2: 456, y2: 400 },
      { id: 'repo-web', kind: 'repo', repo: w, label: 'web-shop', x1: 490, y1: 8, x2: 710, y2: 412 },
      { id: 'file-card', kind: 'file', repo: w, label: 'web/orderCard.ts', x1: 504, y1: 190, x2: 696, y2: 400 },
    ];
  }
  return [
    { id: 'file-money', kind: 'file', repo: o, label: 'orders/money.py', x1: 8, y1: 8, x2: 176, y2: 118 },
    { id: 'file-api', kind: 'file', repo: o, label: 'orders/api.py', x1: 184, y1: 8, x2: 352, y2: 118 },
    { id: 'file-legacy', kind: 'file', repo: o, label: 'orders/legacy.py', x1: 8, y1: 130, x2: 176, y2: 240 },
    { id: 'contract', kind: 'contract', repo: o, label: 'contract', x1: 184, y1: 130, x2: 352, y2: 290 },
    variant === 'staleness'
      ? { id: 'file-card', kind: 'file', repo: w, label: 'web/orderCard.ts', x1: 8, y1: 310, x2: 352, y2: 430 }
      : { id: 'file-card', kind: 'file', repo: w, label: 'web/orderCard.ts', x1: 96, y1: 310, x2: 264, y2: 430 },
  ];
}

export function pillRect(c: XY, layout: GraphLayout): Rect {
  const p = PILL[layout];
  return { x1: c.x - p.w / 2, y1: c.y - p.h / 2, x2: c.x + p.w / 2, y2: c.y + p.h / 2 };
}

/** Where the segment centre-to-centre leaves a rectangle. */
function clip(center: XY, other: XY, r: Rect): XY {
  const dx = other.x - center.x;
  const dy = other.y - center.y;
  const hw = (r.x2 - r.x1) / 2;
  const hh = (r.y2 - r.y1) / 2;
  if (dx === 0 && dy === 0) return center;
  const t = Math.min(dx === 0 ? Infinity : hw / Math.abs(dx), dy === 0 ? Infinity : hh / Math.abs(dy));
  return { x: center.x + dx * t, y: center.y + dy * t };
}

/** Does the straight segment a-b pass through the rectangle (grown by `pad`)? */
export function segmentHitsRect(a: XY, b: XY, r: Rect, pad = 2): boolean {
  const x1 = r.x1 - pad;
  const y1 = r.y1 - pad;
  const x2 = r.x2 + pad;
  const y2 = r.y2 + pad;
  // Liang-Barsky
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const p = [-dx, dx, -dy, dy];
  const q = [a.x - x1, x2 - a.x, a.y - y1, y2 - a.y];
  let t0 = 0;
  let t1 = 1;
  for (let i = 0; i < 4; i++) {
    if (p[i] === 0) {
      if (q[i]! < 0) return false;
    } else {
      const t = q[i]! / p[i]!;
      if (p[i]! < 0) t0 = Math.max(t0, t);
      else t1 = Math.min(t1, t);
    }
  }
  return t0 < t1;
}

export interface EdgeGeometry {
  d: string;
  start: XY;
  end: XY;
  /** Unit tangent at the end, for the arrowhead. */
  dir: XY;
  mid: XY;
  curved: boolean;
}

const q = (t: number, a: number, c: number, b: number) => (1 - t) * (1 - t) * a + 2 * (1 - t) * t * c + t * t * b;

/**
 * Straight line between the pill borders; a quadratic curve bowed away from any pill the
 * straight line would cross. The bow is the smallest that clears the crossed pills by 10 px,
 * on the side that stays inside the viewBox and misses every other pill.
 */
export function edgeGeometry(layout: GraphLayout, variant: GraphVariant, e: Pick<ToyEdge, 'from' | 'to'>, drawn: string[]): EdgeGeometry {
  const pos = positionsFor(layout, variant);
  const a = pos[e.from]!;
  const b = pos[e.to]!;
  const ra = pillRect(a, layout);
  const rb = pillRect(b, layout);
  const s = clip(a, b, ra);
  const t = clip(b, a, rb);
  // a renamed node keeps its place, so an id that sits where an endpoint sits is that endpoint
  const samePlace = (p: XY, c: XY) => p.x === c.x && p.y === c.y;
  const others = drawn.filter((id) => id !== e.from && id !== e.to && pos[id] && !samePlace(pos[id]!, a) && !samePlace(pos[id]!, b)).map((id) => pillRect(pos[id]!, layout));
  const blockers = others.filter((r) => segmentHitsRect(s, t, r));
  const vb = VIEWBOX_TOY[layout];
  const straight = (): EdgeGeometry => {
    const len = Math.hypot(t.x - s.x, t.y - s.y) || 1;
    return {
      d: `M${s.x} ${s.y} L${t.x} ${t.y}`,
      start: s, end: t, dir: { x: (t.x - s.x) / len, y: (t.y - s.y) / len },
      mid: { x: (s.x + t.x) / 2, y: (s.y + t.y) / 2 }, curved: false,
    };
  };
  if (!blockers.length) return straight();

  const m = { x: (s.x + t.x) / 2, y: (s.y + t.y) / 2 };
  const len = Math.hypot(t.x - s.x, t.y - s.y) || 1;
  const n0 = { x: -(t.y - s.y) / len, y: (t.x - s.x) / len };
  let best: { c: XY; score: number } | null = null;
  for (const side of [1, -1]) {
    const n = { x: n0.x * side, y: n0.y * side };
    // how far the apex must sit from the chord to clear every blocker by 10 px
    let apex = 0;
    for (const r of blockers) {
      for (const cx of [r.x1, r.x2]) for (const cy of [r.y1, r.y2]) apex = Math.max(apex, (cx - m.x) * n.x + (cy - m.y) * n.y);
    }
    apex += 10;
    const c = { x: m.x + n.x * apex * 2, y: m.y + n.y * apex * 2 };
    const ap = { x: q(0.5, s.x, c.x, t.x), y: q(0.5, s.y, c.y, t.y) };
    let score = apex;
    if (ap.x < 4 || ap.x > vb.w - 4 || ap.y < 4 || ap.y > vb.h - 4) score += 1000;
    // sample the curve against every pill
    for (let i = 1; i < 20; i++) {
      const p = { x: q(i / 20, s.x, c.x, t.x), y: q(i / 20, s.y, c.y, t.y) };
      if (others.some((r) => p.x > r.x1 - 2 && p.x < r.x2 + 2 && p.y > r.y1 - 2 && p.y < r.y2 + 2)) score += 500;
    }
    if (!best || score < best.score) best = { c, score };
  }
  const c = best!.c;
  const dl = Math.hypot(t.x - c.x, t.y - c.y) || 1;
  return {
    d: `M${s.x} ${s.y} Q${c.x} ${c.y} ${t.x} ${t.y}`,
    start: s, end: t, dir: { x: (t.x - c.x) / dl, y: (t.y - c.y) / dl },
    mid: { x: q(0.5, s.x, c.x, t.x), y: q(0.5, s.y, c.y, t.y) }, curved: true,
  };
}
