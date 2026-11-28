import { describe, expect, it } from 'vitest';
import { blockedAt, exposedRepos, isBlocked, readableRepos, type CheckAt, type Path, type ServerReadsAs } from './access';

describe('where the permission check lives', () => {
  // checkAt: [viaServer+caller, viaServer+serviceAccount, directToRegistry (either)]
  const table: Record<CheckAt, [boolean, boolean, boolean]> = {
    none: [false, false, false],
    server: [true, true, false],
    registry: [true, false, true],
    both: [true, true, true],
  };
  for (const c of Object.keys(table) as CheckAt[]) {
    const [a, b, d] = table[c];
    const cases: [Path, ServerReadsAs, boolean][] = [
      ['viaServer', 'caller', a],
      ['viaServer', 'serviceAccount', b],
      ['directToRegistry', 'caller', d],
      ['directToRegistry', 'serviceAccount', d],
    ];
    for (const [p, s, want] of cases) {
      it(`${c} / ${p} / ${s} is ${want ? 'blocked' : 'exposed'}`, () => {
        expect(isBlocked(c, p, s)).toBe(want);
      });
    }
  }

  it('readable and exposed repo counts', () => {
    expect(readableRepos(500, 60)).toBe(300);
    expect(readableRepos(500, 0)).toBe(0);
    expect(readableRepos(500, 100)).toBe(500);
    expect(exposedRepos(500, 60, 'none', 'viaServer', 'caller')).toBe(200);
    expect(exposedRepos(500, 60, 'both', 'viaServer', 'caller')).toBe(0);
    expect(exposedRepos(500, 60, 'both', 'directToRegistry', 'serviceAccount')).toBe(0);
    for (const c of ['none', 'server', 'registry', 'both'] as CheckAt[]) {
      expect(exposedRepos(500, 100, c, 'viaServer', 'caller')).toBe(0);
    }
  });

  it('names the box that stops the request', () => {
    expect(blockedAt('server', 'viaServer', 'caller')).toBe('server');
    expect(blockedAt('registry', 'viaServer', 'caller')).toBe('registry');
    expect(blockedAt('both', 'viaServer', 'caller')).toBe('server');
    expect(blockedAt('registry', 'directToRegistry', 'caller')).toBe('registry');
    expect(blockedAt('none', 'viaServer', 'caller')).toBeNull();
  });
});
