import type { LocalizedString, TopicId } from './schema';

/**
 * One topic: code graphs. The badge is the topic name only. This is not a school subject, so
 * there is no grade and no "5-unit" claim (CODEGRAPH_LLD.md section 1.1).
 */
export interface Topic {
  id: TopicId;
  title: LocalizedString;
  description: LocalizedString;
  curriculumBadge: LocalizedString;
}

export const TOPICS: Record<TopicId, Topic> = {
  'code-graphs': {
    id: 'code-graphs',
    title: { en: 'Code graphs', he: 'גרפים של קוד' },
    description: {
      en: 'From one question to an organization of thousands of developers.',
      he: 'מהשאלה הבודדת ועד ארגון של אלפי מפתחים.',
    },
    curriculumBadge: { en: 'Code graphs', he: 'גרפים של קוד' },
  },
};

export const TOPIC_ORDER: TopicId[] = ['code-graphs'];
