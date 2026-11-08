import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { applyLocaleToDocument, readStoredLocale } from '@/i18n';
import type { Locale } from '@/content/localize';

type Theme = 'light' | 'dark';

function readStoredTheme(): Theme {
  try {
    const t = localStorage.getItem('academy-math:theme');
    if (t === 'light' || t === 'dark') return t;
  } catch {
    /* ignore */
  }
  return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

interface Ctx {
  locale: Locale;
  setLocale: (l: Locale) => void;
  theme: Theme;
  toggleTheme: () => void;
}

const AppContext = createContext<Ctx | null>(null);

export function AppProviders({ children }: { children: ReactNode }) {
  const { i18n } = useTranslation();
  const [locale, setLocaleState] = useState<Locale>(() => readStoredLocale());
  const [theme, setTheme] = useState<Theme>(() => readStoredTheme());

  useEffect(() => {
    applyLocaleToDocument(locale);
    if (i18n.language !== locale) void i18n.changeLanguage(locale);
  }, [locale, i18n]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem('academy-math:theme', theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  const setLocale = useCallback((l: Locale) => setLocaleState(l), []);
  const toggleTheme = useCallback(() => setTheme((t) => (t === 'light' ? 'dark' : 'light')), []);

  const value = useMemo(() => ({ locale, setLocale, theme, toggleTheme }), [locale, setLocale, theme, toggleTheme]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

function useApp(): Ctx {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside <AppProviders>');
  return ctx;
}

export function useLocale(): { locale: Locale; setLocale: (l: Locale) => void; dir: 'ltr' | 'rtl'; isRtl: boolean } {
  const { locale, setLocale } = useApp();
  const dir = locale === 'he' ? 'rtl' : 'ltr';
  return { locale, setLocale, dir, isRtl: dir === 'rtl' };
}

export function useThemeToggle(): { theme: Theme; toggleTheme: () => void } {
  const { theme, toggleTheme } = useApp();
  return { theme, toggleTheme };
}

/** Which lesson ids the learner has finished all practice questions for (see <Quiz>). */
export function useCompletedLessons(): [string[], (id: string) => void] {
  const [done, setDone] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem('academy-math:completed');
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  });
  const markDone = useCallback((id: string) => {
    setDone((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      try {
        localStorage.setItem('academy-math:completed', JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);
  return [done, markDone];
}
