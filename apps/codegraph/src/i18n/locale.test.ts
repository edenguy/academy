import { describe, expect, it } from 'vitest';
import en from './locales/en.json';
import he from './locales/he.json';

type Tree = { [k: string]: string | Tree };
function flat(o: Tree, prefix = ''): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(o)) {
    if (typeof v === 'string') out[prefix + k] = v;
    else Object.assign(out, flat(v, `${prefix}${k}.`));
  }
  return out;
}
const E = flat(en as Tree);
const H = flat(he as Tree);

describe('T-5 locale files', () => {
  it('have identical key sets', () => {
    expect(Object.keys(H).sort()).toEqual(Object.keys(E).sort());
  });

  it('have no empty value', () => {
    for (const [k, v] of Object.entries(E)) expect(v.trim().length, `en ${k}`).toBeGreaterThan(0);
    for (const [k, v] of Object.entries(H)) expect(v.trim().length, `he ${k}`).toBeGreaterThan(0);
  });

  it('carry the keys the explorers and the home page rely on', () => {
    const need = [
      'app.name', 'org.illustrative', 'hero.signatureHint', 'home.heroBody', 'home.curriculumNote', 'footer.disclaimer',
      'explorer.common.steps', 'explorer.question.callers', 'explorer.search.stepOpen', 'explorer.role.answer',
      'explorer.graph.hops', 'explorer.ask.why.syntax.callers.imprecise', 'explorer.verdict.unavailable',
      'explorer.scale.s.publishOnce', 'explorer.staleness.decision.answerAsOf', 'explorer.cadence.behind',
      'explorer.topology.step.q1', 'explorer.topology.step.n1', 'explorer.topology.here.server.sharded',
      'explorer.access.v.exposed', 'explorer.landscape.piece.cyclonedx', 'explorer.landscape.layer.org.notStandard',
      'lesson.explorerIntro', 'achievements.at-scale.title',
    ];
    for (const k of need) {
      expect(E[k], `en ${k}`).toBeTruthy();
      expect(H[k], `he ${k}`).toBeTruthy();
    }
  });

  it('every {{placeholder}} agrees between the two languages', () => {
    const ph = (s: string) => [...s.matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1]).sort().join(',');
    for (const k of Object.keys(E)) expect(ph(H[k]!), k).toBe(ph(E[k]!));
  });

  it('has no leftover Chemistry copy', () => {
    const all = JSON.stringify([E, H]);
    expect(/chemistry|כימיה|electron|אלקטרון/i.test(all)).toBe(false);
  });
});
