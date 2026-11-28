import { z } from 'zod';

/**
 * Content model for Code Graph Academy.
 *
 * Lesson text is authored in YAML (one file per lesson, `src/content/lessons/*.yaml`),
 * never hand-edited as code, and validated against these schemas at load time.
 * English is the required fallback; Hebrew is what learners see first.
 * Explorer configs follow CODEGRAPH_LLD.md section 5.1.
 */

export const LocalizedString = z.object({ en: z.string(), he: z.string().optional() });
export type LocalizedString = z.infer<typeof LocalizedString>;

export const TopicId = z.enum(['code-graphs']);
export type TopicId = z.infer<typeof TopicId>;

const caption = LocalizedString.optional();
export const SearchTerm = z.enum(['format_price', 'get_order', 'total_price']);
export const QuestionId = z.enum(['callers', 'callees', 'fieldReaders']);
export const ToyNodeId = z.enum([
  'money.format_price', 'money.round_cents', 'legacy.format_price', 'legacy.export_csv',
  'api.get_order', 'api.load_order', 'web.renderOrderCard', 'web.fetchOrder',
  'endpoint.getOrder', 'field.id', 'field.total_price',
]);
export const LayerId = z.enum(['format', 'indexer', 'storage', 'serving', 'org']);
export const TopologyId = z.enum(['local', 'central', 'hybrid', 'sharded']);
export const CadenceId = z.enum(['everyMerge', 'hourly', 'nightly', 'weekly']);
export const CheckAt = z.enum(['none', 'server', 'registry', 'both']);
export const Repos = z.union([z.literal(10), z.literal(50), z.literal(100), z.literal(200), z.literal(500), z.literal(1000), z.literal(2000), z.literal(5000)]);
export const Developers = z.union([z.literal(10), z.literal(100), z.literal(500), z.literal(1000), z.literal(5000), z.literal(10000), z.literal(20000), z.literal(50000), z.literal(100000)]);

export const SearchCostConfig = z.object({ kind: z.literal('searchCost'), term: SearchTerm, bothRepos: z.boolean(), caption }).strict();
export const GraphViewConfig = z.object({ kind: z.literal('graphView'), start: ToyNodeId, hops: z.number().int().min(0).max(4), caption }).strict();
export const AskGraphsConfig = z.object({ kind: z.literal('askGraphs'), question: QuestionId, caption }).strict();
export const LandscapeConfig = z.object({ kind: z.literal('landscape'), layer: LayerId, caption }).strict();
export const ScaleConfig = z.object({ kind: z.literal('scale'), repos: Repos, developers: Developers, reposPerDeveloper: z.number().int().min(1).max(20), caption }).strict();
export const StalenessConfig = z
  .object({ kind: z.literal('staleness'), publishedAt: z.number().int().min(0).max(4), head: z.number().int().min(0).max(4), caption })
  .strict()
  .refine((c) => c.publishedAt <= c.head, { message: 'publishedAt must not be after head', path: ['publishedAt'] });
export const TopologyConfig = z.object({
  kind: z.literal('topology'), topology: TopologyId, repos: Repos, developers: Developers,
  reposPerDeveloper: z.number().int().min(1).max(20), shards: z.number().int().min(2).max(8), caption,
}).strict();
export const CadenceConfig = z.object({ kind: z.literal('cadence'), repos: Repos, commitsPerDay: z.number().int().min(0).max(50), cadence: CadenceId, caption }).strict();
export const AccessConfig = z.object({ kind: z.literal('access'), repos: Repos, readableShare: z.number().int().min(0).max(100).multipleOf(10), checkAt: CheckAt, caption }).strict();

export const ExplorerConfig = z.discriminatedUnion('kind', [
  SearchCostConfig, GraphViewConfig, AskGraphsConfig, LandscapeConfig, ScaleConfig,
  StalenessConfig, TopologyConfig, CadenceConfig, AccessConfig,
]);
export type ExplorerConfig = z.infer<typeof ExplorerConfig>;

export const McqQuestion = z
  .object({
    type: z.literal('mcq'),
    id: z.string(),
    prompt: LocalizedString,
    choices: z.array(LocalizedString).min(2),
    correctIndex: z.number().int().min(0),
    explanation: LocalizedString,
  })
  .strict()
  .refine((q) => q.correctIndex < q.choices.length, {
    message: 'correctIndex must index an existing choice',
    path: ['correctIndex'],
  });

export const NumericQuestion = z
  .object({
    type: z.literal('numeric'),
    id: z.string(),
    prompt: LocalizedString,
    correctValue: z.number(),
    tolerance: z.number().min(0),
    explanation: LocalizedString,
  })
  .strict();

export const Question = z.discriminatedUnion('type', [McqQuestion, NumericQuestion]);
export type Question = z.infer<typeof Question>;

export const Lesson = z
  .object({
    id: z.string(),
    topic: TopicId,
    order: z.number().int(),
    title: LocalizedString,
    subtitle: LocalizedString,
    intro: z.array(LocalizedString).min(1),
    explorers: z.array(ExplorerConfig).optional(),
    keyPoints: z.array(LocalizedString).min(1),
    quiz: z.array(Question).min(1),
  })
  .strict();
export type Lesson = z.infer<typeof Lesson>;
