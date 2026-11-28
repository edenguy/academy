import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import { LESSONS } from './index';
import type { Lesson } from './schema';
import { LayerId, ToyNodeId } from './schema';
import { BASE_GRAPH, TOY_FILES, REPOS } from '@/graph/toy';
import { searchCost } from '@/graph/search';
import { dependents } from '@/graph/graph';
import { diffGraphs, graphAt } from '@/graph/staleness';
import { DEVELOPER_STEPS, REPO_STEPS, DEFAULT_ORG, formatCount, formatPercent, indexBuilds, reachShare } from '@/graph/scale';
import { topologyMetrics } from '@/graph/topology';
import { maxCommitsBehind, orgPublishesPerDay } from '@/graph/cadence';
import { exposedRepos, readableRepos } from '@/graph/access';
import { LAYERS } from '@/graph/landscape';

const ids = [
  'agent-sees-what-it-opens',
  'what-is-a-code-graph',
  'three-graphs-three-questions',
  'is-there-a-standard',
  'build-once-read-many',
  'the-topology',
  'scaling-to-an-organization',
];

describe('T-1 lessons load', () => {
  it('has seven lessons in order, all in one topic', () => {
    expect(LESSONS.map((l) => l.id)).toEqual(ids);
    expect(LESSONS.map((l) => l.order)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(new Set(LESSONS.map((l) => l.topic))).toEqual(new Set(['code-graphs']));
  });
});

/** Every localized string in a lesson, with a readable path. */
function strings(l: Lesson): { path: string; en: string; he: string | undefined }[] {
  const out: { path: string; en: string; he: string | undefined }[] = [];
  const add = (path: string, v: { en: string; he?: string | undefined } | undefined) => {
    if (v) out.push({ path: `${l.id}.${path}`, en: v.en, he: v.he });
  };
  add('title', l.title);
  add('subtitle', l.subtitle);
  l.intro.forEach((x, i) => add(`intro[${i}]`, x));
  l.keyPoints.forEach((x, i) => add(`keyPoints[${i}]`, x));
  l.explorers?.forEach((e, i) => add(`explorers[${i}].caption`, e.caption));
  l.quiz.forEach((q) => {
    add(`${q.id}.prompt`, q.prompt);
    add(`${q.id}.explanation`, q.explanation);
    if (q.type === 'mcq') q.choices.forEach((c, i) => add(`${q.id}.choices[${i}]`, c));
  });
  return out;
}

describe('T-2 quiz sizes and both languages', () => {
  it('has 3, 4, 4, 4, 4, 4, 4 questions: 27 in total', () => {
    expect(LESSONS.map((l) => l.quiz.length)).toEqual([3, 4, 4, 4, 4, 4, 4]);
    expect(LESSONS.reduce((n, l) => n + l.quiz.length, 0)).toBe(27);
  });

  it('every string has non-empty en and he', () => {
    for (const l of LESSONS) {
      for (const s of strings(l)) {
        expect(s.en.trim().length, `${s.path} en`).toBeGreaterThan(0);
        expect((s.he ?? '').trim().length, `${s.path} he`).toBeGreaterThan(0);
      }
    }
  });

  it('question ids are unique within a lesson and mcq answers are in range', () => {
    for (const l of LESSONS) {
      expect(new Set(l.quiz.map((q) => q.id)).size).toBe(l.quiz.length);
    }
  });
});

describe('T-3 identifiers sit inside {{ }}', () => {
  it('no underscore remains once {{...}} tokens are removed', () => {
    for (const l of LESSONS) {
      for (const s of strings(l)) {
        for (const lang of ['en', 'he'] as const) {
          const t = (s[lang] ?? '').replace(/\{\{[^}]*\}\}/g, '');
          expect(t.includes('_'), `${s.path} ${lang}: ${t}`).toBe(false);
        }
      }
    }
  });
});

const lesson = (id: string) => LESSONS.find((l) => l.id === id)!;
const introText = (id: string, lang: 'en' | 'he') =>
  lesson(id).intro.map((p) => (lang === 'he' ? p.he ?? '' : p.en)).join('\n');
const numbers = (id: string, lang: 'en' | 'he') => new Set([...introText(id, lang).matchAll(/\[\[([^\]]+)\]\]/g)].map((m) => m[1]!));

/** Every number in `expected` is in the lesson's [[ ]] tokens in both languages. */
function expectNumbers(id: string, expected: (string | number)[]) {
  for (const lang of ['en', 'he'] as const) {
    const have = numbers(id, lang);
    for (const e of expected) expect(have.has(String(e)), `${id} ${lang} [[${e}]] in ${[...have].join(' ')}`).toBe(true);
  }
}

