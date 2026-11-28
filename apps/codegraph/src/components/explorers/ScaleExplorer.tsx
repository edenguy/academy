import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { pick, type Locale } from '@/content/localize';
import type { ExplorerConfig } from '@/content/schema';
import {
  DEVELOPER_STEPS, REPO_STEPS, STRATEGIES, formatCount, formatPercent, indexBuilds, logBarPercent, reachShare, rebuildsPerMerge, reposInReach,
} from '@/graph/scale';
import { Card } from '@/components/ui/Card';
import { Ident } from '@/components/Ident';
import { Caption, SliderField } from './controls';
import { OrgNote } from './OrgNote';

export function ScaleExplorer({ config, locale }: { config: Extract<ExplorerConfig, { kind: 'scale' }>; locale: Locale }) {
  const { t } = useTranslation();
  const [ri, setRi] = useState(REPO_STEPS.indexOf(config.repos));
  const [di, setDi] = useState(DEVELOPER_STEPS.indexOf(config.developers));
  const [rpd, setRpd] = useState(config.reposPerDeveloper);
  const org = { repos: REPO_STEPS[ri]!, developers: DEVELOPER_STEPS[di]! };
  const builds = STRATEGIES.map((s) => indexBuilds(org, s, rpd));
  const max = Math.max(...builds);
  const formula = (s: (typeof STRATEGIES)[number]) =>
    s === 'everyMachineEverything' ? `${formatCount(org.repos)} × ${formatCount(org.developers)}` : s === 'everyMachineOwn' ? `${formatCount(org.developers)} × ${Math.min(rpd, org.repos)}` : formatCount(org.repos);

  return (
    <Card variant="bench" className="space-y-4">
      <Caption text={config.caption ? pick(config.caption, locale) : ''} />
      <div className="grid gap-x-6 gap-y-2 md:grid-cols-3">
        <SliderField id="scale-repos" label={t('explorer.scale.repos')} min={0} max={REPO_STEPS.length - 1} value={ri} onChange={setRi} display={formatCount(org.repos)} />
        <SliderField id="scale-devs" label={t('explorer.scale.developers')} min={0} max={DEVELOPER_STEPS.length - 1} value={di} onChange={setDi} display={formatCount(org.developers)} />
        <SliderField id="scale-rpd" label={t('explorer.scale.reposPerDeveloper')} min={1} max={20} value={rpd} onChange={setRpd} />
      </div>
      <div className="space-y-3">
        {STRATEGIES.map((s, i) => (
          <div key={s} className="elev-0 p-3.5 space-y-2" data-strategy={s}>
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <h3 className="text-[15px] font-bold text-ink">{t(`explorer.scale.s.${s}`)}</h3>
              <span className="sci">{formula(s)}</span>
            </div>
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="readout text-[28px] md:text-[34px] font-semibold text-ink num">{formatCount(builds[i]!)}</span>
              <span className="text-[13px] text-ink-2">{t('explorer.scale.builds')}</span>
            </div>
            <div className="relative h-3 rounded-pill bg-surface-3" aria-hidden="true">
              <div
                className="absolute top-0 h-3 rounded-pill"
                style={{
                  insetInlineStart: 0,
                  width: `${logBarPercent(builds[i]!, max)}%`,
                  background: s === 'publishOnce' ? 'var(--series-b)' : 'var(--series-a)',
                  transition: 'width 220ms cubic-bezier(.2,.8,.2,1)',
                }}
              />
            </div>
            <p className="text-[13.5px] text-ink-2">
              <Ident text={t('explorer.scale.reach', { a: formatCount(reposInReach(org, s, rpd)), b: formatCount(org.repos), pct: formatPercent(reachShare(org, s, rpd)) })} />
            </p>
            <p className="text-[13.5px] text-ink-2"><Ident text={t('explorer.scale.rebuilds', { n: formatCount(rebuildsPerMerge(org, s, rpd)) })} /></p>
          </div>
        ))}
      </div>
      <p className="text-[13px] text-muted">{t('explorer.scale.logScale')}</p>
      <p className="text-[13px] text-ink-2">{t('explorer.scale.arithmetic')}</p>
      <OrgNote />
    </Card>
  );
}
