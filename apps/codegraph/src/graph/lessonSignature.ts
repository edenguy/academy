import type { Lesson } from '@/content/schema';
import type { SignatureCurve, SignatureDraw } from '@/components/LessonSignature';
import { cadenceTicks } from './signatureHelpers';
import { dependents } from './graph';
import { logBarPercent, indexBuilds } from './scale';
import { relevantHits, searchText, TERM_QUESTION } from './search';
import { BASE_GRAPH, REPOS, TOY_FILES } from './toy';

const VB_W = 200;
const VB_H = 48;
const FALLBACK = { x: 76, y: 28 };

function line(x1: number, y1: number, x2: number, y2: number) {
  return `M ${x1} ${y1} L ${x2} ${y2}`;
}

function scaleDrawing(repos: number, developers: number, rpd: number): SignatureDraw {
  const org = { repos, developers };
  const everything = indexBuilds(org, 'everyMachineEverything', rpd);
  const once = indexBuilds(org, 'publishOnce', rpd);
  const wide = (v: number) => 20 + (logBarPercent(v, everything) / 100) * 160;
  const a = line(20, 16, wide(once), 16);
  const b = line(20, 32, wide(everything), 32);
  return {
    viewBox: `0 0 ${VB_W} ${VB_H}`,
    curves: [
      { d: a, stroke: 'var(--series-b)', strokeWidth: 6 },
      { d: b, stroke: 'var(--series-a)', strokeWidth: 6 },
    ],
    handlePath: b,
    handleFallback: { x: 20 + 0.38 * (wide(everything) - 20), y: 32 },
  };
}

function cadenceDrawing(commitsPerDay: number): SignatureDraw {
  const { ticks, publishAt } = cadenceTicks(commitsPerDay);
  const curves: SignatureCurve[] = ticks.map((x) => ({ d: line(x, 20, x, 36), stroke: 'var(--series-a)' }));
  const base = line(12, 40, 188, 40);
  curves.push({ d: base, stroke: 'var(--axis)', strokeWidth: 1.5 });
  return {
    viewBox: `0 0 ${VB_W} ${VB_H}`,
    curves,
    dots: [{ cx: publishAt, cy: 10, r: 4.5, fill: 'var(--series-b)' }],
    handlePath: base,
    handleFallback: { x: 12 + 0.38 * 176, y: 40 },
  };
}

/** Maps each explorer kind to a drawing made from that lesson's config and the pure functions. */
export function lessonSignature(lesson: Lesson): SignatureDraw {
  const explorer = lesson.explorers?.[0];
  const base = { viewBox: `0 0 ${VB_W} ${VB_H}` };
  if (!explorer) {
    const d = 'M0 40 C 60 40, 120 8, 200 8';
    return { ...base, curves: [{ d, stroke: 'var(--accent)' }], handlePath: d, handleFallback: FALLBACK };
  }

  switch (explorer.kind) {
    case 'searchCost': {
      const visible = explorer.bothRepos ? REPOS : REPOS.slice(0, 1);
      const hits = searchText(TOY_FILES, explorer.term, visible);
      // the tick of the hit that actually answers the question is green
      const answering = new Set(relevantHits(TERM_QUESTION[explorer.term]!, hits, explorer.term).map((h) => `${h.file}:${h.line}`));
      const curves: SignatureCurve[] = hits.map((h, i) => {
        const y = 6 + i * (28 / Math.max(hits.length, 1));
        return {
          d: line(20, y, 20 + 70 + (i % 3) * 18, y),
          stroke: answering.has(`${h.file}:${h.line}`) ? 'var(--good)' : 'var(--series-a)',
          strokeWidth: 2,
        };
      });
      const under = line(20, 43, 180, 43);
      curves.push({ d: under, stroke: 'var(--axis)', strokeWidth: 1.5 });
      return { ...base, curves, handlePath: under, handleFallback: { x: 20 + 0.38 * 160, y: 43 } };
    }
    case 'graphView': {
      const vals = [0, 1, 2, 3, 4].map((h) => dependents(BASE_GRAPH, explorer.start, h).length);
      const max = Math.max(...vals, 1);
      const x = (h: number) => 8 + (h / 4) * 184;
      const y = (v: number) => 42 - (v / max) * 34;
      let d = `M ${x(0)} ${y(vals[0]!)}`;
      for (let h = 1; h <= 4; h++) d += ` L ${x(h)} ${y(vals[h - 1]!)} L ${x(h)} ${y(vals[h]!)}`;
      return { ...base, curves: [{ d, stroke: 'var(--accent)' }], handlePath: d, handleFallback: { x: x(1.5), y: y(vals[2]!) } };
    }
    case 'askGraphs': {
      const a = line(30, 34, 100, 14);
      const b = line(100, 14, 170, 34);
      return {
        ...base,
        curves: [
          { d: a, stroke: 'var(--series-a)', strokeWidth: 2.5 },
          { d: b, stroke: 'var(--series-b)', strokeWidth: 2.5, dash: '5 4' },
        ],
        dots: [
          { cx: 30, cy: 34, r: 6, fill: 'var(--series-a)' },
          { cx: 100, cy: 14, r: 6, fill: 'var(--accent)' },
          { cx: 170, cy: 34, r: 6, fill: 'var(--series-b)' },
        ],
        handlePath: a,
        handleFallback: { x: 30 + 0.38 * 70, y: 34 - 0.38 * 20 },
      };
    }
    case 'landscape': {
      const curves: SignatureCurve[] = [0, 1, 2, 3, 4].map((i) => ({
        d: line(24, 6 + i * 9, 176, 6 + i * 9),
        stroke: `color-mix(in srgb, var(--accent) ${100 - i * 25}%, var(--accent-2))`,
        strokeWidth: 5,
      }));
      return { ...base, curves, handlePath: curves[2]!.d, handleFallback: { x: 24 + 0.38 * 152, y: 24 } };
    }
    case 'scale':
    case 'staleness':
      return scaleDrawing(
        explorer.kind === 'scale' ? explorer.repos : 500,
        explorer.kind === 'scale' ? explorer.developers : 20000,
        explorer.kind === 'scale' ? explorer.reposPerDeveloper : 3,
      );
    case 'topology': {
      const xs = [44, 93, 142];
      const squares = xs.map((x) => ({ x: x - 7, y: 3, width: 14, height: 14 }));
      const curves: SignatureCurve[] = xs.map((x) => ({ d: line(x, 17, x, 28), stroke: 'var(--series-a)' }));
      return {
        ...base,
        curves,
        rects: [...squares, { x: 30, y: 28, width: 140, height: 14 }],
        handlePath: line(30, 35, 170, 35),
        handleFallback: { x: 30 + 0.38 * 140, y: 35 },
      };
    }
    case 'cadence':
      return cadenceDrawing(explorer.commitsPerDay);
    case 'access':
      return cadenceDrawing(10);
  }
}
