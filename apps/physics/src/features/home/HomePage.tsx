import { useTranslation } from 'react-i18next';
import { motion, useReducedMotion } from 'motion/react';
import { LESSONS } from '@/content';
import { pick } from '@/content/localize';
import { useLocale } from '@/app/providers';
import { useProgress, type AchievementId } from '@/progress/store';
import { useCourseProgress, useNextLesson, useQuizAccuracy } from '@/progress/selectors';
import { Icon } from '@/components/ui/Icon';
import { Card } from '@/components/ui/Card';
import { LinkButton } from '@/components/ui/Button';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { HeroSignature } from '@/components/HeroSignature';
import { LessonSignature } from '@/components/LessonSignature';
import { HERO_CURVE } from '@/physics/heroCurve';
import { lessonSignature } from '@/physics/lessonSignature';
import { Link } from 'react-router-dom';
import type { Lesson } from '@/content/schema';

function LessonCard({ lesson, index, isDone }: { lesson: Lesson; index: number; isDone: boolean }) {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const reduceMotion = useReducedMotion();
  const draw = lessonSignature(lesson);

  return (
    <motion.div
      initial={reduceMotion ? undefined : { opacity: 0, y: 10 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.32, delay: index * 0.04, ease: [0.2, 0.8, 0.2, 1] }}
    >
      <Link
        to={`/lesson/${lesson.id}`}
        aria-label={isDone ? t('home.reviewAria', { title: pick(lesson.title, locale) }) : t('home.startAria', { title: pick(lesson.title, locale) })}
        className="elev-1 is-link group flex flex-col gap-3 p-4 md:p-5 min-h-[172px]"
      >
        <div className="flex items-center gap-2">
          <span className="num shrink-0 w-[30px] h-[30px] rounded-pill bg-accent-soft text-accent grid place-items-center font-mono text-[15px] font-semibold">
            {isDone ? <Icon name="check" size={15} /> : lesson.order}
          </span>
          <span className="text-[12.5px] text-muted">{t('home.questionsCount', { count: lesson.quiz.length })}</span>
          {isDone && <span className="ms-auto text-[12.5px] font-semibold text-good">{t('home.done')}</span>}
        </div>
        <div>
          <div className="font-display font-bold text-[19px] text-ink leading-snug [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] overflow-hidden">
            {pick(lesson.title, locale)}
          </div>
          <div className="text-sm text-ink-2 mt-1">{pick(lesson.subtitle, locale)}</div>
        </div>
        <div className="flex items-center gap-2 mt-auto">
          <div className="flex-1 min-w-0" style={{ direction: 'ltr' }}>
            <LessonSignature draw={draw} className="overflow-visible" />
          </div>
          <span
            className={
              'shrink-0 w-10 h-10 rounded-pill grid place-items-center transition-transform duration-[220ms] group-hover:translate-x-[3px] rtl:group-hover:-translate-x-[3px] ' +
              (isDone ? 'bg-good-soft text-good' : 'bg-accent text-accent-ink')
            }
          >
            <Icon name={isDone ? 'refresh' : 'arrow'} size={18} className={isDone ? undefined : 'rtl:-scale-x-100'} />
          </span>
        </div>
      </Link>
    </motion.div>
  );
}

/** Progress section: a real dashboard scaled to Physics's one topic, three lessons — course
 * progress, honest quiz accuracy (no invented mastery level), a "continue where you left
 * off" CTA, and achievement badges earned so far. First-time visitors with no progress yet
 * get a sensible zero state, not a broken-looking empty ring. */
