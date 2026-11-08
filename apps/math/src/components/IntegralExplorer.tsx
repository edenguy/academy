import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { clsx } from 'clsx';
import { motion } from 'motion/react';
import { FUNCTIONS, rectangles, riemannSum, type SumMode } from '@/math/integral';
import { pick, type Locale } from '@/content/localize';
import type { IntegralExplorerConfig } from '@/content/schema';

const VB_W = 640;
const VB_H = 320;
const PAD_L = 46;
const PAD_R = 16;
const PAD_T = 18;
const PAD_B = 34;
const PLOT_W = VB_W - PAD_L - PAD_R;
const PLOT_H = VB_H - PAD_T - PAD_B;
const CURVE_SAMPLES = 90;
const MAX_RECTANGLES = 60;

export function IntegralExplorer({ config, locale }: { config: IntegralExplorerConfig; locale: Locale }) {
  const { t } = useTranslation();
  const { fn, a, b, initialN, modes } = config;
  const spec = FUNCTIONS[fn];
  const [n, setN] = useState(Math.min(initialN, MAX_RECTANGLES));
  const [mode, setMode] = useState<SumMode>(modes[0] ?? 'midpoint');

  const yMax = useMemo(() => {
    let max = 0;
    for (let i = 0; i <= CURVE_SAMPLES; i++) {
      max = Math.max(max, spec.fn(a + ((b - a) * i) / CURVE_SAMPLES));
    }
    return max * 1.1 || 1;
  }, [spec, a, b]);

  const scaleX = (x: number) => PAD_L + ((x - a) / (b - a)) * PLOT_W;
  const scaleY = (y: number) => PAD_T + PLOT_H - (Math.max(0, y) / yMax) * PLOT_H;

  const curvePath = useMemo(() => {
    const pts: string[] = [];
    for (let i = 0; i <= CURVE_SAMPLES; i++) {
      const x = a + ((b - a) * i) / CURVE_SAMPLES;
      pts.push(`${i === 0 ? 'M' : 'L'} ${scaleX(x).toFixed(2)} ${scaleY(spec.fn(x)).toFixed(2)}`);
    }
    return pts.join(' ');
  }, [spec, a, b]); // eslint-disable-line react-hooks/exhaustive-deps

  const areaPath = useMemo(() => {
    const baseline = scaleY(0);
    return `${curvePath} L ${scaleX(b).toFixed(2)} ${baseline.toFixed(2)} L ${scaleX(a).toFixed(2)} ${baseline.toFixed(2)} Z`;
  }, [curvePath, a, b]); // eslint-disable-line react-hooks/exhaustive-deps

  const rects = useMemo(() => rectangles(spec.fn, a, b, n, mode), [spec, a, b, n, mode]);
  const estimate = useMemo(() => riemannSum(spec.fn, a, b, n, mode), [spec, a, b, n, mode]);

  return (
    <div className="card-flat p-4 md:p-5 space-y-4">
      {config.caption && <div className="text-sm font-semibold text-accent">{pick(config.caption, locale)}</div>}

      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <div className="text-xs text-muted">{t('lesson.estimate')}</div>
          <motion.div
            key={`${n}-${mode}`}
            initial={{ scale: 0.88, opacity: 0.4 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.18 }}
            className="readout text-3xl md:text-4xl font-bold text-ink"
          >
            {estimate.toFixed(2)}
          </motion.div>
        </div>
        {modes.length > 1 && (
          <div className="inline-flex rounded-full bg-surface-3 p-1 gap-1" role="group">
            {modes.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={clsx(
                  'rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                  mode === m ? 'bg-accent text-accent-ink' : 'text-ink-2 hover:text-ink',
                )}
              >
                {t(`lesson.mode.${m}`)}
              </button>
            ))}
          </div>
        )}
      </div>

      <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="w-full h-auto" role="img" aria-label={t('lesson.estimate')}>
        <line x1={PAD_L} y1={scaleY(0)} x2={VB_W - PAD_R} y2={scaleY(0)} stroke="var(--axis)" strokeWidth={1.5} />
        <line x1={PAD_L} y1={PAD_T} x2={PAD_L} y2={scaleY(0)} stroke="var(--axis)" strokeWidth={1.5} />
        <text x={scaleX(a)} y={VB_H - 8} textAnchor="middle" className="fill-muted text-[12px] num">{a}</text>
        <text x={scaleX(b)} y={VB_H - 8} textAnchor="middle" className="fill-muted text-[12px] num">{b}</text>
        <path d={areaPath} fill="var(--series-a-soft)" />
        {rects.map((r, i) => (
          <motion.rect
            key={i}
            x={scaleX(r.x)}
            y={scaleY(Math.max(0, r.height))}
            width={Math.max(0, scaleX(r.x + r.width) - scaleX(r.x))}
            height={Math.max(0, scaleY(0) - scaleY(Math.max(0, r.height)))}
            fill="var(--series-b-soft)"
            stroke="var(--series-b)"
            strokeWidth={1.25}
            initial={false}
            animate={{
              x: scaleX(r.x),
              y: scaleY(Math.max(0, r.height)),
              width: Math.max(0, scaleX(r.x + r.width) - scaleX(r.x)),
              height: Math.max(0, scaleY(0) - scaleY(Math.max(0, r.height))),
            }}
            transition={{ duration: 0.22 }}
          />
        ))}
        <path d={curvePath} fill="none" stroke="var(--series-a)" strokeWidth={3} strokeLinecap="round" />
      </svg>

      <div className="flex items-center gap-4">
        <label htmlFor={`n-${fn}-${a}-${b}`} className="text-sm text-ink-2 shrink-0 whitespace-nowrap">
          {t('lesson.rectangleCount')}
        </label>
        <input
          id={`n-${fn}-${a}-${b}`}
          type="range"
          className="slider"
          min={1}
          max={MAX_RECTANGLES}
          value={n}
          onChange={(e) => setN(Number(e.target.value))}
        />
        <span className="readout text-ink font-semibold w-10 text-end shrink-0">{n}</span>
      </div>
    </div>
  );
}
