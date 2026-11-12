#!/usr/bin/env node
// Same content as export-lessons.mjs, rendered to a printable PDF. Requires Playwright's
// Chromium (already present in Claude's cloud sessions; locally run
// `npx playwright install chromium` once).
import { writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { marked } from 'marked';
import { chromium } from 'playwright';
import { loadLessons, renderDocumentMarkdown } from './lib/lessons.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '..', 'docs', 'review');

function page(locale, bodyHtml) {
  const dir = locale === 'he' ? 'rtl' : 'ltr';
  return `<!doctype html>
<html lang="${locale}" dir="${dir}">
<head>
<meta charset="utf-8">
<style>
  body { font-family: "Segoe UI", Arial, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 760px; margin: 40px auto; padding: 0 24px; }
  h1 { font-size: 26px; } h2 { font-size: 20px; margin-top: 2em; border-bottom: 2px solid #ddd; padding-bottom: 6px; }
  code { background: #f1eef9; padding: 0.1em 0.4em; border-radius: 4px; font-family: "JetBrains Mono", monospace; direction: ltr; unicode-bidi: isolate; display: inline-block; }
  blockquote { background: #f6f3fc; border-inline-start: 4px solid #6250d6; margin: 1em 0; padding: 0.6em 1em; border-radius: 6px; }
  hr { border: none; border-top: 1px solid #ddd; margin: 2.5em 0; }
  ul, ol { padding-inline-start: 1.4em; }
  em { color: #555; }
</style>
</head>
<body>${bodyHtml}</body>
</html>`;
}

const lessons = loadLessons();
// This project pins its own `playwright` version (for portability outside Claude's cloud
// sessions), which can mismatch the browser build cached at /opt/pw-browsers in that
// environment — so point at the cached Chromium binary explicitly when it's present.
const cachedChromium = '/opt/pw-browsers/chromium';
const browser = await chromium.launch(existsSync(cachedChromium) ? { executablePath: cachedChromium } : {});
try {
  for (const locale of ['he', 'en']) {
    const md = renderDocumentMarkdown(lessons, locale);
    const html = page(locale, await marked.parse(md));
    const browserPage = await browser.newPage();
    await browserPage.setContent(html, { waitUntil: 'load' });
    const outPath = join(outDir, `chemistry-lessons.${locale}.pdf`);
    await browserPage.pdf({ path: outPath, format: 'A4', printBackground: true, margin: { top: '20mm', bottom: '20mm' } });
    await browserPage.close();
    console.log(`Wrote ${outPath}`);
  }
} finally {
  await browser.close();
}

// Keep the Markdown copies in sync too, since the PDF content comes from the same source.
for (const locale of ['he', 'en']) {
  writeFileSync(join(outDir, `chemistry-lessons.${locale}.md`), renderDocumentMarkdown(lessons, locale), 'utf8');
}
