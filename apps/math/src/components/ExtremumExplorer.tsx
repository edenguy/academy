import { useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CURVES, slopeSign } from '@/math/derivative';
import { pick, type Locale } from '@/content/localize';
import type { ExtremumExplorerConfig } from '@/content/schema';

const VB_W = 640;
const VB_H = 320;
const PAD_L = 46;
const PAD_R = 16;
const PAD_T = 18;
const PAD_B = 34;
const PLOT_W = VB_W - PAD_L - PAD_R;
const PLOT_H = VB_H - PAD_T - PAD_B;
const CURVE_SAMPLES = 140;

const SIGN_COLOR: Record<'inc' | 'dec' | 'flat', string> = {
  inc: 'var(--good)',
  dec: 'var(--series-b)',
  flat: 'var(--accent)',
};

/** Lesson 3 — drag along the curve; f'(x)'s sign (color-coded) shows where f rises/falls, and
 * the known extrema are marked where the sign flips. Reuses the same curve and drag mechanics
 * as the secant explorer, one handle instead of two. */
export function ExtremumExplorer({ config, locale }: { config: ExtremumExplorerConfig; locale: Locale }) {
  const { t } = useTranslation();
  const spec = CURVES[config.curve];
  const [a, b] = spec.domain;
  const [x, setX] = useState(config.initialX);
  const svgRef = useRef<SVGSVGElement>(null);
  const dragging = useRef(false);

  const yRange = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;
    for (let i = 0; i <= CURVE_SAMPLES; i++) {
      const y = spec.fn(a + ((b - a) * i) / CURVE_SAMPLES);
      min = Math.min(min, y);
      max = Math.max(max, y);
    }
    const pad = (max - min) * 0.15 || 1;
    return { min: min - pad, max: max + pad };
  }, [spec, a, b]);

  const scaleX = useCallback((v: number) => PAD_L + ((v - a) / (b - a)) * PLOT_W, [a, b]);
  const scaleY = useCallback(
    (v: number) => PAD_T + PLOT_H - ((v - yRange.min) / (yRange.max - yRange.min)) * PLOT_H,
    [yRange],
  );

  const curvePath = useMemo(() => {
    const pts: string[] = [];
    for (let i = 0; i <= CURVE_SAMPLES; i++) {
      const xi = a + ((b - a) * i) / CURVE_SAMPLES;
      pts.push(`${i === 0 ? 'M' : 'L'} ${scaleX(xi).toFixed(2)} ${scaleY(spec.fn(xi)).toFixed(2)}`);
    }
    return pts.join(' ');
  }, [spec, a, b, scaleX, scaleY]);

  const sign = slopeSign(spec, x);
  const derivativeValue = spec.derivative(x);
  const point = { x: scaleX(x), y: scaleY(spec.fn(x)) };

  function clamp(v: number) {
    return Math.min(b, Math.max(a, v));
  }
  function setFromClientX(clientX: number) {
    const svg = svgRef.current;
    if (!svg) return;
    const ctm = svg.getScreenCTM();
    if (!ctm) return;
    const inv = ctm.inverse();
    const localX = clientX * inv.a + inv.e;
    setX(clamp(a + ((localX - PAD_L) / PLOT_W) * (b - a)));
  }

  return (
    <div className="card-flat p-4 md:p-5 space-y-4">
      {config.caption && <div className="text-sm font-semibold text-accent">{pick(config.caption, locale)}</div>}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-xs text-muted num" dir="ltr">f&apos;(x)</div>
          <div className="readout text-2xl md:text-3xl font-bold num" style={{ color: SIGN_COLOR[sign] }}>
            {derivativeValue.toFixed(2)}
          </div>
        </div>
        <div>
          <div className="text-xs text-muted">{t('lesson.behavior')}</div>
          <div className="text-lg md:text-xl font-bold" style={{ color: SIGN_COLOR[sign] }}>
            {t(`lesson.sign.${sign}`)}
          </div>
        </div>
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        className="w-full h-auto touch-none"
        role="img"
        aria-label={t('lesson.extremumGraph')}
        onPointerMove={(e) => dragging.current && setFromClientX(e.clientX)}
        onPointerUp={() => (dragging.current = false)}
      >
        <line x1={PAD_L} y1={scaleY(0)} x2={VB_W - PAD_R} y2={scaleY(0)} stroke="var(--axis)" strokeWidth={1.5} />
        <line x1={PAD_L} y1={PAD_T} x2={PAD_L} y2={VB_H - PAD_B} stroke="var(--axis)" strokeWidth={1.5} />
        <text x={scaleX(a)} y={VB_H - 8} textAnchor="middle" className="fill-muted text-[12px] num">{a}</text>
        <text x={scaleX(b)} y={VB_H - 8} textAnchor="middle" className="fill-muted text-[12px] num">{b}</text>

        {(spec.extrema ?? []).map((e) => (
          <g key={e.x}>
            <line
              x1={scaleX(e.x)}
              y1={PAD_T}
              x2={scaleX(e.x)}
              y2={VB_H - PAD_B}
              stroke="var(--accent)"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              opacity={0.6}
            />
            <circle cx={scaleX(e.x)} cy={scaleY(spec.fn(e.x))} r={5} fill="var(--accent)" />
            <text x={scaleX(e.x)} y={PAD_T - 4} textAnchor="middle" className="fill-accent text-[11px] font-bold">
              {t(e.kind === 'max' ? 'lesson.localMax' : 'lesson.localMin')}
            </text>
          </g>
        ))}

        <path d={curvePath} fill="none" stroke="var(--series-a)" strokeWidth={3} strokeLinecap="round" />

        <g
          onPointerDown={(e) => {
            (e.target as Element).setPointerCapture(e.pointerId);
            dragging.current = true;
            setFromClientX(e.clientX);
          }}
          style={{ cursor: 'grab' }}
          tabIndex={0}
          role="slider"
          aria-label="x"
          aria-valuemin={a}
          aria-valuemax={b}
          aria-valuenow={x}
          onKeyDown={(e) => {
            const step = (b - a) / 100;
            if (e.key === 'ArrowRight') setX((v) => clamp(v + step));
            if (e.key === 'ArrowLeft') setX((v) => clamp(v - step));
          }}
        >
          <circle cx={point.x} cy={point.y} r={14} fill={SIGN_COLOR[sign]} fillOpacity={0.18} />
          <circle cx={point.x} cy={point.y} r={7} fill={SIGN_COLOR[sign]} stroke="var(--surface)" strokeWidth={2} />
        </g>
      </svg>

      <div className="flex items-center gap-4">
        <label htmlFor="x-range" className="text-sm text-ink-2 shrink-0 w-10">x</label>
        <input
          id="x-range"
          type="range"
          className="slider"
          min={a}
          max={b}
          step={(b - a) / 400}
          value={x}
          onChange={(e) => setX(Number(e.target.value))}
        />
        <span className="readout text-ink font-semibold w-14 text-end shrink-0 num">{x.toFixed(2)}</span>
      </div>
    </div>
  );
}
