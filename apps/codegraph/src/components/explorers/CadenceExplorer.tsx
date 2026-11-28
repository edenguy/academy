import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { pick, type Locale } from '@/content/localize';
import type { ExplorerConfig } from '@/content/schema';
import { formatCount } from '@/graph/scale';
import { CADENCES, maxCommitsBehind, orgPublishesPerDay, type Cadence } from '@/graph/cadence';
import { freshnessDecision } from '@/graph/staleness';
import { Card } from '@/components/ui/Card';
import { Ident } from '@/components/Ident';
import { Caption, Readout, Segmented, SliderField, Switch } from './controls';
import { FigureAlt } from './FigureAlt';
import { OrgNote } from './OrgNote';
import { useWidth } from './useNarrow';

const X0 = 30;
const X1 = 570;

export function CadenceExplorer({ config, locale }: { config: Extract<ExplorerConfig, { kind: 'cadence' }>; locale: Locale }) {
  const { t } = useTranslation();
  const [cpd, setCpd] = useState(config.commitsPerDay);
  const [cadence, setCadence] = useState<Cadence>(config.cadence);
  const [pipeline, setPipeline] = useState(10);
  const [hasSource, setHasSource] = useState(false);
  const repos = config.repos;
  const ref = useRef<HTMLDivElement>(null);
  const width = useWidth(ref);
  const fs = Math.max(15, width > 0 ? (12.4 * 600) / (width - 16) : 15);

  const behind = maxCommitsBehind(cpd, cadence, pipeline);
  const publishes = orgPublishesPerDay(repos, cpd, cadence);
  const behindShown = behind === 0 ? '0' : behind < 1 ? t('explorer.cadence.lessThanOne') : String(Math.ceil(behind));
  const decision = freshnessDecision({ behind: Math.ceil(behind), hasSource });

  // the strip: one day (24 h) or one week (168 h), "now" at the right end
  const span = cadence === 'weekly' ? 168 : 24;
  const x = (h: number) => X0 + (h / span) * (X1 - X0);
  const commitCount = Math.min(50, Math.round(cadence === 'weekly' ? cpd * 7 : cpd));
  const commitsAt = Array.from({ length: commitCount }, (_, i) => ((i + 0.5) / Math.max(commitCount, 1)) * span);
  const pubs: number[] = [];
  if (cadence === 'everyMerge') commitsAt.forEach((h) => pubs.push(Math.min(span, h + pipeline / 60)));
  else if (cadence === 'hourly') for (let h = 0; h <= 24; h++) pubs.push(h);
  else pubs.push(0);
  const lastPub = pubs.length ? Math.max(...pubs.filter((p) => p <= span)) : 0;
  const unit = cadence === 'weekly' ? t('explorer.cadence.axisWeek') : t('explorer.cadence.axisDay');
  const ticks = cadence === 'weekly' ? [0, 1, 2, 3, 4, 5, 6, 7] : [0, 6, 12, 18, 24];
  const alt = [
    `${t('explorer.cadence.behind', { n: behindShown })}`,
    `${t('explorer.cadence.publishes', { repos: formatCount(repos) })}: ${formatCount(Math.round(publishes))}`,
    `${commitCount} / ${pubs.length}`,
  ];

  return (
    <Card variant="bench" className="space-y-4">
      <Caption text={config.caption ? pick(config.caption, locale) : ''} />
      <div className="grid gap-x-6 gap-y-2 md:grid-cols-2">
        <SliderField id="cad-cpd" label={t('explorer.cadence.commitsPerDay')} min={0} max={50} value={cpd} onChange={setCpd} hint={t('explorer.cadence.yourNumber')} />
        {cadence === 'everyMerge' && <SliderField id="cad-pipe" label={t('explorer.cadence.pipeline')} min={1} max={60} value={pipeline} onChange={setPipeline} />}
      </div>
      <Segmented label={t('explorer.cadence.publishes', { repos: formatCount(repos) })} value={cadence} onChange={setCadence} options={CADENCES.map((c) => ({ id: c, label: t(`explorer.cadence.c.${c}`) }))} />
      <div className="flex flex-wrap gap-2">
        <Readout label={t('explorer.cadence.behind', { n: '…' })} value={behindShown} tone="accent" />
        <Readout label={t('explorer.cadence.publishes', { repos: formatCount(repos) })} value={formatCount(Math.round(publishes))} />
      </div>
      <div ref={ref} className="elev-0 p-2">
        <FigureAlt caption={t('explorer.cadence.figure')} items={alt}>
          {(aria) => (
            <svg viewBox={`0 0 600 ${70 + fs * 2.2}`} className="w-full h-auto block" style={{ direction: 'ltr' }} {...aria}>
              <rect x={x(lastPub)} y={18} width={Math.max(0, X1 - x(lastPub))} height={52} fill="var(--highlight-soft)" />
              <line x1={X0} y1={70} x2={X1} y2={70} stroke="var(--axis)" strokeWidth={2} />
              {ticks.map((h) => (
                <g key={h}>
                  <line x1={x(h * (span / (cadence === 'weekly' ? 7 : 24)))} y1={70} x2={x(h * (span / (cadence === 'weekly' ? 7 : 24)))} y2={76} stroke="var(--axis)" strokeWidth={2} />
                  <text x={x(h * (span / (cadence === 'weekly' ? 7 : 24)))} y={76 + fs} textAnchor="middle" fontSize={fs} fontFamily="var(--font-mono)" fill="var(--ink-2)">{h}</text>
                </g>
              ))}
              {commitsAt.map((h, i) => <line key={`c${i}`} x1={x(h)} y1={40} x2={x(h)} y2={64} stroke="var(--series-a)" strokeWidth={2} strokeLinecap="round" />)}
              {pubs.filter((h) => h <= span).map((h, i) => <rect key={`p${i}`} x={x(h) - 5} y={22} width={10} height={10} rx={2} fill="var(--series-b)" stroke="var(--surface)" strokeWidth={1.5} />)}
              <line x1={X1} y1={14} x2={X1} y2={76} stroke="var(--accent)" strokeWidth={2.5} strokeDasharray="4 3" />
              <text x={300} y={78 + fs * 2} textAnchor="middle" fontSize={fs} fill="var(--ink-2)" style={{ direction: 'inherit' }}>{unit}</text>
            </svg>
          )}
        </FigureAlt>
        <div className="flex flex-wrap gap-x-5 gap-y-1 px-1 text-[13px] text-ink-2">
          <span className="inline-flex items-center gap-1.5"><svg width="14" height="14" aria-hidden="true"><path d="M7 1v12" stroke="var(--series-a)" strokeWidth="2.4" strokeLinecap="round" /></svg>{t('explorer.cadence.commitsPerDay')}</span>
          <span className="inline-flex items-center gap-1.5"><svg width="14" height="14" aria-hidden="true"><rect x="2" y="2" width="10" height="10" rx="2" fill="var(--series-b)" /></svg>{t('explorer.staleness.published')}</span>
          <span className="inline-flex items-center gap-1.5"><svg width="14" height="14" aria-hidden="true"><rect x="0" y="3" width="14" height="8" fill="var(--highlight-soft)" stroke="var(--highlight)" /></svg>{t('explorer.cadence.gap')}</span>
        </div>
      </div>
      <div className="space-y-1" data-fab-avoid>
        <Switch label={<Ident text={t('explorer.common.haveSource')} />} checked={hasSource} onChange={setHasSource} />
        <p className="text-[14.5px] font-semibold text-ink" aria-live="polite">{t(`explorer.staleness.decision.${decision}`)}</p>
      </div>
      <p className="text-[13px] text-ink-2">{t('explorer.cadence.assumption')}</p>
      <OrgNote />
    </Card>
  );
}
