import { describe, expect, it } from 'vitest';
import { evaluateAchievements } from '../achievements';
import type { Lesson } from '@/content/schema';

function lesson(id: string, order: number): Lesson {
  return {
    id,
    topic: 'structure-and-bonding',
    order,
    title: { en: id },
    subtitle: { en: id },
    intro: [{ en: 'x' }],
    keyPoints: [{ en: 'x' }],
    quiz: [{ type: 'numeric', id: `${id}-q1`, prompt: { en: 'x' }, correctValue: 1, tolerance: 0.1, explanation: { en: 'x' } }],
  };
}

const LESSONS: Lesson[] = [lesson('a', 1), lesson('b', 2)];

describe('evaluateAchievements', () => {
  it('earns nothing with no progress', () => {
    expect(evaluateAchievements({ lessonsCompleted: {}, attempts: [] }, LESSONS)).toEqual([]);
  });

  it('earns first-lesson from one completion, and topic-complete only when every lesson is done', () => {
    const one = evaluateAchievements({ lessonsCompleted: { a: 1 }, attempts: [] }, LESSONS);
    expect(one).toContain('first-lesson');
    expect(one).not.toContain('topic-complete');
    expect(one).not.toContain('all-complete');

    const all = evaluateAchievements({ lessonsCompleted: { a: 1, b: 2 }, attempts: [] }, LESSONS);
    expect(all).toContain('topic-complete');
    expect(all).toContain('all-complete');
  });

  it('earns ten-correct once 10 attempts have been correct', () => {
    const nine = Array.from({ length: 9 }, () => ({ correct: true }));
    expect(evaluateAchievements({ lessonsCompleted: {}, attempts: nine }, LESSONS)).not.toContain('ten-correct');
    const ten = [...nine, { correct: true }];
    expect(evaluateAchievements({ lessonsCompleted: {}, attempts: ten }, LESSONS)).toContain('ten-correct');
  });
});
