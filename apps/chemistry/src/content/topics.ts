import type { LocalizedString, TopicId } from './schema';

/**
 * One topic for this pilot: structure and bonding.
 * The badge is the chapter name only. It does not say "5-unit" or name a grade:
 * no Ministry chemistry source is cited in the repo, and schools split the chapter
 * across different years.
 */
export interface Topic {
  id: TopicId;
  title: LocalizedString;
  description: LocalizedString;
  curriculumBadge: LocalizedString;
}

export const TOPICS: Record<TopicId, Topic> = {
  'structure-and-bonding': {
    id: 'structure-and-bonding',
    title: { en: 'Structure and bonding', he: 'מבנה וקישור' },
    description: {
      en: 'How atoms hold together — and why that decides what a material can do.',
      he: 'איך אטומים נאחזים זה בזה — ולמה זה קובע מה חומר יכול לעשות.',
    },
    curriculumBadge: { en: 'Structure and bonding', he: 'מבנה וקישור' },
  },
};

export const TOPIC_ORDER: TopicId[] = ['structure-and-bonding'];
