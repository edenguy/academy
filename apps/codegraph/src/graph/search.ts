import { OCCURRENCES, type Occurrence, type RepoId, type ToyFile } from './toy';

/** Text search and the agent's steps (CODEGRAPH_LLD.md section 4.2). */

export interface Hit {
  file: string;
  line: number;
  text: string;
}

/** Case-sensitive substring match per line; files in array order, lines ascending. */
export function searchText(files: ToyFile[], term: string, visible: RepoId[]): Hit[] {
  const hits: Hit[] = [];
  for (const f of files) {
    if (!visible.includes(f.repo)) continue;
    f.lines.forEach((text, i) => {
      if (text.includes(term)) hits.push({ file: f.id, line: i + 1, text });
    });
  }
  return hits;
}

/** linesToRead = sum of lines.length over the distinct files that have a hit. */
export function searchCost(files: ToyFile[], term: string, visible: RepoId[]): { hits: number; files: number; linesToRead: number } {
  const hits = searchText(files, term, visible);
  const ids = new Set(hits.map((h) => h.file));
  const linesToRead = files.filter((f) => ids.has(f.id)).reduce((n, f) => n + f.lines.length, 0);
  return { hits: hits.length, files: ids.size, linesToRead };
}

/** Looks the hit up in OCCURRENCES (the ground truth). Throws if the data is inconsistent. */
export function classifyHit(hit: Hit, term: string): Occurrence {
  const o = OCCURRENCES.find((x) => x.file === hit.file && x.line === hit.line && x.name === term);
  if (!o) throw new Error(`No occurrence for ${term} at ${hit.file}:${hit.line}`);
  return o;
}

export type QuestionId = 'callers' | 'callees' | 'fieldReaders';

export const TERM_QUESTION: Record<string, QuestionId> = {
  format_price: 'callers',
  get_order: 'callees',
  total_price: 'fieldReaders',
};

/**
 * Which hits actually answer the question.
 * callers: a call that resolves to money.format_price. callees: none (the answer is in the body,
 * not on the definition line). fieldReaders: a read of field.total_price.
 */
export function relevantHits(q: QuestionId, hits: Hit[], term?: string): Hit[] {
  const t = term ?? Object.keys(TERM_QUESTION).find((k) => TERM_QUESTION[k] === q) ?? '';
  return hits.filter((h) => {
    const o = classifyHit(h, t);
    if (q === 'callers') return o.role === 'call' && o.target === 'money.format_price';
    if (q === 'fieldReaders') return o.role === 'fieldRead' && o.target === 'field.total_price';
    return false;
  });
}

export interface AgentStep {
  kind: 'ask' | 'search' | 'open';
  file?: string;
  hitsSoFar: number;
  filesOpened: number;
  linesRead: number;
}

/** Step 0 ask; step 1 search; then one open per distinct file with a hit, in file order. */
export function agentSteps(files: ToyFile[], term: string, visible: RepoId[]): AgentStep[] {
  const hits = searchText(files, term, visible);
  const ids = new Set(hits.map((h) => h.file));
  const steps: AgentStep[] = [
    { kind: 'ask', hitsSoFar: 0, filesOpened: 0, linesRead: 0 },
    { kind: 'search', hitsSoFar: hits.length, filesOpened: 0, linesRead: 0 },
  ];
  let opened = 0;
  let lines = 0;
  for (const f of files) {
    if (!ids.has(f.id)) continue;
    opened += 1;
    lines += f.lines.length;
    steps.push({ kind: 'open', file: f.id, hitsSoFar: hits.length, filesOpened: opened, linesRead: lines });
  }
  return steps;
}
