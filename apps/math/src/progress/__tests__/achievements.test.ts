import { describe, expect, it } from 'vitest';
import { evaluateAchievements } from '../achievements';
import type { Lesson } from '@/content/schema';

// Minimal synthetic lesson fixtures — two topics, two lessons each — so this test exercises
// the achievement rules in isolation from the real content (see selectors.test.ts for the
// real LESSONS-backed coverage).
function lesson(id: string, topic: 'integrals' | 'derivatives', order: number): Lesson {
  return {
    id,
    topic,
    order,
    title: { en: id },
    subtitle: { en: id },
    intro: [{ en: 'x' }],
    keyPoints: [{ en: 'x' }],
    quiz: [{ type: 'numeric', id: `${id}-q1`, prompt: { en: 'x' }, correctValue: 1, tolerance: 0.1, explanation: { en: 'x' } }],
  };
}

const LESSONS: Lesson[] = [
  lesson('i1', 'integrals', 1),
  lesson('i2', 'integrals', 2),
  lesson('d1', 'derivatives', 1),
  lesson('d2', 'derivatives', 2),
];

describe('evaluateAchievements', () => {
  it('earns nothing with no progress at all', () => {
    expect(evaluateAchievements({ lessonsCompleted: {}, attempts: [] }, LESSONS)).toEqual([]);
  });

  it('earns first-lesson as soon as one lesson is completed', () => {
    const earned = evaluateAchievements({ lessonsCompleted: { i1: 1 }, attempts: [] }, LESSONS);
    expect(earned).toContain('first-lesson');
    expect(earned).not.toContain('both-topics-started');
    expect(earned).not.toContain('integrals-complete');
  });

  it('earns both-topics-started only once a lesson is done in each topic', () => {
    const oneTopic = evaluateAchievements({ lessonsCompleted: { i1: 1, i2: 2 }, attempts: [] }, LESSONS);
    expect(oneTopic).not.toContain('both-topics-started');
    expect(oneTopic).toContain('integrals-complete'); // both integrals lessons done

    const bothTopics = evaluateAchievements({ lessonsCompleted: { i1: 1, d1: 2 }, attempts: [] }, LESSONS);
    expect(bothTopics).toContain('both-topics-started');
    expect(bothTopics).not.toContain('integrals-complete'); // i2 still missing
  });

  it('earns a topic-complete id only when every lesson in that topic is done', () => {
    expect(evaluateAchievements({ lessonsCompleted: { d1: 1 }, attempts: [] }, LESSONS)).not.toContain('derivatives-complete');
    expect(evaluateAchievements({ lessonsCompleted: { d1: 1, d2: 2 }, attempts: [] }, LESSONS)).toContain('derivatives-complete');
  });

  it('earns all-complete only when every lesson across every topic is done', () => {
    const almost = evaluateAchievements({ lessonsCompleted: { i1: 1, i2: 2, d1: 3 }, attempts: [] }, LESSONS);
    expect(almost).not.toContain('all-complete');
    const everything = evaluateAchievements({ lessonsCompleted: { i1: 1, i2: 2, d1: 3, d2: 4 }, attempts: [] }, LESSONS);
    expect(everything).toContain('all-complete');
  });

  it('earns ten-correct once 10 attempts have been correct, regardless of incorrect ones', () => {
    const nine = Array.from({ length: 9 }, () => ({ correct: true }));
    expect(evaluateAchievements({ lessonsCompleted: {}, attempts: nine }, LESSONS)).not.toContain('ten-correct');

    const tenPlusSomeWrong = [...nine, { correct: true }, { correct: false }, { correct: false }];
    expect(evaluateAchievements({ lessonsCompleted: {}, attempts: tenPlusSomeWrong }, LESSONS)).toContain('ten-correct');
  });
});
