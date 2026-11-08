import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { clsx } from 'clsx';
import { pick, type Locale } from '@/content/localize';
import type { Question } from '@/content/schema';
import { Button } from './ui/Button';
import { Icon } from './ui/Icon';
import { Rich } from './ui/Rich';

export function Quiz({ questions, locale, onAllDone }: { questions: Question[]; locale: Locale; onAllDone?: () => void }) {
  const { t } = useTranslation();
  const [index, setIndex] = useState(0);
  const [checked, setChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [mcqChoice, setMcqChoice] = useState<number | null>(null);
  const [numericInput, setNumericInput] = useState('');

  const total = questions.length;
  const finished = index >= total;

  function reset() {
    setChecked(false);
    setIsCorrect(false);
    setMcqChoice(null);
    setNumericInput('');
  }

  function check(q: Question) {
    const correct =
      q.type === 'mcq' ? mcqChoice === q.correctIndex : Math.abs(Number.parseFloat(numericInput.replace(',', '.')) - q.correctValue) <= q.tolerance;
    setIsCorrect(correct);
    setChecked(true);
  }

  function next() {
    const nextIndex = index + 1;
    reset();
    setIndex(nextIndex);
    if (nextIndex >= total) onAllDone?.();
  }

  if (finished) {
    return (
      <div className="card-flat p-6 text-center space-y-4">
        <Icon name="trophy" size={40} className="text-highlight mx-auto" />
        <p className="text-ink font-semibold text-lg">{t('quiz.finished')}</p>
        <Button
          variant="secondary"
          onClick={() => {
            reset();
            setIndex(0);
          }}
        >
          <Icon name="refresh" size={16} /> {t('quiz.retake')}
        </Button>
      </div>
    );
  }

  const q = questions[index]!;
  const canCheck = q.type === 'mcq' ? mcqChoice !== null : numericInput.trim() !== '';

  return (
    <div className="card-flat p-5 md:p-6 space-y-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-muted">
        {t('quiz.progress', { current: index + 1, total })}
      </div>
      <Rich text={pick(q.prompt, locale)} className="text-ink font-medium text-[17px] lesson-prose" />

      {q.type === 'mcq' ? (
        <div className="space-y-2">
          {q.choices.map((choice, i) => {
            const picked = mcqChoice === i;
            const showState = checked && picked;
            return (
              <button
                key={i}
                type="button"
                disabled={checked && isCorrect}
                onClick={() => {
                  setMcqChoice(i);
                  setChecked(false);
                }}
                className={clsx(
                  'w-full text-start rounded-2xl border px-4 py-3 text-[15px] transition-colors',
                  showState && isCorrect && 'border-good bg-good-soft text-ink',
                  showState && !isCorrect && 'border-critical bg-critical-soft text-ink',
                  !showState && picked && 'border-accent bg-accent-soft text-ink',
                  !picked && 'border-line bg-surface hover:border-accent/50 text-ink-2',
                )}
              >
                <Rich text={pick(choice, locale)} />
              </button>
            );
          })}
        </div>
      ) : (
        <input
          type="text"
          inputMode="decimal"
          value={numericInput}
          onChange={(e) => {
            setNumericInput(e.target.value);
            setChecked(false);
          }}
          placeholder={t('quiz.numericPlaceholder')}
          className="num w-full rounded-2xl border border-line bg-surface px-4 py-3 text-lg font-semibold text-ink outline-none focus:border-accent"
        />
      )}

      {checked && (
        <div className={clsx('rounded-2xl p-4 flex gap-3 anim-pop', isCorrect ? 'bg-good-soft' : 'bg-critical-soft')}>
          <Icon name={isCorrect ? 'check' : 'alert'} size={20} className={clsx('shrink-0 mt-0.5', isCorrect ? 'text-good' : 'text-critical')} />
          <div className="min-w-0">
            <div className={clsx('font-semibold', isCorrect ? 'text-good' : 'text-critical')}>
              {isCorrect ? t('quiz.correct') : t('quiz.incorrect')}
            </div>
            <Rich text={pick(q.explanation, locale)} className="text-ink-2 text-sm mt-1" />
          </div>
        </div>
      )}

      <div className="flex justify-end gap-3">
        {!checked && (
          <Button onClick={() => check(q)} disabled={!canCheck}>
            {t('quiz.check')}
          </Button>
        )}
        {checked && !isCorrect && (
          <Button variant="secondary" onClick={() => setChecked(false)}>
            {t('quiz.tryAgain')}
          </Button>
        )}
        {checked && isCorrect && (
          <Button onClick={next}>
            {t('quiz.next')} <Icon name="arrow" size={16} className="rtl:-scale-x-100" />
          </Button>
        )}
      </div>
    </div>
  );
}
