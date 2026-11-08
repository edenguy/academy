import { z } from 'zod';

/**
 * Content model for Physics Academy.
 *
 * Lesson text is authored in YAML (one file per lesson, `src/content/lessons/*.yaml`),
 * never hand-edited as code, and validated against these schemas at load time — an
 * authoring mistake (a typo'd scenario id, a missing translation) fails a test rather than
 * breaking silently at runtime. English is the required fallback; Hebrew is what learners
 * actually see first (see `i18n/index.ts`'s `DEFAULT_LOCALE`).
 *
 * `scripts/export-lessons.mjs` reads the same YAML files directly (not through this schema)
 * to produce a Markdown review copy — see that script and the root README for the
 * specialist-review round trip.
 */

export const LocalizedString = z.object({ en: z.string(), he: z.string().optional() });
export type LocalizedString = z.infer<typeof LocalizedString>;

export const ScenarioId = z.enum(['constant', 'easeInOut', 'oscillate', 'quadratic']);
export type ScenarioId = z.infer<typeof ScenarioId>;

/** Lesson 1 — drag a handle along a position-vs-time curve, flip between scenarios. */
export const ScrubberExplorerConfig = z
  .object({
    kind: z.literal('scrubber'),
    scenarios: z.array(ScenarioId).min(1),
    initialScenario: ScenarioId,
    caption: LocalizedString.optional(),
  })
  .strict();
export type ScrubberExplorerConfig = z.infer<typeof ScrubberExplorerConfig>;

/** Lesson 2 — drag two handles (t1, t2) on a curve; the secant collapses into the tangent. */
export const SecantExplorerConfig = z
  .object({
    kind: z.literal('secant'),
    scenario: ScenarioId,
    initialT1: z.number(),
    initialT2: z.number(),
    caption: LocalizedString.optional(),
  })
  .strict()
  .refine((c) => c.initialT1 < c.initialT2, { message: 'initialT1 must be less than initialT2', path: ['initialT2'] });
export type SecantExplorerConfig = z.infer<typeof SecantExplorerConfig>;

/** Lesson 3 — drag a constant-acceleration slider; rectangles under v(t) build toward ½at². */
export const AccelAreaExplorerConfig = z
  .object({
    kind: z.literal('accelArea'),
    minA: z.number(),
    maxA: z.number(),
    initialA: z.number(),
    duration: z.number().positive(),
    initialN: z.number().int().min(1).max(200),
    caption: LocalizedString.optional(),
  })
  .strict()
  .refine((c) => c.minA < c.maxA, { message: 'minA must be less than maxA', path: ['maxA'] })
  .refine((c) => c.initialA >= c.minA && c.initialA <= c.maxA, { message: 'initialA must be within [minA, maxA]', path: ['initialA'] });
export type AccelAreaExplorerConfig = z.infer<typeof AccelAreaExplorerConfig>;

export const ExplorerConfig = z.discriminatedUnion('kind', [ScrubberExplorerConfig, SecantExplorerConfig, AccelAreaExplorerConfig]);
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
