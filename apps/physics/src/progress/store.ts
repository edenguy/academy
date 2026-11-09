import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';
import { del, get, set } from 'idb-keyval';
import type { Locale } from '@/content/localize';

/**
 * IndexedDB-backed storage for zustand's persist middleware — same approach as
 * `apps/nitrox/src/progress/store.ts`. Where IndexedDB does not exist (tests, some embedded
 * webviews) an in-memory map stands in so the app still runs; the hydration error path marks
 * storage as unavailable for the UI.
 */
const memory = new Map<string, string>();
const hasIdb = typeof indexedDB !== 'undefined';
const idbStorage: StateStorage = {
  getItem: async (name) => (hasIdb ? ((await get<string>(name)) ?? null) : (memory.get(name) ?? null)),
  setItem: async (name, value) => {
    if (hasIdb) await set(name, value);
    else memory.set(name, value);
  },
  removeItem: async (name) => {
    if (hasIdb) await del(name);
    else memory.delete(name);
  },
};

export type Theme = 'light' | 'dark';

/** A single quiz question check — correct or not, whenever the learner pressed "check". */
export interface Attempt {
  lessonId: string;
  questionId: string;
  correct: boolean;
  at: number;
}

/**
 * Physics Academy's own, small achievement set — not Nitrox's ids or conditions.
 * - `first-lesson`: finished a lesson's practice questions for the first time.
 * - `kinematics-complete`: finished all lessons in the (currently only) kinematics topic.
 * - `ten-correct`: answered 10 quiz questions correctly across any lessons.
 */
export type AchievementId = 'first-lesson' | 'kinematics-complete' | 'ten-correct';

export interface ProgressState {
  hydrated: boolean;
  /** True when IndexedDB could not be read; the app runs but nothing will be saved. */
  storageError: boolean;
  settings: {
    locale: Locale;
    theme: Theme;
  };
  lessonsCompleted: Record<string, number>;
  lastVisited: string | null;
  attempts: Attempt[];
  achievements: Partial<Record<AchievementId, number>>;

  setLocale: (locale: Locale) => void;
  setTheme: (theme: Theme) => void;
  visitLesson: (lessonId: string) => void;
  completeLesson: (lessonId: string) => void;
  recordAttempt: (attempt: Attempt) => void;
  unlock: (id: AchievementId) => void;
  resetProgress: () => void;
}

/** What `resetProgress` clears back to — always empty, never re-pulls the legacy array back
 * in (a learner who reset in-app meant it, even if the old key is still sitting in
 * localStorage). */
const emptyProgress = {
  lessonsCompleted: {} as Record<string, number>,
  lastVisited: null as string | null,
  attempts: [] as Attempt[],
  achievements: {} as Partial<Record<AchievementId, number>>,
};

/** The old, pre-store keys this app used for lang/theme and lesson completion — read once so
 * a returning learner's choices and progress survive the move into the persisted store. */
const LEGACY_LOCALE_KEY = 'academy-physics:locale';
const LEGACY_THEME_KEY = 'academy-physics:theme';
const LEGACY_COMPLETED_KEY = 'academy-physics:completed';

function readInitialLocale(): Locale {
  try {
    const l = localStorage.getItem(LEGACY_LOCALE_KEY);
    if (l === 'he' || l === 'en') return l;
  } catch {
    /* ignore */
  }
  // Hebrew is the default language of the product; English is an opt-in switch.
  return 'he';
}

function readInitialTheme(): Theme {
  try {
    const t = localStorage.getItem(LEGACY_THEME_KEY);
    if (t === 'dark' || t === 'light') return t;
  } catch {
    /* ignore */
  }
  // `typeof window` (not a direct reference) so this never throws where there is no DOM —
  // e.g. this module loaded under vitest's node test environment.
  if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: light)').matches) return 'light';
  return 'dark';
}

/** One-time migration of the old flat `completed lesson ids` array into `lessonsCompleted`,
 * run only when the new store has nothing yet — never overwrites real progress. */
function readLegacyCompleted(): Record<string, number> {
  try {
    const raw = localStorage.getItem(LEGACY_COMPLETED_KEY);
    if (!raw) return {};
    const ids = JSON.parse(raw) as unknown;
    if (!Array.isArray(ids)) return {};
    const now = Date.now();
    return Object.fromEntries(ids.filter((id): id is string => typeof id === 'string').map((id) => [id, now]));
  } catch {
    return {};
  }
}

