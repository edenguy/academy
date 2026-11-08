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

export const FunctionId = z.enum(['line', 'parabola', 'cubic']);
export type FunctionId = z.infer<typeof FunctionId>;

export const SumMode = z.enum(['left', 'right', 'midpoint']);
export type SumMode = z.infer<typeof SumMode>;

/** Props for the <IntegralExplorer>, validated so a bad bound can't reach the component. */
export const ExplorerConfig = z
  .object({
    fn: FunctionId,
    a: z.number(),
    b: z.number(),
    initialN: z.number().int().min(1).max(200),
    modes: z.array(SumMode).min(1),
    caption: LocalizedString.optional(),
  })
  .strict()
  .refine((c) => c.a < c.b, { message: 'a must be less than b', path: ['b'] });
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
