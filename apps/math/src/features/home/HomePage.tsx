import { useTranslation } from 'react-i18next';
import { lessonsByTopic } from '@/content';
import { TOPICS, TOPIC_ORDER } from '@/content/topics';
import { pick } from '@/content/localize';
import { useLocale, useCompletedLessons } from '@/app/providers';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { LinkButton } from '@/components/ui/Button';

export function HomePage() {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const [completed] = useCompletedLessons();

  return (
    <div className="space-y-8">
      <section className="card relative overflow-hidden p-6 md:p-10">
        <div className="relative max-w-xl">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-accent-2 mb-3">
            <Icon name="sparkle" size={14} /> {t('home.eyebrowNew')}
          </div>
          <h1 className="text-3xl md:text-5xl text-ink leading-[1.08]">
            {t('home.heroTitle')}
            <br />
            <span className="text-accent">{t('home.heroTitle2')}</span>
          </h1>
          <p className="mt-4 text-ink-2 md:text-lg max-w-prose">{t('home.heroBody')}</p>
          <p className="mt-3 text-xs text-muted max-w-prose">{t('home.curriculumNote')}</p>
        </div>
      </section>

      {TOPIC_ORDER.map((topicId) => {
        const topic = TOPICS[topicId];
        const lessons = lessonsByTopic(topicId);
        return (
          <section key={topicId}>
            <div className="flex items-baseline justify-between flex-wrap gap-2 mb-1">
              <h2 className="text-xl text-ink">{pick(topic.title, locale)}</h2>
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted bg-surface-3 rounded-full px-2.5 py-1 num">
                {pick(topic.curriculumBadge, locale)}
              </span>
            </div>
            <p className="text-sm text-ink-2 mb-4">{pick(topic.description, locale)}</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {lessons.map((lesson, i) => {
                const isDone = completed.includes(lesson.id);
                return (
                  <Card key={lesson.id} className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-muted">
                        {t('home.lessonLabel', { n: i + 1 })}
                      </span>
                      {isDone && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-good">
                          <Icon name="check" size={14} /> {t('home.done')}
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="font-display font-bold text-lg text-ink leading-snug">{pick(lesson.title, locale)}</div>
                      <div className="text-sm text-ink-2 mt-1">{pick(lesson.subtitle, locale)}</div>
                    </div>
                    <div className="text-xs text-muted mt-auto">{t('home.questionsCount', { count: lesson.quiz.length })}</div>
                    <LinkButton to={`/lesson/${lesson.id}`} size="sm" className="self-start" variant={isDone ? 'secondary' : 'primary'}>
                      <Icon name="play" size={14} /> {isDone ? t('home.review') : t('home.start')}
                    </LinkButton>
                  </Card>
                );
              })}
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
