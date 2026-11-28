import { useRef, useState, type PointerEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { pick, type Locale } from '@/content/localize';
import type { ExplorerConfig } from '@/content/schema';
import type { Graph, ToyNode } from '@/graph/toy';
import { COMMITS, diffGraphs, freshnessDecision, graphAt } from '@/graph/staleness';
import { truth } from '@/graph/answers';
import { describeGraph } from '@/graph/graph';
import { VIEWBOX_TOY } from '@/graph/toyLayout';
import { Card } from '@/components/ui/Card';
import { Ident } from '@/components/Ident';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Caption, Readout, SliderField, Switch } from './controls';
import { FigureAlt } from './FigureAlt';
import { ToyGraphSvg, type DrawEdge, type NodeMark } from './ToyGraphSvg';
import { useWidth } from './useNarrow';

const TL_W = 400;
const TL_X = (i: number) => 36 + i * 82;

function Timeline({ head, pub, onHead, onPub, label }: { head: number; pub: number; onHead: (n: number) => void; onPub: (n: number) => void; label: string }) {
  const ref = useRef<SVGSVGElement>(null);
  const drag = useRef<'head' | 'pub' | null>(null);
  const at = (e: PointerEvent) => {
    const svg = ref.current!;
    const r = svg.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * TL_W;
    return Math.max(0, Math.min(4, Math.round((x - 36) / 82)));
  };
  const apply = (which: 'head' | 'pub', i: number) => {
    if (which === 'head') onHead(i);
    else onPub(i);
  };
  return (
    <svg
      ref={ref}
      viewBox={`0 0 ${TL_W} 78`}
      className="w-full h-auto block touch-none select-none"
      style={{ direction: 'ltr', maxHeight: 130 }}
      role="group"
      aria-label={label}
      onPointerDown={(e) => {
        const i = at(e);
        // grab the nearer handle; on a tie the head
        drag.current = Math.abs(i - head) <= Math.abs(i - pub) ? 'head' : 'pub';
        (e.currentTarget as SVGSVGElement).setPointerCapture(e.pointerId);
        apply(drag.current, i);
      }}
      onPointerMove={(e) => { if (drag.current) apply(drag.current, at(e)); }}
      onPointerUp={() => { drag.current = null; }}
      onPointerCancel={() => { drag.current = null; }}
    >
      <line x1={TL_X(0)} y1={30} x2={TL_X(4)} y2={30} stroke="var(--axis)" strokeWidth={3} strokeLinecap="round" />
      <line x1={TL_X(pub)} y1={30} x2={TL_X(head)} y2={30} stroke="var(--highlight)" strokeWidth={6} strokeLinecap="round" opacity={0.55} />
      {[0, 1, 2, 3, 4].map((i) => (
        <g key={i}>
          <line x1={TL_X(i)} y1={22} x2={TL_X(i)} y2={38} stroke="var(--axis)" strokeWidth={2} />
          <text x={TL_X(i)} y={64} textAnchor="middle" fontSize={15} fontFamily="var(--font-mono)" fill="var(--ink-2)">{`c${i}`}</text>
        </g>
      ))}
      <rect x={TL_X(pub) - 9} y={21} width={18} height={18} rx={3} fill="var(--series-b)" stroke="var(--surface)" strokeWidth={2.5} />
      <circle cx={TL_X(head)} cy={30} r={11} fill="var(--accent)" fillOpacity={0.2} />
      <circle cx={TL_X(head)} cy={30} r={7} fill="var(--accent)" stroke="var(--surface)" strokeWidth={2.5} />
    </svg>
  );
}

