import { parse } from 'yaml';
import { Lesson, type Lesson as LessonT } from './schema';

// Every *.yaml under lessons/ is bundled as raw text and parsed+validated here, so an
// authoring mistake in the YAML (a bad function id, a mistyped field) fails immediately
// instead of reaching a learner. `scripts/export-lessons.mjs` reads the same files directly
// from disk (outside Vite) to produce the specialist-review Markdown copy.
const modules = import.meta.glob('./lessons/*.yaml', { eager: true, query: '?raw', import: 'default' }) as Record<string, string>;

export const LESSONS: LessonT[] = Object.entries(modules)
  .map(([path, raw]) => {
    const parsed = Lesson.safeParse(parse(raw));
    if (!parsed.success) {
      throw new Error(`Invalid lesson content in ${path}: ${parsed.error.message}`);
    }
    return parsed.data;
  })
  .sort((a, b) => a.order - b.order);

export function getLesson(id: string): LessonT | undefined {
  return LESSONS.find((l) => l.id === id);
}

/** Prev/next within the SAME topic only — a lesson never hands off into a different topic. */
export function lessonNeighbors(id: string): { prev: LessonT | undefined; next: LessonT | undefined } {
  const lesson = LESSONS.find((l) => l.id === id);
  if (!lesson) return { prev: undefined, next: undefined };
  const siblings = LESSONS.filter((l) => l.topic === lesson.topic);
  const i = siblings.findIndex((l) => l.id === id);
  return { prev: i > 0 ? siblings[i - 1] : undefined, next: i >= 0 && i < siblings.length - 1 ? siblings[i + 1] : undefined };
}

export function lessonsByTopic(topic: LessonT['topic']): LessonT[] {
  return LESSONS.filter((l) => l.topic === topic);
}
