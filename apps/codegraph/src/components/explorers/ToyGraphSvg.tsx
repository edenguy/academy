import { useTranslation } from 'react-i18next';
import { clsx } from 'clsx';
import type { EdgeKind, ToyEdge, ToyNode } from '@/graph/toy';
import { nodeFileName } from '@/graph/toy';
import { PILL, VIEWBOX_TOY, edgeGeometry, groupsFor, pillRect, positionsFor, type GraphLayout, type GraphVariant } from '@/graph/toyLayout';
import { isContractEdge } from '@/graph/graph';
import type { FigureAria } from './FigureAlt';

export type EdgeState = 'plain' | 'stillTrue' | 'phantom' | 'missing';
export interface DrawEdge extends ToyEdge {
  state?: EdgeState;
}
export interface NodeMark {
  /** Replaces the file-name sub-label (staleness: the old name of a renamed function). */
  sub?: string;
  role?: 'start' | 'radius';
  hop?: number;
  ghost?: 'snapshotOnly' | 'liveOnly';
}

const arrow = (end: { x: number; y: number }, dir: { x: number; y: number }, size: number) => {
  const nx = -dir.y;
  const ny = dir.x;
  const bx = end.x - dir.x * size;
  const by = end.y - dir.y * size;
  return `M${end.x} ${end.y} L${bx + nx * size * 0.55} ${by + ny * size * 0.55} L${bx - nx * size * 0.55} ${by - ny * size * 0.55} Z`;
};

/**
 * The toy graph, drawn from `src/graph/toyLayout.ts`. Used by the graph explorer (edge kinds
 * and blast radius) and the staleness explorer (still true / phantom / missing).
 * Geometry does not mirror in Hebrew (D10): only labels change language.
 */
