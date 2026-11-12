import { createContext, useCallback, useContext, useEffect, useMemo, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { applyLocaleToDocument } from '@/i18n';
import type { Locale } from '@/content/localize';
import { useProgress, type ThemePreference as Theme } from '@/progress/store';

interface Ctx {
  locale: Locale;
  setLocale: (l: Locale) => void;
  theme: Theme;
  toggleTheme: () => void;
}

const AppContext = createContext<Ctx | null>(null);

/**
 * Locale and theme now live in the progress store (persisted to IndexedDB) instead of their
 * own ad-hoc localStorage reads/writes — one coherent piece of persisted state, same as
 * apps/nitrox's `useLocaleSync`/`useThemeSync`. Each still mirrors its value back into
 * localStorage on change (`applyLocaleToDocument` for locale, directly below for theme) so
 * `index.html`'s synchronous pre-paint script — which cannot await IndexedDB — keeps
 * preventing a flash of the wrong language/direction/theme on load.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  const { i18n } = useTranslation();
  const locale = useProgress((s) => s.settings.locale);
  const theme = useProgress((s) => s.settings.theme);
  const setLocaleStore = useProgress((s) => s.setLocale);
  const setThemeStore = useProgress((s) => s.setTheme);

  useEffect(() => {
    applyLocaleToDocument(locale);
    if (i18n.language !== locale) void i18n.changeLanguage(locale);
  }, [locale, i18n]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem('academy-chemistry:theme', theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  const setLocale = useCallback((l: Locale) => setLocaleStore(l), [setLocaleStore]);
  const toggleTheme = useCallback(() => setThemeStore(theme === 'light' ? 'dark' : 'light'), [theme, setThemeStore]);

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
