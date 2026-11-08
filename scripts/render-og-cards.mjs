#!/usr/bin/env node
// Renders the Academy hub's WhatsApp/Open-Graph share card (og-card.html) to a 1200×1200 JPG
// per locale, using the hub-and-spoke mark (one center node, three branches) that matches
// docs/hub/favicon.svg — this page spans every subject, so it must never wear one subject's
// own icon (e.g. Math Academy's ∫). Run after any copy change.
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { chromium } from 'playwright';

const __dirname = dirname(fileURLToPath(import.meta.url));
const templatePath = join(__dirname, 'og-card.html');
const outDir = join(__dirname, '..', 'docs', 'hub', 'social');

// One center node branching to three — literally what this hub is (one place, several
// subjects) rather than a generic "AI sparkle". Matches docs/hub/favicon.svg.
const SPARK_SVG = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <g stroke="#ffffff" stroke-width="2.5" stroke-linecap="round">
    <line x1="32" y1="30" x2="32" y2="17"/>
    <line x1="32" y1="30" x2="43.3" y2="36.5"/>
    <line x1="32" y1="30" x2="20.7" y2="36.5"/>
  </g>
  <circle cx="32" cy="30" r="6.5" fill="#ffffff"/>
  <circle cx="32" cy="17" r="4" fill="#ffffff"/>
  <circle cx="43.3" cy="36.5" r="4" fill="#ffffff"/>
  <circle cx="20.7" cy="36.5" r="4" fill="#ffffff"/>
</svg>`;

const CARDS = [
  {
    file: 'preview-square.jpg',
    dir: 'rtl',
    title: 'האקדמיה',
    subtitle: 'Academy',
    tagline: 'התחיל מצולל אחד שלמד נייטרוקס בעשר בלילה בשדה תעופה, כי לא רצה לשנן בלי להבין. היום זה אוסף שיעורים בנושאים שונים, באותה שיטה. כרגע בפיילוט חינמי.',
  },
  {
    file: 'preview-square-en.jpg',
    dir: 'ltr',
    title: 'Academy',
    subtitle: 'האקדמיה',
    tagline: "Started with one diver learning Nitrox at 10pm in an airport, because memorizing without understanding wasn't enough. Now it's lessons across subjects, same method. Currently a free pilot.",
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
