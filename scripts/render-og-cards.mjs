#!/usr/bin/env node
// Renders the Academy hub's WhatsApp/Open-Graph share card (og-card.html) to a 1200×1200 JPG
// per locale, using a subject-neutral "spark" mark — this page spans every subject, so it
// must never wear one subject's icon (e.g. Math Academy's ∫). Run after any copy change.
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { chromium } from 'playwright';

const __dirname = dirname(fileURLToPath(import.meta.url));
const templatePath = join(__dirname, 'og-card.html');
const outDir = join(__dirname, '..', 'docs', 'hub', 'social');

// A simple four-point "spark" — discovery/insight, deliberately not tied to any one subject.
const SPARK_SVG = `<svg viewBox="0 0 100 100" fill="#ffffff" xmlns="http://www.w3.org/2000/svg">
  <path d="M50 4 C53 30 70 47 96 50 C70 53 53 70 50 96 C47 70 30 53 4 50 C30 47 47 30 50 4 Z"/>
</svg>`;

const CARDS = [
  {
    file: 'preview-square.jpg',
    dir: 'rtl',
    title: 'האקדמיה',
    subtitle: 'Academy',
    tagline: 'כלי לימוד חינמי ועצמאי: להבין דרך סימולציה וסקרנות, לא לשנן. נושא אחד בכל פעם, בעברית ובאנגלית.',
  },
  {
    file: 'preview-square-en.jpg',
    dir: 'ltr',
    title: 'Academy',
    subtitle: 'האקדמיה',
    tagline: 'A free, independent study tool: understand through simulation and curiosity, not memorization. One subject at a time, in Hebrew and English.',
  },
];

const cachedChromium = '/opt/pw-browsers/chromium';
const browser = await chromium.launch(existsSync(cachedChromium) ? { executablePath: cachedChromium } : {});
const page = await browser.newPage({ viewport: { width: 1200, height: 1200 }, deviceScaleFactor: 1 });
await page.goto(`file://${templatePath}`);
await page.evaluate((svg) => {
  document.getElementById('badge').innerHTML = svg;
}, SPARK_SVG);

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
