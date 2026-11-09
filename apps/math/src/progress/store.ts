import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';
import { del, get, set } from 'idb-keyval';
import { LESSONS } from '@/content';
import { readStoredLocale } from '@/i18n';
import type { Locale } from '@/content/localize';
import { evaluateAchievements, type AchievementId } from './achievements';
import { mergePersisted, sanitisePersisted, type ProgressSettings, type QuizAttempt, type ThemePreference } from './sanitize';

export type { AchievementId } from './achievements';
export type { QuizAttempt, ThemePreference } from './sanitize';

/**
 * IndexedDB-backed storage for zustand's persist middleware — identical approach to
 * apps/nitrox/src/progress/store.ts. Where IndexedDB does not exist (tests, some embedded
 * webviews) an in-memory map stands in so the app still runs; nothing is actually persisted.
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

export interface ProgressState {
  hydrated: boolean;
  /** True when IndexedDB could not be read; the app runs but nothing will be saved. */
  storageError: boolean;
  settings: ProgressSettings;
  lessonsCompleted: Record<string, number>;
  lastVisited: string | null;
  attempts: QuizAttempt[];
  achievements: Partial<Record<AchievementId, number>>;

  setLocale: (locale: Locale) => void;
  setTheme: (theme: ThemePreference) => void;
  visitLesson: (lessonId: string) => void;
  completeLesson: (lessonId: string) => void;
  recordAttempt: (attempt: QuizAttempt) => void;
  resetProgress: () => void;
}

const initialProgress = {
  lessonsCompleted: {} as Record<string, number>,
  lastVisited: null as string | null,
  attempts: [] as QuizAttempt[],
  achievements: {} as Partial<Record<AchievementId, number>>,
};

/** Hebrew is the default language of the product; English is an opt-in switch (same as i18n's own default). */
function readInitialLocale(): Locale {
  return readStoredLocale();
}

/** Mirrors the fallback the pre-paint script and the old providers.tsx both used before this store existed. */
function readInitialTheme(): ThemePreference {
  try {
    const t = localStorage.getItem('academy-math:theme');
    if (t === 'light' || t === 'dark') return t;
  } catch {
    /* ignore */
  }
  try {
    return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
}

/** Re-derives the achievement map after a mutation: merges in any newly-earned id, keeping
 * every id's original unlock timestamp untouched once set. */
function withAchievements(s: Pick<ProgressState, 'lessonsCompleted' | 'attempts' | 'achievements'>): Partial<Record<AchievementId, number>> {
  const earned = evaluateAchievements({ lessonsCompleted: s.lessonsCompleted, attempts: s.attempts }, LESSONS);
  const achievements = { ...s.achievements };
  for (const id of earned) if (!achievements[id]) achievements[id] = Date.now();
  return achievements;
}

export const useProgress = create<ProgressState>()(
  persist(
    (set) => ({
      hydrated: false,
      storageError: false,
      settings: { locale: readInitialLocale(), theme: readInitialTheme() },
      ...initialProgress,

      setLocale: (locale) => set((s) => ({ settings: { ...s.settings, locale } })),
      setTheme: (theme) => set((s) => ({ settings: { ...s.settings, theme } })),

      visitLesson: (lessonId) => set({ lastVisited: lessonId }),

      completeLesson: (lessonId) =>
        set((s) => {
          if (s.lessonsCompleted[lessonId]) return {};
          const lessonsCompleted = { ...s.lessonsCompleted, [lessonId]: Date.now() };
          return {
            lessonsCompleted,
            lastVisited: lessonId,
            achievements: withAchievements({ lessonsCompleted, attempts: s.attempts, achievements: s.achievements }),
          };
        }),

      recordAttempt: (attempt) =>
        set((s) => {
          const attempts = [...s.attempts, attempt].slice(-500);
          return {
            attempts,
            achievements: withAchievements({ lessonsCompleted: s.lessonsCompleted, attempts, achievements: s.achievements }),
          };
        }),

      resetProgress: () => set(() => ({ ...initialProgress })),
    }),
    {
      name: 'academy-math:v1',
      version: 1,
      storage: createJSONStorage(() => idbStorage),
      /** Sanitise whatever came out of storage: a bad shape would throw inside a selector. */
      migrate: (persisted) => sanitisePersisted(persisted),
      /** See `mergePersisted`'s own comment — guards against clobbering a correctly
       * pre-paint-initialized settings value on a first-ever visit. */
      merge: (persisted, current) => mergePersisted(persisted, current),
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

useProgress.persist.onFinishHydration(() => useProgress.setState({ hydrated: true }));
if (useProgress.persist.hasHydrated()) useProgress.setState({ hydrated: true });
