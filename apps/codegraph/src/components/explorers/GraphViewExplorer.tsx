import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { pick, type Locale } from '@/content/localize';
import type { ExplorerConfig } from '@/content/schema';
import { BASE_GRAPH, nodeById, nodeFileName, type EdgeKind, type ToyEdge } from '@/graph/toy';
import { VIEWBOX_TOY } from '@/graph/toyLayout';
import { dependentHops, describeGraph, edgesOf, isContractEdge, nodeLabel } from '@/graph/graph';
import { Card } from '@/components/ui/Card';
import { Caption, Readout, SliderField } from './controls';
import { FigureAlt } from './FigureAlt';
import { ToyGraphSvg } from './ToyGraphSvg';
import { useWidth } from './useNarrow';

const KINDS: EdgeKind[] = ['calls', 'requests', 'handledBy', 'reads', 'partOf'];

function EdgeKey({ kind }: { kind: EdgeKind }) {
  const contract = isContractEdge(kind);
  return (
    <svg width="34" height="10" aria-hidden="true" style={{ direction: 'ltr' }}>
      <path d="M2 5 H32" stroke={contract ? 'var(--series-b)' : 'var(--series-a)'} strokeWidth="2.4" strokeDasharray={contract ? '6 4' : undefined} strokeLinecap="round" />
    </svg>
  );
}

export function GraphViewExplorer({ config, locale }: { config: Extract<ExplorerConfig, { kind: 'graphView' }>; locale: Locale }) {
  const { t } = useTranslation();
  const [start, setStart] = useState<string>(config.start);
  const [hops, setHops] = useState(config.hops);
  const [off, setOff] = useState<EdgeKind[]>([]);
  const ref = useRef<HTMLDivElement>(null);
  const width = useWidth(ref);
  const layout = width < 720 ? 'narrow' : 'wide';
  const vbw = VIEWBOX_TOY[layout].w;
  const shown = layout === 'narrow' ? Math.min(width, 420) : width;
  const fontScale = shown > 0 ? vbw / shown : 1;

  const g = BASE_GRAPH;
  const radius = useMemo(() => dependentHops(g, start, hops), [g, start, hops]);
  const edges = g.edges.filter((e) => !off.includes(e.kind));
  const startNode = nodeById(g, start)!;
  const adjacency = edgesOf(g, start);
  const label = (id: string) => nodeLabel(nodeById(g, id)!);
  const alt = describeGraph(g, (k) => t(k));
  const row = (e: ToyEdge, key: string) => (
    <li key={key} className="flex flex-wrap items-center gap-1.5 text-[13.5px]">
      <span className="sci">{label(e.from)}</span>
      <span className="text-ink-2">{t(`explorer.edge.${e.kind}`)}</span>
      <span className="sci">{label(e.to)}</span>
    </li>
  );

  return (
    <Card variant="bench" className="space-y-4">
      <Caption text={config.caption ? pick(config.caption, locale) : ''} />
      <div className="flex flex-wrap gap-2">
        <Readout label={t('explorer.graph.nodes')} value={g.nodes.length} />
        <Readout label={t('explorer.graph.edges')} value={g.edges.length} />
        <Readout label={t('explorer.graph.start')} value={<span className="text-[16px] md:text-[20px]">{startNode.name}</span>} sub={nodeFileName(startNode) ?? t(`explorer.kind.${startNode.kind}`)} tone="accent" />
        <Readout label={t('explorer.graph.affected')} value={radius.size} tone="accent" />
      </div>
      <SliderField id="graph-hops" label={t('explorer.graph.hops')} min={0} max={4} value={hops} onChange={setHops} />
      <div className="flex flex-wrap gap-2" role="group" aria-label={t('explorer.graph.edges')}>
        {KINDS.map((k) => {
          const on = !off.includes(k);
          return (
            <button
              key={k}
              type="button"
              aria-pressed={on}
              onClick={() => setOff((o) => (on ? [...o, k] : o.filter((x) => x !== k)))}
              className={'inline-flex items-center gap-2 min-h-11 px-3 rounded-pill text-[13.5px] font-semibold border ' + (on ? 'bg-surface text-ink border-line-strong' : 'bg-surface-3 text-ink-2 border-transparent line-through')}
            >
              <EdgeKey kind={k} /> {t(`explorer.edge.${k}`)}
            </button>
          );
        })}
      </div>
      {off.length > 0 && <p className="text-[13px] text-muted">{t('explorer.graph.filterNote')}</p>}
      <div ref={ref} className="elev-0 p-2 overflow-hidden">
        <FigureAlt caption={t('explorer.graph.figure')} items={alt}>
          {(aria) => (
            <ToyGraphSvg
              layout={layout}
              variant="graph"
              nodes={g.nodes}
              edges={edges}
              mark={(id) => (id === start ? { role: 'start' } : radius.has(id) ? { role: 'radius', hop: radius.get(id) } : {})}
              selected={start}
              onSelect={setStart}
              fontScale={fontScale}
              aria={aria}
            />
          )}
        </FigureAlt>
      </div>
      <div className="flex flex-wrap gap-x-5 gap-y-1 text-[12.5px] text-ink-2" data-legend>
        <span className="inline-flex items-center gap-1.5"><svg width="22" height="12" aria-hidden="true"><rect x="1" y="1" width="20" height="10" rx="3" fill="var(--surface-2)" stroke="var(--line-strong)" /></svg>{t('explorer.graph.legendOrders')}</span>
        <span className="inline-flex items-center gap-1.5"><svg width="22" height="12" aria-hidden="true"><rect x="1" y="1" width="20" height="10" rx="3" fill="var(--surface-3)" stroke="var(--line-strong)" strokeDasharray="4 3" /></svg>{t('explorer.graph.legendWeb')}</span>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <h3 className="text-[14px] font-bold text-ink mb-1.5">{t('explorer.graph.dependsOn')}</h3>
          <ul className="space-y-1.5">{adjacency.out.length ? adjacency.out.map((e, i) => row(e, `o${i}`)) : <li className="text-[13px] text-muted">–</li>}</ul>
        </div>
        <div>
          <h3 className="text-[14px] font-bold text-ink mb-1.5">{t('explorer.graph.dependedOnBy')}</h3>
          <ul className="space-y-1.5">{adjacency.in.length ? adjacency.in.map((e, i) => row(e, `i${i}`)) : <li className="text-[13px] text-muted">–</li>}</ul>
        </div>
      </div>
    </Card>
  );
}
