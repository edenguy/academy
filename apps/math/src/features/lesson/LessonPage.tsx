import { Navigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getLesson, lessonNeighbors } from '@/content';
import { TOPICS } from '@/content/topics';
import { pick } from '@/content/localize';
import { useLocale, useCompletedLessons } from '@/app/providers';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { LinkButton } from '@/components/ui/Button';
import { Rich } from '@/components/ui/Rich';
import { LessonExplorer } from '@/components/LessonExplorer';
import { Quiz } from '@/components/Quiz';
import { lessonSignature } from '@/math/lessonSignature';

export function LessonPage() {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const { lessonId } = useParams<{ lessonId: string }>();
  const [, markDone] = useCompletedLessons();
  const lesson = lessonId ? getLesson(lessonId) : undefined;

  if (!lesson) return <Navigate to="/" replace />;

  const { prev, next } = lessonNeighbors(lesson.id);

  return (
    <div className="space-y-6">
      <LinkButton to="/" variant="ghost" size="sm" className="-ms-3">
        <Icon name="arrow" size={16} className="rotate-180 rtl:rotate-0" /> {t('lesson.backHome')}
      </LinkButton>

      <header className="flex items-start gap-3">
        <span className="hidden md:grid shrink-0 num w-9 h-9 rounded-pill bg-accent-soft text-accent place-items-center font-mono text-[15px] font-semibold mt-1">
          {lesson.order}
        </span>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-accent">{pick(lesson.subtitle, locale)}</span>
            <span className="elev-0 text-[12.5px] font-semibold text-ink-2 bg-surface-3 rounded-pill px-2 h-6 inline-flex items-center">
              {pick(TOPICS[lesson.topic].curriculumBadge, locale)}
            </span>
          </div>
          <h1 className="font-display font-extrabold text-[28px] md:text-[40px] leading-[1.12] text-ink">{pick(lesson.title, locale)}</h1>
        </div>
      </header>

      <div className="lesson-prose space-y-4 max-w-[68ch]">
        {lesson.intro.map((p, i) => (
          <Rich key={i} text={pick(p, locale)} />
        ))}
      </div>

      {lesson.explorers?.map((explorer, i) => (
        <div key={i} className="my-8">
          <LessonExplorer config={explorer} locale={locale} />
        </div>
      ))}

      <Card variant="card" className="space-y-3">
        <div className="flex items-center gap-2 font-semibold text-[15px] text-ink">
          <Icon name="pin" size={20} className="text-accent-2" /> {t('lesson.keyPointsTitle')}
        </div>
        <ul className="space-y-2">
          {lesson.keyPoints.map((kp, i) => (
            <li key={i} className="flex gap-2.5 text-ink-2 text-[15px]">
              <span className="shrink-0 w-1.5 h-1.5 rounded-pill bg-accent-2 mt-[0.6em]" aria-hidden="true" />
              <Rich text={pick(kp, locale)} />
            </li>
          ))}
        </ul>
      </Card>

      <section>
        <h2 className="text-xl text-ink mb-3 flex items-center gap-2">
          <Icon name="target" size={20} className="text-accent" /> {t('lesson.quizTitle')}
        </h2>
        <Quiz questions={lesson.quiz} locale={locale} onAllDone={() => markDone(lesson.id)} signature={lessonSignature(lesson)} />
      </section>

      <nav className="flex items-center justify-between pt-2 gap-3" data-fab-avoid>
        {prev ? (
          <LinkButton to={`/lesson/${prev.id}`} variant="secondary" size="md">
            <Icon name="arrow" size={16} className="rotate-180 rtl:rotate-0" /> {t('lesson.prevLesson')}
          </LinkButton>
        ) : (
          <span />
        )}
        {next ? (
          <LinkButton to={`/lesson/${next.id}`} size="md">
            {t('lesson.nextLesson')} <Icon name="arrow" size={16} className="rtl:-scale-x-100" />
          </LinkButton>
        ) : (
          <LinkButton to="/" variant="secondary" size="md">
            {t('lesson.backToLessons')}
          </LinkButton>
        )}
      </nav>
    </div>
  );
}
