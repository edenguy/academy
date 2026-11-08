import { useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { clsx } from 'clsx';
import { motion } from 'motion/react';
import { SCENARIOS, type ScenarioId } from '@/physics/kinematics';
import { pick, type Locale } from '@/content/localize';
import type { ScrubberExplorerConfig } from '@/content/schema';

const VB_W = 640;
const VB_H = 320;
const PAD_L = 46;
const PAD_R = 16;
const PAD_T = 18;
const PAD_B = 34;
const PLOT_W = VB_W - PAD_L - PAD_R;
const PLOT_H = VB_H - PAD_T - PAD_B;
const CURVE_SAMPLES = 120;

export function MotionScrubber({ config, locale }: { config: ScrubberExplorerConfig; locale: Locale }) {
  const { t } = useTranslation();
  const [scenarioId, setScenarioId] = useState<ScenarioId>(config.initialScenario);
  const spec = SCENARIOS[scenarioId];
  const [a, b] = spec.domain;
  const [t0, setT0] = useState(a);
  const svgRef = useRef<SVGSVGElement>(null);

  const yRange = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;
    for (let i = 0; i <= CURVE_SAMPLES; i++) {
      const y = spec.position(a + ((b - a) * i) / CURVE_SAMPLES);
      min = Math.min(min, y);
      max = Math.max(max, y);
    }
    const pad = (max - min) * 0.12 || 1;
    return { min: min - pad, max: max + pad };
  }, [spec, a, b]);

  const scaleX = useCallback((x: number) => PAD_L + ((x - a) / (b - a)) * PLOT_W, [a, b]);
  const scaleY = useCallback(
    (y: number) => PAD_T + PLOT_H - ((y - yRange.min) / (yRange.max - yRange.min)) * PLOT_H,
    [yRange],
  );

  const curvePath = useMemo(() => {
    const pts: string[] = [];
    for (let i = 0; i <= CURVE_SAMPLES; i++) {
      const x = a + ((b - a) * i) / CURVE_SAMPLES;
      pts.push(`${i === 0 ? 'M' : 'L'} ${scaleX(x).toFixed(2)} ${scaleY(spec.position(x)).toFixed(2)}`);
    }
    return pts.join(' ');
  }, [spec, a, b, scaleX, scaleY]);

  const zeroY = scaleY(0);
  const handleX = scaleX(t0);
  const handleY = scaleY(spec.position(t0));

  function setFromClientX(clientX: number) {
    const svg = svgRef.current;
    if (!svg) return;
    const ctm = svg.getScreenCTM();
    if (!ctm) return;
    const inv = ctm.inverse();
    const localX = clientX * inv.a + inv.e;
    const t = a + ((localX - PAD_L) / PLOT_W) * (b - a);
    setT0(Math.min(b, Math.max(a, t)));
  }

  function onPointerDown(e: React.PointerEvent<SVGGElement>) {
    (e.target as Element).setPointerCapture(e.pointerId);
    setFromClientX(e.clientX);
  }
  function onPointerMove(e: React.PointerEvent<SVGGElement>) {
    if (e.buttons === 0 && e.pointerType !== 'touch') return;
    if (e.pressure === 0 && e.pointerType === 'mouse') return;
    setFromClientX(e.clientX);
  }

  return (
    <div className="card-flat p-4 md:p-5 space-y-4">
      {config.caption && <div className="text-sm font-semibold text-accent">{pick(config.caption, locale)}</div>}

      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <div className="text-xs text-muted">{t('lesson.positionAt', { t: t0.toFixed(1) })}</div>
          <motion.div
            key={t0.toFixed(2)}
            initial={{ scale: 0.92, opacity: 0.5 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.12 }}
            className="readout text-3xl md:text-4xl font-bold text-ink"
          >
            {spec.position(t0).toFixed(2)}
          </motion.div>
        </div>
        {config.scenarios.length > 1 && (
          <div className="inline-flex rounded-full bg-surface-3 p-1 gap-1 flex-wrap" role="group">
            {config.scenarios.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setScenarioId(id);
                  setT0(SCENARIOS[id].domain[0]);
                }}
                className={clsx(
                  'rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                  scenarioId === id ? 'bg-accent text-accent-ink' : 'text-ink-2 hover:text-ink',
                )}
              >
                {t(`lesson.scenario.${id}`)}
              </button>
            ))}
          </div>
        )}
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        className="w-full h-auto touch-none"
        role="img"
        aria-label={t('lesson.positionGraph')}
      >
        <line x1={PAD_L} y1={zeroY} x2={VB_W - PAD_R} y2={zeroY} stroke="var(--line-strong)" strokeWidth={1.5} />
        <line x1={PAD_L} y1={PAD_T} x2={PAD_L} y2={scaleY(0) + 1} stroke="var(--line-strong)" strokeWidth={1.5} />
        <text x={scaleX(a)} y={VB_H - 8} textAnchor="middle" className="fill-muted text-[12px] num">{a}</text>
        <text x={scaleX(b)} y={VB_H - 8} textAnchor="middle" className="fill-muted text-[12px] num">{b}</text>
        <path d={curvePath} fill="none" stroke="var(--series-a)" strokeWidth={3} strokeLinecap="round" />
        <line x1={handleX} y1={PAD_T} x2={handleX} y2={PAD_T + PLOT_H} stroke="var(--accent)" strokeOpacity={0.3} strokeWidth={1.5} strokeDasharray="4 4" />

        <g
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          style={{ cursor: 'grab' }}
          tabIndex={0}
          role="slider"
          aria-valuemin={a}
          aria-valuemax={b}
          aria-valuenow={t0}
          aria-label={t('lesson.scrubHandle')}
          onKeyDown={(e) => {
            const step = (b - a) / 40;
            if (e.key === 'ArrowRight') setT0((v) => Math.min(b, v + step));
            if (e.key === 'ArrowLeft') setT0((v) => Math.max(a, v - step));
          }}
        >
          <circle cx={handleX} cy={handleY} r={16} fill="var(--accent)" fillOpacity={0.18} />
          <circle cx={handleX} cy={handleY} r={8} fill="var(--accent)" stroke="var(--surface)" strokeWidth={2.5} />
        </g>
      </svg>

      <div className="flex items-center gap-4">
        <label htmlFor="t0-range" className="text-sm text-ink-2 shrink-0 whitespace-nowrap">
          {t('lesson.time')}
        </label>
        <input
          id="t0-range"
          type="range"
          className="slider"
          min={a}
          max={b}
          step={(b - a) / 200}
          value={t0}
          onChange={(e) => setT0(Number(e.target.value))}
        />
        <span className="readout text-ink font-semibold w-14 text-end shrink-0">{t0.toFixed(1)} s</span>
      </div>
    </div>
  );
}
