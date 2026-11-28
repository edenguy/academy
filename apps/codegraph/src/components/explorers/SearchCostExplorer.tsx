import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { pick, type Locale } from '@/content/localize';
import type { ExplorerConfig } from '@/content/schema';
import { BASE_GRAPH, REPOS, SEARCH_TERMS, TOY_FILES, nodeById, type SearchTerm, type ToyFile } from '@/graph/toy';
import { agentSteps, classifyHit, relevantHits, searchText, TERM_QUESTION } from '@/graph/search';
import { truth } from '@/graph/answers';
import { nodeLabel } from '@/graph/graph';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { Ident } from '@/components/Ident';
import { Caption, Readout, Segmented, SliderField, Switch } from './controls';

function FilePanel({
  file, opened, showHits, hitRoles, relevant,
}: {
  file: ToyFile;
  opened: boolean;
  showHits: boolean;
  hitRoles: Map<number, { label: string; answer: boolean }>;
  relevant: Set<number>;
}) {
  const { t } = useTranslation();
  // collapse runs of non-hit lines into one row until the file is opened
  const rows: ({ kind: 'line'; n: number; text: string } | { kind: 'gap'; count: number })[] = [];
  let gap = 0;
  file.lines.forEach((text, i) => {
    const n = i + 1;
    const isHit = hitRoles.has(n);
    if (opened || (showHits && isHit)) {
      if (gap) rows.push({ kind: 'gap', count: gap });
      gap = 0;
      rows.push({ kind: 'line', n, text });
    } else gap += 1;
  });
  if (gap) rows.push({ kind: 'gap', count: gap });

  return (
    <div className="elev-0 overflow-hidden" data-file={file.id}>
      <div className="px-3 py-1.5 border-b border-line text-[13px] flex items-center gap-2">
        <span className="sci">{file.path}</span>
        {opened && <span className="text-[12.5px] text-muted ms-auto">{file.lines.length}</span>}
      </div>
      <div className="overflow-x-auto" style={{ direction: 'ltr' }}>
        <div className="py-1 min-w-max">
          {rows.map((r, i) =>
            r.kind === 'gap' ? (
              <div key={`g${i}`} className="px-3 py-0.5 text-[12.5px] text-muted" style={{ direction: 'inherit' }}>
                <span style={{ direction: document.documentElement.dir === 'rtl' ? 'rtl' : 'ltr' }} className="inline-block">
                  {t('explorer.search.collapsed', { n: r.count })}
                </span>
              </div>
            ) : (
              <div key={r.n} className={'flex items-start gap-3 px-3 font-mono text-[13px] leading-[1.7] ' + (hitRoles.has(r.n) ? 'bg-highlight-soft' : '')}>
                <span className="w-5 shrink-0 text-end text-muted select-none">{r.n}</span>
                <span className="whitespace-pre">{r.text || ' '}</span>
                {opened && hitRoles.has(r.n) && (
                  <span className="ms-auto ps-3 flex items-center gap-1.5 shrink-0 font-sans text-[12px]">
                    <span className="rounded-pill bg-surface-3 text-ink px-2 leading-5">{hitRoles.get(r.n)!.label}</span>
                    {relevant.has(r.n) && (
                      <span className="rounded-pill bg-good-soft text-ink px-2 leading-5 inline-flex items-center gap-1">
                        <Icon name="check" size={12} className="text-good" /> {t('explorer.role.answer')}
                      </span>
                    )}
                  </span>
                )}
              </div>
            ),
          )}
        </div>
      </div>
    </div>
  );
}

