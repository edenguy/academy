import { describe, expect, it } from 'vitest';
import { DEFAULT_ORG, DEVELOPER_STEPS, REPO_STEPS, formatPercent, indexBuilds, logBarPercent, reachShare, rebuildsPerMerge, reposInReach, type IndexStrategy } from './scale';

const S: IndexStrategy[] = ['everyMachineEverything', 'everyMachineOwn', 'publishOnce'];
const all = (org: { repos: number; developers: number }, k: number) => ({
  builds: S.map((s) => indexBuilds(org, s, k)),
  reach: S.map((s) => reposInReach(org, s, k)),
  share: S.map((s) => reachShare(org, s, k)),
  rebuilds: S.map((s) => rebuildsPerMerge(org, s, k)),
});

describe('scale arithmetic', () => {
  it('500 repos, 20,000 developers, 3 repos each', () => {
    expect(DEFAULT_ORG).toEqual({ repos: 500, developers: 20000 });
    const r = all(DEFAULT_ORG, 3);
    expect(r.builds).toEqual([10_000_000, 60_000, 500]);
    expect(r.reach).toEqual([500, 3, 500]);
    expect(r.share).toEqual([1, 0.006, 1]);
    expect(r.rebuilds).toEqual([20000, 120, 1]);
  });

  it('200 repos, 1,000 developers (quiz q1, q2)', () => {
    expect(all({ repos: 200, developers: 1000 }, 3).builds).toEqual([200_000, 3000, 200]);
  });

  it('a developer cannot work on more repos than exist', () => {
    const r = all({ repos: 10, developers: 10 }, 20);
    expect(r.builds[1]).toBe(100);
    expect(r.reach[1]).toBe(10);
  });

  it('the step arrays are the ones the schema allows', () => {
    expect(REPO_STEPS).toEqual([10, 50, 100, 200, 500, 1000, 2000, 5000]);
    expect(DEVELOPER_STEPS).toEqual([10, 100, 500, 1000, 5000, 10000, 20000, 50000, 100000]);
  });

  it('formats a share as a percent with a dropped trailing .0', () => {
    expect(formatPercent(0.006)).toBe('0.6');
    expect(formatPercent(1)).toBe('100');
    expect(formatPercent(0.5)).toBe('50');
  });

  it('log bars: the largest is 100%, a single build has the 2% floor', () => {
    expect(logBarPercent(10_000_000, 10_000_000)).toBe(100);
    expect(logBarPercent(1, 10_000_000)).toBe(2);
    expect(Math.round(logBarPercent(500, 10_000_000) * 10) / 10).toBe(38.6);
  });
});
