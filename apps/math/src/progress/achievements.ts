import type { Lesson, TopicId } from '@/content/schema';

/**
 * Math Academy's own achievement set — deliberately not a copy of Nitrox's ids/conditions
 * (see apps/nitrox/src/progress/store.ts's `AchievementId`). Scaled to this subject's much
 * smaller content: two topics, six lessons total, no mastery/spaced-review system.
 */
export type AchievementId =
  | 'first-lesson'
  | 'both-topics-started'
  | 'integrals-complete'
  | 'derivatives-complete'
  | 'ten-correct'
  | 'all-complete';

export const ACHIEVEMENT_IDS: AchievementId[] = [
  'first-lesson',
  'both-topics-started',
  'integrals-complete',
  'derivatives-complete',
  'ten-correct',
  'all-complete',
];

export interface AchievementInput {
  lessonsCompleted: Record<string, number>;
  attempts: { correct: boolean }[];
}

/**
 * Recomputes, from scratch, which achievements the current state has earned — a pure
 * function over the learner's completed lessons and quiz attempts (plus the fixed lesson
 * list), rather than incremental bookkeeping spread across every store action. Called after
 * every mutation; the store only merges in ids that are newly present (see store.ts).
 */
export function evaluateAchievements(input: AchievementInput, lessons: Lesson[]): AchievementId[] {
  const { lessonsCompleted, attempts } = input;
  const earned: AchievementId[] = [];

  const doneCount = lessons.filter((l) => lessonsCompleted[l.id]).length;
  if (doneCount >= 1) earned.push('first-lesson');

  const topicsWithProgress = new Set<TopicId>(lessons.filter((l) => lessonsCompleted[l.id]).map((l) => l.topic));
  if (topicsWithProgress.has('integrals') && topicsWithProgress.has('derivatives')) earned.push('both-topics-started');

  const byTopic = (topic: TopicId) => lessons.filter((l) => l.topic === topic);
  const allDone = (ls: Lesson[]) => ls.length > 0 && ls.every((l) => lessonsCompleted[l.id]);

  if (allDone(byTopic('integrals'))) earned.push('integrals-complete');
  if (allDone(byTopic('derivatives'))) earned.push('derivatives-complete');
  if (allDone(lessons)) earned.push('all-complete');

  const correctCount = attempts.filter((a) => a.correct).length;
  if (correctCount >= 10) earned.push('ten-correct');

  return earned;
}
