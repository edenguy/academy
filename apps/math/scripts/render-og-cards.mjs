#!/usr/bin/env node
// Renders the WhatsApp/Open-Graph share card (scripts/og-card.html) to a 1200×1200 JPG per
// locale, using the same ∫ logo mark as the in-app header. Run after any copy change to the
// card. Only the Hebrew file is wired into index.html's og:image (a static page can only
// carry one set of meta tags); the English file is kept as a ready asset.
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { chromium } from 'playwright';

const __dirname = dirname(fileURLToPath(import.meta.url));
const templatePath = join(__dirname, 'og-card.html');
const outDir = join(__dirname, '..', 'public', 'social');

const CARDS = [
  {
    file: 'preview-square.jpg',
    dir: 'rtl',
    title: 'אקדמיית המתמטיקה',
    subtitle: 'Math Academy',
    tagline: 'אינטגרלים: מתחילים במלבנים, מגיעים לקיצור דרך. שיעורים משחקיים עם סימולציה חיה.',
  },
  {
    file: 'preview-square-en.jpg',
    dir: 'ltr',
    title: 'Math Academy',
    subtitle: 'אקדמיית המתמטיקה',
    tagline: 'Integrals: start with rectangles, arrive at a shortcut. Playful lessons with a live simulation.',
  },
];

const cachedChromium = '/opt/pw-browsers/chromium';
const browser = await chromium.launch(existsSync(cachedChromium) ? { executablePath: cachedChromium } : {});
const page = await browser.newPage({ viewport: { width: 1200, height: 1200 }, deviceScaleFactor: 1 });
await page.goto(`file://${templatePath}`);

for (const card of CARDS) {
  await page.evaluate((c) => {
    document.getElementById('card').setAttribute('dir', c.dir);
    document.getElementById('title').textContent = c.title;
    document.getElementById('subtitle').textContent = c.subtitle;
    document.getElementById('tagline').textContent = c.tagline;
  }, card);
  const outPath = join(outDir, card.file);
  await page.screenshot({ path: outPath, type: 'jpeg', quality: 92 });
  console.log(`Wrote ${outPath}`);
}

await browser.close();
