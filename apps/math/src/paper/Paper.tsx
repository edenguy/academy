/**
 * The Paper layer in Math Academy: floating napkins of graph paper, with a graph or a formula
 * on each, in a stage band on the home page and in the page margins on wide screens.
 * Spec: BACKGROUND_LLD.md §3, §8.5, §9 and §11.1. Decoration only: `aria-hidden`, never clickable,
 * never behind text.
 *
 * The engine (./engine.js) is a byte-identical copy of docs/hub/paper-engine.js and defines the
 * global `AcademyPaper`. It reads nothing from the progress store, so it never waits for hydration.
 */
import './engine.js';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/ui/Icon';
import { PAYLOADS } from './payloads';

/** Which still frame the stage opens on: chosen by eye from seeds 0-9 for a spread on both phone and desktop widths. */
const STAGE_SEED = 6;
const FALLBACK_FONT = "'JetBrains Mono Variable', ui-monospace, monospace";

function paperFont(): string {
  try {
    return getComputedStyle(document.documentElement).getPropertyValue('--paper-font').trim() || FALLBACK_FONT;
  } catch {
    return FALLBACK_FONT;
  }
}

/** Dev builds only: `?paperOnly=<n>` makes every napkin carry payload n (BACKGROUND_LLD.md §14 item 5). */
function paperOnly(): number | undefined {
  if (!import.meta.env.DEV) return undefined;
  const n = Number(new URLSearchParams(window.location.search).get('paperOnly'));
  return Number.isInteger(n) && n >= 0 ? n : undefined;
}

function useMedia(query: string): boolean {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setMatches(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, [query]);
  return matches;
}

/** The pause / play button (WCAG 2.2.2). Shown only while the engine can move at all (§8.3). */
function PaperToggle({ placement }: { placement: 'stage' | 'fixed' }) {
  const { t } = useTranslation();
  const snap = useSyncExternalStore(AcademyPaper.onChange, () => `${AcademyPaper.motion()}|${AcademyPaper.canMove()}`);
  const [motion, can] = snap.split('|');
  if (can !== 'true') return null;
  const paused = motion === 'off';
  const label = t(paused ? 'settings.paperPlay' : 'settings.paperPause');
  return (
    <button
      type="button"
      className="paper-toggle"
      data-placement={placement}
      aria-pressed={paused}
      aria-label={label}
      title={label}
      onClick={() => AcademyPaper.setMotion(paused ? 'on' : 'off')}
    >
      <Icon name={paused ? 'play' : 'pause'} size={16} />
    </button>
  );
}

/** The band at the top of the home page: two napkins on a phone, three from 1024 px. */
export function PaperStage() {
  const ref = useRef<HTMLDivElement>(null);
  const wide = useMedia('(min-width: 1024px)');
  useEffect(() => {
    const host = ref.current;
    if (!host) return;
    const handle = AcademyPaper.mount(host, { flow: 'x', payloads: PAYLOADS, count: wide ? 3 : 2, font: paperFont(), seed: STAGE_SEED, only: paperOnly() });
    return () => handle.destroy();
  }, [wide]);
  return (
    <div ref={ref} className="paper-stage">
      <PaperToggle placement="stage" />
    </div>
  );
}

/** One napkin in each page margin, only while a margin is at least 96 px wide (from 1216 px). */
export function PaperGutters() {
  const { pathname } = useLocation();
  const left = useRef<HTMLDivElement>(null);
  const right = useRef<HTMLDivElement>(null);
  const wide = useMedia('(min-width: 1216px)');
  useEffect(() => {
    if (!wide || !left.current || !right.current) return;
    const only = paperOnly();
    const font = paperFont();
    const handles = [
      AcademyPaper.mount(left.current, { flow: 'y', payloads: PAYLOADS, count: 1, font, seed: 1, only }),
      AcademyPaper.mount(right.current, { flow: 'y', payloads: PAYLOADS, count: 1, font, seed: 4, only }),
    ];
    return () => handles.forEach((h) => h.destroy());
  }, [wide]);
  return (
    <>
      <div ref={left} className="paper-gutter" data-side="left" />
      <div ref={right} className="paper-gutter" data-side="right" />
      {wide && pathname !== '/' && <PaperToggle placement="fixed" />}
    </>
  );
}
