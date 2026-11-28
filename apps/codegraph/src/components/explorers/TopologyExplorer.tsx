import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useReducedMotion } from 'motion/react';
import { clsx } from 'clsx';
import { pick, type Locale } from '@/content/localize';
import type { ExplorerConfig } from '@/content/schema';
import { DEVELOPER_STEPS, REPO_STEPS, formatCount } from '@/graph/scale';
import {
  LANES, LANE_BANDS, LANE_X, TNODES, TOPOLOGIES, VIEWBOX, boxOf, describeTopology, edgesFor, layoutNodeId, nodesFor, pathD, pathFor, stepsFor, tnode, topologyMetrics,
  type Box, type Layout, type TEdge, type Topology, type Track,
} from '@/graph/topology';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ICON_PATHS, Icon, type IconName } from '@/components/ui/Icon';
import { Ident } from '@/components/Ident';
import { Caption, Readout, Segmented, SliderField } from './controls';
import { FigureAlt } from './FigureAlt';
import { OrgNote } from './OrgNote';
import { useWidth } from './useNarrow';

const KIND_ICON: Record<string, IconName> = { repo: 'repo', ci: 'gear', registry: 'stack', server: 'server', policy: 'shield', machine: 'laptop' };

/** Greedy word wrap by an estimate of glyph width. Never shrinks or truncates. */
function wrap(text: string, width: number, fs: number): string[] {
  const per = Math.max(4, Math.floor(width / (fs * 0.56)));
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    if (!cur) cur = w;
    else if ((cur + ' ' + w).length <= per) cur += ' ' + w;
    else {
      lines.push(cur);
      cur = w;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

const edgeStyle = (k: TEdge['kind']) => {
  if (k === 'publish') return { stroke: 'var(--series-a)', dash: undefined, both: false, arrow: true };
  if (k === 'query') return { stroke: 'var(--series-b)', dash: undefined, both: true, arrow: true };
  if (k === 'policy') return { stroke: 'var(--ink-2)', dash: '2 5', both: false, arrow: false };
  return { stroke: 'var(--ink-2)', dash: '8 5', both: false, arrow: true };
};

function head(p: { x: number; y: number }, q: { x: number; y: number }, s: number) {
  const dx = p.x - q.x;
  const dy = p.y - q.y;
  const l = Math.hypot(dx, dy) || 1;
  const ux = dx / l;
  const uy = dy / l;
  return `M${p.x} ${p.y} L${p.x - ux * s - uy * s * 0.55} ${p.y - uy * s + ux * s * 0.55} L${p.x - ux * s + uy * s * 0.55} ${p.y - uy * s - ux * s * 0.55} Z`;
}

export function TopologyExplorer({ config, locale }: { config: Extract<ExplorerConfig, { kind: 'topology' }>; locale: Locale }) {
  const { t, i18n } = useTranslation();
  const he = i18n.language === 'he';
  const reduced = useReducedMotion();
  const [topo, setTopo] = useState<Topology>(config.topology);
  const [ri, setRi] = useState(REPO_STEPS.indexOf(config.repos));
  const [di, setDi] = useState(DEVELOPER_STEPS.indexOf(config.developers));
  const [shards, setShards] = useState(config.shards);
  const [track, setTrack] = useState<Track>('question');
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [orgOpen, setOrgOpen] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 720);
  const ref = useRef<HTMLDivElement>(null);
  const width = useWidth(ref);
  const layout: Layout = width < 720 ? 'narrow' : 'wide';
  const vb = VIEWBOX[layout];
  const shown = layout === 'narrow' ? Math.min(width, 420) : width;
  const scale = shown > 0 ? shown / vb.w : 1;
  const fs = (base: number) => Math.max(base, 12.4 / scale);

  const org = { repos: REPO_STEPS[ri]!, developers: DEVELOPER_STEPS[di]! };
  const m = topologyMetrics(org, topo, { reposPerDeveloper: config.reposPerDeveloper, shards });
  const steps = stepsFor(topo, track);
  const idx = Math.min(step, steps.length - 1);
  const cur = steps[idx]!;
  const nodes = nodesFor(topo);
  const usedMap = new Map(nodes.map((n) => [n.id, n.used]));
  const edges = edgesFor(topo);
  const mapId = (id: string) => layoutNodeId(id, layout);
  const activeNodes = new Set(cur.nodes.map(mapId));
  const activeEdges = new Set(cur.edges);
  const drawnServers = topo === 'sharded' ? Math.min(3, shards) : 1;

  const setTopology = (v: Topology) => {
    setTopo(v);
    setStep(0);
    if (selected && !nodesFor(v).find((n) => n.id === selected && n.used)) setSelected(null);
    if (track === 'publish' && v === 'local') setStep(0);
  };
  const setTrackAndReset = (v: Track) => { setTrack(v); setStep(0); };

  // keep the active lane on screen on a phone (not on first render)
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    if (layout !== 'narrow') return;
    const id = [...activeNodes][0];
    const el = id ? ref.current?.querySelector(`[data-tnode="${id}"]`) : null;
    el?.scrollIntoView({ block: 'nearest', behavior: 'auto' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, track, topo]);

  const labelFor = (kind: string) => t(`explorer.topology.node.${kind}`);
  const laneName = (l: string) => t(`explorer.topology.lane.${l}`);
  const alt = describeTopology(topo, (k) => t(k));

  const node = (id: string) => {
    const n = tnode(id);
    const b = boxOf(id, topo, layout);
    if (!b) return null;
    const used = usedMap.get(id) ?? true;
    const active = activeNodes.has(id);
    const out = cur.outOfReach && active;
    const sel = selected === id;
    const x1 = b.x - b.w / 2;
    const y1 = b.y - b.h / 2;
    const size = fs(layout === 'wide' ? 17 : 14);
    const strong = fs(layout === 'wide' ? 18 : 14);
    const hitPad = Math.max(0, (44 / scale - b.h) / 2);
    const stepNo = idx + 1;
    const lines = n.kind === 'machine' ? [] : wrap(labelFor(n.kind), b.w - (layout === 'wide' ? 22 : 40), strong);
    return (
      <g
        key={id}
        data-tnode={id}
        role="button"
        tabIndex={0}
        aria-pressed={sel}
        aria-label={`${labelFor(n.kind)}${used ? '' : `, ${t('explorer.topology.notUsed')}`}`}
        onClick={() => setSelected(sel ? null : id)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelected(sel ? null : id); } }}
        className="cursor-pointer toy-node"
        opacity={used ? 1 : 0.35}
      >
        <rect x={x1} y={y1 - hitPad} width={b.w} height={b.h + hitPad * 2} fill="transparent" />
        <rect
          x={x1} y={y1} width={b.w} height={b.h} rx={12} fill="var(--surface)" className="toy-node-rect"
          stroke={out ? 'var(--critical-fill)' : active || sel ? 'var(--accent)' : 'var(--line-strong)'}
          strokeWidth={active || sel || out ? 3 : 1.5}
          strokeDasharray={!used || out ? '6 4' : undefined}
        />
        <g transform={`translate(${x1 + 6} ${y1 + 6}) scale(0.83)`} stroke="var(--ink-2)" fill="none" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d={ICON_PATHS[KIND_ICON[n.kind]!]} />
        </g>
        {n.kind === 'machine' ? machineRows(b, size) : (
          <text textAnchor="middle" fontSize={strong} fontWeight={600} fill="var(--ink)" style={{ direction: he ? 'rtl' : 'ltr', unicodeBidi: 'isolate' }}>
            {lines.map((ln, i) => (
              <tspan key={i} x={b.x + (layout === 'wide' ? 10 : 8)} y={b.y + (i - (lines.length - 1) / 2) * strong * 1.2 + strong * 0.35}>{ln}</tspan>
            ))}
          </text>
        )}
        {active && (
          <g>
            <circle cx={x1 + b.w - 4} cy={y1 + 4} r={Math.max(11, 12 / scale * 0.8)} fill="var(--accent)" stroke="var(--surface)" strokeWidth={2} />
            <text x={x1 + b.w - 4} y={y1 + 4 + fs(13) * 0.36} textAnchor="middle" fontSize={fs(13)} fontWeight={700} fill="var(--accent-ink)" fontFamily="var(--font-mono)">{stepNo}</text>
          </g>
        )}
      </g>
    );
  };

  const machineRows = (b: Box, size: number) => {
    const x1 = b.x - b.w / 2;
    const y1 = b.y - b.h / 2;
    const pad = layout === 'wide' ? 8 : 10;
    const chipW = b.w - pad * 2;
    const rows: { kind: 'text' | 'chip'; text: string; hl?: boolean }[] = [
      { kind: 'text', text: t('explorer.topology.node.agent') },
      { kind: 'chip', text: t('explorer.topology.node.client') },
    ];
    if (topo === 'local' || topo === 'hybrid') rows.push({ kind: 'chip', text: t('explorer.topology.node.local'), hl: cur.chip === 'local' && activeNodes.has(layoutNodeId('machine-1', layout)) && b.x === boxOf('machine-1', topo, layout)!.x });
    // the first row shares a line with the kind icon at the start corner
    let y = y1 + 6;
    return rows.map((r, i) => {
      const lines = wrap(r.text, chipW - 10, size);
      const h = r.kind === 'text' ? size * 1.4 : lines.length * size * 1.2 + 6;
      const top = y;
      y += h + 4;
      return (
        <g key={i}>
          {r.kind === 'chip' && (
            <rect x={x1 + pad} y={top} width={chipW} height={h} rx={8} fill={r.hl ? 'var(--accent-soft)' : 'var(--surface-3)'} stroke={r.hl ? 'var(--accent)' : 'none'} strokeWidth={2} />
          )}
          <text textAnchor="middle" fontSize={size} fill="var(--ink)" fontWeight={r.kind === 'text' ? 600 : 400} style={{ direction: he ? 'rtl' : 'ltr', unicodeBidi: 'isolate' }}>
            {lines.map((ln, li) => (
              <tspan key={li} x={b.x} y={top + (r.kind === 'text' ? size * 1.05 : 3 + size * 0.95 + li * size * 1.2)}>{ln}</tspan>
            ))}
          </text>
        </g>
      );
    });
  };

  const badge = (text: string, cx: number, cy: number, key: string) => {
    const size = fs(13);
    const w = text.length * size * 0.62 + 14;
    const x = Math.min(vb.w - 8 - w / 2, Math.max(8 + w / 2, cx));
    return (
      <g key={key} aria-hidden="true">
        <rect x={x - w / 2} y={cy - size * 0.9} width={w} height={size * 1.8} rx={size * 0.9} fill="var(--ink-2)" />
        <text x={x} y={cy + size * 0.35} textAnchor="middle" fontSize={size} fontWeight={700} fontFamily="var(--font-mono)" fill="var(--surface)">{text}</text>
      </g>
    );
  };
  const corner = (id: string, which: 'top' | 'bottom') => {
    const b = boxOf(mapId(id), topo, layout)!;
    return { x: b.x + b.w / 2, y: which === 'top' ? b.y - b.h / 2 : b.y + b.h / 2 };
  };

  const laneLabel = (l: (typeof LANES)[number]) => {
    const band = LANE_BANDS[layout][l];
    const text = laneName(l);
    if (layout === 'wide') {
      const size = fs(16);
      const lines = wrap(text, 124, size);
      return (
        <text key={l} textAnchor="middle" fontSize={size} fontWeight={600} fill="var(--ink-2)" style={{ direction: he ? 'rtl' : 'ltr', unicodeBidi: 'isolate' }}>
          {lines.map((ln, i) => <tspan key={i} x={74} y={(band.y1 + band.y2) / 2 + (i - (lines.length - 1) / 2) * size * 1.25 + size * 0.35}>{ln}</tspan>)}
        </text>
      );
    }
    const size = fs(14);
    return (
      <text key={l} x={he ? LANE_X.narrow.x2 - 8 : LANE_X.narrow.x1 + 8} y={band.y1 + 18} textAnchor="start" fontSize={size} fontWeight={600} fill="var(--ink-2)" stroke="var(--surface-2)" strokeWidth={5} paintOrder="stroke" strokeLinejoin="round" style={{ direction: he ? 'rtl' : 'ltr', unicodeBidi: 'isolate' }}>
        {text}
      </text>
    );
  };

  const sel = selected ? tnode(selected) : null;
  const selUsed = selected ? usedMap.get(selected) ?? false : false;
  const hereKey = (id: string): string | null => {
    const k = tnode(id).kind;
    if (k === 'repo') return topo === 'local' ? 'repo.local' : 'repo.other';
    if (k === 'ci') return topo === 'local' ? null : 'ci.used';
    if (k === 'registry') return topo === 'local' ? null : 'registry.used';
    if (k === 'server') return topo === 'local' ? null : `server.${topo}`;
    if (k === 'policy') return topo === 'local' ? 'policy.local' : 'policy.other';
    return `machine.${topo}`;
  };

  return (
    <Card variant="bench" className="space-y-4">
      <Caption text={config.caption ? pick(config.caption, locale) : ''} />
      <Segmented label={t('explorer.topology.changeOrg')} value={topo} onChange={setTopology} options={TOPOLOGIES.map((x) => ({ id: x, label: t(`explorer.topology.t.${x}`) }))} />
      <div className="flex flex-wrap gap-2">
        <Readout label={t('explorer.topology.m.servers')} value={formatCount(m.serverProcesses)} />
        <Readout label={t('explorer.topology.m.builds')} value={formatCount(m.indexBuilds)} />
        <Readout label={t('explorer.topology.m.reach')} value={t('explorer.common.of', { a: formatCount(m.reposInReach), b: formatCount(org.repos) })} />
        <Readout label={t('explorer.topology.m.affected')} value={formatCount(m.developersAffectedIfOneServerFails)} />
        <Readout label={t('explorer.topology.m.uncommitted')} value={t(m.seesUncommittedWork ? 'explorer.common.yes' : 'explorer.common.no')} icon={m.seesUncommittedWork ? 'check' : 'x'} tone={m.seesUncommittedWork ? 'good' : 'muted'} />
        <Readout label={t('explorer.topology.m.survives')} value={t(m.ownWorkSurvivesCentralFailure ? 'explorer.common.yes' : 'explorer.common.no')} icon={m.ownWorkSurvivesCentralFailure ? 'check' : 'x'} tone={m.ownWorkSurvivesCentralFailure ? 'good' : 'muted'} />
      </div>
      <p className="text-[13px] text-muted"><Ident text={t('explorer.topology.assumptions')} /></p>
      <OrgNote />
      <details open={orgOpen} onToggle={(e) => setOrgOpen((e.currentTarget as HTMLDetailsElement).open)} className="elev-0 px-4 py-2">
        <summary className="cursor-pointer min-h-11 flex items-center font-semibold text-[15px] text-ink">{t('explorer.topology.changeOrg')}</summary>
        <div className="grid gap-x-6 gap-y-2 pb-2 md:grid-cols-3">
          <SliderField id="topo-repos" label={t('explorer.scale.repos')} min={0} max={REPO_STEPS.length - 1} value={ri} onChange={setRi} display={formatCount(org.repos)} />
          <SliderField id="topo-devs" label={t('explorer.scale.developers')} min={0} max={DEVELOPER_STEPS.length - 1} value={di} onChange={setDi} display={formatCount(org.developers)} />
          {topo === 'sharded' && <SliderField id="topo-shards" label={t('explorer.topology.shards')} min={2} max={8} value={shards} onChange={setShards} />}
        </div>
      </details>

      <div ref={ref} className="elev-0 p-2 overflow-hidden">
        <FigureAlt caption={t('explorer.topology.figure')} items={alt}>
          {(aria) => (
            <svg viewBox={`0 0 ${vb.w} ${vb.h}`} className="w-full h-auto block" style={{ direction: 'ltr', maxWidth: layout === 'narrow' ? 420 : undefined, margin: layout === 'narrow' ? '0 auto' : undefined }} data-layout={layout} {...aria}>
              {LANES.map((l) => {
                const band = LANE_BANDS[layout][l];
                const x = LANE_X[layout];
                return (
                  <g key={l}>
                    <rect x={x.x1} y={band.y1} width={x.x2 - x.x1} height={band.y2 - band.y1} rx={12} fill="var(--surface-2)" stroke="var(--line)" />
                  </g>
                );
              })}
              {layout === 'wide' && <line x1={142} y1={12} x2={142} y2={548} stroke="var(--line)" strokeDasharray="2 4" />}
              {edges.map((e) => {
                const pts = pathFor(e, topo, layout);
                if (pts.length < 2) return null;
                const st = edgeStyle(e.kind);
                const on = activeEdges.has(e.id);
                const d = pathD(pts, 8);
                const first = pts[0]!;
                const second = pts[1]!;
                const last = pts[pts.length - 1]!;
                const prev = pts[pts.length - 2]!;
                return (
                  <g key={e.id} data-edge={e.id}>
                    {on && <path d={d} fill="none" stroke="var(--accent)" strokeOpacity={0.28} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />}
                    <path d={d} fill="none" stroke={st.stroke} strokeWidth={on ? 3.5 : 2.4} strokeDasharray={st.dash} strokeLinecap="round" strokeLinejoin="round" />
                    {st.arrow && <path d={head(last, prev, 9)} fill={st.stroke} />}
                    {st.both && <path d={head(first, second, 9)} fill={st.stroke} />}
                    {on && !reduced && (
                      <circle key={`${track}-${topo}-${idx}`} r={4} fill="var(--accent)" className="topo-dot" style={{ offsetPath: `path('${d}')` } as React.CSSProperties} />
                    )}
                  </g>
                );
              })}
              {LANES.map((l) => laneLabel(l))}
              {TNODES.map((n) => node(n.id))}
              {badge(`×${formatCount(org.repos)}`, corner('repo-c', 'top').x, corner('repo-c', 'top').y, 'b-repo')}
              {badge(`×${formatCount(org.developers)}`, corner('machine-3', 'top').x, corner('machine-3', 'top').y, 'b-dev')}
              {topo === 'sharded' && badge(`×${shards}`, corner(`server-${drawnServers}`, 'bottom').x, corner(`server-${drawnServers}`, 'bottom').y, 'b-srv')}
            </svg>
          )}
        </FigureAlt>
        <div className="flex flex-wrap gap-x-5 gap-y-1 px-1 pt-2 text-[13px] text-ink-2" data-legend>
          {([['publish', 'explorer.topology.legendPublish'], ['query', 'explorer.topology.legendQuery'], ['policy', 'explorer.topology.legendPolicy'], ['clone', 'explorer.topology.legendClone']] as const).map(([k, key]) => {
            const st = edgeStyle(k);
            return (
              <span key={k} className="inline-flex items-center gap-1.5">
                <svg width="34" height="10" aria-hidden="true"><path d="M2 5H32" stroke={st.stroke} strokeWidth="2.4" strokeDasharray={st.dash} strokeLinecap="round" /></svg>
                {t(key)}
              </span>
            );
          })}
        </div>
      </div>

      {sel && (
        <div className="elev-0 p-4 space-y-1.5" data-role-panel>
          <h3 className="text-[16px] font-bold text-ink flex items-center gap-2"><Icon name={KIND_ICON[sel.kind]!} size={18} className="text-accent" /> {labelFor(sel.kind)}</h3>
          <p className="text-[14px] text-ink-2"><span className="font-semibold text-ink">{t('explorer.topology.ownedBy')}:</span> {laneName(sel.lane)}</p>
          <p className="text-[14px] text-ink-2"><span className="font-semibold text-ink">{t('explorer.topology.doesTitle')}:</span> <Ident text={t(`explorer.topology.does.${sel.kind}`)} /></p>
          <p className="text-[14px] text-ink-2">
            <span className="font-semibold text-ink">{t('explorer.topology.hereTitle')}:</span>{' '}
            {(() => {
              const k = hereKey(selected!);
              return k && (selUsed || sel.kind === 'policy') ? <Ident text={t(`explorer.topology.here.${k}`)} /> : t('explorer.topology.notUsed');
            })()}
          </p>
        </div>
      )}

      <div className="space-y-3" data-fab-avoid>
        <Segmented label={t('explorer.topology.track.question')} value={track} onChange={setTrackAndReset} options={[{ id: 'question', label: t('explorer.topology.track.question') }, { id: 'publish', label: t('explorer.topology.track.publish') }]} />
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="md" onClick={() => setStep(Math.max(0, idx - 1))} disabled={idx === 0}>
            <Icon name="arrow" size={16} className="rotate-180 rtl:rotate-0" /> {t('explorer.common.back')}
          </Button>
          <span className="text-[14px] text-ink-2 num grow text-center">{t('explorer.common.steps', { current: idx + 1, total: steps.length })}</span>
          <Button size="md" onClick={() => setStep(Math.min(steps.length - 1, idx + 1))} disabled={idx >= steps.length - 1}>
            {t('explorer.common.next')} <Icon name="arrow" size={16} className="rtl:-scale-x-100" />
          </Button>
        </div>
        {steps.length > 1 && <SliderField id="topo-step" label={t('explorer.topology.track.' + track)} min={0} max={steps.length - 1} value={idx} onChange={setStep} display={`${idx + 1}/${steps.length}`} />}
        <p className={clsx('text-[15px] font-semibold text-ink min-h-[3.2em]')} aria-live="polite"><Ident text={t(cur.textKey)} /></p>
      </div>
    </Card>
  );
}
