import type { Lesson } from '@/content/schema';
import type { SignatureCurve, SignatureDraw } from '@/components/LessonSignature';
import { sharedPairs } from './covalent';
import { netDipole } from './dipole';
import { cationPositions } from './metallic';
import { hydrogenBondBetween, waterMolecule } from './water';

const VB_W = 200;
const VB_H = 48;
const FALLBACK = { x: 76, y: 28 };

function line(x1: number, y1: number, x2: number, y2: number) {
  return `M ${x1} ${y1} L ${x2} ${y2}`;
}

function dipolePath(): { d: string; fallback: { x: number; y: number } } {
  const a = 0;
  const b = 180;
  const samples = 32;
  let min = Infinity;
  let max = -Infinity;
  const ys: number[] = [];
  for (let i = 0; i <= samples; i++) {
    const y = netDipole(a + ((b - a) * i) / samples);
    ys.push(y);
    min = Math.min(min, y);
    max = Math.max(max, y);
  }
  const span = max - min || 1;
  const pts = ys.map((y, i) => {
    const x = 4 + (i / samples) * (VB_W - 8);
    const py = 6 + (VB_H - 12) - ((y - min) / span) * (VB_H - 12);
    return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${py.toFixed(1)}`;
  });
  const i = Math.round(0.38 * samples);
  const fallback = {
    x: 4 + (i / samples) * (VB_W - 8),
    y: 6 + (VB_H - 12) - ((ys[i]! - min) / span) * (VB_H - 12),
  };
  return { d: pts.join(' '), fallback };
}

/** Maps each chemistry explorer kind to a drawing made from that lesson's config and the pure functions. */
export function lessonSignature(lesson: Lesson): SignatureDraw {
  const explorer = lesson.explorers?.[0];
  const base = { viewBox: `0 0 ${VB_W} ${VB_H}` };
  if (!explorer) {
    const d = 'M0 40 C 60 40, 120 8, 200 8';
    return { ...base, curves: [{ d, stroke: 'var(--accent)' }], handlePath: d, handleFallback: FALLBACK };
  }

  switch (explorer.kind) {
    case 'ionTransfer': {
      const d = line(28, 24, 172, 24);
      return {
        ...base,
        curves: [{ d, stroke: 'var(--series-a)' }],
        dots: [
          { cx: 28, cy: 24, r: 10, fill: 'var(--series-a-soft)' },
          { cx: 172, cy: 24, r: 10, fill: 'var(--series-b-soft)' },
        ],
        handlePath: d,
        handleFallback: { x: 28 + 0.38 * 144, y: 24 },
      };
    }
    case 'sharedPairs': {
      const n = sharedPairs(explorer.order);
      const curves = Array.from({ length: n }, (_, i) => {
        const y = 16 + i * 8;
        return { d: line(36, y, 164, y), stroke: 'var(--series-a)', strokeWidth: 2 };
      });
      const mid = curves[Math.floor((n - 1) / 2)]!;
      return { ...base, curves, handlePath: mid.d, handleFallback: { x: 36 + 0.38 * 128, y: 16 + Math.floor((n - 1) / 2) * 8 } };
    }
    case 'dipole': {
      const { d, fallback } = dipolePath();
      return { ...base, curves: [{ d, stroke: 'var(--series-a)' }], handlePath: d, handleFallback: fallback };
    }
    case 'electronSea': {
      const pts = cationPositions(explorer.shear);
      return {
        ...base,
        curves: [{ d: line(20, 36, 180, 36), stroke: 'var(--series-b)', strokeWidth: 6 }],
        dots: pts.map((p) => ({ cx: 30 + p.x * 40, cy: 14 + p.y * 22, r: 5, fill: 'var(--series-a)' })),
        handlePath: line(20, 14, 160, 14),
        handleFallback: { x: 20 + 0.38 * 140, y: 14 },
      };
    }
    case 'waterPair': {
      const a = waterMolecule(0, 0, 0);
      const b = waterMolecule(explorer.x, explorer.y, explorer.rotation);
      const scale = (p: { x: number; y: number }) => ({ x: 36 + p.x * 28, y: 24 - p.y * 28 });
      const curves: SignatureCurve[] = [a, b].flatMap((m) => {
        const o = scale(m.O);
        const h1 = scale(m.H1);
        const h2 = scale(m.H2);
        return [
          { d: line(o.x, o.y, h1.x, h1.y), stroke: 'var(--series-a)' },
          { d: line(o.x, o.y, h2.x, h2.y), stroke: 'var(--series-a)' },
        ];
      });
      if (hydrogenBondBetween(a, b)) {
        const o1 = scale(a.O);
        const o2 = scale(b.O);
        curves.push({ d: line(o1.x, o1.y, o2.x, o2.y), stroke: 'var(--series-b)', dash: '4 3' });
      }
      const handle = line(36, 24, 36 + explorer.x * 28, 24);
      return { ...base, curves, handlePath: handle, handleFallback: { x: 36 + 0.38 * explorer.x * 28, y: 24 } };
    }
    case 'materialProbe': {
      const pts = cationPositions(0);
      return {
        ...base,
        curves: [{ d: line(24, 36, 176, 12), stroke: 'var(--series-a)' }],
        dots: pts.map((p) => ({ cx: 40 + p.x * 36, cy: 16 + p.y * 16, r: 4, fill: 'var(--accent)' })),
        handlePath: line(24, 36, 176, 12),
        handleFallback: { x: 24 + 0.38 * 152, y: 36 - 0.38 * 24 },
      };
    }
  }
}
