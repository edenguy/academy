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

export function lessonNeighbors(id: string): { prev: LessonT | undefined; next: LessonT | undefined } {
  const i = LESSONS.findIndex((l) => l.id === id);
  return { prev: i > 0 ? LESSONS[i - 1] : undefined, next: i >= 0 && i < LESSONS.length - 1 ? LESSONS[i + 1] : undefined };
}
