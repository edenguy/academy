#!/usr/bin/env node
// Exports every lesson's full bilingual text as Markdown, for a subject-matter specialist to
// read and mark up. See README.md "Content review workflow" for the round trip back into the
// YAML source files.
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { loadLessons, renderDocumentMarkdown } from './lib/lessons.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '..', 'docs', 'review');

const lessons = loadLessons();
for (const locale of ['he', 'en']) {
  const outPath = join(outDir, `chemistry-lessons.${locale}.md`);
  writeFileSync(outPath, renderDocumentMarkdown(lessons, locale), 'utf8');
  console.log(`Wrote ${outPath}`);
}
