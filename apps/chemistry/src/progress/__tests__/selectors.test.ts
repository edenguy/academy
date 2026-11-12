import { describe, expect, it } from 'vitest';
import { LESSONS } from '@/content';
import { computeAccuracy, computeCourseProgress, computeNextLesson, computeTopicProgress } from '../selectors';

// Exercised against the real lesson content (6 structure-and-bonding lessons) so a change
// to the content's shape or ordering would fail a test here, not just at runtime.

describe('computeCourseProgress', () => {
  it('is 0 of total with no progress', () => {
    expect(computeCourseProgress({}, LESSONS)).toEqual({ done: 0, total: 6, fraction: 0 });
  });

  it('counts only lessons that exist in the content, ignoring stale ids', () => {
    const progress = computeCourseProgress({ 'ionic-bond': 1, 'covalent-bond': 2, 'a-deleted-lesson': 3 }, LESSONS);
    expect(progress).toEqual({ done: 2, total: 6, fraction: 2 / 6 });
  });

  it('reaches 1 once every lesson is done', () => {
    const all = Object.fromEntries(LESSONS.map((l) => [l.id, 1]));
    expect(computeCourseProgress(all, LESSONS).fraction).toBe(1);
  });
});

describe('computeTopicProgress', () => {
  it('scopes to one topic only', () => {
    const completed = { 'ionic-bond': 1, 'not-a-lesson': 2 };
    expect(computeTopicProgress('structure-and-bonding', completed, LESSONS)).toEqual({ done: 1, total: 6, fraction: 1 / 6 });
  });
});

describe('computeAccuracy', () => {
  it('is null (not 0%) before any question has been answered — an honest empty state', () => {
    expect(computeAccuracy([])).toEqual({ correct: 0, total: 0, fraction: null });
  });

  it('computes correct/total once there is at least one attempt', () => {
    const attempts = [
      { lessonId: 'a', questionId: 'q1', correct: true, at: 1 },
      { lessonId: 'a', questionId: 'q2', correct: false, at: 2 },
      { lessonId: 'a', questionId: 'q3', correct: true, at: 3 },
    ];
    expect(computeAccuracy(attempts)).toEqual({ correct: 2, total: 3, fraction: 2 / 3 });
  });
});

describe('computeNextLesson', () => {
  it('with nothing completed and no last visit, resumes nothing and starts at the first lesson in topic order', () => {
    const next = computeNextLesson({}, null, LESSONS);
    expect(next?.resumed).toBe(false);
    expect(next?.lesson.id).toBe('ionic-bond');
  });

  it('resumes the last-visited lesson if it is still incomplete', () => {
    const next = computeNextLesson({}, 'covalent-bond', LESSONS);
    expect(next).toEqual({ lesson: LESSONS.find((l) => l.id === 'covalent-bond'), resumed: true });
  });

  it('falls through to the first incomplete lesson when the last-visited one is already done', () => {
    const next = computeNextLesson({ 'ionic-bond': 1 }, 'ionic-bond', LESSONS);
    expect(next?.resumed).toBe(false);
    expect(next?.lesson.id).toBe('covalent-bond');
  });

  it('skips completed lessons within a topic before moving to the next topic', () => {
    const completed = { 'ionic-bond': 1 };
    const next = computeNextLesson(completed, null, LESSONS);
    expect(next?.lesson.id).toBe('covalent-bond');
  });

  it('returns null once every lesson is completed', () => {
    const all = Object.fromEntries(LESSONS.map((l) => [l.id, 1]));
    expect(computeNextLesson(all, null, LESSONS)).toBeNull();
  });
});
