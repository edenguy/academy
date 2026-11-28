import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { clsx } from 'clsx';
import { pick, type Locale } from '@/content/localize';
import type { ExplorerConfig } from '@/content/schema';
import { formatCount } from '@/graph/scale';
import { CHECK_POINTS, blockedAt, exposedRepos, isBlocked, readableRepos, type CheckAt, type Path, type ServerReadsAs } from '@/graph/access';
import { Card } from '@/components/ui/Card';
import { ICON_PATHS, Icon } from '@/components/ui/Icon';
import { Ident } from '@/components/Ident';
import { Caption, Readout, Segmented, SliderField, Switch } from './controls';
import { FigureAlt } from './FigureAlt';
import { OrgNote } from './OrgNote';
import { useWidth } from './useNarrow';

interface Box { x: number; y: number; w: number; h: number }
const WIDE: Record<'dev' | 'server' | 'registry', Box> = {
  dev: { x: 110, y: 80, w: 160, h: 64 }, server: { x: 360, y: 80, w: 160, h: 64 }, registry: { x: 610, y: 80, w: 160, h: 64 },
};
const NARROW: Record<'dev' | 'server' | 'registry', Box> = {
  dev: { x: 180, y: 40, w: 240, h: 52 }, server: { x: 180, y: 150, w: 240, h: 52 }, registry: { x: 180, y: 260, w: 240, h: 52 },
};

