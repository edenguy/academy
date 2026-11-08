import { useRef, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { clsx } from 'clsx';
import { Icon } from './ui/Icon';
import { Button } from './ui/Button';

// Get a free key at web3forms.com (enter edenguy+academy-physics@gmail.com, they email the
// key back instantly — no account needed) and paste it here. The key is a public identifier,
// safe to ship client-side; it only lets someone submit *to* this inbox, not read it.
const WEB3FORMS_ACCESS_KEY = 'REPLACE_WITH_WEB3FORMS_KEY_FOR_academy-physics';

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
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    data.append('subject', `Physics Academy feedback: ${type}`);
    data.append('from_name', 'Physics Academy feedback widget');
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
        className="fixed bottom-5 end-5 z-40 w-14 h-14 rounded-full grid place-items-center bg-accent text-accent-ink shadow-[0_10px_28px_-8px_var(--glow)] hover:brightness-110 active:scale-95 transition"
      >
        <Icon name="message" size={24} />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm flex items-end sm:items-center justify-center"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="w-full sm:max-w-md max-h-[92dvh] overflow-y-auto bg-surface border border-line rounded-t-[24px] sm:rounded-[24px] p-6 pb-safe shadow-2xl">
            <div className="flex items-start justify-between mb-1">
              <h2 className="text-lg font-bold text-ink">{t('feedback.title')}</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="w-8 h-8 rounded-full grid place-items-center text-muted hover:bg-surface-2 hover:text-ink"
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
                    className={clsx(
                      'rounded-xl border px-3 py-2 text-sm font-semibold transition-colors',
                      type === opt.value ? 'border-accent text-accent bg-accent-soft' : 'border-line text-ink-2 hover:border-line-strong',
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
                  className="w-full rounded-xl border border-line-strong bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-accent resize-y"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-2 mb-1.5">{t('feedback.fileLabel')}</label>
                <label
                  className={clsx(
                    'flex items-center gap-2 rounded-xl border border-dashed px-3 py-2.5 text-sm cursor-pointer',
                    file ? 'border-accent text-accent border-solid' : 'border-line-strong text-muted hover:border-accent',
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
                  className="w-full rounded-xl border border-line-strong bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-accent"
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
