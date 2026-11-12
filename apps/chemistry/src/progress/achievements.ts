import type { Lesson } from '@/content/schema';

/**
 * Chemistry Academy's achievement set. One topic, six lessons. Not a copy of Math's
 * topic ids.
 */
export type AchievementId = 'first-lesson' | 'topic-complete' | 'ten-correct' | 'all-complete';

export const ACHIEVEMENT_IDS: AchievementId[] = ['first-lesson', 'topic-complete', 'ten-correct', 'all-complete'];

export interface AchievementInput {
  lessonsCompleted: Record<string, number>;
  attempts: { correct: boolean }[];
}

export function evaluateAchievements(input: AchievementInput, lessons: Lesson[]): AchievementId[] {
  const { lessonsCompleted, attempts } = input;
  const earned: AchievementId[] = [];
  const done = lessons.filter((l) => lessonsCompleted[l.id]);
  if (done.length >= 1) earned.push('first-lesson');
  if (lessons.length > 0 && lessons.every((l) => lessonsCompleted[l.id])) {
    earned.push('topic-complete');
    earned.push('all-complete');
  }
  if (attempts.filter((a) => a.correct).length >= 10) earned.push('ten-correct');
  return earned;
}
