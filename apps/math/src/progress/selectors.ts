import { useMemo } from 'react';
import { LESSONS, lessonsByTopic } from '@/content';
import { TOPIC_ORDER } from '@/content/topics';
import type { Lesson, TopicId } from '@/content/schema';
import { useProgress } from './store';
import type { QuizAttempt } from './sanitize';

export interface Fraction {
  done: number;
  total: number;
  fraction: number;
}

function toFraction(done: number, total: number): Fraction {
  return { done, total, fraction: total === 0 ? 0 : done / total };
}

/** X of Y lessons done, across every topic — the dashboard's main progress ring. */
export function computeCourseProgress(lessonsCompleted: Record<string, number>, lessons: Lesson[] = LESSONS): Fraction {
  const done = lessons.filter((l) => lessonsCompleted[l.id]).length;
  return toFraction(done, lessons.length);
}

/** X of Y lessons done, within one topic — used for the per-topic badge/ring. */
export function computeTopicProgress(topicId: TopicId, lessonsCompleted: Record<string, number>, lessons: Lesson[] = LESSONS): Fraction {
  const topicLessons = lessons.filter((l) => l.topic === topicId);
  const done = topicLessons.filter((l) => lessonsCompleted[l.id]).length;
  return toFraction(done, topicLessons.length);
}

export interface Accuracy {
  correct: number;
  total: number;
  fraction: number | null;
}

/**
 * Overall quiz accuracy (correct / total attempts) — the honest, scoped-down stand-in for
 * Nitrox's per-topic mastery levels (see CLAUDE.md's instructions for this port: Math's
 * questions don't carry the per-question topic tags that system needs). `fraction` is null
 * until at least one question has been attempted, so the UI can show a real empty state
 * instead of a misleading 0%.
 */
export function computeAccuracy(attempts: QuizAttempt[]): Accuracy {
  const total = attempts.length;
  const correct = attempts.filter((a) => a.correct).length;
  return { correct, total, fraction: total === 0 ? null : correct / total };
}

export interface NextLesson {
  lesson: Lesson;
  resumed: boolean;
}

/** The next lesson the learner should open: last-visited if it's still incomplete, else the
 * first incomplete lesson in topic order (CLAUDE.md's topic-first order, never grade-first). */
export function computeNextLesson(
  lessonsCompleted: Record<string, number>,
  lastVisited: string | null,
  lessons: Lesson[] = LESSONS,
): NextLesson | null {
  if (lastVisited) {
    const lesson = lessons.find((l) => l.id === lastVisited);
    if (lesson && !lessonsCompleted[lesson.id]) return { lesson, resumed: true };
  }
  for (const topicId of TOPIC_ORDER) {
    for (const lesson of lessonsByTopic(topicId)) {
      if (!lessonsCompleted[lesson.id]) return { lesson, resumed: false };
    }
  }
  return null;
}

export function useCourseProgress(): Fraction {
  const completed = useProgress((s) => s.lessonsCompleted);
  return useMemo(() => computeCourseProgress(completed), [completed]);
}

export function useTopicProgress(topicId: TopicId): Fraction {
  const completed = useProgress((s) => s.lessonsCompleted);
  return useMemo(() => computeTopicProgress(topicId, completed), [topicId, completed]);
}

export function useQuizAccuracy(): Accuracy {
  const attempts = useProgress((s) => s.attempts);
  return useMemo(() => computeAccuracy(attempts), [attempts]);
}

export function useNextLesson(): NextLesson | null {
  const completed = useProgress((s) => s.lessonsCompleted);
  const last = useProgress((s) => s.lastVisited);
  return useMemo(() => computeNextLesson(completed, last), [completed, last]);
}
