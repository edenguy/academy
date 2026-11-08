import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';
import { clsx } from 'clsx';
import { Icon } from '@/components/ui/Icon';
import { Logo } from '@/components/Logo';
import { FeedbackWidget } from '@/components/FeedbackWidget';
import { useAmbient } from '@/audio/useAmbient';
import { useLocale, useThemeToggle } from './providers';

function QuickToggles() {
  const { t } = useTranslation();
  const { locale, setLocale } = useLocale();
  const { theme, toggleTheme } = useThemeToggle();
  const { enabled: musicOn, toggle: toggleMusic } = useAmbient();
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={toggleMusic}
        className={clsx(
          'inline-flex items-center rounded-full p-2 hover:bg-surface-2',
          musicOn ? 'text-accent' : 'text-ink-2 hover:text-ink',
        )}
        aria-label={t('settings.music')}
        aria-pressed={musicOn}
        title={t('settings.music')}
      >
        <Icon name={musicOn ? 'speaker' : 'speakerMute'} size={18} />
      </button>
      <button
        type="button"
        onClick={() => setLocale(locale === 'he' ? 'en' : 'he')}
        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold text-ink-2 hover:bg-surface-2 hover:text-ink"
        aria-label={t('settings.language')}
      >
        <Icon name="globe" size={18} /> {locale === 'he' ? 'EN' : 'עב'}
      </button>
      <button
        type="button"
        onClick={toggleTheme}
        className="inline-flex items-center rounded-full p-2 text-ink-2 hover:bg-surface-2 hover:text-ink"
        aria-label={t('settings.theme')}
        title={t('settings.theme')}
      >
        <Icon name={theme === 'light' ? 'moon' : 'sun'} size={18} />
      </button>
    </div>
  );
}

export function Shell() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname]);

  return (
    <div className="min-h-dvh flex flex-col">
      <div className="sky-bg" aria-hidden />
      <a
        href="#content"
        onClick={(e) => {
          e.preventDefault();
          const el = document.getElementById('content');
          if (el) {
            el.setAttribute('tabindex', '-1');
            el.focus({ preventScroll: false });
          }
        }}
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:start-2 focus:z-50 bg-accent text-accent-ink px-3 py-2 rounded-lg"
      >
        {t('app.skipToContent')}
      </a>
      <header className="sticky top-0 z-30 bg-bg/80 backdrop-blur-xl border-b border-line">
        <div className="flex items-center justify-between px-4 md:px-8 h-16 max-w-5xl w-full mx-auto">
          <NavLink to="/" className="flex items-center gap-2.5">
            <Logo size={34} />
            <div>
              <div className="font-display font-bold text-ink leading-tight">{t('app.name')}</div>
              <div className="text-[11px] text-muted leading-tight">{t('app.unofficial')}</div>
            </div>
          </NavLink>
          <QuickToggles />
        </div>
      </header>
      <main id="content" className="flex-1 min-w-0 px-4 md:px-8 py-6 md:py-10 max-w-5xl w-full mx-auto">
        <Outlet />
      </main>
      <FeedbackWidget />
    </div>
  );
}
