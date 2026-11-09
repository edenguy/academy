import { describe, expect, it } from 'vitest';
import { LESSONS } from '@/content';
import { computeCourseProgress, computeNextLesson, computeQuizAccuracy } from '../selectors';
import type { Attempt } from '../store';

describe('computeCourseProgress', () => {
  it('reports zero done out of the full lesson count with no progress', () => {
    const r = computeCourseProgress(LESSONS, {});
    expect(r.total).toBe(LESSONS.length);
    expect(r.done).toBe(0);
    expect(r.fraction).toBe(0);
  });

  it('counts completed lessons and reflects them in the fraction', () => {
    const r = computeCourseProgress(LESSONS, { [LESSONS[0]!.id]: 1000 });
    expect(r.done).toBe(1);
    expect(r.fraction).toBeCloseTo(1 / LESSONS.length);
  });

  it('ignores a completed id that is not a real lesson (defensive against stale data)', () => {
    const r = computeCourseProgress(LESSONS, { 'not-a-real-lesson': 1000 });
    expect(r.done).toBe(0);
  });

  it('reaches fraction 1 once every lesson is done', () => {
    const completed = Object.fromEntries(LESSONS.map((l) => [l.id, 1000]));
    const r = computeCourseProgress(LESSONS, completed);
    expect(r.done).toBe(r.total);
    expect(r.fraction).toBe(1);
  });
});

describe('computeQuizAccuracy', () => {
  it('is null (not 0) with no attempts — an honest empty state, not a fake 0% score', () => {
    const r = computeQuizAccuracy([]);
    expect(r.total).toBe(0);
    expect(r.fraction).toBeNull();
  });

  it('computes correct / total from recorded attempts', () => {
    const attempts: Attempt[] = [
      { lessonId: 'a', questionId: 'q1', correct: true, at: 1 },
      { lessonId: 'a', questionId: 'q2', correct: false, at: 2 },
      { lessonId: 'a', questionId: 'q3', correct: true, at: 3 },
    ];
    const r = computeQuizAccuracy(attempts);
    expect(r.total).toBe(3);
    expect(r.correct).toBe(2);
    expect(r.fraction).toBeCloseTo(2 / 3);
  });
});

describe('computeNextLesson', () => {
  it('points at the first lesson when nothing is done yet', () => {
    const next = computeNextLesson(LESSONS, {}, null);
    expect(next?.lesson.id).toBe(LESSONS[0]!.id);
    expect(next?.resumed).toBe(false);
  });

  it('resumes the last-visited lesson if it is still incomplete', () => {
    const next = computeNextLesson(LESSONS, {}, LESSONS[1]!.id);
    expect(next?.lesson.id).toBe(LESSONS[1]!.id);
    expect(next?.resumed).toBe(true);
  });

  it('falls through to the first incomplete lesson once the last-visited one is done', () => {
    const next = computeNextLesson(LESSONS, { [LESSONS[0]!.id]: 1000 }, LESSONS[0]!.id);
    expect(next?.lesson.id).toBe(LESSONS[1]!.id);
    expect(next?.resumed).toBe(false);
  });

  it('ignores a stale last-visited id that no longer matches any lesson', () => {
    const next = computeNextLesson(LESSONS, {}, 'not-a-real-lesson');
    expect(next?.lesson.id).toBe(LESSONS[0]!.id);
    expect(next?.resumed).toBe(false);
  });

  it('returns null once every lesson is complete', () => {
    const completed = Object.fromEntries(LESSONS.map((l) => [l.id, 1000]));
    expect(computeNextLesson(LESSONS, completed, LESSONS[0]!.id)).toBeNull();
  });
});
