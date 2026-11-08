import { useTranslation } from 'react-i18next';
import { motion, useReducedMotion } from 'motion/react';
import { lessonsByTopic } from '@/content';
import { TOPICS, TOPIC_ORDER } from '@/content/topics';
import { pick } from '@/content/localize';
import { useLocale, useCompletedLessons } from '@/app/providers';
import { Icon } from '@/components/ui/Icon';
import { HeroSignature } from '@/components/HeroSignature';
import { LessonSignature } from '@/components/LessonSignature';
import { HERO_CURVE } from '@/math/heroCurve';
import { lessonSignature } from '@/math/lessonSignature';
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

export function HomePage() {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const [completed] = useCompletedLessons();

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
          <p className="mt-3 text-[13px] text-muted max-w-[34ch]">{t('home.curriculumNote')}</p>
        </div>
        <div>
          <div className="elev-2 aspect-[16/7] min-[900px]:aspect-[4/3] overflow-hidden">
            <HeroSignature curve={HERO_CURVE} />
          </div>
          <p className="mt-2 text-[12.5px] text-muted text-center hidden [@media(hover:none)]:block">
            {t('hero.signatureHint')}
          </p>
        </div>
      </section>

      {TOPIC_ORDER.map((topicId) => {
        const topic = TOPICS[topicId];
        const lessons = lessonsByTopic(topicId);
        return (
          <section key={topicId}>
            <div className="flex items-baseline justify-between flex-wrap gap-2 mb-1.5">
              <h2 className="text-[22px] md:text-[26px] font-bold text-ink">{pick(topic.title, locale)}</h2>
              <span className="elev-0 text-[12.5px] font-semibold text-ink-2 bg-surface-3 rounded-pill px-3 h-7 inline-flex items-center">
                {pick(topic.curriculumBadge, locale)}
              </span>
            </div>
            <p className="text-sm text-ink-2 mb-4">{pick(topic.description, locale)}</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {lessons.map((lesson, i) => (
                <LessonCard key={lesson.id} lesson={lesson} index={i} isDone={completed.includes(lesson.id)} />
              ))}
            </div>
          </section>
        );
      })}

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
