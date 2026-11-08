#!/usr/bin/env node
// Renders the Academy hub's WhatsApp/Open-Graph share card (og-card.html) to a 1200×1200 JPG
// per locale, using "the Handle" mark (a handle on a spectrum curve) that matches
// docs/hub/logo.svg — this page spans every subject, so it must never wear one subject's own
// icon (e.g. Math Academy's ∫). Run after any copy change.
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { chromium } from 'playwright';

const __dirname = dirname(fileURLToPath(import.meta.url));
const templatePath = join(__dirname, 'og-card.html');
const outDir = join(__dirname, '..', 'docs', 'hub', 'social');

// A handle on a spectrum curve — the one gesture every lesson shares (grab it, move it) —
// rather than a generic "AI sparkle" or a network glyph. Matches docs/hub/logo.svg.
const SPARK_SVG = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="spectrum" gradientUnits="userSpaceOnUse" x1="11" y1="46" x2="53" y2="18">
      <stop offset="0"    stop-color="#2fd4c6"/>
      <stop offset="0.38" stop-color="#7c5cff"/>
      <stop offset="0.70" stop-color="#ff7ec4"/>
      <stop offset="1"    stop-color="#ffb547"/>
    </linearGradient>
    <radialGradient id="halo">
      <stop offset="0"   stop-color="#ffffff" stop-opacity="0.38"/>
      <stop offset="1"   stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <line x1="32" y1="11" x2="32" y2="53" stroke="#ffffff" stroke-opacity="0.32"
        stroke-width="1.5" stroke-linecap="round"/>
  <path d="M11 46 C 28 46, 36 18, 53 18" fill="none" stroke="url(#spectrum)"
        stroke-width="5" stroke-linecap="round"/>
  <circle cx="32" cy="32" r="10" fill="url(#halo)"/>
  <circle cx="32" cy="32" r="6"  fill="#ffffff"/>
</svg>`;

const CARDS = [
  {
    file: 'preview-square.jpg',
    dir: 'rtl',
    title: 'לא משננים. תופסים.',
    subtitle: 'האקדמיה · Academy',
    tagline: 'התחיל מקורס נייטרוקס בעשר בלילה בשדה תעופה; היום שיעורים בכמה נושאים, ובכל אחד סימולציה שמזיזים ביד. חינם בזמן הפיילוט.',
  },
  {
    file: 'preview-square-en.jpg',
    dir: 'ltr',
    title: "Don't memorize it. Grab it.",
    subtitle: 'Academy · האקדמיה',
    tagline: 'Started with a Nitrox course at 10pm in an airport; now lessons in several subjects, each with a simulation you move by hand. Free during the pilot.',
  },
];

const cachedChromium = '/opt/pw-browsers/chromium';
const browser = await chromium.launch(existsSync(cachedChromium) ? { executablePath: cachedChromium } : {});
const page = await browser.newPage({ viewport: { width: 1200, height: 1200 }, deviceScaleFactor: 1 });
await page.goto(`file://${templatePath}`);
await page.evaluate(() => document.fonts.ready);
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
