import { useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { SCENARIOS, averageVelocity } from '@/physics/kinematics';
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

type Handle = 't1' | 't2';

export function SlopeExplorer({ config, locale }: { config: SecantExplorerConfig; locale: Locale }) {
  const { t } = useTranslation();
  const spec = SCENARIOS[config.scenario];
  const [a, b] = spec.domain;
  const [t1, setT1] = useState(config.initialT1);
  const [t2, setT2] = useState(config.initialT2);
  const svgRef = useRef<SVGSVGElement>(null);
  const dragging = useRef<Handle | null>(null);

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

  const avgV = averageVelocity(spec, t1, t2);
  const exactAtT1 = spec.velocity(t1);
  const gapIsTiny = t2 - t1 < (b - a) / 40;

  // Secant line, extended a little past both points so it reads as a line, not just a segment.
  const secantPath = useMemo(() => {
    const ext = (b - a) * 0.08;
    const x1 = Math.max(a, t1 - ext);
    const x2 = Math.min(b, t2 + ext);
    const y1 = spec.position(t1) + avgV * (x1 - t1);
    const y2 = spec.position(t1) + avgV * (x2 - t1);
    return `M ${scaleX(x1).toFixed(2)} ${scaleY(y1).toFixed(2)} L ${scaleX(x2).toFixed(2)} ${scaleY(y2).toFixed(2)}`;
  }, [a, b, t1, t2, avgV, spec, scaleX, scaleY]);

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
    const tVal = a + ((localX - PAD_L) / PLOT_W) * (b - a);
    if (which === 't1') setT1(Math.min(clamp(tVal), t2 - MIN_GAP));
    else setT2(Math.max(clamp(tVal), t1 + MIN_GAP));
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

  const p1 = { x: scaleX(t1), y: scaleY(spec.position(t1)) };
  const p2 = { x: scaleX(t2), y: scaleY(spec.position(t2)) };

  return (
    <div className="card-flat p-4 md:p-5 space-y-4">
      {config.caption && <div className="text-sm font-semibold text-accent">{pick(config.caption, locale)}</div>}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-xs text-muted">{t('lesson.averageVelocity')}</div>
          <motion.div
            key={avgV.toFixed(3)}
            initial={{ scale: 0.92, opacity: 0.5 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.12 }}
            className="readout text-2xl md:text-3xl font-bold text-ink"
          >
            {avgV.toFixed(2)}
          </motion.div>
        </div>
        <div>
          <div className="text-xs text-muted">{t('lesson.instantaneousAtT1', { t: t1.toFixed(2) })}</div>
          <div className={`readout text-2xl md:text-3xl font-bold ${gapIsTiny ? 'text-good' : 'text-ink-2'}`}>
            {exactAtT1.toFixed(2)}
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
        <line x1={PAD_L} y1={scaleY(0)} x2={VB_W - PAD_R} y2={scaleY(0)} stroke="var(--axis)" strokeWidth={1.5} />
        <line x1={PAD_L} y1={PAD_T} x2={PAD_L} y2={scaleY(0) + 1} stroke="var(--axis)" strokeWidth={1.5} />
        <text x={scaleX(a)} y={VB_H - 8} textAnchor="middle" className="fill-muted text-[12px] num">{a}</text>
        <text x={scaleX(b)} y={VB_H - 8} textAnchor="middle" className="fill-muted text-[12px] num">{b}</text>
        <path d={curvePath} fill="none" stroke="var(--series-a)" strokeWidth={3} strokeLinecap="round" />
        <path d={secantPath} fill="none" stroke="var(--series-b)" strokeWidth={2} strokeDasharray={gapIsTiny ? undefined : '6 4'} />

        <g
          onPointerDown={onPointerDown('t1')}
          style={{ cursor: 'grab' }}
          tabIndex={0}
          role="slider"
          aria-label="t1"
          aria-valuemin={a}
          aria-valuemax={t2 - MIN_GAP}
          aria-valuenow={t1}
          onKeyDown={(e) => {
            const step = (b - a) / 80;
            if (e.key === 'ArrowRight') setT1((v) => Math.min(t2 - MIN_GAP, v + step));
            if (e.key === 'ArrowLeft') setT1((v) => Math.max(a, v - step));
          }}
        >
          <circle cx={p1.x} cy={p1.y} r={14} fill="var(--series-b)" fillOpacity={0.18} />
          <circle cx={p1.x} cy={p1.y} r={7} fill="var(--series-b)" stroke="var(--surface)" strokeWidth={2} />
        </g>
        <g
          onPointerDown={onPointerDown('t2')}
          style={{ cursor: 'grab' }}
          tabIndex={0}
          role="slider"
          aria-label="t2"
          aria-valuemin={t1 + MIN_GAP}
          aria-valuemax={b}
          aria-valuenow={t2}
          onKeyDown={(e) => {
            const step = (b - a) / 80;
            if (e.key === 'ArrowRight') setT2((v) => Math.min(b, v + step));
            if (e.key === 'ArrowLeft') setT2((v) => Math.max(t1 + MIN_GAP, v - step));
          }}
        >
          <circle cx={p2.x} cy={p2.y} r={14} fill="var(--series-b)" fillOpacity={0.18} />
          <circle cx={p2.x} cy={p2.y} r={7} fill="var(--series-b)" stroke="var(--surface)" strokeWidth={2} />
        </g>
      </svg>

      <div className="space-y-3">
        <div className="flex items-center gap-4">
          <label htmlFor="t1-range" className="text-sm text-ink-2 shrink-0 w-10">t1</label>
          <input
            id="t1-range"
            type="range"
            className="slider"
            min={a}
            max={t2 - MIN_GAP}
            step={(b - a) / 400}
            value={t1}
            onChange={(e) => setT1(Math.min(Number(e.target.value), t2 - MIN_GAP))}
          />
          <span className="readout text-ink font-semibold w-14 text-end shrink-0">{t1.toFixed(2)}</span>
        </div>
        <div className="flex items-center gap-4">
          <label htmlFor="t2-range" className="text-sm text-ink-2 shrink-0 w-10">t2</label>
          <input
            id="t2-range"
            type="range"
            className="slider"
            min={t1 + MIN_GAP}
            max={b}
            step={(b - a) / 400}
            value={t2}
            onChange={(e) => setT2(Math.max(Number(e.target.value), t1 + MIN_GAP))}
          />
          <span className="readout text-ink font-semibold w-14 text-end shrink-0">{t2.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
