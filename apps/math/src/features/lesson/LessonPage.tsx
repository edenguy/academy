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

      <header>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-semibold text-accent">{pick(lesson.subtitle, locale)}</span>
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted bg-surface-3 rounded-full px-2 py-0.5 num">
            {pick(TOPICS[lesson.topic].curriculumBadge, locale)}
          </span>
        </div>
        <h1 className="text-2xl md:text-4xl text-ink">{pick(lesson.title, locale)}</h1>
      </header>

      <div className="lesson-prose space-y-4">
        {lesson.intro.map((p, i) => (
          <Rich key={i} text={pick(p, locale)} />
        ))}
      </div>

      {lesson.explorers?.map((explorer, i) => <LessonExplorer key={i} config={explorer} locale={locale} />)}

      <Card flat className="space-y-3">
        <div className="flex items-center gap-2 font-semibold text-ink">
          <Icon name="lightbulb" size={20} className="text-highlight" /> {t('lesson.keyPointsTitle')}
        </div>
        <ul className="space-y-2">
          {lesson.keyPoints.map((kp, i) => (
            <li key={i} className="flex gap-2.5 text-ink-2 text-[15px]">
              <Icon name="star" size={16} className="text-accent-2 shrink-0 mt-1" />
              <Rich text={pick(kp, locale)} />
            </li>
          ))}
        </ul>
      </Card>

      <section>
        <h2 className="text-xl text-ink mb-3 flex items-center gap-2">
          <Icon name="book" size={20} className="text-accent" /> {t('lesson.quizTitle')}
        </h2>
        <Quiz questions={lesson.quiz} locale={locale} onAllDone={() => markDone(lesson.id)} />
      </section>

      <nav className="flex items-center justify-between pt-2 gap-3">
        {prev ? (
          <LinkButton to={`/lesson/${prev.id}`} variant="secondary" size="sm">
            <Icon name="arrow" size={16} className="rotate-180 rtl:rotate-0" /> {t('lesson.prevLesson')}
          </LinkButton>
        ) : (
          <span />
        )}
        {next ? (
          <LinkButton to={`/lesson/${next.id}`} size="sm">
            {t('lesson.nextLesson')} <Icon name="arrow" size={16} className="rtl:-scale-x-100" />
          </LinkButton>
        ) : (
          <LinkButton to="/" variant="secondary" size="sm">
            {t('lesson.backToLessons')}
          </LinkButton>
        )}
      </nav>
    </div>
  );
}