function merge(snapshot: Graph, live: Graph): { nodes: ToyNode[]; marks: Record<string, NodeMark> } {
  const marks: Record<string, NodeMark> = {};
  const liveIds = new Set(live.nodes.map((n) => n.id));
  const snapIds = new Set(snapshot.nodes.map((n) => n.id));
  const nodes: ToyNode[] = [];
  for (const n of snapshot.nodes) {
    if (liveIds.has(n.id)) nodes.push(n);
    else if (n.id === 'money.round_cents' && liveIds.has('money.round_money')) continue; // drawn once, as the renamed node
    else {
      nodes.push(n);
      marks[n.id] = { ghost: 'snapshotOnly' };
    }
  }
  for (const n of live.nodes) {
    if (snapIds.has(n.id)) continue;
    nodes.push(n);
    marks[n.id] = n.id === 'money.round_money' ? { ghost: 'liveOnly', sub: 'round_cents' } : { ghost: 'liveOnly' };
  }
  return { nodes, marks };
}

export function StalenessExplorer({ config, locale }: { config: Extract<ExplorerConfig, { kind: 'staleness' }>; locale: Locale }) {
  const { t } = useTranslation();
  const [head, setHeadRaw] = useState(config.head);
  const [pub, setPubRaw] = useState(config.publishedAt);
  const [hasSource, setHasSource] = useState(false);
  const setHead = (n: number) => { setHeadRaw(n); if (n < pub) setPubRaw(n); };
  const setPub = (n: number) => { setPubRaw(n); if (n > head) setHeadRaw(n); };
  const ref = useRef<HTMLDivElement>(null);
  const width = useWidth(ref);
  const layout = width < 720 ? 'narrow' : 'wide';
  const shown = layout === 'narrow' ? Math.min(width, 420) : width;
  const fontScale = shown > 0 ? VIEWBOX_TOY[layout].w / shown : 1;

  const snap = graphAt(pub);
  const live = graphAt(head);
  const d = diffGraphs(snap, live);
  const behind = head - pub;
  const { nodes, marks } = merge(snap, live);
  const edges: DrawEdge[] = [
    ...d.stillTrue.map((e) => ({ ...e, state: 'stillTrue' as const })),
    ...d.phantom.map((e) => ({ ...e, state: 'phantom' as const })),
    ...d.missing.map((e) => ({ ...e, state: 'missing' as const })),
  ];
  const snapAnswer = truth('fieldReaders', snap);
  const liveAnswer = truth('fieldReaders', live);
  const mismatch = snapAnswer.join() !== liveAnswer.join();
  const decision = freshnessDecision({ behind, hasSource });
  const short = (id: string) => id.split('.')[1]!;
  const between = COMMITS.slice(pub + 1, head + 1);
  const alt = [
    ...describeGraph({ nodes, edges: [] }, (k) => t(k)).slice(0, nodes.length),
    ...d.stillTrue.map((e) => `${short(e.from)} ${t(`explorer.edge.${e.kind}`)} ${short(e.to)}: ${t('explorer.staleness.stillTrue')}`),
    ...d.phantom.map((e) => `${short(e.from)} ${t(`explorer.edge.${e.kind}`)} ${short(e.to)}: ${t('explorer.staleness.phantom')}`),
    ...d.missing.map((e) => `${short(e.from)} ${t(`explorer.edge.${e.kind}`)} ${short(e.to)}: ${t('explorer.staleness.missing')}`),
  ];

  return (
    <Card variant="bench" className="space-y-4">
      <Caption text={config.caption ? pick(config.caption, locale) : ''} />
      <div className="flex flex-wrap gap-2">
        <Readout label={t('explorer.staleness.behind')} value={behind} tone="accent" />
        <Readout label={t('explorer.staleness.stillTrue')} value={d.stillTrue.length} tone="good" icon="check" />
        <Readout label={t('explorer.staleness.phantom')} value={d.phantom.length} />
        <Readout label={t('explorer.staleness.missing')} value={d.missing.length} />
      </div>
      <div className="elev-0 p-3 space-y-1">
        <Timeline head={head} pub={pub} onHead={setHead} onPub={setPub} label={t('explorer.staleness.timeline')} />
        <div className="flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-ink-2">
          <span className="inline-flex items-center gap-1.5"><svg width="14" height="14" aria-hidden="true"><circle cx="7" cy="7" r="6" fill="var(--accent)" /></svg>{t('explorer.staleness.head')}</span>
          <span className="inline-flex items-center gap-1.5"><svg width="14" height="14" aria-hidden="true"><rect x="1" y="1" width="12" height="12" rx="2" fill="var(--series-b)" /></svg>{t('explorer.staleness.published')}</span>
        </div>
      </div>
      <div className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
        <SliderField id="stale-head" label={t('explorer.staleness.head')} min={0} max={4} value={head} onChange={setHead} display={`c${head}`} />
        <SliderField id="stale-pub" label={t('explorer.staleness.published')} min={0} max={4} value={pub} onChange={setPub} display={`c${pub}`} />
      </div>
      <Button variant="secondary" size="sm" onClick={() => setPub(head)} disabled={behind === 0}>
        <Icon name="refresh" size={16} /> {t('explorer.staleness.publishNow')}
      </Button>
      {between.length > 0 && (
        <ul className="space-y-1 text-[14px] text-ink-2">
          {between.map((c) => (
            <li key={c.id} className="flex gap-2"><span className="sci shrink-0">{c.id}</span><span><Ident text={t(c.summaryKey)} /></span></li>
          ))}
        </ul>
      )}
      <div ref={ref} className="elev-0 p-2 overflow-hidden">
        <FigureAlt caption={t('explorer.staleness.figure')} items={alt}>
          {(aria) => (
            <ToyGraphSvg layout={layout} variant="staleness" nodes={nodes} edges={edges} mark={(id) => marks[id] ?? {}} fontScale={fontScale} aria={aria} />
          )}
        </FigureAlt>
      </div>
      <div className="flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-ink-2" data-legend>
        <span className="inline-flex items-center gap-1.5"><svg width="30" height="12" aria-hidden="true"><path d="M2 6H28" stroke="var(--good-fill)" strokeWidth="2.4" strokeLinecap="round" /></svg>{t('explorer.staleness.stillTrue')}</span>
        <span className="inline-flex items-center gap-1.5"><svg width="30" height="12" aria-hidden="true"><path d="M2 6H28" stroke="var(--critical-fill)" strokeWidth="2.4" strokeLinecap="round" /><path d="M12 1l6 10M18 1l-6 10" stroke="var(--critical-fill)" strokeWidth="2.4" /></svg>{t('explorer.staleness.phantom')}</span>
        <span className="inline-flex items-center gap-1.5"><svg width="30" height="12" aria-hidden="true"><path d="M2 6H28" stroke="var(--highlight)" strokeWidth="2.4" strokeDasharray="6 4" strokeLinecap="round" /></svg>{t('explorer.staleness.missing')}</span>
      </div>
      <div className="elev-0 p-3.5 space-y-2" data-question-strip>
        <p className="font-semibold text-ink text-[15px]"><Ident text={t('explorer.question.fieldReaders')} /></p>
        <div className="grid gap-2 sm:grid-cols-2 text-[14px]">
          <div><div className="text-ink-2">{t('explorer.staleness.snapshotSays')}</div><div className="flex flex-wrap gap-1.5 mt-1">{snapAnswer.map((id) => <span key={id} className="sci">{short(id)}</span>)}</div></div>
          <div><div className="text-ink-2">{t('explorer.staleness.codeSays')}</div><div className="flex flex-wrap gap-1.5 mt-1">{liveAnswer.map((id) => <span key={id} className="sci">{short(id)}</span>)}</div></div>
        </div>
        {mismatch && (
          <span className="inline-flex items-center gap-1.5 rounded-pill bg-highlight-soft text-highlight px-2.5 h-7 text-[13px] font-semibold"><Icon name="alert" size={14} /> {t('explorer.staleness.mismatch')}</span>
        )}
      </div>
      <div className="space-y-1" data-fab-avoid>
        <Switch label={<Ident text={t('explorer.common.haveSource')} />} checked={hasSource} onChange={setHasSource} />
        <p className="text-[14.5px] font-semibold text-ink" aria-live="polite">{t(`explorer.staleness.decision.${decision}`)}</p>
      </div>
    </Card>
  );
}
