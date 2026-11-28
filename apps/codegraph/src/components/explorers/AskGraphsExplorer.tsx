import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { clsx } from 'clsx';
import { pick, type Locale } from '@/content/localize';
import type { ExplorerConfig } from '@/content/schema';
import { BASE_GRAPH, REPOS, TOY_FILES, nodeById } from '@/graph/toy';
import { searchCost, relevantHits, searchText, TERM_QUESTION, type QuestionId } from '@/graph/search';
import { answer, truth, type GraphKind, type Verdict } from '@/graph/answers';
import { nodeLabel } from '@/graph/graph';
import { Card } from '@/components/ui/Card';
import { Icon, type IconName } from '@/components/ui/Icon';
import { Ident } from '@/components/Ident';
import { Caption, Segmented, Switch } from './controls';
import { OrgNote } from './OrgNote';

const ORDER: QuestionId[] = ['callees', 'callers', 'fieldReaders'];
const QNAME: Record<QuestionId, 'structure' | 'identity' | 'interface'> = { callees: 'structure', callers: 'identity', fieldReaders: 'interface' };
const TERM: Record<QuestionId, string> = { callers: 'format_price', callees: 'get_order', fieldReaders: 'total_price' };
const KINDS: GraphKind[] = ['syntax', 'index', 'contract'];

const VERDICT: Record<Verdict, { icon: IconName; cls: string }> = {
  // the word stays in --ink (4.5:1 on the soft tints); the icon and the tint carry the colour
  right: { icon: 'check', cls: 'bg-good-soft text-ink [&_svg]:text-good' },
  imprecise: { icon: 'approx', cls: 'bg-highlight-soft text-ink [&_svg]:text-highlight' },
  blind: { icon: 'emptyCircle', cls: 'bg-surface-3 text-ink border border-line-strong' },
  unavailable: { icon: 'pause', cls: 'bg-critical-soft text-ink [&_svg]:text-critical' },
};

/** The one-sentence reason, chosen by (question, kind, verdict) from the locale table. */
function whyKey(q: QuestionId, kind: GraphKind, verdict: Verdict): string {
  if (verdict === 'unavailable') return 'explorer.ask.why.index.unavailable';
  if (kind === 'contract') return verdict === 'right' ? 'explorer.ask.why.contract.fieldReaders.right' : 'explorer.ask.why.contract.blind';
  return `explorer.ask.why.${kind}.${q}.${verdict}`;
}

export function AskGraphsExplorer({ config, locale }: { config: Extract<ExplorerConfig, { kind: 'askGraphs' }>; locale: Locale }) {
  const { t } = useTranslation();
  const [q, setQ] = useState<QuestionId>(config.question);
  const [broken, setBroken] = useState(false);
  const [here, setHere] = useState(true);
  const visible = here ? REPOS : REPOS.slice(0, 1);
  const term = TERM[q];
  const cost = searchCost(TOY_FILES, term, visible);
  const rel = relevantHits(TERM_QUESTION[term]!, searchText(TOY_FILES, term, visible), term);
  const name = (id: string) => {
    const n = nodeById(BASE_GRAPH, id);
    return n ? nodeLabel(n) : id;
  };

  return (
    <Card variant="bench" className="space-y-4">
      <Caption text={config.caption ? pick(config.caption, locale) : ''} />
      <Segmented
        label={t(`explorer.question.${q}`)}
        value={q}
        onChange={setQ}
        options={ORDER.map((id) => ({ id, label: t(`explorer.ask.${QNAME[id]}`) }))}
      />
      <p className="text-[16px] font-semibold text-ink"><Ident text={t(`explorer.question.${q}`)} /></p>
      <div className="flex flex-wrap gap-x-5 gap-y-0">
        <Switch label={t('explorer.ask.buildBroken')} checked={broken} onChange={setBroken} />
        <Switch label={<Ident text={t('explorer.common.webShopHere')} />} checked={here} onChange={setHere} />
      </div>
      <p className="text-[12.5px] text-muted">{t('explorer.ask.publishedNote')}</p>

      <div className="grid gap-3 grid-cols-1 min-[420px]:grid-cols-2 min-[900px]:grid-cols-4" data-answer-grid>
        <div className="elev-0 p-3 space-y-2" data-col="search">
          <h3 className="text-[15px] font-bold text-ink">{t('explorer.ask.col.search')}</h3>
          <p className="text-[12.5px] text-ink-2">{t('explorer.ask.built.search')}</p>
          <p className="text-[14px] text-ink"><Ident text={t('explorer.ask.searchLine', { relevant: rel.length, hits: cost.hits, files: cost.files })} /></p>
        </div>
        {KINDS.map((kind) => {
          const a = answer(q, kind, BASE_GRAPH, { buildBroken: broken });
          const v = VERDICT[a.verdict];
          return (
            <div key={kind} className="elev-0 p-3 space-y-2" data-col={kind}>
              <h3 className="text-[15px] font-bold text-ink">{t(`explorer.ask.col.${kind}`)}</h3>
              <p className="text-[12.5px] text-ink-2">{t(`explorer.ask.built.${kind}`)}</p>
              <span className={clsx('inline-flex items-center gap-1.5 rounded-pill px-2.5 h-7 text-[13px] font-semibold', v.cls)}>
                <Icon name={v.icon} size={14} /> {t(`explorer.verdict.${a.verdict}`)}
              </span>
              <div className="flex flex-wrap gap-1.5 min-h-7">
                {a.items.map((id) => <span key={id} className="sci text-[12.5px]">{kind === 'syntax' && q === 'callees' ? id : name(id)}</span>)}
              </div>
              <p className="text-[13px] text-ink-2"><Ident text={t(whyKey(q, kind, a.verdict))} /></p>
            </div>
          );
        })}
      </div>
      <div className="rounded-[12px] bg-accent-soft px-4 py-3 text-[14.5px] text-ink flex flex-wrap items-center gap-2">
        <span className="font-semibold">{t('explorer.ask.truth')}</span>
        {truth(q, BASE_GRAPH).map((id) => <span key={id} className="sci">{name(id)}</span>)}
      </div>
      <OrgNote className="sr-only" />
    </Card>
  );
}
