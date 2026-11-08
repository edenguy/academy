import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { estimatedDisplacement, exactDisplacement, velocityAtConstantAccel, velocityRectangles } from '@/physics/kinematics';
import { pick, type Locale } from '@/content/localize';
import type { AccelAreaExplorerConfig } from '@/content/schema';

const VB_W = 640;
const VB_H = 320;
const PAD_L = 46;
const PAD_R = 16;
const PAD_T = 18;
const PAD_B = 34;
const PLOT_W = VB_W - PAD_L - PAD_R;
const PLOT_H = VB_H - PAD_T - PAD_B;
const MAX_RECTANGLES = 60;

export function AccelerationExplorer({ config, locale }: { config: AccelAreaExplorerConfig; locale: Locale }) {
  const { t } = useTranslation();
  const { minA, maxA, duration } = config;
  const [a, setA] = useState(config.initialA);
  const [n, setN] = useState(Math.min(config.initialN, MAX_RECTANGLES));

  const yMax = useMemo(() => velocityAtConstantAccel(maxA, duration) * 1.1 || 1, [maxA, duration]);

  const scaleX = (time: number) => PAD_L + (time / duration) * PLOT_W;
  const scaleY = (v: number) => PAD_T + PLOT_H - (Math.max(0, v) / yMax) * PLOT_H;

  const linePath = `M ${scaleX(0).toFixed(2)} ${scaleY(0).toFixed(2)} L ${scaleX(duration).toFixed(2)} ${scaleY(velocityAtConstantAccel(a, duration)).toFixed(2)}`;

  const rects = useMemo(() => velocityRectangles(a, duration, n, 'midpoint'), [a, duration, n]);
  const estimate = useMemo(() => estimatedDisplacement(a, duration, n, 'midpoint'), [a, duration, n]);
  const exact = useMemo(() => exactDisplacement(a, duration), [a, duration]);

  return (
    <div className="card-flat p-4 md:p-5 space-y-4">
      {config.caption && <div className="text-sm font-semibold text-accent">{pick(config.caption, locale)}</div>}

      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="text-xs text-muted">{t('lesson.estimatedDisplacement')}</div>
          <motion.div
            key={`${a}-${n}`}
            initial={{ scale: 0.88, opacity: 0.4 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.18 }}
            className="readout text-3xl md:text-4xl font-bold text-ink"
          >
            {estimate.toFixed(2)}
          </motion.div>
        </div>
        <div>
          <div className="text-xs text-muted">{t('lesson.exactDisplacement')}</div>
          <div className="readout text-2xl md:text-3xl font-semibold text-accent">{exact.toFixed(2)}</div>
        </div>
      </div>

      <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="w-full h-auto" role="img" aria-label={t('lesson.velocityGraph')}>
        <line x1={PAD_L} y1={scaleY(0)} x2={VB_W - PAD_R} y2={scaleY(0)} stroke="var(--line-strong)" strokeWidth={1.5} />
        <line x1={PAD_L} y1={PAD_T} x2={PAD_L} y2={scaleY(0)} stroke="var(--line-strong)" strokeWidth={1.5} />
        <text x={scaleX(0)} y={VB_H - 8} textAnchor="middle" className="fill-muted text-[12px] num">0</text>
        <text x={scaleX(duration)} y={VB_H - 8} textAnchor="middle" className="fill-muted text-[12px] num">{duration}</text>
        {rects.map((r, i) => (
          <motion.rect
            key={i}
            x={scaleX(r.x)}
            y={scaleY(r.height)}
            width={Math.max(0, scaleX(r.x + r.width) - scaleX(r.x))}
            height={Math.max(0, scaleY(0) - scaleY(r.height))}
            fill="var(--series-b-soft)"
            stroke="var(--series-b)"
            strokeWidth={1.25}
            initial={false}
            animate={{
              x: scaleX(r.x),
              y: scaleY(r.height),
              width: Math.max(0, scaleX(r.x + r.width) - scaleX(r.x)),
              height: Math.max(0, scaleY(0) - scaleY(r.height)),
            }}
            transition={{ duration: 0.22 }}
          />
        ))}
        <path d={linePath} fill="none" stroke="var(--series-a)" strokeWidth={3} strokeLinecap="round" />
      </svg>

      <div className="space-y-3">
        <div className="flex items-center gap-4">
          <label htmlFor="accel-range" className="text-sm text-ink-2 shrink-0 whitespace-nowrap">
            {t('lesson.acceleration')}
          </label>
          <input
            id="accel-range"
            type="range"
            className="slider"
            min={minA}
            max={maxA}
            step={0.1}
            value={a}
            onChange={(e) => setA(Number(e.target.value))}
          />
          <span className="readout text-ink font-semibold w-16 text-end shrink-0">{a.toFixed(1)} m/s²</span>
        </div>
        <div className="flex items-center gap-4">
          <label htmlFor="n-range" className="text-sm text-ink-2 shrink-0 whitespace-nowrap">
            {t('lesson.rectangleCount')}
          </label>
          <input
            id="n-range"
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
    </div>
  );
}
