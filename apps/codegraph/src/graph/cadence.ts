/** Freshness at scale (CODEGRAPH_LLD.md section 4.7). Commits are assumed to be spread evenly over the day. */

export type Cadence = 'everyMerge' | 'hourly' | 'nightly' | 'weekly';
export const CADENCES: Cadence[] = ['everyMerge', 'hourly', 'nightly', 'weekly'];

export function intervalHours(c: Cadence, pipelineMinutes: number): number {
  if (c === 'everyMerge') return pipelineMinutes / 60;
  if (c === 'hourly') return 1;
  if (c === 'nightly') return 24;
  return 168;
}

/** commitsPerDay x intervalHours / 24. */
export function maxCommitsBehind(commitsPerDay: number, c: Cadence, pipelineMinutes: number): number {
  return (commitsPerDay * intervalHours(c, pipelineMinutes)) / 24;
}

/** everyMerge: commitsPerDay; otherwise min(commitsPerDay, 24 / interval): a scheduled publish is skipped when nothing changed. */
export function publishesPerRepoPerDay(commitsPerDay: number, c: Cadence): number {
  if (c === 'everyMerge') return commitsPerDay;
  return Math.min(commitsPerDay, 24 / intervalHours(c, 0));
}

export function orgPublishesPerDay(repos: number, commitsPerDay: number, c: Cadence): number {
  return repos * publishesPerRepoPerDay(commitsPerDay, c);
}
