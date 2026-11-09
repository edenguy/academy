import { useMemo } from 'react';
import { useProgress, type Attempt } from './store';
import { LESSONS } from '@/content';
import type { Lesson } from '@/content/schema';

/** X of Y lessons done, across the whole (currently flat, single-topic) lesson list. Pure —
 * kept separate from the hook below so it can be unit tested without a React renderer. */
export function computeCourseProgress(lessons: Lesson[], completed: Record<string, number>) {
  const total = lessons.length;
  const done = lessons.filter((l) => completed[l.id]).length;
  return { total, done, fraction: total === 0 ? 0 : done / total };
}

export function useCourseProgress() {
  const completed = useProgress((s) => s.lessonsCompleted);
  return useMemo(() => computeCourseProgress(LESSONS, completed), [completed]);
}

/**
 * Overall quiz accuracy — correct / total checked answers, across every lesson. Deliberately
 * simple (no per-topic mastery or spaced review, unlike Nitrox): Physics's questions don't
 * carry the fine-grained topic tags that system needs, and this is honest without it.
 * `fraction` is `null` (not `0`) with zero attempts, so the UI can show an empty state
 * instead of a misleading "0% accuracy".
 */
export function computeQuizAccuracy(attempts: Attempt[]) {
  const total = attempts.length;
  const correct = attempts.filter((a) => a.correct).length;
  return { total, correct, fraction: total === 0 ? null : correct / total };
}

export function useQuizAccuracy() {
  const attempts = useProgress((s) => s.attempts);
  return useMemo(() => computeQuizAccuracy(attempts), [attempts]);
}

/** The next lesson the learner should open: last visited if incomplete, else first
 * incomplete lesson in order, else null (every lesson is done). */
export function computeNextLesson(
  lessons: Lesson[],
  completed: Record<string, number>,
  lastVisited: string | null,
): { lesson: Lesson; resumed: boolean } | null {
  if (lastVisited) {
    const lesson = lessons.find((l) => l.id === lastVisited);
    if (lesson && !completed[lesson.id]) return { lesson, resumed: true };
  }
  for (const lesson of lessons) if (!completed[lesson.id]) return { lesson, resumed: false };
  return null;
}

export function useNextLesson() {
  const completed = useProgress((s) => s.lessonsCompleted);
  const last = useProgress((s) => s.lastVisited);
  return useMemo(() => computeNextLesson(LESSONS, completed, last), [completed, last]);
}
