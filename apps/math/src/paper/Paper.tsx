/**
 * The Paper layer in Math Academy, Revision 2: one fixed full-viewport canvas of floating napkins
 * of graph paper behind every page, with a graph or a formula on each. Every piece of text sits on
 * glass or a solid surface, never on the field (BACKGROUND_LLD.md R3, R4, R5.4, R8.3).
 * Decoration only: `aria-hidden`, never clickable.
 *
 * The engine (./engine.js) is a byte-identical copy of docs/hub/paper-engine.js and defines the
 * global `AcademyPaper`. It reads nothing from the progress store, so it never waits for hydration.
 */
import './engine.js';
import { useEffect, useRef, useSyncExternalStore } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/ui/Icon';
import { PAYLOADS } from './payloads';

/** Which napkins the field opens on: chosen by eye from seeds 0-9 for a spread at 390 and 1440 px (BACKGROUND_LLD.md R8.3). */
export const FIELD_SEED = 3;
const FALLBACK_FONT = "'JetBrains Mono Variable', ui-monospace, monospace";

function paperFont(): string {
  try {
    return getComputedStyle(document.documentElement).getPropertyValue('--paper-font').trim() || FALLBACK_FONT;
  } catch {
    return FALLBACK_FONT;
  }
}

/** Dev builds only: `?paperOnly=<n>` makes every napkin carry payload n, `?paperSeed=<n>` picks the seed, `?paperLevel=<0-5>` starts at that quality level. */
function devParam(name: string): number | undefined {
  if (!import.meta.env.DEV) return undefined;
  const raw = new URLSearchParams(window.location.search).get(name);
  const n = Number(raw);
  return raw !== null && Number.isInteger(n) && n >= 0 ? n : undefined;
}

/** The field: mounted once for the whole app, behind everything. */
export function PaperField() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const host = ref.current;
    if (!host) return;
    const level = devParam('paperLevel');
    if (level !== undefined) AcademyPaper._setLevel(level);
    const handle = AcademyPaper.mount(host, { flow: 'page', payloads: PAYLOADS, font: paperFont(), seed: devParam('paperSeed') ?? FIELD_SEED, only: devParam('paperOnly') });
    return () => handle.destroy();
  }, []);
  return <div ref={ref} className="paper-field" />;
}

const NEXT = { on: 'calm', calm: 'off', off: 'on' } as const;
const LABEL = { on: 'settings.paperCalm', calm: 'settings.paperStop', off: 'settings.paperPlay' } as const;
const ICON = { on: 'pause', calm: 'calm', off: 'play' } as const;

/** The background-motion button (WCAG 2.2.2): moving, calm, still, in that order. Shown only while the engine can move at all (§8.3). Its label names what a press will do. */
export function PaperToggle() {
  const { t } = useTranslation();
  const snap = useSyncExternalStore(AcademyPaper.onChange, () => `${AcademyPaper.motion()}|${AcademyPaper.canMove()}`);
  const [motion, can] = snap.split('|') as [keyof typeof NEXT, string];
  if (can !== 'true') return null;
  const label = t(LABEL[motion]);
  return (
    <button
      type="button"
      className="relative inline-flex items-center justify-center w-9 h-9 rounded-pill text-ink-2 hover:text-ink transition-colors after:content-[''] after:absolute after:-inset-1"
      aria-label={label}
      title={label}
      onClick={() => AcademyPaper.setMotion(NEXT[motion])}
    >
      <Icon name={ICON[motion]} size={17} />
    </button>
  );
}
