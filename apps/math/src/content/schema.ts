import { z } from 'zod';

/**
 * Content model for Math Academy.
 *
 * Lesson text is authored in YAML (one file per lesson, `src/content/lessons/*.yaml`),
 * never hand-edited as code, and validated against these schemas at load time — an
 * authoring mistake (a typo'd function id, a missing translation) fails a test rather than
 * breaking silently at runtime. English is the required fallback; Hebrew is what learners
 * actually see first (see `i18n/index.ts`'s `DEFAULT_LOCALE`).
 *
 * `scripts/export-lessons.mjs` reads the same YAML files directly (not through this schema)
 * to produce a Markdown review copy — see that script and the root README for the
 * specialist-review round trip.
 */

export const LocalizedString = z.object({ en: z.string(), he: z.string().optional() });
export type LocalizedString = z.infer<typeof LocalizedString>;

/** The subject's topics (CLAUDE.md's topic-first structure — see content/topics.ts). */
export const TopicId = z.enum(['integrals', 'derivatives']);
export type TopicId = z.infer<typeof TopicId>;

export const FunctionId = z.enum(['line', 'parabola', 'cubic']);
export type FunctionId = z.infer<typeof FunctionId>;

export const SumMode = z.enum(['left', 'right', 'midpoint']);
export type SumMode = z.infer<typeof SumMode>;

/** Lesson "area under the curve" — props for <IntegralExplorer>. */
export const IntegralExplorerConfig = z
  .object({
    kind: z.literal('integral'),
    fn: FunctionId,
    a: z.number(),
    b: z.number(),
    initialN: z.number().int().min(1).max(200),
    modes: z.array(SumMode).min(1),
    caption: LocalizedString.optional(),
  })
  .strict()
  .refine((c) => c.a < c.b, { message: 'a must be less than b', path: ['b'] });
export type IntegralExplorerConfig = z.infer<typeof IntegralExplorerConfig>;

export const CurveId = z.enum(['quadratic', 'cubicWave']);
export type CurveId = z.infer<typeof CurveId>;

/** Derivatives lesson 1 — drag two handles (x1, x2) on a curve; the secant collapses into the tangent. */
export const SecantExplorerConfig = z
  .object({
    kind: z.literal('secant'),
    curve: CurveId,
    initialX1: z.number(),
    initialX2: z.number(),
    caption: LocalizedString.optional(),
  })
  .strict()
  .refine((c) => c.initialX1 < c.initialX2, { message: 'initialX1 must be less than initialX2', path: ['initialX2'] });
export type SecantExplorerConfig = z.infer<typeof SecantExplorerConfig>;

/** Derivatives lesson 2 — adjust a single power term (coeff·x^power) and watch f and f' respond. */
export const PowerRuleExplorerConfig = z
  .object({
    kind: z.literal('powerRule'),
    initialPower: z.number(),
    initialCoeff: z.number(),
    caption: LocalizedString.optional(),
  })
  .strict();
export type PowerRuleExplorerConfig = z.infer<typeof PowerRuleExplorerConfig>;

/** Derivatives lesson 3 — drag along a curve; f'(x)'s sign shows where f rises/falls, and marks extrema. */
export const ExtremumExplorerConfig = z
  .object({
    kind: z.literal('extremum'),
    curve: CurveId,
    initialX: z.number(),
    caption: LocalizedString.optional(),
  })
  .strict();
export type ExtremumExplorerConfig = z.infer<typeof ExtremumExplorerConfig>;

export const ExplorerConfig = z.discriminatedUnion('kind', [
  IntegralExplorerConfig,
  SecantExplorerConfig,
  PowerRuleExplorerConfig,
  ExtremumExplorerConfig,
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
  .refine((q) => q.correctIndex < q.choices.length, { message: 'correctIndex must index an existing choice', path: ['correctIndex'] });
export type McqQuestion = z.infer<typeof McqQuestion>;

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
export type NumericQuestion = z.infer<typeof NumericQuestion>;

export const Question = z.discriminatedUnion('type', [McqQuestion, NumericQuestion]);
export type Question = z.infer<typeof Question>;

export const Lesson = z
  .object({
    id: z.string(),
    /** Which topic this lesson belongs to — see content/topics.ts for the topic's own metadata. */
    topic: TopicId,
    /** Order within its topic (not across topics — see content/index.ts's lessonNeighbors). */
    order: z.number().int(),
    title: LocalizedString,
    subtitle: LocalizedString,
    /** Narrative paragraphs, in reading order. Supports the `Rich` inline markup. */
    intro: z.array(LocalizedString).min(1),
    /** Interactive explorers shown after the intro, in order; a lesson may show more than one. */
    explorers: z.array(ExplorerConfig).optional(),
    keyPoints: z.array(LocalizedString).min(1),
    quiz: z.array(Question).min(1),
  })
  .strict();
export type Lesson = z.infer<typeof Lesson>;