function ProgressSection() {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const progress = useCourseProgress();
  const accuracy = useQuizAccuracy();
  const next = useNextLesson();
  const achievements = useProgress((s) => s.achievements);
  const started = progress.done > 0 || accuracy.total > 0;
  const unlocked = (Object.entries(achievements) as [AchievementId, number][]).sort((a, b) => b[1] - a[1]);

  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-[22px] md:text-[26px] font-bold text-ink">{t('home.progressTitle')}</h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card variant="card" className="flex items-center gap-4">
          <ProgressRing value={progress.fraction} size={68} stroke={7} className="shrink-0">
            <span className="readout text-[15px] font-bold text-ink">{Math.round(progress.fraction * 100)}%</span>
          </ProgressRing>
          <div className="min-w-0">
            <div className="font-semibold text-ink text-[15px]">{t('home.lessonsTitle')}</div>
            <div className="text-sm text-muted">{t('home.lessonsDone', { done: progress.done, total: progress.total })}</div>
          </div>
        </Card>

        <Card variant="card" className="flex items-center gap-4">
          <ProgressRing value={accuracy.fraction ?? 0} size={68} stroke={7} color="var(--accent-2)" className="shrink-0">
            <span className="readout text-[15px] font-bold text-ink">{accuracy.fraction === null ? '—' : `${Math.round(accuracy.fraction * 100)}%`}</span>
          </ProgressRing>
          <div className="min-w-0">
            <div className="font-semibold text-ink text-[15px]">{t('home.accuracyTitle')}</div>
            <div className="text-sm text-muted">
              {accuracy.fraction === null ? t('home.accuracyEmpty') : <span className="num">{t('home.accuracyCount', { correct: accuracy.correct, total: accuracy.total })}</span>}
            </div>
          </div>
        </Card>

        <Card variant="card" className="flex flex-col gap-2 sm:col-span-2 lg:col-span-1">
          <div className="font-semibold text-ink text-[15px]">{next ? t('home.upNext') : t('home.allDoneTitle')}</div>
          {next ? (
            <>
              <div className="text-sm text-ink-2 flex-1 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] overflow-hidden">
                {pick(next.lesson.title, locale)}
              </div>
              <LinkButton to={`/lesson/${next.lesson.id}`} size="sm" className="self-start mt-1">
                <Icon name="play" size={15} /> {started ? t('home.continueCta') : t('home.startCta')}
              </LinkButton>
            </>
          ) : (
            <p className="text-sm text-ink-2">{t('home.allDoneBody')}</p>
          )}
        </Card>

        <Card variant="card" className="flex flex-col gap-2">
          <div className="font-semibold text-ink text-[15px] flex items-center gap-2">
            <Icon name="trophy" size={17} className="text-accent-2" /> {t('home.achievementsTitle')}
          </div>
          {unlocked.length === 0 ? (
            <p className="text-sm text-muted">{t('home.achievementsEmpty')}</p>
          ) : (
            <ul className="space-y-1.5">
              {unlocked.map(([id]) => (
                <li key={id} className="text-sm">
                  <span className="font-medium text-ink">{t(`achievements.${id}.title`)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </section>
  );
}

export function HomePage() {
  const { t } = useTranslation();
  const completed = useProgress((s) => s.lessonsCompleted);

  return (
    <div className="space-y-10 md:space-y-14">
      <section className="grid grid-cols-1 min-[900px]:grid-cols-[1.1fr_1fr] gap-8 min-[900px]:gap-10 items-center">
        <div>
          <div className="inline-flex h-7 items-center gap-1.5 px-3 rounded-pill bg-accent-2-soft text-accent text-[12.5px] font-semibold">
            <span className="w-1.5 h-1.5 rounded-pill bg-accent-2" aria-hidden="true" /> {t('home.eyebrowNew')}
          </div>
          <h1
            className="font-display font-extrabold text-ink mt-3"
            style={{ fontSize: 'clamp(30px, 8.6vw, 56px)', lineHeight: 1.08, textWrap: 'balance' }}
          >
            {t('home.heroTitle')} <span className="text-accent">{t('home.heroTitle2')}</span>
          </h1>
          <p className="mt-4 text-[17px] md:text-[19px] leading-[1.55] text-ink-2 max-w-[34ch]">{t('home.heroBody')}</p>
        </div>
        <div>
          <div className="elev-2 aspect-[16/7] min-[900px]:aspect-[4/3] overflow-hidden">
            <HeroSignature curve={HERO_CURVE} />
          </div>
          <p className="mt-2 text-[12.5px] text-muted text-center hidden [@media(hover:none)]:block">{t('hero.signatureHint')}</p>
        </div>
      </section>

      <ProgressSection />

      <section>
        <h2 className="text-[22px] md:text-[26px] font-bold text-ink mb-4">{t('home.lessonsTitle')}</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {LESSONS.map((lesson, i) => (
            <LessonCard key={lesson.id} lesson={lesson} index={i} isDone={!!completed[lesson.id]} />
          ))}
        </div>
      </section>

      <footer className="text-xs text-muted max-w-3xl space-y-1 pb-4">
        <p>{t('footer.disclaimer')}</p>
        <p>
          <a href="https://edenguy.github.io" rel="author" className="hover:text-ink">
            {t('footer.credit')}
          </a>
        </p>
      </footer>
    </div>
  );
}