export function AccessExplorer({ config, locale }: { config: Extract<ExplorerConfig, { kind: 'access' }>; locale: Locale }) {
  const { t, i18n } = useTranslation();
  const [share, setShare] = useState(config.readableShare);
  const [checkAt, setCheckAt] = useState<CheckAt>(config.checkAt);
  const [skip, setSkip] = useState(false);
  const [svcAcct, setSvcAcct] = useState(false);
  const repos = config.repos;
  const ref = useRef<HTMLDivElement>(null);
  const width = useWidth(ref);
  const narrow = width < 720;
  const B = narrow ? NARROW : WIDE;
  const vb = narrow ? { w: 360, h: 300 } : { w: 720, h: 160 };
  const shown = narrow ? Math.min(width, 420) : width;
  const fs = Math.max(narrow ? 14 : 15, shown > 0 ? 12.6 * (vb.w / shown) : 15);

  const path: Path = skip ? 'directToRegistry' : 'viaServer';
  const as: ServerReadsAs = svcAcct ? 'serviceAccount' : 'caller';
  const blocked = isBlocked(checkAt, path, as);
  const stop = blockedAt(checkAt, path, as);
  const exposed = exposedRepos(repos, share, checkAt, path, as);
  const may = readableRepos(repos, share);
  const serverChecks = checkAt === 'server' || checkAt === 'both';
  const registryChecks = checkAt === 'registry' || checkAt === 'both';

  const boxes = [
    { id: 'dev' as const, name: t('explorer.access.box.developer'), checks: false },
    ...(skip ? [] : [{ id: 'server' as const, name: t('explorer.access.box.server'), checks: serverChecks }]),
    { id: 'registry' as const, name: t('explorer.access.box.registry'), checks: registryChecks },
  ];
  // the route as a list of points: dev -> (server) -> registry
  const dev = B.dev;
  const srv = B.server;
  const reg = B.registry;
  const segments: { d: string; end: { x: number; y: number }; dir: { x: number; y: number }; to: 'server' | 'registry' }[] = [];
  const arrowDir = narrow ? { x: 0, y: 1 } : { x: 1, y: 0 };
  if (!skip) {
    segments.push(narrow
      ? { d: `M${dev.x} ${dev.y + dev.h / 2} L${srv.x} ${srv.y - srv.h / 2}`, end: { x: srv.x, y: srv.y - srv.h / 2 }, dir: arrowDir, to: 'server' }
      : { d: `M${dev.x + dev.w / 2} ${dev.y} L${srv.x - srv.w / 2} ${srv.y}`, end: { x: srv.x - srv.w / 2, y: srv.y }, dir: arrowDir, to: 'server' });
    segments.push(narrow
      ? { d: `M${srv.x} ${srv.y + srv.h / 2} L${reg.x} ${reg.y - reg.h / 2}`, end: { x: reg.x, y: reg.y - reg.h / 2 }, dir: arrowDir, to: 'registry' }
      : { d: `M${srv.x + srv.w / 2} ${srv.y} L${reg.x - reg.w / 2} ${reg.y}`, end: { x: reg.x - reg.w / 2, y: reg.y }, dir: arrowDir, to: 'registry' });
  } else {
    segments.push(narrow
      ? { d: `M${dev.x + dev.w / 2} ${dev.y} L330 ${dev.y} L330 ${reg.y} L${reg.x + reg.w / 2} ${reg.y}`, end: { x: reg.x + reg.w / 2, y: reg.y }, dir: { x: -1, y: 0 }, to: 'registry' }
      : { d: `M${dev.x} ${dev.y - dev.h / 2} Q360 -40 ${reg.x} ${reg.y - reg.h / 2}`, end: { x: reg.x, y: reg.y - reg.h / 2 }, dir: { x: 0.4, y: 1 }, to: 'registry' });
  }
  const tri = (e: { x: number; y: number }, d: { x: number; y: number }, s = 9) => {
    const l = Math.hypot(d.x, d.y);
    const ux = d.x / l;
    const uy = d.y / l;
    return `M${e.x} ${e.y} L${e.x - ux * s - uy * s * 0.55} ${e.y - uy * s + ux * s * 0.55} L${e.x - ux * s + uy * s * 0.55} ${e.y - uy * s - ux * s * 0.55} Z`;
  };

  // where the "blocked" bar sits: just before the box that stops the request
  const barBox = stop === 'server' ? srv : stop === 'registry' ? reg : null;
  const alt = [
    `${t('explorer.access.box.developer')} → ${skip ? t('explorer.access.box.registry') : `${t('explorer.access.box.server')} → ${t('explorer.access.box.registry')}`}`,
    `${t('explorer.access.where')} ${t(`explorer.access.c.${checkAt}`)}`,
    blocked ? t('explorer.access.v.blocked') : t('explorer.access.v.exposed'),
  ];

  return (
    <Card variant="bench" className="space-y-4">
      <Caption text={config.caption ? pick(config.caption, locale) : ''} />
      <SliderField id="acc-share" label={t('explorer.access.share')} min={0} max={100} step={10} value={share} onChange={setShare} display={`${share}%`} hint={t('explorer.access.exampleNote')} />
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm text-ink-2">{t('explorer.access.where')}</span>
        <Segmented label={t('explorer.access.where')} value={checkAt} onChange={setCheckAt} options={CHECK_POINTS.map((c) => ({ id: c, label: t(`explorer.access.c.${c}`) }))} />
      </div>
      <div className="flex flex-wrap gap-x-6">
        <Switch label={t('explorer.access.skipServer')} checked={skip} onChange={setSkip} />
        <Switch label={t('explorer.access.serviceAccount')} checked={svcAcct} onChange={setSvcAcct} />
      </div>
      <div ref={ref} className="elev-0 p-2 overflow-hidden">
        <FigureAlt caption={t('explorer.access.figure')} items={alt}>
          {(aria) => (
            <svg viewBox={`0 0 ${vb.w} ${vb.h}`} className="w-full h-auto block" style={{ direction: 'ltr', maxWidth: narrow ? 420 : undefined, margin: narrow ? '0 auto' : undefined, overflow: 'visible' }} {...aria}>
              {segments.map((s, i) => (
                <g key={i}>
                  <path d={s.d} fill="none" stroke={blocked && stop === s.to ? 'var(--good-fill)' : blocked ? 'var(--good-fill)' : 'var(--critical-fill)'} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
                  <path d={tri(s.end, s.dir)} fill={blocked ? 'var(--good-fill)' : 'var(--critical-fill)'} />
                </g>
              ))}
              {boxes.map((b) => {
                const r = B[b.id];
                return (
                  <g key={b.id}>
                    <rect x={r.x - r.w / 2} y={r.y - r.h / 2} width={r.w} height={r.h} rx={12} fill="var(--surface)" stroke={b.checks ? 'var(--accent)' : 'var(--line-strong)'} strokeWidth={b.checks ? 2.5 : 1.25} />
                    <text x={r.x} y={r.y + fs * 0.35} textAnchor="middle" fontSize={fs} fontWeight={600} fill="var(--ink)" style={{ direction: i18n.language === 'he' ? 'rtl' : 'ltr', unicodeBidi: 'isolate' }}>{b.name}</text>
                    {b.checks && (
                      <g transform={`translate(${r.x - r.w / 2 + 6} ${r.y - r.h / 2 + 6}) scale(0.8)`} stroke="var(--accent)" fill="none" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <path d={ICON_PATHS.shield} />
                      </g>
                    )}
                  </g>
                );
              })}
              {barBox && (
                <g>
                  {narrow ? (
                    <line x1={barBox.x - 40} y1={barBox.y - barBox.h / 2 - 14} x2={barBox.x + 40} y2={barBox.y - barBox.h / 2 - 14} stroke="var(--ink)" strokeWidth={6} strokeLinecap="round" />
                  ) : skip ? (
                    <line x1={barBox.x - 40} y1={barBox.y - barBox.h / 2 - 8} x2={barBox.x + 40} y2={barBox.y - barBox.h / 2 - 8} stroke="var(--ink)" strokeWidth={6} strokeLinecap="round" />
                  ) : (
                    <line x1={barBox.x - barBox.w / 2 - 14} y1={barBox.y - 22} x2={barBox.x - barBox.w / 2 - 14} y2={barBox.y + 22} stroke="var(--ink)" strokeWidth={6} strokeLinecap="round" />
                  )}
                </g>
              )}
            </svg>
          )}
        </FigureAlt>
      </div>
      <div className="flex flex-wrap gap-2">
        <Readout label={t('explorer.access.mayRead')} value={t('explorer.common.of', { a: formatCount(may), b: formatCount(repos) })} />
        <Readout label={t('explorer.access.shouldNotSee')} value={formatCount(repos - may)} />
        <Readout label={t('explorer.access.exposed')} value={formatCount(exposed)} tone={exposed === 0 ? 'good' : 'ink'} />
        <div className="elev-0 px-3.5 py-2.5 min-w-[130px] flex-1 basis-[130px] flex items-center">
          <span className={clsx('inline-flex items-center gap-1.5 rounded-pill px-3 h-9 text-[15px] font-bold', blocked ? 'bg-good-soft text-good' : 'bg-critical-soft text-critical')}>
            <Icon name={blocked ? 'shield' : 'alert'} size={16} /> {blocked ? t('explorer.access.v.blocked') : t('explorer.access.v.exposed')}
          </span>
        </div>
      </div>
      <p className="text-[13px] text-ink-2"><Ident text={t('explorer.access.modelNote')} /></p>
      <OrgNote />
    </Card>
  );
}
