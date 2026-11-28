import { describe, expect, it } from 'vitest';
import { intervalHours, maxCommitsBehind, orgPublishesPerDay } from './cadence';

const r4 = (n: number) => Math.round(n * 10000) / 10000;

describe('cadence', () => {
  const rows: [number, 'nightly' | 'hourly' | 'weekly' | 'everyMerge', number, number][] = [
    [10, 'nightly', 10, 500],
    [10, 'hourly', 0.4167, 5000],
    [10, 'weekly', 70, 71.43],
    [10, 'everyMerge', 0.0694, 5000],
    [30, 'nightly', 30, 500],
    [0, 'nightly', 0, 0],
    [0, 'everyMerge', 0, 0],
    [0, 'weekly', 0, 0],
  ];
  for (const [cpd, c, behind, publishes] of rows) {
    it(`${cpd} commits a day, ${c}`, () => {
      expect(r4(maxCommitsBehind(cpd, c, 10))).toBe(behind);
      expect(Math.round(orgPublishesPerDay(500, cpd, c) * 100) / 100).toBe(publishes);
    });
  }

  it('12 commits a day with a 6 hour interval is 3 commits behind (quiz q1)', () => {
    expect((12 * 6) / 24).toBe(3);
  });

  it('intervals', () => {
    expect(intervalHours('everyMerge', 30)).toBe(0.5);
    expect(intervalHours('hourly', 10)).toBe(1);
    expect(intervalHours('nightly', 10)).toBe(24);
    expect(intervalHours('weekly', 10)).toBe(168);
  });
});
