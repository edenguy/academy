import { useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { SCENARIOS, averageVelocity } from '@/physics/kinematics';
import { pick, type Locale } from '@/content/localize';
import type { SecantExplorerConfig } from '@/content/schema';
import { Card } from './ui/Card';
import { Icon } from './ui/Icon';

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
const TAG_W = 60;
const TAG_H = 22;

type Handle = 't1' | 't2';

export function SlopeExplorer({ config, locale }: { config: SecantExplorerConfig; locale: Locale }) {
  const { t } = useTranslation();
  const spec = SCENARIOS[config.scenario];
  const [a, b] = spec.domain;
  const [t1, setT1] = useState(config.initialT1);
  const [t2, setT2] = useState(config.initialT2);
  const [active, setActive] = useState<Handle | null>(null);
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
      setActive(which);
      setFromClientX(e.clientX, which);
    };
  }
  function onPointerMove(e: React.PointerEvent<SVGSVGElement>) {
    if (!dragging.current) return;
    setFromClientX(e.clientX, dragging.current);
  }
  function onPointerUp() {
    dragging.current = null;
    setActive(null);
  }

  const p1 = { x: scaleX(t1), y: scaleY(spec.position(t1)) };
  const p2 = { x: scaleX(t2), y: scaleY(spec.position(t2)) };

  function tagXFor(hx: number) {
    return Math.min(VB_W - PAD_R - TAG_W, Math.max(PAD_L, hx - TAG_W / 2));
  }

  return (
    <Card variant="bench" className="space-y-4">
      {config.caption && (
        <div className="flex items-center gap-1.5 text-sm font-semibold text-accent">
          <Icon name="handle" size={16} /> {pick(config.caption, locale)}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="elev-0 px-3.5 py-2.5 min-w-[112px]">
          <div className="text-[13px] text-muted">{t('lesson.averageVelocity')}</div>
          <motion.div
            key={avgV.toFixed(3)}
            initial={{ scale: 0.94, opacity: 0.5 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.12 }}
            className="readout text-[30px] md:text-[36px] font-semibold text-ink"
          >
            {avgV.toFixed(2)}
          </motion.div>
        </div>
        <div className="elev-0 px-3.5 py-2.5 min-w-[112px]">
          <div className="text-[13px] text-muted">{t('lesson.instantaneousAtT1', { t: t1.toFixed(2) })}</div>
          <div className={`readout text-[30px] md:text-[36px] font-semibold ${gapIsTiny ? 'text-good' : 'text-ink-2'}`}>
            {exactAtT1.toFixed(2)}
          </div>
        </div>
      </div>

      <div className="elev-0 overflow-hidden" style={{ padding: '8px 8px 4px' }}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          className="w-full h-auto touch-none"
          style={{ direction: 'ltr' }}
          role="img"
          aria-label={t('lesson.secantGraph')}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        >
          {Array.from({ length: 9 }).map((_, i) => (
            <line key={`v${i}`} x1={PAD_L + (PLOT_W / 8) * i} y1={PAD_T} x2={PAD_L + (PLOT_W / 8) * i} y2={VB_H - PAD_B} stroke="var(--grid)" strokeWidth={1} />
          ))}
          {Array.from({ length: 5 }).map((_, i) => (
            <line key={`h${i}`} x1={PAD_L} y1={PAD_T + (PLOT_H / 4) * i} x2={VB_W - PAD_R} y2={PAD_T + (PLOT_H / 4) * i} stroke="var(--grid)" strokeWidth={1} />
          ))}
          <line x1={PAD_L} y1={scaleY(0)} x2={VB_W - PAD_R} y2={scaleY(0)} stroke="var(--axis)" strokeWidth={1.5} />
          <line x1={PAD_L} y1={PAD_T} x2={PAD_L} y2={scaleY(0) + 1} stroke="var(--axis)" strokeWidth={1.5} />
          <text x={scaleX(a)} y={VB_H - 8} textAnchor="middle" className="axis-label fill-muted text-[12px] num">{a}</text>
          <text x={scaleX(b)} y={VB_H - 8} textAnchor="middle" className="axis-label fill-muted text-[12px] num">{b}</text>
          <path d={curvePath} fill="none" stroke="var(--series-a)" strokeWidth={3} strokeLinecap="round" />
          <path d={secantPath} fill="none" stroke="var(--series-b)" strokeWidth={2} strokeDasharray={gapIsTiny ? undefined : '6 4'} />

          {([
            ['t1', p1, t1] as const,
            ['t2', p2, t2] as const,
          ]).map(([which, p, value]) => (
            <g key={which}>
              <g
                onPointerDown={onPointerDown(which)}
                style={{ cursor: active === which ? 'grabbing' : 'grab', transformBox: 'fill-box', transformOrigin: 'center' }}
                transform={active === which ? 'scale(1.08)' : undefined}
                tabIndex={0}
                role="slider"
                aria-label={which}
                aria-valuemin={which === 't1' ? a : t1 + MIN_GAP}
                aria-valuemax={which === 't1' ? t2 - MIN_GAP : b}
                aria-valuenow={value}
                onKeyDown={(e) => {
                  const step = (b - a) / 80;
                  if (which === 't1') {
                    if (e.key === 'ArrowRight') setT1((v) => Math.min(t2 - MIN_GAP, v + step));
                    if (e.key === 'ArrowLeft') setT1((v) => Math.max(a, v - step));
                  } else {
                    if (e.key === 'ArrowRight') setT2((v) => Math.min(b, v + step));
                    if (e.key === 'ArrowLeft') setT2((v) => Math.max(t1 + MIN_GAP, v - step));
                  }
                }}
              >
                <circle cx={p.x} cy={p.y} r={18} fill="var(--series-b)" fillOpacity={active === which ? 0.3 : 0.16} />
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={9}
                  fill="var(--series-b)"
                  stroke="var(--surface)"
                  strokeWidth={2.5}
                  style={{ filter: 'drop-shadow(0 2px 6px var(--glow))' }}
                />
              </g>
              <g transform={`translate(${tagXFor(p.x)}, ${Math.max(PAD_T, p.y - 34)})`}>
                <rect width={TAG_W} height={TAG_H} rx={6} fill="var(--accent)" />
                <text x={TAG_W / 2} y={TAG_H / 2 + 4} textAnchor="middle" fontFamily="var(--font-mono)" fontSize={11.5} fontWeight={600} fill="var(--accent-ink)">
                  {which} = {value.toFixed(2)}
                </text>
              </g>
            </g>
          ))}
        </svg>
      </div>

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
            style={{ '--p': `${((t1 - a) / (t2 - MIN_GAP - a || 1)) * 100}%` } as React.CSSProperties}
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
            style={{ '--p': `${((t2 - (t1 + MIN_GAP)) / (b - (t1 + MIN_GAP) || 1)) * 100}%` } as React.CSSProperties}
          />
          <span className="readout text-ink font-semibold w-14 text-end shrink-0">{t2.toFixed(2)}</span>
        </div>
      </div>
    </Card>
  );
}