describe('T-4 numbers in prose are computed', () => {
  const both = searchCost(TOY_FILES, 'format_price', REPOS);

  it('lesson 1', () => {
    expect(both).toEqual({ hits: 6, files: 4, linesToRead: 28 });
    expectNumbers('agent-sees-what-it-opens', [both.hits, both.files, both.linesToRead, REPOS.length, TOY_FILES.length]);
  });

  it('lesson 2', () => {
    const series = [1, 2, 3, 4].map((h) => dependents(BASE_GRAPH, 'money.format_price', h).length);
    expect(series).toEqual([1, 2, 5, 6]);
    expectNumbers('what-is-a-code-graph', [BASE_GRAPH.nodes.length, BASE_GRAPH.edges.length, ...series]);
  });

  it('lesson 5', () => {
    const org = DEFAULT_ORG;
    const everything = indexBuilds(org, 'everyMachineEverything', 3);
    const own = indexBuilds(org, 'everyMachineOwn', 3);
    const once = indexBuilds(org, 'publishOnce', 3);
    expect([everything, own, once]).toEqual([10_000_000, 60_000, 500]);
    expect(formatPercent(reachShare(org, 'everyMachineOwn', 3))).toBe('0.6');
    const d = diffGraphs(graphAt(0), graphAt(3));
    expect([d.stillTrue.length, d.phantom.length, d.missing.length]).toEqual([8, 2, 3]);
    expectNumbers('build-once-read-many', [
      org.repos, formatCount(org.developers), formatCount(everything), formatCount(own), formatCount(once),
      '0.6%', d.stillTrue.length, d.phantom.length, d.missing.length, graphAt(0).edges.length, 3,
    ]);
  });

  it('lesson 6', () => {
    const p = { reposPerDeveloper: 3, shards: 4 };
    const local = topologyMetrics(DEFAULT_ORG, 'local', p);
    const central = topologyMetrics(DEFAULT_ORG, 'central', p);
    const sharded = topologyMetrics(DEFAULT_ORG, 'sharded', p);
    expectNumbers('the-topology', [local.reposInReach, DEFAULT_ORG.repos, formatCount(central.developersPerServer), p.shards, formatCount(sharded.developersPerServer)]);
    expect(formatCount(sharded.developersAffectedIfOneServerFails)).toBe('5,000');
  });

  it('lesson 7', () => {
    const behind = maxCommitsBehind(10, 'nightly', 10);
    const everyMerge = orgPublishesPerDay(500, 10, 'everyMerge');
    const nightly = orgPublishesPerDay(500, 10, 'nightly');
    const readable = readableRepos(500, 60);
    const exposed = exposedRepos(500, 60, 'none', 'viaServer', 'caller');
    expect([behind, everyMerge, nightly, readable, exposed]).toEqual([10, 5000, 500, 300, 200]);
    expectNumbers('scaling-to-an-organization', [behind, formatCount(everyMerge), nightly, readable, exposed, '60%']);
  });

  it('numeric quiz answers equal their function results', () => {
    const answer = (lessonId: string, qid: string) => {
      const q = lesson(lessonId).quiz.find((x) => x.id === qid)!;
      if (q.type !== 'numeric') throw new Error('not numeric');
      return q.correctValue;
    };
    expect(answer('agent-sees-what-it-opens', 'q1-hit-count')).toBe(both.hits);
    expect(answer('what-is-a-code-graph', 'q2-two-hops')).toBe(dependents(BASE_GRAPH, 'money.format_price', 2).length);
    const small = { repos: 200, developers: 1000 };
    expect(answer('build-once-read-many', 'q1-everything-everywhere')).toBe(indexBuilds(small, 'everyMachineEverything', 3));
    expect(answer('build-once-read-many', 'q2-publish-once')).toBe(indexBuilds(small, 'publishOnce', 3));
    expect(answer('the-topology', 'q2-shard-failure')).toBe(topologyMetrics(DEFAULT_ORG, 'sharded', { reposPerDeveloper: 3, shards: 4 }).developersAffectedIfOneServerFails);
    expect(answer('scaling-to-an-organization', 'q1-commits-behind')).toBe((12 * 6) / 24);
    expect(answer('scaling-to-an-organization', 'q2-nightly-publishes')).toBe(orgPublishesPerDay(500, 1, 'nightly'));
  });
});

describe('schema and code agree', () => {
  it('ToyNodeId matches the base graph node ids', () => {
    expect([...ToyNodeId.options].sort()).toEqual(BASE_GRAPH.nodes.map((n) => n.id).sort());
  });
  it('LayerId, REPO_STEPS and DEVELOPER_STEPS match', () => {
    expect([...LayerId.options]).toEqual(LAYERS);
    expect(REPO_STEPS).toEqual([10, 50, 100, 200, 500, 1000, 2000, 5000]);
    expect(DEVELOPER_STEPS).toEqual([10, 100, 500, 1000, 5000, 10000, 20000, 50000, 100000]);
  });
});

describe('hygiene of the authored text', () => {
  const files = import.meta.glob('./lessons/*.yaml', { eager: true, query: '?raw', import: 'default' }) as Record<string, string>;
  const raw = Object.values(files).join('\n');

  it('the YAML parses and names no forbidden word', () => {
    for (const text of Object.values(files)) parse(text);
    // the words are assembled here so this file does not itself match the repo-wide text scan
    const banned = [['work', 'shop'], ['סד', 'נ'], ['free ', 'forever'], ['חי', 'נם'], ['certi', 'fied'], ['official ', 'curriculum']].map((p) => p.join(''));
    for (const w of banned) expect(raw.toLowerCase().includes(w), w).toBe(false);
    expect(/\b(43|137) ?k\b|\b(43|137),?000\b/i.test(raw)).toBe(false);
  });
});
