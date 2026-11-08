import { useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { CURVES, averageRateOfChange } from '@/math/derivative';
import { pick, type Locale } from '@/content/localize';
import type { SecantExplorerConfig } from '@/content/schema';

const VB_W = 640;
const VB_H = 320;
const PAD_L = 46;
const PAD_R = 16;
const PAD_T = 18;
const PAD_B = 34;
const PLOT_W = VB_W - PAD_L - PAD_R;
const PLOT_H = VB_H - PAD_T - PAD_B;
const CURVE_SAMPLES = 120;
const MIN_GAP = 0.05;

type Handle = 'x1' | 'x2';

/** Lesson 1's secant explorer — the same drag-two-points-into-a-tangent gesture as Physics
 * Academy's velocity-slope lesson (apps/physics SlopeExplorer), on a generic f(x) instead of
 * a position-vs-time curve: the same rate-of-change idea, taught twice on purpose. */
export function SecantExplorer({ config, locale }: { config: SecantExplorerConfig; locale: Locale }) {
  const { t } = useTranslation();
  const spec = CURVES[config.curve];
  const [a, b] = spec.domain;
  const [x1, setX1] = useState(config.initialX1);
  const [x2, setX2] = useState(config.initialX2);
  const svgRef = useRef<SVGSVGElement>(null);
  const dragging = useRef<Handle | null>(null);

  const yRange = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;
    for (let i = 0; i <= CURVE_SAMPLES; i++) {
      const y = spec.fn(a + ((b - a) * i) / CURVE_SAMPLES);
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
      pts.push(`${i === 0 ? 'M' : 'L'} ${scaleX(x).toFixed(2)} ${scaleY(spec.fn(x)).toFixed(2)}`);
    }
    return pts.join(' ');
  }, [spec, a, b, scaleX, scaleY]);

  const avgRate = averageRateOfChange(spec, x1, x2);
  const exactAtX1 = spec.derivative(x1);
  const gapIsTiny = x2 - x1 < (b - a) / 40;

  // Secant line, extended a little past both points so it reads as a line, not just a segment.
  const secantPath = useMemo(() => {
    const ext = (b - a) * 0.08;
    const px1 = Math.max(a, x1 - ext);
    const px2 = Math.min(b, x2 + ext);
    const py1 = spec.fn(x1) + avgRate * (px1 - x1);
    const py2 = spec.fn(x1) + avgRate * (px2 - x1);
    return `M ${scaleX(px1).toFixed(2)} ${scaleY(py1).toFixed(2)} L ${scaleX(px2).toFixed(2)} ${scaleY(py2).toFixed(2)}`;
  }, [a, b, x1, x2, avgRate, spec, scaleX, scaleY]);

  function clamp(v: number) {
    return Math.min(b, Math.max(a, v));
  }

  function setFromClientX(clientX: number, which: Handle) {
    const svg = svgRef.current;
    if (!svg) return;
    const ctm = svg.getScreenCTM();
    if (!ctm) return;
    const inv = ctm.inverse();
    const localX = clientX * inv.a + inv.e;
    const xVal = a + ((localX - PAD_L) / PLOT_W) * (b - a);
    if (which === 'x1') setX1(Math.min(clamp(xVal), x2 - MIN_GAP));
    else setX2(Math.max(clamp(xVal), x1 + MIN_GAP));
  }

  function onPointerDown(which: Handle) {
    return (e: React.PointerEvent<SVGGElement>) => {
      (e.target as Element).setPointerCapture(e.pointerId);
      dragging.current = which;
      setFromClientX(e.clientX, which);
    };
  }
  function onPointerMove(e: React.PointerEvent<SVGSVGElement>) {
    if (!dragging.current) return;
    setFromClientX(e.clientX, dragging.current);
  }
  function onPointerUp() {
    dragging.current = null;
  }

  const p1 = { x: scaleX(x1), y: scaleY(spec.fn(x1)) };
  const p2 = { x: scaleX(x2), y: scaleY(spec.fn(x2)) };

  return (
    <div className="card-flat p-4 md:p-5 space-y-4">
      {config.caption && <div className="text-sm font-semibold text-accent">{pick(config.caption, locale)}</div>}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-xs text-muted">{t('lesson.averageRate')}</div>
          <motion.div
            key={avgRate.toFixed(3)}
            initial={{ scale: 0.92, opacity: 0.5 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.12 }}
            className="readout text-2xl md:text-3xl font-bold text-ink"
          >
            {avgRate.toFixed(2)}
          </motion.div>
        </div>
        <div>
          <div className="text-xs text-muted">{t('lesson.instantaneousAtX1', { x: x1.toFixed(2) })}</div>
          <div className={`readout text-2xl md:text-3xl font-bold ${gapIsTiny ? 'text-good' : 'text-ink-2'}`}>
            {exactAtX1.toFixed(2)}
          </div>
        </div>
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        className="w-full h-auto touch-none"
        role="img"
        aria-label={t('lesson.secantGraph')}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <line x1={PAD_L} y1={scaleY(0)} x2={VB_W - PAD_R} y2={scaleY(0)} stroke="var(--line-strong)" strokeWidth={1.5} />
        <line x1={PAD_L} y1={PAD_T} x2={PAD_L} y2={scaleY(0) + 1} stroke="var(--line-strong)" strokeWidth={1.5} />
        <text x={scaleX(a)} y={VB_H - 8} textAnchor="middle" className="fill-muted text-[12px] num">{a}</text>
        <text x={scaleX(b)} y={VB_H - 8} textAnchor="middle" className="fill-muted text-[12px] num">{b}</text>
        <path d={curvePath} fill="none" stroke="var(--series-a)" strokeWidth={3} strokeLinecap="round" />
        <path d={secantPath} fill="none" stroke="var(--series-b)" strokeWidth={2} strokeDasharray={gapIsTiny ? undefined : '6 4'} />

        <g
          onPointerDown={onPointerDown('x1')}
          style={{ cursor: 'grab' }}
          tabIndex={0}
          role="slider"
          aria-label="x1"
          aria-valuemin={a}
          aria-valuemax={x2 - MIN_GAP}
          aria-valuenow={x1}
          onKeyDown={(e) => {
            const step = (b - a) / 80;
            if (e.key === 'ArrowRight') setX1((v) => Math.min(x2 - MIN_GAP, v + step));
            if (e.key === 'ArrowLeft') setX1((v) => Math.max(a, v - step));
          }}
        >
          <circle cx={p1.x} cy={p1.y} r={14} fill="var(--series-b)" fillOpacity={0.18} />
          <circle cx={p1.x} cy={p1.y} r={7} fill="var(--series-b)" stroke="var(--surface)" strokeWidth={2} />
        </g>
        <g
          onPointerDown={onPointerDown('x2')}
          style={{ cursor: 'grab' }}
          tabIndex={0}
          role="slider"
          aria-label="x2"
          aria-valuemin={x1 + MIN_GAP}
          aria-valuemax={b}
          aria-valuenow={x2}
          onKeyDown={(e) => {
            const step = (b - a) / 80;
            if (e.key === 'ArrowRight') setX2((v) => Math.min(b, v + step));
            if (e.key === 'ArrowLeft') setX2((v) => Math.max(x1 + MIN_GAP, v - step));
          }}
        >
          <circle cx={p2.x} cy={p2.y} r={14} fill="var(--series-b)" fillOpacity={0.18} />
          <circle cx={p2.x} cy={p2.y} r={7} fill="var(--series-b)" stroke="var(--surface)" strokeWidth={2} />
        </g>
      </svg>

      <div className="space-y-3">
        <div className="flex items-center gap-4">
          <label htmlFor="x1-range" className="text-sm text-ink-2 shrink-0 w-10">x1</label>
          <input
            id="x1-range"
            type="range"
            className="slider"
            min={a}
            max={x2 - MIN_GAP}
            step={(b - a) / 400}
            value={x1}
            onChange={(e) => setX1(Math.min(Number(e.target.value), x2 - MIN_GAP))}
          />
          <span className="readout text-ink font-semibold w-14 text-end shrink-0">{x1.toFixed(2)}</span>
        </div>
        <div className="flex items-center gap-4">
          <label htmlFor="x2-range" className="text-sm text-ink-2 shrink-0 w-10">x2</label>
          <input
            id="x2-range"
            type="range"
            className="slider"
            min={x1 + MIN_GAP}
            max={b}
            step={(b - a) / 400}
            value={x2}
            onChange={(e) => setX2(Math.max(Number(e.target.value), x1 + MIN_GAP))}
          />
          <span className="readout text-ink font-semibold w-14 text-end shrink-0">{x2.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
