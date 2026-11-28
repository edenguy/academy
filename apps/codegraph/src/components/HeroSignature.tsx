import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useReducedMotion } from 'motion/react';

/**
 * The hero's live signature (§5.2 of the skin spec): a teaser graph the visitor can scrub
 * with a finger before tapping anything. It is deliberately NOT the accessible explorer —
 * `aria-hidden`, no keyboard handling, no slider semantics; the real explorers on the lesson
 * pages are the accessible ones. Identical renderer in apps/math and apps/physics; only the
 * `curve` (the subject's own real function) differs — see `src/<subject>/heroCurve.ts`.
 */
export interface HeroCurveConfig {
  domain: [number, number];
  fn: (x: number) => number;
  tagText: (x: number, t: number) => string;
  renderExtra?: (args: {
    x: number;
    t: number;
    scaleX: (x: number) => number;
    scaleY: (y: number) => number;
  }) => ReactNode;
}

const VB_W = 640;
const VB_H = 280;
const PAD = 28;
const PLOT_W = VB_W - PAD * 2;
const PLOT_H = VB_H - PAD * 2;
const SAMPLES = 100;
const SWEEP_TARGET = 0.62;
const SWEEP_MS = 1400;
const TAG_W = 70; // minimum; the tag grows with its text (Code Graph's tag is longer than a number)
const TAG_H = 24;

export function HeroSignature({ curve }: { curve: HeroCurveConfig }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [t, setT] = useState(0);
  const dragging = useRef(false);
  const sweptRef = useRef(false);
  const prefersReducedMotion = useReducedMotion();
  const [a, b] = curve.domain;
  // rendered px per viewBox unit, so the tag text never renders below 12 px (Code Graph checklist item 8)
  const [scale, setScale] = useState(0.6);
  useEffect(() => {
    const el = svgRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => setScale(el.getBoundingClientRect().width / VB_W || 0.6));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const yRange = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;
    for (let i = 0; i <= SAMPLES; i++) {
      const y = curve.fn(a + ((b - a) * i) / SAMPLES);
      min = Math.min(min, y);
      max = Math.max(max, y);
    }
    const pad = (max - min) * 0.12 || 1;
    return { min: min - pad, max: max + pad };
  }, [curve, a, b]);

  const scaleX = (x: number) => PAD + ((x - a) / (b - a)) * PLOT_W;
  const scaleY = (y: number) => PAD + PLOT_H - ((y - yRange.min) / (yRange.max - yRange.min)) * PLOT_H;

  const curvePath = useMemo(() => {
    const pts: string[] = [];
    for (let i = 0; i <= SAMPLES; i++) {
      const x = a + ((b - a) * i) / SAMPLES;
      pts.push(`${i === 0 ? 'M' : 'L'} ${scaleX(x).toFixed(2)} ${scaleY(curve.fn(x)).toFixed(2)}`);
    }
    return pts.join(' ');
  }, [curve, a, b, yRange]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load sweep: handle slides 0 → 62% once, then stops and waits for the pointer.
  useEffect(() => {
    if (sweptRef.current) return;
    sweptRef.current = true;
    if (prefersReducedMotion) {
      setT(SWEEP_TARGET);
      return;
    }
    const start = performance.now();
    let raf = 0;
    function tick(now: number) {
      const linear = Math.min(1, (now - start) / SWEEP_MS);
      const eased = 1 - (1 - linear) ** 3;
      setT(eased * SWEEP_TARGET);
      if (linear < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [prefersReducedMotion]);

  function setFromClientX(clientX: number) {
    const svg = svgRef.current;
    if (!svg) return;
    const ctm = svg.getScreenCTM();
    if (!ctm) return;
    const inv = ctm.inverse();
    const localX = clientX * inv.a + inv.e;
    setT(Math.min(1, Math.max(0, (localX - PAD) / PLOT_W)));
  }

  const x = a + t * (b - a);
  const hx = scaleX(x);
  const hy = scaleY(curve.fn(x));
  const tagText = curve.tagText(x, t);
  const tagFont = Math.max(11.5, 12.4 / scale);
  // a long tag is split at " · " into lines so it stays narrow when the font is scaled up
  const tagLines = tagText.split(' · ');
  const tagW = Math.max(TAG_W, Math.max(...tagLines.map((l) => l.length)) * (tagFont * 0.62) + 18);
  const tagH = Math.max(TAG_H, tagLines.length * tagFont * 1.3 + 10);
  const tagX = Math.min(VB_W - PAD - tagW, Math.max(PAD, hx - tagW / 2));
  const tagY = Math.max(PAD, Math.min(VB_H - PAD - tagH, hy - 36 - (tagH - TAG_H)));

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      className="w-full h-full cursor-grab"
      style={{ touchAction: 'pan-y' }}
      aria-hidden="true"
      onPointerDown={(e) => {
        dragging.current = true;
        (e.target as Element).setPointerCapture?.(e.pointerId);
        setFromClientX(e.clientX);
      }}
      onPointerMove={(e) => {
        if (dragging.current) setFromClientX(e.clientX);
      }}
      onPointerUp={() => {
        dragging.current = false;
      }}
    >
      {Array.from({ length: 9 }).map((_, i) => (
        <line
          key={`v${i}`}
          x1={PAD + (PLOT_W / 8) * i}
          y1={PAD}
          x2={PAD + (PLOT_W / 8) * i}
          y2={VB_H - PAD}
          stroke="var(--grid)"
          strokeWidth={1}
        />
      ))}
      {Array.from({ length: 5 }).map((_, i) => (
        <line
          key={`h${i}`}
          x1={PAD}
          y1={PAD + (PLOT_H / 4) * i}
          x2={VB_W - PAD}
          y2={PAD + (PLOT_H / 4) * i}
          stroke="var(--grid)"
          strokeWidth={1}
        />
      ))}

      {curve.renderExtra?.({ x, t, scaleX, scaleY })}

      <path d={curvePath} fill="none" stroke="var(--series-a)" strokeWidth={3} strokeLinecap="round" />

      <line x1={hx} y1={PAD} x2={hx} y2={VB_H - PAD} stroke="var(--accent)" strokeOpacity={0.3} strokeWidth={1.5} strokeDasharray="4 4" />

      <circle cx={hx} cy={hy} r={18} fill="var(--accent)" fillOpacity={0.18} />
      <circle cx={hx} cy={hy} r={9} fill="var(--accent)" stroke="var(--surface)" strokeWidth={2.5} />

      <g transform={`translate(${tagX}, ${tagY})`}>
        <rect width={tagW} height={tagH} rx={6} fill="var(--accent)" />
        <text
          textAnchor="middle"
          fontFamily="var(--font-mono)"
          fontSize={tagFont}
          fontWeight={600}
          fill="var(--accent-ink)"
        >
          {tagLines.map((l, i) => (
            <tspan key={i} x={tagW / 2} y={tagFont * 1.05 + 5 + i * tagFont * 1.3}>{l}</tspan>
          ))}
        </text>
      </g>
    </svg>
  );
}
