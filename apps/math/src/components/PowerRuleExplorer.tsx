import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { clsx } from 'clsx';
import { derivativeTerm, evalTerm, type PowerTerm } from '@/math/derivative';
import { pick, type Locale } from '@/content/localize';
import type { PowerRuleExplorerConfig } from '@/content/schema';

const VB_W = 640;
const VB_H = 320;
const PAD_L = 46;
const PAD_R = 16;
const PAD_T = 18;
const PAD_B = 34;
const PLOT_W = VB_W - PAD_L - PAD_R;
const PLOT_H = VB_H - PAD_T - PAD_B;
const CURVE_SAMPLES = 90;
// x stays positive so a root term (power = 0.5) is always defined.
const X_MIN = 0.2;
const X_MAX = 4;

const POWER_OPTIONS: { power: number; label: string }[] = [
  { power: 0.5, label: '√x' },
  { power: 1, label: 'x' },
  { power: 2, label: 'x²' },
  { power: 3, label: 'x³' },
];

function formatTerm(term: PowerTerm): string {
  const c = Number(term.coeff.toFixed(2));
  const cStr = c === 1 ? '' : c === -1 ? '-' : String(c);
  if (term.power === 0) return String(c);
  if (term.power === 0.5) return `${cStr}√x`;
  if (term.power === 1) return `${cStr}x`;
  return `${cStr}x^${term.power}`;
}

/** Lesson 2's power-rule explorer — adjust a single term coeff·x^power and watch f and f'
 * respond together, reinforcing the rule as a pattern rather than a fact to memorize. */
export function PowerRuleExplorer({ config, locale }: { config: PowerRuleExplorerConfig; locale: Locale }) {
  const { t } = useTranslation();
  const [power, setPower] = useState(config.initialPower);
  const [coeff, setCoeff] = useState(config.initialCoeff);
  const term: PowerTerm = { coeff, power };
  const dTerm = derivativeTerm(term);

  const { fPath, fPrimePath, yMax } = useMemo(() => {
    const fPts: number[] = [];
    const dPts: number[] = [];
    for (let i = 0; i <= CURVE_SAMPLES; i++) {
      const x = X_MIN + ((X_MAX - X_MIN) * i) / CURVE_SAMPLES;
      fPts.push(evalTerm(term, x));
      dPts.push(evalTerm(dTerm, x));
    }
    const allAbs = [...fPts, ...dPts].map(Math.abs);
    const max = Math.max(...allAbs, 1) * 1.15;
    const scaleX = (x: number) => PAD_L + ((x - X_MIN) / (X_MAX - X_MIN)) * PLOT_W;
    const scaleY = (y: number) => PAD_T + PLOT_H / 2 - (y / max) * (PLOT_H / 2);
    const toPath = (pts: number[]) =>
      pts
        .map((y, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(X_MIN + ((X_MAX - X_MIN) * i) / CURVE_SAMPLES).toFixed(2)} ${scaleY(y).toFixed(2)}`)
        .join(' ');
    return { fPath: toPath(fPts), fPrimePath: toPath(dPts), yMax: max };
  }, [term, dTerm]);

  const scaleX = (x: number) => PAD_L + ((x - X_MIN) / (X_MAX - X_MIN)) * PLOT_W;
  const scaleY = (y: number) => PAD_T + PLOT_H / 2 - (y / yMax) * (PLOT_H / 2);
  const zeroY = scaleY(0);

  return (
    <div className="card-flat p-4 md:p-5 space-y-4">
      {config.caption && <div className="text-sm font-semibold text-accent">{pick(config.caption, locale)}</div>}

      <div className="flex flex-wrap items-center gap-2" role="group" aria-label={t('lesson.power')}>
        {POWER_OPTIONS.map((opt) => (
          <button
            key={opt.power}
            type="button"
            onClick={() => setPower(opt.power)}
            className={clsx(
              'rounded-full px-3 py-1.5 text-sm font-semibold transition-colors num',
              power === opt.power ? 'bg-accent text-accent-ink' : 'bg-surface-3 text-ink-2 hover:text-ink',
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-4">
        <label htmlFor="coeff-range" className="text-sm text-ink-2 shrink-0 whitespace-nowrap">
          {t('lesson.coefficient')}
        </label>
        <input
          id="coeff-range"
          type="range"
          className="slider"
          min={-3}
          max={3}
          step={0.5}
          value={coeff}
          onChange={(e) => setCoeff(Number(e.target.value))}
        />
        <span className="readout text-ink font-semibold w-10 text-end shrink-0 num">{coeff}</span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-xs text-muted num" dir="ltr">f(x) =</div>
          <div className="readout text-xl md:text-2xl font-bold text-ink num" dir="ltr">
            {formatTerm(term)}
          </div>
        </div>
        <div>
          <div className="text-xs text-muted num" dir="ltr">f&apos;(x) =</div>
          <div className="readout text-xl md:text-2xl font-bold text-accent num" dir="ltr">
            {formatTerm(dTerm)}
          </div>
        </div>
      </div>

      <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="w-full h-auto" role="img" aria-label={t('lesson.powerRuleGraph')}>
        <line x1={PAD_L} y1={zeroY} x2={VB_W - PAD_R} y2={zeroY} stroke="var(--line-strong)" strokeWidth={1.5} />
        <line x1={PAD_L} y1={PAD_T} x2={PAD_L} y2={VB_H - PAD_B} stroke="var(--line-strong)" strokeWidth={1.5} />
        <text x={scaleX(X_MIN)} y={VB_H - 8} textAnchor="middle" className="fill-muted text-[12px] num">{X_MIN}</text>
        <text x={scaleX(X_MAX)} y={VB_H - 8} textAnchor="middle" className="fill-muted text-[12px] num">{X_MAX}</text>
        <path d={fPath} fill="none" stroke="var(--series-a)" strokeWidth={3} strokeLinecap="round" />
        <path d={fPrimePath} fill="none" stroke="var(--series-b)" strokeWidth={3} strokeLinecap="round" strokeDasharray="7 5" />
      </svg>

      <div className="flex items-center gap-5 text-xs text-ink-2">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block w-3 h-[3px] rounded-full" style={{ background: 'var(--series-a)' }} /> f(x)
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block w-3 h-[3px] rounded-full" style={{ background: 'var(--series-b)' }} /> f&apos;(x)
        </span>
      </div>
    </div>
  );
}
