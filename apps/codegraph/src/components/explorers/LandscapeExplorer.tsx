import { useRef, useState, type KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { clsx } from 'clsx';
import { pick, type Locale } from '@/content/localize';
import type { ExplorerConfig } from '@/content/schema';
import { LAYERS, countByStatus, piecesIn, type LayerId, type PieceStatus } from '@/graph/landscape';
import { Card } from '@/components/ui/Card';
import { Icon, type IconName } from '@/components/ui/Icon';
import { Ident } from '@/components/Ident';
import { Caption } from './controls';
import { useNarrow } from './useNarrow';

const STATUS: Record<PieceStatus, { icon: IconName; cls: string }> = {
  spec: { icon: 'doc', cls: 'bg-accent-soft text-accent' },
  project: { icon: 'cube', cls: 'bg-series-b-soft text-series-b' },
  pattern: { icon: 'puzzle', cls: 'bg-surface-3 text-ink border border-line-strong' },
};
const STATUSES: PieceStatus[] = ['spec', 'project', 'pattern'];

export function LandscapeExplorer({ config, locale }: { config: Extract<ExplorerConfig, { kind: 'landscape' }>; locale: Locale }) {
  const { t } = useTranslation();
  const [layer, setLayer] = useState<LayerId>(config.layer);
  const ref = useRef<HTMLDivElement>(null);
  const narrow = useNarrow(ref, 720);
  const btns = useRef<Record<string, HTMLButtonElement | null>>({});

  const move = (e: KeyboardEvent, id: LayerId) => {
    const i = LAYERS.indexOf(id);
    let n = i;
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') n = Math.min(LAYERS.length - 1, i + 1);
    else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') n = Math.max(0, i - 1);
    else if (e.key === 'Home') n = 0;
    else if (e.key === 'End') n = LAYERS.length - 1;
    else return;
    e.preventDefault();
    const next = LAYERS[n]!;
    setLayer(next);
    btns.current[next]?.focus();
  };

  const detail = (
    <div className="elev-0 p-4 space-y-4" data-detail>
      <h3 className="text-[17px] font-bold text-ink">{t(`explorer.landscape.layer.${layer}.name`)}</h3>
      <ul className="space-y-3">
        {piecesIn(layer).map((p) => (
          <li key={p.id} className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-ink text-[15px]" dir="ltr">{p.name}</span>
              <span className={clsx('inline-flex items-center gap-1.5 rounded-pill px-2.5 h-6 text-[12.5px] font-semibold', STATUS[p.status].cls)}>
                <Icon name={STATUS[p.status].icon} size={13} /> {t(`explorer.landscape.status.${p.status}`)}
              </span>
            </div>
            <p className="text-[14px] text-ink-2"><Ident text={t(`explorer.landscape.piece.${p.id}`)} /></p>
            {p.source && (
              <a href={p.source} target="_blank" rel="noopener noreferrer" className="text-[13px] font-semibold text-accent underline underline-offset-2 inline-flex items-center gap-1 min-h-6" title={t('explorer.landscape.sourceOpens')}>
                {t('explorer.common.source')} <Icon name="arrow" size={12} className="-rotate-45 rtl:-rotate-[135deg]" />
              </a>
            )}
          </li>
        ))}
      </ul>
      <div className="grid gap-3 sm:grid-cols-2 text-[14px]">
        <div className="rounded-[10px] bg-good-soft p-3">
          <div className="font-bold text-ink mb-1">{t('explorer.landscape.standardTitle')}</div>
          <p className="text-ink-2">{t(`explorer.landscape.layer.${layer}.standard`)}</p>
        </div>
        <div className="rounded-[10px] bg-surface-3 p-3">
          <div className="font-bold text-ink mb-1">{t('explorer.landscape.notStandardTitle')}</div>
          <p className="text-ink-2">{t(`explorer.landscape.layer.${layer}.notStandard`)}</p>
        </div>
      </div>
    </div>
  );

  return (
    <Card variant="bench" className="space-y-4">
      <Caption text={config.caption ? pick(config.caption, locale) : ''} />
      <div ref={ref} className={clsx('gap-4', narrow ? 'space-y-2' : 'grid grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)] items-start')}>
        <div className="space-y-2" role="group" aria-label={t('explorer.landscape.unknown')}>
          {LAYERS.map((id) => {
            const on = id === layer;
            const c = countByStatus(id);
            return (
              <div key={id} className="space-y-2">
                <button
                  ref={(el) => { btns.current[id] = el; }}
                  type="button"
                  aria-pressed={on}
                  tabIndex={on ? 0 : -1}
                  onClick={() => setLayer(id)}
                  onKeyDown={(e) => move(e, id)}
                  className={clsx('w-full text-start rounded-[12px] border p-3 min-h-[44px] transition-colors', on ? 'bg-accent-soft border-accent border-2' : 'bg-surface border-line')}
                >
                  <div className="font-bold text-[15px] text-ink">{t(`explorer.landscape.layer.${id}.name`)}</div>
                  <div className="text-[13px] text-ink-2">{t(`explorer.landscape.layer.${id}.q`)}</div>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {STATUSES.map((s) => (
                      <span key={s} className={clsx('inline-flex items-center gap-1 rounded-pill px-2 h-6 text-[12px] font-semibold', STATUS[s].cls)}>
                        <Icon name={STATUS[s].icon} size={12} /> {t(`explorer.landscape.count.${s}`, { n: c[s] })}
                      </span>
                    ))}
                  </div>
                </button>
                {narrow && on && detail}
              </div>
            );
          })}
        </div>
        {!narrow && detail}
      </div>
      <p className="text-[13px] text-muted">{t('explorer.landscape.unknown')}</p>
    </Card>
  );
}
