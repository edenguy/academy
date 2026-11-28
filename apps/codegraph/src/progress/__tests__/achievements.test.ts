import { describe, expect, it } from 'vitest';
import { evaluateAchievements } from '../achievements';
import { LESSONS } from '@/content';

const ids = LESSONS.map((l) => l.id);
const done = (list: string[]) => Object.fromEntries(list.map((id, i) => [id, i + 1]));

describe('evaluateAchievements', () => {
  it('earns nothing with no progress', () => {
    expect(evaluateAchievements({ lessonsCompleted: {}, attempts: [] }, LESSONS)).toEqual([]);
  });

  it('one lesson earns first-lesson only', () => {
    expect(evaluateAchievements({ lessonsCompleted: done([ids[0]!]), attempts: [] }, LESSONS)).toEqual(['first-lesson']);
  });

  it('the standards lesson alone also earns big-picture', () => {
    expect(evaluateAchievements({ lessonsCompleted: done([ids[3]!]), attempts: [] }, LESSONS)).toEqual(['first-lesson', 'big-picture']);
  });

  it('the three foundation lessons earn first-lesson and graph-basics', () => {
    expect(evaluateAchievements({ lessonsCompleted: done(ids.slice(0, 3)), attempts: [] }, LESSONS)).toEqual(['first-lesson', 'graph-basics']);
  });

  it('the three organization lessons earn at-scale', () => {
    expect(evaluateAchievements({ lessonsCompleted: done(ids.slice(4)), attempts: [] }, LESSONS)).toContain('at-scale');
  });

  it('all seven earn everything except ten-correct', () => {
    const all = evaluateAchievements({ lessonsCompleted: done(ids), attempts: [] }, LESSONS);
    expect([...all].sort()).toEqual(['all-complete', 'at-scale', 'big-picture', 'first-lesson', 'graph-basics']);
  });

  it('ten correct attempts earn ten-correct regardless of lessons', () => {
    const nine = Array.from({ length: 9 }, () => ({ correct: true }));
    expect(evaluateAchievements({ lessonsCompleted: {}, attempts: nine }, LESSONS)).not.toContain('ten-correct');
    expect(evaluateAchievements({ lessonsCompleted: {}, attempts: [...nine, { correct: true }] }, LESSONS)).toEqual(['ten-correct']);
    expect(evaluateAchievements({ lessonsCompleted: {}, attempts: [...nine, { correct: false }] }, LESSONS)).toEqual([]);
  });
});
