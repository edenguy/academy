import { z } from 'zod';

/**
 * Content model for Chemistry Academy.
 *
 * Lesson text is authored in YAML (one file per lesson, `src/content/lessons/*.yaml`),
 * never hand-edited as code, and validated against these schemas at load time.
 * English is the required fallback; Hebrew is what learners see first.
 */

export const LocalizedString = z.object({ en: z.string(), he: z.string().optional() });
export type LocalizedString = z.infer<typeof LocalizedString>;

export const TopicId = z.enum(['structure-and-bonding']);
export type TopicId = z.infer<typeof TopicId>;

export const IonPairId = z.enum(['na-cl', 'mg-cl']);
export const SampleState = z.enum(['solid', 'melt', 'solution']);
export const BondOrder = z.union([z.literal(1), z.literal(2), z.literal(3)]);
export const Arrangement = z.enum(['molecular', 'network']);
export const MaterialId = z.enum(['ionic', 'molecular', 'metallic', 'network']);
export const ProbeId = z.enum(['conductSolid', 'conductMelt', 'dissolve', 'meltEasy']);

export const IonTransferConfig = z
  .object({
    kind: z.literal('ionTransfer'),
    pair: IonPairId,
    state: SampleState,
    caption: LocalizedString.optional(),
  })
  .strict();

export const SharedPairsConfig = z
  .object({
    kind: z.literal('sharedPairs'),
    order: BondOrder,
    arrangement: Arrangement,
    caption: LocalizedString.optional(),
  })
  .strict();

export const DipoleConfig = z
  .object({
    kind: z.literal('dipole'),
    angle: z.number().min(0).max(180),
    caption: LocalizedString.optional(),
  })
  .strict();

export const ElectronSeaConfig = z
  .object({
    kind: z.literal('electronSea'),
    shear: z.number().min(0).max(1),
    drift: z.number().min(0).max(1),
    caption: LocalizedString.optional(),
  })
  .strict();

export const WaterPairConfig = z
  .object({
    kind: z.literal('waterPair'),
    x: z.number(),
    y: z.number(),
    rotation: z.number(),
    caption: LocalizedString.optional(),
  })
  .strict();

export const MaterialProbeConfig = z
  .object({
    kind: z.literal('materialProbe'),
    material: MaterialId,
    probe: ProbeId,
    caption: LocalizedString.optional(),
  })
  .strict();

export const ExplorerConfig = z.discriminatedUnion('kind', [
  IonTransferConfig,
  SharedPairsConfig,
  DipoleConfig,
  ElectronSeaConfig,
  WaterPairConfig,
  MaterialProbeConfig,
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
