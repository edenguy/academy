// Shared by export-lessons.mjs and export-pdf.mjs. Reads the authored YAML lesson files
// straight from disk (not through Vite/Zod — this is a plain review export, not the app
// build) and renders them as Markdown for a subject-matter specialist to read and correct.
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { parse } from 'yaml';

const __dirname = dirname(fileURLToPath(import.meta.url));
export const LESSONS_DIR = join(__dirname, '..', '..', 'src', 'content', 'lessons');

export function loadLessons() {
  const files = readdirSync(LESSONS_DIR).filter((f) => f.endsWith('.yaml'));
  const lessons = files.map((f) => parse(readFileSync(join(LESSONS_DIR, f), 'utf8')));
  lessons.sort((a, b) => a.order - b.order);
  return lessons;
}

/** {{expr}} -> `expr` (inline code, so a formula stands out); [[18]] -> 18 (plain, already emphasized by context). */
function toMarkdownInline(text) {
  return text.replace(/\{\{([^}]+)\}\}/g, '`$1`').replace(/\[\[([^\]]+)\]\]/g, '$1');
}

function pick(field, locale) {
  if (!field) return '';
  return (locale === 'he' ? field.he : undefined) ?? field.en ?? '';
}

const CHOICE_LETTERS = ['a', 'b', 'c', 'd', 'e', 'f'];

function renderQuestion(q, locale, index) {
  const lines = [`${index + 1}. **${pick(q.prompt, locale)}**`];
  if (q.type === 'mcq') {
    q.choices.forEach((choice, i) => {
      const letter = CHOICE_LETTERS[i] ?? String(i + 1);
      const mark = i === q.correctIndex ? ' ✅' : '';
      lines.push(`   - (${letter}) ${toMarkdownInline(pick(choice, locale))}${mark}`);
    });
  } else {
    lines.push(`   - Correct value: **${q.correctValue}** (± ${q.tolerance})`);
  }
  lines.push(`   - _Explanation:_ ${toMarkdownInline(pick(q.explanation, locale))}`);
  return lines.join('\n');
}

const EXPLORER_LABEL = { line: 'f(x) = x', parabola: 'f(x) = x²', cubic: 'f(x) = x³' };

function renderExplorer(e, locale) {
  const caption = e.caption ? ` — ${toMarkdownInline(pick(e.caption, locale))}` : '';
  return `> 🖩 *Interactive explorer:* \`${EXPLORER_LABEL[e.fn] ?? e.fn}\` on [${e.a}, ${e.b}]${caption}`;
}

export function renderLessonMarkdown(lesson, locale, index) {
  const parts = [
    `## ${locale === 'he' ? 'שיעור' : 'Lesson'} ${index + 1} — ${pick(lesson.title, locale)}`,
    `*${pick(lesson.subtitle, locale)}*`,
    '',
    ...lesson.intro.map((p) => toMarkdownInline(pick(p, locale))),
  ];
  if (lesson.explorers?.length) {
    parts.push('', ...lesson.explorers.map((e) => renderExplorer(e, locale)));
  }
  parts.push(
    '',
    `**${locale === 'he' ? 'נקודות מפתח' : 'Key points'}**`,
    ...lesson.keyPoints.map((kp) => `- ${toMarkdownInline(pick(kp, locale))}`),
    '',
    `**${locale === 'he' ? 'שאלות תרגול (עם תשובות נכונות וההסברים, לבדיקה)' : 'Practice questions (with correct answers and explanations, for review)'}**`,
    ...lesson.quiz.map((q, i) => renderQuestion(q, locale, i)),
  );
  return parts.join('\n\n');
}

export function renderDocumentMarkdown(lessons, locale) {
  const title = locale === 'he' ? 'אקדמיית המתמטיקה — אינטגרלים (עותק לבדיקה)' : 'Math Academy — Integrals (review copy)';
  const note =
    locale === 'he'
      ? '_מסמך זה נוצר אוטומטית מתוכן ה-YAML של האתר, לבדיקת מומחה. כל תיקון שמוחזר ייושם בחזרה בקבצי ה-YAML (`src/content/lessons/*.yaml`), ולא ישירות במסמך הזה._'
      : '_This document is generated automatically from the site\'s YAML content, for specialist review. Any correction you send back gets applied to the YAML files (`src/content/lessons/*.yaml`), not to this document directly._';
  return [`# ${title}`, note, ...lessons.map((l, i) => renderLessonMarkdown(l, locale, i))].join('\n\n---\n\n');
}
