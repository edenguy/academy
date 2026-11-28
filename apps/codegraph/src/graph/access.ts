/** Where the permission check lives (CODEGRAPH_LLD.md section 4.9). A model of one common design, not a product. */

export type CheckAt = 'none' | 'server' | 'registry' | 'both';
export const CHECK_POINTS: CheckAt[] = ['none', 'server', 'registry', 'both'];
export type Path = 'viaServer' | 'directToRegistry';
export type ServerReadsAs = 'caller' | 'serviceAccount';

export function readableRepos(repos: number, sharePercent: number): number {
  return Math.round((repos * sharePercent) / 100);
}

/**
 * viaServer: blocked when the server checks, or when the registry checks and the server reads
 * as the caller. directToRegistry: blocked when the registry checks.
 */
export function isBlocked(c: CheckAt, p: Path, s: ServerReadsAs): boolean {
  const server = c === 'server' || c === 'both';
  const registry = c === 'registry' || c === 'both';
  if (p === 'directToRegistry') return registry;
  return server || (registry && s === 'caller');
}

/** Which box stops the request first, or null when it is exposed. */
export function blockedAt(c: CheckAt, p: Path, s: ServerReadsAs): 'server' | 'registry' | null {
  if (!isBlocked(c, p, s)) return null;
  if (p === 'viaServer' && (c === 'server' || c === 'both')) return 'server';
  return 'registry';
}

export function exposedRepos(repos: number, sharePercent: number, c: CheckAt, p: Path, s: ServerReadsAs): number {
  return isBlocked(c, p, s) ? 0 : repos - readableRepos(repos, sharePercent);
}
