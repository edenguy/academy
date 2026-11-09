import { useEffect, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { applyLocaleToDocument, localeDir } from '@/i18n';
import type { Locale } from '@/content/localize';
import { useProgress, type Theme } from '@/progress/store';
import { HydrationGate } from './HydrationGate';
import { AchievementToast } from './AchievementToast';

/** The same key the pre-paint `<script>` in `index.html` reads before first paint, kept as
 * a synchronous mirror of the store's theme setting so there is still no flash of the wrong
 * theme while the async IndexedDB-backed store is loading. (The locale's own mirror —
 * `academy-physics:locale` — is already written by `applyLocaleToDocument` below.) */
const THEME_MIRROR_KEY = 'academy-physics:theme';

/** Keeps i18next and <html lang/dir> in sync with the stored locale. */
function useLocaleSync(): void {
  const locale = useProgress((s) => s.settings.locale);
  const { i18n } = useTranslation();
  useEffect(() => {
    if (i18n.language !== locale) void i18n.changeLanguage(locale);
    applyLocaleToDocument(locale);
  }, [locale, i18n]);
}

/** Keeps <html data-theme> in sync with the stored theme, and mirrors it to localStorage. */
function useThemeSync(): void {
  const theme = useProgress((s) => s.settings.theme);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem(THEME_MIRROR_KEY, theme);
    } catch {
      /* ignore */
    }
  }, [theme]);
}

export function AppProviders({ children }: { children: ReactNode }) {
  useLocaleSync();
  useThemeSync();
  return (
    <HydrationGate>
      {children}
      <AchievementToast />
    </HydrationGate>
  );
}

export function useLocale(): { locale: Locale; setLocale: (l: Locale) => void; dir: 'ltr' | 'rtl'; isRtl: boolean } {
  const locale = useProgress((s) => s.settings.locale);
  const setLocale = useProgress((s) => s.setLocale);
  const dir = localeDir(locale);
  return { locale, setLocale, dir, isRtl: dir === 'rtl' };
}

export function useThemeToggle(): { theme: Theme; toggleTheme: () => void } {
  const theme = useProgress((s) => s.settings.theme);
  const setTheme = useProgress((s) => s.setTheme);
  return { theme, toggleTheme: () => setTheme(theme === 'light' ? 'dark' : 'light') };
}
