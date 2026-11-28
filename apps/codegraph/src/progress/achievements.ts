import type { Lesson } from '@/content/schema';

/**
 * Code Graph Academy's achievement set (CODEGRAPH_LLD.md section 5.5). Calm, recomputed from
 * state by a pure function: no streaks, nothing time-based.
 */
export type AchievementId = 'first-lesson' | 'graph-basics' | 'big-picture' | 'at-scale' | 'ten-correct' | 'all-complete';

export const ACHIEVEMENT_IDS: AchievementId[] = ['first-lesson', 'graph-basics', 'big-picture', 'at-scale', 'ten-correct', 'all-complete'];

const BASICS = ['agent-sees-what-it-opens', 'what-is-a-code-graph', 'three-graphs-three-questions'];
const PICTURE = 'is-there-a-standard';
const SCALE = ['build-once-read-many', 'the-topology', 'scaling-to-an-organization'];

export interface AchievementInput {
  lessonsCompleted: Record<string, number>;
  attempts: { correct: boolean }[];
}

export function evaluateAchievements(input: AchievementInput, lessons: Lesson[]): AchievementId[] {
  const { lessonsCompleted, attempts } = input;
  const done = (id: string) => Boolean(lessonsCompleted[id]);
  const earned: AchievementId[] = [];
  if (lessons.some((l) => done(l.id))) earned.push('first-lesson');
  if (BASICS.every(done)) earned.push('graph-basics');
  if (done(PICTURE)) earned.push('big-picture');
  if (SCALE.every(done)) earned.push('at-scale');
  if (attempts.filter((a) => a.correct).length >= 10) earned.push('ten-correct');
  if (lessons.length > 0 && lessons.every((l) => done(l.id))) earned.push('all-complete');
  return earned;
}
