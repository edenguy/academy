import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useEffect, useRef } from 'react';
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
    <div className="elev-0 flex items-center gap-0.5 rounded-pill p-1">
      <button
        type="button"
        onClick={toggleMusic}
        className={clsx(
          'inline-flex items-center justify-center w-9 h-9 rounded-pill transition-colors',
          musicOn ? 'bg-accent-soft text-accent' : 'text-ink-2 hover:text-ink',
        )}
        aria-label={t('settings.music')}
        aria-pressed={musicOn}
        title={t('settings.music')}
      >
        <Icon name={musicOn ? 'speaker' : 'speakerMute'} size={17} />
      </button>
      <button
        type="button"
        onClick={() => setLocale(locale === 'he' ? 'en' : 'he')}
        className="inline-flex items-center justify-center w-9 h-9 rounded-pill text-[13px] font-semibold text-ink-2 hover:text-ink transition-colors"
        aria-label={t('settings.language')}
      >
        {locale === 'he' ? 'EN' : 'עב'}
      </button>
      <button
        type="button"
        onClick={toggleTheme}
        className="inline-flex items-center justify-center w-9 h-9 rounded-pill text-ink-2 hover:text-ink transition-colors"
        aria-label={t('settings.theme')}
        title={t('settings.theme')}
      >
        <Icon name={theme === 'light' ? 'moon' : 'sun'} size={17} />
      </button>
    </div>
  );
}

export function Shell() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const headerRef = useRef<HTMLElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname]);

  // Transparent top bar over the page until scrolled — toggled via an IntersectionObserver on
  // a 1px sentinel instead of a scroll listener.
  useEffect(() => {
    const header = headerRef.current;
    const sentinel = sentinelRef.current;
    if (!header || !sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry) header.dataset.scrolled = entry.isIntersecting ? 'false' : 'true';
      },
      { threshold: 0 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-dvh flex flex-col">
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
      <div ref={sentinelRef} className="h-px" />
      <header
        ref={headerRef}
        data-scrolled="false"
        className="sticky top-0 z-30 border-b border-transparent transition-[background-color,border-color] duration-[220ms] data-[scrolled=true]:bg-bg/80 data-[scrolled=true]:backdrop-blur-xl data-[scrolled=true]:border-line"
      >
        <div className="flex items-center justify-between px-4 md:px-8 h-[60px] max-w-5xl w-full mx-auto">
          <NavLink to="/" className="flex items-center gap-2.5">
            <Logo size={40} />
            <div className="font-display font-bold text-[17px] text-ink leading-tight">{t('app.name')}</div>
          </NavLink>
          <QuickToggles />
        </div>
      </header>
      <main
        id="content"
        className="flex-1 min-w-0 px-4 md:px-8 pt-5 md:pt-8 max-w-5xl w-full mx-auto"
        style={{ paddingBottom: 'calc(var(--fab-clearance) + env(safe-area-inset-bottom))' }}
      >
        <Outlet />
      </main>
      <FeedbackWidget />
    </div>
  );
}