export function ToyGraphSvg({
  layout, variant, nodes, edges, mark, selected, onSelect, fontScale, aria,
}: {
  layout: GraphLayout;
  variant: GraphVariant;
  nodes: ToyNode[];
  edges: DrawEdge[];
  mark: (id: string) => NodeMark;
  selected?: string | null;
  onSelect?: (id: string) => void;
  /** viewBox units per rendered CSS px, so text never renders below 12 px. */
  fontScale: number;
  aria: FigureAria;
}) {
  const { t, i18n } = useTranslation();
  const he = i18n.language === 'he';
  const pos = positionsFor(layout, variant);
  const vb = VIEWBOX_TOY[layout];
  const pill = PILL[layout];
  const drawn = nodes.map((n) => n.id);
  const nameSize = Math.max(layout === 'wide' ? 14 : 13, 12.6 * fontScale);
  const subSize = Math.max(12, 12.4 * fontScale);
  const groupSize = Math.max(layout === 'wide' ? 13 : 12, 12.4 * fontScale);
  const groups = groupsFor(layout, variant);
  const drawnGroups = groups.filter((g) => g.kind === 'repo' || nodes.some((n) => {
    const p = pos[n.id];
    return p && p.x >= g.x1 && p.x <= g.x2 && p.y >= g.y1 && p.y <= g.y2;
  }));

  const sameName = (n: ToyNode) => nodes.filter((o) => o.name === n.name).length > 1;
  const groupLabel = (label: string, kind: string) => (kind === 'contract' ? t('explorer.kind.contractGroup') : label);

  return (
    <svg
      viewBox={`0 0 ${vb.w} ${vb.h}`}
      className="w-full h-auto block"
      style={{ direction: 'ltr', maxWidth: layout === 'narrow' ? 420 : undefined, margin: layout === 'narrow' ? '0 auto' : undefined }}
      data-layout={layout}
      {...aria}
    >
      {drawnGroups.map((g) => (
        <g key={g.id}>
          <rect
            x={g.x1} y={g.y1} width={g.x2 - g.x1} height={g.y2 - g.y1} rx={g.kind === 'repo' ? 16 : 12}
            fill={g.kind === 'repo' ? 'none' : g.repo === 'web-shop' ? 'var(--surface-3)' : 'var(--surface-2)'}
            stroke="var(--line-strong)" strokeWidth={1}
            strokeDasharray={g.repo === 'web-shop' ? '5 4' : undefined}
          />
          {(g.kind !== 'repo' || layout === 'wide') && (() => {
            const rtl = he && g.kind === 'contract';
            return (
              <text
                x={rtl ? g.x2 - 10 : g.x1 + 10} y={g.y1 + groupSize + 3} fontSize={groupSize} fill="var(--ink-2)"
                fontFamily={g.kind === 'contract' ? undefined : 'var(--font-mono)'} textAnchor="start"
                style={{ direction: rtl ? 'rtl' : 'ltr', unicodeBidi: 'isolate' }}
              >
                {groupLabel(g.label, g.kind)}
              </text>
            );
          })()}
        </g>
      ))}

      {edges.map((e, i) => {
        if (!pos[e.from] || !pos[e.to]) return null;
        // two edges that land on the same line (a renamed function) are drawn side by side
        const dup = edges.slice(0, i).filter((o) => pos[o.from]!.x === pos[e.from]!.x && pos[o.from]!.y === pos[e.from]!.y && pos[o.to]!.x === pos[e.to]!.x && pos[o.to]!.y === pos[e.to]!.y).length;
        const geo = edgeGeometry(layout, variant, e, drawn);
        const state = e.state ?? 'plain';
        let stroke = 'var(--series-a)';
        let dash: string | undefined;
        if (state === 'plain') {
          if (isContractEdge(e.kind as EdgeKind)) { stroke = 'var(--series-b)'; dash = '6 4'; }
        } else if (state === 'stillTrue') stroke = 'var(--good-fill)';
        else if (state === 'phantom') stroke = 'var(--critical-fill)';
        else { stroke = 'var(--highlight)'; dash = '6 4'; }
        const aSize = layout === 'wide' ? 9 : 7;
        return (
          <g key={`${e.from}-${e.kind}-${e.to}-${i}`} transform={dup ? `translate(${dup * 8} 0)` : undefined}>
            <path d={geo.d} fill="none" stroke={stroke} strokeWidth={state === 'plain' ? 2 : 2.4} strokeDasharray={dash} strokeLinecap="round" />
            <path d={arrow(geo.end, geo.dir, aSize)} fill={stroke} />
            {state === 'phantom' && (
              <path
                d={`M${geo.mid.x - 6} ${geo.mid.y - 6} L${geo.mid.x + 6} ${geo.mid.y + 6} M${geo.mid.x + 6} ${geo.mid.y - 6} L${geo.mid.x - 6} ${geo.mid.y + 6}`}
                stroke="var(--critical-fill)" strokeWidth={3} strokeLinecap="round"
              />
            )}
            {state === 'missing' && (
              <g>
                <circle cx={geo.mid.x} cy={geo.mid.y} r={8} fill="var(--surface)" stroke="var(--highlight)" strokeWidth={1.5} />
                <path d={`M${geo.mid.x - 4} ${geo.mid.y} H${geo.mid.x + 4} M${geo.mid.x} ${geo.mid.y - 4} V${geo.mid.y + 4}`} stroke="var(--highlight)" strokeWidth={2} strokeLinecap="round" />
              </g>
            )}
          </g>
        );
      })}

      {nodes.map((n) => {
        const c = pos[n.id];
        if (!c) return null;
        const m = mark(n.id);
        const r = pillRect(c, layout);
        const isStart = m.role === 'start';
        const inRadius = m.role === 'radius';
        const ghost = m.ghost === 'snapshotOnly';
        const label = n.name;
        const file = m.sub ?? (sameName(n) ? nodeFileName(n) : null);
        const sel = selected === n.id;
        const aria = `${n.name}${file ? ` (${file})` : ''}, ${t(`explorer.kind.${n.kind}`)}`;
        const hit = Math.max(44, pill.h);
        return (
          <g
            key={n.id}
            role={onSelect ? 'button' : undefined}
            tabIndex={onSelect ? 0 : undefined}
            aria-label={onSelect ? aria : undefined}
            aria-pressed={onSelect ? sel : undefined}
            onClick={onSelect ? () => onSelect(n.id) : undefined}
            onKeyDown={onSelect ? (ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); onSelect(n.id); } } : undefined}
            className={clsx(onSelect && 'cursor-pointer toy-node')}
            opacity={ghost ? 0.72 : 1}
          >
            <rect x={c.x - pill.w / 2} y={c.y - hit / 2} width={pill.w} height={hit} fill="transparent" />
            <rect
              x={r.x1} y={r.y1} width={pill.w} height={pill.h} rx={10}
              fill={isStart ? 'var(--accent)' : 'var(--surface)'}
              stroke={isStart || inRadius || sel ? 'var(--accent)' : 'var(--line-strong)'}
              strokeWidth={isStart || inRadius || sel ? 2.5 : 1.25}
              strokeDasharray={ghost ? '5 3' : undefined}
              className="toy-node-rect"
            />
            <text
              x={c.x} y={file ? c.y - 2 : c.y + nameSize * 0.35} textAnchor="middle"
              fontSize={nameSize} fontWeight={600} fontFamily="var(--font-mono)"
              fill={isStart ? 'var(--accent-ink)' : 'var(--ink)'} direction="ltr"
            >
              {label}
            </text>
            {file && (
              <text x={c.x} y={c.y + subSize * 0.9 + 3} textAnchor="middle" fontSize={subSize} fontFamily="var(--font-mono)" fill={isStart ? 'var(--accent-ink)' : 'var(--ink-2)'} direction="ltr">
                {file}
              </text>
            )}
            {m.hop !== undefined && m.hop > 0 && (
              <g>
                <circle cx={r.x2 - 2} cy={r.y1 + 2} r={Math.max(10, subSize * 0.85)} fill="var(--accent)" stroke="var(--surface)" strokeWidth={2} />
                <text x={r.x2 - 2} y={r.y1 + 2 + subSize * 0.36} textAnchor="middle" fontSize={subSize} fontWeight={700} fill="var(--accent-ink)" fontFamily="var(--font-mono)">
                  {m.hop}
                </text>
              </g>
            )}
            {m.ghost === 'liveOnly' && (
              <g>
                <circle cx={r.x2 - 2} cy={r.y1 + 2} r={10} fill="var(--highlight)" stroke="var(--surface)" strokeWidth={2} />
                <path d={`M${r.x2 - 6} ${r.y1 + 2} H${r.x2 + 2} M${r.x2 - 2} ${r.y1 - 2} V${r.y1 + 6}`} stroke="var(--surface)" strokeWidth={2} strokeLinecap="round" />
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
}