export const useProgress = create<ProgressState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      storageError: false,
      settings: { locale: readInitialLocale(), theme: readInitialTheme() },
      ...emptyProgress,
      // Only matters on a genuinely first-ever load (nothing in IndexedDB yet): seeds the
      // store from the old flat `completed lesson ids` array so a returning learner's
      // progress survives the move into this store. Once IndexedDB has its own record,
      // rehydration overrides this with the real persisted value via `merge` below.
      lessonsCompleted: readLegacyCompleted(),

      setLocale: (locale) => set((s) => ({ settings: { ...s.settings, locale } })),
      setTheme: (theme) => set((s) => ({ settings: { ...s.settings, theme } })),

      visitLesson: (lessonId) => set({ lastVisited: lessonId }),

      completeLesson: (lessonId) =>
        set((s) => {
          if (s.lessonsCompleted[lessonId]) return {};
          const achievements = { ...s.achievements };
          if (!achievements['first-lesson']) achievements['first-lesson'] = Date.now();
          return {
            lessonsCompleted: { ...s.lessonsCompleted, [lessonId]: Date.now() },
            lastVisited: lessonId,
            achievements,
          };
        }),

      recordAttempt: (attempt) =>
        set((s) => {
          const attempts = [...s.attempts, attempt].slice(-2000);
          const achievements = { ...s.achievements };
          const correctCount = attempts.filter((a) => a.correct).length;
          if (correctCount >= 10 && !achievements['ten-correct']) achievements['ten-correct'] = Date.now();
          return { attempts, achievements };
        }),

      unlock: (id) => {
        if (get().achievements[id]) return;
        set((s) => ({ achievements: { ...s.achievements, [id]: Date.now() } }));
      },

      resetProgress: () => set({ ...emptyProgress }),
    }),
    {
      name: 'academy-physics:v1',
      version: 1,
      storage: createJSONStorage(() => idbStorage),
      /** Sanitise whatever came out of storage: a bad record would throw inside a selector. */
      migrate: (persisted) => sanitisePersisted(persisted),
      merge: (persisted, current) => ({ ...current, ...sanitisePersisted(persisted) }),
      onRehydrateStorage: () => (_state, error) => {
        // On a storage error zustand never fires onFinishHydration, so finish here.
        if (error) useProgress.setState({ hydrated: true, storageError: true });
      },
      partialize: (s) => ({
        settings: s.settings,
        lessonsCompleted: s.lessonsCompleted,
        lastVisited: s.lastVisited,
        attempts: s.attempts,
        achievements: s.achievements,
      }),
    },
  ),
);

/** Defensive cleanup of persisted data from any version; unknown or out-of-range values fall
 * back to a safe default so a corrupted record never crashes the app. */
export function sanitisePersisted(input: unknown): Partial<ProgressState> {
  const p = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>;
  const obj = (v: unknown) => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {});
  const s = obj(p.settings);
  const settings: ProgressState['settings'] = {
    locale: s.locale === 'en' || s.locale === 'he' ? s.locale : readInitialLocale(),
    theme: s.theme === 'light' || s.theme === 'dark' ? s.theme : readInitialTheme(),
  };
  const attempts = (Array.isArray(p.attempts) ? p.attempts : [])
    .filter(
      (a): a is Attempt =>
        !!a &&
        typeof a === 'object' &&
        typeof (a as Attempt).lessonId === 'string' &&
        typeof (a as Attempt).questionId === 'string' &&
        typeof (a as Attempt).correct === 'boolean' &&
        Number.isFinite((a as Attempt).at),
    )
    .slice(-2000);
  const lessonsCompleted = Object.fromEntries(Object.entries(obj(p.lessonsCompleted)).filter(([, v]) => Number.isFinite(v))) as Record<string, number>;
  const achievements = Object.fromEntries(Object.entries(obj(p.achievements)).filter(([, v]) => Number.isFinite(v))) as Partial<Record<AchievementId, number>>;
  const lastVisited = typeof p.lastVisited === 'string' ? p.lastVisited : null;
  return { settings, lessonsCompleted, lastVisited, attempts, achievements };
}

useProgress.persist.onFinishHydration(() => useProgress.setState({ hydrated: true }));
if (useProgress.persist.hasHydrated()) useProgress.setState({ hydrated: true });
