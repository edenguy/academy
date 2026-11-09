import type { Locale } from '@/content/localize';
import type { AchievementId } from './achievements';
import { ACHIEVEMENT_IDS } from './achievements';

export type ThemePreference = 'light' | 'dark';

export interface QuizAttempt {
  lessonId: string;
  questionId: string;
  correct: boolean;
  at: number;
}

export interface ProgressSettings {
  locale: Locale;
  theme: ThemePreference;
}

export interface PersistedProgress {
  settings: ProgressSettings;
  lessonsCompleted: Record<string, number>;
  lastVisited: string | null;
  attempts: QuizAttempt[];
  achievements: Partial<Record<AchievementId, number>>;
}

const ACHIEVEMENT_SET = new Set<string>(ACHIEVEMENT_IDS);

/**
 * Defensive cleanup of whatever came out of IndexedDB, from any schema version — mirrors
 * `sanitisePersisted` in apps/nitrox/src/progress/store.ts at Math's smaller scale (no
 * assessments, predictions, lab visits or units; `lastVisited` is a bare lesson id since
 * Math has no chapter grouping). Unknown or out-of-range values fall back rather than throw,
 * so a corrupted or future-shaped record never breaks the app on load.
 */
export function sanitisePersisted(input: unknown): Partial<PersistedProgress> {
  const p = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>;
  const obj = (v: unknown): Record<string, unknown> => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {});

  const s = obj(p.settings);
  const settings: ProgressSettings = {
    locale: s.locale === 'en' || s.locale === 'he' ? s.locale : 'he',
    theme: s.theme === 'light' ? 'light' : 'dark',
  };

  const lessonsCompleted = Object.fromEntries(
    Object.entries(obj(p.lessonsCompleted)).filter(([, v]) => typeof v === 'number' && Number.isFinite(v)),
  ) as Record<string, number>;

  const lastVisited = typeof p.lastVisited === 'string' ? p.lastVisited : null;

  const attempts = (Array.isArray(p.attempts) ? p.attempts : [])
    .filter(
      (a): a is QuizAttempt =>
        !!a &&
        typeof a === 'object' &&
        typeof (a as QuizAttempt).lessonId === 'string' &&
        typeof (a as QuizAttempt).questionId === 'string' &&
        typeof (a as QuizAttempt).correct === 'boolean' &&
        Number.isFinite((a as QuizAttempt).at),
    )
    .slice(-500);

  const achievements = Object.fromEntries(
    Object.entries(obj(p.achievements)).filter(([id, v]) => ACHIEVEMENT_SET.has(id) && typeof v === 'number' && Number.isFinite(v)),
  ) as Partial<Record<AchievementId, number>>;

  return { settings, lessonsCompleted, lastVisited, attempts, achievements };
}

/**
 * zustand's persist middleware calls `merge(persisted, current)` on EVERY load, even a
 * first-ever visit where `persisted` is `undefined` (nothing in IndexedDB yet). `settings`
 * is the one field whose initial value in `current` is NOT a generic empty placeholder —
 * it's read from localStorage/matchMedia at store creation specifically so first paint is
 * correct (see store.ts's readInitialLocale/readInitialTheme). Naively spreading
 * `sanitisePersisted(undefined)` over `current` would clobber that correct value with
 * sanitize's static fallback ('he'/'dark') moments after mount — a real flash-to-default
 * bug for, say, a light-mode OS user on their first visit. This only adopts the sanitised
 * `settings` when the raw persisted blob actually had a `settings` key; every other field
 * (lessonsCompleted, attempts, …) has no such live-initialized value, so it always adopts
 * the sanitised one.
 */
export function mergePersisted<T extends PersistedProgress>(persisted: unknown, current: T): T {
  const sanitized = sanitisePersisted(persisted);
  const hasPersistedSettings = !!persisted && typeof persisted === 'object' && 'settings' in persisted;
  return { ...current, ...sanitized, settings: hasPersistedSettings ? sanitized.settings! : current.settings };
}
