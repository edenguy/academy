import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { clsx } from 'clsx';
import { pick, type Locale } from '@/content/localize';
import type { Question } from '@/content/schema';
import { Button } from './ui/Button';
import { Icon } from './ui/Icon';
import { Rich } from './ui/Rich';
import { Card } from './ui/Card';
import { LessonSignature, type SignatureDraw } from './LessonSignature';

const HE_LETTERS = ['א', 'ב', 'ג', 'ד', 'ה', 'ו'];
const EN_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

export function Quiz({
  questions,
  locale,
  onAllDone,
  onAnswer,
  signature,
}: {
  questions: Question[];
  locale: Locale;
  onAllDone?: () => void;
  /** Called once per check, with the question's id and whether that check was correct — the
   * lesson page wires this into the progress store's `recordAttempt` (an answer that's
   * retried after "try again" is a second attempt, same as a learner really re-answering). */
  onAnswer?: (questionId: string, correct: boolean) => void;
  /** The lesson's own LessonSignature drawing, shown drawing itself in on the finished state
   * instead of a trophy (§5.7 #7) — computed by the calling page's per-subject mapping. */
  signature?: SignatureDraw;
}) {
  const { t } = useTranslation();
  const [index, setIndex] = useState(0);
  const [checked, setChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [mcqChoice, setMcqChoice] = useState<number | null>(null);
  const [numericInput, setNumericInput] = useState('');
  const [wiggleKey, setWiggleKey] = useState(0);

  const total = questions.length;
  const finished = index >= total;
  const letters = locale === 'he' ? HE_LETTERS : EN_LETTERS;

  function reset() {
    setChecked(false);
    setIsCorrect(false);
    setMcqChoice(null);
    setNumericInput('');
  }

  function check(q: Question) {
    const correct =
      q.type === 'mcq'
        ? mcqChoice === q.correctIndex
        : Math.abs(Number.parseFloat(numericInput.replace(',', '.')) - q.correctValue) <= q.tolerance;
    setIsCorrect(correct);
    setChecked(true);
    if (!correct) setWiggleKey((k) => k + 1);
    onAnswer?.(q.id, correct);
  }

  function next() {
    const nextIndex = index + 1;
    reset();
    setIndex(nextIndex);
    if (nextIndex >= total) onAllDone?.();
  }

  if (finished) {
    return (
      <Card variant="card" className="text-center space-y-4">
        <div className="relative mx-auto w-14 h-14 rounded-pill bg-good-soft grid place-items-center">
          <Icon name="check" size={28} className="text-good anim-pop" />
        </div>
        <p className="text-ink font-semibold text-[17px]">{t('quiz.finished')}</p>
        {signature && (
          <div className="h-10">
            <LessonSignature draw={signature} drawIn />
          </div>
        )}
        <Button
          variant="secondary"
          onClick={() => {
            reset();
            setIndex(0);
          }}
        >
          <Icon name="refresh" size={16} /> {t('quiz.retake')}
        </Button>
      </Card>
    );
  }

  const q = questions[index]!;
  const canCheck = q.type === 'mcq' ? mcqChoice !== null : numericInput.trim() !== '';

  return (
    <Card variant="card" className="space-y-4">
      <div className="flex items-center gap-3" aria-live="polite">
        <div className="flex-1 flex gap-1.5" aria-hidden="true">
          {Array.from({ length: total }).map((_, i) => (
            <span
              key={i}
              className={clsx(
                'h-1.5 flex-1 rounded-pill transition-colors duration-[220ms]',
                i < index ? 'bg-good-fill' : i === index ? 'bg-accent' : 'bg-surface-3',
              )}
            />
          ))}
        </div>
        <span className="text-[12.5px] text-muted shrink-0">{t('quiz.progress', { current: index + 1, total })}</span>
      </div>

      <Rich text={pick(q.prompt, locale)} className="text-ink font-medium text-[17px] lesson-prose" />

      {q.type === 'mcq' ? (
        <div className="space-y-2">
          {q.choices.map((choice, i) => {
            const picked = mcqChoice === i;
            const showState = checked && picked;
            const letter = letters[i] ?? String(i + 1);
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
                  'elev-0 w-full text-start rounded-[var(--r-md)] px-4 py-3 flex gap-3 items-start text-[15px] transition-[border-color,background-color,transform] duration-[160ms]',
                  showState && isCorrect && 'border-2 border-good-fill bg-good-soft',
                  showState && !isCorrect && 'border-2 border-critical-fill bg-critical-soft',
                  !showState && picked && 'border-2 border-accent bg-accent-soft',
                  !picked && 'border border-line bg-surface-2 hover:border-line-strong hover:-translate-y-px',
                )}
              >
                <span
                  key={wiggleKey}
                  className={clsx(
                    'num shrink-0 w-[26px] h-[26px] rounded-pill grid place-items-center font-mono text-[13px] font-semibold',
                    showState && isCorrect && 'bg-good-fill text-white',
                    showState && !isCorrect && 'bg-critical-fill text-white anim-wiggle',
                    !showState && picked && 'bg-accent text-accent-ink',
                    !picked && 'bg-surface-3 text-ink-2',
                  )}
                >
                  {showState && isCorrect ? <Icon name="check" size={14} /> : showState && !isCorrect ? <Icon name="x" size={14} /> : letter}
                </span>
                <Rich text={pick(choice, locale)} className="text-ink-2" />
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
          className="elev-0 num w-full h-12 px-4 text-lg font-semibold text-ink outline-none focus:border-accent focus:ring-4 focus:ring-accent-soft transition-shadow"
        />
      )}

      {checked && (
        <div className={clsx('rounded-[var(--r-md)] p-4 flex gap-3 anim-pop', isCorrect ? 'bg-good-soft' : 'bg-critical-soft')}>
          <Icon name={isCorrect ? 'check' : 'alert'} size={20} className={clsx('shrink-0 mt-0.5', isCorrect ? 'text-good-fill' : 'text-critical-fill')} />
          <div className="min-w-0">
            <div className={clsx('font-semibold', isCorrect ? 'text-good' : 'text-critical')}>
              {isCorrect ? t('quiz.correct') : t('quiz.incorrect')}
            </div>
            <Rich text={pick(q.explanation, locale)} className="text-ink-2 text-sm mt-1" />
          </div>
        </div>
      )}

      <div className="flex justify-end gap-3" data-fab-avoid>
        {!checked && (
          <Button onClick={() => check(q)} disabled={!canCheck} className="w-full sm:w-auto">
            {t('quiz.check')}
          </Button>
        )}
        {checked && !isCorrect && (
          <Button variant="secondary" onClick={() => setChecked(false)} className="w-full sm:w-auto">
            {t('quiz.tryAgain')}
          </Button>
        )}
        {checked && isCorrect && (
          <Button variant="good" onClick={next} className="w-full sm:w-auto">
            {t('quiz.next')} <Icon name="arrow" size={16} className="rtl:-scale-x-100" />
          </Button>
        )}
      </div>
    </Card>
  );
}
