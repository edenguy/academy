import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { clsx } from 'clsx';
import { Icon } from './ui/Icon';
import { Button } from './ui/Button';

// Guy creates the key at web3forms.com (edenguy+academy-chemistry@gmail.com). Until that
// string replaces the placeholder, submissions do not go anywhere.
const WEB3FORMS_ACCESS_KEY = 'REPLACE_WITH_WEB3FORMS_KEY_FOR_academy-chemistry';

type FeedbackType = 'Question' | 'Idea' | 'Feature request' | 'Bug report';

const TYPES: { value: FeedbackType; labelKey: string }[] = [
  { value: 'Question', labelKey: 'feedback.typeQuestion' },
  { value: 'Idea', labelKey: 'feedback.typeIdea' },
  { value: 'Feature request', labelKey: 'feedback.typeFeature' },
  { value: 'Bug report', labelKey: 'feedback.typeBug' },
];

export function FeedbackWidget() {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<FeedbackType>('Question');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'sending' | 'ok' | 'err'>('idle');
  const [hidden, setHidden] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Collision fix (§5.8): hide the FAB whenever a control it would otherwise cover — the quiz
  // action row, the lesson nav — is substantially on screen. No layout shift, no scroll
  // listener: one IntersectionObserver watching every [data-fab-avoid] element.
  useEffect(() => {
    const targets = Array.from(document.querySelectorAll<HTMLElement>('[data-fab-avoid]'));
    if (targets.length === 0) {
      setHidden(false);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        const states = new Map(Array.from(observer.takeRecords().concat(entries)).map((e) => [e.target, e.isIntersecting]));
        entries.forEach((e) => states.set(e.target, e.isIntersecting));
        setHidden(targets.some((el) => states.get(el)));
      },
      { threshold: 0.3 },
    );
    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  function reset() {
    setType('Question');
    setMessage('');
    setEmail('');
    setFile(null);
    setStatus('idle');
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus('sending');
    const data = new FormData();
    data.append('access_key', WEB3FORMS_ACCESS_KEY);
    data.append('subject', `${t('app.name')} feedback: ${type}`);
    data.append('from_name', `${t('app.name')} feedback widget`);
    data.append('type', type);
    data.append('message', message);
    if (email) data.append('email', email);
    if (file) data.append('attachment', file);
    data.append('page', window.location.href);
    data.append('language', i18n.language);

    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body: data,
        headers: { Accept: 'application/json' },
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.message ?? 'failed');
      setStatus('ok');
      setTimeout(() => {
        setOpen(false);
        reset();
      }, 1800);
    } catch {
      setStatus('err');
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t('feedback.open')}
        className={clsx(
          'ledge fixed bottom-5 end-5 z-40 bg-accent text-accent-ink rounded-pill grid place-items-center transition-[transform,opacity] duration-[220ms]',
          'w-12 h-12 sm:w-auto sm:h-11 sm:px-4 sm:inline-flex sm:items-center sm:gap-2',
          hidden ? 'translate-y-[140%] opacity-0 pointer-events-none' : 'translate-y-0 opacity-100',
        )}
      >
        <Icon name="envelope" size={20} />
        <span className="hidden sm:inline text-sm font-semibold">{t('feedback.open')}</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm flex items-end sm:items-center justify-center"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="elev-2 no-stripe w-full sm:max-w-md max-h-[92dvh] overflow-y-auto rounded-t-[var(--r-xl)] sm:rounded-[var(--r-xl)] p-6 pb-safe">
            <div className="flex items-start justify-between mb-1">
              <h2 className="text-lg font-bold text-ink">{t('feedback.title')}</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="w-8 h-8 rounded-pill grid place-items-center text-muted hover:bg-surface-2 hover:text-ink"
              >
                <Icon name="x" size={18} />
              </button>
            </div>
            <p className="text-sm text-muted mb-4">{t('feedback.subtitle')}</p>

            <form onSubmit={onSubmit} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-2" role="group">
                {TYPES.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setType(opt.value)}
                    aria-pressed={type === opt.value}
                    className={clsx(
                      'rounded-pill px-3 h-9 text-sm font-semibold transition-colors',
                      type === opt.value ? 'bg-accent text-accent-ink ledge' : 'elev-0 text-ink-2 hover:text-ink',
                    )}
                  >
                    {t(opt.labelKey)}
                  </button>
                ))}
              </div>

              <div>
                <label htmlFor="fb-message" className="block text-xs font-semibold text-ink-2 mb-1.5">
                  {t('feedback.messageLabel')}
                </label>
                <textarea
                  id="fb-message"
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="elev-0 w-full px-3 py-2.5 text-sm text-ink outline-none focus:border-accent focus:ring-4 focus:ring-accent-soft resize-y transition-shadow"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-2 mb-1.5">{t('feedback.fileLabel')}</label>
                <label
                  className={clsx(
                    'elev-0 flex items-center gap-2 px-3 py-2.5 text-sm cursor-pointer',
                    file ? 'text-accent border-accent' : 'text-muted',
                  )}
                >
                  <Icon name="paperclip" size={16} />
                  <span className="truncate">{file ? file.name : t('feedback.fileChoose')}</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  />
                </label>
              </div>

              <div>
                <label htmlFor="fb-email" className="block text-xs font-semibold text-ink-2 mb-1.5">
                  {t('feedback.emailLabel')}
                </label>
                <input
                  id="fb-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="elev-0 w-full px-3 py-2.5 text-sm text-ink outline-none focus:border-accent focus:ring-4 focus:ring-accent-soft transition-shadow"
                />
              </div>

              <Button type="submit" size="lg" className="w-full" disabled={status === 'sending'}>
                {status === 'sending' ? t('feedback.sending') : t('feedback.send')}
              </Button>

              {status === 'ok' && <p className="text-center text-sm text-good font-medium">{t('feedback.success')}</p>}
              {status === 'err' && <p className="text-center text-sm text-critical font-medium">{t('feedback.error')}</p>}
            </form>
          </div>
        </div>
      )}
    </>
  );
}