export function SearchCostExplorer({ config, locale }: { config: Extract<ExplorerConfig, { kind: 'searchCost' }>; locale: Locale }) {
  const { t } = useTranslation();
  const [term, setTerm] = useState<SearchTerm>(config.term);
  const [here, setHere] = useState(config.bothRepos);
  const [step, setStep] = useState(0);
  const visible = here ? REPOS : REPOS.slice(0, 1);
  const q = TERM_QUESTION[term]!;
  const steps = agentSteps(TOY_FILES, term, visible);
  const idx = Math.min(step, steps.length - 1);
  const cur = steps[idx]!;
  const hits = searchText(TOY_FILES, term, visible);
  const rel = relevantHits(q, hits, term);
  const relKeys = new Set(rel.map((h) => `${h.file}:${h.line}`));
  const searched = idx >= 1;
  const openedFiles = new Set(steps.slice(0, idx + 1).filter((s) => s.kind === 'open').map((s) => s.file!));
  const filesWithHits = new Set(hits.map((h) => h.file));

  const roleLabel = (file: string, line: number) => {
    const o = classifyHit({ file, line, text: '' }, term);
    if (o.role === 'call' && q === 'callers' && o.target !== 'money.format_price') return t('explorer.role.otherTarget');
    return t(`explorer.role.${o.role}`);
  };

  const reset = () => setStep(0);
  const stepText =
    cur.kind === 'ask'
      ? t('explorer.search.stepAsk')
      : cur.kind === 'search'
        ? t('explorer.search.stepSearch', { hits: hits.length, files: filesWithHits.size })
        : t('explorer.search.stepOpen', { file: TOY_FILES.find((f) => f.id === cur.file)!.path, lines: cur.linesRead });
  const answer = truth(q, BASE_GRAPH);

  return (
    <Card variant="bench" className="space-y-4">
      <Caption text={config.caption ? pick(config.caption, locale) : ''} />
      <p className="text-[16px] font-semibold text-ink">
        <Ident text={t(`explorer.question.${q}`)} />
      </p>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
        <Segmented
          label={t(`explorer.question.${q}`)}
          value={term}
          onChange={(v) => { setTerm(v); reset(); }}
          options={SEARCH_TERMS.map((s) => ({ id: s, label: <span className="font-mono text-[13px]" dir="ltr">{s}</span> }))}
        />
        <Switch label={<Ident text={t('explorer.common.webShopHere')} />} checked={here} onChange={(v) => { setHere(v); reset(); }} />
      </div>
      <div className="flex flex-wrap gap-2">
        <Readout label={t('explorer.search.hits')} value={searched ? hits.length : '–'} />
        <Readout label={t('explorer.search.filesOpened')} value={cur.filesOpened} />
        <Readout label={t('explorer.search.linesRead')} value={cur.linesRead} />
        <Readout label={t('explorer.search.linesAnswer')} value={searched ? rel.length : '–'} tone="good" />
      </div>
      <SliderField id="agent-step" label={t('explorer.search.step')} min={0} max={steps.length - 1} value={idx} onChange={setStep} display={`${idx + 1}/${steps.length}`} />
      <p className="text-[14.5px] text-ink-2 min-h-[2.8em]" aria-live="polite"><Ident text={stepText} /></p>
      <div className="grid gap-3 min-[720px]:grid-cols-2">
        {TOY_FILES.filter((f) => visible.includes(f.repo)).map((f) => {
          const roles = new Map<number, { label: string; answer: boolean }>();
          for (const h of hits.filter((x) => x.file === f.id)) roles.set(h.line, { label: roleLabel(f.id, h.line), answer: relKeys.has(`${h.file}:${h.line}`) });
          const rl = new Set([...relKeys].filter((k) => k.startsWith(f.id + ':')).map((k) => Number(k.split(':')[1])));
          return <FilePanel key={f.id} file={f} opened={openedFiles.has(f.id)} showHits={searched} hitRoles={roles} relevant={rl} />;
        })}
        {!here && (
          <div className="rounded-[12px] border border-dashed border-line-strong p-3 text-[13.5px] text-muted flex items-center gap-2" data-missing-repo>
            <Icon name="emptyCircle" size={18} />
            <span><span className="sci">web-shop</span> · {t('explorer.common.notOnMachine')}</span>
          </div>
        )}
      </div>
      <div className="rounded-[12px] bg-accent-soft px-4 py-3 text-[14.5px] text-ink flex flex-wrap items-center gap-2">
        <span className="font-semibold">{t('explorer.search.withGraph')}</span>
        {answer.map((id) => <span key={id} className="sci">{nodeLabel(nodeById(BASE_GRAPH, id)!)}</span>)}
      </div>
    </Card>
  );
}
