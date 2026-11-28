/** Why not index everything everywhere (CODEGRAPH_LLD.md section 4.5). All arithmetic, no measurement. */

export interface Org {
  repos: number;
  developers: number;
}
/** The example parameters. They describe no real company. */
export const DEFAULT_ORG: Org = { repos: 500, developers: 20000 };
export const REPO_STEPS = [10, 50, 100, 200, 500, 1000, 2000, 5000];
export const DEVELOPER_STEPS = [10, 100, 500, 1000, 5000, 10000, 20000, 50000, 100000];

export type IndexStrategy = 'everyMachineEverything' | 'everyMachineOwn' | 'publishOnce';
export const STRATEGIES: IndexStrategy[] = ['everyMachineEverything', 'everyMachineOwn', 'publishOnce'];

const own = (org: Org, reposPerDeveloper: number) => Math.min(reposPerDeveloper, org.repos);

export function indexBuilds(org: Org, s: IndexStrategy, reposPerDeveloper: number): number {
  if (s === 'everyMachineEverything') return org.repos * org.developers;
  if (s === 'everyMachineOwn') return org.developers * own(org, reposPerDeveloper);
  return org.repos;
}

export function reposInReach(org: Org, s: IndexStrategy, reposPerDeveloper: number): number {
  return s === 'everyMachineOwn' ? own(org, reposPerDeveloper) : org.repos;
}

export function reachShare(org: Org, s: IndexStrategy, reposPerDeveloper: number): number {
  return reposInReach(org, s, reposPerDeveloper) / org.repos;
}

/** Rebuilds needed to bring every copy up to date after one merge to one repo. */
export function rebuildsPerMerge(org: Org, s: IndexStrategy, reposPerDeveloper: number): number {
  if (s === 'everyMachineEverything') return org.developers;
  if (s === 'everyMachineOwn') return (org.developers * own(org, reposPerDeveloper)) / org.repos;
  return 1;
}

/** `en-US` grouping on purpose: a number is an LTR island in both languages. */
export function formatCount(n: number): string {
  return n.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

/** reachShare x 100, up to one decimal, trailing .0 dropped. */
export function formatPercent(share: number): string {
  const v = Math.round(share * 1000) / 10;
  return v.toLocaleString('en-US', { maximumFractionDigits: 1 });
}

/** Log-scale bar width in percent: log10(value) / log10(max) x 100, minimum 2. */
export function logBarPercent(value: number, max: number): number {
  if (value <= 1 || max <= 1) return 2;
  return Math.max(2, (Math.log10(value) / Math.log10(max)) * 100);
}
