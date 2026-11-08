import type { LocalizedString, TopicId } from './schema';

/**
 * Topic-level metadata (CLAUDE.md's topic-first structure: Subject → Topic → Lesson).
 *
 * `curriculumBadge` names the real Israeli Ministry of Education track/grade this topic's
 * content corresponds to — sourced from the official curriculum PDF ("תכנית לימודים -
 * מתמטיקה 5 יח"ל", מזכירות פדגוגית), never guessed. It's a study aid, not a certified prep
 * course, so it's phrased as "matches the curriculum," not "official" or "certified."
 */
export interface Topic {
  id: TopicId;
  title: LocalizedString;
  description: LocalizedString;
  curriculumBadge: LocalizedString;
}

export const TOPICS: Record<TopicId, Topic> = {
  integrals: {
    id: 'integrals',
    title: { en: 'Integrals', he: 'אינטגרלים' },
    description: {
      en: 'The area under a curve — from rectangles, to a magic shortcut.',
      he: 'השטח מתחת לעקומה — ממלבנים, לקיצור דרך קסום.',
    },
    curriculumBadge: { en: '5-unit · grade י"א', he: '5 יח"ל · כיתה י"א' },
  },
  derivatives: {
    id: 'derivatives',
    title: { en: 'Derivatives', he: 'נגזרות' },
    description: {
      en: "How fast something is changing, right now — and where a function's graph turns around.",
      he: 'באיזה קצב משהו משתנה, ברגע הזה — ואיפה הגרף של פונקציה מתהפך.',
    },
    curriculumBadge: { en: '5-unit · grade י', he: '5 יח"ל · כיתה י' },
  },
};

export const TOPIC_ORDER: TopicId[] = ['derivatives', 'integrals'];
